# 15 · Aplicar con el agente en el navegador

## Objetivo

Que el agente llene el formulario de aplicación de una vacante en el navegador del usuario, con la hoja de vida adaptada y los datos del perfil, y se detenga antes de enviar. El usuario revisa y envía. `camello` solo arma el paquete de datos; nunca toca el navegador.

## Cómo

- `camello apply <id> [--cv <archivo>]` imprime la URL, la hoja de vida adaptada de esa vacante (la carpeta `profile/adaptadas/<empresa>-<clave>-<rol>/` con PDF, HTML, Markdown y carta si existe; los archivos planos del formato anterior sirven de respaldo), los datos de contacto del frontmatter de `profile/cv.md`, el juicio y la expectativa salarial. Con `--json`, todo en el sobre estándar.
- `skill/entrevista.md` tiene las reglas para escribir `<empresa>-entrevista.md`, preguntas y respuestas en el idioma de la vacante para la llamada de filtro. Se escribe antes de enviar si el formulario avisa de una llamada automática (LatamCent llama con una IA cinco minutos después de enviar).
- `skill/aplicar.md` tiene las reglas para el agente: qué llenar, qué dejar vacío, cómo redactar respuestas abiertas, y dónde parar.
- En Claude Code el control del navegador es `claude --chrome` (Claude in Chrome). Otros agentes usan su equivalente. Sin navegador controlable, el agente entrega el paquete ordenado para que el usuario lo pegue.
- Al terminar, el usuario envía y el agente registra `camello status <id> aplicada --cv <pdf>`.

## Reglas

- El agente nunca hace clic en enviar, no crea cuentas, no escribe contraseñas, no resuelve captchas, no acepta términos ni consentimientos.
- Campos demográficos (EEO) se dejan vacíos o en "prefiero no decir", salvo los que el usuario registró en `preferencias.md` bajo "Datos para formularios de aplicación".
- Una vacante por instrucción, con revisión del usuario entre cada una.
- No se aplica a vacantes con veredicto `descartar` o elegibilidad `cerrada` salvo pedido explícito.
- Respuestas abiertas solo con hechos de `profile/cv.md`, en el idioma del formulario y con las reglas de redacción de `skill/cv.md`.
- Portales que exigen cuenta (Workday, iCIMS, SuccessFactors) quedan fuera del alcance: el agente se detiene y lo dice.

## Entregables

- `src/cli/comandos/apply.ts`, `skill/aplicar.md`.
- Intención "aplica a X" en `skill/SKILL.md`.

## Criterio de hecho

Con Claude Code y `--chrome`, "aplica a Wikimedia" deja el formulario de Greenhouse lleno con el PDF adjunto y las respuestas visibles para revisar, sin enviar. Después de enviar a mano, `camello show` muestra el estado `aplicada` con el PDF usado.

## Dependencias

Tareas 01, 09 y 13.
