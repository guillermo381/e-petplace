// LA PANTALLA MÍNIMA DEL REPARTIDOR (S96 · LETRA_RECORRIDO_DESPENSA_S96 §9).
//
// «Mis entregas de hoy» — la lista, en orden. Al abrir una: dirección, punto
// en el mapa, referencia, instrucciones y un botón para llamar. **Tres
// acciones y nada más**: voy hacia acá · entregado (pide foto y el código que
// la familia dice en la puerta) · no había nadie.
//
// 🔴 QUÉ VE: el envío asignado a él y NADA más. Este archivo lee UNA tabla
// (`envios`, cuya RLS tiene el brazo del repartidor asignado) y no importa
// nada del catálogo, de `pedidos` ni de la mascota — la palabra `mascota` no
// existe acá, y no puede existir: el snapshot del envío es todo lo que la
// puerta necesita. Se cierra en los permisos del servidor, jamás en la
// pantalla (juez S96).
//
// FUERA (§9.1): rutas, optimización, chat, catálogo, cualquier otro pedido.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
import {
  falloDespensa,
  falloDespensaCodigo,
  esObjDespensa,
  type CodigoErrorDespensa,
} from './_despensa-comun';

export interface EntregaAsignada {
  envio_id: string;
  pedido_id: string;
  /** 'en_reparto' | 'hacia_destino' | 'entregado' | 'fallido' — el estado del
   *  ENVÍO (vocabulario propio, no el del pedido). */
  estado: string;
  destino_direccion: string;
  destino_referencia: string | null;
  /** Lo que el cliente dejó dicho AL COMPRAR ("dejar en portería"). Decide la
   *  entrega fallida (§9.3): se lee ANTES de tocar el timbre. */
  instrucciones_entrega: string | null;
  destino_lat: number | null;
  destino_lon: number | null;
  /** Para el botón de llamar — el único canal de v1. */
  nombre_receptor: string | null;
  telefono_receptor: string | null;
  promesa_desde: string | null;
  promesa_hasta: string | null;
  intentos_entrega: number;
  salio_en: string | null;
  hacia_destino_en: string | null;
}

function mapearEnvio(f: unknown): EntregaAsignada | null {
  if (!esObjDespensa(f) || typeof f.id !== 'string' || typeof f.pedido_id !== 'string') {
    return null;
  }
  const s = (v: unknown): string | null => (typeof v === 'string' ? v : null);
  const n = (v: unknown): number | null => (typeof v === 'number' ? v : null);
  return {
    envio_id: f.id,
    pedido_id: f.pedido_id,
    estado: typeof f.estado === 'string' ? f.estado : '',
    destino_direccion: typeof f.destino_direccion === 'string' ? f.destino_direccion : '',
    destino_referencia: s(f.destino_referencia),
    instrucciones_entrega: s(f.instrucciones_entrega),
    destino_lat: n(f.destino_lat),
    destino_lon: n(f.destino_lon),
    nombre_receptor: s(f.nombre_receptor),
    telefono_receptor: s(f.telefono_receptor),
    promesa_desde: s(f.promesa_entrega_desde),
    promesa_hasta: s(f.promesa_entrega_hasta),
    intentos_entrega: typeof f.intentos_entrega === 'number' ? f.intentos_entrega : 0,
    salio_en: s(f.salio_en),
    hacia_destino_en: s(f.hacia_destino_en),
  };
}

/**
 * Mis entregas. La RLS decide QUÉ filas existen para esta sesión: el brazo del
 * repartidor solo matchea envíos con `repartidor_id` suyo — este wrapper no
 * filtra por persona porque no puede saber más que el servidor.
 */
export async function misEntregasAsignadas(): Promise<
  ResultadoWrapper<EntregaAsignada[], CodigoErrorDespensa>
> {
  const { data, error } = await getClient()
    .from('envios')
    .select(
      'id, pedido_id, estado, destino_direccion, destino_referencia, instrucciones_entrega, destino_lat, destino_lon, nombre_receptor, telefono_receptor, promesa_entrega_desde, promesa_entrega_hasta, intentos_entrega, salio_en, hacia_destino_en',
    )
    .in('estado', ['en_reparto', 'hacia_destino', 'fallido'])
    .order('promesa_entrega_desde', { ascending: true, nullsFirst: false });
  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const salida: EntregaAsignada[] = [];
  for (const f of data) {
    const e = mapearEnvio(f);
    if (e === null) return falloDespensa('datos_inconsistentes');
    salida.push(e);
  }
  return { ok: true, data: salida };
}

/** Acción 1 · VOY HACIA ACÁ — la familia es la próxima parada. Dispara el
 *  único aviso que hace que alguien se quede en casa. */
export async function marcarEnCaminoADestino(
  envioId: string,
): Promise<ResultadoWrapper<{ envio_id: string }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('marcar_en_camino_a_destino', {
    p_envio_id: envioId,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return { ok: true, data: { envio_id: envioId } };
}

/**
 * La foto de entrega sube al bucket PRIVADO `entregas`, carpeta del envío.
 * Su letra de privacidad (§9.4): la ven el vendedor y el equipo, jamás otro
 * cliente; vive 90 días; el expediente jamás la toca.
 * Devuelve el path para pasarlo a `entregarConEvidencia`.
 */
export async function subirFotoEntrega(
  envioId: string,
  bytes: ArrayBuffer,
  contentType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
): Promise<ResultadoWrapper<{ path: string }, CodigoErrorDespensa>> {
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const path = `${envioId}/entrega-${Date.now()}.${ext}`;
  const { error } = await getClient().storage.from('entregas').upload(path, bytes, {
    contentType,
    upsert: false,
  });
  if (error) return falloDespensa(error.message);
  return { ok: true, data: { path } };
}

/** Acción 2 · ENTREGADO — pide la FOTO y el CÓDIGO que la familia dice en la
 *  puerta. Sin los dos, el motor rebota (`codigo_incorrecto` /
 *  `foto_requerida`): "entregado" no es la palabra de una sola parte. */
export async function entregarConEvidencia(
  pedidoId: string,
  codigo: string,
  fotoPath: string,
): Promise<ResultadoWrapper<{ eventos_expediente: number }, CodigoErrorDespensa>> {
  if (codigo.trim().length === 0) return falloDespensaCodigo('codigo_incorrecto');
  if (fotoPath.trim().length === 0) return falloDespensaCodigo('foto_requerida');
  const { data, error } = await getClient().rpc('entregar_pedido', {
    p_pedido_id: pedidoId,
    p_codigo: codigo.trim(),
    p_foto_path: fotoPath,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return {
    ok: true,
    data: {
      eventos_expediente:
        typeof data.eventos_expediente === 'number' ? data.eventos_expediente : 0,
    },
  };
}

/** Acción 3 · NO HABÍA NADIE — con el motivo. El pedido vuelve, queda en
 *  entrega fallida y se reagenda; JAMÁS deposita en el expediente. */
export async function marcarEntregaFallida(
  envioId: string,
  motivo: string,
): Promise<ResultadoWrapper<{ intentos: number }, CodigoErrorDespensa>> {
  if (motivo.trim().length === 0) return falloDespensaCodigo('motivo_requerido');
  const { data, error } = await getClient().rpc('marcar_entrega_fallida', {
    p_envio_id: envioId,
    p_motivo: motivo.trim(),
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return {
    ok: true,
    data: { intentos: typeof data.intentos === 'number' ? data.intentos : 0 },
  };
}
