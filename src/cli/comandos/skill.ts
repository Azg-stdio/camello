import { enRaiz } from "../../rutas.js";
import { getLang, t } from "../../i18n/index.js";
import { version } from "../camello.js";
import type { Comando, Contexto } from "../comun.js";

const comando: Comando = {
  nombre: "skill",
  descripcion: "skill.descripcion",
  uso: "camello skill",
  async ejecutar(ctx: Contexto): Promise<number> {
    ctx.parse({}, false);
    const dir = enRaiz("skill");
    const skillMd = getLang() === "en" ? enRaiz("skill", "en", "SKILL.md") : enRaiz("skill", "SKILL.md");
    ctx.linea(t("skill.ruta", { ruta: dir, version: version() }));
    ctx.linea("");
    ctx.linea(t("skill.instrucciones", { origen: dir, destino: ".claude/skills/camello/" }));
    ctx.linea("");
    ctx.linea(t("skill.archivos"));
    for (const a of ["SKILL.md", "juicio.md", "cv.md", "aplicar.md", "en/SKILL.md"]) ctx.linea(`  - ${enRaiz("skill", a)}`);
    ctx.siguiente("camello refresh");
    return ctx.terminar({ directorio: dir, skill: skillMd, version: version(), destino_sugerido: ".claude/skills/camello/" });
  },
};

export default comando;
