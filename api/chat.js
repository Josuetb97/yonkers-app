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
      // Split into words so "transmisiones Honda Civic 2015" finds "transmision" in title + "2015" in years
      const stopwords = new Set(["para","del","los","las","con","que","una","uno","los","las","por","sin"]);
      const words = input.query.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopwords.has(w));
      if (words.length > 0) {
        const conditions = words.flatMap(w => [
          `title.ilike.%${w}%`,
          `brand.ilike.%${w}%`,
          `years.ilike.%${w}%`,
          `yonker.ilike.%${w}%`,
          `city.ilike.%${w}%`,
        ]);
        q = q.or(conditions.join(","));
      }
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
    const systemPrompt = `Eres Yonky, el asistente de Yonkers App — el marketplace de piezas de autos usadas en Honduras.

FORMATO DE RESPUESTA — MUY IMPORTANTE:
- Responde SIEMPRE en texto plano, sin markdown, sin asteriscos, sin guiones como listas, sin URLs, sin imágenes
- Nunca uses **negrita**, _cursiva_, # títulos, listas con -, ni links
- Las piezas encontradas se muestran automáticamente como tarjetas visuales en la app — NO las describas en texto
- Cuando encuentres piezas solo di algo breve como: "Encontré X resultados para ti:" o "Aquí tienes lo que hay disponible:"
- Si no encuentras piezas, sugiere términos alternativos en una sola oración corta
- Máximo 2-3 oraciones por respuesta

Tu misión:
- Ayudar a encontrar piezas en el inventario real de Honduras
- Identificar qué pieza necesita el usuario según síntomas del vehículo
- Ser amigable y usar términos del mercado hondureño

Reglas:
- SIEMPRE usa buscar_piezas antes de responder cuando pidan una pieza
- Habla en español, tono casual y directo
- Si el usuario describe una falla mecánica, identifica la pieza y búscala`;

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
