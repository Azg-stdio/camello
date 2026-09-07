import { ESTADOS, type Estado } from "../../tipos.js";
import { adaptadaPara } from "./apply.js";
import { fecha, numero, t } from "../../i18n/index.js";
import { recortar, tabla, type Comando, type Contexto } from "../comun.js";

const comando: Comando = {
  nombre: "status",
  descripcion: "status.descripcion",
  uso: "camello status <id> <estado> [--nota \"...\"] [--cv <archivo>] | --list [estado]",
  async ejecutar(ctx: Contexto): Promise<number> {
    const { values, positionals } = ctx.parse({ nota: { type: "string" }, cv: { type: "string" }, list: { type: "boolean" } });
    const db = ctx.abrirDb();

    if (values.list || positionals.length === 0) {
      const filtro = positionals[0] as Estado | undefined;
      if (filtro && !ESTADOS.includes(filtro)) throw new Error(t("status.estado_invalido", { estado: filtro, validos: ESTADOS.join(", ") }));
      const filas = db.porEstado(filtro);
      ctx.linea(t("status.lista", { n: numero(filas.length) }));
      if (filas.length) {
        ctx.linea(tabla(filas.map((f) => [t(`estado.${f.estado}`), recortar(f.empresa, 22), recortar(f.titulo, 40), fecha(f.actualizada_en), f.id]), [t("col.estado"), t("col.empresa"), t("col.titulo"), t("col.actualizada"), "ID"]));
      }
      ctx.siguiente("camello shortlist");
      return ctx.terminar(filas, { ok: filas.length, total: filas.length });
    }

    const [id, estado] = positionals as [string, string | undefined];
    if (!estado) throw new Error(t("status.sin_estado", { validos: ESTADOS.join(", ") }));
    if (!ESTADOS.includes(estado as Estado)) throw new Error(t("status.estado_invalido", { estado, validos: ESTADOS.join(", ") }));
    const v = db.vacante(id);
    if (!v) {
      ctx.error(t("show.no_existe", { id }));
      return ctx.terminar(null, { ok: 0, total: 1 }, false);
    }
    // Al marcar `aplicada` sin --cv, se registra el PDF de la carpeta de la vacante, que es el que se subió.
    const cv = values.cv ?? (estado === "aplicada" ? adaptadaPara(v).pdf : null);
    const r = db.setEstado(id, estado as Estado, values.nota ?? null, cv);
    ctx.linea(t("status.cambiado", { id, de: r.de ? t(`estado.${r.de}`) : "·", a: t(`estado.${r.a}`) }));
    if (cv) ctx.linea(t("status.cv_registrado", { ruta: cv }));
    ctx.siguiente(estado === "preseleccionada" ? `camello cv tailor ${id}` : `camello show ${id}`);
    return ctx.terminar({ id, cv, ...r });
  },
};

export default comando;
