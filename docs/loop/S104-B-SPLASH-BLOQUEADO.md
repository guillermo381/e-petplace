# S104-B · EL SPLASH (§1 del ritual) — BLOQUEADO, con sus dos causas medidas

**No lo construí, y no es una omisión: son dos bloqueos duros, los dos medidos.**
Va con la spec completa para que quien pueda hacerlo no tenga que re-medir nada.

---

## 🔴 BLOQUEO 1 — No puedo producir el asset

§1 pide **isotipo + wordmark «e-PetPlace»** en el splash. `expo-splash-screen`
toma **UNA imagen raster**, así que el wordmark tiene que ir **horneado en el
PNG**.

Censado en este entorno: **no hay ningún rasterizador de SVG ni librería de
imagen.**

| herramienta | estado |
|---|---|
| `rsvg-convert` · `convert` · `magick` · `inkscape` · `resvg` · `cairosvg` | **ninguna** |
| `sharp` · `@resvg/resvg-js` · `canvas` · `svg2png` en `node_modules` | **ninguna** |

⇒ El `Isotipo` vive como SVG en `react-native-svg` y **no hay forma de
rasterizarlo acá**. Es el mismo límite que el canon ya declara en cada gate de
ícono (*«en este entorno no hay rasterizador de SVG»*).

## 🔴 BLOQUEO 2 — Cambiar solo el fondo ROMPE el splash, y no se puede revertir por OTA

Medido en el asset actual del cliente: **es una marca BLANCA sobre transparente**,
dibujada para el fondo azul. Y el fondo actual es **`#208AEF`** — un hex huérfano
que **no existe en ningún token**: es el azul del template de Expo.

§1 pide el tapiz de la casa = `palette.papelTapiz` = **`#F6F6F6`**.

⇒ **Marca blanca sobre fondo casi blanco = splash en blanco.** Y el splash es
**binario**: un splash roto **no se cura por OTA**, se cura con otra build.

> **El fondo y el asset son UN SOLO ACTO.** Hacer la mitad barata hoy deja la app
> con la pantalla de arranque vacía hasta la build siguiente. *Es el mismo
> precedente que «encender el reloj y aplicar la enmienda son el mismo acto»
> (S80).* **Por eso no toqué el `app.json`.**

## 🔴 BLOQUEO 3 — «Coincidir al píxel» es geométricamente imposible como está escrito

§1: *«coincidir al píxel con el primer frame del Acto II (misma posición, misma
escala)»*.

| | dónde queda el isotipo |
|---|---|
| splash nativo | **centrado** (`expo-splash-screen` centra su imagen; no hay prop de posición) |
| bienvenida | **anclado arriba**: `paddingTop: insets.top + spacing[8]` |

Con `insets.top ≈ 40dp` en una pantalla de ~780dp, el centro del isotipo cae en
**~108dp** en bienvenida y en **~390dp** en el splash. **Están a ~280dp** — un
tercio de pantalla, no un error de redondeo.

**La salida está en el propio §0 y no la inventé yo:** *«el splash no termina: se
convierte»* y *«el isotipo… se **asienta** en la bienvenida»*. ⇒ el primer frame
del Acto II tiene que **empezar donde el splash lo dejó (centrado)** y **asentarse**
a su posición de reposo. Eso es composición de C y **decisión de la mesa**, no de
esta pista.

---

## La spec, para quien haga el asset (todo medido, nada estimado)

| qué | valor | de dónde sale |
|---|---|---|
| fondo | **`#F6F6F6`** (`palette.papelTapiz`) | el token del tapiz de la casa |
| isotipo · aspecto | **471.82 × 324** ⇒ **1.456** | `viewBox` de `Isotipo.tsx` |
| isotipo · alto en bienvenida | **72** | `<Isotipo size={72}>` (`size` es el ALTO) |
| ⇒ `imageWidth` que iguala la escala | **105** | 72 × 1.456 = 104.8 |
| wordmark | **«e-PetPlace»** | `LockupMarca` (pieza nueva de esta tanda) |
| wordmark · tipografía | `sans.medium`, `size.lg` | la anatomía que la bienvenida ya usaba |
| aire isotipo → wordmark | **`spacing[3]` = 12** | el `gap` del lockup en bienvenida |

⚠️ **El asset actual NO es el isotipo de la casa.** Medido por aspecto: el PNG del
cliente es 228×213 → **1.070**, y el del prestador 285×208 → **1.370**. El isotipo
es **1.456**. Ninguno de los dos es la marca vigente.

## ⛔ Lo que deliberadamente NO toqué

**El splash del prestador.** Su fondo `#0A7268` es **tealDark, el muro del oficio**,
puesto por orden del founder en **S96-C** (*«muere el splash del template; nace el
arranque de la casa»*). Y **§7 del ritual dice que no toca prestador en v1**.
Cambiarlo sería deshacer una firma con otra que no lo nombra.

## Y esto viaja en el mismo tren

El splash es binario, y en esa build tienen que subir también:
- **`app.json` → `name`: `ePetPlace` → `e-PetPlace`** (hecho en esta tanda; el
  `android.package` **NO se tocó** — D-752).
- **`expo-local-authentication`**, que `PantallaDeCandado` necesita para dejar de
  estar inerte (medido: no está instalado en ningún workspace).
