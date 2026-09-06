# 11 · Integración con Obsidian

## Objetivo

Que la búsqueda viva también en el vault de Obsidian del usuario: una nota por vacante preseleccionada y un resumen diario, en Markdown con frontmatter, para usar Bases, Dataview o Kanban sin plugins propios.

## Cómo

- `config.local.json` → `obsidian.vault: "C:/Users/.../MiVault"` y `obsidian.carpeta: "Camello"`.
- `camello obsidian sync` escribe:
  - `Camello/Vacantes/<empresa> - <titulo>.md` por cada vacante con estado `preseleccionada` o superior.
  - `Camello/Diario/<AAAA-MM-DD>.md` con la corrida del día: fracción de fuentes, nuevas, cambiadas, shortlist nuevo.
  - `Camello/Camello.md`: índice con una consulta Dataview de ejemplo y una vista Bases si la versión de Obsidian lo soporta.

## Frontmatter de una vacante

```yaml
---
camello_id: greenhouse:lullabot:1234567
empresa: Lullabot
titulo: Senior Drupal Developer
url: https://...
estado: preseleccionada
veredicto: aplicar
puntaje: 84
elegibilidad: abierta
pago_min_usd: 4000
pago_max_usd: 5500
contrato: contratista
fuente: greenhouse
primera_vez: 2026-09-06
actualizada: 2026-09-06
tags: [camello, drupal]
---
```

Cuerpo: resumen del juicio, evidencia citada, fortalezas y brechas, y una sección `## Notas` que **nunca se sobrescribe**.

## Reglas

- Sync es idempotente: mismo estado, mismo archivo. Solo se reescribe el frontmatter y las secciones generadas; `## Notas` se conserva.
- Si el usuario cambia `estado` en el frontmatter desde Obsidian, `camello obsidian sync --pull` lo lee y actualiza la base. Es la única dirección inversa.
- Sin plugin, sin REST API, sin tocar `.obsidian/`.
- Nombres de archivo sin caracteres inválidos en Windows.

## Entregables

- `src/obsidian/sync.ts`.
- `camello obsidian sync [--pull]`.
- `docs/ejemplos/obsidian-vacante.md`.

## Criterio de hecho

Abro Obsidian, veo la carpeta Camello con mis preseleccionadas, muevo una a `aplicada` desde una tabla Bases, corro `sync --pull` y `camello show` refleja el cambio.

## Dependencias

Tareas 05, 07, 09.
