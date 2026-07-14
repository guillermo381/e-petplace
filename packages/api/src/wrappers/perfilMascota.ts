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
  /** P19 (S59): socialización del paseo grupal — null = sin responder. */
  paseo_social_ok: boolean | null;
  /** §3 grooming (S60): talla del perfil — null honesto hasta declarar.
   *  Se declara/edita SIEMPRE por declararTallaPelaje (molde P19). */
  talla: 'S' | 'M' | 'L' | null;
  /** §3 grooming (S60): pelaje — null honesto hasta declarar. */
  pelaje: 'normal' | 'largo' | null;
}

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
    .select('id, nombre, especie, raza, sexo, fecha_nacimiento, fecha_nacimiento_precision, microchip, foto_url, estado_vida, paseo_social_ok, talla, pelaje')
    .eq('id', mascotaId)
    .maybeSingle();
  if (mascota.error) return { ok: false, codigo: 'error_perfil', mensaje: MENSAJE_ERROR };
  if (mascota.data === null) {
    return { ok: false, codigo: 'sin_acceso', mensaje: MENSAJE_ERROR };
  }
  const especie = mascota.data.especie;

  const [vacunas, perfil, paseos, catalogo] = await Promise.all([
    cliente
      .from('evento_vacuna_aplicada')
      .select('evento_id, nombre_vacuna, tipo_vacuna, fecha_aplicada, fecha_proxima')
      .eq('mascota_id', mascotaId)
      .order('fecha_aplicada', { ascending: false, nullsFirst: false }),
    cliente
      .from('mascota_perfil_vigente')
      .select('peso_clinico_kg, condiciones_cronicas, tiene_emergencia_activa')
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
  ]);

  if (vacunas.error || perfil.error || paseos.error || catalogo.error) {
    return { ok: false, codigo: 'error_perfil', mensaje: MENSAJE_ERROR };
  }

  const condiciones = perfil.data?.condiciones_cronicas;
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
    },
  };
}
