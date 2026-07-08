/**
 * capturaFoto — infraestructura COMPARTIDA de captura de imagen
 * (S45-B3.3, extraída de EvidenciaFoto: la casa no duplica, extrae).
 * Consumidores: EvidenciaFoto (evidencia) y SelectorAvatar (identidad).
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
  } catch {
    // build sin el módulo nativo: la foto original sigue siendo válida
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
