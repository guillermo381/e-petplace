// El motor de adopción — S111-A. La vidriera, la publicación y el traspaso.
//
// Motor: `supabase/migrations/20260907500000_s111a_motor_adopcion.sql`.
// Letra: `docs/LETRA_ADOPCION.md` — **§0: el expediente empieza en el rescate y
// se hereda.** Eso es lo que hace que el traspaso sea un ACTO y no un UPDATE.
//
// 🔴 LO QUE ESTE ARCHIVO EXISTE PARA CURAR, medido antes de escribirlo: **cero
// funciones de adopción sobre 369 migraciones con `CREATE FUNCTION`, cero
// wrappers.** Tres bloques de tres pistas distintas estaban parados por esto —
// `Convivencia` de B y `packages/mensajeria` de D existían y **no tenían de qué
// hablar**.
//
// 🔴 Y LO QUE **NO** HACE, para que nadie lo busque acá: no reusa ninguna de las
// cinco tablas legado (`solicitudes_adopcion`, `mascotas_adopcion`,
// `adopcion_seguimiento`, `refugios`, `donaciones`). No se construye sobre ellas
// **y no se borran** (`D-991`).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  /* 🔴 Hoy hay CERO cuentas con rol `refugio`: las crea el admin. Este rebote
     es el estado normal del sistema, no una falla — y por eso habla claro. */
  no_sos_cuenta_de_refugio: 'Esta cuenta todavía no está habilitada para publicar animales en adopción.',
  mascota_no_existe:        'No encontramos esa mascota.',
  /* Una mascota sin familia no se publica: el traspaso mueve DE una familia A
     otra, y §0 dice que el refugio ES la familia hasta la entrega. */
  mascota_sin_familia:      'Ese animal todavía no tiene familia asignada en el refugio.',
  publicacion_no_existe:    'No encontramos esa publicación.',
  sin_publicacion_viva:     'Ese animal no está publicado en adopción.',
  familia_destino_no_existe:'No encontramos la familia que va a recibirlo.',
  familia_destino_igual_al_origen: 'Ese animal ya está en esa familia.',
  /* 🔴 EL FAIL-CLOSED DEL ACTA, y su voz dice de qué lado está el problema:
     no falta que la persona haga algo — falta que la casa cargue el documento.
     *Pedirle a alguien que reintente algo que no depende de él es peor que
     decirle que no.* */
  acta_no_disponible:       'Todavía no podemos completar la adopción: falta cargar el acta. Es de nuestro lado.',
  sin_acceso:               'Esta publicación no es tuya.',
  /* ── La mensajería ─────────────────────────────────────────────────────── */
  publicacion_no_disponible:'Ese animal ya no está publicado en adopción.',
  /* 🔴 El motor manda el id de la solicitud que YA existe detrás del código:
     la pantalla LLEVA ahí en vez de decir que no (`L-424`). */
  solicitud_ya_viva:        'Ya postulaste por este animal.',
  solicitud_terminal:       'Esta conversación ya se cerró.',
  estado_final_invalido:    'Esa forma de cerrar no existe.',
  rol_no_puede:             'Sólo quien publicó al animal puede aceptar una solicitud.',
  mensaje_vacio:            'Escribe algo antes de enviar.',
  cuerpo_vacio:             'Escribe algo antes de enviar.',
  sin_sesion:               'No hay sesión activa.',
  datos_inconsistentes:     'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:        'Ocurrió un error inesperado. Prueba de nuevo.',
  /* ═══ S112-A · adenda 10 punto 3 — las tres voces de los documentos ═══════
     `condiciones_no_aceptadas` es la razón de la compuerta de postular, y su
     voz NO dice «error»: dice qué falta hacer. La pantalla lleva a la lectura,
     no muestra un rebote. */
  condiciones_no_aceptadas: 'Antes de postular hay que leer y aceptar las condiciones de adopción.',
  /* Fail-closed CON VOZ: el documento no está cargado. La familia no hizo nada
     mal — nombrar el código sirve para que la pantalla diga cuál falta. */
  documento_no_disponible: 'Ese documento todavía no está publicado.',
  /* El acta NO se acepta: se FIRMA. Son dos actos distintos y el motor los
     separa a propósito. */
  documento_no_aceptable: 'Ese documento no se acepta por esta vía.',
  /* ═══ S112-A1/A2 · el adoptable completo y sus lectores ═══════════════════
     `ingresado_en` es obligatoria y NO tiene default a propósito: un default
     haría que todo rescate viejo entrara como si hubiera llegado hoy, y esa
     fecha es la que ordena los destacados. */
  ingresado_en_requerido: 'Falta la fecha en que el animal llegó al rescate.',
  /* 🔴 El rol no alcanza: la cuenta tiene que estar ACTIVA. Una cuenta
     suspendida con rol vigente seguiría publicando animales. */
  cuenta_no_activa:       'Esta cuenta no está activa.',
  estado_no_valido:       'Ese estado no existe.',
  /* `adoptada` la escribe el acta con las dos firmas, jamás una pantalla. */
  adoptada_la_escribe_el_acta: 'Un animal pasa a «adoptada» cuando se firma el acta, no antes.',
  /* Un campo fuera de la lista blanca rebota CON SU NOMBRE: un editor que
     ignora en silencio le dice a la pantalla que guardó algo que no guardó. */
  campo_no_editable:      'Ese campo no se puede editar desde acá.',
  filtro_no_valido:       'Ese filtro no existe.',
  cursor_no_valido:       'La paginación se perdió. Vuelve a cargar la lista.',
  path_requerido:         'Falta el archivo.',
  tope_de_fotos:          'Llegaste al tope de fotos de esta ficha.',
  path_fuera_de_la_carpeta: 'Esa foto no está en la carpeta de esta ficha.',
  foto_no_existe:         'No encontramos esa foto.',
  orden_incompleto:       'El orden llegó incompleto: manda todas las fotos.',
} as const;

export type CodigoErrorAdopcion = keyof typeof MENSAJES;
const CODIGOS = Object.keys(MENSAJES) as CodigoErrorAdopcion[];

function fallaCodigo<T>(
  c: CodigoErrorAdopcion,
  detalle: string | null = null,
): ResultadoWrapper<T, CodigoErrorAdopcion> {
  return { ok: false, codigo: c, mensaje: MENSAJES[c], detalle };
}
/* Regla 35: se discrimina por PREFIJO de código, jamás por prosa. El motor manda
   `acta_no_disponible: acta_adopcion v1` y el detalle viaja detrás del código.
   ═══════════════════════════════════════════════════════════════════════════
   🔴 LO QUE ESTA FUNCIÓN TIRABA, Y POR QUÉ IMPORTA (S112-D)

   El comentario de arriba ya decía *«el detalle viaja detrás del código»* — y
   **esta función lo descartaba**: mapeaba por prefijo y devolvía el mensaje
   estático, sin el resto del crudo. ⇒ `crear_solicitud_adopcion` se toma el
   trabajo de mandar `solicitud_ya_viva: <uuid>` **para poder LLEVAR a esa
   solicitud** (`L-424`: *el índice sólo sabe negarse; el guard explica*), y el
   uuid **moría acá**.

   > ### `L-424` quedaba cumplida en el motor y deshecha en la puerta.

   Y su forma era la peor posible: **el JSDoc de `crearSolicitudAdopcion`
   afirmaba que el id viajaba en `mensaje`** (hoy corregido). *Un hueco callado
   deja a alguien buscando; un comentario que promete de más lo manda a
   construir contra algo que no existe.*

   ⚠️ **La regla 35 NO se afloja, y el campo nació justo para esto:** `detalle`
   se agregó a `ResultadoWrapper` en S109 porque *«el motor ya calculaba la
   causa y el wrapper la tiraba»*. Se **muestra** y se **navega** con él; se
   **ramifica** SIEMPRE por `codigo`. Lo vigila `scripts/verify-rebote-lleva-id.mjs`,
   que tiene un brazo en rojo si alguien mete el crudo en `mensaje`.
   ═══════════════════════════════════════════════════════════════════════════ */
function fallo<T>(raw: string): ResultadoWrapper<T, CodigoErrorAdopcion> {
  if (raw === 'auth_required') return fallaCodigo('sin_sesion');
  for (const c of CODIGOS) {
    if (!raw.startsWith(c)) continue;
    /* Lo que el motor dijo ADEMÁS del código. Vacío ⇒ `null`: un detalle
       inventado es peor que ninguno. */
    const resto = raw.slice(c.length).replace(/^:\s*/, '').trim();
    return fallaCodigo(c, resto || null);
  }
  /* Un crudo que no reconocemos se CONSERVA entero: es lo único que va a tener
     quien diagnostique el día que el motor agregue un código y esta lista no. */
  return fallaCodigo('error_desconocido', raw);
}

/* ═══════════════════════════════════════════════════════════════════════════
   ① LA VIDRIERA
   🔴 La pantalla NO enumera estados. El motor filtra por
   `cat_estados_adopcion.visible_en_vidriera`, así que el día que nazca un sexto
   estado la vidriera no se olvida de él.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Una fila de la vidriera. **Es lo que la ventana pública deja salir y nada
 *  más** — la lista blanca vive en `v_adoptables_publicos` y agregar un campo
 *  acá exige agregarlo allá primero, que es una decisión de privacidad. */
export interface Adoptable {
  publicacionId: string;
  mascotaId: string;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo: string | null;
  /** `null` = no se sabe. **No se infiere una edad que nadie declaró.** */
  fechaNacimiento: string | null;
  /** Cómo de precisa es esa fecha: la redacción la usa para no mentir. */
  fechaNacimientoPrecision: string | null;
  fotoUrl: string | null;
  talla: string | null;
  esterilizado: boolean | null;
  /** Días desde que llegó al rescate. **Es un número, no una frase**: la
   *  redacción vive en el riel (`describirEspera`), no en el motor. */
  esperaDias: number;
  ingresadoEn: string;
  urgente: boolean;
  /** 🔴 TRES estados, jamás un boolean: `'si' | 'no' | 'no_se_sabe'`. */
  conviveperros: Convivencia;
  conviveGatos: Convivencia;
  conviveNinos: Convivencia;
  ciudadNombre: string | null;
  zona: string | null;
  historia: string | null;
  senas: string | null;
  estadoVacunal: string | null;
  desparasitado: Convivencia | null;
  bonoMonto: number | null;
  bonoDestino: string | null;
  parejaId: string | null;
  tieneMicrochip: boolean;
  tieneRemetfu: boolean;
  /** Quién lo publicó. El refugio es procedencia, no un adorno. */
  publicadorId: string | null;
  publicadorNombre: string | null;
  publicadorFoto: string | null;
  creadaEn: string;
}

/** 🔴 Los tres estados de convivencia. **No hay un cuarto y no hay boolean**:
 *  con un boolean, «no se sabe» se guarda como `false` o como `null` y las dos
 *  lecturas mienten — `false` dice «no convive» sobre un animal que nadie
 *  probó. Con tres estados, «no se sabe» es un valor de primera clase y la
 *  pantalla lo dibuja con el mismo peso. */
export type Convivencia = 'si' | 'no' | 'no_se_sabe';

export interface FiltrosAdoptables {
  especie?: string;
  talla?: string;
  sexo?: string;
  urgente?: boolean;
  esterilizado?: boolean;
  convivePerros?: Convivencia;
  conviveGatos?: Convivencia;
  conviveNinos?: Convivencia;
  conPareja?: boolean;
  ciudadId?: string;
  countryCode?: string;
  edadMaxMeses?: number;
  edadMinMeses?: number;
}

export interface PaginaAdoptables {
  /** Los tres que más esperan. **Sólo en la primera página**: son una carta de
   *  portada, no una sección que se repite al scrollear. */
  destacados: Adoptable[];
  resto: Adoptable[];
  /** Keyset. `null` = no hay más. **Se pasa tal cual vino** — lleva la clave de
   *  orden completa y armarlo a mano en la pantalla saltea filas. */
  cursor: string | null;
  hayMas: boolean;
  /** `true` cuando hay filtro de convivencia: los confirmados van primero y los
   *  «todavía no se sabe» abajo, **con su título y con el mismo peso**. */
  ordenPorConvivencia: boolean;
}

function aConvivencia(v: unknown): Convivencia {
  return v === 'si' || v === 'no' ? v : 'no_se_sabe';
}

function aAdoptable(f: Record<string, unknown>): Adoptable | null {
  if (typeof f.publicacion_id !== 'string' || typeof f.mascota_id !== 'string') return null;
  const txt = (k: string) => (typeof f[k] === 'string' ? (f[k] as string) : null);
  const num = (k: string) => (typeof f[k] === 'number' ? (f[k] as number) : Number(f[k] ?? NaN));
  return {
    publicacionId: f.publicacion_id,
    mascotaId: f.mascota_id,
    nombre: txt('nombre') ?? '',
    especie: txt('especie') ?? '',
    raza: txt('raza'),
    sexo: txt('sexo'),
    fechaNacimiento: txt('fecha_nacimiento'),
    fechaNacimientoPrecision: txt('fecha_nacimiento_precision'),
    fotoUrl: txt('foto_url'),
    talla: txt('talla'),
    esterilizado: typeof f.esterilizado === 'boolean' ? f.esterilizado : null,
    esperaDias: Number.isFinite(num('espera_dias')) ? num('espera_dias') : 0,
    ingresadoEn: txt('ingresado_en') ?? '',
    urgente: f.urgente === true,
    conviveperros: aConvivencia(f.convive_perros),
    conviveGatos: aConvivencia(f.convive_gatos),
    conviveNinos: aConvivencia(f.convive_ninos),
    ciudadNombre: txt('ciudad_nombre'),
    zona: txt('zona'),
    historia: txt('historia'),
    senas: txt('senas'),
    estadoVacunal: txt('estado_vacunal'),
    desparasitado: f.desparasitado == null ? null : aConvivencia(f.desparasitado),
    bonoMonto: f.bono_monto == null ? null : Number(f.bono_monto),
    bonoDestino: txt('bono_destino'),
    parejaId: txt('pareja_id'),
    tieneMicrochip: f.tiene_microchip === true,
    tieneRemetfu: f.tiene_remetfu === true,
    publicadorId: txt('publicador_id'),
    publicadorNombre: txt('publicador_nombre'),
    publicadorFoto: txt('publicador_foto'),
    creadaEn: String(f.creada_en ?? ''),
  };
}

/** La lista de la vidriera, **por keyset**. Se ve SIN sesión (§0.8).
 *
 *  El `cursor` se pasa tal cual vino en la página anterior. **Jamás se arma en
 *  la pantalla**: lleva la clave de orden completa (`rango|fecha|id`) porque el
 *  orden cambia cuando hay filtro de convivencia — un cursor parcial saltearía
 *  filas sin error y sin síntoma, que es exactamente lo que la línea de vida
 *  cobró en S99 (55 de 62). */
export async function obtenerAdoptables(params?: {
  filtros?: FiltrosAdoptables;
  cursor?: string | null;
  limite?: number;
}): Promise<ResultadoWrapper<PaginaAdoptables, CodigoErrorAdopcion>> {
  const f = params?.filtros ?? {};
  const p_filtros: Record<string, unknown> = {};
  if (f.especie !== undefined) p_filtros.especie = f.especie;
  if (f.talla !== undefined) p_filtros.talla = f.talla;
  if (f.sexo !== undefined) p_filtros.sexo = f.sexo;
  if (f.urgente !== undefined) p_filtros.urgente = f.urgente;
  if (f.esterilizado !== undefined) p_filtros.esterilizado = f.esterilizado;
  if (f.convivePerros !== undefined) p_filtros.convive_perros = f.convivePerros;
  if (f.conviveGatos !== undefined) p_filtros.convive_gatos = f.conviveGatos;
  if (f.conviveNinos !== undefined) p_filtros.convive_ninos = f.conviveNinos;
  if (f.conPareja !== undefined) p_filtros.con_pareja = f.conPareja;
  if (f.ciudadId !== undefined) p_filtros.ciudad_id = f.ciudadId;
  if (f.countryCode !== undefined) p_filtros.country_code = f.countryCode;
  if (f.edadMaxMeses !== undefined) p_filtros.edad_max_meses = f.edadMaxMeses;
  if (f.edadMinMeses !== undefined) p_filtros.edad_min_meses = f.edadMinMeses;

  const { data, error } = await getClient().rpc('obtener_adoptables', {
    p_filtros: comoJson(p_filtros),
    p_cursor: params?.cursor ?? undefined,
    p_limite: params?.limite ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (!Array.isArray(r.destacados) || !Array.isArray(r.resto)) return fallaCodigo('datos_inconsistentes');

  const mapear = (xs: unknown[]): Adoptable[] | null => {
    const out: Adoptable[] = [];
    for (const x of xs) {
      const a = aAdoptable(x as Record<string, unknown>);
      if (a === null) return null;
      out.push(a);
    }
    return out;
  };
  const destacados = mapear(r.destacados);
  const resto = mapear(r.resto);
  if (destacados === null || resto === null) return fallaCodigo('datos_inconsistentes');

  return {
    ok: true,
    data: {
      destacados,
      resto,
      cursor: typeof r.cursor === 'string' ? r.cursor : null,
      hayMas: r.hay_mas === true,
      ordenPorConvivencia: r.orden_por_convivencia === true,
    },
  };
}

/** La ficha, **en un viaje**. Trae todo lo que §4.1 dibuja, fotos incluidas.
 *
 *  🔴 Rebota `publicacion_no_disponible` **sin distinguir** entre «no existe»,
 *  «está en borrador», «pausada», «adoptada» o «el animal falleció»: distinguir
 *  le contaría a un anónimo el estado interno de un refugio. */
export interface FichaAdoptable extends Adoptable {
  /** URLs públicas, ya armadas, **en orden**. La primera es la portada. */
  fotos: string[];
  pareja: { publicacionId: string; nombre: string; fotoUrl: string | null } | null;
}

export async function obtenerAdoptable(
  publicacionId: string,
): Promise<ResultadoWrapper<FichaAdoptable, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('obtener_adoptable', {
    p_publicacion_id: publicacionId,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  const base = aAdoptable(r);
  if (base === null) return fallaCodigo('datos_inconsistentes');
  const par = r.pareja as Record<string, unknown> | null | undefined;
  return {
    ok: true,
    data: {
      ...base,
      fotos: Array.isArray(r.fotos) ? (r.fotos.filter((x) => typeof x === 'string') as string[]) : [],
      pareja:
        par != null && typeof par.publicacion_id === 'string'
          ? {
              publicacionId: par.publicacion_id,
              nombre: typeof par.nombre === 'string' ? par.nombre : '',
              fotoUrl: typeof par.foto_url === 'string' ? par.foto_url : null,
            }
          : null,
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ② PUBLICAR Y RETIRAR — del lado del refugio
   ═══════════════════════════════════════════════════════════════════════════ */

/** Crea la ficha del animal. **Nace en `borrador`, no publicada** — §0 paso 4:
 *  el refugio llena la ficha y DESPUÉS enciende «publicado». Publicar en el
 *  mismo acto de crear haría inalcanzable el único momento donde la regla de
 *  los seis meses puede frenarlo con la ficha a la vista.
 *
 *  **Idempotente y hablada**: si ya hay una publicación viva devuelve la que
 *  existe con `yaExistia: true` — *un guard que vive en un índice sólo sabe
 *  negarse* (`L-424`). */
export async function publicarAdoptable(params: {
  mascotaId: string;
  cuentaComercialId: string;
  /** 🔴 Obligatoria: la fecha en que el animal llegó al rescate. Es la que
   *  ordena los destacados, así que un default mentiría justo ahí. */
  ingresadoEn: string;
  ficha?: Partial<FichaEditable>;
}): Promise<ResultadoWrapper<{ publicacionId: string; yaExistia: boolean }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('publicar_adoptable', {
    p_mascota_id: params.mascotaId,
    p_cuenta_comercial_id: params.cuentaComercialId,
    p_ingresado_en: params.ingresadoEn,
    p_ficha: comoJson(aFichaJson(params.ficha ?? {})),
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.publicacion_id !== 'string') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { publicacionId: r.publicacion_id, yaExistia: r.ya_existia === true } };
}

/** Los campos editables de la ficha. **Lista blanca**: mandar una clave que no
 *  esté acá rebota con `campo_no_editable` **nombrándola**. */
export interface FichaEditable {
  ciudadId: string | null;
  zona: string | null;
  senas: string | null;
  origenRescate: 'rescate' | 'cesion' | null;
  fechaCesion: string | null;
  estadoVacunal: 'al_dia' | 'incompleto' | 'sin_datos' | null;
  desparasitado: Convivencia | null;
  urgente: boolean;
  bonoMonto: number | null;
  bonoDestino: string | null;
  historia: string | null;
  convivePerros: Convivencia;
  conviveGatos: Convivencia;
  conviveNinos: Convivencia;
  ingresadoEn: string;
  parejaId: string | null;
}

const CLAVES_FICHA: Record<keyof FichaEditable, string> = {
  ciudadId: 'ciudad_id',
  zona: 'zona',
  senas: 'senas',
  origenRescate: 'origen_rescate',
  fechaCesion: 'fecha_cesion',
  estadoVacunal: 'estado_vacunal',
  desparasitado: 'desparasitado',
  urgente: 'urgente',
  bonoMonto: 'bono_monto',
  bonoDestino: 'bono_destino',
  historia: 'historia',
  convivePerros: 'convive_perros',
  conviveGatos: 'convive_gatos',
  conviveNinos: 'convive_ninos',
  ingresadoEn: 'ingresado_en',
  parejaId: 'pareja_id',
};

/** El cliente tipa `jsonb` como `Json`, que es una union recursiva. Un
 *  `Record<string, unknown>` no le encaja aunque sea exactamente eso en
 *  tiempo de ejecucion — se estrecha en UN solo lugar, y no en cada llamada. */
function comoJson(o: Record<string, unknown>) {
  return o as unknown as Record<string, string | number | boolean | null>;
}

function aFichaJson(f: Partial<FichaEditable>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, col] of Object.entries(CLAVES_FICHA) as [keyof FichaEditable, string][]) {
    if (f[k] !== undefined) out[col] = f[k];
  }
  return out;
}

/** Edita la ficha. Sólo se mandan las claves que cambiaron: **lo que no viaja,
 *  no se toca** — así dos pantallas editando bloques distintos no se pisan. */
export async function actualizarAdoptable(params: {
  publicacionId: string;
  ficha: Partial<FichaEditable>;
}): Promise<ResultadoWrapper<{ publicacionId: string }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('actualizar_adoptable', {
    p_publicacion_id: params.publicacionId,
    p_ficha: comoJson(aFichaJson(params.ficha)),
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { publicacionId: params.publicacionId } };
}

export type EstadoAdoptable = 'borrador' | 'publicada' | 'pausada' | 'adoptada' | 'no_disponible';

/** Mueve el estado de la publicación. **Una sola puerta para los cinco.**
 *
 *  🔴 `adoptada` NO se escribe desde acá: la escribe el acta con las dos firmas.
 *  Un refugio que pudiera marcarla a mano podría sacar un animal de la vidriera
 *  sin que exista el documento que la ley exige. */
export async function cambiarEstadoAdoptable(params: {
  publicacionId: string;
  estado: EstadoAdoptable;
  motivo?: string;
}): Promise<
  ResultadoWrapper<{ yaEstaba: boolean; estado: string; estadoAnterior?: string }, CodigoErrorAdopcion>
> {
  const { data, error } = await getClient().rpc('cambiar_estado_adoptable', {
    p_publicacion_id: params.publicacionId,
    p_estado: params.estado,
    p_motivo: params.motivo ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  return {
    ok: true,
    data: {
      yaEstaba: r.ya_estaba === true,
      estado: String(r.estado ?? params.estado),
      estadoAnterior: typeof r.estado_anterior === 'string' ? r.estado_anterior : undefined,
    },
  };
}

/** Retira la publicación. Consumidor de `cambiarEstadoAdoptable`, no una
 *  segunda implementación: *dos funciones que mueven el mismo estado divergen
 *  el día que una gana un gate y la otra no.* */
export async function despublicarAdoptable(params: {
  publicacionId: string;
  motivo?: string;
}): Promise<ResultadoWrapper<{ yaEstaba: boolean }, CodigoErrorAdopcion>> {
  const r = await cambiarEstadoAdoptable({
    publicacionId: params.publicacionId,
    estado: 'no_disponible',
    motivo: params.motivo,
  });
  if (!r.ok) return r;
  return { ok: true, data: { yaEstaba: r.data.yaEstaba } };
}

/* ── Las fotos ─────────────────────────────────────────────────────────────
   El ORDEN lo asigna el servidor. Si lo mandara la pantalla, dos subidas
   simultáneas pelearían por el mismo número y el rebote sería un `23505` crudo
   que no explica nada. */

/** 🔴 EL `path` VA DENTRO DE LA CARPETA DE LA PUBLICACIÓN: `<publicacionId>/…`.
 *  No es una convención: **es lo que la policy del bucket mira** para decidir
 *  de quién es el archivo. Un path fuera de esa carpeta rebota con
 *  `path_fuera_de_la_carpeta` — *si no rebotara acá, la fila quedaría apuntando
 *  a un archivo que el bucket nunca va a aceptar, y la pantalla la dibujaría.* */
export async function agregarFotoAdoptable(params: {
  publicacionId: string;
  path: string;
}): Promise<ResultadoWrapper<{ fotoId: string; orden: number; esPortada: boolean }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('agregar_foto_adoptable', {
    p_publicacion_id: params.publicacionId,
    p_path: params.path,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.foto_id !== 'string') return fallaCodigo('datos_inconsistentes');
  return {
    ok: true,
    data: { fotoId: r.foto_id, orden: Number(r.orden ?? 0), esPortada: r.es_portada === true },
  };
}

/** Reordena. **La lista tiene que ser COMPLETA**: con una parcial, las fotos que
 *  faltan quedan con su orden viejo chocando contra los nuevos. El motor lo
 *  rebota diciendo cuántas hay y cuántas llegaron. */
export async function reordenarFotosAdoptable(params: {
  publicacionId: string;
  idsEnOrden: string[];
}): Promise<ResultadoWrapper<{ fotos: number }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('reordenar_fotos_adoptable', {
    p_publicacion_id: params.publicacionId,
    p_ids: params.idsEnOrden,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { fotos: Number((data as Record<string, unknown>).fotos ?? 0) } };
}

/** Borra la fila **y devuelve el path que la pantalla tiene que borrar del
 *  bucket**. 🔴 Postgres no alcanza Storage (`storage.protect_delete`): si la
 *  pantalla no completa el borrado, queda un huérfano **público y alcanzable
 *  por URL** — la misma clase que `D-731`. */
export async function borrarFotoAdoptable(
  fotoId: string,
): Promise<ResultadoWrapper<{ pathABorrar: string }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('borrar_foto_adoptable', { p_foto_id: fotoId });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.path_a_borrar !== 'string') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { pathABorrar: r.path_a_borrar } };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ③ EL TRASPASO — un ACTO, no un UPDATE
   🔴 En una sola transacción del motor: la mascota cambia de familia · el
   acceso viejo se CIERRA con `hasta` (no se borra: *borrarlo diría que esa
   familia nunca lo tuvo*) · nace el evento `transferencia_familia` con **el
   refugio como procedencia permanente** · la publicación se cierra.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ResultadoTraspaso {
  mascotaId: string;
  familiaOrigen: string | null;
  familiaDestino: string;
  /** El rastro. **Es lo único que justifica que esto sea una RPC y no un
   *  `UPDATE`** — sin él, el expediente diría que el animal siempre estuvo ahí. */
  eventoId: string;
  accesosCerrados: number;
  publicacionId: string;
}

/**
 * 🔴 **FAIL-CLOSED, Y HOY NO ABRE.** Exige un acta versionada cargada en
 * `adopcion_documentos`, que **nace vacía a propósito**: el texto es del paquete
 * del abogado y está estacionado. Hoy esto rebota `acta_no_disponible` siempre,
 * y **el día que la mesa cargue el texto la puerta se abre sola, sin tocar una
 * línea de código.**
 *
 * *La regla del loop al pie: sin documento cargado, la puerta no se abre.*
 */
export async function traspasarMascotaAFamilia(params: {
  mascotaId: string;
  familiaDestinoId: string;
  actaVersion: number;
  /** Por defecto `acta_adopcion`. Se expone porque el código del documento es
   *  del dominio de la mesa, no de esta capa. */
  actaCodigo?: string;
}): Promise<ResultadoWrapper<ResultadoTraspaso, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('traspasar_mascota_a_familia', {
    p_mascota_id: params.mascotaId,
    p_familia_destino_id: params.familiaDestinoId,
    p_acta_version: params.actaVersion,
    p_acta_codigo: params.actaCodigo ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.mascota_id !== 'string' || typeof r.evento_id !== 'string') {
    return fallaCodigo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      mascotaId: r.mascota_id,
      familiaOrigen: typeof r.familia_origen === 'string' ? r.familia_origen : null,
      familiaDestino: String(r.familia_destino),
      eventoId: r.evento_id,
      accesosCerrados: typeof r.accesos_cerrados === 'number' ? r.accesos_cerrados : 0,
      publicacionId: String(r.publicacion_id),
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ④ LA MENSAJERÍA — la solicitud, el hilo y su desenlace
   🔴 ESTOS WRAPPERS EXISTEN PORQUE FALTABAN, y la falta la midió C: las cuatro
   RPC del motor estaban vivas y **sin una sola puerta** — desde `apps/` no se
   llama `rpc()` directo. *El contrato de una pieza de motor incluye su wrapper*,
   y esta vez el que lo olvidó fui yo.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ `EstadoSolicitudAdopcion`, NO `EstadoSolicitudAdopcion`: ese nombre ya lo usa
   `veterinaria-mostrador` para OTRA cosa —la autorización del mostrador
   (`pendiente | autorizada | rechazada | expirada`)—. *Dos uniones distintas
   con el mismo nombre no chocan por casualidad: chocan porque el nombre no
   decía de qué dominio era.* Lo cazó el typecheck, no una relectura. */
export type EstadoSolicitudAdopcion = 'recibida' | 'en_conversacion' | 'aceptada' | 'declinada';

export interface MensajeDelHilo {
  mensajeId: string;
  autorUserId: string;
  cuerpo: string;
  /** 🔴 `true` = la respuesta automática del publicador. **No cuenta como
   *  respuesta**: si contara, el reloj de los 5 días no sonaría nunca. La
   *  pantalla puede mostrarla distinta; el reloj la ignora. */
  automatica: boolean;
  creadoEn: string;
}

/** El hilo como lo ve LA FAMILIA. */
export interface MiSolicitud {
  solicitudId: string;
  publicacionId: string;
  estado: EstadoSolicitudAdopcion;
  creadaEn: string;
  cerradaEn: string | null;
  mascotaId: string;
  mascotaNombre: string;
  mascotaEspecie: string;
  mascotaFotoUrl: string | null;
  publicadorNombre: string | null;
  /** Vienen CON el hilo, no en otro viaje. */
  mensajes: MensajeDelHilo[];
}

/** El hilo como lo ve EL PUBLICADOR. Es otro tipo a propósito: **ve al
 *  solicitante y no ve al publicador**, porque es él. */
export interface SolicitudRecibida {
  solicitudId: string;
  publicacionId: string;
  estado: EstadoSolicitudAdopcion;
  creadaEn: string;
  cerradaEn: string | null;
  solicitanteUserId: string;
  solicitanteNombre: string | null;
  mascotaId: string;
  mascotaNombre: string;
  mascotaFotoUrl: string | null;
  mensajes: MensajeDelHilo[];
}

function leerMensajes(v: unknown): MensajeDelHilo[] {
  if (!Array.isArray(v)) return [];
  return (v as Record<string, unknown>[]).map((m) => ({
    mensajeId: String(m.mensajeId),
    autorUserId: String(m.autorUserId),
    cuerpo: typeof m.cuerpo === 'string' ? m.cuerpo : '',
    automatica: m.automatica === true,
    creadoEn: String(m.creadoEn),
  }));
}

/**
 * Postula para adoptar. 🔴 **Si ya tenías una solicitud viva sobre ese animal,
 * el rebote `solicitud_ya_viva` trae SU ID en `detalle`** — la pantalla lleva
 * ahí en vez de decir que no (`L-424`).
 *
 * ⚠️ **Decía `mensaje` y era falso** (curado S112-D): `mensaje` es la frase
 * humana y jamás lleva el uuid. Se ramifica por `codigo`, se navega con
 * `detalle`.
 */
export async function crearSolicitudAdopcion(params: {
  publicacionId: string;
  mensajeInicial?: string;
}): Promise<ResultadoWrapper<{ solicitudId: string; estado: EstadoSolicitudAdopcion }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('crear_solicitud_adopcion', {
    p_publicacion_id: params.publicacionId,
    p_mensaje_inicial: params.mensajeInicial ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.solicitud_id !== 'string') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { solicitudId: r.solicitud_id, estado: r.estado as EstadoSolicitudAdopcion } };
}

/** Escribe en el hilo. 🔑 **Si el que responde es el publicador y la solicitud
 *  estaba `recibida`, el estado se mueve EN EL MISMO ACTO** — la pantalla no
 *  tiene que acordarse: *un estado que alguien tiene que acordarse de mover es
 *  un estado que va a estar mal.* */
export async function responderSolicitudAdopcion(params: {
  solicitudId: string;
  cuerpo: string;
}): Promise<ResultadoWrapper<{ mensajeId: string; estado: EstadoSolicitudAdopcion }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('responder_solicitud_adopcion', {
    p_solicitud_id: params.solicitudId,
    p_cuerpo: params.cuerpo,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.mensaje_id !== 'string') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { mensajeId: r.mensaje_id, estado: r.estado as EstadoSolicitudAdopcion } };
}

/** Cierra la solicitud. **Sólo el publicador ACEPTA; declinar pueden los dos.**
 *  ⚠️ `aceptada` **no** dispara el acta ni la transferencia del expediente: ese
 *  arco vive en `traspasarMascotaAFamilia`, con su propio fail-closed. */
export async function cerrarSolicitudAdopcion(params: {
  solicitudId: string;
  estadoFinal: 'aceptada' | 'declinada';
}): Promise<ResultadoWrapper<{ estado: EstadoSolicitudAdopcion }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('cerrar_solicitud_adopcion', {
    p_solicitud_id: params.solicitudId,
    p_estado_final: params.estadoFinal,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { estado: (data as Record<string, unknown>).estado as EstadoSolicitudAdopcion } };
}

/** Mis solicitudes, con sus hilos. Lado FAMILIA. */
export async function obtenerMisSolicitudesAdopcion(): Promise<
  ResultadoWrapper<MiSolicitud[], CodigoErrorAdopcion>
> {
  const { data, error } = await getClient().rpc('obtener_mis_solicitudes_adopcion');
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  return {
    ok: true,
    data: (data as Record<string, unknown>[]).map((f) => ({
      solicitudId: String(f.solicitud_id),
      publicacionId: String(f.publicacion_id),
      estado: f.estado as EstadoSolicitudAdopcion,
      creadaEn: String(f.creada_en),
      cerradaEn: typeof f.cerrada_en === 'string' ? f.cerrada_en : null,
      mascotaId: String(f.mascota_id),
      mascotaNombre: typeof f.mascota_nombre === 'string' ? f.mascota_nombre : '',
      mascotaEspecie: typeof f.mascota_especie === 'string' ? f.mascota_especie : '',
      mascotaFotoUrl: typeof f.mascota_foto_url === 'string' ? f.mascota_foto_url : null,
      publicadorNombre: typeof f.publicador_nombre === 'string' ? f.publicador_nombre : null,
      mensajes: leerMensajes(f.mensajes),
    })),
  };
}

/** Las solicitudes de MIS publicaciones. Lado PUBLICADOR.
 *  🔴 El gate es **la publicación, no el refugio**: dos personas del mismo
 *  refugio no ven solicitudes de animales que no publicaron. */
export async function obtenerSolicitudesDeMisPublicaciones(
  soloPorRevisar = false,
): Promise<ResultadoWrapper<SolicitudRecibida[], CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('obtener_solicitudes_de_mis_publicaciones', {
    p_solo_por_revisar: soloPorRevisar,
  });
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  return {
    ok: true,
    data: (data as Record<string, unknown>[]).map((f) => ({
      solicitudId: String(f.solicitud_id),
      publicacionId: String(f.publicacion_id),
      estado: f.estado as EstadoSolicitudAdopcion,
      creadaEn: String(f.creada_en),
      cerradaEn: typeof f.cerrada_en === 'string' ? f.cerrada_en : null,
      solicitanteUserId: String(f.solicitante_user_id),
      solicitanteNombre: typeof f.solicitante_nombre === 'string' ? f.solicitante_nombre : null,
      mascotaId: String(f.mascota_id),
      mascotaNombre: typeof f.mascota_nombre === 'string' ? f.mascota_nombre : '',
      mascotaFotoUrl: typeof f.mascota_foto_url === 'string' ? f.mascota_foto_url : null,
      mensajes: leerMensajes(f.mensajes),
    })),
  };
}

/**
 * Cuántas solicitudes tengo por revisar. 🔴 **Se cuenta en el SERVIDOR, a
 * propósito.** Derivarlo contando lo que trajo la pantalla haría que el número
 * dependa de cuántas páginas se pidieron — *y un contador que miente hacia
 * abajo es peor que no tenerlo: dice que no hay trabajo pendiente.*
 * **Puede llegar a cero**, que es lo que §9 pide de un contador.
 */
export async function contarSolicitudesPorRevisar(): Promise<
  ResultadoWrapper<number, CodigoErrorAdopcion>
> {
  const { data, error } = await getClient().rpc('contar_solicitudes_por_revisar');
  if (error) return fallo(error.message);
  if (typeof data !== 'number') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data };
}


/* ═══════════════════════════════════════════════════════════════════════════
 * S112-A · LOS DOCUMENTOS DE ADOPCIÓN — entrega para C (adenda 10 punto 3).
 *
 * 🔴 **LA VERSIÓN VIAJA CON EL CUERPO, Y ESO NO ES COMODIDAD.** Es para que la
 * app NUNCA elija una versión: versión y texto son el mismo dato y viven juntos
 * (`L-166`, el precedente de `URL_LEGAL`/`VERSION_LEGAL` de S104). Si la
 * pantalla hardcodeara la versión, el día que se publique la v2 seguiría
 * mostrando y aceptando la v1 **y todo compilaría** — ni el typecheck ni ningún
 * gate lo verían.
 *
 * Por la misma razón `aceptar` **no recibe versión**: la resuelve el servidor.
 * Y **el hash tampoco viene del cliente**: si la app lo mandara, la evidencia
 * diría lo que el cliente quiso decir.
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface DocumentoVigente {
  codigo: string;
  /** Se pasa de vuelta tal cual al aceptar o al firmar. La app no la elige. */
  version: number;
  contenido: string;
  sha256: string;
  esPlantilla: boolean;
  vigenteDesde: string;
}

export async function obtenerDocumentoVigente(
  codigo: 'terminos_refugio' | 'condiciones_adopcion' | 'acta_adopcion',
): Promise<ResultadoWrapper<DocumentoVigente, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('obtener_documento_vigente', { p_codigo: codigo });
  if (error) return fallo(error.message);
  const r = data as Record<string, unknown> | null;
  if (r === null || typeof r.contenido !== 'string') return fallaCodigo('datos_inconsistentes');
  return {
    ok: true,
    data: {
      codigo: String(r.codigo),
      version: Number(r.version),
      contenido: r.contenido,
      sha256: String(r.sha256),
      esPlantilla: r.es_plantilla === true,
      vigenteDesde: String(r.vigente_desde),
    },
  };
}

/** ¿Este usuario ya aceptó la versión VIGENTE? Aceptar la v1 no vale si rige la v2. */
export async function tengoAceptadoDocumento(
  codigo: 'terminos_refugio' | 'condiciones_adopcion',
): Promise<ResultadoWrapper<boolean, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('tengo_aceptado_documento', { p_codigo: codigo });
  if (error) return fallo(error.message);
  if (typeof data !== 'boolean') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data };
}

export interface AceptacionRegistrada {
  yaEstaba: boolean;
  consentimientoId: string;
  codigo: string;
  version: number;
  /** false = el header no llegó y la evidencia quedó sin IP. No se inventa. */
  ipCapturada?: boolean;
}

/**
 * Registra la aceptación con su evidencia: usuario · documento · versión ·
 * hash · sello de tiempo · IP · dispositivo. **Idempotente**: dos toques del
 * mismo botón no son dos consentimientos.
 *
 * 🔴 **`ipHash` YA NO EXISTE, y lo destapó C negándose a mandarlo.** Su razón:
 * *la app no conoce la IP, y fabricar un hash de algo que no conozco sería
 * inventar evidencia legal.* Tenía razón — y un campo que sólo puede llenar
 * quien no lo conoce **no se llena nunca**: medido, `consentimientos.ip_hash`
 * estaba en NULL en las 97 filas de la casa.
 *
 * ⇒ Ahora **la IP la lee el servidor** de `x-forwarded-for` y la guarda
 * hasheada. `dispositivo` sigue viniendo de acá porque la app SÍ lo conoce.
 * La respuesta trae `ipCapturada` para que la pantalla sepa si la evidencia
 * quedó completa **sin tener que adivinarlo**.
 */
export async function aceptarDocumentoAdopcion(input: {
  codigo: 'terminos_refugio' | 'condiciones_adopcion';
  dispositivo?: string;
}): Promise<ResultadoWrapper<AceptacionRegistrada, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('aceptar_documento_adopcion', {
    p_codigo: input.codigo,
    p_dispositivo: input.dispositivo,
  });
  if (error) return fallo(error.message);
  const r = data as Record<string, unknown> | null;
  if (r === null || typeof r.consentimiento_id !== 'string') return fallaCodigo('datos_inconsistentes');
  return {
    ok: true,
    data: {
      yaEstaba: r.ya_estaba === true,
      consentimientoId: r.consentimiento_id,
      codigo: String(r.codigo),
      version: Number(r.version),
      ipCapturada: r.ip_capturada === true,
    },
  };
}
