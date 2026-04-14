export default function MainLayout({ children }) {
  return (
    <div style={styles.outer}>
      <div style={styles.app}>
        <main style={styles.content}>{children}</main>
      </div>
    </div>
  );
}

const styles = {
  /* Fondo exterior (desktop) */
  outer: {
    minHeight: "100dvh",
    width: "100%",
    background: "#E5E7EB",
    display: "flex",
    justifyContent: "center",
  },

  /* Contenedor tipo APP */
  app: {
    width: "100%",
    maxWidth: 480,              // 🔥 ancho móvil real
    minHeight: "100dvh",
    background: "#F3F4F6",
    position: "relative",
    overflowX: "hidden",        // 🔥 elimina scroll lateral
    display: "flex",
    flexDirection: "column",
  },

  content: {
    flex: 1,
    paddingBottom: 90,          // 🔥 espacio para BottomNav
  },
};
