/** Formato común de una vacante recién leída de cualquier fuente (tarea 03). */
export interface VacanteCruda {
  /** `ats:slug:id externo`, p. ej. "greenhouse:acquia:1234567". */
  id: string;
  fuente: string;
  empresa: string;
  titulo: string;
  ubicacion: string | null;
  remoto: boolean | null;
  /** HTML convertido a texto plano. */
  descripcion_texto: string;
  url: string | null;
  publicada: string | null;
  /** Texto tal cual, si el ATS lo expone. */
  pago_declarado: string | null;
  obtenida: string;
}

export type Ats = "greenhouse" | "lever" | "ashby";

export interface Empresa {
  nombre: string;
  ats: Ats;
  slug: string;
  etiquetas?: string[];
  contrata_en?: string[];
  nota?: string;
  agregada?: string;
}

export const ESTADOS = ["vista", "preseleccionada", "aplicada", "entrevista", "oferta", "rechazada", "descartada"] as const;
export type Estado = (typeof ESTADOS)[number];
