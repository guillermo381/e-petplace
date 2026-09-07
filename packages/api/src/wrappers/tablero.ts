/**
 * EL TABLERO DEL PERFIL (S113-A · 2.2) — la puerta de las tres RPC del 2.2.
 *
 * 🔴 **ENTREGADA ≠ MONTADA, del lado del motor.** Tres veces seguidas en esta
 * sesión entregué una RPC sin su wrapper y otra pista tuvo que abrirla —
 * pasaporte, Nexo, y este tablero. *Una función que la puerta única no exporta
 * no existe para las apps: es un motor sin puerta (`L-318`), y el que la
 * necesita termina escribiéndola en territorio ajeno o llamando a `rpc()`
 * directo, que es justo lo que la puerta única existe para impedir.*
 */
import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos cargar la información. Prueba de nuevo.';

export type CodigoErrorTablero =
  | 'auth_required' | 'sin_acceso' | 'mascota_no_existe' | 'desconocido';

function codigo(msg: string): CodigoErrorTablero {
  if (msg.includes('auth_required')) return 'auth_required';
  if (msg.includes('sin_acceso')) return 'sin_acceso';
  if (msg.includes('mascota_no_existe')) return 'mascota_no_existe';
  return 'desconocido';
}

/** Un punto de la serie de peso. `fuente` decide cómo se dibuja. */
export type PuntoPeso = {
  fecha: string;
  kg: number;
  /** 'prestador' = lo pesó una clínica · 'familia' = lo pesaron en casa. */
  fuente: 'prestador' | 'familia';
};

export type BloquePeso = {
  actual: number; fecha: string;
  fuente: 'prestador' | 'familia';
  /** Los 12 últimos, cronológicos. `[]` nunca: sin peso el bloque es `null`. */
  serie: PuntoPeso[];
  /** 🔴 `false` con UN solo punto: **no hay línea que dibujar**. La decisión no
   *  vive en la pantalla — *si cada superficie decide cuántos puntos alcanzan,
   *  alcanza una que decida distinto para que el mismo animal se vea de dos
   *  formas.* Medido con Lolo, que tiene exactamente una medición. */
  serie_dibujable: boolean;
  /** `null` con menos de dos puntos, y eso NO es 'igual': es que no se sabe. */
  tendencia: 'sube' | 'baja' | 'igual' | null;
};

export type BloqueVacunas = {
  aplicadas_del_plan: number; total_plan: number;
  vencidas: number; nunca_aplicada: number;
  proxima: {
    nombre: string; fecha: string; estado: string;
    /** 🔴 `true` = la calculamos nosotros. La superficie tiene que poder decir
     *  «estimada»: una fecha derivada no es una que alguien escribió. */
    derivada: boolean;
  } | null;
};

export type EstadoPlaga = 'al_dia' | 'vencida' | 'sin_registro';
export type BloqueAntiparasitario = {
  /** Por TIPO (interna/externa), que es el conjunto que la base tiene con
   *  CHECK. No hay catálogo de plagas: medido, cero tablas. */
  plagas: { plaga: string; estado: EstadoPlaga; ultima: string | null }[];
  /** Las plagas concretas que alguien escribió: texto libre, viajan tal cual. */
  registradas: string[];
  proxima: string | null;
};

export type BloqueMedicacion = {
  activas: number;
  /** Prescripciones sin `duracion_dias`: no se asume que siguen, SE DICEN. */
  sin_duracion: number;
  ultima_administrada: string | null;
};

export type BloqueCitas = {
  pasadas: number; futuras: number;
  proxima: { fecha: string; hora: string; servicio: string;
             prestador: string | null; id: string } | null;
};

export type BloqueActividad = {
  /** Siete números, uno por día, del más viejo al de hoy. */
  paseos_semana: number[];
  /** Medidos de `iniciada_en`→`cerrada_en`, jamás de la duración contratada:
   *  *lo contratado es una promesa; lo caminado es un hecho.* */
  minutos: number;
  total_historico: number;
};

/** 🔴 Todo bloque puede ser `null`, y eso NO es un cero: es «no hay dato». La
 *  superficie no dibuja gráfico sin dato. */
export type TableroMascota = {
  memorial: false;
  especie: string;
  peso: BloquePeso | null;
  vacunas: BloqueVacunas | null;
  antiparasitario: BloqueAntiparasitario | null;
  medicacion: BloqueMedicacion | null;
  citas: BloqueCitas;
  actividad: BloqueActividad | null;
};

/** Memorial NO tiene tablero: se lee la historia (LOYALTY §8). Viaja el estado
 *  REAL y no un booleano — se le habla distinto a quien perdió a su animal que
 *  a quien lo está buscando. */
export type TableroMemorial = {
  memorial: true;
  estado_vida: 'perdida' | 'fallecida';
  tablero: null;
};

export async function obtenerTableroMascota(
  mascotaId: string,
): Promise<ResultadoWrapper<TableroMascota | TableroMemorial, CodigoErrorTablero>> {
  const { data, error } = await getClient()
    .rpc('obtener_tablero_mascota', { p_mascota_id: mascotaId });
  if (error) return { ok: false, codigo: codigo(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true) {
    return { ok: false, codigo: codigo(String(o?.codigo ?? '')), mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: o as unknown as TableroMascota | TableroMemorial };
}

// ── A2 · LAS CITAS DE UNA MASCOTA ──────────────────────────────────────────
export type CitaDeMascota = {
  id: string; fecha: string; hora: string;
  servicio: string; estado: string; prestador: string | null;
};

export type CitasDeMascota = {
  futuras: CitaDeMascota[];
  /** Las 50 últimas. `pasadas_total` dice cuántas hay de verdad — *una lista
   *  truncada que no declara su techo se lee como el total.* */
  pasadas: CitaDeMascota[];
  pasadas_total: number;
};

export async function obtenerCitasDeMascota(
  mascotaId: string,
): Promise<ResultadoWrapper<CitasDeMascota, CodigoErrorTablero>> {
  const { data, error } = await getClient()
    .rpc('obtener_citas_de_mascota', { p_mascota_id: mascotaId });
  if (error) return { ok: false, codigo: codigo(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true) {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: o as unknown as CitasDeMascota };
}

// ── A3 · EL «HOY» ──────────────────────────────────────────────────────────
/** UNA cosa, nunca dos. La prioridad la fija el SERVIDOR: aviso > cita 48h >
 *  vacuna 7d > antiparasitario vencido > tip. *Si la superficie recibiera las
 *  cinco y eligiera, cada superficie elegiría distinto.* */
export type HoyDeMascota =
  | { tipo: 'aviso'; aviso_id: string; aviso_tipo: string;
      detalle: Record<string, unknown>; fecha: string;
      /** 🔴 **EL TEMA, para que el título diga QUÉ es** (firma founder, 6-sep).
       *  «Cadera», «Ojos», «Corazón». Con una key fija por tipo la pantalla no
       *  podría decirlo: no sabe el tema. Se llama `tema` y no `nombre` porque
       *  dentro de `detalle` hay un `nombre` que es el de la PREDISPOSICIÓN, a
       *  un campo del nombre de la mascota. */
      tema: string | null }
  | { tipo: 'cita'; cita_id: string; fecha: string; hora: string;
      servicio: string; prestador: string | null; faltan_dias: number }
  | { tipo: 'vacuna'; vacuna: string; fecha: string; estado: string;
      derivada: boolean; dias: number }
  | { tipo: 'antiparasitario'; fecha: string; dias: number;
      /** 'interna' | 'externa': dos actos distintos con productos distintos.
       *  *Un título que sirve para los dos no le dice a la familia qué comprar.* */
      tema: string | null }
  | { tipo: 'tip'; codigo: string; nombre: string; descripcion: string;
      chequeo: string | null; oficio: string | null; fuente: 'raza';
      /** Mismo nombre que en los otros brazos: la pantalla compone igual. */
      tema: string | null };

/** `hoy: null` con su razón. `no_activa` = memorial o perdida: nunca se le
 *  muestra nada que mire hacia adelante. `sin_novedades` = hoy no hay nada, y
 *  eso NO es un error. */
export type RespuestaHoy =
  | { hoy: HoyDeMascota }
  | { hoy: null; razon: 'no_activa' | 'sin_novedades' };

export async function obtenerHoyMascota(
  mascotaId: string,
): Promise<ResultadoWrapper<RespuestaHoy, CodigoErrorTablero>> {
  const { data, error } = await getClient()
    .rpc('obtener_hoy_mascota', { p_mascota_id: mascotaId });
  if (error) return { ok: false, codigo: codigo(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true) {
    return { ok: false, codigo: codigo(String(o?.codigo ?? '')), mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: o as unknown as RespuestaHoy };
}

// ── EL «CONTANOS» · catálogo de rasgos y su puerta ─────────────────────────
export type FamiliaRasgo = 'miedos' | 'manias' | 'con_animales' | 'con_ninos';
export type Rasgo = {
  codigo: string; familia: FamiliaRasgo;
  /** En TUTEO, ya redactada: la pantalla la pinta tal cual. */
  etiqueta: string;
  /** `null` = todas las especies. */
  especies: string[] | null;
};

export async function obtenerCatalogoRasgos(
  especie?: string,
): Promise<ResultadoWrapper<Rasgo[], CodigoErrorTablero>> {
  const { data, error } = await getClient()
    .from('cat_rasgos').select('codigo, familia, etiqueta, especies, orden')
    .eq('activo', true).order('familia').order('orden');
  if (error) return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  const filas = (data ?? []) as Rasgo[];
  /* El filtro por especie vive acá y no en la consulta: `especies` es `null`
     para «todas», y un `.contains()` sobre null los descartaría. */
  return { ok: true, data: especie
    ? filas.filter((r) => r.especies === null || r.especies.includes(especie))
    : filas };
}

export type CodigoErrorRasgos =
  | CodigoErrorTablero | 'rasgo_desconocido' | 'sin_contenido';

export async function registrarRasgos(input: {
  mascotaId: string;
  /** Códigos del catálogo. La puerta rebota los que no existen NOMBRÁNDOLOS. */
  codigos?: string[];
  /** Lo que la familia escribió libre. Puede ir sola, sin códigos. */
  texto?: string;
}): Promise<ResultadoWrapper<{ id: string; rasgos: number }, CodigoErrorRasgos>> {
  const { data, error } = await getClient()
    .rpc('registrar_observacion_comportamiento', {
      p_mascota_id: input.mascotaId,
      /* `?? undefined` y no `?? null`: los tipos generados declaran estos
         parámetros como opcionales, y mandar `null` explícito no es lo mismo
         que omitirlos — PostgREST toma el DEFAULT sólo si el argumento no
         viaja. *La distinción no es cosmética: con `null` el default de la
         función no se aplica.* */
      p_texto: input.texto ?? undefined,
      p_codigos: input.codigos ?? undefined,
    });
  if (error) {
    const m = error.message;
    if (m.includes('rasgo_desconocido')) {
      return { ok: false, codigo: 'rasgo_desconocido', mensaje: MENSAJE_ERROR };
    }
    if (m.includes('sin_contenido')) {
      return { ok: false, codigo: 'sin_contenido', mensaje: MENSAJE_ERROR };
    }
    return { ok: false, codigo: codigo(m), mensaje: MENSAJE_ERROR };
  }
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true) {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: { id: String(o.id), rasgos: Number(o.rasgos) } };
}
