export default function MainLayout({ children }) {
  return (
    <div style={styles.app}>
      {/* CONTENIDO PRINCIPAL */}
      <main style={styles.content}>{children}</main>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#F3F4F6",
    display: "flex",
    flexDirection: "column",
  },

  content: {
    flex: 1,
    /* 🔒 dejar que el scroll viva en body */
    overflow: "visible",
  },
};
