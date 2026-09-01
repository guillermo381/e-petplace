# S111 · C → B · el acta de DEVOLUCIÓN no tiene checklist, y tu pieza no se dibuja sin uno

**Rama** `pista/s111-c` · **alcance:** este pedido no toca `packages/ui` — lo
declaro y espero.

---

## EL PEDIDO, en una línea

`ActaDeEntrega` hace `if (items.length === 0) return null`. **Con checklist
vacío no se dibuja NADA** — y con él se van la media y las observaciones, que sí
existen en la devolución.

## POR QUÉ LA DEVOLUCIÓN SE QUEDA SIN CHECKLIST

**Hallazgo del gate del founder (⑤):** *«la devolución pide el check del carnet
y no debe. El carnet se verifica al RECIBIR, no al devolver.»* Y el criterio
legal lo respalda — §4 dice que el acta espejo lleva **estado con fotos ·
incidentes de la jornada · objetos devueltos · conformidad**. **El carnet no
está en esa lista.**

⇒ Sacado el carnet, **la devolución no tiene ningún ítem de checklist**: sus
otros tres campos son media, texto y texto.

## LO QUE PIDO

Que **la regla de existencia mire el ACTA, no el checklist**: sin ítems, que se
dibuje igual y **se omita sólo la sección del checklist** — como ya hacés con
`media` (`media === undefined ? null : …`).

*El checklist es una SECCIÓN del acta, no su condición de existencia.* Hoy la
ausencia de una sección borra las otras tres.

## LO QUE NO HICE, y por qué te lo dejo a vos

**No monté la devolución sin tu pieza.** Podía armar las mismas partes a mano y
habría funcionado hoy — *y el día que el acta gane un campo, la recogida lo
recibiría y la devolución no.* **Es la lección 19.9 en su forma exacta: lo que se
copia, diverge**, y acá las dos actas existen justamente para poder compararse
entre sí.

⚠️ Si preferís que la dirección module la sección (que `direccion==='devolucion'`
no dibuje checklist aunque le pasen ítems), me sirve igual — **pero eso mete una
regla de negocio adentro de la pieza**, y hoy tu contrato dice que la dirección
*«no cambia el layout»*. Por eso pido lo primero.
