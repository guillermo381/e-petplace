// LECTOR de presupuestos para la familia (S69-A3, cara del dueño).
// Solo lectura — la RLS `presupuesto_select_familia` (migración 20260718170000)
// deja a la familia ver los presupuestos de sus mascotas. El VENCIDO es
// PEREZOSO: un presupuesto 'enviado' con vence_en < now() se resuelve 'vencido'
// en el shape (cero estado extra en DB). El escritura vive en las RPCs de la B
// (aprobarPresupuestoFamilia / rechazarPresupuesto).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export interface PresupuestoItemLeido {
  id: string;
  /** Nombre para mostrar: el del tipo de servicio, o la descripción libre. */
  nombre: string;
  precio: number;
  cantidad: number;
}

export type EstadoEfectivoPresupuesto = 'enviado' | 'vencido';

export interface PresupuestoFamilia {
  id: string;
  mascotaId: string;
  mascotaNombre: string | null;
  /**
   * Nombre comercial del negocio que envió el presupuesto (D-455, S71-A).
   * Viene de la RPC angosta `obtener_nombres_negocio_por_presupuesto`
   * (la RLS de cuentas_comerciales es solo-owner y el dueño no puede leer
   * la tabla). null honesto si la RPC falla — la pantalla omite, jamás
   * inventa quién.
   */
  negocioNombre: string | null;
  total: number;
  /** ISO. La cara del dueño lo muestra siempre. */
  venceEn: string;
  /** ISO — cuándo se recibió (se envió). */
  recibidoEn: string;
  /** enviado (vigente) | vencido (perezoso, computado). */
  estadoEfectivo: EstadoEfectivoPresupuesto;
  items: PresupuestoItemLeido[];
}

const COD = ['sin_sesion', 'error_lectura'] as const;
export type CodigoErrorPresupuestosLeidos = (typeof COD)[number];
const MSG: Record<CodigoErrorPresupuestosLeidos, string> = {
  sin_sesion: 'Iniciá sesión para ver tus presupuestos.',
  error_lectura: 'No pudimos cargar tus presupuestos.',
};

function esObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function mapFila(f: Record<string, unknown>, nombres: Map<string, string>): PresupuestoFamilia {
  const venceEn = String(f['vence_en'] ?? '');
  const estadoEfectivo: EstadoEfectivoPresupuesto =
    venceEn !== '' && new Date(venceEn).getTime() < Date.now() ? 'vencido' : 'enviado';
  const mascota = esObj(f['mascota']) ? f['mascota'] : null;
  const itemsRaw = Array.isArray(f['items']) ? f['items'] : [];
  const items: PresupuestoItemLeido[] = itemsRaw.filter(esObj).map((i) => {
    const tipo = esObj(i['tipo']) ? i['tipo'] : null;
    const nombreTipo = tipo && typeof tipo['nombre'] === 'string' ? (tipo['nombre'] as string) : null;
    const libre = typeof i['descripcion_libre'] === 'string' ? (i['descripcion_libre'] as string) : null;
    return {
      id: String(i['id']),
      nombre: nombreTipo ?? libre ?? '',
      precio: Number(i['precio'] ?? 0),
      cantidad: Number(i['cantidad'] ?? 1),
    };
  });
  return {
    id: String(f['id']),
    mascotaId: String(f['mascota_id']),
    mascotaNombre: mascota && typeof mascota['nombre'] === 'string' ? (mascota['nombre'] as string) : null,
    negocioNombre: nombres.get(String(f['id'])) ?? null,
    total: Number(f['total'] ?? 0),
    venceEn,
    recibidoEn: String(f['created_at'] ?? ''),
    estadoEfectivo,
    items,
  };
}

/**
 * Presupuestos ENVIADOS de la familia (todas sus mascotas), con ítems y estado
 * efectivo (vencido perezoso). Ordenados por el más próximo a vencer primero —
 * el hub usa el primero como habitante de la Zona 3; /citas filtra por mascota.
 */
export async function obtenerPresupuestosFamilia(): Promise<
  ResultadoWrapper<PresupuestoFamilia[], CodigoErrorPresupuestosLeidos>
> {
  const { data, error } = await getClient()
    .from('presupuesto')
    .select(
      'id, mascota_id, total, vence_en, created_at, estado, ' +
        'mascota:mascotas(nombre), ' +
        'items:presupuesto_item(id, descripcion_libre, precio, cantidad, tipo:tipos_servicio(nombre))',
    )
    .eq('estado', 'enviado')
    .order('vence_en', { ascending: true })
    .returns<Record<string, unknown>[]>();

  if (error) return { ok: false, codigo: 'error_lectura', mensaje: MSG.error_lectura };
  const filas = Array.isArray(data) ? data : [];

  // D-455 (S71-A): el nombre del negocio, por la RPC angosta (batch único).
  // Si la RPC falla, negocioNombre queda null en todas — la lectura principal
  // NO se cae por el adorno (Ley 13: el error del nombre no rompe la lista).
  const nombres = new Map<string, string>();
  const ids = filas.filter(esObj).map((f) => String(f['id']));
  if (ids.length > 0) {
    const rn = await getClient().rpc('obtener_nombres_negocio_por_presupuesto', {
      p_presupuesto_ids: ids,
    });
    if (!rn.error && Array.isArray(rn.data)) {
      for (const fila of rn.data) {
        if (esObj(fila) && typeof fila['presupuesto_id'] === 'string' && typeof fila['nombre_comercial'] === 'string') {
          nombres.set(fila['presupuesto_id'], fila['nombre_comercial']);
        }
      }
    }
  }

  return { ok: true, data: filas.filter(esObj).map((f) => mapFila(f, nombres)) };
}
