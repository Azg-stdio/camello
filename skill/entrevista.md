# Preparar la llamada de filtro o la entrevista · reglas para el agente

Escribes `<empresa>-entrevista.md` en la carpeta de la vacante: preguntas probables y respuestas listas para decir en voz alta, en el idioma de la vacante. El usuario lo lee antes de la llamada y lo tiene abierto durante. Nunca se envía a nadie.

## Cuándo

- **Antes de que el usuario envíe** si el formulario avisa de una llamada, entrevista automática o prueba inmediata ("you will receive a call from our AI assistant", "screening call within minutes"). Varias agencias de LATAM llaman con una IA a los cinco minutos de enviar y una llamada sin preparación se pierde.
- Cuando el usuario lo pida ("prepárame para la llamada de X", "me van a entrevistar en X").
- Al terminar de aplicar, ofrécelo si no existe.

## Flujo

1. `camello apply <id> --json`. Usa `vacante`, `juicio` (fortalezas, brechas, pago), `candidato`, `perfil` y `salario_minimo_usd_mes`. El texto completo del anuncio sale de `camello show <id> --completa --json` o de `camello cv tailor <id> --json`.
2. Lee `profile/cv.md` y `profile/preferencias.md` completos. Lee la hoja de vida adaptada de esa carpeta para que la llamada cuente lo mismo que el PDF.
3. Escribe `cv.entrevista` (la ruta la da `apply`) con el formato de abajo.
4. Muestra al usuario las respuestas marcadas `[revisa]` y pídele que las ajuste con sus palabras. Son las que dependen de motivos personales que el perfil no registra.

## Reglas

1. **Solo hechos del perfil.** Cada afirmación sale de `cv.md`, `preferencias.md` o del juicio. Las brechas se responden con honestidad, nombrando lo que sí hay y cómo lo cubriría, nunca fingiendo el conocimiento.
2. **Idioma de la vacante.** Anuncio en inglés, documento en inglés. Las preguntas también, porque son las que va a oír.
3. **Respuestas para decir, no para leer.** Primera persona, 3 a 5 oraciones, sin listas dentro de la respuesta. Que quepan en 30 a 45 segundos hablados.
4. **Las mismas reglas de redacción de `cv.md`**: sin frases de modelo, sin "not just X but Y", sin punto y coma ni dos puntos dentro de una respuesta, sin rayas largas.
5. **Motivos personales, marcados.** "Por qué buscas cambio", "metas a tres años", "por qué esta empresa" llevan un borrador razonable y la marca `[revisa]` al inicio de la respuesta. El usuario decide qué decir de su vida.
6. **Salario con número.** Usa `salario_minimo_usd_mes` y `preferencias.md`. Si el anuncio publica banda, la respuesta se ubica dentro de ella y dice si es como contratista o empleado. Si no hay banda, da la cifra anual esperada y pregunta por la banda del país.
7. **Preguntas del anuncio.** De 3 a 5 preguntas que un entrevistador sacaría de los requisitos del anuncio, con la respuesta apoyada en el logro exacto de la maestra.
8. **Una por brecha.** Cada brecha del juicio genera una pregunta y su respuesta honesta.
9. **Preguntas para hacerles.** De 4 a 6, específicas del anuncio (equipo, stack, proceso, contrato, siguiente paso). Nunca genéricas.
10. **Datos rápidos arriba.** Cinco líneas con lo que hay que tener presente antes de contestar el teléfono.

## Formato

```markdown
---
vacante: greenhouse:ejemplo:1234567
empresa: Ejemplo
titulo: Senior Frontend Engineer
idioma_documento: en
preparada_en: 2026-09-07
---

# Quick facts
- Role and team, in one line.
- What the company builds, in one line.
- Pay range from the posting, or "not published".
- The two things the posting asks for first.
- Your one-line answer on location, time zone and availability.

# Your story in 60 seconds
One paragraph, first person, the pitch aligned to this posting.

# Likely questions

## General
### Tell me about yourself.
Answer.

### Why are you looking for a new role?
[revisa] Answer.

### Why this company and this role?
[revisa] Answer.

### What are your salary expectations?
Answer with the number.

### When could you start? Where are you based and what hours do you work?
Answer.

## About the posting
### Question drawn from a requirement.
Answer with the matching achievement.

## Gaps
### Question about something the posting asks and the profile does not show.
Honest answer.

# Questions to ask them
- Specific question.
```
