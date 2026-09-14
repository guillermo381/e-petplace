# S116-B · LOTE 9 — el isotipo v5, la galería que deja de tardar en blanco, y una corrección grande mía

**Rama `pista/s116-b-05`.**

**Gates:** `verify:diseno` VERDE (81 reglas) · `verify:contrast` 461/0 · `verify:catalogo-v5` VERDE (33 piezas) · `verify:reduced-motion` VERDE · `verify:isotipo-path` VERDE · `tsc` 0 en las cuatro.

---

## 🔴 ⓪ LA CORRECCIÓN VA PRIMERA, PORQUE DESMIENTE TRES PARTES MÍOS

**La galería SÍ se alcanza.** Con el catálogo cargando aparte y esperando **40 s en vez de 5**, `cliente:///gallery` **abrió** (capturado: la lámina S82 en oscuro, la ruta entera).

En los lotes **5b, 6, 7 y 8** declaré **siete caminos medidos como fallidos**, con tabla. **La hipótesis del founder era la correcta:** lo que fotografié no fue *«no navegó»* — fue **«todavía no dibujó»**.

> **Declarar un camino muerto por medir antes de tiempo es peor que no medirlo:** manda a todos a buscar una puerta que existe.

Y tiene una consecuencia que corrige a otro: **la firma del founder en S106** —que retiró la entrada de Cuenta *«porque se alcanza por deep link con cable»*— **era cierta**. En el lote 6 escribí que esa premisa era falsa «medido». **El que estaba equivocado era yo**, y lo repetí cuatro lotes seguidos con más tabla cada vez. *Una medición equivocada que se repite gana autoridad sin ganar verdad.*

⚠️ **Lo que sigue sin lograrse, y ahora por otra causa:** dentro de la galería **el scroll deja de avanzar** después de la lámina (≈300 swipes sin movimiento), así que **no llegué a la sección de la onda**. Es un obstáculo nuevo y distinto del anterior — *y esta vez lo digo como lo que es: no sé por qué todavía.*

---

## ① `D-1110` — EL ISOTIPO v5 EN LA MARCA MÁS VISTA

Cambiado **en la pieza**: sale en **cuatro de las cinco tabs** y lo montan **79 archivos** del cliente. *La pieza es el único lugar donde una marca puede cambiar de una vez.*

`Isotipo` gana **`dibujo?: 'legado' | 'v5'`**, con **default `'legado'`** — y el default es lo que protege a los que no se nombraron:

> 🔴 **Las dos marcas de agua (210 y 1000) llaman a esta misma pieza.** Cambiar el default las habría movido de arrastre, y la mesa dijo literal que son **otra decisión**. **Siguen en `'legado'`, intactas.**

El v5 se recorta a **`ISOTIPO_V5_CAJA`** y no al lienzo cuadrado del archivo: *con el cuadrado, un isotipo de 32 px dibujaría 32 px de aire y una marca diminuta adentro.* Usa el mismo `d` que los ocho papeles, sostenido por `verify:isotipo-path`.

**Mirado a 24 / 32 / 48 / 96** — `capturas-s116-b/isotipo-v5-tamanos.png`. Es vector: no tiene resolución.

⚠️ **Y la primera captura que monté estaba mal, no la pieza:** salía un bloque blanco debajo de la marca. **Era mi montaje** — `qlmanage` devuelve lienzo cuadrado y yo lo aplasté a la proporción de la caja. Lo separó re-renderizar con el viewBox completo. *Un defecto del instrumento se lee igual que un defecto de la pieza, y sólo se separan midiendo los dos.*

---

## ② LA HOJA DE ATAJOS

**Ya estaba construida en el lote 8** (`HojaAsistente`, montada por `BotonAsistente`). Acá sólo se ajusta la voz del campo a la que la mesa escribió: **«Escribe tu pregunta»**.

Los cuatro atajos son los **censados del objeto** — `apps/cliente/src/lib/nexo/atajos.ts:57`. **Cierra arrastrando o tocando fuera porque es una `Hoja` de la casa**: no hubo que escribir nada para eso.

---

## ③ LA GALERÍA CARGA APARTE Y CON LA ESPERA DE LA CASA

**La causa era de bundling, no de render:** el módulo importaba `TokenGallery` de forma **estática**, así que **Metro tenía que empaquetar el catálogo entero antes de poder mostrar la ruta** — y durante esos segundos *la navegación ya ocurrió y no hay nada dibujado*.

`lazy` + `Suspense`: la ruta aparece **al instante** con la espera de la casa, y el catálogo llega cuando llega.

> *La espera no acelera nada — hace que los segundos SE VEAN, que es lo que faltaba.*

✅ **`EsperaLarga` estrena consumidor, y no es el que esperábamos:** *no fue una pantalla de producto, fue el instrumento de gate* — el que tardaba una eternidad en blanco. **El gate del catálogo lo cazó solo** (decía 0 consumidores y el objeto decía 1).

---

## ④ `D-1111` — DECLARADA, NO CURADA

Dos ruedas con el mismo nombre. **A midió que ninguna pantalla monta las dos**, y la mesa mandó declararla. *Queda escrita para que el día que alguien monte las dos, la causa esté esperando y no haya que volver a encontrarla.*
