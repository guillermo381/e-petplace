# CONTRATO · RETOMAR LA COMPRA — pedido de A a C

**Territorio de la pantalla: C.** Motor y wrapper: **ya están en `main`**
(`47c02e14`). **Firmado por el founder el 25-ago-2026.**

Autocontenido: no hace falta leer nada previo.

---

## §1 · POR QUÉ EXISTE — el número, medido

**37 compras abandonadas vivas con $4.617,92 detenidos.** *No es una comodidad
de producto: es plata que hoy nadie puede completar.*

🔴 **Y lo que las frena NO era lo que todos suponíamos.** Corrí la compuerta
real sobre las 37:

| corta en | cuántas |
|---|---|
| `1_reserva_vencida` | **36** |
| `0_intento_en_vuelo` | 1 — y tiene **0 horas**: un pago en curso legítimo |
| por intento vencido | **NINGUNA** |

⇒ *el botón «pagar» no nacía muerto por `D-913` —eso lo destrabó
`20260826010000`— **nacía muerto por el stock**.* Y esa compuerta **no es un
defecto**: es el inventario diciendo la verdad. Pasadas unas horas el producto
volvió y no está apartado para nadie. **Por eso retomar tiene que re-apartar.**

---

## §2 · LA PUERTA

```ts
import { retomarCompra } from '@epetplace/api';

const r = await retomarCompra(compraId);
```

### Camino feliz

```ts
r.ok === true
r.data = {
  compraId: string,
  retomada: boolean,        // false con ok:true SÓLO en 'ya_pagada'
  total: number,            // el que se va a cobrar, YA re-congelado
  ajustesDePrecio: [{ producto, antes, ahora }],
  bajoDePrecio: boolean,
}
```

**Después de un `ok:true` con `retomada:true`, la compra está lista para pagar:
el stock quedó re-apartado por 180 minutos y el desglose dice el número
correcto.** El siguiente paso es el checkout normal.

### Los desenlaces que NO son felices

| `r.codigo` | qué pasó | qué tiene que decir la pantalla |
|---|---|---|
| `producto_no_disponible` | 🔴 un ítem ya no está | **nombrar cuál** — viene en `r.faltantes` |
| `stock_insuficiente` | no se pudo re-apartar | que el producto se agotó mientras tanto |
| `compra_no_retomable` | estado inesperado | genérico honesto |
| `compra_no_existe` | ⚠️ ver §5 | genérico, **y no afinar** |
| `sin_sesion` | — | el camino de siempre |

```ts
r.faltantes = [{ itemId, producto, razon }]
// razon: 'sin_oferta' | 'retirado' | 'sin_stock' | 'no_publicada'
```

---

## §3 · LAS DOS FIRMAS DEL FOUNDER QUE LA PANTALLA TIENE QUE HONRAR

### ① NO SE RETOMA A MEDIAS

> *Una compra que se completa sin uno de sus productos es una compra distinta
> de la que la familia dejó, y nadie se lo dijo.*

Si falta un ítem, **la compra entera no se retoma**. El motor ya lo garantiza —
no hay forma de retomar parcial ni pidiéndolo.

🔴 **Lo que la pantalla NO debe hacer: ofrecer «completar sin ese producto».**
Sería re-armar el carrito, que es justo el camino que el founder descartó.

**Y `faltantes` existe para que la pantalla nombre el producto:** *«no se puede
completar» sin decir cuál obliga a la familia a adivinar, y a nosotros a no
poder ayudarla.*

### ② EL PRECIO: EL MENOR DE LOS DOS, Y SE DICE EN PANTALLA

> *Nunca cobramos más de lo que el producto vale hoy; si bajó, la persona se
> entera de algo bueno.*

Si `bajoDePrecio === true`, **la pantalla tiene que decirlo antes de cobrar**.
`ajustesDePrecio` trae `producto · antes · ahora` para poder mostrarlo.

🔴 **No es opcional y la razón es de producto:** *un total distinto del que dejó,
sin explicación, se lee peor que el precio viejo.* Sin ese aviso, la familia
vuelve a una compra que cambió de número y no sabe por qué.

**El precio sólo se mueve HACIA ABAJO.** Si subió, se respeta el congelado y
`bajoDePrecio` es `false` — no hay nada que decir.

---

## §4 · DÓNDE VIVE CADA NÚMERO — para que no diagnostiques contra el equivocado

Son dos y hay que saber cuál manda:

| | qué es |
|---|---|
| `compra_desglose` · `compras.total` · `pedidos.total` | **LO QUE SE COBRA.** Se re-congelan juntos al ajustar |
| `pedido_items.precio_unitario_prometido` | **LO QUE SE PROMETIÓ AQUEL DÍA.** `NULL` = nunca se ajustó |

**El `total` que devuelve el wrapper ya es el bueno.** No lo recalcules desde
los ítems: si lo hicieras y hubiera un ajuste a medio aplicar, pintarías un
número que la compuerta va a rechazar.

⚠️ **`NULL` en `precio_unitario_prometido` significa «nunca se ajustó», que no
es lo mismo que «se ajustó al mismo precio».** Si alguna vez lo mostrás, esa
distinción importa.

---

## §5 · ⚠️ `compra_no_existe` ES AMBIGUO A PROPÓSITO — no lo afines

**«No existe» y «es de otro» devuelven EL MISMO código.** Si la puerta
distinguiera, la diferencia le confirmaría a un tercero que esa compra existe.

🔴 **Y la voz de pantalla tiene que ser igual de ambigua: afinarla deshace el
gate desde el lado del texto.** Es el mismo criterio que ya usás para
`cita_no_existe` en el lector de cita.

---

## §6 · LO QUE ESTE CONTRATO NO DECIDE

- **Dónde vive el botón** (Mis pedidos, el detalle, o los dos).
- Si el aviso de baja de precio es una línea, un chip o una hoja.
- Si se muestra el precio anterior tachado o sólo el nuevo.
- Qué pasa después del `ok` — asumo el checkout que ya existe; si no acepta una
  compra por parámetro, **decímelo y lo miramos**: sería el mismo hueco que
  frenó el botón de completar el pago.

---

## §7 · LO QUE NO ESTÁ EJERCIDO, DECLARADO

El cinturón ejerció los cuatro brazos **en subtransacción que se deshace sola**:
baja de precio · la compuerta 2 pasando tras el re-congelado · producto
retirado · el gate del tercero.

🔴 **Lo que NO corrió: una retoma REAL que quede aplicada.** Ninguna de las 37
compras se retomó de verdad todavía. *Y ya sabemos los dos lo que cuesta hoy dar
por bueno un camino que nunca corrió* — cuando tengas la pantalla, **la primera
retoma la miramos juntos contra una compra de verdad**, no contra un fixture.
