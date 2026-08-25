# S105-A → C · PEDIDO: EL UID ESTABLE LLEGA A `addCard`

> **Autocontenido.** No depende de leer la ficha ni ningún mensaje.
> **Contrato de A (motor) hacia C (superficie del canal cliente).**
> **`D-921`** tiene el detalle; acá está **solo lo que C necesita hacer**.
> **NO arranques hasta que la pieza ① exista** — se avisa por mensaje con su sha.

---

## §1 · EL PROBLEMA, EN UNA LÍNEA

**Hoy le mandamos a Nuvei el id del ALTA como `uid`.** Como cada alta genera un
uuid nuevo, **para el proveedor cada alta es una persona distinta**: tokeniza de
cero, devuelve un token nuevo, y el `card/list` de una persona nunca trae más de
una tarjeta.

**La cura: un uid estable por `(user_id, proveedor)`.**

---

## §2 · EL CONTRATO — qué cambia de tu lado

### ② La URL del WebView gana un parámetro

`apps/cliente/src/app/pagos/alta-tarjeta.tsx:87`

```
HOY    `${BASE}?alta=${altaId}&lang=${idioma}`
NUEVO  `${BASE}?alta=${altaId}&uid=${uidEstable}&lang=${idioma}`
```

🔴 **`alta` NO se retira y NO se reemplaza.** Sigue siendo el handle del alta —
la página lo devuelve en el `postMessage` y la edge lo usa para resolverla.
**Lo que se agrega es `uid`, que es otra cosa: la identidad ante el proveedor.**

### ③ La página se lo pasa a `addCard`

`apps/pagos-web/src/index.html` (~línea 756)

```
HOY    Payment.addCard(alta, email, …)
NUEVO  Payment.addCard(uid || alta, email, …)
```

Con `var uid = qs.get('uid') || '';` — **el mismo patrón `|| ''` que la página ya
usa para `alta` y `volver`.**

### 🔴 EL FALLBACK, que es lo que hace seguro el merge

**Si `uid` no llega, `addCard` recibe `alta` — el comportamiento EXACTO de hoy.**

⇒ **Tu commit se puede mergear ANTES de que exista la pieza ①** y no cambia nada:
sin el parámetro, todo sigue igual. *Es deliberado: no queremos una ventana en la
que la página espere algo que el motor todavía no manda.*

---

## §3 · 🔴 LA CUARTA PIEZA — NO ES TUYA, Y VA ACÁ PORQUE EL CONTRATO LA INCLUYE

**La medición es de C y llegó antes de que este pedido se escribiera, que es el
único momento en que sirve.** Se nombra para que nadie la descubra al aplicar.

`supabase/functions/pagos-alta-tarjeta/index.ts:131` valida el stoken así:

```ts
// …el handle como user_id (que es el `uid` con el que se tokenizó:
//  por eso no pueden divergir).
md5(`${token}_${APP_CODE_SERVER}_${alta}_${APP_KEY_SERVER}`)
```

**Usa `alta` porque hoy `alta` ES el uid.** El día que `addCard` reciba otro uid,
**esa fórmula tiene que usar el mismo uid, no `alta`.**

> ### ⏪ **ESTO DECÍA:** ~~«Si ④ no sale con ②③, `stokenValido` pasa a `false` en TODAS las altas»~~ — **medido: es FALSO, seguiría en `null`.** Ver la corrección de §6.

**Lo que sí es cierto, y por lo que ④ sale igual:** hoy el stoken **nunca llega**,
así que no hay validación viva que romper. **Lo que hay es una bomba con
temporizador puesta por un tercero:** el día que empiece a llegar, una fórmula
con el campo viejo daría `false` en todas las altas a la vez.

⚠️ **Y ④ es MÁS GRANDE de lo que este pedido decía** *(medición de D)*: **no es
un reemplazo de variable.** El stoken se calcula **antes de que exista el cliente
de Supabase**, y el uid estable vive en una tabla ⇒ **hay que mover el orden**.

🔴 **Y hay una pregunta previa que puede tirar ④ entera:** **la fórmula es de
NUVEI, no nuestra** — el stoken lo emite su SDK y nosotros solo lo reproducimos
para comparar. **Hoy `alta` y el uid son el MISMO valor, así que la fórmula no se
puede falsar**: el flip los separa y recién ahí se sabe cuál esperaba.
***Si Nuvei espera el id de la operación y no el uid, ④ es el cambio
equivocado.*** **La consulta a Erick está redactada** (`S105-D-PIEZA-4-STOKEN-uid-estable.md §3`)
y va con el founder.

**Territorio:** `supabase/functions/` es de **D**. **A lo coordina.**
**C no toca ④.**

---

## §4 · EL ORDEN DE SALIDA — no es un merge suelto

| | qué | quién | cuándo |
|---|---|---|---|
| **①** | tabla + productor del uid | **A** | **puede nacer sola e INERTE** — nadie la consume |
| **②③** | URL + `addCard` | **C** | mergeables antes por el fallback, **inertes hasta ①** |
| **④** | la fórmula del stoken | **D** | 🔴 **sale EN EL MISMO ACTO que el flip** |

> **①②③ pueden convivir apagadas. ②③④ NO pueden salir de a partes.**

**El flip es el momento en que el wrapper empieza a mandar `uid` en la URL.**
Ese acto **es una tanda con veda**, no un merge — y lo coordina A.

---

## §5 · LO QUE NO CAMBIA, MEDIDO *(para que nadie lo toque de más)*

- **`EMAIL_ALTA` = `altas@epetplace.com` se queda.** Es decisión firmada, y
  **ayuda a esta cura**: con **uid estable + email constante**, el proveedor ve
  **una persona con N tarjetas**, que es justo lo que pide.
- **`alta` sigue viajando** y sigue siendo lo que la edge resuelve.
- **El `postMessage` no cambia** — ni su fuente ni su forma.

---

## §6 · CÓMO SE VERIFICA QUE FUNCIONÓ

**No alcanza con que el alta nueva funcione.** El defecto que se cura es la
generación de un uid nuevo, así que **lo que hay que medir es su AUSENCIA:**

1. **Dos altas del mismo usuario** ⇒ **el mismo `uid` en las dos URLs.**
2. **`card/list?uid=<ese uid>`** ⇒ **`result_size` > 1** cuando haya dos tarjetas.
3. **`altas_tarjeta.id` ≠ `uid`** — si vuelven a coincidir, la cura no llegó.

### 🔴 CORRECCIÓN — 25-ago-2026. **EL CRITERIO 4 ERA INEJECUTABLE**

**Decía:** ~~«`stokenValido` sigue en `true` — es el control negativo de ④»~~.

**Medido por D y verificado por A contra el objeto: `altas_tarjeta` tiene 45
filas y `stoken_valido` es NULL en las 45.** Ni un `true`, ni un `false`.
`stoken_detalle` dice `stoken_de=ninguno` en 9 y NULL en 36.

⇒ **El stoken NUNCA vino en el body, así que la fórmula de la línea 131 jamás se
ejecutó. `stokenValido` nunca estuvo en `true`.**

> ### **Un control que no puede fallar tampoco puede pasar.**
> **Y su modo de falla era el peor:** quien lo corriera vería `null`, y **`null`
> no distingue «④ falló» de «nunca hubo stoken».**

**Y también era falsa la razón de §3:** ~~«si ④ no sale con ②③, `stokenValido`
pasa a `false` en TODAS las altas»~~ — **no pasaría a `false`: seguiría en
`null`**, porque el `if (st.valor)` no entra.

**④ SIGUE SALIENDO CON ②③, pero por otro motivo:** no hay validación viva que
romper — **hay una bomba con temporizador puesta por un tercero.** *El día que el
stoken empiece a llegar —porque Erick lo habilite o porque cambie el SDK— una
fórmula con el campo viejo daría `false` en todas las altas a la vez.*

**4. ✅ EL CONTROL QUE SÍ ES EJECUTABLE** *(propuesto por D)*:
**que `stoken_detalle` cambie de `formula=candidata_transaccion` a
`formula=candidata_transaccion_uid`.** *Eso prueba que el código nuevo corrió y
**no depende de que el proveedor mande nada**.*

---

*Escrito por A el 25-ago-2026. Si algo de este contrato cambia, se anuncia COMO
cambio y no se reescribe entero (`L-417`).*
