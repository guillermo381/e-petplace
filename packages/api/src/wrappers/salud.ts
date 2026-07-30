// Salud del expediente — LOS PRODUCTORES DEL DUEÑO (S82-A r4): los tres
// motores que el gate descubrió por ausencia ("Cómo está hoy" con 3 de 4
// celdas en Sin registro porque el producto no producía esos datos).
//
//   · registrarDesparasitacion — el 2º tipo fecha-sola (D-312 sonó)
//   · declararSinAlergiasConocidas — "sin registro" ≠ "ninguna conocida"
//   · registrarPesoMascota — la puerta de la SERIE (el motor ya existía)
//   · obtenerHistoriaPeso — el lector de la serie (sin serie no se puede
//     decir "estable 6 meses"; el cálculo es de domain/pantalla)
//
// Todas las puertas son molde P19 (DEFINER + familiar adulto + errores
// tipados, verificadas E2E con JWT real y ROLLBACK — L-114).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos guardar. Revisa tu conexión y prueba de nuevo.';

export type CodigoErrorSalud =
  | 'sin_sesion'
  | 'sin_acceso'
  | 'producto_requerido'
  | 'tipo_invalido'
  | 'fecha_futura'
  | 'orden_fechas_invalido'
  | 'peso_invalido'
  | 'metodo_invalido'
  | 'error_lectura'
  | 'desconocido';

// L-115: la RPC levanta 'codigo: detalle' — se normaliza por startsWith.
function codigoSalud(mensaje: string): CodigoErrorSalud {
  if (mensaje.startsWith('auth_required')) return 'sin_sesion';
  if (mensaje.startsWith('no_access_to_mascota')) return 'sin_acceso';
  if (mensaje.startsWith('producto_requerido')) return 'producto_requerido';
  if (mensaje.startsWith('tipo_invalido')) return 'tipo_invalido';
  if (mensaje.startsWith('fecha_futura')) return 'fecha_futura';
  if (mensaje.startsWith('orden_fechas_invalido')) return 'orden_fechas_invalido';
  if (mensaje.startsWith('peso_invalido')) return 'peso_invalido';
  if (mensaje.startsWith('metodo_invalido')) return 'metodo_invalido';
  return 'desconocido';
}

export type TipoDesparasitacion = 'interna' | 'externa' | 'mixta';

/** Registra una desparasitación declarada por la familia (evento del
 *  expediente con su próxima fecha — molde de vacunas). El padre nace
 *  por trigger con procedencia declarado_por_familia. */
export async function registrarDesparasitacion(
  mascotaId: string,
  datos: {
    producto: string;
    tipo?: TipoDesparasitacion;
    fecha_aplicada?: string;
    fecha_proxima?: string;
    notas?: string;
  },
): Promise<ResultadoWrapper<{ id: string; mascota_id: string }, CodigoErrorSalud>> {
  const { data, error } = await getClient().rpc('registrar_desparasitacion', {
    p_mascota_id: mascotaId,
    p_producto: datos.producto,
    ...(datos.tipo !== undefined ? { p_tipo: datos.tipo } : null),
    ...(datos.fecha_aplicada !== undefined ? { p_fecha_aplicada: datos.fecha_aplicada } : null),
    ...(datos.fecha_proxima !== undefined ? { p_fecha_proxima: datos.fecha_proxima } : null),
    ...(datos.notas !== undefined ? { p_notas: datos.notas } : null),
  });
  if (error) return { ok: false, codigo: codigoSalud(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || typeof o !== 'object' || o.ok !== true || typeof o.id !== 'string' || typeof o.mascota_id !== 'string') {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: { id: o.id, mascota_id: o.mascota_id } };
}

/** Declara el hecho clínico "NINGUNA alergia conocida" (S82: distinto de
 *  "sin registro" — sin esta declaración la pantalla miente). Idempotente:
 *  re-declarar refresca fecha y autor. La PRECEDENCIA la aplica el lector
 *  (perfilMascota): una lista de alergias NO vacía le gana. */
export async function declararSinAlergiasConocidas(
  mascotaId: string,
): Promise<ResultadoWrapper<{ mascota_id: string; declarada_en: string }, CodigoErrorSalud>> {
  const { data, error } = await getClient().rpc('declarar_sin_alergias_conocidas', {
    p_mascota_id: mascotaId,
  });
  if (error) return { ok: false, codigo: codigoSalud(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || typeof o !== 'object' || o.ok !== true || typeof o.mascota_id !== 'string' || typeof o.declarada_en !== 'string') {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: { mascota_id: o.mascota_id, declarada_en: o.declarada_en } };
}

export type MetodoPeso = 'bascula_clinica' | 'bascula_casa' | 'estimacion';

/** Registra un peso en la SERIE (evento_peso_medicion — el motor
 *  pre-existente S66/S70: el padre y la propagación al snapshot son de
 *  sus triggers). Rango 0–150 kg en la puerta, tipado. */
export async function registrarPesoMascota(
  mascotaId: string,
  datos: { peso_kg: number; metodo?: MetodoPeso; fecha?: string; notas?: string },
): Promise<ResultadoWrapper<{ id: string; mascota_id: string; peso_kg: number }, CodigoErrorSalud>> {
  const { data, error } = await getClient().rpc('registrar_peso_mascota', {
    p_mascota_id: mascotaId,
    p_peso_kg: datos.peso_kg,
    ...(datos.metodo !== undefined ? { p_metodo: datos.metodo } : null),
    ...(datos.fecha !== undefined ? { p_fecha: datos.fecha } : null),
    ...(datos.notas !== undefined ? { p_notas: datos.notas } : null),
  });
  if (error) return { ok: false, codigo: codigoSalud(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (
    o === null ||
    typeof o !== 'object' ||
    o.ok !== true ||
    typeof o.id !== 'string' ||
    typeof o.mascota_id !== 'string' ||
    typeof o.peso_kg !== 'number'
  ) {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: { id: o.id, mascota_id: o.mascota_id, peso_kg: o.peso_kg } };
}

export interface PesoDeLaSerie {
  peso_kg: number;
  /** timestamptz ISO de la medición. */
  fecha: string;
  metodo: string | null;
  /** true si la midió un prestador (báscula clínica del negocio). */
  de_prestador: boolean;
}

/** La HISTORIA de peso (serie fechada, más nueva primero). El juicio
 *  "estable N meses" es de domain/pantalla — este lector solo trae la
 *  verdad ordenada. RLS: user_tiene_acceso_a_mascota. */
export async function obtenerHistoriaPeso(
  mascotaId: string,
): Promise<ResultadoWrapper<PesoDeLaSerie[], CodigoErrorSalud>> {
  const r = await getClient()
    .from('evento_peso_medicion')
    .select('peso_kg, fecha_medicion, metodo_medicion, prestador_id')
    .eq('mascota_id', mascotaId)
    .order('fecha_medicion', { ascending: false })
    .limit(100);
  if (r.error) return { ok: false, codigo: 'error_lectura', mensaje: MENSAJE_ERROR };
  return {
    ok: true,
    data: r.data.map((p) => ({
      peso_kg: p.peso_kg,
      fecha: p.fecha_medicion,
      metodo: p.metodo_medicion,
      de_prestador: p.prestador_id !== null,
    })),
  };
}
