# 08 · Skill para agentes de código

## Objetivo

Un `SKILL.md` que cualquier agente (Claude Code, Cursor, Copilot) lea para operar `camello` completo: refrescar, juzgar, adaptar la hoja de vida, generar el dashboard, sincronizar con Obsidian y configurar el refresco. El skill orquesta; no reimplementa nada.

## Ubicación

```
skill/
  SKILL.md        en español, con frontmatter name/description
  juicio.md       prompt de juicio (tarea 07)
  cv.md           reglas de adaptación de hoja de vida (tarea 13)
  en/SKILL.md     traducción (tarea 14)
```

`camello skill` imprime la ruta e instrucciones para copiarlo a `.claude/skills/camello/` o el equivalente del agente. `camello` nunca escribe fuera del repo y del vault configurado.

## Contenido del SKILL.md

1. **Qué es camello** en tres líneas y el principio de cobertura como fracción.
2. **Mapa de intenciones → comandos.** "Busca trabajo nuevo" → `refresh` + `pending` + juzgar + `shortlist`. "Qué hay de nuevo" → `shortlist --desde 7d`. "Prepara mi hoja de vida para X" → `cv tailor`. "Muéstrame el tablero" → `dashboard`. "Actualiza Obsidian" → `obsidian sync`. "Refresca cada 6 horas" → `schedule install --every 6h`.
3. **Cómo juzgar:** referencia a `juicio.md`, presupuesto, formato de entrega por stdin.
4. **Cómo adaptar la hoja de vida:** referencia a `cv.md`, regla de nunca inventar, mostrar diff antes de guardar.
5. **Cómo reportar:** siempre la fracción primero; no inflar; si un comando falla, mostrar la salida exacta.
6. **Qué no hace:** no aplica a vacantes, no envía correos, no toca LinkedIn, no sube el perfil a ningún lado.
7. **Idioma:** hablar al usuario en el idioma de `config.local.json`.

## Reglas

- Cada intención del mapa se prueba con Claude Code antes de darla por lista.
- El skill se versiona junto al CLI; `camello --version` y el frontmatter del skill llevan el mismo número.
- Máximo 200 líneas. Si crece, lo que sobra va a `juicio.md` o `cv.md`.

## Entregables

- `skill/SKILL.md`, `skill/juicio.md`, `skill/cv.md`.
- `camello skill`.

## Criterio de hecho

Con el skill instalado, en una sesión limpia de Claude Code digo "busca trabajo nuevo y prepárame la hoja de vida para el mejor" y el agente completa el flujo sin instrucciones adicionales.

## Dependencias

Tareas 06, 07, 13. Las intenciones de dashboard, Obsidian y schedule se agregan cuando existan las tareas 10, 11 y 12.
