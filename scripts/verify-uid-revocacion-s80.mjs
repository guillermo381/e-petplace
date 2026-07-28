// S80-A14 · FIXTURE DE LA REVOCACIÓN REMOTA — la condición exigible del
// founder, PROBADA, no argumentada:
//
//   "El rebote del server por revocación remota sale como ERROR DE
//    SERVIDOR — jamás como sin_sesion, jamás como lista vacía."
//
// Es D-571/L-178 literal: un permiso denegado disfrazado de dato faltante.
//
// CÓMO SE REPRODUCE LA REVOCACIÓN (sin tocar producción, sin service_role):
// se firma una sesión REAL, se le CORROMPE la firma del access_token y se
// re-inyecta en el storage. Eso es exactamente el estado post-revocación
// visto desde el cliente: el store LOCAL sigue teniendo user.id (getSession
// lo devuelve sin red) y el SERVER rechaza el token. Cero escritura: todas
// las llamadas del fixture son lectoras.
//
// DISCRIMINADOR (el fixture no es tautológico — esta es su razón de ser):
//   · con `auth.getUser()` (código PRE-A14): getUser va a la red, falla,
//     el wrapper lee user=null y devuelve **sin_sesion** ⇒ EL FIXTURE FALLA.
//   · con `uidActual()` sobre getSession (código POST-A14): el uid está,
//     la query sale, el server rebota 401 y el wrapper devuelve **error de
//     servidor** ⇒ EL FIXTURE PASA.
// Correrlo ANTES de aplicar debe dar ROJO. Si da verde antes, el fixture
// no está probando nada (L-063: la verificación ES el test).
//
// Uso: node --experimental-strip-types scripts/verify-uid-revocacion-s80.mjs
import { readFileSync } from 'node:fs';
import {
  initApi,
  iniciarSesion,
  obtenerMiPrestador,
  obtenerBloqueosPrestador,
  obtenerModoHorarios,
  obtenerMiCuentaComercial,
  obtenerMisLiquidaciones,
  obtenerResumenPendienteLiquidar,
  obtenerOfertasPaseoPropias,
  obtenerTitularId,
  obtenerInvitacionPendiente,
  obtenerNegocioEmpleadoActivo,
} from '../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

let fallos = 0;
function check(cond, nombre, detalle = '') {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos += 1;
}

// ── Storage en memoria: nos deja LEER lo que el SDK guarda y REESCRIBIRLO.
let guardado = new Map();
const storage = {
  getItem: (k) => guardado.get(k) ?? null,
  setItem: (k, v) => void guardado.set(k, v),
  removeItem: (k) => void guardado.delete(k),
};

// ══ FASE 1 — sesión SANA (baseline: el fixture prueba que sabe leer verde)
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, { storageSesion: storage });
const login = await iniciarSesion({
  email: env.EXPO_PUBLIC_DEMO_EMAIL,
  password: env.EXPO_PUBLIC_DEMO_PASSWORD,
});
if (!login.ok) {
  console.log('✗ no se pudo firmar la sesión demo:', login.mensaje);
  process.exit(1);
}
const sano = await obtenerMiPrestador();
check(sano.ok || sano.codigo === 'sin_prestador', 'F1 · baseline: la sesión sana resuelve (ok o sin_prestador)',
  sano.ok ? 'ok' : sano.codigo);

// ── Corromper la FIRMA del access_token (3er segmento del JWT).
const claveSesion = [...guardado.keys()].find((k) => k.includes('auth-token'));
if (claveSesion === undefined) {
  console.log('✗ no se encontró la sesión en el storage — el adapter no se usó');
  process.exit(1);
}
const sesion = JSON.parse(guardado.get(claveSesion));
const partes = String(sesion.access_token).split('.');
if (partes.length !== 3) {
  console.log('✗ el access_token no tiene shape JWT — abortando');
  process.exit(1);
}
partes[2] = 'firma-invalidada-por-el-fixture';
sesion.access_token = partes.join('.');
sesion.refresh_token = 'refresh-invalidado-por-el-fixture';
guardado.set(claveSesion, JSON.stringify(sesion));

// Re-init: el cliente nuevo levanta la sesión CORROMPIDA del storage.
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, { storageSesion: storage });

// ══ FASE 2 — LA CONDICIÓN EXIGIBLE, wrapper por wrapper.
// Prohibido: 'sin_sesion' (permiso denegado disfrazado de "no hay sesión")
// y ok:true con lista vacía (disfrazado de "no hay datos").
const PREST = 'de300000-0000-4000-8000-0000000000e5';

const casos = [
  ['prestador · obtenerMiPrestador', () => obtenerMiPrestador()],
  ['bloqueos · obtenerBloqueosPrestador', () => obtenerBloqueosPrestador(PREST)],
  ['horarios-modo · obtenerModoHorarios', () => obtenerModoHorarios(PREST)],
  ['cuentaComercial · obtenerMiCuentaComercial', () => obtenerMiCuentaComercial()],
  ['liquidaciones · obtenerMisLiquidaciones', () => obtenerMisLiquidaciones()],
  ['eventosEconomicos · obtenerResumenPendienteLiquidar', () => obtenerResumenPendienteLiquidar()],
  ['configuracionPaseo · obtenerOfertasPaseoPropias', () => obtenerOfertasPaseoPropias(PREST)],
];

for (const [nombre, llamar] of casos) {
  let r;
  try {
    r = await llamar();
  } catch (e) {
    check(false, `${nombre}: no lanza`, String(e));
    continue;
  }
  const esVacioMentiroso = r.ok === true && Array.isArray(r.data) && r.data.length === 0;
  const esSinSesion = r.ok === false && r.codigo === 'sin_sesion';
  check(
    !esSinSesion && !esVacioMentiroso,
    `${nombre}: rebote del server, jamás sin_sesion ni vacío`,
    r.ok ? `ok data=${JSON.stringify(r.data).slice(0, 40)}` : `codigo=${r.codigo}`,
  );
}

// ── titular.ts: lector SUAVE (devuelve null, no ResultadoWrapper). Su
// contrato no puede distinguir — se declara y se mide para que quede
// registrado, sin exigirle lo que su firma no puede dar.
const t = await obtenerTitularId(PREST);
console.log(`ℹ titular · obtenerTitularId (lector suave, null-o-valor): ${t === null ? 'null' : 'valor'} — su firma NO puede hablar; hueco declarado`);

// ── LAS DOS SONDAS de equipo, en el escenario REVOCACIÓN.
// ENMIENDA DEL PROPIO FIXTURE (S80-A14, hallazgo de la corrida): la
// primera versión de este assert exigía que las sondas conservaran
// `ok:true/data:null` TAMBIÉN acá — y eso habría sido FABRICAR D-571
// dentro de las sondas: decir "no tenés invitación pendiente" cuando la
// verdad es "no pude leer". La semántica ok:true/data:null es para
// **sin sesión LOCAL** (lo que el guard raíz consume, fase 3); ante un
// rebote del server la sonda debe DECIR que no sabe.
const s1 = await obtenerInvitacionPendiente();
check(!(s1.ok === true && s1.data === null), 'SONDA equipo · obtenerInvitacionPendiente NO afirma ausencia ante rebote',
  s1.ok ? `ok data=${s1.data}` : `codigo=${s1.codigo}`);
const s2 = await obtenerNegocioEmpleadoActivo();
check(!(s2.ok === true && s2.data === null), 'SONDA equipo · obtenerNegocioEmpleadoActivo NO afirma ausencia ante rebote',
  s2.ok ? `ok data=${s2.data}` : `codigo=${s2.codigo}`);

// ══ FASE 3 — SIN SESIÓN LOCAL: acá SÍ rige el contrato del guard raíz.
// (Storage vaciado = el estado real de un logout / arranque sin sesión.)
guardado = new Map();
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, { storageSesion: storage });
const t1 = await obtenerInvitacionPendiente();
check(t1.ok === true && t1.data === null, 'F3 · SONDA obtenerInvitacionPendiente conserva ok:true/data:null sin sesión',
  t1.ok ? `data=${t1.data}` : `codigo=${t1.codigo}`);
const t2 = await obtenerNegocioEmpleadoActivo();
check(t2.ok === true && t2.data === null, 'F3 · SONDA obtenerNegocioEmpleadoActivo conserva ok:true/data:null sin sesión',
  t2.ok ? `data=${t2.data}` : `codigo=${t2.codigo}`);
const t3 = await obtenerMiPrestador();
check(t3.ok === false && t3.codigo === 'sin_sesion', 'F3 · sin sesión local, sin_sesion vuelve a significar SIN SESIÓN',
  t3.ok ? 'ok' : `codigo=${t3.codigo}`);

console.log(fallos === 0 ? '\n✓ TODO VERDE' : `\n✗ ${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
