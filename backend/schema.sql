-- EXTENSION útil para búsquedas geográficas si luego usas PostGIS
-- (por ahora puedes dejarlo comentado)
-- CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS pieces (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  brand TEXT NOT NULL,
  years TEXT,
  yonker TEXT NOT NULL,
  city TEXT,
  price NUMERIC(12,2),

  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,

  -- guardaremos imágenes como JSON: ["url1","url2"]
  images JSONB NOT NULL DEFAULT '[]'::jsonb,

  status TEXT NOT NULL DEFAULT 'alta', -- alta | normal, etc.
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  contacts INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pieces_brand ON pieces (brand);
CREATE INDEX IF NOT EXISTS idx_pieces_city ON pieces (city);
CREATE INDEX IF NOT EXISTS idx_pieces_created_at ON pieces (created_at DESC);