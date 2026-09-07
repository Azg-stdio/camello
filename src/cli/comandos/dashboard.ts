import { resolve } from "node:path";
import { abrirEnNavegador, escribirDashboard, generarDashboard } from "../../dashboard/generar.js";
import { getLang, numero, t } from "../../i18n/index.js";
import { enRaiz } from "../../rutas.js";
import type { Comando, Contexto } from "../comun.js";

const comando: Comando = {
  nombre: "dashboard",
  descripcion: "dashboard.descripcion",
  uso: "camello dashboard [--no-open] [--out <ruta>]",
  async ejecutar(ctx: Contexto): Promise<number> {
    const { values } = ctx.parse({ "no-open": { type: "boolean" }, out: { type: "string" } }, false);
    const db = ctx.abrirDb();
    const ruta = values.out ? resolve(values.out) : enRaiz("data", "dashboard.html");
    const { html, datos } = generarDashboard(db, ctx.config, { lang: getLang() });
    escribirDashboard(html, ruta);

    const r = datos.resumen;
    const abiertas = (r.por_elegibilidad["abierta"] ?? 0) + (r.por_elegibilidad["probable"] ?? 0);
    ctx.linea(t("dashboard.escrito", { ruta }));
    ctx.linea(t("dashboard.cobertura_cli", { abiertas: numero(abiertas), juzgadas: numero(r.juzgadas), shortlist: numero(datos.shortlist.length) }));
    if (!values["no-open"]) {
      abrirEnNavegador(ruta);
      ctx.linea(t("dashboard.abriendo"));
    }
    ctx.siguiente(r.pendientes > 0 ? "camello pending" : "camello obsidian sync");
    return ctx.terminar(
      { ruta, generado: datos.generado, activas: r.activas, juzgadas: r.juzgadas, pendientes: r.pendientes, abiertas, shortlist: datos.shortlist.length, nuevas_7d: r.nuevas_7d },
      { ok: r.ultima_corrida?.fuentes_ok ?? 0, total: r.ultima_corrida?.fuentes_total ?? 0 },
    );
  },
};

export default comando;
