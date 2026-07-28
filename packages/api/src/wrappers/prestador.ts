// Lectura del prestador propio (S44-B4.1). Puerta única: la RLS de
// prestadores (SELECT propio por user_id) es el guard.
//
// S75-A1 (R1) — EL RESOLVEDOR DEJA DE SER SOLO-TITULAR. Hasta S74 este
// wrapper resolvía EXCLUSIVAMENTE por `prestadores.user_id`, y por eso
// las 26 pantallas que cuelgan de él le decían "no tenés prestador" a
// un empleado real del negocio (D-512: el motor entiende de empleados;
// la app todavía no). Dos pasos, CERO cambio de RLS:
//   (1) titularidad — la fila propia por `user_id` (lo de siempre);
//   (2) si no hay, el VÍNCULO ACTIVO: `prestador_empleados` por
//       `user_id` + `activo = true` → `prestador_id` → la fila por `id`.
// La RLS ya cubre las dos patas y se verificó con el literal de las
// policies (no se dedujo):
//   · `empleados_self` [SELECT] USING (user_id = auth.uid()) — el
//     empleado lee SUS propias filas de vínculo.
//   · `prestadores_public` [SELECT] USING (estado = 'activo' OR
//     user_id = auth.uid() OR is_admin()) — el empleado lee la fila
//     del negocio porque está ACTIVO, no porque sea suya.
// BORDE DECLARADO (consecuencia del literal de arriba, no del código):
// un empleado de un negocio que NO está en estado 'activo' (hoy vive
// uno: "Carlos", en_revision) cae en `sin_prestador`. Es honesto — ese
// negocio todavía no opera —, y curarlo sería tocar RLS, que este paso
// NO hace.
// ORDEN DETERMINISTA: titularidad primero; después, el vínculo activo
// MÁS ANTIGUO (`created_at ASC`, columna NOT NULL). v1 asume UN negocio
// por persona; el borde de dos negocios NO rompe (elige el más antiguo,
// siempre el mismo) pero pide una superficie de selección — v2.
// LO QUE ESTE PASO NO HACE: no resuelve `obtenerMiCuentaComercial` (R2,
// por `owner_profile_id`, fuera del v1 por decisión founder) y no
// gatea nada por rol — la identidad no es permiso (D-490/D-513).

import { getClient, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';
import type { Database } from '../database.types';

const CODIGOS_ERROR_PRESTADOR = ['sin_sesion', 'sin_prestador'] as const;
export type CodigoErrorPrestador = (typeof CODIGOS_ERROR_PRESTADOR)[number];

// S79-T4.1: los códigos de la SEDE son del camino de ESCRITURA — viven
// en su propio union para no ensanchar el de lectura (fees.ts subsume
// los códigos de R1 como subconjunto; agrandar el de lectura rompería
// esa relación por un error que la lectura jamás produce).
export type CodigoErrorPerfilPrestador =
  | CodigoErrorPrestador
  | 'coordenadas_invalidas'
  | 'radio_invalido';

const MENSAJES: Record<CodigoErrorPerfilPrestador | 'error_desconocido' | 'datos_inconsistentes', string> = {
  sin_sesion:            'No hay sesión activa.',
  sin_prestador:         'Tu usuario no tiene un prestador asociado.',
  coordenadas_invalidas: 'La ubicación no es válida. Buscá la dirección de nuevo.',
  radio_invalido:        'El radio de cobertura no es válido.',
  datos_inconsistentes:  'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:     'Ocurrió un error inesperado. Probá de nuevo.',
};

// S58-B (hunk aditivo): country_code entra al contrato — la fuente ya
// era clara (fees.ts lo lee de la MISMA tabla); las zonas del taller
// filtran el catálogo por el país del prestador.
// S59-B5 (hunk aditivo): direccion/ciudad (la fila "Dónde" del mundo
// grooming — solo lectura de la sede) + grooming_extra_pelaje_largo
// (UN extra del prestador, NULL honesto — fundación S59-A3).
// S60-B2 (hunk aditivo): la sección ENTIDAD de Cuenta·Tu perfil (P17
// v1.1, visto del arquitecto): descripcion + contacto (editables) y
// estado (solo lectura; el admin lo gobierna).
// S61 domicilio v1 (hunk aditivo): grooming_recargo_domicilio — el
// espejo del extra de pelaje (numeric NULL honesto, CHECK >= 0).
// S75-A1 (hunk aditivo): cuenta_comercial_id — lo que `fees.ts` leía
// con su PROPIA consulta por `user_id`; al entrar acá, C1 pasa a
// CONSUMIR este resolvedor en vez de duplicarlo (L-150: una sola
// verdad; si no, el empleado resolvería su negocio en 26 pantallas y
// seguiría sin comisión en el taller).
// S76-B1 (hunk aditivo, D-505): foto_url — el PATH del logo en el
// bucket público `avatars` (identidad pública del negocio; el path se
// resuelve con `resolverUrlLogoNegocio`, jamás se persiste una URL).
export type MiPrestador = Pick<
  Database['public']['Tables']['prestadores']['Row'],
  | 'id'
  | 'nombre_comercial'
  | 'tipo'
  | 'country_code'
  | 'cuenta_comercial_id'
  | 'direccion'
  | 'ciudad'
  // S79-T4.1: la SEDE completa entra al shape — el editor de B necesita
  // leer lo que la whitelist de abajo deja escribir (LETRA_PERFIL §1
  // registro 2). null = no declarado (firma §2.2: sin datos, sin
  // oferta geográfica — jamás un default).
  | 'sector'
  | 'lat'
  | 'lon'
  | 'radio_cobertura_km'
  | 'grooming_extra_pelaje_largo'
  | 'grooming_recargo_domicilio'
  | 'descripcion'
  | 'telefono'
  | 'whatsapp'
  | 'email_contacto'
  | 'sitio_web'
  | 'estado'
  | 'foto_url'
  // S78-B (LETRA_VITRINA): el estado del toggle — la escritura tiene su
  // writer propio abajo; el flip a encendido lo gatea el trigger MECANICO
  // de A7 (rebota `aviso_reasignacion_no_existe` hasta que el aviso exista).
  | 'expone_personas'
>;

const COLUMNAS_MI_PRESTADOR =
  'id, nombre_comercial, tipo, country_code, cuenta_comercial_id, direccion, ciudad, sector, lat, lon, radio_cobertura_km, grooming_extra_pelaje_largo, grooming_recargo_domicilio, descripcion, telefono, whatsapp, email_contacto, sitio_web, estado, foto_url, expone_personas';

/**
 * El negocio del user logueado — por TITULARIDAD o por VÍNCULO ACTIVO
 * (S75-A1). Ver el encabezado del archivo para el porqué, el literal de
 * las policies que lo sostienen y los bordes declarados.
 */
export async function obtenerMiPrestador(): Promise<
  ResultadoWrapper<MiPrestador, CodigoErrorPrestador>
> {
  const uid = await uidActual();
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  // (1) Titularidad — el camino de siempre, byte por byte: las 26
  // pantallas del titular reciben EXACTAMENTE la misma fila que antes.
  const { data, error } = await getClient()
    .from('prestadores')
    .select(COLUMNAS_MI_PRESTADOR)
    .eq('user_id', uid)
    .maybeSingle();

  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  if (data !== null) return { ok: true, data };

  // (2) Vínculo activo. No es titular: ¿es empleado activo de alguien?
  const { data: vinculos, error: errorVinculo } = await getClient()
    .from('prestador_empleados')
    .select('prestador_id')
    .eq('user_id', uid)
    .eq('activo', true)
    .order('created_at', { ascending: true })
    .limit(1);

  if (errorVinculo) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  const prestadorId = vinculos?.[0]?.prestador_id;
  if (prestadorId === undefined) {
    return { ok: false, codigo: 'sin_prestador', mensaje: MENSAJES.sin_prestador };
  }

  const { data: fila, error: errorFila } = await getClient()
    .from('prestadores')
    .select(COLUMNAS_MI_PRESTADOR)
    .eq('id', prestadorId)
    .maybeSingle();

  if (errorFila) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  // null acá = el vínculo existe pero la fila no es legible: el negocio
  // no está 'activo' (el borde declarado arriba). `sin_prestador` es la
  // voz honesta — no hay negocio que mostrarle todavía.
  if (fila === null) return { ok: false, codigo: 'sin_prestador', mensaje: MENSAJES.sin_prestador };
  return { ok: true, data: fila };
}

// ── S60-B2 (hunk aditivo): edición ACOTADA del perfil de la entidad ─────────
// WHITELIST EXPLÍCITA (visto del arquitecto): SOLO descripcion +
// contacto. El payload se arma clave por clave — jamás spread del form.
// nombre_comercial/foto_url = identidad PÚBLICA (sesión D-370);
// direccion/ciudad = sede operativa; estado/aprobado_* = del admin;
// fiscal = cuentas_comerciales (regla 25). La RLS (prestadores_own,
// fila entera) NO acota columnas: esta whitelist es la capa de
// PRODUCTO — la protección del motor la registra la A como deuda 🔴.

export interface InputActualizarPerfilPrestador {
  /** '' o solo espacios ⇒ NULL honesto en DB. */
  descripcion?: string;
  /** E.164 sin '+' (regla 28) — el display con '+' es del frontend. */
  telefono?: string;
  whatsapp?: string;
  email_contacto?: string;
  sitio_web?: string;
  /** S76-B1 (D-505): el PATH del logo en el bucket `avatars` — la firma
   *  gana productor. '' ⇒ NULL honesto (quitar el logo). El trigger
   *  D-389 NO protege esta columna (relevado S74-A, vara E7): esta
   *  whitelist es la capa de PRODUCTO que la habilita a propósito. */
  foto_url?: string;
  // ── S79-T4.1 — LA SEDE entra a la whitelist (LETRA_PERFIL_S79 §1
  // registro 2, firmada v1.1). Las DOS leyes de A4 rigen acá igual:
  //   · lat/lon PAR-O-REBOTA (`coordenadas_invalidas`), rango validado.
  //   · LA COORDENADA MUERE CON EL TEXTO (§2.2): si viaja `direccion`
  //     SIN lat/lon, el wrapper escribe lat/lon NULL — una coordenada
  //     vieja pegada a un texto nuevo describe OTRA puerta.
  //   lat/lon SOLO salen del LugarResuelto de resolverLugar (contrato
  //   lugares.ts) — jamás tipeadas a mano.
  /** '' ⇒ NULL honesto. Cambiarla sin lat/lon MATA las coordenadas. */
  direccion?: string;
  ciudad?: string;
  sector?: string;
  /** Par obligatorio con lon; null explícito = borrar la ubicación. */
  lat?: number | null;
  lon?: number | null;
  /** km. null = el prestador deja de declarar radio ⇒ deja de ofertarse
   *  por geografía (firma §2.2 — decisión suya, jamás un default). El
   *  15 sugerido vive en el FORMULARIO (§2.1), no acá. */
  radio_cobertura_km?: number | null;
}

function aNull(v: string | undefined): string | null | undefined {
  if (v === undefined) return undefined; // no viajó: no se toca
  const limpio = v.trim();
  return limpio.length === 0 ? null : limpio;
}

export async function actualizarPerfilPrestador(
  input: InputActualizarPerfilPrestador,
): Promise<ResultadoWrapper<null, CodigoErrorPerfilPrestador>> {
  const uid = await uidActual();
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  const payload: Partial<Database['public']['Tables']['prestadores']['Update']> = {};
  const descripcion = aNull(input.descripcion);
  const telefono = aNull(input.telefono);
  const emailContacto = aNull(input.email_contacto);
  const sitioWeb = aNull(input.sitio_web);
  const fotoUrl = aNull(input.foto_url);
  if (descripcion !== undefined) payload.descripcion = descripcion;
  if (telefono !== undefined) payload.telefono = telefono;
  // whatsapp es NOT NULL en DB (legacy): el "sin dato" es '' — relevado.
  if (input.whatsapp !== undefined) payload.whatsapp = input.whatsapp.trim();
  if (emailContacto !== undefined) payload.email_contacto = emailContacto;
  if (sitioWeb !== undefined) payload.sitio_web = sitioWeb;
  if (fotoUrl !== undefined) payload.foto_url = fotoUrl;

  // ── la sede (S79-T4.1) ────────────────────────────────────────────
  const direccionSede = aNull(input.direccion);
  const ciudadSede = aNull(input.ciudad);
  const sectorSede = aNull(input.sector);
  if (direccionSede !== undefined) payload.direccion = direccionSede;
  if (ciudadSede !== undefined) payload.ciudad = ciudadSede;
  if (sectorSede !== undefined) payload.sector = sectorSede;

  const latViajo = input.lat !== undefined;
  const lonViajo = input.lon !== undefined;
  if (latViajo !== lonViajo) {
    // media coordenada = relleno plausible (L-139): rebota.
    return { ok: false, codigo: 'coordenadas_invalidas', mensaje: MENSAJES.coordenadas_invalidas };
  }
  if (latViajo && lonViajo) {
    const lat = input.lat ?? null;
    const lon = input.lon ?? null;
    if ((lat === null) !== (lon === null)) {
      return { ok: false, codigo: 'coordenadas_invalidas', mensaje: MENSAJES.coordenadas_invalidas };
    }
    if (lat !== null && lon !== null) {
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        return { ok: false, codigo: 'coordenadas_invalidas', mensaje: MENSAJES.coordenadas_invalidas };
      }
    }
    payload.lat = lat;
    payload.lon = lon;
  } else if (direccionSede !== undefined) {
    // LA COORDENADA MUERE CON EL TEXTO (§2.2): la dirección cambió sin
    // resolución Places ⇒ las coordenadas viejas se pisan con NULL.
    payload.lat = null;
    payload.lon = null;
  }

  if (input.radio_cobertura_km !== undefined) {
    const radio = input.radio_cobertura_km;
    if (radio !== null && (!Number.isInteger(radio) || radio < 1 || radio > 500)) {
      return { ok: false, codigo: 'radio_invalido', mensaje: MENSAJES.radio_invalido };
    }
    payload.radio_cobertura_km = radio;
  }

  if (Object.keys(payload).length === 0) return { ok: true, data: null };

  const { data, error } = await getClient()
    .from('prestadores')
    .update(payload)
    .eq('user_id', uid)
    .select('id')
    .maybeSingle();

  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  if (data === null) return { ok: false, codigo: 'sin_prestador', mensaje: MENSAJES.sin_prestador };
  return { ok: true, data: null };
}

// ── S79-T4.6 (hunk aditivo): la ceremonia del primer ingreso ────────────────
// LETRA_PERFIL §4 (firmada) + LETRA_ALTA §2 fase 4: la marca en MOTOR que
// reemplaza el puente AsyncStorage de la bienvenida (declarado como puente
// por B en su boceto — muere consumiendo esto). La RPC es idempotente y
// atómica: el PRIMER caller de la vida del negocio recibe true; estampa
// SOLO al TITULAR y SOLO con estado='activo' (la sala de espera no quema
// la ceremonia). El empleado o quien no tiene negocio recibe respuesta
// normal {esPrimerIngreso:false, …null} — jamás un error (v1.1).

export interface PrimerIngreso {
  esPrimerIngreso: boolean;
  /** ISO timestamp del primer ingreso — null si todavía no ocurrió (o no hay negocio propio). */
  primerIngresoEn: string | null;
  /** LETRA §3bis: el propósito NO viaja por PostgREST — esta RPC es su
   *  lector canónico; la bienvenida lo recibe acá. null honesto. */
  proposito: string | null;
}

export async function registrarPrimerIngreso(): Promise<
  ResultadoWrapper<PrimerIngreso, CodigoErrorPrestador>
> {
  const { data, error } = await getClient().rpc('registrar_primer_ingreso');
  if (error) {
    const codigo = error.message.startsWith('auth_required') ? 'sin_sesion' : 'error_desconocido';
    return codigo === 'sin_sesion'
      ? { ok: false, codigo, mensaje: MENSAJES.sin_sesion }
      : { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  const o = data as Record<string, unknown> | null;
  if (o === null || typeof o !== 'object' || o.ok !== true || typeof o.es_primer_ingreso !== 'boolean') {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.datos_inconsistentes };
  }
  return {
    ok: true,
    data: {
      esPrimerIngreso: o.es_primer_ingreso,
      primerIngresoEn: typeof o.primer_ingreso_en === 'string' ? o.primer_ingreso_en : null,
      proposito: typeof o.proposito === 'string' && o.proposito.length > 0 ? o.proposito : null,
    },
  };
}

// ── S76-B1 (hunk aditivo, D-505): la URL del logo del negocio ──────────────
// El logo vive en el bucket PÚBLICO `avatars` (relevado S76-B: public=true,
// lectura por policy "Avatar read" para todos) — identidad PÚBLICA del
// negocio: la ve el titular, el invitado (/invitacion) y mañana el pet
// parent en toda superficie con firma. Por eso NO se firma URL efímera
// (patrón mascotas, bucket privado): la pública es derivable del path,
// síncrona e infalible. Se persiste el PATH (la casa jamás guarda URLs).

const BUCKET_LOGOS = 'avatars';

/** URL pública del logo a partir del PATH persistido en
 *  `prestadores.foto_url`. null entra, null sale (sin logo → el
 *  monograma honesto de LogoNegocio). */
export function resolverUrlLogoNegocio(path: string | null): string | null {
  if (path === null || path.length === 0) return null;
  return getClient().storage.from(BUCKET_LOGOS).getPublicUrl(path).data.publicUrl;
}

/** S78-B — el writer del toggle de vitrina (LETRA_VITRINA A1bis). El
 *  FLIP a encendido lo intercepta el trigger mecánico de A7: mientras
 *  `notificar_reasignacion_cita` no exista, rebota
 *  `aviso_reasignacion_no_existe` — el error viaja TIPADO para que la
 *  superficie nunca lo ofrezca a ciegas (Ley 23). RLS: titular-only
 *  (la escritura de negocio es del titular — S75 A3). */
export async function actualizarExponePersonas(
  prestadorId: string,
  valor: boolean,
): Promise<ResultadoWrapper<{ exponePersonas: boolean }, 'aviso_reasignacion_no_existe' | 'error_escritura'>> {
  const { data, error } = await getClient()
    .from('prestadores')
    .update({ expone_personas: valor })
    .eq('id', prestadorId)
    .select('expone_personas')
    .maybeSingle();
  if (error) {
    if (error.message.includes('aviso_reasignacion_no_existe')) {
      return { ok: false, codigo: 'aviso_reasignacion_no_existe', mensaje: error.message };
    }
    return { ok: false, codigo: 'error_escritura', mensaje: error.message };
  }
  if (data === null) return { ok: false, codigo: 'error_escritura', mensaje: 'sin_fila' };
  return { ok: true, data: { exponePersonas: data.expone_personas } };
}


/**
 * ¿SE PUEDE ENCENDER LA VITRINA? (S78-A8, pedido de B — el lector del gate.)
 *
 * ESPEJO EXACTO del predicado del trigger `trg_prestadores_gate_vitrina`
 * (la misma expresión `to_regprocedure` sobre la misma firma, en la RPC
 * `puede_encender_vitrina`): el día que `notificar_reasignacion_cita`
 * exista, el trigger deja pasar Y este lector devuelve `true` — en el
 * mismo instante, sin que nadie toque nada. Si divergen, el bug es la
 * divergencia, no este lector.
 *
 * B lo usa para NO dibujar el toggle mientras el gate rebote (Ley 23: un
 * toggle que rebota al guardar es peor que un toggle ausente). El fallo
 * de lectura NO se degrada a `false` con cara de dato — sale tipado, y
 * la pantalla decide (hoy: no dibujar, que coincide con el estado real).
 */
export async function puedeEncenderVitrina(): Promise<ResultadoWrapper<boolean, CodigoErrorPrestador | 'error_desconocido'>> {
  const { data, error } = await getClient().rpc('puede_encender_vitrina');
  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  return { ok: true, data: data === true };
}
