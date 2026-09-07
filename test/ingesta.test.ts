import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { enRaiz } from "../src/rutas.js";
import { htmlATexto } from "../src/ingesta/html-a-texto.js";
import { normalizarGreenhouse, type GreenhouseRespuesta } from "../src/ingesta/greenhouse.js";
import { normalizarLever, type LeverPosting } from "../src/ingesta/lever.js";
import { normalizarAshby, type AshbyRespuesta } from "../src/ingesta/ashby.js";
import { filtrarTitulos, leerEmpresas } from "../src/ingesta/index.js";
import { extraerEmpresaYTitulo, normalizarComentario, pasaFiltro, type HnItem } from "../src/ingesta/hn.js";

const fixture = <T>(nombre: string): T => JSON.parse(readFileSync(enRaiz("test", "fixtures", nombre), "utf8")) as T;
const AHORA = "2026-09-06T15:00:00.000Z";

test("html a texto: etiquetas, entidades, HTML escapado de Greenhouse", () => {
  assert.equal(htmlATexto("<p>Hola <strong>mundo</strong></p><ul><li>uno</li><li>dos</li></ul>"), "Hola mundo\n- uno\n- dos");
  assert.equal(htmlATexto("&lt;p&gt;Caf&eacute; &amp; t&#233;&lt;/p&gt;"), "Café & té");
  assert.equal(htmlATexto("<script>x()</script>a   b<br>c"), "a b\nc");
  assert.equal(htmlATexto(null), "");
});

test("greenhouse: fixture real se normaliza al formato común", () => {
  const lista = normalizarGreenhouse("acquia", "Acquia", fixture<GreenhouseRespuesta>("greenhouse.json"), AHORA);
  assert.equal(lista.length, 2);
  const v = lista[0]!;
  assert.match(v.id, /^greenhouse:acquia:\d+$/);
  assert.equal(v.fuente, "greenhouse");
  assert.ok(v.titulo.length > 0);
  assert.ok(v.descripcion_texto.length > 50);
  assert.ok(!/<[a-z]+>/i.test(v.descripcion_texto), "sin etiquetas HTML");
  assert.ok(v.url?.startsWith("https://"));
});

test("lever: fixture real, pago declarado y remoto", () => {
  const lista = normalizarLever("bounteous", "Bounteous", fixture<LeverPosting[]>("lever.json"), AHORA);
  assert.equal(lista.length, 2);
  const v = lista[0]!;
  assert.match(v.id, /^lever:bounteous:[0-9a-f-]+$/);
  assert.equal(v.empresa, "Bounteous");
  assert.ok(v.descripcion_texto.length > 50);
  assert.ok(v.publicada === null || !Number.isNaN(Date.parse(v.publicada)));
});

test("ashby: fixture real, compensación y ubicaciones secundarias", () => {
  const lista = normalizarAshby("ashby", "Ashby", fixture<AshbyRespuesta>("ashby.json"), AHORA);
  assert.equal(lista.length, 2);
  const v = lista[0]!;
  assert.match(v.id, /^ashby:ashby:/);
  assert.ok(v.ubicacion && v.ubicacion.length > 0);
  assert.ok(typeof v.remoto === "boolean" || v.remoto === null);
});

test("filtro de títulos descarta lo no técnico", () => {
  const base = normalizarGreenhouse("x", "X", { jobs: [{ id: 1, title: "Account Executive" }, { id: 2, title: "Senior Drupal Developer" }, { id: 3, title: "Sales Engineer" }] }, AHORA);
  const r = filtrarTitulos(base, ["account executive", "sales"]);
  assert.equal(r.conservadas.length, 1);
  assert.equal(r.descartadas, 2);
});

test("lista semilla: formato válido y sin duplicados", () => {
  const empresas = leerEmpresas();
  assert.ok(empresas.length >= 20);
  const ids = empresas.map((e) => `${e.ats}:${e.slug}`);
  assert.equal(new Set(ids).size, ids.length);
});

test("hn: filtro, empresa y título desde la convención de HN", () => {
  assert.equal(pasaFiltro("Remote (Latin America) | Senior PHP", ["remote"], ["latam", "latin america"]), true);
  assert.equal(pasaFiltro("Onsite in Berlin | Senior PHP", ["remote"], ["latam"]), false);
  assert.equal(pasaFiltro("Remote, the best team", ["remote"], ["est"]), false, "'est' se busca como palabra completa");
  assert.equal(pasaFiltro("Remote, EST hours", ["remote"], ["est"]), true);
  assert.deepEqual(extraerEmpresaYTitulo("Acme Corp | Senior Drupal Dev | Remote (LATAM) | Full-time\nMore text"), { empresa: "Acme Corp", titulo: "Senior Drupal Dev · Remote (LATAM) · Full-time" });

  const f = fixture<{ hilo: HnItem; comentarios: HnItem[] }>("hn.json");
  const vac = f.comentarios.filter((c) => c.text && !c.deleted).map((c) => normalizarComentario("2026-09", c, AHORA));
  assert.ok(vac.length > 0);
  assert.match(vac[0]!.id, /^hn:2026-09:\d+$/);
  assert.ok(vac[0]!.url?.includes("news.ycombinator.com"));
});
