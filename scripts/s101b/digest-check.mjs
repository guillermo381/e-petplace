/**
 * S101-B · DIGEST-CHECK — corre en CADA deploy de la página de pago.
 *
 * 🔴 POR QUÉ EXISTE: el 19-ago la página publicó en `config.js` la clave
 *    **SERVER** —la que firma cobros— porque las variables se cargaron
 *    corridas un lugar. Nada lo dijo: el build fue verde, la página se veía
 *    bien, y el único síntoma fue un `500` que parecía del proveedor.
 *
 * ⇒ Este check compara lo que la página SIRVE contra los digests conocidos.
 *   **Rojo = se baja el deploy.** No es opinable: una clave de firma servida
 *   a un navegador es un incidente, no un defecto de configuración.
 *
 * Uso:  node scripts/s101b/digest-check.mjs [url]
 */
import crypto from 'node:crypto';

const URL_BASE = process.argv[2] ?? 'https://epetplace-pagos-stg.vercel.app';
const sha = (v) => crypto.createHash('sha256').update(v).digest('hex');

/** Digests conocidos, medidos de los secrets de Supabase (S101-A/B). */
const D = {
  CODE_CLIENT: 'ab3e6561de95cb69a5bb869059887018d8db3dbe2cac2a9223c5c46760f16b2f',
  KEY_CLIENT:  '1ddf2447ee111c0fa16c28207780cd7d05b812d01cf00ef5fc78379b5135174f',
  CODE_SERVER: '547e64079863a895b4a1259ac70fd1cef72f5d5d7552f8bf3108329deaf9bc18',
  KEY_SERVER:  'e47414da2bbfb74de7361617355bb9d154599fa150491fd30744e6a35a1c9ef6',
};

const txt = await (await fetch(`${URL_BASE}/config.js`)).text();
const cuerpo = txt.replace(/^\/\*[\s\S]*?\*\/\s*/, '').replace(/^var\s+CONFIG\s*=\s*/, '').replace(/;\s*$/, '');

let C;
try { C = JSON.parse(cuerpo); }
catch { console.error('🔴 config.js no es legible. ¿La página está caída?\n', txt.slice(0, 160)); process.exit(1); }

const hCode = sha(C.APP_CODE ?? ''), hKey = sha(C.APP_KEY ?? '');
const filas = [
  ['APP_CODE servido == CODE_CLIENT', hCode === D.CODE_CLIENT],
  ['APP_KEY  servido == KEY_CLIENT',  hKey  === D.KEY_CLIENT],
  ['🔴 APP_KEY  NO es la KEY SERVER', hKey  !== D.KEY_SERVER],
  ['🔴 APP_CODE NO es la KEY SERVER', hCode !== D.KEY_SERVER],
  ['🔴 ningún valor es el CODE SERVER', hCode !== D.CODE_SERVER && hKey !== D.CODE_SERVER],
  ['APP_CODE tiene forma de NOMBRE', /-CLIENT$/.test(C.APP_CODE ?? '')],
];

let rojo = false;
for (const [q, ok] of filas) { console.log(`${ok ? '✓' : '🔴'} ${q}`); if (!ok) rojo = true; }

if (rojo) {
  console.error('\n🔴 DIGEST-CHECK EN ROJO — BAJAR EL DEPLOY.\n' +
    '   `vercel remove epetplace-pagos-stg --yes`, y recargar las variables.\n' +
    '   Precedente: 19-ago-2026, la clave SERVER servida ~1 h en config.js.');
  process.exit(1);
}
console.log('\n✓ digest-check VERDE · solo el juego CLIENT se sirve');
