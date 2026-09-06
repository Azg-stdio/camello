# 05 · Almacenamiento SQLite y detección de cambios

## Objetivo

Guardar vacantes, juicios y estado de aplicación en un solo archivo `data/camello.db`, y distinguir **nueva**, **cambiada** y **desaparecida** entre corridas.

## Tecnología

`node:sqlite` (incluido en Node 22, sin dependencias). Un módulo `src/db.ts` que abre la base, aplica migraciones numeradas y expone funciones tipadas. Sin ORM.

## Tablas

```sql
vacantes (
  id TEXT PRIMARY KEY,           -- "greenhouse:lullabot:1234567"
  fuente TEXT, empresa TEXT, titulo TEXT, ubicacion TEXT, remoto INTEGER,
  descripcion_texto TEXT, url TEXT, pago_declarado TEXT,
  publicada TEXT, hash TEXT,      -- sha256 de titulo+descripcion
  primera_vez TEXT, ultima_vez TEXT, desaparecida_en TEXT
);

juicios (
  vacante_id TEXT, version INTEGER, json TEXT,   -- el JSON de la tarea 00 completo
  veredicto TEXT, elegibilidad TEXT, puntaje INTEGER,
  juzgado_en TEXT, juzgado_por TEXT,
  PRIMARY KEY (vacante_id, juzgado_en)
);

aplicaciones (
  vacante_id TEXT PRIMARY KEY, estado TEXT, notas TEXT,
  cv_adaptada TEXT, actualizada_en TEXT
);

corridas (
  id INTEGER PRIMARY KEY, inicio TEXT, fin TEXT,
  fuentes_ok INTEGER, fuentes_total INTEGER,
  nuevas INTEGER, cambiadas INTEGER, desaparecidas INTEGER
);
```

## Reglas de cambio

- **Nueva:** id no existía. Se fija `primera_vez`.
- **Cambiada:** id existía y `hash` difiere. Se actualiza texto y hash; el juicio anterior se marca obsoleto (no se borra) y la vacante vuelve a la cola de juicio.
- **Sin cambio:** solo se actualiza `ultima_vez`.
- **Desaparecida:** id existía, no vino en la corrida de su fuente y la fuente respondió bien. Se fija `desaparecida_en`. Nunca se borra: el historial de aplicaciones apunta ahí.
- Una fuente que falló no marca nada como desaparecido.

## Entregables

- `src/db.ts` con migraciones en `src/migraciones/001.sql`, ...
- Funciones: `upsertVacantes(lista, fuente)`, `pendientesDeJuicio(limite)`, `guardarJuicio(juicio)`, `setEstado(id, estado)`, `resumen()`.
- Pruebas con base en memoria (`:memory:`).

## Criterio de hecho

Dos corridas seguidas sobre el mismo fixture producen 0 nuevas; cambiar una descripción en el fixture produce 1 cambiada; quitarla produce 1 desaparecida.

## Dependencias

Tarea 00 (para la forma del juicio guardado).
