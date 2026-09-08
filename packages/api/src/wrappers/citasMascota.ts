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
/** S74-A (cura D-497): el ítem hogar-wide dice de QUÉ mascota es. */
export interface CitaActivaHogar extends CitaActivaMascota {
  mascota_id: string;
}

// S74-A (cura D-497): el core acepta N mascotas — UNA query hogar-wide
// (.in) en lugar de N llamadas por mascota (patrón probado por la rama
// vet del rail S73); el per-mascota delega con [id]. El límite 50 POR
// mascota se conserva multiplicando (Thor solo ya vivió 23 activas).
async function _citasActivas(
  mascotaIds: string[],
): Promise<ResultadoWrapper<CitaActivaHogar[], 'error_citas_mascota'>> {
  const cliente = getClient();

  const citas = await cliente
    .from('evento_cita_servicio')
    // El embed de presupuesto va INLINE (literal) — la inferencia de tipos de
    // postgrest-js exige el string literal (concatenar desde constante lo
    // rompe). La lógica de la descripción sí se comparte.
    // S72-A cura de regresión: HAY DOS FKs entre evento_cita_servicio y
    // presupuesto (presupuesto.evento_cita_servicio_id ← y →
    // evento_cita_servicio.presupuesto_id), así que `presupuesto:presupuesto`
    // es AMBIGUO y PostgREST rompe el select entero (PGRST201). Se desambigua
    // con el nombre de la FK que va cita→presupuesto.
    .select(
      'id, mascota_id, fecha, hora, duracion_minutos, tipo_servicio, estado, estado_reserva, expira_en, prestador_id, presupuesto_id, prestadores ( nombre_comercial ), presupuesto:presupuesto!evento_cita_servicio_presupuesto_id_fkey(items:presupuesto_item(id, descripcion_libre, created_at))',
    )
    .in('mascota_id', mascotaIds)
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
    // 50 POR mascota: un plan L-V genera ~22 citas/mes — 10 era un tope
    // silencioso para el "Ver más" (relevado vivo: Thor con 23 activas).
    .limit(50 * mascotaIds.length);

  if (citas.error) {
    return { ok: false, codigo: 'error_citas_mascota', mensaje: MENSAJE_ERROR };
  }

  // Cura D-319 heredada: 'pendiente' solo entra como hold VIGENTE; el
  // vencido queda 'pendiente' para siempre y acá no existe. El reloj
  // del dispositivo solo decide DISPLAY — la correctitud la gatea el
  // server (expiración perezosa S54).
  const ahora = Date.now();
  /* ── S107 · D-952 (segunda mitad) · EL ORDEN PONE ADELANTE LA PRÓXIMA ─────
     Firma del founder, 27-ago-2026, camino **B**.

     🔴 EL DEFECTO: esta lista se llama `_citasActivas`, su tipo es
     `CitaActivaMascota` y su pantalla se titula **«La cita de {nombre}»** —en
     singular—, pero ordenaba por `fecha, hora` y **filtraba por DÍA**. ⇒ una
     cita de hoy que ya terminó quedaba ARRIBA de la próxima. Medido: Thor
     mostraba la de las 12:00 (terminada hacía 9 h) por encima de la de las 9:30
     del día siguiente.

     🔑 POR QUÉ **B** (ordenar) Y NO **A** (descartar), firmado: descartarlas
     dejaría al dueño **sin ningún acceso a la cita recién pasada** — hoy ésta es
     la única superficie donde sobrevive. *El pedido era que la próxima esté
     adelante, no que lo de hoy desaparezca.*

     ⚠️ `en_curso` NUNCA se posterga, aunque su hora de fin haya pasado:
     **el estado manda sobre el reloj cuando el estado dice que está pasando.**
     (Este lector sí trae `en_curso`; el del Hogar no, por eso allá no hizo
     falta el matiz.) */
  const yaTermino = (c: {
    estado: string | null;
    fecha: string | null;
    hora: string | null;
    duracion_minutos: number | null;
  }): boolean => {
    if (c.estado === 'en_curso') return false;
    if (c.fecha === null) return false;
    const inicio = Date.parse(`${c.fecha}T${(c.hora ?? '00:00:00').slice(0, 8)}`);
    if (Number.isNaN(inicio)) return false; // lo ilegible no se posterga
    return inicio + (c.duracion_minutos ?? 60) * 60000 <= ahora;
  };

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

  /* 🔴 EL REORDENAMIENTO, y es ESTABLE a propósito: `sort` conserva el orden
     relativo dentro de cada grupo, así que las no-terminadas mantienen su
     `fecha, hora` de la consulta y las terminadas de hoy quedan al final entre
     ellas. *No se re-ordena nada: solo se mueve un grupo detrás del otro.* */
  activas.sort((a, b) => Number(yaTermino(a)) - Number(yaTermino(b)));

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

  const data: CitaActivaHogar[] = [];
  for (const c of activas) {
    // El tipo generado dice nullable; el filtro .in() la exige — el guard
    // narrowea honesto (regla 34: cero `as` forzados).
    const mascotaDeCita = c.mascota_id;
    if (mascotaDeCita === null) continue;
    data.push({
      mascota_id: mascotaDeCita,
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

export async function obtenerCitasActivasMascota(
  mascotaId: string,
): Promise<ResultadoWrapper<CitaActivaMascota[], 'error_citas_mascota'>> {
  return _citasActivas([mascotaId]);
}

/** S74-A (cura D-497): las citas activas de TODO el hogar en UNA query
 *  — el arranque del Hogar deja de multiplicar por mascota. */
export async function obtenerCitasActivasHogar(
  mascotaIds: string[],
): Promise<ResultadoWrapper<CitaActivaHogar[], 'error_citas_mascota'>> {
  if (mascotaIds.length === 0) return { ok: true, data: [] };
  return _citasActivas(mascotaIds);
}

/* ═══════════════════════════════════════════════════════════════════════════
   S114-A · EL LECTOR DE HISTORIAL — la puerta de las citas PASADAS (pedido de C)
   ───────────────────────────────────────────────────────────────────────────
   El hub filtra `fecha.gte.<hoy>` y el timeline excluye `cita_servicio`, así que
   una cita pasada no está en NINGUNA superficie — y son 265 de 379 en la familia
   del founder, 142 «confirmada» sin atención («el paseador no vino»), el reclamo
   más frecuente. Este lector es su superficie.

   Mismo shape que `CitaActivaMascota` (la pantalla ya sabe dibujarlo) + dos cosas:
   · `atencion_id` para las PASADAS (no sólo en_curso): sin él una cita atendida
     no abre su recorrido;
   · `cerrada_en` = anchor de la ventana de reclamo, consistente con el motor
     (`_caso_dueno_del_objeto`: COALESCE(atencion.cerrada_en, fecha+hora)). Con
     esto la app deja de depender del límite de día: una cita que terminó hoy ya
     tiene su ventana, en vez de ganarla mañana.

   Paginado por CURSOR compuesto `fecha|id`, jamás offset (S99: la página
   siguiente se saltea filas cuando llega una nueva — 55 de 62). Incluye
   canceladas y no_show: son historia, y la familia pregunta por ellas; que se
   abran o no lo decide la pantalla. */
export interface CitaHistorialMascota extends CitaActivaMascota {
  /** El desenlace REAL de la cita pasada. La unión `estado` heredada es de
   *  ACTIVAS; el `estado` de una fila de historia queda en 'firme' como valor
   *  neutro y el desenlace verdadero se lee ACÁ. */
  estado_historial: 'completada' | 'confirmada' | 'cancelada' | 'no_show' | 'pendiente';
  /** ISO. Instante de fin = anchor de la ventana (motor-consistente). null si
   *  la cita no tiene fecha. */
  cerrada_en: string | null;
}

export async function obtenerHistorialCitasMascota(
  mascotaId: string,
  opciones?: { limite?: number; cursor?: string },
): Promise<ResultadoWrapper<{ citas: CitaHistorialMascota[]; cursor: string | null }, 'error_citas_mascota'>> {
  const cliente = getClient();
  const limite = Math.min(Math.max(opciones?.limite ?? 20, 1), 50);

  let q = cliente
    .from('evento_cita_servicio')
    .select(
      'id, mascota_id, fecha, hora, duracion_minutos, tipo_servicio, estado, prestador_id, presupuesto_id, prestadores ( nombre_comercial ), presupuesto:presupuesto!evento_cita_servicio_presupuesto_id_fkey(items:presupuesto_item(id, descripcion_libre, created_at))',
    )
    .eq('mascota_id', mascotaId)
    // Estrictamente PASADAS por día; el instante fino de la ventana lo da
    // `cerrada_en`. Una cita de hoy vive en el hub activo, no acá.
    .lt('fecha', hoyLocal())
    .in('estado', ['confirmada', 'completada', 'cancelada', 'no_show', 'pendiente'])
    // El orden del cursor DEBE ser el de la consulta: fecha desc, id desc (id
    // es UUID plano, no cronológico — desempata estable; la hora es display y
    // la pantalla ordena dentro del día si quiere).
    .order('fecha', { ascending: false })
    .order('id', { ascending: false })
    .limit(limite + 1);

  if (opciones?.cursor) {
    const partes = opciones.cursor.split('|');
    const cf = partes[0];
    const cid = partes[1];
    if (cf && cid) {
      // La página siguiente: estrictamente "menor" en (fecha, id) desc.
      q = q.or(`fecha.lt.${cf},and(fecha.eq.${cf},id.lt.${cid})`);
    }
  }

  const citas = await q;
  if (citas.error) {
    return { ok: false, codigo: 'error_citas_mascota', mensaje: MENSAJE_ERROR };
  }

  const hayMas = citas.data.length > limite;
  const filas = hayMas ? citas.data.slice(0, limite) : citas.data;

  // atencion_id + cerrada_en para TODAS las pasadas (un fallo deja null y la
  // fila se dibuja sin el salto al recorrido — voz honesta, Ley 13).
  const atencionPorCita = new Map<string, { id: string; cerrada_en: string | null }>();
  const ids = filas.map((c) => c.id);
  if (ids.length > 0) {
    const at = await cliente
      .from('evento_atencion')
      .select('id, cita_id, cerrada_en')
      .in('cita_id', ids);
    if (!at.error) {
      for (const a of at.data) {
        if (a.cita_id !== null) atencionPorCita.set(a.cita_id, { id: a.id, cerrada_en: a.cerrada_en });
      }
    }
  }

  const data: CitaHistorialMascota[] = [];
  for (const c of filas) {
    // Narrow honesto del desenlace (regla 34: cero `as` forzado). El .in lo
    // garantiza, pero el tipo generado dice nullable.
    const eh = c.estado;
    if (
      eh !== 'completada' && eh !== 'confirmada' &&
      eh !== 'cancelada' && eh !== 'no_show' && eh !== 'pendiente'
    ) continue;
    const at = atencionPorCita.get(c.id) ?? null;
    const finComputado =
      c.fecha !== null ? `${c.fecha}T${(c.hora ?? '00:00:00').slice(0, 8)}` : null;
    data.push({
      cita_id: c.id,
      fecha: c.fecha,
      hora: c.hora !== null ? c.hora.slice(0, 5) : null,
      tipo_servicio: c.tipo_servicio,
      estado: 'firme', // shape heredado; el desenlace va en estado_historial
      prestador_id: c.prestador_id,
      prestador_nombre: c.prestadores?.nombre_comercial ?? null,
      negocio_nombre: null,
      atencion_id: at?.id ?? null,
      descripcion_presupuesto: descripcionDePresupuesto(c.presupuesto),
      estado_historial: eh,
      cerrada_en: at?.cerrada_en ?? finComputado,
    });
  }

  const ultima = data[data.length - 1];
  const cursor = hayMas && ultima !== undefined ? `${ultima.fecha}|${ultima.cita_id}` : null;
  return { ok: true, data: { citas: data, cursor } };
}
