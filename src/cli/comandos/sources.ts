import { ATS, leerEmpresas, leerTodas } from "../../ingesta/index.js";
import { fraccion, numero, t } from "../../i18n/index.js";
import { tabla, type Comando, type Contexto } from "../comun.js";

const comando: Comando = {
  nombre: "sources",
  descripcion: "sources.descripcion",
  uso: "camello sources list|check",
  async ejecutar(ctx: Contexto): Promise<number> {
    const { positionals } = ctx.parse({});
    const sub = positionals[0] ?? "list";
    const empresas = leerEmpresas(ctx.config.sources);

    if (sub === "list") {
      ctx.linea(t("sources.total", { n: numero(empresas.length) }));
      ctx.linea(tabla(empresas.map((e) => [e.nombre, e.ats, e.slug, (e.etiquetas ?? []).join(","), (e.contrata_en ?? []).join(",")]), ["Empresa", "ATS", "Slug", t("sources.etiquetas"), t("sources.contrata_en")]));
      ctx.siguiente("camello sources check");
      return ctx.terminar(empresas, { ok: empresas.length, total: empresas.length });
    }

    if (sub === "check") {
      ctx.linea(t("sources.verificando", { n: numero(empresas.length) }));
      const resultados = await leerTodas(empresas, 6, (r) => {
        if (!ctx.flags.json && !ctx.flags.quiet) {
          const marca = r.ok ? "ok " : "ERR";
          ctx.linea(`  ${marca} ${r.empresa.nombre.padEnd(28)} ${r.ok ? numero(r.vacantes.length).padStart(5) : "     "}  ${r.ok ? "" : r.error}`);
        }
      });
      const ok = resultados.filter((r) => r.ok).length;
      const vacantes = resultados.reduce((s, r) => s + r.vacantes.length, 0);
      ctx.linea("");
      ctx.linea(t("sources.check_resumen", { fraccion: fraccion(ok, empresas.length), vacantes: numero(vacantes) }));
      const rotos = resultados.filter((r) => !r.ok);
      if (rotos.length) {
        ctx.linea(t("sources.rotos"));
        for (const r of rotos) ctx.linea(`  - ${r.empresa.nombre}: ${ATS[r.empresa.ats].urlFeed(r.empresa.slug)} (${r.error})`);
      }
      ctx.siguiente("camello refresh");
      return ctx.terminar(
        resultados.map((r) => ({ empresa: r.empresa.nombre, ats: r.empresa.ats, slug: r.empresa.slug, ok: r.ok, vacantes: r.vacantes.length, error: r.error ?? null, ms: r.ms })),
        { ok, total: empresas.length },
      );
    }

    throw new Error(t("comun.subcomando_desconocido", { comando: "sources", sub }));
  },
};

export default comando;
