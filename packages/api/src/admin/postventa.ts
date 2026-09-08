/**
 * EL ASIENTO DE LA CASA — la bandeja y la Hoja del caso (S114-F, tanda 2).
 *
 * Contrato leído ANTES de escribir: `DIRECCION_POSTVENTA` §6 (la Hoja) y
 * `LETRA_POSTVENTA` §9 (el candado del asiento).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EL CANDADO DE §9, MEDIDO Y NO SUPUESTO (7-sep-2026)
 *
 *   grants de `casos_postventa` a authenticated ……… SELECT   ← y nada más
 *   policy de tres asientos ………… familia_user_id = auth.uid()
 *                                 OR es_mi_prestador(prestador_id)
 *                                 OR is_admin()
 *
 * ⇒ **el `REVOKE INSERT/UPDATE/DELETE` de §9.1 está aplicado**: este wrapper
 * **no podría** escribir directo aunque quisiera. Toda escritura va por RPC
 * `SECURITY DEFINER`. *La puerta única dejó de ser prosa y es permiso.*
 *
 * ⇒ **el «rol casa» de §9.2 ES `is_admin()`** — el mismo gate que el resto del
 * portal, no uno nuevo. Dos definiciones de «quién es la casa» divergirían.
 * Y el portal entra con **sesión de usuario y anon key**, jamás `service_role`.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── LO QUE §6 EXIGE Y `leer_caso` NO TRAE ─────────────────────────────────
 * `leer_caso` devuelve caso + objeto + resolución. **No trae** cuánto se pagó,
 * si hay devengo, los casos de 90 días ni la propuesta. Esta capa los junta:
 * el monto sale del objeto, el devengo de `_caso_tiene_devengo`, los
 * contadores de `casos_postventa` por RLS.
 *
 * 🔴 **Y LA PROPUESTA DE LA MÁQUINA NO EXISTE TODAVÍA.** Censado:
 * `pg_proc` no tiene ninguna función de propuesta de postventa —las que hay
 * (`proponer_memoria_coach`, `proponer_sku_vendedor`…) son de otros dominios—.
 * **Por eso `propuesta` viaja como `null` y la Hoja lo DICE**, en vez de
 * fabricar una sugerencia. *Una propuesta inventada acá tendría la autoridad
 * de la máquina sobre plata de un tercero, y no la respalda nadie.*
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

/* ═══════════════════════════════════════════════════════════════════════════
   🔴 EL CAST SOBRE `casos_postventa`, Y POR QUÉ ES SEGURO ACÁ

   Las tablas de postventa existen en la base (medidas: RLS activa, policy de
   tres asientos, grant SELECT) pero **NO están en `database.types.ts`**, que es
   un archivo GENERADO y vive fuera de `src/admin/` ⇒ es de A y F no lo toca.
   Regenerarlo (`pnpm gen:types`) borra este cast; está pedido por nombre en
   `docs/loop/S114-F-PEDIDOS-A.md`.

   ⚠️ **`L-498` en su forma preventiva:** un tipo escrito a mano sobre datos que
   el compilador no puede verificar es exactamente lo que hizo que
   `Placas.tsx` contara 0 placas libres para siempre. Por eso este shape **NO
   se escribió de memoria**: es copia de
       select column_name from information_schema.columns
        where table_name = 'casos_postventa'
   corrida el 7-sep-2026. Si la tabla cambia y esto no, el defecto vuelve —
   y por eso lo correcto es que este bloque MUERA con `gen:types`, no que se
   mantenga al día a mano.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Shape medido de `casos_postventa` (sólo las columnas que esta capa lee). */
interface FilaCasoCruda {
  id: string;
  objeto_tipo: string;
  objeto_id: string;
  motivo_codigo: string;
  clase: number | null;
  etapa: string;
  plazo_prestador_hasta: string | null;
  creado_en: string;
  relato: string | null;
  resumen_confirmado: string | null;
  familia_user_id: string | null;
  prestador_id: string | null;
  decidido_por: string | null;
  estado_final: string | null;
}

type ConsultaCruda = {
  select: (cols: string, opts?: { count?: 'exact'; head?: boolean }) => ConsultaCruda;
  eq: (col: string, val: unknown) => ConsultaCruda;
  neq: (col: string, val: unknown) => ConsultaCruda;
  gte: (col: string, val: unknown) => ConsultaCruda;
  order: (col: string, opts: { ascending: boolean }) => ConsultaCruda;
  limit: (n: number) => ConsultaCruda;
  maybeSingle: () => PromiseLike<{ data: FilaCasoCruda | null; error: unknown }>;
} & PromiseLike<{ data: FilaCasoCruda[] | null; error: unknown; count?: number | null }>;

/** `.from()` sobre una tabla que los tipos generados todavía no conocen. */
function tablaCasos(): ConsultaCruda {
  return (getClient().from as unknown as (t: string) => ConsultaCruda)('casos_postventa');
}

const CODIGOS = ['sin_permiso', 'no_existe', 'error_desconocido'] as const;
export type CodigoErrorPostventa = (typeof CODIGOS)[number];

const MENSAJES: Record<CodigoErrorPostventa, string> = {
  sin_permiso: 'Tu cuenta no puede ver los casos de postventa.',
  no_existe: 'Ese caso no existe.',
  error_desconocido: 'No pudimos leer el caso.',
};

/** Las etapas del catálogo `cat_estados_caso`, medidas. `*` = final. */
export const ETAPAS_ABIERTAS = ['recibido', 'con_prestador', 'con_casa'] as const;
export const ETAPAS_FINALES = [
  'resuelto', 'resuelto_entre_partes', 'retirado', 'sin_lugar', 'cerrado',
] as const;

export interface FilaBandeja {
  id: string;
  objetoTipo: string;
  objetoId: string;
  motivo: string;
  clase: number;
  etapa: string;
  esFinal: boolean;
  /** La casa mira esto primero: un caso que le fue pedido explícitamente. */
  conLaCasa: boolean;
  plazoPrestadorHasta: string | null;
  /** true cuando el plazo del prestador ya venció y el caso sigue abierto. */
  plazoVencido: boolean;
  creadoEn: string;
  relato: string | null;
  resumen: string | null;
  familiaUserId: string | null;
  prestadorId: string | null;
}

/**
 * LA BANDEJA — todos los casos que la casa puede ver.
 *
 * Sin RPC de listado para la casa (`obtener_casos_del_prestador` es del
 * prestador), así que se lee `casos_postventa` por RLS: el grant de SELECT
 * existe y la policy de tres asientos decide. **Es lectura, no escritura**, así
 * que no roza §9.1.
 */
export async function obtenerBandejaCasos(): Promise<
  ResultadoWrapper<FilaBandeja[], CodigoErrorPostventa>
> {
  const { data, error } = await tablaCasos()
    .select(
      'id, objeto_tipo, objeto_id, motivo_codigo, clase, etapa, plazo_prestador_hasta, creado_en, relato, resumen_confirmado, familia_user_id, prestador_id',
    )
    .order('creado_en', { ascending: false })
    .limit(200);

  if (error) {
    /* Un 42501 no se degrada a lista vacía (L-178): «no hay casos» y «no
       podés verlos» son hechos distintos, y confundirlos deja a la casa
       creyendo que no hay nada que atender. */
    return { ok: false, codigo: 'sin_permiso', mensaje: MENSAJES.sin_permiso };
  }

  const ahora = Date.now();
  const filas: FilaBandeja[] = (data ?? []).map((c: FilaCasoCruda) => {
    const etapa = String(c.etapa);
    const esFinal = (ETAPAS_FINALES as readonly string[]).includes(etapa);
    const plazo = c.plazo_prestador_hasta;
    return {
      id: c.id,
      objetoTipo: String(c.objeto_tipo),
      objetoId: String(c.objeto_id),
      motivo: String(c.motivo_codigo),
      clase: Number(c.clase ?? 0),
      etapa,
      esFinal,
      conLaCasa: etapa === 'con_casa',
      plazoPrestadorHasta: plazo,
      plazoVencido: !esFinal && plazo !== null && new Date(plazo).getTime() < ahora,
      creadoEn: String(c.creado_en),
      relato: c.relato,
      resumen: c.resumen_confirmado,
      familiaUserId: c.familia_user_id,
      prestadorId: c.prestador_id,
    };
  });

  /* El orden de la casa, no el de la tabla: primero lo que le fue pedido,
     después lo vencido, después lo abierto, y lo cerrado al final. */
  const peso = (f: FilaBandeja) =>
    f.esFinal ? 3 : f.conLaCasa ? 0 : f.plazoVencido ? 1 : 2;
  filas.sort((a, b) => peso(a) - peso(b) || (a.creadoEn < b.creadoEn ? 1 : -1));
  return { ok: true, data: filas };
}

/** Un mensaje del hilo. */
export interface MensajeCaso {
  id: string;
  autor: string;
  tipo: string;
  cuerpo: string | null;
  creadoEn: string;
}

/** La plata del caso — las tres preguntas de §6, con sus ausencias declaradas. */
export interface PlataDelCaso {
  /** Lo que la familia pagó por el objeto. `null` = no se pudo determinar. */
  pagado: number | null;
  moneda: string;
  /** Techo de lo devolvible. Hoy = lo pagado; `null` si no se sabe cuánto se pagó. */
  devolvibleMaximo: number | null;
  /** id del evento económico vivo, o null. **Es el que decide el camino.** */
  eventoDevengoId: string | null;
  tieneDevengo: boolean;
  /** Por qué `pagado` es null, cuando lo es. Para que la Hoja lo diga. */
  porQueNoSeSabe: string | null;
}

export interface HojaDelCaso {
  casoId: string;
  etapa: string;
  clase: number;
  motivo: string;
  cerrado: boolean;
  estadoFinal: string | null;
  plazoHasta: string | null;
  accionPendiente: string | null;
  objeto: { tipo: string; id: string; titulo: string | null; fecha: string | null };
  resolucion: {
    alcance: string | null; monto: number | null; camino: string | null;
    destino: string | null; destinoEstado: string | null;
  };
  plata: PlataDelCaso;
  hilo: MensajeCaso[];
  /** Casos de ESA familia en 90 días, sin contar éste. De la casa, jamás se le dice. */
  casosFamilia90d: number;
  /** Casos de ESE prestador en 90 días, sin contar éste. */
  casosPrestador90d: number;
  /** 🔴 Siempre `null` hoy: no existe motor de propuesta. La Hoja lo dice. */
  propuesta: null;
  /** Quién decidió, si ya se decidió. §6: jamás se aplica sola. */
  decididoPor: string | null;
}

/**
 * LA HOJA DEL CASO — todo lo de §6 en una lectura.
 *
 * Junta cinco fuentes porque ninguna sola las tiene: `leer_caso` (con su gate
 * de tres asientos adentro), el hilo, el objeto para la plata,
 * `_caso_tiene_devengo`, y los contadores de 90 días.
 */
export async function obtenerHojaDelCaso(
  casoId: string,
): Promise<ResultadoWrapper<HojaDelCaso, CodigoErrorPostventa>> {
  const c = getClient();
  const rpc = c.rpc as unknown as (
    fn: string, args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;

  // ① El caso. Su gate de tres asientos vive DENTRO de la función.
  const { data: crudo, error: eCaso } = await rpc('leer_caso', { p_caso_id: casoId });
  if (eCaso) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };

  const caso = crudo as Record<string, unknown> | null;
  if (!caso || caso.ok !== true) {
    const cod = String((caso as { codigo?: string } | null)?.codigo ?? '');
    if (cod === 'no_existe') return { ok: false, codigo: 'no_existe', mensaje: MENSAJES.no_existe };
    if (cod === 'no_es_tuyo') return { ok: false, codigo: 'sin_permiso', mensaje: MENSAJES.sin_permiso };
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  const objeto = (caso.objeto ?? {}) as Record<string, unknown>;
  const resol = (caso.resolucion ?? {}) as Record<string, unknown>;
  const objetoTipo = String(objeto.tipo ?? '');
  const objetoId = String(objeto.id ?? '');

  // ② El hilo entero.
  const { data: msgCrudo } = await rpc('leer_mensajes_caso', {
    p_caso_id: casoId, p_limite: 200,
  });
  const msgs = ((msgCrudo as { mensajes?: unknown[] } | null)?.mensajes ?? []) as Record<string, unknown>[];
  const hilo: MensajeCaso[] = msgs.map((m) => ({
    id: String(m.id), autor: String(m.autor), tipo: String(m.tipo),
    cuerpo: (m.cuerpo as string | null) ?? null, creadoEn: String(m.creado_en),
  }));

  // ③ El devengo — la pregunta se le hace AL OBJETO, como hace `caso_resolver`.
  const { data: devengo } = await rpc('_caso_tiene_devengo', {
    p_tipo: objetoTipo, p_id: objetoId,
  });
  const eventoDevengoId = typeof devengo === 'string' && devengo ? devengo : null;

  // ④ Cuánto se pagó. Sale del objeto, y **por tipo**: no hay un campo común.
  const plata = await leerPlataDelObjeto(objetoTipo, objetoId, eventoDevengoId);

  // ⑤ Los contadores de 90 días. **De la casa** (§6): jamás se le dicen a la
  //    familia, y jamás se le niega nada por un número.
  const desde = new Date(Date.now() - 90 * 864e5).toISOString();
  const contar = async (col: 'familia_user_id' | 'prestador_id', val: string | null) => {
    if (!val) return 0;
    const { count } = await tablaCasos()
      .select('id', { count: 'exact', head: true })
      .eq(col, val)
      .gte('creado_en', desde)
      .neq('id', casoId);
    return count ?? 0;
  };

  const { data: filaCaso } = await tablaCasos()
    .select('familia_user_id, prestador_id, decidido_por, estado_final')
    .eq('id', casoId)
    .maybeSingle();

  return {
    ok: true,
    data: {
      casoId,
      etapa: String(caso.etapa ?? ''),
      clase: Number(caso.clase ?? 0),
      motivo: String(caso.motivo ?? ''),
      cerrado: caso.cerrado === true,
      estadoFinal: (caso.final as string | null) ?? null,
      plazoHasta: (caso.plazo_hasta as string | null) ?? null,
      accionPendiente: (caso.accion_pendiente as string | null) ?? null,
      objeto: {
        tipo: objetoTipo, id: objetoId,
        titulo: (objeto.titulo as string | null) ?? null,
        fecha: (objeto.fecha as string | null) ?? null,
      },
      resolucion: {
        alcance: (resol.alcance as string | null) ?? null,
        monto: resol.monto === null || resol.monto === undefined ? null : Number(resol.monto),
        camino: (resol.camino as string | null) ?? null,
        destino: (resol.destino as string | null) ?? null,
        destinoEstado: (resol.destino_estado as string | null) ?? null,
      },
      plata,
      hilo,
      casosFamilia90d: await contar('familia_user_id', filaCaso?.familia_user_id ?? null),
      casosPrestador90d: await contar('prestador_id', filaCaso?.prestador_id ?? null),
      propuesta: null,
      decididoPor: filaCaso?.decidido_por ?? null,
    },
  };
}

/**
 * CUÁNTO SE PAGÓ — por tipo de objeto, porque **no hay un campo común**.
 *
 * ⚠️ Y cuando no se sabe, se devuelve `null` **con su razón**, jamás 0. *Un 0
 * en «lo pagado» se lee como «esto fue gratis» y decide una devolución mal.*
 */
async function leerPlataDelObjeto(
  tipo: string, id: string, eventoDevengoId: string | null,
): Promise<PlataDelCaso> {
  const c = getClient();
  const base = {
    moneda: 'USD', eventoDevengoId, tieneDevengo: eventoDevengoId !== null,
  };

  if (tipo === 'cita') {
    const { data, error } = await c
      .from('evento_cita_servicio').select('precio').eq('id', id).maybeSingle();
    if (error || !data) {
      return { ...base, pagado: null, devolvibleMaximo: null,
        porQueNoSeSabe: 'No pudimos leer la cita de este caso.' };
    }
    const p = data.precio === null ? null : Number(data.precio);
    return { ...base, pagado: p, devolvibleMaximo: p,
      porQueNoSeSabe: p === null ? 'La cita no tiene precio registrado.' : null };
  }

  if (tipo === 'pedido') {
    const { data, error } = await c
      .from('pedidos').select('total').eq('id', id).maybeSingle();
    if (error || !data) {
      return { ...base, pagado: null, devolvibleMaximo: null,
        porQueNoSeSabe: 'No pudimos leer el pedido de este caso.' };
    }
    const t = data.total === null ? null : Number(data.total);
    return { ...base, pagado: t, devolvibleMaximo: t,
      porQueNoSeSabe: t === null ? 'El pedido no tiene total registrado.' : null };
  }

  /* `estadia` está en el catálogo de motivos y **no tiene lector de monto acá**.
     Se declara en vez de inventarse: la Hoja lo dice y la casa pone el monto a
     mano, que es exactamente lo que `caso_resolver` acepta con `parcial`. */
  return {
    ...base, pagado: null, devolvibleMaximo: null,
    porQueNoSeSabe:
      `No sabemos leer el monto de un objeto de tipo «${tipo}» todavía. ` +
      'La casa puede resolver igual indicando el monto a mano.',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   DECIDIR — un toque, por función, y queda `decidido_por`
   ═══════════════════════════════════════════════════════════════════════════ */

const CODIGOS_RES = [
  'sin_sesion', 'caso_no_existe', 'no_podes_resolver',
  'alcance_invalido', 'monto_requerido_en_parcial', 'error_desconocido',
] as const;
export type CodigoErrorResolver = (typeof CODIGOS_RES)[number];

const MENSAJES_RES: Record<CodigoErrorResolver, string> = {
  sin_sesion: 'No hay una sesión abierta.',
  caso_no_existe: 'Ese caso ya no existe.',
  no_podes_resolver: 'Tu cuenta no puede resolver este caso.',
  alcance_invalido: 'El alcance tiene que ser total, parcial o sin devolución.',
  monto_requerido_en_parcial: 'Una devolución parcial necesita su monto.',
  error_desconocido: 'No pudimos registrar la decisión.',
};

/** Los tres alcances que `caso_resolver` acepta, medidos de su cuerpo. */
export type AlcanceResolucion = 'total' | 'parcial' | 'sin_devolucion';

/**
 * RESOLVER — §6: «decidir es un toque», y la decisión **queda escrita**.
 *
 * No se toca `casos_postventa` directo: el grant lo impide (§9.1) y además la
 * RPC hace cosas que una pantalla no sabe — le pregunta el devengo AL OBJETO y
 * llama a `aplicar_reembolso`, que reversa la comisión proporcionalmente.
 * *Escribir el estado a mano dejaría plata sin reversar y el caso diría que sí.*
 */
export async function resolverCaso(params: {
  casoId: string;
  alcance: AlcanceResolucion;
  monto?: number | null;
  motivo?: string | null;
}): Promise<ResultadoWrapper<{ etapa: string | null }, CodigoErrorResolver>> {
  const rpc = getClient().rpc as unknown as (
    fn: string, args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;

  const { data, error } = await rpc('caso_resolver', {
    p_caso_id: params.casoId,
    p_alcance: params.alcance,
    p_monto: params.monto ?? null,
    p_motivo: params.motivo ?? null,
  });

  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES_RES.error_desconocido };

  /* La RPC devuelve `{ok:false, codigo}` en vez de lanzar: el rebote viaja en
     el `data`, no en el `error`. Leerlo del `error` daría éxito sobre un
     rechazo — el defecto que S107 midió en el actuador de pagos. */
  const r = data as Record<string, unknown> | null;
  if (!r || r.ok !== true) {
    const cod = String(r?.codigo ?? '') as CodigoErrorResolver;
    const conocido = (CODIGOS_RES as readonly string[]).includes(cod);
    return {
      ok: false,
      codigo: conocido ? cod : 'error_desconocido',
      mensaje: conocido ? MENSAJES_RES[cod] : MENSAJES_RES.error_desconocido,
      detalle: conocido ? null : String(r?.codigo ?? ''),
    };
  }
  return { ok: true, data: { etapa: (r.etapa as string | null) ?? null } };
}

/** Escribir en el hilo, como la casa. También por función. */
export async function responderEnCaso(
  casoId: string, texto: string,
): Promise<ResultadoWrapper<true, CodigoErrorResolver>> {
  const rpc = getClient().rpc as unknown as (
    fn: string, args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;

  const { data, error } = await rpc('caso_responder', { p_caso_id: casoId, p_texto: texto });
  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES_RES.error_desconocido };
  const r = data as Record<string, unknown> | null;
  if (!r || r.ok !== true) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES_RES.error_desconocido,
      detalle: String(r?.codigo ?? '') || null };
  }
  return { ok: true, data: true };
}
