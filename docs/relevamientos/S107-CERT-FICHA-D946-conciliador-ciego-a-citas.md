# ☠️ FICHA `D-946` — EL CONCILIADOR ES CIEGO A LAS CITAS

> **🔴 BLOQUEANTE DE PRODUCCIÓN.** Firma del founder, 27-ago-2026.
> **Número verificado libre POR GREP** contra `DEUDAS_CANONICAS.md`.
> ⚠️ **`D-945` está TOMADO y NO DEPOSITADO** — vive en
> `docs/loop/S106-C-CIERRE.md:200` («partir la pantalla de equipo por verbo»)
> y no llegó al archivo canónico. *Es el patrón exacto de `D-757`: un número
> usado en un artefacto vivo sin ficha depositada. Se declara acá para que la
> próxima sesión no lo pise.* Siguiente libre después de esta: **`D-947`**.

---

## EL DEFECTO

`pagos_pendientes_de_conciliar` —el selector del barrido— es:

```sql
FROM compras c JOIN pagos_intentos i ON i.compra_id = c.id
```

**Un intento de CITA tiene `compra_id` NULL ⇒ no puede ser seleccionado jamás.**
No es un filtro mal puesto: es la forma del `JOIN`.

**Y el sujeto ciego es el que más cobra.** Medido hoy: **11 cobros de cita
aprobados** (27-ago, 03:16→19:06 UTC) contra 1 de compra. *El único sujeto sin
red de seguridad es el que más plata mueve.*

**Caso vivo:** `DF-2099049` ($6,00, cita `9bc7f3b3`) — aprobado por Nuvei el
21-ago, intento en `pendiente` desde entonces, **invisible para las 8 corridas
del conciliador**.

---

## EL TAMAÑO DE LA CURA — 🔴 **NO es el ensanche del proveedor**

El precedente que se invoca (`p_proveedor text DEFAULT NULL`) fue **un predicado
aditivo**: `AND (p_proveedor IS NULL OR i.proveedor = p_proveedor)`. Cero
llamadores rotos, la clave de la cadena no se movió. **Esto es otra cosa: hay
que cambiar la CLAVE de la cadena entera, de `compra` a `intento`.**

| capa | estado medido | costo |
|---|---|---|
| ① selector `pagos_pendientes_de_conciliar` | `JOIN` sobre `compras`, devuelve `compra_id` — pero **ya devuelve `intento_id`** (columna que D agregó por contrato) | **chico**: `UNION ALL` con el brazo de citas, o pivotar el `FROM` a `pagos_intentos` |
| ② aplicador `resolver_consulta_activa(p_compra_id uuid, …)` | 🔴 **compra-only. 100 líneas. CERO menciones de `cita`.** Llama a `confirmar_pago_compra` y razona sobre **reserva de stock** | **EL COSTO REAL** |
| ③ edge `pagos-conciliar` | itera sobre `p.compra_id` y llama con `p_compra_id` | chico, sigue a ② |

### Lo que hace grande a ②

Sus cuatro resoluciones —`confirmado_tardio`, `huerfano_sin_stock`,
`huerfano_no_confirmable`, `huerfano_escalado`— **están escritas en el vocabulario
de la despensa**. `huerfano_sin_stock` no significa nada para una cita: una cita
no tiene stock, tiene **horario**, y su equivalente es *«el horario ya se dio a
otro»*. **No se traduce: se decide.**

### 🔑 EL MOLDE YA EXISTE EN LA CASA, y esa es la buena noticia

`aplicar_consulta_activa_deuna(**p_intento_id uuid**, p_crudo, p_origen, p_ambiente)`
**ya está keyed en el INTENTO, no en el sujeto.** Es exactamente la forma a la
que hay que converger. ⇒ **no hay que inventar la arquitectura: hay que mover
`resolver_consulta_activa` a la forma que su hermana de DeUna ya tiene.**

### Dato que la cura tiene que mirar antes de escribirse

`confirmar_cita_pagada(p_cita_id uuid)` **existe** — pero **`D-855` la REVOCÓ de
`authenticated`** con su rebote medido (`42501`). ⇒ el brazo de citas del
aplicador **tiene que llamarla desde contexto `DEFINER`**, y eso hay que
declararlo, no descubrirlo.

**Veredicto de tamaño: chico en ① y ③, MEDIANO en ② — y su parte cara no es
código, es la letra de qué significa «huérfano» para una cita.**

---

## ☠️ `D-947` — LA CAUSA QUE LO VUELVE INVISIBLE (va con la anterior)

**El actuador CORRE, falla, y los dos modos de falla producen filas que se leen
verdes.** Sonda en subtransacción que se deshace sola (`L-406`), nada aplicado:

```
DF-2099041 ($70,90) => LANZO 22023: transicion_no_permitida: cancelado_cliente → pago_capturado
DF-2100043 ($10,75) => LANZO 22023: transicion_no_permitida: cancelado_cliente → pago_capturado
DF-2099049 ($6,00)  => {"ok": true, "motivo": "sin_dev_reference", "aplicado": false}
```

- **La excepción se traga**: `pagos-webhook-stg` la envuelve en `try/catch` con
  `console.error`, y la fila queda en **`recibido`** — *que se lee «guardado,
  pendiente de resolver» cuando la verdad es «intentado y rechazado»*.
- **El `ok: true` con `aplicado: false`** es una respuesta con forma de éxito
  para trabajo no hecho.
- **Y el conciliador escala a `console.error`**: su corrida de hoy 17:00 nombró
  los dos huérfanos y **nadie los leyó**.

> **Un escalado que le avisa a nadie no es un escalado.**

**No es `L-402` («el actuador nunca corrió»): es su sucesora, y es peor de
diagnosticar** — porque `L-402` dejaba silencio y esta deja **verde**.

---

## DÓNDE DEBERÍA QUEDAR EL RASTRO — tres opciones con su costo

| # | opción | costo | qué compra | qué NO compra |
|---|---|---|---|---|
| **A** | **Un `resultado` propio en `webhook_events`: `rechazado_por_actuador`** + guardar el `SQLSTATE`/mensaje en `detalle` | **el más chico**: 1 valor al CHECK + escribir el catch en vez de tragarlo. Cero tabla nueva | **mata la mentira en su origen**: la fila deja de decir «pendiente» cuando fue rechazada. Y el barrido puede seleccionar por ese estado | no le avisa a nadie: hay que ir a mirar |
| **B** | **Tabla `pagos_escalados`** (sujeto, intento, causa, primera y última vez, resuelto_en) | medio: tabla + su RLS + escribir desde las dos puertas (actuador y barrido) | **una bandeja que se puede consultar y vaciar**, con historia y sin duplicar filas por corrida | es una superficie nueva que alguien tiene que abrir — *si nadie la abre, es un `console.error` con tabla* |
| **C** | **A + un aviso** al canal interno cuando aparece un escalado nuevo | el mayor: depende del canal | **empuja** en vez de esperar | ruido si el mismo caso escala 8 veces (hay que dedupear por intento) |

**Voto de esta pista, y su razón:** **A ahora, B después, C sólo con dedupe.**

*A es lo único que cura el defecto en sí — el resto son formas de mirarlo. Con
la fila diciendo la verdad, cualquiera de las otras dos se construye encima; sin
ella, B y C copian una mentira a un lugar más visible.* Y A tiene un dividendo
inmediato: **hoy no hay forma de contar cuántos hay** — los 3 se encontraron
leyendo `detalle` a mano.

⚠️ **Y el detalle que A tiene que respetar:** el `resultado` nuevo **no puede
romper el reintento del proveedor**. El webhook devuelve 200 igual (letra ya
escrita en el archivo): *un fallo del actuador no puede costar el reintento.*
**A cambia lo que se ESCRIBE, jamás lo que se RESPONDE.**
