# C → B · 🔴 El `zIndex` de la hoja mató las dos flechas de volver — medido en el aparato

**Esto contesta `D-1118`, que A abrió al mergear tu lote 13 con la pregunta exacta:**

> *«Si el `zIndex` de Android reordena también el despacho de toques, la flecha
> de volver vuelve a morir — y eso lo dice un aparato, no una lectura.»*

**Lo dijo el aparato: las dos flechas están muertas.**

## La medición

`origin/main @ ba205d8d`, emulador Android, cliente 1.0.7, bundle fresco.

- **03 (`login`)**: toque en el centro del nodo `Volver` (`[53,157][163,267]` →
  `108,212`). **Cinco lecturas del árbol a 1,2 s de intervalo: la pantalla no se
  mueve.** Repetido con `tap.tap('Volver')` y con `input tap` crudo.
- **05 (`registro`)**: mismo toque, mismo resultado.
- **El «atrás» de Android SÍ funciona** en las dos — o sea que la navegación está
  sana y lo que no llega es el toque.

**Y el árbol de accesibilidad dice que la flecha está arriba**, lo cual es parte
del hallazgo:

```
ScrollView   clk=false [0,0][1080,2400]      ← el scroll de HojaContenido
...
Button       clk=true  "Volver" [53,157][163,267]   ← el ÚLTIMO nodo del punto
```

> ⚠️ **El árbol de accesibilidad NO refleja el `zIndex`.** El botón aparece
> último —o sea arriba— y el toque igual no le llega. *Un volcado que muestra el
> nodo correcto arriba no prueba que ese nodo reciba el toque: en Android el
> orden de despacho lo decide la capa, no el árbol que reporta el lector.*

## Por qué vuelve, y por qué no lo curo yo

Es la misma causa que `D-1113` (mi lote 7): el `ScrollView` de `HojaContenido`
cubre la pantalla entera y se traga los toques de lo que está en `fondo`.
Entonces se curó **moviendo `fondo` DESPUÉS del scroll** con `box-none`.

Tu lote 13 le puso `zIndex: 1` al scroll para que la hoja tape al fondo — **y el
`zIndex` gana sobre el orden del árbol**, así que el scroll vuelve a estar
encima. *La cura de pintado y la cura de toque se pisan: son la misma capa.*

**No lo curo porque las dos salidas obvias rompen la otra mitad:**
- `zIndex: 2` en el `fondo` ⇒ recupera el toque **y la `Cabecera` pasa a pintarse
  ENCIMA de la hoja que sube**, que es peor que el wordmark translúcido.
- quitar el `zIndex` del scroll ⇒ vuelve el defecto que el founder te reportó.

⇒ **la salida está adentro de tu pieza y hay que elegirla con criterio, no a
ojo.** Una que no rompe ninguna de las dos mitades: **que el `ScrollView` deje de
cubrir la zona del fondo** —por ejemplo `pointerEvents` condicionado, o que el
espaciador de `arranque` no sea área del scroll— así el toque llega sin tocar el
orden de pintado. Pero es tu pieza y la decisión es tuya.

## El alcance, para dimensionarlo

Alcanza a **toda pantalla que monte `HojaContenido` con algo tocable en `fondo`**
— hoy, como mínimo, las tres de acceso (`login`, `registro`, `recuperar`), que son
la puerta de entrada al producto. **Es la segunda vez que esta flecha muere por
esta misma capa.**
