/**
 * Tarea 13 · HTML a PDF sin dependencias: usa el Edge o Chrome instalado en modo headless.
 * Si no hay navegador compatible, el usuario imprime con Ctrl+P desde el HTML.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

const CANDIDATOS: Record<string, string[]> = {
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Chromium\\Application\\chrome.exe",
  ],
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  ],
  linux: ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge", "brave-browser"],
};

/** Ruta del navegador Chromium disponible, o null. Respeta CAMELLO_NAVEGADOR si está definido. */
export function encontrarNavegador(): string | null {
  const forzado = process.env["CAMELLO_NAVEGADOR"];
  if (forzado) return forzado;
  const lista = CANDIDATOS[process.platform] ?? CANDIDATOS["linux"]!;
  for (const c of lista) {
    if (c.includes("/") || c.includes("\\")) {
      if (existsSync(c)) return c;
    } else {
      const r = spawnSync(process.platform === "win32" ? "where" : "which", [c], { encoding: "utf8" });
      if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split(/\r?\n/)[0]!;
    }
  }
  return null;
}

export interface ResultadoPdf {
  ok: boolean;
  navegador: string | null;
  error?: string;
}

export function htmlAPdf(rutaHtml: string, rutaPdf: string, navegador = encontrarNavegador()): ResultadoPdf {
  if (!navegador) return { ok: false, navegador: null, error: "sin navegador" };
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${rutaPdf}`,
    pathToFileURL(rutaHtml).href,
  ];
  const r = spawnSync(navegador, args, { encoding: "utf8", timeout: 90000, windowsHide: true });
  if (r.status !== 0 || !existsSync(rutaPdf)) {
    return { ok: false, navegador, error: (r.stderr || r.error?.message || `exit ${r.status}`).trim().split("\n").slice(-1)[0] };
  }
  return { ok: true, navegador };
}
