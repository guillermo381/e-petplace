// Preferencias persistidas (S55-B3, cierra D-316) — idioma multi-
// dispositivo + notificaciones por tipo (contrato B4: fila ausente =
// habilitada). RLS propia como puerta; AsyncStorage sigue siendo el
// cache local del riel.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion: 'No hay sesión activa.',
  error_preferencias: 'No pudimos leer tus preferencias.',
  error_guardar: 'No pudimos guardar la preferencia. Prueba de nuevo.',
} as const;

export type CodigoErrorPreferencias = keyof typeof MENSAJES;

export interface Preferencias {
  /** 'es' | 'en' | null (null = el idioma del dispositivo). */
  idioma: 'es' | 'en' | null;
  /** Solo los tipos PERSISTIDOS (contrato B4: ausente = habilitada). */
  notificaciones: Record<string, boolean>;
}

export async function obtenerPreferencias(): Promise<ResultadoWrapper<Preferencias, CodigoErrorPreferencias>> {
  const cliente = getClient();
  const { data: sesion } = await cliente.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  const [pref, notifs] = await Promise.all([
    cliente.from('user_preferencias').select('idioma').eq('user_id', uid).maybeSingle(),
    cliente.from('user_notificacion_prefs').select('tipo, habilitada').eq('user_id', uid),
  ]);
  if (pref.error || notifs.error) {
    return { ok: false, codigo: 'error_preferencias', mensaje: MENSAJES.error_preferencias };
  }

  const idioma = pref.data?.idioma === 'es' || pref.data?.idioma === 'en' ? pref.data.idioma : null;
  const notificaciones: Record<string, boolean> = {};
  for (const fila of notifs.data) notificaciones[fila.tipo] = fila.habilitada;
  return { ok: true, data: { idioma, notificaciones } };
}

/** Persiste el idioma elegido en DB (la verdad multi-dispositivo). */
export async function guardarIdiomaPreferido(
  idioma: 'es' | 'en',
): Promise<ResultadoWrapper<null, CodigoErrorPreferencias>> {
  const cliente = getClient();
  const { data: sesion } = await cliente.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  const { error } = await cliente
    .from('user_preferencias')
    .upsert({ user_id: uid, idioma, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) return { ok: false, codigo: 'error_guardar', mensaje: MENSAJES.error_guardar };
  return { ok: true, data: null };
}

/** Persiste el estado de UN GRUPO de tipos (la UI habla en voz humana;
 *  la DB guarda por tipo — el vocabulario de notificaciones.tipo). */
export async function guardarPreferenciaNotificacion(
  tipos: string[],
  habilitada: boolean,
): Promise<ResultadoWrapper<null, CodigoErrorPreferencias>> {
  const cliente = getClient();
  const { data: sesion } = await cliente.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };
  if (tipos.length === 0) return { ok: true, data: null };

  const ahora = new Date().toISOString();
  const { error } = await cliente
    .from('user_notificacion_prefs')
    .upsert(
      tipos.map((tipo) => ({ user_id: uid, tipo, habilitada, updated_at: ahora })),
      { onConflict: 'user_id,tipo' },
    );
  if (error) return { ok: false, codigo: 'error_guardar', mensaje: MENSAJES.error_guardar };
  return { ok: true, data: null };
}
