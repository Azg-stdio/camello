# job-search-latam · `camello`

Un experimento: una herramienta de búsqueda de empleo **local-first**, manejada por tu agente de código, para desarrolladores en Colombia y luego en LATAM.

- **Etapa 0 (ahora):** que funcione para una persona (yo).
- **Etapa 1:** que funcione para desarrolladores en Colombia.
- **Etapa 2:** que funcione en toda LATAM.

## La idea

Los tableros de empleo remoto están llenos de vacantes que un desarrollador en Colombia no puede tomar: "remoto" que en realidad es solo EE. UU., rangos salariales ajustados por región sin decirlo, tipos de contrato que nadie aclara. `camello` ingiere vacantes de fuentes con feeds públicos y deja que **tu propio agente** (Claude Code, Cursor, etc.) juzgue cada una por **elegibilidad**, **pago real en USD y COP** y **tipo de contrato**, contra un perfil que nunca sale de tu máquina. Además adapta tu hoja de vida a cada vacante sin inventar nada.

Cada resultado dice su cobertura como fracción: "412 de 2.300 vacantes remotas están abiertas para ti".

## Principios

- **Local-first.** Vacantes, perfil y juicios viven en SQLite en tu máquina. Sin servidor, sin cuenta, sin subir la hoja de vida.
- **Trae tu propio agente.** El juicio corre con la suscripción de agente que ya pagas.
- **Muestra la evidencia.** Cada veredicto cita la frase de la vacante que lo justifica.
- **Solo fuentes legales.** Feeds públicos de ATS (Greenhouse, Lever, Ashby), "Who is hiring" de Hacker News, tableros con API o RSS. Nada de scraping a LinkedIn.
- **Simplicidad primero.** Cero dependencias de runtime mientras se pueda. Español por defecto, inglés con `--lang en`.

## Estructura (planeada)

```
profile/     tu hoja de vida y preferencias (ignorado por git)
data/        base SQLite, caché y dashboard generado (ignorado por git)
sources/     lista semilla de empresas (versionada)
docs/        decisiones, plan, una tarea por documento
src/         CLI, ingesta, juicio, dashboard
skill/       SKILL.md para agentes de código
```

- [docs/plan.md](docs/plan.md): hoja de ruta por etapas.
- [docs/decisiones.md](docs/decisiones.md): decisiones cerradas.
- [docs/tareas/](docs/tareas/): una tarea por documento.
- [docs/investigacion/cv-2026.md](docs/investigacion/cv-2026.md): estándares de hoja de vida 2026.

## Licencia

MIT.

---

## English summary

`camello` is a local-first, agent-driven job search CLI for developers in Colombia, then LATAM. It ingests postings from legal public feeds, lets your own coding agent judge eligibility, real pay and contract type against a profile that never leaves your machine, and tailors your resume per posting without inventing facts. Spanish by default, English with `--lang en`. See `docs/` for the plan (Spanish).
