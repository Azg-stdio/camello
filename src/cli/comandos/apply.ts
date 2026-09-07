import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { leerFrontmatter, leerPerfil, nombreArchivoSeguro, rutaAdaptadas } from "../../perfil/index.js";
import { enRaiz } from "../../rutas.js";
import { getLang, t } from "../../i18n/index.js";
import type { Comando, Contexto } from "../comun.js";

/** Busca la hoja de vida adaptada más reciente para la empresa: primero PDF, luego HTML, luego Markdown. */
export function adaptadaPara(empresa: string): { md: string | null; html: string | null; pdf: string | null } {
  const dir = rutaAdaptadas();
  const prefijo = nombreArchivoSeguro(empresa).toLowerCase();
  const archivos = readdirSync(dir)
    .filter((f) => f.toLowerCase().startsWith(prefijo))
    .map((f) => ({ ruta: join(dir, f), mtime: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  const buscar = (ext: string) => archivos.find((a) => a.ruta.toLowerCase().endsWith(ext))?.ruta ?? null;
  return { md: buscar(".md"), html: buscar(".html"), pdf: buscar(".pdf") };
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

    let cv = adaptadaPara(v.empresa);
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
    if (faltan.length) ctx.linea(t("apply.faltan_datos", { campos: faltan.join(", ") }));
    if (aplicacion && aplicacion.estado !== "vista" && aplicacion.estado !== "preseleccionada") ctx.linea(t("apply.ya_en_estado", { estado: t(`estado.${aplicacion.estado}`) }));
    ctx.linea("");
    ctx.linea(t("apply.instruccion", { skill: enRaiz("skill", "aplicar.md") }));
    ctx.siguiente(`camello status ${id} aplicada --cv ${cv.pdf ?? cv.md ?? "<archivo>"}`);

    return ctx.terminar(
      {
        vacante: { id: v.id, empresa: v.empresa, titulo: v.titulo, url: v.url, ubicacion: v.ubicacion, fuente: v.fuente },
        juicio: juicio ? { veredicto: juicio.veredicto, elegibilidad: juicio.elegibilidad, contrato: juicio.contrato, pago: juicio.pago, fortalezas: juicio.ajuste.fortalezas, brechas: juicio.ajuste.brechas, idioma_requerido: juicio.idioma_requerido } : null,
        estado_actual: aplicacion?.estado ?? "vista",
        candidato,
        faltan_en_perfil: faltan,
        cv,
        perfil: perfil.rutas,
        salario_minimo_usd_mes: ctx.config.salario_minimo_usd_mes ?? null,
        idioma: getLang(),
        reglas: enRaiz("skill", "aplicar.md"),
        al_terminar: `camello status ${id} aplicada --cv ${cv.pdf ?? cv.md ?? "<archivo>"}`,
      },
      { ok: cv.pdf ? 1 : 0, total: 1 },
    );
  },
};

export default comando;
