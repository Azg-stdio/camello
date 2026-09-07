import { readFileSync } from "node:fs";
import { validarJuicioSeguro } from "../../juicio/esquema.js";
import { htmlATexto } from "../../ingesta/html-a-texto.js";
import { obtenerTexto } from "../../ingesta/http.js";
import { createHash } from "node:crypto";
import { numero, t } from "../../i18n/index.js";
import { leerStdin, type Comando, type Contexto } from "../comun.js";
import type { VacanteCruda } from "../../tipos.js";

/** `camello judge <url>`: descarga el HTML, lo convierte a texto y lo guarda como fuente `manual`. */
export async function vacanteDesdeUrl(url: string): Promise<VacanteCruda> {
  const html = await obtenerTexto(url, 30000);
  const titulo = htmlATexto(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "").split(/\s[|·-]\s/)[0]?.trim() || url;
  const cuerpo = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html;
  const empresa = new URL(url).hostname.replace(/^www\./, "").split(".")[0] ?? "manual";
  const id = `manual:${empresa}:${createHash("sha1").update(url).digest("hex").slice(0, 12)}`;
  return {
    id,
    fuente: "manual",
    empresa,
    titulo,
    ubicacion: null,
    remoto: null,
    descripcion_texto: htmlATexto(cuerpo),
    url,
    publicada: null,
    pago_declarado: null,
    obtenida: new Date().toISOString(),
  };
}

const comando: Comando = {
  nombre: "judge",
  descripcion: "judge.descripcion",
  uso: "camello judge <id|url> [--from <archivo.json|->]",
  async ejecutar(ctx: Contexto): Promise<number> {
    const { values, positionals } = ctx.parse({ from: { type: "string" } });
    const objetivo = positionals[0];
    if (!objetivo) throw new Error(t("judge.sin_objetivo"));
    const db = ctx.abrirDb();

    let id = objetivo;
    if (/^https?:\/\//i.test(objetivo)) {
      const v = await vacanteDesdeUrl(objetivo);
      const nueva = db.guardarVacanteManual(v);
      id = v.id;
      ctx.linea(t(nueva ? "judge.url_guardada" : "judge.url_actualizada", { id, titulo: v.titulo, chars: numero(v.descripcion_texto.length) }));
      if (!values.from) {
        ctx.linea(t("judge.url_siguiente", { id }));
        ctx.siguiente(`camello show ${id} --completa`);
        return ctx.terminar({ id, vacante: v, guardada: true, juicio: null });
      }
    }

    const vacante = db.vacante(id);
    if (!vacante) {
      ctx.error(t("show.no_existe", { id }));
      return ctx.terminar(null, { ok: 0, total: 1 }, false);
    }
    if (!values.from) throw new Error(t("judge.sin_from"));

    const crudo = values.from === "-" ? await leerStdin() : readFileSync(values.from, "utf8");
    let obj: unknown;
    try {
      obj = JSON.parse(crudo);
    } catch (e) {
      ctx.error(t("judge.json_invalido", { error: (e as Error).message }));
      return ctx.terminar(null, { ok: 0, total: 1 }, false);
    }
    // Se acepta una lista de juicios para lotes.
    const lista = Array.isArray(obj) ? obj : [obj];
    let guardados = 0;
    const resultados: { vacante_id: string; ok: boolean; error?: string; veredicto?: string; puntaje?: number }[] = [];
    for (const item of lista) {
      const r = validarJuicioSeguro(item);
      if (!r.ok) {
        const vid = typeof item === "object" && item && "vacante_id" in item ? String((item as { vacante_id: unknown }).vacante_id) : id;
        ctx.error(t("judge.rechazado", { id: vid, campo: r.error.campo, motivo: r.error.motivo }));
        resultados.push({ vacante_id: vid, ok: false, error: r.error.message });
        continue;
      }
      const j = r.juicio;
      if (lista.length === 1 && j.vacante_id !== id) {
        ctx.error(t("judge.id_no_coincide", { esperado: id, llego: j.vacante_id }));
        resultados.push({ vacante_id: j.vacante_id, ok: false, error: "vacante_id" });
        continue;
      }
      if (!db.vacante(j.vacante_id)) {
        ctx.error(t("show.no_existe", { id: j.vacante_id }));
        resultados.push({ vacante_id: j.vacante_id, ok: false, error: "no existe" });
        continue;
      }
      const n = db.guardarJuicio(j);
      guardados++;
      resultados.push({ vacante_id: j.vacante_id, ok: true, veredicto: j.veredicto, puntaje: j.ajuste.puntaje });
      ctx.linea(t("judge.guardado", { id: j.vacante_id, veredicto: t(`veredicto.${j.veredicto}`), puntaje: j.ajuste.puntaje, evidencia: j.evidencia_elegibilidad ?? t("judge.sin_evidencia") }));
      if (n > 1) ctx.linea(t("judge.propagado", { n: numero(n - 1) }));
    }
    const pendientes = db.contarPendientes();
    ctx.siguiente(pendientes > 0 ? "camello pending" : "camello shortlist");
    return ctx.terminar(resultados, { ok: guardados, total: lista.length }, guardados > 0);
  },
};

export default comando;
