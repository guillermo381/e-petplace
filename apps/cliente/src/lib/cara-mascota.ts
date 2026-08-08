/**
 * S91-D · LA CARA DE UNA MASCOTA — la galería mientras no hay foto propia.
 *
 * ⚠️ VIVE EN `lib/` Y NO EN `components/alta/` DESDE EL GATE DEL FOUNDER: el
 * PERFIL la necesita igual. Su observación fue exacta —«la foto del chip no
 * viaja al perfil»— y la causa era ésta: la regla del fallback vivía adentro
 * del alta, así que la cara que ilustraba el alta se evaporaba al terminarla.
 * Una regla de presentación que solo conoce una pantalla no es un fallback de
 * la casa: es un adorno de esa pantalla.
 *
 * Bucket `especies-razas`, PÚBLICO, sembrado en S90-C: 111 objetos
 * (105 razas + 6 genéricos), origen-IA firmado, ficha D-288.
 *
 * ── LOS TRES ESCALONES DEL FALLBACK, y quién pone cada uno ──────────────────
 *   ①  `<especie>/<slug>.webp`     ← acá, con el slug que la sugerencia eligió
 *   ②  `<especie>/generico.webp`   ← acá, cuando hay especie pero no slug
 *   ③  la huella genérica          ← **YA LO PONE `AvatarMascota`**
 *
 * El ③ NO se reimplementa: `AvatarMascota` tiene `falloCarga` con `onError`
 * (línea 233 y 261 de su fuente) y cae a `HuellaGenerica` sola. Devolver
 * `undefined` acá es exactamente pedirle ese escalón — y de yapa cubre el
 * residuo que este archivo no puede prever (un objeto borrado del bucket
 * daría 404 y el círculo quedaría vacío; con esto queda la huella).
 *
 * ── POR QUÉ EL ② EXISTE Y NO SE ADIVINA EL SLUG ─────────────────────────────
 * Cuando alguien ESCRIBE la raza en vez de elegirla de la lista, no hay slug.
 * La tentación es slugificar el texto y probar suerte. **No se hace:**
 * «Pastor Alemán» tipeado a mano puede dar `pastor-aleman` (que existe) o
 * `pastor-alemán`, `pastor aleman`, `ovejero-aleman` (que no) — y una URL
 * que acierta a veces produce una cara equivocada, que es peor que ninguna.
 * Sin slug elegido, el genérico de la especie es la verdad disponible.
 *
 * ⚠️ PUENTE DECLARADO — ESTE ARCHIVO ESTÁ DE PASO.
 * La casa resuelve URLs de bucket público en `packages/api`
 * (`resolverUrlLogoPrestador` / `resolverUrlGaleriaPrestador`,
 * `wrappers/prestador.ts:500,526`), que es territorio de A. D pidió su gemela
 * (`resolverUrlRaza`) en el pedido de esta sesión. **Cuando exista, el cuerpo
 * de las dos funciones de acá se reemplaza por un re-export y nada más
 * cambia** — los llamadores ya hablan en (especie, slug), no en URLs.
 * Se construye así y no se espera porque el paso 2 y el paso 4 no tienen otra
 * cosa que mostrar, y la deuda es de UNA línea.
 */

const BUCKET = 'especies-razas';

function base(): string | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (typeof url !== 'string' || url.length === 0) return null;
  return `${url.replace(/\/+$/, '')}/storage/v1/object/public/${BUCKET}`;
}

/** Escalón ① — la cara de SU raza. `slug` es el del catálogo (D-379), jamás
 *  uno derivado del texto tipeado. */
export function urlDeRaza(especie: string | undefined, slug: string | undefined): string | undefined {
  const b = base();
  if (b === null || !especie || !slug) return undefined;
  return `${b}/${especie}/${slug}.webp`;
}

/**
 * La misma cara, pero desde el PATH que el catálogo ya trae
 * (`cat_razas.ruta_imagen`, p. ej. `'perro/akita-inu.webp'`).
 *
 * Se prefiere sobre `urlDeRaza` cuando la fila del catálogo está a mano: ahí
 * el path es un DATO, no una convención re-armada de dos pedazos. Si mañana
 * una raza tuviera su imagen en otro lado, esta función la encuentra y la
 * otra no.
 */
export function urlDeRutaGaleria(ruta: string | undefined): string | undefined {
  const b = base();
  if (b === null || !ruta) return undefined;
  return `${b}/${ruta}`;
}

/** Escalón ② — la cara de su especie.
 *
 *  ⚠️ Medido por A al sembrar: las SEIS especies que el alta ofrece tienen su
 *  `generico.webp`; **`reptil` no lo tiene** (404 verificado) y por eso cae
 *  al escalón ③. Reptil no se ofrece en la grilla — pero ver el hallazgo del
 *  pedido a A: hoy eso es filtro de pantalla, no apagado estructural. */
export function urlGenericaDeEspecie(especie: string | undefined): string | undefined {
  const b = base();
  if (b === null || !especie) return undefined;
  return `${b}/${especie}/generico.webp`;
}

/**
 * LA RESOLUCIÓN COMPLETA — un solo lugar donde se decide qué cara se muestra.
 *
 * «Un elemento, dos trabajos» (lámina §paso 2): el mismo círculo que
 * acompaña a la sugerencia mientras elegís es el que después ocupa el lugar
 * de la foto — **y el que queda en su perfil si nunca subís una**. Por eso
 * devuelve una URL y no un componente: lo consumen tres tamaños distintos del
 * MISMO `AvatarMascota`.
 */
export function caraDeMascota(args: {
  especie: string | undefined;
  razaSlug: string | undefined;
  /** Si ya hay foto real, gana siempre: la galería es un mientras tanto. */
  fotoUri?: string | undefined;
}): string | undefined {
  if (args.fotoUri) return args.fotoUri;
  return urlDeRaza(args.especie, args.razaSlug) ?? urlGenericaDeEspecie(args.especie);
}
