# 13 · Adaptar la hoja de vida a la vacante

## Objetivo

Que el agente genere, a partir de la hoja de vida maestra (`profile/cv.md`) y del juicio de una vacante, una versión adaptada que pase filtros ATS y lectores humanos de 2026, **sin inventar nada**. Base: `docs/investigacion/cv-2026.md`.

## Flujo

1. `camello cv tailor <id>` imprime en JSON: la vacante (texto), el juicio (fortalezas, brechas, palabras clave del anuncio) y la ruta de `profile/cv.md`.
2. El agente aplica las reglas de `skill/cv.md` y escribe el Markdown en la carpeta de la vacante, `profile/adaptadas/<empresa>-<clave>-<rol>/<empresa>-cv.md`. `cv render` deja el PDF al lado como `<Nombre>_CV.pdf`, sin empresa ni rol.
3. `camello cv render <archivo.md>` lo convierte a HTML con estilo de impresión (`src/cv/plantilla.html`) y lo abre. El usuario imprime a PDF con Ctrl+P. Un solo formato de salida en Etapa 0.
4. `camello cv diff <archivo.md>` muestra qué logros se escogieron, qué se reordenó y qué palabras clave se cubrieron, para revisar en un minuto.
5. Al marcar `aplicada` (tarea 09) se guarda qué archivo adaptado se usó.

## Reglas de adaptación (resumen; el detalle vive en `skill/cv.md`)

- **Seleccionar, no inventar.** Solo logros que existen en el banco de la maestra. Una habilidad que no está en la maestra no puede aparecer. Si la vacante pide algo que no tengo, el agente lo reporta como brecha, no lo rellena.
- **Habilidades primero y reordenadas.** La sección de habilidades va arriba y ordena primero las que la vacante nombra. Los ATS de 2026 (Greenhouse, Workday) mapean esa sección a la tarjeta de evaluación antes que la experiencia.
- **Espejo natural del anuncio.** Usar las palabras del anuncio (framework, nube, base de datos, prácticas) dentro de frases con contexto. Nunca listas de palabras sueltas ni texto oculto: los clasificadores lo detectan y bajan la prioridad.
- **Acrónimo y término completo** la primera vez: "CI/CD (integración y despliegue continuos)".
- **Cada logro: Acción + Tecnología + Impacto + Alcance, con número.** "Reduje el tiempo de carga 40% migrando 120 módulos Drupal 7 a 10 para un portal con 2 M de visitas/mes".
- **3 a 5 logros por experiencia**, los más relevantes al anuncio. Máximo 2 páginas; 1 si tiene menos de 8 años de experiencia.
- **Formato parseable:** una columna, encabezados estándar (Experiencia, Habilidades, Educación), sin tablas, gráficos, iconos ni foto. Texto real, no imágenes. Fuente estándar.
- **Sin datos sensibles:** sin cédula, edad, estado civil ni dirección exacta. Ciudad y país, correo, LinkedIn, GitHub.
- **Idioma de la vacante.** Si el anuncio está en inglés, la hoja de vida sale en inglés. Nivel de inglés declarado explícitamente (ej. "English C1").
- **Sonar humano.** Evitar frases genéricas de modelo ("spearheaded", "leveraged", "results-driven", "passionate"), rayas largas y bullets de estructura idéntica. Los ATS grandes tienen clasificadores de texto generado desde finales de 2025 y encolan esas hojas de vida con menor prioridad.
- **Titular alineado al rol** pero honesto: "Drupal Lead" no se convierte en "Staff Engineer" porque el anuncio lo pida.
- **Mostrar el diff y esperar confirmación** antes de dar la versión por lista.

## Entregables

- `skill/cv.md` con las reglas completas y dos ejemplos (antes/después de un logro).
- `src/cv/render.ts`, `src/cv/plantilla.html` (estilo de impresión, tamaño carta y A4).
- `camello cv tailor|render|diff`.
- `docs/ejemplos/cv.ejemplo.md`.

## Criterio de hecho

Para una vacante real del shortlist, la adaptación se genera en una instrucción, el diff muestra cero afirmaciones nuevas respecto a la maestra, el PDF impreso desde el navegador cabe en 2 páginas y lo uso en una aplicación real.

## Dependencias

Tareas 00, 01, 07. Investigación en `docs/investigacion/cv-2026.md`.
