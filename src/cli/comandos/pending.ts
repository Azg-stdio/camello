import { leerPerfil } from "../../perfil/index.js";
import { enRaiz } from "../../rutas.js";
import { numero, t, getLang } from "../../i18n/index.js";
import { recortar, tabla, type Comando, type Contexto } from "../comun.js";

const comando: Comando = {
  nombre: "pending",
  descripcion: "pending.descripcion",
  uso: "camello pending [--limit 20]",
  async ejecutar(ctx: Contexto): Promise<number> {
    const { values } = ctx.parse({ limit: { type: "string" } }, false);
    const max = ctx.config.juicio.max_por_corrida;
    const limite = Math.min(values.limit ? Number(values.limit) : max, max);
    const db = ctx.abrirDb();
    const total = db.contarPendientes();
    const filas = db.pendientesDeJuicio(limite, ctx.config.juicio.prioridad);
    const perfil = leerPerfil();

    ctx.linea(t("pending.resumen", { n: numero(filas.length), total: numero(total), max: numero(max) }));
    if (filas.length) {
      ctx.linea(tabla(filas.map((f) => [f.id, recortar(f.empresa, 22), recortar(f.titulo, 50), recortar(f.ubicacion, 24), f.duplicados > 0 ? `+${numero(f.duplicados)}` : ""]), ["ID", t("col.empresa"), t("col.titulo"), t("col.ubicacion"), t("col.copias")]));
      ctx.linea("");
      ctx.linea(t("pending.instruccion", { skill: enRaiz("skill", "juicio.md") }));
      ctx.siguiente("camello pending --json");
    } else {
      ctx.siguiente("camello shortlist");
    }
    return ctx.terminar(
      {
        idioma: getLang(),
        salario_minimo_usd_mes: ctx.config.salario_minimo_usd_mes ?? null,
        perfil: { cv: perfil.rutas.cv, preferencias: perfil.rutas.preferencias },
        prompt: enRaiz("skill", "juicio.md"),
        ejemplo: enRaiz("docs", "ejemplos", "juicio.json"),
        entregar_con: "camello judge <id> --from -",
        vacantes: filas.map((f) => ({
          id: f.id,
          fuente: f.fuente,
          empresa: f.empresa,
          titulo: f.titulo,
          ubicacion: f.ubicacion,
          remoto: f.remoto === null ? null : f.remoto === 1,
          pago_declarado: f.pago_declarado,
          url: f.url,
          publicada: f.publicada,
          juicio_obsoleto: f.juicio_obsoleto === 1,
          copias_en_otras_ciudades: f.duplicados,
          descripcion_texto: f.descripcion_texto,
        })),
      },
      { ok: filas.length, total },
    );
  },
};

export default comando;
