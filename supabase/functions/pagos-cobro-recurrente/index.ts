// ═══════════════════════════════════════════════════════════════════════════
// S103-A · `pagos-cobro-recurrente` — LA HERMANA DE `pagos-cobro`, SIN NADIE
//          DEL OTRO LADO.
//
// La llama EL CRON (`cobrar-recurrencias`, 09:00 Guayaquil) a través del timbre
// `ejecutar_recurrencias_vencidas()`. Es la puerta que faltaba: hasta hoy el
// reloj sonaba y no había nadie atendiendo.
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 🔴 EL CONTRATO DE SEGURIDAD — el MISMO de `pagos-cobro`, con UN cambio  │
// │    y su porqué                                                          │
// │                                                                         │
// │ ① 🔴 NO HAY JWT DE USUARIO, Y NO SE FABRICA UNO.                        │
// │    `pagos-cobro` autoriza con la sesión de la familia porque HAY una    │
// │    familia mirando la pantalla. **Acá no hay nadie.** La autorización   │
// │    del cron es un SECRETO COMPARTIDO (patrón `D-713`, `_shared/despacho`)│
// │    — y `verify_jwt` no serviría: **la anon key ES un JWT válido** y      │
// │    viaja en el bundle de las apps.                                      │
// │                                                                         │
// │    ⛔ **PROHIBIDO POR FIRMA (`L-340`): fabricar un JWT de usuario con   │
// │       `service_role`.** *Un proceso de servidor que se disfraza de       │
// │       persona rompe toda auditoría posterior: el registro diría que lo   │
// │       hizo el cliente.*                                                 │
// │                                                                         │
// │ ①bis LA RAÍZ DE AUTORIZACIÓN VIVE EN LA FILA DE LA SERIE, no en esta    │
// │    llamada: **quién autorizó** (`user_id`), **cuándo** (`autorizada_en`) │
// │    y **sobre qué medio** (`tarjeta_id`). Sin las tres, no se cobra.      │
// │    *La sesión de `pagos-cobro` es una autorización del momento; acá la   │
// │     autorización es del pasado y tiene que estar ESCRITA, o no existe.*  │
// │                                                                         │
// │ ② 🔴 EL MONTO NO VIAJA DE NINGÚN LADO. No hay body: la edge no recibe   │
// │    ni ids. **Los sujetos los ELIGE la base** (los dos selectores) y el   │
// │    monto sale del desglose que ellos mismos congelaron.                  │
// │                                                                         │
// │ ③ PERTENENCIA: la tarjeta es del `user_id` de la serie, o corta.        │
// │                                                                         │
// │ ④ COMPUERTAS SERVER-SIDE ENTERAS (`verificar_compuertas_recurrencia`),   │
// │    con las DOS exclusiones de `LETRA_COBRO_RECURRENTE` §4bis viajando    │
// │    DECLARADAS en la respuesta.                                          │
// │                                                                         │
// │ ⑤ El débito con las credenciales SERVER, que jamás salen de acá.        │
// │                                                                         │
// │ ⑥ **NUNCA dice «pagado».** Lo dice el webhook a través del actuador, que │
// │    desde `20260822270000` conoce los cuatro sujetos y dispara el ACTO 2. │
// └─────────────────────────────────────────────────────────────────────────┘
//
// ── 🔴 EL PLAN DE PASEOS NO SE PUEDE COBRAR HOY, Y NO ES UN OLVIDO ─────────
// Medido antes de escribir una línea: **`suscripciones_servicio` no tiene
// columna de tarjeta, y `planes_vencidos_pendientes` nunca mira ninguna** — su
// ítem no emite `tarjeta_id`. ⇒ **la compuerta 5 de §4bis (*el medio
// autorizado*) es INEVALUABLE para planes.**
//
// **Esta función falla cerrado ahí**: los planes se listan como frenados con
// `sin_medio_autorizado` y **no se cobra ninguno**. *La alternativa sería
// adivinar cuál de las tarjetas de la persona autorizó una renovación que nadie
// registró — que es exactamente la clase de suposición que no se hace sobre
// plata.*
//
// 🟡 **Lo que falta es de MOTOR y de LETRA, no de esta puerta:** la suscripción
// tiene que registrar su medio y su `autorizada_en`, igual que
// `pedidos_recurrencias`. Hasta entonces **el frenado es la conducta correcta**,
// y esta función lo DICE en cada corrida en vez de callarlo.
//
// ── AMBIENTE ───────────────────────────────────────────────────────────────
// ⚠️ Sandbox de punta a punta. Y **el rojo esperado de `D-852` sigue vigente**:
// staging aparenta exigir `vat > 0`. No se re-diagnostica.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { crypto } from 'jsr:@std/crypto@1';
import { encodeHex } from 'jsr:@std/encoding@1/hex';
import { guardDespacho } from '../_shared/despacho.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const APP_CODE = Deno.env.get('NUVEI_APP_CODE_SERVER') ?? '';
const APP_KEY = Deno.env.get('NUVEI_APP_KEY_SERVER') ?? '';
const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';
const BASE = AMBIENTE === 'produccion'
  ? 'https://ccapi.paymentez.com'
  : 'https://ccapi-stg.paymentez.com';

/** 🔴 TECHO DURO POR CORRIDA. *Un lote sin techo convierte un defecto de
 *  selección en una tanda de cobros equivocados antes de que nadie mire.* Lo
 *  que sobra NO se pierde: queda para la corrida siguiente, porque el selector
 *  vuelve a elegirlo mientras no haya intento aprobado. */
const TECHO_POR_CORRIDA = 50;

/** Ventana de 15 s ⇒ se genera en el momento, jamás se cachea. */
async function authToken(): Promise<string> {
  const ts = Math.floor(Date.now() / 1000);
  const h = encodeHex(await crypto.subtle.digest('SHA-256',
    new TextEncoder().encode(`${APP_KEY}${ts}`)));
  return btoa(`${APP_CODE};${ts};${h}`);
}

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

type Item = {
  recurrencia_id: string; periodo: string; intento_id: string;
  user_id: string; tarjeta_id: string | null; monto: number; moneda: string;
  autorizada_en: string | null; reintentos: number;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, codigo: 'metodo_no_permitido' }, 405);

  // ── ① LA AUTORIZACIÓN DEL CRON — secreto compartido, jamás JWT ───────────
  const rechazo = guardDespacho(req);
  if (rechazo) return rechazo;

  if (!SUPABASE_URL || !SERVICE_ROLE || !APP_CODE || !APP_KEY) {
    return json({ ok: false, codigo: 'servidor_sin_configurar' }, 500);
  }

  /* 🔴 NO SE LEE EL BODY, Y ES DELIBERADO. `pagos-cobro` recibe ids porque la
     familia eligió qué pagar. Acá **los sujetos los elige la BASE**: aceptar
     ids abriría una puerta para cobrar una serie arbitraria con sólo tener el
     secreto del cron. *La superficie más chica posible es no tener parámetros.* */

  const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // ── LA BASE ELIGE Y CONGELA ─────────────────────────────────────────────
  const { data: selDespensa, error: eD } = await db.rpc('recurrencias_vencidas_pendientes');
  if (eD) return json({ ok: false, codigo: 'selector_despensa_fallo', detalle: eD.message }, 500);

  const { data: selPlanes, error: eP } = await db.rpc('planes_vencidos_pendientes');
  if (eP) return json({ ok: false, codigo: 'selector_planes_fallo', detalle: eP.message }, 500);

  const sel = (selDespensa ?? {}) as Record<string, unknown>;
  const planes = (selPlanes ?? {}) as Record<string, unknown>;
  const listas = (sel.para_cobrar ?? []) as Item[];

  /* 🔴 LOS PLANES SE FRENAN ENTEROS. Ver la cabecera: su serie no registra
     medio autorizado, así que la compuerta 5 es inevaluable. **Se declara uno
     por uno, no como un total** — un número agregado esconde a quién le pasó. */
  const planesFrenados = ((planes.para_cobrar ?? []) as Array<Record<string, unknown>>)
    .map((p) => ({
      suscripcion_id: p.suscripcion_id, periodo: p.periodo,
      motivo: 'sin_medio_autorizado',
      porque: 'la suscripcion no registra tarjeta ni autorizada_en; la compuerta 5 de §4bis es inevaluable y no se adivina',
    }));

  const cobrados: unknown[] = [];
  const frenados: unknown[] = [
    ...((sel.frenadas ?? []) as unknown[]),
    ...((planes.frenadas ?? []) as unknown[]),
    ...planesFrenados,
  ];
  let pospuestos = 0;

  for (const it of listas) {
    if (cobrados.length >= TECHO_POR_CORRIDA) { pospuestos++; continue; }

    // ── ①bis LA RAÍZ DE AUTORIZACIÓN, en la fila de la serie ──────────────
    /* Las TRES juntas o no se cobra: **quién** autorizó, **cuándo**, y **sobre
       qué medio**. El selector ya frena las que no tienen tarjeta; esto es el
       cinturón de esta puerta, y no sobra: *el día que el selector cambie, esta
       función no puede quedarse cobrando por inercia.* */
    if (!it.tarjeta_id || !it.user_id || !it.autorizada_en) {
      frenados.push({
        recurrencia_id: it.recurrencia_id, periodo: it.periodo,
        motivo: 'raiz_de_autorizacion_incompleta',
        falta: [!it.user_id && 'quien', !it.autorizada_en && 'cuando',
                !it.tarjeta_id && 'sobre_que_medio'].filter(Boolean),
      });
      continue;
    }

    // ── ③ PERTENENCIA — la tarjeta es de quien autorizó ───────────────────
    const { data: tarjeta } = await db.from('tarjetas_guardadas')
      .select('id, user_id, token, estado, proveedor_uid').eq('id', it.tarjeta_id).maybeSingle();
    if (!tarjeta || tarjeta.user_id !== it.user_id || tarjeta.estado !== 'guardada') {
      frenados.push({ recurrencia_id: it.recurrencia_id, periodo: it.periodo,
                      motivo: 'medio_no_disponible' });
      continue;
    }
    /* Sin `proveedor_uid` no se puede cobrar esa tarjeta: **no se adivina**. */
    const uidProveedor = (tarjeta as { proveedor_uid?: string | null }).proveedor_uid ?? '';
    if (!uidProveedor) {
      frenados.push({ recurrencia_id: it.recurrencia_id, periodo: it.periodo,
                      motivo: 'tarjeta_sin_uid' });
      continue;
    }

    // ── ④ COMPUERTAS SERVER-SIDE, ENTERAS ─────────────────────────────────
    /* 🔴 SE CORREN OTRA VEZ, aunque el selector ya las corrió. No es
       duplicación: entre la selección y el cobro hay tiempo, y **la compuerta 0
       —intento en vuelo— es la única defensa cuando no hay nadie mirando.**
       Un cron que corre dos veces no cobra dos veces, y esto es lo que lo
       sostiene. */
    const { data: g } = await db.rpc('verificar_compuertas_recurrencia', {
      p_recurrencia_id: it.recurrencia_id, p_periodo: it.periodo,
    });
    const gate = (g ?? {}) as Record<string, unknown>;
    if (gate.ok !== true) {
      frenados.push({
        recurrencia_id: it.recurrencia_id, periodo: it.periodo,
        motivo: gate.codigo ?? 'compuerta_sin_codigo',
        no_evaluables: gate.no_evaluables ?? [],
      });
      continue;
    }

    // ── ② EL MONTO, RE-LEÍDO DEL DESGLOSE CONGELADO ───────────────────────
    /* No se usa el `monto` que trae el ítem del selector. *Ese número es
       correcto hoy, pero pasa por una capa más; el desglose es la fuente.*
       Es la misma disciplina de `pagos-cobro`: **el monto se lee, nunca se
       recibe** — ni siquiera de nosotros mismos. */
    const { data: d } = await db.from('recurrencia_desglose')
      .select('subtotal, impuesto, envio, total, moneda')
      .eq('recurrencia_id', it.recurrencia_id).eq('periodo', it.periodo).maybeSingle();
    if (!d) {
      frenados.push({ recurrencia_id: it.recurrencia_id, periodo: it.periodo,
                      motivo: 'desglose_incompleto' });
      continue;
    }
    const monto = Number(d.total ?? 0);
    const iva = Number(d.impuesto ?? 0);
    const base = Number(d.subtotal ?? 0) + Number(d.envio ?? 0);
    const moneda = d.moneda ?? 'USD';
    const pct = base > 0 ? Number(((iva / base) * 100).toFixed(2)) : 0;

    /* 🔴 FAIL-CLOSED HONESTO con IVA ≠ 0 — idéntico a `pagos-cobro`: es
       territorio que nadie probó contra esta cuenta, y mandar ceros con un IVA
       real sería declararle al proveedor algo falso sobre la venta. */
    if (iva > 0) {
      await db.from('pagos_intentos').update({
        estado: 'rechazado',
        motivo_rechazo: `iva_no_cero_sin_probar: iva=${iva} pct=${pct}`,
        cerrado_en: new Date().toISOString(),
      }).eq('id', it.intento_id);
      frenados.push({ recurrencia_id: it.recurrencia_id, periodo: it.periodo,
                      motivo: 'iva_no_probado' });
      continue;
    }

    // ── ⑤ EL DÉBITO ───────────────────────────────────────────────────────
    /* El intento ya existe: **lo creó el selector, ANTES de que nadie
       disparara.** Es lo único que prueba que se disparó si perdemos la
       respuesta — y es lo que el barrido va a encontrar. */
    let status = 0; let jsonResp: Record<string, unknown> = {};
    try {
      const r = await fetch(`${BASE}/v2/transaction/debit/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Auth-Token': await authToken() },
        body: JSON.stringify({
          /* El uid ES el del proveedor, no el nuestro (medido en S101). */
          user: { id: uidProveedor, email: 'sin-correo@epetplace.com' },
          order: {
            amount: Number(monto.toFixed(2)),
            description: `e-PetPlace recurrente ${it.recurrencia_id.slice(0, 8)}`,
            /* 🔴 EL SUJETO es la SERIE, y por eso el actuador la reconoce: su
               rama nueva resuelve el intento desde `recurrencia_id`. */
            dev_reference: it.recurrencia_id,
            vat: Number(iva.toFixed(2)),
            taxable_amount: iva > 0 ? Number(base.toFixed(2)) : 0,
            tax_percentage: pct,
          },
          card: { token: tarjeta.token },
        }),
      });
      status = r.status;
      const crudo = (await r.text()).slice(0, 4000);
      try { jsonResp = JSON.parse(crudo); } catch { /* el crudo queda igual */ }
    } catch (e) {
      /* 🔴 Red caída ≠ rechazo. **El intento queda EN VUELO a propósito** y el
         barrido lo va a encontrar. *Cerrarlo como rechazado por no haber podido
         preguntar es cómo se pierde un cobro que sí ocurrió.* */
      await db.from('pagos_intentos').update({
        motivo_rechazo: `red: ${String(e).slice(0, 200)}`,
        payload_crudo: { error: String(e) },
      }).eq('id', it.intento_id);
      frenados.push({ recurrencia_id: it.recurrencia_id, periodo: it.periodo,
                      motivo: 'sin_respuesta', en_vuelo: true });
      continue;
    }

    const tx = (jsonResp.transaction ?? {}) as Record<string, unknown>;
    const aprobado = status >= 200 && status < 300 &&
      (tx.status === 'success' || tx.status === 'approved');
    const err = (jsonResp.error ?? {}) as Record<string, unknown>;

    /* 🔴 EL MOTIVO JAMÁS QUEDA NULL (`L-316`), con `http_<status>` de último
       recurso. Y **la causa fina del rechazo espera la tabla de `status_detail`
       de Erick**: el cajón está construido, la etiqueta NO se adivina. */
    const motivo = aprobado ? null : [
      err.type, err.description, tx.message, tx.status_detail,
    ].filter(Boolean).join(': ').slice(0, 400) || `http_${status}`;

    await db.from('pagos_intentos').update({
      estado: aprobado ? 'pendiente' : 'rechazado',
      proveedor_transaction_id: typeof tx.id === 'string' ? tx.id : null,
      authorization_code: typeof tx.authorization_code === 'string' ? tx.authorization_code : null,
      motivo_rechazo: motivo,
      cerrado_en: aprobado ? null : new Date().toISOString(),
      payload_crudo: jsonResp,
    }).eq('id', it.intento_id);

    if (!aprobado) {
      /* 🔴 El fallo se ANOTA EN LA SERIE, no sólo en el intento. *Sin esto, una
         serie que falla todos los meses se ve igual que una que falló hoy.* */
      await db.from('pedidos_recurrencias').update({
        reintentos: (it.reintentos ?? 0) + 1,
        ultimo_fallo_en: new Date().toISOString(),
        ultimo_fallo_causa: motivo,
      }).eq('id', it.recurrencia_id);
      frenados.push({ recurrencia_id: it.recurrencia_id, periodo: it.periodo,
                      motivo: 'rechazado', causa: motivo });
      continue;
    }

    /* ⑥ **Acá NADIE dice «pagado».** El intento queda `pendiente`; lo confirma
       el webhook a través del actuador, que desde `20260822270000` conoce los
       cuatro sujetos y dispara el ACTO 2 (`crear_pedido_de_recurrencia_cobrada`). */
    cobrados.push({ recurrencia_id: it.recurrencia_id, periodo: it.periodo,
                    intento_id: it.intento_id, señal: 'optimista' });
  }

  return json({
    ok: true,
    ambiente: AMBIENTE,
    fecha: sel.fecha ?? null,
    disparados: cobrados.length,
    frenados: frenados.length,
    pospuestos_por_techo: pospuestos,
    /* Las DOS exclusiones de §4bis viajan DECLARADAS, también cuando todo sale
       bien: *sin esto, un lector futuro va a creer que se olvidaron.* */
    no_aplican: ['1 · reserva de stock — §6 manda cobrar ANTES de que exista el pedido'],
    no_evaluables: ['3 · cobertura — no se verificó nada de cobertura'],
    detalle: { cobrados, frenados },
  });
});
