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
import { descripcionDePresupuesto, type DescripcionPresupuesto } from './_presupuesto-descripcion';

const MENSAJE_ERROR = 'No pudimos leer las citas. Prueba de nuevo.';

export interface CitaActivaMascota {
  cita_id: string;
  /**
   * ISO date, o NULL cuando la cita todavía no tiene fecha coordinada
   * (S71-A: la cita que nace de un presupuesto aprobado — D-439 la hizo
   * legal SIN fecha; la coordina el prestador después).
   */
  fecha: string | null;
  /** HH:MM o null. */
  hora: string | null;
  tipo_servicio: string | null;
  /** 'firme' = confirmada (pagada o legacy) · 'en_vivo' = la atención
   *  está ocurriendo (conecta con /paseo/[atencionId], §7.1) · 'hold' =
   *  bloqueo de agenda VIGENTE (D-319: el vencido no existe) ·
   *  'por_coordinar' = firme y aprobada, esperando que el negocio fije
   *  la fecha (S71-A, costura de D-439). */
  estado: 'firme' | 'en_vivo' | 'hold' | 'por_coordinar';
  prestador_id: string | null;
  /** nombre_comercial del prestador, o null honesto (fila no visible). */
  prestador_nombre: string | null;
  /**
   * D-455 (S71-A): nombre del NEGOCIO emisor del presupuesto, para la cita
   * `por_coordinar` cuyo prestador_id es NULL (D-439 retiró la heurística).
   * Sale de la RPC angosta `obtener_nombres_negocio_por_presupuesto`; null
   * honesto en todo otro estado o si la RPC falla. Campo SEPARADO de
   * prestador_nombre a propósito: son entidades distintas y mezclarlas en
   * un slot sería mentir el contrato.
   */
  negocio_nombre: string | null;
  /** Solo con estado='en_vivo': la atención para la pantalla de dos caras. */
  atencion_id: string | null;
  /**
   * D-474 (S72-A): la DESCRIPCIÓN del presupuesto de una cita `procedimiento`
   * — la simetría del dueño con la Pieza 3 del vet. DATOS, NO PROSA: la voz
   * vive en la pantalla. FALLBACK del dueño DISTINTO al del vet: sin
   * descripción, la pantalla OMITE el nombre (jamás pinta "Procedimiento" —
   * ese vocabulario es del motor, Ley 3). null si la cita no tiene
   * presupuesto o no trae ítems.
   */
  descripcion_presupuesto: DescripcionPresupuesto | null;
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
    // El embed de presupuesto va INLINE (literal) — la inferencia de tipos de
    // postgrest-js exige el string literal (concatenar desde constante lo
    // rompe). La lógica de la descripción sí se comparte.
    .select(
      'id, fecha, hora, tipo_servicio, estado, estado_reserva, expira_en, prestador_id, presupuesto_id, prestadores ( nombre_comercial ), presupuesto:presupuesto(items:presupuesto_item(id, descripcion_libre, created_at))',
    )
    .eq('mascota_id', mascotaId)
    .in('estado', ['pendiente', 'confirmada', 'en_curso'])
    // S71-A (costura de D-439) — el `.gte('fecha', hoy)` solo escondía:
    // la cita que nace de un presupuesto APROBADO es legal SIN fecha, y
    // `NULL >= hoy` no es verdadero, así que el dueño aprobaba y su
    // procedimiento desaparecía de todas sus superficies. Entra también
    // la sin-fecha CON presupuesto (jamás una sin fecha huérfana).
    .or(`fecha.gte.${hoyLocal()},and(fecha.is.null,presupuesto_id.not.is.null)`)
    // nullsFirst: las sin fecha PRESIDEN — son las que esperan acción
    // (ley de la casa del prestador, aplicada a la casa del dueño).
    .order('fecha', { ascending: true, nullsFirst: true })
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
      // S71-A: la sin-fecha entra SOLO si viene de presupuesto aprobado —
      // el resto sigue exigiendo fecha (una cita sin fecha ni presupuesto
      // es data rota, no un estado del producto).
      (c.fecha !== null || c.presupuesto_id !== null) &&
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

  // D-455 (S71-A): el nombre del negocio para las por_coordinar (batch
  // único; un fallo deja null y la lista NO se cae — Ley 13).
  const nombresNegocio = new Map<string, string>();
  const presupuestoIds = activas
    .filter((c) => c.fecha === null && c.presupuesto_id !== null)
    .map((c) => c.presupuesto_id)
    .filter((id): id is string => id !== null);
  if (presupuestoIds.length > 0) {
    const rn = await cliente.rpc('obtener_nombres_negocio_por_presupuesto', {
      p_presupuesto_ids: presupuestoIds,
    });
    if (!rn.error && Array.isArray(rn.data)) {
      for (const fila of rn.data) {
        if (
          typeof fila === 'object' &&
          fila !== null &&
          typeof fila.presupuesto_id === 'string' &&
          typeof fila.nombre_comercial === 'string'
        ) {
          nombresNegocio.set(fila.presupuesto_id, fila.nombre_comercial);
        }
      }
    }
  }

  const data: CitaActivaMascota[] = [];
  for (const c of activas) {
    data.push({
      cita_id: c.id,
      fecha: c.fecha,
      hora: c.hora !== null ? c.hora.slice(0, 5) : null,
      tipo_servicio: c.tipo_servicio,
      estado:
        c.estado === 'en_curso'
          ? 'en_vivo'
          : c.fecha === null
            ? 'por_coordinar'
            : c.estado === 'confirmada'
              ? 'firme'
              : 'hold',
      prestador_id: c.prestador_id,
      prestador_nombre: c.prestadores?.nombre_comercial ?? null,
      negocio_nombre:
        c.fecha === null && c.presupuesto_id !== null
          ? (nombresNegocio.get(c.presupuesto_id) ?? null)
          : null,
      atencion_id: atencionPorCita.get(c.id) ?? null,
      descripcion_presupuesto: descripcionDePresupuesto(c.presupuesto),
    });
  }
  return { ok: true, data };
}
