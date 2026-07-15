/**
 * leer-archivo — LA frontera única de lectura de archivos locales
 * (S47-B1.2, gate B3 fallido). Ningún caller vuelve a tocar `new File()`
 * directo: la cura L-137 vive ACÁ y no se puede saltear.
 *
 * L-137 + hipótesis (d) del gate B3: en Expo Go el directorio del
 * proyecto contiene % LITERALES (`%40scope%2Fapp`) y TODA API de FS
 * decodifica %XX → la cura clásica re-codifica (`%`→`%25`). PERO la
 * cura no es idempotente: si un módulo entrega el uri YA codificado,
 * curarlo lo sobre-codifica → path fantasma → "Missing 'READ'
 * permission" CON la cura puesta (el literal del gate B3).
 *
 * Solución robusta a AMBAS formas: intentar primero la forma curada
 * (el caso medido en S45) y, si la lectura es rechazada, reintentar
 * con la forma CRUDA. Cuál forma leyó queda SIEMPRE en el log
 * (forense permanente); si fallan las dos, la excepción lleva ambos
 * literales. En dev build no hay '%': ambas formas son idénticas y
 * todo es no-op.
 */

import { Platform } from 'react-native';
import { File } from 'expo-file-system';

/** Cura L-137 clásica: re-encodear '%' para que la decodificación del
 *  FS devuelva el literal. NO es idempotente — por eso el dual-forma. */
export function uriLegible(uri: string): string {
  return uri.replace(/%/g, '%25');
}

async function leerNativo<T>(uri: string, lector: (f: File) => Promise<T>): Promise<T> {
  const curada = uriLegible(uri);
  try {
    const r = await lector(new File(curada));
    if (curada !== uri) console.log('[leer-archivo] leyó forma CURADA (uri traía % literales)');
    return r;
  } catch (eCurada) {
    if (curada === uri) throw eCurada; // sin '%': no hay segunda forma
    try {
      const r = await lector(new File(uri));
      console.log('[leer-archivo] leyó forma CRUDA (uri venía pre-codificado — hipótesis d, gate B3)');
      return r;
    } catch (eCruda) {
      const lit = (e: unknown) => (e instanceof Error ? `${e.name}: ${e.message}` : String(e));
      console.error('[leer-archivo] AMBAS formas fallaron · curada=', lit(eCurada), '· cruda=', lit(eCruda));
      throw eCruda;
    }
  }
}

export async function leerBytes(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    const r = await fetch(uri);
    return await r.arrayBuffer();
  }
  const bytes = await leerNativo(uri, (f) => f.bytes());
  return bytes.buffer as ArrayBuffer;
}

/** Base64 puro (sin prefijo data:) — insumo de extract-vacuna. */
export async function leerBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const r = await fetch(uri);
    const blob = await r.blob();
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result).split(',')[1] ?? '');
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  }
  return await leerNativo(uri, (f) => f.base64());
}
