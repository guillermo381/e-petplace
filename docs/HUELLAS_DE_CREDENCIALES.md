# HUELLAS DE CREDENCIALES — que una vieja **se note al usarla**

> **Nace S109 (31-ago-2026).** Mecanismo propuesto y medido por **S109-D**
> (`docs/loop/S109-D-PROPUESTA-HUELLA-DE-CREDENCIALES.md`), construido por
> S109-A porque el archivo vive con el canon. Lección de origen: **`L-454`**.
>
> **Guard:** `node scripts/verify-huellas-credenciales.mjs`

---

## ① QUÉ ES ESTO, Y QUÉ NO ES

Cada fila declara **`sha256(valor)` truncado a 8 hex** de una credencial
vigente. El guard calcula la del `.env.local` del worktree donde corre y
**habla si difiere**.

🔑 **Lo que vale NO es el guard: es que rotar OBLIGUE A UN COMMIT.** Hoy una
rotación ocurre en una consola web y **no deja rastro en el repo** — que es
exactamente lo que `L-454` dice que falta. Con esto, la rotación pasa a ser un
cambio **versionado, con fecha y con autor**.

**Esto NO es un lugar donde guardar credenciales.** Ocho hex no reconstruyen un
valor de alta entropía; sirven para lo único que hace falta: **decir si dos son
la misma.**

---

## ② 🔴 LO QUE NO LLEVA HUELLA — y no es un olvido

> ### **Una CONTRASEÑA no entra a esta tabla. Nunca.**

Ocho hex no reconstruyen un valor — **cierto para un JWT o una API key**, que
viven en un espacio de 10^40 posibilidades. **Falso para una contraseña.** Una
contraseña sale de un espacio chico y adivinable, y una huella publicada en el
repo es **un ORÁCULO DE VERIFICACIÓN OFFLINE**: cualquiera con el repo prueba
candidatas contra el hash **sin tocar nuestros servidores, sin límite de
intentos y sin dejar rastro**. 32 bits alcanzan de sobra para confirmar el
acierto.

⚠️ **Y acá pesa más que en abstracto, porque la casa ya lo midió:** S92 encontró
que esta autenticación **aceptó las cuatro contraseñas obvias** que se le
probaron y **no devolvió un solo `429` tras doce intentos fallidos**.
*Un acierto confirmado offline es directamente usable.*

⇒ **La rotación de una contraseña se verifica entrando, no comparando hashes.**
El guard **sale ROJO** si alguien agrega a esta tabla algo cuyo nombre contenga
`PASSWORD`, `SECRET` o `_PWD` — *la exclusión es por CLASE y mecanizada, no una
nota que hay que acordarse de respetar.*

---

## ③ LAS HUELLAS VIGENTES

| variable | huella | dónde vive | rotada |
|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `117ae13b` | `apps/cliente/.env.local` | — |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `60e8ed85` | `apps/cliente/.env.local` | — |
| `EXPO_PUBLIC_DEMO_EMAIL` | `844f760f` | `apps/cliente/.env.local` | — |
| `EXPO_PUBLIC_PAGOS_ALTA_URL` | `f8e1e975` | `apps/cliente/.env.local` | — |
| `GOOGLE_MAPS_API_KEY` | `e68088b4` | `apps/prestador/.env.local` | — |

**`EXPO_PUBLIC_DEMO_PASSWORD`: excluida a propósito — ver §②.**

> La columna **rotada** se llena con la fecha el día que se cambie el valor, en
> el mismo commit que actualiza la huella. *Una fila sin fecha significa «nunca
> se rotó desde que existe esta tabla», jamás «no sé».*

---

## ④ 🔴 LOS VALORES LOCALES SE DECLARAN — y el guard los ADMITE

Condición de diseño que salió de **un falso positivo real**, no de una
precaución: S109-D midió `PAGOS_ALTA_URL` con dos valores, la llamó
**«desincronizada»**, **fue a medir**, y el segundo era **el banco local de la
pista de pagos de S101** — un valor **correcto**.

> *Su propio falso positivo le encontró el defecto a la propuesta antes de
> construirla:* el guard, tal como estaba escrito, **habría marcado en rojo un
> worktree sano** — el modo de falla que el propio documento decía evitar.
> **Un guard que grita donde no aplica enseña a ignorarlo.**

**Cómo se declara**, en el propio `.env.local`:
```
# banco: el banco local de pagos de S101, no la URL de Vercel
EXPO_PUBLIC_PAGOS_ALTA_URL=...
```
El guard **imprime la razón** en vez de callarla, y no cuenta como rojo.

---

## ⑤ DÓNDE **NO** CORRE

⚠️ **NO va en el pre-commit.** Medido por S109-D: **29 de 36 worktrees no tienen
`.env.local`** ⇒ ahí el guard no puede medir nada, y un gate que no aplica a
cuatro de cada cinco casos se vuelve ruido. **Corre a mano, o en el paso ⓪ de
quien vaya a usar credenciales.**
