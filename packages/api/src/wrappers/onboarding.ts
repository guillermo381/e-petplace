// Wrappers del onboarding dueño (S45-B4) — contra las RPCs de la migración
// 20260707170000_s45_onboarding_dueno_rpcs:
//   · crear_familia_con_primera_mascota (atómica: familia + titular + mascota)
//   · get_estado_onboarding_dueno (routing del front al abrir la app)
// Shapes verificados contra el retorno REAL de las RPCs (jsonb_build_object,
// test imperativo con JWT + ROLLBACK del 7-Jul) — L-124, nunca calcado.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
import type { EstadoVidaMascota } from './_mascotas-elegibles';

const CODIGOS_ERROR_ONBOARDING = [
  'no_autenticado',
  'nombre_familia_requerido',
  'nombre_mascota_requerido',
  'familia_ya_existe',
  'sin_familia_activa',
  'especie_invalida_o_inactiva',
  'sexo_invalido',
  'precision_fecha_invalida',
  'precision_sin_fecha',
] as const;

export type CodigoErrorOnboarding = (typeof CODIGOS_ERROR_ONBOARDING)[number];

const MENSAJES_ERROR_ONBOARDING: Record<
  CodigoErrorOnboarding | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  no_autenticado:              'Necesitás iniciar sesión para continuar.',
  nombre_familia_requerido:    'Contanos cómo se llama tu familia.',
  nombre_mascota_requerido:    'Contanos cómo se llama tu mascota.',
  familia_ya_existe:           'Ya tenés una familia creada.',
  sin_familia_activa:          'Tu familia todavía no existe — el primer paso es el onboarding.',
  especie_invalida_o_inactiva: 'Esa especie no está disponible por ahora.',
  sexo_invalido:               'El sexo elegido no es válido.',
  precision_fecha_invalida:    'La precisión de la fecha no es válida.',
  precision_sin_fecha:         'Elegí una fecha para poder guardar su precisión.',
  datos_inconsistentes:        'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:           'Ocurrió un error inesperado. Probá de nuevo.',
};

function normalizarCodigo(raw: string): CodigoErrorOnboarding | 'error_desconocido' {
  // Códigos con posible sufijo ': <detalle>' — por prefijo (L-115).
  for (const codigo of CODIGOS_ERROR_ONBOARDING) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

function mapeoErrorAResultado<T>(
  mensajeOriginal: string,
): ResultadoWrapper<T, CodigoErrorOnboarding> {
  const codigo = normalizarCodigo(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES_ERROR_ONBOARDING[codigo] };
}

/** Espejo de chk_mascotas_fecha_nacimiento_precision. */
export type PrecisionFechaNacimiento = 'exacta' | 'aproximada' | 'estimada';

export interface InputCrearFamiliaConPrimeraMascota {
  nombre_familia: string;
  nombre_mascota: string;
  /** Código de cat_especies (las 6 familias F1 post-D-287). */
  especie: string;
  /** ISO 'YYYY-MM-DD'. */
  fecha_nacimiento?: string;
  precision_fecha?: PrecisionFechaNacimiento;
  sexo?: 'macho' | 'hembra' | 'desconocido';
  /** URL pública del avatar ya subido a mascotas/{uid}/… (S45-B4.1). */
  foto_url?: string;
}

export interface FamiliaCreada {
  familia_id: string;
  familia_miembro_id: string;
  mascota_id: string;
  pet_hash: string;
}

/** Onboarding atómico del dueño: familia estandar + titular + primera
 *  mascota. Los triggers de DB completan visibilidad/perfil/espejado. */
export async function crearFamiliaConPrimeraMascota(
  input: InputCrearFamiliaConPrimeraMascota,
): Promise<ResultadoWrapper<FamiliaCreada, CodigoErrorOnboarding>> {
  _invalidarEstadoOnboarding(); // S74-A: el mutador cambia el estado cacheado
  const { data, error } = await getClient().rpc('crear_familia_con_primera_mascota', {
    p_nombre_familia:   input.nombre_familia,
    p_nombre_mascota:   input.nombre_mascota,
    p_especie:          input.especie,
    p_fecha_nacimiento: input.fecha_nacimiento ?? undefined,
    p_precision_fecha:  input.precision_fecha ?? undefined,
    p_sexo:             input.sexo ?? undefined,
    p_foto_url:         input.foto_url ?? undefined,
  });

  if (error) return mapeoErrorAResultado(error.message);

  const o = data as Record<string, unknown>;
  if (
    typeof o !== 'object' || o === null ||
    typeof o.familia_id !== 'string' ||
    typeof o.familia_miembro_id !== 'string' ||
    typeof o.mascota_id !== 'string' ||
    typeof o.pet_hash !== 'string'
  ) {
    return mapeoErrorAResultado('datos_inconsistentes');
  }

  return {
    ok: true,
    data: {
      familia_id: o.familia_id,
      familia_miembro_id: o.familia_miembro_id,
      mascota_id: o.mascota_id,
      pet_hash: o.pet_hash,
    },
  };
}

// ── S55-A A2: el alta ADICIONAL — el hogar que crece ──────────────────

export interface InputAgregarMascotaAFamilia {
  nombre_mascota: string;
  /** Código de cat_especies (las 6 familias F1 post-D-287). */
  especie: string;
  /** ISO 'YYYY-MM-DD'. */
  fecha_nacimiento?: string;
  precision_fecha?: PrecisionFechaNacimiento;
  sexo?: 'macho' | 'hembra' | 'desconocido';
  /** Path del avatar ya subido a mascotas/{uid}/… (S47: jamás URL). */
  foto_url?: string;
}

export interface MascotaAgregada {
  familia_id: string;
  mascota_id: string;
  pet_hash: string;
}

/** Alta de mascota adicional sobre la familia VIGENTE del caller (la
 *  RPC la deriva server-side — jamás por parámetro). Espejo del
 *  onboarding S45; los triggers de DB completan visibilidad/perfil. */
export async function agregarMascotaAFamilia(
  input: InputAgregarMascotaAFamilia,
): Promise<ResultadoWrapper<MascotaAgregada, CodigoErrorOnboarding>> {
  _invalidarEstadoOnboarding(); // S74-A: el mutador cambia el estado cacheado
  const { data, error } = await getClient().rpc('agregar_mascota_a_familia', {
    p_nombre_mascota:   input.nombre_mascota,
    p_especie:          input.especie,
    p_fecha_nacimiento: input.fecha_nacimiento ?? undefined,
    p_precision_fecha:  input.precision_fecha ?? undefined,
    p_sexo:             input.sexo ?? undefined,
    p_foto_url:         input.foto_url ?? undefined,
  });

  if (error) return mapeoErrorAResultado(error.message);

  const o = data as Record<string, unknown>;
  if (
    typeof o !== 'object' || o === null ||
    typeof o.familia_id !== 'string' ||
    typeof o.mascota_id !== 'string' ||
    typeof o.pet_hash !== 'string'
  ) {
    return mapeoErrorAResultado('datos_inconsistentes');
  }

  return {
    ok: true,
    data: {
      familia_id: o.familia_id,
      mascota_id: o.mascota_id,
      pet_hash: o.pet_hash,
    },
  };
}

export interface MascotaResumen {
  id: string;
  nombre: string;
  especie: string;
  foto_url: string | null;
  /** P19 (S59): ¿se lleva bien paseando con otros perros? null = aún
   *  sin responder — la pregunta única salta en la primera reserva. */
  paseo_social_ok: boolean | null;
  /** §3 grooming (S60): talla/pelaje del perfil — null honesto hasta
   *  declarar; la pregunta única salta al entrar al QUIÉN del grooming. */
  talla: 'S' | 'M' | 'L' | null;
  pelaje: 'normal' | 'largo' | null;
  /** S73 (letra de elegibilidad): momento vital para la frontera
   *  mascotasElegibles — memorial/perdida NO reservan (apagado
   *  estructural, jamás if de UI). null = fuera del CHECK (angostado
   *  honesto) y la elegibilidad falla cerrada. */
  estado_vida: EstadoVidaMascota | null;
}

/** Mascotas de una familia (Home del dueño). Reader: mismas claves
 *  siempre, null sin dato (L-124). RLS filtra a lo visible. */
export async function obtenerMascotasDeFamilia(
  familiaId: string,
): Promise<ResultadoWrapper<MascotaResumen[], CodigoErrorOnboarding>> {
  const { data, error } = await getClient()
    .from('mascotas')
    .select('id, nombre, especie, foto_url, paseo_social_ok, talla, pelaje, estado_vida')
    .eq('familia_id', familiaId)
    .order('fecha_alta', { ascending: true });

  if (error) return mapeoErrorAResultado(error.message);
  if (!Array.isArray(data)) return mapeoErrorAResultado('datos_inconsistentes');
  return {
    ok: true,
    data: data.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      especie: m.especie,
      foto_url: m.foto_url ?? null,
      paseo_social_ok: m.paseo_social_ok ?? null,
      // Angostado verificando (regla 34): fuera del CHECK = null honesto.
      talla: m.talla === 'S' || m.talla === 'M' || m.talla === 'L' ? m.talla : null,
      pelaje: m.pelaje === 'normal' || m.pelaje === 'largo' ? m.pelaje : null,
      estado_vida:
        m.estado_vida === 'activa' || m.estado_vida === 'perdida' || m.estado_vida === 'fallecida'
          ? m.estado_vida
          : null,
    })),
  };
}

export interface EstadoOnboardingDueno {
  tiene_familia: boolean;
  familia_id: string | null;
  mascotas_count: number;
}

// S74-A (cura D-497, medido en vivo): el estado se pedía DOS veces en el
// arranque (routing del raíz + guard del Hogar) y en cada focus del
// Hogar. Cache POR USUARIO de sesión (la sesión se lee LOCAL — cero
// request extra) con invalidación en los dos mutadores de este archivo
// que lo cambian. Cambio de usuario = cache miss por la llave.
let _cacheEstado: { userId: string; data: EstadoOnboardingDueno } | null = null;

function _invalidarEstadoOnboarding(): void {
  _cacheEstado = null;
}

/** Estado mínimo para el routing al abrir la app del dueño. */
export async function getEstadoOnboardingDueno(): Promise<
  ResultadoWrapper<EstadoOnboardingDueno, CodigoErrorOnboarding>
> {
  const sesion = await getClient().auth.getSession();
  const uid = sesion.data.session?.user.id ?? null;
  if (uid !== null && _cacheEstado !== null && _cacheEstado.userId === uid) {
    return { ok: true, data: _cacheEstado.data };
  }
  const { data, error } = await getClient().rpc('get_estado_onboarding_dueno');

  if (error) return mapeoErrorAResultado(error.message);

  const o = data as Record<string, unknown>;
  if (
    typeof o !== 'object' || o === null ||
    typeof o.tiene_familia !== 'boolean' ||
    !(o.familia_id === null || typeof o.familia_id === 'string') ||
    typeof o.mascotas_count !== 'number'
  ) {
    return mapeoErrorAResultado('datos_inconsistentes');
  }

  const estado: EstadoOnboardingDueno = {
    tiene_familia: o.tiene_familia,
    familia_id: (o.familia_id as string | null),
    mascotas_count: o.mascotas_count,
  };
  if (uid !== null) _cacheEstado = { userId: uid, data: estado };
  return { ok: true, data: estado };
}
