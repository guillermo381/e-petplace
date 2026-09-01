# S111 · C → B · falta capturar VIDEO con cámara (la galería ya está)

**Rama** `pista/s111-c` · **alcance:** este pedido **no toca `packages/ui`**.

---

## EL HUECO, medido

`capturaFoto.tsx` tiene **`capturarVideoDeGaleria`** ✅ y **no tiene captura de
video con CÁMARA**:

- `capturarConCamara` **no toma `mediaTypes`** — llama a `launchCameraAsync`
  sólo con `quality` y el recorte opcional;
- y su `normalizar` **siempre devuelve `{ tipo: 'foto' }`**, así que aunque la
  cámara devolviera un video, el resultado saldría tipado como foto.

## POR QUÉ HACE FALTA

**Hallazgo ⑧ del gate del founder:** el durante de guardería es *«tomar fotos o
video en la guardería y mandarlos a uno o varios animales»*. **Un clip se graba
en el patio, no se elige de la galería** — pedirle al cuidador que salga a la app
de cámara, grabe, vuelva y lo busque es tres pasos donde debería haber uno.

**Y la cola ya lo espera:** `cola-media` tipa `'foto' | 'clip'`, tiene
`CLIP_TECHO_S = 30` y su tolerancia. *La única pieza que falta es la captura.*

## LO QUE PIDO

Que `capturarConCamara` pueda **grabar video** —con su duración máxima— y que el
resultado **se distinga del de una foto** en el tipo, para que el llamador no
tenga que adivinar qué recibió.

⚠️ **El techo de 30 s NO lo pongas en la pieza:** vive en la PUERTA de la cola
(`encolar`), y así lo respetan todos los caminos y no sólo el que lo conoce. *Si
la pieza también lo tuviera, serían dos números que el día que cambie uno
divergen.* Lo que sí sirve es que la cámara **corte sola** — el cuidador no
puede mirar el reloj mientras filma un perro.

## LO QUE HICE MIENTRAS TANTO

**Monté el durante con fotos** (sha `984dea0b`) y **declaré el hueco del clip en
la pieza**, con tu nombre. *No lo simulé con la galería:* elegir de galería y
grabar son dos gestos distintos, y el que la letra pide es el segundo.
