/**
 * Tarea 04 · Hacker News "Who is hiring". API pública de Firebase + búsqueda en Algolia.
 */
import type { VacanteCruda } from "../tipos.js";
import { htmlATexto } from "./html-a-texto.js";
import { obtenerJson } from "./http.js";
import { t } from "../i18n/index.js";

export interface HnItem {
  id: number;
  type?: string;
  by?: string;
  time?: number;
  text?: string;
  parent?: number;
  kids?: number[];
  title?: string;
  deleted?: boolean;
  dead?: boolean;
}

interface AlgoliaHit {
  objectID: string;
  title: string;
  created_at: string;
}

export const FUENTE = "hn";

/** Encuentra el hilo "Who is hiring?" más reciente. */
export async function hiloDelMes(): Promise<{ id: number; titulo: string; mes: string }> {
  const url = 'https://hn.algolia.com/api/v1/search_by_date?query="Who is hiring"&tags=story,author_whoishiring&hitsPerPage=10';
  const r = await obtenerJson<{ hits: AlgoliaHit[] }>(url);
  const hit = r.hits.find((h) => /who is hiring\?/i.test(h.title));
  if (!hit) throw new Error(t("hn.sin_hilo"));
  return { id: Number(hit.objectID), titulo: hit.title, mes: hit.created_at.slice(0, 7) };
}

export async function item(id: number): Promise<HnItem | null> {
  return obtenerJson<HnItem | null>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
}

/** Descarga comentarios de primer nivel con concurrencia limitada. */
export async function comentariosDePrimerNivel(hiloId: number, concurrencia = 5, limite?: number): Promise<{ hilo: HnItem; comentarios: HnItem[] }> {
  const hilo = await item(hiloId);
  if (!hilo) throw new Error(`Hilo ${hiloId} no existe`);
  const ids = (hilo.kids ?? []).slice(0, limite ?? undefined);
  const comentarios: HnItem[] = [];
  let i = 0;
  const trabajador = async () => {
    while (i < ids.length) {
      const id = ids[i++]!;
      try {
        const c = await item(id);
        if (c && !c.deleted && !c.dead && c.parent === hiloId && c.text) comentarios.push(c);
      } catch {
        /* un comentario que falla no detiene la corrida */
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrencia, ids.length) }, trabajador));
  return { hilo, comentarios };
}

export function pasaFiltro(texto: string, requiere: string[], algunaDe: string[]): boolean {
  const s = texto.toLowerCase();
  const tieneTodas = requiere.every((p) => s.includes(p.toLowerCase()));
  if (!tieneTodas) return false;
  return algunaDe.some((p) => {
    const q = p.toLowerCase();
    // Palabras cortas (est, cst, pst) se buscan como palabra completa para evitar "best", "test".
    return q.length <= 4 ? new RegExp(`\\b${q.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`).test(s) : s.includes(q);
  });
}

/** Convención de HN: "Empresa | Rol | Ubicación | ...". */
export function extraerEmpresaYTitulo(texto: string): { empresa: string; titulo: string } {
  const primera = texto.split("\n")[0] ?? "";
  const partes = primera.split("|").map((p) => p.trim()).filter(Boolean);
  const empresa = (partes[0] ?? "HN").replace(/\s*\(.*?\)\s*$/, "").slice(0, 80) || "HN";
  const titulo = (partes.length > 1 ? partes.slice(1, 4).join(" · ") : primera).slice(0, 160) || "Who is hiring";
  return { empresa, titulo };
}

export function normalizarComentario(mes: string, c: HnItem, obtenida: string): VacanteCruda {
  const texto = htmlATexto(c.text ?? "");
  const { empresa, titulo } = extraerEmpresaYTitulo(texto);
  const lower = texto.toLowerCase();
  return {
    id: `hn:${mes}:${c.id}`,
    fuente: FUENTE,
    empresa,
    titulo,
    ubicacion: null,
    remoto: /\bremote\b/.test(lower) ? true : /\bonsite\b|\bon-site\b/.test(lower) ? false : null,
    descripcion_texto: texto,
    url: `https://news.ycombinator.com/item?id=${c.id}`,
    publicada: c.time ? new Date(c.time * 1000).toISOString() : null,
    pago_declarado: null,
    obtenida,
  };
}

export interface ResultadoHn {
  hiloId: number;
  mes: string;
  titulo: string;
  comentarios: number;
  conservados: number;
  vacantes: VacanteCruda[];
}

export async function obtener(requiere: string[], algunaDe: string[], limite?: number): Promise<ResultadoHn> {
  const hilo = await hiloDelMes();
  const { comentarios } = await comentariosDePrimerNivel(hilo.id, 5, limite);
  const obtenida = new Date().toISOString();
  const vacantes = comentarios
    .map((c) => normalizarComentario(hilo.mes, c, obtenida))
    .filter((v) => pasaFiltro(v.descripcion_texto, requiere, algunaDe));
  return { hiloId: hilo.id, mes: hilo.mes, titulo: hilo.titulo, comentarios: comentarios.length, conservados: vacantes.length, vacantes };
}
