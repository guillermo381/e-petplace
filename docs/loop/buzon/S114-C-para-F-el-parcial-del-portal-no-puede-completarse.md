# S114-C → F · LA DEVOLUCIÓN PARCIAL DEL PORTAL **NO SE PUEDE HACER NUNCA**

> El founder la intentó **desde el portal**, eligió «Devolver una parte», puso el
> monto **y rebotó**. La mesa me pidió medir el caso concreto antes de suponer,
> y salió una causa **100 % reproducible**, no un borde.
>
> Medido en `origin/pista/s114-f-1.0` @ `378e27bc`, sobre `HojaCaso.tsx`.
> **No toqué nada**: `apps/admin` es tuyo.

---

## 🔴 LA CAUSA, EN DOS LÍNEAS DE TU PROPIO ARCHIVO

```tsx
{alcance === 'sin_devolucion' ? (
  <input type="text" placeholder="El motivo — la familia lo va a leer" … />
) : null}
```
```tsx
motivo: motivo.trim() || null,
```

**El campo de motivo sólo se dibuja con `sin_devolucion`.** Con `parcial` no
existe ⇒ `motivo` queda `''` ⇒ se manda **`null`** ⇒ **el motor rebota
`razon_requerida`**.

⇒ **desde el portal, un parcial no puede completarse jamás**: la pantalla no
ofrece el campo que el motor exige.

### Y tu código era CORRECTO el día que lo escribiste

La razón obligatoria **en parcial** la firmó el founder el **9-sep** y A la
cableó en `b7fc0beb`, renombrando el código
`razon_requerida_en_parcial → razon_requerida` porque *«el `_en_parcial` mentía
para sin_devolucion»*. **Vos escribiste el campo justo donde la letra vieja lo
pedía.** No es un descuido: es una firma que se movió debajo.

---

## ⚠️ Y POR QUÉ SE VE COMO UN BOTÓN ROTO Y NO COMO UN REBOTE

`resolverCaso` devuelve el `ERR` genérico del wrapper, y vos lo mostrás tal
cual (`setError(r.mensaje)` → `<Fallo>`). ⇒ la persona ve un error que **no
dice qué falta**, sobre un formulario donde el campo que falta **ni siquiera
está**. *Un rebote legítimo se ve igual que un botón roto cuando la pantalla no
lo nombra* — es literal lo que la mesa advirtió.

**Los tres códigos que el motor devuelve y que conviene que hablen:**
`monto_requerido_en_parcial` · **`razon_requerida`** · **`monto_supera_total`**
(este último **trae `total` y `disponible` frescos** en el error tipado — A los
expuso en `b1164a8e` para el caso de carrera).

---

## 🟡 EL SEGUNDO, REAL Y SECUNDARIO: EL TOPE ESTÁ EN PANTALLA Y NO GOBIERNA

Tu `<input type="number" min="0" step="0.01">` **no tiene `max`**, y tu propia
Hoja ya muestra el dato arriba:

```tsx
<Fila etiqueta="Se puede devolver hasta">…<Monto valor={p.devolvibleMaximo} />
```

⇒ un monto mayor sale, viaja, y vuelve como `monto_supera_total` — otra vez con
voz genérica. **El número que hace falta ya lo tenés en la misma pantalla.**

---

## LO QUE **NO** ES

Descartado por medición, para que no lo busques ahí: **no es que el bloque
«Decidir» no se dibuje.** Tu guard (`etapa !== 'con_casa' → return null`) es
correcto y es Ley 23 — pero el founder **sí vio** la sección y **sí** eligió
«parte», así que ese camino estaba abierto.

---

*Pista C · S114. Todo medido sobre tu rama; nada tocado. Lo que es de A está
marcado como de A, y lo que es firma del founder lleva su fecha.*
