import { fecha, numero, t, tn } from "../../i18n/index.js";
import { usdMensual } from "../../dashboard/generar.js";
import { parsearDias, recortar, tabla, type Comando, type Contexto } from "../comun.js";

const comando: Comando = {
  nombre: "shortlist",
  descripcion: "shortlist.descripcion",
  uso: "camello shortlist [--desde 7d] [--todas]",
  async ejecutar(ctx: Contexto): Promise<number> {
    const { values } = ctx.parse({ desde: { type: "string" }, todas: { type: "boolean" } }, false);
    const db = ctx.abrirDb();
    const filas = db.shortlist({ desdeDias: parsearDias(values.desde), incluirDescartadas: values.todas });
    const r = db.resumen();
    const abiertas = (r.por_elegibilidad["abierta"] ?? 0) + (r.por_elegibilidad["probable"] ?? 0);

    ctx.linea(t("shortlist.cobertura", { abiertas: numero(abiertas), juzgadas: numero(r.juzgadas), activas: numero(r.activas) }));
    ctx.linea(t("shortlist.resumen", { n: numero(filas.length) }));
    if (filas.length) {
      ctx.linea(
        tabla(
          filas.map((f) => {
            const p = f.juicio.pago;
            const usd = usdMensual(f.juicio);
            const bajo = usd !== null && !!ctx.config.salario_minimo_usd_mes && usd < ctx.config.salario_minimo_usd_mes;
            const pago = (p.min === null && p.max === null ? "-" : `${p.min ?? "?"}-${p.max ?? "?"} ${p.moneda}/${t(`periodo.${p.periodo}`)}`) + (bajo ? ` ${t("shortlist.bajo_minimo")}` : "");
            return [String(f.juicio.ajuste.puntaje), t(`veredicto.${f.juicio.veredicto}`), recortar(f.empresa, 20), recortar(f.titulo, 40), t(`elegibilidad.${f.juicio.elegibilidad}`), pago, t(`estado.${f.estado}`), f.id];
          }),
          [t("col.puntaje"), t("col.veredicto"), t("col.empresa"), t("col.titulo"), t("col.elegibilidad"), t("col.pago"), t("col.estado"), "ID"],
        ),
      );
    }
    const quietas = db.sinNovedad(7);
    if (quietas.length) {
      ctx.linea("");
      ctx.linea(tn("shortlist.sin_novedad", quietas.length, { dias: 7 }));
      for (const q of quietas) ctx.linea(`  - ${q.empresa} · ${recortar(q.titulo, 40)} (${t(`estado.${q.estado}`)}, ${fecha(q.actualizada_en)}) ${q.id}`);
    }
    ctx.siguiente(filas.length ? `camello cv tailor ${filas[0]!.id}` : "camello pending");
    return ctx.terminar(
      filas.map((f) => ({ id: f.id, empresa: f.empresa, titulo: f.titulo, url: f.url, estado: f.estado, primera_vez: f.primera_vez, juicio: f.juicio })),
      { ok: filas.length, total: r.juzgadas },
    );
  },
};

export default comando;
