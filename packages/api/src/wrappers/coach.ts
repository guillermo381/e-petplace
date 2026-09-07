/**
 * NEXO — el contexto, la memoria, el hilo y la búsqueda (S113-A · lote 2.0).
 *
 * Cuatro puertas para que Nexo pueda hablar de UNA mascota con lo que la casa
 * ya sabe, y para que la misma caja de texto encuentre cualquier cosa de la
 * familia.
 *
 * ⚠️ **Nada de esto existe en memorial.** No es una regla de pantalla: las
 * cuatro puertas del motor lo rebotan (`mascota_en_memorial`). *Un apagado que
 * vive sólo en la UI se enciende solo el día que alguien agrega una ruta.*
 */
import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos cargar esto. Revisa tu conexión y prueba de nuevo.';

export type CodigoErrorCoach =
  | 'sin_sesion'
  | 'sin_acceso'
  | 'en_memorial'
  | 'hecho_requerido'
  | 'hecho_muy_largo'
  | 'memoria_llena'
  | 'memoria_no_encontrada'
  | 'fuente_invalida'
  | 'rol_invalido'
  | 'texto_requerido'
  | 'desconocido';

// L-115: la RPC levanta 'codigo: detalle' — se normaliza por startsWith.
function codigoCoach(mensaje: string): CodigoErrorCoach {
  if (mensaje.startsWith('auth_required')) return 'sin_sesion';
  if (mensaje.startsWith('no_access_to_mascota')) return 'sin_acceso';
  if (mensaje.startsWith('mascota_en_memorial')) return 'en_memorial';
  if (mensaje.startsWith('hecho_requerido')) return 'hecho_requerido';
  if (mensaje.startsWith('hecho_muy_largo')) return 'hecho_muy_largo';
  if (mensaje.startsWith('memoria_llena')) return 'memoria_llena';
  if (mensaje.startsWith('memoria_no_encontrada')) return 'memoria_no_encontrada';
  if (mensaje.startsWith('fuente_invalida')) return 'fuente_invalida';
  if (mensaje.startsWith('rol_invalido')) return 'rol_invalido';
  if (mensaje.startsWith('texto_requerido')) return 'texto_requerido';
  return 'desconocido';
}

/* ─── A1 · el contexto ──────────────────────────────────────────────────── */

/** De dónde salió un hecho de la memoria. **No es decoración**: separa lo que
 *  la familia afirmó de lo que sólo dejó pasar cuando lo propuso el modelo, y
 *  los dos no pesan igual cuando Nexo habla de la salud de un animal. */
export type FuenteMemoria = 'familia' | 'confirmado_de_ia';

export type HechoDeMemoria = {
  id: string;
  hecho: string;
  fuente: FuenteMemoria;
  creado_en: string;
};

/**
 * Todo lo que Nexo sabe de una mascota, en **un solo viaje**.
 *
 * No es estilo: la tesis medida de S94 dice que en esta base no hay consultas
 * lentas — lo que cuesta es la petición, ~150 ms fijos. Once lecturas
 * encadenadas serían ~1,6 s antes de que el modelo empiece a pensar.
 *
 * El tipo es **deliberadamente laxo en las partes de datos** (`unknown[]`,
 * `Record`): lo que viaja es el expediente crudo, y tiparlo campo por campo
 * acá obligaría a esta puerta a conocer la forma de once tablas y a romperse
 * cada vez que una cambia. *La edge que lo consume lo trata como contexto, no
 * como modelo de dominio.* Lo que SÍ está tipado es lo que la app dibuja.
 */
export type ContextoCoach = {
  mascota: {
    id: string;
    nombre: string;
    especie: string;
    /** `null` = no se declaró. Viaja el null: no se inventa una raza. */
    raza: string | null;
    sexo: string | null;
    sujeto: string | null;
    fecha_nacimiento: string | null;
    precision_nacimiento: string | null;
    momento_vital: string | null;
  };
  /** `null` cuando la raza no tiene ficha publicada. La ausencia se dice. */
  ficha_raza: Record<string, unknown> | null;
  salud: Record<string, unknown>;
  plan_vacunal: unknown[];
  proxima_cita: Record<string, unknown> | null;
  eventos: unknown[];
  pedidos_en_curso: number;
  memoria: HechoDeMemoria[];
};

export async function obtenerContextoCoach(
  mascotaId: string,
): Promise<ResultadoWrapper<ContextoCoach, CodigoErrorCoach>> {
  const { data, error } = await getClient().rpc('obtener_contexto_coach', {
    p_mascota_id: mascotaId,
  });
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || typeof o !== 'object' || o.ok !== true || typeof o.mascota !== 'object') {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: o as unknown as ContextoCoach };
}

/* ─── A2 · la búsqueda ──────────────────────────────────────────────────── */

export type TipoResultado =
  | 'mascota' | 'cita' | 'pedido' | 'recuerdo' | 'producto' | 'prestador';

export type ResultadoBusqueda = {
  tipo: TipoResultado;
  id: string;
  titulo: string;
  subtitulo: string | null;
  fecha: string | null;
  /** Ruta de expo-router lista para `router.push`. La arma el servidor para
   *  que la app no tenga que saber dónde vive cada cosa. */
  ruta: string;
};

/**
 * La misma caja encuentra mascotas, citas, pedidos, recuerdos, productos y
 * prestadores. **Lo privado, sólo de la familia de quien pregunta** — y su
 * rojo con otra cuenta está en el cinturón de la migración.
 *
 * Con menos de dos caracteres devuelve vacío **sin error**: rebotar a quien
 * todavía está escribiendo es castigarlo por escribir.
 *
 * ⚠️ Límite medido y declarado: el diccionario español ignora los acentos en
 * las dos direcciones («ingles» encuentra «inglés»), pero **conserva la ñ** —
 * buscar «muneca» no encuentra «Muñeca». La ñ es una letra, no un acento.
 */
export async function buscarEnMiFamilia(
  consulta: string,
  limite?: number,
): Promise<ResultadoWrapper<{ consulta: string; resultados: ResultadoBusqueda[] }, CodigoErrorCoach>> {
  const { data, error } = await getClient().rpc('buscar_en_mi_familia', {
    p_q: consulta,
    ...(limite !== undefined ? { p_limite: limite } : null),
  });
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || typeof o !== 'object' || o.ok !== true || !Array.isArray(o.resultados)) {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return {
    ok: true,
    data: {
      consulta: typeof o.consulta === 'string' ? o.consulta : consulta,
      resultados: o.resultados as ResultadoBusqueda[],
    },
  };
}

/* ─── A3 · la memoria ───────────────────────────────────────────────────── */

export async function listarMemoriaCoach(
  mascotaId: string,
): Promise<ResultadoWrapper<HechoDeMemoria[], CodigoErrorCoach>> {
  const { data, error } = await getClient().rpc('listar_memoria_coach', {
    p_mascota_id: mascotaId,
  });
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true || !Array.isArray(o.memoria)) {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: o.memoria as HechoDeMemoria[] };
}

/**
 * Agrega un hecho **que escribió la familia**. Techo de 30 por mascota — no es
 * límite técnico: la memoria entera viaja en cada pregunta, así que sin techo
 * el costo crece sin que nadie lo decida.
 *
 * 🔴 **Ya no recibe `fuente`, y eso es la cura, no una simplificación.** Antes
 * aceptaba `'confirmado_de_ia'` desde el cliente: el CHECK verificaba que la
 * palabra estuviera en la lista, no quién podía decirla, así que la procedencia
 * era **una afirmación de quien llamaba**. *Un vocabulario cerrado que sólo
 * vive en un parámetro no cierra nada.*
 * Lo que la IA propuso entra por `confirmarPropuestaMemoria`, que es otra
 * puerta y otro acto — y ahí la fuente la pone la RPC.
 */
export async function agregarMemoriaCoach(
  mascotaId: string,
  hecho: string,
): Promise<ResultadoWrapper<{ id: string }, CodigoErrorCoach>> {
  const { data, error } = await getClient().rpc('agregar_memoria_coach', {
    p_mascota_id: mascotaId,
    p_hecho: hecho,
  });
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true || typeof o.id !== 'string') {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: { id: o.id } };
}

/** Editar un hecho que propuso la IA **lo vuelve de la familia**: quien lo
 *  reescribió se hizo cargo de lo que dice. */
export async function editarMemoriaCoach(
  id: string,
  hecho: string,
): Promise<ResultadoWrapper<{ id: string }, CodigoErrorCoach>> {
  const { data, error } = await getClient().rpc('editar_memoria_coach', { p_id: id, p_hecho: hecho });
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true) return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  return { ok: true, data: { id } };
}

export async function borrarMemoriaCoach(
  id: string,
): Promise<ResultadoWrapper<{ id: string }, CodigoErrorCoach>> {
  const { data, error } = await getClient().rpc('borrar_memoria_coach', { p_id: id });
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true) return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  return { ok: true, data: { id } };
}

/* ─── A4 · el hilo ──────────────────────────────────────────────────────── */

export type TurnoCoach = {
  turno: number;
  rol: 'familia' | 'nexo';
  texto: string;
  creado_en: string;
};

/** Los últimos turnos. **La retención de 30 días la aplica el LECTOR**, no
 *  sólo el purgador: si el cron no corre, el hilo viejo igual no vuelve. Una
 *  retención que depende de que un reloj ande es una promesa, no una regla. */
export async function leerHiloCoach(
  mascotaId: string,
  limite?: number,
): Promise<ResultadoWrapper<TurnoCoach[], CodigoErrorCoach>> {
  const { data, error } = await getClient().rpc('leer_hilo_coach', {
    p_mascota_id: mascotaId,
    ...(limite !== undefined ? { p_limite: limite } : null),
  });
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true || !Array.isArray(o.hilo)) {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: o.hilo as TurnoCoach[] };
}

export async function guardarTurnoCoach(
  mascotaId: string,
  rol: 'familia' | 'nexo',
  texto: string,
  tokens?: number,
): Promise<ResultadoWrapper<{ turno: number }, CodigoErrorCoach>> {
  const { data, error } = await getClient().rpc('guardar_turno_coach', {
    p_mascota_id: mascotaId,
    p_rol: rol,
    p_texto: texto,
    ...(tokens !== undefined ? { p_tokens: tokens } : null),
  });
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true || typeof o.turno !== 'number') {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: { turno: o.turno } };
}

/** Borra el hilo entero. Acá **sí** es un DELETE de verdad: la familia pidió
 *  que la charla no exista más, y un borrado blando sería decirle que sí y
 *  guardarla igual. */
export async function borrarHiloCoach(
  mascotaId: string,
): Promise<ResultadoWrapper<{ borrados: number }, CodigoErrorCoach>> {
  const { data, error } = await getClient().rpc('borrar_hilo_coach', { p_mascota_id: mascotaId });
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true || typeof o.borrados !== 'number') {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: { borrados: o.borrados } };
}

/* ─── A6 · los avisos ───────────────────────────────────────────────────── */

export type TipoAviso = 'vacuna_vence' | 'antiparasitario_vence' | 'cita_manana';

export type AvisoCoach = {
  id: string;
  mascota_id: string;
  mascota: string;
  tipo: TipoAviso;
  fecha: string;
  detalle: Record<string, unknown>;
};

/**
 * Los avisos sin leer de las mascotas de la familia.
 *
 * ⚠️ **La anticipación llega DOSIFICADA: una por mascota cada 7 días.** Las
 * demás quedan en cola (`estado='en_cola'`) y no se muestran. Nació de una
 * medición: al firmarse las 22 reglas, Thor recibió 4 avisos el mismo día y
 * Zeus 5 — la regla «uno por tema y por etapa» se cumplía, pero nadie había
 * limitado cuántos temas por día. *Cinco avisos juntos no son cinco veces más
 * útiles que uno: son la razón por la que alguien apaga los avisos* (LOYALTY §8).
 *
 * La cola se ordena por: ① la que tiene chequeo **y cita médica en 30 días**
 * —el aviso llega cuando se puede hacer algo con él— ② la que entra a una
 * etapa nueva, que **salta la cola** ③ el resto, en el orden del catálogo.
 * Y si hay cita próxima, el aviso trae su fecha para atarse a ella en vez de
 * inventar una gestión nueva.
 *
 * 🔴 **Ninguno lo decide un modelo**: los tres salen de fechas que el
 * expediente ya tiene. *Un aviso generativo puede equivocarse de fecha y nadie
 * lo notaría hasta que una familia llegue tarde a una vacuna.*
 *
 * Nunca trae mascotas en memorial, y **sólo existen si la familia los
 * encendió** (`activarAvisosNexo`): la ausencia de decisión no habilita nada.
 */
export async function obtenerAvisosCoach(): Promise<
  ResultadoWrapper<AvisoCoach[], CodigoErrorCoach>
> {
  const { data, error } = await getClient().rpc('obtener_avisos_coach');
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true || !Array.isArray(o.avisos)) {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: o.avisos as AvisoCoach[] };
}

export async function marcarAvisoCoachLeido(
  id: string,
): Promise<ResultadoWrapper<{ id: string }, CodigoErrorCoach>> {
  const { data, error } = await getClient().rpc('marcar_aviso_coach_leido', { p_id: id });
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true) return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  return { ok: true, data: { id } };
}

/** El opt-in. Guarda **cuándo** la familia dijo que sí, no sólo que dijo. */
export async function activarAvisosNexo(
  familiaId: string,
  activar = true,
): Promise<ResultadoWrapper<{ activos: boolean }, CodigoErrorCoach>> {
  const { data, error } = await getClient().rpc('activar_avisos_nexo', {
    p_familia_id: familiaId,
    p_activar: activar,
  });
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true) return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  return { ok: true, data: { activos: activar } };
}

/* ─── A5 · las placas ───────────────────────────────────────────────────── */

export type CodigoErrorPlaca =
  | 'sin_sesion' | 'sin_acceso' | 'en_memorial'
  | 'placa_no_existe' | 'placa_ya_activada' | 'solo_admin' | 'desconocido';

function codigoPlaca(mensaje: string): CodigoErrorPlaca {
  if (mensaje.startsWith('auth_required')) return 'sin_sesion';
  if (mensaje.startsWith('no_access_to_mascota')) return 'sin_acceso';
  if (mensaje.startsWith('mascota_en_memorial')) return 'en_memorial';
  if (mensaje.startsWith('placa_no_existe')) return 'placa_no_existe';
  if (mensaje.startsWith('placa_ya_activada')) return 'placa_ya_activada';
  if (mensaje.startsWith('solo_admin')) return 'solo_admin';
  return 'desconocido';
}

/**
 * Ata una chapita ya fabricada a una mascota.
 *
 * ⚠️ **El pasaporte nace con EL TOKEN DE LA PLACA**, no con uno nuevo: el
 * código ya está grabado en metal colgando de un collar. *Cualquier diseño en
 * el que el token cambie al activar convierte la chapita en un adorno el mismo
 * día que la familia la usa.*
 *
 * Si la mascota ya tenía pasaporte, el anterior queda revocado en el mismo
 * acto — una viva por mascota, y es lo que la familia está pidiendo.
 *
 * `placa_ya_activada` **no dice de quién es**: quien tiene una placa ajena en
 * la mano no tiene por qué enterarse de nada de esa familia.
 */
export async function activarPlaca(
  token: string,
  mascotaId: string,
): Promise<ResultadoWrapper<{ pasaporte_id: string; token: string }, CodigoErrorPlaca>> {
  const { data, error } = await getClient().rpc('activar_placa', {
    p_token: token,
    p_mascota_id: mascotaId,
  });
  if (error) return { ok: false, codigo: codigoPlaca(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true || typeof o.pasaporte_id !== 'string' || typeof o.token !== 'string') {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: { pasaporte_id: o.pasaporte_id, token: o.token } };
}

/* ─── 2.1 · NEXO ACOMPAÑA ───────────────────────────────────────────────── */

/** Las cuatro clases del «contanos». Cada una tiene su puerta de familia. */
export type ClaseDeHecho = 'comportamiento' | 'rasgo' | 'medico' | 'recuerdo';

/**
 * Guarda un hecho que la familia contó y Nexo clasificó.
 *
 * 🔴 **No escribe nada nuevo: despacha.** Cada clase entra por la puerta de
 * familia que ya existe, con su procedencia y su `modo_captura` resueltos ahí.
 * *Un INSERT directo por clase habría sido más corto y sería la tercera vez en
 * la sesión que dos caminos escriben la misma tabla* — así, el día que la
 * puerta de alergias gane un guard, lo gana también lo que entra por el chat.
 *
 * ⚠️ **`medico` NUNCA entra confirmado.** La familia observa; confirmar es del
 * veterinario. Lo fuerza la puerta de destino, no quien llama.
 *
 * `campos` es opcional y depende de la clase: `alergeno`/`severidad` para una
 * alergia, `condicion` para una condición, `fecha`/`foto_url` para un recuerdo.
 */
export async function guardarHechoClasificado(
  datos: {
    mascotaId: string;
    clase: ClaseDeHecho;
    texto: string;
    campos?: Record<string, string>;
  },
): Promise<ResultadoWrapper<{ clase: ClaseDeHecho }, CodigoErrorCoach>> {
  const { data, error } = await getClient().rpc('guardar_hecho_clasificado', {
    p_mascota_id: datos.mascotaId,
    p_clase: datos.clase,
    p_texto: datos.texto,
    ...(datos.campos !== undefined ? { p_campos: datos.campos } : null),
  });
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true) return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  return { ok: true, data: { clase: datos.clase } };
}

export type SugerenciaConociendolo = {
  clase: 'nacimiento' | 'raza' | 'comportamiento' | 'peso' | 'rasgo' | 'recuerdo';
  texto: string;
  /** Por qué se pide. **Mostralo**: sin el porqué es un formulario. */
  porque: string;
};

/**
 * El próximo hito, **UNO SOLO** (LOYALTY §2). *Una lista de cinco huecos es
 * una lista de deberes; uno solo es una invitación.*
 *
 * `null` cuando no hay nada que pedir **y también en memorial**: pedirle a
 * alguien que complete el expediente de un animal que murió es la peor forma
 * de acompañar.
 *
 * ⚠️ **No devuelve `por_resolver` a propósito.** Ese conteo ya existe y está
 * firmado por la mesa en `apps/cliente/src/lib/pendientes.ts` —cinco clases,
 * con `cita` afuera porque «lo que se nombra resolver no puede incluir algo
 * que no se resuelve»—. Recalcularlo en SQL crearía **dos verdades** para el
 * mismo número, y la divergencia aparecería recién cuando alguien cambiara
 * una sola de las dos. Seguí usando esa lib.
 */
export async function obtenerSugerenciaConociendolo(
  mascotaId: string,
): Promise<ResultadoWrapper<SugerenciaConociendolo | null, CodigoErrorCoach>> {
  const { data, error } = await getClient().rpc('obtener_sugerencia_conociendolo', {
    p_mascota_id: mascotaId,
  });
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true) return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  const s = o.sugerencia;
  return { ok: true, data: (s === null || s === undefined ? null : s) as SugerenciaConociendolo | null };
}

/** Un sistema que una raza suele tener predispuesto. La voz sale del catálogo:
 *  ninguna de estas frases afirma nada sobre UNA mascota. */
export type Predisposicion = {
  codigo: string;
  nombre: string;
  /** «suelen tener problemas de cadera» — se completa con la raza. */
  descripcion_familia: string;
  /** Siempre termina en el veterinario. */
  chequeo_sugerido: string;
  oficio: string;
  etapas: string[];
};

/** Las predisposiciones de una raza, para la ficha. Sólo de fichas publicadas:
 *  una regla salida de un texto que nadie leyó no debería llegar a una familia. */
export async function obtenerPredisposicionesDeRaza(
  razaCodigo: string,
): Promise<ResultadoWrapper<Predisposicion[], CodigoErrorCoach>> {
  const { data, error } = await getClient()
    .from('raza_predisposicion')
    .select('cat_predisposiciones(codigo, nombre, descripcion_familia, chequeo_sugerido, oficio, etapas)')
    .eq('raza_codigo', razaCodigo);
  if (error) return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  const filas = (data ?? []) as { cat_predisposiciones: Predisposicion | null }[];
  return { ok: true, data: filas.map((f) => f.cat_predisposiciones).filter((p): p is Predisposicion => p !== null) };
}

/* ─── LAS PROPUESTAS DE NEXO ────────────────────────────────────────────── */

/**
 * Una fila de la COLA de propuestas.
 *
 * ⚠️ **No es `PropuestaMemoria` de `nexo.ts`, y por eso se llama distinto.**
 * Aquélla es lo que la edge devuelve **en un turno** —con `clase` tipada
 * contra un vocabulario cerrado—; ésta es la **fila que quedó esperando**, con
 * su fecha y con `clase` que puede faltar porque la tabla la guarda libre.
 * *Se reusa cuando son el mismo vocabulario en dos archivos; se renombra
 * cuando son dos cosas parecidas con el mismo nombre.*
 */
export type PropuestaEnCola = {
  id: string;
  hecho: string;
  /** La clase que el modelo propuso. Se guarda para poder medir después si
   *  clasifica bien — sin esto, su exactitud no es auditable. */
  clase: string | null;
  creada_en: string;
};

/** Lo que Nexo propone recordar y la familia todavía no resolvió. */
export async function listarPropuestasMemoria(
  mascotaId: string,
): Promise<ResultadoWrapper<PropuestaEnCola[], CodigoErrorCoach>> {
  const { data, error } = await getClient().rpc('listar_propuestas_memoria', {
    p_mascota_id: mascotaId,
  });
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true || !Array.isArray(o.propuestas)) {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: o.propuestas as PropuestaEnCola[] };
}

/**
 * La familia acepta lo que Nexo propuso.
 *
 * 🔴 **`'confirmado_de_ia'` nace acá dentro y sólo acá.** No viaja en ningún
 * parámetro: lo escribe la función que sabe que hubo una propuesta y que
 * alguien de la familia la aceptó. *La procedencia deja de ser lo que alguien
 * dice y pasa a ser lo que ocurrió.*
 */
export async function confirmarPropuestaMemoria(
  id: string,
): Promise<ResultadoWrapper<{ id: string }, CodigoErrorCoach>> {
  const { data, error } = await getClient().rpc('confirmar_propuesta_memoria', { p_id: id });
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true || typeof o.id !== 'string') {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: { id: o.id } };
}

/** La familia dice que no. **Se marca, no se borra**: saber qué propuso el
 *  modelo y la familia NO quiso es la única forma de medir si clasifica bien. */
export async function rechazarPropuestaMemoria(
  id: string,
): Promise<ResultadoWrapper<{ id: string }, CodigoErrorCoach>> {
  const { data, error } = await getClient().rpc('rechazar_propuesta_memoria', { p_id: id });
  if (error) return { ok: false, codigo: codigoCoach(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true) return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  return { ok: true, data: { id } };
}
