import type { VacanteCruda } from "../tipos.js";
import { htmlATexto } from "./html-a-texto.js";
import { obtenerJson } from "./http.js";
import { detectarRemoto } from "./greenhouse.js";

export interface LeverPosting {
  id: string;
  text: string;
  categories?: { commitment?: string; location?: string; team?: string; department?: string; allLocations?: string[] };
  createdAt?: number;
  descriptionPlain?: string;
  description?: string;
  additionalPlain?: string;
  lists?: { text: string; content: string }[];
  salaryRange?: { min?: number; max?: number; currency?: string; interval?: string } | null;
  country?: string;
  workplaceType?: string;
  hostedUrl?: string;
  applyUrl?: string;
}

export function urlFeed(slug: string): string {
  return `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`;
}

export function normalizarLever(slug: string, empresa: string, datos: LeverPosting[], obtenida: string): VacanteCruda[] {
  return (datos ?? []).map((p) => {
    const partes: string[] = [];
    if (p.descriptionPlain) partes.push(p.descriptionPlain);
    else if (p.description) partes.push(htmlATexto(p.description));
    for (const l of p.lists ?? []) partes.push(`${l.text}\n${htmlATexto(l.content)}`);
    if (p.additionalPlain) partes.push(p.additionalPlain);
    const ubicacion = p.categories?.allLocations?.join(", ") || p.categories?.location || null;
    const remoto = p.workplaceType ? p.workplaceType.toLowerCase() === "remote" : detectarRemoto(ubicacion, p.text);
    const sr = p.salaryRange;
    const pago = sr && (sr.min || sr.max) ? `${sr.currency ?? ""} ${sr.min ?? "?"} - ${sr.max ?? "?"} ${sr.interval ?? ""}`.trim() : null;
    return {
      id: `lever:${slug}:${p.id}`,
      fuente: "lever",
      empresa,
      titulo: p.text.trim(),
      ubicacion,
      remoto,
      descripcion_texto: partes.join("\n\n").trim(),
      url: p.hostedUrl ?? p.applyUrl ?? null,
      publicada: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      pago_declarado: pago,
      obtenida,
    };
  });
}

export async function obtener(slug: string, empresa = slug): Promise<VacanteCruda[]> {
  const datos = await obtenerJson<LeverPosting[]>(urlFeed(slug));
  return normalizarLever(slug, empresa, datos, new Date().toISOString());
}
