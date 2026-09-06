# 00 · Esquema de juicio

**Es el contrato central del proyecto.** Todo lo demás (CLI, dashboard, Obsidian, adaptación de hoja de vida) lee de este JSON. Se decide antes de escribir código.

## Objetivo

Definir el JSON que el agente debe devolver por cada vacante, de modo que `camello` pueda validarlo, guardarlo y mostrarlo sin interpretar texto libre.

## Esquema (v1)

```json
{
  "version": 1,
  "vacante_id": "greenhouse:lullabot:1234567",
  "elegibilidad": "abierta | probable | improbable | cerrada | desconocida",
  "evidencia_elegibilidad": "cita textual de la vacante, máximo 300 caracteres",
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
    "fortalezas": ["...", "..."],
    "brechas": ["...", "..."]
  },
  "veredicto": "aplicar | considerar | descartar",
  "resumen": "una frase en el idioma configurado",
  "juzgado_en": "2026-09-06T15:00:00Z",
  "juzgado_por": "claude-code | cursor | manual | otro"
}
```

## Reglas

- **`elegibilidad`** responde una sola pregunta: ¿puede alguien residente en Colombia (luego: en el país configurado) tomar este trabajo? `abierta` = lo dice explícitamente; `probable` = remoto sin restricción declarada y la empresa contrata en LATAM; `improbable` = pide autorización de trabajo en otro país o zona horaria incompatible; `cerrada` = lo excluye explícitamente.
- **`evidencia_elegibilidad`** es obligatoria si la elegibilidad no es `desconocida`. Es la frase que el usuario verá para verificar el veredicto en dos segundos.
- **`pago.ajustado_a`** distingue una banda pensada para EE. UU. de una ajustada a LATAM. Si la vacante dice "competitive salary" sin cifras, `min` y `max` son `null` y `evidencia` lo cita.
- **`ajuste.puntaje`** va de 0 a 100 y solo compara requisitos de la vacante contra el perfil. No mezcla elegibilidad ni pago; eso lo hace el veredicto.
- **`veredicto`** combina todo: `aplicar` exige elegibilidad `abierta` o `probable` y puntaje ≥ 70.
- El agente **nunca inventa**. Si no encuentra el dato, usa `desconocido`.
- El JSON se valida con una función propia (sin librería de schemas). Campo faltante o valor fuera de enum = rechazo con mensaje claro.

## Entregables

- `src/juicio/esquema.ts`: tipos TypeScript + función `validarJuicio(obj): Juicio | ErrorValidacion`.
- `docs/ejemplos/juicio.json`: un ejemplo válido completo.
- Pruebas con `node:test`: un JSON válido pasa, cinco inválidos fallan con el mensaje correcto.

## Criterio de hecho

El esquema está en el repo, tiene ejemplo y pruebas, y los documentos 07, 10, 11 y 13 lo referencian sin redefinirlo.

## Dependencias

Ninguna. Es la primera tarea.
