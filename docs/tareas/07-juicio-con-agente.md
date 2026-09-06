# 07 · Juicio con agente

## Objetivo

Que el agente del usuario (Claude Code, Cursor, etc.) lea cada vacante pendiente junto con el perfil y devuelva el JSON de la tarea 00, y que `camello` lo valide y guarde. Sin llamadas a APIs de modelos desde el proyecto.

## Flujo

1. `camello pending --limit 20 --json` devuelve las vacantes sin juicio, con texto completo, más la ruta de `profile/cv.md` y `profile/preferencias.md`.
2. El agente lee el perfil una vez y luego cada vacante, y produce un JSON por vacante.
3. El agente ejecuta `camello judge <id> --from -` pasando el JSON por stdin (o `--from archivo.json`).
4. `camello` valida contra el esquema, guarda y responde con una línea: veredicto, puntaje y evidencia.
5. Al terminar el lote, `camello shortlist` muestra el resultado.

## Prompt de juicio

Vive en `skill/juicio.md` y lo referencia el SKILL.md (tarea 08). Contiene:

- Definición de cada campo del esquema con ejemplos de frases que llevan a cada valor.
- Reglas de país: para Etapa 0, "residente en Colombia". Frases que indican `cerrada`: "must be authorized to work in the US", "US citizens only", "no visa sponsorship" combinada con ubicación fija. Frases que indican `abierta`: "LATAM", "Latin America", "Americas", "Colombia", "worldwide", "anywhere", menciones de Deel, Remote.com u Oyster.
- Regla de pago: si la banda es anual y > USD 120.000 sin mencionar región, `ajustado_a: us`; si dice LATAM o la banda es mensual en USD entre 2.000 y 8.000, `latam`.
- Instrucción explícita: **no inventar**; si no está en el texto, `desconocido`.
- Instrucción de idioma: `resumen` en el idioma configurado.

## Reglas

- Presupuesto: `config.json` fija `juicio.max_por_corrida` (default 20). `camello pending` nunca devuelve más.
- Un juicio obsoleto (vacante cambiada) se re-juzga; el anterior queda en la tabla con su fecha.
- `camello judge <url>` para vacantes pegadas a mano (LinkedIn u otras): descarga el HTML, convierte a texto, guarda como fuente `manual` y sigue el mismo flujo.
- La calidad se mide a mano: cada semana reviso 10 juicios al azar y anoto aciertos en `docs/investigacion/calidad-juicio.md`.

## Entregables

- `skill/juicio.md`.
- `camello pending`, `camello judge` (en tarea 06).
- `docs/ejemplos/juicio.json` (de la tarea 00) usado como ejemplo en el prompt.

## Criterio de hecho

Con Claude Code, un lote de 20 vacantes se juzga de punta a punta en una sola instrucción ("juzga las pendientes") y el shortlist tiene al menos una vacante con evidencia correcta al verificarla yo.

## Dependencias

Tareas 00, 01, 05, 06.
