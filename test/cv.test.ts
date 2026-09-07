import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { enRaiz } from "../src/rutas.js";
import { diffCv, palabrasClave } from "../src/cv/analisis.js";
import { markdownAHtml } from "../src/cv/markdown.js";
import { renderizarCv } from "../src/cv/render.js";
import { nombreArchivoSeguro } from "../src/perfil/index.js";

const maestra = readFileSync(enRaiz("docs", "ejemplos", "cv.ejemplo.md"), "utf8");

test("palabras clave del anuncio", () => {
  const k = palabrasClave("We need a Senior Drupal developer with PHP, Symfony and CI/CD. Drupal 10 migrations. Next.js a plus.");
  const terminos = k.map((x) => x.termino);
  assert.ok(terminos.includes("drupal"));
  assert.ok(terminos.includes("ci/cd"));
  assert.ok(terminos.includes("next.js"));
  assert.equal(k[0]?.termino, "drupal");
});

test("diff: logros con respaldo y sin respaldo", () => {
  const adaptada = `---\nnombre: X\n---\n# Habilidades\n- PHP (10 años)\n# Experiencia\n## Empresa Ejemplo · Drupal Lead\n- Reduje el tiempo de carga 40% migrando 120 módulos personalizados de Drupal 7 a 10 para un portal con 2 M de visitas mensuales.\n- Gané el premio Nobel de Drupal por inventar un módulo cuántico.\n`;
  const r = diffCv(maestra, adaptada, "Drupal 10 migration, PHP, Kubernetes");
  assert.equal(r.escogidos.length, 2, "PHP literal + logro reordenado");
  assert.equal(r.sin_respaldo.length, 1);
  assert.match(r.sin_respaldo[0]!, /Nobel/);
  assert.ok(r.palabras_clave.some((p) => p.termino === "kubernetes" && p.en_adaptada === 0));
  assert.ok(r.cubiertas >= 2);
});

test("markdown y render de la hoja de vida", () => {
  const html = markdownAHtml("# Titular\nDrupal **Lead**\n\n- uno\n- dos\n\n## Sub\nTexto con [enlace](https://x.y/z).");
  assert.match(html, /<h1>Titular<\/h1>/);
  assert.match(html, /<strong>Lead<\/strong>/);
  assert.match(html, /<ul>\n<li>uno<\/li>\n<li>dos<\/li>\n<\/ul>/);
  assert.match(html, /<a href="https:\/\/x\.y\/z">enlace<\/a>/);
  const pagina = renderizarCv(maestra, { pagina: "A4" });
  assert.match(pagina, /size: A4/);
  assert.match(pagina, /Nombre Apellido/);
  assert.ok(!/<table/.test(pagina), "sin tablas (parseable por ATS)");
});

test("nombre de archivo seguro en Windows", () => {
  assert.equal(nombreArchivoSeguro('Lullabot: Senior "Drupal" Dev / Remote?'), "Lullabot-Senior-Drupal-Dev-Remote");
  assert.equal(nombreArchivoSeguro("Ñandú Élite"), "Nandu-Elite");
});
