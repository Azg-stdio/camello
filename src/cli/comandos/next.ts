/** `camello next`: qué sigue en toda la búsqueda, no por vacante. Una lista corta de acciones con su comando. */
import { fecha, t, tn } from "../../i18n/index.js";
import { recortar, type Comando, type Contexto } from "../comun.js";
import { adaptadaPara } from "./apply.js";

/** Días sin novedad tras aplicar antes de sugerir un seguimiento. */
export const DIAS_SEGUIMIENTO = 7;

interface Paso {
  vacante: { id: string; empresa: string; titulo: string };
  accion: "adaptar" | "renderizar" | "aplicar" | "entrevista_prep" | "seguimiento" | "entrevista";
  comando: string;
  desde?: string;
  nota?: string | null;
}

const comando: Comando = {
  nombre: "next",
  descripcion: "next.descripcion",
  uso: "camello next",
  async ejecutar(ctx: Contexto): Promise<number> {
    ctx.parse({}, false);
    const db = ctx.abrirDb();
    const pendientes = db.contarPendientes();
    const pasos: Paso[] = [];

    for (const f of db.porEstado("preseleccionada")) {
      const cv = adaptadaPara(f);
      const v = { id: f.id, empresa: f.empresa, titulo: f.titulo };
      if (!cv.md) pasos.push({ vacante: v, accion: "adaptar", comando: `camello cv tailor ${f.id}` });
      else if (!cv.pdf) pasos.push({ vacante: v, accion: "renderizar", comando: `camello cv render "${cv.md}"` });
      else pasos.push({ vacante: v, accion: "aplicar", comando: `camello apply ${f.id}` });
    }
    for (const f of db.porEstado("aplicada")) {
      const cv = adaptadaPara(f);
      if (!cv.entrevista) pasos.push({ vacante: f, accion: "entrevista_prep", comando: `camello apply ${f.id} --json` });
    }
    for (const f of db.sinNovedad(DIAS_SEGUIMIENTO)) {
      pasos.push({ vacante: f, accion: "seguimiento", comando: `camello status ${f.id} ${f.estado} --nota "..."`, desde: f.actualizada_en, nota: f.notas });
    }
    for (const f of db.porEstado("entrevista")) {
      pasos.push({ vacante: f, accion: "entrevista", comando: `camello show ${f.id}`, desde: f.actualizada_en, nota: f.notas });
    }

    const grupos: Record<Paso["accion"], Paso[]> = { adaptar: [], renderizar: [], aplicar: [], entrevista_prep: [], seguimiento: [], entrevista: [] };
    for (const p of pasos) grupos[p.accion].push(p);

    if (pendientes > 0) ctx.linea(tn("next.pendientes", pendientes, {}));
    for (const accion of ["entrevista", "seguimiento", "aplicar", "renderizar", "adaptar", "entrevista_prep"] as const) {
      const lista = grupos[accion];
      if (!lista.length) continue;
      ctx.linea(tn(`next.${accion}`, lista.length, {}));
      for (const p of lista) {
        const cuando = p.desde ? ` · ${fecha(p.desde)}` : "";
        const nota = p.nota ? ` · ${recortar(p.nota, 50)}` : "";
        ctx.linea(`  ${recortar(p.vacante.empresa, 22)} · ${recortar(p.vacante.titulo, 40)}${cuando}${nota}`);
        ctx.linea(`    ${p.comando}`);
      }
    }
    if (pendientes === 0 && pasos.length === 0) ctx.linea(t("next.nada"));

    const siguiente = grupos.aplicar[0]?.comando ?? grupos.renderizar[0]?.comando ?? grupos.adaptar[0]?.comando ?? (pendientes > 0 ? "camello pending" : "camello refresh");
    ctx.siguiente(siguiente);
    return ctx.terminar({ pendientes, pasos, resumen: Object.fromEntries(Object.entries(grupos).map(([k, v]) => [k, v.length])), dias_seguimiento: DIAS_SEGUIMIENTO }, { ok: pasos.length, total: pasos.length + pendientes });
  },
};

export default comando;
