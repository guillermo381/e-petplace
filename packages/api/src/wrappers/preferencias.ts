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

export async function obtenerCatalogoNotificaciones(): Promise<
  ResultadoWrapper<CatalogoNotificaciones, CodigoErrorPreferencias>
> {
  const cliente = getClient();
  const [cats, cans] = await Promise.all([
    cliente
      .from('cat_notificacion_categorias')
      .select('codigo, orden, apagable_existencia, default_habilitada, descripcion')
      .order('orden', { ascending: true }),
    cliente
      .from('cat_notificacion_canales')
      .select('codigo, orden, es_piso, exige_evidencia, descripcion')
      .order('orden', { ascending: true }),
  ]);
  if (cats.error || cans.error) {
    return { ok: false, codigo: 'error_preferencias', mensaje: MENSAJES.error_preferencias };
  }
  return {
    ok: true,
    data: {
      categorias: cats.data.map((c) => ({
        codigo: c.codigo,
        orden: c.orden,
        apagableExistencia: c.apagable_existencia,
        defaultHabilitada: c.default_habilitada,
        descripcion: c.descripcion,
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
    cliente.from('user_preferencias').select('idioma').eq('user_id', uid).maybeSingle(),
    cliente.from('user_notificacion_prefs').select('categoria, canal, habilitada').eq('user_id', uid),
  ]);
  if (pref.error || notifs.error) {
    return { ok: false, codigo: 'error_preferencias', mensaje: MENSAJES.error_preferencias };
  }

  const idioma = pref.data?.idioma === 'es' || pref.data?.idioma === 'en' ? pref.data.idioma : null;
  const notificaciones: Record<string, boolean> = {};
  for (const fila of notifs.data) notificaciones[`${fila.categoria}:${fila.canal}`] = fila.habilitada;
  return { ok: true, data: { idioma, notificaciones } };
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
