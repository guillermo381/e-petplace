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
  no_sos_refugio: 'Tu cuenta todavía no está verificada como refugio.',
  /**
   * 🔴 El detalle trae **el oficio que ya tiene** (`ya_tenes_prestador: clinica_veterinaria`).
   * Sin ese dato la pantalla sólo puede decir un genérico, y *ése es justo el
   * detalle que separa esta puerta de un `23505` traducido.* Ver `fallo()`:
   * el detalle viaja detrás del código y NO se aplana.
   */
  ya_tenes_prestador: 'Tu cuenta ya está registrada con otro oficio.',
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
  /* 🔴 La regla de los seis meses (OM 019 art. 6.7). Los dos motivos son
     DISTINTOS a propósito: mandar a esterilizar cuando lo que falta es la edad
     manda al refugio a hacer algo que no resuelve nada. */
  adoptable_no_esterilizado: 'Pasados los seis meses, se publica esterilizado.',
  edad_no_declarada:      'Falta la edad. Una fecha estimada alcanza.',
  tipo_de_refugio_no_valido: 'Ese tipo de refugio no existe.',
  criterio_requerido:     'Escribe qué se revisó para verificar este refugio.',
  /* 🔴 N1 y el esquema cerrado. Los tres nombran el dato: la pantalla lleva al
     campo, o al animal que ya tenés postulado, en vez de decir sólo que no. */
  respuesta_no_valida:    'Revisa ese dato del formulario.',
  tope_de_solicitudes:    'Ya tienes tres postulaciones abiertas. Cierra una antes de abrir otra.',
  aceptacion_no_es_tuya:  'Esa aceptación no es tuya.',
  /* ═══ S112-A9 · el acta y la firma ═══════════════════════════════════════
     `acta_incompleta` NO es un error de la persona: nombra lo que falta para
     que la pantalla lo pida. Y `acta_cambio_de_version` es el que protege lo
     que de verdad importa — *firmar con un código emitido sobre otro texto es
     firmar algo que no se leyó.* */
  solicitud_no_aceptada:  'El acta existe cuando el refugio acepta la solicitud.',
  acta_incompleta:        'Faltan datos para completar el acta.',
  acta_cambio_de_version: 'El acta cambió mientras esperabas. Vuelve a leerla y pide otro código.',
  ya_firmaste:            'Ya firmaste esta acta.',
  sin_codigo:             'Pide un código antes de firmar.',
  codigo_vencido:         'Ese código venció. Pide otro.',
  codigo_incorrecto:      'Ese código no es el correcto.',
  intentos_agotados:      'Se agotaron los intentos. Pide un código nuevo.',
  firma_inmutable:        'Una firma no se edita ni se borra.',
  solicitud_no_existe:    'No encontramos esa solicitud.',
  /* S112-A10 · desistir y reportar. `solo_el_solicitante_desiste` protege algo
     concreto: si el publicador pudiera, tendría una forma de cerrar una
     solicitud sin que quede escrito que la declinó él. */
  solo_el_solicitante_desiste: 'Sólo quien postuló puede retirar su postulación.',
  motivo_no_valido:       'Ese motivo no existe.',
  /* 🟢 FIRMA DEL FOUNDER (2-sep): el acta NO se firma con el animal en
     memorial. *Un acta de adopción de un animal que murió no es un trámite que
     se cierra: es un documento que no tiene objeto.* */
  animal_en_memorial:     'Este animal falleció. La adopción no puede continuar.',
  /* Bajarse de un acta que alguien ya firmó no es cerrar una conversación, y no
     se resuelve con el mismo botón. */
  acta_ya_firmada:        'El acta ya tiene una firma. No se puede dar de baja desde acá.',
  cuenta_no_existe:       'No encontramos esa cuenta.',
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
  /** 🔴 TRES estados. Nació `boolean | null` y se convirtió el mismo día:
   *  `null` cargaba dos significados que no son el mismo — «no lo declaró» y
   *  «no lo está» — y desde afuera no se distinguían. */
  esterilizado: Convivencia;
  /** El semáforo, con los tres datos en EL MISMO vocabulario. `estadoVacunal`
   *  sigue viajando entero al lado porque `incompleto` no es «no vacunado»:
   *  es «no está al día», y ese matiz no cabe en tres estados. */
  salud: { vacunas: Convivencia; esterilizado: Convivencia; desparasitado: Convivencia };
  /** Días desde que llegó al rescate. **Es un número, no una frase**: la
   *  redacción vive en el riel (`describirEspera`), no en el motor. */
  esperaDias: number;
  ingresadoEn: string;
  urgente: boolean;
  /** 🔴 TRES estados, jamás un boolean: `'si' | 'no' | 'no_se_sabe'`. */
  convivePerros: Convivencia;
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
  /** Sólo trae los declarados `'si'`: **`no_se_sabe` no cuenta como sí**, que
   *  es la diferencia entera entre este vocabulario y el binario que reemplaza. */
  esterilizado?: boolean;
  convivePerros?: Convivencia;
  conviveGatos?: Convivencia;
  conviveNinos?: Convivencia;
  conPareja?: boolean;
  ciudadId?: string;
  countryCode?: string;
  /**
   * S112-A · los animales de UN publicador — la vitrina del refugio.
   *
   * 🔴 **Se filtra acá y jamás en el cliente.** La lista es keyset paginada:
   * quedarse con los de un refugio dentro de la página que tocó mostraría
   * *«tres de sus animales»* sobre un refugio que tiene doce, **y se vería
   * completa**. Es el id de `publicadorId` del propio `Adoptable`.
   */
  publicadorId?: string;
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
    esterilizado: aConvivencia(f.esterilizado),
    salud: (() => {
      const sd = (f.salud ?? {}) as Record<string, unknown>;
      return {
        vacunas: aConvivencia(sd.vacunas),
        esterilizado: aConvivencia(sd.esterilizado),
        desparasitado: aConvivencia(sd.desparasitado),
      };
    })(),
    esperaDias: Number.isFinite(num('espera_dias')) ? num('espera_dias') : 0,
    ingresadoEn: txt('ingresado_en') ?? '',
    urgente: f.urgente === true,
    convivePerros: aConvivencia(f.convive_perros),
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
  if (f.publicadorId !== undefined) p_filtros.publicador_id = f.publicadorId;
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

/** Un animal del refugio, **en cualquier estado**. Es lo que la vidriera NO
 *  puede devolver: un borrador no sale ahí, ni debe. */
export interface MiAdoptable {
  publicacionId: string;
  mascotaId: string;
  nombre: string;
  especie: string;
  fotoUrl: string | null;
  ingresadoEn: string;
  esperaDias: number;
  /** `'en_proceso'` = **aceptada con menos de DOS firmas**. Vivía en la letra
   *  del founder (§4.2) y ninguna pantalla podía pasarlo con verdad hasta que
   *  existió el motor de firmas: `solicitudesVivas` cuenta «hay gente
   *  escribiendo», no «esta adopción está en curso». */
  estado: EstadoAdoptable | 'memorial';
  puedePublicar: boolean;
  /** 🔴 CÓDIGO, no frase — la pantalla lo traduce con el riel (`D-539`).
   *  **`null` SÓLO cuando de verdad puede publicar**: si no puede, la pantalla
   *  tiene garantizado un motivo, que es lo que `TarjetaMascotaRefugio` exige
   *  para poder dibujar el interruptor (un interruptor bloqueado y mudo no
   *  compila). */
  motivoNoPublica:
    | 'adoptable_no_esterilizado'
    | 'edad_no_declarada'
    | 'animal_en_memorial'
    | null;
  fotos: number;
  solicitudesVivas: number;
}

/** Los animales del refugio, en TODOS los estados y **ordenados por lo que pide
 *  acción**: borrador arriba, memorial abajo. El orden lo decide el motor y no
 *  la pantalla, para que las dos apps digan lo mismo. */
export async function obtenerMisAdoptables(): Promise<
  ResultadoWrapper<MiAdoptable[], CodigoErrorAdopcion>
> {
  const { data, error } = await getClient().rpc('obtener_mis_adoptables');
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  const out: MiAdoptable[] = [];
  for (const v of data as Record<string, unknown>[]) {
    if (typeof v.publicacion_id !== 'string' || typeof v.mascota_id !== 'string') {
      return fallaCodigo('datos_inconsistentes');
    }
    const mv = v.motivo_no_publica;
    out.push({
      publicacionId: v.publicacion_id,
      mascotaId: v.mascota_id,
      nombre: typeof v.nombre === 'string' ? v.nombre : '',
      especie: typeof v.especie === 'string' ? v.especie : '',
      fotoUrl: typeof v.foto_url === 'string' ? v.foto_url : null,
      ingresadoEn: String(v.ingresado_en ?? ''),
      esperaDias: Number(v.espera_dias ?? 0),
      estado: String(v.estado ?? 'borrador') as MiAdoptable['estado'],
      puedePublicar: v.puede_publicar === true,
      motivoNoPublica:
        mv === 'adoptable_no_esterilizado' || mv === 'edad_no_declarada' || mv === 'animal_en_memorial'
          ? mv
          : null,
      fotos: Number(v.fotos ?? 0),
      solicitudesVivas: Number(v.solicitudes_vivas ?? 0),
    });
  }
  return { ok: true, data: out };
}

/** La ficha COMPLETA de un animal propio, **en cualquier estado**.
 *
 *  🔴 Existe porque `obtenerAdoptable` lee la vidriera y **rebota para un
 *  borrador** — que es exactamente el que hay que editar. Y sin poder leerlo,
 *  abrir el formulario vacío sobre `actualizarAdoptable` (que acepta `Partial`)
 *  **borra la historia del animal con un solo guardado**. Lo midió C y frenó la
 *  pantalla antes de montarla; ésta es la mitad que le faltaba.
 *
 *  Función aparte y no un brazo de la pública: *la vidriera es anónima, y meterle
 *  una rama «si sos el dueño devolvé más» pondría un camino privilegiado adentro
 *  de la función que `anon` ejecuta.* */
export interface MiAdoptableFicha {
  publicacionId: string;
  mascotaId: string;
  nombre: string;
  especie: string;
  sexo: string | null;
  fechaNacimiento: string | null;
  fechaNacimientoPrecision: string | null;
  talla: string | null;
  esterilizado: Convivencia;
  microchip: string | null;
  remetfu: string | null;
  fotoUrl: string | null;
  estado: EstadoAdoptable | 'memorial';
  /** La `FichaEditable` **entera**, aunque algo sea `null`: con `Partial`, un
   *  campo ausente y uno vacío se guardan igual, y uno de los dos borra. */
  ficha: FichaEditable;
  /** Con su `fotoId`: reordenar y borrar necesitan el id, no la URL. */
  fotos: { fotoId: string; url: string; orden: number; path: string }[];
  veredictoPublicacion: VeredictoEsterilizacion;
}

export async function obtenerMiAdoptable(
  publicacionId: string,
): Promise<ResultadoWrapper<MiAdoptableFicha, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('obtener_mi_adoptable', {
    p_publicacion_id: publicacionId,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.publicacion_id !== 'string') return fallaCodigo('datos_inconsistentes');
  const f = (r.ficha ?? {}) as Record<string, unknown>;
  const v = (r.veredicto_publicacion ?? {}) as Record<string, unknown>;
  const t = (o: Record<string, unknown>, k: string) => (typeof o[k] === 'string' ? (o[k] as string) : null);
  const mv = v.motivo;
  return {
    ok: true,
    data: {
      publicacionId: r.publicacion_id,
      mascotaId: String(r.mascota_id ?? ''),
      nombre: t(r, 'nombre') ?? '',
      especie: t(r, 'especie') ?? '',
      sexo: t(r, 'sexo'),
      fechaNacimiento: t(r, 'fecha_nacimiento'),
      fechaNacimientoPrecision: t(r, 'fecha_nacimiento_precision'),
      talla: t(r, 'talla'),
      esterilizado: aConvivencia(r.esterilizado),
      microchip: t(r, 'microchip'),
      remetfu: t(r, 'remetfu'),
      fotoUrl: t(r, 'foto_url'),
      estado: String(r.estado ?? 'borrador') as EstadoAdoptable | 'memorial',
      ficha: {
        ingresadoEn: t(f, 'ingresado_en') ?? '',
        ciudadId: t(f, 'ciudad_id'),
        zona: t(f, 'zona'),
        senas: t(f, 'senas'),
        origenRescate: (t(f, 'origen_rescate') as 'rescate' | 'cesion' | null) ?? null,
        fechaCesion: t(f, 'fecha_cesion'),
        estadoVacunal: (t(f, 'estado_vacunal') as FichaEditable['estadoVacunal']) ?? null,
        desparasitado: f.desparasitado == null ? null : aConvivencia(f.desparasitado),
        urgente: f.urgente === true,
        bonoMonto: f.bono_monto == null ? null : Number(f.bono_monto),
        bonoDestino: t(f, 'bono_destino'),
        historia: t(f, 'historia'),
        convivePerros: aConvivencia(f.convive_perros),
        conviveGatos: aConvivencia(f.convive_gatos),
        conviveNinos: aConvivencia(f.convive_ninos),
        parejaId: t(f, 'pareja_id'),
      },
      fotos: Array.isArray(r.fotos)
        ? (r.fotos as Record<string, unknown>[]).flatMap((x) =>
            typeof x.foto_id === 'string'
              ? [{
                  fotoId: x.foto_id,
                  url: String(x.url ?? ''),
                  orden: Number(x.orden ?? 0),
                  path: String(x.path ?? ''),
                }]
              : [],
          )
        : [],
      veredictoPublicacion: {
        puede: v.puede === true,
        motivo: mv === 'adoptable_no_esterilizado' || mv === 'edad_no_declarada' ? mv : null,
        requiereCompromiso: v.requiere_compromiso === true,
        edadMeses: typeof v.edad_meses === 'number' ? v.edad_meses : null,
        detalle: typeof v.detalle === 'string' ? v.detalle : null,
      },
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

export type EstadoAdoptable =
  | 'borrador'
  | 'publicada'
  | 'pausada'
  /** 🔴 Sale de la FILA, no de un cálculo del lector. Antes era derivado y **la
   *  fila seguía diciendo `publicada`**, así que el animal seguía en la vidriera
   *  y la puerta de postular seguía abierta con una adopción en curso.
   *  Lo escribe aceptar la solicitud; lo saca declinarla sin firmas. */
  | 'en_proceso'
  | 'adoptada'
  | 'no_disponible';

/** El veredicto de la regla de los seis meses (OM 019 art. 6.7), **antes** de
 *  intentar publicar. Existe para que el interruptor de la tarjeta pueda decir
 *  POR QUÉ está apagado sin tener que provocar un rebote — *un control apagado
 *  sin razón a la vista es el defecto* (§2 del loop).
 *
 *  Los tres motivos son distintos a propósito: `edad_no_declarada` **no se
 *  disfraza** de `adoptable_no_esterilizado`, porque mandaría al refugio a
 *  esterilizar cuando lo que falta es otra cosa. */
export interface VeredictoEsterilizacion {
  puede: boolean;
  motivo: 'adoptable_no_esterilizado' | 'edad_no_declarada' | null;
  /** Un cachorro pasa, **y el compromiso viaja de vuelta**: dejarlo pasar sin
   *  nombrarlo convertiría una obligación legal en un olvido. */
  requiereCompromiso: boolean;
  edadMeses: number | null;
  detalle: string | null;
}

export async function evaluarEsterilizacionAdoptable(
  publicacionId: string,
): Promise<ResultadoWrapper<VeredictoEsterilizacion, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('evaluar_esterilizacion_adoptable', {
    p_publicacion_id: publicacionId,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  const m = r.motivo;
  return {
    ok: true,
    data: {
      puede: r.puede === true,
      motivo:
        m === 'adoptable_no_esterilizado' || m === 'edad_no_declarada' ? m : null,
      requiereCompromiso: r.requiere_compromiso === true,
      edadMeses: typeof r.edad_meses === 'number' ? r.edad_meses : null,
      detalle: typeof r.detalle === 'string' ? r.detalle : null,
    },
  };
}

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
export type EstadoSolicitudAdopcion =
  | 'recibida'
  | 'en_conversacion'
  | 'aceptada'
  | 'declinada'
  /** La familia se bajó. **No es `declinada`**: declinar es del publicador. */
  | 'desistida'
  /** 🟢 El animal falleció (firma del founder, 2-sep). Estado propio y no
   *  `declinada` porque **acá no decidió nadie** — reusarla le diría a la
   *  familia «el refugio no continuó con tu postulación» sobre algo que el
   *  refugio no eligió. Su voz es de duelo y **no invita a otro animal** (D-3). */
  | 'no_concretada_fallecimiento'
  /** 🟢 **El animal fue adoptado por otra familia** (S112-A). Estado propio y
   *  no `declinada` por la MISMA razón que el de fallecimiento: **acá nadie
   *  la evaluó**. Reusar `declinada` le diría a esa persona *«el refugio te
   *  evaluó y siguió con otra»* sobre algo que el refugio nunca decidió sobre
   *  ella. La voz va sin duelo y **sin invitación a otro animal**. */
  | 'no_concretada_otra_familia';

/**
 * 🔴 **PARSE, NO CAST.** Hasta S112 esto era `as EstadoSolicitudAdopcion`, y un
 * `as` **no verifica nada**: cuando el motor ganó su séptimo estado, la unión
 * siguió declarando seis y **ningún typecheck lo vio**. *Una fila con un valor
 * que el tipo no conoce llegaba tipada como si lo fuera*, y la pantalla que
 * enumeraba los terminales por nombre la hacía **desaparecer en silencio** —
 * lo midió C sobre su propio arreglo, no un gate.
 *
 * ⚠️ **Devuelve `null` sobre lo desconocido en vez de adivinar.** El llamador
 * decide: la lista lo trata como `datos_inconsistentes`. *Caer a un estado
 * plausible sería exactamente el defecto que este parse existe para cerrar.*
 *
 * La lista vive acá y **no se deriva del tipo**: TypeScript no puede
 * enumerar una unión en runtime. Si el motor gana un octavo estado y esta
 * lista no crece, el parse lo RECHAZA — ruidoso, que es lo que se quiere.
 */
const ESTADOS_SOLICITUD: readonly EstadoSolicitudAdopcion[] = [
  'recibida', 'en_conversacion', 'aceptada', 'declinada', 'desistida',
  'no_concretada_fallecimiento', 'no_concretada_otra_familia',
];

function parseEstadoSolicitud(v: unknown): EstadoSolicitudAdopcion | null {
  return typeof v === 'string'
    && (ESTADOS_SOLICITUD as readonly string[]).includes(v)
    ? (v as EstadoSolicitudAdopcion)
    : null;
}


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
  /**
   * La cuenta comercial del refugio — **con esto la cabecera LLEVA**:
   * `obtenerPerfilesPublicosPorCuenta([id])` abre su vitrina.
   * *Un nombre sin id es una etiqueta, no una puerta.*
   */
  publicadorCuentaId: string | null;
  /** RUTA de Storage, se firma en pantalla (`D-308`). `null` = sin logo. */
  publicadorFoto: string | null;
  /**
   * Mensajes que esta familia no leyó, **contados en el servidor**.
   *
   * ⚠️ Nació sin declararse: el mapeador ya lo devolvía y **el typecheck pasó
   * igual** — el chequeo de propiedades de más no lo cazó, así que `MiSolicitud`
   * decía menos de lo que la función entregaba. *Un tipo que declara de menos
   * no rompe nada: esconde un dato que ya está viajando.*
   */
  sinLeer: number;
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
  /** Para resolver la cara de la casa: sin ella el refugio ve la huella
   *  genérica donde la familia ve la cara — la misma solicitud, dos caras. */
  mascotaEspecie: string | null;
  mascotaFotoUrl: string | null;
  /**
   * Mensajes que esta persona no leyó. **Lo cuenta el SERVIDOR** — derivarlo
   * acá obligaría a traer los mensajes de todos los hilos para contar los de
   * cada uno: *funciona hasta el día que la lista pagine* (argumento de C).
   * Sin fila de lectura, **todo cuenta**: nunca abrió el hilo. Los propios no
   * cuentan — *nadie tiene mensajes sin leer de sí mismo.*
   */
  sinLeer: number;
  /**
   * Las respuestas del formulario — **«Ver postulación»**. Sólo llegan al
   * refugio del animal solicitado: la misma puerta que decide quién ve el hilo
   * decide esto. *Un guard aparte sería una segunda regla que puede divergir
   * de la que ya manda.* Esquema cerrado: **no admite nombres ni edades
   * exactas de menores** (§5.9, CHECK en la tabla).
   */
  respuestas: Record<string, unknown> | null;
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
/** Las respuestas del formulario. **Esquema CERRADO**: una clave que no esté
 *  acá rebota con `respuesta_no_valida` **nombrándola**.
 *
 *  🔴 Los menores se cuentan **por rango, jamás por nombre ni edad exacta**
 *  (§5.9). Y no es una convención de esta interfaz: el motor rechaza
 *  `hogar.nombre_menor` y la tabla tiene un CHECK que lo hace inexpresable
 *  también por fuera de la puerta. *Si se ignorara en silencio, la casa
 *  guardaría datos de un menor que nadie autorizó a guardar.* */
export interface RespuestasPostulacion {
  hogar: {
    /** Al menos 1: un hogar de puros menores no es un hogar. */
    adultos: number;
    menores_0_5: number;
    menores_6_12: number;
    menores_13_17: number;
  };
  vivienda: 'casa_con_patio' | 'casa_sin_patio' | 'departamento' | 'otro';
  otros_animales?: string;
  /** Horas al día que el animal estaría solo. 0-24. */
  horas_solo: number;
  experiencia?: string;
  /** Obligatorio: «por qué este animal». */
  motivo: string;
}

/** Postula. **Tres compuertas, y las tres explican:**
 *  · `condiciones_no_aceptadas` — falta leer y aceptar las condiciones;
 *  · `respuesta_no_valida: <campo>` — con el nombre, para llevar al campo;
 *  · `tope_de_solicitudes: <n>` y `solicitud_ya_viva: <id>` — N1, y el segundo
 *    **lleva el id** para que la pantalla lleve ahí en vez de decir que no.
 *
 *  `aceptacionId` es opcional: **el servidor la resuelve solo**. Si la mandás y
 *  no es tuya, rebota — *creerle a la pantalla dejaría la solicitud apuntando a
 *  la aceptación de otra persona.* */
export async function crearSolicitudAdopcion(params: {
  publicacionId: string;
  respuestas: RespuestasPostulacion;
  aceptacionId?: string;
  mensajeInicial?: string;
}): Promise<
  ResultadoWrapper<
    { solicitudId: string; estado: EstadoSolicitudAdopcion; solicitudesVivas: number },
    CodigoErrorAdopcion
  >
> {
  const { data, error } = await getClient().rpc('crear_solicitud_adopcion', {
    p_publicacion_id: params.publicacionId,
    p_respuestas: comoJson(params.respuestas as unknown as Record<string, unknown>),
    p_aceptacion_id: params.aceptacionId ?? undefined,
    p_mensaje_inicial: params.mensajeInicial ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.solicitud_id !== 'string') return fallaCodigo('datos_inconsistentes');
  const e0 = parseEstadoSolicitud(r.estado);
  if (e0 === null) return fallaCodigo('datos_inconsistentes');
  return {
    ok: true,
    data: {
      solicitudId: r.solicitud_id,
      estado: e0,
      solicitudesVivas: Number(r.solicitudes_vivas ?? 1),
    },
  };
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
  const e1 = parseEstadoSolicitud(r.estado);
  if (e1 === null) return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { mensajeId: r.mensaje_id, estado: e1 } };
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
  const e2 = parseEstadoSolicitud((data as Record<string, unknown>).estado);
  if (e2 === null) return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { estado: e2 } };
}

/** Mis solicitudes, con sus hilos. Lado FAMILIA. */
export async function obtenerMisSolicitudesAdopcion(): Promise<
  ResultadoWrapper<MiSolicitud[], CodigoErrorAdopcion>
> {
  const { data, error } = await getClient().rpc('obtener_mis_solicitudes_adopcion');
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  const filas = data as Record<string, unknown>[];
  /* 🔴 EL PRE-PASE: si UNA fila trae un estado que este paquete no conoce,
     rebota la lista entera. *Una lista que se dibuja sin una de sus filas no
     avisa de nada* — así desapareció en silencio la del séptimo estado. */
  if (filas.some((f) => parseEstadoSolicitud(f.estado) === null)) {
    return fallaCodigo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: filas.map((f) => ({
      solicitudId: String(f.solicitud_id),
      publicacionId: String(f.publicacion_id),
      /* `!` seguro: el pre-pase de arriba ya rebotó si alguno era `null`.
         *El rebote es de la LISTA ENTERA y no de la fila: una lista a la que
         le falta una solicitud sin decirlo es peor que una lista que falla* —
         es exactamente cómo desapareció la fila del séptimo estado. */
      estado: parseEstadoSolicitud(f.estado)!,
      creadaEn: String(f.creada_en),
      cerradaEn: typeof f.cerrada_en === 'string' ? f.cerrada_en : null,
      mascotaId: String(f.mascota_id),
      mascotaNombre: typeof f.mascota_nombre === 'string' ? f.mascota_nombre : '',
      mascotaEspecie: typeof f.mascota_especie === 'string' ? f.mascota_especie : '',
      mascotaFotoUrl: typeof f.mascota_foto_url === 'string' ? f.mascota_foto_url : null,
      publicadorNombre: typeof f.publicador_nombre === 'string' ? f.publicador_nombre : null,
      sinLeer: Number(f.sin_leer ?? 0),
      publicadorCuentaId:
        typeof f.publicador_cuenta_id === 'string' ? f.publicador_cuenta_id : null,
      publicadorFoto: typeof f.publicador_foto === 'string' ? f.publicador_foto : null,
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
  const filas = data as Record<string, unknown>[];
  /* 🔴 EL PRE-PASE: si UNA fila trae un estado que este paquete no conoce,
     rebota la lista entera. *Una lista que se dibuja sin una de sus filas no
     avisa de nada* — así desapareció en silencio la del séptimo estado. */
  if (filas.some((f) => parseEstadoSolicitud(f.estado) === null)) {
    return fallaCodigo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: filas.map((f) => ({
      solicitudId: String(f.solicitud_id),
      publicacionId: String(f.publicacion_id),
      /* `!` seguro: el pre-pase de arriba ya rebotó si alguno era `null`.
         *El rebote es de la LISTA ENTERA y no de la fila: una lista a la que
         le falta una solicitud sin decirlo es peor que una lista que falla* —
         es exactamente cómo desapareció la fila del séptimo estado. */
      estado: parseEstadoSolicitud(f.estado)!,
      creadaEn: String(f.creada_en),
      cerradaEn: typeof f.cerrada_en === 'string' ? f.cerrada_en : null,
      solicitanteUserId: String(f.solicitante_user_id),
      solicitanteNombre: typeof f.solicitante_nombre === 'string' ? f.solicitante_nombre : null,
      mascotaId: String(f.mascota_id),
      mascotaNombre: typeof f.mascota_nombre === 'string' ? f.mascota_nombre : '',
      /* `null`, no `''`: la especie desconocida NO es una especie vacía — quien
         resuelva la cara tiene que poder distinguir «no la sé» de un valor. */
      mascotaEspecie: typeof f.mascota_especie === 'string' ? f.mascota_especie : null,
      mascotaFotoUrl: typeof f.mascota_foto_url === 'string' ? f.mascota_foto_url : null,
      sinLeer: Number(f.sin_leer ?? 0),
      respuestas:
        typeof f.respuestas === 'object' && f.respuestas !== null && !Array.isArray(f.respuestas)
          ? (f.respuestas as Record<string, unknown>)
          : null,
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


/* ═══════════════════════════════════════════════════════════════════════════
   ⑥ EL ACTA Y LA FIRMA — S112-A9 (Ley 67, arts. 13-14)
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ActaAdopcion {
  codigo: string;
  /** 🔴 **Viaja ida y vuelta por el servidor y la pantalla NO la escribe.** Si
   *  el acta cambia entre que se pide el código y se firma, `firmarActa` rebota
   *  con `acta_cambio_de_version`: *firmar con un código emitido sobre otro
   *  texto es firmar algo que no se leyó.* */
  version: number;
  textoRenderizado: string;
  /** El hash de ESTA acta, con estos nombres. **No es el de la plantilla**: dos
   *  actas distintas tendrían el mismo y el expediente no probaría cuál se
   *  firmó. El de la plantilla viaja al lado como `hashFuente`. */
  hashRenderizado: string;
  hashFuente: string;
  /** Los NOMBRES de las variables vacías. §4.1: «arriba del botón una lista con
   *  nombre: Falta tu cédula». Sólo `microchip` y `remetfu` tienen «si vacío» —
   *  las demás faltan de verdad y el acta no se firma sin ellas. */
  faltantes: string[];
  miPapel: 'adoptante' | 'refugio' | null;
  firmas: { papel: string; sello: string }[];
}

export async function obtenerActaAdopcion(
  solicitudId: string,
): Promise<ResultadoWrapper<ActaAdopcion, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('obtener_acta_adopcion', {
    p_solicitud_id: solicitudId,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.texto_renderizado !== 'string') return fallaCodigo('datos_inconsistentes');
  const p = r.mi_papel;
  return {
    ok: true,
    data: {
      codigo: String(r.codigo ?? ''),
      version: Number(r.version ?? 0),
      textoRenderizado: r.texto_renderizado,
      hashRenderizado: String(r.hash_renderizado ?? ''),
      hashFuente: String(r.hash_fuente ?? ''),
      faltantes: Array.isArray(r.faltantes) ? (r.faltantes as string[]) : [],
      miPapel: p === 'adoptante' || p === 'refugio' ? p : null,
      firmas: Array.isArray(r.firmas)
        ? (r.firmas as Record<string, unknown>[]).map((f) => ({
            papel: String(f.papel ?? ''),
            sello: String(f.sello ?? ''),
          }))
        : [],
    },
  };
}

/** Pide el código de firma. 🔴 **Devuelve A DÓNDE se mandó, jamás QUÉ se mandó.**
 *  El código sale sólo por correo y **no entra a la campana**: si volviera acá o
 *  apareciera en el centro de avisos, alguien con la sesión abierta firmaría sin
 *  abrir el correo — *y el código existe justamente para probar que controla ese
 *  correo.* No alcanzaba con que este wrapper lo borrara: la RPC es alcanzable
 *  por HTTP con la misma clave, así que la cura vive en el servidor. */
export async function solicitarCodigoFirma(
  solicitudId: string,
): Promise<ResultadoWrapper<{ enviadoA: string; expiraEn: string }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('solicitar_codigo_firma', {
    p_solicitud_id: solicitudId,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  return {
    ok: true,
    data: { enviadoA: String(r.enviado_a ?? ''), expiraEn: String(r.expira_en ?? '') },
  };
}

/** Firma. **La SEGUNDA firma válida hace el traspaso y escribe el hito, en la
 *  misma transacción** — la pantalla no lo llama después: *si tuviera que
 *  hacerlo, una adopción quedaría firmada por los dos y sin ocurrir cada vez que
 *  se corte la red.*
 *
 *  `cedula` y `domicilio` se cargan ACÁ, y se escriben ANTES de renderizar: §4.1
 *  pide un campo para cargarlos «ahí mismo», y renderizar antes daría un acta
 *  con los guiones que la persona acaba de completar. */
export async function firmarActaAdopcion(params: {
  solicitudId: string;
  codigo: string;
  cedula?: string;
  domicilio?: string;
  dispositivo?: string;
}): Promise<
  ResultadoWrapper<
    { papel: string; folio: string; firmas: number; completa: boolean },
    CodigoErrorAdopcion
  >
> {
  const { data, error } = await getClient().rpc('firmar_acta_adopcion', {
    p_solicitud_id: params.solicitudId,
    p_codigo: params.codigo,
    p_cedula: params.cedula ?? undefined,
    p_domicilio: params.domicilio ?? undefined,
    p_dispositivo: params.dispositivo ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;

  /* 🔴 LOS DOS CASOS DEL CÓDIGO VUELVEN COMO `{ok:false}`, NO COMO EXCEPCIÓN, y
     no es un capricho del motor: **un `RAISE` habría revertido el contador de
     intentos en la misma transacción** — que es exactamente el defecto que
     dejaba el OTP sin techo (los seis intentos decían «quedan 4»).
     *Un código mal tecleado no es una excepción: pasa todos los días.* */
  if (r.ok === false) {
    const m = r.motivo;
    const codigo: CodigoErrorAdopcion =
      m === 'intentos_agotados' ? 'intentos_agotados' : 'codigo_incorrecto';
    const quedan = Number(r.intentos_restantes ?? 0);
    return {
      ok: false,
      codigo,
      mensaje:
        codigo === 'codigo_incorrecto'
          ? `${MENSAJES.codigo_incorrecto} Te ${quedan === 1 ? 'queda' : 'quedan'} ${quedan} ${quedan === 1 ? 'intento' : 'intentos'}.`
          : MENSAJES.intentos_agotados,
      detalle: null,
    };
  }

  return {
    ok: true,
    data: {
      papel: String(r.papel ?? ''),
      folio: String(r.folio ?? ''),
      firmas: Number(r.firmas ?? 0),
      completa: r.completa === true,
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ⑦ DESISTIR Y REPORTAR — S112-A10
   ═══════════════════════════════════════════════════════════════════════════ */

/** La familia retira su postulación. **`desistida` es un estado propio, no
 *  `declinada`**: declinar es del publicador y desistir es de la familia, y
 *  reusar el mismo haría que el refugio viera «yo la decliné» sobre alguien que
 *  se fue solo. El hilo queda en lectura para los dos. */
export async function desistirSolicitudAdopcion(
  solicitudId: string,
): Promise<ResultadoWrapper<{ estado: string }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('desistir_solicitud_adopcion', {
    p_solicitud_id: solicitudId,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { estado: String((data as Record<string, unknown>).estado ?? '') } };
}

export type MotivoReporte =
  | 'maltrato'
  | 'venta_encubierta'
  | 'datos_falsos'
  | 'no_es_adopcion'
  | 'otro';

/** Reporta una publicación. 🔴 **El refugio NO puede ver quién lo reportó** — no
 *  está en la policy de lectura, y ése es el punto entero: *un reporte cuyo
 *  autor el reportado puede ver no es un reporte, es una confrontación.*
 *
 *  Idempotente y hablada: el segundo toque devuelve el que ya existe. Sobre un
 *  acto delicado, un error técnico se lee como «no se pudo denunciar». */
export async function reportarPublicacion(params: {
  publicacionId: string;
  motivo: MotivoReporte;
  detalle?: string;
}): Promise<ResultadoWrapper<{ reporteId: string; yaExistia: boolean }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('reportar_publicacion', {
    p_publicacion_id: params.publicacionId,
    p_motivo: params.motivo,
    p_detalle: params.detalle ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.reporte_id !== 'string') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { reporteId: r.reporte_id, yaExistia: r.ya_existia === true } };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ⑧ LAS FOTOS EN STORAGE — S112-A (pedido de C)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Sube la foto al bucket. 🔴 **El `path` lo arma ESTE wrapper, jamás la
 *  pantalla**: la carpeta `<publicacionId>/` **es lo que la policy del bucket
 *  mira** para decidir de quién es el archivo. Compuesto acá, no se puede
 *  escribir mal; compuesto en una plantilla de string, cualquiera lo tipea
 *  distinto y el rebote llega en el aparato.
 *
 *  `upsert:false` a propósito: dos subidas nunca pisan la misma foto, y el
 *  nombre lleva el instante. */
export async function subirFotoAdoptable(
  publicacionId: string,
  bytes: ArrayBuffer,
  contentType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
): Promise<ResultadoWrapper<{ path: string }, CodigoErrorAdopcion>> {
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const path = `${publicacionId}/foto-${Date.now()}.${ext}`;
  const { error } = await getClient().storage.from('adopcion-fotos').upload(path, bytes, {
    contentType,
    upsert: false,
  });
  if (error) return fallo(error.message);
  return { ok: true, data: { path } };
}

/** Borra el ARCHIVO del bucket. **Es la gemela de `borrarFotoAdoptable`**, que
 *  borra la FILA y devuelve el `pathABorrar`.
 *
 *  🔴 Las dos viven acá, del mismo lado, a pedido de C y con su razón: si la
 *  pantalla tuviera que llamar a las dos, **puede olvidarse de la mitad** — y la
 *  mitad que se olvida deja un huérfano **público y alcanzable por URL**, la
 *  misma clase que `D-731`. Usalas siempre en par:
 *  `const r = await borrarFotoAdoptable(id); if (r.ok) await borrarFotoAdoptableDeStorage(r.data.pathABorrar);` */
export async function borrarFotoAdoptableDeStorage(
  path: string,
): Promise<ResultadoWrapper<{ path: string }, CodigoErrorAdopcion>> {
  const { error } = await getClient().storage.from('adopcion-fotos').remove([path]);
  if (error) return fallo(error.message);
  return { ok: true, data: { path } };
}


/* ═══════════════════════════════════════════════════════════════════════════
   A6 · EL EDITOR DE LA VITRINA DEL REFUGIO
   ═══════════════════════════════════════════════════════════════════════════ */

export interface VitrinaRefugioGuardada {
  prestadorId: string;
  cuentaComercialId: string;
  /** `true` si la fila del prestador nació en esta llamada. */
  creada: boolean;
  /** `true` si hay portada cargada. La vitrina se ve pobre sin ella. */
  tienePortada: boolean;
  /**
   * 🔴 `true` **sólo si hay historia**. El nombre y el logo NO cuentan: los
   * tiene por existir; *la vitrina es lo que el refugio ARMÓ.* Es el mismo
   * criterio con el que `packages/ui` hizo obligatoria `vozSinPagina`, así que
   * las dos piezas dicen lo mismo sin que nadie las sincronice.
   */
  tienePagina: boolean;
}

/**
 * Crea o actualiza la vitrina pública del refugio.
 *
 * ⚠️ **Sólo se manda lo que se tocó.** El motor hace `COALESCE`: *lo que no se
 * manda no se borra.* Pasar el formulario entero con `undefined` en lo vacío
 * está bien; pasar `null` explícito NO borra — tampoco escribe.
 *
 * 🔴 **Los dos rechazos son códigos distintos y se ramifican por `codigo`**
 * (regla 35), porque se resuelven distinto: `no_sos_refugio` se destraba
 * pidiendo la verificación; `ya_tenes_prestador` **no lo destraba nadie hoy**
 * — es una persona que ya tiene otro oficio, y su `detalle` dice cuál.
 */
export async function poblarVitrinaRefugio(campos: {
  historia?: string;
  ciudad?: string;
  zona?: string;
  /** RUTA devuelta por `subirImagenVitrinaRefugio('logo', …)`. */
  logoUrl?: string;
  /** RUTA devuelta por `subirImagenVitrinaRefugio('portada', …)`. */
  portadaUrl?: string;
}): Promise<ResultadoWrapper<VitrinaRefugioGuardada, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('poblar_vitrina_refugio', {
    p_historia: campos.historia ?? undefined,
    p_ciudad: campos.ciudad ?? undefined,
    p_zona: campos.zona ?? undefined,
    p_logo_url: campos.logoUrl ?? undefined,
    p_portada_url: campos.portadaUrl ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.prestador_id !== 'string' || typeof r.cuenta_comercial_id !== 'string') {
    return fallaCodigo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      prestadorId: r.prestador_id,
      cuentaComercialId: r.cuenta_comercial_id,
      creada: r.creada === true,
      tienePagina: r.tiene_pagina === true,
      tienePortada: r.tiene_portada === true,
    },
  };
}


/* ═══════════════════════════════════════════════════════════════════════════
   A6 · BUSCAR UN REFUGIO POR NOMBRE — *«y en adopción puedo buscar un refugio
   por nombre y ver sus animales»* (literal del founder).
   ═══════════════════════════════════════════════════════════════════════════ */

export interface RefugioEnBusqueda {
  /** Con esto se pide su vitrina: `obtenerPerfilesPublicosPorCuenta([id])`. */
  cuentaComercialId: string;
  prestadorId: string;
  nombre: string;
  /** RUTA de Storage, no URL: se firma en pantalla (`D-308`). */
  logoUrl: string | null;
  ciudad: string | null;
}

/**
 * Refugios por nombre. **Anónima por firma** — la vidriera de adopción no
 * exige sesión.
 *
 * 🔴 **El recorte `tipo='refugio'` vive en el SERVIDOR y no acá.** Filtrarlo
 * en la pantalla se vería igual de bien y convertiría esto en *un directorio
 * público de todos los prestadores* —clínicas, paseadores, groomers—
 * buscables por nombre y sin sesión. *No sería una fuga (la vista ya es
 * pública) sino una decisión de producto que nadie tomó*, y de las que se
 * descubren cuando alguien la usa. (Riesgo nombrado por C antes de que
 * pasara.)
 *
 * ⚠️ **Sin texto devuelve el directorio** (con techo de 100). Y **devuelve
 * refugios sin animales publicados a propósito**: *un buscador que sólo
 * encuentra a los que tienen stock le esconde a la familia justo a los que
 * necesitan que los encuentren.*
 *
 * Los acentos se normalizan **en los dos lados, en el motor** — «SATORÍ»
 * encuentra «Satori» y al revés. Cierra el hueco que `despensa-catalogo` dejó
 * declarado por no poder resolverlo desde el cliente.
 */
export async function buscarRefugios(
  texto?: string,
  limite = 20,
): Promise<ResultadoWrapper<RefugioEnBusqueda[], CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('buscar_refugios', {
    p_texto: texto ?? undefined,
    p_limite: limite,
  });
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  return {
    ok: true,
    data: (data as Record<string, unknown>[]).map((f) => ({
      cuentaComercialId: String(f.cuenta_comercial_id),
      prestadorId: String(f.prestador_id),
      nombre: String(f.nombre ?? ''),
      logoUrl: typeof f.logo_url === 'string' ? f.logo_url : null,
      ciudad: typeof f.ciudad === 'string' ? f.ciudad : null,
    })),
  };
}


/* ═══ EL HILO: marcar leído y la respuesta automática del refugio ═══ */

/**
 * Marca el hilo como leído **hasta su último mensaje**, no hasta `now()`:
 * *anclar al reloj marcaría leído un mensaje que llegue en el mismo instante
 * y nadie vio.* Nunca retrocede — releer lo viejo no vuelve nuevo lo leído.
 *
 * Se llama **al abrir el hilo**. Sin esto el contador sólo sube, *y un número
 * que sólo sube es peor que ninguno.*
 */
export async function marcarHiloLeido(
  solicitudId: string,
): Promise<ResultadoWrapper<{ leidoHasta: string | null }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('marcar_hilo_leido', {
    p_solicitud_id: solicitudId,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  return {
    ok: true,
    data: { leidoHasta: typeof r.leido_hasta === 'string' ? r.leido_hasta : null },
  };
}

/**
 * El texto que el refugio le manda automáticamente a quien postula.
 *
 * 🔴 **El texto es del refugio, jamás de la casa.** Si la app lo inventara, le
 * pondría palabras en la boca a un refugio que no las escribió — y esa frase
 * la lee una familia creyendo que se la escribieron a ella.
 *
 * ⚠️ **Vaciarlo lo RETIRA** (mandá `''` o nada). Sin texto no hay mensaje
 * automático, y está bien: el hilo igual tiene el de quien postula, así que
 * no nace vacío. *Un saludo genérico de la plataforma enseña que el refugio
 * contestó cuando no contestó.*
 *
 * El mensaje que nace queda **atribuido a la persona del refugio**, no a «la
 * casa»: `adopcion_mensaje` no admite un mensaje sin autor, y tiene razón —
 * alguien escribió ese texto. `automatica` dice **cómo se envió**.
 */
export async function definirRespuestaAutomaticaRefugio(
  cuerpo: string,
): Promise<ResultadoWrapper<{ activa: boolean }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('definir_respuesta_automatica_refugio', {
    p_cuerpo: cuerpo,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { activa: (data as Record<string, unknown>).activa === true } };
}


/**
 * Sube la portada o el logo de la vitrina del refugio.
 *
 * 🔴 **El `path` lo arma ESTE wrapper, jamás la pantalla** — mismo criterio
 * que `subirFotoAdoptable`. *Si la pantalla eligiera el path, la policy sería
 * lo único entre una carpeta ajena y un archivo, y una policy es una defensa,
 * no un diseño.*
 *
 * ⚠️ **Devuelve la RUTA, no una URL.** El bucket es público, así que la
 * pantalla la resuelve con el helper de la casa; **el motor guarda la ruta**.
 * *Guardar una URL absoluta ata el dato al dominio de hoy.*
 *
 * ⚠️ **Redimensioná ANTES de llamar.** El bucket tiene techo de 5 MB y la
 * cámara de un teléfono lo pasa: *una subida que rebota por tamaño se lee como
 * «no anda», no como «achicá la foto».*
 */
export async function subirImagenVitrinaRefugio(
  cuentaComercialId: string,
  tipo: 'portada' | 'logo',
  bytes: ArrayBuffer,
  contentType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
): Promise<ResultadoWrapper<{ path: string }, CodigoErrorAdopcion>> {
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  /* `vitrina/<cuenta>/…` — el prefijo que la policy exige. El sello de tiempo
     evita pisar la anterior mientras la vista pública todavía la sirve. */
  const path = `vitrina/${cuentaComercialId}/${tipo}-${Date.now()}.${ext}`;
  const { error } = await getClient().storage.from('adopcion-fotos').upload(path, bytes, {
    contentType,
    upsert: false,
  });
  if (error) return fallo(error.message);
  return { ok: true, data: { path } };
}
