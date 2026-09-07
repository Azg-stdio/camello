import type { VacanteCruda } from "../tipos.js";
import { htmlATexto } from "./html-a-texto.js";
import { obtenerJson } from "./http.js";
import { detectarRemoto } from "./greenhouse.js";

export interface AshbyJob {
  id: string;
  title: string;
  location?: string;
  secondaryLocations?: { location?: string }[];
  publishedAt?: string;
  isListed?: boolean;
  isRemote?: boolean;
  workplaceType?: string;
  jobUrl?: string;
  applyUrl?: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
  employmentType?: string;
  compensation?: {
    compensationTierSummary?: string | null;
    scrapeableCompensationSalarySummary?: string | null;
  } | null;
}

export interface AshbyRespuesta {
  jobs: AshbyJob[];
}

export function urlFeed(slug: string): string {
  return `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}?includeCompensation=true`;
}

export function normalizarAshby(slug: string, empresa: string, datos: AshbyRespuesta, obtenida: string): VacanteCruda[] {
  return (datos.jobs ?? [])
    .filter((j) => j.isListed !== false)
    .map((j) => {
      const secundarias = (j.secondaryLocations ?? []).map((s) => s.location).filter(Boolean) as string[];
      const ubicacion = [j.location, ...secundarias].filter(Boolean).join(", ") || null;
      const remoto = typeof j.isRemote === "boolean" ? j.isRemote : detectarRemoto(ubicacion, j.workplaceType, j.title);
      const texto = j.descriptionPlain?.trim() || htmlATexto(j.descriptionHtml ?? "");
      const pago = j.compensation?.compensationTierSummary || j.compensation?.scrapeableCompensationSalarySummary || null;
      return {
        id: `ashby:${slug}:${j.id}`,
        fuente: "ashby",
        empresa,
        titulo: j.title.trim(),
        ubicacion,
        remoto,
        descripcion_texto: texto,
        url: j.jobUrl ?? j.applyUrl ?? null,
        publicada: j.publishedAt ?? null,
        pago_declarado: pago,
        obtenida,
      };
    });
}

export async function obtener(slug: string, empresa = slug): Promise<VacanteCruda[]> {
  const datos = await obtenerJson<AshbyRespuesta>(urlFeed(slug));
  return normalizarAshby(slug, empresa, datos, new Date().toISOString());
}
