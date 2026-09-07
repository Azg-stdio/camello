/** Markdown mínimo a HTML para la hoja de vida (sin librería). Cubre lo que usa profile/cv.md. */
import { leerFrontmatter } from "../perfil/index.js";

export function escaparHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(s: string): string {
  let out = escaparHtml(s);
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<em>$2</em>");
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2">$2</a>');
  return out;
}

export function markdownAHtml(md: string): string {
  const lineas = md.replace(/\r/g, "").split("\n");
  const html: string[] = [];
  let enLista = false;
  let parrafo: string[] = [];
  const cerrarParrafo = () => {
    if (parrafo.length) {
      html.push(`<p>${inline(parrafo.join(" "))}</p>`);
      parrafo = [];
    }
  };
  const cerrarLista = () => {
    if (enLista) {
      html.push("</ul>");
      enLista = false;
    }
  };
  for (const linea of lineas) {
    const h = /^(#{1,6})\s+(.*)$/.exec(linea);
    const li = /^\s*[-*]\s+(.*)$/.exec(linea);
    if (h) {
      cerrarParrafo();
      cerrarLista();
      const n = h[1]!.length;
      html.push(`<h${n}>${inline(h[2]!)}</h${n}>`);
    } else if (li) {
      cerrarParrafo();
      if (!enLista) {
        html.push("<ul>");
        enLista = true;
      }
      html.push(`<li>${inline(li[1]!)}</li>`);
    } else if (linea.trim() === "") {
      cerrarParrafo();
      cerrarLista();
    } else {
      cerrarLista();
      parrafo.push(linea.trim());
    }
  }
  cerrarParrafo();
  cerrarLista();
  return html.join("\n");
}

export interface CvParseado {
  datos: Record<string, string>;
  cuerpo: string;
  html: string;
}

export function parsearCv(md: string): CvParseado {
  const { datos, cuerpo } = leerFrontmatter(md);
  return { datos, cuerpo, html: markdownAHtml(cuerpo) };
}
