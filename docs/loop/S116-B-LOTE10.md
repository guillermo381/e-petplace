# S116-B · LOTE 10 — tanda de reparación

**Rama `pista/s116-b-05`.**

**Gates:** `verify:diseno` VERDE (81 reglas) · `verify:contrast` 461/0 · `verify:catalogo-v5` VERDE (33 piezas) · `verify:reduced-motion` VERDE · `verify:isotipo-path` VERDE · `tsc` 0 en las cuatro.

---

## ① LA ONDA VUELVE DE GIT

`git checkout c7b665f9 -- OndaAcceso.tsx` — **el commit anterior a «sin junturas» según la historia del propio archivo**, no de memoria.

Sobre esa versión se aplica **una sola cosa: el inset CRUDO**.

> **La versión buena ya tenía la forma correcta; le sobraba una medición y le faltaba un número.**

La reescritura del lote 8 —el fondo en la raíz— **rompió más de lo que arregló**. Y lo que sí hacía falta era **de una línea, no de anatomía**: el valor. `useInsetQueFalta` mide *cuánto de la barra queda debajo del contenedor* — correcto para un pie, y el que hacía subir la franja entera acá.

⚠️ **Lo único que NO se revirtió es la rueda compartida:** es orden aparte de la mesa y **nada tuvo que ver con la regresión**. El revert la trajo de vuelta adentro y hubo que sacarla otra vez — *un revert trae todo lo que había, incluso lo que después se mudó a propósito.*

---

## ② EL PATH DERIVADO SALE DE LA PANTALLA

`Isotipo` revertido (se va la prop `dibujo` del lote 9) y **la cabecera v5 pasa a no llevar isotipo**, que es lo que pone el sketch.

**Mi cura del lote 9 estaba mal y la retiro con su razón:** cambié el `Encabezado` al path derivado creyendo que curaba `D-1110`. El path es una **silueta de un solo color** — buena para un papel de un tinte, y **no es la marca que la gente reconoce**, que tiene su magenta y su contorno.

> **Que un dibujo sea el correcto para imprimir no lo vuelve el correcto para mirar.**

El path queda **sólo para los PDF**. Donde una pantalla necesite la nariz va **`IsotipoV5`**, con el asset del ilustrador tal cual.

---

## ③ `Confeti`

- **Se apaga antes del botón, y eso es lo que lo hace legal:** *un confeti que cruza la pantalla entera pasa por encima del CTA que la persona vino a tocar.* **Celebrar no puede costar el acto que se está celebrando.**
- **Sin `withRepeat`:** una celebración que se repite deja de serlo — *y además dejaría la ventana permanentemente no-idle*, la deuda que esta casa ya se cobró con el halo del asistente.
- **Distribución determinística, no sorteada:** *el mismo «¡Listo!» se ve igual dos veces, y eso se puede capturar y comparar.* Un confeti sorteado hace que ninguna captura sirva de referencia.
- En `Confirmacion` entra **encendido por default en el cliente** y **apagado en memorial por Ley 8, no por prop**: *una pantalla que confirma una despedida no tira papelitos*, y dejar eso en una prop es esperar que nadie se olvide.
- ✅ **No se exporta, y lo decidió `R17`:** lo exporté pensando en una futura pantalla de celebración y **la regla contestó lo correcto** — una exportación sin consumidor obliga a una entrada de galería para algo que sólo se ve adentro del «¡Listo!».

---

## ④ EL CARRITO VUELVE (revierte `D-1108`)

Slot derecho de la cabecera **raíz**, con su contador.

🔴 **Y la adenda se cumple sola:** *«no en checkout»* **no se recuerda** — el carrito se dibuja **sólo en `variante="raiz"`**, y carrito/pago/confirmación son **empujadas**. Una de ellas que pase `carrito` **no lo dibuja aunque quiera**. *Una lista de excepciones hay que mantenerla; esto no.*

⚠️ **`D-1108` no está depositada en el repo** — busqué su literal y no existe. **Se revierte contra la descripción de la mesa, no contra su ficha.**

---

## ⑤ EL CORTE ENTRE LAS DOS ESPERAS (adenda)

Al catálogo, §: **corta → `EsperaDeMarca`** (ocupa un hueco, no cambia la pantalla) · **larga → `EsperaLarga`** (toma la pantalla, dice qué pasa, ofrece salida). **Corte en ~2 s**, el mismo umbral que la Ley 13 ya usa para el spinner.

> ⚠️ **Y el corte no es el tiempo que tarda: es el que la persona VA A ESPERAR.** *Una operación de 5 s que casi siempre resuelve en 300 ms es corta; una de 2 s que siempre tarda 2 s es larga.*

---

## 🔴 ⑥ EL `lazy` DE LA GALERÍA SE RETIRA — MI CURA DEL LOTE 9 LA DEJÓ PEOR

**Medido en el emulador: el `import()` del paquete NUNCA resuelve.** La ruta abre al instante y se queda en la espera **minutos**, con la rueda girando y el catálogo sin llegar jamás.

> **Cambié siete segundos en blanco por una espera infinita bien dibujada** — y lo segundo es peor: *el blanco al menos termina.*

⇒ vuelve el import estático. **La deuda de los 7 s queda abierta y con su causa medida**, que es más de lo que tenía: *el bundling ocurre antes de que React renderice nada, así que ninguna espera dibujada puede cubrirlo desde adentro de la ruta.* Sólo partir el catálogo de verdad, o que el bundler lo tenga listo antes.

---

## ⑦ LAS CAPTURAS — lo que hay y lo que no

| pieza | estado |
|---|---|
| **`EsperaLarga`** | ✅ **montada en aparato real**, tres botones. `capturas-s116-b/espera-larga-montada.png`. *La rueda giró de verdad: perro → ave entre dos capturas separadas 90 s, con el halo respirando.* |
| **el isotipo v5** | ✅ a 24 / 32 / 48 / 96 — `capturas-s116-b/isotipo-v5-tamanos.png` |
| **la onda · el confeti · el carrito** | ❌ **no se llegó** |

🔴 **Y el obstáculo es nuevo, mío, y del propio instrumento: DENTRO de la galería el scroll se traba.** Medido: **360 swipes por el borde derecho, cero movimiento**, parado en la sección de revisión de vacunas. *Es la misma clase que `PantallaConPie` ya tenía nombrada —«un pie que captura el toque deja sin scroll el tercio inferior»— sólo que acá lo captura una sección con campos.*

**Consecuencia, y por eso va como hallazgo y no como excusa: ninguna pieza que viva debajo de esa sección se puede gatear.** La galería abre —eso se corrigió— pero **no se puede recorrer entera**, y ése es el próximo trabajo de su dueño, que soy yo.

⚠️ **Lo que la primera captura del isotipo me enseñó, y vale para todo esto:** monté un bloque blanco que parecía un defecto de la pieza **y era de mi montaje** (`qlmanage` devuelve lienzo cuadrado y yo lo aplasté). *Un defecto del instrumento se lee igual que uno de la pieza, y sólo se separan midiendo los dos.*
