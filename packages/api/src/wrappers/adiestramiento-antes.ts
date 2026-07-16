// LA FICHA DEL ANTES DE ADIESTRAMIENTO (S63-B, Bloque 3 parcial) —
// MODELO_ADIESTRAMIENTO §5: vista FILTRADA de la mascota al oficio,
// hermana de la ficha del Antes de grooming (mismo patrón: lectura
// directa con RLS, composición en TS, jamás la HC completa).
//
// RELEVAMIENTO L-144 (S63-B, contra DB viva):
//   · nervioso_otros_perros NO es un campo del perfil — es una fila de
//     cat_novedades_paseo (grupo 'comportamiento', migración
//     20260708120000, nacida S46 "para futuros adiestradores"). La
//     señal conductual SE REGISTRA como novedad en los paseos
//     (evento_paseo_novedades: mascota_id + novedad_codigo + created_at).
//     El circuito se cierra ACÁ: la ficha agrega esas novedades por
//     código y se las muestra al adiestrador — señales derivadas de
//     paseos REALES, no autodeclaración.
//   · RLS de evento_paseo_novedades: SELECT por
//     user_tiene_acceso_a_mascota(mascota_id) — el adiestrador con
//     acceso vigente VE las señales registradas por OTROS prestadores.
//   · RLS de programas_contratados: el prestador solo ve los PROPIOS
//     (pc_prestador_own) — el historial visible es "programas con este
//     prestador"; la visibilidad cruzada entre adiestradores pediría
//     letra nueva (espejo del hueco §6.4.5, declarado).
//   · La bitácora de la familia (§7) NO existe como pieza todavía — la
//     ficha no la lee; la pantalla declara el espacio (placeholder
//     honesto) y se conecta cuando nazca.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS_ANTES_ADIESTRAMIENTO = ['no_access_to_mascota'] as const;

export type CodigoErrorAntesAdiestramiento =
  | (typeof CODIGOS_ANTES_ADIESTRAMIENTO)[number]
  | 'error_desconocido';

const MENSAJES: Record<CodigoErrorAntesAdiestramiento, string> = {
  no_access_to_mascota: 'No tienes acceso a esta mascota.',
  error_desconocido: 'No pudimos cargar la ficha. Intenta de nuevo.',
};

function normalizarCodigo(mensaje: string): CodigoErrorAntesAdiestramiento {
  // L-115: los códigos de error viajan como prefijo del mensaje.
  const codigo = CODIGOS_ANTES_ADIESTRAMIENTO.find((c) => mensaje.startsWith(c));
  return codigo ?? 'error_desconocido';
}

function fallo<T>(mensajeOriginal: string): ResultadoWrapper<T, CodigoErrorAntesAdiestramiento> {
  const codigo = normalizarCodigo(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

export interface SenalConductualPaseo {
  codigo: string;
  /** Voz de picker del prestador (oficio) — la de familia queda para el dueño. */
  nombre: string;
  /** La letra fina del catálogo (ej. distingue miedo de reactividad). */
  descripcion: string | null;
  veces: number;
  /** created_at de la última vez que un paseador la registró (ISO). */
  ultima: string;
}

export interface ProgramaPrevioAdiestramiento {
  id: string;
  nombre: string;
  nivel: string;
  n_sesiones: number;
  estado: string;
  contratado_en: string;
}

export interface FichaAntesAdiestramiento {
  mascota_id: string;
  nombre: string;
  especie: string | null;
  raza: string | null;
  foto_url: string | null;
  fecha_nacimiento: string | null;
  es_memorial: boolean;
  /** Insumos del momento vital (patrón ficha grooming S61-B7): la
   *  pantalla calcula con @epetplace/domain; null = la señal calla. */
  umbrales: { m2InicioMeses: number; m3InicioMeses: number; m5InicioMeses: number } | null;
  tiene_alergias: boolean;
  tiene_condicion_cronica: boolean;
  tiene_emergencia_activa: boolean;
  /** Señales del grupo 'comportamiento' agregadas de paseos reales,
   *  más frecuente primero. Vacío legal = sin señales registradas. */
  senales: SenalConductualPaseo[];
  /** Solo los programas contratados CON ESTE prestador (verdad de RLS). */
  programas_previos: ProgramaPrevioAdiestramiento[];
}

// Guard de shape del jsonb del catálogo (L-124, espejo de perfilMascota).
function parsearUmbrales(jsonb: unknown): FichaAntesAdiestramiento['umbrales'] {
  if (typeof jsonb !== 'object' || jsonb === null) return null;
  const o = jsonb as Record<string, unknown>;
  const m2 = o['M2_inicio_meses'];
  const m3 = o['M3_inicio_meses'];
  const m5 = o['M5_inicio_meses'];
  if (typeof m2 !== 'number' || typeof m3 !== 'number' || typeof m5 !== 'number') return null;
  return { m2InicioMeses: m2, m3InicioMeses: m3, m5InicioMeses: m5 };
}

export async function obtenerFichaAntesAdiestramiento(
  mascotaId: string,
): Promise<ResultadoWrapper<FichaAntesAdiestramiento, CodigoErrorAntesAdiestramiento>> {
  const cliente = getClient();
  const mascota = await cliente
    .from('mascotas')
    .select('id, nombre, especie, raza, foto_url, fecha_nacimiento, estado_vida')
    .eq('id', mascotaId)
    .maybeSingle();
  if (mascota.error) return fallo(mascota.error.message);
  // RLS: sin acceso vigente la fila no existe para este user.
  if (mascota.data === null) return fallo('no_access_to_mascota');

  const [perfil, catalogoUmbrales, novedades, catalogoConducta, programas] = await Promise.all([
    cliente
      .from('mascota_perfil_vigente')
      .select('alergias, condiciones_cronicas, tiene_emergencia_activa')
      .eq('mascota_id', mascotaId)
      .maybeSingle(),
    // umbrales del momento vital — su fallo NO tumba la ficha (L-139).
    mascota.data.especie !== null
      ? cliente
          .from('cat_especies_perfil')
          .select('momentos_vitales_jsonb')
          .eq('especie_codigo', mascota.data.especie)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    cliente
      .from('evento_paseo_novedades')
      .select('novedad_codigo, created_at')
      .eq('mascota_id', mascotaId)
      .order('created_at', { ascending: false })
      .limit(500),
    cliente
      .from('cat_novedades_paseo')
      .select('codigo, nombre, descripcion')
      .eq('grupo', 'comportamiento')
      .eq('activo', true),
    cliente
      .from('programas_contratados')
      .select('id, n_sesiones, estado, created_at, programa:prestador_programas(nombre, nivel)')
      .eq('mascota_id', mascotaId)
      .order('created_at', { ascending: false }),
  ]);
  if (perfil.error) return fallo(perfil.error.message);
  if (novedades.error) return fallo(novedades.error.message);
  if (catalogoConducta.error) return fallo(catalogoConducta.error.message);
  if (programas.error) return fallo(programas.error.message);

  // Agregación de señales: solo códigos del grupo comportamiento; la
  // primera aparición del orden desc ES la última vez registrada.
  const porCodigo = new Map<string, { veces: number; ultima: string }>();
  const conducta = new Map(catalogoConducta.data.map((c) => [c.codigo, c]));
  for (const n of novedades.data) {
    if (!conducta.has(n.novedad_codigo)) continue;
    const previo = porCodigo.get(n.novedad_codigo);
    if (previo) previo.veces += 1;
    else porCodigo.set(n.novedad_codigo, { veces: 1, ultima: n.created_at });
  }
  const senales: SenalConductualPaseo[] = [...porCodigo.entries()]
    .map(([codigo, agg]) => {
      const cat = conducta.get(codigo);
      return {
        codigo,
        nombre: cat?.nombre ?? codigo,
        descripcion: cat?.descripcion ?? null,
        veces: agg.veces,
        ultima: agg.ultima,
      };
    })
    .sort((a, b) => b.veces - a.veces || b.ultima.localeCompare(a.ultima));

  const programasPrevios: ProgramaPrevioAdiestramiento[] = programas.data.map((p) => ({
    id: p.id,
    nombre: p.programa?.nombre ?? '',
    nivel: p.programa?.nivel ?? '',
    n_sesiones: p.n_sesiones,
    estado: p.estado,
    contratado_en: p.created_at,
  }));

  const alergias = perfil.data?.alergias;
  const condiciones = perfil.data?.condiciones_cronicas;
  return {
    ok: true,
    data: {
      mascota_id: mascota.data.id,
      nombre: mascota.data.nombre,
      especie: mascota.data.especie,
      raza: mascota.data.raza,
      foto_url: mascota.data.foto_url,
      fecha_nacimiento: mascota.data.fecha_nacimiento,
      es_memorial: mascota.data.estado_vida !== null && mascota.data.estado_vida !== 'activa',
      umbrales: catalogoUmbrales.error ? null : parsearUmbrales(catalogoUmbrales.data?.momentos_vitales_jsonb),
      tiene_alergias: Array.isArray(alergias) && alergias.length > 0,
      tiene_condicion_cronica: Array.isArray(condiciones) && condiciones.length > 0,
      tiene_emergencia_activa: perfil.data?.tiene_emergencia_activa ?? false,
      senales,
      programas_previos: programasPrevios,
    },
  };
}
