# Plan

Cada tarea tiene su propio documento en [`tareas/`](tareas/). Las decisiones cerradas están en [`decisiones.md`](decisiones.md).

## Etapa 0: funciona para mí

Meta medible: encuentro una vacante a la que aplico y que no había visto en otro lado.

| # | Tarea | Documento |
|---|-------|-----------|
| 00 | Esquema de juicio (el contrato central) | [tareas/00-esquema-de-juicio.md](tareas/00-esquema-de-juicio.md) |
| 01 | Perfil y hoja de vida maestra | [tareas/01-perfil.md](tareas/01-perfil.md) |
| 02 | Lista semilla de empresas | [tareas/02-lista-semilla-empresas.md](tareas/02-lista-semilla-empresas.md) |
| 03 | Ingesta: feeds ATS (Greenhouse, Lever, Ashby) | [tareas/03-ingesta-ats.md](tareas/03-ingesta-ats.md) |
| 04 | Ingesta: Hacker News "Who is hiring" | [tareas/04-ingesta-hn.md](tareas/04-ingesta-hn.md) |
| 05 | Almacenamiento SQLite y detección de cambios | [tareas/05-almacenamiento.md](tareas/05-almacenamiento.md) |
| 06 | CLI `camello` | [tareas/06-cli.md](tareas/06-cli.md) |
| 07 | Juicio con agente | [tareas/07-juicio-con-agente.md](tareas/07-juicio-con-agente.md) |
| 08 | Skill para agentes de código | [tareas/08-skill.md](tareas/08-skill.md) |
| 09 | Pipeline de aplicaciones | [tareas/09-pipeline-aplicaciones.md](tareas/09-pipeline-aplicaciones.md) |
| 10 | Dashboard local | [tareas/10-dashboard.md](tareas/10-dashboard.md) |
| 11 | Integración con Obsidian | [tareas/11-obsidian.md](tareas/11-obsidian.md) |
| 12 | Refresco programado | [tareas/12-refresco-programado.md](tareas/12-refresco-programado.md) |
| 13 | Adaptar la hoja de vida a la vacante | [tareas/13-adaptar-cv.md](tareas/13-adaptar-cv.md) |
| 14 | Internacionalización (es / en) | [tareas/14-i18n.md](tareas/14-i18n.md) |

Orden sugerido: 00 → 01 → 02 → 03 → 05 → 06 → 07 → 08 → 13 → 09 → 10 → 11 → 12 → 04 → 14. La 14 se aplica desde el principio (todas las cadenas pasan por `t()`), pero la traducción al inglés se completa al final.

## Etapa 1: funciona para Colombia

- Lista semilla crece a 300+ empresas, con contribuciones por pull request.
- Fuentes: APIs de GetOnBrd y Torre.
- Conversión a COP con tasa del día; bandera contratista vs empleado (Ley 2466 de 2025).
- 20 desarrolladores colombianos lo prueban; se mide la meta de la Etapa 0 para cada uno.

## Etapa 2: funciona para LATAM

- Reglas de elegibilidad y moneda por país.
- Ajuste de zona horaria (UTC-3 a UTC-8).
- Opcional: sincronización alojada y vigilancias programadas (nivel pago).
