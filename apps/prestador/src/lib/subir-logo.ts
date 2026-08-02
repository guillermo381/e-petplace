/**
 * Subida del LOGO del negocio (S76-B1, D-505 — la firma gana productor).
 *
 * ⚠️ S84-A5 — **PASÓ A SER CONSUMIDOR DE LA FRONTERA** (`subir-imagen.ts`).
 * El paso 1 (leer · formato por magic numbers · techo · subir con nombre
 * único · causa tipada) vive ahora en un solo lugar y lo comparte con la
 * galería. **El paso 2 sigue siendo suyo**, y es lo que lo distingue: el
 * logo escribe UNA COLUMNA (`actualizarPerfilPrestador({foto_url})`); la
 * galería inserta una fila.
 *
 * **LO QUE NO CAMBIÓ — el freno de la orden era el logo, y se honra
 * literal:** mismo bucket (`avatars`), mismo techo (5 MB), **PNG-only**,
 * mismo patrón de path (`<uid>/logo-negocio-<ts>.png`), mismas causas
 * tipadas hacia la pantalla y mismo huérfano recuperable. Los formatos y
 * el techo viajan como PARÁMETRO: que el bucket de la galería acepte
 * video **no le abre nada al logo**.
 *
 * Bucket RELEVADO contra DB viva (S76-B): `avatars` — PÚBLICO (el logo es
 * identidad PÚBLICA del negocio: lo ve el invitado en /invitacion y el pet
 * parent en toda firma; una URL firmada efímera acá sería fricción sin
 * secreto que proteger).
 * ⚠️ Ese bucket tiene **INSERT sin validar carpeta y CERO policy de
 * DELETE** — medido en S84-A2, ficha **D-616**. Por eso la galería NO
 * nació ahí: nació en `prestador-galeria`, que sí valida y sí borra.
 *
 * El registro escribe por `user_id`, así que el logo es del TITULAR
 * (coherente con D-513: la gestión de negocio hoy es titular-only).
 */

import { actualizarPerfilPrestador } from '@epetplace/api';
import { subirArchivo, type CausaSubida } from './subir-imagen';

const BUCKET = 'avatars';
// Pre-check local (la galería viaja SIN resize para preservar alpha —
// freno de mesa S76-B): un original enorme sube lento (S45 midió 5MB =
// 44s); el techo se dice ANTES del round-trip, con voz honesta.
const MAX_BYTES = 5 * 1024 * 1024;

/* ④ S83-C34 — SOLO PNG, y el porqué es del founder: *"poder quitar el
   fondo"*. Un logo con fondo opaco es un rectángulo pegado sobre el muro
   del oficio — exactamente lo caricaturesco que DIRECCION_ARTE §7
   rechaza. El JPEG **no puede** llevar transparencia: no es que la pierda
   al comprimir, es que el formato no la tiene. Por eso el rebote es de
   FORMATO y no de calidad.

   ⚠️ EL SVG NO ENTRA, Y SE MIDIÓ ANTES DE PROMETERLO: `LogoNegocio` pinta
   con `expo-image`, que rasteriza mapas de bits — un SVG subido se
   guardaría bien y se vería ROTO al pintar. Aceptarlo sería mover el
   fallo del momento de subir al momento de mirar, que es peor.

   El WEBP TAMBIÉN lleva alpha y aun así queda afuera: la orden dice PNG,
   y una excepción que el founder no firmó no se cuela por ser
   técnicamente defendible. */
const FORMATOS = ['image/png'] as const;

/** Se conserva el nombre histórico de la causa (`formato_no_png`) porque
 *  es el que la pantalla ya consume: **la extracción no le cambia el
 *  contrato a ningún llamador.** */
export type CausaSubidaLogo = Exclude<CausaSubida, 'formato_no_permitido'> | 'formato_no_png';

export type ResultadoSubidaLogo =
  | { ok: true; path: string }
  | { ok: false; causa: CausaSubidaLogo; mensaje: string; storagePath?: string };

export async function subirLogoNegocio(input: {
  uri: string;
  /** reintento post-subida: salta el paso 1. */
  storagePath?: string;
}): Promise<ResultadoSubidaLogo> {
  const r = await subirArchivo({
    uri: input.uri,
    bucket: BUCKET,
    prefijo: 'logo-negocio',
    maxBytes: MAX_BYTES,
    formatosPermitidos: FORMATOS,
    storagePath: input.storagePath,
    etiqueta: 'subir-logo',
  });

  if (!r.ok) {
    // La voz del formato es DEL LOGO, no de la frontera: solo acá se sabe
    // que lo que se pedía era PNG, y por qué.
    if (r.causa === 'formato_no_permitido') {
      return { ok: false, causa: 'formato_no_png', mensaje: 'El logo tiene que ser PNG.' };
    }
    if (r.causa === 'archivo_grande') {
      return { ok: false, causa: 'archivo_grande', mensaje: 'El logo supera el máximo de 5MB.' };
    }
    return { ok: false, causa: r.causa, mensaje: r.mensaje, storagePath: r.storagePath };
  }

  // PASO 2 — el que NO se comparte: el logo es una columna.
  const reg = await actualizarPerfilPrestador({ foto_url: r.path });
  if (!reg.ok) {
    console.error(`[subir-logo] REGISTRO falló · ${reg.mensaje}`);
    return { ok: false, storagePath: r.path, causa: 'servidor', mensaje: reg.mensaje };
  }
  return { ok: true, path: r.path };
}

/** Quitar el logo = foto_url a NULL honesto ('' pasa por aNull del
 *  wrapper). El objeto viejo queda en el bucket (huérfano conocido,
 *  clase D-303 — jamás se borra identidad por las dudas).
 *
 *  ⚠️ **Acá NO se llama a `borrarBytes`, y la asimetría con la galería es
 *  deliberada:** `avatars` **no tiene policy de DELETE** (D-616), así que
 *  el borrado fallaría igual; y aunque la tuviera, el logo es IDENTIDAD y
 *  la casa decidió no borrarla. La galería sí borra porque su bucket
 *  nació con la policy **y** porque una foto que el usuario quitó de su
 *  vitrina no es identidad: es material que él sacó. */
export async function quitarLogoNegocio(): Promise<{ ok: boolean; mensaje?: string }> {
  const r = await actualizarPerfilPrestador({ foto_url: '' });
  if (!r.ok) {
    console.error(`[subir-logo] QUITAR falló · ${r.mensaje}`);
    return { ok: false, mensaje: r.mensaje };
  }
  return { ok: true };
}
