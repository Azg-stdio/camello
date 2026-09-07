import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { enRaiz } from "../src/rutas.js";
import { fraccion, numero, setLang, t } from "../src/i18n/index.js";

const es = JSON.parse(readFileSync(enRaiz("src", "i18n", "es.json"), "utf8")) as Record<string, string>;
const en = JSON.parse(readFileSync(enRaiz("src", "i18n", "en.json"), "utf8")) as Record<string, string>;

test("es.json y en.json tienen las mismas claves", () => {
  const soloEs = Object.keys(es).filter((k) => !(k in en));
  const soloEn = Object.keys(en).filter((k) => !(k in es));
  assert.deepEqual(soloEs, [], "faltan en en.json");
  assert.deepEqual(soloEn, [], "faltan en es.json");
});

test("t() interpola y cae a español si falta la clave", () => {
  setLang("en");
  assert.equal(t("comun.siguiente", { comando: "x" }), "Next: `x`");
  assert.equal(t("clave.inexistente"), "clave.inexistente");
  setLang("es");
  assert.equal(numero(2300), "2.300");
  assert.equal(fraccion(38, 40), "38/40");
  setLang("en");
  assert.equal(numero(2300), "2,300");
  setLang("es");
});

function archivosTs(dir: string): string[] {
  const out: string[] = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) out.push(...archivosTs(ruta));
    else if (ruta.endsWith(".ts")) out.push(ruta);
  }
  return out;
}

/** Archivos con cadenas en español por ser datos del dominio, no texto de interfaz. */
const PERMITIDOS = new Set(["src/perfil/index.ts", "src/ingesta/html-a-texto.ts", "src/cv/analisis.ts", "src/cli/comandos/cv.ts", "src/cli/comandos/init.ts"]);

test("ninguna cadena visible con acento o ¿ va inline en src/ (fuera de i18n/)", () => {
  const raiz = enRaiz("src");
  const culpables: string[] = [];
  for (const archivo of archivosTs(raiz)) {
    const rel = relative(enRaiz(), archivo).replace(/\\/g, "/");
    if (rel.startsWith("src/i18n/") || PERMITIDOS.has(rel)) continue;
    const codigo = readFileSync(archivo, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
    const literales = codigo.match(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g) ?? [];
    for (const lit of literales) {
      if (/[áéíóúñÁÉÍÓÚÑ¿¡]/.test(lit)) culpables.push(`${rel}: ${lit.slice(0, 60)}`);
    }
  }
  assert.deepEqual(culpables, []);
});
