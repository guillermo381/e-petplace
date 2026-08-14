/**
 * S91-D · LA CARA DE UNA MASCOTA — **EL PUENTE, ya cobrado (S97-A, D-806).**
 *
 * ── ESTE ARCHIVO CUMPLIÓ LO QUE PROMETIÓ ────────────────────────────────────
 * Nació declarándose de paso, con estas palabras exactas:
 *
 *   *"La casa resuelve URLs de bucket público en `packages/api`… D pidió su
 *    gemela (`resolverUrlRaza`). **Cuando exista, el cuerpo de las dos
 *    funciones de acá se reemplaza por un re-export y nada más cambia** — los
 *    llamadores ya hablan en (especie, slug), no en URLs."*
 *
 * **Existe.** El resolvedor vive en `packages/api/src/wrappers/caraMascota.ts`
 * con la escalera entera (raza → genérico de especie → huella de la pieza), su
 * regla de no-adivinar-el-slug y el hallazgo del `reptil` sin genérico.
 * **Los diez y pico de consumidores de este archivo no cambiaron una línea.**
 *
 * ── POR QUÉ SUBIÓ, y no fue prolijidad ──────────────────────────────────────
 * **El PRESTADOR necesita la misma cara.** Su alta de mascota dibujaba las seis
 * especies con **una sola huella genérica** (D-806) mientras acá, a dos
 * carpetas de distancia, ya había 111 imágenes resolviéndose bien.
 * *Dos apps, un resolvedor, **cero assets nuevos**.*
 *
 * ── LA ÚNICA COSTURA, y por qué el puente sigue existiendo ──────────────────
 * La casa devuelve `string | null` (convención de `resolverUrlGaleriaPrestador`
 * y sus gemelas: *null entra, null sale*). Estas funciones prometieron
 * `string | undefined`, que es lo que `AvatarMascota` recibe.
 * **El puente adapta y nada más.** Borrarlo obligaría a tocar todos los
 * consumidores para ganar exactamente cero — *y "nada más cambia" era la
 * promesa, no una aspiración.*
 *
 * ── UNA CORRECCIÓN DE PASO, medida al subir (S97-A) ─────────────────────────
 * La versión anterior de este archivo afirmaba que reptil *"no se ofrece en la
 * grilla, pero eso es filtro de PANTALLA, no apagado estructural"*, mientras
 * `catalogos.ts` afirmaba lo contrario. **Medido: `cat_especies.activo = false`
 * para `reptil` ⇒ está apagado ESTRUCTURALMENTE.** Gana `catalogos.ts`; esta
 * frase estaba vieja.
 * *Dos comentarios vivos que se contradicen sobre el mismo hecho son la
 * versión en prosa del defecto que D-805 pagó en código: quien lea primero se
 * lleva la versión equivocada, y ningún instrumento mira comentarios.*
 */

import {
  caraDeMascota as caraDeMascotaApi,
  caraDeMascotaPorRuta as caraDeMascotaPorRutaApi,
  resolverUrlGenericaEspecie,
  resolverUrlRaza,
  resolverUrlRutaEspecies,
} from '@epetplace/api';

/** `null` de la casa → `undefined` del consumidor. La única traducción. */
const aUndefined = (v: string | null): string | undefined => v ?? undefined;

/** Escalón ① — la cara de SU raza. */
export function urlDeRaza(especie: string | undefined, slug: string | undefined): string | undefined {
  return aUndefined(resolverUrlRaza(especie ?? null, slug ?? null));
}

/** Escalón ① desde el PATH del catálogo (`cat_razas.ruta_imagen`). */
export function urlDeRutaGaleria(ruta: string | undefined): string | undefined {
  return aUndefined(resolverUrlRutaEspecies(ruta ?? null));
}

/** Escalón ② — la cara de su especie. */
export function urlGenericaDeEspecie(especie: string | undefined): string | undefined {
  return aUndefined(resolverUrlGenericaEspecie(especie ?? null));
}

/** La escalera completa, desde el slug. */
export function caraDeMascota(args: {
  especie: string | undefined;
  razaSlug: string | undefined;
  fotoUri?: string | undefined;
}): string | undefined {
  return aUndefined(caraDeMascotaApi(args));
}

/** La escalera completa, desde el path. */
export function caraDeMascotaPorRuta(args: {
  especie: string | undefined;
  rutaImagen: string | null | undefined;
  fotoUri?: string | undefined;
}): string | undefined {
  return aUndefined(caraDeMascotaPorRutaApi(args));
}
