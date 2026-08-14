// Cuenta comercial del prestador — S54-B (wizard B2.3, MODELO_FINANCIERO §6.5).
// Contra lo RELEVADO en DB viva (pg_get_functiondef + pg_policies, 10-Jul):
//   · lectura propia por RLS (owner_select_own_cuentas; UNIQUE owner_profile_id
//     — un user tiene a lo sumo UNA cuenta, regla 29)
//   · crear_cuenta_comercial_inicial / actualizar_datos_bancarios /
//     verificar_identificacion_disponible — SECURITY DEFINER con gate de
//     identidad INTERNO (auth.uid() + ownership); nacen del portal viejo y
//     operan sobre esta misma DB
//   · catálogos get_bancos_activos_por_pais / get_tipos_documento_titular_
//     por_pais (INVOKER; cat_* con SELECT a authenticated) y cat_paises directo
// Matiz de contrato: estas RPCs devuelven TABLE(success, mensaje) con mensaje
// HUMANO sin código de error — el rechazo de negocio se expone como
// 'rechazado_por_servidor' con el mensaje literal del server (regla 35: cero
// string-matching); la validación client-side (máscaras por catálogo) minimiza
// que ese camino se recorra.

import { getClient, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';
import type { Database } from '../database.types';

export type EstadoCuentaComercial =
  Database['public']['Enums']['estado_cuenta_comercial_enum'];
export type TipoFiscal = Database['public']['Enums']['tipo_fiscal_enum'];

const TIPOS_FISCALES = [
  'persona_natural',
  'persona_natural_obligada',
  'persona_juridica',
  'entidad_sin_fines_lucro',
] as const satisfies readonly TipoFiscal[];

const CODIGOS_ERROR_CUENTA = ['sin_sesion', 'rechazado_por_servidor'] as const;
export type CodigoErrorCuentaComercial = (typeof CODIGOS_ERROR_CUENTA)[number];

const MENSAJES: Record<
  CodigoErrorCuentaComercial | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  sin_sesion:             'No hay sesión activa.',
  rechazado_por_servidor: 'El servidor no aceptó los datos.',
  datos_inconsistentes:   'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:      'Ocurrió un error inesperado. Prueba de nuevo.',
};

function errorGenerico<T>(
  codigo: 'error_desconocido' | 'datos_inconsistentes' | 'sin_sesion',
): ResultadoWrapper<T, CodigoErrorCuentaComercial> {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

/** Rechazo de negocio: el mensaje viene del server (humano, sin código). */
function rechazo<T>(mensaje: string): ResultadoWrapper<T, CodigoErrorCuentaComercial> {
  return {
    ok: false,
    codigo: 'rechazado_por_servidor',
    mensaje: mensaje.trim().length > 0 ? mensaje : MENSAJES.rechazado_por_servidor,
  };
}

// ---------------------------------------------------------------------------
// Lectura propia
// ---------------------------------------------------------------------------

/** Resumen de datos bancarios para MOSTRAR: número enmascarado, jamás el
 *  número completo en estado de pantalla. null = aún sin datos completos
 *  (jsonb {} o parcial — §8.13, guardado parcial legal). */
export interface DatosBancariosResumen {
  bancoNombre: string;
  tipoCuenta: 'corriente' | 'ahorros';
  numeroCuentaMascarado: string;
  titularNombre: string;
}

export interface MiCuentaComercial {
  id: string;
  estado: EstadoCuentaComercial;
  tipoFiscal: TipoFiscal;
  identificacionFiscal: string;
  razonSocial: string;
  nombreComercial: string;
  countryCode: string;
  moneda: string;
  /** null = datos bancarios incompletos o vacíos (la invitación a completar). */
  datosBancarios: DatosBancariosResumen | null;
}

function derivarResumenBancario(datos: unknown): DatosBancariosResumen | null {
  if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) return null;
  const o = datos as Record<string, unknown>;
  const bancoNombre = typeof o.banco_nombre === 'string' ? o.banco_nombre.trim() : '';
  const tipoCuenta = o.tipo_cuenta;
  const numeroCuenta = typeof o.numero_cuenta === 'string' ? o.numero_cuenta.trim() : '';
  const titularNombre = typeof o.titular_nombre === 'string' ? o.titular_nombre.trim() : '';
  if (
    bancoNombre.length === 0 ||
    numeroCuenta.length === 0 ||
    titularNombre.length === 0 ||
    (tipoCuenta !== 'corriente' && tipoCuenta !== 'ahorros')
  ) {
    return null;
  }
  const ultimos = numeroCuenta.slice(-4);
  return {
    bancoNombre,
    tipoCuenta,
    numeroCuentaMascarado: `•••• ${ultimos}`,
    titularNombre,
  };
}

/** La cuenta comercial del user logueado. data null = NO tiene cuenta
 *  (peldaño 0 del módulo — estado legítimo, no error). */
export async function obtenerMiCuentaComercial(): Promise<
  ResultadoWrapper<MiCuentaComercial | null, CodigoErrorCuentaComercial>
> {
  const uid = await uidActual();
  if (!uid) return errorGenerico('sin_sesion');

  const COLUMNAS =
    'id, estado, tipo_fiscal, identificacion_fiscal, razon_social, nombre_comercial, country_code, moneda, datos_bancarios';

  // (1) POR OWNER — el camino de siempre, byte por byte: quien la creó recibe
  // exactamente la misma fila que antes.
  const propia = await getClient()
    .from('cuentas_comerciales')
    .select(COLUMNAS)
    .eq('owner_profile_id', uid)
    .maybeSingle();
  if (propia.error) return errorGenerico('error_desconocido');

  let fila = propia.data;

  // (2) POR GESTIÓN — D-660. **Era el ESPEJO QUE FALTABA de
  // `obtenerMiPrestador`**: aquél ganó su pata de vínculo en S75 y éste nunca
  // la tuvo. Un administrador no es `owner_profile_id` de nada, así que (1) le
  // devolvía `null` y la pantalla de equipo mostraba «No pudimos cargar tu
  // equipo» — el re-gate del founder frenó exactamente ahí.
  //
  // ⚠️ LO QUE ESTE CASO ENSEÑA, y por eso vive acá: la RLS de
  // `cuentas_comerciales` YA permitía esta lectura desde la tanda ⑤ del lote.
  // **La puerta se abrió y el resolvedor siguió tocando la de al lado.**
  // *Curar el permiso no cura la pregunta.*
  //
  // La consulta no nombra al usuario: la RLS de `prestadores` ya devuelve solo
  // los negocios que esta persona gestiona. `limit(1)` es honesto mientras
  // nadie gestione dos — el día que ocurra, el resolvedor del motor
  // (`prestador_que_gestiono`) rebota hablado y esto se alinea con él.
  if (fila === null) {
    const porGestion = await getClient()
      .from('prestadores')
      .select(`cuenta:cuentas_comerciales!inner(${COLUMNAS})`)
      .not('cuenta_comercial_id', 'is', null)
      .limit(1);
    if (porGestion.error) return errorGenerico('error_desconocido');
    const anidada = porGestion.data?.[0]?.cuenta;
    fila = (Array.isArray(anidada) ? anidada[0] : anidada) ?? null;
  }

  if (fila === null) return { ok: true, data: null };

  // UNA sola salida para las dos entradas: el mapeo a camelCase vive en un
  // solo lugar y no se duplica por camino.
  return {
    ok: true,
    data: {
      id: fila.id,
      estado: fila.estado,
      tipoFiscal: fila.tipo_fiscal,
      identificacionFiscal: fila.identificacion_fiscal,
      razonSocial: fila.razon_social,
      nombreComercial: fila.nombre_comercial,
      countryCode: fila.country_code,
      moneda: fila.moneda,
      datosBancarios: derivarResumenBancario(fila.datos_bancarios),
    },
  };
}

// ---------------------------------------------------------------------------
// Catálogos del wizard
// ---------------------------------------------------------------------------

export interface PaisRegistro {
  codigoIso2: string;
  nombre: string;
  moneda: string;
  /** Tipos fiscales habilitados en cat_paises, en orden del catálogo. */
  tiposFiscales: TipoFiscal[];
  /** Máscara regex por tipo fiscal (fuente: cat_paises.mascara_id_fiscal). */
  mascaraPorTipo: Partial<Record<TipoFiscal, string>>;
  /**
   * S84-A32bis — **EL NOMBRE VISIBLE del documento fiscal, por figura**
   * (fuente: `cat_paises.nombre_id_fiscal`, misma forma que la máscara).
   *
   * **NO se hardcodea, y la razón es medible: en Colombia una persona
   * jurídica no tiene RUC, tiene NIT.** Como el país del documento SE
   * ELIGE, la pantalla puede estar en EC mostrando uno de otro país —
   * hardcodear *"RUC"* la haría mentir apenas alguien elija Colombia.
   * *Es el mismo caso que el teléfono ya cobró en S84.*
   *
   * ⚠️ **VACÍO ES EL CASO NORMAL, no el borde:** de los 23 países del
   * catálogo **solo EC declara datos fiscales** (medido: 1 de 23 con
   * máscara y con tipos). ⇒ **la superficie NECESITA el genérico**
   * —*"tu identificación fiscal"*— **como camino habitual fuera de
   * Ecuador**, no como plan B. *Genérico y verdadero le gana a específico
   * y falso, y acá además es lo que va a pasar casi siempre.*
   */
  nombrePorTipo: Partial<Record<TipoFiscal, string>>;
}

/** Países ACTIVOS para registro (hoy: EC). Fuente cat_paises — la misma
 *  que valida crear_cuenta_comercial_inicial del lado del server. */
export async function obtenerPaisesParaRegistro(): Promise<
  ResultadoWrapper<PaisRegistro[], CodigoErrorCuentaComercial>
> {
  const { data, error } = await getClient()
    .from('cat_paises')
    .select('codigo_iso2, nombre, moneda_default, tipos_fiscales_soportados, mascara_id_fiscal, nombre_id_fiscal, orden')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (error) return errorGenerico('error_desconocido');
  if (!Array.isArray(data)) return errorGenerico('datos_inconsistentes');

  const paises: PaisRegistro[] = data.map((p) => {
    const tiposFiscales = TIPOS_FISCALES.filter((t) =>
      p.tipos_fiscales_soportados.includes(t),
    );
    const mascaraPorTipo: Partial<Record<TipoFiscal, string>> = {};
    if (typeof p.mascara_id_fiscal === 'object' && p.mascara_id_fiscal !== null && !Array.isArray(p.mascara_id_fiscal)) {
      for (const t of tiposFiscales) {
        const m = (p.mascara_id_fiscal as Record<string, unknown>)[t];
        if (typeof m === 'string' && m.length > 0) mascaraPorTipo[t] = m;
      }
    }
    // misma forma que la máscara: mismo jsonb keyed por figura, misma
    // lectura defensiva. Se espeja a propósito — dos estructuras para el
    // mismo eje es como nacen las divergencias.
    const nombrePorTipo: Partial<Record<TipoFiscal, string>> = {};
    if (typeof p.nombre_id_fiscal === 'object' && p.nombre_id_fiscal !== null && !Array.isArray(p.nombre_id_fiscal)) {
      for (const t of tiposFiscales) {
        const n = (p.nombre_id_fiscal as Record<string, unknown>)[t];
        if (typeof n === 'string' && n.length > 0) nombrePorTipo[t] = n;
      }
    }
    return {
      codigoIso2: p.codigo_iso2,
      nombre: p.nombre,
      moneda: p.moneda_default,
      tiposFiscales,
      mascaraPorTipo,
      nombrePorTipo,
    };
  });

  return { ok: true, data: paises };
}

export interface BancoCatalogo {
  codigo: string;
  nombre: string;
}

/** Bancos activos del país (cat_bancos vía RPC del catálogo). */
export async function obtenerBancosDePais(
  countryCode: string,
): Promise<ResultadoWrapper<BancoCatalogo[], CodigoErrorCuentaComercial>> {
  const { data, error } = await getClient().rpc('get_bancos_activos_por_pais', {
    p_country_code: countryCode,
  });

  if (error) return errorGenerico('error_desconocido');
  if (!Array.isArray(data)) return errorGenerico('datos_inconsistentes');
  return {
    ok: true,
    data: data.map((b) => ({ codigo: b.codigo, nombre: b.nombre })),
  };
}

export interface TipoDocumentoTitular {
  codigo: string;
  nombre: string;
  /** Regex de validación (frontend valida ANTES de mandar; el server re-valida). */
  mascaraValidacion: string | null;
}

/** Tipos de documento del titular bancario por país. */
export async function obtenerTiposDocumentoTitular(
  countryCode: string,
): Promise<ResultadoWrapper<TipoDocumentoTitular[], CodigoErrorCuentaComercial>> {
  const { data, error } = await getClient().rpc('get_tipos_documento_titular_por_pais', {
    p_country_code: countryCode,
  });

  if (error) return errorGenerico('error_desconocido');
  if (!Array.isArray(data)) return errorGenerico('datos_inconsistentes');
  return {
    ok: true,
    data: data.map((t) => ({
      codigo: t.codigo,
      nombre: t.nombre,
      mascaraValidacion: typeof t.mascara_validacion === 'string' && t.mascara_validacion.length > 0
        ? t.mascara_validacion
        : null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Detección §6.5 — identificación fiscal AL INICIO
// ---------------------------------------------------------------------------

export interface DisponibilidadIdentificacion {
  disponible: boolean;
  /** Mensaje honesto del server cuando NO está disponible (jamás datos ajenos). */
  mensaje: string | null;
}

/** ¿La identificación fiscal ya existe en el país? RPC DEFINER dedicada —
 *  responde SOLO sí/no + mensaje; la RLS no deja leer cuentas ajenas. */
export async function verificarIdentificacionDisponible(
  countryCode: string,
  identificacion: string,
): Promise<ResultadoWrapper<DisponibilidadIdentificacion, CodigoErrorCuentaComercial>> {
  const { data, error } = await getClient().rpc('verificar_identificacion_disponible', {
    p_country_code: countryCode,
    p_identificacion: identificacion,
  });

  if (error) return errorGenerico('error_desconocido');
  const fila = Array.isArray(data) ? data[0] : undefined;
  if (fila === undefined || typeof fila.disponible !== 'boolean') {
    return errorGenerico('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      disponible: fila.disponible,
      mensaje: typeof fila.mensaje === 'string' && fila.mensaje.length > 0 ? fila.mensaje : null,
    },
  };
}

// ---------------------------------------------------------------------------
// Escritura — SIEMPRE vía RPC (el wizard JAMÁS activa: §7.11 es del admin)
// ---------------------------------------------------------------------------

export interface InputCrearCuentaComercial {
  countryCode: string;
  tipoFiscal: TipoFiscal;
  identificacionFiscal: string;
  razonSocial: string;
  nombreComercial: string;
}

/** Crea la cuenta comercial en 'pendiente_validacion' con datos_bancarios
 *  {} (flujo §6.5 paso 1-2; los bancarios se completan aparte, §8.13). */
export async function crearCuentaComercialInicial(
  input: InputCrearCuentaComercial,
): Promise<ResultadoWrapper<{ cuentaComercialId: string }, CodigoErrorCuentaComercial>> {
  const { data, error } = await getClient().rpc('crear_cuenta_comercial_inicial', {
    p_country_code: input.countryCode,
    p_tipo_fiscal: input.tipoFiscal,
    p_identificacion_fiscal: input.identificacionFiscal,
    p_razon_social: input.razonSocial,
    p_nombre_comercial: input.nombreComercial,
  });

  if (error) return errorGenerico('error_desconocido');
  const fila = Array.isArray(data) ? data[0] : undefined;
  if (fila === undefined || typeof fila.success !== 'boolean') {
    return errorGenerico('datos_inconsistentes');
  }
  if (!fila.success) return rechazo(fila.mensaje ?? '');
  if (typeof fila.cuenta_comercial_id !== 'string') return errorGenerico('datos_inconsistentes');
  return { ok: true, data: { cuentaComercialId: fila.cuenta_comercial_id } };
}

export interface InputDatosBancarios {
  cuentaComercialId: string;
  bancoCodigo: string;
  bancoNombre: string;
  tipoCuenta: 'corriente' | 'ahorros';
  numeroCuenta: string;
  titularNombre: string;
  titularTipoDocumento: string;
  titularDocumento: string;
}

/** Guarda el set COMPLETO de datos bancarios (la RPC es todo-o-nada por
 *  diseño: las 7 claves del esquema §7.12 o nada — sin estados a medias). */
export async function actualizarDatosBancarios(
  input: InputDatosBancarios,
): Promise<ResultadoWrapper<true, CodigoErrorCuentaComercial>> {
  const { data, error } = await getClient().rpc('actualizar_datos_bancarios', {
    p_cuenta_comercial_id: input.cuentaComercialId,
    p_banco_codigo: input.bancoCodigo,
    p_banco_nombre: input.bancoNombre,
    p_tipo_cuenta: input.tipoCuenta,
    p_numero_cuenta: input.numeroCuenta,
    p_titular_nombre: input.titularNombre,
    p_titular_tipo_documento: input.titularTipoDocumento,
    p_titular_documento: input.titularDocumento,
  });

  if (error) return errorGenerico('error_desconocido');
  const fila = Array.isArray(data) ? data[0] : undefined;
  if (fila === undefined || typeof fila.success !== 'boolean') {
    return errorGenerico('datos_inconsistentes');
  }
  if (!fila.success) return rechazo(fila.mensaje ?? '');
  return { ok: true, data: true };
}

// ── S96 (firma founder 12-ago): EL SELECTOR DE CUENTA COMERCIAL ─────────────
//
// El hallazgo ① del gate: un usuario que opera DOS cuentas (empleado de una
// veterinaria Y dueño de su despensa) quedaba atrapado en la primera — la
// tarjeta de ventas vivía detrás del muro de titularidad de un negocio
// AJENO, y no había forma de ver la lista. «La veterinaria que además vende
// alimento es exactamente el canal de adquisición de MODELO_DESPENSA §4» —
// el selector es FUNCIÓN, no diseño (firma).
//
// Este lector enumera TODAS las cuentas que la persona opera, por las dos
// vías que ya existían por separado: propia (owner) y gestión (la RLS de
// `prestadores` decide qué negocios gestiona — misma consulta que el brazo
// D-660 de arriba, sin el `limit(1)`).

export interface CuentaOperada {
  id: string;
  nombreComercial: string | null;
  estado: string;
  /** 'propia' = owner_profile_id · 'gestion' = llega por un prestador que
   *  gestiona. Si una cuenta entra por las dos, gana 'propia'. */
  via: 'propia' | 'gestion';
  /** Roles activos (`tipo_actor` de cuenta_roles). ⚠️ La RLS de esa tabla es
   *  owner-only: para las cuentas por GESTIÓN esta lista viene VACÍA, y
   *  vacío significa «no medible desde acá», no «sin roles» — la pantalla
   *  no decide naturalezas con una lista vacía de una cuenta gestionada. */
  roles: string[];
}

export async function misCuentasComerciales(): Promise<
  ResultadoWrapper<CuentaOperada[], CodigoErrorCuentaComercial>
> {
  const uid = await uidActual();
  if (!uid) return errorGenerico('sin_sesion');

  const COLS = 'id, estado, nombre_comercial';
  const [propias, gestionadas] = await Promise.all([
    getClient().from('cuentas_comerciales').select(COLS).eq('owner_profile_id', uid),
    getClient()
      .from('prestadores')
      .select(`cuenta:cuentas_comerciales!inner(${COLS})`)
      .not('cuenta_comercial_id', 'is', null),
  ]);
  if (propias.error || gestionadas.error) return errorGenerico('error_desconocido');

  const porId = new Map<string, CuentaOperada>();
  for (const filaGestion of gestionadas.data ?? []) {
    const anidada = (filaGestion as { cuenta?: unknown }).cuenta;
    const c = Array.isArray(anidada) ? anidada[0] : anidada;
    if (c && typeof c === 'object' && typeof (c as { id?: unknown }).id === 'string') {
      const fila = c as { id: string; estado: string; nombre_comercial: string | null };
      porId.set(fila.id, {
        id: fila.id,
        nombreComercial: fila.nombre_comercial,
        estado: fila.estado,
        via: 'gestion',
        roles: [],
      });
    }
  }
  for (const fila of propias.data ?? []) {
    porId.set(fila.id, {
      id: fila.id,
      nombreComercial: fila.nombre_comercial,
      estado: fila.estado,
      via: 'propia',
      roles: [],
    });
  }
  if (porId.size === 0) return { ok: true, data: [] };

  // Los roles, en UN viaje (S94-PERF). La RLS descarta sola lo que el user
  // no puede leer — el wrapper no filtra en memoria lo que el server decide.
  const roles = await getClient()
    .from('cuenta_roles')
    .select('cuenta_comercial_id, tipo_actor, estado')
    .in('cuenta_comercial_id', [...porId.keys()])
    .eq('estado', 'activo');
  if (!roles.error) {
    for (const r of roles.data ?? []) {
      const cuenta = porId.get(r.cuenta_comercial_id as string);
      if (cuenta && typeof r.tipo_actor === 'string') cuenta.roles.push(r.tipo_actor);
    }
  }
  return { ok: true, data: [...porId.values()] };
}

// ── EL ALTA DEL VENDEDOR PURO (S97-A · 13-ago) ──────────────────────────────
// La configuración cuelga de la CUENTA COMERCIAL (firma de mesa): los
// documentos y el nombre se completan sin fila de prestador. Espejos del
// contrato del prestador, colgados de la cuenta.

/** Un documento de la cuenta comercial (RUC, cédula, permiso). */
export interface DocumentoCuenta {
  id: string;
  tipo: 'cedula' | 'ruc' | 'permiso_funcionamiento';
  nombre: string;
  /** PATH dentro del bucket privado `cuenta-documentos` (jamás URL). */
  archivo_url: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'vencido';
  notas_revision: string | null;
  created_at: string;
}

const TIPOS_DOC_CUENTA = ['cedula', 'ruc', 'permiso_funcionamiento'] as const;
const ESTADOS_DOC_CUENTA = ['pendiente', 'aprobado', 'rechazado', 'vencido'] as const;

/** Los documentos de la cuenta — la RLS decide qué filas existen para esta
 *  sesión (operador de la cuenta o admin). */
export async function listarDocumentosCuenta(
  cuentaComercialId: string,
): Promise<ResultadoWrapper<DocumentoCuenta[], CodigoErrorCuentaComercial>> {
  const uid = await uidActual();
  if (!uid) return errorGenerico('sin_sesion');
  const { data, error } = await getClient()
    .from('cuenta_comercial_documentos')
    .select('id, tipo, nombre, archivo_url, estado, notas_revision, created_at')
    .eq('cuenta_comercial_id', cuentaComercialId)
    .order('created_at', { ascending: false });
  if (error) return errorGenerico('error_desconocido');
  const salida: DocumentoCuenta[] = [];
  for (const f of data ?? []) {
    const tipo = TIPOS_DOC_CUENTA.find((t) => t === f.tipo);
    const estado = ESTADOS_DOC_CUENTA.find((e) => e === f.estado);
    if (!tipo || !estado || typeof f.id !== 'string') {
      return errorGenerico('error_desconocido');
    }
    salida.push({
      id: f.id,
      tipo,
      nombre: typeof f.nombre === 'string' ? f.nombre : '',
      archivo_url: typeof f.archivo_url === 'string' ? f.archivo_url : '',
      estado,
      notas_revision: typeof f.notas_revision === 'string' ? f.notas_revision : null,
      created_at: typeof f.created_at === 'string' ? f.created_at : '',
    });
  }
  return { ok: true, data: salida };
}

/** Registra la FILA del documento (el archivo ya subido al bucket
 *  `cuenta-documentos` bajo la carpeta `<cuentaId>/…` — la policy del
 *  bucket la llavea por operador). Nace `pendiente`: el veredicto es de
 *  e-PetPlace (`revisar_documento_cuenta`, admin). */
export async function registrarDocumentoCuenta(input: {
  cuenta_comercial_id: string;
  tipo: DocumentoCuenta['tipo'];
  nombre: string;
  archivo_path: string;
  pais_emisor?: string;
}): Promise<ResultadoWrapper<{ documento_id: string }, CodigoErrorCuentaComercial>> {
  const uid = await uidActual();
  if (!uid) return errorGenerico('sin_sesion');
  const { data, error } = await getClient()
    .from('cuenta_comercial_documentos')
    .insert({
      cuenta_comercial_id: input.cuenta_comercial_id,
      tipo: input.tipo,
      nombre: input.nombre,
      archivo_url: input.archivo_path,
      pais_emisor: input.pais_emisor ?? null,
    })
    .select('id')
    .single();
  if (error) return { ok: false, codigo: 'rechazado_por_servidor', mensaje: error.message };
  if (!data || typeof data.id !== 'string') {
    return errorGenerico('error_desconocido');
  }
  return { ok: true, data: { documento_id: data.id } };
}

/** El nombre comercial se CORRIGE (D-791 hermana: nada queda mal para
 *  siempre). Puerta DEFINER gateada por owner — un operador no-titular
 *  rebota `solo_el_titular_corrige_el_nombre`. */
export async function actualizarNombreCuentaComercial(
  cuentaComercialId: string,
  nombreComercial: string,
): Promise<ResultadoWrapper<{ nombre_comercial: string }, CodigoErrorCuentaComercial>> {
  const uid = await uidActual();
  if (!uid) return errorGenerico('sin_sesion');
  const { data, error } = await getClient().rpc('actualizar_nombre_cuenta_comercial', {
    p_cuenta_comercial_id: cuentaComercialId,
    p_nombre_comercial: nombreComercial,
  });
  if (error) return { ok: false, codigo: 'rechazado_por_servidor', mensaje: error.message };
  const r = data as { ok?: unknown; nombre_comercial?: unknown } | null;
  if (!r || r.ok !== true || typeof r.nombre_comercial !== 'string') {
    return errorGenerico('error_desconocido');
  }
  return { ok: true, data: { nombre_comercial: r.nombre_comercial } };
}
