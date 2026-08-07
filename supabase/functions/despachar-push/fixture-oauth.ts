// ============================================================================
// FIXTURE del `fcm-oauth` — S90-C
//
// Verifica la ÚNICA pieza de esta función escrita a mano contra un contrato
// ajeno: el JWT RS256 del `jwt-bearer` de Google. **Importa el módulo real**,
// no una copia — un fixture que reimplementa el algoritmo prueba el tubo y no
// el agua (L-207).
//
// NO sale a la red y NO necesita la llave del founder: firma con una llave
// RSA generada al momento y VERIFICA la firma con su pública. Si estos bytes
// verifican acá, verifican en Google — es el mismo algoritmo sobre el mismo
// material.
//
// L-199: el ROJO se produce ANTES. El caso 4 rompe la firma a propósito y
// EXIGE que la verificación falle: un verificador que dice «sí» a una firma
// adulterada no verifica nada.
//
//   deno run --allow-read fixture-oauth.ts <ruta-al-sa.json>
// ============================================================================

import { firmarAssertion, importarClave, type CuentaDeServicio } from './fcm-oauth.ts';

const ruta = Deno.args[0];
if (!ruta) {
  console.error('falta la ruta al json de cuenta de servicio');
  Deno.exit(2);
}

const sa: CuentaDeServicio = JSON.parse(await Deno.readTextFile(ruta));

function decodificar(parte: string): unknown {
  const b64 = parte.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)));
}

/** La pública que corresponde a la privada del PEM — es lo que Google tiene
 *  de su lado. Se deriva con `openssl` afuera y se pasa por archivo. */
const pemPublica = await Deno.readTextFile(Deno.args[1]);
const derPub = Uint8Array.from(
  atob(
    pemPublica
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s+/g, ''),
  ),
  (c) => c.charCodeAt(0),
);
const clavePublica = await crypto.subtle.importKey(
  'spki',
  derPub,
  { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
  false,
  ['verify'],
);

async function verificar(jwt: string): Promise<boolean> {
  const [h, c, f] = jwt.split('.');
  const firma = Uint8Array.from(
    atob(f.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (f.length % 4)) % 4)),
    (x) => x.charCodeAt(0),
  );
  return await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    clavePublica,
    firma,
    new TextEncoder().encode(`${h}.${c}`),
  );
}

let fallos = 0;
const AHORA = 1786000000; // fijo: el fixture no depende del reloj

function chequear(nombre: string, ok: boolean, detalle = '') {
  console.log(`${ok ? '  ✓' : '  ✗'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
}

console.log('\nFIXTURE fcm-oauth — la firma que Google va a verificar\n');

// ── 1 · La firma verifica con la pública ──────────────────────────────────
const jwt = await firmarAssertion(sa, AHORA);
chequear('1 · la firma RS256 verifica contra la clave pública', await verificar(jwt));

// ── 2 · El claim dice lo que Google exige ─────────────────────────────────
const claims = decodificar(jwt.split('.')[1]) as Record<string, unknown>;
const cab = decodificar(jwt.split('.')[0]) as Record<string, unknown>;
chequear('2a · alg=RS256', cab.alg === 'RS256', String(cab.alg));
chequear('2b · aud = endpoint de token', claims.aud === 'https://oauth2.googleapis.com/token');
chequear(
  '2c · scope = firebase.messaging',
  claims.scope === 'https://www.googleapis.com/auth/firebase.messaging',
);
chequear('2d · iss = client_email de la llave', claims.iss === sa.client_email);
chequear('2e · exp = iat + 3600 (tope de Google)', claims.exp === AHORA + 3600);

// ── 3 · El PEM con `\n` LITERALES (la forma que llega por env var) ────────
// Es el caso que rompe en producción y no en la máquina de quien lo escribe.
const saEscapado: CuentaDeServicio = { ...sa, private_key: sa.private_key.replace(/\n/g, '\\n') };
let ok3 = false;
try {
  await importarClave(saEscapado.private_key);
  ok3 = (await firmarAssertion(saEscapado, AHORA)) === jwt;
} catch (e) {
  ok3 = false;
  console.log('     (excepción: ' + String(e).slice(0, 90) + ')');
}
chequear('3 · el PEM con \\n literales produce la MISMA firma', ok3);

// ── 4 · EL ROJO PRODUCIDO (L-199) ────────────────────────────────────────
// Se adultera el claim conservando la firma. DEBE fallar.
const [h, , f] = jwt.split('.');
const claimFalso = btoa(JSON.stringify({ ...claims, iss: 'otro@atacante.com' }))
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');
const adulterado = `${h}.${claimFalso}.${f}`;
chequear('4 · ROJO PRODUCIDO: un claim adulterado NO verifica', (await verificar(adulterado)) === false);

console.log(`\n${fallos === 0 ? 'VERDE' : 'EN ROJO'} — ${fallos} fallo(s)\n`);
Deno.exit(fallos === 0 ? 0 : 1);
