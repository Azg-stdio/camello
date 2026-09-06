# 02 · Lista semilla de empresas

## Objetivo

Una lista versionada de empresas cuyos feeds públicos de ATS vamos a leer. Es lo que decide qué vacantes existen para `camello`; sin ella no hay ingesta.

## Formato: `sources/empresas.json`

```json
[
  {
    "nombre": "Lullabot",
    "ats": "lever",
    "slug": "lullabot",
    "etiquetas": ["drupal", "agencia"],
    "contrata_en": ["latam", "co"],
    "nota": "Agencia Drupal 100% remota, historial de contrataciones en LATAM",
    "agregada": "2026-09-06"
  }
]
```

- `ats`: `greenhouse | lever | ashby`. Determina la URL del feed (tarea 03).
- `slug`: el identificador de la empresa en ese ATS. Se verifica a mano abriendo el feed.
- `contrata_en`: evidencia conocida, no deseo. Vacío si no se sabe.

## Etapa 0: arranque Drupal

Empezar por donde hay señal real para mi perfil. Verificar el ATS de cada una antes de agregarla:

Acquia, Pantheon, Lullabot, Four Kitchens, Phase2, Palantir.net, Tag1 Consulting, Amazee.io, Evolving Web, Chapter Three, Mediacurrent, Third and Grove, Oomph, Kanopi Studios, Last Call Media, Bounteous, FFW (ahora JAKALA), Srijan, QED42, Axelerant, Specbee, Drupal Association.

Luego empresas remote-first conocidas por contratar en Colombia vía Deel, Remote.com u Oyster. Fuente: sus propias páginas de carreras y menciones en "Who is hiring".

## Reglas

- Cada entrada nueva se verifica: el feed responde y tiene al menos una vacante o la empresa existe en el ATS.
- `camello sources check` recorre la lista y reporta feeds rotos como fracción: "38/40 feeds respondieron".
- Contribuciones en Etapa 1 por pull request, con el mismo formato.

## Entregables

- `sources/empresas.json` con al menos 20 empresas verificadas.
- `camello sources check`.
- `docs/ejemplos/empresa.ejemplo.json`.

## Criterio de hecho

20 empresas verificadas, `camello sources check` reporta 20/20.

## Dependencias

Ninguna para escribir la lista. La verificación automática depende de la tarea 03.
