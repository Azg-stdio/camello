import { fecha, numero, t } from "../../i18n/index.js";
import { parsearDias, recortar, tabla, type Comando, type Contexto } from "../comun.js";

const comando: Comando = {
  nombre: "search",
  descripcion: "search.descripcion",
  uso: "camello search <texto> [--remoto] [--empresa X] [--desde 7d] [--limit 50]",
  async ejecutar(ctx: Contexto): Promise<number> {
    const { values, positionals } = ctx.parse({
      remoto: { type: "boolean" },
      empresa: { type: "string" },
      desde: { type: "string" },
      limit: { type: "string" },
      todas: { type: "boolean" },
    });
    const texto = positionals.join(" ").trim();
    const db = ctx.abrirDb();
    const limite = values.limit ? Number(values.limit) : 50;
    const filas = db.buscarVacantes({
      texto: texto || undefined,
      remoto: values.remoto,
      empresa: values.empresa,
      desdeDias: parsearDias(values.desde),
      limite,
      incluirDesaparecidas: values.todas,
    });
    ctx.linea(t("search.resultados", { n: numero(filas.length), limite: numero(limite) }));
    if (filas.length) {
      ctx.linea(
        tabla(
          filas.map((f) => [f.id, recortar(f.empresa, 22), recortar(f.titulo, 44), recortar(f.ubicacion, 24), f.remoto === 1 ? "R" : f.remoto === 0 ? "-" : "?", fecha(f.primera_vez)]),
          ["ID", t("col.empresa"), t("col.titulo"), t("col.ubicacion"), t("col.remoto"), t("col.vista")],
        ),
      );
      ctx.siguiente(`camello show ${filas[0]!.id}`);
    } else {
      ctx.siguiente("camello refresh");
    }
    return ctx.terminar(filas, { ok: filas.length, total: filas.length });
  },
};

export default comando;
