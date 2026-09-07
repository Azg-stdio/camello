/**
 * Tarea 05 · Almacenamiento SQLite y detección de cambios.
 * `node:sqlite`, migraciones numeradas, sin ORM.
 */
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { enRaiz } from "./rutas.js";
import type { Juicio } from "./juicio/esquema.js";
import type { Estado, VacanteCruda } from "./tipos.js";
import { t } from "./i18n/index.js";

export interface VacanteFila {
  id: string;
  fuente: string;
  empresa: string;
  titulo: string;
  ubicacion: string | null;
  remoto: number | null;
  descripcion_texto: string;
  url: string | null;
  pago_declarado: string | null;
  publicada: string | null;
  hash: string;
  primera_vez: string;
  ultima_vez: string;
  desaparecida_en: string | null;
  juicio_obsoleto: number;
}

export interface JuicioFila {
  vacante_id: string;
  version: number;
  json: string;
  veredicto: string;
  elegibilidad: string;
  puntaje: number;
  juzgado_en: string;
  juzgado_por: string;
}

export interface AplicacionFila {
  vacante_id: string;
  estado: Estado;
  notas: string | null;
  cv_adaptada: string | null;
  actualizada_en: string;
}

export interface EventoFila {
  id: number;
  vacante_id: string;
  de: string | null;
  a: string;
  fecha: string;
  nota: string | null;
}

export interface CorridaFila {
  id: number;
  inicio: string;
  fin: string | null;
  fuentes_ok: number;
  fuentes_total: number;
  nuevas: number;
  cambiadas: number;
  desaparecidas: number;
}

export interface ResultadoUpsert {
  nuevas: number;
  cambiadas: number;
  sin_cambio: number;
  desaparecidas: number;
}

export interface Resumen {
  vacantes: number;
  activas: number;
  juzgadas: number;
  pendientes: number;
  por_veredicto: Record<string, number>;
  por_elegibilidad: Record<string, number>;
  por_fuente: Record<string, number>;
  por_estado: Record<string, number>;
  ultima_corrida: CorridaFila | null;
  nuevas_7d: number;
}

export function hashVacante(v: Pick<VacanteCruda, "titulo" | "descripcion_texto">): string {
  return createHash("sha256").update(`${v.titulo}\n${v.descripcion_texto}`).digest("hex");
}

export function ahora(): string {
  return new Date().toISOString();
}

export class Db {
  readonly sql: DatabaseSync;

  constructor(ruta: string) {
    if (ruta !== ":memory:") mkdirSync(dirname(ruta), { recursive: true });
    this.sql = new DatabaseSync(ruta);
    this.sql.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    this.migrar();
  }

  static abrir(ruta: string): Db {
    return new Db(ruta);
  }

  close(): void {
    this.sql.close();
  }

  // ---------- migraciones ----------

  private migrar(): void {
    this.sql.exec("CREATE TABLE IF NOT EXISTS migraciones (nombre TEXT PRIMARY KEY, aplicada_en TEXT NOT NULL)");
    const aplicadas = new Set(
      (this.sql.prepare("SELECT nombre FROM migraciones").all() as { nombre: string }[]).map((r) => r.nombre),
    );
    const dir = enRaiz("src", "migraciones");
    if (!existsSync(dir)) throw new Error(t("db.sin_migraciones", { dir }));
    const archivos = readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const archivo of archivos) {
      if (aplicadas.has(archivo)) continue;
      const contenido = readFileSync(join(dir, archivo), "utf8");
      this.sql.exec("BEGIN");
      try {
        this.sql.exec(contenido);
        this.sql.prepare("INSERT INTO migraciones (nombre, aplicada_en) VALUES (?, ?)").run(archivo, ahora());
        this.sql.exec("COMMIT");
      } catch (e) {
        this.sql.exec("ROLLBACK");
        throw new Error(t("db.migracion_fallo", { archivo, error: (e as Error).message }));
      }
    }
  }

  // ---------- vacantes ----------

  /**
   * Inserta o actualiza las vacantes de UNA fuente/empresa. Detecta nuevas, cambiadas y desaparecidas.
   * `alcance` identifica qué conjunto de ids "debía" venir: p. ej. `greenhouse:acquia:` como prefijo.
   * Solo se marcan desaparecidas si `fuenteOk` es true.
   */
  upsertVacantes(lista: VacanteCruda[], alcancePrefijo: string, fuenteOk = true): ResultadoUpsert {
    const r: ResultadoUpsert = { nuevas: 0, cambiadas: 0, sin_cambio: 0, desaparecidas: 0 };
    const sel = this.sql.prepare("SELECT hash, desaparecida_en FROM vacantes WHERE id = ?");
    const ins = this.sql.prepare(
      `INSERT INTO vacantes (id, fuente, empresa, titulo, ubicacion, remoto, descripcion_texto, url, pago_declarado, publicada, hash, primera_vez, ultima_vez, desaparecida_en, juicio_obsoleto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0)`,
    );
    const upd = this.sql.prepare(
      `UPDATE vacantes SET titulo = ?, ubicacion = ?, remoto = ?, descripcion_texto = ?, url = ?, pago_declarado = ?, publicada = ?, hash = ?, ultima_vez = ?, desaparecida_en = NULL, juicio_obsoleto = 1
       WHERE id = ?`,
    );
    const toca = this.sql.prepare("UPDATE vacantes SET ultima_vez = ?, desaparecida_en = NULL WHERE id = ?");
    const t = ahora();
    const vistos = new Set<string>();

    this.sql.exec("BEGIN");
    try {
      for (const v of lista) {
        vistos.add(v.id);
        const h = hashVacante(v);
        const existente = sel.get(v.id) as { hash: string; desaparecida_en: string | null } | undefined;
        const remoto = v.remoto === null ? null : v.remoto ? 1 : 0;
        if (!existente) {
          ins.run(v.id, v.fuente, v.empresa, v.titulo, v.ubicacion, remoto, v.descripcion_texto, v.url, v.pago_declarado, v.publicada, h, t, t);
          r.nuevas++;
        } else if (existente.hash !== h) {
          upd.run(v.titulo, v.ubicacion, remoto, v.descripcion_texto, v.url, v.pago_declarado, v.publicada, h, t, v.id);
          r.cambiadas++;
        } else {
          toca.run(t, v.id);
          r.sin_cambio++;
        }
      }
      if (fuenteOk && alcancePrefijo) {
        const activos = this.sql
          .prepare("SELECT id FROM vacantes WHERE id LIKE ? ESCAPE '\\' AND desaparecida_en IS NULL")
          .all(escaparLike(alcancePrefijo) + "%") as { id: string }[];
        const marca = this.sql.prepare("UPDATE vacantes SET desaparecida_en = ? WHERE id = ?");
        for (const { id } of activos) {
          if (!vistos.has(id)) {
            marca.run(t, id);
            r.desaparecidas++;
          }
        }
      }
      this.sql.exec("COMMIT");
    } catch (e) {
      this.sql.exec("ROLLBACK");
      throw e;
    }
    return r;
  }

  /** Inserta una vacante suelta (p. ej. `camello judge <url>`). Devuelve true si es nueva. */
  guardarVacanteManual(v: VacanteCruda): boolean {
    const r = this.upsertVacantes([v], "", false);
    return r.nuevas === 1;
  }

  vacante(id: string): VacanteFila | undefined {
    return this.sql.prepare("SELECT * FROM vacantes WHERE id = ?").get(id) as VacanteFila | undefined;
  }

  buscarVacantes(opciones: { texto?: string; remoto?: boolean; empresa?: string; desdeDias?: number; limite?: number; incluirDesaparecidas?: boolean }): VacanteFila[] {
    const cond: string[] = [];
    const args: (string | number)[] = [];
    if (!opciones.incluirDesaparecidas) cond.push("desaparecida_en IS NULL");
    if (opciones.texto) {
      const palabras = opciones.texto.split(/\s+/).filter(Boolean);
      for (const p of palabras) {
        cond.push("(titulo LIKE ? OR descripcion_texto LIKE ? OR empresa LIKE ?)");
        const like = `%${p}%`;
        args.push(like, like, like);
      }
    }
    if (opciones.remoto) cond.push("remoto = 1");
    if (opciones.empresa) {
      cond.push("empresa LIKE ?");
      args.push(`%${opciones.empresa}%`);
    }
    if (opciones.desdeDias !== undefined) {
      cond.push("primera_vez >= ?");
      args.push(new Date(Date.now() - opciones.desdeDias * 86400000).toISOString());
    }
    const where = cond.length ? `WHERE ${cond.join(" AND ")}` : "";
    const limite = opciones.limite ?? 50;
    return this.sql
      .prepare(`SELECT * FROM vacantes ${where} ORDER BY primera_vez DESC LIMIT ?`)
      .all(...args, limite) as unknown as VacanteFila[];
  }

  /**
   * Vacantes activas sin juicio o con juicio obsoleto. Con miles de pendientes, el presupuesto de juicio
   * se gasta primero en las que mencionan los términos de prioridad en el título (luego en la descripción),
   * luego en las remotas, luego por fecha.
   */
  pendientesDeJuicio(limite: number, prioridad: string[] = []): (VacanteFila & { duplicados: number })[] {
    // Los primeros términos de la lista pesan más: "drupal" en el título gana a "lead" en el título.
    const n = prioridad.length;
    const partes: string[] = [];
    const args: (string | number)[] = [];
    prioridad.forEach((p, i) => {
      const like = `%${escaparLike(p.toLowerCase())}%`;
      const peso = n - i;
      partes.push(`(CASE WHEN LOWER(v.titulo) LIKE ? ESCAPE '\\' THEN ${peso * 3} WHEN LOWER(v.descripcion_texto) LIKE ? ESCAPE '\\' THEN ${peso} ELSE 0 END)`);
      args.push(like, like);
    });
    const puntaje = partes.length ? partes.join(" + ") : "0";
    // Un mismo anuncio publicado en varias ciudades (misma empresa, mismo hash) se juzga una sola vez;
    // guardarJuicio propaga el juicio a las copias.
    return this.sql
      .prepare(
        `SELECT v.*, (SELECT COUNT(*) - 1 FROM vacantes d WHERE d.empresa = v.empresa AND d.hash = v.hash AND d.desaparecida_en IS NULL) AS duplicados
         FROM vacantes v
         WHERE v.desaparecida_en IS NULL
           AND (v.juicio_obsoleto = 1 OR NOT EXISTS (SELECT 1 FROM juicios j WHERE j.vacante_id = v.id))
           AND v.id = (SELECT MIN(d.id) FROM vacantes d WHERE d.empresa = v.empresa AND d.hash = v.hash AND d.desaparecida_en IS NULL)
         ORDER BY (${puntaje}) DESC, COALESCE(v.remoto, 0) DESC, v.primera_vez DESC
         LIMIT ?`,
      )
      .all(...args, limite) as unknown as (VacanteFila & { duplicados: number })[];
  }

  /** Copias del mismo anuncio (misma empresa y hash) distintas de `id`. */
  duplicadosDe(id: string): string[] {
    return (
      this.sql
        .prepare("SELECT d.id FROM vacantes v JOIN vacantes d ON d.empresa = v.empresa AND d.hash = v.hash AND d.id <> v.id WHERE v.id = ? AND d.desaparecida_en IS NULL")
        .all(id) as { id: string }[]
    ).map((r) => r.id);
  }

  contarPendientes(): number {
    const r = this.sql
      .prepare(
        `SELECT COUNT(*) AS n FROM vacantes v
         WHERE v.desaparecida_en IS NULL
           AND (v.juicio_obsoleto = 1 OR NOT EXISTS (SELECT 1 FROM juicios j WHERE j.vacante_id = v.id))`,
      )
      .get() as { n: number };
    return r.n;
  }

  // ---------- juicios ----------

  /** Guarda el juicio y lo propaga a las copias del mismo anuncio. Devuelve cuántas vacantes quedaron juzgadas. */
  guardarJuicio(j: Juicio, propagar = true): number {
    const ids = [j.vacante_id, ...(propagar ? this.duplicadosDe(j.vacante_id) : [])];
    this.sql.exec("BEGIN");
    try {
      for (const id of ids) {
        const juicio = id === j.vacante_id ? j : { ...j, vacante_id: id };
        this.sql
          .prepare(
            `INSERT OR REPLACE INTO juicios (vacante_id, version, json, veredicto, elegibilidad, puntaje, juzgado_en, juzgado_por)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(id, j.version, JSON.stringify(juicio), j.veredicto, j.elegibilidad, j.ajuste.puntaje, j.juzgado_en, j.juzgado_por);
        this.sql.prepare("UPDATE vacantes SET juicio_obsoleto = 0 WHERE id = ?").run(id);
        // Un veredicto positivo preselecciona automáticamente si la vacante no tiene estado aún (tarea 09).
        // Solo el original: las copias por ciudad no deben llenar el pipeline.
        if (id === j.vacante_id && (j.veredicto === "aplicar" || j.veredicto === "considerar")) {
          const actual = this.aplicacion(id);
          if (!actual || actual.estado === "vista") this.setEstadoInterno(id, "preseleccionada", null, actual?.estado ?? null);
        }
      }
      this.sql.exec("COMMIT");
    } catch (e) {
      this.sql.exec("ROLLBACK");
      throw e;
    }
    return ids.length;
  }

  ultimoJuicio(vacanteId: string): Juicio | undefined {
    const fila = this.sql
      .prepare("SELECT json FROM juicios WHERE vacante_id = ? ORDER BY juzgado_en DESC LIMIT 1")
      .get(vacanteId) as { json: string } | undefined;
    return fila ? (JSON.parse(fila.json) as Juicio) : undefined;
  }

  historialJuicios(vacanteId: string): JuicioFila[] {
    return this.sql.prepare("SELECT * FROM juicios WHERE vacante_id = ? ORDER BY juzgado_en DESC").all(vacanteId) as unknown as JuicioFila[];
  }

  /** Shortlist: vacantes activas cuyo último juicio es aplicar o considerar, ordenadas por puntaje. */
  shortlist(opciones: { desdeDias?: number; incluirDescartadas?: boolean } = {}): (VacanteFila & { juicio: Juicio; estado: Estado })[] {
    const filas = this.sql
      .prepare(
        `SELECT v.*, j.json AS juicio_json, COALESCE(a.estado, 'vista') AS estado
         FROM vacantes v
         JOIN juicios j ON j.vacante_id = v.id
           AND j.juzgado_en = (SELECT MAX(juzgado_en) FROM juicios WHERE vacante_id = v.id)
         LEFT JOIN aplicaciones a ON a.vacante_id = v.id
         WHERE v.desaparecida_en IS NULL AND j.veredicto IN ('aplicar', 'considerar')
         ORDER BY j.puntaje DESC, v.primera_vez DESC`,
      )
      .all() as unknown as (VacanteFila & { juicio_json: string; estado: Estado })[];
    const desde = opciones.desdeDias !== undefined ? Date.now() - opciones.desdeDias * 86400000 : null;
    return filas
      .filter((f) => desde === null || Date.parse(f.primera_vez) >= desde)
      .filter((f) => opciones.incluirDescartadas || (f.estado !== "descartada" && f.estado !== "rechazada"))
      .map(({ juicio_json, ...resto }) => ({ ...resto, juicio: JSON.parse(juicio_json) as Juicio }));
  }

  // ---------- aplicaciones y eventos ----------

  aplicacion(vacanteId: string): AplicacionFila | undefined {
    return this.sql.prepare("SELECT * FROM aplicaciones WHERE vacante_id = ?").get(vacanteId) as AplicacionFila | undefined;
  }

  private setEstadoInterno(vacanteId: string, estado: Estado, nota: string | null, de: string | null, cvAdaptada?: string | null): void {
    const t = ahora();
    this.sql
      .prepare(
        `INSERT INTO aplicaciones (vacante_id, estado, notas, cv_adaptada, actualizada_en) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(vacante_id) DO UPDATE SET estado = excluded.estado,
           notas = COALESCE(excluded.notas, aplicaciones.notas),
           cv_adaptada = COALESCE(excluded.cv_adaptada, aplicaciones.cv_adaptada),
           actualizada_en = excluded.actualizada_en`,
      )
      .run(vacanteId, estado, nota, cvAdaptada ?? null, t);
    this.sql.prepare("INSERT INTO eventos (vacante_id, de, a, fecha, nota) VALUES (?, ?, ?, ?, ?)").run(vacanteId, de, estado, t, nota);
  }

  setEstado(vacanteId: string, estado: Estado, nota: string | null = null, cvAdaptada: string | null = null): { de: string | null; a: Estado } {
    const actual = this.aplicacion(vacanteId);
    const de = actual?.estado ?? null;
    this.setEstadoInterno(vacanteId, estado, nota, de, cvAdaptada);
    return { de, a: estado };
  }

  eventos(vacanteId: string): EventoFila[] {
    return this.sql.prepare("SELECT * FROM eventos WHERE vacante_id = ? ORDER BY fecha ASC, id ASC").all(vacanteId) as unknown as EventoFila[];
  }

  porEstado(estado?: Estado): (VacanteFila & AplicacionFila)[] {
    const where = estado ? "WHERE a.estado = ?" : "";
    const args = estado ? [estado] : [];
    return this.sql
      .prepare(
        `SELECT v.*, a.estado, a.notas, a.cv_adaptada, a.actualizada_en FROM aplicaciones a JOIN vacantes v ON v.id = a.vacante_id ${where}
         ORDER BY a.actualizada_en DESC`,
      )
      .all(...args) as unknown as (VacanteFila & AplicacionFila)[];
  }

  /** Aplicaciones en estado `aplicada` o `entrevista` sin cambios hace más de N días. */
  sinNovedad(dias: number): (VacanteFila & AplicacionFila)[] {
    const limite = new Date(Date.now() - dias * 86400000).toISOString();
    return this.sql
      .prepare(
        `SELECT v.*, a.estado, a.notas, a.cv_adaptada, a.actualizada_en FROM aplicaciones a JOIN vacantes v ON v.id = a.vacante_id
         WHERE a.estado IN ('aplicada', 'entrevista') AND a.actualizada_en < ? ORDER BY a.actualizada_en ASC`,
      )
      .all(limite) as unknown as (VacanteFila & AplicacionFila)[];
  }

  // ---------- corridas ----------

  iniciarCorrida(fuentesTotal: number): number {
    const r = this.sql.prepare("INSERT INTO corridas (inicio, fuentes_total) VALUES (?, ?)").run(ahora(), fuentesTotal);
    return Number(r.lastInsertRowid);
  }

  cerrarCorrida(id: number, datos: { fuentes_ok: number; fuentes_total: number; nuevas: number; cambiadas: number; desaparecidas: number }): void {
    this.sql
      .prepare("UPDATE corridas SET fin = ?, fuentes_ok = ?, fuentes_total = ?, nuevas = ?, cambiadas = ?, desaparecidas = ? WHERE id = ?")
      .run(ahora(), datos.fuentes_ok, datos.fuentes_total, datos.nuevas, datos.cambiadas, datos.desaparecidas, id);
  }

  ultimaCorrida(): CorridaFila | null {
    return (this.sql.prepare("SELECT * FROM corridas ORDER BY id DESC LIMIT 1").get() as CorridaFila | undefined) ?? null;
  }

  corridas(limite = 10): CorridaFila[] {
    return this.sql.prepare("SELECT * FROM corridas ORDER BY id DESC LIMIT ?").all(limite) as unknown as CorridaFila[];
  }

  // ---------- HN ----------

  hnHiloLeidoHoy(hiloId: number): boolean {
    const fila = this.sql.prepare("SELECT leido_en FROM hn_hilos WHERE hilo_id = ?").get(hiloId) as { leido_en: string } | undefined;
    return !!fila && fila.leido_en.slice(0, 10) === ahora().slice(0, 10);
  }

  hnRegistrarHilo(hiloId: number, mes: string, comentarios: number, conservados: number): void {
    this.sql
      .prepare(
        `INSERT INTO hn_hilos (hilo_id, mes, leido_en, comentarios, conservados) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(hilo_id) DO UPDATE SET leido_en = excluded.leido_en, comentarios = excluded.comentarios, conservados = excluded.conservados`,
      )
      .run(hiloId, mes, ahora(), comentarios, conservados);
  }

  // ---------- resumen ----------

  resumen(): Resumen {
    const n = (q: string, ...args: (string | number)[]) => (this.sql.prepare(q).get(...args) as { n: number }).n;
    const agrupar = (q: string): Record<string, number> => {
      const out: Record<string, number> = {};
      for (const f of this.sql.prepare(q).all() as { k: string; n: number }[]) out[f.k ?? "desconocido"] = f.n;
      return out;
    };
    // Un anuncio publicado en varias ciudades (misma empresa y hash) cuenta una sola vez en la cobertura.
    const ultimoJuicio = `SELECT j.*, v.empresa, v.hash FROM juicios j JOIN vacantes v ON v.id = j.vacante_id
      WHERE j.juzgado_en = (SELECT MAX(juzgado_en) FROM juicios WHERE vacante_id = j.vacante_id)
        AND v.id = (SELECT MIN(d.id) FROM vacantes d WHERE d.empresa = v.empresa AND d.hash = v.hash)`;
    return {
      vacantes: n("SELECT COUNT(*) AS n FROM vacantes"),
      activas: n("SELECT COUNT(*) AS n FROM vacantes WHERE desaparecida_en IS NULL"),
      juzgadas: n(`SELECT COUNT(*) AS n FROM (${ultimoJuicio})`),
      pendientes: this.contarPendientes(),
      por_veredicto: agrupar(`SELECT veredicto AS k, COUNT(*) AS n FROM (${ultimoJuicio}) GROUP BY veredicto`),
      por_elegibilidad: agrupar(`SELECT elegibilidad AS k, COUNT(*) AS n FROM (${ultimoJuicio}) GROUP BY elegibilidad`),
      por_fuente: agrupar("SELECT fuente AS k, COUNT(*) AS n FROM vacantes WHERE desaparecida_en IS NULL GROUP BY fuente"),
      por_estado: agrupar("SELECT estado AS k, COUNT(*) AS n FROM aplicaciones GROUP BY estado"),
      ultima_corrida: this.ultimaCorrida(),
      nuevas_7d: n("SELECT COUNT(*) AS n FROM vacantes WHERE primera_vez >= ?", new Date(Date.now() - 7 * 86400000).toISOString()),
    };
  }
}

function escaparLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}
