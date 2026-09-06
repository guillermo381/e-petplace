
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

## 🔴 S113 · LA APP DEL CLIENTE NO ABRE POR DEEP LINK — medido por E, dueño: `packages/api`

**No es un overlay de dev: es `PantallaCaidaRaiz`.** Causa en
`packages/api/src/wrappers/adopcion-hilo-vivo.ts`: canal de **nombre fijo**
(`'mis-hilos'`) más `removeChannel` llamado con `void` ⇒ si el shell re-monta
antes de que termine, `channel()` devuelve el canal **ya suscrito** y el `.on()`
lanza.

Medido por E: **arranque limpio 0/6 · arranque con una segunda navegación 3/4 ·
volver atrás 0/3.**

⚠️ **«Una segunda navegación durante el arranque» es exactamente abrir la app
desde un QR** — o sea **el pasaporte y la placa que S113 acaba de agregar.**

Cura barata: `await removeChannel`, o nombre único por montaje (lo segundo lo
vuelve **inexpresable**). **No lo toco: no es mi territorio**, y lo levanto acá
porque es lo más grave que quedó sobre la mesa esta noche.

## 🟡 S113-D · la edge `coach` está desplegada y su fuente NO está en `main`

Vive sólo en `pista/s113-d-2.0`. Es la clase de `chat-ayuda` (**`D-717`**: una
function desplegada, facturable y **sin fuente en el repo**). No urge — la cura
es el merge, que es de A. Se anota **para que no lo descubra otro el día del
incidente.**
