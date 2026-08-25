#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// S103-D · SONDEO DE QA — cierra los 7 ⚪ en UNA pasada
//
// 🔴 LAS CREDENCIALES SE LEEN DEL KEYCHAIN AL MOMENTO Y NUNCA SE IMPRIMEN.
//    No se escriben en disco, ni en la salida, ni en un log. Si aparecieran en
//    un cuerpo de respuesta, `redactar()` las tapa antes de mostrarlo.
//
// 🔴 CORRE CONTRA QA Y SOLO CONTRA QA. El host es una constante: un error de
//    tipeo no puede mandar esto a producción.
//
// 🔴 FALLA LIMPIO SI FALTA ALGO: dice qué falta y cómo depositarlo, y sale con
//    código ≠ 0. *Un script de medición que arranca a medias produce un reporte
//    a medias, y ése es el que alguien cita después como si estuviera completo.*
//
//    uso:  node scripts/deuna/sondeo-qa.mjs
// ═══════════════════════════════════════════════════════════════════════════

import { execFileSync } from 'node:child_process';

/* ═══ MODO ENSAYO — para correr el guion en seco contra el simulador ═══════
   🔴 CON CANDADO: sólo acepta `localhost`. *Un modo de prueba que puede
   apuntar a cualquier host es un modo de prueba que algún día apunta a
   producción.* Sin la variable, el host es la constante de QA y no hay forma
   de moverlo.
   🔴 Y EN MODO ENSAYO EL POS SALE DE `DEUNA_POS_ENSAYO`, jamás del keychain:
   depositar un POS falso «para probar» es exactamente cómo el lunes alguien
   mide contra QA real con un número inventado. */
const SIM = process.env.DEUNA_SIMULADOR ?? '';
if (SIM && !/^http:\/\/localhost:\d+$/.test(SIM)) {
  console.error(`✖ DEUNA_SIMULADOR sólo admite http://localhost:<puerto> (recibí: ${SIM})`);
  process.exit(1);
}
const BASE = SIM || 'https://apis-merchant.qa.deunalab.com';
const RUTA = '/merchant/v1/payment';   // sin `api/` — medido 22-ago
const ESPACIADO_MS = SIM ? 50 : 1400;  // el rate limit real es ~1 req/s

// ── LAS TRES LLAVES, del keychain ─────────────────────────────────────────
const faltan = [];
function delKeychain(nombre, cuenta = 'epetplace') {
  try {
    return execFileSync('security',
      ['find-generic-password', '-s', nombre, '-a', cuenta, '-w'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    try {   // sin cuenta, por si se depositó sin `-a`
      return execFileSync('security', ['find-generic-password', '-s', nombre, '-w'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      faltan.push(nombre);
      return '';
    }
  }
}

const API_KEY = delKeychain('DEUNA_API_KEY');
const API_SECRET = delKeychain('DEUNA_API_SECRET');
const POS = SIM ? (process.env.DEUNA_POS_ENSAYO ?? '') : delKeychain('DEUNA_POINT_OF_SALE');
if (SIM && !POS) { console.error('✖ modo ensayo: falta DEUNA_POS_ENSAYO'); process.exit(1); }

if (faltan.length) {
  console.error('\n✖ NO SE PUEDE MEDIR — falta en el keychain:\n');
  for (const n of faltan) {
    console.error(`   ${n}`);
    console.error(`     security add-generic-password -s ${n} -a epetplace -w '<valor>'\n`);
  }
  if (faltan.includes('DEUNA_POINT_OF_SALE')) {
    console.error('   🔴 El pointOfSale es EL bloqueante (S103-D §2ter): es obligatorio,');
    console.error('      solo numérico, y se valida contra la jerarquía del comercio.');
    console.error('      No se adivina — sale del onboarding de DeUna o de soporte.\n');
  }
  process.exit(1);
}
if (!/^\d+$/.test(POS)) {
  console.error(`✖ DEUNA_POINT_OF_SALE debe ser solo dígitos (largo ${POS.length}).`);
  process.exit(1);
}

const redactar = (s) => String(s)
  .split(API_KEY).join('«API_KEY»')
  .split(API_SECRET).join('«API_SECRET»');

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
let ultima = 0;

async function llamar(etiqueta, ruta, cuerpo) {
  const falta = ESPACIADO_MS - (Date.now() - ultima);
  if (ultima && falta > 0) await dormir(falta);          // el 429 es real
  let r, texto;
  try {
    r = await fetch(BASE + ruta, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
                 'x-api-key': API_KEY, 'x-api-secret': API_SECRET },
      body: JSON.stringify(cuerpo),
    });
    texto = await r.text();
  } catch (e) {
    ultima = Date.now();
    console.log(`\n■ ${etiqueta}\n  ✖ red: ${redactar(e.message)}`);
    return { status: 0, js: null };
  }
  ultima = Date.now();
  let js = null;
  try { js = JSON.parse(texto); } catch { /* el crudo alcanza */ }
  console.log(`\n■ ${etiqueta}\n  POST ${ruta} → HTTP ${r.status}`);
  console.log('  ' + redactar(JSON.stringify(js ?? texto, null, 2)).split('\n').join('\n  '));
  if (r.status === 429) console.log('  ⚠️ 429 — NO es fallo del pago: espaciar y reintentar');
  return { status: r.status, js };
}

// La referencia, con la misma regla que la migración M3: <= 20 chars.
const ref = 'EPQA' + Date.now().toString(36);
if (ref.length > 20) throw new Error('la referencia de sondeo no cabe');

const veredictos = [];
const anotar = (n, q, v, control) => veredictos.push({ n, q, v, control });

console.log(SIM ? '═══ SONDEO — MODO ENSAYO (SIMULADOR) ═══' : '═══ SONDEO QA DEUNA ═══');
/* 🔴 Se imprimen los ÚLTIMOS dígitos del POS. No es un secreto —es un
   identificador de comercio— y ver con cuál se midió evita el caso de creer
   que se usó el bueno. *Un reporte que no dice contra qué midió obliga a
   confiar en la memoria de quien lo corrió.* */
console.log(`host: ${BASE} · referencia: ${ref} (${ref.length} chars)`);
console.log(`POS: …${POS.slice(-4)} (${POS.length} dígitos)${SIM ? '  ⚠️ DE ENSAYO' : ''}`);
const T0 = Date.now();

// ── ⚪1 · payment/request con format "5" ───────────────────────────────────
const req = await llamar('① payment/request · qrType dynamic + format 5', `${RUTA}/request`, {
  pointOfSale: POS, qrType: 'dynamic', format: '5',
  amount: 1.00,
  detail: 'sondeo QA e-PetPlace',          // ≤50, sin dato personal
  internalTransactionReference: ref,
  // 🔴 SIN `currency` — medido: rebota el request entero.
});
const d1 = req.js?.data ?? req.js ?? {};
const txId = typeof d1.transactionId === 'string' ? d1.transactionId : null;
const codigo = d1.numericCode != null ? String(d1.numericCode) : null;

anotar(1, 'payment/request responde 200', req.status === 200 ? '✅' : '❌',
  `HTTP ${req.status}`);
anotar(2, 'devuelve transactionId', txId ? '✅' : '❌', txId ? 'presente' : 'ausente');
anotar(3, '🔑 devuelve numericCode (firma ① del founder)', codigo ? '✅' : '❌',
  codigo ? `${codigo.length} dígitos` : 'ausente — la pantalla de C depende de este campo');
anotar(4, 'QR y deeplink vienen (reserva sin pantalla)',
  (d1.qr || d1.deeplink) ? '✅' : '⚪', Object.keys(d1).join(', ') || 'sin campos');

if (!txId) {
  console.log('\n✖ sin transactionId no se puede seguir: info y refund lo necesitan.');
  reportar();
  process.exit(1);
}

// ── ⚪2 · payment/info por los dos idType ──────────────────────────────────
// 🔑 `idType` es STRING y el campo lleva el typo del proveedor: idTransacionReference
const i0 = await llamar('② info · idType "0" (su transactionId)', `${RUTA}/info`,
  { idType: '0', idTransacionReference: txId });
const i1 = await llamar('② info · idType "1" (nuestra referencia)', `${RUTA}/info`,
  { idType: '1', idTransacionReference: ref });

anotar(5, 'info por idType 0 y 1 responden', (i0.status === 200 && i1.status === 200) ? '✅' : '❌',
  `${i0.status} / ${i1.status}`);
anotar(6, 'una transacción REAL trae su monto (≠ fantasma)',
  Number(i0.js?.amount ?? 0) > 0 ? '✅' : '❌',
  `amount=${i0.js?.amount} · date="${i0.js?.date}" — si es 0 y vacío, el discriminador del fantasma NO sirve`);

// ── ⚪3 · REGENERACIÓN (§12.6 — se mide, no se pregunta) ───────────────────
const req2 = await llamar('③ segunda request con la MISMA referencia', `${RUTA}/request`, {
  pointOfSale: POS, qrType: 'dynamic', format: '5', amount: 1.00,
  detail: 'sondeo regeneracion', internalTransactionReference: ref,
});
const d2 = req2.js?.data ?? req2.js ?? {};
const txId2 = typeof d2.transactionId === 'string' ? d2.transactionId : null;
anotar(7, 'regenerar con la misma referencia',
  txId2 ? (txId2 !== txId ? '✅' : '⚪') : '❌',
  txId2 ? (txId2 !== txId ? 'ACEPTADA, transactionId NUEVO ⇒ el candado va al txId, no a la referencia'
                          : 'devolvió el MISMO txId ⇒ es idempotente por referencia')
        : `RECHAZADA (HTTP ${req2.status})`);

if (txId2 && txId2 !== txId) {
  const viejo = await llamar('③b estado del PRIMER código tras regenerar', `${RUTA}/info`,
    { idType: '0', idTransacionReference: txId });
  anotar(8, 'qué le pasa al código viejo al regenerar', '✅',
    `status=${viejo.js?.status} ⇒ ${viejo.js?.status === 'PENDING' ? 'CONVIVE (los dos vivos)' : 'murió'}`);
}

// ── ⚪4 · REFUND ───────────────────────────────────────────────────────────
console.log('\n  ⚠️ El refund exige una transacción APROBADA. Sobre una PENDING debe rebotar,');
console.log('     y ese rebote YA ES el dato: prueba que exige aprobación.');
const ref1 = await llamar('④ refund (misma pareja idType + idTransacionReference)',
  `${RUTA}/refund`, { idType: '0', idTransacionReference: txId });
anotar(9, 'refund sobre una PENDING rebota', ref1.status >= 400 ? '✅' : '⚪',
  `HTTP ${ref1.status} — ${JSON.stringify(ref1.js?.error?.response ?? ref1.js?.message ?? '').slice(0, 120)}`);

reportar();

function reportar() {
  console.log('\n\n═══════ VEREDICTOS ═══════');
  for (const v of veredictos) console.log(`${v.v}  ${v.q}\n      control: ${v.control}`);
  const n = (s) => veredictos.filter((v) => v.v === s).length;
  console.log(`\n${n('✅')} ✅ · ${n('❌')} ❌ · ${n('⚪')} ⚪`);
  console.log(`⏱  ${((Date.now() - T0) / 1000).toFixed(1)} s de reloj`);
  if (SIM) {
    /* 🔴 LA ADVERTENCIA MÁS IMPORTANTE DEL SCRIPT, y nace de un ensayo real:
       con el simulador curado el guion sale **9 ✅ · 0 ❌**, y ese tablero es
       indistinguible del que produciría una corrida contra QA.
       *Un ensayo que termina en verdes se archiva como si hubiera medido.* */
    console.log('\n' + '━'.repeat(72));
    console.log('⚠️  MODO ENSAYO — ESTOS VEREDICTOS NO SON MEDICIONES.');
    console.log('   Prueban que el GUION CORRE de punta a punta, nada más.');
    console.log('   Las respuestas salieron del simulador; varias son SINTÉTICAS');
    console.log('   (la de `payment/request` entera, y cómo se ve una transacción');
    console.log('   real sin pagar — que es justamente el PASO 1 del día 1).');
    console.log('   🔴 NO copiar esta tabla a ningún reporte ni bitácora.');
    console.log('━'.repeat(72));
  }
  console.log('\nLas credenciales nunca se imprimieron. Verificalo con:');
  console.log('  node scripts/deuna/sondeo-qa.mjs | grep -c "«API_KEY»\\|«API_SECRET»"   ← 0 = no hubo eco');
}
