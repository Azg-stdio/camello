# 06 · CLI `camello`

## Objetivo

Un binario con comandos cortos, salida legible para humanos y salida `--json` para agentes. Todo lo que hace el proyecto es un comando; el skill (tarea 08) solo los orquesta.

## Comandos (v1)

| Comando | Qué hace |
|---------|----------|
| `camello init` | Crea `data/`, `profile/` desde plantillas, `config.local.json`. |
| `camello profile check` | Valida perfil (tarea 01). |
| `camello profile import <archivo>` | Borrador de `cv.md` desde PDF/DOCX (con el agente). |
| `camello sources check` | Verifica feeds (tarea 02). |
| `camello refresh` | Ingesta todas las fuentes, reporta nuevas/cambiadas/desaparecidas como fracción. |
| `camello search <texto> [--remoto] [--empresa X] [--desde 7d]` | Búsqueda por palabra clave sobre título y descripción. |
| `camello show <id>` | Vacante completa + último juicio. |
| `camello pending [--limit 20]` | Vacantes sin juicio o con juicio obsoleto, en JSON para el agente. |
| `camello judge <id\|url> --from <archivo.json\|->` | Guarda un juicio (validado con tarea 00). Con URL, primero descarga y guarda la vacante. |
| `camello shortlist` | Vacantes con veredicto `aplicar` o `considerar`, ordenadas por puntaje. |
| `camello status <id> <estado> [--nota "..."]` | Mueve la vacante en el pipeline (tarea 09). |
| `camello cv tailor <id>` | Adapta la hoja de vida (tarea 13). |
| `camello dashboard` | Genera y abre el dashboard (tarea 10). |
| `camello obsidian sync` | Escribe notas al vault (tarea 11). |
| `camello schedule install\|remove\|status` | Refresco programado (tarea 12). |
| `camello stats` | Resumen: vacantes, juzgadas, por veredicto, última corrida. |

Flags globales: `--json`, `--lang es|en`, `--db <ruta>`, `--quiet`.

## Reglas

- Parseo con `node:util.parseArgs`. Sin commander.
- Cada comando es un archivo en `src/cli/comandos/`. `src/cli/camello.ts` solo enruta.
- Toda cadena visible pasa por `t()` (tarea 14).
- Toda salida que mencione algo omitido, fallido o no encontrado dice primero cuánto sí llegó, como fracción sin simplificar: "38/40 feeds".
- `--json` devuelve siempre un objeto con `ok`, `datos`, `cobertura: {ok, total}` y `errores[]`.
- Código de salida 0 si la operación terminó, aunque haya feeds fallidos; 1 si no pudo ni empezar.
- Sugerir el siguiente comando al final de cada salida humana ("Siguiente: `camello pending`").

## Entregables

- `package.json` con `bin: { camello: dist/cli/camello.js }`, `scripts: { build, test }`, `engines.node >= 22`.
- `tsconfig.json` estricto, salida a `dist/`.
- `src/cli/` con los comandos de la tabla que existan a la fecha; los demás responden "no implementado aún" con el número de tarea.
- Prueba de humo: `camello --help` y `camello stats --json` sobre base vacía.

## Criterio de hecho

`npm run build && npm link` deja `camello` disponible en la terminal; `camello init && camello refresh && camello stats` funcionan de punta a punta con la lista semilla.

## Dependencias

Tareas 03 y 05.
