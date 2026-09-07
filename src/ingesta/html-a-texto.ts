/** HTML a texto plano sin librería: quitar etiquetas, decodificar entidades, colapsar espacios. */

const ENTIDADES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  bull: "•",
  middot: "·",
  eacute: "é",
  aacute: "á",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  ntilde: "ñ",
  copy: "©",
  reg: "®",
  trade: "™",
  euro: "€",
};

export function decodificarEntidades(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (m, nombre: string) => ENTIDADES[nombre.toLowerCase()] ?? m);
}

export function htmlATexto(html: string | null | undefined): string {
  if (!html) return "";
  let s = html;
  // Greenhouse entrega el HTML escapado (&lt;p&gt;): decodificar una vez antes de quitar etiquetas.
  if (!/<[a-z!/]/i.test(s) && /&lt;[a-z]/i.test(s)) s = decodificarEntidades(s);
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|div|li|h[1-6]|tr|section|article|ul|ol|blockquote|pre)>/gi, "\n");
  s = s.replace(/<li[^>]*>/gi, "- ");
  s = s.replace(/<[^>]+>/g, " ");
  s = decodificarEntidades(s);
  s = s.replace(/\r/g, "");
  s = s.replace(/[ \t ]+/g, " ");
  s = s.replace(/ *\n */g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}
