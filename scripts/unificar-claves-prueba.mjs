#!/usr/bin/env node
/**
 * S106-A tanda 2 · UNIFICAR LA CLAVE DE LAS CUENTAS DE PRUEBA
 * Firma del founder, 26-ago-2026 (cura de `D-937`).
 *
 * Pone la clave compartida en las cuentas `guillo381+*@gmail.com` que **hoy
 * rebotan**, por la API de administración.
 *
 * ── LAS TRES REGLAS QUE NO SE NEGOCIAN ──────────────────────────────────────
 *
 *  ① **Los dos secretos se leen AL MOMENTO y JAMÁS se imprimen.** La clave
 *     compartida sale del keychain; la `service_role` de
 *     `supabase/dev/.env.local`, que está gitignoreado. Ninguno se escribe en
 *     un log, en un reporte ni en este archivo.
 *
 *  ② **Admin API con `service_role`, jamás la puerta pública.** Cambiar la
 *     clave de otro usuario no es algo que un cliente pueda hacer, y está bien
 *     que así sea.
 *
 *  ③ **SE MIDE ANTES DE ACTUAR, cuenta por cuenta.** El script no trabaja
 *     contra una lista de 25 escrita a mano: **intenta el login de cada una y
 *     sólo toca las que fallan.** *Una lista estática envejece — la de ayer ya
 *     tiene una cuenta unificada adentro, y tocarla sería cambiarle la clave a
 *     alguien que ya podía entrar.*
 *
 * ── ORDEN DELIBERADO ────────────────────────────────────────────────────────
 *    **Primero el equipo `vet*`**, por orden del founder: es el que toca
 *    telemedicina y el que hizo fallar la primera corrida del borde de §4.
 *
 * ── ☠️ UNA PREMISA QUE ESTE ARCHIVO LLEGÓ A AFIRMAR Y ERA FALSA ─────────────
 *    Una versión anterior de este encabezado decía que *«el lado `vet` rebotaba
 *    entero y el `ser` entraba entero»*, y mandaba a investigar esa asimetría.
 *    **No existe.** Salió de un censo contaminado por rate limiting; medido con
 *    espaciado, el lado `vet` está partido (`vet2`, `vet4`, `vetadmin`,
 *    `vetrece` entran; `vet1`, `vet3` no).
 *
 *    **Lo que el estado real sí muestra, y es aburrido:** las cuentas que S97
 *    creó o reseteó tienen la clave compartida; las que la preceden y no
 *    estaban en su lista, no. *Eso ya lo decía el cuerpo del documento — lo que
 *    engañaba era su encabezado.*
 *
 * USO:
 *   node scripts/unificar-claves-prueba.mjs            # mide y reporta, NO toca
 *   node scripts/unificar-claves-prueba.mjs --aplicar  # mide, unifica, re-mide
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const APLICAR = process.argv.includes('--aplicar');
const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';

/* ── Los secretos, leídos al momento ─────────────────────────────────────── */
const CLAVE = execFileSync(
  'security',
  ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
  { encoding: 'utf8' },
).trim();

const SERVICE = readFileSync(`${RAIZ}/supabase/dev/.env.local`, 'utf8')
  .match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();

if (!CLAVE || !SERVICE) {
  console.error('🔴 falta un secreto — se aborta sin tocar nada');
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(`${RAIZ}/apps/prestador/.env.local`, 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const URL = env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

/**
 * Prueba el login de verdad. Es el único juez: no se lee ningún documento.
 *
 * 🔴 **DEVUELVE LA CAUSA, NO UN BOOLEANO — y esto no es prolijidad: es la cura
 *    de un error que ya se cometió.** La primera versión medía sólo sí/no y
 *    corría los 42 logins seguidos; Supabase los limitó por tasa, y **los `429`
 *    se leyeron como «esta cuenta no tiene la clave»**. El censo salió
 *    distinto en dos corridas separadas por minutos, y de ahí salió un hallazgo
 *    FALSO que llegó al canon.
 *
 *    *Un instrumento que descarta la causa del fallo no puede distinguir «no
 *    tiene la clave» de «no me dejaron preguntar», y las dos se ven igual.*
 *
 *    Por eso: **se espera entre intentos** y **se devuelve el `status`**.
 */
const PAUSA_MS = 3500;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function entra(email) {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password: CLAVE });
  const ok = !error && !!data?.session;
  if (ok) await c.auth.signOut();
  await dormir(PAUSA_MS);
  return { ok, status: error?.status ?? null, motivo: error?.message ?? null };
}

/* ── ① El censo, del OBJETO. La lista de cuentas sale de `auth.users`, no de
 *     un documento — que es de dónde salió el error que esta cura repara. ── */
const { data: usuarios, error: eList } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (eList) { console.error('🔴 no se pudo listar usuarios:', eList.message); process.exit(1); }

const cuentas = usuarios.users
  .filter((u) => /^guillo381\+.+@gmail\.com$/.test(u.email ?? ''))
  .map((u) => ({ id: u.id, email: u.email }));

/* El equipo `vet*` primero — orden del founder. */
const esVet = (e) => /^guillo381\+vet/.test(e);
cuentas.sort((a, b) => (esVet(b.email) ? 1 : 0) - (esVet(a.email) ? 1 : 0) || a.email.localeCompare(b.email));

console.log(`Cuentas de prueba vivas: ${cuentas.length}\n`);

console.log(`(con ${PAUSA_MS} ms entre intentos, para que un 429 no se lea como clave mala)\n`);
const antes = [];
for (const c of cuentas) {
  const r = await entra(c.email);
  antes.push({ ...c, ...r });
  console.log(`${r.ok ? '✅' : '❌'} ${c.email.replace('guillo381+', '+').replace('@gmail.com', '')}${r.motivo ? ` · ${r.status} ${r.motivo}` : ''}`);
}

/* 🔴 SE SEPARAN LAS DOS CAUSAS. `Email not confirmed` NO se cura cambiando la
      clave — se cura confirmando el correo. *Meterlas en la misma bolsa
      dejaría una cuenta «unificada» que sigue sin poder entrar, y el reporte
      diría que se arregló.* */
const rateLimited = antes.filter((c) => c.status === 429);
if (rateLimited.length) {
  console.error(`\n🔴 ${rateLimited.length} cuenta(s) dieron 429 — la medición NO es confiable. Se aborta.`);
  process.exit(1);
}
const sinConfirmar = antes.filter((c) => !c.ok && /not confirmed/i.test(c.motivo ?? ''));
const fallan = antes.filter((c) => !c.ok && !/not confirmed/i.test(c.motivo ?? ''));
console.log(`\nANTES → entran ${antes.filter((c) => c.ok).length} · clave distinta ${fallan.length} · correo sin confirmar ${sinConfirmar.length}`);

if (!APLICAR) {
  console.log('\n(modo medición — nada se tocó. Corré con --aplicar para unificar.)');
  process.exit(0);
}

/* ── ② La unificación, sólo sobre las que fallan ─────────────────────────── */
console.log('\nUNIFICANDO...');
const fallos = [];
for (const c of [...fallan, ...sinConfirmar]) {
  /* A las que sólo les falta el correo confirmado se les confirma; a las demás
     se les pone la clave. **Se les pone la clave TAMBIÉN a las sin confirmar**
     porque no sabemos cuál tienen — su login jamás llegó a evaluarla. */
  const { error } = await admin.auth.admin.updateUserById(c.id, { password: CLAVE, email_confirm: true });
  const etiqueta = c.email.replace('guillo381+', '+').replace('@gmail.com', '');
  if (error) { fallos.push({ ...c, motivo: error.message }); console.log(`  ❌ ${etiqueta}: ${error.message}`); }
  else console.log(`  · ${etiqueta}`);
}

/* ── ③ LA RE-MEDICIÓN CON EL MISMO INSTRUMENTO ───────────────────────────
 *     **No se reporta «se ejecutó sin errores».** Se vuelve a intentar el
 *     login de las 42, con la misma función que midió antes. *Un `updateUser`
 *     que devuelve 200 prueba que la API aceptó la orden, no que la persona
 *     pueda entrar.* ─────────────────────────────────────────────────────── */
console.log('\nRE-MIDIENDO con el mismo instrumento...');
const despues = [];
for (const c of cuentas) despues.push({ ...c, ...(await entra(c.email)) });

const siguen = despues.filter((c) => !c.ok);
console.log(`\nDESPUÉS → entran ${despues.length - siguen.length}/${despues.length}`);
if (siguen.length) {
  console.log('🔴 SIGUEN REBOTANDO, con su literal:');
  for (const c of siguen) {
    const f = fallos.find((x) => x.id === c.id);
    console.log(`   ${c.email} · login: ${c.status} ${c.motivo}${f ? ` · updateUser habia dicho: ${f.motivo}` : ' · updateUser dijo OK y el login IGUAL rebota'}`);
  }
  process.exit(1);
}
console.log('✅ todas entran.');
