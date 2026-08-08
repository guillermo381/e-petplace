/**
 * S91-D · EL ALTA DE MASCOTA — la forma del borrador y las dos entradas.
 *
 * ── QUÉ MATA ESTE ARCHIVO ───────────────────────────────────────────────────
 * Hasta S90 el alta eran OCHO archivos: cuatro pantallas del onboarding y sus
 * cuatro calcos en `/hogar/agregar`, divergiendo 42·27·24·50 líneas (medido).
 * La divergencia NO era de producto — eran rutas, nombres de función, el
 * namespace de voz y la RPC del cierre. Es el caso exacto de §6 del método:
 * **se comparte la FORMA; acá ni siquiera la voz difiere, porque es la misma
 * casa preguntándole lo mismo a la misma persona.**
 *
 * ⇒ UNA pieza, DOS entradas. Lo único que el modo decide está en `MODO`.
 *
 * ── EL BORRADOR VIAJA POR PARAMS, y no es herencia perezosa ─────────────────
 * Los dos flujos viejos ya declaraban «URL-reconstruible: avanza por params».
 * Se conserva a propósito: cada paso es alcanzable solo, el back de Android
 * funciona sin estado global, y un alta interrumpida no deja un store colgado.
 */

import type { AvatarMascotaEspecie } from '@epetplace/ui';

/** Los cuatro pasos de la lámina + el cierre (que no es un paso: es el acto). */
export const PASOS = ['especie', 'raza', 'historia', 'foto', 'cierre'] as const;
export type Paso = (typeof PASOS)[number];

export function esPaso(v: unknown): v is Paso {
  return typeof v === 'string' && (PASOS as readonly string[]).includes(v);
}

/** Las dos entradas. `primera` crea la familia; `adicional` la deriva. */
export type ModoAlta = 'primera' | 'adicional';

/** ⚠️ `rutaPaso` va como LITERAL y no como `${base}/[paso]`: el cliente tiene
 *  `experiments.typedRoutes` encendido (app.json:52) y una plantilla se
 *  ensancha a `string`, que es justo lo que las rutas tipadas existen para no
 *  aceptar. Un typo acá volvería a ser un error de runtime. */
export const MODO: Record<
  ModoAlta,
  { rutaPaso: '/onboarding/[paso]' | '/hogar/agregar/[paso]'; salida: '/hogar' }
> = {
  primera: { rutaPaso: '/onboarding/[paso]', salida: '/hogar' },
  adicional: { rutaPaso: '/hogar/agregar/[paso]', salida: '/hogar' },
};

/** El único lugar donde vive «cuál es el paso siguiente». */
export function siguiente(paso: Paso): Paso | null {
  const i = PASOS.indexOf(paso);
  return i >= 0 && i < PASOS.length - 1 ? PASOS[i + 1] : null;
}

/**
 * Los SEIS campos de la lámina, más lo que la foto arrastra.
 * Todo `string` porque todo viaja por params — la traducción a los tipos de
 * la RPC ocurre en un solo lugar (`PasoCierre`), no en cada pantalla.
 */
export interface BorradorAlta {
  /** paso 1 */
  nombre?: string;
  especie?: string;
  /** paso 2 — el TEXTO que se guarda (libre: el catálogo sugiere, el dueño
   *  confirma). `razaSlug` es solo para resolver la imagen; puede faltar
   *  aunque haya raza, y eso es correcto. */
  raza?: string;
  razaSlug?: string;
  /** paso 3 */
  fecha?: string;
  precision?: string;
  sexo?: string;
  origen?: string;
  /** paso 4 */
  fotoUri?: string;
  /** '1' si el paso 4 declaró que HABÍA foto.
   *
   *  ── POR QUÉ EXISTE UNA MARCA ADEMÁS DE LA URI ──────────────────────────
   *  `fotoUri` es una ruta larga y con caracteres que el viaje por params
   *  codifica y decodifica (en Expo Go trae `%40`/`%2F` LITERALES — L-137).
   *  Si esa vuelta la rompe, el cierre no recibe nada… **y no tiene forma de
   *  saber que faltaba algo**: crea la mascota sin foto y nadie se entera.
   *  Ese es exactamente el modo de falla que L-192 prohíbe — el silencio.
   *
   *  `conFoto` es un `'1'`: sobrevive a cualquier codificación que una uri
   *  larga pueda no sobrevivir. Con él, «declaré foto y no llegó» pasa de ser
   *  invisible a ser un error CON NOMBRE. */
  conFoto?: string;
  cx?: string;
  cy?: string;
  z?: string;
}

/** Params → borrador. Un `''` es ausencia, no un valor (expo-router puede
 *  entregar cadenas vacías por un param declarado y no puesto). */
export function leerBorrador(params: Record<string, string | string[] | undefined>): BorradorAlta {
  const uno = (k: string): string | undefined => {
    const v = params[k];
    const s = Array.isArray(v) ? v[0] : v;
    return typeof s === 'string' && s.length > 0 ? s : undefined;
  };
  return {
    nombre: uno('nombre'),
    especie: uno('especie'),
    raza: uno('raza'),
    razaSlug: uno('razaSlug'),
    fecha: uno('fecha'),
    precision: uno('precision'),
    sexo: uno('sexo'),
    origen: uno('origen'),
    fotoUri: uno('fotoUri'),
    cx: uno('cx'),
    cy: uno('cy'),
    z: uno('z'),
  };
}

/** Borrador → params. Las claves ausentes NO viajan: un `undefined` en la
 *  URL se lee después como el string 'undefined' y ensucia el dato. */
export function aParams(b: BorradorAlta): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(b)) {
    if (typeof v === 'string' && v.length > 0) out[k] = v;
  }
  return out;
}

/**
 * LA CLÁUSULA DEL PEZ (firma de mesa, 7-ago-2026 — opción A).
 * La especie «pez» registra el ACUARIO como sujeto, no un individuo: el
 * nombre pedido es el del acuario y el campo dos es el TIPO DE AGUA, en
 * espejo de la raza.
 *
 * Vive como predicado y no como `if` suelto porque son CINCO pantallas las
 * que se modulan (el título del paso 1, el label del nombre, el paso 2
 * entero, la voz del paso 4 y el hito del cierre): un literal repetido cinco
 * veces es cinco lugares donde el día que el acuario gane su arco alguien se
 * olvida de uno.
 *
 * ⚠️ LO QUE ESTO **NO** ES: el arco del acuario. La entidad, la membresía y
 * los hitos del sistema son posteriores y no se anticipan acá (brief §③).
 * Esto es solo el alta hablándole bien a quien tiene un acuario.
 */
export function esAcuario(especie: string | undefined): boolean {
  return especie === 'pez';
}

/** Los dos tipos de agua — el «campo dos» del acuario. */
export const TIPOS_DE_AGUA = ['dulce', 'marino'] as const;
export type TipoDeAgua = (typeof TIPOS_DE_AGUA)[number];

/** El borrador viaja por params, así que todo llega como `string`. Este guard
 *  es la frontera: sin él, un `?raza=agua+de+mar` tipeado en la URL llegaría
 *  a la RPC y volvería como `tipo_agua_invalida` — un rebote de servidor por
 *  algo que la pantalla podía ver. (Mismo patrón que `esSexo`/`esPrecision`
 *  de `@/lib/params`, que existen desde S45 por esta misma razón.) */
export function esTipoDeAgua(v: string | undefined): v is TipoDeAgua {
  return v !== undefined && (TIPOS_DE_AGUA as readonly string[]).includes(v);
}

/**
 * Los cinco orígenes que el alta ofrece, de los NUEVE que admite el CHECK de
 * `mascotas.origen` (medido en esta sesión con `pg_get_constraintdef`).
 * Los otros cuatro —`comprado_particular`, `transferido`, `desconocido`,
 * `alta_asistida`— pertenecen a otros caminos: `desconocido` es el default
 * cuando nadie contesta, y `alta_asistida` la escribe el prestador.
 */
export const ORIGENES = [
  'adoptado',
  'refugio',
  'nacido_en_casa',
  'encontrado',
  'criadero',
] as const;
export type OrigenOfrecido = (typeof ORIGENES)[number];

/** El guard del origen — HERMANO EXACTO de `esTipoDeAgua`, y existe por la
 *  misma razón que su comentario ya explica: el borrador viaja por params,
 *  así que `?origen=lo-que-sea` es alcanzable, y sin guard llegaría a la RPC
 *  para volver como `origen_invalido` — un rebote de servidor por algo que
 *  la pantalla podía ver.
 *
 *  Narra a los CINCO ofrecidos, no a los nueve del CHECK: el alta no debe
 *  poder mandar un origen que nunca ofreció (`alta_asistida` es del
 *  prestador, `transferido` de otro camino). Es la Ley 23 al revés — la
 *  puerta tampoco MANDA lo que no ofreció. */
export function esOrigen(v: string | undefined): v is OrigenOfrecido {
  return v !== undefined && (ORIGENES as readonly string[]).includes(v);
}

/** Espejo del `esEspecieUi` de `@/lib/params`, re-exportado para que los
 *  pasos no dependan de dos fuentes distintas para la misma pregunta. */
export type EspecieUi = AvatarMascotaEspecie;
