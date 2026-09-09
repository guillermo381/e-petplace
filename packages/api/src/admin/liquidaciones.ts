/**
 * LIQUIDACIÓN AL PRESTADOR — la primera puerta del portal (S114-F, tanda 1).
 *
 * Contrato: `MODELO_FINANCIERO` §4.1 (`eventos_economicos`, `liquidaciones`,
 * `liquidacion_eventos`), §4.3 (`generar_liquidacion`) y **Decisión B**
 * —*liquidación única por cuenta+país+período*—, leídos ANTES de escribir esto.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 LO QUE ESTA PANTALLA TIENE QUE PODER DECIR SIN MENTIR
 *
 * Medido el 7-sep-2026 contra producción:
 *
 *   citas con estado_reserva='pagada' ………………………………… 329
 *   de ésas, SIN evento económico ……………………………………… 293   (89 %)
 *   eventos_economicos (todos 'pendiente_liquidar') ……  36
 *   liquidaciones generadas en la historia ………………………   0
 *
 * *(comando: `supabase db query` sobre `evento_cita_servicio` y
 * `eventos_economicos` — la query completa vive en el parte de F.)*
 *
 * **Los cuatro productores de evento faltan y los está construyendo A.** Por
 * eso este wrapper devuelve DOS magnitudes por prestador y jamás una sola:
 *
 *   · `liquidable`     — lo que YA tiene evento y se puede pagar hoy
 *   · `cobradoSinDevengar` — citas pagadas cuyo evento todavía no existe
 *
 * ⚠️ **Y por eso `$0` acá sería falso, no vacío.** Un prestador con 40 citas
 * cobradas y cero eventos no tiene «nada que cobrar»: tiene plata cobrada que
 * el motor todavía no devengó. *Mostrar `$0` sin la segunda magnitud sería la
 * clase de dato plausible y falso que esta casa persigue* — y encima sobre
 * plata de un tercero. **Este wrapper NO cura el hueco: lo hace decible.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── POR QUÉ SE AGRUPA EN EL CLIENTE, DECLARADO Y NO ESCONDIDO ─────────────
 * No hay función de lectura para esto: el relevamiento midió **115 funciones
 * con `is_admin` en la base y CERO wrappers**, y ninguna de ellas agrega
 * pendientes por cuenta. Con 36 eventos y 329 citas la agregación en memoria
 * es honesta y barata. **A escala deja de serlo**, y su cura no es un caché
 * acá: es una función que agregue server-side. Queda anotado en el parte.
 *
 * ── LA LECTURA VA POR RLS, LA ESCRITURA POR FUNCIÓN (letra §3⑥) ──────────
 * Las cuatro tablas financieras tienen policy `admin_all_*[ALL]` con
 * `is_admin()`, medido. Leer con `.from()` es la puerta legítima. **Generar
 * NO**: aunque esa misma policy permitiría un INSERT directo, la letra lo
 * prohíbe y el motor tiene su función. Ver `generarLiquidacion` abajo.
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS = ['sin_permiso', 'error_desconocido'] as const;
export type CodigoErrorLiquidacion = (typeof CODIGOS)[number];

const MENSAJES: Record<CodigoErrorLiquidacion, string> = {
  sin_permiso: 'Tu cuenta no puede ver las liquidaciones.',
  error_desconocido: 'No pudimos leer los eventos económicos.',
};

/** Un prestador y las DOS magnitudes de su plata. */
export interface FilaLiquidable {
  cuentaComercialId: string;
  /** Nombre del negocio. Puede haber más de un prestador por cuenta
   *  (Decisión B: la liquidación es por CUENTA, no por prestador). */
  nombres: string[];
  countryCode: string;
  moneda: string;
  /** Lo que ya tiene evento y se puede liquidar hoy. */
  liquidable: number;
  eventosCount: number;
  /** Citas pagadas de sus prestadores cuyo evento económico NO existe todavía.
   *  NO es plata liquidable: es plata cobrada que el motor no devengó. */
  cobradoSinDevengar: number;
  citasSinEventoCount: number;
  /** La cuenta puede cobrar (activa + datos bancarios). Sin esto, generar la
   *  liquidación produce una transferencia que nadie puede ejecutar. */
  cuentaActiva: boolean;
  tieneDatosBancarios: boolean;
}

interface FilaEventoCrudo {
  id: string;
  cuenta_comercial_id: string | null;
  country_code: string;
  moneda: string;
  monto_payout: number;
  fecha_devengo: string;
  estado: string;
}

/**
 * QUÉ SE LE DEBE A CADA PRESTADOR.
 *
 * Devuelve una fila por CUENTA COMERCIAL (Decisión B), no por prestador: un
 * actor multi-sede o multi-rol cobra **una sola transferencia**. Los nombres
 * de sus prestadores viajan en `nombres` para que la pantalla pueda decir de
 * quién se trata sin inventar una agrupación que el modelo no tiene.
 */
export async function obtenerCuentasLiquidables(): Promise<
  ResultadoWrapper<FilaLiquidable[], CodigoErrorLiquidacion>
> {
  const c = getClient();

  // ① Los eventos pendientes. La RLS admin decide si se ven.
  const { data: eventos, error: eErr } = await c
    .from('eventos_economicos')
    .select('id, cuenta_comercial_id, country_code, moneda, monto_payout, fecha_devengo, estado')
    .eq('estado', 'pendiente_liquidar');

  if (eErr) {
    /* Un 42501 acá NO se disfraza de lista vacía (L-178): una lista vacía se
       leería como «no hay nada que pagar», que sobre plata de terceros es la
       mentira más cara que esta pantalla puede decir. */
    return { ok: false, codigo: 'sin_permiso', mensaje: MENSAJES.sin_permiso };
  }

  // ② Los prestadores con su cuenta, para poder nombrar a quién se le paga.
  const { data: prestadores, error: pErr } = await c
    .from('prestadores')
    .select('id, nombre_comercial, cuenta_comercial_id')
    .not('cuenta_comercial_id', 'is', null);

  if (pErr) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  // ③ Las cuentas, para saber si pueden cobrar de verdad.
  const { data: cuentas, error: cErr } = await c
    .from('cuentas_comerciales')
    .select('id, estado, datos_bancarios, country_code');

  if (cErr) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  // ④ EL HUECO: citas pagadas sin evento económico.
  const { data: citas, error: ciErr } = await c
    .from('evento_cita_servicio')
    .select('id, prestador_id, precio')
    .eq('estado_reserva', 'pagada')
    .not('prestador_id', 'is', null);

  if (ciErr) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  const { data: origenes, error: oErr } = await c
    .from('eventos_economicos')
    .select('origen_id')
    .eq('origen_tipo', 'cita');

  if (oErr) {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }

  const conEvento = new Set((origenes ?? []).map((o) => o.origen_id));

  // ── Armado ──────────────────────────────────────────────────────────────
  const cuentaDePrestador = new Map<string, string>();
  const nombresPorCuenta = new Map<string, string[]>();
  for (const p of prestadores ?? []) {
    const cc = p.cuenta_comercial_id;
    if (!cc) continue;
    cuentaDePrestador.set(p.id, cc);
    const lista = nombresPorCuenta.get(cc) ?? [];
    lista.push(p.nombre_comercial ?? 'Sin nombre');
    nombresPorCuenta.set(cc, lista);
  }

  const acc = new Map<string, FilaLiquidable>();

  const tomar = (cuentaId: string, country: string, moneda: string): FilaLiquidable => {
    let f = acc.get(cuentaId);
    if (!f) {
      const cta = (cuentas ?? []).find((x) => x.id === cuentaId);
      const db = cta?.datos_bancarios as Record<string, unknown> | null;
      f = {
        cuentaComercialId: cuentaId,
        nombres: nombresPorCuenta.get(cuentaId) ?? [],
        countryCode: country || cta?.country_code || '',
        moneda,
        liquidable: 0,
        eventosCount: 0,
        cobradoSinDevengar: 0,
        citasSinEventoCount: 0,
        cuentaActiva: cta?.estado === 'activa',
        /* «Tiene datos bancarios» = el jsonb tiene claves. No se valida su
           forma acá: eso lo hacen los CHECK de `cuentas_comerciales` (§4.1).
           Acá sólo se distingue vacío de no vacío, que es lo que la pantalla
           necesita para no prometer una transferencia imposible. */
        tieneDatosBancarios: !!db && Object.keys(db).length > 0,
      };
      acc.set(cuentaId, f);
    }
    return f;
  };

  for (const ev of (eventos ?? []) as FilaEventoCrudo[]) {
    if (!ev.cuenta_comercial_id) continue; // NULL = revenue puro plataforma (§4.1)
    const f = tomar(ev.cuenta_comercial_id, ev.country_code, ev.moneda);
    f.liquidable += Number(ev.monto_payout ?? 0);
    f.eventosCount += 1;
  }

  for (const ci of citas ?? []) {
    if (conEvento.has(ci.id)) continue;
    const cc = ci.prestador_id ? cuentaDePrestador.get(ci.prestador_id) : undefined;
    if (!cc) continue; // prestador sin cuenta comercial: no hay a quién liquidar
    const f = tomar(cc, '', '');
    /* Es el PRECIO de la cita, no el payout: el payout lo calcula el motor al
       crear el evento (fee snapshot, §3.2) y acá ese cálculo no existe todavía.
       La pantalla lo dice como «cobrado», jamás como «a pagar». */
    f.cobradoSinDevengar += Number(ci.precio ?? 0);
    f.citasSinEventoCount += 1;
  }

  const filas = [...acc.values()].sort((a, b) => b.liquidable - a.liquidable);
  return { ok: true, data: filas };
}

/** Un evento, como lo ve la pantalla de detalle. */
export interface EventoDetalle {
  id: string;
  tipoEvento: string;
  revenueStream: string;
  moneda: string;
  montoBruto: number;
  montoPlataforma: number;
  montoPayout: number;
  fechaDevengo: string;
  origenTipo: string;
  origenId: string;
}

/** EL DETALLE POR EVENTO de una cuenta — la fila de abajo del número. */
export async function obtenerEventosDeCuenta(
  cuentaComercialId: string,
): Promise<ResultadoWrapper<EventoDetalle[], CodigoErrorLiquidacion>> {
  const { data, error } = await getClient()
    .from('eventos_economicos')
    .select(
      'id, tipo_evento, revenue_stream, moneda, monto_bruto, monto_plataforma, monto_payout, fecha_devengo, origen_tipo, origen_id',
    )
    .eq('cuenta_comercial_id', cuentaComercialId)
    .eq('estado', 'pendiente_liquidar')
    .order('fecha_devengo', { ascending: false });

  if (error) {
    return { ok: false, codigo: 'sin_permiso', mensaje: MENSAJES.sin_permiso };
  }

  return {
    ok: true,
    data: (data ?? []).map((e) => ({
      id: e.id,
      tipoEvento: String(e.tipo_evento),
      revenueStream: String(e.revenue_stream),
      moneda: e.moneda,
      montoBruto: Number(e.monto_bruto ?? 0),
      montoPlataforma: Number(e.monto_plataforma ?? 0),
      montoPayout: Number(e.monto_payout ?? 0),
      fechaDevengo: e.fecha_devengo,
      origenTipo: String(e.origen_tipo),
      origenId: String(e.origen_id),
    })),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   GENERAR LA LIQUIDACIÓN — la escritura, y va por función (letra §3⑥)
   ═══════════════════════════════════════════════════════════════════════════ */

const CODIGOS_GEN = [
  'no_sos_admin',
  'periodo_incompleto',
  'periodo_invertido',
  'cuenta_no_activa',
  'sin_eventos_en_periodo',
  'error_desconocido',
] as const;
export type CodigoErrorGenerar = (typeof CODIGOS_GEN)[number];

const MENSAJES_GEN: Record<CodigoErrorGenerar, string> = {
  no_sos_admin: 'Tu cuenta no puede generar liquidaciones.',
  periodo_incompleto: 'Falta la fecha de inicio o de fin del período.',
  periodo_invertido: 'La fecha de fin es anterior a la de inicio.',
  cuenta_no_activa:
    'La cuenta comercial no está activa: no se le puede transferir todavía.',
  sin_eventos_en_periodo:
    'No hay eventos pendientes en ese período. No se generó nada.',
  error_desconocido: 'No pudimos generar la liquidación.',
};

/**
 * Llama a `admin_generar_liquidacion` (migración `20260911500000`), que es la
 * puerta con gate `is_admin` sobre `generar_liquidacion` del motor (§4.3).
 *
 * **No se inserta en `liquidaciones` directo** aunque la policy `admin_all_*`
 * lo permitiría: la letra §3⑥ lo prohíbe y el motor sabe cosas que una
 * pantalla no —anti-solapamiento, saldo de arrastre, numeración—. *Un INSERT
 * a mano produciría una liquidación que parece correcta y no cuadra.*
 *
 * ⚠️ **Los códigos se leen del `codigo`, jamás del mensaje** (regla 35). El
 * motor los emite como `RAISE EXCEPTION '<codigo>'`; PostgREST los devuelve en
 * el campo `message`, y acá se traducen UNA vez a un código tipado. Si el
 * texto del motor cambiara, esta traducción es el único lugar que se toca.
 */
export async function generarLiquidacion(params: {
  cuentaComercialId: string;
  countryCode: string;
  periodoInicio: string; // YYYY-MM-DD
  periodoFin: string;    // YYYY-MM-DD
}): Promise<ResultadoWrapper<{ liquidacionId: string }, CodigoErrorGenerar>> {
  /* 🔴 EL CAST, Y POR QUÉ NO ES PEREZA — es la frontera de §3③ funcionando.
     `admin_generar_liquidacion` EXISTE en la base (migración `20260911500000`,
     verificada contra el objeto: `existe=1`), pero NO figura en
     `packages/api/src/database.types.ts` porque ese archivo es **generado** y
     vive fuera de `src/admin/` ⇒ **es de A y F no lo toca**.
     Regenerarlo (`pnpm gen:types`) es el acto que borra este cast, y está
     pedido por nombre en `docs/loop/S114-F-PEDIDOS-A.md`.
     *Se deja anotado acá y no sólo en el pedido: quien lea este archivo dentro
     de dos sesiones tiene que poder ver por qué hay un cast y cuándo se va.* */
  /* 🔴 En la MISMA expresión, sin extraer el método: `SupabaseClient.rpc()`
     usa `this` adentro, y desligado lanza «Cannot read properties of undefined
     (reading 'rest')» dentro de la librería minificada. Colgó la Hoja del caso
     en producción; acá estaba la misma forma esperando su turno. */
  const c = getClient() as unknown as {
    rpc: (f: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
  };
  const rpc = (f: string, a: Record<string, unknown>) => c.rpc(f, a);

  const { data, error } = await rpc('admin_generar_liquidacion', {
    p_cuenta_comercial_id: params.cuentaComercialId,
    p_country_code: params.countryCode,
    p_periodo_inicio: params.periodoInicio,
    p_periodo_fin: params.periodoFin,
  });

  if (error) {
    const crudo = `${error.message ?? ''}`;
    const codigo = (CODIGOS_GEN.find((c) => c !== 'error_desconocido' && crudo.includes(c)) ??
      'error_desconocido') as CodigoErrorGenerar;
    return { ok: false, codigo, mensaje: MENSAJES_GEN[codigo], detalle: crudo || null };
  }

  if (typeof data !== 'string' || data.length === 0) {
    /* El motor devuelve el uuid de la liquidación. Sin uuid no se sabe qué se
       generó, y decir «listo» sin poder mostrar qué se generó es peor que
       fallar (L-178: un resultado ausente no se disfraza de éxito). */
    return {
      ok: false,
      codigo: 'datos_inconsistentes',
      mensaje: 'La liquidación se generó pero no devolvió su identificador.',
    };
  }

  return { ok: true, data: { liquidacionId: data } };
}
