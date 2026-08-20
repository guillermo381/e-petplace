# S101-B · FASE 1 — EL CENSO DE LA SUPERFICIE DEL PAGO

> **Fecha:** 19-ago-2026 · **Pista:** S101-B (única) · **Fuente:** `PLAN_S101B_SUPERFICIE_PAGO` §3 (los 6 ítems) + las dos precisiones de la mesa.
> **Método:** medición contra la **base linkeada** (`zyltipqscdsdsxnjclhp`) y contra el **código del repo**. **Cero escritura, cero cura.**
> **Regla que rige este documento:** *si la fuente contradice a la letra o al plan, gana la fuente.* · **El censo no cura nada de paso** (orden de mesa): lo torcido se reporta con ficha y arbitra la mesa.

---

## 🔴 EL TITULAR: LA PANTALLA HOY DECLARA «ÉXITO» POR SU CUENTA, Y ESE ES EL ENCHUFE

`checkout.tsx` tiene **1367 líneas** y su función de pago son **once**:

```ts
async function pagar() {                                  // :454
  if (trabajando || compraId === null) return;
  setTrabajando(true);
  const r = await crearIntentoPago(compraId);             // :457
  setTrabajando(false);
  if (!r.ok) { mostrar({ texto: r.mensaje, variante: 'error' }); return; }
  vaciarCarrito();
  setFase('exito');                                       // :464
}
```

**`crearIntentoPago` no cobra** *(lápida vigente, medida)*: aparta la mercadería, congela el desglose y devuelve el sobre. **Y la pantalla, con ese sobre en la mano, pasa a `exito`.**

⇒ **La superficie declara pagado sin que nadie haya cobrado** — exactamente lo que `LETRA_PUERTA_DE_PAGO_S101B` §4 prohíbe (*«nunca la pantalla declara pagado por su cuenta»*).

> **Y no es un defecto de S100: era correcto para un mundo sin pasarela.** El método por defecto de `crearIntentoPago` es literalmente `'simulado'` *(medido en el wrapper: `metodo = 'simulado'`, y el checkout lo llama sin pasar método)*. **La pantalla nunca mintió: decía la verdad de un cobro simulado.** Lo que cambia en S101-B es que el cobro deja de ser simulado, y con eso esa línea pasa de correcta a falsa.

**El enchufe de S101-B es, literalmente, entre la línea 457 y la 464.**

---

## §1 · ÍTEM 1 — `checkout.tsx` HOY

| Qué | Medición |
|---|---|
| Ruta real | `apps/cliente/src/app/(tabs)/despensa/checkout.tsx` — **no** `explorar/despensa` |
| Tamaño | **1367 líneas** |
| Puerta al motor | `crearIntentoPago(compraId)` — **sin método** ⇒ cae al default `'simulado'` |
| Contrato honrado | ✅ `despensa-pedido.ts:729` — *«S101 se enchufa acá sin tocar la pantalla»* |

### 🔴 EL HUECO DE TIPO: LA ESPERA NO TIENE DÓNDE VIVIR

```ts
type Fase = 'armado' | 'resumen' | 'exito';   // :99
```

**Tres fases, y ninguna es «confirmando».** La letra §4 exige un estado de espera declarada entre el toque y la confirmación — **hoy no tiene lugar en el tipo.**

> *Es un hueco barato de llenar y caro de olvidar: sin él, el único camino desde «resumen» es «exito», y la pantalla no tiene forma de decir la verdad mientras el motor todavía no la sabe.*

**Los cuatro checkout de servicios son otra cosa** *(medido: paseo 142 · grooming 188 · adiestramiento 76 · veterinaria 179 líneas, más `components/checkout-reserva.tsx`)* — **fuera del alcance de S101-B**, que es la despensa. Se declara para que nadie los toque por parecido.

---

## §2 · ÍTEM 2 — LAS PANTALLAS DE PEDIDO VIVAS

**Existen y son tres** *(medidas)*, todas bajo la tab `pedidos`:

| Pantalla | Rol |
|---|---|
| `(tabs)/pedidos/index.tsx` | la **lista** con la escalera dibujada (importa `escaleraDePedido` de `@/lib/despensa/escalera`) |
| `(tabs)/pedidos/pedido/[pedidoId].tsx` | el **detalle** del pedido |
| `(tabs)/pedidos/en-camino/[pedidoId].tsx` | el seguimiento del envío |

**⇒ La pantalla que va a «cambiar sola» es la lista de pedidos y/o el detalle** — no el checkout, que para entonces ya quedó atrás.

**El estado se lee de la narrativa del catálogo**, no de un `switch` en la pantalla *(medido en la cabecera de `escalera.ts`)*. Y **`pagando` NO dibuja escalera** — es la firma del founder, cumplida en el código: *«una narrativa NO es automáticamente un escalón… `pagando` es ANTES de que exista una promesa»*.

> **Consecuencia para la Fase 4, y conviene tenerla escrita:** mientras el pago esté en vuelo, la lista de pedidos **no dibuja escalera a propósito**. La espera declarada de la letra §4 **no puede apoyarse en la escalera** — necesita su propia voz. *La escalera callando es correcto; la pantalla callando no.*

**Los pedidos clavados se dejan decaer** (firma de mesa, cron job 12 activo) ⇒ **todo gate usa una compra FRESCA** — reforzado por `D-851`: una reserva vencida no se puede rearmar.

---

## §3 · ÍTEM 3 — EL ESTADO REAL DEL MOTOR, RE-MEDIDO EN ESTE TURNO

*(Precisión de la mesa: contra la base, por el comando de la casa, no por memoria.)*

```
LOCAL   ls supabase/migrations/*.sql | wc -l   →  358
REMOTO  supabase migration list --linked       →  358
sin local (solo remoto): 0   ·   sin remoto (solo local): 0
```

**✅ 358 = 358, cero desemparejadas.** Y las cuatro de S101, una por una:

| Migración | local | remoto |
|---|---|---|
| `20260821000000` `webhook_events` | ✅ | ✅ |
| `20260821010000` `motor_pagos` | ✅ | ✅ |
| `20260821020000` `compuertas_pre_cobro` | ✅ | ✅ |
| `20260821030000` `tarjetas_guardadas` | ✅ | ✅ |

⇒ **Las cuatro están aplicadas y registradas. Confirmado midiendo, no heredado** — la bitácora de S101-A lo afirmaba desde el turno anterior y ahora tiene medición de éste.

**Las tres Edge Functions de pagos existen** *(medido)*: `pagos-webhook-stg` · `pagos-arnes-sandbox` · `pagos-addcard-stg`.

**Los nueve códigos tipados de `verificar_compuertas_pre_cobro`** *(leídos de la migración, ya reportados en la Fase 0)*: `compra_no_existe · compra_sin_pedidos · desglose_incompleto · monto_divergente · pago_en_proceso · pedidos_sin_reserva · reserva_vencida · token_ausente · vendedor_no_activo`. **Tres sin ensayo** — van a la matriz de la Fase 3 como rojos a producir.

---

## §4 · ÍTEM 4 — LA PÁGINA ADD CARD DE ENSAYO

`supabase/functions/pagos-addcard-stg/index.ts` — **280 líneas** *(medido)*.

**Lo que ya tiene, y es el prototipo probado:**
- **SDK real** medido contra la fuente: `payment_stable.min.js` **+ su CSS**, y `Payment.init('stg'|'prod'|'local', APP_CODE, APP_KEY)` — **el ambiente va PRIMERO**. *Hay un solo CDN: lo que separa staging de producción es ese primer argumento, no el host.*
- **Campos alojados** por el widget `PaymentForm` — **el PAN nunca entra a nuestro DOM**.
- **Los tres desenlaces con lugar desde el día uno**, y `ABANDONADA` como **estado inicial** hasta que algo diga lo contrario.
- Credenciales CLIENT **inyectadas al servir** desde secrets, jamás escritas en un HTML.

**Lo que le falta para ser producto — tres cosas, todas medidas:**

| # | Falta | Por qué |
|---|---|---|
| 1 | **El host propio** | Supabase **degrada HTML a texto plano a propósito** (anti-phishing en el dominio compartido). El `TEXT/HTML; charset=UTF-8` que hoy la sirve **es un rodeo frágil que deja de funcionar en silencio** el día que normalicen la comparación. `D-853` |
| 2 | **La puerta real** | hoy entra con `?k=<ARNES_SECRET>` ⇒ **el secreto queda en el historial del navegador**. En producto la puerta es **la sesión del usuario**, no un secreto en la query |
| 3 | **La persistencia** | el desenlace `guardada` tiene que escribir `tarjetas_guardadas` **server-side** (el cliente jamás inserta) |

> ⚠️ **`NUVEI_SDK_URL` sigue sin medir contra la doc** — sale de env con default declarado. Si la doc dice otra, **se cambia el secreto y no el archivo** *(así está construido, medido)*.

**El host propio candidato NO se elige acá** — el plan §3 ítem 4 pide confirmarlo, y **no hay dato en el repo que lo determine** (ver §7: lo no medido).

---

## §5 · ÍTEM 5 — «LA PANTALLA QUE CAMBIA SOLA»: LAS DOS OPCIONES CON SU COSTO

*(Precisión de la mesa: **el censo entrega las dos y NO decide.** La decisión es de la Fase 4, con doble check en bitácora.)*

### Opción A — suscripción realtime

| | |
|---|---|
| **Estado en el repo** | 🔴 **CERO `.channel(` en todo el monorepo** *(medido en este turno; S94-PERF midió lo mismo)* — **no hay un solo precedente construido** |
| **Costo medido** | `D-739`: el poller de WAL de realtime **ya suma 60,6 % del tiempo acumulado de la base**, sirviendo a **tres webs del legado**. Es costo de fondo — consume margen, **no** latencia percibida |
| **Lo que agrega** | latencia mínima; el cambio llega empujado |
| **Lo que cuesta** | primer consumidor de realtime del monorepo ⇒ patrón nuevo, conexión viva por pantalla abierta, y **suma a un 60 % que ya tiene dueño** |

### Opción B — polling suave en foco

| | |
|---|---|
| **Estado en el repo** | ✅ **YA CONSTRUIDO Y PROBADO EN PRODUCCIÓN** — `apps/cliente/src/app/paseo/[atencionId].tsx`: `SONDEO_MS = 30_000`, `setInterval` **montado solo en foco** y limpiado al salir |
| **Precedente de letra** | S59 lo firmó como **FRESCURA HONESTA**: sondeo ~30 s solo en foco + pull-to-refresh + «Actualizado hace X» — **y la prohibición explícita de decir «tiempo real»** |
| **Lo que agrega** | cero patrón nuevo, cero dep, cero conexión viva, y **una voz ya escrita para la honestidad de la frescura** |
| **Lo que cuesta** | latencia de hasta la cadencia; N peticiones por minuto por pantalla abierta (el peaje fijo de ~150 ms de `L-223`) |

> **Dato que la Fase 4 debería pesar y el censo no pesa por ella:** la pantalla del EN VIVO del paseo resuelve **el mismo problema** —una pantalla que cambia sola mientras un proceso ajeno avanza— **sin realtime, y lleva sesiones corriendo así.** *No es un argumento para copiarlo: es el dato de que el problema ya tuvo una respuesta en esta casa y funcionó.*

---

## §6 · ÍTEM 6 — EL RETORNO DEL WEBVIEW · 🔴 **DECIDE SI HAY BUILD NATIVA O NO**

**Este es el ítem con la consecuencia más cara del censo, y sale limpio:**

| Pieza | Medición | Consecuencia |
|---|---|---|
| **`react-native-webview`** | 🔴 **NO está instalado en NINGÚN `package.json` del monorepo** | usarlo es **dep nativa nueva ⇒ BUILD NATIVA** (L-134), y con ella un tren de distribución entero |
| **`expo-web-browser`** | ✅ **instalado en LAS DOS apps** (`~57.0.0`) — y **entró en el scaffold `98e14c97` (S43-B0, 5-jul-2026)** | estuvo presente en **todas** las builds nativas desde el origen ⇒ **está horneado en el binario vigente** ⇒ **cero build** |
| **Consumidores hoy** | **CERO** *(medido)* — instalado e **inerte** | patrón «preparado-apagado» de la casa, ya pago |
| **Scheme del cliente** | `"scheme": "cliente"` · package `com.epetplace.cliente` | el retorno del alta viaja por **`cliente://…`** |

⇒ **El alta de tarjeta puede construirse SIN build nativa**, abriendo la página en el navegador del sistema y volviendo por el scheme. *La pieza que hacía falta ya estaba en el binario desde el primer día, sin que nadie la usara nunca.*

> **Y hay una segunda razón, que no es de costo:** el navegador del sistema le muestra a la familia **la URL real** del formulario donde va a tipear su tarjeta. Un WebView embebido no. *Para la única pantalla del producto donde se tipea un número de tarjeta, que el usuario pueda ver de quién es el dominio no es un detalle de implementación.*

**El censo no elige** — lo elige la Fase 2 con este dato a la vista. Pero la diferencia de costo entre las dos vías **está medida y es enorme**: una es un tren de build, la otra es un import.

---

## §7 · LO QUE ESTE CENSO **NO** MIDIÓ, DECLARADO

- **El host web propio concreto** para el Add Card. **No hay dato en el repo que lo determine**: no se buscó fuera del árbol y **no se adivinó**. *(La landing de `epetplace.com` es candidata nombrada por `D-853`, pero su estado no se midió acá.)* ⇒ **dueño: mesa/founder.**
- **La doc de Nuvei sobre `NUVEI_SDK_URL`** y sobre los endpoints de borrado de tarjeta: **no se abrió en este turno**. Lo que se sabe viene de la letra y del código de S101-A.
- **El comportamiento en dispositivo** de `expo-web-browser` en estas apps: **está horneado por medición de `package.json` + fecha del scaffold**, pero **nadie lo ejercitó nunca** (cero consumidores). *Es la clase de premisa que se verifica corriéndola, no leyéndola* — el primer ensayo de la Fase 2 es su gate.
- **Los cuatro checkout de servicios** (paseo, grooming, adiestramiento, veterinaria) y `checkout-reserva.tsx`: **fuera del alcance**, solo se midió su tamaño para declarar que existen y que **no se tocan**.
- **La base de datos no se escribió**: cero DML, cero DDL, cero deploy.

---

## §8 · LO QUE ESTE CENSO CAMBIA DEL PLAN

1. **El enchufe está localizado con número de línea:** entre `checkout.tsx:457` y `:464`. El plan decía «medir qué dibuja hoy antes de decidir qué se enchufa» — **está medido**.
2. **Nace un ítem que el plan no tenía: `type Fase` no tiene lugar para la espera.** Tres valores, y la letra §4 exige un cuarto estado. **Es cambio de tipo, no solo de pantalla.**
3. **La pantalla que cambia sola es la de PEDIDOS, no el checkout** — y **no puede apoyarse en la escalera**, que calla en `pagando` a propósito y por firma.
4. **El alta de tarjeta NO exige build nativa** si va por `expo-web-browser` (horneado desde el scaffold). Con `react-native-webview` sí. **La Fase 2 elige con este número en la mano.**
5. **El polling tiene precedente construido y probado; el realtime no tiene ninguno** — y el costo del realtime ya está medido en `D-739`. **El censo no decide** (orden de mesa), pero entrega la asimetría.
6. **`crearIntentoPago` se llama sin método ⇒ `'simulado'`.** Esa es la costura literal donde entra el proveedor real.

---

## §9 · FICHAS — lo torcido, reportado sin curar *(orden de mesa: el censo no cura)*

| # | Qué | Gravedad | Dueño / disparo |
|---|---|---|---|
| 1 | `checkout.tsx` **declara `exito` sin cobro confirmado** | 🟠 **hoy es correcto** (el cobro es simulado); **se vuelve falso el día que el cobro sea real** | la pista, **Fase 3** — es el enchufe mismo |
| 2 | `type Fase` sin estado de espera | 🟡 | la pista, **Fase 4** |
| 3 | `expo-web-browser` instalado desde el scaffold **con cero consumidores en 45 días** | ⚪ no es defecto — es capacidad pagada y sin usar | se estrena en **Fase 2** |
| 4 | El host propio del Add Card sin determinar | 🟡 bloquea el cierre de Fase 2 | **mesa / founder** |

**Ninguna se curó.** *(Y la #1 se declara con su matiz completo a propósito: llamarla «defecto de S100» sería falso — era la verdad de un cobro simulado, y lo que la vuelve mentira es lo que estamos por construir.)*
