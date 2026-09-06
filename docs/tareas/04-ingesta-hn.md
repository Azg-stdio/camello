# 04 · Ingesta: Hacker News "Who is hiring"

## Objetivo

Leer el hilo mensual "Ask HN: Who is hiring?" y extraer los comentarios de primer nivel que mencionen remoto y LATAM, como vacantes con el mismo formato común de la tarea 03.

## Fuente

- API pública de Hacker News (Firebase): `https://hacker-news.firebaseio.com/v0/item/{id}.json`.
- El hilo del mes se encuentra buscando en `https://hn.algolia.com/api/v1/search?query="Who is hiring"&tags=story,author_whoishiring`. Tomar el más reciente.
- Cada comentario de primer nivel es una vacante. El texto viene en HTML.

## Reglas

- Solo comentarios de primer nivel (`parent` = id del hilo).
- Filtro previo: conservar si el texto contiene `remote` y alguna de: `latam`, `latin america`, `americas`, `colombia`, `south america`, `worldwide`, `anywhere`, `utc-5`, `est`, `cst`, `pst`. Lista en `config.json`.
- `id` = `hn:{año}-{mes}:{comment_id}`. Empresa = primer segmento antes del primer `|` en la convención de HN, si existe.
- Una corrida por día basta. `camello refresh` la incluye pero la salta si ya se leyó el hilo del mes hoy.
- Volumen: 300 a 600 comentarios por hilo. Peticiones con concurrencia 5.

## Entregables

- `src/ingesta/hn.ts`.
- Prueba con un hilo grabado y recortado en `test/fixtures/hn.json`.

## Criterio de hecho

`camello refresh` trae el hilo del mes actual, filtra y guarda; `camello stats` muestra cuántas vacantes vinieron de HN.

## Dependencias

Tareas 03 (formato común) y 05.
