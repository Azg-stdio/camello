import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from "node:fs";
import { enRaiz } from "../../rutas.js";
import { filtrarTitulos, leerEmpresas, leerTodas, prefijoEmpresa } from "../../ingesta/index.js";
import * as hn from "../../ingesta/hn.js";
import { fraccion, numero, t } from "../../i18n/index.js";
import type { Comando, Contexto } from "../comun.js";

const comando: Comando = {
  nombre: "refresh",
  descripcion: "refresh.descripcion",
  uso: "camello refresh [--solo ats|hn] [--empresa X]",
  async ejecutar(ctx: Contexto): Promise<number> {
    const { values } = ctx.parse({ solo: { type: "string" }, empresa: { type: "string" }, "sin-hn": { type: "boolean" } }, false);
    const db = ctx.abrirDb();
    let empresas = leerEmpresas(ctx.config.sources);
    if (values.empresa) {
      const q = values.empresa.toLowerCase();
      empresas = empresas.filter((e) => e.nombre.toLowerCase().includes(q) || e.slug.toLowerCase().includes(q));
    }
    const conAts = values.solo !== "hn";
    const conHn = values.solo !== "ats" && !values["sin-hn"] && !values.empresa;
    const totalFuentes = (conAts ? empresas.length : 0) + (conHn ? 1 : 0);

    const corrida = db.iniciarCorrida(totalFuentes);
    const acumulado = { nuevas: 0, cambiadas: 0, desaparecidas: 0, sin_cambio: 0, descartadas: 0 };
    let fuentesOk = 0;
    const detalle: { fuente: string; ok: boolean; vacantes: number; nuevas: number; cambiadas: number; desaparecidas: number; error?: string }[] = [];

    if (conAts) {
      ctx.linea(t("refresh.leyendo", { n: numero(empresas.length) }));
      await leerTodas(empresas, 5, (r) => {
        const { conservadas, descartadas } = filtrarTitulos(r.vacantes, ctx.config.filtro_titulos_excluidos);
        const res = db.upsertVacantes(conservadas, prefijoEmpresa(r.empresa), r.ok);
        if (r.ok) fuentesOk++;
        acumulado.nuevas += res.nuevas;
        acumulado.cambiadas += res.cambiadas;
        acumulado.desaparecidas += res.desaparecidas;
        acumulado.sin_cambio += res.sin_cambio;
        acumulado.descartadas += descartadas;
        detalle.push({ fuente: `${r.empresa.ats}:${r.empresa.slug}`, ok: r.ok, vacantes: conservadas.length, ...res, error: r.error });
        if (!ctx.flags.json && !ctx.flags.quiet) {
          const marca = r.ok ? "ok " : "ERR";
          const extra = r.ok ? t("refresh.linea_empresa", { vacantes: numero(conservadas.length), nuevas: numero(res.nuevas), cambiadas: numero(res.cambiadas), desaparecidas: numero(res.desaparecidas) }) : r.error ?? "";
          ctx.linea(`  ${marca} ${r.empresa.nombre.padEnd(28)} ${extra}`);
        }
      });
    }

    if (conHn) {
      try {
        const hilo = await hn.hiloDelMes();
        if (db.hnHiloLeidoHoy(hilo.id)) {
          ctx.linea(t("refresh.hn_ya_leido", { mes: hilo.mes }));
          fuentesOk++;
          detalle.push({ fuente: `hn:${hilo.mes}`, ok: true, vacantes: 0, nuevas: 0, cambiadas: 0, desaparecidas: 0 });
        } else {
          ctx.linea(t("refresh.hn_leyendo", { titulo: hilo.titulo }));
          const r = await hn.obtener(ctx.config.hn.requiere, ctx.config.hn.alguna_de);
          const res = db.upsertVacantes(r.vacantes, `hn:${r.mes}:`, false);
          db.hnRegistrarHilo(r.hiloId, r.mes, r.comentarios, r.conservados);
          fuentesOk++;
          acumulado.nuevas += res.nuevas;
          acumulado.cambiadas += res.cambiadas;
          acumulado.sin_cambio += res.sin_cambio;
          detalle.push({ fuente: `hn:${r.mes}`, ok: true, vacantes: r.conservados, ...res });
          ctx.linea(t("refresh.hn_resumen", { fraccion: fraccion(r.conservados, r.comentarios), nuevas: numero(res.nuevas) }));
        }
      } catch (e) {
        detalle.push({ fuente: "hn", ok: false, vacantes: 0, nuevas: 0, cambiadas: 0, desaparecidas: 0, error: (e as Error).message });
        ctx.linea(`  ERR HN: ${(e as Error).message}`);
      }
    }

    db.cerrarCorrida(corrida, { fuentes_ok: fuentesOk, fuentes_total: totalFuentes, nuevas: acumulado.nuevas, cambiadas: acumulado.cambiadas, desaparecidas: acumulado.desaparecidas });
    const pendientes = db.contarPendientes();
    const resumen = t("refresh.resumen", {
      fraccion: fraccion(fuentesOk, totalFuentes),
      nuevas: numero(acumulado.nuevas),
      cambiadas: numero(acumulado.cambiadas),
      desaparecidas: numero(acumulado.desaparecidas),
      descartadas: numero(acumulado.descartadas),
      pendientes: numero(pendientes),
    });
    ctx.linea("");
    ctx.linea(resumen);
    escribirLog(`${new Date().toISOString()} ${resumen}`);
    ctx.siguiente(pendientes > 0 ? "camello pending" : "camello shortlist");
    return ctx.terminar({ corrida, ...acumulado, pendientes, fuentes: detalle }, { ok: fuentesOk, total: totalFuentes });
  },
};

/** data/refresh.log rotado a 1 MB (tarea 12). */
function escribirLog(linea: string): void {
  try {
    const dir = enRaiz("data");
    mkdirSync(dir, { recursive: true });
    const ruta = enRaiz("data", "refresh.log");
    if (existsSync(ruta) && statSync(ruta).size > 1024 * 1024) renameSync(ruta, enRaiz("data", "refresh.log.1"));
    appendFileSync(ruta, linea + "\n");
  } catch {
    /* el log nunca rompe la corrida */
  }
}

export default comando;
