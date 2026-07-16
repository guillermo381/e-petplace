// La RESERVA DE ADIESTRAMIENTO del lado DUEÑO (S63-A Bloque 3,
// MODELO_ADIESTRAMIENTO v1.1 §1/§4/§8/§12.2 sobre el chasis compartido).
// Patrón canónico del monorepo (ver grooming-reserva.ts): códigos
// tipados + normalización por prefijo (L-115) + guards de shape contra
// los RETURNS reales de las migraciones 20260715180000/200000/220000/
// 230000 (L-124) + ResultadoWrapper discriminated union.
//
// Decisiones que este archivo implementa:
// - DOS comprables (§1): la sesión suelta usa el chasis compartido TAL
//   CUAL (crearBloqueoAgenda + confirmarCitaPagada de agendamiento.ts);
//   el PROGRAMA se compra entero por contratar_programa — todas las
//   sesiones se agendan AL COMPRAR (§12.2), atómico, sin hold.
// - El PRECIO llega RESUELTO del server (sesión: precio único §4;
//   programa: precio propio, jamás N × sesión) — el cliente pinta,
//   JAMÁS calcula.
// - Modalidad: default único del chasis (el trazado 3-modalidades es
//   S64-B0) — este wrapper no la expone.
// - El PARTE (§6) llega NARRATIVO del motor: trabajados de la sesión +
//   dominados con voz de familia + conteos. Cero checklist (LOYALTY
//   §2/§3); progresion NULL = memorial o sesión suelta — la UI no
//   inventa placeholder.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export const TIPO_ADIESTRAMIENTO = 'adiestramiento';

export const COMPRABLES_ADIESTRAMIENTO = ['sesion', 'programa'] as const;
export type ComprableAdiestramiento = (typeof COMPRABLES_ADIESTRAMIENTO)[number];

// ── Códigos de error (verificados contra los RAISE de cada body) ────────────

const CODIGOS_ERROR_ADIESTRAMIENTO_RESERVA = [
  'acceso_denegado',
  // §2: techo solo perros — la UI filtra, la DB manda.
  'mascota_no_elegible',
  'servicio_no_disponible',
  'programa_no_disponible',
  // una matrícula ACTIVA del mismo programa por mascota.
  'programa_duplicado',
  'slot_invalido',
  'slot_en_pasado',
  'fuera_de_horario',
  'fecha_sin_cupo',
  'prestador_no_disponible',
  'prestador_inactivo',
  // la vigencia del catálogo no cubre el calendario elegido.
  'programa_excede_vigencia',
  'cuenta_no_activa',
  'parte_no_existe',
  'parte_no_disponible',
] as const;

export type CodigoErrorAdiestramientoReserva =
  (typeof CODIGOS_ERROR_ADIESTRAMIENTO_RESERVA)[number];

const MENSAJES: Record<
  CodigoErrorAdiestramientoReserva | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:          'No tenés acceso para hacer esto.',
  mascota_no_elegible:      'El adiestramiento todavía no está disponible para esta mascota.',
  servicio_no_disponible:   'Esta oferta ya no está disponible.',
  programa_no_disponible:   'Este programa ya no está disponible.',
  programa_duplicado:       'Tu mascota ya tiene este programa en curso.',
  slot_invalido:            'El horario elegido no es válido.',
  slot_en_pasado:           'Esa fecha ya pasó — elegí una desde mañana.',
  fuera_de_horario:         'El adiestrador no atiende en ese horario.',
  fecha_sin_cupo:           'Una de las fechas del programa ya no tiene lugar.',
  prestador_no_disponible:  'El adiestrador no está disponible en esas fechas.',
  prestador_inactivo:       'Este adiestrador ya no está disponible.',
  programa_excede_vigencia: 'El calendario del programa no entra en su vigencia.',
  cuenta_no_activa:         'Este adiestrador todavía no puede recibir reservas.',
  parte_no_existe:          'Todavía no hay un parte para esta sesión.',
  parte_no_disponible:      'El parte estará listo cuando el adiestrador cierre la sesión.',
  datos_inconsistentes:     'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:        'Ocurrió un error inesperado. Probá de nuevo.',
};

function normalizarCodigo(
  raw: string,
): CodigoErrorAdiestramientoReserva | 'error_desconocido' {
  if (
    raw === 'auth_required' ||
    raw.startsWith('no_access_to_mascota') ||
    raw.startsWith('no_access')
  ) {
    return 'acceso_denegado';
  }
  if (raw.startsWith('ventana_invalida') || raw.startsWith('comprable_invalido')) {
    return 'slot_invalido';
  }
  // Códigos con sufijo ': <detalle>' — normalizar por prefijo (L-115).
  for (const codigo of CODIGOS_ERROR_ADIESTRAMIENTO_RESERVA) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

function fallo<T>(
  mensajeOriginal: string,
): ResultadoWrapper<T, CodigoErrorAdiestramientoReserva> {
  const codigo = normalizarCodigo(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

type Obj = Record<string, unknown>;

function esObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null;
}

// ── A · Los inicios del DÍA/HORA (la grilla, verdad del server) ─────────────

/** Inicios REALES para la fecha, agregados entre adiestradores cobrables
 *  (7.13) con la duración PROPIA del comprable elegido en el QUÉ; para
 *  el programa la grilla es la de su PRIMERA sesión (§12.2 — las N−1
 *  las valida contratar, atómico). Devuelve 'HH:MM'. */
export async function obtenerIniciosAdiestramiento(
  fecha: string,
  mascotaId: string,
  comprable: ComprableAdiestramiento,
): Promise<ResultadoWrapper<string[], CodigoErrorAdiestramientoReserva>> {
  const { data, error } = await getClient().rpc(
    'obtener_inicios_adiestramiento_disponibles',
    { p_fecha: fecha, p_mascota_id: mascotaId, p_comprable: comprable },
  );

  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallo('datos_inconsistentes');
  const horas: string[] = [];
  for (const fila of data) {
    if (!esObj(fila) || typeof fila.hora !== 'string') {
      return fallo('datos_inconsistentes');
    }
    horas.push(fila.hora.slice(0, 5));
  }
  return { ok: true, data: horas };
}

// ── B · El QUIÉN/QUÉ (los dos comprables por adiestrador disponible) ────────

export interface OfertaAdiestrador {
  prestador_id: string;
  prestador_servicio_id: string;
  prestador_nombre: string;
  tipo_servicio: string;
  comprable: ComprableAdiestramiento;
  /** null para la sesión suelta. */
  programa_id: string | null;
  /** Nombre del servicio (sesión) o del programa declarado (§5). */
  nombre: string;
  /** basico | medio | experto | especialidad — null para la sesión. */
  nivel: string | null;
  /** N sesiones ORDENADAS del programa (§1) — null para la sesión. */
  n_sesiones: number | null;
  /** Plazo de validez en días desde la compra — null para la sesión. */
  vigencia_dias: number | null;
  /** Resuelto server-side: sesión = precio único; programa = precio
   *  propio (jamás N × sesión, §4). El server congela al comprar. */
  precio: number;
  duracion_minutos: number;
  /** La sede EN CAMPO si el adiestrador la declaró (NULL honesto). */
  direccion: string | null;
  ciudad: string | null;
}

/** Los adiestradores que PUEDEN a esa fecha/hora (motor de ventana +
 *  7.13), con sus DOS comprables resueltos (§1). La UI filtra por el
 *  comprable elegido en el QUÉ. */
export async function obtenerAdiestradoresDisponibles(
  fecha: string,
  hora: string,
  mascotaId: string,
): Promise<ResultadoWrapper<OfertaAdiestrador[], CodigoErrorAdiestramientoReserva>> {
  const { data, error } = await getClient().rpc('obtener_adiestradores_disponibles', {
    p_fecha: fecha,
    p_hora: hora,
    p_mascota_id: mascotaId,
  });

  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallo('datos_inconsistentes');
  const ofertas: OfertaAdiestrador[] = [];
  for (const fila of data) {
    if (
      !esObj(fila) ||
      typeof fila.prestador_id !== 'string' ||
      typeof fila.prestador_servicio_id !== 'string' ||
      typeof fila.prestador_nombre !== 'string' ||
      typeof fila.tipo_servicio !== 'string' ||
      (fila.comprable !== 'sesion' && fila.comprable !== 'programa') ||
      typeof fila.nombre !== 'string' ||
      typeof fila.precio !== 'number' ||
      typeof fila.duracion_minutos !== 'number'
    ) {
      return fallo('datos_inconsistentes');
    }
    ofertas.push({
      prestador_id: fila.prestador_id,
      prestador_servicio_id: fila.prestador_servicio_id,
      prestador_nombre: fila.prestador_nombre,
      tipo_servicio: fila.tipo_servicio,
      comprable: fila.comprable,
      programa_id: typeof fila.programa_id === 'string' ? fila.programa_id : null,
      nombre: fila.nombre,
      nivel: typeof fila.nivel === 'string' ? fila.nivel : null,
      n_sesiones: typeof fila.n_sesiones === 'number' ? fila.n_sesiones : null,
      vigencia_dias: typeof fila.vigencia_dias === 'number' ? fila.vigencia_dias : null,
      precio: fila.precio,
      duracion_minutos: fila.duracion_minutos,
      direccion: typeof fila.direccion === 'string' ? fila.direccion : null,
      ciudad: typeof fila.ciudad === 'string' ? fila.ciudad : null,
    });
  }
  return { ok: true, data: ofertas };
}

// ── C · Contratar el PROGRAMA (todas las sesiones al comprar, §12.2) ────────

export interface ProgramaContratado {
  programa_contratado_id: string;
  n_sesiones: number;
  /** 'YYYY-MM-DD' de la primera y la última sesión (cadencia semanal). */
  primera_sesion: string;
  ultima_sesion: string;
  /** 'YYYY-MM-DD' — plazo de validez congelado a la compra. */
  vigencia_hasta: string;
  precio_total: number;
  precio_unitario_efectivo: number;
  pagado_en: string;
}

/** UN pago simulado DECLARADO por el programa entero; las N sesiones
 *  nacen firmes y EN ORDEN (consumo secuencial, Decisión U). Atómico:
 *  si una fecha no cabe, NADA nace — el error tipado dice cuál falló. */
export async function contratarPrograma(params: {
  prestadorId: string;
  servicioId: string;
  programaId: string;
  mascotaId: string;
  /** 'YYYY-MM-DD' de la PRIMERA sesión (desde mañana). */
  fechaInicio: string;
  /** 'HH:MM' — la hora firme de TODAS las sesiones. */
  hora: string;
}): Promise<ResultadoWrapper<ProgramaContratado, CodigoErrorAdiestramientoReserva>> {
  const { data, error } = await getClient().rpc('contratar_programa', {
    p_prestador_id: params.prestadorId,
    p_servicio_id: params.servicioId,
    p_programa_id: params.programaId,
    p_mascota_id: params.mascotaId,
    p_fecha_inicio: params.fechaInicio,
    p_hora: params.hora,
  });

  if (error) return fallo(error.message);
  if (
    !esObj(data) ||
    data.ok !== true ||
    typeof data.programa_contratado_id !== 'string' ||
    typeof data.n_sesiones !== 'number' ||
    typeof data.primera_sesion !== 'string' ||
    typeof data.ultima_sesion !== 'string' ||
    typeof data.vigencia_hasta !== 'string' ||
    typeof data.precio_total !== 'number' ||
    typeof data.precio_unitario_efectivo !== 'number' ||
    typeof data.pagado_en !== 'string'
  ) {
    return fallo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      programa_contratado_id: data.programa_contratado_id,
      n_sesiones: data.n_sesiones,
      primera_sesion: data.primera_sesion,
      ultima_sesion: data.ultima_sesion,
      vigencia_hasta: data.vigencia_hasta,
      precio_total: data.precio_total,
      precio_unitario_efectivo: data.precio_unitario_efectivo,
      pagado_en: data.pagado_en,
    },
  };
}

// ── D · El PARTE (§6 — narrativo por diseño, LOYALTY §2/§3) ─────────────────

export interface ObjetivoDelParte {
  codigo: string;
  nombre: string;
  /** Voz de familia (es / en) — el dueño JAMÁS ve el código técnico. */
  nombre_familia: string;
  nombre_familia_en: string;
  /** §6: trabajado ≠ logrado — la progresión celebra alcanzado. */
  alcanzado: boolean;
  nota: string | null;
}

export interface ClipDelParte {
  storage_path: string;
  orden: number;
  duracion_segundos: number | null;
  descripcion: string | null;
}

export interface ProgresionNarrativa {
  nivel: string;
  sesion_numero: number;
  n_sesiones: number;
  /** Los comandos que la mascota YA domina, en voz de familia — el
   *  dato de la frase de vínculo (y de los guijarros cuando su letra
   *  firme, Bloque 4). */
  dominados: { codigo: string; nombre_familia: string; nombre_familia_en: string }[];
  dominados_n: number;
  /** null = programa de especialidad (sin currículum de plataforma):
   *  la narrativa habla sin el "de N". */
  del_programa_n: number | null;
}

export interface ParteAdiestramiento {
  cita_id: string;
  /** null = sesión suelta. */
  sesion: { numero: number; de: number } | null;
  objetivos: ObjetivoDelParte[];
  notas: { texto: string; categoria: string | null }[];
  clips: ClipDelParte[];
  mensaje_familia: string | null;
  instrucciones_familia: string | null;
  /** null = sesión suelta O memorial (LOYALTY §7.1: la progresión se
   *  apaga ESTRUCTURAL — la UI no pinta hueco ni placeholder). */
  progresion: ProgresionNarrativa | null;
  cerrada_en: string;
}

// ── E · Los adiestramientos del hogar (el hub, clon de obtenerMisGroomings) ─
// Lectura DIRECTA por RLS (cero RPC): evento_cita_servicio (solo-dueño) +
// tipos_servicio + prestadores + mascotas + evento_atencion. El programa
// suma su identidad k/N (sesion_numero + programa_contratado_id).

export interface AdiestramientoDelHogar {
  cita_id: string;
  /** 'YYYY-MM-DD'. */
  fecha: string;
  /** 'HH:MM'. */
  hora: string;
  /** confirmada | en_curso | completada — solo ciclo de pago vivo. */
  estado: string;
  tipo_servicio: string;
  duracion_minutos: number;
  precio: number | null;
  mascota_id: string | null;
  mascota_nombre: string | null;
  prestador_nombre: string | null;
  /** Identidad del programa (§1): null = sesión suelta. */
  sesion_numero: number | null;
  programa_contratado_id: string | null;
  /** true = la sesión cerró con calidad: el parte existe. */
  tiene_parte: boolean;
}

/** Las citas de adiestramiento del hogar (verdad firme: solo pagadas).
 *  La superficie decide el corte Próximos/Historial. */
export async function obtenerMisAdiestramientos(): Promise<
  ResultadoWrapper<AdiestramientoDelHogar[], CodigoErrorAdiestramientoReserva>
> {
  const cliente = getClient();
  const [tipos, citas] = await Promise.all([
    cliente.from('tipos_servicio').select('codigo').eq('categoria', 'adiestramiento'),
    cliente
      .from('evento_cita_servicio')
      .select(
        'id, fecha, hora, estado, duracion_minutos, precio, prestador_id, mascota_id, tipo_servicio, estado_reserva, sesion_numero, programa_contratado_id',
      )
      .in('estado', ['confirmada', 'en_curso', 'completada'])
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true }),
  ]);
  if (tipos.error || citas.error) return fallo('error');
  const codigos = new Set(tipos.data.map((t) => t.codigo));

  const filas = (citas.data ?? []).filter(
    (c) =>
      c.tipo_servicio !== null &&
      codigos.has(c.tipo_servicio) &&
      // verdad firme del hub: solo el ciclo de pago vivo
      c.estado_reserva === 'pagada',
  );
  if (filas.length === 0) return { ok: true, data: [] };

  const prestadorIds = [...new Set(filas.map((c) => c.prestador_id).filter((v): v is string => v !== null))];
  const mascotaIds = [...new Set(filas.map((c) => c.mascota_id).filter((v): v is string => v !== null))];
  const citaIds = filas.map((c) => c.id);

  const [prestadores, mascotas, atenciones] = await Promise.all([
    prestadorIds.length > 0
      ? cliente.from('prestadores').select('id, nombre_comercial').in('id', prestadorIds)
      : Promise.resolve({ data: [], error: null }),
    mascotaIds.length > 0
      ? cliente.from('mascotas').select('id, nombre').in('id', mascotaIds)
      : Promise.resolve({ data: [], error: null }),
    cliente
      .from('evento_atencion')
      .select('cita_id')
      .in('cita_id', citaIds)
      .eq('estado', 'cerrada_con_calidad'),
  ]);
  if (prestadores.error || mascotas.error || atenciones.error) return fallo('error');

  const prestadorPorId = new Map((prestadores.data ?? []).map((p) => [p.id, p.nombre_comercial]));
  const mascotaPorId = new Map((mascotas.data ?? []).map((m) => [m.id, m.nombre]));
  const citasConParte = new Set((atenciones.data ?? []).map((a) => a.cita_id));

  return {
    ok: true,
    data: filas.map((c) => ({
      cita_id: c.id,
      fecha: String(c.fecha),
      hora: String(c.hora).slice(0, 5),
      estado: c.estado ?? '',
      tipo_servicio: c.tipo_servicio ?? '',
      duracion_minutos: Number(c.duracion_minutos),
      precio: c.precio === null ? null : Number(c.precio),
      mascota_id: c.mascota_id ?? null,
      mascota_nombre: c.mascota_id !== null ? mascotaPorId.get(c.mascota_id) ?? null : null,
      prestador_nombre: c.prestador_id !== null ? prestadorPorId.get(c.prestador_id) ?? null : null,
      sesion_numero: typeof c.sesion_numero === 'number' ? c.sesion_numero : null,
      programa_contratado_id: c.programa_contratado_id ?? null,
      tiene_parte: citasConParte.has(c.id),
    })),
  };
}

// ── F · Los clips firmados (bucket privado adiestramiento-clips) ────────────

/** URLs firmadas de los clips del parte (TTL 1 h). Devuelve mapa
 *  storage_path → url; un path que no firma se OMITE (la UI muestra los
 *  que puede, jamás rompe el parte por un clip). */
export async function resolverUrlsClips(
  paths: string[],
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await getClient()
    .storage.from('adiestramiento-clips')
    .createSignedUrls(paths, 3600);
  if (error || !Array.isArray(data)) return {};
  const mapa: Record<string, string> = {};
  for (const fila of data) {
    if (fila.path !== null && typeof fila.signedUrl === 'string' && fila.error === null) {
      mapa[fila.path] = fila.signedUrl;
    }
  }
  return mapa;
}

/** El parte que enseña (§5 DESPUÉS): existe cuando el adiestrador cerró
 *  la sesión con calidad. */
export async function obtenerParteAdiestramiento(
  citaId: string,
): Promise<ResultadoWrapper<ParteAdiestramiento, CodigoErrorAdiestramientoReserva>> {
  const { data, error } = await getClient().rpc('obtener_parte_adiestramiento', {
    p_cita_id: citaId,
  });

  if (error) return fallo(error.message);
  if (
    !esObj(data) ||
    typeof data.cita_id !== 'string' ||
    !Array.isArray(data.objetivos) ||
    !Array.isArray(data.notas) ||
    !Array.isArray(data.clips)
  ) {
    return fallo('datos_inconsistentes');
  }

  const objetivos: ObjetivoDelParte[] = [];
  for (const o of data.objetivos) {
    if (
      !esObj(o) ||
      typeof o.codigo !== 'string' ||
      typeof o.nombre !== 'string' ||
      typeof o.nombre_familia !== 'string' ||
      typeof o.nombre_familia_en !== 'string' ||
      typeof o.alcanzado !== 'boolean'
    ) {
      return fallo('datos_inconsistentes');
    }
    objetivos.push({
      codigo: o.codigo,
      nombre: o.nombre,
      nombre_familia: o.nombre_familia,
      nombre_familia_en: o.nombre_familia_en,
      alcanzado: o.alcanzado,
      nota: typeof o.nota === 'string' ? o.nota : null,
    });
  }

  const notas: { texto: string; categoria: string | null }[] = [];
  for (const n of data.notas) {
    if (!esObj(n) || typeof n.texto !== 'string') return fallo('datos_inconsistentes');
    notas.push({ texto: n.texto, categoria: typeof n.categoria === 'string' ? n.categoria : null });
  }

  const clips: ClipDelParte[] = [];
  for (const c of data.clips) {
    if (!esObj(c) || typeof c.storage_path !== 'string' || typeof c.orden !== 'number') {
      return fallo('datos_inconsistentes');
    }
    clips.push({
      storage_path: c.storage_path,
      orden: c.orden,
      duracion_segundos: typeof c.duracion_segundos === 'number' ? c.duracion_segundos : null,
      descripcion: typeof c.descripcion === 'string' ? c.descripcion : null,
    });
  }

  let sesion: ParteAdiestramiento['sesion'] = null;
  if (esObj(data.sesion)) {
    const s = data.sesion;
    if (typeof s.numero !== 'number' || typeof s.de !== 'number') {
      return fallo('datos_inconsistentes');
    }
    sesion = { numero: s.numero, de: s.de };
  }

  let progresion: ProgresionNarrativa | null = null;
  if (esObj(data.progresion)) {
    const p = data.progresion;
    if (
      typeof p.nivel !== 'string' ||
      typeof p.sesion_numero !== 'number' ||
      typeof p.n_sesiones !== 'number' ||
      typeof p.dominados_n !== 'number' ||
      !Array.isArray(p.dominados)
    ) {
      return fallo('datos_inconsistentes');
    }
    const dominados: ProgresionNarrativa['dominados'] = [];
    for (const d of p.dominados) {
      if (
        !esObj(d) ||
        typeof d.codigo !== 'string' ||
        typeof d.nombre_familia !== 'string' ||
        typeof d.nombre_familia_en !== 'string'
      ) {
        return fallo('datos_inconsistentes');
      }
      dominados.push({
        codigo: d.codigo,
        nombre_familia: d.nombre_familia,
        nombre_familia_en: d.nombre_familia_en,
      });
    }
    progresion = {
      nivel: p.nivel,
      sesion_numero: p.sesion_numero,
      n_sesiones: p.n_sesiones,
      dominados,
      dominados_n: p.dominados_n,
      del_programa_n: typeof p.del_programa_n === 'number' ? p.del_programa_n : null,
    };
  }

  return {
    ok: true,
    data: {
      cita_id: data.cita_id,
      sesion,
      objetivos,
      notas,
      clips,
      mensaje_familia: typeof data.mensaje_familia === 'string' ? data.mensaje_familia : null,
      instrucciones_familia:
        typeof data.instrucciones_familia === 'string' ? data.instrucciones_familia : null,
      progresion,
      cerrada_en: typeof data.cerrada_en === 'string' ? data.cerrada_en : '',
    },
  };
}
