import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { iniciarPerfil, rutaPerfil, validarPerfil, ARCHIVOS } from "../../perfil/index.js";
import { enRaiz } from "../../rutas.js";
import { fraccion, t } from "../../i18n/index.js";
import type { Comando, Contexto } from "../comun.js";

const comando: Comando = {
  nombre: "profile",
  descripcion: "profile.descripcion",
  uso: "camello profile init|check|import <archivo>",
  async ejecutar(ctx: Contexto): Promise<number> {
    const { positionals } = ctx.parse({});
    const sub = positionals[0] ?? "check";

    if (sub === "init") {
      const creados = iniciarPerfil();
      ctx.linea(creados.length ? t("profile.init_creados") : t("profile.init_nada"));
      for (const c of creados) ctx.linea(`  + ${c}`);
      ctx.siguiente("camello profile check");
      return ctx.terminar({ creados });
    }

    if (sub === "check") {
      const r = validarPerfil();
      ctx.linea(t("profile.check_resumen", { fraccion: fraccion(r.correctos, r.total) }));
      for (const p of r.problemas) ctx.linea(`  - ${p.archivo}: ${t(p.clave, p.valores ?? {})}`);
      if (r.ok) ctx.linea(t("profile.check_ok"));
      ctx.siguiente(r.ok ? "camello refresh" : `camello profile init`);
      return ctx.terminar({ ok: r.ok, problemas: r.problemas.map((p) => ({ ...p, mensaje: t(p.clave, p.valores ?? {}) })) }, { ok: r.correctos, total: r.total }, true);
    }

    if (sub === "import") {
      const archivo = positionals[1];
      if (!archivo) throw new Error(t("profile.import_sin_archivo"));
      const ruta = resolve(archivo);
      if (!existsSync(ruta)) throw new Error(t("profile.import_no_existe", { ruta }));
      const destino = rutaPerfil(ARCHIVOS.cv);
      const plantilla = enRaiz("docs", "ejemplos", "cv.ejemplo.md");
      const instrucciones = t("profile.import_instrucciones", { ruta, destino, plantilla });
      ctx.linea(instrucciones);
      ctx.siguiente("camello profile check");
      return ctx.terminar({ archivo: ruta, destino, plantilla, existe_destino: existsSync(destino), instrucciones });
    }

    throw new Error(t("comun.subcomando_desconocido", { comando: "profile", sub }));
  },
};

export default comando;
