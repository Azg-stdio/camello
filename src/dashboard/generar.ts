/**
 * Tarea 10 · Dashboard local: HTML estático con datos embebidos, sin servidor.
 */
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Config } from "../config.js";
import type { Db, Resumen } from "../db.js";
import type { Juicio } from "../juicio/esquema.js";
import { getLang, setLang, t, type Lang } from "../i18n/index.js";
import { enRaiz } from "../rutas.js";
import type { Estado } from "../tipos.js";

export interface FilaShortlist {
  id: string;
  empresa: string;
  titulo: string;
  url: string | null;
  estado: Estado;
  primera_vez: string;
  puntaje: number;
  veredicto: string;
  elegibilidad: string;
  contrato: string;
  pago_usd_mes: number | null;
  pago_cop_mes: number | null;
  /** true si hay cifra y queda por debajo de salario_minimo_usd_mes. Se marca, nunca se oculta. */
  bajo_minimo: boolean;
  juicio: Juicio;
}

export interface FichaPipeline {
  id: string;
  empresa: string;
  titulo: string;
  url: string | null;
  estado: Estado;
  actualizada_en: string;
  desaparecida_en: string | null;
}

export interface DatosDashboard {
  generado: string;
  lang: Lang;
  tasa_cop: number;
  salario_minimo_usd_mes: number | null;
  resumen: Resumen;
  ultima_corrida: Resumen["ultima_corrida"];
  shortlist: FilaShortlist[];
  pipeline: Record<string, FichaPipeline[]>;
  nuevas: { id: string; empresa: string; titulo: string; ubicacion: string | null; remoto: boolean | null; pago_declarado: string | null; url: string | null; primera_vez: string; veredicto: string | null }[];
  desaparecidas: (FichaPipeline & { desaparecida_en: string })[];
}

/** Normaliza el pago del juicio a USD mensual (anual/12, hora*160). Solo USD; otras monedas devuelven null. */
export function usdMensual(j: Juicio): number | null {
  const p = j.pago;
  if (p.moneda !== "USD") return null;
  const ref = p.max ?? p.min;
  if (ref === null) return null;
  const mensual = p.periodo === "anual" ? ref / 12 : p.periodo === "hora" ? ref * 160 : ref;
  return Math.round(mensual);
}

const CLAVES_TEXTOS = [
  "si",
  "no",
  "col.puntaje",
  "col.veredicto",
  "col.empresa",
  "col.titulo",
  "col.elegibilidad",
  "col.contrato",
  "col.estado",
  "col.vista",
  "col.ubicacion",
  "col.remoto",
  "veredicto.aplicar",
  "veredicto.considerar",
  "veredicto.descartar",
  "elegibilidad.abierta",
  "elegibilidad.probable",
  "elegibilidad.improbable",
  "elegibilidad.cerrada",
  "elegibilidad.desconocida",
  "contrato.contratista",
  "contrato.empleado_eor",
  "contrato.empleado_local",
  "contrato.desconocido",
  "ajustado.us",
  "ajustado.latam",
  "ajustado.desconocido",
  "estado.vista",
  "estado.preseleccionada",
  "estado.aplicada",
  "estado.entrevista",
  "estado.oferta",
  "estado.rechazada",
  "estado.descartada",
  "dashboard.titulo",
  "dashboard.tema_claro",
  "dashboard.tema_oscuro",
  "dashboard.ultima_corrida",
  "dashboard.sin_corridas",
  "dashboard.t_activas",
  "dashboard.t_juzgadas",
  "dashboard.t_pendientes",
  "dashboard.t_shortlist",
  "dashboard.t_nuevas_7d",
  "dashboard.t_en_proceso",
  "dashboard.h_cobertura",
  "dashboard.cobertura_frase",
  "dashboard.h_shortlist",
  "dashboard.h_shortlist_nota",
  "dashboard.filtro_texto",
  "dashboard.filtro_veredicto",
  "dashboard.filtro_estado",
  "dashboard.col_pago_usd",
  "dashboard.col_pago_cop",
  "dashboard.col_pago_declarado",
  "dashboard.bajo_minimo",
  "dashboard.filtro_bajo_minimo",
  "dashboard.minimo_nota",
  "dashboard.pago_sin_cifra",
  "dashboard.ver_evidencia",
  "dashboard.abrir",
  "dashboard.shortlist_vacio",
  "dashboard.mostrando",
  "dashboard.h_pipeline",
  "dashboard.columna_vacia",
  "dashboard.desaparecida",
  "dashboard.h_nuevas",
  "dashboard.sin_juicio",
  "dashboard.nuevas_vacio",
  "dashboard.h_desaparecidas",
  "dashboard.desaparecida_el",
  "dashboard.desaparecidas_vacio",
  "dashboard.pie",
];

export function recogerDatos(db: Db, config: Config, lang: Lang): DatosDashboard {
  const resumen = db.resumen();
  const shortlist: FilaShortlist[] = db.shortlist({ incluirDescartadas: true }).map((f) => {
    const usd = usdMensual(f.juicio);
    return {
      id: f.id,
      empresa: f.empresa,
      titulo: f.titulo,
      url: f.url,
      estado: f.estado,
      primera_vez: f.primera_vez,
      puntaje: f.juicio.ajuste.puntaje,
      veredicto: f.juicio.veredicto,
      elegibilidad: f.juicio.elegibilidad,
      contrato: f.juicio.contrato,
      pago_usd_mes: usd,
      pago_cop_mes: usd === null ? null : Math.round(usd * config.tasa_cop),
      bajo_minimo: usd !== null && !!config.salario_minimo_usd_mes && usd < config.salario_minimo_usd_mes,
      juicio: f.juicio,
    };
  });

  const pipeline: Record<string, FichaPipeline[]> = {};
  for (const f of db.porEstado()) {
    (pipeline[f.estado] ??= []).push({
      id: f.id,
      empresa: f.empresa,
      titulo: f.titulo,
      url: f.url,
      estado: f.estado,
      actualizada_en: f.actualizada_en,
      desaparecida_en: f.desaparecida_en,
    });
  }

  const ultimoVeredicto = db.sql.prepare(
    "SELECT veredicto FROM juicios WHERE vacante_id = ? ORDER BY juzgado_en DESC LIMIT 1",
  );
  const nuevas = db.buscarVacantes({ desdeDias: 7, limite: 200 }).map((v) => ({
    id: v.id,
    empresa: v.empresa,
    titulo: v.titulo,
    ubicacion: v.ubicacion,
    remoto: v.remoto === null ? null : v.remoto === 1,
    pago_declarado: v.pago_declarado,
    url: v.url,
    primera_vez: v.primera_vez,
    veredicto: (ultimoVeredicto.get(v.id) as { veredicto: string } | undefined)?.veredicto ?? null,
  }));

  const desaparecidas = db.sql
    .prepare(
      `SELECT v.id, v.empresa, v.titulo, v.url, v.desaparecida_en, a.estado, a.actualizada_en
       FROM vacantes v JOIN aplicaciones a ON a.vacante_id = v.id
       WHERE v.desaparecida_en IS NOT NULL AND a.estado IN ('aplicada', 'entrevista', 'oferta')
       ORDER BY v.desaparecida_en DESC`,
    )
    .all() as unknown as (FichaPipeline & { desaparecida_en: string })[];

  return {
    generado: new Date().toISOString(),
    lang,
    tasa_cop: config.tasa_cop,
    salario_minimo_usd_mes: config.salario_minimo_usd_mes ?? null,
    resumen,
    ultima_corrida: resumen.ultima_corrida,
    shortlist,
    pipeline,
    nuevas,
    desaparecidas,
  };
}

function leerPlantilla(): string {
  return readFileSync(enRaiz("src", "dashboard", "plantilla.html"), "utf8");
}

function leerLogo(): string {
  try {
    return readFileSync(enRaiz("assets", "logo.svg"), "utf8");
  } catch {
    return "<strong>camello</strong>";
  }
}

/** JSON seguro para incrustar en <script>: evita cerrar la etiqueta y separadores de línea raros. */
function jsonEmbebido(v: unknown): string {
  return JSON.stringify(v).split("<").join("\\u003c").split("\u2028").join("\\u2028").split("\u2029").join("\\u2029");
}

export function generarDashboard(db: Db, config: Config, opciones: { lang: Lang }): { html: string; datos: DatosDashboard } {
  const anterior = getLang();
  setLang(opciones.lang);
  try {
    const datos = recogerDatos(db, config, opciones.lang);
    const textos: Record<string, string> = {};
    for (const k of CLAVES_TEXTOS) textos[k] = t(k);
    const html = leerPlantilla()
      .replace("{{LANG}}", opciones.lang)
      .replace("{{TITULO}}", escaparHtml(t("dashboard.titulo")))
      .replace("{{GENERADO}}", datos.generado)
      .replace("{{LOGO}}", () => leerLogo())
      .replace("{{DATOS}}", () => jsonEmbebido(datos))
      .replace("{{TEXTOS}}", () => jsonEmbebido(textos));
    return { html, datos };
  } finally {
    setLang(anterior);
  }
}

function escaparHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

export function escribirDashboard(html: string, ruta: string): void {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, html, "utf8");
}

/** Abre el archivo con el navegador por defecto. Nunca lanza: si falla, el usuario abre la ruta a mano. */
export function abrirEnNavegador(ruta: string): void {
  try {
    const [cmd, args] =
      process.platform === "win32"
        ? ["cmd", ["/c", "start", "", ruta]]
        : process.platform === "darwin"
          ? ["open", [ruta]]
          : ["xdg-open", [ruta]];
    const hijo = spawn(cmd, args, { detached: true, stdio: "ignore" });
    hijo.on("error", () => undefined);
    hijo.unref();
  } catch {
    /* sin navegador disponible */
  }
}
