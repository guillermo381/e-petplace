// Preferencias persistidas (S55-B3, cierra D-316) — idioma multi-dispositivo
// + notificaciones.
//
// ⚠️ S87 — EL CONTRATO CAMBIÓ, y esta cabecera es la que mentía antes.
// El contrato B4 viejo decía «fila ausente = habilitada» SIN DISTINGUIR
// CATEGORÍA, y eso producía DOS defectos simétricos (MODELO_NOTIFICACIONES §6,
// ENMIENDA S87): `promocion` nacía ENCENDIDA (contra §3/§6/§12.3) y
// `vacuna_vencida` se podía APAGAR (contra la letra firmada del founder).
//
// Ahora la unidad es **(persona, categoría, canal)** y el default lo dice la
// CATEGORÍA, no una constante. La letra firmada —«elige por dónde le llegan,
// no si le llegan»— la hace cumplir un trigger EN EL MOTOR: una autorización
// que decide el cliente es decorativa (la lección de D-654).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  sin_sesion: 'No hay sesión activa.',
  error_preferencias: 'No pudimos leer tus preferencias.',
  error_guardar: 'No pudimos guardar la preferencia. Prueba de nuevo.',
  categoria_no_apagable:
    'Estos avisos siempre llegan. Podés elegir por dónde, no si te llegan.',
  opt_in_sin_evidencia:
    'Para activar WhatsApp necesitamos tu confirmación explícita.',
  // S103 — el medio de pago preferido. Voces en TUTEO (regla de la casa).
  medio_invalido: 'Ese medio de pago no existe.',
  tarjeta_requerida: 'Elige cuál tarjeta quieres recordar.',
  tarjeta_no_disponible: 'Esa tarjeta ya no está disponible.',
  deuna_no_lleva_tarjeta: 'Deuna no usa una tarjeta guardada.',
} as const;

export type CodigoErrorPreferencias = keyof typeof MENSAJES;

/** Los cuatro canales del catálogo `cat_notificacion_canales`. */
export type CanalNotificacion = 'in_app' | 'push' | 'email' | 'whatsapp';

/** Clave de una preferencia en el modelo nuevo. */
export interface ClavePreferencia {
  categoria: string;
  canal: CanalNotificacion;
}

export interface Preferencias {
  /** 'es' | 'en' | null (null = el idioma del dispositivo). */
  idioma: 'es' | 'en' | null;
  /**
   * Solo lo PERSISTIDO, keyed `"<categoria>:<canal>"`. La ausencia NO es
   * "habilitada": es el default de la categoría, que solo el server conoce
   * (`preferencia_efectiva`). Una pantalla que asuma `true` por ausencia
   * reinstala el defecto que S87 curó.
   */
  notificaciones: Record<string, boolean>;
  /**
   * S103 — LA MEMORIA DEL MEDIO DE PAGO.
   *
   * 🔴 **`null` NO significa «no tiene medio»: significa «nunca eligió»**, y esa
   * distinción es la que vuelve ejecutable la firma de `LETRA_DEUNA` §6bis
   * (*DeUna por defecto, **salvo que el cliente haya elegido otro***).
   * *Sin esta señal el default pisaría la elección en cada compra — el «reset
   * por compra» que la firma prohíbe.*
   */
  medioPago: MedioPagoPreferido;
}

/**
 * Son DOS campos y no uno, y la razón es de dominio: **DeUna no es una
 * tarjeta.** No tiene fila en `tarjetas_guardadas` —no hay alta, no hay token
 * (`LETRA_DEUNA` §1)—, así que un solo id no puede expresar esa elección.
 *
 * El estado incoherente (`'tarjeta'` sin id, `'deuna'` con id) **es
 * inexpresable en la base**: lo prohíbe un CHECK. *La pantalla no tiene que
 * defenderse de eso.*
 */
export interface MedioPagoPreferido {
  /** `null` = nunca eligió ⇒ rige el default de la letra. */
  medio: 'deuna' | 'tarjeta' | null;
  /** Solo cuando `medio === 'tarjeta'`. */
  tarjetaId: string | null;
}

/**
 * ⚠️ CRUCE DE TERRITORIO DECLARADO (pista D, S88 — Lote 4) · A firma o
 * revierte. La lámina firmada exige que la pantalla LEA las 7 filas y los
 * 4 canales del catálogo («hardcodear la lista la desincroniza del motor»),
 * y el lector no existía. Se escribe acá y no en la app por la puerta única;
 * se escribe por la pista D y no se clona por la excepción §6 del método
 * (S85): es una pieza que el diseño de A ya comprometió, sin decisión
 * abierta — un SELECT ordenado de dos catálogos solo-lectura.
 */
export interface CategoriaNotificacionCatalogo {
  codigo: string;
  orden: number;
  /** false = «siempre llega»: la fila no dibuja interruptor de existencia. */
  apagableExistencia: boolean;
  /** El default que `preferencia_efectiva` usa cuando no hay fila persistida
   *  (para todo canal salvo whatsapp, que SIEMPRE nace apagado). */
  defaultHabilitada: boolean;
  /** Voz del catálogo (es) — fallback de display para un código que la
   *  pantalla no conozca todavía (Ley 3: jamás un código crudo). */
  descripcion: string;
  /** ✅ FIRMADO POR A (S88) — y ADJUDICADO entre dos versiones: C y D
   *  resolvieron el mismo problema en paralelo, las dos declarándolo como
   *  cruce. **Gana ésta, y por un dato, no por gusto: filtra `activo = true`.**
   *  La otra contaba también los tipos INACTIVOS, o sea que dibujaba una fila
   *  para algo que no puede llegar — exactamente lo que la Ley 23 evita.
   *  Y se toma el BOOLEANO y no el conteo por el mismo criterio que el badge
   *  de la campana: *la forma del dato debe ser lo que la letra autoriza*, y
   *  nadie firmó pintar «3 tipos».
   *
   *  ⚠️ CRUCE DE TERRITORIO DECLARADO (pista C, S88 — pantalla de
   *  Preferencias del prestador) · A firma o revierte. Mismo fundamento
   *  que el cruce de D de arriba (excepción §6): la orden de mesa exige
   *  que «la fila sin tipos vivos NO se muestra, derivado del catálogo,
   *  no de una lista a mano» — y el dato de si una categoría tiene tipos
   *  vivos solo vive en `cat_notificacion_tipos`. Un SELECT más de un
   *  catálogo solo-lectura, cero decisión abierta. Medido al escribir:
   *  `resumen` tiene CERO tipos — es la única fila que hoy no se pinta. */
  tieneTiposVivos: boolean;
  /**
   * ⚠️ **VIVOS PARA ESTA AUDIENCIA**, no vivos a secas (freno medido de C,
   * S88). Sin el filtro, «Lo que ya pagaste» se dibujaba en el prestador con
   * seis tipos que son **del que paga**.
   *
   * El dato NO era derivable —`cat_notificacion_tipos` no tenía columna de
   * audiencia y ninguna tabla la portaba— así que **nació con este lote**:
   * `audiencia ∈ (cliente | prestador | ambas)`, MEDIDA donde hay productor
   * (17 tipos) y RAZONADA donde no (20), declarado en la migración.
   *
   * `salud_seguridad` es **`ambas`** por pre-adjudicación de mesa: es visible
   * en el prestador, y la clasificación lo expresa sin escribir excepción.
   */
  tieneTiposVivosParaMi: boolean;
}

export interface CanalNotificacionCatalogo {
  codigo: CanalNotificacion;
  orden: number;
  /** El piso: en categorías no apagables este canal no se puede apagar. */
  esPiso: boolean;
  /** Encenderlo exige evidencia de opt-in (WhatsApp, §6 — Meta). */
  exigeEvidencia: boolean;
  descripcion: string;
}

export interface CatalogoNotificaciones {
  categorias: CategoriaNotificacionCatalogo[];
  canales: CanalNotificacionCatalogo[];
}

const CANALES_CONOCIDOS: readonly CanalNotificacion[] = ['in_app', 'push', 'email', 'whatsapp'];

export type AudienciaNotificacion = 'cliente' | 'prestador';

/** @param audiencia QUIÉN mira. La pantalla la declara — el motor no la
 *  adivina: la MISMA persona puede ser dueño de mascota Y prestador, y el
 *  catálogo no puede decidir cuál de sus dos sombreros lleva puesto. */
export async function obtenerCatalogoNotificaciones(
  audiencia: AudienciaNotificacion,
): Promise<
  ResultadoWrapper<CatalogoNotificaciones, CodigoErrorPreferencias>
> {
  const cliente = getClient();
  const [cats, cans, tipos] = await Promise.all([
    cliente
      .from('cat_notificacion_categorias')
      .select('codigo, orden, apagable_existencia, default_habilitada, descripcion')
      .order('orden', { ascending: true }),
    cliente
      .from('cat_notificacion_canales')
      .select('codigo, orden, es_piso, exige_evidencia, descripcion')
      .order('orden', { ascending: true }),
    // Solo la COLUMNA categoria de los tipos ACTIVOS: la pantalla necesita
    // saber si la categoría tiene ≥1 tipo vivo, jamás la lista de tipos
    // (la campana ya estableció que la pantalla no traduce tipos).
    cliente.from('cat_notificacion_tipos').select('categoria, audiencia').eq('activo', true),
  ]);
  if (cats.error || cans.error || tipos.error) {
    return { ok: false, codigo: 'error_preferencias', mensaje: MENSAJES.error_preferencias };
  }
  const categoriasConTipos = new Set(tipos.data.map((t) => t.categoria));
  // `ambas` cuenta para las dos: un tipo que le llega a los dos hace que la
  // fila exista en las dos pantallas — que es exactamente lo que dice.
  const miAudiencia = new Set(
    tipos.data.filter((t) => t.audiencia === audiencia || t.audiencia === 'ambas').map((t) => t.categoria),
  );
  return {
    ok: true,
    data: {
      categorias: cats.data.map((c) => ({
        codigo: c.codigo,
        orden: c.orden,
        apagableExistencia: c.apagable_existencia,
        defaultHabilitada: c.default_habilitada,
        descripcion: c.descripcion,
        tieneTiposVivos: categoriasConTipos.has(c.codigo),
        tieneTiposVivosParaMi: miAudiencia.has(c.codigo),
      })),
      // Un canal fuera del union conocido se angosta verificando (regla 34):
      // si el catálogo gana un canal nuevo, esta lista lo declara — la
      // pantalla vieja no lo dibuja, pero tampoco revienta.
      canales: cans.data
        .filter((c): c is typeof c & { codigo: CanalNotificacion } =>
          (CANALES_CONOCIDOS as readonly string[]).includes(c.codigo),
        )
        .map((c) => ({
          codigo: c.codigo,
          orden: c.orden,
          esPiso: c.es_piso,
          exigeEvidencia: c.exige_evidencia,
          descripcion: c.descripcion,
        })),
    },
  };
}

/** Traduce el rebote del trigger a un código estable — jamás por literal
 *  humano (la trampa medida en D-565: retocar la voz rompe el mapeo). */
function codigoDeRebote(mensaje: string | undefined): CodigoErrorPreferencias {
  if (mensaje?.includes('categoria_no_apagable')) return 'categoria_no_apagable';
  if (mensaje?.includes('opt_in_sin_evidencia')) return 'opt_in_sin_evidencia';
  return 'error_guardar';
}

export async function obtenerPreferencias(): Promise<ResultadoWrapper<Preferencias, CodigoErrorPreferencias>> {
  const cliente = getClient();
  const { data: sesion } = await cliente.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  const [pref, notifs] = await Promise.all([
    cliente
      .from('user_preferencias')
      .select('idioma, medio_pago_preferido, tarjeta_preferida_id')
      .eq('user_id', uid)
      .maybeSingle(),
    cliente.from('user_notificacion_prefs').select('categoria, canal, habilitada').eq('user_id', uid),
  ]);
  if (pref.error || notifs.error) {
    return { ok: false, codigo: 'error_preferencias', mensaje: MENSAJES.error_preferencias };
  }

  const idioma = pref.data?.idioma === 'es' || pref.data?.idioma === 'en' ? pref.data.idioma : null;
  const notificaciones: Record<string, boolean> = {};
  for (const fila of notifs.data) notificaciones[`${fila.categoria}:${fila.canal}`] = fila.habilitada;
  /* Se angosta VERIFICANDO, jamás con un cast (regla 34): si el CHECK de la
     base ganara un valor nuevo, esta pantalla no lo dibuja pero tampoco
     revienta — y el `null` cae del lado correcto, que es «nunca eligió». */
  const medioCrudo = pref.data?.medio_pago_preferido;
  const medio: MedioPagoPreferido['medio'] =
    medioCrudo === 'deuna' || medioCrudo === 'tarjeta' ? medioCrudo : null;
  const medioPago: MedioPagoPreferido = {
    medio,
    tarjetaId: medio === 'tarjeta' ? (pref.data?.tarjeta_preferida_id ?? null) : null,
  };

  return { ok: true, data: { idioma, notificaciones, medioPago } };
}

/**
 * S103 — RECUERDA EL MEDIO DE PAGO ELEGIDO.
 *
 * Pasar `medio: null` es **«olvidá mi preferencia»** y es legal: sirve el día
 * que la superficie ofrezca «no recordar».
 *
 * 🔴 **La tarjeta se verifica del lado del SERVIDOR** —que sea tuya y esté
 * guardada—, y el rebote es el MISMO para «no existe» y «es de otro».
 * *Distinguirlos convertiría esto en un oráculo de tarjetas ajenas.*
 *
 * ⚠️ **Borrar la tarjeta preferida borra la preferencia** (trigger en el motor):
 * la persona vuelve a «nunca eligió» y el default vuelve a regir. Es lo
 * correcto —no podemos preferirle una tarjeta que ya no existe— **pero es un
 * cambio silencioso de su elección**: si alguna superficie muestra la
 * preferencia como un ajuste, ahí hay una voz que decir.
 */
export async function guardarMedioPagoPreferido(input: {
  medio: 'deuna' | 'tarjeta' | null;
  tarjetaId?: string | null;
}): Promise<ResultadoWrapper<MedioPagoPreferido, CodigoErrorPreferencias>> {
  /* 🔴 Se OMITEN los argumentos en vez de mandar `null`, y no es cosmético: la
     firma declara los dos con `DEFAULT NULL`, así que **omitir ES decir NULL**
     — y es la única forma que el cliente tipado acepta. *Mandar `null`
     explícito no compila; mandar `''` inventaría un medio inexistente.* */
  const args: { p_medio?: string; p_tarjeta_id?: string } = {};
  if (input.medio !== null) args.p_medio = input.medio;
  if (input.medio === 'tarjeta' && input.tarjetaId) args.p_tarjeta_id = input.tarjetaId;

  const { data, error } = await getClient().rpc('guardar_medio_pago_preferido', args);
  if (error) {
    const codigo = codigoDeReboteMedio(error.message);
    return { ok: false, codigo, mensaje: MENSAJES[codigo] };
  }
  if (typeof data !== 'object' || data === null || (data as { ok?: unknown }).ok !== true) {
    return { ok: false, codigo: 'error_guardar', mensaje: MENSAJES.error_guardar };
  }
  /* Se devuelve lo que el SERVIDOR confirmó, no lo que la pantalla mandó — así
     el estado local no puede quedar adelantado de la base. */
  const d = data as { medio?: unknown; tarjeta_id?: unknown };
  const medio =
    d.medio === 'deuna' || d.medio === 'tarjeta' ? d.medio : null;
  return {
    ok: true,
    data: { medio, tarjetaId: typeof d.tarjeta_id === 'string' ? d.tarjeta_id : null },
  };
}

/** Mismo criterio que `codigoDeRebote`: se mapea por CÓDIGO estable, jamás por
 *  literal humano — retocar la voz rompería el mapeo (D-565). */
function codigoDeReboteMedio(mensaje: string | undefined): CodigoErrorPreferencias {
  if (mensaje?.includes('auth_requerido')) return 'sin_sesion';
  if (mensaje?.includes('medio_invalido')) return 'medio_invalido';
  if (mensaje?.includes('tarjeta_requerida')) return 'tarjeta_requerida';
  if (mensaje?.includes('tarjeta_no_disponible')) return 'tarjeta_no_disponible';
  if (mensaje?.includes('deuna_no_lleva_tarjeta')) return 'deuna_no_lleva_tarjeta';
  return 'error_guardar';
}

/** Persiste el idioma elegido en DB (la verdad multi-dispositivo). */
export async function guardarIdiomaPreferido(
  idioma: 'es' | 'en',
): Promise<ResultadoWrapper<null, CodigoErrorPreferencias>> {
  const cliente = getClient();
  const { data: sesion } = await cliente.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  const { error } = await cliente
    .from('user_preferencias')
    .upsert({ user_id: uid, idioma, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) return { ok: false, codigo: 'error_guardar', mensaje: MENSAJES.error_guardar };
  return { ok: true, data: null };
}

/**
 * EL CONTRATO NUEVO: (persona, categoría, canal). Es el que la pantalla de
 * Preferencias va a consumir (lámina firmada S87).
 *
 * `evidencia` es OBLIGATORIA para encender un canal que la exige (WhatsApp,
 * §6 — requisito de Meta): se guarda quién, cuándo, por qué método y **el
 * texto exacto que se le mostró**. Sin eso el motor rebota `opt_in_sin_evidencia`.
 */
export async function guardarPreferenciaCanal(input: {
  categoria: string;
  canal: CanalNotificacion;
  habilitada: boolean;
  evidencia?: { textoMostrado: string; metodo: string; en: string };
}): Promise<ResultadoWrapper<null, CodigoErrorPreferencias>> {
  const cliente = getClient();
  const { data: sesion } = await cliente.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  const { error } = await cliente.from('user_notificacion_prefs').upsert(
    {
      user_id: uid,
      categoria: input.categoria,
      canal: input.canal,
      habilitada: input.habilitada,
      evidencia: input.evidencia ?? null,
    },
    { onConflict: 'user_id,categoria,canal' },
  );
  if (error) {
    const codigo = codigoDeRebote(error.message);
    return { ok: false, codigo, mensaje: MENSAJES[codigo] };
  }
  return { ok: true, data: null };
}

/**
 * ADAPTADOR DE TRANSICIÓN — la firma vieja (por TIPO, sin canal) sobre el
 * modelo nuevo. Existe para que la pantalla de Preferencias siga compilando
 * y funcionando hasta que el Lote 4 la migre a la lámina firmada.
 *
 * Traduce tipo → categoría contra el catálogo y escribe los canales que hoy
 * existen de verdad (`in_app` + `push`) — exactamente lo que hizo la migración
 * de datos de S87, para que la pantalla vieja y el motor no discrepen.
 *
 * ⚠️ NO es una capa permanente: **muere con el Lote 4**. Y si la categoría no
 * es apagable, el motor rebota y este wrapper devuelve `categoria_no_apagable`
 * — la pantalla vieja va a mostrar ese mensaje hasta que deje de ofrecer el
 * toggle. Eso es correcto: es preferible decir la verdad a fingir que guardó.
 */
export async function guardarPreferenciaNotificacion(
  tipos: string[],
  habilitada: boolean,
): Promise<ResultadoWrapper<null, CodigoErrorPreferencias>> {
  const cliente = getClient();
  const { data: sesion } = await cliente.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };
  if (tipos.length === 0) return { ok: true, data: null };

  const { data: cat, error: errorCat } = await cliente
    .from('cat_notificacion_tipos')
    .select('codigo, categoria')
    .in('codigo', tipos);
  if (errorCat) return { ok: false, codigo: 'error_guardar', mensaje: MENSAJES.error_guardar };

  const categorias = [...new Set((cat ?? []).map((f) => f.categoria))];
  if (categorias.length === 0) return { ok: true, data: null };

  const canales: CanalNotificacion[] = ['in_app', 'push'];
  const filas = categorias.flatMap((categoria) =>
    canales.map((canal) => ({ user_id: uid, categoria, canal, habilitada })),
  );

  const { error } = await cliente
    .from('user_notificacion_prefs')
    .upsert(filas, { onConflict: 'user_id,categoria,canal' });
  if (error) {
    const codigo = codigoDeRebote(error.message);
    return { ok: false, codigo, mensaje: MENSAJES[codigo] };
  }
  return { ok: true, data: null };
}
