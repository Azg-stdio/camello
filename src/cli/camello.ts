#!/usr/bin/env node
/**
 * Tarea 06 · CLI `camello`. Este archivo solo enruta; cada comando vive en comandos/.
 */
import { readFileSync } from "node:fs";
import { enRaiz } from "../rutas.js";
import { cargarConfig } from "../config.js";
import { setLang, setVerbose, t } from "../i18n/index.js";
import { Contexto, type Comando, type FlagsGlobales } from "./comun.js";

// node:sqlite avisa que es experimental en cada arranque; el aviso no aporta al usuario.
process.removeAllListeners("warning");
process.on("warning", (w) => {
  if (w.name !== "ExperimentalWarning") process.stderr.write(`${w.name}: ${w.message}\n`);
});

const REGISTRO: Record<string, () => Promise<{ default: Comando }>> = {
  init: () => import("./comandos/init.js"),
  profile: () => import("./comandos/profile.js"),
  sources: () => import("./comandos/sources.js"),
  refresh: () => import("./comandos/refresh.js"),
  search: () => import("./comandos/search.js"),
  show: () => import("./comandos/show.js"),
  pending: () => import("./comandos/pending.js"),
  judge: () => import("./comandos/judge.js"),
  shortlist: () => import("./comandos/shortlist.js"),
  status: () => import("./comandos/status.js"),
  cv: () => import("./comandos/cv.js"),
  dashboard: () => import("./comandos/dashboard.js"),
  obsidian: () => import("./comandos/obsidian.js"),
  schedule: () => import("./comandos/schedule.js"),
  stats: () => import("./comandos/stats.js"),
  skill: () => import("./comandos/skill.js"),
};

export const ORDEN_AYUDA = ["init", "profile", "sources", "refresh", "search", "show", "pending", "judge", "shortlist", "status", "cv", "dashboard", "obsidian", "schedule", "stats", "skill"];

export function version(): string {
  try {
    return (JSON.parse(readFileSync(enRaiz("package.json"), "utf8")) as { version: string }).version;
  } catch {
    return "0.0.0";
  }
}

/** Separa flags globales del resto sin exigir orden. */
function extraerGlobales(argv: string[]): { flags: FlagsGlobales; resto: string[] } {
  const flags: FlagsGlobales = { json: false, lang: undefined, db: undefined, quiet: false, verbose: false, help: false };
  const resto: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--json") flags.json = true;
    else if (a === "--quiet" || a === "-q") flags.quiet = true;
    else if (a === "--verbose") flags.verbose = true;
    else if (a === "--help" || a === "-h") flags.help = true;
    else if (a === "--lang") flags.lang = argv[++i];
    else if (a.startsWith("--lang=")) flags.lang = a.slice(7);
    else if (a === "--db") flags.db = argv[++i];
    else if (a.startsWith("--db=")) flags.db = a.slice(5);
    else resto.push(a);
  }
  return { flags, resto };
}

async function ayuda(ctx: Contexto): Promise<number> {
  const lineas: string[] = [t("ayuda.titulo", { version: version() }), "", t("ayuda.uso"), ""];
  for (const nombre of ORDEN_AYUDA) {
    const mod = await REGISTRO[nombre]!();
    lineas.push(`  ${mod.default.uso.padEnd(58)} ${t(mod.default.descripcion)}`);
  }
  lineas.push("", t("ayuda.flags"), "", t("ayuda.pie"));
  if (ctx.flags.json) return ctx.terminar({ version: version(), comandos: ORDEN_AYUDA });
  process.stdout.write(lineas.join("\n") + "\n");
  return 0;
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const { flags, resto } = extraerGlobales(argv);
  const config = cargarConfig();
  setLang(flags.lang ?? config.lang);
  setVerbose(flags.verbose);

  const nombre = resto[0];
  const ctx = new Contexto(flags, resto.slice(1));

  if (nombre === "--version" || nombre === "-v") {
    process.stdout.write(`camello ${version()}\n`);
    return 0;
  }
  if (!nombre || nombre === "help" || (flags.help && !REGISTRO[nombre])) return ayuda(ctx);

  const cargador = REGISTRO[nombre];
  if (!cargador) {
    ctx.error(t("comun.comando_desconocido", { comando: nombre }));
    return ctx.terminar(null, { ok: 0, total: 1 }, false) || 1;
  }
  const comando = (await cargador()).default;
  if (flags.help) {
    process.stdout.write(`${comando.uso}\n  ${t(comando.descripcion)}\n`);
    return 0;
  }
  try {
    return await comando.ejecutar(ctx);
  } catch (e) {
    const err = e as Error;
    ctx.error(flags.verbose && err.stack ? err.stack : err.message);
    return ctx.terminar(null, { ok: 0, total: 1 }, false) || 1;
  } finally {
    ctx.cerrar();
  }
}

const esEntrada = process.argv[1] && /camello\.js$/.test(process.argv[1]);
if (esEntrada) {
  main().then(
    (codigo) => process.exit(codigo),
    (e) => {
      process.stderr.write(String((e as Error).stack ?? e) + "\n");
      process.exit(1);
    },
  );
}
