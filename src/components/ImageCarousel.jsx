import { useState } from "react";

export default function ImageCarousel({ images = [] }) {
  const imgs = images.length ? images : [];

  const [index, setIndex] = useState(0);

  if (!imgs.length) {
    return (
      <div style={styles.empty}>
        📷 Sin imágenes
      </div>
    );
  }

  function prev(e) {
    e.stopPropagation();
    setIndex((i) => (i === 0 ? imgs.length - 1 : i - 1));
  }

  function next(e) {
    e.stopPropagation();
    setIndex((i) => (i === imgs.length - 1 ? 0 : i + 1));
  }

  return (
    <div style={styles.wrap}>
      <img
        src={imgs[index]}
        alt=""
        style={styles.img}
        loading="lazy"
      />

      {imgs.length > 1 && (
        <>
          <button style={{ ...styles.nav, left: 8 }} onClick={prev}>
            ‹
          </button>
          <button style={{ ...styles.nav, right: 8 }} onClick={next}>
            ›
          </button>

          <div style={styles.dots}>
            {imgs.map((_, i) => (
              <span
                key={i}
                style={{
                  ...styles.dot,
                  opacity: i === index ? 1 : 0.4,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    position: "relative",
    height: 220,
    background: "#e5e7eb",
    overflow: "hidden",
  },

  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  nav: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(0,0,0,.45)",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    width: 34,
    height: 34,
    fontSize: 20,
    cursor: "pointer",
  },

  dots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    gap: 6,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#fff",
  },

  empty: {
    height: 220,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#e5e7eb",
    color: "#64748b",
    fontWeight: 700,
  },
};
