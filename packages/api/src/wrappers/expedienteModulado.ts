/**
 * EL EXPEDIENTE MODULADO — `BIO_EXPEDIENTE` A3.5bis, nivel ③.
 *
 * **Es una CURA DE PRIVACIDAD, no una pieza de DATOS** (D-639): corresponde
 * igual aunque esa pantalla no se construyera.
 *
 * ⚠️ **Su error se ve IDÉNTICO al acierto.** Una pantalla que muestra de más
 * *funciona perfecto*: completa, sin rebotes, sin vacíos. **El gate de esto no
 * puede ser "se ve bien"** — el par se corrió por el camino real con JWT:
 *
 * | | ANTES | DESPUÉS |
 * |---|---|---|
 * | filas que ve de otro prestador | 85 | **85** *(sigue viendo que EXISTEN)* |
 * | **con su contenido** | **84** 🔴 | **0** ✅ |
 * | con su autor | 85 | **85** ✅ |
 * | propios con detalle | — | 16 |
 * | **de la familia, con contenido** | — | **10 / 10** |
 *
 * *El "antes" no se puede reconstruir después: una vez curado, nadie puede
 * probar que estaba roto — solo confiar en que alguien lo verificó.*
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS = ['sin_sesion', 'sin_acceso', 'error_desconocido'] as const;
export type CodigoErrorExpediente = (typeof CODIGOS)[number];

const MENSAJES: Record<CodigoErrorExpediente, string> = {
  sin_sesion: 'No hay sesión activa.',
  // El piso de A3.5bis empieza en "todo prestador CON ACCESO": sin acceso, ni
  // la existencia. NO se degrada a lista vacía — eso diría "no hay nada" cuando
  // la verdad es "no te toca" (L-197: dos hechos, dos representaciones).
  sin_acceso: 'No tienes acceso al expediente de esta mascota.',
  error_desconocido: 'No pudimos leer el expediente.',
};

/** El nivel con el que llega CADA fila. **La superficie no decide nada: pinta
 *  lo que llega.** *Si tuviera que deducirlo, cada pantalla nueva volvería a
 *  jugarse la privacidad por su cuenta.* */
export type NivelAporte =
  /** Es MÍO — contenido completo (A3.5bis nivel ②, mitad "quien lo hizo"). */
  | 'detalle'
  /** De OTRO prestador — **existe y quién**, sin contenido (nivel ③). */
  | 'existencia'
  /** De la FAMILIA — **fuera de la modulación**: es del dueño, no de otro
   *  prestador. Llega con su contenido (la frontera de A3.5bis). */
  | 'familia';

export interface AporteExpediente {
  id: string;
  tipo: string;
  ejeJtbd: string | null;
  fechaEvento: string;
  prestadorId: string | null;
  /** El nombre del negocio que lo aportó. **Es la mitad que hace útil al nivel
   *  ③**: *le dice al prestador A QUIÉN pedirle lo que le falta* — sin eso,
   *  "existe algo, de alguien" es la mitad inútil del nivel. */
  autor: string | null;
  /** `null` = **"origen no registrado"** (A3.6). Son los 134 legados; **no se
   *  infiere** de que exista un `prestadorId` — eso fabricaría trazabilidad. */
  procedencia: string | null;
  /** `null` en `nivel: 'existencia'` — **no es "sin datos": es "no te toca"**. */
  datos: unknown | null;
  nivel: NivelAporte;
}

export async function obtenerExpedienteModulado(
  mascotaId: string,
): Promise<ResultadoWrapper<AporteExpediente[], CodigoErrorExpediente>> {
  const { data, error } = await getClient().rpc('obtener_expediente_modulado', {
    p_mascota_id: mascotaId,
  });

  if (error) {
    const raw = error.message ?? '';
    const codigo: CodigoErrorExpediente = raw.startsWith('sin_acceso')
      ? 'sin_acceso'
      : raw.startsWith('auth_required')
        ? 'sin_sesion'
        : 'error_desconocido';
    return { ok: false, codigo, mensaje: MENSAJES[codigo] };
  }
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  const filas: AporteExpediente[] = [];
  for (const f of data) {
    /* Guard de shape (L-124). Una fila sin `nivel` NO se degrada a 'existencia'
       ni a 'detalle': se DESCARTA. Adivinar el nivel es adivinar el permiso —
       y errar hacia 'detalle' es una fuga, hacia 'existencia' una mentira. */
    const nivel = f.nivel;
    if (nivel !== 'detalle' && nivel !== 'existencia' && nivel !== 'familia') continue;
    filas.push({
      id: f.id,
      tipo: f.tipo,
      ejeJtbd: f.eje_jtbd ?? null,
      fechaEvento: f.fecha_evento,
      prestadorId: f.prestador_id ?? null,
      autor: f.autor ?? null,
      procedencia: f.procedencia ?? null,
      datos: nivel === 'existencia' ? null : (f.datos ?? null),
      nivel,
    });
  }
  return { ok: true, data: filas };
}
