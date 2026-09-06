# 10 · Dashboard local

## Objetivo

Una página HTML que muestre de un vistazo el estado de la búsqueda: cobertura, shortlist, pipeline y última corrida. Generada por `camello dashboard`, abierta en el navegador, sin servidor.

## Cómo

- `camello dashboard` consulta SQLite, serializa a JSON, lo incrusta en una plantilla HTML (`src/dashboard/plantilla.html`) y escribe `data/dashboard.html`. Luego abre el archivo con el navegador por defecto (`start` en Windows, `open` en macOS, `xdg-open` en Linux).
- Componentes de **Web Awesome** cargados por CDN (versión fijada). Tarjetas, tabla con orden y filtro, badges por veredicto y estado, barra de progreso para la cobertura. Sin framework ni build.
- El HTML funciona sin red salvo los componentes: si el CDN no carga, la página sigue legible en HTML plano (progressive enhancement).
- Tema claro y oscuro con las variables de Web Awesome.

## Secciones

1. **Cabecera:** última corrida, fracción de fuentes leídas, vacantes totales, juzgadas, pendientes.
2. **Cobertura:** "412 de 2.300 vacantes abiertas para ti", desglose por elegibilidad.
3. **Shortlist:** tabla con empresa, título, puntaje, elegibilidad, pago (USD y COP), contrato, estado, evidencia al expandir, enlace a la vacante.
4. **Pipeline:** columnas por estado con conteo y tarjetas.
5. **Nuevas esta semana** y **desaparecidas con aplicación activa**.

## Reglas

- Todo texto pasa por `t()` en el momento de generar; el HTML sale en el idioma configurado.
- Nada del perfil (hoja de vida, preferencias) se incrusta en el dashboard. Solo vacantes, juicios y estados.
- `data/dashboard.html` está ignorado por git.
- Conversión a COP: tasa fija en `config.local.json` para Etapa 0; API pública de tasa en Etapa 1.

## Entregables

- `src/dashboard/generar.ts`, `src/dashboard/plantilla.html`.
- `camello dashboard [--no-open]`.
- Captura de pantalla en `docs/investigacion/dashboard.png` cuando exista.

## Criterio de hecho

Abro el dashboard y en menos de 10 segundos sé cuántas vacantes nuevas hay, cuáles aplicar y qué aplicaciones están sin novedad.

## Dependencias

Tareas 05, 06, 07, 09.
