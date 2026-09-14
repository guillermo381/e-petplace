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

/* ☠️ **LOS CINCO PASOS MURIERON — S116-C lote 3, firma del founder.**
 *
 * ⏪ Eran `especie · foto · raza · historia · cierre`. El encargo del lote pide
 * **TRES pasos y el carné**: *«07 datos básicos, 08 foto, 09 carné»* más 10 al
 * cierre. **Es cambio de flujo y se hace completo, no a medias.**
 *
 * **Qué absorbe qué, para que el censo sea verificable:**
 *   · `PasoEspecie` + `PasoRaza` + `PasoHistoria` ⇒ **`PasoDatosBasicos`** (07).
 *     *Los tres preguntaban lo mismo —quién es este animal— en tres pantallas;
 *     el mock las junta porque ninguna sola justificaba un paso.*
 *   · `PasoFoto` **se conserva** y es 08.
 *   · **`PasoCarnet`** nace y es 09.
 *   · `PasoCierre` **se conserva** y es el acto, no un paso.
 *
 * ☠️ **LOS TRES ARCHIVOS SE BORRARON, y la lápida vive ACÁ a propósito.**
 * `PasoEspecie.tsx`, `PasoRaza.tsx` y `PasoHistoria.tsx` ya no existen. La
 * forma de la casa es dejar lápida (`L-395`), y **ésta es la lápida** — pero
 * el archivo vacío no era el lugar: `verify:piezas-locales` cuenta `.tsx` de
 * `components/`, así que tres archivos con sólo un `export {}` **seguían
 * contando como tres piezas del catálogo** sin serlo. *Una lápida no puede
 * inflar el inventario que la vara mide.*
 * ⇒ La nota vive donde alguien la va a leer: **junto al orden de los pasos**,
 * que es lo que se abre para entender el flujo. La historia está en git.
 *
 * 🔴 **LO QUE NO SE PIERDE, y es la mitad del trabajo:** `sexo` y `origen` los
 * preguntaba `PasoHistoria` y **la RPC los recibe** (`p_sexo`, `p_origen` —
 * medido en `onboarding.ts`). El encargo nombra cuatro filas para 07 y no los
 * menciona; **se conservan igual** porque quitarlos no es simplificar la
 * pantalla: es dejar de guardar dos datos que hoy se guardan. *Si la mesa los
 * quiere afuera, es una línea — pero es decisión de producto, no de piel.*
 *
 * ⭐ **S116-C lote 6 · EL ALTA SE INVIERTE: FOTO → DATOS → CARNÉ → ¡LISTO!**
 * Firma del founder: *«el alta se invierte: foto (1/3) → datos (2/3) con
 * especie y raza SUGERIDAS por identificación de la foto, preseleccionadas y
 * confirmables → carné (3/3) → ¡Listo!»*.
 *
 * 🔴 **Y esto RESUCITA la sugerencia que mi propio lote 3 mató.** Acá vivía
 * escrita su lápida: *«la foto sigue antes que la raza… y ahora NO puede
 * cumplirse, porque la raza vive en 07 y la foto en 08»*. Era cierto y era el
 * costo del orden anterior. **Con la foto primero, el insumo vuelve a existir**
 * y la sugerencia se reconecta en `PasoDatosBasicos` — no se reescribe: se
 * vuelve a enchufar donde siempre estuvo previsto.
 *
 * ⚠️ **LO QUE EL ORDEN NUEVO NO ALCANZA, MEDIDO Y DECLARADO: la ESPECIE no se
 * puede sugerir hoy.** `sugerir-raza` **exige la especie declarada** — la lee
 * del cuerpo, filtra `cat_razas` por ella y su propio prompt le dice al modelo
 * *«la especie está DECLARADA por la persona»* y le pide que verifique si el
 * animal la contradice (`supabase/functions/sugerir-raza/index.ts:111-135`).
 * ⇒ **sabe decir «eso no es un perro», pero no sabe decir qué es.** Sugerir la
 * especie es cambiar esa edge, y `supabase/` no es territorio de C: va pedido
 * a A/D con la forma exacta que necesito
 * (`docs/loop/buzon/S116-C-para-A-la-especie-tambien-desde-la-foto.md`).
 * *Se entrega la mitad que puedo y se nombra la que no, en vez de dejar la
 * pantalla prometiendo algo que el motor no hace.* */
/** ⭐ **S116-C lote 10 · `raza` ENTRA ENTRE LA FOTO Y EL FORMULARIO.**
 *  Recorrido 4: *«nace la pantalla intermedia de raza, saltable»*.
 *
 *  ⚠️ **Es un PASO del recorrido y NO un paso CONTADO**, y la distinción es
 *  la que sostiene todo lo demás: vive acá para que `siguiente()` la
 *  encadene sola — *un orden que se escribe en dos lados diverge al primer
 *  cambio, y esta lista ya lo pagó con `PRIMER_PASO`* — pero **no lleva
 *  barra**: la pantalla se salta sola casi siempre, y un «3 de 4» para quien
 *  hizo tres pantallas es un contador que miente. El porqué largo vive en la
 *  cabecera de `PasoRazaFicha`. */
export const PASOS = ['foto', 'raza', 'datos', 'carnet', 'cierre'] as const;
export type Paso = (typeof PASOS)[number];

/** 🔴 **EL PRIMER PASO SE DERIVA, NO SE ESCRIBE.** Estaba tecleado en las dos
 *  entradas (`pasoFijo="datos"` y el literal `/onboarding/datos`) ⇒ **al
 *  invertir el orden, `PASOS` decía «foto» y las dos puertas seguían abriendo
 *  en «datos»** — el flujo arrancaba en el paso 2 con su barra marcando 2 de 3.
 *  *Dos listas de lo mismo divergen, y ésta divergió en el primer cambio.* */
export const PRIMER_PASO: Paso = PASOS[0];

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
  /** ⭐ **'1' si `especie`/`raza` los trajo la IDENTIFICACIÓN de la foto**
   *  (S116-C lote 7). Sin esta marca, 2/3 no puede distinguir *«lo trajo la
   *  foto»* de *«lo escribió la persona al volver atrás»* — y diría «la
   *  reconocimos» sobre un dato propio, que es afirmar de más sobre el trabajo
   *  de otro. **Sólo se pone si algo se resolvió de verdad.** */
  deLaFoto?: string;
  /** paso 3 */
  fecha?: string;
  precision?: string;
  sexo?: string;
  origen?: string;
  /** ⭐ **S116-C lote 3 — el peso, opcional, en kg.** Lo pide el encargo de 07.
   *  ⚠️ **NO viaja a la RPC del alta**: medido, `crear_familia_con_primera_mascota`
   *  no tiene `p_peso` y el peso vive en su propia serie (`registrarPesoMascota`).
   *  ⇒ se registra en el CIERRE, después de que la mascota existe. *Un peso es
   *  una medición con fecha, no un atributo del animal — por eso tiene serie.* */
  peso?: string;
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
  /**
   * 🔴 EL TOKEN DEL INTENTO — la identidad de ESTE llenado del formulario.
   *
   * Nace al primer avance y viaja con el borrador hasta el cierre. Su trabajo
   * es que el motor pueda reconocer una re-sumisión del MISMO intento y
   * devolver la mascota que ya creó, en vez de crear otra.
   *
   * ── POR QUÉ UN TOKEN Y NO UNA CLAVE NATURAL ────────────────────────────
   * Lo decidió la medición de A, no el gusto: **los 19 duplicados vivos
   * crearon 19 FAMILIAS distintas** — una clave natural (familia + nombre +
   * especie) no habría cazado ninguno. Y la re-sumisión humana fue **a 1-2
   * minutos**, así que una ventana de segundos tampoco los ve. Lo único
   * estable entre las dos escrituras es que **son el mismo intento**, y eso
   * hay que decirlo explícito porque no se deduce de los datos.
   *
   * ⚠️ Vive en los params junto al resto del borrador a propósito: si viviera
   * en un `useRef` moriría con el re-montaje, que es exactamente el evento
   * contra el que existe.
   */
  tokenIntento?: string;
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
    peso: uno('peso'),
    fotoUri: uno('fotoUri'),
    /* 🔴 **FALTABA, y su ausencia apagaba el guard que la propia interfaz
       declara.** `conFoto` existe para que «declaré foto y no llegó» tenga
       nombre en vez de ser silencio (ver su cabecera arriba) — pero
       `leerBorrador` no lo leía, así que **volvía `undefined` en cada paso** y
       el discriminador nunca podía dispararse. *Un guard que no recibe su dato
       no falla: aprueba.* Medido al invertir el orden, que es cuando la foto
       pasó a viajar por TODOS los pasos siguientes. */
    conFoto: uno('conFoto'),
    deLaFoto: uno('deLaFoto'),
    cx: uno('cx'),
    cy: uno('cy'),
    z: uno('z'),
    tokenIntento: uno('tokenIntento'),
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
 * EL TOKEN DE UN INTENTO. No necesita ser criptográfico —no es un secreto ni
 * autoriza nada—: solo tiene que ser distinto entre dos llenados del
 * formulario. Reloj + azar alcanza y no arrastra dependencia nueva.
 */
export function nuevoTokenIntento(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
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
