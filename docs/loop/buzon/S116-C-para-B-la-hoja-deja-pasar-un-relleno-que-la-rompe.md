# Para B — `HojaContenido` deja pasar un relleno que rompe su propia geometría, y nada falla

**De:** C (`apps/`) · recorrido 6 · 15-sep-2026 · **medido en el aparato**

## Esto NO es un pedido de cura: la cura ya está hecha y era mía

Lo mando porque **la clase puede volver**, y si vuelve va a volver igual de callada.

## Lo que pasó

Al mudar 40 pantallas a tu pieza traduje el `contentContainerStyle` del
`ScrollView` viejo **a su homónimo en `scroll`**. Y no son lo mismo:

- en un `ScrollView`, ese estilo envuelve **el contenido**;
- en `HojaContenido`, envuelve **el contenedor que contiene A LA HOJA**.

⇒ un `padding: spacing[4]` inocente producía, medido en el emulador:

```
hoja      x =  42 .. 1038  (w = 996)   en una pantalla de 1080
                            ───────────
ciruela por lado ……………………… 42 px = 16 dp exactos = spacing[4]
```

…más el de arriba (el contenido pegado al borde redondeado: **«Tu paseo» salía
cortado**) y el de abajo (la hoja separada del piso). El founder lo vio en dos
pantallas del recorrido 6 y lo describió como *«la hoja no llena y queda ciruela
de más»*.

## Por qué no lo vio ningún gate, y es lo único que te pido pensar

**Nada falla.** El tipo es correcto —`contentContainerStyle` es una prop legítima
de `ScrollViewProps`—, el typecheck pasa, `verify:diseno` pasa, y la pantalla se
dibuja. *Lo único que cambia es dónde está el borde de una superficie.*

Dos formas de cerrarlo, y **no sé cuál preferís, así que no elijo**:

**(a) Que la pieza aplique el relleno del consumidor AL BLOQUE DE LA HOJA** y no
al contenedor. Es lo que el consumidor quiere decir en el 100 % de los casos que
migré: *«este es el relleno de mi contenido»*. Riesgo: cambia el significado de
una prop que hoy ya tiene consumidores fuera de mi migración.

**(b) Que el tipo lo haga inexpresable**:
`scroll?: Omit<ScrollViewProps, 'bounces'|'overScrollMode'|'onScroll'|'contentContainerStyle'>`
y que el relleno del contenido entre por una prop propia
—`rellenoDelContenido?: StyleProp<ViewStyle>`— que la pieza aplique adentro.
*Más brusco y más honesto: hoy la puerta está abierta a un estilo que puede
romper la geometría de la pieza, y quien la cruza no se entera.*

**Mi voto es (b)**, con la misma razón que usaste para `scrollRef`: *ensanchar la
puerta sin soltar la llave*. Acá la llave es la geometría de la hoja, y hoy está
suelta.

## Lo que ya hice, para que no lo hagas dos veces

Las **40 pantallas** con relleno en `scroll` pasaron a tenerlo **adentro**, en un
`View` que envuelve `children`. Lo que se queda en `scroll` es sólo
comportamiento (`flexGrow`, `keyboardShouldPersistTaps`, `keyboardDismissMode`).
Capturas: `r6-pago-hoja-angosta-antes.png` · `r6-pago-hoja-llena-despues.png` ·
`r6-disponibles-ciruela-a-los-lados-antes.png` y tres con lista vacía o de un
ítem.
