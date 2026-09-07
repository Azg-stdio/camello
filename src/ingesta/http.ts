import { cargarConfig } from "../config.js";

export class ErrorHttp extends Error {
  constructor(
    public readonly url: string,
    public readonly status: number,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = "ErrorHttp";
  }
}

/** Una petición por feed, User-Agent identificable, sin reintentos agresivos. */
export async function obtenerJson<T>(url: string, timeoutMs = 20000): Promise<T> {
  const r = await fetch(url, {
    headers: { "User-Agent": cargarConfig().user_agent, Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!r.ok) throw new ErrorHttp(url, r.status, `HTTP ${r.status}`);
  return (await r.json()) as T;
}

export async function obtenerTexto(url: string, timeoutMs = 20000): Promise<string> {
  const r = await fetch(url, {
    headers: { "User-Agent": cargarConfig().user_agent, Accept: "text/html,*/*" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!r.ok) throw new ErrorHttp(url, r.status, `HTTP ${r.status}`);
  return await r.text();
}
