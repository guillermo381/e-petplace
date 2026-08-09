/**
 * D-719 (b) · ¿LA PERILLA «require current password» ROMPE LA RECUPERACIÓN?
 *
 *   pnpm tsx scripts/verify-recuperar-s92bis.mts <codigo-de-6-digitos>
 *
 * ── LA PREGUNTA, Y POR QUÉ NO SE PUEDE CONTESTAR RAZONANDO ──────────────────
 * `establecerContrasenaNueva` llama `updateUser({ password })` **sin**
 * `current_password` — el mismo patrón que dejó CAÍDO el cambio de clave
 * (D-719 (a)). Pero acá **no se puede aplicar la misma cura**: quien está
 * recuperando **no conoce su contraseña actual**, ése es el punto del flujo.
 *
 * Así que hay exactamente dos desenlaces, y son opuestos:
 *   · **pasa** → GoTrue exime a las sesiones de recovery, y no hay nada que
 *     curar. La perilla convive con la recuperación.
 *   · **rebota `current_password_required`** → **la recuperación es imposible**
 *     mientras la perilla esté encendida, y la decisión no es un mensaje: es
 *     apagarla o cambiar el flujo. Es del founder.
 *
 * *Curar «por las dudas» acá sería adivinar, y adivinar en la dirección
 * equivocada dejaría el flujo roto con un mensaje bonito.*
 *
 * ── SE EJERCITAN LOS WRAPPERS DE LA PANTALLA, no `fetch` ────────────────────
 * Los dos pasos que la app usa desde S88 (D-659 los partió a propósito):
 * `verificarCodigoRecuperacion` deja la sesión, `establecerContrasenaNueva`
 * escribe sobre ella y **se puede reintentar sin quemar el token**.
 */
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { initApi, getClient } from '../packages/api/src/client';
import {
  verificarCodigoRecuperacion,
  establecerContrasenaNueva,
} from '../packages/api/src/wrappers/seguridad';

const CODIGO = process.argv[2];
const EMAIL = 'guillo381+d719rec@gmail.com';

// El largo del OTP es configurable en GoTrue (6 por defecto, pero no siempre).
// El guard acepta 6-8 y **no recorta ni completa**: si el código llegara con
// otro largo, lo manda tal cual y que el servidor lo juzgue. *Ajustar a mano un
// código que otro tipeó es fabricar el dato que se vino a verificar.*
if (!CODIGO || !/^\d{6,8}$/.test(CODIGO)) {
  console.log('\n  Uso: pnpm tsx scripts/verify-recuperar-s92bis.mts <codigo>');
  console.log(`  (el código llegó al correo de ${EMAIL})\n`);
  process.exit(1);
}

let fallos = 0;
const check = (cond: boolean, nombre: string) => {
  console.log(`${cond ? '  ✓' : '  ✗ FALLA'} ${nombre}`);
  if (!cond) fallos++;
};

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
) as Record<string, string>;

initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const NUEVA = `${randomBytes(9).toString('base64url').replace(/[^A-Za-z0-9]/g, 'x').slice(0, 10)}7!Zq`;

console.log('\n══ D-719 (b) · recuperar, por el camino de la pantalla ══\n');

// ── PASO 1 — canjear el código ──────────────────────────────────────────────
console.log('── paso 1 · verificar el código (deja sesión) ──');
const p1 = await verificarCodigoRecuperacion({ email: EMAIL, codigo: CODIGO });
console.log(`     ${p1.ok ? 'código VÁLIDO — hay sesión de recovery' : `${p1.codigo} · «${p1.mensaje}»`}`);
check(p1.ok, 'el código verifica y deja sesión');

if (p1.ok) {
  // ── PASO 2 — LA PREGUNTA ──────────────────────────────────────────────────
  console.log('\n── paso 2 · establecer la contraseña nueva (SIN saber la actual) ──');
  const p2 = await establecerContrasenaNueva({ nueva: NUEVA });
  console.log(`     ${p2.ok ? 'ACEPTADA' : `${p2.codigo} · «${p2.mensaje}»`}`);

  check(p2.ok, '🎯 LA RECUPERACIÓN FUNCIONA con la perilla encendida');
  if (!p2.ok) {
    console.log('\n  🔴 LA PERILLA ROMPE LA RECUPERACIÓN.');
    console.log('     No es un problema de mensaje: quien recupera NO conoce su');
    console.log('     contraseña actual. La decisión es del founder — apagar');
    console.log('     «require current password» o cambiar el flujo.\n');
  }

  // ── VERDE DOBLE — que el 200 no mienta ────────────────────────────────────
  if (p2.ok) {
    console.log('\n── verde doble · ¿la contraseña nueva ENTRA de verdad? ──');
    await getClient().auth.signOut();
    const login = await getClient().auth.signInWithPassword({ email: EMAIL, password: NUEVA });
    check(login.data.session !== null, 'entra con la contraseña que dejó la recuperación');
  }
}

await getClient().auth.signOut();
console.log(fallos === 0 ? '\n✅ TODO VERDE\n' : `\n🔴 ${fallos} FALLA(S)\n`);
process.exit(fallos === 0 ? 0 : 1);
