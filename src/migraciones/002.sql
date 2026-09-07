-- 002 · Pipeline de aplicaciones (tarea 09): historial de cambios de estado
CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vacante_id TEXT NOT NULL,
  de TEXT,
  a TEXT NOT NULL,
  fecha TEXT NOT NULL,
  nota TEXT
);
CREATE INDEX IF NOT EXISTS idx_eventos_vacante ON eventos(vacante_id);
