import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { enRaiz } from "../src/rutas.js";
import { Db } from "../src/db.js";

const bin = enRaiz("dist", "src", "cli", "camello.js");
const dir = mkdtempSync(join(tmpdir(), "camello-"));
const db = join(dir, "prueba.db");

function camello(...args: string[]): string {
  return execFileSync(process.execPath, [bin, ...args, "--db", db], { encoding: "utf8", cwd: enRaiz() });
}

test("camello --help lista los comandos", () => {
  const salida = camello("--help");
  for (const c of ["init", "refresh", "pending", "judge", "shortlist", "cv", "dashboard", "obsidian", "schedule", "stats"]) assert.match(salida, new RegExp(`camello ${c}`));
});

test("camello stats --json sobre base vacía devuelve el sobre estándar", () => {
  const r = JSON.parse(camello("stats", "--json")) as { ok: boolean; datos: { vacantes: number }; cobertura: { ok: number; total: number }; errores: string[] };
  assert.equal(r.ok, true);
  assert.equal(r.datos.vacantes, 0);
  assert.deepEqual(r.errores, []);
  assert.deepEqual(Object.keys(r).sort(), ["cobertura", "datos", "errores", "ok"]);
});

test("judge --from archivo guarda y shortlist lo muestra; status mueve el pipeline", () => {
  const d = new Db(db);
  d.upsertVacantes(
    [
      {
        id: "greenhouse:ejemplo:1234567",
        fuente: "greenhouse",
        empresa: "Ejemplo",
        titulo: "Senior Drupal Developer",
        ubicacion: "Remote - LATAM",
        remoto: true,
        descripcion_texto: "We hire full-time contractors anywhere in Latin America through Deel.",
        url: "https://example.com/1",
        publicada: null,
        pago_declarado: null,
        obtenida: new Date().toISOString(),
      },
    ],
    "greenhouse:ejemplo:",
  );
  d.close();
  const archivo = join(dir, "juicio.json");
  writeFileSync(archivo, readFileSync(enRaiz("docs", "ejemplos", "juicio.json")));
  const salida = camello("judge", "greenhouse:ejemplo:1234567", "--from", archivo);
  assert.match(salida, /84\/100/);
  const r = JSON.parse(camello("shortlist", "--json")) as { datos: { id: string; estado: string }[] };
  assert.equal(r.datos[0]?.id, "greenhouse:ejemplo:1234567");
  assert.equal(r.datos[0]?.estado, "preseleccionada");
  camello("status", "greenhouse:ejemplo:1234567", "aplicada", "--nota", "prueba");
  const show = JSON.parse(camello("show", "greenhouse:ejemplo:1234567", "--json")) as { datos: { aplicacion: { estado: string }; eventos: { a: string }[] } };
  assert.equal(show.datos.aplicacion.estado, "aplicada");
  assert.deepEqual(show.datos.eventos.map((e) => e.a), ["preseleccionada", "aplicada"]);
  const en = camello("stats", "--lang", "en");
  assert.match(en, /Coverage:/);
});

test("judge rechaza un JSON inválido con el campo y el motivo", () => {
  const archivo = join(dir, "malo.json");
  writeFileSync(archivo, JSON.stringify({ version: 1, vacante_id: "greenhouse:ejemplo:1234567", elegibilidad: "tal vez" }));
  let stderr = "";
  try {
    execFileSync(process.execPath, [bin, "judge", "greenhouse:ejemplo:1234567", "--from", archivo, "--db", db], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    stderr = String((e as { stderr: string }).stderr);
  }
  assert.match(stderr, /elegibilidad/);
});

test("dashboard --no-open genera el HTML con el logo y sin datos del perfil", () => {
  const out = join(dir, "dash.html");
  camello("dashboard", "--no-open", "--out", out);
  const html = readFileSync(out, "utf8");
  assert.match(html, /<svg[^>]*aria-label="camello"/);
  assert.match(html, /greenhouse:ejemplo:1234567/);
  assert.ok(!/Banco de logros/.test(html));
});
