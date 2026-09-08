# S114-C · LO QUE APARECIÓ CAMINANDO — tres para otros, con su medición

> **Todo acá está medido en este árbol y con su control.** Lo que es de otra
> pista se reporta y **no se toca**; lo que es mío ya está curado y commiteado.
> Ninguno de los cinco lo vio un gate: los cinco salieron de usar la pantalla.

---

## ① 🔴 PARA B (y para quien conduzca) — `lib-voz.mjs` MIDE UNA LISTA, NO LA CLASE

**El hecho, con su control negativo:**

```
hitsDeVoseo(<supabase/migrations/20260911730000_s114a_f1_cierre_ausente.sql>)  →  []
hitsDeVoseo('marcá el cierre antes')                                           →  []
```

**`marcá` no está entre los 132 pares de `voseo.json`** (`cerrá` sí, medido).
El diccionario es una **enumeración a mano**, así que *cualquier imperativo
voseante de un verbo que nadie agregó pasa invisible* — y R66 informa su verde
como «no creció», que se lee como «no hay voseo».

**Por qué no propongo cambiar el mecanismo:** la clase completa de imperativos
en `-á` es ambigua en español —`será`, `habrá`, `podrá`, `acá`, `quizá`,
`ojalá` son legítimos—, y por eso alguien eligió la lista. *La lista no está
mal; lo que falta es que su salida diga qué NO puede ver.*

**Dos cosas, y las dos son de otro:**
- el par `["marcá","marca"]` en `supabase/functions/_shared/voz/voseo.json` (A);
- el `info` de R66, que hoy dice *«no mira gramática»* — cierto pero se lee como
  «no juzga si está bien escrito», no como **«mide 132 verbos enumerados»** (B).

⚠️ **No lo toqué**: `voseo.json` vive en `supabase/` y R66 es de B. *Es la misma
clase que R66 vigila, un piso más abajo: el instrumento que cuida la voz tiene
el mismo ciego que busca.*

---

## ② 🔴 PARA A — LA VOZ DE PRODUCTO NACE EN SQL, FUERA DE TODO INSTRUMENTO

`supabase/migrations/20260911610000_s114a_rpcs_del_caso.sql:295`:

> `'Se resolvió: hay una devolución para vos.'`

**Sale a la familia, en el hilo de su caso, en voseo.** Y su hermana en
`20260911730000`: *«marcá el cierre antes de que quede sin ejecutar»*.

**Lo estructural, que vale más que las dos cadenas:** R66 recorre
`apps/*/src/i18n`. **No mira `supabase/migrations`.** ⇒ la voz que la familia
lee en el hilo **no la vigila nada**, ni el typecheck ni el gate de voz — es
`D-539` («`packages/api` no tiene capa de idioma») un piso más abajo, y peor,
porque acá además queda fijada en un idioma dentro de una migración aplicada.

*No es urgente por el volumen —medido: **1 hit** en las migraciones de S114—
sino por la clase: cada cadena nueva que el motor escriba nace sin vigilancia.*

---

## ③ ⚠️ PARA A — EL HILO PAGINA HACIA ADELANTE Y LA LISTA LEE HACIA ATRÁS

Medido en `20260911610000:428`: `(m.creado_en, m.id) > (p_cursor_ts, …)` ⇒ la
primera página son los **50 más viejos** y cada página siguiente trae los **más
nuevos**. La lista del caso es INVERTIDA: pide más cuando el dedo sube, o sea
**hacia lo viejo**.

**Van en direcciones opuestas.** Hoy no se nota —ningún caso llega a 50
mensajes— así que es un defecto **dormido**, y su modo de falla es feo: en un
hilo largo, subir mostraría lo que vino DESPUÉS.

**Mi lado ya está en su forma correcta** (arreglo ascendente, un solo `reverse`)
y el límite queda escrito en el código donde se paga. **Lo que falta es paginar
hacia atrás, y eso no existe en el motor.**

---

## ④ ⚠️ PARA B — LA FILA DE UN CASO DE PEDIDO NO TIENE MASCOTA

`FilaBandejaCaso` cae al TÍTULO cuando `nombreMascota` es `null`, y su
`AvatarMascota` monograma eso. Con un pedido, el monograma sale **`#`** (el
folio empieza con `#P-…`), y el warn de la pieza pide un `fotoDeEspecie` que
para un pedido **no existe**: no es de una mascota.

*No miente y no bloquea* — se reporta porque el caso «objeto sin mascota» es
real y la pieza no lo contempla.

---

## ⑤ 🔴 LO QUE NO PUDE CAMINAR, Y NO LO DOY POR VERDE — C8

**El dev client del prestador no se conecta a mi Metro.** Medido: **cero
líneas `Android Bundled` en su log** tras dos deep links, con los dos schemes
(`exp+prestador://` y `prestador://`), con el `reverse` tendido y verificado
(`adb reverse --list` muestra 8086) y con el puerto libre antes de arrancar.

> ### ⚠️ LA HIPÓTESIS ALTERNATIVA, MEDIDA Y DESCARTADA
> A mitad de la tanda el sistema mató dos procesos **por falta de memoria**
> (~58 MB libres, con dos Metros y un emulador compitiendo), y al medirlo
> apareció que **el Metro del prestador estaba muerto**: cero procesos en 8086.
>
> *Eso hacía que mi medición fuera verdadera —cero `Bundled`— con la causa
> equivocada: no había con quién bundlear.* **Es `L-500` otra vez**, y por eso
> se repitió el experimento en campo limpio antes de dejar nada escrito:
> Metro del cliente apagado, emulador relanzado, un solo Metro (200 en
> `/status` desde el host), `reverse` tendido, `force-stop` de la app y deep
> link nuevo — **con los TRES schemes**.
>
> **Resultado: sigue en 0.** ⇒ la memoria era un factor que ensuciaba las
> mediciones intermedias, **no la causa**. La conclusión se sostiene, ahora
> con su alternativa descartada y no sólo con su primera lectura.

La app **corre** —pinta la bienvenida, el login, entra con la cuenta de prueba
y muestra los esqueletos— pero **sobre el bundle embebido del APK 1.0.3**, que
no es mi árbol.

⇒ **Ver la línea de C8 ahí no probaría nada, y NO verla tampoco.** Es `L-138`
en su forma exacta: *el gate de una APK empieza confirmando el binario.* Firmar
un verde sobre un binario ajeno es peor que declarar el hueco.

**Y el caveat de la mesa sigue en pie y es independiente de esto:** el cron de
F1 corre con corte firmado (`app_config.f1_corte_cierre_ausente`, sólo objetos
con fin `>= 2026-09-07`), así que **el backlog de 126 no se expira a propósito**
— para caminar la voz de las 48 h hace falta sujeto sembrado.

**C8 queda CODE-COMPLETE Y NO CAMINADO**, con typecheck en 0 y `verify:diseno`
verde, que es lo que un gate puede decir y nada más.

---

*Pista C · S114 · lo que sale de caminar, no de leer.*
