// LA BITÁCORA DE LA FAMILIA (S63-A, MODELO_ADIESTRAMIENTO v1.1 §7):
// la familia registra lo que evidencia de su mascota entre sesiones.
// Patrón canónico (ver adiestramiento-reserva.ts): códigos tipados +
// normalización por prefijo (L-115) + guards de shape (L-124).
//
// - Escritura SOLO por RPC (registrar_bitacora_familia — deriva P5
//   server-side y exige contexto §7: matrícula activa o cita viva).
// - Lectura por RLS directa (user_tiene_acceso_a_mascota — sirve a la
//   FAMILIA y al ANTES del adiestrador con la misma puerta).
// - El vocabulario son DOS catálogos con intersección (decisión
//   arquitecto S63): objetivos del currículum + conductas observadas.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export type ChipBitacoraTipo = 'objetivo' | 'conducta';

const CODIGOS_ERROR_BITACORA = [
  'acceso_denegado',
  // §7 v1: la bitácora vive dentro del programa/servicio activo — la
  // universal es diferido declarado.
  'sin_contexto_activo',
  'bitacora_vacia',
  'chip_invalido',
] as const;

export type CodigoErrorBitacora = (typeof CODIGOS_ERROR_BITACORA)[number];

const MENSAJES: Record<
  CodigoErrorBitacora | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:      'No tenés acceso para hacer esto.',
  sin_contexto_activo:  'La bitácora se abre con un programa o una sesión de adiestramiento activa.',
  bitacora_vacia:       'Elegí al menos una observación o escribí algo.',
  chip_invalido:        'Una de las observaciones elegidas ya no está disponible.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:    'Ocurrió un error inesperado. Probá de nuevo.',
};

function normalizarCodigo(raw: string): CodigoErrorBitacora | 'error_desconocido' {
  if (raw === 'auth_required' || raw.startsWith('no_access_to_mascota')) {
    return 'acceso_denegado';
  }
  for (const codigo of CODIGOS_ERROR_BITACORA) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

function fallo<T>(mensajeOriginal: string): ResultadoWrapper<T, CodigoErrorBitacora> {
  const codigo = normalizarCodigo(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

// ── A · El vocabulario de los chips (los DOS catálogos, voz de familia) ─────

export interface ChipVocabulario {
  tipo: ChipBitacoraTipo;
  codigo: string;
  nombre_familia: string;
  nombre_familia_en: string;
}

export type NivelCurriculum = 'basico' | 'medio' | 'experto';

const NIVELES_CURRICULUM: readonly NivelCurriculum[] = ['basico', 'medio', 'experto'];

/** El vocabulario CON su grupo de navegación (S65 §7): la agrupación no
 *  se inventa — sale de la convención VIVA de DB. Conductas = su propio
 *  catálogo (tipo). Objetivos = el `nivel` que el currículum
 *  (cat_curriculum_adiestramiento) ya les asigna; objetivo fuera del
 *  currículum o de nivel desconocido → null (la UI lo agrupa aparte,
 *  jamás pinta el código crudo — Ley 3). */
export interface ChipVocabularioAgrupado extends ChipVocabulario {
  nivel: NivelCurriculum | null;
}

/** Los chips disponibles para registrar: conductas observadas del hogar
 *  primero (el vocabulario propio de la familia), objetivos del
 *  currículum después ("ya lo hace en casa"), cada uno con su grupo. */
export async function obtenerVocabularioBitacora(): Promise<
  ResultadoWrapper<ChipVocabularioAgrupado[], CodigoErrorBitacora>
> {
  const cliente = getClient();
  const [conductas, objetivos, curriculum] = await Promise.all([
    cliente
      .from('cat_conductas_bitacora')
      .select('codigo, nombre_familia, nombre_familia_en')
      .eq('activo', true)
      .order('orden_display', { ascending: true }),
    cliente
      .from('cat_objetivos_adiestramiento')
      .select('codigo, nombre_familia, nombre_familia_en')
      .eq('activo', true)
      .order('orden_display', { ascending: true }),
    cliente
      .from('cat_curriculum_adiestramiento')
      .select('objetivo_codigo, nivel')
      .eq('activo', true),
  ]);
  if (conductas.error || objetivos.error || curriculum.error) return fallo('error');

  const nivelPorObjetivo = new Map<string, NivelCurriculum>();
  for (const fila of curriculum.data ?? []) {
    const nivel = NIVELES_CURRICULUM.find((n) => n === fila.nivel);
    if (nivel !== undefined) nivelPorObjetivo.set(fila.objetivo_codigo, nivel);
  }

  return {
    ok: true,
    data: [
      ...(conductas.data ?? []).map((c) => ({ tipo: 'conducta' as const, nivel: null, ...c })),
      ...(objetivos.data ?? []).map((o) => ({
        tipo: 'objetivo' as const,
        nivel: nivelPorObjetivo.get(o.codigo) ?? null,
        ...o,
      })),
    ],
  };
}

// ── B · Registrar (la escritura del lado familia) ───────────────────────────

export interface BitacoraRegistrada {
  bitacora_id: string;
  chips: number;
  aportado_por_menor: boolean;
}

/** Registra una observación: chips (de cualquiera de los dos
 *  vocabularios) + texto libre — al menos uno. El contexto §7 y P5 los
 *  resuelve el server. */
export async function registrarBitacoraFamilia(
  mascotaId: string,
  texto: string | null,
  chips: { tipo: ChipBitacoraTipo; codigo: string }[],
): Promise<ResultadoWrapper<BitacoraRegistrada, CodigoErrorBitacora>> {
  const { data, error } = await getClient().rpc('registrar_bitacora_familia', {
    p_mascota_id: mascotaId,
    p_texto: texto ?? undefined,
    p_chips: chips,
  });

  if (error) return fallo(error.message);
  const o = data as Record<string, unknown> | null;
  if (
    o === null ||
    typeof o !== 'object' ||
    o.ok !== true ||
    typeof o.bitacora_id !== 'string' ||
    typeof o.chips !== 'number' ||
    typeof o.aportado_por_menor !== 'boolean'
  ) {
    return fallo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      bitacora_id: o.bitacora_id,
      chips: o.chips,
      aportado_por_menor: o.aportado_por_menor,
    },
  };
}

// ── C · Leer (la familia en su hub; el ANTES del adiestrador) ───────────────

export interface EntradaBitacora {
  bitacora_id: string;
  mascota_id: string;
  /** null = el contexto fue una sesión suelta viva. */
  programa_contratado_id: string | null;
  texto: string | null;
  /** P5: marcada, jamás oculta — el tratamiento fino es del motor de
   *  loyalty (B4), no de la superficie. */
  aportado_por_menor: boolean;
  chips: ChipVocabulario[];
  created_at: string;
}

/** Las entradas de la bitácora, más recientes primero. `mascotaId`
 *  acota a una mascota (el Antes del adiestrador); sin él, todas las
 *  visibles por RLS (el hub de la familia). */
export async function obtenerBitacora(
  mascotaId?: string,
  limite = 30,
): Promise<ResultadoWrapper<EntradaBitacora[], CodigoErrorBitacora>> {
  const cliente = getClient();
  let q = cliente
    .from('evento_bitacora_familia')
    .select('id, mascota_id, programa_contratado_id, texto, aportado_por_menor, created_at')
    .order('created_at', { ascending: false })
    .limit(limite);
  if (mascotaId !== undefined) q = q.eq('mascota_id', mascotaId);
  const entradas = await q;
  if (entradas.error) return fallo('error');
  if ((entradas.data ?? []).length === 0) return { ok: true, data: [] };

  const ids = entradas.data.map((e) => e.id);
  const [chips, conductas, objetivos] = await Promise.all([
    cliente.from('evento_bitacora_chips').select('bitacora_id, chip_tipo, codigo').in('bitacora_id', ids),
    cliente.from('cat_conductas_bitacora').select('codigo, nombre_familia, nombre_familia_en'),
    cliente.from('cat_objetivos_adiestramiento').select('codigo, nombre_familia, nombre_familia_en'),
  ]);
  if (chips.error || conductas.error || objetivos.error) return fallo('error');

  const vozConducta = new Map((conductas.data ?? []).map((c) => [c.codigo, c]));
  const vozObjetivo = new Map((objetivos.data ?? []).map((o) => [o.codigo, o]));
  const chipsPorEntrada = new Map<string, ChipVocabulario[]>();
  for (const ch of chips.data ?? []) {
    const voz = ch.chip_tipo === 'conducta' ? vozConducta.get(ch.codigo) : vozObjetivo.get(ch.codigo);
    if (voz === undefined) continue; // catálogo desactivado: se omite, jamás el código crudo
    const lista = chipsPorEntrada.get(ch.bitacora_id) ?? [];
    lista.push({
      tipo: ch.chip_tipo === 'conducta' ? 'conducta' : 'objetivo',
      codigo: ch.codigo,
      nombre_familia: voz.nombre_familia,
      nombre_familia_en: voz.nombre_familia_en,
    });
    chipsPorEntrada.set(ch.bitacora_id, lista);
  }

  return {
    ok: true,
    data: entradas.data.map((e) => ({
      bitacora_id: e.id,
      mascota_id: e.mascota_id,
      programa_contratado_id: e.programa_contratado_id ?? null,
      texto: e.texto ?? null,
      aportado_por_menor: Boolean(e.aportado_por_menor),
      chips: chipsPorEntrada.get(e.id) ?? [],
      created_at: String(e.created_at),
    })),
  };
}
