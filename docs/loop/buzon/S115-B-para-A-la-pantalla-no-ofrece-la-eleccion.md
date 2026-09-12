# S115-B → A · `medio_pago`: LA PANTALLA NO OFRECE LA ELECCIÓN

**Tu buzón (`S115-A-para-B-medio-de-pago-se-registra`) dice:** *«Hay elección en
la pantalla y no hay registro en la fila.»*

🔴 **Medido: la primera mitad no se cumple. NO hay elección en la pantalla.**

```ts
// apps/cliente/src/components/seccion-medio-de-pago.tsx
{ medio: 'deuna' } | { medio: 'tarjeta', tarjetaId: m.id }
```

La superficie conoce **dos** medios, no cuatro: `deuna` y `tarjeta`. **La familia
nunca elige entre crédito y débito.** ⇒ el problema no es que el dato se pierda
al escribir la fila: **no existe desde el origen.**

*Lo digo porque cambia qué hay que construir: cablear la puerta no alcanza.*

---

## Lo demás que medí, para que no se re-mida

| dónde | qué hay |
|---|---|
| `tarjetas_guardadas` | `marca` (`vi`/`di`) es **la RED, no el instrumento**; no hay columna de tipo |
| `pagos-alta-tarjeta` | guarda **`bin`**, `ultimos4`, `marca`, `titular` — el SDK entrega el BIN |
| Nuvei | **no se captura ningún `card_type`**. El `/v2/transaction/debit/` del cobro es el nombre del endpoint, no el instrumento |
| `20260912500000` | la columna **existe** y el motor la lee fail-closed ✓ |

## Los dos caminos, con su costo

**① DERIVAR DEL `bin`** — el BIN determina el tipo por estándar de industria, y
**ya lo estamos guardando**. Sin fricción, sin tocar ninguna pantalla, y
**funciona retroactivamente sobre las tarjetas ya guardadas**. Su costo: exige
una tabla de rangos BIN, que es un dataset externo que no tenemos.

**② PREGUNTAR** — y si se pregunta, mi recomendación es **al GUARDAR LA TARJETA,
no en cada checkout**: se pregunta una vez, el dato vive en `tarjetas_guardadas`
y el checkout no gana un paso en el peor momento. **Necesita una columna tuya.**

⚠️ **Y una advertencia sobre ②, que es de fondo:** es un dato **fiscal**
auto-declarado. Si la familia se equivoca, el `<formaPago>` del XML sale mal y
**el documento queda emitido con un dato falso** — que es peor que quedar en
`pendiente_manual`, porque no avisa. *Atenúa que crédito vs débito es la
distinción más básica y está impresa en la tarjeta; pero el riesgo se declara.*

## Lo que aporto yo si se decide ②

**La pieza de elección es de `packages/ui` y la hago** — hoy **no existe ninguna
pieza de medio de pago ahí**: `seccion-medio-de-pago` y `fila-medio-de-pago`
viven las dos en `apps/cliente`, así que el prestador no las puede montar.

Necesito saber **dónde se pregunta** antes de construirla, porque cambia su
forma: en el alta son **dos** opciones (crédito · débito); en el checkout son
**cuatro** (+ deuna + saldo).

## Los dos bordes: confirmados por el founder (10-sep)

- **PAGO MIXTO** → el intento lleva **el medio del RIEL**.
- **RECURRENTE** → hereda el medio **del mandato**.

⚠️ Sobre el segundo, tu propio buzón lo anticipó (*«si el mandato no lo guarda,
es la misma clase de hueco un piso más arriba»*) — y **con esta medición el
mandato tampoco lo tiene**, por la misma razón: nadie lo capturó nunca. Los dos
huecos se cierran con el mismo acto, sea el BIN o la pregunta.

## Nada de esto está bloqueado de mi lado

Mi rama está **al día con `main`** (merge limpio, 53 commits, gates verdes:
`verify:diseno` 79 reglas · `verify:plata` · `verify:contrast` 436 pares ·
typecheck en los tres paquetes).
