# Prompt de juicio · esquema v1

Eres el agente del usuario. Lees una vacante y su perfil, y devuelves **un JSON** que `camello judge` valida y guarda. Este documento define cada campo. La regla que manda sobre todas: **no inventes**. Si el dato no está en el texto de la vacante, usa `desconocido`, `desconocida` o `null` según el campo.

Etapa 0: el usuario reside en **Colombia**. La pregunta de elegibilidad es siempre "¿puede alguien residente en Colombia tomar este trabajo?".

## Procedimiento

1. `camello pending --json`. En `datos` vienen:
   - `vacantes[]`: id, empresa, título, ubicación, remoto, pago declarado, URL, `juicio_obsoleto` y `descripcion_texto` completo.
   - `perfil.cv` y `perfil.preferencias`: rutas de los archivos del perfil.
   - `idioma`: idioma configurado para el campo `resumen`.
   - `prompt` y `ejemplo`: rutas de este archivo y de `docs/ejemplos/juicio.json`.
2. Lee `perfil.cv` y `perfil.preferencias` **una vez** por sesión.
3. Por cada vacante, lee `descripcion_texto` completo y produce el JSON de abajo.
4. Entrega:
   - Uno por uno: `camello judge <id> --from -` con el JSON por stdin.
   - En lote: escribe un archivo con una **lista JSON** de juicios y ejecuta `camello judge <cualquier id de la lista> --from lote.json`.
5. Si `camello` rechaza un juicio, dice el campo y el motivo. Corrige ese campo y reenvía.
6. `camello shortlist`.

Notas:
- Las vacantes con `fuente: "hn"` vienen de Hacker News. Su `empresa` y `titulo` se extrajeron heurísticamente de la primera línea del comentario ("Empresa | Rol | Ubicación"); confía en el texto, no en esos campos.
- `juicio_obsoleto: true` significa que la vacante cambió desde el último juicio. Júzgala de nuevo desde cero.
- El presupuesto es `juicio.max_por_corrida` (default 20). `pending` nunca devuelve más.

## Esquema

```json
{
  "version": 1,
  "vacante_id": "greenhouse:lullabot:1234567",
  "elegibilidad": "abierta | probable | improbable | cerrada | desconocida",
  "evidencia_elegibilidad": "cita textual de la vacante, máximo 300 caracteres, o null",
  "alcance_geografico": "global | latam | americas | us_only | eu_only | otro | desconocido",
  "contrato": "contratista | empleado_eor | empleado_local | desconocido",
  "pago": {
    "min": 4000,
    "max": 5500,
    "moneda": "USD",
    "periodo": "mensual | anual | hora",
    "ajustado_a": "us | latam | desconocido",
    "evidencia": "cita textual o null"
  },
  "seniority": "junior | mid | senior | lead | staff | desconocido",
  "zona_horaria": "compatible | parcial | incompatible | desconocida",
  "idioma_requerido": "en | es | ambos | desconocido",
  "ajuste": {
    "puntaje": 0,
    "fortalezas": ["..."],
    "brechas": ["..."]
  },
  "veredicto": "aplicar | considerar | descartar",
  "resumen": "una frase en el idioma configurado",
  "juzgado_en": "2026-09-06T15:00:00Z",
  "juzgado_por": "claude-code | cursor | manual | otro"
}
```

Todos los campos son obligatorios. Los valores de enumeración se escriben exactamente así, en minúsculas.

## Campo por campo

### `version`
Siempre `1`.

### `vacante_id`
El `id` que trajo `camello pending`, sin cambios. Formato `fuente:empresa:id`.

### `elegibilidad`
Una sola pregunta: ¿puede un residente en Colombia tomar este trabajo?

| Valor | Cuándo | Frases típicas |
|-------|--------|----------------|
| `abierta` | Lo dice explícitamente. | "Remote, Latin America", "LATAM", "Americas", "Colombia", "worldwide", "anywhere", "we hire through Deel / Remote.com / Oyster", "open to candidates in South America". |
| `probable` | Remoto sin restricción declarada **y** la empresa tiene evidencia de contratar en LATAM (etiqueta `contrata_en` en la semilla, o vacantes hermanas que lo dicen). | "Fully remote", "remote-first company" sin lista de países. |
| `improbable` | Pide autorización de trabajo en otro país, o la zona horaria es incompatible, o lista países y Colombia no está pero no lo excluye de frase. | "Must be eligible to work in Canada", "Remote (EU only)", "must overlap with AEST business hours", "Remote - Germany, Spain or Portugal". |
| `cerrada` | Lo excluye explícitamente. | "Must be authorized to work in the US", "US citizens only", "US persons only", "no visa sponsorship" junto con una ubicación fija en otro país, "must be located in [país distinto de Colombia]", "Remote - United States". |
| `desconocida` | El texto no dice nada de ubicación, remoto ni autorización. | (sin frase) |

`evidencia_elegibilidad` es **obligatoria** si la elegibilidad no es `desconocida`: la frase exacta que llevó al valor, máximo 300 caracteres, sin parafrasear. Es lo que el usuario verá para verificar el veredicto en dos segundos.

### `alcance_geografico`
De dónde acepta candidatos la vacante, independiente de si Colombia cabe.

| Valor | Frases |
|-------|--------|
| `global` | "worldwide", "anywhere", "any country", "fully remote, no location restrictions". |
| `latam` | "LATAM", "Latin America", "South America", "Colombia", "México / Argentina / Brasil...". |
| `americas` | "Americas", "US time zones", "North and South America", "Western Hemisphere". |
| `us_only` | "US only", "United States", "must be located in the US", "Remote (USA)". |
| `eu_only` | "EU only", "EMEA", "Europe", "UK", "must be located in the European Union". |
| `otro` | Un país o región concreta fuera de las anteriores: "Canada only", "APAC", "India", "Australia". |
| `desconocido` | No lo dice. |

### `contrato`

| Valor | Frases |
|-------|--------|
| `contratista` | "contractor", "B2B", "independent contractor", "freelance", "invoice monthly", "via Deel / Remote.com / Oyster as contractor", "prestación de servicios". |
| `empleado_eor` | "full-time employee via Deel / Remote.com / Oyster / Velocity Global", "employer of record", "we hire employees in 100+ countries". |
| `empleado_local` | Contrato laboral de una entidad en Colombia: "contrato a término indefinido", "nómina", "prestaciones de ley", "our Bogotá / Medellín entity". |
| `desconocido` | Solo dice "full-time" sin más, o no dice nada. |

### `pago`
- `min` y `max`: números sin separadores, en la moneda y periodo declarados. Si solo hay una cifra, ponla en ambos. Si dice "competitive salary" o no hay cifras: `min: null`, `max: null` y `evidencia` cita esa frase o es `null`.
- `moneda`: código ISO de tres letras (`USD`, `COP`, `EUR`, `GBP`). Si no hay cifra, `USD` por convención.
- `periodo`: `anual` para bandas anuales, `mensual` para mensuales, `hora` para tarifas por hora.
- `ajustado_a`:
  - `us`: banda **anual** superior a USD 120.000 sin mencionar región, o dice explícitamente que la banda es para EE. UU. ("US pay range", "base salary for candidates in the US").
  - `latam`: menciona LATAM/Latin America junto a la cifra, o la banda es **mensual** en USD entre 2.000 y 8.000, o dice "adjusted by location" con ejemplos de la región.
  - `desconocido`: no hay cifra o no se puede saber.
- `evidencia`: la frase exacta con la cifra, máximo 300 caracteres, o `null`.

**Expectativa salarial del usuario.** `camello pending --json` trae `datos.salario_minimo_usd_mes` (también está en `preferencias.md`). Una banda por debajo de ese mínimo **nunca** lleva a `descartar` por sí sola: anótala en `brechas` ("Banda de USD 3.500/mes, por debajo del mínimo de 5.000") y deja que el veredicto salga de elegibilidad y ajuste. `camello` la marca como "(< mínimo)" en el shortlist y el dashboard permite ocultarlas; ocultar es decisión del usuario, no tuya.

Ejemplos: "USD 4,000 - 5,500 per month" → `{min: 4000, max: 5500, moneda: "USD", periodo: "mensual", ajustado_a: "latam"}`. "$150,000 - $190,000" sin región → `{min: 150000, max: 190000, moneda: "USD", periodo: "anual", ajustado_a: "us"}`. "$60/hr" → `{min: 60, max: 60, periodo: "hora"}`.

### `seniority`

| Valor | Frases |
|-------|--------|
| `junior` | "junior", "entry level", "0-2 years", "associate". |
| `mid` | "mid-level", "2-4 years", "software engineer II". |
| `senior` | "senior", "5+ years", "software engineer III". |
| `lead` | "lead", "tech lead", "team lead", "engineering manager" con código. |
| `staff` | "staff", "principal", "architect", "distinguished". |
| `desconocido` | No lo dice ni se infiere del título. |

### `zona_horaria`
El usuario está en UTC-5. Lee `preferencias.md` para saber cuánto solapamiento acepta.

| Valor | Frases |
|-------|--------|
| `compatible` | "US time zones", "EST/CST/PST", "Americas", "UTC-3 to UTC-8", "4+ hours overlap with EST", o sin requisito y la empresa está en América. |
| `parcial` | "overlap with CET until 2pm", "UK working hours", "at least 3 hours overlap with Europe". |
| `incompatible` | "APAC hours", "must work AEST / IST / JST", "Europe only, 9-6 CET". |
| `desconocida` | No lo dice y la empresa no tiene sede clara. |

### `idioma_requerido`

| Valor | Frases |
|-------|--------|
| `en` | Anuncio en inglés, "fluent English", "English C1". |
| `es` | Anuncio en español, "español nativo", sin exigir inglés. |
| `ambos` | "bilingual", "English and Spanish", "español e inglés". |
| `desconocido` | No se puede saber. |

### `ajuste`
- `puntaje`: entero 0 a 100. **Solo** compara los requisitos de la vacante contra el perfil (`cv.md`): stack, años, tipo de rol, responsabilidades, sector. **No** mezcles elegibilidad, pago ni zona horaria; eso lo hace el veredicto.
  - 90-100: el perfil cubre todos los requisitos obligatorios y la mayoría de los deseables.
  - 70-89: cubre los obligatorios, faltan deseables.
  - 40-69: falta un obligatorio importante.
  - 0-39: rol distinto o stack distinto.
- `fortalezas`: 1 a 4 frases concretas que citan requisito y perfil: "10 años en Drupal, el anuncio pide 5+".
- `brechas`: 0 a 4 frases concretas: "Piden Next.js como frontend desacoplado; la maestra no lo menciona". Una lista vacía `[]` es válida.

### `veredicto`

| Valor | Regla |
|-------|-------|
| `aplicar` | Elegibilidad `abierta` o `probable` **y** puntaje ≥ 70. `camello` rechaza cualquier `aplicar` que no cumpla ambas. Además el pago, contrato y zona horaria no contradicen `preferencias.md`. |
| `considerar` | Elegibilidad `abierta`, `probable` o `desconocida` con puntaje 50-69; o puntaje ≥ 70 pero pago/contrato/zona por debajo de las preferencias; o falta un dato clave que el usuario podría resolver preguntando. |
| `descartar` | Elegibilidad `cerrada` o `improbable`; o puntaje < 50; o sector/empresa en la lista de "a evitar" de `preferencias.md`. |

### `resumen`
Una frase en el idioma que indica `datos.idioma` (`es` o `en`). Dice por qué el veredicto, con los tres factores: elegibilidad, pago/contrato, ajuste.

### `juzgado_en`
Fecha y hora actual en ISO 8601 UTC: `2026-09-06T15:00:00Z`.

### `juzgado_por`
`claude-code` si eres Claude Code, `cursor` si eres Cursor, `manual` si el usuario lo escribió a mano, `otro` para cualquier otro agente.

## Ejemplo válido

```json
{
  "version": 1,
  "vacante_id": "greenhouse:ejemplo:1234567",
  "elegibilidad": "abierta",
  "evidencia_elegibilidad": "We hire full-time contractors anywhere in Latin America through Deel.",
  "alcance_geografico": "latam",
  "contrato": "contratista",
  "pago": {
    "min": 4000,
    "max": 5500,
    "moneda": "USD",
    "periodo": "mensual",
    "ajustado_a": "latam",
    "evidencia": "USD 4,000 - 5,500 per month depending on experience."
  },
  "seniority": "senior",
  "zona_horaria": "compatible",
  "idioma_requerido": "en",
  "ajuste": {
    "puntaje": 84,
    "fortalezas": [
      "10 años en Drupal, el anuncio pide 5+",
      "Experiencia liderando migraciones Drupal 7 a 10, mencionada como responsabilidad principal"
    ],
    "brechas": [
      "Piden experiencia con Next.js como frontend desacoplado; la maestra no la menciona"
    ]
  },
  "veredicto": "aplicar",
  "resumen": "Agencia Drupal remota que contrata contratistas en LATAM, banda mensual en USD clara y rol alineado con perfil de lead.",
  "juzgado_en": "2026-09-06T15:00:00Z",
  "juzgado_por": "claude-code"
}
```

## Errores que `camello` rechaza

- Campo faltante o valor fuera de la enumeración.
- `evidencia_elegibilidad` nula con elegibilidad distinta de `desconocida`.
- Evidencias de más de 300 caracteres.
- `pago.min` mayor que `pago.max`; `moneda` que no sea ISO de tres letras.
- `ajuste.puntaje` que no sea entero entre 0 y 100.
- `veredicto: aplicar` con elegibilidad `improbable`, `cerrada` o `desconocida`, o con puntaje menor a 70.
- `juzgado_en` que no sea fecha ISO válida.

Cuando rechace, corrige solo el campo nombrado y reenvía.
