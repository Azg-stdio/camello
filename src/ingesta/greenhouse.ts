import type { VacanteCruda } from "../tipos.js";
import { htmlATexto } from "./html-a-texto.js";
import { obtenerJson } from "./http.js";

export interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url?: string;
  location?: { name?: string } | null;
  offices?: { name?: string }[];
  content?: string;
  first_published?: string | null;
  updated_at?: string | null;
  company_name?: string;
  metadata?: { name?: string; value?: unknown }[] | null;
}

export interface GreenhouseRespuesta {
  jobs: GreenhouseJob[];
}

export function urlFeed(slug: string): string {
  return `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`;
}

export function detectarRemoto(...textos: (string | null | undefined)[]): boolean | null {
  const s = textos.filter(Boolean).join(" ").toLowerCase();
  if (!s) return null;
  if (/\bremote\b|\bremoto\b|\banywhere\b|\bwork from home\b|\bwfh\b|\bdistributed\b/.test(s)) return true;
  if (/\bon-?site\b|\bin-?office\b|\bhybrid\b|\bpresencial\b/.test(s)) return false;
  return null;
}

export function normalizarGreenhouse(slug: string, empresa: string, datos: GreenhouseRespuesta, obtenida: string): VacanteCruda[] {
  return (datos.jobs ?? []).map((j) => {
    const ubicacion = j.location?.name?.trim() || j.offices?.map((o) => o.name).filter(Boolean).join(", ") || null;
    const texto = htmlATexto(j.content ?? "");
    const pago = j.metadata?.find((m) => /salary|compensation|pay/i.test(m.name ?? "") && m.value);
    return {
      id: `greenhouse:${slug}:${j.id}`,
      fuente: "greenhouse",
      empresa: j.company_name?.trim() || empresa,
      titulo: j.title.trim(),
      ubicacion,
      remoto: detectarRemoto(ubicacion, j.title),
      descripcion_texto: texto,
      url: j.absolute_url ?? null,
      publicada: j.first_published ?? j.updated_at ?? null,
      pago_declarado: pago ? String(pago.value) : null,
      obtenida,
    };
  });
}

export async function obtener(slug: string, empresa = slug): Promise<VacanteCruda[]> {
  const datos = await obtenerJson<GreenhouseRespuesta>(urlFeed(slug));
  return normalizarGreenhouse(slug, empresa, datos, new Date().toISOString());
}
