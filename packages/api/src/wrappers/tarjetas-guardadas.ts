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
  token: string;
  marca: string | null;
  ultimos4: string | null;
  alias: string | null;
  creadaEn: string;
};

/** Las tarjetas de la persona, la más reciente primero. */
export async function listarTarjetasGuardadas(): Promise<
  ResultadoWrapper<TarjetaGuardada[], 'error_tarjetas'>
> {
  const { data, error } = await getClient()
    .from('tarjetas_guardadas')
    .select('id, token, marca, ultimos4, alias, creada_en')
    .eq('estado', 'guardada')
    .order('creada_en', { ascending: false });

  if (error) return { ok: false, codigo: 'error_tarjetas', mensaje: error.message };

  return {
    ok: true,
    data: (data ?? []).map((t) => ({
      id: t.id,
      token: t.token,
      marca: t.marca,
      ultimos4: t.ultimos4,
      alias: t.alias,
      creadaEn: t.creada_en,
    })),
  };
}
