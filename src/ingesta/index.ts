/**
 * Tarea 03 · Ingesta de feeds ATS. Un módulo por ATS, todos exportan `obtener(slug)`.
 * Un feed que falla no detiene la corrida; se reporta como fracción.
 */
import { readFileSync } from "node:fs";
import type { Ats, Empresa, VacanteCruda } from "../tipos.js";
import { enRaiz } from "../rutas.js";
import { t } from "../i18n/index.js";
import * as greenhouse from "./greenhouse.js";
import * as lever from "./lever.js";
import * as ashby from "./ashby.js";

export const ATS: Record<Ats, { obtener: (slug: string, empresa?: string) => Promise<VacanteCruda[]>; urlFeed: (slug: string) => string }> = {
  greenhouse,
  lever,
  ashby,
};

export function leerEmpresas(ruta = "sources/empresas.json"): Empresa[] {
  const lista = JSON.parse(readFileSync(enRaiz(ruta), "utf8")) as Empresa[];
  if (!Array.isArray(lista)) throw new Error(`${ruta} debe ser una lista`);
  for (const e of lista) {
    if (!e.nombre || !e.ats || !e.slug) throw new Error(t("ingesta.empresa_invalida", { ruta, empresa: JSON.stringify(e) }));
    if (!(e.ats in ATS)) throw new Error(t("ingesta.ats_desconocido", { ats: e.ats, empresa: e.nombre }));
  }
  return lista;
}

export interface ResultadoEmpresa {
  empresa: Empresa;
  ok: boolean;
  vacantes: VacanteCruda[];
  error?: string;
  ms: number;
}

export async function leerEmpresa(e: Empresa): Promise<ResultadoEmpresa> {
  const inicio = Date.now();
  try {
    const vacantes = await ATS[e.ats].obtener(e.slug, e.nombre);
    return { empresa: e, ok: true, vacantes, ms: Date.now() - inicio };
  } catch (err) {
    return { empresa: e, ok: false, vacantes: [], error: (err as Error).message, ms: Date.now() - inicio };
  }
}

/** Lee todas las empresas con concurrencia limitada. Llama `alTerminar` por cada una. */
export async function leerTodas(empresas: Empresa[], concurrencia = 5, alTerminar?: (r: ResultadoEmpresa) => void): Promise<ResultadoEmpresa[]> {
  const resultados: ResultadoEmpresa[] = [];
  let i = 0;
  const trabajador = async () => {
    while (i < empresas.length) {
      const e = empresas[i++]!;
      const r = await leerEmpresa(e);
      resultados.push(r);
      alTerminar?.(r);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrencia, empresas.length) }, trabajador));
  return resultados;
}

/** Filtro previo barato: descarta títulos claramente no técnicos. */
export function filtrarTitulos(vacantes: VacanteCruda[], excluidos: string[]): { conservadas: VacanteCruda[]; descartadas: number } {
  const patrones = excluidos.map((p) => p.toLowerCase());
  const conservadas = vacantes.filter((v) => {
    const t = ` ${v.titulo.toLowerCase()} `;
    return !patrones.some((p) => t.includes(p));
  });
  return { conservadas, descartadas: vacantes.length - conservadas.length };
}

export function prefijoEmpresa(e: Empresa): string {
  return `${e.ats}:${e.slug}:`;
}
