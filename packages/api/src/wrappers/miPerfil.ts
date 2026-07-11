// Perfil propio del user (S53-B2b, QW1): el nombre para el saludo.
// RLS: profiles_select (auth.uid() = id) — solo el propio.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos cargar tu perfil.';

export interface MiPerfil {
  nombre: string | null;
}

export async function obtenerMiPerfil(): Promise<ResultadoWrapper<MiPerfil, 'sin_sesion' | 'error_perfil'>> {
  const cliente = getClient();
  const { data: sesion } = await cliente.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJE_ERROR };

  const { data, error } = await cliente.from('profiles').select('nombre').eq('id', uid).maybeSingle();
  if (error) return { ok: false, codigo: 'error_perfil', mensaje: MENSAJE_ERROR };
  return { ok: true, data: { nombre: data?.nombre ?? null } };
}
