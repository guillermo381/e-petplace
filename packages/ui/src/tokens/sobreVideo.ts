/**
 * e-PetPlace — Design Tokens · LA CLASE «CONTROL SOBRE VIDEO» (S106-B, OBRA 1)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **UN VIDEO EN VIVO ES FONDO NO CONTROLADO. El fondo lo pone la cámara de
 * otra persona: no lo elegimos, no lo calibramos, y CAMBIA mientras la
 * llamada ocurre.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 ESTA CLASE NO SE INVENTA — SE NOMBRA, igual que la marca de mapa ────
 * `DIRECCION_ARTE` **§6ter** ya resolvió exactamente esta física para su caso
 * y **ya nombró el nuestro al descartar la salida fácil**:
 *
 * > *«La otra salida era ensanchar la Ley 12 para admitir relleno **sobre
 * > fondo no-controlado**. Se descartó porque esa condición no está acotada:
 * > toda foto, todo gradiente y **todo póster de video** es fondo no
 * > controlado. **Una regla que no puede decir dónde termina no es una
 * > regla.**»*
 *
 * ⇒ **NO se enmienda la Ley 12.** Nace la clase, acotada como se acotó la de
 * mapa: *«la clase se acota sola, y por construcción: vive en UNA pieza, y
 * las piezas se cuentan»*. Acá vive en **este archivo**, y todo control de las
 * dos pantallas lo consume. *Si cada pantalla se pinta su propio scrim, en dos
 * meses hay dos scrims y nadie sabe cuál es el bueno.*
 *
 * ── LA FÍSICA: DOS CANALES QUE SE TURNAN ──────────────────────────────────
 * El problema real, medido: **un disco oscuro se separa sobre fondo claro y
 * DESAPARECE sobre fondo negro.** Y al revés con uno claro. Ningún color único
 * resuelve los dos extremos.
 *
 * **La solución no es elegir mejor el color: es usar DOS canales.**
 * · **`disco`** (masa oscura) separa el control cuando el video es CLARO.
 * · **`anillo`** (borde claro) separa el control cuando el video es OSCURO.
 * **En cualquier fondo, al menos uno de los dos está haciendo el trabajo.**
 *
 * *Es el mismo movimiento que la casa ya hizo con el halo direccional (S82):
 * «cuando un canal se agota, no se insiste con más dosis — se cambia de
 * canal». Acá no se cambia: se lleva a los dos puestos.*
 *
 * ── LOS NÚMEROS, MEDIDOS Y NO ELEGIDOS ─────────────────────────────────────
 * Compuestos contra los DOS extremos (blanco puro y negro puro), con la
 * fórmula WCAG sobre el color resultante — verificados por
 * `scripts/verify-contrast.ts`, jamás a ojo:
 *
 * | par | sobre video BLANCO | sobre video NEGRO |
 * |---|---|---|
 * | contenido (papel) / disco | **5.61** | **19.58** |
 * | texto / banda             | **8.27** | **19.47** |
 * | glifo / colgar            | **5.92** | **5.92** |
 * | **disco** / video         | **5.90** ✅ separa | — lo cubre el anillo |
 * | **anillo** / video        | — lo cubre el disco | **4.11** ✅ separa |
 *
 * **En cada extremo hay un canal que pasa el piso gráfico de 3:1.** *Lo que
 * sería un defecto es que los dos fallaran en el mismo extremo.*
 *
 * ── 🔴 EL ALPHA DEL ANILLO SALIÓ DE UNA MEDICIÓN, Y CORRIGIÓ A SU AUTOR ────
 * Esta cabecera decía **0.30 ⇒ «~6.8»**. **Corrido el gate: 2.40 — REPROBADO.**
 * El error fue calcular la luminancia en LINEAL en vez de sRGB, que da números
 * cómodos y falsos. Resuelto hacia atrás desde el piso: **0.36 da exactamente
 * 3.04**, así que se toma **0.44 (4.11)** para no vivir pegado al límite.
 *
 * *Es L-425 sobre su propia autora, por segunda vez en esta sesión: un número
 * plausible escrito en una cabecera se lee como medido. **Los pares se
 * verifican, no se estiman** — y por eso los seis viven en
 * `verify-contrast.ts` y no en este comentario.*
 *
 * ── LO QUE ESTA CLASE **NO** ES ────────────────────────────────────────────
 * · **No es un tema.** No se agrega a `themes/`: el video no tiene modo claro
 *   ni oscuro — tiene la luz que haya en la casa del otro.
 * · **No es `elevacion`.** Aquélla separa superficies de un fondo QUE NOSOTROS
 *   PINTAMOS; ésta pelea contra un fondo que no controlamos.
 * · **No habilita relleno libre.** Es para CONTROLES sobre video, y nada más.
 */

import { palette } from './palette'

export const sobreVideo = {
  /** Masa del control. Separa cuando el video es CLARO. */
  disco: 'rgba(5,5,8,0.62)',

  /** Anillo de separación. Separa cuando el video es OSCURO (§6ter: «anillo
   *  de separación, porque el fondo es impredecible»). */
  anillo: 'rgba(250,249,247,0.44)',
  anilloAncho: 1,

  /** El contenido del control: papel PLENO, jamás un gris. Sobre el disco
   *  rinde 5.6 en el peor extremo — y un gris ahí perdería el piso. */
  contenido: palette.light0,

  /** Banda de texto sobre el video (estado «reconectando», nombre). Más opaca
   *  que el disco: la prosa necesita más piso que un glifo. */
  banda: 'rgba(5,5,8,0.72)',

  /** Degradado superior/inferior para que el chrome no flote sobre la nada.
   *  Se usa con `expo-linear-gradient` (ya es peer). */
  velo: ['rgba(5,5,8,0.55)', 'rgba(5,5,8,0)'] as const,

  /** El destructivo sobre video. **NO es el `danger` del tema**: aquél está
   *  calibrado contra papel o contra el fondo oscuro de la casa, y acá el
   *  fondo es de otro. Es masa plena, que es lo único que sobrevive a los dos
   *  extremos — y colgar es el único control que JAMÁS se esconde. */
  colgar: '#C1121F',
  colgarContenido: palette.light0,

  /** 🔴 EL PUNTO DE ESTADO DE CONEXIÓN — de la CLASE, no del tema.
   *
   *  R41/R12 tienen razón y por eso no se usa `theme.status.*`: **el ámbar de
   *  la casa vive como TINTE con su texto AA**, y rellenarlo colapsa contra el
   *  CTA de oro (están a ~4°). Acá el punto es **GRÁFICA sobre fondo no
   *  controlado**: no puede ser un tinte —no hay superficie de la casa debajo—
   *  y tampoco puede pedirle el color a un tema que no gobierna este fondo.
   *  Van con el anillo de la clase, que es lo que los separa sobre video claro. */
  estadoBueno: '#1E7A33',
  estadoAtencion: '#B26A00',

  /** LOS DOS EXTREMOS contra los que se mide esta clase. Viven acá **porque son
   *  la VARA, no una decoración**: `verify-contrast.ts` los usa como superficie
   *  y la galería los usa como fondo de referencia. *Un extremo escrito a mano
   *  en cada lugar deja de ser el mismo extremo.* */
  extremoClaro: '#FFFFFF',
  extremoOscuro: '#000000',
} as const

export type SobreVideo = typeof sobreVideo
