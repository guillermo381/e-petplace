/**
 * capturaFoto — infraestructura COMPARTIDA de captura de MEDIOS
 * (S45-B3.3, extraída de EvidenciaFoto: la casa no duplica, extrae).
 * Consumidores: EvidenciaFoto (evidencia), SelectorAvatar (identidad) y
 * —desde S84-B14— el CLIP de la vitrina.
 *
 * EL NOMBRE DEL ARCHIVO QUEDÓ CORTO (dice "Foto" y ya hace video), y el
 * diferimiento va con su costo MEDIDO y su condición, no con un "después":
 *
 * NO ES EL CASO DE `coach`→`ia`, aunque se parezca. Ahí la mentira estaba
 * en la SUPERFICIE QUE SE CONSUME —cada montaje escribía `nombre="coach"`
 * en algo que no era el Coach—, así que el costo de no renombrar lo pagaba
 * cada consumidor. Acá los EXPORTS ya dicen la verdad y las apps importan
 * del PAQUETE: nadie fuera de packages/ui escribe este nombre para usar la
 * pieza. La mentira solo se ve abriendo el árbol de archivos.
 *
 * COSTO REAL, medido y no estimado (S84): 3 imports + **7 menciones en
 * prosa**, y TRES de esas viven en `apps/` (carnet · perfil del cliente ·
 * verificación del prestador), que no es mi territorio. Renombrar sin
 * arrastrarlas deja prosa apuntando a un archivo que ya no existe — el
 * defecto exacto que esta casa cura cada vez que aparece.
 *
 * ☠️ CONDICIÓN: el rename viaja con la próxima tanda que YA toque esos
 * archivos de `apps/` por otra razón, para que el objeto y su prosa vayan
 * en el MISMO acto. No espera a "un tercer consumidor de video": esa
 * condición no mejora con el tiempo — el archivo solo hace más video.
 *
 * Cero módulos nativos nuevos (L-134): expo-image-picker ya instalado.
 * El recorte cuadrado usa el editor nativo del picker (allowsEditing +
 * aspect 1:1).
 *
 * RESIZE (~800px, lección v2) — costura ACTIVADA en S45-B5.4: si se
 * pide `redimensionarA`, se usa expo-image-manipulator con require
 * PEREZOSO dentro de la función (jamás import top-level): en una build
 * que no incluye el módulo nativo (la dev build de prestador anterior
 * a S45-B5.4, L-134) el require solo corre si alguien pide resize, y
 * el fallo degrada a la foto original con sus dimensiones reales —
 * nunca rompe la captura. La dev build de cliente (S45-B5.4) lo trae.
 */

import * as ImagePicker from 'expo-image-picker'

export interface FotoCapturada {
  uri: string
  width: number
  height: number
}

export type ResultadoCaptura =
  | { tipo: 'foto'; foto: FotoCapturada }
  | { tipo: 'cancelada' }
  | { tipo: 'permiso_denegado' }

export interface OpcionesCaptura {
  /** Editor nativo de recorte 1:1 (identidad: avatar). Default false. */
  recorteCuadrado?: boolean
  /** Compresión 0..1. Default 0.7 (subida móvil, patrón EvidenciaFoto). */
  calidad?: number
  /** Lado máximo en px (lección v2: ~800 para avatares). Requiere
   *  expo-image-manipulator en la build; si falta, degrada a la
   *  original sin romper. */
  redimensionarA?: number
}

const CALIDAD_DEFAULT = 0.7

// ══════════════════ VIDEO (S84-B14) ══════════════════════════════════
//
// POR QUÉ GEMELA Y NO UNA PROP `medio`, que era la otra salida: de las
// TRES opciones de `OpcionesCaptura`, DOS no significan lo mismo con
// video —y una prop que cambia de sentido según otra prop es la
// ambigüedad que la orden puso como criterio de corte:
//   · `redimensionarA` usa expo-image-manipulator: NO EXISTE para video.
//     Pasarlo sería una prop que se ignora en silencio.
//   · `recorteCuadrado` mapea a `allowsEditing + aspect 1:1`. Con video,
//     `allowsEditing` abre el RECORTADOR DE DURACIÓN y `aspect` se
//     ignora: la misma prop haría dos cosas distintas.
//   · Y el retorno cambia: un video no es un `FotoCapturada`.
// Con dos de tres opciones inválidas y el retorno distinto, la prop no
// ensancha: disfraza dos funciones de una. La gemela nace ANGOSTA —sin
// calidad, sin recorte, sin resize— porque para elegir un video ya
// hecho ninguna de las tres tiene trabajo que hacer.
//
// NO ES GRABAR EN VIVO: eso es `CameraView.recordAsync` del
// adiestramiento, que resuelve otro problema y no viaja acá.

export interface VideoCapturado {
  uri: string
  width: number
  height: number
  /** ms — **NULL HONESTO**: la plataforma puede no darlo. Ver la nota de
   *  duración en `capturarVideoDeGaleria`. */
  duracionMs: number | null
  /** bytes — NULL HONESTO. Sirve para rebotar ANTES de subir contra el
   *  techo del bucket (10 MB, de A). La frontera NO lo valida: no es
   *  suya la regla, pero sí puede entregar el dato para que exista. */
  bytes: number | null
  mimeType: string | null
}

export type ResultadoCapturaVideo =
  | { tipo: 'video'; video: VideoCapturado }
  | { tipo: 'cancelada' }
  | { tipo: 'permiso_denegado' }

/** Galería de VIDEO. Como su hermana de imagen, el picker moderno
 *  (Android Photo Picker / PHPicker) NO EXIGE PERMISO — verificado al
 *  construirla, y es lo que dejó el freno de la orden sin disparar:
 *  aceptar video no toca ni un permiso, porque en esta puerta no había
 *  ninguno que tocar. (La cámara sí pide, y la cámara no es este camino.)
 *
 *  ⚠️ LA DURACIÓN NO SE PROMETE, Y ACÁ ESTÁ EL MATIZ QUE VALE: el picker
 *  DEVUELVE `duration` cuando la plataforma la da, así que este dato
 *  llega y se expone. Lo que sigue sin poder hacerse sin el módulo de
 *  video (D-617) es GARANTIZARLA: es opcional, depende de plataforma, y
 *  un null acá no significa "dura poco" — significa "no sé". Por eso la
 *  frontera lo entrega como dato y NO como validación: el ≤30 s lo
 *  decide quien tenga una fuente que no pueda decir "no sé". */
export async function capturarVideoDeGaleria(): Promise<ResultadoCapturaVideo> {
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'] })
  const asset = r.canceled ? null : (r.assets?.[0] ?? null)
  if (asset === null) return { tipo: 'cancelada' }
  return {
    tipo: 'video',
    video: {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      duracionMs: asset.duration ?? null,
      bytes: asset.fileSize ?? null,
      mimeType: asset.mimeType ?? null,
    },
  }
}

async function redimensionar(foto: FotoCapturada, ladoMax: number, calidad: number): Promise<FotoCapturada> {
  if (foto.width <= ladoMax && foto.height <= ladoMax) return foto
  try {
    // require perezoso: solo se evalúa si alguien pide resize (ver header)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const manipulator = require('expo-image-manipulator') as typeof import('expo-image-manipulator')
    const r = await manipulator.manipulateAsync(
      foto.uri,
      [foto.width >= foto.height ? { resize: { width: ladoMax } } : { resize: { height: ladoMax } }],
      { compress: calidad, format: manipulator.SaveFormat.JPEG },
    )
    return { uri: r.uri, width: r.width, height: r.height }
  } catch (e) {
    // build sin el módulo nativo: la foto original sigue siendo válida.
    // El fallo se LOGGEA siempre (diagnóstico S45: un catch mudo acá
    // escondió la causa de un gate fallado).
    console.error(
      '[capturaFoto] resize falló, sigue la ORIGINAL',
      `${foto.width}x${foto.height}`,
      foto.uri.slice(0, 60),
      e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    )
    return foto
  }
}

async function normalizar(
  r: ImagePicker.ImagePickerResult,
  opciones: OpcionesCaptura,
): Promise<ResultadoCaptura> {
  const asset = r.canceled ? null : (r.assets?.[0] ?? null)
  if (asset === null) return { tipo: 'cancelada' }
  let foto: FotoCapturada = { uri: asset.uri, width: asset.width, height: asset.height }
  if (opciones.redimensionarA !== undefined) {
    foto = await redimensionar(foto, opciones.redimensionarA, opciones.calidad ?? CALIDAD_DEFAULT)
  }
  return { tipo: 'foto', foto }
}

/** Cámara. Pide permiso; devuelve 'permiso_denegado' en vez de romper. */
export async function capturarConCamara(opciones: OpcionesCaptura = {}): Promise<ResultadoCaptura> {
  const permiso = await ImagePicker.requestCameraPermissionsAsync()
  if (!permiso.granted) return { tipo: 'permiso_denegado' }
  const r = await ImagePicker.launchCameraAsync({
    quality: opciones.calidad ?? CALIDAD_DEFAULT,
    ...(opciones.recorteCuadrado ? { allowsEditing: true, aspect: [1, 1] as [number, number] } : null),
  })
  return normalizar(r, opciones)
}

/** Galería. El picker moderno (Android Photo Picker / PHPicker) no exige permiso. */
export async function capturarDeGaleria(opciones: OpcionesCaptura = {}): Promise<ResultadoCaptura> {
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: opciones.calidad ?? CALIDAD_DEFAULT,
    ...(opciones.recorteCuadrado ? { allowsEditing: true, aspect: [1, 1] as [number, number] } : null),
  })
  return normalizar(r, opciones)
}
