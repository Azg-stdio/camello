-- 003 · Fuente HN: registro de hilos leídos (tarea 04)
CREATE TABLE IF NOT EXISTS hn_hilos (
  hilo_id INTEGER PRIMARY KEY,
  mes TEXT NOT NULL,
  leido_en TEXT NOT NULL,
  comentarios INTEGER NOT NULL DEFAULT 0,
  conservados INTEGER NOT NULL DEFAULT 0
);
