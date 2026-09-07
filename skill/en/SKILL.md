---
name: camello
description: Operates the `camello` CLI to search for remote jobs from Colombia and LATAM. Use it when the user asks to look for jobs, refresh postings, judge pending ones, view the shortlist, tailor their resume, move an application through the pipeline, open the dashboard, sync Obsidian, or schedule the refresh.
version: 0.1.0
---

# camello

`camello` is a **local-first** job search tool for developers in Colombia (then LATAM). It ingests postings from public feeds (Greenhouse, Lever, Ashby, Hacker News "Who is hiring"), stores them in SQLite on the user's machine, and lets **you**, their agent, judge each one for eligibility, real pay and contract type against a profile that never leaves their disk. It also tailors the resume to each posting without inventing anything.

**Coverage principle:** any result that omits, fails or misses something says first how much did arrive, as an unsimplified fraction. "38/40 feeds responded", "412/2,300 postings open to you". Never round, never say "almost all".

This skill orchestrates commands; it reimplements nothing. If a command is missing or fails, show its exact output.

## Commands

All accept the global flags `--json`, `--lang es|en`, `--db <path>`, `--quiet`. With `--json` the output is always `{ "ok", "datos", "cobertura": { "ok", "total" }, "errores": [] }` with fixed Spanish keys. Exit code 0 if the operation finished (even with failed feeds), 1 if it could not start.

| Command | What it does |
|---------|--------------|
| `camello init` | Step-by-step wizard (language, salary expectation, contract, roles, resume path, vault). Writes `profile/preferencias.md`, `profile/cv.md` from the template and `config.local.json`. `--yes` skips the questions. |
| `camello profile init\|check\|import <file>` | Templates, profile validation, or instructions to import a PDF/DOCX. |
| `camello sources list\|check` | Lists the company seed or verifies every feed responds. |
| `camello refresh [--solo ats\|hn] [--empresa X]` | Ingests all sources. Reports new/changed/gone. |
| `camello search <text> [--remoto] [--empresa X] [--desde 7d]` | Keyword search over title, description and company. |
| `camello show <id> [--completa]` | Posting, latest judgment, state and history. |
| `camello pending [--limit N]` | Postings without a judgment or with a stale one, ready to judge. |
| `camello judge <id\|url> --from <file.json\|->` | Validates and stores a judgment. With a URL, downloads and stores the posting first. |
| `camello shortlist [--desde 7d] [--todas]` | `aplicar` and `considerar` verdicts by score, plus applications with no news. |
| `camello status <id> <state> [--nota "..."] [--cv <file>]` | Moves a posting through the pipeline. `--list [state]` lists. |
| `camello cv tailor\|render\|diff` | Data for tailoring, printable HTML, review of the tailored file. |
| `camello dashboard [--no-open]` | Generates `data/dashboard.html` and opens it. |
| `camello obsidian sync [--pull]` | Writes notes to the vault; `--pull` reads state changes made in Obsidian. |
| `camello schedule install --every 6h\|remove\|status` | Scheduled refresh (ingestion only, no LLM). |
| `camello stats` | Summary of postings, judgments, pipeline and last run. |
| `camello skill` | Path of this skill and install instructions. |

Pipeline states: `vista → preseleccionada → aplicada → entrevista → oferta`, with exits `descartada` and `rechazada`. State names are Spanish and fixed.

## Intent map

| The user says | Run |
|---------------|-----|
| "Find new jobs", "what's out there today" | `camello refresh` → `camello pending --json` → judge (see below) → `camello shortlist` |
| "What's new this week" | `camello shortlist --desde 7d` |
| "Judge the pending ones" | `camello pending --json` → judge → `camello shortlist` |
| "Look at this posting: <url>" | `camello judge <url>` → `camello show <id> --completa` → judge → `camello judge <id> --from -` |
| "Show me posting X" | `camello show <id>` |
| "Prepare my resume for X" | `camello cv tailor <id> --json` → tailor (see below) → `camello cv diff` → confirm → `camello cv render` |
| "I applied to X" | `camello status <id> aplicada --cv <tailored file>` |
| "They called me for an interview / rejected me / discard that one" | `camello status <id> entrevista\|rechazada\|descartada --nota "..."` |
| "Show me the board" | `camello dashboard` |
| "Update Obsidian" | `camello obsidian sync` (and `--pull` if the user edited states there) |
| "Refresh every 6 hours" | `camello schedule install --every 6h` (see warning below) |
| "How is the search going" | `camello stats` |
| "Check my profile" | `camello profile check` |
| "Import my resume" | `camello profile import <file>` and follow its instructions: read the file yourself, write `profile/cv.md` using the template. |

First time on a machine: the user runs `camello init` (interactive wizard; do not run it yourself with `--yes` unless asked) → if they gave a resume path, import it as `camello profile import` instructs → `camello profile check` → `camello sources check` → `camello refresh`.

The salary expectation lives in `config.local.json` (`salario_minimo_usd_mes`) and in `profile/preferencias.md`. An offer below it is **never discarded for that reason alone**: it is flagged "(< minimum)" in `shortlist` and "below your minimum" in the dashboard.

## How to judge

Full rules in [`../juicio.md`](../juicio.md). Summary:

1. `camello pending --json`. The JSON carries the postings with full text, the profile paths (`datos.perfil.cv`, `datos.perfil.preferencias`), the prompt path and the example path. It never returns more than `juicio.max_por_corrida` (`config.json`, default 20): that is the per-run budget.
2. Read the profile **once** per session. Then each posting.
3. For each posting produce the schema v1 JSON. Do not invent: if the fact is not in the text, use `desconocido` or `null`.
4. Deliver one by one via stdin: `camello judge <id> --from -`. Or in batch: write a file with a **JSON array** of judgments and run `camello judge <any id from the array> --from file.json`.
5. `camello` validates each judgment. If it rejects one, fix the named field and resend; never drop it silently.
6. When done: `camello shortlist`. Report coverage as a fraction.

## How to tailor the resume

Full rules in [`../cv.md`](../cv.md). Summary:

1. `camello cv tailor <id> --json` returns the posting text, the judgment (strengths, gaps), keywords from the ad and the profile paths.
2. Read `profile/cv.md` (the master with the achievement bank). **Select, never invent.** No skill or achievement absent from the master may appear.
3. Write `profile/adaptadas/<empresa>-<rol>.md` in the master's format, 3 to 5 achievements per role, skills reordered to match the ad, max 2 pages, in the posting's language.
4. `camello cv diff <file.md>`: show the user which achievements you picked, which keywords are covered and which sentences do not appear in the master. **Wait for confirmation** before calling it done.
5. `camello cv render <file.md>` generates the printable HTML and opens it. The user prints to PDF with Ctrl+P.
6. When applying: `camello status <id> aplicada --cv <file.md>`.

## How to report

- **Fraction first.** "12/14 feeds responded, 38 new postings, 20 pending judgment."
- Do not inflate. "0 new" is a valid result and is said as such.
- If a command fails, show its exact output (stderr included). Do not paraphrase or hide it.
- Always close with the next step the command itself suggests ("Siguiente: `camello pending`").
- Every verdict you mention carries its quoted evidence, so the user can verify it in two seconds.

## What it does not do

- **Does not apply** to postings or fill forms.
- **Does not send** emails or messages.
- **Does not touch LinkedIn** or scrape any site without a public feed. `camello judge <url>` is for a posting the user pasted by hand.
- **Does not upload the profile** or resume anywhere. Everything lives in `profile/` and `data/`, ignored by git.
- **Does not overwrite `profile/cv.md`** silently. Any change to the master is proposed as a diff and waits for confirmation.

## Warning: `schedule install`

`camello schedule install --every 6h` registers a task in Windows Task Scheduler or in `crontab`. **It modifies the system.** Before running it, show the user the exact command that will be registered (printed by `camello schedule install --dry-run` if available, or by `camello schedule status` afterwards) and wait for an explicit yes. Same for `schedule remove`.

## Language

Speak to the user in the language of `config.local.json` → `lang` (`es` by default, `en` optional). Pass `--lang` only if the user asks. The `resumen` field of each judgment goes in that language. The tailored resume goes in the posting's language, not the user's.

JSON keys (`veredicto`, `elegibilidad`, `cobertura`...) are API: always Spanish, never translated.
