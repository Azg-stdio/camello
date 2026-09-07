-- 001 · Esquema inicial (tarea 05)
CREATE TABLE IF NOT EXISTS vacantes (
  id TEXT PRIMARY KEY,
  fuente TEXT NOT NULL,
  empresa TEXT NOT NULL,
  titulo TEXT NOT NULL,
  ubicacion TEXT,
  remoto INTEGER,
  descripcion_texto TEXT NOT NULL DEFAULT '',
  url TEXT,
  pago_declarado TEXT,
  publicada TEXT,
  hash TEXT NOT NULL,
  primera_vez TEXT NOT NULL,
  ultima_vez TEXT NOT NULL,
  desaparecida_en TEXT,
  juicio_obsoleto INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_vacantes_fuente ON vacantes(fuente);
CREATE INDEX IF NOT EXISTS idx_vacantes_empresa ON vacantes(empresa);
CREATE INDEX IF NOT EXISTS idx_vacantes_primera_vez ON vacantes(primera_vez);

CREATE TABLE IF NOT EXISTS juicios (
  vacante_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  json TEXT NOT NULL,
  veredicto TEXT NOT NULL,
  elegibilidad TEXT NOT NULL,
  puntaje INTEGER NOT NULL,
  juzgado_en TEXT NOT NULL,
  juzgado_por TEXT NOT NULL,
  PRIMARY KEY (vacante_id, juzgado_en)
);

CREATE TABLE IF NOT EXISTS aplicaciones (
  vacante_id TEXT PRIMARY KEY,
  estado TEXT NOT NULL,
  notas TEXT,
  cv_adaptada TEXT,
  actualizada_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS corridas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inicio TEXT NOT NULL,
  fin TEXT,
  fuentes_ok INTEGER NOT NULL DEFAULT 0,
  fuentes_total INTEGER NOT NULL DEFAULT 0,
  nuevas INTEGER NOT NULL DEFAULT 0,
  cambiadas INTEGER NOT NULL DEFAULT 0,
  desaparecidas INTEGER NOT NULL DEFAULT 0
);
