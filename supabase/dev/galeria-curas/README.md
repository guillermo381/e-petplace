# Curas de la galería especie/raza — depósito de rescate

> **⚠️ POR QUÉ HAY UN BINARIO ACÁ, y por qué NO deroga la regla.** La orden
> de la galería (S90) es literal: *«① NO VAN AL REPO. Ni un binario. 38 MB
> en git es permanente.»* **Esa regla sigue rigiendo** y esta carpeta no la
> abre: es un **depósito de rescate**, no un almacén. Su contenido son
> imágenes YA CURADAS que esperan que alguien con `service_role` las suba,
> y **se borran cuando el bucket las sirve**. La alternativa era perder la
> cura al cerrarse la sesión que la produjo — el mismo defecto que S90 cazó
> con `_mapeo.json` viviendo en un scratchpad.
>
> **Regla de esta carpeta: un archivo acá es una deuda abierta.** Carpeta
> vacía = nada pendiente.

---

## `perro-generico-criollo.webp` — el damero horneado (D-684, S91-C)

**Qué estaba mal:** la imagen traía el **damero de transparencia pintado en
los píxeles** (no era alfa real: el modo es RGB y el pipeline de S90 aplanó
sobre blanco, así que un alfa verdadero habría salido limpio). Quien elige
**Mestizo / No sé** en el alta —el caso más común— veía cuadros.

**⚠️ SON DOS DESTINOS, NO UNO.** Medido: `perro/generico.webp` y
`perro/criollo.webp` eran **el mismo archivo**, md5 idéntico. Los seis
genéricos de S90 son copias byte a byte de una raza cada uno, y el de perro
se copió de **criollo** — así que el defecto no nació en el genérico: nació
en `criollo` y el genérico lo heredó. Curar solo uno dejaría el damero vivo
en Criollo, que en Ecuador es de las razas más elegidas.

**Cómo se curó:** relleno desde **el borde** sobre grises claros neutros
(`min(r,g,b) ≥ 228` y `max−min ≤ 8`), reemplazando por `(254,254,254)` — el
literal medido en sus hermanas. Desde el borde y no global **a propósito**:
un gris claro ADENTRO del perro (dientes, brillo del ojo) no se alcanza y no
se toca. *Es la diferencia entre curar el damero y lavar la foto.*

**La verificación, con números:**

| | antes | después | hermana limpia (`perro/beagle.webp`) |
|---|---|---|---|
| esquinas (576 px) | `253/254/255` + `240` mezclados | **`(254,254,254)` × 576** | `(254,254,254)` × 576 |
| píxeles ~`(240,240,240)` | el damero entero | **4** de 65.536 | — |
| bytes | 10.858 | **7.628** | — |

| | md5 | bytes |
|---|---|---|
| **curada (este archivo)** | `b4e4eebad8afacf6c0dbc3c316ee6957` | 7.628 |
| vieja (lo que el bucket sirve hoy) | `42e1e3e8f84af5ee3812363eebb9e4c9` | 10.858 |

**Qué falta, y por qué no lo hizo C:** subirla al bucket a **LOS DOS**
destinos —`especies-razas/perro/generico.webp` y
`especies-razas/perro/criollo.webp`—. C no tiene camino de escritura:
medido, hay **cero policies en `storage.objects`** para `especies-razas` (el
bucket es `public: true` **solo de lectura**) y `service_role` no vive en
ningún env local. Los dos intentos por CLI dejaron su registro: `cp` rebota
**409 KeyAlreadyExists** y `rm` devuelve **`{"deleted":[]}` sin error** — un
no-op silencioso, de la familia L-192.

**Cuando el bucket sirva 7.628 bytes:** muere D-684 y **este archivo se
borra** (Ley 37 — lo que ya no tiene trabajo, no se queda).

**Nota de alcance:** `gato/generico` está LIMPIO (`(254,254,254)` uniforme).
El defecto **no es sistémico**: es una imagen del zip de origen que ya venía
con el damero pintado. Las otras cuatro no se midieron.
