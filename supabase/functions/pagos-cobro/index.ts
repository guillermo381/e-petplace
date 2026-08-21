// ═══════════════════════════════════════════════════════════════════════════
// S101-B · `pagos-cobro` — EL COBRO. **Es PRODUCTO, no andamio.**
//
// La llama la APP, con la sesión de la familia. Es la única puerta por la que
// se dispara un débito desde el cliente.
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 🔴 EL CONTRATO DE SEGURIDAD, ENTERO — y cada punto tiene su porqué      │
// │                                                                         │
// │ ① AUTORIZA EL JWT DEL USUARIO. No un secreto compartido, no un handle. │
// │    *A diferencia de la página del alta —que corre en un navegador sin  │
// │    sesión— acá HAY sesión, y esa sesión ES la autorización.* Un secreto │
// │    compartido acá sería un secreto que la app tendría que llevar, y una │
// │    app publicada no guarda secretos.                                    │
// │                                                                         │
// │ ② 🔴 EL MONTO JAMÁS VIAJA DEL CLIENTE. La app manda IDS y nada más.    │
// │    El monto se LEE del desglose congelado, server-side.                 │
// │    *Si el monto llegara del cliente, la compuerta 2 estaría verificando │
// │    un número contra sí mismo — y un cobro por un monto que no es el     │
// │    nuestro es el defecto más caro posible.*                             │
// │                                                                         │
// │ ③ PERTENENCIA: la compra y la tarjeta son del usuario del JWT, o corta. │
// │    *Sin esto, un id ajeno alcanzaría para cobrarle a otro.*             │
// │                                                                         │
// │ ④ COMPUERTAS SERVER-SIDE, con el candado de idempotencia contra         │
// │    intentos REALES. Las de la app son para hablar temprano; **las que   │
// │    protegen son estas**, porque el cliente no las puede saltear.        │
// │                                                                         │
// │ ⑤ El débito con las credenciales SERVER, que jamás salen de acá.        │
// │                                                                         │
// │ ⑥ Devuelve SEÑAL OPTIMISTA tipada. **Nunca dice «pagado»:** eso lo dice │
// │    el webhook, o el barrido mismo-día.                                  │
// └─────────────────────────────────────────────────────────────────────────┘
//
// ⚠️ **ROJO ESPERADO (firma del founder):** hoy el débito rebota en
//    `order.vat` — staging aparenta exigir `vat > 0` y el catálogo es
//    `EC_IVA_0`. **No es nuestro código, está en `D-852`, y NO se
//    re-diagnostica.** Se construye igual: el flujo tiene que existir entero
//    para que el día que el vat se destrabe no quede nada por hacer.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { crypto } from 'jsr:@std/crypto@1';
import { encodeHex } from 'jsr:@std/encoding@1/hex';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const APP_CODE = Deno.env.get('NUVEI_APP_CODE_SERVER') ?? '';
const APP_KEY = Deno.env.get('NUVEI_APP_KEY_SERVER') ?? '';
const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';
const BASE = AMBIENTE === 'produccion'
  ? 'https://ccapi.paymentez.com'
  : 'https://ccapi-stg.paymentez.com';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ventana de 15 s ⇒ **se genera en el momento**, jamás se cachea. */
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

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, codigo: 'metodo_no_permitido' }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE || !APP_CODE || !APP_KEY) {
    return json({ ok: false, codigo: 'servidor_sin_configurar' }, 500);
  }

  // ── ① LA SESIÓN ES LA AUTORIZACIÓN ────────────────────────────────────────
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return json({ ok: false, codigo: 'sin_sesion' }, 401);

  const comoUsuario = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: auth } }, auth: { persistSession: false },
  });
  const { data: u, error: eU } = await comoUsuario.auth.getUser();
  /* 🔴 El error se distingue del ausente: «no hay sesión» y «la sesión no se
     pudo verificar» son cosas distintas, y tratarlas igual esconde una caída
     del proveedor de auth detrás de un 401 que parece del usuario. */
  if (eU) return json({ ok: false, codigo: 'sesion_no_verificable' }, 503);
  if (!u?.user) return json({ ok: false, codigo: 'sin_sesion' }, 401);
  const userId = u.user.id;

  // ── La app manda IDS. Nada más. ───────────────────────────────────────────
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  /* ═══ 🔴 S101-C · EL SUJETO DEL COBRO — compra O cita, EXACTAMENTE UNO ═════
     La letra `LETRA_PAGO_CITAS` §1 lo dice y el motor lo cumple sin
     reescribirse: **la cita entra como lo que es, jamás disfrazada de compra.**
     Todo lo que sigue —pertenencia, monto del desglose congelado, compuertas,
     intento antes de disparar, débito, señal optimista— **es idéntico**. Lo
     único que cambia es qué objeto se resuelve. */
  const compraId = typeof body.compra_id === 'string' ? body.compra_id : '';
  const citaId = typeof body.cita_id === 'string' ? body.cita_id : '';
  const tarjetaId = typeof body.tarjeta_id === 'string' ? body.tarjeta_id : '';
  const hayCompra = UUID_RE.test(compraId);
  const hayCita = UUID_RE.test(citaId);
  /* 🔴 «Exactamente uno» también en la puerta, no solo en el CHECK: *un
     llamador que manda los dos no está pidiendo dos cosas — está pidiendo algo
     que no existe, y adivinar cuál quiso es cómo se cobra el objeto
     equivocado.* */
  if (hayCompra === hayCita || !UUID_RE.test(tarjetaId)) {
    return json({ ok: false, codigo: 'datos_invalidos' }, 400);
  }
  /* 🔴 Si alguna vez llega un `monto`, es señal de que un llamador cree que
     puede fijarlo. Se rechaza en vez de ignorarlo: *ignorarlo dejaría vivo un
     cliente que se cree con esa facultad, y el día que el server confíe, cobra
     lo que el cliente diga.* */
  if ('monto' in body || 'amount' in body || 'total' in body) {
    return json({ ok: false, codigo: 'monto_no_se_recibe' }, 400);
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // ── ③ PERTENENCIA ─────────────────────────────────────────────────────────
  /* 🔴 La respuesta es la MISMA para «no existe» y «es de otro» — en los dos
     sujetos. *Distinguirlas convertiría esto en un oráculo de compras o de
     citas ajenas.* */
  let moneda = 'USD';
  if (hayCompra) {
    const { data: compra } = await db.from('compras')
      .select('id, user_id, moneda').eq('id', compraId).maybeSingle();
    if (!compra || compra.user_id !== userId) {
      return json({ ok: false, codigo: 'compra_no_existe' }, 409);
    }
    moneda = compra.moneda ?? 'USD';
  } else {
    /* La cita no tiene `user_id`: pertenece a una MASCOTA, y el acceso lo dice
       la familia. Se pregunta por el camino de la casa —`user_tiene_acceso_a_mascota`
       vía la vista de la cita— en vez de inventar una regla nueva. */
    const { data: cita } = await db.from('evento_cita_servicio')
      .select('id, mascota_id, estado_reserva').eq('id', citaId).maybeSingle();
    if (!cita) return json({ ok: false, codigo: 'cita_no_existe' }, 409);
    /* 🔴 La variante CON USUARIO EXPLÍCITO, no la de `auth.uid()`: acá el
       cliente corre con `service_role` y `auth.uid()` es NULL — la original
       diría que no siempre. *Es la misma trampa que el `uid` del proveedor: una
       función correcta que, llamada desde otro lado, contesta otra cosa.*
       Y es la MISMA implementación que usan las 62 policies: el original
       delega en ésta. */
    const { data: puede } = await db.rpc('user_tiene_acceso_a_mascota_como', {
      p_user_id: userId, p_mascota_id: cita.mascota_id,
    });
    if (puede !== true) return json({ ok: false, codigo: 'cita_no_existe' }, 409);
  }

  const { data: tarjeta } = await db.from('tarjetas_guardadas')
    .select('id, user_id, token, estado, proveedor_uid').eq('id', tarjetaId).maybeSingle();
  if (!tarjeta || tarjeta.user_id !== userId || tarjeta.estado !== 'guardada') {
    return json({ ok: false, codigo: 'token_ausente' }, 409);
  }

  /* Sin `proveedor_uid` no se puede cobrar esa tarjeta: **no se adivina**.
     *Mandar el id de auth «por si acaso» es exactamente lo que produjo el
     rebote que esta cura corrige.* */
  const uidProveedor = (tarjeta as { proveedor_uid?: string | null }).proveedor_uid ?? '';
  if (!uidProveedor) return json({ ok: false, codigo: 'tarjeta_sin_uid' }, 409);

  // ── ② EL MONTO SALE DEL DESGLOSE CONGELADO — del sujeto que sea ───────────
  let monto = 0, iva = 0, base = 0, pedidoDelIntento: string | null = null;
  if (hayCompra) {
    const { data: desglose } = await db.from('compra_desglose')
      .select('pedido_id, subtotal, impuesto, envio, total').eq('compra_id', compraId);
    if (!desglose || desglose.length === 0) {
      return json({ ok: false, codigo: 'desglose_incompleto' }, 409);
    }
    monto = desglose.reduce((a, d) => a + Number(d.total ?? 0), 0);
    iva = desglose.reduce((a, d) => a + Number(d.impuesto ?? 0), 0);
    base = desglose.reduce((a, d) => a + Number(d.subtotal ?? 0) + Number(d.envio ?? 0), 0);
    pedidoDelIntento = desglose[0].pedido_id;
  } else {
    const { data: d } = await db.from('cita_desglose')
      .select('subtotal, impuesto, total, moneda').eq('cita_id', citaId).maybeSingle();
    /* 🔴 FAIL-CLOSED, igual que la compra: **sin desglose congelado no hay
       cobro.** *El desglose es lo que se le prometió al cliente al reservar;
       cobrar sin él sería cobrar un número que nadie le mostró.* */
    if (!d) return json({ ok: false, codigo: 'desglose_incompleto' }, 409);
    monto = Number(d.total ?? 0);
    iva = Number(d.impuesto ?? 0);
    base = Number(d.subtotal ?? 0);
    moneda = d.moneda ?? 'USD';
  }
  const sujeto = hayCompra ? compraId : citaId;

  /* 🔑 LA FORMA DEL `order` CON IVA 0 — respuesta de Erick, 20-ago (letra §6bis):
     `vat: 0` es válido **siempre que vayan también `tax_percentage: 0` y
     `taxable_amount: 0`**. Eso cierra `D-852`.

     🔴 Y van DERIVADOS del desglose, jamás literales: *un cero tecleado a mano
     funciona hoy porque todo el catálogo es `EC_IVA_0`, y miente el día que
     entre un producto gravado.* */
  const pct = base > 0 ? Number(((iva / base) * 100).toFixed(2)) : 0;

  /* 🔴 FAIL-CLOSED HONESTO: con IVA ≠ 0 estamos en territorio que **nadie
     probó** contra esta cuenta. Se corta con código propio en vez de mandar
     números que no sabemos si el proveedor acepta. *Mandar ceros con un IVA
     real sería declararle al proveedor algo falso sobre la venta.* */
  if (iva > 0) {
    await db.from('pagos_intentos').insert({
      pedido_id: pedidoDelIntento, cita_id: hayCita ? citaId : null,
      compra_id: hayCompra ? compraId : null, proveedor: 'nuvei',
      proveedor_referencia: sujeto, monto, moneda,
      forma: 'tokenizacion', estado: 'rechazado',
      motivo_rechazo: `iva_no_cero_sin_probar: iva=${iva} pct=${pct}`,
      cerrado_en: new Date().toISOString(),
      clave_idempotencia: `cobro:iva:${sujeto}:${Date.now()}`,
    });
    return json({ ok: false, codigo: 'iva_no_probado' }, 409);
  }

  // ── ④ COMPUERTAS SERVER-SIDE ──────────────────────────────────────────────
  /* 🔴 Las compuertas de la COMPRA son de la compra. **La cita ya trae las
     suyas** —doce, medidas en el censo: hold, cuenta activa, fee, dirección…—
     y corren en su propia reserva, ANTES de este cobro (letra §3, orden 1).
     *No se reconstruyen acá: duplicar una compuerta es garantizar que algún
     día las dos digan cosas distintas.* */
  const { data: g } = hayCompra
    ? await db.rpc('verificar_compuertas_pre_cobro', { p_compra_id: compraId, p_token: tarjeta.token })
    : { data: { ok: true, no_evaluables: ['compuertas_de_la_cita_corren_en_su_reserva'] } };
  const gate = (g ?? {}) as Record<string, unknown>;
  if (gate.ok !== true) {
    return json({ ok: false, codigo: gate.codigo ?? 'no_se_pudo_completar',
                  no_evaluables: gate.no_evaluables ?? [] }, 409);
  }

  // ── El intento, ANTES de disparar ─────────────────────────────────────────
  /* 🔴 Si disparamos y perdemos la respuesta, esta fila es lo único que prueba
     que se disparó. Sin ella el caso ④ (no llega ninguno) es indetectable: no
     habría contra qué barrer. Y deja la compuerta 0 armada. */
  const { data: intento, error: eI } = await db.from('pagos_intentos').insert({
    pedido_id: pedidoDelIntento, cita_id: hayCita ? citaId : null,
    compra_id: hayCompra ? compraId : null, proveedor: 'nuvei',
    proveedor_referencia: sujeto, monto, moneda,
    forma: 'tokenizacion', estado: 'iniciado',
    clave_idempotencia: `cobro:${sujeto}:${Date.now()}`,
  }).select('id').single();
  if (eI) return json({ ok: false, codigo: 'no_se_pudo_completar' }, 500);

  // ── ⑤ EL DÉBITO ───────────────────────────────────────────────────────────
  let status = 0; let crudo = ''; let jsonResp: Record<string, unknown> = {};
  try {
    const r = await fetch(`${BASE}/v2/transaction/debit/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Auth-Token': await authToken() },
      body: JSON.stringify({
        /* 🔴 EL uid ES EL DEL PROVEEDOR, no el nuestro. La tarjeta se tokenizó
           con el handle del alta; mandar el id de auth hace que el proveedor
           rebote `uid does not match` — **medido en el aparato el 20-ago**.
           *Un identificador que significa algo del otro lado no se sustituye
           por el equivalente del nuestro solo porque nombren a la misma
           persona.* */
        user: { id: uidProveedor, email: u.user.email ?? 'sin-correo@epetplace.com' },
        order: {
          amount: Number(monto.toFixed(2)),
          description: `e-PetPlace compra ${compraId.slice(0, 8)}`,
        /* 🔴 EL SUJETO, jamás un pedido — y jamás el otro sujeto.
           **Medido: con `compraId` fijo, el cobro de una cita mandaba
           `dev_reference: ""`** y el callback quedaba sin a quién apuntar. *Un
           cobro que sale sin referencia es un cobro que el webhook no puede
           reconocer: la plata se mueve y la traza no.* */
          dev_reference: sujeto,
          // 🔑 Los TRES juntos — forma exacta de Erick, derivada del desglose.
          vat: Number(iva.toFixed(2)),
          taxable_amount: iva > 0 ? Number(base.toFixed(2)) : 0,
          tax_percentage: pct,
        },
        card: { token: tarjeta.token },
      }),
    });
    status = r.status;
    crudo = (await r.text()).slice(0, 4000);
    try { jsonResp = JSON.parse(crudo); } catch { /* el crudo queda igual */ }
  } catch (e) {
    /* Red caída ≠ rechazo. El intento queda en vuelo y **el barrido lo va a
       encontrar** — no se cierra como rechazado por no haber podido preguntar. */
    await db.from('pagos_intentos').update({
      motivo_rechazo: `red: ${String(e).slice(0, 200)}`, payload_crudo: { error: String(e) },
    }).eq('id', intento.id);
    return json({ ok: false, codigo: 'sin_respuesta' }, 504);
  }

  const tx = (jsonResp.transaction ?? {}) as Record<string, unknown>;
  const aprobado = status >= 200 && status < 300 &&
    (tx.status === 'success' || tx.status === 'approved');

  /* 🔴 EL MOTIVO JAMÁS QUEDA NULL (L-316) — con `http_<status>` como último
     recurso. *Un rechazo sin motivo obliga a abrir el crudo, y nadie lo abre
     cuando hay una explicación plausible a mano.* */
  const err = (jsonResp.error ?? {}) as Record<string, unknown>;

  /* ═══ 🔴 QUIÉN HABLÓ: ¿EL BANCO, O NOSOTROS? ═══════════════════════════════
     **El banco solo habla cuando OPINÓ.** Un `OperationNotAllowed*`, un
     `AuthError`, un `Server Error` o un HTTP 5xx **no son veredictos del
     emisor**: son defectos de nuestro request o del proveedor.

     Medido el 20-ago en el aparato: la pantalla dijo «el banco no autorizó,
     probá con otra tarjeta» cuando la causa era `uid does not match`. *Le pidió
     a la familia que probara otra tarjeta cuando NINGUNA iba a funcionar* — y
     además le atribuyó al emisor una decisión que nunca tomó.

     ⇒ Se separan, y el criterio es uno: **veredicto del emisor ⟺ hubo
     transacción y su `status` la rechazó.** Todo lo demás es nuestro. */
  const tipoErr = String(err.type ?? '');
  const esDefectoTecnico =
    status >= 500 ||
    /OperationNotAllowed|AuthError|Server ?Error|AttributeError|Invalid/i.test(tipoErr) ||
    (!aprobado && !tx.status);          // sin transacción, el banco no opinó
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
  }).eq('id', intento.id);

  /* 🔴 ⑥ SEÑAL OPTIMISTA. `aprobado` significa «el proveedor contestó que sí»,
     y el llamador pasa a `confirmando`. **Acá nadie dice «pagado»** — eso lo
     dice el webhook, o el barrido. El estado del intento queda `pendiente`
     justamente por eso. */
  if (!aprobado) {
    return json({
      ok: false,
      /* `rechazado` = el emisor dijo que no. `defecto_nuestro` = falló algo de
         nuestro lado o del proveedor, y la familia no tiene nada que corregir. */
      codigo: esDefectoTecnico ? 'defecto_nuestro' : 'rechazado',
      motivo,
    }, 409);
  }
  return json({ ok: true, señal: 'optimista', estado: 'confirmando' });
});
