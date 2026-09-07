import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { claveVacante, leerFrontmatter, leerPerfil, nombreArchivoSeguro, rutaAdaptadas, type VacanteNombre } from "../../perfil/index.js";
import { enRaiz } from "../../rutas.js";
import { getLang, t } from "../../i18n/index.js";
import type { Comando, Contexto } from "../comun.js";

export interface CvAdaptado {
  carpeta: string | null;
  md: string | null;
  html: string | null;
  pdf: string | null;
  carta: string | null;
  carta_pdf: string | null;
  /** Preparación de la llamada de filtro o entrevista, si el agente ya la escribió. */
  entrevista: string | null;
}

const VACIO: CvAdaptado = { carpeta: null, md: null, html: null, pdf: null, carta: null, carta_pdf: null, entrevista: null };

function masReciente(dir: string, filtro: (nombre: string) => boolean): string | null {
  if (!existsSync(dir)) return null;
  const candidatos = readdirSync(dir)
    .filter((f) => filtro(f.toLowerCase()) && statSync(join(dir, f)).isFile())
    .map((f) => ({ ruta: join(dir, f), mtime: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return candidatos[0]?.ruta ?? null;
}

/**
 * Busca la hoja de vida adaptada para la vacante. Primero en su carpeta (`<empresa>-<clave>-<rol>/`, por la clave
 * del id); si no existe, cae a los archivos planos `<empresa>-<rol>.*` del formato anterior, el más reciente por empresa.
 */
export function adaptadaPara(v: VacanteNombre, base = rutaAdaptadas()): CvAdaptado {
  if (!existsSync(base)) return VACIO;
  const empresa = nombreArchivoSeguro(v.empresa).toLowerCase();
  const clave = claveVacante(v.id);
  const carpeta = readdirSync(base)
    .filter((f) => statSync(join(base, f)).isDirectory() && f.toLowerCase().startsWith(`${empresa}-${clave}-`))
    .map((f) => join(base, f))[0];
  if (carpeta) {
    const esCarta = (f: string) => /carta|coverletter|cover-letter/.test(f);
    const esEntrevista = (f: string) => /entrevista|interview/.test(f);
    const esCv = (f: string) => !esCarta(f) && !esEntrevista(f);
    return {
      carpeta,
      md: masReciente(carpeta, (f) => f.endsWith(".md") && esCv(f)),
      html: masReciente(carpeta, (f) => f.endsWith(".html") && esCv(f)),
      pdf: masReciente(carpeta, (f) => f.endsWith(".pdf") && esCv(f)),
      carta: masReciente(carpeta, (f) => f.endsWith(".md") && esCarta(f)),
      carta_pdf: masReciente(carpeta, (f) => f.endsWith(".pdf") && esCarta(f)),
      entrevista: masReciente(carpeta, (f) => f.endsWith(".md") && esEntrevista(f)),
    };
  }
  const plano = (ext: string, carta: boolean) => masReciente(base, (f) => f.startsWith(empresa) && f.endsWith(ext) && /carta/.test(f) === carta && !/entrevista/.test(f));
  return { carpeta: null, md: plano(".md", false), html: plano(".html", false), pdf: plano(".pdf", false), carta: plano(".md", true), carta_pdf: plano(".pdf", true), entrevista: null };
}

const comando: Comando = {
  nombre: "apply",
  descripcion: "apply.descripcion",
  uso: "camello apply <id> [--cv <archivo>]",
  async ejecutar(ctx: Contexto): Promise<number> {
    const { values, positionals } = ctx.parse({ cv: { type: "string" } });
    const id = positionals[0];
    if (!id) throw new Error(t("show.sin_id"));
    const db = ctx.abrirDb();
    const v = db.vacante(id);
    if (!v) {
      ctx.error(t("show.no_existe", { id }));
      return ctx.terminar(null, { ok: 0, total: 1 }, false);
    }
    const juicio = db.ultimoJuicio(id) ?? null;
    const aplicacion = db.aplicacion(id) ?? null;
    const perfil = leerPerfil();
    const { datos } = leerFrontmatter(perfil.cv);

    let cv = adaptadaPara(v);
    if (values.cv) {
      const ruta = resolve(values.cv);
      if (!existsSync(ruta)) throw new Error(t("profile.import_no_existe", { ruta }));
      cv = ruta.toLowerCase().endsWith(".pdf") ? { ...cv, pdf: ruta } : ruta.toLowerCase().endsWith(".html") ? { ...cv, html: ruta } : { ...cv, md: ruta };
    }

    const candidato = {
      nombre: datos["nombre"] ?? null,
      ciudad: datos["ciudad"] ?? null,
      email: datos["email"] ?? null,
      telefono: datos["telefono"] ?? null,
      linkedin: datos["linkedin"] ?? null,
      github: datos["github"] ?? null,
      idiomas: datos["idiomas"] ?? null,
      disponibilidad: datos["disponibilidad"] ?? null,
    };
    const faltan = Object.entries(candidato)
      .filter(([, val]) => !val)
      .map(([k]) => k);

    ctx.linea(t("apply.titulo", { empresa: v.empresa, titulo: v.titulo }));
    ctx.linea(`  URL: ${v.url ?? "-"}`);
    ctx.linea(`  CV: ${cv.pdf ?? cv.html ?? cv.md ?? t("apply.sin_cv")}`);
    if (!cv.pdf) ctx.linea(t("apply.sugerir_render", { id }));
    ctx.linea(cv.entrevista ? t("apply.entrevista", { ruta: cv.entrevista }) : t("apply.sin_entrevista", { skill: enRaiz("skill", "entrevista.md") }));
    if (faltan.length) ctx.linea(t("apply.faltan_datos", { campos: faltan.join(", ") }));
    if (aplicacion && aplicacion.estado !== "vista" && aplicacion.estado !== "preseleccionada") ctx.linea(t("apply.ya_en_estado", { estado: t(`estado.${aplicacion.estado}`) }));
    ctx.linea("");
    ctx.linea(t("apply.instruccion", { skill: enRaiz("skill", "aplicar.md") }));
    ctx.siguiente(`camello status ${id} aplicada --cv ${cv.pdf ?? cv.md ?? "<archivo>"}`);

    return ctx.terminar(
      {
        vacante: { id: v.id, empresa: v.empresa, titulo: v.titulo, url: v.url, ubicacion: v.ubicacion, fuente: v.fuente, descripcion_texto: v.descripcion_texto },
        juicio: juicio ? { veredicto: juicio.veredicto, elegibilidad: juicio.elegibilidad, contrato: juicio.contrato, pago: juicio.pago, fortalezas: juicio.ajuste.fortalezas, brechas: juicio.ajuste.brechas, idioma_requerido: juicio.idioma_requerido } : null,
        estado_actual: aplicacion?.estado ?? "vista",
        candidato,
        faltan_en_perfil: faltan,
        cv,
        perfil: perfil.rutas,
        salario_minimo_usd_mes: ctx.config.salario_minimo_usd_mes ?? null,
        idioma: getLang(),
        reglas: enRaiz("skill", "aplicar.md"),
        reglas_entrevista: enRaiz("skill", "entrevista.md"),
        al_terminar: `camello status ${id} aplicada --cv ${cv.pdf ?? cv.md ?? "<archivo>"}`,
      },
      { ok: cv.pdf ? 1 : 0, total: 1 },
    );
  },
};

export default comando;
