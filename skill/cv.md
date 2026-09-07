# Adaptar la hoja de vida · reglas

Generas, a partir de la hoja de vida maestra (`profile/cv.md`) y del juicio de una vacante, una versión adaptada que pase filtros ATS y lectores humanos de 2026, **sin inventar nada**. Base: `docs/investigacion/cv-2026.md`.

## Flujo

1. `camello cv tailor <id> --json`. En `datos` vienen:
   - `vacante`: id, empresa, título, URL y `descripcion_texto` completo.
   - `juicio`: el último juicio, con `ajuste.fortalezas` y `ajuste.brechas`.
   - `palabras_clave`: términos técnicos detectados en el anuncio (framework, nube, base de datos, prácticas).
   - `perfil.cv` y `perfil.preferencias`: rutas de los archivos.
   - `salida`: ruta del Markdown adaptado, dentro de la carpeta de la vacante en `profile/adaptadas/`.
   - `archivos`: todas las rutas de esa carpeta (`carpeta`, `md`, `html`, `pdf`, `carta`, `carta_html`, `carta_pdf`). La carpeta ya existe.
   - `idioma_vacante`: idioma detectado del anuncio.
2. Lee la maestra completa. Es más larga que una hoja de vida real: cada experiencia tiene un `### Banco de logros` con todo lo que el usuario hizo. Tu trabajo es **seleccionar**.
3. Escribe la adaptada en `salida` (formato abajo). Nunca inventes otro nombre ni otra carpeta.
4. `camello cv diff <archivo.md>`. Muestra al usuario el resultado: logros escogidos por experiencia, palabras clave cubiertas y no cubiertas, y **frases de la adaptada que no aparecen en la maestra**. Esa última lista debe estar vacía o contener solo reordenamientos evidentes. Si hay una afirmación nueva, quítala.
5. **Espera confirmación explícita** del usuario. No des la versión por lista sin ella.
6. `camello cv render <archivo.md>` genera el HTML con estilo de impresión (carta, o A4 con `--a4`) y el PDF junto a él, usando el Chrome o Edge instalado. Abre el PDF. Si no hay navegador, avisa y el usuario imprime desde el HTML con Ctrl+P.
7. Para aplicar con el formulario lleno por ti, sigue `skill/aplicar.md` (`camello apply <id>`). Cuando el usuario envíe: `camello status <id> aplicada --cv <archivo.pdf>`.

## Reglas

1. **Seleccionar, no inventar.** Solo logros que existen en el banco de la maestra. Una habilidad que no está en la maestra no puede aparecer. Si la vacante pide algo que el usuario no tiene, lo reportas como brecha en el diff; no lo rellenas, no lo insinúas, no lo "traduces" a algo parecido.
2. **Habilidades primero y reordenadas.** La sección `# Habilidades` va inmediatamente después del resumen. Dentro de cada grupo, primero las que la vacante nombra, en el orden en que el anuncio las nombra. Los ATS de 2026 (Greenhouse, Workday) mapean esa sección a la tarjeta de evaluación antes que la experiencia.
3. **Espejo natural del anuncio.** Usa las palabras exactas del anuncio (nombre del framework, nube, base de datos, prácticas) dentro de frases con contexto. Nunca listas de palabras sueltas, nunca texto oculto, nunca una sección "Keywords". Los clasificadores lo detectan y bajan la prioridad.
4. **Acrónimo y término completo** la primera vez que aparece: "CI/CD (integración y despliegue continuos)", "SSR (server-side rendering)".
5. **Cada logro: Acción + Tecnología + Impacto + Alcance, con número.** Si un logro de la maestra no tiene número, úsalo solo si es el único relevante y no le agregues cifras.
6. **3 a 5 logros por experiencia**, los más relevantes al anuncio, ordenados por relevancia. Experiencias antiguas o irrelevantes: 1 a 2 logros o solo el encabezado.
7. **Máximo 2 páginas.** 1 página si el usuario tiene menos de 8 años de experiencia. Mide con el render: si pasa de 2 páginas, recorta logros de las experiencias más antiguas.
8. **Formato parseable:** una columna, encabezados estándar (Resumen, Habilidades, Experiencia, Educación), sin tablas, gráficos, iconos, columnas ni foto. Texto real, no imágenes. La plantilla de render ya cumple esto; no agregues HTML ni Markdown exótico.
9. **Sin datos sensibles:** sin cédula, edad, estado civil, fecha de nacimiento ni dirección exacta. Sí: ciudad y país, correo, LinkedIn, GitHub.
10. **Idioma de la vacante.** Anuncio en inglés → hoja de vida en inglés; en español → en español. Traduce los logros con fidelidad, sin cambiar cifras. Declara el nivel de inglés explícitamente en el frontmatter y en habilidades ("English C1"). Los encabezados de sección (`# Resumen`, `# Habilidades`, ...) se escriben **siempre en español** para que `cv diff` y `profile check` los reconozcan; si la hoja de vida va en inglés, agrega `idioma_documento: en` al frontmatter y `cv render` los imprime en inglés (Summary, Skills, Experience...). El `# Titular` se imprime como subtítulo bajo el nombre, sin encabezado.
11. **Sonar humano, cero lenguaje de IA.** Reglas fijadas por el usuario:
    - Prohibidas las frases de modelo: "spearheaded", "leveraged", "results-driven", "passionate", "synergy", "cutting-edge", "seamless", "robust", "delve", "lideré con éxito", "apasionado por", "de punta".
    - Prohibida la estructura de contraste "No es X, es Y" / "Not just X, but Y" / "más que X, Y" en cualquier forma.
    - Prohibidas las frases cortas encadenadas con punto ("Built the API. Shipped it. Scaled it."). Cada bullet es una oración completa con contexto, o dos como máximo, unidas de forma natural.
    - Sin rayas largas (—), sin tríadas forzadas de tres adjetivos.
    - **Sin punto y coma y sin dos puntos dentro de un bullet o párrafo.** Nada de "Proyecto (2024): descripción" ni "hizo A; también B". Un proyecto se presenta como oración: "camello is an open source CLI that ...". Los dos puntos solo se admiten como etiqueta de grupo en Habilidades ("Languages: PHP, ...").
    - Varía la estructura de los bullets: no todos "Verbo + objeto + porcentaje"; alterna empezar por el contexto, por el impacto o por la tecnología.
    - Los ATS grandes tienen clasificadores de texto generado desde finales de 2025 y encolan esas hojas de vida con menor prioridad; un revisor humano también lo nota.
12. **Titular alineado al rol pero honesto.** Si el anuncio dice "Staff Engineer" y la maestra dice "Drupal Lead", el titular puede decir "Drupal Lead · Arquitectura y liderazgo técnico", nunca "Staff Engineer".
13. **Mostrar el diff y esperar confirmación** antes de dar la versión por lista (paso 4 y 5 del flujo).
14. **Nunca modifiques `profile/cv.md`.** Si al adaptar notas que a la maestra le falta un logro que el usuario sí mencionó en conversación, propónselo como diff aparte y espera confirmación.

## Formato de salida

Mismo frontmatter y mismas secciones que `profile/cv.md`. Solo cambia el contenido seleccionado.

```markdown
---
nombre: Nombre Apellido
ciudad: Medellín, Colombia
email: correo@ejemplo.com
linkedin: https://linkedin.com/in/usuario
github: https://github.com/usuario
idiomas: { es: nativo, en: C1 }
disponibilidad: contratista (Deel, Remote.com) · UTC-5
vacante: greenhouse:ejemplo:1234567
adaptada_en: 2026-09-06
---

# Titular
Drupal Lead · 10 años · PHP, Symfony, arquitectura de CMS y migraciones a gran escala

# Resumen
3 a 4 líneas. Menciona el tipo de empresa y el rol del anuncio con sus palabras.

# Habilidades
- Lenguajes: PHP (10 años), TypeScript (6), SQL (10)
- Frameworks: Drupal 7 a 11 (10), Symfony (6), Next.js (2)
- Infraestructura: AWS, Docker, GitHub Actions, Pantheon
- Prácticas: CI/CD (integración y despliegue continuos), revisión de código, WCAG 2.2

# Experiencia

## Empresa · Rol · 2021–2026 · Remoto
- Logro 1 (el más relevante al anuncio)
- Logro 2
- Logro 3

## Otra Empresa · Rol · 2017–2021 · Bogotá
- Logro 1
- Logro 2

# Educación y certificaciones
- ...

# Proyectos y comunidad
- ...
```

Diferencias con la maestra: el frontmatter agrega `vacante` y `adaptada_en`; las experiencias no llevan `### Banco de logros`, solo los 3 a 5 bullets escogidos; el orden de habilidades sigue al anuncio.

### Carpeta y nombres de archivo

Cada vacante tiene su carpeta en `profile/adaptadas/<empresa>-<clave>-<rol>/`, en minúsculas y máximo 80 caracteres, donde `<clave>` es el último segmento del id de la vacante (`greenhouse:wikimedia:8158048` → `8158048`). Así dos vacantes de la misma empresa nunca se mezclan. Dentro:

| Archivo | Nombre | Por qué |
|---------|--------|---------|
| Markdown adaptado | `<empresa>-cv.md` | Se distingue de otras vacantes abiertas en el editor. |
| HTML | `<empresa>-cv.html` | Igual. |
| PDF de la hoja de vida | `MiguelArbelaez_CV.pdf` | Es lo único que sale de la máquina. Un nombre con empresa y rol delata que se fabricó para el anuncio. |
| Carta de presentación | `<empresa>-carta.md` | Solo si el formulario la exige o el usuario la pide. |
| PDF de la carta | `MiguelArbelaez_CoverLetter.pdf` | Mismo motivo que el CV. |
| Preparación de entrevista | `<empresa>-entrevista.md` | Preguntas y respuestas para la llamada, ver `entrevista.md`. Nunca se envía. |

El nombre del candidato sale del frontmatter (`nombre`), sin acentos ni espacios. La plantilla `{nombre}_{tipo}` se cambia en `config.json` → `cv.nombre_pdf`. `camello cv tailor` devuelve todas las rutas en `datos.archivos`; `camello cv render` pone el PDF con el nombre neutro junto al Markdown. Los archivos planos `<empresa>-<rol>.md` del formato anterior siguen funcionando como respaldo en `apply`, pero no crees nuevos.

## Ejemplos de logro

### Antes / después (español)

Maestra (banco de logros):

> Migré 120 módulos personalizados de Drupal 7 a 10 para un portal con 2 M de visitas mensuales, reduciendo el tiempo de carga 40%.

Anuncio pide: "experiencia en migraciones Drupal 7 → 10, rendimiento, Pantheon".

Adaptada:

> Reduje el tiempo de carga 40% migrando 120 módulos personalizados de Drupal 7 a Drupal 10 en Pantheon, para un portal con 2 M de visitas mensuales.

Qué cambió: el impacto va primero porque el anuncio prioriza rendimiento; "Pantheon" aparece **solo porque la maestra lo lista en infraestructura** para esa experiencia. Las cifras son las mismas.

### Before / after (English)

Master (achievement bank, in Spanish):

> Diseñé la arquitectura multisitio para 14 marcas sobre una sola base de código, bajando el costo de mantenimiento 30%.

Posting asks for: "multi-site Drupal architecture, cost efficiency, team leadership".

Tailored (posting is in English):

> Designed a single-codebase Drupal multisite architecture serving 14 brands, cutting maintenance cost by 30%.

What changed: translated faithfully, "Drupal" made explicit because the posting names it and the master's experience is Drupal, same numbers. "Team leadership" is **not** added to this bullet: it comes from a different achievement in the bank ("Lideré un equipo de 6 desarrolladores remotos en tres zonas horarias"), which becomes its own bullet.

### Lo que no se hace

Anuncio pide "Next.js". Maestra no lo menciona.

- Mal: "Integré frontends desacoplados con React y Next.js". La maestra dice React, no Next.js.
- Bien: dejar "React (3 años)" en habilidades y reportar en el diff: "Brecha: el anuncio pide Next.js; la maestra no lo tiene. Si tienes experiencia real, agrégala primero a `profile/cv.md`."

## Qué muestra `camello cv diff`

- Por experiencia: qué logros de la maestra se escogieron y cuáles quedaron fuera.
- Palabras clave del anuncio cubiertas y no cubiertas en la adaptada.
- Frases de la adaptada cuyo contenido no aparece en la maestra (afirmaciones nuevas). Deben ser cero.
- Conteo aproximado de páginas.

Si la lista de afirmaciones nuevas no está vacía, corrige antes de pedir confirmación.
