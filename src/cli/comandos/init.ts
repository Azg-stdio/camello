import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { enRaiz } from "../../rutas.js";
import { rutaConfigLocal } from "../../config.js";
import { ARCHIVOS, iniciarPerfil, rutaPerfil } from "../../perfil/index.js";
import { getLang, numero, setLang, t } from "../../i18n/index.js";
import type { Comando, Contexto } from "../comun.js";

interface Respuestas {
  lang: string;
  nombre: string;
  ciudad: string;
  email: string;
  linkedin: string;
  github: string;
  salario: number;
  contrato: string;
  zona: string;
  roles_si: string;
  roles_no: string;
  stack: string;
  evitar: string;
  cv: string;
  vault: string;
}

const TOTAL_PASOS = 12;

function leerJson(ruta: string): Record<string, unknown> {
  try {
    return existsSync(ruta) ? (JSON.parse(readFileSync(ruta, "utf8")) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function parsearMonto(s: string, defecto: number): number {
  const m = /^\s*(\d[\d.,]*)\s*(k)?/i.exec(s);
  if (!m) return defecto;
  let n = Number(m[1]!.replace(/[.,]/g, ""));
  if (m[2]) n *= 1000;
  return Number.isFinite(n) && n > 0 ? n : defecto;
}

function preferenciasMd(r: Respuestas): string {
  return [
    `# ${t("init.pref_titulo")}`,
    "",
    "## Roles que busco",
    r.roles_si,
    "",
    "## Roles que no",
    r.roles_no,
    "",
    "## Stack preferido",
    r.stack,
    "",
    "## Rango salarial mínimo (USD/mes)",
    `${numero(r.salario)}. ${t("init.pref_salario_nota")}`,
    "",
    "## Tipo de contrato aceptable",
    r.contrato,
    "",
    "## Zona horaria",
    r.zona,
    "",
    "## Idioma de trabajo",
    t("init.pref_idioma_defecto"),
    "",
    "## Empresas o sectores a evitar",
    r.evitar,
    "",
  ].join("\n");
}

function cvDesdePlantilla(r: Respuestas): string {
  const plantilla = readFileSync(enRaiz("docs", "ejemplos", "cv.ejemplo.md"), "utf8");
  const campos: Record<string, string> = { nombre: r.nombre, ciudad: r.ciudad, email: r.email, linkedin: r.linkedin, github: r.github };
  return plantilla.replace(/^---\n([\s\S]*?)\n---/, (_, front: string) => {
    const lineas = front.split("\n").map((l) => {
      const k = l.split(":")[0]!.trim();
      return campos[k] ? `${k}: ${campos[k]}` : l;
    });
    return `---\n${lineas.join("\n")}\n---`;
  });
}

/**
 * Lector de respuestas. En terminal usa readline; con stdin por tubería (pruebas, scripts) lee todas las
 * líneas de una vez, porque readline no encadena preguntas sobre una tubería ya cerrada.
 */
class Lector {
  private rl?: ReturnType<typeof createInterface>;
  private lineas?: string[];

  async abrir(): Promise<void> {
    if (process.stdin.isTTY) {
      this.rl = createInterface({ input: process.stdin, output: process.stdout });
    } else {
      const trozos: Buffer[] = [];
      for await (const c of process.stdin) trozos.push(c as Buffer);
      this.lineas = Buffer.concat(trozos).toString("utf8").split(/\r?\n/);
    }
  }

  async pregunta(texto: string): Promise<string> {
    if (this.rl) return (await this.rl.question(texto)).trim();
    process.stdout.write(texto);
    const r = (this.lineas?.shift() ?? "").trim();
    process.stdout.write(r + "\n");
    return r;
  }

  cerrar(): void {
    this.rl?.close();
  }
}

let lector: Lector | undefined;

async function asistente(ctx: Contexto): Promise<Respuestas> {
  const rl = lector!;
  let paso = 0;
  const preguntar = async (clave: string, defecto: string): Promise<string> => {
    paso++;
    const etiqueta = `[${paso}/${TOTAL_PASOS}] ${t(clave)}`;
    const r = await rl.pregunta(`${etiqueta}${defecto ? ` (${defecto})` : ""}: `);
    return r || defecto;
  };
  {
    ctx.linea(t("init.intro"));
    ctx.linea("");
    const lang = (await preguntar("init.p_idioma", ctx.config.lang)).toLowerCase().startsWith("en") ? "en" : "es";
    setLang(lang);
    const nombre = await preguntar("init.p_nombre", "");
    const ciudad = await preguntar("init.p_ciudad", t("init.d_ciudad"));
    const email = await preguntar("init.p_email", "");
    const linkedin = await preguntar("init.p_linkedin", "");
    const github = await preguntar("init.p_github", "");
    const salario = parsearMonto(await preguntar("init.p_salario", "4000"), 4000);
    const opcion = await preguntar("init.p_contrato", "1");
    const contrato = t(opcion.startsWith("2") ? "init.c_eor" : opcion.startsWith("3") ? "init.c_local" : opcion.startsWith("4") ? "init.c_cualquiera" : "init.c_contratista");
    const zona = await preguntar("init.p_zona", t("init.d_zona"));
    const roles_si = await preguntar("init.p_roles_si", t("init.d_roles_si"));
    const roles_no = await preguntar("init.p_roles_no", t("init.d_roles_no"));
    const stack = await preguntar("init.p_stack", t("init.d_stack"));
    // Dos preguntas opcionales fuera del conteo: archivo de hoja de vida y vault.
    const cv = await rl.pregunta(`${t("init.p_cv")}: `);
    const vault = await rl.pregunta(`${t("init.p_vault")}: `);
    return { lang, nombre, ciudad, email, linkedin, github, salario, contrato, zona, roles_si, roles_no, stack, evitar: t("init.d_evitar"), cv, vault };
  }
}

const comando: Comando = {
  nombre: "init",
  descripcion: "init.descripcion",
  uso: "camello init [--yes]",
  async ejecutar(ctx: Contexto): Promise<number> {
    const { values } = ctx.parse({ yes: { type: "boolean", short: "y" }, asistente: { type: "boolean" } }, false);
    const interactivo = !values.yes && !ctx.flags.json && (process.stdin.isTTY || values.asistente);
    const creados: string[] = [];

    const dataDir = enRaiz("data");
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
      creados.push(dataDir);
    }

    const local = rutaConfigLocal();
    const config = leerJson(local);
    let respuestas: Respuestas | null = null;

    if (interactivo) {
      lector = new Lector();
      await lector.abrir();
      respuestas = await asistente(ctx);
      config["lang"] = respuestas.lang;
      config["salario_minimo_usd_mes"] = respuestas.salario;
      if (respuestas.vault) config["obsidian"] = { ...((config["obsidian"] as object) ?? {}), vault: resolve(respuestas.vault), carpeta: "Camello" };
      mkdirSync(rutaPerfil("adaptadas"), { recursive: true });
      const rutaPref = rutaPerfil(ARCHIVOS.preferencias);
      if (!existsSync(rutaPref) || (await confirmar(t("init.sobrescribir_pref")))) {
        writeFileSync(rutaPref, preferenciasMd(respuestas));
        creados.push(rutaPref);
      }
      const rutaCv = rutaPerfil(ARCHIVOS.cv);
      if (!existsSync(rutaCv)) {
        writeFileSync(rutaCv, cvDesdePlantilla(respuestas));
        creados.push(rutaCv);
      }
      lector.cerrar();
      lector = undefined;
    } else {
      creados.push(...iniciarPerfil());
    }

    config["lang"] ??= ctx.config.lang;
    config["refresh"] ??= { cada: ctx.config.refresh.cada };
    config["tasa_cop"] ??= ctx.config.tasa_cop;
    const existia = existsSync(local);
    writeFileSync(local, JSON.stringify(config, null, 2) + "\n");
    if (!existia) creados.push(local);

    ctx.abrirDb();
    ctx.linea("");
    ctx.linea(t("init.listo", { db: ctx.rutaDb }));
    for (const c of creados) ctx.linea(`  + ${c}`);
    if (creados.length === 0) ctx.linea(t("init.nada_nuevo"));

    ctx.linea("");
    ctx.linea(t("init.pasos_titulo"));
    if (respuestas?.cv) {
      const ruta = resolve(respuestas.cv);
      ctx.linea(t("init.paso_cv_importar", { ruta }));
      ctx.linea(t("profile.import_instrucciones", { ruta, destino: rutaPerfil(ARCHIVOS.cv), plantilla: enRaiz("docs", "ejemplos", "cv.ejemplo.md") }));
    } else {
      ctx.linea(t("init.paso_cv_editar", { ruta: rutaPerfil(ARCHIVOS.cv) }));
    }
    ctx.linea(t("init.paso_check"));
    ctx.linea(t("init.paso_refresh"));
    ctx.linea(t("init.paso_dashboard"));
    ctx.siguiente("camello profile check");
    return ctx.terminar({ creados, db: ctx.rutaDb, config: local, lang: getLang(), interactivo });
  },
};

async function confirmar(pregunta: string): Promise<boolean> {
  const r = (await lector!.pregunta(`${pregunta} [s/N]: `)).toLowerCase();
  return r === "s" || r === "y" || r === "si" || r === "yes";
}

export default comando;
