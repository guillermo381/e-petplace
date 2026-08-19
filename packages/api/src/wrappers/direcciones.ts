// Wrappers de la dirección del HOGAR (S56-A Tarea 1 — D-339).
// La dirección vive en `direcciones_guardadas` (RLS dir_own: solo-dueño);
// la cita de paseo lleva SNAPSHOT congelado (evento_cita_servicio.
// direccion_snapshot, claves fijas — lo estampa el server al crear el
// hold o al pagar, JAMÁS el cliente). Patrón canónico del monorepo:
// códigos tipados + normalización por prefijo (L-115) + guards de shape
// contra el DDL real de la migración 20260712090000 (L-124).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

// ── Códigos de error (verificados contra los RAISE del body) ────────────────

const CODIGOS_ERROR_DIRECCION = [
  'acceso_denegado',
  'direccion_requerida',
  'ciudad_requerida',
  'telefono_invalido',
  // S79-A4: las coordenadas van en PAR y en rango, o no van (L-139).
  'coordenadas_invalidas',
  // S100c · los cuatro del alias. Cada uno con voz propia: `datos_invalidos`
  // como cajón de sastre es justo lo que D-827 nombra.
  'alias_requerido',
  'alias_muy_largo',
  'punto_requerido',
  'direccion_no_encontrada',
] as const;

export type CodigoErrorDireccion = (typeof CODIGOS_ERROR_DIRECCION)[number];

const MENSAJES_ERROR_DIRECCION: Record<
  CodigoErrorDireccion | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:      'No tenés acceso para hacer esto.',
  direccion_requerida:  'Contanos la dirección de tu hogar.',
  ciudad_requerida:     'Contanos en qué ciudad está tu hogar.',
  telefono_invalido:    'El teléfono no es válido — sin el signo +.',
  coordenadas_invalidas: 'La ubicación no es válida. Buscá la dirección de nuevo.',
  alias_requerido:      'Ponele un nombre para reconocerla — «Oficina», «Casa de mamá».',
  alias_muy_largo:      'El nombre es muy largo. Con pocas palabras alcanza.',
  punto_requerido:      'Falta el punto en el mapa: es lo que encuentra la puerta.',
  direccion_no_encontrada: 'Esa dirección ya no está en tu lista.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:    'Ocurrió un error inesperado. Probá de nuevo.',
};

function normalizarCodigo(raw: string): CodigoErrorDireccion | 'error_desconocido' {
  if (raw === 'auth_required') return 'acceso_denegado';
  for (const codigo of CODIGOS_ERROR_DIRECCION) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

function mapeoErrorAResultado<T>(
  mensajeOriginal: string,
): ResultadoWrapper<T, CodigoErrorDireccion> {
  const codigo = normalizarCodigo(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES_ERROR_DIRECCION[codigo] };
}

// ── Lectura: la dirección principal del hogar (null honesto sin dato) ───────

export interface DireccionHogar {
  id: string;
  direccion: string;
  ciudad: string;
  sector: string | null;
  referencias: string | null;
  telefono: string | null;
  /** S79-A4: coordenadas de la resolución Places — null = dirección
   *  sin ubicar en el mapa (honesto; escribirlas exige resolver). */
  lat: number | null;
  lon: number | null;
}

/**
 * La dirección principal del hogar del user autenticado, o null honesto
 * si todavía no la contó. La RLS dir_own es la puerta (solo-dueño).
 */
export async function obtenerDireccionHogar(): Promise<
  ResultadoWrapper<DireccionHogar | null, CodigoErrorDireccion>
> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('direcciones_guardadas')
    .select('id, direccion, ciudad, sector, referencias, telefono, lat, lon')
    .eq('es_principal', true)
    .maybeSingle();

  if (error) return mapeoErrorAResultado(error.message);
  if (data === null) return { ok: true, data: null };
  if (typeof data.id !== 'string' || typeof data.direccion !== 'string' || typeof data.ciudad !== 'string') {
    return {
      ok: false,
      codigo: 'datos_inconsistentes',
      mensaje: MENSAJES_ERROR_DIRECCION.datos_inconsistentes,
    };
  }
  return {
    ok: true,
    data: {
      id: data.id,
      direccion: data.direccion,
      ciudad: data.ciudad,
      sector: data.sector ?? null,
      referencias: data.referencias ?? null,
      telefono: data.telefono ?? null,
      lat: typeof data.lat === 'number' ? data.lat : null,
      lon: typeof data.lon === 'number' ? data.lon : null,
    },
  };
}

// ── Escritura: upsert de la dirección del hogar (RPC, puerta única) ─────────

export interface GuardarDireccionHogarInput {
  direccion: string;
  ciudad: string;
  sector?: string | null;
  referencias?: string | null;
  /** E.164 SIN '+' (regla 28) — el server rebota telefono_invalido si lo trae. */
  telefono?: string | null;
  /** S79-A4: SOLO del LugarResuelto de resolverLugar (contrato lugares.ts) —
   *  jamás tipeadas a mano. Omitidas o null = guardado sin ubicación, y el
   *  server PISA las viejas con NULL: la coordenada muere con el texto que
   *  la parió (LETRA_PERFIL_S79 §2.2). Van en par o rebota. */
  lat?: number | null;
  lon?: number | null;
  /**
   * 🔴 S100d·bis · LA AUDITORÍA DEL PUNTO (ver la nota larga en
   * `guardarDireccionConAlias`). `places_id` era una columna sin escritor, y
   * sin la coordenada que Places resolvió **la divergencia entre lo que el
   * dueño eligió y lo que se guardó no era auditable después del hecho.**
   *
   * ⚠️ OPCIONALES a propósito: una dirección escrita a mano no pasó por Places.
   * *Mandar el punto final como si fuera el de Places haría la auditoría
   * siempre verde y sería peor que no tenerla.*
   */
  placesId?: string | null;
  latPlaces?: number | null;
  lonPlaces?: number | null;
}

/**
 * Guarda (o actualiza) LA dirección principal del hogar — una sola fila
 * por user (índice parcial uq_direcciones_principal_por_user). Los holds
 * de paseo posteriores nacen con su snapshot; un hold vigente sin
 * dirección la congela al PAGAR (server-side, D-339).
 */
export async function guardarDireccionHogar(
  input: GuardarDireccionHogarInput,
): Promise<ResultadoWrapper<{ direccionId: string }, CodigoErrorDireccion>> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('guardar_direccion_hogar', {
    p_direccion: input.direccion,
    p_ciudad: input.ciudad,
    p_sector: input.sector ?? undefined,
    p_referencias: input.referencias ?? undefined,
    p_telefono: input.telefono ?? undefined,
    // Sin resolución Places el parámetro se OMITE y cae al DEFAULT NULL
    // del server — que PISA las coordenadas viejas (§2.2: mueren con el
    // texto que las parió). El tipo generado no admite null explícito.
    p_lat: input.lat ?? undefined,
    p_lon: input.lon ?? undefined,
    p_places_id: input.placesId ?? undefined,
    p_lat_places: input.latPlaces ?? undefined,
    p_lon_places: input.lonPlaces ?? undefined,
  });

  if (error) return mapeoErrorAResultado(error.message);

  const o = data as Record<string, unknown> | null;
  if (o === null || typeof o !== 'object' || o.ok !== true || typeof o.direccion_id !== 'string') {
    return {
      ok: false,
      codigo: 'datos_inconsistentes',
      mensaje: MENSAJES_ERROR_DIRECCION.datos_inconsistentes,
    };
  }
  return { ok: true, data: { direccionId: o.direccion_id } };
}

// ═══════════════════════════════════════════════════════════════════════════
// S100c · LAS DIRECCIONES CON ALIAS — «oficina», «suegra», además del hogar
// ═══════════════════════════════════════════════════════════════════════════
//
// MEDIDO ANTES DE CONSTRUIR: `direcciones_guardadas.alias` es **NOT NULL** y
// el índice único es PARCIAL (`WHERE es_principal`) ⇒ la tabla admitía N
// direcciones por persona **desde siempre**. Lo que no existía era la puerta:
// `guardar_direccion_hogar` hardcodea `'Hogar'` + `es_principal = true`, y el
// lector filtraba `.eq('es_principal', true)`.
// *El esquema se adelantó y la puerta se quedó* — el patrón inverso al lector
// de carrito que se construyó sin consumidores.

/** Una dirección de la libreta. La principal viene marcada y NO se mezcla:
 *  sigue siendo la del hogar, con su propia puerta. */
export interface DireccionGuardada extends DireccionHogar {
  alias: string;
  es_principal: boolean;
}

/**
 * TODAS las direcciones de la persona, la principal primero.
 *
 * ⚠️ NO reemplaza a `obtenerDireccionHogar`: esa sigue siendo la puerta del
 * hogar y la consumen paseo, grooming, veterinaria y adiestramiento. *Un
 * lector nuevo no jubila a uno vivo sin censar a sus consumidores.*
 */
export async function listarMisDirecciones(): Promise<
  ResultadoWrapper<DireccionGuardada[], CodigoErrorDireccion>
> {
  const { data, error } = await getClient()
    .from('direcciones_guardadas')
    .select('id, alias, direccion, ciudad, sector, referencias, telefono, lat, lon, es_principal')
    // La principal primero; el resto por alias, que es como la persona las
    // busca. `created_at` las ordenaría por cuándo las escribió, que es un
    // dato que ella no recuerda.
    .order('es_principal', { ascending: false })
    .order('alias', { ascending: true });

  if (error) return mapeoErrorAResultado(error.message);
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ERROR_DIRECCION.datos_inconsistentes };
  }

  const salida: DireccionGuardada[] = [];
  for (const d of data) {
    if (typeof d.id !== 'string' || typeof d.direccion !== 'string') continue;
    if (typeof d.ciudad !== 'string' || typeof d.alias !== 'string') continue;
    salida.push({
      id: d.id,
      alias: d.alias,
      direccion: d.direccion,
      ciudad: d.ciudad,
      sector: d.sector ?? null,
      referencias: d.referencias ?? null,
      telefono: d.telefono ?? null,
      lat: typeof d.lat === 'number' ? d.lat : null,
      lon: typeof d.lon === 'number' ? d.lon : null,
      es_principal: d.es_principal === true,
    });
  }
  return { ok: true, data: salida };
}

/**
 * Guarda una dirección CON ALIAS. Crea si no se pasa `direccionId`, edita si sí.
 *
 * 🔴 NUNCA toca la principal: el motor escribe `es_principal = false` sin
 * excepción, y la principal tiene su propio índice único. Guardar una oficina
 * **no puede** desplazar al hogar ni por error de llamada.
 *
 * ⚠️ EL PUNTO ES OBLIGATORIO, y no es decisión de esta capa: la tabla lleva
 * `chk_direccion_con_punto`. El motor lo rebota con `punto_requerido` en vez
 * de dejar explotar el constraint — *un error de constraint sale como
 * `datos_invalidos`, y esa voz no le dice a nadie qué hacer* (D-827 en chico).
 */
export async function guardarDireccionConAlias(input: {
  alias: string;
  direccion: string;
  ciudad: string;
  sector?: string | null;
  referencias?: string | null;
  telefono?: string | null;
  lat: number;
  lon: number;
  /** Presente = edita esa dirección; ausente = crea una nueva. */
  direccionId?: string | null;
  /**
   * 🔴 S100d·bis · LA AUDITORÍA DEL PUNTO — `places_id` era una COLUMNA SIN
   * ESCRITOR.
   *
   * Medido: la columna existe desde su DDL, y **0 de 3 direcciones la tienen**
   * porque **este wrapper nunca la mandaba y la RPC no la tomaba**. *El cero no
   * probaba que Places fallara: probaba que nuestra puerta no lo guardaba.*
   *
   * ⚠️ Y lo grave no era la columna vacía: **guardábamos el punto final y NO la
   * coordenada que Places resolvió** ⇒ cuando el mapa corría el pin sin que el
   * dueño se enterara —el defecto que el founder reportó—, **la divergencia no
   * era auditable después del hecho: no había contra qué comparar.**
   *
   * Con estos tres, el dato nuevo nace completo y la divergencia se vuelve
   * medible. **Las direcciones viejas quedan como están** (decisión firmada:
   * no se inventa un `places_id` retroactivo) — su NULL es la verdad: *no
   * sabemos*.
   *
   * ⚠️ Los tres son OPCIONALES a propósito: una dirección escrita a mano no
   * pasó por Places y **no tiene** coordenada resuelta. *Mandar el punto final
   * como si fuera el de Places haría la auditoría siempre verde y sería peor
   * que no tenerla.*
   */
  placesId?: string | null;
  latPlaces?: number | null;
  lonPlaces?: number | null;
}): Promise<ResultadoWrapper<{ direccionId: string }, CodigoErrorDireccion>> {
  const { data, error } = await getClient().rpc('guardar_direccion_con_alias', {
    p_alias: input.alias,
    p_direccion: input.direccion,
    p_ciudad: input.ciudad,
    p_sector: input.sector ?? undefined,
    p_referencias: input.referencias ?? undefined,
    p_telefono: input.telefono ?? undefined,
    p_lat: input.lat,
    p_lon: input.lon,
    p_direccion_id: input.direccionId ?? undefined,
    p_places_id: input.placesId ?? undefined,
    p_lat_places: input.latPlaces ?? undefined,
    p_lon_places: input.lonPlaces ?? undefined,
  });

  if (error) return mapeoErrorAResultado(error.message);
  const o = data as Record<string, unknown> | null;
  if (o === null || typeof o !== 'object' || o.ok !== true || typeof o.direccion_id !== 'string') {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ERROR_DIRECCION.datos_inconsistentes };
  }
  return { ok: true, data: { direccionId: o.direccion_id } };
}
