# 12 · Refresco programado

## Objetivo

Que la ingesta corra sola cada N horas sin depender de que el agente esté abierto, y que el agente pueda configurar ese intervalo con un comando.

## Cómo

- `camello schedule install --every 6h` registra una tarea en el sistema:
  - **Windows:** `schtasks /Create /SC HOURLY /MO 6 /TN Camello /TR "node <ruta>/dist/src/cli/camello.js refresh --quiet"`.
  - **macOS / Linux:** línea en `crontab` con marcador `# camello`.
- `camello schedule remove` la quita. `camello schedule status` muestra si existe, el intervalo y la última corrida (de la tabla `corridas`).
- El intervalo también se guarda en `config.local.json` → `refresh.cada: "6h"` para que el dashboard y el agente lo muestren.
- Valores permitidos: `1h`, `3h`, `6h`, `12h`, `24h`. Default sugerido `6h`. Menos de 1h no tiene sentido con estas fuentes.

## Qué corre y qué no

- Corre: `refresh` (ingesta + detección de cambios + log de corrida). Sin LLM, sin red más allá de los feeds.
- No corre: juicio, adaptación de hoja de vida, sync de Obsidian. Eso lo lanza el agente cuando el usuario abre la terminal, con `camello pending`.
- Opcional en Etapa 1: `--then obsidian` para que la corrida programada también escriba el diario en el vault.

## Reglas

- `install` sobre una tarea existente la reemplaza, no la duplica.
- Todo se hace con comandos del sistema vía `child_process`; sin librerías.
- El log de cada corrida programada se escribe en `data/refresh.log` (rotado a 1 MB).
- Si el agente lo ejecuta, debe mostrar el comando exacto que va a registrar y esperar confirmación, porque modifica el sistema.

## Entregables

- `src/schedule/{windows,unix}.ts`.
- `camello schedule install|remove|status`.

## Criterio de hecho

Cierro la terminal, pasan 6 horas, `camello stats` muestra una corrida nueva que yo no lancé.

## Dependencias

Tareas 05 y 06.
