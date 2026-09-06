# job-search-latam

An experiment: a local-first, agent-driven job search tool for developers in Colombia, then LATAM.

**Stage 0 (now):** make it work for one person (me).
**Stage 1:** make it work for developers in Colombia.
**Stage 2:** make it work across LATAM.

## The idea

Remote job boards are full of postings a developer in Colombia cannot actually get: "remote" that means US-only, pay bands quietly adjusted by region, contract types nobody states up front. This tool ingests postings from sources with public feeds, and lets your own coding agent (Claude Code, Cursor, etc.) judge each one for **eligibility**, **real pay in USD and COP**, and **contract type**, against a profile that never leaves your machine.

Every result states its coverage as a fraction: "412 of 2,300 remote postings are open to you."

## Principles

- **Local-first.** Postings, profile and judgments live in a local SQLite database. No server, no account, no resume upload.
- **Bring your own agent.** Judging runs on the coding-agent subscription you already pay for.
- **Show the evidence.** Every verdict quotes the sentence from the posting that drove it.
- **Only legal sources.** Public ATS feeds (Greenhouse, Lever, Ashby), Hacker News "Who is hiring", boards with APIs or RSS. No LinkedIn scraping.

## Layout (planned)

```
profile/     your resume and preferences (gitignored)
data/        local SQLite db and cached postings (gitignored)
docs/        plan, decisions, source list
src/         CLI + ingestion + judging
skill/       SKILL.md for coding agents
dashboard/   local web dashboard
```

See [docs/plan.md](docs/plan.md) for the roadmap and open decisions.

## License

MIT (to be confirmed).
