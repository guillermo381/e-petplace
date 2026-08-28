# CIERRE DE `D-953` + FICHAS `D-961` · `D-962` + LECCIÓN `L-435`
### S107-CERT · noche del 27 al 28-ago-2026

> ⚠️ **NÚMEROS RE-MEDIDOS POR GREP AL DEPOSITAR, y cambiaron sobre la marcha.**
> Durante la noche los llamé `D-954` y `D-955` en la conversación; al ir a
> depositar, el canon ya tenía **`D-956`, `D-958`, `D-959`, `D-960` y `L-434`**,
> puestos por S107-A y S107-C en paralelo. **Se toma por encima del tope
> (`D-961`, `D-962`, `L-435`) y NO se rellenan los huecos** —`D-954`, `D-955`,
> `D-957` quedan libres— por la práctica de la casa: *un hueco se declara, no se
> rellena*, y rellenarlo arriesga chocar con algo en vuelo sin mergear.
> **Toda referencia a «D-954» en la bitácora de esta noche apunta a `D-961`.**

---

# ☠️ `D-953` — **CERRADA** (28-ago). La premisa era correcta; el uid no.

**El control del founder, ejercido en el aparato:** guardar una tarjeta, y
guardar **la misma** otra vez. **La segunda no entró.** Con el uid estable en las
dos puntas, Nuvei devolvió el mismo token y el `ON CONFLICT` disparó.

Y salió una prueba **más fuerte** que el control: la tarjeta del control
(`5d03a8d1`) trajo **el mismo token** (`8331979176…`) que `80cdcf41`, borrada
minutos antes. **Mismo plástico, mismo uid → mismo token, incluso a través de un
borrado.**

⇒ **La opción C sale del tablero. La pregunta a Erick baja de bloqueante a
curiosidad.**

## 🔑 LA LECCIÓN, palabras del founder

> ## Una premisa parece falsada cuando la condición que la sostiene no se está cumpliendo.

Medimos **dos tokens distintos** y concluimos *«el proveedor no reusa»*. **Estaba
bien medido y mal concluido:** las dos altas iban con **uid distinto** sin que lo
supiéramos, así que **no eran el mismo caso**. Nunca hubo dos observaciones de la
misma cosa — había dos cosas distintas.

*Antes de declarar falsada una premisa, se verifica que su antecedente se cumplió
en la observación. Si no, lo que se midió es otra cosa con el mismo nombre.*

---

# 🔴 `D-961` — UN ALTA QUE FALLA NO DEJA NINGÚN RASTRO

*(citada como «D-954» en la bitácora de la noche)*

## El defecto

Cuando `addCard` falla, **la página no llama a la edge**, así que el alta queda:

```
estado = 'pendiente' · motivo = (vacío) · incidentes = [] · cerrada_en = NULL
```

**Indistinguible de un alta en curso, salvo por el reloj.** Y el vocabulario ya
tiene **`abandonada`** en su CHECK: **el estado existe y nadie lo escribe.**

## Los ejemplares medidos en una noche — **seis**

| alta | hora | qué había pasado |
|---|---|---|
| `dcbdd452` · `0cf6dd7c` | 21:56 | dos toques del founder |
| `760febf9` → cerró bien | 22:00 | *(contraste: cuando sale bien, sí cierra)* |
| `6bf1ea11` | 22:01 | **el duplicado rechazado por el dedup — el caso perfecto** |
| `51c4ada1` · `c538b63c` | 22:20-22:24 | teléfono sin OTA |
| `0b158503` | 22:28 | la Visa que Nuvei ya tenía |

Más un **cobro** en la misma situación: `633a9422`, `pendiente`, $24,00, sin
motivo. **No es solo del alta: es del camino de pagos entero.**

## 🔴 Y ES LO QUE TAPA A TODOS LOS DEMÁS

El founder reportó *«sale un error pero dura menos de un segundo y no alcanzo a
leerlo»*. **La causa no es la duración:**

> **Dos segundos después no hay nada que mostrar.** El alta quedó `pendiente` sin
> motivo, así que la pantalla lee el estado y dice `altaPendiente` —tibio y
> genérico— sobre algo que sí tenía una explicación buena.

⇒ **`D-961` no es un defecto más de la lista: es el que impide diagnosticar los
otros.** Cada vez que algo falló esta noche, el rastro que lo habría explicado no
existía.

## 🔑 LA CURA ES UNA SOLA PIEZA, Y LA PUERTA YA ESTÁ CONSTRUIDA

**`pagos-alta-tarjeta` YA acepta `desenlace: 'incidente'`** — que es exactamente
*«anotar sin cerrar»*, la `D-925`. **Y la página nunca lo llama.** Es `L-318`, y
su propio comentario en `pagos-web` declara por qué no se resolvió antes:
llamar con `rechazada` **cerraba el alta**, y el handle es de un solo uso.
**`incidente` nació para eso y quedó sin consumidor.**

⚠️ **Falta un dato para que la cura tenga qué escribir**, y está pedido a Erick:
**qué devuelve exactamente Nuvei cuando rechaza un `addCard` por duplicado.** Sin
saber qué campo trae la razón, el rastro guardaría «falló» y no «ya la tenías» —
que es la diferencia entre un registro y una explicación.

## Lo que NO se hace mientras tanto, y su razón

**No se cambia el texto de `altaPendiente` por «Esa tarjeta ya está agregada».**
Es honesto —el alta quedó pendiente de verdad— y ponerle la voz buena sería
**afirmar algo que el servidor no sabe**: un alta pendiente puede ser un
duplicado o un fallo real, y **hoy son indistinguibles.** *Adivinar bien la
mayoría de las veces es la peor clase de acierto.*

---

# 🔴 `D-962` — UN BORRADO QUE SALTA LA PUERTA

## El hallazgo

> ## Un borrado que salta la puerta deja un lado consistente y el otro roto — y el que lo descubre es el usuario siguiente.

**Medido el 28-ago:** los barridos por SQL de la noche borraron ~6 tarjetas de
nuestra base y **nunca llamaron a `card/delete` de Nuvei**. Del lado del
proveedor siguen vivas, bajo `d5d42b92`.

**Y se volvió visible justo cuando el uid quedó alineado**: antes cada alta usaba
un uid distinto y para Nuvei eran usuarios diferentes, así que el choque no
ocurría. **La cura de `D-921` no causó esto — lo destapó** (`L-284`).

### El discriminador, limpio, ejercido por el founder

| tarjeta | resultado |
|---|---|
| **Visa …1111** (Nuvei ya la tiene bajo ese uid) | 🔴 **no entra**, y muere sin rastro (`D-961`) |
| **Diners …0808** (Nuvei no la tiene) | 🟢 **entra**, alta `8213fecc` cerrada en 22:33:28 |

**Mismo teléfono, mismo minuto, mismo uid.** La diferencia no está de nuestro
lado.

## ⚠️ LA CONSECUENCIA DE MÉTODO — firma del founder

> **Los barridos por SQL de esta noche fueron CORRECTOS para nuestra base y
> EQUIVOCADOS para el contrato.**
>
> **Cada vez que se limpia un parque que vive en dos lados, se limpia por la
> puerta o no se limpia.**

*Y su atenuante honesto, que no lo salva pero lo explica: se hizo por SQL porque
desde la app **rebotaban** —estaban desalineadas—, así que era la única vía
disponible. **La vía única no deja de tener consecuencias por ser única**: lo que
faltó fue declarar, en el momento, que del otro lado quedaban vivas.*

## Salida — **camino A firmado** (28-ago)

Se deja así y se prueba con la Diners. **La Visa `…1111` no se va a poder volver
a agregar** hasta que Nuvei la suelte. Pedido a Erick, en la misma conversación
que `D-961`. *Es higiene, no producto.*

---

# `L-435` — **DOS ACTOS COMPILAN EL CONFIG, Y EL SEGUNDO NUNCA PUEDE SABER**

## El error, y es de diseño mío

Propuse **B2** para curar el flag del mapa: derivar `MAPA_NATIVO_DISPONIBLE` de
`Boolean(process.env.GOOGLE_MAPS_API_KEY)` en `app.config.ts`, y lo vendí con
este argumento:

> *«Lo computa la misma build que hornea la key, así que no puede
> desincronizarse.»*

**Era cierto para UNO de los dos actos.**

| acto | ¿tiene el secret? | qué publica |
|---|---|---|
| la **build** del APK | ✅ sí (lo lee del keychain) | `mapasHorneados: true` |
| **cada `eas update`** | 🔴 **NO, y no puede**: es un *secret* que solo el builder de EAS lee | `mapasHorneados: false` |

**Medido el 27-ago:** el APK decía `True`, el OTA `01a0462c` lo puso en `False`,
y **el mapa se apagó en una app que lo tiene horneado.**

## La regla

> ## Antes de derivar un valor en build-time, se cuenta **cuántos actos lo computan**. Si son más de uno, el valor vale lo que valga el más pobre de todos.

*Un OTA también es una compilación de config, y es la que menos contexto tiene:
sin secrets, sin builder, sin manifiesto nativo. Todo lo que se derive de una
variable de entorno se recomputa ahí, y se recomputa mal.*

## 🔴 Y lo que la hace útil, en palabras del founder

> **«Es la misma clase que curamos dos veces hoy, escrita por vos después de
> curarla. Eso no la hace peor: la hace más útil, porque prueba que el patrón no
> se evita sabiéndolo — se evita preguntando cuántos actos computan el valor.»**

*Saber que existe la clase «afirmación que caduca» no alcanza: yo venía de curar
dos y escribí la tercera en el mismo turno. **La defensa no es el conocimiento
del patrón: es una pregunta concreta hecha antes de escribir.***

## Estado

**B2 retirada. C provisorio** (`const true`, verdadero hoy: el APK pasó el guard
en verde y el APK roto salió del teléfono) **con su muerte escrita en el código**:
muere cuando entre **B1** —la sonda nativa `SondaManifest.leerMetaData`, que ya
existe en `apps/prestador/modules/sonda-manifest` y hay que portar al cliente—.
**Es la única que lee el manifiesto real en runtime: inmune a OTA e inmune a env
vars.** *El costo que evité al descartarla apareció del otro lado.*
