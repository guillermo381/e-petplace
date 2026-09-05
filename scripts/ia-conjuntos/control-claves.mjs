#!/usr/bin/env node
// scripts/ia-conjuntos/control-claves.mjs — S113-E, adenda 1.0
//
// CONTROLES DE LA CURA DE D-1013. Un barrido que dice «cero ocurrencias» prueba
// que la línea no está; NO prueba que lo que la reemplazó funcione ni que se
// niegue cuando debe. Esto último es lo que decide si la cura es cura o adorno.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { claveAnon, claveServicio } from './lib-conjuntos.mjs';

let fallos = 0;
const ok = (b, et, d = '') => { console.log(`${b ? '✅' : '🔴'} ${et}${d ? '  ' + d : ''}`); if (!b) fallos += 1; };

// ── 1 · la línea prohibida no está VIVA en ningún arnés ─────────────────────
const vivas = spawnSync('grep', ['-rn', "spawnSync('npx', \\['supabase', 'projects'", 'scripts/ia-conjuntos'],
  { encoding: 'utf8' }).stdout.trim();
ok(vivas === '', 'BARRIDO   cero llamadas vivas a `supabase projects api-keys`', vivas ? `(quedan: ${vivas.split('\n').length})` : '');

// ── 2 · POSITIVO: la anon se resuelve y su claim se verifica ────────────────
let anon = null, errAnon = null;
try { anon = claveAnon(); } catch (e) { errAnon = e.message; }
ok(anon !== null, 'POSITIVO  la `anon` se resuelve sin el comando prohibido', errAnon ?? '(del repo, claim verificado)');

// ── 3 · POSITIVO: la clave devuelta ES la que usa la app ───────────────────
// Se compara contra OTRA aparición independiente en el repo. Si el día de mañana
// el proyecto rota su anon y una de las dos queda vieja, esto lo dice.
if (anon) {
  const otra = readFileSync('supabase/migrations/20260805130000_lote2_pgnet_timbre.sql', 'utf8')
    .match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
  ok(otra && otra[0] === anon, 'POSITIVO  coincide con la otra aparición del repo (migración del cron)');
}

// ── 4 · ROJO DEL RESOLUTOR: una clave con el claim equivocado se RECHAZA ────
// Es el control que importa: sin él, el resolutor podría devolver cualquier JWT
// y el arnés mediría con la credencial de otro rol, con total confianza.
let rechazo = null;
try {
  // La `anon` es un JWT válido con role=anon: pasarla por el resolutor de
  // `service_role` tiene que REBOTAR, no aceptarse por ser un JWT bien formado.
  process.env.EPETPLACE_SERVICE_ROLE = anon ?? 'x.y.z';
  claveServicio();
} catch (e) { rechazo = e.message; }
delete process.env.EPETPLACE_SERVICE_ROLE;
ok(rechazo !== null && /role=anon/.test(rechazo),
  'ROJO      una clave con claim `anon` NO se acepta como `service_role`',
  rechazo ? `(${rechazo.split('\n')[0]})` : '(la aceptó — el resolutor no verifica nada)');

// ── 5 · ROJO: sin clave PARA, y NO cae al comando viejo ────────────────────
let sinClave = null;
const guardado = process.env.EPETPLACE_SERVICE_ROLE;
delete process.env.EPETPLACE_SERVICE_ROLE;
const hayEnLlavero = spawnSync('security',
  ['find-generic-password', '-a', 'medicion', '-s', 'epetplace-service-role', '-w'],
  { encoding: 'utf8' }).stdout.trim() !== '';
if (!hayEnLlavero) {
  try { claveServicio(); } catch (e) { sinClave = e.message; }
  ok(sinClave !== null && /PARA/.test(sinClave) && /add-generic-password/.test(sinClave),
    'ROJO      sin clave PARA y dice el comando exacto (no cae al viejo)',
    sinClave ? '(y el mensaje trae cómo guardarla)' : '(devolvió algo: hay respaldo silencioso)');
} else {
  ok(true, 'ROJO      (omitido: la clave YA está en el llavero, no se puede ensayar su ausencia)');
}
if (guardado) process.env.EPETPLACE_SERVICE_ROLE = guardado;

console.log('');
if (fallos) { console.log(`🔴 ${fallos} control(es) en rojo.`); process.exit(1); }
console.log('✅ la cura resuelve sin el comando prohibido, y se niega cuando la clave está mal o falta.');
