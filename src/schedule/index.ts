/** Tarea 12 · Refresco programado con schtasks (Windows) o crontab (Unix). Solo ingesta. */
import { execFileSync, spawnSync } from "node:child_process";
import { enRaiz } from "../rutas.js";

export const INTERVALOS = ["1h", "3h", "6h", "12h", "24h"] as const;
export type Intervalo = (typeof INTERVALOS)[number];
export const NOMBRE_TAREA = "Camello";
const MARCADOR = "# camello";

export function horas(cada: string): number {
  const m = /^(\d+)h$/.exec(cada);
  if (!m || !INTERVALOS.includes(cada as Intervalo)) throw new Error(cada);
  return Number(m[1]);
}

export function comandoRefresh(): { node: string; script: string } {
  return { node: process.execPath, script: enRaiz("dist", "src", "cli", "camello.js") };
}

export interface EstadoTarea {
  existe: boolean;
  detalle: string;
  cada?: string;
}

// ---------- Windows ----------

export function windowsComandoInstalar(cada: string): string[] {
  const { node, script } = comandoRefresh();
  const tr = `"${node}" "${script}" refresh --quiet`;
  return ["schtasks", "/Create", "/F", "/SC", "HOURLY", "/MO", String(horas(cada)), "/TN", NOMBRE_TAREA, "/TR", tr];
}

export function windowsInstalar(cada: string): string {
  const [cmd, ...args] = windowsComandoInstalar(cada);
  return execFileSync(cmd!, args, { encoding: "utf8", windowsHide: true }).trim();
}

export function windowsQuitar(): string {
  return execFileSync("schtasks", ["/Delete", "/F", "/TN", NOMBRE_TAREA], { encoding: "utf8", windowsHide: true }).trim();
}

export function windowsEstado(): EstadoTarea {
  const r = spawnSync("schtasks", ["/Query", "/TN", NOMBRE_TAREA, "/V", "/FO", "LIST"], { encoding: "utf8", windowsHide: true });
  if (r.status !== 0) return { existe: false, detalle: (r.stderr || r.stdout || "").trim() };
  const salida = r.stdout;
  const m = /(?:Repeat: Every|Repetir: cada):\s*(\d+)\s*(?:Hour|Hora)/i.exec(salida) ?? /HOURLY.*?(\d+)/i.exec(salida);
  return { existe: true, detalle: salida.trim(), cada: m ? `${m[1]}h` : undefined };
}

// ---------- Unix (crontab) ----------

export function unixLinea(cada: string): string {
  const { node, script } = comandoRefresh();
  const h = horas(cada);
  const expr = h === 24 ? "0 8 * * *" : `0 */${h} * * *`;
  return `${expr} "${node}" "${script}" refresh --quiet ${MARCADOR}`;
}

function crontabActual(): string {
  const r = spawnSync("crontab", ["-l"], { encoding: "utf8" });
  return r.status === 0 ? r.stdout : "";
}

function escribirCrontab(contenido: string): void {
  const r = spawnSync("crontab", ["-"], { input: contenido, encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || "crontab");
}

export function unixInstalar(cada: string): string {
  const sin = crontabActual()
    .split("\n")
    .filter((l) => !l.includes(MARCADOR) && l.trim() !== "");
  const linea = unixLinea(cada);
  escribirCrontab([...sin, linea].join("\n") + "\n");
  return linea;
}

export function unixQuitar(): string {
  const lineas = crontabActual().split("\n");
  const sin = lineas.filter((l) => !l.includes(MARCADOR) && l.trim() !== "");
  escribirCrontab(sin.length ? sin.join("\n") + "\n" : "");
  return String(lineas.length - sin.length);
}

export function unixEstado(): EstadoTarea {
  const linea = crontabActual()
    .split("\n")
    .find((l) => l.includes(MARCADOR));
  if (!linea) return { existe: false, detalle: "" };
  const m = /^0 \*\/(\d+)/.exec(linea);
  return { existe: true, detalle: linea, cada: m ? `${m[1]}h` : linea.startsWith("0 8") ? "24h" : undefined };
}

// ---------- Portable ----------

export const esWindows = process.platform === "win32";

export function comandoAMostrar(cada: string): string {
  return esWindows ? windowsComandoInstalar(cada).map((a) => (/\s/.test(a) ? `'${a}'` : a)).join(" ") : `crontab: ${unixLinea(cada)}`;
}

export function instalar(cada: string): string {
  return esWindows ? windowsInstalar(cada) : unixInstalar(cada);
}

export function quitar(): string {
  return esWindows ? windowsQuitar() : unixQuitar();
}

export function estado(): EstadoTarea {
  return esWindows ? windowsEstado() : unixEstado();
}
