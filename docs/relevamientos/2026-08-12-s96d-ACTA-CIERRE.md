# S96-D · ACTA DE PISTA — EL RECORRIDO DE LA FAMILIA EN LA APP CLIENTE

> **Pista D · 12-ago-2026 · rama `pista/s96-d` (worktree propio, regla 85;
> pusheada a origin).** Territorio: `apps/cliente` — la partición C/D está
> FIRMADA por el founder como choque declarado contra `METODO_TRES_PISTAS`
> §1; el riesgo de clones lo cubre la vara cruzada con C.
>
> **Estado al escribir: CONSTRUIDO Y SIN GATE.** El gate en dispositivo lo
> corre el founder o Karina ANTES del merge (regla dura del brief). Queda
> UN cableo pendiente del merge de A (§5).

---

## 1 · LO CONSTRUIDO (seis commits de contenido + dos merges de origin)

| commit | qué |
|---|---|
| `c3a9d5e8` | **D-B1/D-B2 núcleo** — Descubrir gana buscador (ilike en Postgres) y filtros por familia/especie **derivados de lo cargado** (facetas del dato vivo, jamás lista hardcodeada); fotos en filas y ficha; la ficha sube a e-commerce: galería con `VisorFoto`, **composición declarada** (candado ① §5.4: sin composición SE DICE), presentaciones con precio real y nulo honesto, `StepperCantidad`, CTA que dice qué falta. **La alergia ADVIERTE**: `AvisoAlergia` en la ficha con paso explícito que GATEA el agregar; la búsqueda marca por fila lo que cruza con el expediente. Nacen `lib/despensa/carrito` (cero plata calculada) y `lib/despensa/composicion` (único derivador de estados; **jamás fabrica `verificada`**). |
| `2bf3e3a4` | **D-B3 (1/2)** — carrito con `SelectorDestinoItem` por ítem (donación §6.4 con sus límites dichos; especie no registrada §5.2 con camino y sin frenar la compra; **sin destino es LEGAL** — §4). Checkout de TRES fases: «Ver el total» **CREA** el pedido (los totales son del MOTOR), **volver CANCELA** (la lección de los 137, pagada), pago **SIMULADO imposible de confundir** (§6.5), recurrencia con el mensaje **VERBATIM** de la letra + la voz de la pasarela que falta (D-778). Retiro en tienda sin dirección. |
| `5f3e6d26` | **D-B4/D-B5** — Tus pedidos con `TarjetaPedido`/`EscaleraEstados` (helper único `lib/despensa/escalera`: 5 pasos; «Preparando» tapa los tres escalones internos A PROPÓSITO; `no_llego` desvío alerta; `cancelado` sin escalera). Detalle: escalera completa, **el código leído** (`obtenerCodigoEntrega`, jamás por push — regla 7 del contrato), ítems con lote, **cancelar hasta preparado** (§8.3: hecho operativo, no reloj) y después «Tengo un problema» → WhatsApp **diciendo a dónde va y en qué horario** (§8.4). Reclamo del código del local (§4): el dueño elige la mascota — **la pantalla del vendedor no existe**. |
| `fb9c0ebf` | **§7 EL PUNTO** — la captura compartida de dirección gana `BuscadorDeLugar` + `PinMovible` (el pin ES el centro; semilla Quito si Places no encuentra; el vacío de búsqueda CON su salida). **LA LEY DEL PUNTO** (enmienda declarada a S79 §2.2, en la cabecera del form): editar el texto mata la resolución, el punto persiste **porque dejó de ser invisible**. `exigirPunto` SOLO en el checkout; en Cuenta sigue opcional (cambiarlo exige su propio gate). + `AvisoAlergia` a contrato de hechos, `CodigoAEscala` en el detalle, y **la puerta «El alimento de {nombre}»** en el perfil de mascota (§5.1 — solo `estado_vida === 'activa'`, la convención de `_mascotas-elegibles`: null falla cerrado). |
| `16a3e69d` | **`SelectorVentana`** — la más próxima + 3 días en UNA ola paralela (L-223); el día lleno se **DIBUJA** con «Sin lugar ese día» (saltos ⇒ sin cupo); el día cuyo cálculo falló por otra razón NO se dibuja (L-139). Fechas locales por partes, jamás `toISOString` (hallazgo S55). |
| `3e39e2f8` | **Dos defectos propios, cazados por auto-auditoría ANTES de la vara:** ① el back por GESTO esquivaba `volverAEditar` y dejaba el pedido `creado` huérfano — `beforeRemove` intercepta todas las salidas; ② el interruptor de recurrencia solo prendía — ahora **se apaga en un toque** (condición ② de §6.1). |

**El gate del commit de la casa cazó un tercero:** el carrito arrancaba con
`mascotas = []` sin fase de error — la clase exacta de L-218 («no tenés
perros», dos veces). Curado con las tres fases ANTES de que el commit
entrara. *Tres defectos, tres atrapes: uno del lint, dos de la
auto-auditoría — ninguno del camino feliz.*

## 2 · LAS COORDINACIONES (el paralelo funcionó por mensajes, no por suerte)

- **A ejecutó mis TRES pedidos el mismo día** (bloqueante + dos menores,
  texto autocontenido regla S54): `ofertas.cuenta_comercial_id` por trigger
  BEFORE INSERT (la RLS de `vendedor_skus` le cerraba al cliente saber a
  QUIÉN le compra — el checkout era inconstructible); destino por línea en
  `obtenerDetallePedido`; `registrar_entendimiento_alergia` (tabla
  append-only) para el «queda registrado» de §5.4.
- **B construyó su segunda tanda EN EL ORDEN QUE LE PEDÍ** (a→b→d→c) y
  rechazamos juntos (d) y (c): la tarjeta de producto no gana sobre `Celda`
  sin veredicto de gate, y el interruptor de recurrencia es composición de
  piezas existentes. **AvisoAlergia cambió DOS veces de contrato en el día**
  (tres estados → coincidencia exacta/imprecisa + `no_aplica`) y las dos
  veces el único punto de cambio de mi lado es `lib/despensa/composicion`.

## 3 · LO QUE LA LETRA MANDA Y NO SE CONSTRUYÓ, con su porqué

- **§5.5 la recomendación del vet: la app CALLA** — no existe tabla ni
  lector de recomendación registrada (medido). El candado dice que sin dato
  no se menciona ni se fabrica. Nace con su dato, no antes.
- **Raciones: CERO** (firma founder 12-ago, vía A). Ninguna pantalla las
  muestra ni deja hueco.
- **Alias / múltiples direcciones guardadas** (§7 «con alias»):
  `direcciones_guardadas` solo modela la principal y el wrapper no tiene
  alias — es motor (A). El checkout usa la principal + edición en Hoja.
  **Declarado, no resuelto en silencio.**
- **Instrucciones de entrega en el DETALLE del pedido:** viajan al crear
  (snapshot) pero `obtenerDetallePedido` no las expone — menor, de A.

## 4 · PARA EL GATE (founder/Karina), en orden de caminata

1. Descubrir: buscador con los 6 reales · filtros que se derivan · la fila
   que advierte al buscar con mascota alérgica.
2. Ficha: fotos, composición, el aviso que gatea el agregar (Pro Pac
   Pollo-Arroz con la mascota alérgica), presentación + cantidad + CTA.
3. Carrito: destino por ítem (mascota/donación), especie no registrada.
4. Checkout: despacho (dirección con PIN — moverlo a mano), ventanas (día
   lleno visible), retiro, «Ver el total» → resumen del motor → pago
   SIMULADO → éxito con recurrencia (prender Y apagar).
5. Tus pedidos → detalle → código → cancelar (antes de preparado) → «Tengo
   un problema» (⚠️ **el horario 9:00–20:00 del WhatsApp lo puse yo y
   espera SU confirmación** — único dato no medido de la pista).
6. Reclamo del código de mostrador (necesita una venta de C/juez).
7. La puerta «El alimento de {nombre}» en el perfil.

**Capturas M3: NO tomadas** — quedan para la pasada del cableo final, y se
declara en vez de esconderse. La vara cruzada de C está pedida con la lista
de los puntos flojos servida.

## 4bis · LA VARA CRUZADA DE C — CORRIDA Y COBRADA (post-acta, `b6bc07c4`)

C corrió la M2 sobre la punta real de la rama (no sobre mi anuncio) y
trajo **ocho hallazgos con literal**. Cuatro CURADOS el mismo día:
② la recurrencia del éxito usa SIEMPRE los refs congelados (el carrito
puede repoblarse desde otra tab con el éxito montado) · ⑥ las fechas
hablan el idioma de la APP por el riel, no el del aparato · ⑦
`EvitaTeclado` en checkout y reclamo (clase D-498) · ⑧ la barra del CTA
medida con `onLayout` (el 96 crudo mentía entre fases). Uno DECLARADO
como cura de frente (⑤ el `toFixed` artesanal — toda la superficie
despensa formatea igual desde S95-I y el riel de moneda exige un
`country_code` que la ficha no expone: pedido a A enviado, cura en la
pasada del cableo). Dos CONFIRMADOS como correctos contra el literal
(el `beforeRemove` y la condición `estado_vida === 'activa'`). Y **uno
estructural CO-FIRMADO como pedido a A**: la expiración perezosa de
pedidos `creado` viejos — mi guard de cliente no cubre la muerte de
proceso, y C midió que el motor no expira ese estado (la clase exacta de
D-749). *Antes de la vara, la auto-auditoría ya había cazado dos: el back
por gesto que dejaba huérfanos y el interruptor de recurrencia que no se
apagaba (`3e39e2f8`).*

## 5 · EL CABLEO PENDIENTE (un commit, cuando A publique su merge)

`cuentaComercialId` del carrito se aprieta a `string` (hoy `| null` con
estado honesto en el checkout) · destino por línea REAL (muere el tipo
puente `LineaConDestino`) · `registrarEntendimientoAlergia` en el
`onEntendido` (hoy el paso vive en el estado del carrito — hueco declarado
en el store) · AvisoAlergia v3 (`coincidencia` exacta/imprecisa con voz
propia para la imprecisa — misma dureza, otra palabra — y `no_aplica` que
JAMÁS se mapea a `ausente`) · `composicion_estado` real en el helper.
