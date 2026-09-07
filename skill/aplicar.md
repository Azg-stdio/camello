# Aplicar a una vacante · reglas para el agente

`camello apply <id> --json` arma el paquete. Tú llenas el formulario de aplicación en el navegador del usuario y te detienes **antes de enviar**. El usuario revisa y hace clic en enviar. Ese clic nunca es tuyo.

Necesitas control del navegador del usuario. En Claude Code es `claude --chrome` (extensión Claude in Chrome). En otro agente, su equivalente. Sin navegador controlable, entrega al usuario el paquete ordenado (datos, respuestas redactadas, ruta del PDF) para que lo pegue él.

## Flujo

1. `camello apply <id> --json`. En `datos` vienen:
   - `vacante`: id, empresa, título y `url` del anuncio.
   - `candidato`: nombre, ciudad, email, teléfono, LinkedIn, GitHub, idiomas y disponibilidad, tomados del frontmatter de `profile/cv.md`. `faltan_en_perfil` lista los que están vacíos.
   - `cv`: rutas del Markdown, el HTML y el PDF adaptados para esa empresa (el más reciente). Si `cv.pdf` es `null`, corre primero `camello cv render <cv.md>`.
   - `juicio`: veredicto, elegibilidad, contrato, pago, fortalezas y brechas, por si el formulario pregunta algo relacionado.
   - `perfil`: rutas de `cv.md` y `preferencias.md`, para redactar respuestas abiertas.
   - `salario_minimo_usd_mes`: la expectativa salarial del usuario.
2. Abre `vacante.url` en el navegador y busca el botón de aplicar. Greenhouse, Lever y Ashby tienen formularios sin cuenta. Workday, iCIMS y similares exigen crear cuenta: ahí te detienes y se lo dices al usuario (ver "Qué no haces").
3. Llena los campos con `candidato`. Sube `cv.pdf` en el campo de hoja de vida. Si piden carta de presentación y no es obligatoria, déjala vacía salvo que el usuario la pida.
4. Preguntas cerradas (autorización de trabajo, reubicación, salario, disponibilidad, idiomas): responde con `preferencias.md`, `juicio` y `salario_minimo_usd_mes`. Si la respuesta no está en el perfil, no la inventes. Déjala vacía y anótala en el reporte.
5. Preguntas abiertas ("por qué quieres trabajar aquí", "cuéntanos de un proyecto"): redacta una respuesta corta en el idioma del formulario, solo con hechos de `cv.md`, siguiendo las reglas de redacción de `cv.md` (sin lenguaje de IA, sin "no es X, es Y", sin punto y coma ni dos puntos en el texto). Muéstrasela al usuario en el reporte para que la edite.
6. Campos demográficos y de diversidad (EEO, género, etnia, veteranía, discapacidad): déjalos sin responder o en "prefiero no decir". Nunca los llenes por el usuario.
7. Llega hasta la pantalla de revisión o hasta el botón de enviar y **para**. No marques casillas de términos y condiciones ni de consentimiento; el usuario las marca.
8. Reporte al usuario, en este orden: qué llenaste, qué dejaste vacío y por qué, las respuestas abiertas que redactaste, y qué falta para enviar. Fracción primero: "9/11 campos listos".
9. Cuando el usuario diga que envió: `camello status <id> aplicada --cv <ruta del PDF>`. Nunca antes.

## Qué no haces

- No haces clic en enviar, publicar, confirmar ni en ningún botón irreversible.
- No creas cuentas, no escribes contraseñas, no completas verificaciones humanas (captcha).
- No aceptas términos, políticas ni consentimientos en nombre del usuario.
- No inventas respuestas. Un campo vacío es mejor que un dato falso.
- No llenas datos sensibles: cédula, fecha de nacimiento, estado civil, dirección exacta, datos demográficos.
- No aplicas a una vacante con veredicto `descartar` o elegibilidad `cerrada` sin que el usuario lo pida explícitamente.
- No aplicas a varias vacantes en una sola instrucción. Una por vez, con revisión del usuario entre cada una.

## Si algo falla

Si la página exige cuenta, muestra un captcha, cambia de dominio a un portal de terceros o el formulario no carga, te detienes y le dices al usuario exactamente en qué paso quedaste y qué necesita hacer él. No intentes rodear la barrera.
