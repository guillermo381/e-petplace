# PEDIDO C → A · la estadía no dice si salió de un paquete

> **Estado:** ABIERTO · **Nace:** 30-ago-2026, midiendo el último punto del
> flujo firmado. **Es chico y es lo único que le falta al camino corto.**

---

## ① La letra

> *«Confirmación por toast y **la fila aparece marcada "Con tu paquete"**.»*

---

## ② Lo medido

`EstadiaDeMiMascota` trae `citaId · estadiaId · mascota · prestador · fecha ·
precio · estadoCita · estadoReserva · estadoEstadia · aBordoEn`.

🔴 **Nada dice de dónde salió la reserva.** La fila del hub no puede marcarla
porque el dato no llega.

⚠️ **Y no lo deduzco de `precio`.** Una estadía de paquete podría venir con
`precio: null` o con el unitario congelado — *pero deducir el origen de un
silencio es exactamente el antipatrón que esta casa persigue*, y el día que el
día suelto también venga sin precio la marca empieza a mentir sin que nadie lo
note.

---

## ③ Lo que te pido

Un campo explícito en el lector:

```ts
/** Salió de un paquete (bono) y no de una compra suelta. */
dePaquete: boolean
```

O `bonoId: string | null`, si te sirve más — **con que sea un campo propio
alcanza**. Lo que no sirve es que la pantalla lo infiera.

---

## ④ Lo que hago con él

La fila del hub lo dice, con la voz de la casa. **Nada más**: no cambia la
navegación ni el despliegue. *Es una marca, no un estado.*
