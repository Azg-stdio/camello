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

test("carpeta por vacante y nombres neutros de PDF", async () => {
  const { archivosAdaptada, claveVacante, nombreCarpetaAdaptada, nombrePdfCandidato } = await import("../src/perfil/index.js");
  const { sep } = await import("node:path");
  const v = { id: "greenhouse:wikimedia:8158048", empresa: "Wikimedia Foundation", titulo: "Senior Software Engineer, MediaWiki Content Platform Team" };
  assert.equal(claveVacante(v.id), "8158048");
  assert.equal(nombreCarpetaAdaptada(v), "wikimedia-foundation-8158048-senior-software-engineer-mediawiki-content-platform");
  assert.equal(nombrePdfCandidato("Miguel Arbeláez", "CV"), "MiguelArbelaez_CV.pdf");
  assert.equal(nombrePdfCandidato("Miguel Arbeláez", "CoverLetter", "{nombre}-{tipo}"), "MiguelArbelaez-CoverLetter.pdf");
  assert.equal(nombrePdfCandidato("", "CV"), "Candidato_CV.pdf");
  const a = archivosAdaptada(v, "Miguel Arbeláez", undefined, "/base");
  assert.ok(a.md.split(sep).join("/").endsWith("/base/wikimedia-foundation-8158048-senior-software-engineer-mediawiki-content-platform/wikimedia-foundation-cv.md"));
  assert.ok(a.pdf.endsWith("MiguelArbelaez_CV.pdf"));
  assert.ok(a.carta.endsWith("wikimedia-foundation-carta.md"));
  assert.ok(a.carta_pdf.endsWith("MiguelArbelaez_CoverLetter.pdf"));
  assert.ok(a.entrevista.endsWith("wikimedia-foundation-entrevista.md"));
});

test("apply encuentra la adaptada por carpeta y cae al formato plano", async () => {
  const { mkdtempSync, mkdirSync, writeFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");
  const { adaptadaPara } = await import("../src/cli/comandos/apply.js");
  const base = mkdtempSync(join(tmpdir(), "camello-adaptadas-"));
  const mediawiki = { id: "greenhouse:wikimedia:8158048", empresa: "Wikimedia Foundation", titulo: "Senior Software Engineer, MediaWiki" };
  const wikidata = { id: "greenhouse:wikimedia:8060307", empresa: "Wikimedia Foundation", titulo: "Senior Software Engineer, Wikidata Platform" };
  // Carpeta solo para MediaWiki; Wikidata queda con un archivo plano del formato anterior.
  const carpeta = join(base, "wikimedia-foundation-8158048-senior-software-engineer-mediawiki");
  mkdirSync(carpeta);
  writeFileSync(join(carpeta, "wikimedia-foundation-cv.md"), "# cv");
  writeFileSync(join(carpeta, "MiguelArbelaez_CV.pdf"), "pdf");
  writeFileSync(join(carpeta, "wikimedia-foundation-carta.md"), "carta");
  writeFileSync(join(carpeta, "MiguelArbelaez_CoverLetter.pdf"), "pdf");
  writeFileSync(join(carpeta, "wikimedia-foundation-entrevista.md"), "# preguntas");
  writeFileSync(join(base, "Wikimedia-Foundation-Senior-Software-Engineer-Wikidata-Platform.md"), "# viejo");
  const a = adaptadaPara(mediawiki, base);
  assert.equal(a.carpeta, carpeta);
  assert.ok(a.md?.endsWith("wikimedia-foundation-cv.md"));
  assert.ok(a.pdf?.endsWith("MiguelArbelaez_CV.pdf"), "el PDF del CV no es la carta");
  assert.ok(a.carta?.endsWith("wikimedia-foundation-carta.md"));
  assert.ok(a.carta_pdf?.endsWith("MiguelArbelaez_CoverLetter.pdf"));
  assert.ok(a.entrevista?.endsWith("wikimedia-foundation-entrevista.md"));
  assert.ok(!a.md?.includes("entrevista"), "la preparación de entrevista no se confunde con el CV");
  const b = adaptadaPara(wikidata, base);
  assert.equal(b.carpeta, null);
  assert.ok(b.md?.endsWith("Wikidata-Platform.md"), "cae al archivo plano de la misma empresa");
  assert.equal(b.pdf, null);
  assert.deepEqual(adaptadaPara({ id: "x:y:1", empresa: "Nadie", titulo: "Nada" }, base).md, null);
});
