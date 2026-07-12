// Perfil propio del user (S53-B2b QW1; ampliado S55-B3 para Cuenta v1).
// RLS: profiles_select / profiles_update (auth.uid() = id) — la puerta
// es la fila propia, cero DEFINER.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos cargar tu perfil.';
const MENSAJE_ERROR_GUARDAR = 'No pudimos guardar los cambios. Prueba de nuevo.';

export interface MiPerfil {
  nombre: string | null;
  /** Del auth (read-only en el producto — cambiarlo es otro ciclo). */
  email: string | null;
  /** E.164 sin '+' (regla 28); el display es del frontend. */
  telefono: string | null;
  /** PATH en el bucket 'mascotas' (carpeta propia) — se firma con resolverUrlFoto. */
  foto_url: string | null;
}

export async function obtenerMiPerfil(): Promise<ResultadoWrapper<MiPerfil, 'sin_sesion' | 'error_perfil'>> {
  const cliente = getClient();
  const { data: sesion } = await cliente.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJE_ERROR };

  const { data, error } = await cliente
    .from('profiles')
    .select('nombre, email, telefono, foto_url')
    .eq('id', uid)
    .maybeSingle();
  if (error) return { ok: false, codigo: 'error_perfil', mensaje: MENSAJE_ERROR };
  return {
    ok: true,
    data: {
      nombre: data?.nombre ?? null,
      email: data?.email ?? sesion.session?.user.email ?? null,
      telefono: data?.telefono ?? null,
      foto_url: data?.foto_url ?? null,
    },
  };
}

export interface InputActualizarMiPerfil {
  nombre?: string;
  /** E.164 sin '+' — solo dígitos (regla 28). '' limpia el campo. */
  telefono?: string;
  /** PATH ya subido a mascotas/{uid}/… ; null quita la foto. */
  foto_url?: string | null;
}

/** Actualiza el perfil propio (RLS es la puerta). Solo toca lo enviado. */
export async function actualizarMiPerfil(
  input: InputActualizarMiPerfil,
): Promise<ResultadoWrapper<null, 'sin_sesion' | 'nada_que_guardar' | 'telefono_invalido' | 'error_perfil'>> {
  const cliente = getClient();
  const { data: sesion } = await cliente.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJE_ERROR };

  const cambios: { nombre?: string; telefono?: string | null; foto_url?: string | null } = {};
  if (input.nombre !== undefined) {
    const n = input.nombre.trim();
    if (n.length > 0) cambios.nombre = n;
  }
  if (input.telefono !== undefined) {
    const tel = input.telefono.replace(/\s/g, '');
    if (tel.length > 0 && !/^\d{7,15}$/.test(tel)) {
      return { ok: false, codigo: 'telefono_invalido', mensaje: 'El teléfono va con código de país y solo dígitos.' };
    }
    cambios.telefono = tel.length > 0 ? tel : null;
  }
  if (input.foto_url !== undefined) cambios.foto_url = input.foto_url;
  if (Object.keys(cambios).length === 0) {
    return { ok: false, codigo: 'nada_que_guardar', mensaje: MENSAJE_ERROR_GUARDAR };
  }

  const { error } = await cliente.from('profiles').update(cambios).eq('id', uid);
  if (error) return { ok: false, codigo: 'error_perfil', mensaje: MENSAJE_ERROR_GUARDAR };
  return { ok: true, data: null };
}
