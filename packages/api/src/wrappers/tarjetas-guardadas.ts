/**
 * S101-B · LAS TARJETAS GUARDADAS — lectura.
 *
 * 🔴 SOLO LECTURA Y BORRADO. **No hay alta por acá**: la tarjeta nace por el
 *    endpoint server-side (`tarjetas_guardadas` no tiene policy de INSERT, a
 *    propósito — *si el cliente pudiera insertar, podría declararse dueño del
 *    token de otro*).
 *
 * 🔴 Lo que se muestra: **el alias si existe, y SIEMPRE marca + últimos 4.**
 *    *El nombre ayuda a elegir; los cuatro dígitos son lo que deja verificar
 *    que es la que uno cree.* Jamás el PAN — no existe columna, y no debe.
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export type TarjetaGuardada = {
  id: string;
  marca: string | null;
  ultimos4: string | null;
  alias: string | null;
  /** Mes/año que devolvió el proveedor al dar de alta. **NULL para siempre** en
   *  las tarjetas anteriores a Fase 5: el dato solo llega en el alta y no se
   *  puede recuperar. *La pantalla tiene que saber decir «no lo sabemos».* */
  expiraMes: number | null;
  expiraAnio: number | null;
  creadaEn: string;
};

/** Las tarjetas de la persona, la más reciente primero. */
export async function listarTarjetasGuardadas(): Promise<
  ResultadoWrapper<TarjetaGuardada[], 'error_tarjetas'>
> {
  const { data, error } = await getClient()
    .from('tarjetas_guardadas')
    /* 🔴 EL `token` SALE DE ACÁ. Es la llave con la que se cobra, y medido:
       **cero consumidores en el cliente**. *Un secreto que viaja al teléfono
       sin que nadie lo use es superficie de ataque a cambio de nada.* El cobro
       va por `tarjeta_id`; el token vive server-side y ahí se queda. */
    .select('id, marca, ultimos4, alias, expira_mes, expira_anio, creada_en')
    .eq('estado', 'guardada')
    .order('creada_en', { ascending: false });

  if (error) return { ok: false, codigo: 'error_tarjetas', mensaje: error.message };

  return {
    ok: true,
    data: (data ?? []).map((t) => ({
      id: t.id,
      marca: t.marca,
      ultimos4: t.ultimos4,
      alias: t.alias,
      expiraMes: t.expira_mes,
      expiraAnio: t.expira_anio,
      creadaEn: t.creada_en,
    })),
  };
}

/**
 * Borra un medio de pago. **Acto server-side** (letra §7): el endpoint del
 * proveedor **y** la fila local, en ese orden.
 *
 * 🔴 NO se borra desde el cliente aunque la policy de DELETE exista: borrar
 *    solo la fila **deja el token vivo en Nuvei**. *Una tarjeta que la familia
 *    cree borrada y que el proveedor todavía puede cobrar no está borrada:
 *    está escondida.*
 */
export async function borrarTarjetaGuardada(
  tarjetaId: string,
): Promise<ResultadoWrapper<{ borrada: true }, CodigoBorrado>> {
  const { data, error } = await getClient().functions.invoke('pagos-borrar-tarjeta', {
    body: { tarjeta_id: tarjetaId },
  });

  if (error) {
    /* El código real viaja en el cuerpo del error, no en su mensaje — la
       lección de `pagos-cobro`: sin leer `context`, todo rojo se ve igual. */
    let codigo: CodigoBorrado = 'error_borrado';
    try {
      const cuerpo = await (error as { context?: { json?: () => Promise<unknown> } })
        .context?.json?.();
      const c = (cuerpo as { codigo?: string } | undefined)?.codigo;
      if (c && (CODIGOS_BORRADO as readonly string[]).includes(c)) codigo = c as CodigoBorrado;
    } catch { /* si no se puede leer, queda el genérico */ }
    return { ok: false, codigo, mensaje: error.message };
  }

  if (!data || (data as { ok?: boolean }).ok !== true) {
    return { ok: false, codigo: 'error_borrado', mensaje: 'respuesta_inesperada' };
  }
  return { ok: true, data: { borrada: true } };
}

const CODIGOS_BORRADO = [
  'sin_sesion', 'sesion_no_verificable', 'datos_invalidos', 'no_es_tu_tarjeta',
  'proveedor_rechazo', 'proveedor_sin_respuesta', 'borrado_a_medias', 'error_borrado',
] as const;
export type CodigoBorrado = (typeof CODIGOS_BORRADO)[number];
