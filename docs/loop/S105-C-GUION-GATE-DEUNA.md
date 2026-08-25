# S105-C → founder · GUION DEL GATE DE DEUNA

> **Qué se firma hoy: LA PANTALLA, LAS VOCES Y LA MARCA.**
> **Qué NO se firma: la transición a pagada ni la celebración** — no se pueden
> alcanzar, y abajo está por qué. *Un gate que no declara su techo se lee como
> si lo hubiera pasado.*

---

## 🔴 LEELO ANTES DE TOCAR NADA — la compra que uses queda inutilizable

**Medido en la fuente, no supuesto** (`20260821020000` línea 76-79 ·
`pagos-deuna-solicitud` líneas 151/174/252):

- La **compuerta 0** cuenta intentos con `estado IN ('iniciado','pendiente')`
  **por `compra_id`** — no por riel.
- El intento de DeUna **nace `iniciado`** y **pasa a `pendiente`**.
- **Hoy NADA lo saca de ahí:** el webhook no está registrado del lado de Deuna,
  y el barrido de DeUna **no tiene cron** (A midió: 18 crones, ninguno suyo;
  `D-887` abierta).

⇒ **Tres consecuencias, y las tres se ven en el gate:**

1. **Un solo código por compra.** El segundo pedido rebota con
   `pago_en_proceso`.
2. **«Generar un código nuevo» va a rebotar.** El botón ofrece exactamente lo
   que el servidor rechaza.
3. 🔴 **La compra queda bloqueada para TODO cobro posterior, tarjeta incluida** —
   porque la compuerta es por compra, no por riel.

> ### ⇒ **Usá un carrito desechable. No uses una compra que quieras completar
> después, ni con tarjeta.**

**No lo curé desde la pantalla a propósito:** es motor, y la mesa dejó la
decisión de regenerar atada al contrato con D. Está reportado a A.

---

## Qué recorrer: **DESPENSA**, no cita

**Por qué la despensa y no un servicio:** es el único de los dos donde **se
puede ver el freno del carrito** (③ de mi tanda 1) sin poder pagar. En la cita
no hay nada equivalente que se vuelva observable hoy.

**Cuenta:** la tuya de siempre del cliente. **No hace falta cuenta nueva** —
nada de esto escribe en tu expediente.

---

## Los pasos, y qué deberías ver en cada uno

| # | qué hacés | qué tenés que ver |
|---|---|---|
| 1 | Abrís Despensa y armás un carrito **desechable** | lo de siempre |
| 2 | Vas al checkout, hasta el resumen | 🔴 **«Deuna» PRIMERA en «Cómo quieres pagar», con su isotipo `d!` morado sobre BLANCO** — y **blanco en los tres temas**, también en oscuro y en memorial |
| 3 | Abrís «Cómo quieres pagar» | la fila de Deuna **primera y TOCABLE**, con «›». **Ya no dice «Muy pronto»** — no dice nada debajo del nombre, y es a propósito |
| 4 | Tocás Deuna | la hoja cierra y el resumen muestra **Deuna** como medio elegido, **sin recuadro de tarjeta** |
| 5 | Mirás el botón de pagar | **habilitado.** *Antes de hoy quedaba apagado con Deuna elegido* |
| 6 | Tocás «Pagar» | **NO gira el botón.** Pasa directo a la espera |
| 7 | La espera | **«Pidiendo tu código…»** primero, y después **el código de 6 dígitos en voz de máquina, grande y espaciado**, con **«Copiar código»** al lado y **«El código vence en MM:SS»** corriendo hacia abajo |
| 8 | 🔴 **Lo que NO tiene que haber en el paso 7** | **la huella respirando.** En tarjeta la rampa dice «estamos trabajando»; acá **la que trabaja sos vos** y una rampa afirmaría algo falso |
| 9 | Salís por «Ver mis pedidos» y volvés a Despensa | 🔴 **el carrito SIGUE LLENO.** Es el freno ③: pedir un código no mueve un centavo, y vaciártelo sería cobrarte el gesto de intentar |

**Los tres temas.** El paso 2 y el 7 valen la pena en **claro, oscuro y
memorial** — el fondo blanco de la caja de Deuna es fijo en los tres, y es
justamente lo que hay que mirar.

---

## Lo que vas a ver y **NO** es verde

| lo que veas | por qué NO cuenta |
|---|---|
| **el código en pantalla** | prueba que la puerta responde y que la pantalla lo dibuja. **No prueba que sirva para pagar**: es de QA y tu app de Deuna es de producción |
| **«El código venció» + «Generar un código nuevo»** | el botón **va a rebotar** con *«Antes de cobrarte, algo cambió · Ya hay un pago en curso»*. **Eso es el servidor teniendo razón, no mi pantalla rota** — pero es un callejón y está reportado |
| **la cuenta regresiva** | está corriendo contra el instante que devolvió el servidor. **No verifica que sean 3 minutos**: verifica que la pantalla lee un reloj ajeno en vez de inventarlo |
| **cualquier cosa después del código** | **inalcanzable hoy.** Sin webhook registrado y sin poder pagar, no hay transición a pagada, no hay celebración, no hay comprobante |
| **el botón «Copiar código»** | si tu binario es 1.0.4 **la pieza se apaga sola y no vuelve a prometer** — `expo-clipboard` es nativo y no viaja por OTA. **Apagado es la conducta correcta**, no un defecto. El código sigue copiándose a mano |

---

## Los tres frenos de la tanda 1: **cuáles se pueden ejercer hoy y cuáles no**

*Se declaran acá porque hasta hoy eran inalcanzables, y encender el riel es lo
que los vuelve verificables — pero solo dos de tres.*

| freno | ¿se ve hoy? |
|---|---|
| **③ el carrito no se vacía al pedir el código** | ✅ **SÍ** — paso 9 |
| **① `null` frena que se pida un código por abrir la pantalla** | ⚠️ **PARCIAL.** Si el paso 7 muestra el código **una sola vez y recién después de tocar «Pagar»**, el freno hizo su trabajo. *Lo que probaría de verdad que no se pide por abrir sería mirar la tabla de intentos, y eso es de A* |
| **② el tope de la espera no se rinde a los 90 s** | ❌ **NO** — se ejerce recién cuando haya una espera real que dure. Hoy no hay transición que esperar |

---

## Voces: qué mirar

Las **seis familias de fallo** tienen voz propia y **no se pueden caminar en el
camino real** (no hay cómo provocarlas). **Se caminan en el ensayo**:
`/pagos/deuna-ensayo` (solo en build de desarrollo). Ahí están las seis, más el
código a punto de vencer, el hold desconocido y el hallazgo.

**La que más importa mirar, si mirás una sola:** la de **red**
(`sin_respuesta` / `sesion_no_verificable`). Tiene que decir *«No es un rechazo:
no llegamos a preguntar»* y ofrecer **«Probar de nuevo»** — **nunca soporte, y
nunca «cerrá sesión»**. *Es el error que más fácil se dibuja como rechazo, y
dibujarlo así manda a la gente a soporte por algo que se cura solo.*

---

## Un efecto del flip que excede a quien elija Deuna

**Deuna pasa a ser el medio POR DEFECTO de quien nunca eligió** (`LETRA_DEUNA`
§6bis). El flip no solo agrega una opción: **cambia con qué aparece
preseleccionada la pantalla de pago para todo el mundo.** Si querés ver el
comportamiento viejo, elegí una tarjeta una vez — tu elección previa gana sobre
el default, y eso sí está construido.
