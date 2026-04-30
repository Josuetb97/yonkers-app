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
          query:     { type: "string", description: "Término de búsqueda normalizado en español estándar (nombre canónico de la pieza, marca, modelo, año). Usa el nombre correcto de la pieza aunque el usuario haya escrito mal." },
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
    // RPC con unaccent — búsqueda sin acentos, por palabras individuales
    const { data, error } = await supabase.rpc("search_pieces", {
      search_query: input.query     || "",
      filter_city:  input.city      || null,
      filter_cond:  input.condition || null,
      min_price:    input.min_price || null,
      max_price:    input.max_price || null,
    });
    if (error) console.error("RPC search_pieces error:", error);
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

BÚSQUEDA INTELIGENTE — MUY IMPORTANTE:
- Cuando el usuario escriba mal o use sinónimos, TÚ corriges y buscas el término correcto
- Ejemplos: "odometro" → busca "odómetro", "tramsmision" → busca "transmisión", "alternado" → busca "alternador"
- Sinónimos hondureños: "cuentakilómetros" = "odómetro", "varillero" = "motor de arranque", "tijeras" = "brazos de suspensión"
- Si no encuentras con un término, intenta con sinónimos o términos alternativos llamando buscar_piezas de nuevo
- Nunca uses el texto escrito por el usuario directamente en el query — normaliza y corrige siempre

Tu misión:
- Ayudar a encontrar piezas en el inventario real de Honduras
- Identificar qué pieza necesita el usuario según síntomas del vehículo
- Ser amigable y usar términos del mercado hondureño

Reglas:
- SIEMPRE usa buscar_piezas antes de responder cuando pidan una pieza
- Habla en español, tono casual y directo
- Si el usuario describe una falla mecánica, identifica la pieza y búscala
- Si la primera búsqueda no da resultados, intenta con un término alternativo antes de decir que no hay`;

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
