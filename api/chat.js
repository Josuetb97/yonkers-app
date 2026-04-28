// Vercel Serverless Function — /api/chat
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL     || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const CHAT_TOOLS = [
  {
    type: "function",
    function: {
      name: "buscar_piezas",
      description: "Busca piezas de autos en el inventario de Yonkers. Úsala cuando el usuario pregunte por alguna pieza, refacción o parte de vehículo.",
      parameters: {
        type: "object",
        properties: {
          query:     { type: "string", description: "Texto de búsqueda (nombre de pieza, marca, modelo)" },
          city:      { type: "string", description: "Ciudad en Honduras" },
          condition: { type: "string", description: "Condición: usado, buen estado, como nuevo, nuevo" },
          min_price: { type: "number", description: "Precio mínimo en Lempiras" },
          max_price: { type: "number", description: "Precio máximo en Lempiras" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "obtener_detalle_pieza",
      description: "Obtiene detalles completos de una pieza por su ID.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "ID de la pieza" },
        },
        required: ["id"],
      },
    },
  },
];

async function runTool(name, input) {
  if (name === "buscar_piezas") {
    let q = supabase
      .from("pieces")
      .select("id, title, brand, years, yonker, city, price, condition, whatsapp, images, rating");

    if (input.query) {
      const t = input.query.toLowerCase();
      q = q.or(`title.ilike.%${t}%,brand.ilike.%${t}%,years.ilike.%${t}%,yonker.ilike.%${t}%`);
    }
    if (input.city)      q = q.ilike("city",      `%${input.city}%`);
    if (input.condition) q = q.ilike("condition",  `%${input.condition}%`);
    if (input.min_price) q = q.gte("price", input.min_price);
    if (input.max_price) q = q.lte("price", input.max_price);

    q = q.order("created_at", { ascending: false }).limit(6);
    const { data } = await q;
    return data || [];
  }

  if (name === "obtener_detalle_pieza") {
    const { data } = await supabase
      .from("pieces")
      .select("*")
      .eq("id", input.id)
      .single();
    return data || null;
  }

  return null;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "OPENAI_API_KEY no configurada." });
  }

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Se requiere un array de mensajes." });
  }

  try {
    const systemPrompt = `Eres Yonky, el asistente inteligente de Yonkers App — el marketplace líder de piezas de autos usadas en Honduras.

Tu misión:
- Ayudar a compradores a encontrar piezas específicas en el inventario real
- Identificar qué pieza necesitan según los síntomas del vehículo
- Recomendar yonkers (vendedores) confiables
- Responder preguntas sobre cómo funciona la app

Personalidad: amigable, directo, conoces mucho de mecánica automotriz y del mercado hondureño.

Reglas importantes:
- Cuando el usuario pida una pieza, SIEMPRE usa la herramienta buscar_piezas antes de responder
- Si encuentras piezas, preséntales de forma clara con precio, condición y yonker
- Si no hay resultados, sugiere términos alternativos o ciudades cercanas
- Habla siempre en español, con términos que usan en Honduras
- Sé conciso — respuestas cortas y útiles
- Si el usuario describe síntomas de falla, ayúdalo a identificar la pieza y luego búscala`;

    const gptMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    let finalText = "";
    let piecesFound = [];

    for (let round = 0; round < 5; round++) {
      const response = await openai.chat.completions.create({
        model:       "gpt-4o-mini",
        max_tokens:  1024,
        tools:       CHAT_TOOLS,
        tool_choice: "auto",
        messages:    gptMessages,
      });

      const choice = response.choices[0];

      if (choice.finish_reason === "stop") {
        finalText = choice.message.content || "";
        break;
      }

      if (choice.finish_reason === "tool_calls") {
        gptMessages.push(choice.message);
        const toolResults = [];

        for (const toolCall of choice.message.tool_calls) {
          const args   = JSON.parse(toolCall.function.arguments);
          const result = await runTool(toolCall.function.name, args);

          if (toolCall.function.name === "buscar_piezas" && Array.isArray(result)) {
            piecesFound = result;
          }

          toolResults.push({
            role:         "tool",
            tool_call_id: toolCall.id,
            content:      JSON.stringify(result ?? []),
          });
        }

        gptMessages.push(...toolResults);
        continue;
      }

      break;
    }

    return res.status(200).json({ text: finalText, pieces: piecesFound });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Error al procesar el mensaje: " + err.message });
  }
}
