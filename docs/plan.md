# Plan

## Stage 0: works for me

Goal: I find one posting I apply to that I had not seen elsewhere.

- [ ] Profile: resume text + preferences file in `profile/` (gitignored)
- [ ] Ingest: Greenhouse, Lever, Ashby public feeds for a seed list of companies known to hire in Colombia
- [ ] Ingest: Hacker News "Who is hiring" monthly thread, remote + LATAM filter
- [ ] Store: SQLite, one row per posting, dedup by URL, `first_seen` / `last_seen`
- [ ] Judge: agent reads posting + profile, returns fixed JSON (eligibility, pay band, contract type, fit, evidence quote)
- [ ] CLI: `search`, `judge`, `shortlist`, `refresh`, `stats`
- [ ] Skill: `SKILL.md` so Claude Code / Cursor drive the CLI
- [ ] Dashboard: local page over the SQLite db (shortlist, pipeline, coverage fraction)
- [ ] Obsidian: write one note per shortlisted posting + a daily digest into a vault folder
- [ ] Refresh schedule: agent-configurable (cron / Task Scheduler / Claude Code routine)

## Stage 1: works for Colombia

- [ ] Seed company list grows to 300+; community-submittable
- [ ] GetOnBrd and Torre APIs
- [ ] COP conversion, Ley 2466 contractor vs employee flag
- [ ] Spanish + English output
- [ ] 20 Colombian devs try it; measure the Stage 0 goal for each

## Stage 2: works for LATAM

- [ ] Per-country eligibility rules and currency
- [ ] Timezone fit (UTC-3 to UTC-8)
- [ ] Optional hosted sync + scheduled watches (paid tier)

## Open decisions

See the discussion in the first session. Decide before writing `src/`:

1. Language / runtime for the CLI (TypeScript on Node 22 vs Python)
2. Dashboard: static HTML over a JSON export vs a tiny local server; UI kit (Web Awesome vs shadcn vs plain)
3. Obsidian integration: plain Markdown files in a vault folder (simple, no plugin) vs Local REST API plugin
4. Refresh scheduling: OS scheduler vs Claude Code scheduled routine vs both
5. Judgment schema (the JSON the agent must return) — this is the core contract
6. Seed company list source and format
