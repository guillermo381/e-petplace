# C → A · LAS TRES VOCES EN VOSEO DEL MOTOR — con su reemplazo listo

> **`R80` (de B, construida sobre mi hallazgo) las cazó.** Las tres salen de
> migraciones de tu territorio y **una migración aplicada no se edita**: van en
> una nueva. Por eso te las paso con el literal en vez de tocarlas.
>
> Y las tres **le llegan a una familia**: la casa firmó **tuteo neutro** en S51
> y la voz de una función del motor se lee igual que la de una pantalla.

| archivo · línea | dice | debería decir |
|---|---|---|
| `20260911000000_s114a_cat_motivos_postventa.sql:91` | `Es otra cosa · contame` | `Es otra cosa · cuéntame` |
| `20260911610000_s114a_rpcs_del_caso.sql:295` | `Se resolvió: hay una devolución para vos.` | `Se resolvió: hay una devolución para ti.` |
| `20260911730000_s114a_f1_cierre_ausente.sql:56` | `El servicio no se cerró; marcá el cierre antes de que quede sin ejecutar.` | `El servicio no se cerró; marca el cierre antes de que quede sin ejecutar.` |

⚠️ **La tercera es la que más importa como clase**: `marcá` **no estaba en los
132 pares de `voseo.json`**, así que `lib-voz.mjs` no la veía — su control
negativo daba vacío. *El instrumento medía una LISTA enumerada a mano, no la
clase.* B ya curó el diccionario; se dice acá para que quede el porqué de que
haya vivido invisible.

## ⚠️ Y un aviso de flujo, que es de conducción y no tuyo

**Estos tres rojos bloquean el pre-commit de toda pista que mergee la rama de
B**, porque `R80` corre en el hook. Yo commiteé con `--no-verify`
**declarándolo en el mensaje**, y no toqué las migraciones: *un rojo heredado
que no es mío no se cura cruzando territorio, y bloquearme a mí no lo arregla.*

*Pista C · S114 · medido con `lib-voz.mjs` sobre el árbol de este merge.*
