/**
 * LA ESCALERA DE LA CARA DE UNA MASCOTA (S97-A, D-806).
 *
 * 🔴 ── LO QUE ESTE ARCHIVO **NO** ES, y hay que leerlo antes de tocarlo ─────
 * **NO es el resolvedor de URLs. Ése ya existe** en `wrappers/catalogos.ts`
 * desde S91 (`resolverUrlRaza`, `resolverUrlGenericaEspecie`,
 * `resolverUrlRutaEspecies`), consolidado ahí cuando tuvo dos pretendientes a
 * la vez. **Este archivo se apoya en él y no lo repite.**
 *
 * *El pedido que abrió esta tanda decía «el resolvedor nace en packages/api».
 * Medido: ya había nacido. **Lo que nunca subió fue la ESCALERA** — el orden
 * en que se prueban los tres escalones, que vivía suelto en una `lib/` del
 * cliente. Un typecheck lo cazó al primer intento de duplicarlo.*
 *
 * ── QUÉ ES: EL ORDEN, que es la parte que se puede equivocar ────────────────
 *   ①  la cara de SU raza          ← `resolverUrlRaza` / `…RutaEspecies`
 *   ②  el genérico de su especie   ← `resolverUrlGenericaEspecie`
 *   ③  la huella                   ← **`AvatarMascota`**, con su `onError`
 *
 * El ③ **no se reimplementa**: devolver `null` es exactamente pedirle ese
 * escalón a la pieza. Y de yapa cubre el residuo que esto no puede prever —
 * un objeto borrado del bucket daría 404 y el círculo quedaría vacío; así
 * queda la huella.
 *
 * ── POR QUÉ EL ORDEN VIVE EN UN SOLO LUGAR ──────────────────────────────────
 * **Que el Hogar y el perfil mostraran caras distintas de la misma mascota fue
 * un defecto que el founder marcó DOS VECES** (S91-D), y su causa era que la
 * regla vivía adentro de una pantalla: la cara que ilustraba el alta se
 * evaporaba al terminarla.
 * ***Una regla de presentación que solo conoce una pantalla no es un fallback
 * de la casa: es un adorno de esa pantalla.***
 *
 * ── POR QUÉ SUBE AHORA (D-806) ──────────────────────────────────────────────
 * **El PRESTADOR necesita la misma cara.** Su alta de mascota dibuja las seis
 * especies con **una sola huella genérica**, mientras el cliente ya resolvía
 * 111 imágenes a dos carpetas de distancia. *Dos apps, una escalera, **cero
 * assets nuevos**.*
 */

import {
  resolverUrlGenericaEspecie,
  resolverUrlRaza,
  resolverUrlRutaEspecies,
} from './catalogos';

/**
 * LA ESCALERA desde el SLUG (lo que tiene el perfil y el alta).
 *
 * *«Un elemento, dos trabajos»*: el mismo círculo que acompaña a la sugerencia
 * mientras elegís es el que después ocupa el lugar de la foto — **y el que
 * queda en su perfil si nunca subís una**. Por eso devuelve una URL y no un
 * componente: lo consumen tres tamaños distintos del MISMO `AvatarMascota`.
 */
export function caraDeMascota(args: {
  especie: string | null | undefined;
  razaSlug: string | null | undefined;
  /** Si ya hay foto real, GANA SIEMPRE: la galería es un mientras tanto. */
  fotoUri?: string | null | undefined;
}): string | null {
  if (args.fotoUri) return args.fotoUri;
  return (
    resolverUrlRaza(args.especie ?? null, args.razaSlug ?? null) ??
    resolverUrlGenericaEspecie(args.especie ?? null)
  );
}

/**
 * LA MISMA ESCALERA desde el PATH (lo que tiene el Hogar).
 *
 * `MascotaResumen` trae `raza_ruta_imagen` —el path resuelto por LOOKUP contra
 * `cat_razas`, **jamás slugificando texto**—. **Son dos entradas al MISMO
 * escalón**, y por eso viven las dos acá y no una en cada pantalla: *el día
 * que la escalera gane un peldaño, lo gana para las dos.*
 *
 * Orden idéntico a `caraDeMascota`, a propósito: si divergieran, volvería el
 * defecto de las dos caras.
 */
export function caraDeMascotaPorRuta(args: {
  especie: string | null | undefined;
  rutaImagen: string | null | undefined;
  fotoUri?: string | null | undefined;
}): string | null {
  if (args.fotoUri) return args.fotoUri;
  return (
    resolverUrlRutaEspecies(args.rutaImagen ?? null) ??
    resolverUrlGenericaEspecie(args.especie ?? null)
  );
}
