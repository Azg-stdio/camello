import { existsSync, readFileSync } from "node:fs";
import { enRaiz } from "./rutas.js";

export interface Config {
  lang: "es" | "en";
  db: string;
  sources: string;
  user_agent: string;
  juicio: { max_por_corrida: number; prioridad: string[] };
  filtro_titulos_excluidos: string[];
  hn: { requiere: string[]; alguna_de: string[] };
  refresh: { cada: string };
  tasa_cop: number;
  /** Expectativa salarial en USD al mes. Solo marca ofertas por debajo; nunca las oculta ni las descarta. */
  salario_minimo_usd_mes?: number;
  obsidian?: { vault: string; carpeta?: string };
}

const DEFAULTS: Config = {
  lang: "es",
  db: "data/camello.db",
  sources: "sources/empresas.json",
  user_agent: "camello/0.1 (+https://github.com/Azg-stdio/camello)",
  juicio: { max_por_corrida: 20, prioridad: [] },
  filtro_titulos_excluidos: [],
  hn: { requiere: ["remote"], alguna_de: ["latam", "latin america", "americas", "colombia", "worldwide", "anywhere"] },
  refresh: { cada: "6h" },
  tasa_cop: 4100,
};

function leerJson(ruta: string): Record<string, unknown> {
  if (!existsSync(ruta)) return {};
  try {
    return JSON.parse(readFileSync(ruta, "utf8")) as Record<string, unknown>;
  } catch (e) {
    throw new Error(`No se pudo leer ${ruta}: ${(e as Error).message}`);
  }
}

function mezclar<T extends Record<string, unknown>>(base: T, extra: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(extra)) {
    const actual = out[k];
    if (v && typeof v === "object" && !Array.isArray(v) && actual && typeof actual === "object" && !Array.isArray(actual)) {
      out[k] = mezclar(actual as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

let cache: Config | undefined;

/** config.json (versionado) + config.local.json (ignorado por git). */
export function cargarConfig(forzar = false): Config {
  if (cache && !forzar) return cache;
  const base = mezclar(DEFAULTS as unknown as Record<string, unknown>, leerJson(enRaiz("config.json")));
  cache = mezclar(base, leerJson(enRaiz("config.local.json"))) as unknown as Config;
  return cache;
}

export function rutaConfigLocal(): string {
  return enRaiz("config.local.json");
}
