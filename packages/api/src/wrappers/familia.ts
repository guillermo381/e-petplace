// Tu familia (S55-B3, Cuenta v1) — lectura de la familia vigente y
// rename del nombre por el titular. RLS es la puerta:
//   familia_select_miembro / familia_update_titular (relevadas S55).
// LÍMITE HONESTO (hueco P1): profiles es solo-propio — el nombre de
// OTRO miembro no es legible; hasta el canal de co-dueños, un miembro
// ajeno se lista por rol sin nombre (null honesto, jamás inventado).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion: 'No hay sesión activa.',
  sin_familia: 'Tu familia todavía no existe.',
  error_familia: 'No pudimos cargar tu familia. Prueba de nuevo.',
  error_guardar: 'No pudimos guardar el nombre. Prueba de nuevo.',
  nombre_requerido: 'El nombre de la familia no puede quedar vacío.',
} as const;

export type CodigoErrorFamilia = keyof typeof MENSAJES;

export interface MiembroFamilia {
  familia_miembro_id: string;
  rol: string;
  /** ISO — desde cuándo es miembro. */
  desde: string | null;
  es_yo: boolean;
  /** Nombre visible SOLO para el propio (RLS de profiles); null honesto para otros. */
  nombre: string | null;
}

export interface MiFamilia {
  familia_id: string;
  /** null honesto: la familia puede no tener nombre todavía (el seed
   *  y las familias pre-onboarding) — la UI invita, jamás inventa. */
  nombre: string | null;
  /** Rol del caller (adulto_titular puede renombrar). */
  mi_rol: string;
  miembros: MiembroFamilia[];
}

export async function obtenerMiFamilia(): Promise<ResultadoWrapper<MiFamilia, CodigoErrorFamilia>> {
  const cliente = getClient();
  const { data: sesion } = await cliente.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  const membresia = await cliente
    .from('familia_miembro')
    .select('id, familia_id, rol, desde, user_id, familia:familia_id (id, nombre, tipo)')
    .eq('user_id', uid)
    .is('hasta', null);
  if (membresia.error) return { ok: false, codigo: 'error_familia', mensaje: MENSAJES.error_familia };

  const propia = membresia.data.find((m) => {
    const f = m.familia as { tipo?: string | null } | null;
    return f?.tipo === 'estandar';
  });
  const fam = propia?.familia as { id: string; nombre: string | null } | null | undefined;
  if (!propia || !fam || propia.rol === null) {
    return { ok: false, codigo: 'sin_familia', mensaje: MENSAJES.sin_familia };
  }

  const [miembros, perfil] = await Promise.all([
    cliente
      .from('familia_miembro')
      .select('id, user_id, rol, desde')
      .eq('familia_id', fam.id)
      .is('hasta', null)
      .order('desde', { ascending: true }),
    cliente.from('profiles').select('nombre').eq('id', uid).maybeSingle(),
  ]);
  if (miembros.error) return { ok: false, codigo: 'error_familia', mensaje: MENSAJES.error_familia };

  return {
    ok: true,
    data: {
      familia_id: fam.id,
      nombre: fam.nombre ?? null,
      mi_rol: propia.rol,
      miembros: miembros.data
        .filter((m): m is typeof m & { rol: string } => m.rol !== null)
        .map((m) => ({
          familia_miembro_id: m.id,
          rol: m.rol,
          desde: m.desde,
          es_yo: m.user_id === uid,
          nombre: m.user_id === uid ? (perfil.data?.nombre ?? null) : null,
        })),
    },
  };
}

/** Renombra la familia (RLS: solo el titular pasa; el resto rebota en 0 filas). */
export async function renombrarFamilia(
  familiaId: string,
  nombre: string,
): Promise<ResultadoWrapper<null, CodigoErrorFamilia>> {
  const n = nombre.trim();
  if (n.length === 0) return { ok: false, codigo: 'nombre_requerido', mensaje: MENSAJES.nombre_requerido };

  const { data, error } = await getClient()
    .from('familia')
    .update({ nombre: n })
    .eq('id', familiaId)
    .select('id');
  if (error) return { ok: false, codigo: 'error_guardar', mensaje: MENSAJES.error_guardar };
  // RLS silencioso = 0 filas: el no-titular no puede renombrar (regla 36: se dice)
  if (!Array.isArray(data) || data.length === 0) {
    return { ok: false, codigo: 'error_guardar', mensaje: MENSAJES.error_guardar };
  }
  return { ok: true, data: null };
}
