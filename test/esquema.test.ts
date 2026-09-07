import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ErrorValidacion, validarJuicio, validarJuicioSeguro } from "../src/juicio/esquema.js";
import { enRaiz } from "../src/rutas.js";

const ejemplo = () => JSON.parse(readFileSync(enRaiz("docs", "ejemplos", "juicio.json"), "utf8")) as Record<string, unknown>;

test("el ejemplo de docs/ejemplos/juicio.json es válido", () => {
  const j = validarJuicio(ejemplo());
  assert.equal(j.vacante_id, "greenhouse:ejemplo:1234567");
  assert.equal(j.veredicto, "aplicar");
  assert.equal(j.ajuste.puntaje, 84);
});

const invalidos: [string, (o: Record<string, unknown>) => void, string][] = [
  ["campo faltante", (o) => delete o["elegibilidad"], "elegibilidad"],
  ["valor fuera de enum", (o) => (o["contrato"] = "freelance"), "contrato"],
  ["aplicar con elegibilidad cerrada", (o) => (o["elegibilidad"] = "cerrada"), "veredicto"],
  ["aplicar con puntaje bajo", (o) => ((o["ajuste"] as Record<string, unknown>)["puntaje"] = 40), "veredicto"],
  ["evidencia demasiado larga", (o) => (o["evidencia_elegibilidad"] = "x".repeat(301)), "evidencia_elegibilidad"],
  ["pago.min mayor que max", (o) => ((o["pago"] as Record<string, unknown>)["min"] = 9000), "pago.min"],
  ["version distinta", (o) => (o["version"] = 2), "version"],
];

for (const [nombre, romper, campo] of invalidos) {
  test(`inválido: ${nombre} → rechazo en '${campo}'`, () => {
    const o = ejemplo();
    romper(o);
    assert.throws(() => validarJuicio(o), (e: unknown) => e instanceof ErrorValidacion && e.campo === campo);
    const r = validarJuicioSeguro(o);
    assert.equal(r.ok, false);
  });
}

test("elegibilidad desconocida no exige evidencia", () => {
  const o = ejemplo();
  o["elegibilidad"] = "desconocida";
  o["evidencia_elegibilidad"] = null;
  o["veredicto"] = "considerar";
  assert.equal(validarJuicio(o).elegibilidad, "desconocida");
});
