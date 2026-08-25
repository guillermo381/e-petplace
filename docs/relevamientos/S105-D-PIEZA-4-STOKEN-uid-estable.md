# S105-D · PIEZA ④ de `D-921` — la fórmula del stoken contra el uid estable

> **Preparación, NO construcción.** Pedido del founder: *«el diff exacto, para
> que el día del flip sea pegar y no descubrir»*.
> **Medido contra el objeto** el 25-ago-2026: `main` en `7c792ba1` (con
> `6baca0ca` adentro) · base del proyecto `zyltipqscdsdsxnjclhp`.
> **Rige:** `S105-A-PEDIDO-UID-ESTABLE-para-C.md` · ficha `D-921`.

---

## 🔴 LO PRIMERO, PORQUE CAMBIA EL VALOR DE TODO LO DEMÁS: LA FÓRMULA NUNCA CORRIÓ

**Medido en `altas_tarjeta`, 45 filas, sin una sola excepción:**

```
stoken_valido : (null) × 45      ← ni un true, ni un false
stoken_detalle: 'stoken_de=ninguno' × 9  ·  (null) × 36
```

**`stoken_valido` solo queda NULL si `st.valor` es falsy** ⇒ **el `stoken` nunca
vino en el body.** Las 9 con detalle son altas donde la edge corrió, buscó en
`b.stoken` **y** en `b.card.stoken`, y **no encontró nada**; las 36 restantes ni
llegaron a esa edge.

> ### La fórmula candidata de la línea 131 **jamás se ejecutó**. No está bien ni mal: **está sin estrenar.**

**Y eso corrige DOS afirmaciones del pedido de A** — que son correctas como
razonamiento y falsas como hecho, porque suponen que hoy hay evaluación:

| el pedido dice | medido |
|---|---|
| *«si ④ no sale con ②③, `stokenValido` pasa a `false` en TODAS las altas»* | **No pasaría a `false`: seguiría en `null`.** El `if (st.valor)` no entra |
| *«🔴 `stokenValido` sigue en `true` — es el control negativo de ④»* | **Nunca estuvo en `true`.** Está en `null` en las 45 |

🔴 **El control negativo de ④, tal como está escrito, es INEJECUTABLE** — y su
modo de falla es el peor: *quien lo corra va a ver `null`, y **`null` no
distingue «④ falló» de «nunca hubo stoken»**.* **Un control que no puede fallar
tampoco puede pasar.**

⇒ **Consecuencia práctica: ④ deja de ser urgente y pasa a ser barata.** No hay
riesgo de romper una validación viva, porque no hay validación viva. **Pero
tampoco se puede verificar con el flip**, y eso hay que decirlo antes y no
después.

---

## 1 · EL DIFF EXACTO — y no es un reemplazo de variable

**El estado hoy** (`supabase/functions/pagos-alta-tarjeta/index.ts`):

```ts
// ── El stoken, si vino ────────────────────────────────────────────────────
const st = extraerStoken(body);                                    // ~122
let stokenValido: boolean | null = null;
let stokenDetalle = `stoken_de=${st.de}`;
if (st.valor) {
  if (APP_CODE_SERVER && APP_KEY_SERVER) {
    const esperado = await md5Hex(`${token}_${APP_CODE_SERVER}_${alta}_${APP_KEY_SERVER}`);
    stokenValido = esperado === st.valor.toLowerCase();            // ~131
    stokenDetalle += ` formula=candidata_transaccion valido=${stokenValido}`;
  } else { … }
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, …);            // ~138
const { data, error } = await sb.rpc('resolver_alta_tarjeta', …);  // ~143
```

### 🔴 EL OBSTÁCULO QUE EL DIFF DESCUBRE, Y ES EL MOTIVO DE ESTE DOCUMENTO

**`alta` está disponible porque viene del `body`. El uid estable NO: vive en una
tabla y hay que ir a buscarlo.** Y el cálculo del stoken ocurre **antes** de que
exista el cliente de Supabase (línea ~138).

> ### No se puede escribir `${uidEstable}` en la línea 131 porque en la línea 131 **no hay con qué leerlo**. El diff no es cambiar una variable: es **mover el orden**.

**Forma propuesta** — mover el bloque del stoken **después** del `createClient`,
y leer el uid antes:

```ts
const sb = createClient(SUPABASE_URL, SERVICE_ROLE, …);   // ← SUBE

// ── El uid estable ante el proveedor (pieza ① de D-921) ───────────────────
// 🔴 LECTURA, JAMÁS CREACIÓN: lo produce la APERTURA del alta. Si acá no
//    existe, algo se saltó la puerta — y **inventarlo sería tokenizar contra
//    una identidad que el proveedor no vio nunca.**
const { data: uidFila } = await sb
  .from('<tabla de ①>').select('proveedor_uid')
  .eq('user_id', <user del alta>).eq('proveedor', 'nuvei').maybeSingle();
const uidEstable = uidFila?.proveedor_uid ?? null;

// ── El stoken, si vino ────────────────────────────────────────────────────
const st = extraerStoken(body);
let stokenValido: boolean | null = null;
let stokenDetalle = `stoken_de=${st.de}`;
if (st.valor) {
  if (APP_CODE_SERVER && APP_KEY_SERVER && uidEstable) {
    const esperado = await md5Hex(
      `${token}_${APP_CODE_SERVER}_${uidEstable}_${APP_KEY_SERVER}`);   // ← ④
    stokenValido = esperado === st.valor.toLowerCase();
    stokenDetalle += ` formula=candidata_transaccion_uid valido=${stokenValido}`;
  } else if (!uidEstable) {
    // 🔴 NO se cae al uid viejo en silencio: eso volvería el flip invisible.
    stokenDetalle += ' formula=no_evaluada:sin_uid_estable';
  } else { … }
}
```

**Cuatro decisiones que el diff lleva adentro, y ninguna es de estilo:**

| | |
|---|---|
| ① | **La marca de fórmula CAMBIA** (`candidata_transaccion` → `…_uid`). *Sin eso, dos fórmulas distintas escriben la misma cadena en `detalle` y no se puede saber cuál corrió — que es exactamente el defecto que `D-912` acaba de costar* |
| ② | **Sin `uid` estable NO se cae al viejo**: se declara `sin_uid_estable`. *Un fallback silencioso haría que el flip «funcione» sin haber flipeado* |
| ③ | **El uid se LEE, no se crea.** Crearlo acá duplicaría al productor de ① y podría tokenizar contra una identidad nueva |
| ④ | **`alta` sigue usándose** para todo lo demás (es el handle de la operación). Lo único que cambia es **su lugar en la fórmula** |

⚠️ **Lo que este diff NO puede fijar todavía:** el nombre de la tabla de ①, el
de su columna, y de dónde sale el `user_id` en esta edge. **La pieza ① no
existe** — por eso el diff está escrito con `<tabla de ①>` y **no se inventa un
nombre**: *un diff con un nombre inventado se pega igual y falla en runtime.*

---

## 2 · ¿LA FÓRMULA ES DE NUVEI O NUESTRA? — **es de NUVEI, y está medido**

**El discriminador está en el código:** `extraerStoken(body)` lo busca en
`b.stoken` y `b.card.stoken` ⇒ **el stoken VIENE EN EL BODY**, generado por el
SDK del lado del cliente. **Nosotros no lo emitimos: lo REPRODUCIMOS para
compararlo.**

> ### Si la fórmula fuera nuestra, la elegiríamos. Como el que la emite es el SDK, **nuestra copia tiene que coincidir con la suya o el stoken da `false` siempre** — y el `detalle` acusaría a la fórmula cuando el problema sería el campo.

**Y de ahí sale el riesgo exacto que el founder anticipó, con su forma precisa:**

**Hoy `alta` y el uid ante el proveedor son EL MISMO VALOR** (`D-921`: el uid es
`altas_tarjeta.id`). ⇒ **mientras eso sea cierto, la fórmula no se puede
falsar**: ponga «uid» o «id de la operación» en esa posición, el valor es el
mismo. **El flip los separa, y recién ahí se sabe cuál era.**

⇒ **④ asume que el campo es el `uid` del cliente. Si Nuvei espera el
identificador de la operación, ④ es el cambio equivocado** — y su síntoma sería
un `valido=false` que manda a revisar una fórmula correcta.

**Pero, por el hallazgo de arriba, ese síntoma tampoco va a aparecer**: sin
stoken en el body, el resultado seguirá siendo `null`. *Nos quedaríamos sin la
señal que nos diría que nos equivocamos.*

---

## 3 · LA CONSULTA A ERICK — redactada, para que la mande el founder

**Son DOS preguntas, no una.** *Preguntar solo la fórmula daría por sentado que
el stoken llega, y medido, en 45 altas no llegó ni una vez.*

```
Hola Erick,

Dos consultas sobre el stoken en el alta de tarjeta (tokenización), ambiente
de staging.

1) ¿El SDK de tokenización envía `stoken` en la respuesta del alta?
   Lo estamos leyendo en la raíz del body y en `card.stoken`, y en 45 altas
   no llegó en ninguna. Queremos saber si hay que habilitarlo por
   configuración, si viaja en otro campo, o si en el alta directamente no
   aplica y solo existe en transacciones.

2) Si viaja: ¿cuál es la fórmula exacta del stoken del alta, y qué valor va
   en la posición del identificador de usuario?
   Concretamente: ¿es el `uid` del cliente (el que mandamos al tokenizar) o
   el identificador de la operación de alta?

El porqué de la segunda: hoy esos dos valores son el mismo en nuestro lado,
así que no podemos distinguirlos. Estamos por separarlos —vamos a pasar a un
uid estable por cliente en lugar de uno por operación— y necesitamos saber
cuál de los dos espera la fórmula para no romper la validación al hacerlo.

Gracias.
```

**Nota para el founder, no para el mensaje:** la pregunta 2 sirve **igual** si
la 1 vuelve *«en el alta no aplica»*. En ese caso **④ se cae entera** —no hay
fórmula que corregir— y lo que corresponde es **retirar el bloque en vez de
cambiarlo**, con su lápida. *Es un resultado bueno: menos código y una
afirmación menos que sostener.*

---

## 4 · QUÉ CAMBIA EN EL PLAN DE `②③④ salen juntas`

**El pedido de A las ata con veda porque teme que ④ ausente rompa la
validación.** **Medido, esa atadura NO es necesaria por ese motivo**: sin stoken
en el body no hay validación que romper, y `null` seguirá siendo `null` con o
sin ④.

⚠️ **Pero la atadura conviene igual, por OTRA razón:** el día que el stoken
empiece a llegar —porque Erick lo habilite o porque cambie el SDK—, una fórmula
con el campo viejo daría `false` **en todas las altas a la vez**. *Salir juntas
no es sobre hoy: es sobre no dejar una bomba con temporizador puesto por un
tercero.*

⇒ **Recomendación de esta pista: ④ sale con ②③ como está planeado, pero el
CONTROL de la tanda no puede ser `stokenValido`.** *Ese campo no discrimina
nada hoy.* **El control real es que `stoken_detalle` cambie de
`formula=candidata_transaccion` a `formula=candidata_transaccion_uid`** — eso sí
prueba que el código nuevo corrió, y **no depende de que el proveedor mande
nada.**
