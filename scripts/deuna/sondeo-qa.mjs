#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// S103-D · SONDEO DEL AMBIENTE QA DE DEUNA — instrumento local, solo medición
//
// 🔴 LAS CREDENCIALES SE LEEN DEL KEYCHAIN AL MOMENTO Y NUNCA SE IMPRIMEN.
//    Este script no las escribe en disco, ni en su salida, ni en un log. Si
//    aparecieran en un cuerpo de respuesta, `redactar()` las tapa antes de
//    mostrarlo.
//
// 🔴 CORRE CONTRA QA. La constante BASE no admite el host de PDN — un error de
//    tipeo no puede mandar un cobro a producción.
// ═══════════════════════════════════════════════════════════════════════════

import { execFileSync } from 'node:child_process';

const BASE = 'https://apis-merchant.qa.deunalab.com';
const RUTA = '/merchant/v1/payment';   // 🔴 sin `api/` — medido en la tanda 0

function delKeychain(nombre) {
  try {
    return execFileSync('security',
      ['find-generic-password', '-s', nombre, '-w'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    console.error(`✖ falta en el keychain: ${nombre}`);
    console.error(`  depositalo con:  security add-generic-password -s ${nombre} -a epetplace -w '<valor>'`);
    process.exit(1);
  }
}

const API_KEY = delKeychain('DEUNA_API_KEY');
const API_SECRET = delKeychain('DEUNA_API_SECRET');

/** Tapa cualquier eco de las credenciales antes de que llegue a la salida. */
const redactar = (s) => String(s)
  .split(API_KEY).join('«API_KEY»')
  .split(API_SECRET).join('«API_SECRET»');

let fallos = 0;

async function llamar(etiqueta, ruta, cuerpo) {
  const t0 = Date.now();
  let r, texto;
  try {
    r = await fetch(BASE + ruta, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-api-secret': API_SECRET,
      },
      body: JSON.stringify(cuerpo),
    });
    texto = await r.text();
  } catch (e) {
    console.log(`\n■ ${etiqueta}\n  ✖ red: ${redactar(e.message)}`);
    fallos++;
    return null;
  }
  let js = null;
  try { js = JSON.parse(texto); } catch { /* el crudo alcanza */ }
  console.log(`\n■ ${etiqueta}`);
  console.log(`  POST ${ruta} → HTTP ${r.status} (${Date.now() - t0} ms)`);
  console.log('  ' + redactar(JSON.stringify(js ?? texto, null, 2)).split('\n').join('\n  '));
  if (r.status >= 400) fallos++;
  return js;
}

// ── La referencia corta, con la MISMA regla que la migración M3: < 20 chars ──
const ref = 'EPQA' + Date.now().toString(36);   // ~13 chars
if (ref.length >= 20) throw new Error('la referencia de sondeo no cabe');

console.log('═══ SONDEO QA DEUNA ═══');
console.log(`host: ${BASE}  ·  referencia de esta corrida: ${ref}  (${ref.length} chars)`);

// ①  payment/request — ¿devuelve numericCode? (firma ① del founder)
const req = await llamar('① payment/request · qrType dynamic + format 5', `${RUTA}/request`, {
  pointOfSale: process.env.DEUNA_POS ?? '',   // §12.2 — si falta, el error lo dirá
  qrType: 'dynamic',
  format: '5',
  amount: 1.00,
  detail: 'sondeo QA e-PetPlace',            // ≤50, sin dato personal
  internalTransactionReference: ref,
  currency: 'USD',
});

const txId = req?.transactionId ?? req?.data?.transactionId ?? null;
const codigo = req?.numericCode ?? req?.data?.numericCode ?? null;

console.log('\n── LO QUE LA LETRA §2 PROMETE, CONTRA LO QUE VOLVIÓ ──');
for (const [campo, valor] of [
  ['transactionId', txId],
  ['numericCode (firma ①)', codigo],
  ['QR', req?.qr ?? req?.data?.qr ?? null],
  ['deeplink', req?.deeplink ?? req?.data?.deeplink ?? null],
]) {
  console.log(`  ${valor ? '✅' : '❌'} ${campo}${valor ? '' : ' — NO vino en la respuesta'}`);
}

if (!txId) {
  console.log('\n✖ sin transactionId no se puede seguir: info y refund lo necesitan.');
  process.exit(fallos ? 1 : 0);
}

// ②  payment/info por los dos idType — estados reales
await llamar('② payment/info · idType 0 (su transactionId)', `${RUTA}/info`,
  { idType: 0, id: txId });
await llamar('② payment/info · idType 1 (nuestra referencia)', `${RUTA}/info`,
  { idType: 1, id: ref });

// ③  REGENERACIÓN — el plan ordena MEDIRLA, no preguntarla (§12.6)
console.log('\n── ③ REGENERACIÓN: ¿qué le pasa al código viejo? ──');
const req2 = await llamar('③ segunda payment/request con la MISMA referencia', `${RUTA}/request`, {
  pointOfSale: process.env.DEUNA_POS ?? '',
  qrType: 'dynamic', format: '5', amount: 1.00,
  detail: 'sondeo QA e-PetPlace regeneracion',
  internalTransactionReference: ref, currency: 'USD',
});
const txId2 = req2?.transactionId ?? req2?.data?.transactionId ?? null;
console.log(`  referencia repetida → ${txId2 ? 'ACEPTADA, transactionId nuevo' : 'RECHAZADA'}`);
if (txId2 && txId2 !== txId) {
  console.log('  ⇒ una referencia puede tener N transactionId ⇒ el candado UNIQUE va al transactionId, NO a la referencia');
  await llamar('③b estado del PRIMER código tras regenerar', `${RUTA}/info`, { idType: 0, id: txId });
  console.log('  ⇒ mirá el estado de arriba: dice si el viejo muere o convive (LETRA_DEUNA §5)');
}

// ④  REFUND — solo si QA lo permite y solo sobre algo aprobado
console.log('\n── ④ REFUND ──');
console.log('  ⚠️ Requiere una transacción APROBADA. Un PENDING debería rebotar,');
console.log('     y ese rebote YA ES el dato: prueba que el refund exige aprobación.');
await llamar('④ payment/refund sobre la transacción del sondeo', `${RUTA}/refund`,
  { transactionId: txId });

console.log(`\n═══ FIN · llamadas con error: ${fallos} ═══`);
console.log('Las credenciales nunca se imprimieron. Verificalo con:');
console.log('  node sondeo-deuna-qa.mjs | grep -c "«API_KEY»\\|«API_SECRET»"   ← 0 = no hubo eco');
