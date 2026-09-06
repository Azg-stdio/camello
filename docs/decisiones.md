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
| 9 | Hoja de vida | Una **hoja de vida maestra en Markdown** (`profile/cv.md`) con banco de logros. La adaptación genera `profile/adaptadas/<empresa>-<rol>.md` + HTML listo para imprimir a PDF desde el navegador | Markdown es diffable y editable por el agente. PDF sin dependencias: Ctrl+P en el navegador. |
| 10 | Lista semilla | `sources/empresas.json` versionado en el repo, un objeto por empresa con `ats` y `slug` | Contribuible por pull request. Etapa 0 arranca con agencias Drupal. |
| 11 | Configuración | `config.json` versionado con defaults; `config.local.json` ignorado por git con rutas personales (vault, idioma, intervalo) | Lo personal nunca se sube. |
| 12 | Fuentes | Solo feeds públicos y APIs: Greenhouse, Lever, Ashby, HN Who is hiring, luego GetOnBrd y Torre. **Nunca LinkedIn**. `camello judge <url>` cubre vacantes pegadas a mano | Legal y sostenible. |
| 13 | Pruebas | `node:test`, sin framework | Cero dependencias. |
| 14 | Distribución | Por ahora `git clone` + `npm run build`. Publicar en npm cuando empiece la Etapa 1 | No optimizar antes de tiempo. |
| 15 | Telemetría | Ninguna | Confianza. |
| 16 | Fin de línea | `.gitattributes` con `eol=lf` | Evita ruido CRLF en Windows. |
| 17 | Hoja de vida y datos sensibles | Sin foto, cédula, edad, estado civil ni dirección exacta. Ciudad y país sí | Estándar para empresas extranjeras y recomendación 2026 también en Colombia. Ver `investigacion/cv-2026.md`. |
