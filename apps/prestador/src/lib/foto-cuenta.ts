/**
 * LA URL FIRMADA DE UNA FOTO DE `cuenta-documentos` — bucket PRIVADO.
 *
 * POR QUÉ EXISTE: la ficha del repartidor guarda **PATHs, jamás URLs**
 * (contrato del wrapper: *«una URL firmada guardada vence y la foto se
 * pierde sin error»*, S47), así que para pintarla hay que firmarla al
 * momento. La casa ya tiene dos resolvers con esta forma exacta —
 * `resolverUrlFoto` (bucket `mascotas`) y `resolverUrlDocumento`
 * (`prestador-documentos`)— y **ninguno sirve acá**: el bucket es otro y
 * el path es otro.
 *
 * ⚠️ **ESTO ES UN TERCER CLON DE LA MISMA RECETA, y lo digo en vez de
 * disimularlo.** Su lugar natural es `packages/api` junto a los otros dos,
 * como UNA función parametrizada por bucket — pero eso es territorio de A
 * y no viaja escondido adentro de una pantalla. **Queda declarado como
 * pedido**, con su número: tres copias del mismo cache TTL + firma.
 *
 * La forma es la de sus hermanos, no una nueva: cache con TTL y margen —
 * una URL que vence mientras la pantalla la usa se ve como una foto rota
 * sin ningún error en el log.
 */

import { getClient } from '@epetplace/api';

const BUCKET = 'cuenta-documentos';
const TTL_SEGUNDOS = 3600;
/** Se descarta 5 min ANTES de vencer: firmar de nuevo es barato, una foto
 *  rota en la cara del vendedor no. */
const MARGEN_MS = 5 * 60 * 1000;

const cache = new Map<string, { url: string; venceEn: number }>();

/**
 * `null` = **no se pudo firmar**, y la pantalla tiene que decirlo — jamás
 * pintar un hueco mudo. El literal va al log (el path y la causa), que es
 * lo único con lo que se diagnostica después.
 */
export async function resolverUrlFotoCuenta(path: string): Promise<string | null> {
  const hit = cache.get(path);
  if (hit && hit.venceEn > Date.now()) return hit.url;
  if (hit) cache.delete(path);

  const { data, error } = await getClient()
    .storage.from(BUCKET)
    .createSignedUrl(path, TTL_SEGUNDOS);

  if (error || !data?.signedUrl) {
    console.error('[foto-cuenta] no se pudo firmar', path, '=', error?.message ?? 'sin signedUrl');
    return null;
  }
  cache.set(path, {
    url: data.signedUrl,
    venceEn: Date.now() + TTL_SEGUNDOS * 1000 - MARGEN_MS,
  });
  return data.signedUrl;
}
