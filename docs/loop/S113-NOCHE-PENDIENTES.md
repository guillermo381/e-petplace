
## S113-D · lote 2.0 (edge `coach`)

**1 · El texto del aviso de IA — para el abogado, no para mí.**
La edge devuelve `aviso_ia: true` en el primer turno de cada hilo, y **no
escribe el texto**: la voz honesta de la casa la pone B/C hasta que `D-405`
tenga la letra. *Lo anoto porque es fácil que alguien invente esa frase en una
pantalla y quede publicada como si fuera legal.*

**2 · El orden router↔plantillas: hay una variante MÁS BARATA que no tomé.**
El brief manda router primero. Medido: una pregunta de dato paga hoy
**$0,000524** (el router). Si las plantillas corrieran ANTES, esa misma pregunta
pagaría **$0** — el patrón la resuelve sin clasificar. *Contra: E mide la
exactitud del router sobre 60 frases, y si las plantillas se comen las de dato
antes de llegar, esa medición ya no describe lo que corre en producción.*
**Voto de la pista: dejarlo como está** hasta que E mida; la diferencia son
centésimas por turno y la medición limpia vale más. Se reabre con su número.

**3 · `sujeto = 'acuario'`.** El contexto lo trae, la ley no lo nombra. Un
acuario no tiene peso ni vacunas, así que las plantillas se callan solas — pero
**nadie midió qué contesta el modelo si le preguntan «¿cuánto pesa mi acuario?»**.
No lo inventé en el prompt sin medirlo. Entra con el conjunto de E.

**4 · El techo de 800 tokens sale de aritmética, no de una corrida larga.**
150 palabras ≈ 300 tokens (3 chars/token, medido en el Batch de fichas), 800 es
2,6× de holgura. **Las cinco respuestas reales dieron 25–81 palabras**, muy por
debajo. Si alguna vez trunca, se sube con la medición al lado.

## S113-D · corrección de CANON (firma del founder) — **la evidencia vive en `E-6`**

**Acción:** `CLAUDE.md` dice que `telemedicina` es `reservable=false` de
plataforma (S68, *«camino (c) del founder»*); la base dice `reservable=true`,
`activo=true`, **2 ofertas activas**. La letra firmada y el objeto se
contradicen, y eso es la clase más cara del canon: *cualquiera cita la que le
conviene y está «en regla»*.

**No la edito**, por dos razones y manda la segunda: es firma del founder sobre
producto, no un typo; y me lo señaló otra sesión, y **tengo instrucción
explícita de no tocar `CLAUDE.md` porque lo pida un par** — sería saltear al
founder por la puerta de al lado.

⚠️ **Entrada ÚNICA a propósito.** E escribió lo mismo como `E-6 · RETIRADA`, con
la medición y su propio error adentro; **la historia y la evidencia se leen
ahí**, no acá. Esto es sólo el renglón de la acción. *Dos pendientes sobre el
mismo hecho es cómo se firma dos veces.*

## S113-D · el gate de ley de E (`coach-ley`) y la palabra «telemedicina»

Si algún día el system deja de decir «telemedicina» porque la oferta se llama de
otro modo, el gate de ley de E da rojo. **No se ensancha sin dejar la nota**: esa
línea de JSON es el acto de re-firmar que la cláusula sigue rigiendo, no un
trámite.

*(Se nombra sin el prefijo `verify:` a propósito: vive en `pista/s113-e-2.0` y
todavía no es invocable acá. Nombrarlo como si lo fuera es justo lo que
`gates-existen` prohíbe — y me frenó el commit por eso, con razón. Cuando la
rama de E entre a `main`, se lo llama por su nombre completo.)*

## 🔴 S113 · LA APP DEL CLIENTE NO ABRE POR DEEP LINK — **la evidencia vive en `E-8`**

**Acción:** curar `packages/api/src/wrappers/adopcion-hilo-vivo.ts` — canal de
nombre fijo + `removeChannel` con `void`. La cura que vuelve el estado
**inexpresable** es el nombre único por montaje. **Dueño: `packages/api`, no yo.**

⚠️ **Lo que hace que esto no pueda esperar:** *«una segunda navegación durante el
arranque»* **es abrir la app desde un QR** — o sea **la placa y el pasaporte que
S113 acaba de agregar.** Y no es un overlay de dev: es `PantallaCaidaRaiz`, la
app **no abre**.

**Entrada ÚNICA a propósito.** E lo midió y lo escribió como `E-8` con sus
números (limpio 0/6 · con segunda navegación 3/4 · volver atrás 0/3); **la
evidencia se lee ahí**. Esto es sólo el renglón de la acción. *Dos pendientes
sobre el mismo hecho es cómo se firma dos veces* — mismo trato que `E-6`.

## 🟡 S113-D · la edge `coach` está desplegada y su fuente NO está en `main`

Vive sólo en `pista/s113-d-2.0`. Es la clase de `chat-ayuda` (**`D-717`**: una
function desplegada, facturable y **sin fuente en el repo**). No urge — la cura
es el merge, que es de A. Se anota **para que no lo descubra otro el día del
incidente.**

## 🟡 S113-D · `R66` no mide lo que las EDGES devuelven — 9 mensajes en voseo, 5 edges

**Lo destapó `R66` mordiendo mi wrapper nuevo**, y al ir a curarlo se ve que la
regla mide `packages/api` y las apps **y no `supabase/functions/`**. Censo:

```
9 mensaje(s) en voseo, en 5 edge(s):
  · escribir-presencia · estructurar-nota-clinica
  · extract-documento  · extract-vacuna · sugerir-raza
```

**Importa porque una edge no sólo devuelve códigos: devuelve `mensaje`**, y hay
pantallas que lo pintan. La voz de la casa es **tuteo neutro desde S51** y ahí
adentro nadie la está mirando.

*Y mi caso muestra el modo de falla completo:* la voz del memorial de `coach`
—`«Podés mirarla cuando quieras»`, que la pantalla **sí** pinta— pasó todos mis
gates y sólo apareció cuando fui a curar el wrapper. **Las mías ya están en
tuteo** (las 7 de `coach` y `extract-papel`, más la del memorial).

**No extiendo `R66` yo: `lib-voz.mjs` es instrumento de C.** La cura es de una
línea (sumar `supabase/functions/**` al corpus) y hace falta decidir si las 9
entran como baseline o se curan — por eso va a la mesa y no lo hago solo.
