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

---

# ADENDA — S116-C · tanda 06 punto 5 · **re-medido hoy, y ahora con TRES contenidos y su aritmética**

El founder pidió el punto 5 así: *«la onda de 03 y 05 al borde físico (B dejó la
medición: un absoluto no escapa de su padre; se cura en el montaje)»*.

**Fui a curar el montaje y el montaje ya estaba bien.** Lo que encontré:

## ① El montaje YA cumple lo que pediste

`login.tsx` y `registro.tsx` montan `<OndaAcceso>` como **hija directa del
`<View style={{flex:1}}>` raíz**, hermana de `<EvitaTeclado>`. **Sin
`SafeAreaView` y sin `paddingBottom` de inset en esa rama** — las dos pantallas
lo declaran en su propio comentario (*«esta pantalla deja de pagar
`insets.bottom` — lo paga la hoja»*). No hay padre corto que curar.

## ② El píxel, reproducido igual que el tuyo

```
03 (login):  y=2269 → (209,7,136)  magenta, último píxel de la onda
             y=2290 → (250,231,243)
05 (registro): idéntico
```

## ③ EL CONTROL QUE LO DECIDE — tres pantallas, tres contenidos, tres franjas

| pantalla | `y=2269` (lo que pinta la app) | `y=2290` (bajo la barra) |
|---|---|---|
| bienvenida | `(39,6,47)` ciruela | `(234,231,235)` |
| onboarding | `(248,239,245)` lienzo | `(254,254,254)` |
| 03 y 05 | `(209,7,136)` magenta | `(250,231,243)` |

**Si la app dejara de pintar en `y=2290`, las tres serían el MISMO color.** Son
tres, y cada una es su propio contenido aclarado.

**La aritmética cierra con un velo blanco al ~89 %, en los nueve canales:**

```
ciruela (39,6,47)   → 231,228,232   medido (234,231,235)
lienzo  (248,239,245)→ 254,253,254   medido (254,254,254)
magenta (209,7,136) → 250,228,242   medido (250,231,243)
```

⇒ **la onda SÍ llega al piso físico en las dos pantallas.** Lo que se ve encima
es el **velo de contraste de la barra de navegación de Android**, que el sistema
pinta sobre lo que haya.

## ④ Y por eso NO se cura en el montaje — se apaga, y eso es una BUILD

Se apaga con `navigationBarContrastEnforced = false` (o pintando la barra
transparente). Eso es **configuración nativa**: `expo-navigation-bar` **no está
instalado** (medido: cero en `package.json` y cero en `node_modules`) y
`app.json` no declara nada de la barra.

⇒ **módulo nativo nuevo = build, no OTA** (`L-134`). **Va al lote 8 (lo nativo,
de A)**, junto al ícono y el splash — no a un lote de C.

*Lo dejo escrito acá y no lo curo porque curarlo desde el montaje sería moverle
el piso a la onda para tapar un velo que el sistema va a volver a pintar.*
