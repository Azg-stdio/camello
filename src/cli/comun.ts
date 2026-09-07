import { parseArgs, type ParseArgsConfig } from "node:util";
import { cargarConfig, type Config } from "../config.js";
import { Db } from "../db.js";
import { enRaiz } from "../rutas.js";
import { t } from "../i18n/index.js";

export interface FlagsGlobales {
  json: boolean;
  lang: string | undefined;
  db: string | undefined;
  quiet: boolean;
  verbose: boolean;
  help: boolean;
}

export interface Cobertura {
  ok: number;
  total: number;
}

export interface SalidaJson {
  ok: boolean;
  datos: unknown;
  cobertura: Cobertura;
  errores: string[];
}

export class Contexto {
  private db?: Db;
  readonly config: Config;
  readonly errores: string[] = [];

  constructor(
    readonly flags: FlagsGlobales,
    readonly args: string[],
  ) {
    this.config = cargarConfig();
  }

  get rutaDb(): string {
    return this.flags.db ?? enRaiz(this.config.db);
  }

  abrirDb(): Db {
    return (this.db ??= Db.abrir(this.rutaDb));
  }

  cerrar(): void {
    this.db?.close();
    this.db = undefined;
  }

  /** Parseo de las opciones propias del comando (además de las globales, ya quitadas). */
  parse<T extends ParseArgsConfig["options"]>(options: T, allowPositionals = true) {
    return parseArgs({ args: this.args, options, allowPositionals, strict: true });
  }

  /** Texto para humanos. Con --json no imprime nada; con --quiet tampoco. */
  linea(texto = ""): void {
    if (this.flags.json || this.flags.quiet) return;
    process.stdout.write(texto + "\n");
  }

  /** Aviso a stderr (se ve aunque haya --json). */
  aviso(texto: string): void {
    if (this.flags.quiet) return;
    process.stderr.write(texto + "\n");
  }

  error(texto: string): void {
    this.errores.push(texto);
    if (!this.flags.json) process.stderr.write(texto + "\n");
  }

  /** Sugerencia del siguiente comando al final de cada salida humana. */
  siguiente(comando: string): void {
    this.linea("");
    this.linea(t("comun.siguiente", { comando }));
  }

  /** Salida final. Con --json imprime el sobre estándar; sin él, no hace nada (el comando ya imprimió). */
  terminar(datos: unknown, cobertura: Cobertura = { ok: 1, total: 1 }, ok = true): number {
    if (this.flags.json) {
      const sobre: SalidaJson = { ok, datos, cobertura, errores: this.errores };
      process.stdout.write(JSON.stringify(sobre, null, 2) + "\n");
    }
    return ok ? 0 : 1;
  }
}

export interface Comando {
  nombre: string;
  /** Clave i18n de la descripción corta para --help. */
  descripcion: string;
  uso: string;
  ejecutar(ctx: Contexto): Promise<number>;
}

/** Lee todo stdin como texto. */
export async function leerStdin(): Promise<string> {
  const trozos: Buffer[] = [];
  for await (const chunk of process.stdin) trozos.push(chunk as Buffer);
  return Buffer.concat(trozos).toString("utf8");
}

export function tabla(filas: string[][], cabecera?: string[]): string {
  const todas = cabecera ? [cabecera, ...filas] : filas;
  const anchos: number[] = [];
  for (const f of todas) f.forEach((c, i) => (anchos[i] = Math.max(anchos[i] ?? 0, ancho(c))));
  const linea = (f: string[]) => f.map((c, i) => c + " ".repeat((anchos[i] ?? 0) - ancho(c))).join("  ").trimEnd();
  const out = todas.map(linea);
  if (cabecera) out.splice(1, 0, anchos.map((a) => "-".repeat(a)).join("  "));
  return out.join("\n");
}

function ancho(s: string): number {
  return [...s].length;
}

export function recortar(s: string | null | undefined, max: number): string {
  if (!s) return "";
  const limpio = s.replace(/\s+/g, " ").trim();
  return [...limpio].length > max ? [...limpio].slice(0, max - 1).join("") + "…" : limpio;
}

export function parsearDias(valor: string | undefined): number | undefined {
  if (!valor) return undefined;
  const m = /^(\d+)\s*([dhw]?)$/.exec(valor.trim());
  if (!m) throw new Error(t("comun.periodo_invalido", { valor }));
  const n = Number(m[1]);
  return m[2] === "h" ? n / 24 : m[2] === "w" ? n * 7 : n;
}
