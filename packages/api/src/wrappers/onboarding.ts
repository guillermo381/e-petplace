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
  // S91 · cláusula del pez (firma founder 7-ago-2026)
  'raza_no_aplica_acuario',
  'tipo_agua_invalida',
  'tipo_agua_solo_pez',
  // S91 · el origen del paso 3 del alta (🔴 medido por D)
  'origen_invalido',
  // S91 (P7): la fecha de montaje es del acuario y de nadie más.
  'fecha_montaje_solo_acuario',
] as const;

export type CodigoErrorOnboarding = (typeof CODIGOS_ERROR_ONBOARDING)[number];

const MENSAJES_ERROR_ONBOARDING: Record<
  CodigoErrorOnboarding | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  no_autenticado:              'Necesitas iniciar sesión para continuar.',
  nombre_familia_requerido:    'Cuéntanos cómo se llama tu familia.',
  nombre_mascota_requerido:    'Cuéntanos cómo se llama tu mascota.',
  familia_ya_existe:           'Ya tienes una familia creada.',
  sin_familia_activa:          'Tu familia todavía no existe — el primer paso es el onboarding.',
  especie_invalida_o_inactiva: 'Esa especie no está disponible por ahora.',
  sexo_invalido:               'El sexo elegido no es válido.',
  precision_fecha_invalida:    'La precisión de la fecha no es válida.',
  precision_sin_fecha:         'Elige una fecha para poder guardar su precisión.',
  raza_no_aplica_acuario:      'Un acuario no tiene raza — cuéntanos su tipo de agua.',
  tipo_agua_invalida:          'El tipo de agua tiene que ser dulce o marino.',
  tipo_agua_solo_pez:          'El tipo de agua es solo para acuarios.',
  origen_invalido:             'Ese origen no es válido.',
  fecha_montaje_solo_acuario:  'La fecha de montaje es solo para acuarios.',
  datos_inconsistentes:        'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:           'Ocurrió un error inesperado. Prueba de nuevo.',
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

/** S91 · cláusula del pez: el campo dos del alta de un acuario, en
 *  espejo de la raza (que un acuario no tiene). */
export type TipoAguaAcuario = 'dulce' | 'marino';

/** Espejo EXACTO del CHECK de `mascotas.origen` (9 valores, medido).
 *  El alta ofrece cinco (lámina S91): adoptado · refugio · nacido_en_casa ·
 *  encontrado · criadero. Los otros cuatro los escriben otros caminos
 *  (alta asistida del prestador, transferencia, compra) o son el default.
 *  ⚠️ `refugio` y `criadero` se guardan SIN entidad: desde S91 el CHECK de
 *  coherencia ya no exige `refugio_id`/`criadero_id` — «lo adopté de un
 *  refugio» es un hecho verdadero aunque la plataforma no tenga ese refugio
 *  registrado (hoy: 0 de cada uno). */
export type OrigenMascota =
  | 'criadero'
  | 'refugio'
  | 'adoptado'
  | 'comprado_particular'
  | 'nacido_en_casa'
  | 'encontrado'
  | 'transferido'
  | 'desconocido'
  | 'alta_asistida';

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
  /** S91 · D-379: TEXTO LIBRE. El catálogo (obtenerRazasDeEspecie)
   *  SUGIERE y el dueño CONFIRMA — «Mestizo» y «No sé» son respuesta
   *  de primera clase y por eso NO se valida contra el catálogo.
   *  Ilegal en especie 'pez' (raza_no_aplica_acuario). */
  raza?: string;
  /** S91 · solo especie 'pez'. En cualquier otra rebota
   *  (tipo_agua_solo_pez). La marca sujeto='acuario' la estampa el
   *  MOTOR: el cliente jamás la manda. */
  tipo_agua?: TipoAguaAcuario;
  /** S91 · paso 3 del alta (🔴 de D: el dato se perdía en el viaje).
   *  Ausente = 'desconocido'. */
  origen?: OrigenMascota;
  /** S91 (P7) · cuándo se MONTÓ el acuario. Solo especie 'pez' — en
   *  cualquier otra rebota `fecha_montaje_solo_acuario`. NO es la fecha de
   *  alta: registrarse en e-PetPlace y montarse son dos hechos. ISO
   *  'YYYY-MM-DD'. */
  fecha_montaje?: string;
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
    p_raza:             input.raza ?? undefined,
    p_tipo_agua:        input.tipo_agua ?? undefined,
    p_origen:           input.origen ?? undefined,
    p_fecha_montaje:    input.fecha_montaje ?? undefined,
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
  /** S91 · D-379: texto libre — el catálogo sugiere, el dueño confirma.
   *  Ilegal en 'pez' (raza_no_aplica_acuario). */
  raza?: string;
  /** S91 · solo 'pez' (tipo_agua_solo_pez en cualquier otra). */
  tipo_agua?: TipoAguaAcuario;
  /** S91 · paso 3 del alta. Sin él, el origen elegido SE PERDÍA en el viaje
   *  (la RPC lo tenía hardcodeado en 'desconocido' desde S45 — 🔴 medido por
   *  D). Ausente = 'desconocido', que es el default honesto. */
  origen?: OrigenMascota;
  /** S91 (P7) · cuándo se MONTÓ el acuario (solo 'pez'). ISO 'YYYY-MM-DD'. */
  fecha_montaje?: string;
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
    p_raza:             input.raza ?? undefined,
    p_tipo_agua:        input.tipo_agua ?? undefined,
    p_origen:           input.origen ?? undefined,
    p_fecha_montaje:    input.fecha_montaje ?? undefined,
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
  /** S91 · cláusula del pez: 'acuario' = la fila registra el SISTEMA,
   *  no un individuo. La superficie que no lo mire tratará al acuario
   *  como mascota — que es exactamente lo que la firma quiso evitar. */
  sujeto: 'individuo' | 'acuario';
  /** Solo acuarios; null en todo lo demás. */
  tipo_agua: 'dulce' | 'marino' | null;
  /** S91 (A6, pedido de D) · la raza DECLARADA, tal cual la escribió la
   *  familia. */
  raza: string | null;
  /** S91 (A6) · el path de la cara de galería, resuelto por LOOKUP contra
   *  `cat_razas` (`especie` + `nombre` exacto, que es UNIQUE) — **jamás
   *  derivado del texto tipeado**: slugificar «Pastor Alemán» a mano puede
   *  dar `pastor-aleman` (existe) o `ovejero-aleman` (no), y una URL que
   *  acierta A VECES muestra LA CARA DE OTRA RAZA — peor que ninguna.
   *  null = la raza no está en el catálogo (o no hay raza) ⇒ la superficie
   *  cae al genérico de la especie, que es la verdad disponible. */
  raza_ruta_imagen: string | null;
}

/** Mascotas de una familia (Home del dueño). Reader: mismas claves
 *  siempre, null sin dato (L-124). RLS filtra a lo visible. */
export async function obtenerMascotasDeFamilia(
  familiaId: string,
): Promise<ResultadoWrapper<MascotaResumen[], CodigoErrorOnboarding>> {
  const { data, error } = await getClient()
    .from('mascotas')
    .select(
      'id, nombre, especie, foto_url, paseo_social_ok, talla, pelaje, estado_vida, sujeto, tipo_agua, raza',
    )
    .eq('familia_id', familiaId)
    .order('fecha_alta', { ascending: true });

  if (error) return mapeoErrorAResultado(error.message);
  if (!Array.isArray(data)) return mapeoErrorAResultado('datos_inconsistentes');

  // A6 · EL LOOKUP, en UN viaje para todo el hogar (jamás uno por mascota):
  // (especie, nombre) es UNIQUE en `cat_razas`, así que el match es
  // determinista. Lo que NO coincide vuelve null y la superficie cae al
  // genérico — D lo declaró bien: media cura es inconsistencia nueva.
  const declaradas = [
    ...new Set(
      data.map((m) => m.raza).filter((r): r is string => typeof r === 'string' && r.length > 0),
    ),
  ];
  const rutaPorRaza = new Map<string, string>();
  if (declaradas.length > 0) {
    const { data: razas } = await getClient()
      .from('cat_razas')
      .select('especie, nombre, ruta_imagen')
      .in('nombre', declaradas);
    for (const r of razas ?? []) rutaPorRaza.set(`${r.especie}|${r.nombre}`, r.ruta_imagen);
  }

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
      // Angostado verificando: un sujeto desconocido cae a 'individuo'
      // — el default del schema y el caso de TODAS las filas vivas.
      sujeto: m.sujeto === 'acuario' ? 'acuario' : 'individuo',
      tipo_agua: m.tipo_agua === 'dulce' || m.tipo_agua === 'marino' ? m.tipo_agua : null,
      raza: m.raza ?? null,
      raza_ruta_imagen: rutaPorRaza.get(`${m.especie}|${m.raza ?? ''}`) ?? null,
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
