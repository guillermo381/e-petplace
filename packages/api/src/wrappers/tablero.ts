/**
 * ⭐ **EL TABLERO DEL PERFIL, EN UNA IDA** (S113 · 2.2).
 *
 * ⚠️ **ENMIENDA ADITIVA DE C, declarada (76(d)) — la tercera de la sesión.** A
 * entregó las tres RPC y **ninguna puerta**: la app no tenía por dónde
 * llamarlas. Se abren acá con el molde de la casa, sin tocar su SQL y sin
 * agregar comportamiento. *Si A prefiere otra forma, se reemplaza entero.*
 *
 * ── LO QUE SE MIDIÓ ANTES DE ESCRIBIR ──────────────────────────────────────
 * Las firmas de `pg_proc` y **las claves del `jsonb_build_object` de cada
 * función**, leídas en su migración — no de su parte. *Un tipo copiado de lo
 * que uno cree que la función devuelve miente el día que algo cambia.*
 *
 * 🔴 **`memorial: true` NO ES UN ERROR: es una respuesta.** La RPC corta ahí y
 * no calcula nada más —«memorial apaga toda proyección» (LOYALTY §8)— así que
 * el tipo lo modela como una UNIÓN: *un tablero con todos sus campos en `null`
 * invita a dibujar tarjetas vacías; una unión no deja.*
 */
import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export const CODIGOS_TABLERO = ['mascota_no_existe', 'sin_acceso', 'desconocido'] as const;
export type CodigoErrorTablero = (typeof CODIGOS_TABLERO)[number];

const MENSAJES: Record<CodigoErrorTablero, string> = {
  mascota_no_existe: 'No encontramos esa mascota.',
  sin_acceso: 'Esta mascota no es de tu familia.',
  desconocido: 'No pudimos leer su tablero. Prueba de nuevo en un rato.',
};

const esObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Un punto de la serie, para el sparkline. */
export interface PuntoPeso {
  kg: number;
  fecha: string;
  fuente: string | null;
}

export interface TableroVivo {
  memorial: false;
  especie: string | null;
  peso: { actual: number | null; fecha: string | null; fuente: string | null; serie: PuntoPeso[] } | null;
  vacunas: Record<string, unknown> | null;
  antiparasitario: Record<string, unknown> | null;
  medicacion: Record<string, unknown> | null;
  citas: Record<string, unknown> | null;
  actividad: Record<string, unknown> | null;
}

export type TableroMascota = TableroVivo | { memorial: true };

export async function obtenerTableroMascota(
  mascotaId: string,
): Promise<ResultadoWrapper<TableroMascota, CodigoErrorTablero>> {
  const { data, error } = await getClient().rpc('obtener_tablero_mascota', { p_mascota_id: mascotaId });
  if (error) return { ok: false, codigo: 'desconocido', mensaje: MENSAJES.desconocido };
  if (!esObj(data) || data.ok !== true) {
    const c = esObj(data) && typeof data.codigo === 'string' && (CODIGOS_TABLERO as readonly string[]).includes(data.codigo)
      ? (data.codigo as CodigoErrorTablero)
      : 'desconocido';
    return { ok: false, codigo: c, mensaje: MENSAJES[c] };
  }
  if (data.memorial === true) return { ok: true, data: { memorial: true } };
  return {
    ok: true,
    data: {
      memorial: false,
      especie: typeof data.especie === 'string' ? data.especie : null,
      peso: esObj(data.peso)
        ? {
            actual: typeof data.peso.actual === 'number' ? data.peso.actual : null,
            fecha: typeof data.peso.fecha === 'string' ? data.peso.fecha : null,
            fuente: typeof data.peso.fuente === 'string' ? data.peso.fuente : null,
            /* La serie viaja aunque esté vacía: **sin puntos no hay sparkline**,
               y eso lo decide la pantalla mirando el largo, no adivinando. */
            serie: Array.isArray(data.peso.serie)
              ? (data.peso.serie as unknown[]).filter(esObj).map((p) => ({
                  kg: typeof p.kg === 'number' ? p.kg : 0,
                  fecha: typeof p.fecha === 'string' ? p.fecha : '',
                  fuente: typeof p.fuente === 'string' ? p.fuente : null,
                }))
              : [],
          }
        : null,
      vacunas: esObj(data.vacunas) ? data.vacunas : null,
      antiparasitario: esObj(data.antiparasitario) ? data.antiparasitario : null,
      medicacion: esObj(data.medicacion) ? data.medicacion : null,
      citas: esObj(data.citas) ? data.citas : null,
      actividad: esObj(data.actividad) ? data.actividad : null,
    },
  };
}

export interface CitaDeMascota {
  id: string;
  fecha: string;
  hora: string | null;
  servicio: string | null;
  prestador: string | null;
  estado: string | null;
}

export async function obtenerCitasDeMascota(
  mascotaId: string,
): Promise<ResultadoWrapper<{ futuras: CitaDeMascota[]; pasadas: CitaDeMascota[]; pasadasTotal: number }, CodigoErrorTablero>> {
  const { data, error } = await getClient().rpc('obtener_citas_de_mascota', { p_mascota_id: mascotaId });
  if (error || !esObj(data) || data.ok !== true) {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJES.desconocido };
  }
  const lista = (v: unknown): CitaDeMascota[] =>
    Array.isArray(v)
      ? v.filter(esObj).map((c) => ({
          id: typeof c.id === 'string' ? c.id : '',
          fecha: typeof c.fecha === 'string' ? c.fecha : '',
          hora: typeof c.hora === 'string' ? c.hora : null,
          servicio: typeof c.servicio === 'string' ? c.servicio : null,
          prestador: typeof c.prestador === 'string' ? c.prestador : null,
          estado: typeof c.estado === 'string' ? c.estado : null,
        }))
      : [];
  return {
    ok: true,
    data: {
      futuras: lista(data.futuras),
      pasadas: lista(data.pasadas),
      pasadasTotal: typeof data.pasadas_total === 'number' ? data.pasadas_total : 0,
    },
  };
}

/** 🔴 **UNA sola cosa para hoy, y puede ser NINGUNA.** La RPC elige entre el
 *  aviso de Nexo, la cita y la vacuna que vence — *«nunca dos», dice el brief,
 *  y dos tarjetas de urgencia distinta compiten en vez de informar.* */
export interface HoyMascota {
  hay: boolean;
  fuente: string | null;
  detalle: Record<string, unknown> | null;
}

export async function obtenerHoyMascota(
  mascotaId: string,
): Promise<ResultadoWrapper<HoyMascota, CodigoErrorTablero>> {
  const { data, error } = await getClient().rpc('obtener_hoy_mascota', { p_mascota_id: mascotaId });
  if (error || !esObj(data) || data.ok !== true) {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJES.desconocido };
  }
  const hoy = esObj(data.hoy) ? data.hoy : null;
  return {
    ok: true,
    data: {
      hay: hoy !== null,
      fuente: hoy !== null && typeof hoy.fuente === 'string' ? hoy.fuente : null,
      detalle: hoy,
    },
  };
}
