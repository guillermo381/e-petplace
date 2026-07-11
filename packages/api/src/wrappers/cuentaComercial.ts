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

import { getClient } from '../client';
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
  const { data: auth } = await getClient().auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return errorGenerico('sin_sesion');

  const { data, error } = await getClient()
    .from('cuentas_comerciales')
    .select(
      'id, estado, tipo_fiscal, identificacion_fiscal, razon_social, nombre_comercial, country_code, moneda, datos_bancarios',
    )
    .eq('owner_profile_id', uid)
    .maybeSingle();

  if (error) return errorGenerico('error_desconocido');
  if (data === null) return { ok: true, data: null };

  return {
    ok: true,
    data: {
      id: data.id,
      estado: data.estado,
      tipoFiscal: data.tipo_fiscal,
      identificacionFiscal: data.identificacion_fiscal,
      razonSocial: data.razon_social,
      nombreComercial: data.nombre_comercial,
      countryCode: data.country_code,
      moneda: data.moneda,
      datosBancarios: derivarResumenBancario(data.datos_bancarios),
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
}

/** Países ACTIVOS para registro (hoy: EC). Fuente cat_paises — la misma
 *  que valida crear_cuenta_comercial_inicial del lado del server. */
export async function obtenerPaisesParaRegistro(): Promise<
  ResultadoWrapper<PaisRegistro[], CodigoErrorCuentaComercial>
> {
  const { data, error } = await getClient()
    .from('cat_paises')
    .select('codigo_iso2, nombre, moneda_default, tipos_fiscales_soportados, mascara_id_fiscal, orden')
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
    return {
      codigoIso2: p.codigo_iso2,
      nombre: p.nombre,
      moneda: p.moneda_default,
      tiposFiscales,
      mascaraPorTipo,
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
