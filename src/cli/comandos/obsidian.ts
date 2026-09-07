import { sincronizar, traer } from "../../obsidian/sync.js";
import { numero, t } from "../../i18n/index.js";
import type { Comando, Contexto } from "../comun.js";

const comando: Comando = {
  nombre: "obsidian",
  descripcion: "obsidian.descripcion",
  uso: "camello obsidian sync [--pull]",
  async ejecutar(ctx: Contexto): Promise<number> {
    const { values, positionals } = ctx.parse({ pull: { type: "boolean" } });
    const sub = positionals[0] ?? "sync";
    if (sub !== "sync") throw new Error(t("comun.subcomando_desconocido", { comando: "obsidian", sub }));
    const db = ctx.abrirDb();

    let pull = null;
    if (values.pull) {
      pull = traer(db, ctx.config);
      ctx.linea(t("obsidian.pull_resumen", { leidas: numero(pull.leidas), cambiadas: numero(pull.cambiadas.length) }));
      for (const c of pull.cambiadas) ctx.linea(`  ${c.id}: ${t(`estado.${c.de}`)} → ${t(`estado.${c.a}`)}`);
      for (const i of pull.invalidas) ctx.linea(`  ! ${i.archivo}: ${t("status.estado_invalido", { estado: i.estado, validos: "" })}`);
    }
    const r = sincronizar(db, ctx.config);
    ctx.linea(t("obsidian.sync_resumen", { escritas: numero(r.escritas), carpeta: r.carpeta }));
    ctx.linea(`  ${r.diario}`);
    ctx.linea(`  ${r.indice}`);
    ctx.siguiente("camello obsidian sync --pull");
    return ctx.terminar({ ...r, pull }, { ok: r.escritas, total: r.vacantes });
  },
};

export default comando;
