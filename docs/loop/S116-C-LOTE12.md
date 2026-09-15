# S116-C · LOTE 12 — el parte

**CAPTURAS: `docs/loop/capturas-s116-c-lote12/`**

Rama `pista/s116-c-05` · sobre `origin/main @ e2a61639` (el lote 14 de B, con
`D-1118` curada). Aparato: AVD propio `s114_C` (`emulator-5578`), **barra de tres
botones**, cliente 1.0.7, bundle fresco.

**Gates:** `tsc apps/cliente` **0**. Cero código tocado en este lote: es una
verificación.

---

## LAS TRES FLECHAS — tocadas de verdad, y vuelve desde cada una

| # | pantalla | nodo `Volver` | toque | a dónde volvió |
|---|---|---|---|---|
| **03** | `login` | `[53,157][163,267]` | **(108,212)** | ✅ **01 · Propuesta** |
| **04** | `recuperar` | `[53,157][163,267]` | **(108,212)** | ✅ **03 · login** |
| **05** | `registro` | `[53,157][163,267]` | **(108,212)** | ✅ **01 · Propuesta** |

**Cada una leída del árbol a 1,3 s del toque, no a ojo**, y las tres cambiaron de
pantalla en la primera lectura. Capturas: `p1-03-login.png` · `p2-04-recuperar.png`
· `p3-05-registro.png`.

⚠️ **Tomo 04 = `recuperar` y lo declaro por si la mesa lo numeraba distinto:**
ningún archivo de acceso lleva su número en la cabecera (sólo `bienvenida.tsx`
dice «01 · PROPUESTA»), así que lo resolví por el recorrido — `recuperar` es la
tercera pantalla de la familia con flecha y se entra desde 03 por *«¿Olvidaste tu
contraseña?»*. **Es además la que faltaba en la tabla del lote 14 de B**, que
midió 03 y no las otras dos.

**La cura de B es la buena y conviene saber por qué:** no ordenó capas —eso era lo
que se pisaba— **quitó el solape**, recortando el fondo en `arranque`. Con eso el
wordmark no puede pintarse sobre la hoja *sin* `zIndex`, y el fondo sigue después
del scroll, que es lo que le devuelve el toque a la flecha (`D-1113`).

---

## EL LOGO NO SE TRANSPARENTA — con control positivo y negativo

`p3b-05-scrolleada-logo-no-se-transparenta.png`: 05 con tres barridos, el
formulario sobre lienzo limpio.

**Y no lo digo mirando.** Muestreé **la misma ventana de píxeles** donde vive el
logo sin scrollear (`x 300..800`, `y 330..700`) en las dos capturas de la MISMA
pantalla, contando píxeles oscuros:

| | píxeles oscuros en la ventana del logo |
|---|---|
| `p3-05-registro.png` (sin scrollear — el logo y el ciruela están ahí) | **8515 / 11625 · 73,2 %** |
| `p3b-…scrolleada…` (la hoja tapa) | **67 / 11625 · 0,6 %** |

**El negativo tiene su explicación medida:** esos 67 son el gris `(107,108,110)`
del placeholder «ej: Ana». El resto de lo no-lienzo son el blanco de los campos y
el ciruela de sus bordes. **Cero magenta, cero gradiente, cero logo.**

*El control positivo es lo que hace que el 0,6 % signifique algo: sin él, una
ventana mal elegida daría el mismo número midiendo cualquier lado.*

---

## 🔴 LE CONTESTO A B: LA ONDA SÍ LLEGA AL PISO

B me dejó un buzón diciendo que la onda *«termina donde empieza la barra de tres
botones, no por debajo»*, con este volcado:

```
y=2280  (250,231,243) ← lienzo: acá EMPIEZA la barra de tres botones
```

⚠️ **Ese color no es el lienzo.** El lienzo de la casa es `#F8F2F6` =
**(248,242,246)** (`palette.ts:88`); lo medido es **(250,231,243)**. *No se
parece: es otro color, y la diferencia es exactamente la que separa las dos
explicaciones.*

**El control, con tres pantallas de contenido distinto bajo la barra.** Si la app
dejara de pintar ahí, **las tres franjas serían del mismo color**. Si pinta hasta
el piso y Android le aplica su velo de contraste, **cada franja es su propio
contenido aclarado**:

| pantalla | contenido `y=2265` | franja `y=2330` | predicho (velo blanco .90) |
|---|---|---|---|
| **03** | magenta (209,7,136) | **(250,231,243)** | (250,230,243) |
| **04** | **lienzo (248,242,246)** | **(254,253,254)** | (254,254,254) |
| **05** | magenta (209,7,136) | **(250,231,243)** | (250,230,243) |

**Las tres aciertan con ≤1 unidad, y 04 cierra el caso**: con lienzo debajo la
franja sale casi blanca. Más el α, que cierra por separado en los tres canales
(0,89 · 0,90 · 0,90) — *un velo blanco al 90 % explica los tres a la vez; una
coincidencia en tres canales, no.*

⇒ **No hay nada que curar en mi montaje** (ya es hija directa de la raíz, sin
`SafeAreaView` que recorte abajo y sin duplicar el inset). Lo que hay encima del
magenta es **`navigationBarContrastEnforced`**: config nativa, **cambia todas las
pantallas de las dos apps y exige build** ⇒ decisión de mesa, con el número
puesto. Respuesta completa en
`docs/loop/buzon/S116-C-para-B-la-onda-SI-llega-al-piso.md`.

**Y la nota de método, que es la que vale más que el caso:** los dos medimos el
mismo píxel y lo atribuimos distinto. Lo que lo resolvió no fue medir de nuevo
—el número era el mismo— **fue buscar una pantalla donde las dos hipótesis
predijeran cosas distintas.** *Dos lecturas que no coinciden no se dirimen
repitiendo la medición: se dirimen cambiando el caso.*
