import { fecha, moneda, numero, t } from "../../i18n/index.js";
import { recortar, type Comando, type Contexto } from "../comun.js";
import type { Juicio } from "../../juicio/esquema.js";

export function lineaPago(j: Juicio, tasaCop: number): string {
  const p = j.pago;
  if (p.min === null && p.max === null) return t("show.pago_sin_cifra");
  const fmt = (n: number | null) => (n === null ? "?" : p.moneda === "USD" ? moneda(n, "USD") : `${numero(n)} ${p.moneda}`);
  let texto = `${fmt(p.min)} - ${fmt(p.max)} / ${t(`periodo.${p.periodo}`)}`;
  if (p.moneda === "USD" && (p.min ?? p.max) !== null) {
    const ref = p.max ?? p.min ?? 0;
    const mensual = p.periodo === "anual" ? ref / 12 : p.periodo === "hora" ? ref * 160 : ref;
    texto += ` (~${moneda(Math.round(mensual * tasaCop), "COP")}/${t("periodo.mensual")})`;
  }
  texto += ` · ${t("show.ajustado_a")}: ${t(`ajustado.${p.ajustado_a}`)}`;
  return texto;
}

const comando: Comando = {
  nombre: "show",
  descripcion: "show.descripcion",
  uso: "camello show <id> [--completa]",
  async ejecutar(ctx: Contexto): Promise<number> {
    const { values, positionals } = ctx.parse({ completa: { type: "boolean" } });
    const id = positionals[0];
    if (!id) throw new Error(t("show.sin_id"));
    const db = ctx.abrirDb();
    const v = db.vacante(id);
    if (!v) {
      ctx.error(t("show.no_existe", { id }));
      return ctx.terminar(null, { ok: 0, total: 1 }, false);
    }
    const juicio = db.ultimoJuicio(id) ?? null;
    const aplicacion = db.aplicacion(id) ?? null;
    const eventos = db.eventos(id);

    ctx.linea(`${v.empresa} · ${v.titulo}`);
    ctx.linea(`${t("col.id")}: ${v.id}`);
    ctx.linea(`${t("col.ubicacion")}: ${v.ubicacion ?? "-"} · ${t("col.remoto")}: ${v.remoto === 1 ? t("si") : v.remoto === 0 ? t("no") : "?"}`);
    if (v.pago_declarado) ctx.linea(`${t("show.pago_declarado")}: ${v.pago_declarado}`);
    ctx.linea(`${t("col.vista")}: ${fecha(v.primera_vez)} · ${t("show.ultima_vez")}: ${fecha(v.ultima_vez)}${v.desaparecida_en ? ` · ${t("show.desaparecida")}: ${fecha(v.desaparecida_en)}` : ""}`);
    if (v.url) ctx.linea(`URL: ${v.url}`);
    ctx.linea("");
    if (juicio) {
      ctx.linea(t("show.juicio_titulo", { fecha: fecha(juicio.juzgado_en), por: juicio.juzgado_por }) + (v.juicio_obsoleto ? ` (${t("show.obsoleto")})` : ""));
      ctx.linea(`  ${t("col.veredicto")}: ${t(`veredicto.${juicio.veredicto}`)} · ${t("col.puntaje")}: ${juicio.ajuste.puntaje}/100`);
      ctx.linea(`  ${t("col.elegibilidad")}: ${t(`elegibilidad.${juicio.elegibilidad}`)} (${t(`alcance.${juicio.alcance_geografico}`)})`);
      if (juicio.evidencia_elegibilidad) ctx.linea(`    "${juicio.evidencia_elegibilidad}"`);
      ctx.linea(`  ${t("col.contrato")}: ${t(`contrato.${juicio.contrato}`)} · ${t("col.seniority")}: ${juicio.seniority} · ${t("col.zona")}: ${t(`zona.${juicio.zona_horaria}`)} · ${t("col.idioma")}: ${juicio.idioma_requerido}`);
      ctx.linea(`  ${t("col.pago")}: ${lineaPago(juicio, ctx.config.tasa_cop)}`);
      if (juicio.pago.evidencia) ctx.linea(`    "${juicio.pago.evidencia}"`);
      if (juicio.ajuste.fortalezas.length) ctx.linea(`  ${t("show.fortalezas")}: ${juicio.ajuste.fortalezas.map((f) => `\n    + ${f}`).join("")}`);
      if (juicio.ajuste.brechas.length) ctx.linea(`  ${t("show.brechas")}: ${juicio.ajuste.brechas.map((b) => `\n    - ${b}`).join("")}`);
      ctx.linea(`  ${juicio.resumen}`);
    } else {
      ctx.linea(t("show.sin_juicio"));
    }
    ctx.linea("");
    if (aplicacion) {
      ctx.linea(`${t("col.estado")}: ${t(`estado.${aplicacion.estado}`)} (${fecha(aplicacion.actualizada_en)})${aplicacion.cv_adaptada ? ` · CV: ${aplicacion.cv_adaptada}` : ""}`);
      for (const e of eventos) ctx.linea(`  ${fecha(e.fecha, { dateStyle: "short", timeStyle: "short" })}  ${e.de ?? "·"} → ${e.a}${e.nota ? `  (${e.nota})` : ""}`);
    } else {
      ctx.linea(`${t("col.estado")}: ${t("estado.vista")}`);
    }
    ctx.linea("");
    ctx.linea(t("show.descripcion_titulo"));
    ctx.linea(values.completa ? v.descripcion_texto : recortar(v.descripcion_texto, 600));
    if (!values.completa && v.descripcion_texto.length > 600) ctx.linea(t("show.ver_completa", { id }));
    ctx.siguiente(juicio ? `camello status ${id} preseleccionada` : `camello pending`);
    return ctx.terminar({ vacante: v, juicio, aplicacion, eventos });
  },
};

export default comando;
