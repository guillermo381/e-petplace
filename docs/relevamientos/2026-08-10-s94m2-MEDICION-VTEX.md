# S94-M2 · Medición del ambiente VTEX `epetplace` — segunda pasada (rol ampliado)

> **10 Ago 2026.** Solo lectura, credenciales rotadas y rol ampliado.
> Cierra los tres huecos que dejó `2026-08-10-s94m1-MEDICION-VTEX.md`.
>
> **Esto es EVIDENCIA, no letra.** La letra derivada es
> `docs/MODELO_DESPENSA.md` §7.

---

## Paso 0 · La rotación quedó a medias

Las credenciales nuevas autentican (HTTP 200) y son distintas de las de M1
(verificado por comparación, sin imprimir valores).

**🔴 Pero la credencial de M1 SIGUE VIVA: respondió HTTP 200.** Se creó una
llave nueva; **no se revocó la anterior** — y la anterior es la que quedó
expuesta en el transcript de M1. En VTEX generar y borrar son dos actos
distintos y solo se hizo el primero.

> **Acción pendiente del founder:** borrar la app key vieja en el panel.
> Mientras exista, el token expuesto es una llave funcional de la cuenta.

---

## 1 · Afiliaciones de pago — el hueco más caro de M1

| Sonda | Respondió |
|---|---|
| `/api/payments/pvt/affiliations` | **HTTP 200 — `[]`** |
| `/api/payments/pvt/affiliations/options` | HTTP 200 — `null` |
| `/api/payments/pvt/rules` | **HTTP 200 — `[]`** |

**No hay ninguna pasarela configurada. Cero.** Ni Nuvei, ni Datafast, ni
Medianet, ni el conector de pruebas. Cero reglas de pago.
**Medios habilitados hoy: ninguno. La cuenta no puede cobrar un centavo.**

Esto **explica retroactivamente** un dato de M1: la simulación devolvía
`paymentSystems: []`. En M1 se declaró inconcluso porque el carrito estaba
vacío. No era el carrito: **no hay pasarelas.**

---

## 2 · Feed y hook de OMS

| Sonda | M1 | M2 |
|---|---|---|
| `/api/orders/feed/config` | 403 · falta `FeedHookV3Admin` | **404 · no existe** |
| `/api/orders/feed` | 403 | **404** |
| `/api/orders/hook/config` | 403 | **404** |

Con el permiso puesto, el ambiente responde que **no hay feed ni hook**. Lo
que en M1 era suposición razonable ahora es medición.

⇒ **Hoy no existe ningún mecanismo por el cual e-PetPlace se entere de que
entró un pedido.** Es construcción pendiente, no configuración rota.

---

## 3 · Por qué el SKU de fábrica no vende

La ficha de catálogo **sigue cerrada**: `/api/catalog/pvt/product/1` y
`/stockkeepingunit/1` devuelven **403 con cuerpo vacío**. Revisadas las
cabeceras, **VTEX no declara el recurso faltante** — 403 pelado, sin `reason`.

La pregunta se contestó por otras vías:

| Vía | Respondió | Qué dice |
|---|---|---|
| Inventario del SKU 1 | `warehouseId "1_1" · totalQuantity 0` | 🔴 **Stock cero** |
| Ficha de venta del SKU | `404 · "SKU not found"` | No está completo/activo |
| Búsqueda pública `skuId:1` | `[]` | No visible en vitrina |
| Precio (Pricing API) | **403 · "You don't have access to this resource"** | Sin verificar |

**Confirmado: no tiene stock.** Probablemente tampoco precio ni activación,
pero **eso no se afirma** — la API de precios sigue cerrada.

---

## 4 · La moneda — qué haría falta para pasar a USD/Ecuador

**Reportado, no ejecutado. Freno 1 respetado.**

**Medido:** una sola política comercial (`Id 1 · COL · es-CO · COP · SA
Pacific Standard Time`). **No existe endpoint de API para crear ni actualizar
sales channels** — los únicos de sales channel en el Catalog API son de
lectura y de asociar productos. ⇒ **el cambio es por panel o por soporte de
VTEX; no es automatizable.**

**Documentado:** una política tiene doce campos, entre ellos *Currency code*,
*Currency symbol*, *Currency decimal places*, *Country code*, *Locale* y *Time
zone*. El Help Center describe el flujo de **edición** de una política
existente (*Store Settings → Channels → Trade Policies → Edit*), con
*Currency Code* editable ahí.

⇒ **Se edita la que ya existe. No hace falta una nueva, y no hay costo
adicional por este cambio.**

**Sobre los USD 250 / USD 500:** **no salen de la documentación pública de
VTEX**. Lo único publicado es *"Creating a new sales channel may generate
additional costs as stipulated in the client contract"* — remite al contrato,
sin monto. Esas cifras son de **nuestro contrato**; desde acá no se confirman
ni se desmienten. Y si la moneda se edita en la política existente, la
pregunta no llega a activarse.

**Qué arrastra el cambio (medido):**

| Qué podría arrastrar | Estado |
|---|---|
| Precios cargados | Ninguno legible |
| Stock | Un almacén, cantidad 0 |
| Tablas de precio | Sin verificar (403 en Pricing API) |
| Seller "E-petplace EC" | `availableSalesChannels: [1]` — sigue a la política |
| Transportadora / fletes | Una, con todos los valores en `0.0` |
| Impuestos | **`taxConfiguration: null`** — hay que armarlo igual |

**🔴 Hoy el cambio no arrastra nada porque no hay nada cargado.** No es
barato en general: es barato **hoy**. Y **VTEX no publica** qué pasa con los
precios existentes al cambiar la moneda de una política viva — no hay
advertencia ni procedimiento documentado.

---

## 5 · Inventario de fábrica

| Objeto | Cuántos | Destino |
|---|---|---|
| Categoría `Category` | 1 | 🧹 Borrar |
| Marca `Brand name` | 1 | 🧹 Borrar |
| Producto id 1 | 1 | 🧹 Borrar |
| SKU id 1 | 1 | 🧹 Borrar |
| Almacén `1_1 · Stock principal` | 1 | ✅ Conservar / reconfigurar |
| Doca id 1 | 1 | ✅ Conservar / reconfigurar |
| Transportadora `Transportadora estándar` | 1 | ✅ Conservar / reconfigurar |
| Seller `E-petplace EC` | 1 | ✅ Conservar |
| Afiliaciones y reglas de pago | **0** | Construir |
| Pedidos · feed · hook | **0** | Construir |

**Cuatro objetos son basura de demo; tres son infraestructura.** El almacén,
la doca y la transportadora **no se borran** — se reconfiguran. Borrarlos
dejaría la cuenta sin dónde despachar.

Sin verificar: promociones (`405`, verbo incorrecto en esa ruta) y cupones
(**403**, recurso no nombrado).

---

## Cierre

**(a) Pasarelas hoy:** cero. Para cobrar hace falta, en orden: afiliar una
pasarela · definir reglas de pago · configurar IVA (`taxConfiguration: null`).
Nada está a medias: está en cero, así que **no hay decisiones heredadas que
desarmar**.

**(b) Pasar a USD/Ecuador:** editar la política existente en el panel. No
requiere política nueva ⇒ no dispara cargo adicional. **El costo es de
oportunidad: hoy es gratis porque no hay nada cargado.**

**(c) Limpiar antes del primer producto:** los cuatro objetos demo.
**El orden importa: primero la moneda, después la limpieza, después el
catálogo.**

---

## Permisos que siguen faltando (para una eventual M3)

| Recurso | Respuesta | Nombre del recurso |
|---|---|---|
| `/api/catalog/pvt/*` (ficha producto/SKU) | 403 | **VTEX no lo declara** |
| Pricing API (`api.vtex.com/{acc}/pricing/*`) | 403 | `"You don't have access to this resource"` |
| `/api/rnb/pvt/coupon` | 403 | No declarado |

**Cierra el hueco de límites de M1:** la documentación de VTEX sí publica el
límite del Catalog API — **45.000 peticiones/minuto por cuenta y 15.000 por
endpoint**. Coherente con lo medido (20 concurrentes, cero `429`). El límite
existe y es amplio; simplemente no viaja en cabeceras.

## Fuentes de documentación consultadas

- [Creating a trade policy — VTEX Help Center](https://help.vtex.com/tutorial/creating-a-trade-policy--563tbcL0TYKEKeOY4IAgAE)
- [Requesting an additional trade policy — VTEX Help Center](https://help.vtex.com/tutorial/requesting-an-additional-trade-policy--61vuFOw4yGh6nwSmkLJL1X)
- [How trade policies work — VTEX Help Center](https://help.vtex.com/tutorial/how-trade-policies-work--6Xef8PZiFm40kg2STrMkMV)
- [Catalog API reference — VTEX Developers](https://developers.vtex.com/docs/api-reference/catalog-api)
- [Catalog API Overview (rate limits) — VTEX Developers](https://developers.vtex.com/docs/guides/catalog-api-overview)
