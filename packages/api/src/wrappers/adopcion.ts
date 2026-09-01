// El motor de adopción — S111-A. La vidriera, la publicación y el traspaso.
//
// Motor: `supabase/migrations/20260907500000_s111a_motor_adopcion.sql`.
// Letra: `docs/LETRA_ADOPCION.md` — **§0: el expediente empieza en el rescate y
// se hereda.** Eso es lo que hace que el traspaso sea un ACTO y no un UPDATE.
//
// 🔴 LO QUE ESTE ARCHIVO EXISTE PARA CURAR, medido antes de escribirlo: **cero
// funciones de adopción sobre 369 migraciones con `CREATE FUNCTION`, cero
// wrappers.** Tres bloques de tres pistas distintas estaban parados por esto —
// `Convivencia` de B y `packages/mensajeria` de D existían y **no tenían de qué
// hablar**.
//
// 🔴 Y LO QUE **NO** HACE, para que nadie lo busque acá: no reusa ninguna de las
// cinco tablas legado (`solicitudes_adopcion`, `mascotas_adopcion`,
// `adopcion_seguimiento`, `refugios`, `donaciones`). No se construye sobre ellas
// **y no se borran** (`D-991`).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  /* 🔴 Hoy hay CERO cuentas con rol `refugio`: las crea el admin. Este rebote
     es el estado normal del sistema, no una falla — y por eso habla claro. */
  no_sos_cuenta_de_refugio: 'Esta cuenta todavía no está habilitada para publicar animales en adopción.',
  mascota_no_existe:        'No encontramos esa mascota.',
  /* Una mascota sin familia no se publica: el traspaso mueve DE una familia A
     otra, y §0 dice que el refugio ES la familia hasta la entrega. */
  mascota_sin_familia:      'Ese animal todavía no tiene familia asignada en el refugio.',
  publicacion_no_existe:    'No encontramos esa publicación.',
  sin_publicacion_viva:     'Ese animal no está publicado en adopción.',
  familia_destino_no_existe:'No encontramos la familia que va a recibirlo.',
  familia_destino_igual_al_origen: 'Ese animal ya está en esa familia.',
  /* 🔴 EL FAIL-CLOSED DEL ACTA, y su voz dice de qué lado está el problema:
     no falta que la persona haga algo — falta que la casa cargue el documento.
     *Pedirle a alguien que reintente algo que no depende de él es peor que
     decirle que no.* */
  acta_no_disponible:       'Todavía no podemos completar la adopción: falta cargar el acta. Es de nuestro lado.',
  sin_acceso:               'Esta publicación no es tuya.',
  sin_sesion:               'No hay sesión activa.',
  datos_inconsistentes:     'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:        'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoErrorAdopcion = keyof typeof MENSAJES;
const CODIGOS = Object.keys(MENSAJES) as CodigoErrorAdopcion[];

function fallaCodigo<T>(c: CodigoErrorAdopcion): ResultadoWrapper<T, CodigoErrorAdopcion> {
  return { ok: false, codigo: c, mensaje: MENSAJES[c] };
}
/* Regla 35: se discrimina por PREFIJO de código, jamás por prosa. El motor manda
   `acta_no_disponible: acta_adopcion v1` y el detalle viaja detrás del código. */
function fallo<T>(raw: string): ResultadoWrapper<T, CodigoErrorAdopcion> {
  if (raw === 'auth_required') return fallaCodigo('sin_sesion');
  for (const c of CODIGOS) if (raw.startsWith(c)) return fallaCodigo(c);
  return fallaCodigo('error_desconocido');
}

/* ═══════════════════════════════════════════════════════════════════════════
   ① LA VIDRIERA
   🔴 La pantalla NO enumera estados. El motor filtra por
   `cat_estados_adopcion.visible_en_vidriera`, así que el día que nazca un sexto
   estado la vidriera no se olvida de él.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Adoptable {
  publicacionId: string;
  mascotaId: string;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo: string | null;
  /** `null` = no se sabe. **No se infiere una edad que nadie declaró.** */
  fechaNacimiento: string | null;
  fotoUrl: string | null;
  /** Quién lo publicó. El refugio es procedencia, no un adorno. */
  publicadorNombre: string | null;
  creadaEn: string;
}

export async function obtenerAdoptables(params?: {
  especie?: string;
  countryCode?: string;
  limite?: number;
}): Promise<ResultadoWrapper<Adoptable[], CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('obtener_adoptables', {
    p_especie: params?.especie ?? undefined,
    p_country_code: params?.countryCode ?? undefined,
    p_limite: params?.limite ?? undefined,
  });
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  const salida: Adoptable[] = [];
  for (const fila of data as Record<string, unknown>[]) {
    if (typeof fila.publicacion_id !== 'string' || typeof fila.mascota_id !== 'string') {
      return fallaCodigo('datos_inconsistentes');
    }
    salida.push({
      publicacionId: fila.publicacion_id,
      mascotaId: fila.mascota_id,
      nombre: typeof fila.nombre === 'string' ? fila.nombre : '',
      especie: typeof fila.especie === 'string' ? fila.especie : '',
      raza: typeof fila.raza === 'string' ? fila.raza : null,
      sexo: typeof fila.sexo === 'string' ? fila.sexo : null,
      fechaNacimiento: typeof fila.fecha_nacimiento === 'string' ? fila.fecha_nacimiento : null,
      fotoUrl: typeof fila.foto_url === 'string' ? fila.foto_url : null,
      publicadorNombre: typeof fila.publicador_nombre === 'string' ? fila.publicador_nombre : null,
      creadaEn: String(fila.creada_en),
    });
  }
  return { ok: true, data: salida };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ② PUBLICAR Y RETIRAR — del lado del refugio
   ═══════════════════════════════════════════════════════════════════════════ */

/** Publica al animal en la vidriera. **Idempotente y hablada**: si ya estaba
 *  publicado devuelve la publicación que existe, con `yaExistia: true` — *un
 *  guard que vive en un índice sólo sabe negarse* (`L-424`). */
export async function publicarAdoptable(params: {
  mascotaId: string;
  cuentaComercialId: string;
}): Promise<ResultadoWrapper<{ publicacionId: string; yaExistia: boolean }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('publicar_adoptable', {
    p_mascota_id: params.mascotaId,
    p_cuenta_comercial_id: params.cuentaComercialId,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.publicacion_id !== 'string') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { publicacionId: r.publicacion_id, yaExistia: r.ya_existia === true } };
}

/** Retira la publicación. 🔴 **Retirar NO es rechazar**: la mascota queda en
 *  `pausada`, no en `no_aplica` — *el día que el refugio la vuelva a publicar,
 *  su historia sigue.* */
export async function despublicarAdoptable(params: {
  publicacionId: string;
  motivo?: string;
}): Promise<ResultadoWrapper<{ yaEstaba: boolean }, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('despublicar_adoptable', {
    p_publicacion_id: params.publicacionId,
    p_motivo: params.motivo ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { yaEstaba: (data as Record<string, unknown>).ya_estaba === true } };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ③ EL TRASPASO — un ACTO, no un UPDATE
   🔴 En una sola transacción del motor: la mascota cambia de familia · el
   acceso viejo se CIERRA con `hasta` (no se borra: *borrarlo diría que esa
   familia nunca lo tuvo*) · nace el evento `transferencia_familia` con **el
   refugio como procedencia permanente** · la publicación se cierra.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ResultadoTraspaso {
  mascotaId: string;
  familiaOrigen: string | null;
  familiaDestino: string;
  /** El rastro. **Es lo único que justifica que esto sea una RPC y no un
   *  `UPDATE`** — sin él, el expediente diría que el animal siempre estuvo ahí. */
  eventoId: string;
  accesosCerrados: number;
  publicacionId: string;
}

/**
 * 🔴 **FAIL-CLOSED, Y HOY NO ABRE.** Exige un acta versionada cargada en
 * `adopcion_documentos`, que **nace vacía a propósito**: el texto es del paquete
 * del abogado y está estacionado. Hoy esto rebota `acta_no_disponible` siempre,
 * y **el día que la mesa cargue el texto la puerta se abre sola, sin tocar una
 * línea de código.**
 *
 * *La regla del loop al pie: sin documento cargado, la puerta no se abre.*
 */
export async function traspasarMascotaAFamilia(params: {
  mascotaId: string;
  familiaDestinoId: string;
  actaVersion: number;
  /** Por defecto `acta_adopcion`. Se expone porque el código del documento es
   *  del dominio de la mesa, no de esta capa. */
  actaCodigo?: string;
}): Promise<ResultadoWrapper<ResultadoTraspaso, CodigoErrorAdopcion>> {
  const { data, error } = await getClient().rpc('traspasar_mascota_a_familia', {
    p_mascota_id: params.mascotaId,
    p_familia_destino_id: params.familiaDestinoId,
    p_acta_version: params.actaVersion,
    p_acta_codigo: params.actaCodigo ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  if (typeof r.mascota_id !== 'string' || typeof r.evento_id !== 'string') {
    return fallaCodigo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      mascotaId: r.mascota_id,
      familiaOrigen: typeof r.familia_origen === 'string' ? r.familia_origen : null,
      familiaDestino: String(r.familia_destino),
      eventoId: r.evento_id,
      accesosCerrados: typeof r.accesos_cerrados === 'number' ? r.accesos_cerrados : 0,
      publicacionId: String(r.publicacion_id),
    },
  };
}
