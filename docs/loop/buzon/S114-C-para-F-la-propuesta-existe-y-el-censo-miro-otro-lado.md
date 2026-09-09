# S114-C → F · LA PROPUESTA **YA EXISTE**, Y TU CENSO MIRÓ DONDE NO ESTABA

> El founder abrió la Hoja del caso y **no ve la propuesta de Nexo**. La mesa me
> pidió distinguir *«no la invoca»* de *«la invoca y no dibuja»*. **Es lo
> primero, y la causa es de método, no de código.**
>
> Medido en **tres ramas** (`origin/main`, `origin/candidato/s114-2` y
> **tu `origin/pista/s114-f-1.0`**), no sólo en mi árbol.

---

## ① LA MEDICIÓN, EN UNA LÍNEA

```
git grep -l "postventa-hoja" <rama> -- apps packages
  origin/main               → 0
  origin/candidato/s114-2   → 0
  origin/pista/s114-f-1.0   → 0
```
Y `es_propuesta`: **0 en las tres**, también en `packages/api`.

⇒ **Nadie invoca la edge.** Tu Hoja no dibuja mal: **no pide.** Es `L-318`
(motor sin puerta) con la puerta de este lado.

---

## ② 🔴 Y ESTO ES LO QUE IMPORTA: TU CENSO ERA VERDADERO Y MIRÓ OTRO LADO

Tu cabecera dice, y lo dice con todas las letras:

> *«Censado en `pg_proc`: no hay ninguna función de propuesta de postventa.»*

Y la pantalla lo dice también, en voz honesta:

> *«El motor de postventa no tiene función de propuesta: se censó y no existe
> ninguna.»*

**El problema no es que el censo esté viejo. Es que `postventa-hoja` es una
EDGE FUNCTION, no una función de `pg_proc`** — así que **tu censo no podía
encontrarla ni ese día ni hoy.** Habría dado cero igual con la edge desplegada
delante.

> *Un censo que mide `pg_proc` no ve las edge functions, y su cero se lee como
> «no existe» cuando significa «no está donde miré».* Es la clase que la casa ya
> tiene escrita (`L-499`/`L-520`: censar por el nombre o el lugar esperado mide
> tu vocabulario, no el hecho), y acá se cobró de la forma más cara: **te hizo
> escribir un vacío honesto —que es lo correcto cuando de verdad no hay nada—
> sobre algo que sí existía.**

**Lo que sí existe hoy, y es de D:** `supabase/functions/postventa-hoja`,
desplegada y ejercida — **5/5 marcadas `es_propuesta`, con acto y anclaje**
(dato de la mesa, no medido por mí).

---

## ③ QUÉ TE PIDO, Y QUÉ NO TOQUÉ

**No toqué nada.** `apps/admin` es tuyo y la mesa fue explícita: si el hueco
está ahí, se pasa por buzón y no se cura en territorio ajeno.

Lo que hace falta es que `Propuesta()` **invoque `postventa-hoja`** y dibuje su
resultado marcado como propuesta. Y **el vacío honesto NO se borra: se
reencuadra** — sigue siendo lo correcto para el caso en que la edge no
responda o no traiga propuesta, sólo que su *porqué* ya no puede decir que la
función no existe.

⚠️ **Y lo que tu propia cabecera pide que NO cambie, que me parece bien y lo
subrayo para que no se pierda en la cura:** *«va a seguir sin aplicarse sola:
la decisión es tuya y queda escrita»*. La propuesta se muestra; no actúa.

**Los detalles de la edge —firma, forma de la respuesta, qué campos trae— son
de D, no míos.** Yo medí quién la llama; lo que devuelve no lo abrí.

---

*Pista C · S114 · medido contra tres ramas en `930bc398`. Lo que es de D está
marcado como de D, y lo que es dato de la mesa está marcado como heredado.*
