/**
 * Tarea 00 · Esquema de juicio (v1). Contrato central del proyecto.
 * Validación propia, sin librería de schemas. Los mensajes pasan por i18n (tarea 14).
 */
import { t } from "../i18n/index.js";

export const ELEGIBILIDAD = ["abierta", "probable", "improbable", "cerrada", "desconocida"] as const;
export const ALCANCE = ["global", "latam", "americas", "us_only", "eu_only", "otro", "desconocido"] as const;
export const CONTRATO = ["contratista", "empleado_eor", "empleado_local", "desconocido"] as const;
export const PERIODO = ["mensual", "anual", "hora"] as const;
export const AJUSTADO_A = ["us", "latam", "desconocido"] as const;
export const SENIORITY = ["junior", "mid", "senior", "lead", "staff", "desconocido"] as const;
export const ZONA_HORARIA = ["compatible", "parcial", "incompatible", "desconocida"] as const;
export const IDIOMA = ["en", "es", "ambos", "desconocido"] as const;
export const VEREDICTO = ["aplicar", "considerar", "descartar"] as const;
export const JUZGADO_POR = ["claude-code", "cursor", "manual", "otro"] as const;

export type Elegibilidad = (typeof ELEGIBILIDAD)[number];
export type Alcance = (typeof ALCANCE)[number];
export type Contrato = (typeof CONTRATO)[number];
export type Periodo = (typeof PERIODO)[number];
export type AjustadoA = (typeof AJUSTADO_A)[number];
export type Seniority = (typeof SENIORITY)[number];
export type ZonaHoraria = (typeof ZONA_HORARIA)[number];
export type Idioma = (typeof IDIOMA)[number];
export type Veredicto = (typeof VEREDICTO)[number];
export type JuzgadoPor = (typeof JUZGADO_POR)[number];

export interface Pago {
  min: number | null;
  max: number | null;
  moneda: string;
  periodo: Periodo;
  ajustado_a: AjustadoA;
  evidencia: string | null;
}

export interface Ajuste {
  puntaje: number;
  fortalezas: string[];
  brechas: string[];
}

export interface Juicio {
  version: 1;
  vacante_id: string;
  elegibilidad: Elegibilidad;
  evidencia_elegibilidad: string | null;
  alcance_geografico: Alcance;
  contrato: Contrato;
  pago: Pago;
  seniority: Seniority;
  zona_horaria: ZonaHoraria;
  idioma_requerido: Idioma;
  ajuste: Ajuste;
  veredicto: Veredicto;
  resumen: string;
  juzgado_en: string;
  juzgado_por: JuzgadoPor;
}

export class ErrorValidacion extends Error {
  readonly motivo: string;
  constructor(
    public readonly campo: string,
    public readonly clave: string,
    public readonly valores: Record<string, string | number> = {},
  ) {
    const motivo = t(clave, valores);
    super(`${campo}: ${motivo}`);
    this.name = "ErrorValidacion";
    this.motivo = motivo;
  }
}

export const MAX_EVIDENCIA = 300;

type Obj = Record<string, unknown>;

function esObjeto(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function enumerado<T extends readonly string[]>(obj: Obj, campo: string, valores: T): T[number] {
  const v = obj[campo];
  if (v === undefined) throw new ErrorValidacion(campo, "esquema.faltante");
  if (typeof v !== "string" || !(valores as readonly string[]).includes(v)) {
    throw new ErrorValidacion(campo, "esquema.fuera_de_enum", { valor: String(v), valores: valores.join(" | ") });
  }
  return v as T[number];
}

function cadena(obj: Obj, campo: string, opciones: { nulo?: boolean; max?: number } = {}): string | null {
  const v = obj[campo];
  if (v === undefined) throw new ErrorValidacion(campo, "esquema.faltante");
  if (v === null) {
    if (opciones.nulo) return null;
    throw new ErrorValidacion(campo, "esquema.no_null");
  }
  if (typeof v !== "string") throw new ErrorValidacion(campo, "esquema.texto");
  if (v.trim() === "") throw new ErrorValidacion(campo, "esquema.vacio");
  if (opciones.max !== undefined && v.length > opciones.max) {
    throw new ErrorValidacion(campo, "esquema.supera_max", { max: opciones.max, largo: v.length });
  }
  return v;
}

function numeroONulo(obj: Obj, campo: string): number | null {
  const v = obj[campo];
  if (v === undefined) throw new ErrorValidacion(campo, "esquema.faltante");
  if (v === null) return null;
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) throw new ErrorValidacion(campo, "esquema.numero");
  return v;
}

function listaDeCadenas(obj: Obj, campo: string): string[] {
  const v = obj[campo];
  if (v === undefined) throw new ErrorValidacion(campo, "esquema.faltante");
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) throw new ErrorValidacion(campo, "esquema.lista");
  return v as string[];
}

/** Valida un objeto arbitrario contra el esquema v1. Lanza ErrorValidacion con campo y motivo. */
export function validarJuicio(entrada: unknown): Juicio {
  if (!esObjeto(entrada)) throw new ErrorValidacion("juicio", "esquema.objeto");
  const o = entrada;

  if (o["version"] !== 1) throw new ErrorValidacion("version", "esquema.version", { valor: JSON.stringify(o["version"]) });
  const vacante_id = cadena(o, "vacante_id") as string;
  if (!/^[a-z_]+:[^:]+:.+$/.test(vacante_id)) throw new ErrorValidacion("vacante_id", "esquema.vacante_id");

  const elegibilidad = enumerado(o, "elegibilidad", ELEGIBILIDAD);
  const evidencia_elegibilidad = cadena(o, "evidencia_elegibilidad", { nulo: true, max: MAX_EVIDENCIA });
  if (elegibilidad !== "desconocida" && !evidencia_elegibilidad) {
    throw new ErrorValidacion("evidencia_elegibilidad", "esquema.evidencia_obligatoria", { elegibilidad });
  }
  const alcance_geografico = enumerado(o, "alcance_geografico", ALCANCE);
  const contrato = enumerado(o, "contrato", CONTRATO);

  if (!esObjeto(o["pago"])) throw new ErrorValidacion("pago", "esquema.objeto");
  const p = o["pago"];
  const pago: Pago = {
    min: numeroONulo(p, "min"),
    max: numeroONulo(p, "max"),
    moneda: cadena(p, "moneda") as string,
    periodo: enumerado(p, "periodo", PERIODO),
    ajustado_a: enumerado(p, "ajustado_a", AJUSTADO_A),
    evidencia: cadena(p, "evidencia", { nulo: true, max: MAX_EVIDENCIA }),
  };
  if (pago.min !== null && pago.max !== null && pago.min > pago.max) throw new ErrorValidacion("pago.min", "esquema.min_mayor");
  if (!/^[A-Z]{3}$/.test(pago.moneda)) throw new ErrorValidacion("pago.moneda", "esquema.moneda");

  const seniority = enumerado(o, "seniority", SENIORITY);
  const zona_horaria = enumerado(o, "zona_horaria", ZONA_HORARIA);
  const idioma_requerido = enumerado(o, "idioma_requerido", IDIOMA);

  if (!esObjeto(o["ajuste"])) throw new ErrorValidacion("ajuste", "esquema.objeto");
  const a = o["ajuste"];
  const puntaje = a["puntaje"];
  if (typeof puntaje !== "number" || !Number.isInteger(puntaje) || puntaje < 0 || puntaje > 100) {
    throw new ErrorValidacion("ajuste.puntaje", "esquema.puntaje");
  }
  const ajuste: Ajuste = { puntaje, fortalezas: listaDeCadenas(a, "fortalezas"), brechas: listaDeCadenas(a, "brechas") };

  const veredicto = enumerado(o, "veredicto", VEREDICTO);
  if (veredicto === "aplicar") {
    if (!(elegibilidad === "abierta" || elegibilidad === "probable")) {
      throw new ErrorValidacion("veredicto", "esquema.aplicar_elegibilidad", { elegibilidad });
    }
    if (puntaje < 70) throw new ErrorValidacion("veredicto", "esquema.aplicar_puntaje", { puntaje });
  }

  const resumen = cadena(o, "resumen") as string;
  const juzgado_en = cadena(o, "juzgado_en") as string;
  if (Number.isNaN(Date.parse(juzgado_en))) throw new ErrorValidacion("juzgado_en", "esquema.fecha");
  const juzgado_por = enumerado(o, "juzgado_por", JUZGADO_POR);

  return {
    version: 1,
    vacante_id,
    elegibilidad,
    evidencia_elegibilidad,
    alcance_geografico,
    contrato,
    pago,
    seniority,
    zona_horaria,
    idioma_requerido,
    ajuste,
    veredicto,
    resumen,
    juzgado_en,
    juzgado_por,
  };
}

/** Variante sin excepciones, útil para la CLI. */
export function validarJuicioSeguro(entrada: unknown): { ok: true; juicio: Juicio } | { ok: false; error: ErrorValidacion } {
  try {
    return { ok: true, juicio: validarJuicio(entrada) };
  } catch (e) {
    if (e instanceof ErrorValidacion) return { ok: false, error: e };
    throw e;
  }
}
