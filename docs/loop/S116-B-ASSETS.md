# S116-B · ASSETS — qué llegó, qué es, qué falta

> **Worktree `e-petplace-s116-b-01` · rama `pista/s116-b-01` · `main` @ `d14c55bf`.**
> Medido el **13-sep-2026**. **Nada se ingirió: eso es del lote 2.** Cero código tocado.
> Capturas en `docs/loop/capturas-s116-b-assets/`.

---

## ⓪ DOS CORRECCIONES DE UBICACIÓN, antes de nada

| el encargo decía | el objeto dice |
|---|---|
| «en el escritorio» | **no hay nada en el escritorio.** Las carpetas viven en `~/Downloads` |
| «las dos caras del ave» | **hay UN archivo nuevo por carpeta**, no dos — y no son dos caras (§①) |
| «una carpeta nueva **e-petplace**» | **hay DOS carpetas con ese nombre y sólo una es la del ilustrador** (§②) |

---

## ① LAS CARAS DEL AVE

**Lo que llegó: UN archivo, en las dos carpetas** — `Catlog - SVG/Catlog.ai.svg` y `Catlog - PNG.ai/Catlog.ai.png`, los dos del **13-sep 12:38** (las carpetas pasaron de 18 a 19 archivos).
`sha256` (16): `36bd00fb7c0cd650` el svg · `1dd7b4561804f1ac` el png.

**Es el ave SIN wordmark y con transparencia.** ✅ Es exactamente lo que el lote 1 declaró faltante.
- PNG: **2299×2299**, 65,7 % transparente, bbox del contenido 2062×2299.

### 🔴 Pero el SVG NO es vector: es raster envuelto

**Comando:** conteo de `<path>` / `<image>` / `data:image` sobre el archivo.

```
<path>   = 0          <image> = 2        base64 embebido = SÍ
<g>      = 4          <text>  = 0        clipPath = 0
ids      = 3, autogenerados: 148dcdd801 · 252b6d1398 · 2c3a08852d
```

⇒ **VECTOR REAL: NO.** Mismo caso que gato, perro y conejo en el lote 1.

### 🔴 Y las «dos imágenes» no son dos caras: son las dos capas de un raster

Extraídas y vistas (`ave-svg-mascara-y-color.png`): las dos miden **1462×1466**, las dos van en `x=0 y=0` con la misma caja, y **ninguna tiene transparencia propia (0,0 %)**.

| | qué es |
|---|---|
| `image[0]` · 39.406 B | **la máscara de alfa** — silueta blanca sobre negro |
| `image[1]` · 95.742 B | **el color** — el ave sobre negro |

Es la técnica de export de un raster con transparencia: color + máscara de luminancia. **El SVG no aporta nada sobre el PNG** — es el mismo mapa de bits, partido en dos y envuelto.
⚠️ **Un dato aprovechable igual:** `image[0]` **es** una silueta lista, y la silueta es justo lo que el ícono de notificación necesita. No sirve para el ave (ahí queremos su cara), pero el método existe y el ilustrador lo usa.

### ¿Capas o grupos? No

Los 4 `<g>` son envoltorios de los dos `<image>` con ids autogenerados. **Sin capas nombradas, sin grupos semánticos, sin texto.**

### Capturas a tamaño de la app

`ave-a-tamano-hogar-y-fila.png` — recortado a su bbox y compuesto en círculo, a los tres tamaños de la letra §2 (hogar 78 · selector 66 · fila 52), a escala real y ×2.

**Lo que se ve, y es una observación de diseño, no una medición:** a 78 y 66 se lee bien. **A 52 la cara queda chica** — a diferencia de gato/perro/conejo/hámster, que son *cabezas*, el ave viene de **cuerpo entero** con alas y rayitos, así que dentro del mismo círculo su cara ocupa bastante menos. **Es de las tres capturas la única decisión que queda abierta**, y es del founder.

---

## ② LA CARPETA — hay dos con ese nombre

### 🔴 `~/Downloads/Design/handoff/e-petplace` — **NO es la del ilustrador**

152 archivos: **30 HTML · 24 JSX · 72 PNG · 8 MD**. Es un **proyecto de prototipado** (Claude Design), con `shots/` de capturas y `uploads/` con docs del repo.

**Está fechada el 29-jul-2026** y es del design system **v3.1**:

```
hex más usados: #ff2d9b (102) · #00e5ff (107) · #c5ff3a (55)
```
Son literalmente los tres que `palette.ts` declara reemplazados en v4 (*«pink #FF2D9B → #FF00AF»*, *«cyan #00E5FF → teal #28E8DA»*, *«lime #C5FF3A → ELIMINADO»*).

**Cero hex de la letra v5**, con control positivo:
```
#D10788 · #4E1160 · #3B0B47 · #26062E · #FCE4F1 · #F8F2F6 · #8E0A5D · #FF7FC4 · #14584A · #E0A21F → 0 archivos cada uno
#FF2D9B (control)                                                                                → 13 archivos
```
**Cero archivos de septiembre.**

Sus **2 únicos SVG** (`app/assets/logo.svg` y `iso-epetplace.svg`) son **byte-idénticos entre sí**, y su path es **exactamente el `ISOTIPO_PATH` que ya vive en el repo** — 2.433 caracteres, comparados carácter a carácter. Es el isotipo v4, no la nariz nueva.

⇒ **Esta carpeta no aporta nada al rediseño.**

### ✅ `~/Downloads/epetplace` — **ésta sí**, 13 archivos

| archivo | formato real | vector | grupos/capas | tamaño | qué es |
|---|---|:-:|---|--:|---|
| `1234Log.ai` | PDF 1.4 | **sí, auto-trazado** (25.716 curvas) | **ninguna** | 1,34 MB | lienzo 1478×1064 |
| `LogoAnimal.ai` | PDF 1.4 | **sí, auto-trazado** (33.504) | ninguna | 1,70 MB | lienzo 1478×1064 |
| `Placa.ai` | PDF 1.4 | **sí, auto-trazado** (22.834) | ninguna | 1,22 MB | lienzo 1144×1375 |
| `Logoblanco.ai` | PDF 1.4 | sí (3.952) | ninguna | 201 KB | lienzo 1478×1064 |
| `ChatGPT Image 7 sept…p.ai` | PDF 1.4 | sí (3.660) | ninguna | 189 KB | lienzo 1478×1064 |
| `Epetplace app visual design.pdf` | PDF, **7 páginas** | **sí, limpio** (13.761 curvas, **10 colores**) | — | 399 KB | el diseño de la app |
| `Catlog.ai.png` | PNG **RGB sin alfa** | — | — | 602 KB | gato **con wordmark** |
| `ConejoLog.ai.png` | PNG **sin alfa** | — | — | 547 KB | conejo **con wordmark** |
| `Doglog.ai.png` | PNG **sin alfa** | — | — | 350 KB | perro **con wordmark** |
| `Pinglog.ai.png` | PNG **sin alfa** | — | — | 541 KB | 🆕 **CERDO** **con wordmark** |
| `ChatGPT …10_27_00.png` | PNG con alfa | — | — | 1,08 MB | hámster **con wordmark** |
| `ChatGPT …10_27_03.png` | PNG con alfa | — | — | 958 KB | ave **con wordmark** |

Capturas de los seis: `carpeta-epetplace-los-6-png.png`.

### 🔴 Los `.ai` no son de Adobe, y sus vectores son auto-trazados

**Comando:** lectura de `/Creator` y `/Producer` del PDF.
```
/Creator (SVGStorm)   /Producer (https://svgstorm.com)
```
Cero `/Filter`, cero `AIPrivateData`, cero mención de Illustrator. **Son PDF hechos con un conversor web y renombrados a `.ai`.**

**Y el conteo de colores lo delata como auto-trace:**

| archivo | curvas | **colores distintos** |
|---|--:|--:|
| `LogoAnimal.ai` | 33.504 | **1.558** |
| `1234Log.ai` | 25.716 | **1.049** |
| `Placa.ai` | 22.834 | **1.034** |
| `Logoblanco.ai` | 3.952 | 133 |
| `ChatGPT …p.ai` | 3.660 | 122 |
| *(comparación)* `Epetplace app visual design.pdf` | 13.761 | **10** |

*Un vector dibujado a mano tiene entre cinco y quince colores. Mil es lo que produce vectorizar un mapa de bits: cada matiz de píxel se vuelve un path propio.* ⇒ **son vectores, pero no son vectores limpios**: no tienen capas, no se pueden recolorear por rol y pesan más que el raster del que salieron. **Para la app no son mejores que el PNG.**

### ✅ Los hex del ilustrador — del PDF de diseño, que sí es limpio

| rol | el ilustrador | la letra §2 | |
|---|---|---|---|
| **tinta / negro** | **`#1C1D20`** ×84 | `#1C1D20` | ✅ **idéntico** |
| **verde al día** | **`#14584A`** ×2 | `#14584A` | ✅ **idéntico** |
| magenta vivo | `#EC0F7C` ×26 | `#D10788` | ✗ distinto |
| magenta medio | `#B80B60` ×34 | — | ✗ no está en la letra |
| magenta oscuro | `#8E1149` ×28 | `#8E0A5D` | ✗ cercano, no igual |
| rosa tinte | `#FDE8F1` ×16 | `#FCE4F1` | ✗ cercano, no igual |
| otros | `#C31F66` ×2 · `#F5F4F1` ×2 · `#FFFFFF` · `#000000` | | |

**Dos coinciden al dígito y tres no.** *Que la tinta y el verde den exacto dice que la letra y el ilustrador miran la misma fuente; que los tres magentas difieran dice que el magenta todavía no está cerrado entre los dos.* **Es decisión del founder, no de B** — y hasta que se decida, **manda el token** (`palette.ts` v5), como dice el encabezado de §2 de la letra.

---

## ③ LA TABLA — qué necesita la app, de dónde sale, qué falta

| lo que la app necesita | de qué archivo sale | ¿vector? | qué falta |
|---|---|:-:|---|
| **cara gato** | `Catlog - PNG/2.png` (ya ingerido) | **no** | el vector limpio |
| **cara perro** | `Catlog - PNG/4.png` (ya ingerido) | **no** | el vector limpio |
| **cara conejo** | `Catlog - PNG/6.png` (ya ingerido) | **no** | el vector limpio |
| **cara roedor** | `Catlog - PNG/9.png` (ya ingerido) | **no** | 🔴 **su fondo es BLANCO OPACO** — sobre el lienzo se ve como recuadro |
| **cara ave** | 🆕 `Catlog.ai.png` | **no** (svg = raster envuelto) | nada bloqueante. ⚠️ abierto: a 52 px la cara queda chica (viene de cuerpo entero) |
| **cara «otro» (6.ª)** | `12.png` = la nariz — por enmienda de la letra §1.10 | sí, en el repo | — |
| **nariz clara** | `marca/isotipo` ← `12.png` (ya ingerido) | ✅ sí (268 paths) | — |
| **nariz con contorno** | `marca/isotipo-sobre-oscuro` ← `14.png` | ✅ sí (279 paths) | 🔴 **viene con placa negra opaca**: hay que separarla |
| **silueta para notificación** | **NO EXISTE** como archivo | — | 🔴 **falta.** La vía medida: la máscara de alfa (como `image[0]` del ave). De `12`/`14` se puede derivar, pero **medido en el lote 1: a 24 px la silueta blanca no se lee** — pierde los remolinos |
| **logo claro** | `marca/logo` ← `13.png` (ya ingerido) | ✅ sí (1.310 paths) | ⚠️ **no verifiqué si el texto está en trazos o es fuente viva** (§④) |
| **logo oscuro** | `marca/logo-sobre-oscuro` ← `15.png` (ya ingerido) | ✅ sí (1.271 paths) | ídem |

### Lo que la carpeta `epetplace` NO trae, y se buscó explícitamente

1. **Vectores reales de gato, perro y conejo: NO.** Sus `.ai` son auto-trazados de mil colores y sus PNG traen wordmark y no traen alfa.
2. **Caras separadas del wordmark: NO.** Los seis PNG lo tienen encima.
3. **El contorno de sticker separado: NO.** No hay ninguna capa ni grupo en ningún archivo.
4. **La nariz en vector: NO** — el único vector de nariz sigue siendo el isotipo v4 que ya está en el repo.
5. 🆕 **Aparece una especie que no estaba: un CERDO** (`Pinglog.ai.png`). No está en el catálogo de 18 ni en la letra.

---

## ④ LO QUE NO PUDE MEDIR — declarado

1. **No pude RENDERIZAR ningún `.ai` ni el PDF de diseño.** `qlmanage` se colgó (lo maté a los ~3 min), `sips` no soporta PDF y **no hay `poppler` instalado** — la herramienta de lectura de PDF lo pide. ⇒ **de los cinco `.ai` sé su estructura, no lo que dibujan**, y del PDF de 7 páginas sé sus colores y que es vector limpio, **pero no vi sus páginas**. *Instalar poppler es tocar el sistema y no lo hice sin pedirlo.*
2. **Del PDF de diseño no pude extraer el TEXTO** (las fuentes van como subset con codificación propia; el extractor devolvió vacío). Sus colores sí salieron.
3. **No verifiqué si el logo tiene el texto en trazos o como fuente viva.** Los `.svg` de `13`/`15` tienen `<text> = 0`, lo que **sugiere** trazos, pero el `<text>=0` también da cero cuando el texto es un `<image>`; y en `13`/`15` hay paths de sobra, así que **es probable pero no está probado**. Se prueba abriendo el archivo en un editor vectorial, que es del founder.
4. **No abrí `Epetplace app visual design.pdf` como diseño**: puede contener decisiones de pantalla que valga la pena contrastar con la letra. **Lo dejo señalado como lo más valioso sin leer de toda la carpeta.**
5. **No conté cuántas de las 152 piezas del handoff de julio siguen siendo útiles.** Lo di por descartado con dos mediciones (fecha y hex); *si alguien cree que hay algo ahí, el descarte es por esas dos y se puede reabrir.*
