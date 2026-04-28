/**
 * StarRating — componente interactivo de 1-5 estrellas.
 * Usado en PieceDetailModal y SellerProfile.
 */
import { useState } from "react";

export default function StarRating({ value = 0, onChange, size = 28, readonly = false }) {
  const [hovered, setHovered] = useState(0);

  const display = hovered || value;

  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            background: "none",
            border: "none",
            cursor: readonly ? "default" : "pointer",
            padding: 2,
            WebkitTapHighlightColor: "transparent",
          }}
          aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
        >
          <svg
            width={size} height={size}
            viewBox="0 0 24 24"
            fill={display >= star ? "#f59e0b" : "none"}
            stroke={display >= star ? "#f59e0b" : "#d1d5db"}
            strokeWidth="1.5"
            style={{ transition: "fill 0.1s, stroke 0.1s" }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
}
