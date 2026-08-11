# S94-M1 · Medición del ambiente VTEX `epetplace` — primera pasada

> **10 Ago 2026.** Solo lectura. Único POST: la simulación de carrito
> (`/api/checkout/pub/orderForms/simulation`), que no crea nada persistente.
> Base: `https://epetplace.vtexcommercestable.com.br`.
> Rol usado: `integracion-despensa` (Catalog, Checkout, lectura).
>
> **Esto es EVIDENCIA, no letra.** La letra que se apoya en esta medición es
> `docs/MODELO_DESPENSA.md` §7. Si un número de acá y uno de la letra
> divergen, gana la medición y la letra se enmienda en la mesa.

---

## 1 · Catálogo — ¿se puede servir vitrina propia?

| Sonda | Respondió |
|---|---|
| Árbol de categorías | HTTP 200 — **una** categoría, la demo de fábrica (`Category`, textos placeholder `Category_Page_Title`) |
| Productos (Search legacy) | HTTP 200 — `[]` |
| Facetas | HTTP 200 — departamentos, marcas y rangos de precio en cero |
| **Intelligent Search** | **HTTP 400 — `"Store is not active."`** |
| Simulación de carrito | HTTP 200 con SKU inexistente y con carrito vacío; `ORD027 · Ítem no encontrado`. Idéntico con `sc=1` y sin sales channel |
| Segmento por defecto (público) | `channel: 1` · **`currencyCode: COP` · `countryCode: COL` · `es-CO`** |

**Los dos hallazgos que mueven decisiones:**

**🔴 Intelligent Search está muerto y no es por permisos.** Dice *"Store is
not active"*: depende de una tienda VTEX IO activa — **exactamente la capa de
front de VTEX que se quería evitar**. Si la vitrina es propia, la búsqueda con
relevancia, autocompletado y facetas se construye o se enciende una tienda IO
que no se va a usar.

**✅ La Search API legacy y la simulación sí sirven una vitrina propia sin
front de VTEX**, en menos de un segundo.

**🔴 La cuenta está en pesos colombianos**, confirmado por dos vías
independientes (lista de sales channels autenticada + API pública de
segmentos).

---

## 2 · Stock y precio en tiempo real

La simulación funciona **sin autenticación y sin política comercial**.

**🔴 La trampa operativa más importante de la corrida:** devuelve **HTTP 200
incluso cuando no puede vender nada**. El fracaso viaja en el cuerpo:

```
"items": []
"messages": [{ "code": "ORD027", "text": "Ítem 1 no encontrado o no disponible" }]
```

⇒ **Toda integración lee `items` y `messages`, jamás el status code.**

**Sin verificar:** precio real, stock real, flete y cuotas — hace falta al
menos un SKU vendible, y crearlo es escritura.

---

## 3 · Pedidos

**Cero pedidos.** La lista de OMS respondió `total: 0`.

**Sin verificar:** feed y hooks. Las tres rutas devolvieron **403** con el
recurso nombrado: **`FeedHookV3Admin`**. *(Resuelto en M2.)*

---

## 4 · Configuración de la cuenta

- **Políticas comerciales: UNA** (`Id 1 · "Principal" · activa`) ⇒ hoy sin
  cargo adicional.
- Su config: `COL · es-CO · COP · SA Pacific Standard Time`.
- **Sellers: uno, el propio** — `id "1" · "E-petplace EC" · activo ·
  integration "vtex-seller"`. Cero sellers externos, cero ofertas pendientes.
- **🔴 La contradicción:** el seller se llama **"EC"** y la única política
  vende en **COP** con locale y zona horaria de Colombia.
- **Afiliaciones de pago:** **403**, no verificable con este rol. *(Resuelto
  en M2.)*
- Logística: una política de envío de fábrica y un dock por defecto con
  retiro en tienda apagado.

---

## 5 · Límites

20 pedidos en paralelo: **20 × HTTP 200, cero 429.** Mín 0,258 s · prom
0,279 s · máx 0,300 s. Rango de toda la corrida: 0,26–0,99 s (pico de 2,4 s
en frío).

**VTEX no declara límites en cabeceras**: sin `RateLimit-*` ni `Retry-After`.

---

## Cierre · qué confirmó la documentación de VTEX y qué no

**Confirmado:** catálogo legible headless ✅ · simulación pública sin auth ni
política comercial ✅ · sales channel ≡ política comercial, una de fábrica ✅ ·
la cuenta nace sembrada con datos de ejemplo ✅ · auth por
`X-VTEX-API-AppKey`/`AppToken` sirve para Catalog, OMS, Seller Register y
Logistics ✅.

**No confirmado o contradicho:** 🔴 Intelligent Search *no* "simplemente
funciona" · "cuenta vacía" es inexacto (hay datos de fábrica visibles por API
y no vendibles) · límites por endpoint no observables · afiliaciones de pago
no verificables con este rol.
