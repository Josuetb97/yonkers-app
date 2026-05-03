import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Sparkles, ChevronRight, MapPin, Store } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "/api";

/* ── Sugerencias iniciales ── */
const SUGGESTIONS = [
  { emoji: "🔧", text: "Transmisiones para Honda Civic 2015" },
  { emoji: "⚙️", text: "Motor Toyota Corolla en SPS" },
  { emoji: "🔊", text: "Mi carro hace ruido al frenar, ¿qué necesito?" },
  { emoji: "🚗", text: "Suspensión para camioneta Ford" },
];

/* ── SVG WhatsApp icon ── */
function WaIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ── Chip de pieza ── */
function PieceChip({ piece }) {
  const imgSrc = piece.images?.length ? piece.images[0] : null;
  const priceText = piece.price
    ? `L ${Number(piece.price).toLocaleString("es-HN")}`
    : null;
  const isGood = /buen|nuevo/i.test(piece.condition || "");

  function openWhatsApp() {
    if (!piece.whatsapp) return;
    const phone = piece.whatsapp.replace(/\D/g, "");
    const msg = `Hola 👋 vi tu pieza en Yonkers App:\n\n*${piece.title}*${piece.brand ? `\nMarca: ${piece.brand}` : ""}${piece.years ? ` · Año: ${piece.years}` : ""}\n\n¿Está disponible?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function openMap() {
    if (!piece.city) return;
    window.open(`https://maps.google.com?q=${encodeURIComponent(piece.city + ", Honduras")}`, "_blank");
  }

  return (
    <div style={cs.card}>
      {/* Sección superior: imagen + datos de la pieza */}
      <div style={cs.cardTop}>
        <div style={cs.imgWrap}>
          {imgSrc ? (
            <img src={imgSrc} alt={piece.title} style={cs.img} />
          ) : (
            <div style={cs.noImg}>🔩</div>
          )}
          {piece.condition && (
            <span style={{ ...cs.condBadge, background: isGood ? "#dcfce7" : "#f1f5f9", color: isGood ? "#15803d" : "#64748b" }}>
              {piece.condition}
            </span>
          )}
        </div>
        <div style={cs.info}>
          <div style={cs.title}>{piece.title}</div>
          {(piece.brand || piece.years) && (
            <div style={cs.sub}>{[piece.brand, piece.years].filter(Boolean).join(" · ")}</div>
          )}
          {priceText && <div style={cs.price}>{priceText}</div>}
        </div>
      </div>

      {/* Separador */}
      <div style={cs.divider} />

      {/* Sección del yonker (vendedor) */}
      <div style={cs.sellerSection}>
        <div style={cs.sellerMeta}>
          {piece.yonker && (
            <div style={cs.sellerName}>
              <Store size={12} color="#1e4b8f" />
              {piece.yonker}
            </div>
          )}
          {piece.city && (
            <button style={cs.cityBtn} onClick={openMap} title="Ver ubicación en Google Maps">
              <MapPin size={11} color="#ef4444" />
              <span style={cs.cityText}>{piece.city}</span>
              <span style={cs.mapHint}>· Ver mapa</span>
            </button>
          )}
        </div>

        {piece.whatsapp && (
          <button style={cs.waFullBtn} onClick={openWhatsApp}>
            <WaIcon size={15} />
            Chatear ahora
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Indicador de escritura ── */
function TypingIndicator() {
  return (
    <div style={s.row}>
      <div style={s.avatar}>
        <Bot size={13} color="#fff" />
      </div>
      <div style={{ ...s.bubble, ...s.bubbleBot, padding: "14px 18px" }}>
        <div style={s.dots}>
          <span style={{ ...s.dot, animationDelay: "0ms" }} />
          <span style={{ ...s.dot, animationDelay: "200ms" }} />
          <span style={{ ...s.dot, animationDelay: "400ms" }} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════
   PÁGINA PRINCIPAL
════════════════════════════════════ */
export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* Auto-resize textarea */
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  /* Enviar mensaje */
  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput("");

    const userMsg = { role: "user", content: userText, id: Date.now() };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => {
            if (m.role === "assistant" && m.pieces?.length > 0) {
              const summary = m.pieces.map((p) =>
                `• ${p.title}${p.brand ? ` | Marca: ${p.brand}` : ""}${p.years ? ` | Año: ${p.years}` : ""}${p.yonker ? ` | Yonker: ${p.yonker}` : ""}${p.city ? ` | Ciudad: ${p.city}` : ""}${p.price ? ` | Precio: L${p.price}` : ""}${p.condition ? ` | Estado: ${p.condition}` : ""}${p.whatsapp ? ` | WhatsApp: ${p.whatsapp}` : ""} | ID: ${p.id}`
              ).join("\n");
              return { role: m.role, content: `${m.content}\n\n[Resultados del inventario]\n${summary}` };
            }
            return { role: m.role, content: m.content };
          }),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.text || "Lo siento, no pude generar una respuesta.",
          pieces: data.pieces || [],
          id: Date.now() + 1,
        },
      ]);
    } catch (err) {
      clearTimeout(timeout);
      const msg = err.name === "AbortError"
        ? "⏱️ La solicitud tardó demasiado. Por favor intenta de nuevo."
        : "⚠️ No pude conectarme al servidor. Verifica tu conexión e intenta de nuevo.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: msg, pieces: [], id: Date.now() + 1 },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
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

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div style={s.headerGlow} />
        <div style={s.headerInner}>
          <div style={s.headerLeft}>
            <div style={s.headerAvatar}>
              <Bot size={17} color="#1e4b8f" strokeWidth={2.2} />
            </div>
            <div>
              <div style={s.headerName}>Yonky IA</div>
              <div style={s.headerStatus}>
                <span style={s.statusDot} />
                <span style={s.statusText}>En línea · Asistente de piezas</span>
              </div>
            </div>
          </div>
          <div style={s.headerBadge}>
            <Sparkles size={11} color="#1e4b8f" />
            <span>IA</span>
          </div>
        </div>
      </div>

      {/* ── FEED ── */}
      <div style={s.feed}>

        {/* Pantalla de bienvenida */}
        {isEmpty && (
          <div style={s.welcome}>
            <div style={s.welcomeRing}>
              <div style={s.welcomeAvatar}>
                <Bot size={40} color="#fff" strokeWidth={1.8} />
              </div>
            </div>
            <div style={s.welcomeTitle}>¡Hola, soy Yonky! 👋</div>
            <div style={s.welcomeText}>
              Tu asistente inteligente para encontrar piezas de autos en Honduras. Busco en el inventario real y te conecto con el vendedor.
            </div>
            <div style={s.suggGrid}>
              {SUGGESTIONS.map((sug) => (
                <button
                  key={sug.text}
                  style={s.suggCard}
                  onClick={() => sendMessage(sug.text)}
                >
                  <span style={s.suggEmoji}>{sug.emoji}</span>
                  <span style={s.suggText}>{sug.text}</span>
                  <ChevronRight size={14} color="#9ca3af" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Historial */}
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} style={{ marginBottom: 20 }}>
              <div style={{ ...s.row, justifyContent: isUser ? "flex-end" : "flex-start" }}>

                {!isUser && (
                  <div style={s.avatar}>
                    <Bot size={13} color="#fff" />
                  </div>
                )}

                <div style={{
                  ...s.bubble,
                  ...(isUser ? s.bubbleUser : s.bubbleBot),
                }}>
                  {isUser ? (
                    <p style={{ ...s.bubbleText, color: "#fff" }}>{msg.content}</p>
                  ) : (
                    <p style={{ ...s.bubbleText, color: "#1a1a2e" }}>{msg.content}</p>
                  )}
                </div>

                {isUser && (
                  <div style={s.avatarUser}>
                    <User size={13} color="#1e4b8f" />
                  </div>
                )}
              </div>

              {/* Piezas encontradas */}
              {!isUser && msg.pieces?.length > 0 && (
                <div style={s.piecesWrap}>
                  <div style={s.piecesLabel}>
                    <span style={s.piecesCount}>{msg.pieces.length}</span>
                    resultado{msg.pieces.length !== 1 ? "s" : ""} encontrado{msg.pieces.length !== 1 ? "s" : ""}
                  </div>
                  <div style={s.piecesList}>
                    {msg.pieces.map((p) => (
                      <PieceChip key={p.id} piece={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── INPUT BAR ── */}
      <div style={s.inputWrap}>
        <div style={s.inputBox}>
          <textarea
            ref={textareaRef}
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
              background: input.trim() && !loading ? "linear-gradient(135deg,#1e4b8f,#2563eb)" : "#e5e7eb",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              transform: input.trim() && !loading ? "scale(1)" : "scale(0.95)",
            }}
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Send size={16} color={input.trim() && !loading ? "#fff" : "#9ca3af"} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes yonkyBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.4); }
          50% { box-shadow: 0 0 0 5px rgba(74,222,128,0); }
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
    height: "calc(100dvh - 60px)",   /* 60px = altura del BottomNav */
    background: "#f0f4f8",
    fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
    overflow: "hidden",
  },

  /* Header */
  header: {
    background: "linear-gradient(135deg, #0f2a5e 0%, #1e4b8f 60%, #2563eb 100%)",
    flexShrink: 0,
    position: "sticky",
    top: 0,
    zIndex: 100,
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(30,75,143,0.3)",
  },
  headerGlow: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(250,204,21,0.2) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  headerInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    position: "relative",
    zIndex: 1,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #facc15, #f59e0b)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(250,204,21,0.4)",
    flexShrink: 0,
  },
  headerName: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: "-0.2px",
  },
  headerStatus: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  statusDot: {
    display: "inline-block",
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#4ade80",
    animation: "pulse 2s infinite",
  },
  statusText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
  },
  headerBadge: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "#facc15",
    color: "#1e4b8f",
    fontWeight: 800,
    fontSize: 11,
    padding: "5px 12px",
    borderRadius: 20,
    letterSpacing: "0.5px",
  },

  /* Feed */
  feed: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 16px 12px",
    display: "flex",
    flexDirection: "column",
    scrollBehavior: "smooth",
  },

  /* Welcome */
  welcome: {
    margin: "auto",
    textAlign: "center",
    padding: "24px 16px 32px",
    maxWidth: 360,
    animation: "fadeSlideUp 0.4s ease",
  },
  welcomeRing: {
    width: 88,
    height: 88,
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(30,75,143,0.15), rgba(37,99,235,0.1))",
    border: "2px solid rgba(30,75,143,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 18px",
  },
  welcomeAvatar: {
    width: 68,
    height: 68,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1e4b8f, #2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 20px rgba(30,75,143,0.35)",
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 8,
    letterSpacing: "-0.5px",
  },
  welcomeText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.6,
    marginBottom: 24,
  },
  suggGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  suggCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 14,
    fontSize: 13,
    color: "#1e293b",
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  suggEmoji: {
    fontSize: 18,
    flexShrink: 0,
  },
  suggText: {
    flex: 1,
    textAlign: "left",
  },

  /* Mensajes */
  row: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    animation: "fadeSlideUp 0.25s ease",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1e4b8f, #2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(30,75,143,0.3)",
  },
  avatarUser: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#facc15",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(250,204,21,0.4)",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 20,
    padding: "11px 15px",
    wordBreak: "break-word",
  },
  bubbleUser: {
    background: "linear-gradient(135deg, #1e4b8f, #2563eb)",
    borderBottomRightRadius: 5,
    boxShadow: "0 3px 12px rgba(30,75,143,0.25)",
  },
  bubbleBot: {
    background: "#fff",
    borderBottomLeftRadius: 5,
    boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  bubbleText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
  },

  /* Typing dots */
  dots: {
    display: "flex",
    gap: 5,
    alignItems: "center",
    height: 16,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#94a3b8",
    display: "inline-block",
    animation: "yonkyBounce 1.4s infinite ease-in-out",
  },

  /* Piezas */
  piecesWrap: {
    marginTop: 10,
    marginLeft: 36,
    animation: "fadeSlideUp 0.3s ease",
  },
  piecesLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 500,
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  piecesCount: {
    background: "linear-gradient(135deg, #1e4b8f, #2563eb)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 11,
    width: 20,
    height: 20,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  piecesList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  /* Input */
  inputWrap: {
    padding: "10px 14px 0",
    background: "#fff",
    borderTop: "1px solid #e2e8f0",
    flexShrink: 0,
    boxShadow: "0 -4px 16px rgba(0,0,0,0.05)",
  },
  inputBox: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    background: "#f8fafc",
    border: "1.5px solid #e2e8f0",
    borderRadius: 24,
    padding: "6px 6px 6px 16px",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  textarea: {
    flex: 1,
    border: "none",
    background: "transparent",
    fontSize: 14,
    outline: "none",
    resize: "none",
    lineHeight: 1.5,
    maxHeight: 120,
    overflowY: "auto",
    fontFamily: "inherit",
    color: "#0f172a",
    padding: "4px 0",
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    flexShrink: 0,
  },
};

/* Chips de pieza */
const cs = {
  card: {
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    animation: "fadeSlideUp 0.25s ease",
  },
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "12px 14px 12px",
  },
  imgWrap: {
    flexShrink: 0,
    position: "relative",
  },
  img: {
    width: 70,
    height: 70,
    objectFit: "cover",
    borderRadius: 14,
    background: "#f1f5f9",
    display: "block",
  },
  noImg: {
    width: 70,
    height: 70,
    borderRadius: 14,
    background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
  },
  condBadge: {
    position: "absolute",
    bottom: -6,
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: 20,
    whiteSpace: "nowrap",
    border: "1.5px solid #fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  info: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    paddingTop: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.3,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  sub: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 500,
  },
  price: {
    fontSize: 15,
    fontWeight: 800,
    color: "#1e4b8f",
    letterSpacing: "-0.3px",
  },
  divider: {
    height: 1,
    background: "linear-gradient(to right, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent)",
    margin: "0 14px",
  },
  sellerSection: {
    padding: "10px 14px 12px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    justifyContent: "space-between",
  },
  sellerMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 0,
    flex: 1,
  },
  sellerName: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    fontWeight: 600,
    color: "#1e4b8f",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cityBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontSize: 11,
    color: "#64748b",
    textAlign: "left",
  },
  cityText: {
    fontWeight: 500,
    color: "#374151",
  },
  mapHint: {
    color: "#3b82f6",
    fontWeight: 500,
    textDecoration: "underline",
    textDecorationStyle: "dotted",
  },
  waFullBtn: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "9px 14px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
    boxShadow: "0 3px 10px rgba(22,163,74,0.35)",
    transition: "transform 0.15s, box-shadow 0.15s",
    whiteSpace: "nowrap",
    letterSpacing: "-0.1px",
  },
};
