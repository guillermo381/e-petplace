# S101-B · GUION DEL GATE EN DISPOSITIVO — EL ALTA DE TARJETA

> **Fecha:** 19-ago-2026 · **Pista:** S101-B · **Lo corre:** el founder, en su teléfono.
> **Qué gatea:** no una pantalla — **el MECANISMO**. `expo-web-browser` está horneado en el
> binario desde el scaffold del 5-jul y **nunca se ejercitó** (cero consumidores en 45 días).
> Este es su primer uso real.
>
> 🔴 **FRENO VIGENTE:** si el retorno del navegador a la app **no cierra limpio**, se
> **frena y se escala**. Pasar al WebView embebido es **build nativa + tren de
> distribución**, y esa decisión es del founder, no de la pista.

---

## §0 · ✅ LAS DOS PRECONDICIONES, CUMPLIDAS (19-ago, autorizadas por mesa)

| # | Qué era | Estado |
|---|---|---|
| **P1** | `EXPO_PUBLIC_PAGOS_ALTA_URL` | ✅ cargada con el dominio estable medido |
| **P2** | punto de entrada en la app | ✅ **celda en Cuenta**, aprobada como **ANDAMIO DE GATE, no superficie definitiva** |

**La celda se dibuja SOLO si la config está presente** (condición de mesa): sin
`EXPO_PUBLIC_PAGOS_ALTA_URL`, **la celda no existe**. *Una entrada que se ofrece y no puede
abrir nada es peor que ninguna: se toca, no pasa nada, y el que la tocó no sabe si falló él
o la app.*

Su literal lo dice honesto: **«Gate S101-B · agregar tarjeta»**. **Muere con el gate**
(Ley 37), igual que la entrada de la lámina de S74 que vive dos filas más arriba. **La casa
definitiva de «medios de pago» se decide en SU gate, no acá.**

<details><summary>Texto original de §0, conservado (las precondiciones cuando faltaban)</summary>

### 🔴 DOS PRECONDICIONES QUE FALTAN — el gate NO se puede convocar todavía

**Se declaran acá, y no en una nota al pie, porque sin ellas el founder abre la app y no
encuentra nada que tocar.** Las dos son trabajo de pista, no del founder:

| # | Qué falta | Por qué bloquea |
|---|---|---|
| **P1** | **`EXPO_PUBLIC_PAGOS_ALTA_URL`** en la config del cliente, apuntando al dominio estable | sin ella `abrirAltaDeTarjeta()` devuelve `no_se_pudo_abrir · sin_url_configurada` **antes de abrir nada** |
| **P2** | **Un punto de entrada en la app** que llame a `abrirAltaDeTarjeta()` | hoy la función existe y **nadie la invoca**: no hay botón, no hay pantalla |

*Ambas son chicas. Se declaran antes del guion porque **convocar al founder a un gate que
no se puede correr es el modo de falla que la regla 6bis-B existe para evitar**: la pista
corre primero hasta donde el aparato la deje, y esto todavía no llega al aparato.*

**P2 tiene una decisión adentro que no es mía:** dónde vive ese punto de entrada (Cuenta ·
el checkout · una pantalla de medios de pago) es **superficie**, y se decide con la skill
de diseño y la letra. *Para el gate del mecanismo alcanza una entrada mínima; para el
producto, no.*

</details>

---

## §1 · LO QUE YA CORRIÓ — sin el founder, y contra el objeto

*(Regla 6bis-B: el circuito de la pista corre primero. Esto es lo que quedó medido, para
que el gate del founder no repita lo que ya está probado y se concentre en lo único que
solo el aparato puede decir.)*

| Pieza | Medición |
|---|---|
| Página en host propio | `HTTP 200` · **`content-type: text/html; charset=utf-8` INTACTO** ⇒ **`D-853` curada**: en host propio no hay degradación y el rodeo de mayúsculas de Supabase ya no hace falta |
| Cabeceras | `nosniff` · `X-Frame-Options: DENY` · `Referrer-Policy: no-referrer` |
| Assets del SDK | `payment_stable.min.js` **200** · su CSS **200** · jQuery **200** |
| `config.js` público | sirve 200 y publica **solo** `MODO · APP_CODE · APP_KEY · API_ALTA · EMAIL_ALTA · ESQUEMAS_VOLVER` — **cero credenciales de servidor** (verificado por grep contra el objeto servido) |
| Build de Vercel | **verde leído del log**: `✓ pagos-web construida · modo=stg · retorno=cliente://` ⇒ el fail-closed que probó en rojo ahora prueba en verde **por la razón correcta** |
| Sin `?alta=` | la página **se niega** y no deja tokenizar a ciegas |
| Endpoint | `GET`→405 · `alta` no-uuid→400 · handle inexistente→409 · sin token→400. **Residuo: `altas=0 · tarjetas_sonda=0`** |
| **Guard de origen** | **discrimina**: estable→pasa · ajeno→**403** · sin origen→**403** · **preview deploy→403** *(la trampa que la mesa señaló, confirmada empíricamente)* |
| Motor | 7 asserts + el caso 6, con el discriminador `vigente=pendiente \| vencida=abandonada \| fila_vencida_sigue=pendiente` |

**Lo que la pista NO puede correr, y por eso existe este gate:** la tokenización real dentro
del formulario de Nuvei desde un teléfono, y **el retorno del navegador a la app**.

---

## §2 · CÓMO LLEGA EL CAMBIO AL TELÉFONO

**Es un OTA, no una build.** Todo lo de esta tanda es **JS puro**: `expo-web-browser` ya
está en el binario desde el scaffold, así que **no hay dependencia nativa nueva** (L-134).

1. La pista publica el OTA del **cliente** contra su runtime vigente (**1.0.3**).
2. En el teléfono: **cerrar y abrir la app DOS veces** — la primera descarga el update, la
   segunda lo aplica.
3. **Antes de tocar nada, confirmar el binario y el update** (L-138 / L-160): tab
   **Cuenta → el pie** debe mostrar `update <8 chars> · <canal>`, **y esos 8 chars tienen
   que coincidir con el updateId del publish**. *Si dice `bundle embebido`, el OTA no
   aplicó y todo lo que se mida después mide otra cosa.*

---

## §3 · LA MATRIZ — los tres desenlaces

> **La regla que se verifica en TODOS:** la app **dice lo que leyó del SERVIDOR**, jamás lo
> que trajo la URL de retorno. *El `?desenlace=` es una pista; el hecho es la fila.*
> Cada caso se confirma **dos veces**: lo que muestra la app, y lo que dice la fila.

### ① `guardada` — el camino feliz, con OTP de Diners

| | |
|---|---|
| **Tarjeta** | `3641 7002 1408 08` · vencimiento futuro · CVC de 3 dígitos |
| **OTP** | **`012345`** (el de éxito) |
| **Pasos** | tocar «agregar tarjeta» → se abre **el navegador del sistema** → **verificar que la URL visible es `epetplace-pagos-stg.vercel.app`** → completar los campos **del formulario de Nuvei** → Guardar → el SDK pide el OTP → `012345` |
| **Qué tiene que pasar** | el navegador **se cierra solo** y la app vuelve diciendo **guardada** |
| **Verificación 2** | la fila del alta queda `estado='guardada'` con `tarjeta_id` poblado, y **hay UNA tarjeta nueva** con su marca y últimos 4 |

> **Lo que hay que mirar con el ojo, y solo se ve acá:** que el número de tarjeta se tipea
> **dentro de los campos que monta el SDK**. *Si en algún momento el número aparece en un
> campo con aspecto de e-PetPlace, se frena todo: sería el principio innegociable roto.*

### ② `rechazada` — el OTP que no valida

| | |
|---|---|
| **Tarjeta** | la misma `3641 7002 1408 08` |
| **OTP** | **`543210`** (el de pendiente/no validado) |
| **Qué tiene que pasar** | la app vuelve diciendo **rechazada**, con voz de la taxonomía — **jamás «fondos insuficientes»**, y jamás un error crudo |
| **Verificación 2** | la fila queda `estado='rechazada'` **con `motivo` NO NULO** |

### ③ `abandonada` — cerrando el navegador A PROPÓSITO

| | |
|---|---|
| **Pasos** | tocar «agregar tarjeta» → cuando abra el navegador, **cerrarlo sin tocar nada** |
| **Qué tiene que pasar AL VOLVER** | 🔴 la app **NO debe decir «abandonada» todavía**: el alta sigue **`pendiente`** y viva. *Decir abandonada acá sería deducirla del retorno, que es exactamente lo que la enmienda del 19-ago prohíbe.* |
| **Después** | **esperar a que pase el TTL (15 minutos)** y volver a mirar ⇒ recién ahí **`abandonada`** |
| **Verificación 2** | la fila **sigue diciendo `pendiente`** en la base, y **la lectura devuelve `abandonada`** ⇒ *la expiración es perezosa, no un `UPDATE`* |

> **Este es el caso que más fácil se aprueba mal.** Si la app dijera «abandonada» apenas
> vuelve, **parecería correcto** y estaría midiendo el retorno del navegador en vez del
> hecho. **El verde de ③ es que la app NO se apure.**

#### 🔴 CÓMO SE OBSERVA EL VENCIMIENTO — **sin editar una sola fila**

**El TTL es de 15 minutos** (`crear_alta_tarjeta`: `now() + interval '15 minutes'` — el
mismo número que el hold de la agenda de S54).

**La expiración es PEREZOSA**: nadie marca nada, la **lectura** deriva el estado. Por eso
hay exactamente **dos** formas legítimas de observarla, y ninguna toca la fila:

| Vía | Cómo |
|---|---|
| **A · esperar** | dejar pasar los 15 minutos y volver a tocar la celda / releer el alta. *Es la vía del gate en dispositivo: mide lo mismo que va a pasarle a una familia real.* |
| **B · producir** | crear un alta **que nace vencida** (`expira_en` en el pasado, en el mismo `INSERT`) y leerla. *Es la vía del arnés, y ya corrió: paso C del ensayo en seco.* |

🔴 **Lo que NO se hace, y por qué:** **jamás un `UPDATE` a mano** poniendo `estado =
'abandonada'`. *Eso no observaría el vencimiento — lo fabricaría, y encima probaría el
camino equivocado: dejaría la fila en un estado que el motor nunca escribe por sí mismo.*
**El discriminador que importa ya está medido y es justamente ése:**
`fila_vencida_sigue=pendiente` **mientras la lectura devuelve `abandonada`**. Si alguien
hubiera hecho el `UPDATE`, ese discriminador diría `abandonada` en los dos lados y **el
ensayo habría pasado sin probar nada**.

---

## §4 · LOS DOS BORDES QUE CONVIENE PISAR SI HAY TIEMPO

- **Volver atrás con el gesto del sistema** (en vez de que la página redirija): mismo
  criterio que ③ — la app relee y **no inventa**.
- **Modo avión a mitad del alta**: la app tiene que decir que no pudo, **sin declarar
  ningún desenlace**. *Un error de red no es un rechazo del banco.*

---

## §5 · QUÉ CUENTA COMO FRENO — y no como hallazgo para anotar

Se **frena y se escala** (no se cura de paso) si:

1. **El navegador no vuelve a la app** o vuelve a una pantalla equivocada ⇒ es el mecanismo
   entero, y la alternativa es build nativa: **decisión del founder**.
2. **El número de tarjeta aparece en cualquier campo que no sea del SDK.**
3. **La app declara un desenlace que la fila no dice.**

Todo lo demás —voces, composición, dónde vive el botón— es **hallazgo anotado**, va a la
bitácora y se cura después. *La diferencia importa: lo primero invalida el camino; lo
segundo es acabado.*
