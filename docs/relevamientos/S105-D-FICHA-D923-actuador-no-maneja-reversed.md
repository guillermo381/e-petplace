# FICHA PARA DEPOSITAR — `D-923`

> **Escrita por S105-D el 25-ago-2026, por orden del founder.**
> **Número verificado por grep contra el objeto**, no de memoria: el máximo real
> en `docs/` es `D-922`; `D-999` es un control negativo de un instrumento viejo
> (`S101-D`), no una ficha. **`D-923` libre.**
> ⚠️ **A deposita en `DEUDAS_CANONICAS.md`** — es su territorio. *Se escribe acá
> para que exista mientras tanto, y se avisa por nombre: una ficha que vive solo
> en un parte de pista es `D-887` otra vez.*

---

#### D-923 — 🔴 EL ACTUADOR NO MANEJA `REVERSED`: un reverso del proveedor no mueve nada de nuestro lado

🔴 **ALTA · BLOQUEANTE DE LA CERTIFICACIÓN DE NUVEI.** Medido el 25-ago-2026 por
S105-D **con Erick al teléfono**, al preparar el caso de reverso que la
certificación pide. **Dueño: A** (el actuador es motor). **Va con `D-888`, que
es su cura.**

### El hecho, medido sobre la definición viva

```
aplicar_evento_de_pago · maneja 'REVERSED'  : false
                       · maneja 'reversado' : false
                       · maneja 'refund'    : false
                       · solo mira status aprobado : true
```

**El actuador tiene una sola pregunta: ¿el status es aprobado?** Cualquier otro
—`REVERSED` incluido— cae en su rama `status_no_aprobado` y **devuelve
`aplicado: false` sin tocar el sujeto.**

⇒ **Si el proveedor reversa, el webhook llega, se autentica, se registra… y el
pedido sigue pagado y el intento sigue `aprobado`.**

### 🔴 Por qué importa más que un estado desprolijo

**La plata ya volvió del lado del banco.** Nuestro lado sigue diciendo que se
cobró. *No es un estado feo: es una divergencia entre lo que el sistema afirma y
lo que pasó con el dinero*, y del lado del cliente el pedido sigue en pie.

**Y el vocabulario ya lo contempla, que es lo que lo vuelve barato:**
`pagos_intentos.estado` **ya admite `'reversado'` y `'reverso_fallido'`**, y
`webhook_events.resultado` **ya admite `'reversado'` y `'reverso_fallido'`**.
**Nadie los produce.** *Los estados están declarados y sin productor — el mismo
patrón que `'expirado'` en `D-921`.*

### Lo que NO es, para no inflarlo

- **No es silencioso del todo:** el evento queda registrado con su
  `status_no_aprobado`, así que hay traza. *Lo que falta es el efecto, no el
  rastro.*
- **No hay daño hoy:** medido, **cero intentos en `'reversado'`** en toda la
  base, y jamás se ejerció un reverso. **El primero es el de la certificación.**
- **No es defecto de quien escribió el actuador:** `LETRA_MOTOR_PAGOS_S101` §9
  **excluye el reembolso de su alcance**. *Está fuera de alcance por letra, no
  por olvido.* **Lo que cambió es que la certificación lo pide.**

### 🔴 Su cruce con el borde abierto de `D-888`

**Curar esto sin curar aquello deja media puerta.** El `UPDATE` de
`aplicar_evento_de_pago` (líneas 112-118) **no tiene guard de estado en su
`WHERE`** ⇒ una vez que exista `'reversado'`, **un evento de aprobación
posterior lo devuelve a `'aprobado'`** y la cita/pedido revive.

> ### Hoy ese borde es inalcanzable **porque nada produce `'reversado'`**. Esta ficha es exactamente lo que lo vuelve alcanzable.
>
> ⇒ **se curan juntas, y en ese orden**: primero el guard, después el productor.
> *Al revés se abre la puerta y después se pone la cerradura.*

### El caso de certificación, tal como se le dice a Erick — sin maquillar

**Recibimos el reverso, lo autenticamos y lo registramos. No lo aplicamos.** El
pedido queda pagado de nuestro lado. **Eso es lo que el sistema hace hoy**, y es
lo que la certificación viene a encontrar.

**Dueño:** A · **Disparo:** 🔴 **la certificación de Nuvei — ya, no «antes de»**.
☠️ **Condición de muerte:** un webhook con status de reverso deja el intento en
`'reversado'` y el sujeto sin cobrar, **verificado sobre un reverso REAL del
proveedor** —jamás sobre un fixture— **y con el guard de `D-888` puesto antes.**

---

## BASELINE DEL CASO — tomado **antes** del reverso, `15:57:32 UTC`

*Para poder contrastar el después. `DF-2102135` · `oDWlzY` · Nuvei · staging.*

| | |
|---|---|
| **intento** | `aprobado` · $24.90 · `confirmado_por=webhook` · `proveedor_reverso_id` **vacío** · `hallazgo` **vacío** · cerrado `15:06:03` |
| **pedido** `6cd18326…` | **`pago_capturado`** · total 24.90 · actualizado `15:06:03` |
| **eventos de esa tx** | **1** · `aplicado` · `stoken_valido=true` · `credencial=SERVER` · `15:06:03` |

**Predicción declarada ANTES de medir el después** *(para que el resultado pueda
falsarla y no acomodarse a ella)*:

> llega un evento nuevo de `DF-2102135`; se autentica (`stoken=true`,
> `credencial=SERVER`); su `resultado` **no** será `'reversado'`; el intento
> seguirá `'aprobado'`; el pedido seguirá `'pago_capturado'`; y
> `proveedor_reverso_id` seguirá vacío.

**Si algo de eso sale distinto, el hallazgo es la diferencia** — y se reporta
tal cual, sin curar nada.
