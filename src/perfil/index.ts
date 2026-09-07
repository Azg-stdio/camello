/** Tarea 01 · Perfil y hoja de vida maestra. */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { enRaiz } from "../rutas.js";

export const DIR_PERFIL = "profile";
export const ARCHIVOS = { cv: "cv.md", preferencias: "preferencias.md" } as const;

export const SECCIONES_CV = ["Titular", "Resumen", "Habilidades", "Experiencia", "Educación y certificaciones"];
export const SECCIONES_PREFERENCIAS = [
  "Roles que busco",
  "Roles que no",
  "Stack preferido",
  "Rango salarial mínimo (USD/mes)",
  "Tipo de contrato aceptable",
  "Zona horaria",
  "Idioma de trabajo",
  "Empresas o sectores a evitar",
];
export const FRONTMATTER_CV = ["nombre", "ciudad", "email"];
export const DATOS_SENSIBLES = [/\bc[ée]dula\b/i, /\bedad\s*:/i, /\bestado civil\b/i, /\bfecha de nacimiento\b/i, /\bdate of birth\b/i, /\bmarital status\b/i];

export interface Problema {
  archivo: string;
  clave: string;
  valores?: Record<string, string | number>;
}

export function rutaPerfil(...partes: string[]): string {
  return enRaiz(DIR_PERFIL, ...partes);
}

export function existePerfil(): boolean {
  return existsSync(rutaPerfil(ARCHIVOS.cv)) && existsSync(rutaPerfil(ARCHIVOS.preferencias));
}

/** Copia las plantillas de docs/ejemplos a profile/ si no existen. Devuelve los archivos creados. */
export function iniciarPerfil(): string[] {
  mkdirSync(rutaPerfil("adaptadas"), { recursive: true });
  const creados: string[] = [];
  const pares: [string, string][] = [
    [enRaiz("docs", "ejemplos", "cv.ejemplo.md"), rutaPerfil(ARCHIVOS.cv)],
    [enRaiz("docs", "ejemplos", "preferencias.ejemplo.md"), rutaPerfil(ARCHIVOS.preferencias)],
  ];
  for (const [origen, destino] of pares) {
    if (!existsSync(destino)) {
      copyFileSync(origen, destino);
      creados.push(destino);
    }
  }
  return creados;
}

export function leerFrontmatter(md: string): { datos: Record<string, string>; cuerpo: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(md);
  if (!m) return { datos: {}, cuerpo: md };
  const datos: Record<string, string> = {};
  for (const linea of m[1]!.split(/\r?\n/)) {
    const i = linea.indexOf(":");
    if (i > 0) datos[linea.slice(0, i).trim()] = linea.slice(i + 1).trim();
  }
  return { datos, cuerpo: md.slice(m[0].length) };
}

export function encabezados(md: string, nivel = 1): string[] {
  const re = new RegExp(`^#{${nivel}}\\s+(.+?)\\s*$`, "gm");
  return [...md.matchAll(re)].map((m) => m[1]!.trim());
}

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function validarPerfil(): { ok: boolean; problemas: Problema[]; total: number; correctos: number } {
  const problemas: Problema[] = [];
  const rutaCv = rutaPerfil(ARCHIVOS.cv);
  const rutaPref = rutaPerfil(ARCHIVOS.preferencias);
  let comprobaciones = 0;
  let correctos = 0;
  const comprobar = (cond: boolean, p: Problema) => {
    comprobaciones++;
    if (cond) correctos++;
    else problemas.push(p);
  };

  comprobar(existsSync(rutaCv), { archivo: ARCHIVOS.cv, clave: "perfil.falta_archivo" });
  comprobar(existsSync(rutaPref), { archivo: ARCHIVOS.preferencias, clave: "perfil.falta_archivo" });

  if (existsSync(rutaCv)) {
    const cv = readFileSync(rutaCv, "utf8");
    const { datos, cuerpo } = leerFrontmatter(cv);
    for (const campo of FRONTMATTER_CV) comprobar(!!datos[campo], { archivo: ARCHIVOS.cv, clave: "perfil.falta_frontmatter", valores: { campo } });
    const h1 = encabezados(cuerpo, 1).map(normalizar);
    for (const s of SECCIONES_CV) comprobar(h1.includes(normalizar(s)), { archivo: ARCHIVOS.cv, clave: "perfil.falta_seccion", valores: { seccion: s } });
    comprobar(/^###\s+Banco de logros/im.test(cuerpo), { archivo: ARCHIVOS.cv, clave: "perfil.falta_banco" });
    comprobar(!/\bNombre Apellido\b|correo@ejemplo\.com|Empresa Ejemplo/.test(cv), { archivo: ARCHIVOS.cv, clave: "perfil.es_plantilla" });
    for (const re of DATOS_SENSIBLES) comprobar(!re.test(cv), { archivo: ARCHIVOS.cv, clave: "perfil.dato_sensible", valores: { patron: re.source } });
  }
  if (existsSync(rutaPref)) {
    const pref = readFileSync(rutaPref, "utf8");
    const h2 = encabezados(pref, 2).map(normalizar);
    for (const s of SECCIONES_PREFERENCIAS) comprobar(h2.includes(normalizar(s)), { archivo: ARCHIVOS.preferencias, clave: "perfil.falta_seccion", valores: { seccion: s } });
  }
  return { ok: problemas.length === 0, problemas, total: comprobaciones, correctos };
}

export function leerPerfil(): { cv: string; preferencias: string; rutas: { cv: string; preferencias: string } } {
  const rutas = { cv: rutaPerfil(ARCHIVOS.cv), preferencias: rutaPerfil(ARCHIVOS.preferencias) };
  return {
    cv: existsSync(rutas.cv) ? readFileSync(rutas.cv, "utf8") : "",
    preferencias: existsSync(rutas.preferencias) ? readFileSync(rutas.preferencias, "utf8") : "",
    rutas,
  };
}

export function rutaAdaptadas(): string {
  const r = rutaPerfil("adaptadas");
  mkdirSync(r, { recursive: true });
  return r;
}

export function nombreArchivoSeguro(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1f(),&'!;]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80) || "sin-nombre";
}

export { join };
