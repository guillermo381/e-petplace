/**
 * D-719 · EL CAMBIO DE CONTRASEÑA, POR EL CAMINO DE LA PANTALLA.
 *
 *   pnpm tsx scripts/verify-cambiar-contrasena-s92bis.mts
 *
 * ── POR QUÉ POR EL WRAPPER Y NO POR `fetch` ─────────────────────────────────
 * El defecto de D-719 **no vivía en el servidor**: vivía en que el wrapper no
 * mandaba un campo. Un assert por `fetch` mandaría lo que yo decida mandar y
 * daría verde con el wrapper roto — *mediría mi curl, no el producto*. Se
 * ejercita `cambiarContrasena` tal como la llama la pantalla.
 *
 * ── EL PAR ──────────────────────────────────────────────────────────────────
 *  ① ROJO REPRODUCIDO — el camino VIEJO (re-autenticar y después `updateUser`
 *    SIN `current_password`) tiene que seguir rebotando `400`. Si esto se
 *    pusiera verde, la perilla se habría apagado y el assert dejaría de
 *    discriminar: sería un verde que no prueba nada (Regla 4).
 *  ② VERDE — el wrapper curado cambia la clave.
 *  ③ VERDE DOBLE — la clave nueva ENTRA de verdad. *Que el PUT diga 200 no
 *    prueba que la persona pueda volver a entrar.*
 *  ④ CONTRA-CASO — con la contraseña actual EQUIVOCADA rebota hablado, y la
 *    clave **no cambia**. Sin este brazo, un wrapper que ignorase la actual
 *    también pasaría ①②③.
 */
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { initApi, getClient } from '../packages/api/src/client';
import { cambiarContrasena } from '../packages/api/src/wrappers/seguridad';

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

/** Claves aleatorias: por construcción no están en ninguna lista de filtradas
 *  (si lo estuvieran, el rebote sería por eso y el assert mediría otra cosa). */
const clave = () => `${randomBytes(9).toString('base64url').replace(/[^A-Za-z0-9]/g, 'x').slice(0, 10)}7!Zq`;

const EMAIL = `seg2-d719-${Date.now()}@epetplace.dev`;
const PW1 = clave();
const PW2 = clave();
const PW3 = clave();

try {
  console.log(`\n══ D-719 · cambio de contraseña por el camino de la pantalla ══\n`);

  // ── fixture ───────────────────────────────────────────────────────────────
  const alta = await getClient().auth.signUp({ email: EMAIL, password: PW1 });
  check(alta.error === null && alta.data.user !== null, 'fixture creado');
  if (alta.error) throw new Error(`no se pudo crear el fixture: ${alta.error.message}`);

  // ── ① ROJO REPRODUCIDO: el camino viejo sigue rebotando ───────────────────
  console.log('\n── ① ROJO · el camino VIEJO (updateUser sin current_password) ──');
  await getClient().auth.signOut();
  const login = await getClient().auth.signInWithPassword({ email: EMAIL, password: PW1 });
  check(login.data.session !== null, 're-autenticación previa: sesión FRESCA');
  const viejo = await getClient().auth.updateUser({ password: PW2 });
  const codigoViejo = (viejo.error as { code?: string } | null)?.code;
  console.log(`     servidor → ${viejo.error ? `${viejo.error.status} ${codigoViejo}` : '200 (¡pasó!)'}`);
  check(
    codigoViejo === 'current_password_required',
    'el camino viejo REBOTA `current_password_required` (el assert discrimina)',
  );

  // ── ② VERDE: el wrapper curado ────────────────────────────────────────────
  console.log('\n── ② VERDE · `cambiarContrasena` (el wrapper que usa la pantalla) ──');
  const r = await cambiarContrasena({ actual: PW1, nueva: PW2 });
  console.log(`     wrapper → ${r.ok ? 'ok' : `${r.codigo} · «${r.mensaje}»`}`);
  check(r.ok, 'la contraseña CAMBIA');

  // ── ③ VERDE DOBLE: la clave nueva entra ───────────────────────────────────
  console.log('\n── ③ VERDE DOBLE · ¿la clave nueva sirve para entrar? ──');
  await getClient().auth.signOut();
  const conNueva = await getClient().auth.signInWithPassword({ email: EMAIL, password: PW2 });
  check(conNueva.data.session !== null, 'entra con la contraseña NUEVA');
  await getClient().auth.signOut();
  const conVieja = await getClient().auth.signInWithPassword({ email: EMAIL, password: PW1 });
  check(conVieja.data.session === null, 'la contraseña VIEJA ya NO entra');

  // ── ④ CONTRA-CASO: la actual equivocada ───────────────────────────────────
  console.log('\n── ④ CONTRA-CASO · con la contraseña actual EQUIVOCADA ──');
  await getClient().auth.signOut();
  await getClient().auth.signInWithPassword({ email: EMAIL, password: PW2 });
  const malo = await cambiarContrasena({ actual: 'la-que-no-es-4242', nueva: PW3 });
  console.log(`     wrapper → ${malo.ok ? 'ok (¡no debería!)' : `${malo.codigo} · «${malo.mensaje}»`}`);
  check(!malo.ok && malo.codigo === 'contrasena_actual_incorrecta', 'rebota HABLADO, no genérico');

  await getClient().auth.signOut();
  const noCambio = await getClient().auth.signInWithPassword({ email: EMAIL, password: PW2 });
  check(noCambio.data.session !== null, 'y la contraseña NO cambió (sigue valiendo la de ②)');
} finally {
  await getClient().auth.signOut();
  console.log(`\n  (fixture ${EMAIL.split('@')[0]} — lo limpia scripts/seg2/limpiar-fixtures.mjs)`);
  console.log(fallos === 0 ? '\n✅ TODO VERDE\n' : `\n🔴 ${fallos} FALLA(S)\n`);
  process.exit(fallos === 0 ? 0 : 1);
}
