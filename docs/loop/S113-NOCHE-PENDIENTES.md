# S113 · lo que espera al founder

Nadie se frenó por ninguno de estos. Cada uno dice **qué**, **por qué es del
founder**, **las opciones** y **el voto de la pista** — para que decidir sea
leer un párrafo, no reconstruir el problema.

---

## 1 · Las cinco mascotas de prueba marcadas como reales

**Qué.** En la familia `guillo381+8` hay cinco `PruebaC*` (todas Beagle, todas
en memorial) que quedaron con `creado_por_sistema = 'real'`: `PruebaC12896`,
`PruebaC24772`, `PruebaC37493`, `PruebaC76663`, `PruebaC82896`. El parte
anterior decía **dos**; medido, son **cinco**.

**Por qué importa.** El canon ya manda excluir la marca de fixture de todo
censo de «mascotas reales». Estas cinco **pasan el filtro**, así que hoy
inflan cualquier número de producto — el mismo agujero que S92 midió cuando
descubrió que el 80 % de las familias eran sonda.

**Opciones.** (a) marcarlas `fixture_founder_s113`, como Sombra y Bruma ·
(b) borrarlas · (c) dejarlas.

**Voto de la pista: (a).** Son el sujeto vivo de la despedida que C ejerció;
borrarlas no rompe un test, lo vuelve irreproducible, y eso no se nota. La
marca cuesta un UPDATE y arregla el censo.

## 2 · La placa: proveedor y precio

**Qué.** El motor del pasaporte está vivo y la página pública también. Falta
decidir con quién se fabrican las chapitas y a cuánto.

**Por qué es suyo.** Es una decisión comercial, y el modo nocturno la veda.

**Sin bloquear nada:** la rama `pista/s113-a-nfc` ya deja la build lista y
`docs/loop/S113-NFC-BUILD.md` tiene el procedimiento del día que se decida.

## 3 · NFC en iOS

**Qué.** Leer un tag NFC en iPhone exige un *entitlement* propio en la cuenta
de Apple. **No está medido si la cuenta lo tiene.**

**Voto de la pista:** arrancar sólo con Android y con el QR, que ya funciona en
los dos sistemas sin pedir nada. *El QR no necesita permiso de nadie.*

## 4 · El aviso legal de IA (`D-405`)

**Qué.** Cuando Nexo hable, la app tiene que decir que es IA y qué no hace.
La letra la escribe un abogado; hasta entonces rige la voz honesta de la casa.

**Por qué ahora.** El lote 2 pone a Nexo a contestar. El texto no bloquea la
construcción, pero **sí bloquea que se encienda para gente real**.

## 5 · Las fichas de raza que faltan

**Qué.** Publicadas con firma: **10** (labrador, loro yaco, beagle,
californian, persa, pug, chinchilla, schnauzer miniatura, gato común, criollo).
Cargadas y esperando lectura: el resto del Batch. **118 razas** del catálogo
ampliado todavía sin ficha.

**Ritmo firmado:** tandas de cinco por semana, perro primero, y en el día
cuando una mascota nueva declara una raza cuya ficha existe sin publicar.

## 6 · Lo que NO es del founder pero conviene que sepa

- **Dos defectos de voz** hallados caminando el 1.2.1 (ver `S113-NOCHE.md` §5):
  «etapa adulto» y una fecha ISO cruda en el carnet. **Son de C**, están
  anotados en su parte, y ninguno rompe nada — se leen mal, nada más.
- **El prestador del emulador está en 1.0.3** (agosto): no recibe los OTAs de
  runtime 1.0.7. Es del emulador, no del teléfono del founder.


## B · el gate de gates YA EXISTE, y me cazó a mí (S113-B, 2.0)

**Lo que iba a escribir acá estaba mal, y lo corrige el objeto.** Iba a
proponer que el corredor de gates enumerara los `verify:*` y saliera 2 si
alguno no existe. **Ya está construido**: `verify:gates-existen` frenó mi
propio commit por nombrar `verify:pasaporte` —que vive en `b-1.3`, sin
mergear— con el argumento exacto: *«un gate nombrado y ausente no da rojo: NO
CORRE; su silencio se lee como salud, y esa lectura la hace el que confía en
el canon»*.

**Lo que sí queda descubierto, y es angosto:** el gate protege **el canon**
(las menciones en docs), no **la consola**. Corrido a mano, `pnpm -s
verify:pasaporte` sobre un script inexistente **sale 0 y no imprime nada** —
así que una batería corrida a mano puede leerse como siete verdes cuando uno
de los siete no existe. Me pasó esta noche.

**Opciones.** (a) nada: el gate del canon alcanza, porque lo que se publica
pasa por ahí · (b) que el parte declare **contra qué rama** corrió cada gate,
que no cuesta código · (c) un `verify:todo` que enumere y falle si falta uno.

**Mi voto: (b).** (a) deja el hueco de la lectura a mano y (c) duplica lo que
`verify:gates-existen` ya hace. Y (b) además cubre un caso que ninguna de las
otras dos ve: **un gate que existe pero está midiendo otra rama** — que es
el caso real de esta noche, no una hipótesis.

**Dueño:** convención de partes (mesa). **No me frena**: lo declaro en cada
parte mientras tanto.

---

# Lo que anotó D
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

---

## C · 2.0 ① y ② — dos pedidos, medidos

### ⑧ 🔴 `InvitacionBio` NO EXISTE en ninguna rama de B

Medido: `packages/ui/src/index.ts` de `b-1.2.1`, `b-1.3` y `b-2.0` — **cero
ocurrencias**, y ningún archivo con ese nombre. El mandato la da por hecha.
**Nada que montar.** Pedido a B por nombre.

**Y le mido las cuatro entradas para que llegue con destino, no en blanco:**

| entrada | puerta de familia | estado |
|---|---|---|
| rasgos | `registrarBitacoraFamilia` | ✓ existe |
| recuerdo | `registrarRecuerdoFamilia` | ✓ existe |
| **comportamiento** | — | 🔴 **no existe** |
| **temas médicos** | — | 🔴 **no existe** |

⚠️ Lo de «temas médicos» merece su matiz: existen `declararSinAlergiasConocidas`
y `registrarEntendimientoAlergia`. **Ninguna de las dos declara una alergia.**
*Decir que no hay ninguna, y entender una que ya está, no es declararla* — y
usar cualquiera de ellas para eso escribiría un hecho clínico por la puerta de
otro.

⇒ **Cuando la pieza llegue, dos entradas se dibujan y dos no** (la ley de B para
`CeldasHoy` ya es la correcta: *sin destino no se dibuja como botón*).

### ⑨ PIDO A A, por nombre — dos puertas de familia

1. **Observación de comportamiento.** El tipo de evento existe
   (`observacion_comportamiento`, lo mapeé en el 1.1 a «recuerdos»), y **no hay
   puerta de familia** para escribirlo.
2. **Declarar una alergia o una condición.** Hoy la familia puede decir que **no
   tiene** alergias y puede **entender** una ya declarada, pero no puede
   declarar la que su vet le dijo por teléfono.

*Las dos son entradas de `InvitacionBio`, así que sin ellas la pieza nace con la
mitad de sus caminos apagados.*

---

## C · ⑩ 🔴 `InvitacionBio` Y SUS TRES PUERTAS: EL MANDATO LAS NOMBRA, NO EXISTEN

El mandato pide montarla con `registrarObservacionComportamiento`,
`declararAlergiaFamilia` y `declararCondicionFamilia`. **Medido ahora, contra el
objeto y no contra mi memoria de hace dos horas:**

| qué | dónde busqué | resultado |
|---|---|---|
| las tres funciones | `pg_proc` (la base) | **cero** |
| las tres | `packages/api` en `main`, `a-2.0 @ d79cb597`, `a-2.1 @ d4918410` | **cero** |
| `InvitacionBio` | `packages/ui` en `main` y `b-2.0 @ b3ef42a0` | **cero** |

**Nada que montar.** Las dos que sí existen —`registrarBitacoraFamilia` y
`registrarRecuerdoFamilia`— ya las tenía medidas.

⚠️ **Es la tercera vez en esta sesión que un mandato da por hecha una pieza que
no está** (`extract-documento` con otro alcance, `InvitacionBio` la primera vez,
y ahora sus tres puertas). *No es un reproche: es un patrón, y sale barato
decirlo — la pista que lo recibe pierde una hora buscando algo que nadie
construyó, y la que lo escribió no se entera.* **Voto: que el mandato marque qué
existe y qué hay que pedir**, como hizo A en su parte para C, que decía
explícitamente «lo que NO existe y no lo pidas».
