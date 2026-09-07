/** Tarea 13 · Palabras clave de una vacante y diff entre hoja de vida maestra y adaptada. */

const TERMINOS = [
  "drupal", "php", "symfony", "laravel", "wordpress", "twig", "composer", "phpunit",
  "javascript", "typescript", "node", "node.js", "react", "next.js", "nextjs", "vue", "nuxt", "angular", "svelte", "tailwind",
  "html", "css", "sass", "accessibility", "accesibilidad", "wcag", "seo",
  "graphql", "rest", "api", "json:api", "headless", "decoupled", "desacoplado", "microservices", "microservicios",
  "mysql", "mariadb", "postgres", "postgresql", "redis", "elasticsearch", "solr", "sqlite", "mongodb",
  "docker", "kubernetes", "terraform", "ansible", "aws", "azure", "gcp", "cloudflare", "pantheon", "acquia", "platform.sh", "lagoon", "ddev", "lando",
  "ci/cd", "github actions", "gitlab ci", "jenkins", "circleci", "git",
  "agile", "scrum", "kanban", "jira", "mentoring", "mentoría", "code review", "revisión de código", "architecture", "arquitectura",
  "migration", "migración", "migrations", "multisite", "multisitio", "performance", "rendimiento", "security", "seguridad", "caching", "varnish", "cdn",
  "python", "django", "go", "golang", "java", "ruby", "rails", ".net", "c#",
  "english", "inglés", "spanish", "español", "lead", "líder", "team lead", "tech lead", "senior", "staff", "principal", "manager",
];

export function palabrasClave(texto: string, extra: string[] = []): { termino: string; veces: number }[] {
  const s = texto.toLowerCase();
  const out: { termino: string; veces: number }[] = [];
  for (const termino of [...new Set([...TERMINOS, ...extra.map((e) => e.toLowerCase())])]) {
    const re = new RegExp(`(^|[^a-z0-9])${termino.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}(?![a-z0-9])`, "g");
    const veces = (s.match(re) ?? []).length;
    if (veces > 0) out.push({ termino, veces });
  }
  return out.sort((a, b) => b.veces - a.veces || a.termino.localeCompare(b.termino));
}

function normalizarFrase(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();
}

/** Palabras de relleno que no cuentan como afirmación nueva al comparar líneas de habilidades. */
const GENERICAS = new Set(["and", "the", "with", "for", "years", "year", "anos", "ano", "nivel", "level", "languages", "lenguajes", "frameworks", "tools", "herramientas", "practices", "practicas", "web", "data", "infrastructure", "infraestructura", "other", "otros", "cms", "platforms", "plataformas", "content", "contenido", "development", "desarrollo", "module", "modules", "module", "automated", "testing", "workflows", "generation", "migration", "deployment", "automation", "review", "coding", "standards", "agentic"].map(raiz));

/** Raíz aproximada: "mentoring" y "mentor", "migrations" y "migration" cuentan como la misma palabra. */
function raiz(w: string): string {
  return w.length > 6 ? w.slice(0, 6) : w;
}

function tokens(s: string): Set<string> {
  return new Set(
    normalizarFrase(s)
      .split(" ")
      .filter((w) => w.length > 2)
      .map(raiz),
  );
}

/** Similitud Jaccard sobre palabras: 1 = misma frase. */
export function similitud(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let comun = 0;
  for (const w of ta) if (tb.has(w)) comun++;
  return comun / (ta.size + tb.size - comun);
}

export function vinetas(md: string): string[] {
  return md
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => /^\s*[-*]\s+(.*)$/.exec(l)?.[1]?.trim())
    .filter((l): l is string => !!l && !l.startsWith("(") && !l.startsWith("..."));
}

export interface ResultadoDiff {
  logros_maestra: number;
  logros_adaptada: number;
  escogidos: { adaptada: string; maestra: string; similitud: number }[];
  /** Viñetas de la adaptada sin respaldo claro en la maestra: posibles invenciones. */
  sin_respaldo: string[];
  palabras_clave: { termino: string; en_vacante: number; en_adaptada: number }[];
  cubiertas: number;
}

export function diffCv(maestra: string, adaptada: string, textoVacante = "", umbral = 0.5): ResultadoDiff {
  const vm = vinetas(maestra);
  const va = vinetas(adaptada);
  const escogidos: ResultadoDiff["escogidos"] = [];
  const sinRespaldo: string[] = [];
  const maestraNorm = normalizarFrase(maestra);
  const tokensMaestra = tokens(maestra);
  for (const linea of va) {
    let mejor = { maestra: "", similitud: 0 };
    for (const m of vm) {
      const s = similitud(linea, m);
      if (s > mejor.similitud) mejor = { maestra: m, similitud: s };
    }
    // Una habilidad corta ("PHP (10 años)") se acepta si aparece literalmente en la maestra.
    const literal = maestraNorm.includes(normalizarFrase(linea));
    // Una línea de habilidades reagrupada se acepta si cada término técnico ya existe en la maestra.
    const terminos = [...tokens(linea)].filter((w) => !GENERICAS.has(w));
    const reagrupada = terminos.length > 0 && terminos.every((w) => tokensMaestra.has(w));
    if (mejor.similitud >= umbral || literal || reagrupada) {
      escogidos.push({ adaptada: linea, maestra: literal || (reagrupada && mejor.similitud < umbral) ? linea : mejor.maestra, similitud: literal ? 1 : reagrupada && mejor.similitud < umbral ? 0.99 : mejor.similitud });
    } else sinRespaldo.push(linea);
  }
  const claves = textoVacante ? palabrasClave(textoVacante) : [];
  const adaptadaLower = adaptada.toLowerCase();
  const palabras = claves.map((k) => ({ termino: k.termino, en_vacante: k.veces, en_adaptada: palabrasClave(adaptadaLower, [k.termino]).find((x) => x.termino === k.termino)?.veces ?? 0 }));
  return {
    logros_maestra: vm.length,
    logros_adaptada: va.length,
    escogidos,
    sin_respaldo: sinRespaldo,
    palabras_clave: palabras,
    cubiertas: palabras.filter((p) => p.en_adaptada > 0).length,
  };
}
