---
name: camello
description: Opera la CLI `camello` para buscar empleo remoto desde Colombia y LATAM. Úsalo cuando el usuario pida buscar trabajo, refrescar vacantes, juzgar pendientes, ver el shortlist, adaptar su hoja de vida, mover una aplicación de estado, abrir el dashboard, sincronizar Obsidian o programar el refresco.
version: 0.1.0
---

# camello

`camello` es una herramienta de búsqueda de empleo **local-first** para desarrolladores en Colombia (luego LATAM). Ingiere vacantes de feeds públicos (Greenhouse, Lever, Ashby, Hacker News "Who is hiring"), las guarda en SQLite en la máquina del usuario y deja que **tú**, su agente, juzgues cada una por elegibilidad, pago real y tipo de contrato contra un perfil que nunca sale de su disco. También adapta la hoja de vida a cada vacante sin inventar nada.

**Principio de cobertura:** todo resultado que omita, falle o no encuentre algo dice primero cuánto sí llegó, como fracción sin simplificar. "38/40 feeds respondieron", "412/2.300 vacantes abiertas para ti". Nunca redondees ni digas "casi todas".

Este skill orquesta comandos; no reimplementa nada. Si un comando no existe o falla, muestra su salida exacta.

## Comandos

Todos aceptan los flags globales `--json`, `--lang es|en`, `--db <ruta>`, `--quiet`. Con `--json` la salida es siempre `{ "ok", "datos", "cobertura": { "ok", "total" }, "errores": [] }` con claves fijas en español. Código de salida 0 si la operación terminó (aunque haya feeds fallidos), 1 si no pudo ni empezar.

| Comando | Qué hace |
|---------|----------|
| `camello init` | Asistente paso a paso (idioma, expectativa salarial, contrato, roles, ruta a la hoja de vida, vault). Escribe `profile/preferencias.md`, `profile/cv.md` desde plantilla y `config.local.json`. `--yes` salta las preguntas. |
| `camello profile init\|check\|import <archivo>` | Plantillas, validación del perfil, o instrucciones para importar un PDF/DOCX. |
| `camello sources list\|check` | Lista la semilla de empresas o verifica que cada feed responda. |
| `camello refresh [--solo ats\|hn] [--empresa X]` | Ingesta todas las fuentes. Reporta nuevas/cambiadas/desaparecidas. |
| `camello search <texto> [--remoto] [--empresa X] [--desde 7d]` | Búsqueda por palabra clave en título, descripción y empresa. |
| `camello show <id> [--completa]` | Vacante, último juicio, estado e historial. |
| `camello pending [--limit N]` | Vacantes sin juicio o con juicio obsoleto, listas para juzgar. |
| `camello judge <id\|url> --from <archivo.json\|->` | Valida y guarda un juicio. Con URL, primero descarga y guarda la vacante. |
| `camello shortlist [--desde 7d] [--todas]` | Veredictos `aplicar` y `considerar` por puntaje, más aplicaciones sin novedad. |
| `camello status <id> <estado> [--nota "..."] [--cv <archivo>]` | Mueve una vacante en el pipeline. `--list [estado]` lista. |
| `camello cv tailor\|render\|diff` | Datos para adaptar, HTML imprimible, revisión de la adaptada. |
| `camello dashboard [--no-open]` | Genera `data/dashboard.html` y lo abre. |
| `camello obsidian sync [--pull]` | Escribe notas al vault; `--pull` lee cambios de estado hechos en Obsidian. |
| `camello schedule install --every 6h\|remove\|status` | Refresco programado (solo ingesta, sin LLM). |
| `camello stats` | Resumen de vacantes, juicios, pipeline y última corrida. |
| `camello next` | Qué sigue en toda la búsqueda: por juzgar, CV por adaptar o renderizar, formularios por llenar, aplicaciones sin respuesta hace más de 7 días, entrevistas en curso. Cada línea con su comando. |
| `camello skill` | Ruta de este skill e instrucciones de instalación. |

Estados del pipeline: `vista → preseleccionada → aplicada → entrevista → oferta`, con salidas `descartada` y `rechazada`.

## Mapa de intenciones

| El usuario dice | Ejecuta |
|-----------------|---------|
| "Busca trabajo nuevo", "qué hay hoy" | `camello refresh` → `camello pending --json` → juzgar (ver abajo) → `camello shortlist` |
| "Qué hay de nuevo esta semana" | `camello shortlist --desde 7d` |
| "Juzga las pendientes" | `camello pending --json` → juzgar → `camello shortlist` |
| "Mira esta vacante: <url>" | `camello judge <url>` → `camello show <id> --completa` → juzgar → `camello judge <id> --from -` |
| "Muéstrame la vacante X" | `camello show <id>` |
| "Prepara mi hoja de vida para X" | `camello cv tailor <id> --json` → adaptar (ver abajo) → `camello cv diff` → confirmar → `camello cv render` |
| "Prepárame para la llamada / entrevista de X" | `camello apply <id> --json` → escribir `<empresa>-entrevista.md` en la carpeta de la vacante siguiendo `entrevista.md` |
| "Aplica a X" | Flujo completo de abajo: adaptar → confirmar → render → `camello apply <id> --json` → llenar el formulario siguiendo `aplicar.md` → parar antes de enviar → reporte |
| "Aplica a las del shortlist" | Mismo flujo en lote: adaptar todas → una confirmación con tabla → render todas → formularios de a uno, con "ya" del usuario entre cada uno |
| "Ya apliqué a X" | `camello status <id> aplicada --cv <archivo.pdf>` |
| "Me llamaron a entrevista / me rechazaron / descarta esa" | `camello status <id> entrevista\|rechazada\|descartada --nota "..."` |
| "Muéstrame el tablero" | `camello dashboard` |
| "Actualiza Obsidian" | `camello obsidian sync` (y `--pull` si el usuario editó estados allá) |
| "Refresca cada 6 horas" | `camello schedule install --every 6h` (ver advertencia abajo) |
| "Qué sigue", "qué tengo pendiente" | `camello next` y ejecuta el primer paso si el usuario dice que sí |
| "Me llamaron de X, preguntaron por..." | Escribir `<empresa>-llamada.md` siguiendo `entrevista.md` → `camello status <id> entrevista --nota "..."` si pasó de fase |
| "Cómo va la búsqueda" | `camello stats` |
| "Revisa mi perfil" | `camello profile check` |
| "Importa mi hoja de vida" | `camello profile import <archivo>` y sigue sus instrucciones: lee el archivo tú, escribe `profile/cv.md` con la plantilla. |

Primera vez en una máquina: el usuario corre `camello init` (asistente interactivo; no lo corras tú con `--yes` salvo que el usuario lo pida) → si dio la ruta de su hoja de vida, impórtala como indica `camello profile import` → `camello profile check` → `camello sources check` → `camello refresh`.

La expectativa salarial vive en `config.local.json` (`salario_minimo_usd_mes`) y en `profile/preferencias.md`. Una oferta por debajo **no se descarta por eso**: se marca "(< mínimo)" en `shortlist` y "bajo tu mínimo" en el dashboard.

## Flujo completo de una vacante

Cuando el usuario dice "aplica a X" o "aplica a las del shortlist", haces todo el recorrido y le pides decisión **solo dos veces**: al confirmar la hoja de vida adaptada y al hacer clic en enviar. Todo lo demás lo resuelves tú con las reglas de cada skill.

1. `camello cv tailor <id> --json` → escribir `<empresa>-cv.md` en la carpeta de la vacante → `camello cv diff`.
2. **Checkpoint 1.** Muestra el diff (logros escogidos, palabras clave, frases sin respaldo, brechas reales) y espera confirmación. Con varias vacantes, adapta todas primero y pide una sola confirmación con una tabla, una fila por vacante.
3. `camello cv render` → PDF con nombre neutro. Sin abrir el PDF si son varias (`--no-open`).
4. `camello apply <id> --json` → abre el formulario. Antes de llenar, lee el formulario entero y anota lo que el usuario debe saber (llamada automática tras enviar, suscripción a boletín, ubicación distinta a la descripción, campos obligatorios inesperados).
5. Si el formulario exige carta, escríbela y súbela (`aplicar.md`). Si avisa de una llamada o prueba inmediata, escribe `<empresa>-entrevista.md` antes de seguir (`entrevista.md`).
6. Llena todo lo que el perfil respalda, deja vacío lo que no, nunca toques consentimientos ni el botón de enviar.
7. **Checkpoint 2.** Reporte: fracción de campos, qué llenaste, qué dejaste vacío y por qué, las respuestas abiertas completas, los avisos del formulario. El usuario revisa, edita, envía.
8. Cuando diga que envió: `camello status <id> aplicada` (toma el PDF de la carpeta solo). Ofrece la preparación de entrevista si no existe. Sigue con la siguiente vacante.

Una vacante en el navegador a la vez. Las adaptaciones y los diffs sí pueden ir en lote.

## Cómo juzgar

Reglas completas en [`juicio.md`](juicio.md). Resumen:

1. `camello pending --json`. El JSON trae las vacantes con texto completo, las rutas del perfil (`datos.perfil.cv`, `datos.perfil.preferencias`), la ruta del prompt y del ejemplo. Nunca devuelve más de `juicio.max_por_corrida` (`config.json`, default 20): ese es el presupuesto por corrida.
2. Lee el perfil **una vez** por sesión. Luego cada vacante.
3. Por cada vacante produce el JSON del esquema v1. No inventes: si el dato no está en el texto, `desconocido` o `null`.
4. Entrega uno por uno con stdin: `camello judge <id> --from -`. O en lote: escribe un archivo con una **lista JSON** de juicios y ejecuta `camello judge <cualquier id de la lista> --from archivo.json`.
5. `camello` valida cada juicio. Si rechaza uno, corrige el campo que nombra y reenvía; no lo omitas en silencio.
6. Al terminar: `camello shortlist`. Reporta la cobertura como fracción.

## Cómo adaptar la hoja de vida

Reglas completas en [`cv.md`](cv.md). Resumen:

1. `camello cv tailor <id> --json` devuelve el texto de la vacante, el juicio (fortalezas, brechas), palabras clave del anuncio y las rutas del perfil.
2. Lee `profile/cv.md` (la maestra con banco de logros). **Selecciona, no inventes.** Ninguna habilidad ni logro que no esté en la maestra puede aparecer.
3. Escribe el Markdown en la ruta `salida` que devuelve `tailor` (carpeta por vacante en `profile/adaptadas/`, ver `cv.md`), con el mismo formato de la maestra, 3 a 5 logros por experiencia, habilidades reordenadas según el anuncio, máximo 2 páginas, en el idioma de la vacante.
4. `camello cv diff <archivo.md>`: muestra al usuario qué logros escogiste, qué palabras clave cubriste y qué frases no aparecen en la maestra. **Espera confirmación** antes de dar la versión por lista.
5. `camello cv render <archivo.md>` genera el HTML y el PDF (con el Chrome o Edge instalado) y abre el PDF. Sin navegador, el usuario imprime desde el HTML con Ctrl+P.
6. Al aplicar: `camello status <id> aplicada --cv <archivo.pdf>`. El PDF se llama `<Nombre>_CV.pdf`, sin empresa ni rol, porque es lo que ve el reclutador.

## Cómo reportar

- **La fracción primero.** "12/14 feeds respondieron, 38 vacantes nuevas, 20 pendientes de juicio."
- No infles. "0 nuevas" es un resultado válido y se dice así.
- Si un comando falla, muestra su salida exacta (stderr incluido). No la parafrasees ni la escondas.
- Cierra siempre con el siguiente paso que sugiere el propio comando ("Siguiente: `camello pending`").
- Cada veredicto que menciones lleva su evidencia citada, para que el usuario lo verifique en dos segundos.

## Qué no hace

- **No envía aplicaciones.** Con `camello apply <id>` y control del navegador (`claude --chrome`) llena el formulario siguiendo `aplicar.md`, y se detiene antes del botón de enviar. Ese clic es del usuario.
- **No envía** correos ni mensajes.
- **No toca LinkedIn** ni hace scraping de ningún sitio sin feed público. `camello judge <url>` es para una vacante que el usuario pegó a mano.
- **No sube el perfil** ni la hoja de vida a ningún servicio. Todo vive en `profile/` y `data/`, ignorados por git.
- **No sobrescribe `profile/cv.md`** en silencio. Cualquier cambio a la maestra se propone como diff y espera confirmación.

## Advertencia: `schedule install`

`camello schedule install --every 6h` registra una tarea en el Programador de tareas de Windows o en `crontab`. **Modifica el sistema.** Antes de ejecutarlo muestra al usuario el comando exacto que se va a registrar (lo imprime `camello schedule install --dry-run` si existe, o `camello schedule status` después) y espera un sí explícito. Lo mismo para `schedule remove`.

## Idioma

Habla al usuario en el idioma de `config.local.json` → `lang` (`es` por defecto, `en` opcional). Pasa `--lang` solo si el usuario lo pide. El campo `resumen` de cada juicio va en ese idioma. La hoja de vida adaptada va en el idioma de la vacante, no del usuario.

Las claves del JSON (`veredicto`, `elegibilidad`, `cobertura`...) son API: siempre en español, nunca se traducen.
