import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export type Lang = "es" | "en";

type Diccionario = Record<string, string>;

const aqui = dirname(fileURLToPath(import.meta.url));

function cargar(lang: Lang): Diccionario {
  // Compilado vive en dist/src/i18n; los JSON quedan en src/i18n.
  const candidatos = [join(aqui, `${lang}.json`), join(aqui, "..", "..", "..", "src", "i18n", `${lang}.json`)];
  for (const ruta of candidatos) {
    try {
      return JSON.parse(readFileSync(ruta, "utf8")) as Diccionario;
    } catch {
      /* siguiente candidato */
    }
  }
  return {};
}

const cache: Partial<Record<Lang, Diccionario>> = {};
let actual: Lang = "es";
let verbose = false;
const faltantes = new Set<string>();

export function setLang(lang: string | undefined): Lang {
  actual = lang === "en" ? "en" : "es";
  return actual;
}

export function getLang(): Lang {
  return actual;
}

export function setVerbose(v: boolean): void {
  verbose = v;
}

function dic(lang: Lang): Diccionario {
  return (cache[lang] ??= cargar(lang));
}

/** Traduce una clave con interpolación `{nombre}`. Clave faltante en `en` cae a `es`. */
export function t(clave: string, valores: Record<string, string | number> = {}): string {
  let texto = dic(actual)[clave];
  if (texto === undefined && actual !== "es") {
    texto = dic("es")[clave];
    if (verbose && !faltantes.has(clave)) {
      faltantes.add(clave);
      process.stderr.write(`[i18n] falta '${clave}' en ${actual}\n`);
    }
  }
  if (texto === undefined) return clave;
  return texto.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = valores[k];
    return v === undefined ? `{${k}}` : String(v);
  });
}

/** Plural simple: `clave.uno` si n === 1, `clave.muchos` en otro caso. */
export function tn(clave: string, n: number, valores: Record<string, string | number> = {}): string {
  return t(n === 1 ? `${clave}.uno` : `${clave}.muchos`, { n: numero(n), ...valores });
}

export function locale(): string {
  return actual === "en" ? "en-US" : "es-CO";
}

export function numero(n: number, opciones: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(locale(), opciones).format(n);
}

export function moneda(n: number, divisa: "USD" | "COP"): string {
  return new Intl.NumberFormat(locale(), { style: "currency", currency: divisa, maximumFractionDigits: 0 }).format(n);
}

export function fecha(iso: string | null | undefined, opciones: Intl.DateTimeFormatOptions = { dateStyle: "medium" }): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale(), opciones).format(d);
}

/** "38/40": fracción sin simplificar, siempre lo que sí llegó primero. */
export function fraccion(ok: number, total: number): string {
  return `${numero(ok)}/${numero(total)}`;
}
