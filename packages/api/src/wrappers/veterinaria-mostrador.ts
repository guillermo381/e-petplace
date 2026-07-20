// EL MOSTRADOR — la búsqueda de "¿quién está en el mostrador?" (S69-B,
// M2). Wrappers de SOLO LECTURA (lane extendida declarada por la mesa
// S69: cero DDL, hunks aditivos). Dos fuentes, como manda la letra §7:
//   (1) lo que la CLÍNICA ya puede ver — sus accesos vigentes — por
//       nombre de mascota. La RLS (user_tiene_acceso_a_mascota) es el
//       guard: se lee `mascotas` directo y la fila que no se puede ver
//       no existe (patrón obtenerDetalleMascotaPrestador).
//   (2) el buscador de ALTA ASISTIDA (Fase G/S19) — por EMAIL o TELÉFONO
//       (A2: normalizador materializado) — que dice si esa persona ya
//       vive en la plataforma (o tiene un pendiente). Ambos buscadores
//       comparten shape (parseBusquedaCliente).
//
// Además: el ALTA (M3) con toggle real email/teléfono (A2) y la ATENCIÓN
// del mostrador (M4, A1bis) + el cobro-dato (M5, A1bis).
//
// Firma viva verificada con pg_get_functiondef contra DB (regla 40):
//   buscar_cliente_por_email(p_email text) → jsonb SECURITY DEFINER.
//   Discrimina por `existe`: 'registrado' (con familias titulares) ·
//   'pendiente' (ya lo registró OTRA clínica, aún sin completar) ·
//   'no_registrado'. RAISE: auth_required · email_required ·
//   invocador_no_es_prestador.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

// ── (1) mascotas accesibles por nombre ──────────────────────────────────────

export interface MascotaMostrador {
  mascota_id: string;
  nombre: string;
  especie: string | null;
  foto_url: string | null;
}

/** Mascotas que ESTE prestador puede ver (RLS), filtradas por nombre.
 *  Solo activas. Query vacía → sin resultados (no barre todo). */
export async function buscarMascotasAccesibles(
  query: string,
): Promise<ResultadoWrapper<MascotaMostrador[], 'error_busqueda'>> {
  const q = query.trim();
  if (q.length === 0) return { ok: true, data: [] };
  // ilike con comodines — escapamos los del patrón para que un % tecleado
  // no barra de más.
  const patron = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
  const { data, error } = await getClient()
    .from('mascotas')
    .select('id, nombre, especie, foto_url')
    .eq('estado_vida', 'activa')
    .ilike('nombre', patron)
    .order('nombre', { ascending: true })
    .limit(20);
  if (error) return { ok: false, codigo: 'error_busqueda', mensaje: 'No pudimos buscar. Probá de nuevo.' };
  return {
    ok: true,
    data: (data ?? []).map((m) => ({
      mascota_id: m.id,
      nombre: m.nombre,
      especie: m.especie,
      foto_url: m.foto_url,
    })),
  };
}

// ── (2) el buscador de alta asistida por email (Fase G) ─────────────────────

// S70-A3: la rama 'registrado' ahora trae las MASCOTAS del cliente (para la
// grilla del handshake), no las familias+counts. Match +prefijo↔pelado (A8).
export interface MascotaDeClienteRegistrado {
  mascotaId: string;
  nombre: string;
  fotoUrl: string | null;
}

export type ResultadoBusquedaCliente =
  | { existe: 'registrado'; user_id: string; nombre: string | null; mascotas: MascotaDeClienteRegistrado[] }
  | { existe: 'pendiente'; pendiente_id: string; creado_por_prestador_id: string; expira_en: string | null }
  | { existe: 'no_registrado'; email: string };

const CODIGOS_BUSQUEDA_CLIENTE = ['email_invalido', 'telefono_invalido', 'acceso_denegado', 'datos_inconsistentes'] as const;
export type CodigoBusquedaCliente = (typeof CODIGOS_BUSQUEDA_CLIENTE)[number];

const MENSAJES_BUSQUEDA: Record<CodigoBusquedaCliente | 'error_desconocido', string> = {
  email_invalido: 'Escribí un email válido para buscar.',
  telefono_invalido: 'Escribí un teléfono válido para buscar.',
  acceso_denegado: 'No tenés permiso para buscar clientes.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido: 'Ocurrió un error inesperado. Probá de nuevo.',
};

function falloBusquedaCliente(raw: string): ResultadoWrapper<ResultadoBusquedaCliente, CodigoBusquedaCliente> {
  let codigo: CodigoBusquedaCliente | 'error_desconocido';
  if (raw.startsWith('email_required')) codigo = 'email_invalido';
  else if (raw.startsWith('telefono_required')) codigo = 'telefono_invalido';
  else if (raw.startsWith('auth_required') || raw.startsWith('invocador_no_es_prestador')) codigo = 'acceso_denegado';
  else codigo = 'error_desconocido';
  return { ok: false, codigo: codigo === 'error_desconocido' ? 'datos_inconsistentes' : codigo, mensaje: MENSAJES_BUSQUEDA[codigo] };
}

function esObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

// El jsonb de ambos buscadores (email/teléfono) es IDÉNTICO (contrato A2,
// assert de la A): discrimina por `existe`. Un solo parser (L-124).
function parseBusquedaCliente(
  data: unknown,
  contactoFallback: string,
): ResultadoWrapper<ResultadoBusquedaCliente, CodigoBusquedaCliente> {
  const raw: unknown = data;
  const inconsistente = { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_BUSQUEDA.datos_inconsistentes } as const;
  if (!esObj(raw)) return inconsistente;
  const existe = raw['existe'];
  if (existe === 'registrado') {
    const mascotasRaw: unknown[] = Array.isArray(raw['mascotas']) ? raw['mascotas'] : [];
    const mascotas: MascotaDeClienteRegistrado[] = [];
    for (const m of mascotasRaw) {
      if (!esObj(m)) continue;
      const id = str(m['mascota_id']);
      if (id === null) continue;
      mascotas.push({ mascotaId: id, nombre: str(m['nombre']) ?? '', fotoUrl: str(m['foto_url']) });
    }
    const userId = str(raw['user_id']);
    if (userId === null) return inconsistente;
    return { ok: true, data: { existe: 'registrado', user_id: userId, nombre: str(raw['nombre']), mascotas } };
  }
  if (existe === 'pendiente') {
    const pendienteId = str(raw['pendiente_id']);
    const creadoPor = str(raw['creado_por_prestador_id']);
    if (pendienteId === null || creadoPor === null) return inconsistente;
    return { ok: true, data: { existe: 'pendiente', pendiente_id: pendienteId, creado_por_prestador_id: creadoPor, expira_en: str(raw['expira_en']) } };
  }
  if (existe === 'no_registrado') {
    return { ok: true, data: { existe: 'no_registrado', email: str(raw['email']) ?? contactoFallback } };
  }
  return inconsistente;
}

/** ¿Esta persona (por email) ya vive en e-PetPlace? Discrimina registrado
 *  / pendiente (de otra clínica) / no_registrado. */
export async function buscarClienteAltaAsistida(
  email: string,
): Promise<ResultadoWrapper<ResultadoBusquedaCliente, CodigoBusquedaCliente>> {
  const e = email.trim();
  if (e.length === 0) return { ok: false, codigo: 'email_invalido', mensaje: MENSAJES_BUSQUEDA.email_invalido };
  const { data, error } = await getClient().rpc('buscar_cliente_por_email', { p_email: e });
  if (error) return falloBusquedaCliente(error.message);
  return parseBusquedaCliente(data, e);
}

/** La SEGUNDA pata (A2): ¿ya vive en e-PetPlace por TELÉFONO? El server
 *  normaliza (columna materializada + trigger) — mismo shape que el email. */
export async function buscarClientePorTelefono(
  telefono: string,
  countryCode = 'EC',
): Promise<ResultadoWrapper<ResultadoBusquedaCliente, CodigoBusquedaCliente>> {
  const tel = telefono.trim();
  if (tel.length === 0) return { ok: false, codigo: 'telefono_invalido', mensaje: MENSAJES_BUSQUEDA.telefono_invalido };
  const { data, error } = await getClient().rpc('buscar_cliente_por_telefono', { p_telefono: tel, p_country_code: countryCode });
  if (error) return falloBusquedaCliente(error.message);
  return parseBusquedaCliente(data, tel);
}

// ── (3) EL ALTA MÍNIMA FANTASMA (M3) ────────────────────────────────────────
// D-219 PAGADA: el wrapper canónico del chasis de alta asistida
// (crear_alta_asistida_pendiente — Fase G/S19), verificado con
// pg_get_functiondef (regla 40). P13: cero user en Auth, familia
// placeholder, mascota, y el trigger de reclamo espera al dueño.
//
// TOGGLE REAL (A2, el clash de S69-B RESUELTO): p_email es OPCIONAL —
// el contrato exige email O teléfono (contacto_requerido). El server
// normaliza el teléfono (columna materializada + trigger) y el reclamo
// puede disparar por cualquiera de los dos. cliente_ya_registrado /
// pendiente_ya_existe pueden dispararse por teléfono normalizado. La
// `especie` se valida server-side (especie_invalida_o_inactiva); el
// acote por `especies_compatibles` (prestador_servicios, por-servicio)
// es refinamiento de UX declarado, no guard.

export interface AltaAsistidaMostradorInput {
  prestadorId: string;
  nombreMascota: string;
  especie: string;
  nombreCliente: string;
  /** Contacto: email O teléfono — al menos uno (A2). */
  email?: string | null;
  telefono?: string | null;
  countryCode?: string;
}

export interface AltaAsistidaMostradorResultado {
  pendienteId: string;
  familiaId: string;
  mascotaId: string;
  expiraEn: string | null;
}

const CODIGOS_ALTA = [
  'acceso_denegado',
  'contacto_requerido',
  'nombre_cliente_requerido',
  'nombre_mascota_requerido',
  'especie_invalida',
  'country_invalido',
  'cliente_ya_registrado',
  'pendiente_ya_existe',
  'datos_inconsistentes',
] as const;
export type CodigoAltaMostrador = (typeof CODIGOS_ALTA)[number];

const MENSAJES_ALTA: Record<CodigoAltaMostrador | 'error_desconocido', string> = {
  acceso_denegado: 'No tenés permiso para registrar en este negocio.',
  contacto_requerido: 'Poné un email o un teléfono del cliente.',
  nombre_cliente_requerido: 'Poné el nombre del cliente.',
  nombre_mascota_requerido: 'Poné el nombre de la mascota.',
  especie_invalida: 'Elegí una especie válida.',
  country_invalido: 'El país no es válido.',
  cliente_ya_registrado: 'Ese cliente ya está en e-PetPlace — buscalo por su contacto para sumarle la mascota.',
  pendiente_ya_existe: 'Ya hay un registro pendiente con ese contacto.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido: 'No pudimos registrar. Probá de nuevo.',
};

function falloAlta(raw: string): ResultadoWrapper<AltaAsistidaMostradorResultado, CodigoAltaMostrador> {
  let c: CodigoAltaMostrador | 'error_desconocido';
  if (raw.startsWith('auth_required') || raw.startsWith('no_access_to_prestador')) c = 'acceso_denegado';
  else if (raw.startsWith('contacto_requerido') || raw.startsWith('email_required')) c = 'contacto_requerido';
  else if (raw.startsWith('nombre_cliente_required')) c = 'nombre_cliente_requerido';
  else if (raw.startsWith('nombre_mascota_required')) c = 'nombre_mascota_requerido';
  else if (raw.startsWith('especie_invalida_o_inactiva')) c = 'especie_invalida';
  else if (raw.startsWith('country_code_invalido')) c = 'country_invalido';
  else if (raw.startsWith('cliente_ya_registrado')) c = 'cliente_ya_registrado';
  else if (raw.startsWith('pendiente_ya_existe')) c = 'pendiente_ya_existe';
  else c = 'error_desconocido';
  return { ok: false, codigo: c === 'error_desconocido' ? 'datos_inconsistentes' : c, mensaje: MENSAJES_ALTA[c] };
}

/** Alta mínima del mostrador con reclamo por email O teléfono (M3, A2). */
export async function crearAltaAsistidaMostrador(
  input: AltaAsistidaMostradorInput,
): Promise<ResultadoWrapper<AltaAsistidaMostradorResultado, CodigoAltaMostrador>> {
  const email = input.email?.trim() ?? '';
  const tel = input.telefono?.trim() ?? '';
  if (email.length === 0 && tel.length === 0)
    return { ok: false, codigo: 'contacto_requerido', mensaje: MENSAJES_ALTA.contacto_requerido };
  if (input.nombreCliente.trim().length === 0)
    return { ok: false, codigo: 'nombre_cliente_requerido', mensaje: MENSAJES_ALTA.nombre_cliente_requerido };
  if (input.nombreMascota.trim().length === 0)
    return { ok: false, codigo: 'nombre_mascota_requerido', mensaje: MENSAJES_ALTA.nombre_mascota_requerido };

  const { data, error } = await getClient().rpc('crear_alta_asistida_pendiente', {
    // p_email opcional (A2): '' cuando solo hay teléfono — el server acepta
    // email O teléfono (contacto_requerido) y normaliza el teléfono.
    p_email: email,
    p_nombre_cliente: input.nombreCliente.trim(),
    p_telefono: tel,
    p_prestador_id: input.prestadorId,
    p_nombre_mascota: input.nombreMascota.trim(),
    p_especie: input.especie,
    p_country_code: input.countryCode ?? 'EC',
  });
  if (error) return falloAlta(error.message);
  const raw: unknown = data;
  if (!esObj(raw)) return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ALTA.datos_inconsistentes };
  const pendienteId = str(raw['pendiente_id']);
  const familiaId = str(raw['familia_id']);
  const mascotaId = str(raw['mascota_id']);
  if (pendienteId === null || familiaId === null || mascotaId === null) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ALTA.datos_inconsistentes };
  }
  return { ok: true, data: { pendienteId, familiaId, mascotaId, expiraEn: str(raw['expira_en']) } };
}

// ── (4) M4 — LA ATENCIÓN DEL MOSTRADOR (A1bis) ──────────────────────────────
// registrar_atencion_mostrador → cita FIRME, confirmada, fecha HOY, hora
// now, metadata.origen='mostrador'. El guard del canon vive en el server
// (tipo_no_medico + servicio_no_activo — el discriminador es_medico en la
// PUERTA, no en la UI: la pantalla solo ofrece es_medico activos).

export interface AtencionMostradorInput {
  prestadorId: string;
  mascotaId: string;
  tipoServicioCodigo: string;
  /** El precio del momento — editable (es su mostrador). */
  precio: number;
  empleadoId?: string | null;
  countryCode?: string;
}

const CODIGOS_ATENCION_MOSTRADOR = [
  'acceso_denegado',
  'prestador_sin_cuenta',
  'sin_acceso_mascota',
  'tipo_no_medico',
  'servicio_no_activo',
  'precio_invalido',
  'country_invalido',
  'datos_inconsistentes',
] as const;
export type CodigoAtencionMostrador = (typeof CODIGOS_ATENCION_MOSTRADOR)[number];

const MENSAJES_ATENCION: Record<CodigoAtencionMostrador | 'error_desconocido', string> = {
  acceso_denegado: 'No tenés acceso a este negocio o esta mascota.',
  // prestador_sin_cuenta: el negocio no tiene cuenta comercial (hoy imposible
  // por el NOT NULL de la columna; voz honesta por si la letra cambia — Ley 13).
  prestador_sin_cuenta: 'Tu negocio todavía no está habilitado para registrar atenciones.',
  sin_acceso_mascota: 'No tenés acceso a esta mascota.',
  tipo_no_medico: 'Ese servicio no es de veterinaria.',
  servicio_no_activo: 'Ese servicio no está activo en tu consultorio.',
  precio_invalido: 'El precio no es válido.',
  country_invalido: 'El país no es válido.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  // Último recurso — solo lo verdaderamente desconocido cae acá (Ley 13: la
  // lista de arriba cubre CADA código que la RPC levanta).
  error_desconocido: 'No pudimos registrar la atención. Probá de nuevo.',
};

function falloAtencion(raw: string): ResultadoWrapper<string, CodigoAtencionMostrador> {
  let c: CodigoAtencionMostrador | 'error_desconocido';
  if (raw.startsWith('auth_required') || raw.startsWith('no_access_to_prestador')) c = 'acceso_denegado';
  else if (raw.startsWith('prestador_sin_cuenta')) c = 'prestador_sin_cuenta';
  else if (raw.startsWith('sin_acceso_mascota')) c = 'sin_acceso_mascota';
  else if (raw.startsWith('tipo_no_medico')) c = 'tipo_no_medico';
  else if (raw.startsWith('servicio_no_activo')) c = 'servicio_no_activo';
  else if (raw.startsWith('precio_invalido')) c = 'precio_invalido';
  else if (raw.startsWith('country_invalido') || raw.startsWith('country_code_invalido')) c = 'country_invalido';
  else c = 'error_desconocido';
  return { ok: false, codigo: c === 'error_desconocido' ? 'datos_inconsistentes' : c, mensaje: MENSAJES_ATENCION[c] };
}

/** Registra la atención walk-in: nace una cita FIRME hoy. Devuelve cita_id. */
export async function registrarAtencionMostrador(
  input: AtencionMostradorInput,
): Promise<ResultadoWrapper<string, CodigoAtencionMostrador>> {
  if (!Number.isFinite(input.precio) || input.precio < 0)
    return { ok: false, codigo: 'precio_invalido', mensaje: MENSAJES_ATENCION.precio_invalido };
  const { data, error } = await getClient().rpc('registrar_atencion_mostrador', {
    p_prestador_id: input.prestadorId,
    p_mascota_id: input.mascotaId,
    p_tipo_servicio_codigo: input.tipoServicioCodigo,
    p_precio: input.precio,
    p_empleado_id: input.empleadoId ?? undefined,
    p_country_code: input.countryCode ?? 'EC',
  });
  if (error) return falloAtencion(error.message);
  const id = str(data);
  if (id === null) return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ATENCION.datos_inconsistentes };
  return { ok: true, data: id };
}

// ── (5) M5 — EL COBRO PRESENCIAL COMO DATO (A1bis) ──────────────────────────
// registrar_cobro_presencial → cobro-DATO (monto + medio). CERO devengo,
// CERO fee, CERO checkout (posición 1 hecha estructura). UNIQUE por cita
// (cobro_ya_registrado si repite — la corrección es soporte, sin UI).

export type MedioCobro = 'efectivo' | 'tarjeta' | 'transferencia';
export const MEDIOS_COBRO: readonly MedioCobro[] = ['efectivo', 'tarjeta', 'transferencia'];

const CODIGOS_COBRO = [
  'acceso_denegado',
  'cita_no_existe',
  'no_opera_cuenta',
  'monto_invalido',
  'medio_invalido',
  'cobro_ya_registrado',
  'datos_inconsistentes',
] as const;
export type CodigoCobroPresencial = (typeof CODIGOS_COBRO)[number];

const MENSAJES_COBRO: Record<CodigoCobroPresencial | 'error_desconocido', string> = {
  // auth_required (sesión caída) — la RPC lo levanta; sin branch caía al
  // genérico (Ley 13). Misma familia que el resto del mostrador.
  acceso_denegado: 'No tenés permiso para registrar el cobro.',
  cita_no_existe: 'Esa atención ya no existe.',
  no_opera_cuenta: 'No operás este negocio.',
  monto_invalido: 'El monto no es válido.',
  medio_invalido: 'Elegí un medio de cobro válido.',
  cobro_ya_registrado: 'Esta atención ya tiene un cobro registrado.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido: 'No pudimos registrar el cobro. Probá de nuevo.',
};

function falloCobro(raw: string): ResultadoWrapper<string, CodigoCobroPresencial> {
  let c: CodigoCobroPresencial | 'error_desconocido';
  if (raw.startsWith('auth_required')) c = 'acceso_denegado';
  else if (raw.startsWith('cita_no_existe')) c = 'cita_no_existe';
  else if (raw.startsWith('no_opera_cuenta')) c = 'no_opera_cuenta';
  else if (raw.startsWith('monto_invalido')) c = 'monto_invalido';
  else if (raw.startsWith('medio_invalido')) c = 'medio_invalido';
  else if (raw.startsWith('cobro_ya_registrado')) c = 'cobro_ya_registrado';
  else c = 'error_desconocido';
  return { ok: false, codigo: c === 'error_desconocido' ? 'datos_inconsistentes' : c, mensaje: MENSAJES_COBRO[c] };
}

/** Registra el cobro presencial (dato). Devuelve el id del cobro. */
export async function registrarCobroPresencial(
  citaId: string,
  monto: number,
  medio: MedioCobro,
): Promise<ResultadoWrapper<string, CodigoCobroPresencial>> {
  if (!Number.isFinite(monto) || monto <= 0)
    return { ok: false, codigo: 'monto_invalido', mensaje: MENSAJES_COBRO.monto_invalido };
  const { data, error } = await getClient().rpc('registrar_cobro_presencial', {
    p_cita_id: citaId,
    p_monto: monto,
    p_medio: medio,
  });
  if (error) return falloCobro(error.message);
  const id = str(data);
  if (id === null) return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_COBRO.datos_inconsistentes };
  return { ok: true, data: id };
}

// ── (6) EL REGISTRABLE DE VACUNA (M4/vacunación, A5 — D-434 PAGADA) ─────────
// Catálogo cat_vacunas (7 EC) + "Otra" libre (XOR). registrar_vacuna_
// mostrador inserta la tipada evento_vacuna_aplicada; el trigger estampa
// declarado_por_prestador solo (contrato A: cero trabajo extra). Firma
// viva verificada con pg_get_functiondef (regla 40).

export interface VacunaCatalogo {
  codigo: string;
  nombre: string;
}

/** Los 7 seeds EC activos de cat_vacunas (RLS: select público). */
export async function obtenerCatalogoVacunas(): Promise<ResultadoWrapper<VacunaCatalogo[], 'error_catalogo'>> {
  const { data, error } = await getClient()
    .from('cat_vacunas')
    .select('codigo, nombre')
    .eq('activo', true)
    .order('nombre', { ascending: true });
  if (error) return { ok: false, codigo: 'error_catalogo', mensaje: 'No pudimos cargar el catálogo de vacunas.' };
  return { ok: true, data: (data ?? []).map((v) => ({ codigo: v.codigo, nombre: v.nombre })) };
}

const CODIGOS_VACUNA = [
  'acceso_denegado',
  'cita_no_existe',
  'sin_acceso_mascota',
  'vacuna_xor',
  'vacuna_codigo_invalido',
  'datos_inconsistentes',
] as const;
export type CodigoVacunaMostrador = (typeof CODIGOS_VACUNA)[number];

const MENSAJES_VACUNA: Record<CodigoVacunaMostrador | 'error_desconocido', string> = {
  acceso_denegado: 'No tenés permiso para registrar en este negocio.',
  cita_no_existe: 'Esa atención ya no existe.',
  sin_acceso_mascota: 'No tenés acceso a esta mascota.',
  vacuna_xor: 'Elegí una vacuna del catálogo o escribí una — no ambas.',
  vacuna_codigo_invalido: 'Esa vacuna no está en el catálogo.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido: 'No pudimos registrar la vacuna. Probá de nuevo.',
};

function falloVacuna(raw: string): ResultadoWrapper<string, CodigoVacunaMostrador> {
  let c: CodigoVacunaMostrador | 'error_desconocido';
  if (raw.startsWith('auth_required') || raw.startsWith('no_opera_cuenta')) c = 'acceso_denegado';
  else if (raw.startsWith('cita_no_existe')) c = 'cita_no_existe';
  else if (raw.startsWith('sin_acceso_mascota')) c = 'sin_acceso_mascota';
  else if (raw.startsWith('vacuna_xor')) c = 'vacuna_xor';
  else if (raw.startsWith('vacuna_codigo_invalido')) c = 'vacuna_codigo_invalido';
  else c = 'error_desconocido';
  return { ok: false, codigo: c === 'error_desconocido' ? 'datos_inconsistentes' : c, mensaje: MENSAJES_VACUNA[c] };
}

export interface VacunaMostradorInput {
  /** XOR: código del catálogo O nombre libre. */
  vacunaCodigo?: string | null;
  nombreLibre?: string | null;
  /** Default HOY en la fuente. */
  fechaAplicacion?: string | null;
}

/** Registra la vacuna de una atención de mostrador. Devuelve el evento. */
export async function registrarVacunaMostrador(
  citaId: string,
  input: VacunaMostradorInput,
): Promise<ResultadoWrapper<string, CodigoVacunaMostrador>> {
  const codigo = input.vacunaCodigo?.trim();
  const libre = input.nombreLibre?.trim();
  const { data, error } = await getClient().rpc('registrar_vacuna_mostrador', {
    p_cita_id: citaId,
    p_vacuna_codigo: codigo && codigo.length > 0 ? codigo : undefined,
    p_nombre_libre: libre && libre.length > 0 ? libre : undefined,
    p_fecha_aplicacion: input.fechaAplicacion ?? undefined,
  });
  if (error) return falloVacuna(error.message);
  const id = str(data);
  if (id === null) return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_VACUNA.datos_inconsistentes };
  return { ok: true, data: id };
}

// ── (7) EL POLL DEL HANDSHAKE (S70-B2-v2, lado clínica) ─────────────────────
// La solicitud de autorización la CREA/RESPONDE handshake-mostrador.ts (A3);
// acá la clínica sondea el estado por SELECT directo (RLS SELECT cubre la
// cuenta operadora). Expiración PEREZOSA: 'pendiente' con expira_en pasado se
// lee 'expirada' (sin cron). Al autorizar, la mascota para continuar es la
// CREADA (alta_mascota) o la existente (atencion) — COALESCE.

export type EstadoSolicitud = 'pendiente' | 'autorizada' | 'rechazada' | 'expirada';

export interface EstadoSolicitudMostrador {
  estado: EstadoSolicitud;
  /** La mascota con la que seguir a la atención (creada o existente). null si aún no. */
  mascotaId: string | null;
}

/** Sondea el estado de una solicitud de autorización (poll de la espera). */
export async function consultarSolicitudAutorizacion(
  solicitudId: string,
): Promise<ResultadoWrapper<EstadoSolicitudMostrador, 'no_existe' | 'error_consulta'>> {
  const { data, error } = await getClient()
    .from('solicitud_autorizacion_mostrador')
    .select('estado, mascota_id, mascota_creada_id, expira_en')
    .eq('id', solicitudId)
    .maybeSingle();
  if (error) return { ok: false, codigo: 'error_consulta', mensaje: 'No pudimos consultar la autorización.' };
  if (data === null) return { ok: false, codigo: 'no_existe', mensaje: 'Esa solicitud ya no existe.' };
  const crudo = typeof data.estado === 'string' ? data.estado : 'pendiente';
  const vencida =
    crudo === 'pendiente' && typeof data.expira_en === 'string' && new Date(data.expira_en).getTime() < Date.now();
  const estado: EstadoSolicitud = vencida
    ? 'expirada'
    : (['pendiente', 'autorizada', 'rechazada', 'expirada'].includes(crudo) ? crudo : 'pendiente') as EstadoSolicitud;
  const mascotaId = str(data.mascota_creada_id) ?? str(data.mascota_id);
  return { ok: true, data: { estado, mascotaId } };
}
