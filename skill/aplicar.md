# Aplicar a una vacante · reglas para el agente

`camello apply <id> --json` arma el paquete. Tú llenas el formulario de aplicación en el navegador del usuario y te detienes **antes de enviar**. El usuario revisa y hace clic en enviar. Ese clic nunca es tuyo.

Necesitas control del navegador del usuario. En Claude Code es `claude --chrome` (extensión Claude in Chrome). En otro agente, su equivalente. Sin navegador controlable, entrega al usuario el paquete ordenado (datos, respuestas redactadas, ruta del PDF) para que lo pegue él.

## Flujo

1. `camello apply <id> --json`. En `datos` vienen:
   - `vacante`: id, empresa, título y `url` del anuncio.
   - `candidato`: nombre, ciudad, email, teléfono, LinkedIn, GitHub, idiomas y disponibilidad, tomados del frontmatter de `profile/cv.md`. `faltan_en_perfil` lista los que están vacíos.
   - `cv`: la carpeta de la vacante en `profile/adaptadas/` y sus archivos: `md`, `html`, `pdf` de la hoja de vida, y `carta` y `carta_pdf` de la carta de presentación si existen. Si `cv.pdf` es `null`, corre primero `camello cv render <cv.md>`. El PDF lleva el nombre del candidato (`MiguelArbelaez_CV.pdf`), nunca el de la empresa; sube ese archivo tal cual, sin renombrarlo.
   - `juicio`: veredicto, elegibilidad, contrato, pago, fortalezas y brechas, por si el formulario pregunta algo relacionado.
   - `perfil`: rutas de `cv.md` y `preferencias.md`, para redactar respuestas abiertas.
   - `salario_minimo_usd_mes`: la expectativa salarial del usuario.
2. Abre `vacante.url` en el navegador y busca el botón de aplicar. Greenhouse, Lever y Ashby tienen formularios sin cuenta. Workday, iCIMS y similares exigen crear cuenta: ahí te detienes y se lo dices al usuario (ver "Qué no haces").
3. Llena los campos con `candidato`. Sube `cv.pdf` en el campo de hoja de vida. Si piden carta de presentación y no es obligatoria, déjala vacía salvo que el usuario la pida. Si es obligatoria, redacta una corta en el idioma del formulario con las mismas reglas de las respuestas abiertas (paso 5), guárdala en `cv.carta` (frontmatter con `nombre`, `ciudad`, `email`, `telefono`, `vacante` y `tipo: carta`), y súbela como PDF con `camello cv render <carta.md>` o pégala con "Enter manually" si el formulario lo permite. Muéstrasela al usuario en el reporte.
4. Preguntas cerradas (autorización de trabajo, reubicación, salario, disponibilidad, idiomas): responde con `preferencias.md`, `juicio` y `salario_minimo_usd_mes`. Si la respuesta no está en el perfil, no la inventes. Déjala vacía y anótala en el reporte.
5. Preguntas abiertas ("por qué quieres trabajar aquí", "cuéntanos de un proyecto"): redacta una respuesta corta en el idioma del formulario, solo con hechos de `cv.md`, siguiendo las reglas de redacción de `cv.md` (sin lenguaje de IA, sin "no es X, es Y", sin punto y coma ni dos puntos en el texto). Muéstrasela al usuario en el reporte para que la edite.
6. Campos demográficos y de diversidad (EEO, género, etnia, veteranía, discapacidad): déjalos sin responder o en "prefiero no decir", salvo que `preferencias.md` tenga la sección "Datos para formularios de aplicación" con la respuesta exacta. Solo copias lo que el usuario dejó ahí; lo que no esté, queda vacío.
7. Si el formulario avisa de una llamada, entrevista automática o prueba inmediata tras enviar ("you will receive a call from our AI assistant"), escribe antes la preparación `cv.entrevista` siguiendo `skill/entrevista.md` y dilo en el reporte. Si no avisa, ofrécela igual al terminar.
8. Llega hasta la pantalla de revisión o hasta el botón de enviar y **para**. No marques casillas de términos y condiciones ni de consentimiento; el usuario las marca.
9. Reporte al usuario, en este orden: qué llenaste, qué dejaste vacío y por qué, las respuestas abiertas que redactaste, y qué falta para enviar. Fracción primero: "9/11 campos listos".
10. Cuando el usuario diga que envió: `camello status <id> aplicada --cv <ruta del PDF>`. Nunca antes.

## Antes de empezar: el navegador

Comprueba la conexión con Chrome **antes** de armar nada. Si la extensión no responde, no reintentes en bucle. Dile al usuario estas cinco cosas en orden y espera su "listo": que la extensión Claude in Chrome esté instalada y habilitada en `chrome://extensions`, que tenga sesión iniciada con la misma cuenta de claude.ai, que haya reiniciado Chrome después de instalarla, que sea Chrome y no Edge, Brave ni Arc, y que la extensión esté en el perfil de Chrome que tiene abierto. Mientras tanto, entrega el paquete ordenado para que lo pegue a mano.

## Varias respuestas abiertas en un mismo formulario

Cuando el formulario tiene tres o más preguntas abiertas (Clara tiene cinco), planéalas juntas antes de escribir la primera. Cada respuesta lleva **una** idea propia y ningún logro se cuenta completo dos veces. La lista larga de logros va en una sola respuesta, las otras la mencionan en media oración o no la mencionan. Respeta el largo que pide el formulario ("3 a 5 oraciones") y nombra algo específico del rol en la respuesta de "por qué esta empresa". El usuario va a editarlas; ponlas completas en el reporte.

## Notas de campo por portal

- **Greenhouse.** Los desplegables son react-select. Clic, pausa de un segundo, escribir el texto de la opción, pausa, Enter, y verificar con captura. Sin las pausas, la selección se pierde en silencio. Los campos de texto y las áreas de texto aceptan el valor directo. La carta se puede pegar con "Enter manually" en vez de subir PDF.
- **Ashby.** "Full Name" pide nombre sin caracteres especiales, así que sin tildes. El teléfono en formato internacional sin espacios (`+573203290827`). La lista de ubicación suele ser solo países. Escribir el nombre de la ciudad da "No results".
- **LatamCent y otras agencias de LATAM.** Llaman con una IA a los cinco minutos de enviar, en inglés, y suscriben al boletín. Preparación de entrevista antes de enviar y decirle al usuario que envíe cuando pueda atender.
- **Formularios con firma electrónica** (escribir el nombre para certificar). Es un consentimiento, lo escribe el usuario.

## Qué no haces

- No haces clic en enviar, publicar, confirmar ni en ningún botón irreversible.
- No creas cuentas, no escribes contraseñas, no completas verificaciones humanas (captcha).
- No aceptas términos, políticas ni consentimientos en nombre del usuario.
- No inventas respuestas. Un campo vacío es mejor que un dato falso.
- No llenas datos sensibles: cédula, fecha de nacimiento, estado civil, dirección exacta. Los demográficos, solo los que el usuario registró en `preferencias.md`.
- No aplicas a una vacante con veredicto `descartar` o elegibilidad `cerrada` sin que el usuario lo pida explícitamente.
- No aplicas a varias vacantes en una sola instrucción. Una por vez, con revisión del usuario entre cada una.

## Si algo falla

Si la página exige cuenta, muestra un captcha, cambia de dominio a un portal de terceros o el formulario no carga, te detienes y le dices al usuario exactamente en qué paso quedaste y qué necesita hacer él. No intentes rodear la barrera.
