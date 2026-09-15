# Para B — **la `Hoja` no llega a su último botón, y el mapa se come el scroll**

Medido en el aparato (emulador, 1080 × 2400), hoja de dirección del checkout de
paseo (`Hoja` + `EvitaTeclado` + `HojaScroll` + `DireccionHogarForm`).

## ① Un *fling* dentro de la hoja NO scrollea: lo toma el gesto de cerrar

`input swipe … 150 ms` (fling) → **el contenido no se mueve** y la hoja rebota.
`input swipe … 600 ms` (arrastre lento) → **scrollea normal**.

*No es del emulador: es que el gesto rápido lo gana el swipe-to-close de la hoja.*
Es `L-132` otra vez —el ScrollView que pierde contra la hoja— pero **un piso más
arriba**: con `HojaScroll` montado, el arrastre lento funciona y el rápido no.
**Para un dedo humano eso es «a veces scrollea».**

## ② La capa que bloquea el mapa **también bloquea el scroll**

El mapa mide **~578 px** (bounds `[42,1684][1038,2262]`) y su capa de bloqueo
dice de sí misma: *«Cubre el mapa entero y no deja pasar NINGÚN gesto… su trabajo
ES capturar»*. ⇒ **un arrastre que empiece sobre el mapa no scrollea la hoja**, y
el mapa ocupa casi la mitad visible.

## ③ La consecuencia medida

Con el mapa montado, **«Guardar dirección» quedaba en `y = 2338` de 2400** —
detrás de la barra del sistema— y el único gesto que podía llegar hasta él es el
que la capa del mapa bloquea. **El botón existe, se lee en el árbol de
accesibilidad, y no se puede tocar.**

**Lo curé del lado del montaje** subiendo el bloque de guardar por encima del
mapa (es la misma firma de S100d·bis que ya había movido «Ajustar el punto»: *los
botones de acción no pueden quedar detrás del mapa* — a `Guardar` nunca se le
había aplicado). Con eso el botón entra en pantalla sin pelear con el mapa.

## Lo que te pido, que es de la pieza y no del montaje

1. **Que el fling scrollee.** Si `HojaScroll` ya declara `blocksExternalGesture`,
   medir por qué el gesto rápido sigue yendo al contenedor. *Un control que
   responde al arrastre lento y no al rápido es peor que uno que no responde: se
   siente roto al azar.*
2. **Una salida para el bloqueo del mapa.** Hoy es todo o nada. Alcanzaría con
   que la capa deje pasar el gesto **vertical** (el que scrollea) y siga comiendo
   el **horizontal y el pinch** (los que mueven el mapa). *Bloquear el mapa no
   tenía por qué bloquear la página.*
