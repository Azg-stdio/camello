# 03 · Ingesta: feeds ATS (Greenhouse, Lever, Ashby)

## Objetivo

Leer las vacantes públicas de cada empresa de la lista semilla y dejarlas en un formato común, listas para guardar (tarea 05).

## Endpoints públicos (sin autenticación)

| ATS | URL | Formato |
|-----|-----|---------|
| Greenhouse | `https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true` | JSON, `content` viene en HTML |
| Lever | `https://api.lever.co/v0/postings/{slug}?mode=json` | JSON, `descriptionPlain` disponible |
| Ashby | `https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true` | JSON, `descriptionHtml` |

Verificar cada uno al implementar; los campos cambian.

## Formato común (`VacanteCruda`)

```ts
{
  id: "greenhouse:lullabot:1234567",   // ats:slug:id externo
  fuente: "greenhouse",
  empresa: "Lullabot",
  titulo: "Senior Drupal Developer",
  ubicacion: "Remote - Americas",
  remoto: true | false | null,
  descripcion_texto: "...",            // HTML convertido a texto plano
  url: "https://...",
  publicada: "2026-09-01T00:00:00Z" | null,
  pago_declarado: "...",               // texto tal cual, si el ATS lo expone
  obtenida: "2026-09-06T15:00:00Z"
}
```

## Reglas

- Un módulo por ATS en `src/ingesta/`, cada uno exporta `obtener(slug): Promise<VacanteCruda[]>`.
- HTML a texto con una función propia de 30 líneas (quitar etiquetas, decodificar entidades, colapsar espacios). Sin librería.
- Feed que falla no detiene la corrida. Se reporta al final como fracción: "38/40 empresas leídas".
- Respeto: una petición por empresa por corrida, `User-Agent` identificable con la URL del repo, sin reintentos agresivos.
- Filtro previo barato **antes** del juicio: descartar títulos claramente no técnicos con una lista de palabras (ventas, contabilidad, etc.). Configurable en `config.json`.

## Entregables

- `src/ingesta/greenhouse.ts`, `lever.ts`, `ashby.ts`, `html-a-texto.ts`, `index.ts`.
- Pruebas con respuestas grabadas en `test/fixtures/` (un JSON real por ATS, recortado).
- `camello refresh` los usa (tarea 06).

## Criterio de hecho

`camello refresh` lee las 20 empresas de la Etapa 0 y guarda sus vacantes, reportando la fracción de feeds leídos.

## Dependencias

Tarea 02 (lista) y 05 (dónde guardar).
