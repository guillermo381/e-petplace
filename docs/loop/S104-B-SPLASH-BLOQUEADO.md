# S104-B · EL SPLASH (§1 del ritual) — RESUELTO A MEDIAS POR FIRMA, con lo que falta declarado

> ## ✅ ENMIENDA (firma del founder, 23-ago) — EL CAMINO INTERMEDIO, APLICADO
>
> **El cliente adopta el asset del prestador + `tapizDark`.** Ya está en el repo:
>
> | qué | antes | ahora |
> |---|---|---|
> | asset | el **chevron del template de Expo** | **el isotipo de la casa** (copia byte-idéntica del prestador, sha256 verificado) |
> | `backgroundColor` | `#208AEF` (hex huérfano del template) | **`#0D050D`** (`palette.tapizDark`, token de fondo **del cliente**) |
> | `imageWidth` | 76 | **122** (derivado — ver abajo) |
>
> ### 🔴 DOS CORRECCIONES A LO QUE ESTE MISMO DOCUMENTO DECÍA
>
> **① «Ninguno de los dos assets es el isotipo» era FALSO para el prestador, y el
> error fue mío: medí el LIENZO y no el CUERPO.** Decodificado el alfa, el
> contenido del PNG del prestador es **245×168 → aspecto 1.458**, contra **1.456**
> del `viewBox` del `Isotipo`. Coincide a la tercera decimal: **es el isotipo**, con
> padding en el lienzo. *El mismo modo de falla que la casa ya tiene nombrado —
> medir el nombre en vez del cuerpo.* Corroborado por una segunda fuente
> independiente: `apps/prestador/src/components/animated-icon.tsx:7` ya declaraba
> que el `splash-icon` del template *«era el mismo caret de Expo»* — que es
> exactamente lo que el decode mostró del lado del cliente.
>
> **② `tapizDark` NO da «el menor salto a bienvenida»** (así quedó dicho en la
> firma). Da **el mayor**: 0.919 contra 0.674 del azul de hoy. **La decisión sigue
> siendo la correcta por los otros tres motivos** —token de fondo del cliente ·
> 20.10:1 de contraste, el mejor de los cuatro · no deshace S96-C— pero la razón se
> corrige acá para que no se re-discuta sobre una premisa falsa.
>
> ### Por qué NO se copió también el fondo del prestador
> `#0A7268` es **tealDark, el muro del oficio del prestador** (§15b.2). Y S96-C lo
> puso ahí con el propósito contrario: *«icono launcher: gradiente INTACTO sobre
> tealDark — **las dos apps dejan de ser gemelas**»*. Copiar el splash entero las
> volvía gemelas **justo en el frame donde se establece la diferencia**.
>
> ### El `imageWidth: 122`, derivado y no elegido
> El lienzo mide 285 y el contenido 245 ⇒ ratio **0.8596**. Bienvenida monta
> `Isotipo size={72}` (el `size` es el ALTO) ⇒ ancho 72 × 1.456 = **104.8**.
> ⇒ `imageWidth = 104.8 / 0.8596 = ` **122**, que renderiza el isotipo a **72.0 dp
> de alto: exactamente el de bienvenida.**
> **No se usó el 140 del prestador**, y es la única desviación de «el mismo splash»:
> §1 pide *«misma posición, misma escala»* y **la escala es la mitad alcanzable**
> (la posición no lo es — ver el bloqueo 3, que sigue vivo). Con 140 el isotipo
> saldría a 82.7 y el salto de escala se vería.
>
> ### Lo que esta enmienda NO resuelve
> **El splash del ritual sigue pendiente**: tapiz claro + isotipo entintado +
> wordmark. Exige un asset que este entorno **no puede producir** (bloqueo 1) y su
> coincidencia de POSICIÓN sigue siendo imposible (bloqueo 3). La spec de abajo es
> el insumo para quien lo dibuje con herramienta de diseño.

---

## Los tres bloqueos, tal como se midieron (siguen vigentes para el splash del ritual)

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
