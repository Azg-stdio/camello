# 09 · Pipeline de aplicaciones

## Objetivo

Seguir cada vacante desde que aparece hasta que se cierra, para que `camello` sea una búsqueda y no solo un feed.

## Estados

```
vista → preseleccionada → aplicada → entrevista → oferta
                    ↘ descartada       ↘ rechazada
```

- `vista`: existe en la base, juzgada o no.
- `preseleccionada`: veredicto `aplicar` o `considerar`, o marcada a mano.
- `aplicada`: el usuario aplicó. Guarda fecha y qué hoja de vida adaptada usó.
- `entrevista`, `oferta`, `rechazada`, `descartada`: se ponen a mano con `camello status`.

## Reglas

- Solo el usuario (o el agente por instrucción explícita) mueve a `aplicada` o más allá. Un juicio automático nunca pasa de `preseleccionada`.
- Cada cambio de estado guarda fecha y nota opcional. Historial en la tabla `aplicaciones` más un log en `eventos` (id, vacante_id, de, a, fecha, nota).
- Una vacante `desaparecida` con estado `aplicada` o superior se conserva y se marca en el dashboard.
- Recordatorio simple: `camello shortlist` muestra al final "3 aplicaciones sin novedad hace más de 14 días".

## Entregables

- Tabla `eventos` (migración nueva en tarea 05).
- `camello status <id> <estado> [--nota]`, `camello status --list [estado]`.
- Los estados aparecen en el dashboard (tarea 10) y en el frontmatter de Obsidian (tarea 11).

## Criterio de hecho

Muevo una vacante real por `preseleccionada → aplicada → entrevista` y el historial completo se ve en `camello show <id>`.

## Dependencias

Tareas 05 y 06.
