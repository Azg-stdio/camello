import { fecha, fraccion, numero, t } from "../../i18n/index.js";
import type { Comando, Contexto } from "../comun.js";

const comando: Comando = {
  nombre: "stats",
  descripcion: "stats.descripcion",
  uso: "camello stats",
  async ejecutar(ctx: Contexto): Promise<number> {
    ctx.parse({}, false);
    const db = ctx.abrirDb();
    const r = db.resumen();
    const abiertas = (r.por_elegibilidad["abierta"] ?? 0) + (r.por_elegibilidad["probable"] ?? 0);
    const listar = (m: Record<string, number>, prefijo: string) =>
      Object.entries(m)
        .sort((a, b) => b[1] - a[1])
        .map(([k, n]) => `${t(`${prefijo}.${k}`) === `${prefijo}.${k}` ? k : t(`${prefijo}.${k}`)} ${numero(n)}`)
        .join(" · ") || "-";

    ctx.linea(t("stats.vacantes", { activas: numero(r.activas), total: numero(r.vacantes), nuevas7d: numero(r.nuevas_7d) }));
    ctx.linea(t("stats.fuentes", { fuentes: listar(r.por_fuente, "fuente") }));
    ctx.linea(t("stats.juzgadas", { juzgadas: numero(r.juzgadas), pendientes: numero(r.pendientes) }));
    ctx.linea(t("stats.cobertura", { abiertas: numero(abiertas), juzgadas: numero(r.juzgadas) }));
    ctx.linea(t("stats.veredictos", { veredictos: listar(r.por_veredicto, "veredicto") }));
    ctx.linea(t("stats.elegibilidad", { elegibilidad: listar(r.por_elegibilidad, "elegibilidad") }));
    ctx.linea(t("stats.pipeline", { estados: listar(r.por_estado, "estado") }));
    if (r.ultima_corrida) {
      const c = r.ultima_corrida;
      ctx.linea(
        t("stats.ultima_corrida", {
          fecha: fecha(c.inicio, { dateStyle: "medium", timeStyle: "short" }),
          fraccion: fraccion(c.fuentes_ok, c.fuentes_total),
          nuevas: numero(c.nuevas),
          cambiadas: numero(c.cambiadas),
          desaparecidas: numero(c.desaparecidas),
        }),
      );
    } else {
      ctx.linea(t("stats.sin_corridas"));
    }
    ctx.siguiente(r.vacantes === 0 ? "camello refresh" : r.pendientes > 0 ? "camello pending" : "camello shortlist");
    return ctx.terminar(r, { ok: r.ultima_corrida?.fuentes_ok ?? 0, total: r.ultima_corrida?.fuentes_total ?? 0 });
  },
};

export default comando;
