#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// SONDA DE CREDENCIALES — canónica desde S89-A (antes era práctica sin archivo)
//
// QUÉ: prueba las cuentas canónicas del registro por CAMINO REAL
// (grant_type=password contra GoTrue) y LEE EL ERROR (`error_code`), jamás lo
// supone — la lección del forense S88: un 400 no dice por qué; el error_code sí.
//
// CUÁNDO: antes de cada dedo (orden de mesa S89) y en todo barrido de cierre.
//
// REGISTRO: la lista de abajo ES copia del registro canónico del brief vigente
// (docs/relevamientos/2026-08-06-brief-s89.md §credenciales). Si el registro
// cambia, se actualizan LOS DOS en el mismo commit — una cuenta fuera del
// registro es una credencial que nadie puede reponer.
//
// Claves de cuentas DEMO a propósito en el repo privado (mismo estatus que el
// brief que ya las porta). La anon key es pública por diseño (viaja en las apps).
//
// Uso:  node scripts/sonda-credenciales.mjs        → tabla + exit 0/1
// ═══════════════════════════════════════════════════════════════════════════

const URL_BASE = 'https://zyltipqscdsdsxnjclhp.supabase.co';
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bHRpcHFzY2RzZHN4bmpjbGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDMxMDYsImV4cCI6MjA5MjM3OTEwNn0.kvHD9-JvaGytu0a7kAwgTyVXExrhIaGg1Z8_-99SOxA';

const CUENTAS = [
  ['demo-prestador@epetplace.dev',      'S87prueba!2026', 'titular Paseos Andres · Zeus'],
  ['demo-vet@epetplace.dev',            'S87prueba!2026', 'titular Clínica Aurora'],
  ['guillo381+8@gmail.com',             'S87prueba!2026', 'familia · Thor y Zeus'],
  ['guillo381+1@gmail.com',             'S87prueba!2026', 'familia · Zeus'],
  ['guillo381+s87prof@gmail.com',       'S87prueba!2026', 'profesional con chips'],
  ['guillo381+s87recep@gmail.com',      'S87prueba!2026', 'recepción, 0 chips'],
  ['guillo381+s88admin@gmail.com',      'S88admin!2026',  '⚠️ BIFRONTE — no discrimina rol'],
  ['guillo381+s88rolpuro@gmail.com',    'S88puro!2026',   'el discriminador — admin sin admin_users'],
];

let caidas = 0;
for (const [email, password, rol] of CUENTAS) {
  let veredicto;
  try {
    const r = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON },
      body: JSON.stringify({ email, password }),
    });
    if (r.status === 200) {
      veredicto = '200 ✓';
    } else {
      // EL ERROR SE LEE, NO SE SUPONE
      const body = await r.json().catch(() => ({}));
      veredicto = `${r.status} ✗ error_code=${body.error_code ?? body.error ?? '¿?'} · ${body.msg ?? body.error_description ?? ''}`;
      caidas++;
    }
  } catch (e) {
    veredicto = `RED ✗ ${e.message}`;
    caidas++;
  }
  console.log(`${veredicto.padEnd(14)} ${email.padEnd(34)} ${rol}`);
}

console.log(caidas === 0
  ? `\n${CUENTAS.length}/${CUENTAS.length} responden por camino real.`
  : `\n⚠️ ${caidas} caída(s). Antes de rotar: leer el audit (par login+user_updated_password) y comparar la huella md5(encrypted_password) — updated_at NO es marcador de rotación (forense S89-A).`);
process.exit(caidas === 0 ? 0 : 1);
