# Decisiones cerradas

Criterio: simplicidad primero, para quien desarrolla y para quien usa. Cualquiera se puede revisar, pero hay que decirlo explícitamente y actualizar este archivo.

| # | Decisión | Elección | Por qué |
|---|----------|----------|---------|
| 1 | Nombre del binario | `camello` | Colombiano, memorable, no choca con comandos existentes (`jobs` es un builtin de bash). |
| 2 | Runtime | TypeScript sobre Node 22, **cero dependencias de runtime** | Node 22 ya está instalado. `node:sqlite`, `node:util.parseArgs`, `fetch` y `node:test` cubren todo. Sin builds nativos en Windows. |
| 3 | Base de datos | SQLite vía `node:sqlite`, un archivo en `data/camello.db` | Sin servidor, sin instalación, se respalda copiando un archivo. |
| 4 | Dashboard | HTML estático generado por `camello dashboard`, datos embebidos como JSON, componentes **Web Awesome** por CDN, se abre en el navegador | Sin servidor ni build. Web Awesome (sucesor de Shoelace) son web components estándar. |
| 5 | Obsidian | Archivos Markdown con frontmatter YAML escritos en una carpeta del vault | Sin plugin. Compatible con Bases, Dataview y Kanban. |
| 6 | Refresco programado | `camello schedule install --every 6h` registra una tarea en el Programador de tareas (Windows) o cron (Unix). **Solo ingesta**, sin LLM | La ingesta no debe depender de la suscripción del agente. El juicio lo lanza el agente cuando el usuario abre la terminal. |
| 7 | Juicio | Lo hace el agente del usuario leyendo vacante + perfil, devuelve JSON con el esquema de la tarea 00. `camello` valida y guarda | Trae tu propio agente. Cero costo de API para el proyecto. |
| 8 | Idioma | Español por defecto. `--lang en` o `lang` en config. Cadenas en `src/i18n/es.json` y `en.json`. Documentación en español | Usuario final colombiano primero. |
| 9 | Hoja de vida | Una **hoja de vida maestra en Markdown** (`profile/cv.md`) con banco de logros. La adaptación genera una carpeta por vacante, `profile/adaptadas/<empresa>-<clave>-<rol>/`, con `<empresa>-cv.md`, el HTML y el PDF con nombre neutro (`<Nombre>_CV.pdf`, configurable en `cv.nombre_pdf`), porque un PDF con empresa y rol en el nombre delata que se fabricó para el anuncio (decisión del 2026-09-07). El PDF lo produce el Chrome o Edge instalado en modo headless; si no hay, Ctrl+P desde el HTML | Markdown es diffable y editable por el agente. PDF sin dependencias de npm: el navegador ya está en la máquina. |
| 10 | Lista semilla | `sources/empresas.json` versionado en el repo, un objeto por empresa con `ats` y `slug` | Contribuible por pull request. Etapa 0 arranca con agencias Drupal. |
| 11 | Configuración | `config.json` versionado con defaults; `config.local.json` ignorado por git con rutas personales (vault, idioma, intervalo) | Lo personal nunca se sube. |
| 12 | Fuentes | Solo feeds públicos y APIs: Greenhouse, Lever, Ashby, HN Who is hiring, luego GetOnBrd y Torre. **Nunca LinkedIn**. `camello judge <url>` cubre vacantes pegadas a mano | Legal y sostenible. |
| 13 | Pruebas | `node:test`, sin framework | Cero dependencias. |
| 14 | Distribución | Por ahora `git clone` + `npm run build`. Publicar en npm cuando empiece la Etapa 1 | No optimizar antes de tiempo. |
| 15 | Telemetría | Ninguna | Confianza. |
| 16 | Fin de línea | `.gitattributes` con `eol=lf` | Evita ruido CRLF en Windows. |
| 18 | Aplicar | `camello apply <id>` arma el paquete (URL, PDF adaptado, datos de contacto, juicio). El agente llena el formulario en el navegador del usuario y **se detiene antes de enviar**; el usuario envía. Sin cuentas, contraseñas, captchas ni consentimientos por parte del agente | Ahorra el trabajo mecánico sin ceder la decisión. Decidido el 2026-09-07. |
| 17 | Hoja de vida y datos sensibles | Sin foto, cédula, edad, estado civil ni dirección exacta. Ciudad y país sí | Estándar para empresas extranjeras y recomendación 2026 también en Colombia. Ver `investigacion/cv-2026.md`. |
| 19 | Carpeta por vacante | `profile/adaptadas/<empresa>-<clave>-<rol>/` con `<empresa>-cv.md`, `<empresa>-carta.md`, `<empresa>-entrevista.md` y los PDF con el nombre del candidato (`cv.nombre_pdf` en `config.json`). Decisión del 2026-09-07 | Un PDF llamado `Wikimedia-Senior-Engineer.pdf` delata que se fabricó para el anuncio. La clave del id evita mezclar dos vacantes de la misma empresa. |
| 20 | Datos demográficos | El agente los deja vacíos salvo los que el usuario registró en `preferencias.md` bajo "Datos para formularios de aplicación". Decisión del 2026-09-07 | El usuario decide qué declara; el agente solo copia. |
| 21 | Preparación de entrevista | `<empresa>-entrevista.md` con preguntas y respuestas en el idioma de la vacante, antes de enviar si el formulario avisa de una llamada automática. Decisión del 2026-09-07 | LatamCent llama con una IA a los cinco minutos de enviar; sin preparación la llamada se pierde. |
| 22 | Dos checkpoints por vacante | El agente hace todo el recorrido y solo pregunta al confirmar el CV adaptado y al enviar. En lote, una confirmación para todos los CV y formularios de a uno. Decisión del 2026-09-07 | Facilidad para el usuario. Cada pregunta intermedia era fricción sin decisión real. |
| 23 | Qué sigue | `camello next` resume toda la búsqueda en una lista de acciones con comando, y marca seguimiento a los 7 días sin respuesta (antes 14 en `shortlist`). `init` pregunta el nivel de inglés CEFR. Las notas de cada llamada van en `<empresa>-llamada.md` y alimentan la siguiente preparación. Decisión del 2026-09-07 | Hasta hoy el "siguiente paso" lo imprimía cada comando por separado; el usuario quería una sola vista. |
