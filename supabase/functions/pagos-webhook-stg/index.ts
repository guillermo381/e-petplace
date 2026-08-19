// ═══════════════════════════════════════════════════════════════════════════
// S101-A · BUZÓN DE WEBHOOKS DE PASARELA — v0
//
// 🔴 ESTA VERSIÓN NO MUEVE NINGÚN ESTADO. Recibe, persiste el crudo, registra
//    el resultado de validar el `stoken`, y responde 200. El actuador viene
//    después SOBRE ESTE MISMO ENDPOINT, para que la URL registrada ante la
//    pasarela no cambie nunca.
//
// 🔴 POR QUÉ HAY DOS FUNCIONES Y NO UNA CON BANDERA: el censo B0 §7 midió que
//    NO existe proyecto Supabase de staging — hay un solo proyecto activo. Los
//    eventos del sandbox aterrizan sobre la misma base que los reales. Dos
//    despliegues con secretos separados y la columna `ambiente` obligatoria es
//    la mitigación mientras eso sea cierto. Una bandera compartida sería un
//    solo error de configuración entre la prueba y la plata.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createHash } from 'node:crypto';

const AMBIENTE = Deno.env.get('PAGOS_AMBIENTE') ?? 'sandbox';
const APP_CODE = Deno.env.get('NUVEI_APP_CODE_SERVER') ?? '';
const APP_KEY = Deno.env.get('NUVEI_APP_KEY_SERVER') ?? '';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

/**
 * stoken = MD5(transaction_id + "_" + application_code + "_" + user_id + "_" + app_key)
 *
 * ⚠️ La UBICACIÓN del stoken dentro del payload NO está medida contra sandbox
 *    (no hay credenciales todavía). Se busca en tres lugares A PROPÓSITO y el
 *    campo `detalle` deja escrito cuál acertó en el primer evento real.
 *    Cuando se sepa, se fija uno y se borran los otros dos.
 */
function calcularStoken(txId: string, userId: string): string {
  return createHash('md5')
    .update(`${txId}_${APP_CODE}_${userId}_${APP_KEY}`)
    .digest('hex');
}

function extraer(p: Record<string, any>) {
  const t = p?.transaction ?? {};
  return {
    txId: String(t.id ?? p?.transaction_id ?? ''),
    userId: String(p?.user?.id ?? t.user_id ?? ''),
    stoken: String(t.stoken ?? p?.stoken ?? p?.card?.stoken ?? ''),
    devRef: String(t.dev_reference ?? ''),
    status: t.status ?? null,
    detail: t.status_detail ?? null,
    monto: t.amount ?? null,
  };
}

async function guardar(row: Record<string, unknown>) {
  const { error } = await db.from('webhook_events').insert({
    ambiente: AMBIENTE,
    proveedor: 'nuvei',
    ...row,
  });
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const crudo = await req.text();

  // ① ILEGIBLE → se guarda igual y se responde 200.
  //    Reintentar un JSON roto durante 48 h no lo arregla, y sí llena la cola.
  let payload: Record<string, any>;
  try {
    payload = JSON.parse(crudo);
  } catch {
    try {
      await guardar({
        payload: { crudo_no_json: crudo.slice(0, 10_000) },
        resultado: 'ilegible',
        detalle: 'body no parseable como JSON',
      });
    } catch (e) {
      console.error('[webhook] no se pudo guardar el ilegible', e);
    }
    return new Response('ok', { status: 200 });
  }

  const d = extraer(payload);

  // ② VALIDACIÓN DEL STOKEN. En v0 solo se REGISTRA el resultado: no corta
  //    nada porque no hay nada que cortar todavía. Cuando el actuador entre,
  //    esta misma verificación pasa a ser la puerta.
  let valido: boolean | null = null;
  let detalle = 'v0 buzón: no se movió ningún estado';
  if (d.txId && d.userId && d.stoken && APP_CODE && APP_KEY) {
    valido = calcularStoken(d.txId, d.userId).toLowerCase() === d.stoken.toLowerCase();
    if (!valido) detalle = 'stoken no coincide';
  } else {
    const faltan = [
      !d.txId && 'transaction_id',
      !d.userId && 'user_id',
      !d.stoken && 'stoken',
      !APP_CODE && 'APP_CODE',
      !APP_KEY && 'APP_KEY',
    ].filter(Boolean).join(', ');
    detalle = `no se pudo validar: faltan ${faltan}`;
  }

  // ③ PERSISTIR SIEMPRE, incluso lo rechazado.
  try {
    await guardar({
      transaction_id: d.txId || null,
      payload,
      stoken_valido: valido,
      resultado: valido === false ? 'stoken_invalido' : 'recibido',
      detalle: `${detalle} · dev_reference=${d.devRef} · status=${d.status}/${d.detail}`,
    });
  } catch (e) {
    // 🔴 500 A PROPÓSITO. Es el único caso donde queremos que reintenten: si
    //    no pudimos guardarlo, todavía no lo tenemos.
    console.error('[webhook] fallo al persistir', e);
    return new Response('retry', { status: 500 });
  }

  // ④ 200 rápido. Si tarda, reintentan con backoff hasta 48 h.
  return new Response('ok', { status: 200 });
});
