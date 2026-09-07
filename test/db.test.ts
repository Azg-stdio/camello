import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Db } from "../src/db.js";
import { validarJuicio } from "../src/juicio/esquema.js";
import { enRaiz } from "../src/rutas.js";
import type { VacanteCruda } from "../src/tipos.js";

function vacante(n: number, extra: Partial<VacanteCruda> = {}): VacanteCruda {
  return {
    id: `greenhouse:prueba:${n}`,
    fuente: "greenhouse",
    empresa: "Prueba",
    titulo: `Senior Drupal Developer ${n}`,
    ubicacion: "Remote - LATAM",
    remoto: true,
    descripcion_texto: `Descripción ${n}. We hire contractors anywhere in Latin America.`,
    url: `https://example.com/${n}`,
    publicada: null,
    pago_declarado: null,
    obtenida: new Date().toISOString(),
    ...extra,
  };
}

test("dos corridas iguales: 0 nuevas; cambio de descripción: 1 cambiada; quitar: 1 desaparecida", () => {
  const db = new Db(":memory:");
  const lote = [vacante(1), vacante(2), vacante(3)];
  const r1 = db.upsertVacantes(lote, "greenhouse:prueba:");
  assert.deepEqual([r1.nuevas, r1.cambiadas, r1.desaparecidas], [3, 0, 0]);

  const r2 = db.upsertVacantes(lote, "greenhouse:prueba:");
  assert.deepEqual([r2.nuevas, r2.cambiadas, r2.sin_cambio, r2.desaparecidas], [0, 0, 3, 0]);

  const cambiado = [vacante(1), vacante(2, { descripcion_texto: "Ahora piden Next.js" }), vacante(3)];
  const r3 = db.upsertVacantes(cambiado, "greenhouse:prueba:");
  assert.deepEqual([r3.nuevas, r3.cambiadas, r3.desaparecidas], [0, 1, 0]);
  assert.equal(db.vacante("greenhouse:prueba:2")?.juicio_obsoleto, 1);

  const r4 = db.upsertVacantes([vacante(1), vacante(2, { descripcion_texto: "Ahora piden Next.js" })], "greenhouse:prueba:");
  assert.deepEqual([r4.nuevas, r4.cambiadas, r4.desaparecidas], [0, 0, 1]);
  assert.ok(db.vacante("greenhouse:prueba:3")?.desaparecida_en);

  // Una fuente que falló no marca nada como desaparecido.
  const r5 = db.upsertVacantes([], "greenhouse:prueba:", false);
  assert.equal(r5.desaparecidas, 0);
  db.close();
});

test("juicio: pendientes, guardar, shortlist y preselección automática", () => {
  const db = new Db(":memory:");
  db.upsertVacantes([vacante(1), vacante(2)], "greenhouse:prueba:");
  assert.equal(db.contarPendientes(), 2);

  const j = validarJuicio({ ...(JSON.parse(readFileSync(enRaiz("docs", "ejemplos", "juicio.json"), "utf8")) as object), vacante_id: "greenhouse:prueba:1" });
  db.guardarJuicio(j);
  assert.equal(db.contarPendientes(), 1);
  assert.equal(db.ultimoJuicio("greenhouse:prueba:1")?.veredicto, "aplicar");
  assert.equal(db.aplicacion("greenhouse:prueba:1")?.estado, "preseleccionada");
  const s = db.shortlist();
  assert.equal(s.length, 1);
  assert.equal(s[0]?.juicio.ajuste.puntaje, 84);

  // Cambia la vacante → juicio obsoleto → vuelve a pendientes, el juicio anterior sigue en la tabla.
  db.upsertVacantes([vacante(1, { descripcion_texto: "cambió" }), vacante(2)], "greenhouse:prueba:");
  assert.equal(db.contarPendientes(), 2);
  assert.equal(db.historialJuicios("greenhouse:prueba:1").length, 1);
  db.close();
});

test("pipeline: setEstado guarda historial en eventos", () => {
  const db = new Db(":memory:");
  db.upsertVacantes([vacante(1)], "greenhouse:prueba:");
  db.setEstado("greenhouse:prueba:1", "preseleccionada");
  db.setEstado("greenhouse:prueba:1", "aplicada", "con la adaptada", "prueba-senior.md");
  db.setEstado("greenhouse:prueba:1", "entrevista");
  const ev = db.eventos("greenhouse:prueba:1");
  assert.deepEqual(ev.map((e) => e.a), ["preseleccionada", "aplicada", "entrevista"]);
  assert.equal(ev[1]?.nota, "con la adaptada");
  assert.equal(db.aplicacion("greenhouse:prueba:1")?.cv_adaptada, "prueba-senior.md");
  assert.equal(db.resumen().por_estado["entrevista"], 1);
  db.close();
});

test("corridas y resumen", () => {
  const db = new Db(":memory:");
  const id = db.iniciarCorrida(3);
  db.cerrarCorrida(id, { fuentes_ok: 2, fuentes_total: 3, nuevas: 5, cambiadas: 0, desaparecidas: 1 });
  const r = db.resumen();
  assert.equal(r.ultima_corrida?.fuentes_ok, 2);
  assert.equal(r.vacantes, 0);
  db.close();
});
