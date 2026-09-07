/** Tarea 13 · `camello cv render`: Markdown adaptado a HTML listo para imprimir a PDF desde el navegador. */
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { enRaiz } from "../rutas.js";
import { getLang, t } from "../i18n/index.js";
import { escaparHtml, markdownAHtml, parsearCv } from "./markdown.js";

function plantilla(): string {
  const aqui = dirname(fileURLToPath(import.meta.url));
  for (const ruta of [join(aqui, "plantilla.html"), enRaiz("src", "cv", "plantilla.html")]) {
    try {
      return readFileSync(ruta, "utf8");
    } catch {
      /* siguiente */
    }
  }
  throw new Error("plantilla.html");
}

/** Encabezados de sección de la maestra (fijos en español) y su versión en inglés para hojas de vida en inglés. */
const SECCIONES_EN: Record<string, string> = {
  resumen: "Summary",
  habilidades: "Skills",
  experiencia: "Experience",
  "educacion y certificaciones": "Education and certifications",
  "proyectos y comunidad": "Projects and community",
};

function clave(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/**
 * Prepara el cuerpo para imprimir: el "# Titular" pasa a ser el subtítulo del encabezado y, si el documento
 * está en inglés (`idioma_documento: en` en el frontmatter), los encabezados de sección se traducen.
 */
export function prepararCuerpo(cuerpo: string, idioma: string): { titular: string; cuerpo: string } {
  let titular = "";
  const lineas = cuerpo.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i]!;
    const h1 = /^#\s+(.+?)\s*$/.exec(l);
    if (h1 && clave(h1[1]!) === "titular") {
      // Toma la primera línea no vacía como titular y salta hasta el siguiente encabezado.
      let j = i + 1;
      while (j < lineas.length && !/^#\s/.test(lineas[j]!)) {
        if (!titular && lineas[j]!.trim()) titular = lineas[j]!.trim();
        j++;
      }
      i = j - 1;
      continue;
    }
    if (h1 && idioma === "en") {
      const en = SECCIONES_EN[clave(h1[1]!)];
      out.push(en ? `# ${en}` : l);
      continue;
    }
    out.push(l);
  }
  return { titular, cuerpo: out.join("\n") };
}

export function renderizarCv(md: string, opciones: { pagina?: "letter" | "A4"; archivo?: string } = {}): string {
  const bruto = parsearCv(md);
  const d = bruto.datos;
  const idioma = (d["idioma_documento"] ?? d["lang"] ?? getLang()).toLowerCase().startsWith("en") ? "en" : "es";
  const preparado = prepararCuerpo(bruto.cuerpo, idioma);
  const cv = { ...bruto, html: markdownAHtml(preparado.cuerpo) };
  const contacto = [d["ciudad"], d["email"], d["telefono"], d["linkedin"], d["github"], d["web"]]
    .filter(Boolean)
    .map((v) => (/^https?:\/\//.test(v!) ? `<a href="${escaparHtml(v!)}">${escaparHtml(v!.replace(/^https?:\/\/(www\.)?/, ""))}</a>` : escaparHtml(v!)))
    .join(" · ");
  return plantilla()
    .replace("{{LANG}}", idioma)
    .replace("{{TITULO}}", escaparHtml(d["nombre"] ? `${d["nombre"]} · CV` : "CV"))
    .replace("{{PAGINA}}", opciones.pagina ?? "letter")
    .replace("{{NOMBRE}}", escaparHtml(d["nombre"] ?? ""))
    .replace("{{TITULAR}}", escaparHtml(preparado.titular))
    .replace("{{CONTACTO}}", contacto)
    .replace("{{AVISO_IMPRIMIR}}", escaparHtml(t("cv.aviso_imprimir")))
    .replace("{{BOTON_IMPRIMIR}}", escaparHtml(t("cv.boton_imprimir")))
    .replace("{{ARCHIVO}}", escaparHtml(opciones.archivo ? basename(opciones.archivo) : ""))
    .replace("{{CUERPO}}", cv.html);
}

export function escribirHtml(ruta: string, html: string): void {
  writeFileSync(ruta, html, "utf8");
}
