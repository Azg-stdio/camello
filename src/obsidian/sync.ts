/** Tarea 11 · Obsidian: Markdown con frontmatter en una carpeta del vault. Sin plugin, sin tocar .obsidian/. */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Db } from "../db.js";
import type { Config } from "../config.js";
import { ESTADOS, type Estado } from "../tipos.js";
import { nombreArchivoSeguro, leerFrontmatter } from "../perfil/index.js";
import { fecha, fraccion, numero, t } from "../i18n/index.js";

const MARCA_NOTAS = "## Notas";

export interface ResultadoSync {
  carpeta: string;
  vacantes: number;
  escritas: number;
  diario: string;
  indice: string;
}

function yaml(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `[${v.map(yaml).join(", ")}]`;
  const s = String(v);
  return /[:#\[\]{}&*!|>'"%@`,?]|^\s|\s$/.test(s) || s === "" ? JSON.stringify(s) : s;
}

export function carpetaVault(config: Config): string {
  if (!config.obsidian?.vault) throw new Error(t("obsidian.sin_vault"));
  return join(config.obsidian.vault, config.obsidian.carpeta ?? "Camello");
}

function conservarNotas(rutaArchivo: string): string {
  if (!existsSync(rutaArchivo)) return "";
  const previo = readFileSync(rutaArchivo, "utf8");
  const i = previo.indexOf(MARCA_NOTAS);
  return i >= 0 ? previo.slice(i + MARCA_NOTAS.length).replace(/^\s*\n/, "") : "";
}

export function sincronizar(db: Db, config: Config): ResultadoSync {
  const base = carpetaVault(config);
  const dirVacantes = join(base, "Vacantes");
  const dirDiario = join(base, "Diario");
  mkdirSync(dirVacantes, { recursive: true });
  mkdirSync(dirDiario, { recursive: true });

  const filas = db.porEstado().filter((f) => f.estado !== "vista");
  let escritas = 0;
  for (const f of filas) {
    const j = db.ultimoJuicio(f.id);
    const nombre = `${nombreArchivoSeguro(f.empresa)} - ${nombreArchivoSeguro(f.titulo)}.md`;
    const ruta = join(dirVacantes, nombre);
    const notas = conservarNotas(ruta);
    const front: Record<string, unknown> = {
      camello_id: f.id,
      empresa: f.empresa,
      titulo: f.titulo,
      url: f.url,
      estado: f.estado,
      veredicto: j?.veredicto ?? null,
      puntaje: j?.ajuste.puntaje ?? null,
      elegibilidad: j?.elegibilidad ?? null,
      pago_min_usd: j && j.pago.moneda === "USD" ? j.pago.min : null,
      pago_max_usd: j && j.pago.moneda === "USD" ? j.pago.max : null,
      contrato: j?.contrato ?? null,
      fuente: f.fuente,
      primera_vez: f.primera_vez.slice(0, 10),
      actualizada: f.actualizada_en.slice(0, 10),
      tags: ["camello", ...(j?.veredicto ? [j.veredicto] : [])],
    };
    const cuerpo: string[] = ["---"];
    for (const [k, v] of Object.entries(front)) cuerpo.push(`${k}: ${yaml(v)}`);
    cuerpo.push("---", "", `# ${f.empresa} · ${f.titulo}`, "");
    if (j) {
      cuerpo.push(`**${t("col.veredicto")}:** ${t(`veredicto.${j.veredicto}`)} · **${t("col.puntaje")}:** ${j.ajuste.puntaje}/100 · **${t("col.elegibilidad")}:** ${t(`elegibilidad.${j.elegibilidad}`)}`, "");
      cuerpo.push(j.resumen, "");
      if (j.evidencia_elegibilidad) cuerpo.push(`> ${j.evidencia_elegibilidad}`, "");
      if (j.pago.evidencia) cuerpo.push(`> ${j.pago.evidencia}`, "");
      if (j.ajuste.fortalezas.length) cuerpo.push(`## ${t("show.fortalezas")}`, ...j.ajuste.fortalezas.map((x) => `- ${x}`), "");
      if (j.ajuste.brechas.length) cuerpo.push(`## ${t("show.brechas")}`, ...j.ajuste.brechas.map((x) => `- ${x}`), "");
    } else {
      cuerpo.push(t("show.sin_juicio"), "");
    }
    if (f.url) cuerpo.push(`[${t("obsidian.abrir_vacante")}](${f.url})`, "");
    cuerpo.push(MARCA_NOTAS, "", notas.trimEnd(), "");
    writeFileSync(ruta, cuerpo.join("\n"), "utf8");
    escritas++;
  }

  // Diario del día
  const r = db.resumen();
  const c = r.ultima_corrida;
  const hoy = new Date().toISOString().slice(0, 10);
  const rutaDiario = join(dirDiario, `${hoy}.md`);
  const nuevasShortlist = db.shortlist({ desdeDias: 1 });
  const diario = [
    "---",
    `fecha: ${hoy}`,
    `fuentes_ok: ${c?.fuentes_ok ?? 0}`,
    `fuentes_total: ${c?.fuentes_total ?? 0}`,
    `nuevas: ${c?.nuevas ?? 0}`,
    `cambiadas: ${c?.cambiadas ?? 0}`,
    `desaparecidas: ${c?.desaparecidas ?? 0}`,
    "tags: [camello, diario]",
    "---",
    "",
    `# Camello · ${fecha(hoy)}`,
    "",
    c ? t("obsidian.diario_corrida", { fraccion: fraccion(c.fuentes_ok, c.fuentes_total), nuevas: numero(c.nuevas), cambiadas: numero(c.cambiadas), desaparecidas: numero(c.desaparecidas) }) : t("stats.sin_corridas"),
    "",
    t("obsidian.diario_pendientes", { pendientes: numero(r.pendientes), juzgadas: numero(r.juzgadas) }),
    "",
    `## ${t("obsidian.diario_shortlist")}`,
    ...(nuevasShortlist.length ? nuevasShortlist.map((s) => `- [[${nombreArchivoSeguro(s.empresa)} - ${nombreArchivoSeguro(s.titulo)}]] · ${s.juicio.ajuste.puntaje} · ${t(`veredicto.${s.juicio.veredicto}`)}`) : [`- ${t("obsidian.nada")}`]),
    "",
  ].join("\n");
  writeFileSync(rutaDiario, diario, "utf8");

  // Índice con consulta Dataview y vista Bases
  const rutaIndice = join(base, "Camello.md");
  const indice = [
    "---",
    "tags: [camello]",
    "---",
    "",
    "# Camello",
    "",
    t("obsidian.indice_intro"),
    "",
    "## Dataview",
    "",
    "```dataview",
    "TABLE estado, veredicto, puntaje, elegibilidad, pago_min_usd, pago_max_usd, contrato, actualizada",
    'FROM "' + (config.obsidian?.carpeta ?? "Camello") + '/Vacantes"',
    "SORT puntaje DESC",
    "```",
    "",
    "## Bases",
    "",
    "```base",
    "filters:",
    '  and:',
    '    - file.inFolder("' + (config.obsidian?.carpeta ?? "Camello") + '/Vacantes")',
    "views:",
    "  - type: table",
    "    name: Pipeline",
    "    order:",
    "      - file.name",
    "      - estado",
    "      - veredicto",
    "      - puntaje",
    "      - elegibilidad",
    "      - pago_max_usd",
    "      - contrato",
    "      - actualizada",
    "```",
    "",
    `${t("obsidian.indice_estados")}: ${ESTADOS.join(", ")}`,
    "",
  ].join("\n");
  writeFileSync(rutaIndice, indice, "utf8");

  return { carpeta: base, vacantes: filas.length, escritas, diario: rutaDiario, indice: rutaIndice };
}

export interface ResultadoPull {
  leidas: number;
  cambiadas: { id: string; de: string; a: Estado }[];
  invalidas: { archivo: string; estado: string }[];
}

/** Lee `estado` del frontmatter de cada nota y actualiza la base si cambió. Única dirección inversa. */
export function traer(db: Db, config: Config): ResultadoPull {
  const dirVacantes = join(carpetaVault(config), "Vacantes");
  const r: ResultadoPull = { leidas: 0, cambiadas: [], invalidas: [] };
  if (!existsSync(dirVacantes)) return r;
  for (const archivo of readdirSync(dirVacantes).filter((a) => a.endsWith(".md"))) {
    const { datos } = leerFrontmatter(readFileSync(join(dirVacantes, archivo), "utf8"));
    const id = datos["camello_id"]?.replace(/^"|"$/g, "");
    const estado = datos["estado"]?.replace(/^"|"$/g, "") as Estado | undefined;
    if (!id || !estado) continue;
    r.leidas++;
    if (!ESTADOS.includes(estado)) {
      r.invalidas.push({ archivo, estado });
      continue;
    }
    const actual = db.aplicacion(id);
    if (actual && actual.estado !== estado) {
      db.setEstado(id, estado, "obsidian");
      r.cambiadas.push({ id, de: actual.estado, a: estado });
    }
  }
  return r;
}
