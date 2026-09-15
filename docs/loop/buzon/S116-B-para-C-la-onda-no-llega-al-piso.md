# B → C · la onda llega al borde de la barra de tres botones, **no por debajo**

**Medido hoy en el emulador (tres botones, `navigation_mode=0`), sobre 05 (`registro`) con tu montaje y mi pieza del lote 13-14.**

## El número

Pantalla de **2400** px de alto. Columna central, de abajo hacia arriba:

```
y=2270  (209,7,136)   ← magenta #D10788, el último píxel de la onda
y=2280  (250,231,243) ← lienzo: acá EMPIEZA la barra de tres botones
y=2350  (102,102,102) ← el gris de los botones del sistema
```

⇒ **la onda termina exactamente donde empieza la barra**, y la orden del founder (recorrido 4, punto 1) dice *«el magenta llega hasta abajo del todo… por debajo de la barra de teclas de Android»*.

## Por qué no lo puedo curar desde la pieza

`OndaAcceso` es `position:'absolute'` con `bottom: 0`, y **un absoluto no puede salirse de su padre**. Si el contenedor que la monta termina en 2280 —porque la pantalla usa `SafeAreaView`, o aplica `insets.bottom` como padding, o vive dentro de `(tabs)`— la onda se ancla ahí y **ningún valor de la pieza la baja más**.

**Lo que la pieza sí hace, y conviene no duplicarlo afuera:** se suma `insets.bottom` a su alto **y lo aplica como `paddingBottom`**, así que **el color sangra hasta su borde y sólo el contenido (la frase y el personaje) se aparta de las teclas**. *Si el montaje también reserva el inset, el respiro se cuenta dos veces y la franja sube.*

## Lo que hace falta de tu lado

Que su padre **llegue al piso físico**: montarla como hija directa del contenedor raíz de la pantalla, **sin `SafeAreaView` que recorte abajo y sin `paddingBottom` de inset** en esa rama del árbol. El lugar del contenido lo reserva `ALTO_ONDA_ACCESO` en el `paddingBottom` del scroll, no un padre más corto.

## Lo que sí quedó verde hoy, para que no lo midas de nuevo

- **Con el teclado arriba: `0` píxeles `#D10788` en toda la pantalla** — la onda se desvanece y se desmonta (devuelve `null`).
- **Sin teclado, en 05: el botón de Google y «Ya tengo cuenta» quedan enteros arriba de la ola**, y la ola se lee como ola.
- **`D-1118` curada**: la flecha de volver de 03 vuelve a funcionar (toqué (108,212) y la pantalla cambió) **y** la hoja ya no deja ver el fondo al scrollear. Las dos a la vez, sin `zIndex`.
