import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, MessageSquare } from "lucide-react";

const API     = import.meta.env.VITE_API_URL || "/api";
const BACKEND = import.meta.env.VITE_BACKEND_URL || "";

/* ── Sugerencias iniciales ── */
const SUGGESTIONS = [
  "¿Tienes transmisiones para Honda Civic 2015?",
  "Busco un motor Toyota Corolla en San Pedro Sula",
  "Mi carro hace ruido al frenar, ¿qué necesito?",
  "Piezas de suspensión para camioneta Ford",
];

/* ── Burbuja de pieza encontrada ── */
function PieceChip({ piece }) {
  const imgSrc = piece.images?.length
    ? `${BACKEND}${piece.images[0]}`
    : null;

  const priceText = piece.price
    ? `L ${Number(piece.price).toLocaleString("es-HN")}`
    : null;

  function openWhatsApp() {
    if (!piece.whatsapp) return;
    const phone = piece.whatsapp.replace(/\D/g, "");
    const msg = `Hola 👋 vi tu pieza en Yonkers:\n\n*${piece.title}*\n${piece.brand} ${piece.years}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <div style={cs.pieceChip}>
      {imgSrc ? (
        <img src={imgSrc} alt={piece.title} style={cs.pieceImg} />
      ) : (
        <div style={cs.pieceNoImg}>📦</div>
      )}
      <div style={cs.pieceInfo}>
        <div style={cs.pieceTitle}>{piece.title}</div>
        <div style={cs.pieceSub}>{piece.brand} · {piece.years}</div>
        <div style={cs.pieceMeta}>
          <span style={cs.pieceYonker}>📍 {piece.yonker}</span>
          {priceText && <span style={cs.piecePrice}>{priceText}</span>}
        </div>
        {piece.condition && (
          <span style={{
            ...cs.pieceBadge,
            background: /buen|nuevo/i.test(piece.condition) ? "#dcfce7" : "#f3f4f6",
            color:      /buen|nuevo/i.test(piece.condition) ? "#166534" : "#374151",
          }}>
            {piece.condition}
          </span>
        )}
      </div>
      {piece.whatsapp && (
        <button style={cs.waBtn} onClick={openWhatsApp}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </button>
      )}
    </div>
  );
}

/* ── Indicador de escritura ── */
function TypingIndicator() {
  return (
    <div style={{ ...s.msgRow, justifyContent: "flex-start" }}>
      <div style={s.botAvatar}>
        <Bot size={14} color="#fff" />
      </div>
      <div style={{ ...s.bubble, ...s.bubbleBot, padding: "12px 16px" }}>
        <div style={s.typingDots}>
          <span style={{ ...s.dot, animationDelay: "0ms"   }} />
          <span style={{ ...s.dot, animationDelay: "180ms" }} />
          <span style={{ ...s.dot, animationDelay: "360ms" }} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════
   PÁGINA PRINCIPAL
════════════════════════════════════ */
export default function Messages() {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  /* Scroll al último mensaje */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* Enviar mensaje */
  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput("");

    const userMsg = { role: "user", content: userText, id: Date.now() };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Error del servidor");

      const botMsg = {
        role:   "assistant",
        content: data.text,
        pieces:  data.pieces || [],
        id:     Date.now() + 1,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role:    "assistant",
          content: "⚠️ Hubo un error conectando con el servidor. ¿Puedes intentarlo de nuevo?",
          pieces:  [],
          id:      Date.now() + 1,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, messages, loading]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div style={s.page}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerAvatar}>
          <Bot size={20} color="#1e4b8f" />
        </div>
        <div>
          <div style={s.headerName}>Yonky IA</div>
          <div style={s.headerSub}>Asistente de piezas · siempre activo</div>
        </div>
        <div style={s.headerBadge}>IA</div>
      </div>

      {/* ── Mensajes ── */}
      <div style={s.feed}>

        {/* Pantalla de bienvenida */}
        {isEmpty && (
          <div style={s.welcome}>
            <div style={s.welcomeIcon}>
              <MessageSquare size={36} color="#facc15" />
            </div>
            <div style={s.welcomeTitle}>Hola, soy Yonky 👋</div>
            <div style={s.welcomeText}>
              Puedo buscar piezas en el inventario, identificar qué necesita tu vehículo y conectarte directo con el vendedor.
            </div>
            <div style={s.suggestions}>
              {SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  style={s.suggBtn}
                  onClick={() => sendMessage(sug)}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Historial de mensajes */}
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} style={{ marginBottom: 16 }}>
              <div style={{ ...s.msgRow, justifyContent: isUser ? "flex-end" : "flex-start" }}>
                {!isUser && (
                  <div style={s.botAvatar}>
                    <Bot size={14} color="#fff" />
                  </div>
                )}

                <div style={{
                  ...s.bubble,
                  ...(isUser ? s.bubbleUser : s.bubbleBot),
                }}>
                  <p style={s.bubbleText}>{msg.content}</p>
                </div>

                {isUser && (
                  <div style={s.userAvatar}>
                    <User size={14} color="#1e4b8f" />
                  </div>
                )}
              </div>

              {/* Piezas encontradas */}
              {!isUser && msg.pieces?.length > 0 && (
                <div style={s.piecesSection}>
                  <div style={s.piecesLabel}>
                    🔍 {msg.pieces.length} resultado{msg.pieces.length !== 1 ? "s" : ""} encontrado{msg.pieces.length !== 1 ? "s" : ""}
                  </div>
                  <div style={s.piecesList}>
                    {msg.pieces.map((piece) => (
                      <PieceChip key={piece.id} piece={piece} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Indicador de typing */}
        {loading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={s.inputBar}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu consulta..."
          style={s.textarea}
          rows={1}
          disabled={loading}
        />
        <button
          style={{
            ...s.sendBtn,
            background: input.trim() && !loading ? "#1e4b8f" : "#e5e7eb",
          }}
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          <Send size={18} color={input.trim() && !loading ? "#fff" : "#9ca3af"} />
        </button>
      </div>

      {/* Animación de los puntos */}
      <style>{`
        @keyframes yonkyBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ────────────────────────────────────
   STYLES
──────────────────────────────────── */
const s = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    background: "#f3f4f6",
    fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
  },

  /* Header */
  header: {
    background: "linear-gradient(135deg,#1e4b8f,#0f3e82)",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
    flexShrink: 0,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "#facc15",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerName: { color: "#fff", fontWeight: 700, fontSize: 15 },
  headerSub:  { color: "rgba(255,255,255,0.65)", fontSize: 12 },
  headerBadge: {
    marginLeft: "auto",
    background: "#facc15",
    color: "#1e4b8f",
    fontWeight: 800,
    fontSize: 11,
    padding: "3px 10px",
    borderRadius: 20,
  },

  /* Feed */
  feed: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 14px 8px",
    display: "flex",
    flexDirection: "column",
  },

  /* Welcome */
  welcome: {
    margin: "auto",
    textAlign: "center",
    padding: "32px 20px",
    maxWidth: 360,
  },
  welcomeIcon: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#1e4b8f,#0f3e82)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#111827",
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 1.55,
    marginBottom: 24,
  },
  suggestions: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  suggBtn: {
    padding: "10px 16px",
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: 12,
    fontSize: 13,
    color: "#1e4b8f",
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    transition: "border-color 0.15s, background 0.15s",
  },

  /* Mensajes */
  msgRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 2,
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#1e4b8f,#0f3e82)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#facc15",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    padding: "10px 14px",
    wordBreak: "break-word",
  },
  bubbleUser: {
    background: "#1e4b8f",
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    background: "#fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.5,
    color: "inherit",
    whiteSpace: "pre-wrap",
  },

  /* Typing dots */
  typingDots: {
    display: "flex",
    gap: 5,
    alignItems: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#9ca3af",
    display: "inline-block",
    animation: "yonkyBounce 1.2s infinite ease-in-out",
  },

  /* Piezas */
  piecesSection: {
    marginTop: 8,
    marginLeft: 36,
  },
  piecesLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
    marginBottom: 8,
  },
  piecesList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  /* Input */
  inputBar: {
    padding: "10px 12px calc(env(safe-area-inset-bottom,0px) + 10px)",
    background: "#fff",
    borderTop: "1px solid #f0f0f0",
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 22,
    border: "1.5px solid #e5e7eb",
    background: "#f9fafb",
    fontSize: 14,
    outline: "none",
    resize: "none",
    lineHeight: 1.4,
    maxHeight: 120,
    overflowY: "auto",
    fontFamily: "inherit",
    color: "#111827",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 0.2s",
    flexShrink: 0,
  },
};

/* Chips de pieza */
const cs = {
  pieceChip: {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 10,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  pieceImg: {
    width: 60,
    height: 60,
    objectFit: "cover",
    borderRadius: 10,
    flexShrink: 0,
    background: "#f3f4f6",
  },
  pieceNoImg: {
    width: 60,
    height: 60,
    borderRadius: 10,
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    flexShrink: 0,
  },
  pieceInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  pieceTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#111827",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  pieceSub: {
    fontSize: 11,
    color: "#6b7280",
  },
  pieceMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pieceYonker: {
    fontSize: 11,
    color: "#6b7280",
  },
  piecePrice: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1e4b8f",
  },
  pieceBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  waBtn: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "#16a34a",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
};
