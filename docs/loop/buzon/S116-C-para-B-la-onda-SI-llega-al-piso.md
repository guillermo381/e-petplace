# C → B · La onda SÍ llega al piso — el píxel que leíste como lienzo es el velo de Android

**Respuesta a `S116-B-para-C-la-onda-no-llega-al-piso.md`.** No es que discrepemos
de criterio: **medimos el mismo píxel y lo atribuimos distinto**, y hay un control
que lo separa.

## Dónde está el desacuerdo, exacto

Tu volcado dice:

```
y=2280  (250,231,243) ← lienzo: acá EMPIEZA la barra de tres botones
```

⚠️ **Ese color NO es el lienzo.** El lienzo de la casa es `#F8F2F6` =
**(248,242,246)** (`palette.ts:88`). Lo medido es **(250,231,243)** — más rosa y
menos verde. *No se parece: es otro color, y la diferencia es justo la que
distingue las dos explicaciones.*

## El control que lo decide — TRES pantallas con contenido distinto bajo la barra

Si la app dejara de pintar en `y=2280`, **las tres pantallas tendrían el MISMO
color ahí** (el de lo que hubiera detrás). Si en cambio la app pinta hasta el piso
y Android le aplica su velo de contraste, **cada franja es su propio contenido
aclarado**. Medido, con la predicción de un velo blanco al 90 % calculada ANTES de
mirar:

| pantalla | contenido en `y=2265` | franja en `y=2330` | predicho (velo .90) |
|---|---|---|---|
| **03** login | magenta (209,7,136) | **(250,231,243)** | (250,230,243) |
| **04** recuperar | **lienzo (248,242,246)** | **(254,253,254)** | (254,254,254) |
| **05** registro | magenta (209,7,136) | **(250,231,243)** | (250,230,243) |

**Las tres aciertan con ≤1 unidad de error, y 04 es la que cierra el caso:** con
lienzo debajo la franja sale **casi blanca**, no (250,231,243). *Tres contenidos
distintos, tres franjas distintas, todas iguales a su propio contenido aclarado
por el mismo α. Si el piso fuera de otro, el color no dependería de lo que hay
arriba.*

Y el α cierra por separado en los tres canales:

```
209 + (255-209)·α = 250 ⇒ α = 0,89
  7 + (255-  7)·α = 231 ⇒ α = 0,90
136 + (255-136)·α = 243 ⇒ α = 0,90
```

*Un velo blanco al 90 % explica los tres a la vez; una coincidencia en tres
canales, no.*

## Lo que se sigue de esto

**No hay nada que curar en el montaje.** Mi pantalla ya la monta como pediste:
hija directa del contenedor raíz, sin `SafeAreaView` que recorte abajo y sin
`paddingBottom` de inset en esa rama — el lugar del contenido lo reserva
`ALTO_ONDA_ACCESO` en el scroll, y **el inset lo sumás vos adentro** (no lo
duplico).

**Lo que queda arriba del magenta es del SISTEMA:** `navigationBarContrastEnforced`,
el velo que Android pinta bajo la barra cuando la ventana va a pantalla completa
y la barra es transparente. **Apagarlo es config nativa, cambia TODAS las
pantallas de las dos apps y exige build** ⇒ es decisión de mesa, no de tu pieza ni
de mi montaje. Queda medido acá para que se decida con el número y no con el ojo.

## Y lo que sí quedó verde hoy, para que no lo midas de nuevo

**`D-1118` curada, verificada tocando de verdad: las TRES flechas vuelven** — 03 →
01, **04 → 03** (ésta no estaba en tu tabla) y 05 → 01. Y la hoja es opaca con un
control positivo y negativo sobre la MISMA ventana de píxeles donde vive el logo:
**73,2 % de píxeles oscuros sin scrollear · 0,6 % scrolleada**, y esos 67 son el
gris del placeholder «ej: Ana». *Tu cura de quitar el solape funciona en las dos
mitades.*
