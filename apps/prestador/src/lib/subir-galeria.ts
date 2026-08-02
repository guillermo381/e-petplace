/**
 * LA GALERÍA DE LA VITRINA — el PASO 2 del consumidor de fotos (S84-C12).
 *
 * Espejo de `subir-logo.ts`, y la simetría es la que A dejó preparada al
 * extraer la frontera: **el paso 1 se comparte** (leer · formato por
 * magic numbers · techo · subir con nombre único · causa tipada) y **el
 * paso 2 es lo que distingue a los dos consumidores** — el logo escribe
 * UNA COLUMNA, la galería INSERTA UNA FILA.
 *
 * BUCKET PROPIO (`prestador-galeria`) Y NO `avatars`, con su porqué
 * medido por A: `avatars` tiene INSERT sin validar carpeta y CERO policy
 * de DELETE (D-616). La galería necesita borrar de verdad, así que nació
 * donde se puede borrar.
 *
 * ⚠️ EL ORDEN Y LA PORTADA SON EL MISMO DATO. `listarFotosGaleria`
 * devuelve ordenadas ⇒ **`[0]` ES la portada**; `reordenarFotosGaleria`
 * deja de portada a `ids[0]`. No se guarda aparte y no se pregunta: dos
 * fuentes para un solo hecho es exactamente cómo nacen los estados que
 * se contradicen (por eso la tabla tampoco tiene columna de portada, y
 * su UNIQUE hace INEXPRESABLE "dos portadas").
 *
 * FORMATOS: los de IMAGEN. El clip tiene su propio camino y su propio
 * tren (D-617) — que el bucket acepte video no le abre la puerta a la
 * galería de fotos, igual que el techo de la galería no le abre nada al
 * logo. Cada consumidor declara su whitelist.
 */

import { getClient } from '@epetplace/api';

import { subirArchivo, borrarBytes, type CausaSubida } from './subir-imagen';

const BUCKET = 'prestador-galeria';
/** El techo del bucket (A, S84): 10 MB. Se declara acá porque el rebote
 *  tiene que decirse ANTES del round-trip, con voz honesta. */
const MAX_BYTES = 10 * 1024 * 1024;
/** Fotos, no video. El JPEG entra (una foto del espacio es JPEG de
 *  nacimiento) y el PNG también; el alpha acá no importa como en el logo
 *  —una foto de un patio no tiene fondo que quitar— pero tampoco molesta. */
const FORMATOS = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type CausaSubidaFoto = CausaSubida;

/**
 * Resuelve la URL pública de una foto de la galería.
 *
 * ⚠️ VIVE ACÁ Y DEBERÍA VIVIR EN `packages/api`, al lado de su gemela
 * `resolverUrlLogoNegocio` (que hace exactamente esto para `avatars`).
 * No lo muevo yo porque ese paquete es de A y una línea suelta en
 * territorio ajeno es cómo empiezan las divergencias.
 * ☠️ MUERTE: pedido a A — `resolverUrlFotoGaleria` en
 * `wrappers/prestador.ts`, una línea al lado de la del logo. El día que
 * exista, esta función se borra y los consumidores cambian el import.
 */
export function resolverUrlFotoGaleria(path: string): string {
  return getClient().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** El paso 1 (frontera compartida). El paso 2 —insertar la fila— lo hace
 *  la pantalla con `agregarFotoGaleria`, porque es el que necesita el
 *  `prestadorId` y el que decide qué hacer si la fila falla. */
export async function subirFotoGaleria(input: { uri: string; storagePath?: string }) {
  return subirArchivo({
    uri: input.uri,
    bucket: BUCKET,
    prefijo: 'galeria',
    maxBytes: MAX_BYTES,
    formatosPermitidos: FORMATOS,
    storagePath: input.storagePath,
    etiqueta: 'subir-galeria',
  });
}

/** Borra los BYTES de una foto ya borrada de la tabla.
 *
 *  EL ORDEN ES FILA PRIMERO, BYTES DESPUÉS, y es de A: si fallan los
 *  bytes queda un huérfano invisible —feo pero inofensivo—; al revés
 *  quedaría una FILA apuntando a un archivo que no existe, y eso sí se
 *  ve, porque la vitrina intentaría pintarlo. */
export async function borrarBytesFotoGaleria(path: string) {
  return borrarBytes(BUCKET, [path]);
}
