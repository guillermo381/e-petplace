# Inventario de los assets de marca — S116-B lote 1

> Origen: `~/Downloads/Catlog - SVG` y `~/Downloads/Catlog - PNG.ai`
> (**no** están en el escritorio y el nombre es «Catlog», no «catalog»).
> **18 archivos por carpeta**, todos los PNG de **2090×2090**.
> Nada se redibujó. Medido el 13-sep-2026.

## Lo que es cada cosa — confirmado contra el objeto

| # | qué es | wordmark | fondo | a `packages/ui` |
|---|---|---|---|---|
| 1 · 2 | **gato** | 1 sí · **2 NO** | transparente | `personajes/gato` ← **2** |
| 3 · 4 | **perro** | 3 sí · **4 NO** | transparente | `personajes/perro` ← **4** |
| 5 · 6 | **conejo** | 5 sí · **6 NO** | transparente | `personajes/conejo` ← **6** |
| 7 · 8 · 9 | **hámster** | 7 y 8 sí · **9 NO** | 9 **BLANCO OPACO** | `personajes/roedor` ← **9** |
| 10 · 11 | **ave** | **las DOS sí** | 10 transp · 11 blanco+borde violeta | `personajes/ave-CON-wordmark` ← 10 |
| 12 | **la nariz sola**, sobre claro | — | transparente | `marca/isotipo` · `personajes/otro` |
| 13 | **logo completo** sobre claro | sí | transparente | `marca/logo` |
| 14 | **la nariz sola** sobre oscuro, contorno blanco | — | **placa negra opaca** | `marca/isotipo-sobre-oscuro` |
| 15 | **logo completo** sobre oscuro | sí | placa negra | `marca/logo-sobre-oscuro` |
| 16 · 17 · 18 | marketing (muestrario · primeros 100 · sticker) | — | — | **NO** → `docs/marca/` |

**En qué difieren las dos variantes por especie: en el wordmark, y nada más.**
El par 10/11 difiere además en el fondo (transparente vs blanco con borde violeta).

## 🔴 Los dos NULL, medidos

**① La cara del AVE sin wordmark NO EXISTE y no se puede extraer.**
- Por estructura: `10.svg` tiene **0 grupos, 0 ids, 0 clipPath y 0 `<text>`** —
  es una lista plana de **1.289 `<path>`**. *No hay grupo del texto que separar.*
- Por geometría: el único hueco horizontal del dibujo está al **93,8 %** de la
  altura y separa «e-PetPlace» de su bajada, no la cara del wordmark. **Las
  patas del ave se apoyan sobre la caja del texto.**
- ⇒ queda ingerida `ave-CON-wordmark`, nombrada por lo que es. **La cara limpia
  la tiene que dar el founder**, como las otras cinco.

**② SÓLO 8 de los 18 «SVG» son vectores.** Los otros **10 son un PNG en base64
envuelto en `<svg>`** (`<image>` + 0-2 paths). Vectores reales: **7, 8, 10, 12,
13, 14, 15, 18**. ⇒ **gato, perro y conejo NO existen en vector**: su `.svg`
pesa más que su `.png` y es el mismo raster. Por eso sólo se ingiere `.svg`
donde de verdad lo hay.

## Otros hechos del objeto

- **`7.svg` y `8.svg` son BYTE-IDÉNTICOS** (mismo sha256) y sus PNG difieren en
  6.997 píxeles de 2,4 M (0,29 % — ruido de compresión). Son el mismo hámster.
- **`9.png` (roedor limpio) tiene fondo BLANCO OPACO**, no transparente. Sobre
  el lienzo rosa del cliente va a verse como un recuadro. **Se ingiere tal cual
  —no se redibuja— y se declara**: quitarle el fondo es una decisión del
  founder, no una cirugía que B haga sola.
- **`11.png` tiene fondo blanco con borde violeta.** No se ingiere.

## El ícono de la app — probado, con captura

`docs/loop/capturas-s116-b-lote1/icono-app-{48,24}px-cuatro-vias.png`

**La silueta blanca de `14` sale RECTÁNGULO**: su placa negra es opaca, así que
la silueta toma la placa y no la nariz. Con el negro removido (color plano, no
redibujo) se puede juzgar. Resultado sobre ciruela `#4E1160`:

| | 48 px | 24 px |
|---|---|---|
| **silueta blanca** | se lee la forma general, **pierde los remolinos** | ✗ **no se lee**: mancha blanca |
| **a color, contorno blanco (14 sin placa)** | ✓ nítida | ✓ se distinguen lóbulos y remolinos |
| a color sobre ciruela sin contorno (12) | el contorno negro se pierde contra la ciruela | ✗ |

⇒ **Respuesta medida: en silueta blanca NO se lee a 24 px.** Lo que se lee en
los dos tamaños es la nariz **a color con su contorno blanco**. La elección es
del founder; acá está el dato.
