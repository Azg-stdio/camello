import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { rutaConfigLocal } from "../../config.js";
import { INTERVALOS, comandoAMostrar, estado, instalar, quitar } from "../../schedule/index.js";
import { fecha, fraccion, t } from "../../i18n/index.js";
import type { Comando, Contexto } from "../comun.js";

function guardarIntervalo(cada: string): void {
  const ruta = rutaConfigLocal();
  const actual = existsSync(ruta) ? (JSON.parse(readFileSync(ruta, "utf8")) as Record<string, unknown>) : {};
  const refresh = (actual["refresh"] as Record<string, unknown> | undefined) ?? {};
  actual["refresh"] = { ...refresh, cada };
  writeFileSync(ruta, JSON.stringify(actual, null, 2) + "\n");
}

const comando: Comando = {
  nombre: "schedule",
  descripcion: "schedule.descripcion",
  uso: "camello schedule install [--every 6h] [--dry-run] | remove | status",
  async ejecutar(ctx: Contexto): Promise<number> {
    const { values, positionals } = ctx.parse({ every: { type: "string" }, show: { type: "boolean" }, "dry-run": { type: "boolean" } });
    const sub = positionals[0] ?? "status";

    if (sub === "install") {
      const cada = values.every ?? ctx.config.refresh.cada;
      if (!INTERVALOS.includes(cada as (typeof INTERVALOS)[number])) throw new Error(t("schedule.intervalo_invalido", { cada, validos: INTERVALOS.join(", ") }));
      const mostrar = comandoAMostrar(cada);
      if (values.show || values["dry-run"]) {
        ctx.linea(t("schedule.comando_a_registrar"));
        ctx.linea(`  ${mostrar}`);
        ctx.siguiente(`camello schedule install --every ${cada}`);
        return ctx.terminar({ cada, comando: mostrar, instalado: false });
      }
      ctx.linea(t("schedule.comando_a_registrar"));
      ctx.linea(`  ${mostrar}`);
      const salida = instalar(cada);
      guardarIntervalo(cada);
      ctx.linea(t("schedule.instalado", { cada }));
      if (salida) ctx.linea(`  ${salida}`);
      ctx.siguiente("camello schedule status");
      return ctx.terminar({ cada, comando: mostrar, instalado: true, salida });
    }

    if (sub === "remove") {
      const salida = quitar();
      ctx.linea(t("schedule.quitado"));
      if (salida) ctx.linea(`  ${salida}`);
      ctx.siguiente("camello schedule status");
      return ctx.terminar({ quitado: true, salida });
    }

    if (sub === "status") {
      const e = estado();
      const ultima = ctx.abrirDb().ultimaCorrida();
      ctx.linea(e.existe ? t("schedule.existe", { cada: e.cada ?? ctx.config.refresh.cada }) : t("schedule.no_existe"));
      if (ultima) {
        ctx.linea(t("schedule.ultima_corrida", { fecha: fecha(ultima.inicio, { dateStyle: "medium", timeStyle: "short" }), fraccion: fraccion(ultima.fuentes_ok, ultima.fuentes_total) }));
      } else {
        ctx.linea(t("stats.sin_corridas"));
      }
      ctx.siguiente(e.existe ? "camello stats" : "camello schedule install --every 6h --dry-run");
      return ctx.terminar({ existe: e.existe, cada: e.cada ?? null, detalle: e.detalle, ultima_corrida: ultima });
    }

    throw new Error(t("comun.subcomando_desconocido", { comando: "schedule", sub }));
  },
};

export default comando;
