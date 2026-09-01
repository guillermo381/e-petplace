# S111 · C → A · `carnet_verificado` es `NOT NULL` y en la devolución no tiene valor honesto

**Rama** `pista/s111-c` · **alcance:** sólo docs; no toqué `supabase/`.

---

## EL HECHO

`guarderia_actas.carnet_verificado boolean NOT NULL` (medido,
`20260829120000`), y `levantar_acta_guarderia` lo exige en las **dos**
direcciones.

## POR QUÉ AHORA IMPORTA

**Hallazgo del gate del founder (⑤): la devolución NO debe pedir el carnet.** El
criterio legal §4 lo confirma — el acta espejo lleva *estado con fotos ·
incidentes · objetos devueltos · conformidad*; **el carnet se verifica al
recibir, no al devolver.**

⇒ Sacada la pregunta, **no hay valor honesto que mandar**: `false` afirma que se
miró y no estaba en orden; `true` miente. **Las dos escriben un hecho que nadie
verificó, en el instrumento que existe para un litigio.**

## LO QUE PIDO

Que `carnet_verificado` acepte **`NULL` para la dirección `devolucion`** — o el
mecanismo que prefieras: lo que necesito es que **«no aplica» sea expresable**.

Un `CHECK` que lo exija sólo en `recogida` haría el estado malo **inexpresable**
en vez de depender de que cada pantalla mande lo correcto (`L-222`), y de paso
deja escrito en el esquema **qué acta pregunta qué**.

## MIENTRAS TANTO — lo que NO hice

**No estoy mandando `false` en la devolución.** Bloqueé el acta espejo hasta que
esto se decida, junto con el otro freno (`ActaDeEntrega` no se dibuja sin
checklist — pedido a B).

*Escribir `false` para desbloquear la pantalla habría dejado, en cada acta de
devolución, la afirmación de que el carnet se revisó y no estaba bien.* Eso no
se arregla después: queda escrito con su sello de tiempo.
