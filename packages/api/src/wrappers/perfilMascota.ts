// Perfil de mascota (S51-B2.3): lo que la pila de módulos necesita en
// una pasada — vacunas (Salud), actividad de paseos (Bienestar),
// perfil vigente (Identidad progresiva) y los umbrales de momento
// vital de la especie (cat_especies_perfil, regla 21: catálogo manda).
// Solo lecturas; la RLS es la puerta.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos cargar el perfil. Probá de nuevo.';

export interface VacunaDeMascota {
  evento_id: string | null;
  nombre_vacuna: string;
  tipo_vacuna: string | null;
  fecha_aplicada: string | null;
  fecha_proxima: string | null;
}

/** Espejo estructural de UmbralesMomentoVital de @epetplace/domain
 *  (paquetes independientes: el tipo viaja por shape, no por import). */
export interface UmbralesEspecie {
  m2InicioMeses: number;
  m3InicioMeses: number;
  m5InicioMeses: number;
}

export interface IdentidadMascota {
  id: string;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo: string | null;
  fecha_nacimiento: string | null;
  fecha_nacimiento_precision: string | null;
  microchip: string | null;
  foto_url: string | null;
  estado_vida: string | null;
  /** S91 · el ORIGEN declarado en el alta (paso 3). Espejo del CHECK de
   *  `mascotas.origen`; 'desconocido' es el default HONESTO y no una
   *  ausencia: quiere decir que nadie lo declaró todavía. */
  origen: string | null;
  /** S91 · cláusula del pez: 'acuario' = la fila registra el SISTEMA. Una
   *  pantalla que no lo mire va a tratar a un acuario como mascota. */
  sujeto: 'individuo' | 'acuario';
  /** S91 · solo acuarios: 'dulce' | 'marino'. Es el campo dos del alta de
   *  pez, en espejo de la raza (que un acuario no tiene). */
  tipo_agua: 'dulce' | 'marino' | null;
  /** P19 (S59): socialización del paseo grupal — null = sin responder. */
  paseo_social_ok: boolean | null;
  /** §3 grooming (S60): talla del perfil — null honesto hasta declarar.
   *  Se declara/edita SIEMPRE por declararTallaPelaje (molde P19). */
  talla: 'S' | 'M' | 'L' | null;
  /** §3 grooming (S60): pelaje — null honesto hasta declarar. */
  pelaje: 'normal' | 'largo' | null;
  /** S82: el ENCUADRE de la foto (lámina 2026-07-29). cx/cy ∈ [0,1]
   *  centro del recorte · z ∈ [1,3] zoom sobre min(iw,ih). Los DEFAULT
   *  de DB (.5/.42/1.3) son el encuadre canónico — nunca null. Se
   *  declara/edita SIEMPRE por declararFotoMascota (molde P19). */
  foto_cx: number;
  foto_cy: number;
  foto_z: number;
}

/** S82 r4: la desparasitación del expediente (molde vacunas — el 2º tipo
 *  fecha-sola, D-312). */
export interface DesparasitacionDeMascota {
  producto: string;
  tipo: 'interna' | 'externa' | 'mixta' | null;
  fecha_aplicada: string | null;
  fecha_proxima: string | null;
}

/** S82 r4 — LA DISTINCIÓN del mandato: "sin registro" y "ninguna
 *  conocida" son dos hechos clínicos DISTINTOS. Precedencia (declarada
 *  en la migración 20260730011000): lista NO vacía GANA a la
 *  declaración; la declaración GANA al silencio. */
export type AlergiasEstado = 'sin_registro' | 'ninguna_conocida' | 'con_alergias';

export interface PerfilMascota {
  mascota: IdentidadMascota;
  vacunas: VacunaDeMascota[];
  paseos_total: number;
  ultimo_paseo_fecha: string | null;
  peso_clinico_kg: number | null;
  tiene_condicion_cronica: boolean;
  tiene_emergencia_activa: boolean;
  /** null honesto si el catálogo no trae umbrales parseables. */
  umbrales: UmbralesEspecie | null;
  /** S82 r4 — los motores que el gate descubrió por ausencia: */
  alergias_estado: AlergiasEstado;
  /** el jsonb del snapshot tal cual (shape del sedimento clínico) —
   *  solo cuando estado = con_alergias; [] en los otros dos. */
  alergias_detalle: unknown[];
  alergias_ninguna_declarada_en: string | null;
  desparasitaciones: DesparasitacionDeMascota[];
  /** Conteo VERDADERO server-side (count exact de
   *  historia_clinica_registrada) — jamás desde páginas del timeline,
   *  que subcuenta (hallazgo de C, S82). */
  consultas_total: number;
}

// Guard de shape del jsonb del catálogo (L-124: contra el dato real,
// jamás cast): si falta un umbral numérico, null honesto.
function parsearUmbrales(jsonb: unknown): UmbralesEspecie | null {
  if (typeof jsonb !== 'object' || jsonb === null) return null;
  const o = jsonb as Record<string, unknown>;
  const m2 = o['M2_inicio_meses'];
  const m3 = o['M3_inicio_meses'];
  const m5 = o['M5_inicio_meses'];
  if (typeof m2 !== 'number' || typeof m3 !== 'number' || typeof m5 !== 'number') return null;
  return { m2InicioMeses: m2, m3InicioMeses: m3, m5InicioMeses: m5 };
}

export async function obtenerPerfilMascota(
  mascotaId: string,
): Promise<ResultadoWrapper<PerfilMascota, 'error_perfil' | 'sin_acceso'>> {
  const cliente = getClient();

  // Primero la mascota (identidad + especie para el catálogo). RLS:
  // sin acceso la fila no existe para este user — error honesto.
  const mascota = await cliente
    .from('mascotas')
    .select(
      // S91 (pedido de D para la lámina del perfil): `origen` · `sujeto` ·
      // `tipo_agua`. Los tres YA existían en la fila y el perfil no los
      // traía — el dato estaba y la pantalla no podía verlo.
      'id, nombre, especie, raza, sexo, fecha_nacimiento, fecha_nacimiento_precision, microchip, foto_url, estado_vida, paseo_social_ok, talla, pelaje, foto_cx, foto_cy, foto_z, origen, sujeto, tipo_agua',
    )
    .eq('id', mascotaId)
    .maybeSingle();
  if (mascota.error) return { ok: false, codigo: 'error_perfil', mensaje: MENSAJE_ERROR };
  if (mascota.data === null) {
    return { ok: false, codigo: 'sin_acceso', mensaje: MENSAJE_ERROR };
  }
  const especie = mascota.data.especie;

  const [vacunas, perfil, paseos, catalogo, desparasitaciones, consultas] = await Promise.all([
    cliente
      .from('evento_vacuna_aplicada')
      .select('evento_id, nombre_vacuna, tipo_vacuna, fecha_aplicada, fecha_proxima')
      .eq('mascota_id', mascotaId)
      .order('fecha_aplicada', { ascending: false, nullsFirst: false }),
    cliente
      .from('mascota_perfil_vigente')
      .select('peso_clinico_kg, condiciones_cronicas, tiene_emergencia_activa, alergias, alergias_ninguna_declarada_en')
      .eq('mascota_id', mascotaId)
      .maybeSingle(),
    cliente
      .from('eventos_mascota')
      .select('fecha_evento', { count: 'exact' })
      .eq('mascota_id', mascotaId)
      .eq('tipo', 'atencion_paseo_registrada')
      .eq('soft_delete', false)
      .order('fecha_evento', { ascending: false })
      .limit(1),
    cliente
      .from('cat_especies_perfil')
      .select('momentos_vitales_jsonb')
      .eq('especie_codigo', especie)
      .maybeSingle(),
    cliente
      .from('evento_desparasitacion_aplicada')
      .select('producto, tipo_desparasitacion, fecha_aplicada, fecha_proxima')
      .eq('mascota_id', mascotaId)
      .order('fecha_aplicada', { ascending: false, nullsFirst: false }),
    // el conteo VERDADERO (hallazgo de C: contar páginas del timeline subcuenta)
    cliente
      .from('eventos_mascota')
      .select('id', { count: 'exact', head: true })
      .eq('mascota_id', mascotaId)
      .eq('tipo', 'historia_clinica_registrada')
      .eq('soft_delete', false),
  ]);

  if (vacunas.error || perfil.error || paseos.error || catalogo.error || desparasitaciones.error || consultas.error) {
    return { ok: false, codigo: 'error_perfil', mensaje: MENSAJE_ERROR };
  }

  const condiciones = perfil.data?.condiciones_cronicas;

  // S82 r4 — la PRECEDENCIA de alergias (declarada en la migración):
  // lista no vacía GANA a la declaración; la declaración GANA al silencio.
  const alergiasJson = perfil.data?.alergias;
  const alergiasLista = Array.isArray(alergiasJson) ? alergiasJson : [];
  const ningunaDeclaradaEn = perfil.data?.alergias_ninguna_declarada_en ?? null;
  const alergiasEstado: AlergiasEstado =
    alergiasLista.length > 0 ? 'con_alergias' : ningunaDeclaradaEn !== null ? 'ninguna_conocida' : 'sin_registro';

  return {
    ok: true,
    data: {
      mascota: {
        id: mascota.data.id,
        nombre: mascota.data.nombre,
        especie: mascota.data.especie,
        raza: mascota.data.raza,
        sexo: mascota.data.sexo,
        fecha_nacimiento: mascota.data.fecha_nacimiento,
        fecha_nacimiento_precision: mascota.data.fecha_nacimiento_precision,
        microchip: mascota.data.microchip,
        foto_url: mascota.data.foto_url,
        estado_vida: mascota.data.estado_vida,
        origen: mascota.data.origen ?? null,
        // Angostado verificando (regla 34): un sujeto desconocido cae a
        // 'individuo', que es el default del schema y el caso de todas las
        // filas vivas menos los acuarios.
        sujeto: mascota.data.sujeto === 'acuario' ? 'acuario' : 'individuo',
        tipo_agua:
          mascota.data.tipo_agua === 'dulce' || mascota.data.tipo_agua === 'marino'
            ? mascota.data.tipo_agua
            : null,
        paseo_social_ok: mascota.data.paseo_social_ok ?? null,
        // Angostado verificando, jamás cast (regla 34): el CHECK de DB ya
        // garantiza estos valores; un dato fuera del CHECK se trata como
        // null honesto.
        talla:
          mascota.data.talla === 'S' || mascota.data.talla === 'M' || mascota.data.talla === 'L'
            ? mascota.data.talla
            : null,
        pelaje:
          mascota.data.pelaje === 'normal' || mascota.data.pelaje === 'largo'
            ? mascota.data.pelaje
            : null,
        foto_cx: mascota.data.foto_cx,
        foto_cy: mascota.data.foto_cy,
        foto_z: mascota.data.foto_z,
      },
      vacunas: vacunas.data.map((v) => ({
        evento_id: v.evento_id,
        nombre_vacuna: v.nombre_vacuna,
        tipo_vacuna: v.tipo_vacuna,
        fecha_aplicada: v.fecha_aplicada,
        fecha_proxima: v.fecha_proxima,
      })),
      paseos_total: paseos.count ?? 0,
      ultimo_paseo_fecha: paseos.data[0]?.fecha_evento ?? null,
      peso_clinico_kg: perfil.data?.peso_clinico_kg ?? null,
      tiene_condicion_cronica: Array.isArray(condiciones) && condiciones.length > 0,
      tiene_emergencia_activa: perfil.data?.tiene_emergencia_activa ?? false,
      umbrales: parsearUmbrales(catalogo.data?.momentos_vitales_jsonb ?? null),
      alergias_estado: alergiasEstado,
      alergias_detalle: alergiasEstado === 'con_alergias' ? alergiasLista : [],
      alergias_ninguna_declarada_en: ningunaDeclaradaEn,
      desparasitaciones: desparasitaciones.data.map((d) => ({
        producto: d.producto,
        tipo:
          d.tipo_desparasitacion === 'interna' || d.tipo_desparasitacion === 'externa' || d.tipo_desparasitacion === 'mixta'
            ? d.tipo_desparasitacion
            : null,
        fecha_aplicada: d.fecha_aplicada,
        fecha_proxima: d.fecha_proxima,
      })),
      consultas_total: consultas.count ?? 0,
    },
  };
}

// ── S82: declarar (o editar) el encuadre de la foto — molde P19 ────────────

export type CodigoErrorFotoMascota =
  | 'sin_sesion'
  | 'sin_acceso'
  | 'encuadre_invalido'
  | 'foto_url_no_es_path'
  | 'desconocido';

export interface EncuadreFotoDeclarado {
  mascota_id: string;
  cx: number;
  cy: number;
  z: number;
}

const MENSAJE_ERROR_FOTO = 'No pudimos guardar la foto. Revisa tu conexión y prueba de nuevo.';

// L-115: la RPC levanta 'codigo: detalle' — se normaliza por startsWith.
function codigoFoto(mensaje: string): CodigoErrorFotoMascota {
  if (mensaje.startsWith('auth_required')) return 'sin_sesion';
  if (mensaje.startsWith('no_access_to_mascota')) return 'sin_acceso';
  if (mensaje.startsWith('encuadre_invalido')) return 'encuadre_invalido';
  if (mensaje.startsWith('foto_url_no_es_path')) return 'foto_url_no_es_path';
  return 'desconocido';
}

/** Declara (o EDITA) el encuadre de la foto de la mascota — y
 *  opcionalmente la foto misma (PATH del bucket, jamás URL). Sirve las
 *  dos superficies del mandato S82: el cierre del alta (encuadre de la
 *  foto que la RPC de alta ya llevó) y EDITAR desde el perfil (foto
 *  nueva + encuadre en el mismo acto). */
export async function declararFotoMascota(
  mascotaId: string,
  encuadre: { cx: number; cy: number; z: number },
  fotoPath?: string,
): Promise<ResultadoWrapper<EncuadreFotoDeclarado, CodigoErrorFotoMascota>> {
  const { data, error } = await getClient().rpc('declarar_foto_mascota', {
    p_mascota_id: mascotaId,
    p_cx: encuadre.cx,
    p_cy: encuadre.cy,
    p_z: encuadre.z,
    ...(fotoPath !== undefined ? { p_foto_url: fotoPath } : null),
  });

  if (error) {
    return { ok: false, codigo: codigoFoto(error.message), mensaje: MENSAJE_ERROR_FOTO };
  }
  const o = data as Record<string, unknown> | null;
  if (
    o === null ||
    typeof o !== 'object' ||
    o.ok !== true ||
    typeof o.mascota_id !== 'string' ||
    typeof o.cx !== 'number' ||
    typeof o.cy !== 'number' ||
    typeof o.z !== 'number'
  ) {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR_FOTO };
  }
  return { ok: true, data: { mascota_id: o.mascota_id, cx: o.cx, cy: o.cy, z: o.z } };
}

// ── S91 (P3 de la lámina del perfil) · LA PUERTA DE EDICIÓN DE RAZA ────
// El alta la escribe; el perfil necesitaba SU puerta. Angosta: un campo.
//
// TEXTO LIBRE Y SIN VALIDAR CONTRA EL CATÁLOGO, y eso es la LETRA (S59), no
// una omisión: validarlo mataría «Mestizo», «No sé» y la raza que el
// catálogo no tiene. El catálogo SUGIERE (`obtenerRazasDeEspecie`), el dueño
// CONFIRMA. Hay un cinturón en la migración que rebota si alguien
// «mejorara» la RPC agregándole el chequeo.

export type CodigoRazaMascota =
  | 'no_autenticado'
  | 'sin_acceso'
  | 'raza_no_aplica_acuario'
  | 'error';

/** Vacío o solo espacios = borrar la raza, y es legítimo: «no sé» después
 *  de haber dicho algo es una respuesta, no un error. */
export async function actualizarRazaMascota(
  mascotaId: string,
  raza: string | null,
): Promise<ResultadoWrapper<{ raza: string | null }, CodigoRazaMascota>> {
  const { data, error } = await getClient().rpc('actualizar_raza_mascota', {
    p_mascota_id: mascotaId,
    // La RPC no le da DEFAULT a `p_raza` (es requerido), así que «borrar»
    // viaja como cadena VACÍA — y el motor la normaliza con
    // `nullif(btrim(...))`. No es un atajo: es el mismo camino que el
    // fixture probó con '   '.
    p_raza: raza ?? '',
  });
  if (error) {
    const m = error.message;
    const codigo: CodigoRazaMascota = m.startsWith('no_autenticado')
      ? 'no_autenticado'
      : m.startsWith('raza_no_aplica_acuario')
        ? 'raza_no_aplica_acuario'
        : m.startsWith('sin_acceso')
          ? 'sin_acceso'
          : 'error';
    return {
      ok: false,
      codigo,
      mensaje:
        codigo === 'raza_no_aplica_acuario'
          ? 'Un acuario no tiene raza.'
          : 'No pudimos guardar la raza. Probá de nuevo.',
    };
  }
  const o = data as Record<string, unknown> | null;
  const r = o !== null && typeof o.raza === 'string' && o.raza.length > 0 ? o.raza : null;
  return { ok: true, data: { raza: r } };
}
