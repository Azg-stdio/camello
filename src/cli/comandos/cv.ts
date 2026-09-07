import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { archivosAdaptada, leerFrontmatter, leerPerfil, nombrePdfCandidato } from "../../perfil/index.js";
import { enRaiz } from "../../rutas.js";
import { diffCv, palabrasClave } from "../../cv/analisis.js";
import { escribirHtml, renderizarCv } from "../../cv/render.js";
import { htmlAPdf } from "../../cv/pdf.js";
import { fraccion, numero, t } from "../../i18n/index.js";
import { recortar, type Comando, type Contexto } from "../comun.js";

export function abrir(ruta: string): void {
  try {
    const p =
      process.platform === "win32"
        ? spawn("cmd", ["/c", "start", "", ruta], { detached: true, stdio: "ignore", windowsHide: true })
        : spawn(process.platform === "darwin" ? "open" : "xdg-open", [ruta], { detached: true, stdio: "ignore" });
    p.on("error", () => undefined);
    p.unref();
  } catch {
    /* abrir el navegador nunca rompe el comando */
  }
}

const comando: Comando = {
  nombre: "cv",
  descripcion: "cv.descripcion",
  uso: "camello cv tailor <id> | render <archivo.md> [--a4] [--no-pdf] [--no-open] | diff <archivo.md> [--id <id>]",
  async ejecutar(ctx: Contexto): Promise<number> {
    const { values, positionals } = ctx.parse({ a4: { type: "boolean" }, "no-open": { type: "boolean" }, "no-pdf": { type: "boolean" }, out: { type: "string" }, id: { type: "string" } });
    const sub = positionals[0];

    if (sub === "tailor") {
      const id = positionals[1];
      if (!id) throw new Error(t("show.sin_id"));
      const db = ctx.abrirDb();
      const v = db.vacante(id);
      if (!v) {
        ctx.error(t("show.no_existe", { id }));
        return ctx.terminar(null, { ok: 0, total: 1 }, false);
      }
      const juicio = db.ultimoJuicio(id) ?? null;
      const perfil = leerPerfil();
      const claves = palabrasClave(`${v.titulo}\n${v.descripcion_texto}`);
      const nombreCandidato = leerFrontmatter(perfil.cv).datos["nombre"] ?? "";
      const archivos = archivosAdaptada(v, nombreCandidato, ctx.config.cv?.nombre_pdf);
      mkdirSync(archivos.carpeta, { recursive: true });
      const destino = archivos.md;
      const idioma = /[¿ñáéíóú]|\b(el|la|los|las|para|con|desarrollador|experiencia)\b/i.test(v.descripcion_texto.slice(0, 2000)) && !/\b(the|and|with|experience|you will)\b/i.test(v.descripcion_texto.slice(0, 2000)) ? "es" : "en";
      ctx.linea(t("cv.tailor_titulo", { empresa: v.empresa, titulo: v.titulo }));
      ctx.linea(t("cv.tailor_claves", { claves: claves.slice(0, 15).map((k) => k.termino).join(", ") || "-" }));
      if (juicio) {
        ctx.linea(t("cv.tailor_fortalezas", { n: numero(juicio.ajuste.fortalezas.length) }) + juicio.ajuste.fortalezas.map((f) => `\n  + ${f}`).join(""));
        ctx.linea(t("cv.tailor_brechas", { n: numero(juicio.ajuste.brechas.length) }) + juicio.ajuste.brechas.map((b) => `\n  - ${b}`).join(""));
      } else {
        ctx.linea(t("cv.tailor_sin_juicio"));
      }
      ctx.linea("");
      ctx.linea(t("cv.tailor_instruccion", { reglas: enRaiz("skill", "cv.md"), maestra: perfil.rutas.cv, destino, idioma }));
      ctx.siguiente(`camello cv diff ${destino}`);
      return ctx.terminar({
        vacante: { id: v.id, empresa: v.empresa, titulo: v.titulo, url: v.url, ubicacion: v.ubicacion, descripcion_texto: v.descripcion_texto },
        juicio,
        palabras_clave: claves,
        idioma_vacante: idioma,
        perfil: perfil.rutas,
        reglas: enRaiz("skill", "cv.md"),
        salida: destino,
        archivos,
        siguiente: [`camello cv diff ${destino} --id ${id}`, `camello cv render ${destino}`, `camello status ${id} aplicada --cv ${archivos.pdf}`],
      });
    }

    if (sub === "render") {
      const archivo = positionals[1];
      if (!archivo) throw new Error(t("cv.sin_archivo"));
      const ruta = resolve(archivo);
      if (!existsSync(ruta)) throw new Error(t("profile.import_no_existe", { ruta }));
      const md = readFileSync(ruta, "utf8");
      const { datos } = leerFrontmatter(md);
      const tipo = /carta|cover/i.test(basename(ruta)) || /^carta/i.test(datos["tipo"] ?? "") ? "carta" : "cv";
      const html = renderizarCv(md, { pagina: values.a4 ? "A4" : "letter", archivo: ruta, tipo });
      const salida = values.out ? resolve(values.out) : ruta.replace(/\.md$/i, "") + ".html";
      escribirHtml(salida, html);
      ctx.linea(t("cv.render_listo", { ruta: salida }));
      let pdf: string | null = null;
      if (!values["no-pdf"]) {
        // El PDF es lo único que sale de la máquina: lleva el nombre del candidato, nunca el de la empresa.
        const nombreCandidato = datos["nombre"] ?? leerFrontmatter(leerPerfil().cv).datos["nombre"] ?? "";
        const rutaPdf = nombreCandidato ? join(dirname(salida), nombrePdfCandidato(nombreCandidato, tipo === "carta" ? "CoverLetter" : "CV", ctx.config.cv?.nombre_pdf)) : salida.replace(/\.html?$/i, "") + ".pdf";
        const r = htmlAPdf(salida, rutaPdf);
        if (r.ok) {
          pdf = rutaPdf;
          ctx.linea(t("cv.pdf_listo", { ruta: rutaPdf }));
        } else {
          ctx.linea(t(r.navegador ? "cv.pdf_fallo" : "cv.pdf_sin_navegador", { error: r.error ?? "" }));
        }
      }
      if (!values["no-open"]) abrir(pdf ?? salida);
      ctx.siguiente(`camello cv diff ${ruta}`);
      return ctx.terminar({ entrada: ruta, salida, pdf });
    }

    if (sub === "diff") {
      const archivo = positionals[1];
      if (!archivo) throw new Error(t("cv.sin_archivo"));
      const ruta = resolve(archivo);
      if (!existsSync(ruta)) throw new Error(t("profile.import_no_existe", { ruta }));
      const perfil = leerPerfil();
      if (!perfil.cv) throw new Error(t("cv.sin_maestra", { ruta: perfil.rutas.cv }));
      let textoVacante = "";
      if (values.id) {
        const v = ctx.abrirDb().vacante(values.id);
        if (v) textoVacante = `${v.titulo}\n${v.descripcion_texto}`;
      }
      const r = diffCv(perfil.cv, readFileSync(ruta, "utf8"), textoVacante);
      ctx.linea(t("cv.diff_logros", { fraccion: fraccion(r.escogidos.length, r.logros_adaptada), maestra: numero(r.logros_maestra) }));
      for (const e of r.escogidos) ctx.linea(`  = ${recortar(e.adaptada, 90)}${e.similitud < 0.9 ? `  (~${Math.round(e.similitud * 100)}%)` : ""}`);
      if (r.sin_respaldo.length) {
        ctx.linea(t("cv.diff_sin_respaldo", { n: numero(r.sin_respaldo.length) }));
        for (const s of r.sin_respaldo) ctx.linea(`  ! ${recortar(s, 100)}`);
      } else {
        ctx.linea(t("cv.diff_todo_respaldado"));
      }
      if (r.palabras_clave.length) {
        ctx.linea(t("cv.diff_claves", { fraccion: fraccion(r.cubiertas, r.palabras_clave.length) }));
        ctx.linea("  " + r.palabras_clave.map((p) => `${p.en_adaptada > 0 ? "+" : "-"}${p.termino}`).join("  "));
      }
      ctx.siguiente(`camello cv render ${ruta}`);
      return ctx.terminar(r, { ok: r.escogidos.length, total: r.logros_adaptada }, r.sin_respaldo.length === 0);
    }

    throw new Error(t("comun.subcomando_desconocido", { comando: "cv", sub: sub ?? "" }));
  },
};

export default comando;
