/**
 * D-720 · LA VOZ ÚNICA DE CONTRASEÑA DÉBIL, por el wrapper de la pantalla.
 *
 *   pnpm tsx scripts/verify-voz-contrasena-s92bis.mts
 *
 * ── EL ROJO QUE SE REPRODUCE ────────────────────────────────────────────────
 * `password123` tiene **once** caracteres y el mensaje viejo decía «necesita al
 * menos 8». No solo era falso: era **irresoluble** — quien obedecía agregaba
 * caracteres, probaba `password1234`, y volvía a rebotar. *El rebote empujaba a
 * la acción que garantizaba el próximo fracaso* (el bucle de D-659).
 *
 * El assert no puede pedirle al wrapper que distinga corta de filtrada: el
 * servidor manda el **mismo** `weak_password` para las dos. Lo que sí puede
 * exigir es que **el mensaje no mienta en ninguno de los dos casos**.
 *
 * ── QUÉ SE EXIGE ────────────────────────────────────────────────────────────
 *  ① las DOS causas rebotan con el MISMO código de la casa (`password_debil`);
 *  ② el mensaje **no afirma que el problema sea solo el largo**;
 *  ③ conserva las tres partes firmadas: el mínimo · la advertencia · el ejemplo;
 *  ④ y una clave sana entra (si rechazara todo, ①②③ pasarían igual — sin este
 *    brazo el assert no discrimina).
 */
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { initApi, getClient } from '../packages/api/src/client';
import { registrarse } from '../packages/api/src/wrappers/auth';
import { MIN_LARGO_CONTRASENA } from '../packages/api/src/wrappers/seguridad';

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

const correo = () => `seg2-voz-${randomBytes(4).toString('hex')}@epetplace.dev`;

console.log('\n══ D-720 · la voz única ante las dos causas ══\n');

// ── ① y ② — las dos causas, por el wrapper ──────────────────────────────────
const casos: Array<{ etiqueta: string; pw: string }> = [
  { etiqueta: '(a) CORTA    (6 chars)', pw: 'Ab1!Ab' },
  { etiqueta: '(b) FILTRADA (11 chars, NO es corta)', pw: 'password123' },
];

const mensajes: string[] = [];
for (const c of casos) {
  const r = await registrarse({ nombre: 'Fixture', email: correo(), password: c.pw });
  const codigo = r.ok ? '—' : r.codigo;
  const mensaje = r.ok ? '' : r.mensaje;
  console.log(`\n  ${c.etiqueta}`);
  console.log(`     código  : ${codigo}`);
  console.log(`     mensaje : «${mensaje}»`);
  check(!r.ok && r.codigo === 'password_debil', `${c.etiqueta} → password_debil`);
  if (!r.ok) mensajes.push(r.mensaje);
}

console.log('');
check(mensajes.length === 2 && mensajes[0] === mensajes[1], 'las dos causas dicen EXACTAMENTE lo mismo (una sola voz)');

const voz = mensajes[0] ?? '';
// ⚠️ El rojo concreto: el mensaje viejo era «La contraseña necesita al menos 8
// caracteres.» — una afirmación de largo, y nada más. Lo que se exige no es que
// el número desaparezca (el mínimo es cierto y tiene que decirse), sino que NO
// sea lo único que diga, porque ante una clave filtrada de once eso es mentira.
check(voz.includes(String(MIN_LARGO_CONTRASENA)), '③ conserva el MÍNIMO (la parte que nunca se recorta)');
check(/evita|fácil|común/i.test(voz), '③ conserva la ADVERTENCIA sobre claves fáciles');
check(/melon|lampara|rio|palabras/i.test(voz), '③ conserva el EJEMPLO de forma');
check(
  !/^La contraseña necesita al menos \d+ caracteres\.?$/.test(voz),
  '② ya NO es una afirmación de largo y nada más (el mensaje que mentía)',
);

// ── ④ el discriminador: una clave sana entra ────────────────────────────────
console.log('\n── ④ contra-caso · una clave SANA no puede rebotar ──');
const sana = `${randomBytes(9).toString('base64url').replace(/[^A-Za-z0-9]/g, 'x').slice(0, 10)}7!Zq`;
const ok = await registrarse({ nombre: 'Fixture', email: correo(), password: sana });
console.log(`     ${ok.ok ? 'aceptada' : `RECHAZADA · ${ok.codigo}`}`);
check(ok.ok, 'una clave aleatoria de 12 es ACEPTADA (el assert discrimina)');

await getClient().auth.signOut();
console.log(`\n  (fixtures seg2-voz-* — los limpia scripts/seg2/limpiar-fixtures.mjs)`);
console.log(fallos === 0 ? '\n✅ TODO VERDE\n' : `\n🔴 ${fallos} FALLA(S)\n`);
process.exit(fallos === 0 ? 0 : 1);
