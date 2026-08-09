/**
 * LA URL DE UNA FOTO DE GALERÍA — en UN solo lugar (S91-C).
 *
 * ── POR QUÉ SE EXTRAJO, con el defecto que lo pagó ──────────────────────
 * `obtenerPerfilesPublicos` devuelve `portadas` como **PATHS del bucket**,
 * no como URLs. `/prestador/[id]` los resolvía; **el preview de la fila NO
 * — pasaba el path crudo a `<Image>`**. Resultado: la tarjeta reservaba el
 * alto de una foto y quedaba en blanco. El founder lo vio como «la portada
 * no carga en la lista», y tenía razón: la lista pedía una imagen a una
 * ruta que no era una URL.
 *
 * Dos pantallas resolviendo el mismo path es exactamente cómo divergen —
 * la misma razón por la que `voz-oficio` y `cara-mascota` viven una vez.
 *
 * El bucket es el MISMO que resuelve el espejo del prestador
 * (`lib/subir-galeria`): la pieza no toca storage, recibe URLs listas.
 */

import { getClient } from '@epetplace/api';

const BUCKET_GALERIA = 'prestador-galeria';

/** Path del bucket → URL pública. `null`/vacío devuelve `null`: una URL
 *  inventada sobre un path ausente es una imagen que nunca llega, que es
 *  justo el defecto que este archivo cura. */
export function urlGaleria(path: string | null | undefined): string | null {
  if (typeof path !== 'string' || path.length === 0) return null;
  return getClient().storage.from(BUCKET_GALERIA).getPublicUrl(path).data.publicUrl;
}
