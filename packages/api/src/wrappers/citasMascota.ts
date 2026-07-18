// D-430 (S67): las CITAS ACTIVAS de UNA mascota — el lector del detalle
// contextual ("el CTA de la ficha lleva al detalle de SU cita, jamás a
// un hub", regla de plataforma founder S67). Solo lecturas; la RLS es
// la puerta (cita_select_por_acceso / atencion_select, relevadas S51 —
// el dueño entra por user_tiene_acceso_a_mascota). El nombre del
// prestador viaja por el embed del FK (RLS pública de prestadores
// activos); si la fila no es visible, null honesto y la pantalla omite.
// Cero función de DB nueva.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos leer las citas. Prueba de nuevo.';

export interface CitaActivaMascota {
  cita_id: string;
  /** ISO date. */
  fecha: string;
  /** HH:MM o null. */
  hora: string | null;
  tipo_servicio: string | null;
  /** 'firme' = confirmada (pagada o legacy) · 'en_vivo' = la atención
   *  está ocurriendo (conecta con /paseo/[atencionId], §7.1) · 'hold' =
   *  bloqueo de agenda VIGENTE (D-319: el vencido no existe). */
  estado: 'firme' | 'en_vivo' | 'hold';
  prestador_id: string | null;
  /** nombre_comercial del prestador, o null honesto (fila no visible). */
  prestador_nombre: string | null;
  /** Solo con estado='en_vivo': la atención para la pantalla de dos caras. */
  atencion_id: string | null;
}

// Fecha local del dispositivo YYYY-MM-DD (patrón S44: en-CA da ese formato).
function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

/**
 * Las citas ACTIVAS de la mascota (firmes futuras/de hoy, la que está
 * ocurriendo, y el hold vigente propio), ordenadas por fecha/hora
 * ascendente — la primera es "la próxima". Vacía = sin citas activas
 * (el caller decide su voz honesta; el CTA de la ficha ni se dibuja).
 */
export async function obtenerCitasActivasMascota(
  mascotaId: string,
): Promise<ResultadoWrapper<CitaActivaMascota[], 'error_citas_mascota'>> {
  const cliente = getClient();

  const citas = await cliente
    .from('evento_cita_servicio')
    .select(
      'id, fecha, hora, tipo_servicio, estado, estado_reserva, expira_en, prestador_id, prestadores ( nombre_comercial )',
    )
    .eq('mascota_id', mascotaId)
    .in('estado', ['pendiente', 'confirmada', 'en_curso'])
    .gte('fecha', hoyLocal())
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true, nullsFirst: false })
    // 50: un plan L-V genera ~22 citas/mes — 10 era un tope silencioso
    // para el "Ver más" (relevado vivo: Thor con 23 activas).
    .limit(50);

  if (citas.error) {
    return { ok: false, codigo: 'error_citas_mascota', mensaje: MENSAJE_ERROR };
  }

  // Cura D-319 heredada: 'pendiente' solo entra como hold VIGENTE; el
  // vencido queda 'pendiente' para siempre y acá no existe. El reloj
  // del dispositivo solo decide DISPLAY — la correctitud la gatea el
  // server (expiración perezosa S54).
  const ahora = Date.now();
  const activas = citas.data.filter(
    (c) =>
      c.fecha !== null &&
      (c.estado === 'confirmada' ||
        c.estado === 'en_curso' ||
        (c.estado === 'pendiente' &&
          c.estado_reserva === 'pendiente_pago' &&
          c.expira_en !== null &&
          Date.parse(c.expira_en) > ahora)),
  );

  // La atención de las en_curso — solo se consulta si hay algo vivo
  // (cero costo en el caso quieto); un fallo deja atencion_id null y la
  // pantalla muestra la cita sin el salto al vivo (voz honesta).
  const atencionPorCita = new Map<string, string>();
  const enCursoIds = activas.filter((c) => c.estado === 'en_curso').map((c) => c.id);
  if (enCursoIds.length > 0) {
    const atenciones = await cliente
      .from('evento_atencion')
      .select('id, cita_id')
      .in('cita_id', enCursoIds)
      .eq('estado', 'en_curso');
    if (!atenciones.error) {
      for (const a of atenciones.data) {
        if (a.cita_id !== null) atencionPorCita.set(a.cita_id, a.id);
      }
    }
  }

  // Guard de shape (L-124): el filtro ya garantizó fecha no nula — se
  // angosta verificando, jamás con cast (regla 34).
  const data: CitaActivaMascota[] = [];
  for (const c of activas) {
    if (c.fecha === null) continue;
    data.push({
      cita_id: c.id,
      fecha: c.fecha,
      hora: c.hora !== null ? c.hora.slice(0, 5) : null,
      tipo_servicio: c.tipo_servicio,
      estado: c.estado === 'en_curso' ? 'en_vivo' : c.estado === 'confirmada' ? 'firme' : 'hold',
      prestador_id: c.prestador_id,
      prestador_nombre: c.prestadores?.nombre_comercial ?? null,
      atencion_id: atencionPorCita.get(c.id) ?? null,
    });
  }
  return { ok: true, data };
}
