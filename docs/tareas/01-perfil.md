# 01 · Perfil y hoja de vida maestra

## Objetivo

Tener en `profile/` (ignorado por git) todo lo que el agente necesita para juzgar vacantes y adaptar la hoja de vida, en archivos Markdown que el usuario puede editar a mano.

## Archivos

```
profile/
  cv.md              hoja de vida maestra (fuente única de verdad)
  preferencias.md    qué busco y qué no
  adaptadas/         hojas de vida generadas por vacante (tarea 13)
```

### `cv.md`

Es **más larga que una hoja de vida real**. Contiene todo lo que el usuario ha hecho; la adaptación (tarea 13) selecciona. Estructura fija para que el agente la lea sin ambigüedad:

```markdown
---
nombre: Miguel Arbelaez
ciudad: Medellín, Colombia
email: ...
linkedin: ...
github: ...
idiomas: { es: nativo, en: C1 }
---

# Titular
Una línea: rol + años + especialidad. Ej: "Drupal Lead · 10 años · PHP, Symfony, arquitectura de CMS".

# Resumen
3 a 4 líneas. Sin adjetivos vacíos.

# Habilidades
Lista plana agrupada: lenguajes, frameworks, infraestructura, prácticas. Cada una con años o nivel.

# Experiencia
## Empresa · Rol · 2021–2026 · Remoto
### Banco de logros
- Cada logro con patrón Acción + Tecnología + Impacto + Alcance, con número.
- Se listan TODOS los logros relevantes; la adaptación escoge 3 a 5.

# Educación y certificaciones
# Proyectos y comunidad (opcional)
```

### `preferencias.md`

Texto libre corto pero con secciones fijas: **Roles que busco**, **Roles que no**, **Stack preferido**, **Rango salarial mínimo (USD/mes)**, **Tipo de contrato aceptable**, **Zona horaria**, **Idioma de trabajo**, **Empresas o sectores a evitar**.

## Reglas

- Sin foto, cédula, edad, estado civil ni dirección exacta (decisión 17).
- El agente puede proponer cambios a `cv.md`, pero siempre mostrando el diff y esperando confirmación. Nunca lo sobrescribe en silencio.
- `camello profile check` valida que existan los archivos y las secciones obligatorias.
- `camello profile import <archivo.pdf|.docx>` extrae texto y genera un borrador de `cv.md` para que el usuario lo corrija. Se hace con el agente leyendo el archivo, no con librería de parseo.

## Entregables

- `docs/ejemplos/cv.ejemplo.md` y `docs/ejemplos/preferencias.ejemplo.md` versionados como plantilla.
- `camello profile init` copia las plantillas a `profile/` si no existen.
- `camello profile check`.

## Criterio de hecho

Mi hoja de vida real está en `profile/cv.md` con banco de logros, `camello profile check` pasa, y nada de `profile/` aparece en `git status`.

## Dependencias

Ninguna. Se puede hacer en paralelo con la 00.
