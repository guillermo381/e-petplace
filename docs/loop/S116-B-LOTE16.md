# S116-B · LOTE 16 — EL BUZÓN DE C, CERRADO · Y LA GUÍA DEL PRESTADOR

Rama `pista/s116-b-05`. Worktree `e-petplace-s116-b-05`.

---

## ① EL BUZÓN DE C — LOS DOS PUNTOS, MEDIDOS

### El hallazgo que ordena todo: **eran el mismo defecto**

C reportó dos cosas —la capa del mapa que se come el scroll y el fling de la Hoja que nunca scrollea— y **la medición dice que son una sola**: *la Hoja no scrolleaba con ningún gesto*, así que cualquier cosa que estuviera encima parecía comérselo.

🔴 **La capa de C nunca estuvo mal.** Si la hubiera «curado» sin medir, habría cambiado algo sano y el defecto habría quedado igual.

### ② El fling — rojo y verde, con el marcador probado en las dos direcciones

Marcador confirmado antes de medir: **916 píxeles amarillos** con el marcador puesto → **0** al sacarlo.

| acto | antes | después |
|---|---|---|
| ① arrastre hacia arriba sobre el contenido · 400 ms | **0 px** | **78 px** ✓ |
| ② arrastre hacia abajo desde el agarre · 400 ms | cierra | cierra ✓ |
| ③ **fling rápido · 150 ms** | **0 px** | **73 px** ✓ |
| ④ cierre desde el agarre **con el contenido scrolleado** | no cerraba | **cierra** ✓ |

⚠️ **Y el defecto era más grande que el reporte:** C lo describió como «el fling no, el arrastre lento sí». Con el gesto medido, **el arrastre de 400 ms también daba 0** — *el scroll no corría a ninguna velocidad*.

**La causa, y mi primera hipótesis era falsa.** Parecía que `simultaneousWithExternalGesture` fuera de un solo sentido; se probó la relación declarada en **ambas** direcciones con refs de gesto y **siguió dando 0 px**. Lo que la destapó fue el control opuesto: **sacar el `Gesture.Native()` a secas hizo que el contenido se moviera (15 y 73 px) y rompió el cierre** ⇒ el estorbo era ese detector en sí. `GHScrollView` **ya trae** su handler nativo; ponerle otro encima le disputa lo que ya era suyo. *La cura no fue agregar una relación: fue sacar el rival y nombrar al scroll por su propia ref.*

**La condición firmada, construida:** el cierre por gesto gana si el dedo **arranca en el agarre** (72 dp: agarre + header) **o** si el contenido **ya está arriba de todo**. Antes sólo miraba lo segundo, así que agarrar la hoja por su agarre con el contenido scrolleado **no la cerraba** — el gesto más natural de todos.

### ① La capa del mapa — medida en los dos estados, con mapa real

| estado | qué hace el arrastre que arranca **sobre el mapa** | |
|---|---|---|
| **bloqueado** | la hoja scrollea **352 px** | ✓ |
| **desbloqueado** (tras «Ajustar el punto») | **el mapa se mueve** — lo que la persona pidió | ✓ |
| **bloqueado · horizontal** | el mapa **no** se mueve (**0,00 %** de sus píxeles cambiaron) | ✓ la capa lo sigue comiendo |

⇒ **La firma se cumple sin tocar la capa: deja pasar el vertical y sigue comiendo el horizontal.** El pinch **no se midió** —`adb` no hace multitáctil— y se declara: comparte el camino de eventos con el horizontal, pero *eso es un argumento, no una medición*.

Capturas: `capturas-s116-b/lote16-mapa-bloqueado.png` · `lote16-mapa-desbloqueado.png` (mapa real, no maqueta).

### ③ La onda — nada que curar, como C declaró.

---

## ② LOS CINCO CEROS FALSOS, DECLARADOS

Antes de medir bien, **cinco mediciones dieron cero y ninguna medía nada**. Ninguna llegó a una conclusión porque el control las frenó, pero **cuatro de las cinco habrían confirmado el reporte de C sin haber medido**:

1. El swipe a la galería **con una Hoja abierta encima** — el Modal absorbía todo.
2. La sección con `?solo=` **cabe entera en pantalla** ⇒ no había nada que scrollear.
3. El detector de «hoja abierta» por brillo: **el papel de la casa es casi blanco y pasaba el umbral** ⇒ midió tres actos sin hoja.
4. El mismo detector con `altura="completa"`: la hoja tapa la pantalla y el techo se lee **claro** ⇒ decía «no hay hoja» justo con la más grande.
5. El tap que abría la hoja caía sobre otro chip tras renavegar.

> **Lo que los volvió visibles fue siempre lo mismo: un control positivo.** El swipe en Ajustes de Android desplazó **808 px** con el mismo comando que en la app daba 0 — y ahí quedó claro que el canal funcionaba y el instrumento no.
> **El guion quedó escrito para fallar hablando** (`scripts/gesto-hoja.sh`): si no puede abrir la hoja, **lo dice y no mide**.

---

## ③ LA GUÍA DEL PRESTADOR — `docs/GUIA_REDISENO_PRESTADOR.md`

Escrita para quien no estuvo en S116. **Sus ocho números se midieron acá, no se heredaron**, y cada uno nombra su comando:

- **119** montajes de `<Campo>` en **47** archivos del prestador, todos con la ley vieja. ⚠️ **La mesa venía manejando «98»** — no estaba mal medido: **envejeció**. Publico el mío con su comando.
- **51** formateos de plata a mano en el prestador contra **1** en el cliente.
- **15** piezas cambian de forma con `formaV5` (de **213**); prender ese booleano en las casas de oficio **cambia esas 15 de golpe** ⇒ es decisión de mesa.
- **0** usos de Baloo en el prestador contra **1** en el cliente.

La guía entró **al corpus de `verify:numero-nombra-comando` el mismo día que nació** (5 documentos, verde): su punto ciego declarado es «un documento fuera del corpus no se mide», y *escribir una guía llena de censos sin agregarla es publicar números con la vigilancia apagada*.

---

## ④ EL PAGO — LO QUE QUEDA ESPERANDO

Sigue verificado **en la pieza y no en la pantalla**. Cuando C cierre el grupo ⑤ del lote 5 y A lo mergee, mido `datos-facturacion` real con la letra en 1,3 y el marcador confirmado.
**Pedido al buzón:** necesito el `.env.local` del cliente en el worktree para esa medición — hoy lo copio del primario y lo borro al cerrar, pero conviene que quede dicho.

🔴 **Y el dato del founder que corrige el supuesto, anotado sin tocar nada:** él **no** tiene la letra del sistema agrandada. La cura del lote 10 sirve igual —el recorte a 1,3 era real y está curado—, pero **no sabemos si arregla lo que él ve**. Si con el próximo OTA sigue viendo la etiqueta pisando el texto, se mide **con la letra en 1,0** y se busca otra causa: densidad de su pantalla, la fuente propia de Samsung, o que la escala efectiva no sea 1,0 aunque el ajuste diga normal. *No se vuelve a curar sin medir eso.*

---

## ⑤ VERIFICACIÓN

`verify:diseno` 80 reglas · `verify:contrast` 504 pares · `verify:catalogo-v5` · `verify:etiqueta-dentro` · `verify:alto-con-texto` · `verify:boton-alto` · `verify:contador-piezas` · `verify:numero-nombra-comando` — **los ocho en exit 0**.
`tsc` **0 errores** en `packages/ui`, `packages/api`, `apps/cliente`, `apps/prestador`.

**Instrumentos nuevos:** `scripts/desplazamiento.mjs` (corrimiento vertical por correlación — *«distintas» contesta que algo cambió, no si fue scroll*) y `scripts/gesto-hoja.sh` (los cuatro actos, con el control de precondición adentro).

---

## ⑥ UN ERROR MÍO, DECLARADO

Escribí este parte como `S116-B-LOTE12.md` **sin mirar si existía**, y existía: **63 líneas del lote 12 real** (`D-1116`, el disco del abanico). Lo pisé entero.

Se recuperó con `git checkout` porque estaba commiteado, y el parte pasó a `LOTE16`. *La red fue el commit anterior, no mi cuidado.*

> **La regla que ya está escrita y no apliqué: antes de escribir sobre algo, mirar qué hay.** Un heredoc no pregunta. Y el aviso estaba a la vista en el `git status` —`M` en vez de `??`—, o sea que **lo que faltó no fue información: fue leerla antes de seguir.**
