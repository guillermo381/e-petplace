/**
 * «QUIÉN CUIDA A ESTA VIDA» — la familia de UNA mascota.
 *
 * `BIO_EXPEDIENTE` A3.5quater: **la familia no es una franja de DATOS, es parte
 * del DETALLE de cada mascota.** *El prestador no tiene una relación con "las
 * familias": tiene una con cada vida que cuida.*
 *
 * ⚠️ **VA POR RPC PORQUE LA RLS NO LO PERMITE, y está medido:** las policies de
 * `familia` son `admin · creator · miembro` y las de `familia_miembro`,
 * `admin · misma_familia · mismo_user`. **Ninguna nombra al prestador.**
 * *El par corrido con JWT real: por RLS directa, `familia_miembro` devuelve
 * **0 filas**; por la RPC, la familia con sus miembros.* **Es el hueco §6.4.5
 * que S51 declaró y nadie había abierto.**
 *
 * **El gate es el MISMO que el del expediente** (`user_acceso_clinico_a_mascota`)
 * a propósito: *dos criterios de acceso al mismo expediente se separan un día y
 * nadie se entera — y el día que se separen, uno de los dos concede de más.*
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS = ['sin_sesion', 'sin_acceso', 'error_desconocido'] as const;
export type CodigoErrorFamiliaMascota = (typeof CODIGOS)[number];

const MENSAJES: Record<CodigoErrorFamiliaMascota, string> = {
  sin_sesion: 'No hay sesión activa.',
  sin_acceso: 'No tienes acceso al expediente de esta mascota.',
  error_desconocido: 'No pudimos leer quién cuida a esta mascota.',
};

export interface MiembroDeFamilia {
  nombre: string;
  /** Hoy solo vive `adulto_titular` (medido). **Viaja igual**: el día que exista
   *  `familiar_autorizado`, la superficie ya lo distingue sin tocar el motor. */
  rol: string;
}

export interface FamiliaDeMascota {
  /** **`null` = la mascota no tiene familia** (las legadas del modelo viejo).
   *  **NO es una lista vacía**: "sin familia" y "familia sin miembros" son dos
   *  hechos distintos y la superficie los dice distinto (L-197). */
  familia: string | null;
  /** Solo miembros VIGENTES (`hasta IS NULL`) — *un ex-miembro no cuida a nadie.* */
  miembros: MiembroDeFamilia[];
}

export async function obtenerFamiliaDeMascota(
  mascotaId: string,
): Promise<ResultadoWrapper<FamiliaDeMascota, CodigoErrorFamiliaMascota>> {
  const { data, error } = await getClient().rpc('obtener_familia_de_mascota', {
    p_mascota_id: mascotaId,
  });

  if (error) {
    const raw = error.message ?? '';
    const codigo: CodigoErrorFamiliaMascota = raw.startsWith('sin_acceso')
      ? 'sin_acceso'
      : raw.startsWith('auth_required')
        ? 'sin_sesion'
        : 'error_desconocido';
    return { ok: false, codigo, mensaje: MENSAJES[codigo] };
  }

  /* Guard de shape (L-124). Un fallo NO degrada a `{familia:null, miembros:[]}`:
     eso diría "esta mascota no tiene familia" cuando la verdad es "no pude
     leerla" — dos hechos, dos representaciones (L-197). */
  const d = data as { familia?: unknown; miembros?: unknown } | null;
  if (d === null || !Array.isArray(d.miembros)) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  const miembros: MiembroDeFamilia[] = [];
  for (const m of d.miembros as { nombre?: unknown; rol?: unknown }[]) {
    if (typeof m?.nombre !== 'string' || typeof m?.rol !== 'string') continue;
    miembros.push({ nombre: m.nombre, rol: m.rol });
  }
  return {
    ok: true,
    data: { familia: typeof d.familia === 'string' ? d.familia : null, miembros },
  };
}
