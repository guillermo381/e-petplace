// Tab Mascotas del prestador (S51-B3.3): las vidas que cuida — historial
// de mascotas ATENDIDAS (derivado de atenciones cerradas con calidad;
// relevamiento S51: cerrar la atención NO promueve la cita a
// 'completada', así que el derivador honesto es la atención) y el
// detalle icónico v1 (vista PRESTADOR del expediente — la visibilidad
// parcial la manda la RLS: mascota sí, vacunas/perfil sí vía
// user_tiene_acceso_a_mascota; familia humana NO — policies
// solo-miembro relevadas S51).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos cargar las mascotas. Prueba de nuevo.';

export interface MascotaAtendida {
  mascota_id: string;
  nombre: string;
  especie: string | null;
  foto_url: string | null;
  /** El path de la cara de SU raza (`cat_razas.ruta_imagen`), o `null`.
   *
   *  **S97-A · D-806bis — firma del founder:** *«si no tiene acceso a la foto
   *  real de la mascota, le debería traer el avatar de la raza.»*
   *
   *  🔴 **Viaja porque sin él la ley no se puede obedecer:** la pantalla del
   *  prestador pintaba la huella genérica **no por elegirlo, sino porque el
   *  dato no llegaba**. *Una ley que exige lo que el lector no entrega no es
   *  una ley: es un reproche.*
   *
   *  Se resuelve por **LOOKUP contra `cat_razas`, jamás slugificando el texto
   *  tipeado** (D-379: el catálogo SUGIERE, `mascotas.raza` es texto libre).
   *  Consúmase con `caraDeMascotaPorRuta`, que pone la escalera completa. */
  raza_ruta_imagen: string | null;
  atenciones_total: number;
  ultima_atencion: string | null;
}

/** Mascotas con al menos UNA atención cerrada con calidad de este
 *  prestador, más recientes primero. */
export async function obtenerMascotasAtendidas(
  prestadorId: string,
): Promise<ResultadoWrapper<MascotaAtendida[], 'error_mascotas'>> {
  const atenciones = await getClient()
    .from('evento_atencion')
    .select('mascota_id, cerrada_en')
    .eq('prestador_id', prestadorId)
    .eq('estado', 'cerrada_con_calidad');
  if (atenciones.error) return { ok: false, codigo: 'error_mascotas', mensaje: MENSAJE_ERROR };

  const porMascota = new Map<string, { total: number; ultima: string | null }>();
  for (const a of atenciones.data) {
    if (a.mascota_id === null) continue;
    const previo = porMascota.get(a.mascota_id) ?? { total: 0, ultima: null };
    porMascota.set(a.mascota_id, {
      total: previo.total + 1,
      ultima: a.cerrada_en !== null && (previo.ultima === null || a.cerrada_en > previo.ultima) ? a.cerrada_en : previo.ultima,
    });
  }
  const ids = [...porMascota.keys()];
  if (ids.length === 0) return { ok: true, data: [] };

  const mascotas = await getClient()
    .from('mascotas')
    .select('id, nombre, especie, foto_url, raza')
    .in('id', ids);
  if (mascotas.error) return { ok: false, codigo: 'error_mascotas', mensaje: MENSAJE_ERROR };

  /* D-806bis · la cara de la raza, por LOOKUP y POR LOTE.
     Molde exacto del lector del Hogar (`onboarding.ts`) — misma clave
     `especie|nombre`, misma consulta única. Se copia la forma a propósito:
     *dos lookups distintos del mismo dato divergen, y el día que uno se
     arregle el otro sigue mostrando la cara vieja.*
     Si el lookup falla, `raza_ruta_imagen` queda en `null` y la escalera cae
     sola al genérico — **el fallo NO degrada la lista**, que es lo que la
     pantalla vino a buscar. */
  const declaradas = [...new Set(mascotas.data.map((m) => m.raza).filter((r): r is string => !!r))];
  const rutaPorRaza = new Map<string, string>();
  if (declaradas.length > 0) {
    const { data: razas } = await getClient()
      .from('cat_razas')
      .select('especie, nombre, ruta_imagen')
      .in('nombre', declaradas);
    for (const r of razas ?? []) rutaPorRaza.set(`${r.especie}|${r.nombre}`, r.ruta_imagen);
  }

  const lista: MascotaAtendida[] = mascotas.data.map((m) => {
    const agg = porMascota.get(m.id);
    return {
      mascota_id: m.id,
      nombre: m.nombre,
      especie: m.especie,
      foto_url: m.foto_url,
      raza_ruta_imagen: rutaPorRaza.get(`${m.especie}|${m.raza ?? ''}`) ?? null,
      atenciones_total: agg?.total ?? 0,
      ultima_atencion: agg?.ultima ?? null,
    };
  });
  lista.sort((a, b) => ((b.ultima_atencion ?? '') < (a.ultima_atencion ?? '') ? -1 : 1));
  return { ok: true, data: lista };
}

export interface DetalleMascotaPrestador {
  mascota: {
    id: string;
    nombre: string;
    especie: string | null;
    raza: string | null;
    sexo: string | null;
    fecha_nacimiento: string | null;
    microchip: string | null;
    foto_url: string | null;
    /** D-806bis · el path de la cara de SU raza, o `null`.
     *  Sin foto real, esto es lo que la pantalla tiene que pintar antes de
     *  caer a la huella. Se resuelve por LOOKUP contra `cat_razas`. */
    raza_ruta_imagen: string | null;
  };
  /** Señales de cuidado REALES del expediente (perfil vigente). */
  tiene_condicion_cronica: boolean;
  tiene_alergias: boolean;
  tiene_emergencia_activa: boolean;
  peso_clinico_kg: number | null;
  vacunas_total: number;
  /** Atenciones de ESTE prestador con esta mascota (visibilidad parcial). */
  atenciones: Array<{
    atencion_id: string;
    estado: string;
    iniciada_en: string | null;
    cerrada_en: string | null;
  }>;
}

export async function obtenerDetalleMascotaPrestador(
  mascotaId: string,
  prestadorId: string,
): Promise<ResultadoWrapper<DetalleMascotaPrestador, 'error_detalle' | 'sin_acceso'>> {
  const cliente = getClient();

  const mascota = await cliente
    .from('mascotas')
    .select('id, nombre, especie, raza, sexo, fecha_nacimiento, microchip, foto_url')
    .eq('id', mascotaId)
    .maybeSingle();
  if (mascota.error) return { ok: false, codigo: 'error_detalle', mensaje: MENSAJE_ERROR };
  // RLS: sin acceso vigente la fila no existe para este user.
  if (mascota.data === null) return { ok: false, codigo: 'sin_acceso', mensaje: MENSAJE_ERROR };

  /* D-806bis · la cara de la raza. UNA consulta, y solo si hay raza declarada.
     Va DESPUÉS del guard de acceso a propósito: **no se consulta el catálogo
     por una mascota que este prestador no puede ver.** */
  let rutaRaza: string | null = null;
  if (mascota.data.raza) {
    const { data: r } = await cliente
      .from('cat_razas')
      .select('ruta_imagen')
      .eq('especie', mascota.data.especie ?? '')
      .eq('nombre', mascota.data.raza)
      .maybeSingle();
    rutaRaza = r?.ruta_imagen ?? null;
  }

  const [perfil, vacunas, atenciones] = await Promise.all([
    cliente
      .from('mascota_perfil_vigente')
      .select('peso_clinico_kg, condiciones_cronicas, alergias, tiene_emergencia_activa')
      .eq('mascota_id', mascotaId)
      .maybeSingle(),
    cliente
      .from('evento_vacuna_aplicada')
      .select('id', { count: 'exact', head: true })
      .eq('mascota_id', mascotaId),
    cliente
      .from('evento_atencion')
      .select('id, estado, iniciada_en, cerrada_en')
      .eq('mascota_id', mascotaId)
      .eq('prestador_id', prestadorId)
      .order('iniciada_en', { ascending: false }),
  ]);
  if (perfil.error || vacunas.error || atenciones.error) {
    return { ok: false, codigo: 'error_detalle', mensaje: MENSAJE_ERROR };
  }

  const condiciones = perfil.data?.condiciones_cronicas;
  const alergias = perfil.data?.alergias;
  return {
    ok: true,
    data: {
      mascota: { ...mascota.data, raza_ruta_imagen: rutaRaza },
      tiene_condicion_cronica: Array.isArray(condiciones) && condiciones.length > 0,
      tiene_alergias: Array.isArray(alergias) && alergias.length > 0,
      tiene_emergencia_activa: perfil.data?.tiene_emergencia_activa ?? false,
      peso_clinico_kg: perfil.data?.peso_clinico_kg ?? null,
      vacunas_total: vacunas.count ?? 0,
      atenciones: atenciones.data.map((a) => ({
        atencion_id: a.id,
        estado: a.estado ?? '',
        iniciada_en: a.iniciada_en,
        cerrada_en: a.cerrada_en,
      })),
    },
  };
}
