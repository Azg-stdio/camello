import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

/** Raíz del repo: el directorio más cercano hacia arriba que tenga package.json. */
export function raiz(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, "package.json"))) return dir;
    dir = dirname(dir);
  }
  return process.cwd();
}

/** Resuelve una ruta relativa a la raíz del repo (las absolutas se respetan). */
export function enRaiz(...partes: string[]): string {
  return resolve(raiz(), ...partes);
}
