// Asserts imperativos S91-A — el catálogo de razas (D-379) y la cláusula
// del pez, POR LA PUERTA REAL (wrappers), contra la DB viva con sesión
// demo (regla 47 / L-114: build verde ≠ contrato real).
//
// Escribe DOS mascotas de test en la familia demo (una con raza, un
// acuario) e imprime sus ids para la limpieza quirúrgica por id — que se
// ejecuta al final de este mismo script y se verifica residuo 0.
import { readFileSync } from 'node:fs';
import {
  initApi,
  getClient,
  iniciarSesion,
  obtenerRazasDeEspecie,
  agregarMascotaAFamilia,
  obtenerMascotasDeFamilia,
} from '../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

let fallos = 0;
function check(cond, nombre, detalle = '') {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos += 1;
}

const login = await iniciarSesion({
  email: env.EXPO_PUBLIC_DEMO_EMAIL,
  password: env.EXPO_PUBLIC_DEMO_PASSWORD,
});
if (!login.ok) {
  console.log('✗ no se pudo firmar la sesión demo:', login.mensaje);
  process.exit(1);
}

const FAM = 'de300000-0000-4000-8000-0000000000fa';
const creadas = [];

// ── T1 · el catálogo se lee por la puerta y trae el nombre VERBATIM ────
const perros = await obtenerRazasDeEspecie('perro');
check(perros.ok && perros.data.length === 44, 'T1 razas de perro = 44', perros.ok ? `${perros.data.length}` : perros.codigo);
const conAcento = perros.ok ? perros.data.find((r) => r.slug === 'pastor-aleman') : null;
check(
  conAcento?.nombre === 'Pastor Alemán',
  'T1b el acento llega ENTERO al wrapper',
  conAcento ? `[${conAcento.nombre}]` : 'sin fila',
);
check(
  conAcento?.ruta_imagen === 'perro/pastor-aleman.webp',
  'T1c la ruta apunta al bucket vivo',
  conAcento?.ruta_imagen,
);

// T1d · la ruta EXISTE en el bucket (la imagen del tipeo predictivo no
// puede ser una promesa: si el path miente, la sugerencia sale rota).
const urlImg = `${env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/especies-razas/${conAcento?.ruta_imagen ?? 'x'}`;
const resImg = await fetch(urlImg, { method: 'HEAD' });
check(resImg.status === 200, 'T1d la imagen de esa raza existe en el bucket', `HTTP ${resImg.status}`);

// T1e · el catálogo NO trae «Mestizo» — la respuesta de primera clase la
// pone la superficie, no una fila. Si algún día aparece como fila, este
// assert avisa antes de que se convierta en «premio consuelo».
check(
  perros.ok && !perros.data.some((r) => /mestizo|no s[eé]/i.test(r.nombre)),
  'T1e «Mestizo / No sé» NO son filas del catálogo',
);

// T1f · una especie ofrecida sin razas devuelve lista vacía, jamás error
const conejos = await obtenerRazasDeEspecie('conejo');
check(conejos.ok && conejos.data.length === 8, 'T1f razas de conejo = 8', conejos.ok ? `${conejos.data.length}` : conejos.codigo);

// ── T2 · la raza VIAJA por la puerta y se guarda ───────────────────────
const conRaza = await agregarMascotaAFamilia({
  nombre_mascota: '[TEST S91] Con raza',
  especie: 'perro',
  raza: 'Pastor Alemán',
});
check(conRaza.ok, 'T2 alta con raza ok', conRaza.ok ? conRaza.data.mascota_id : `${conRaza.codigo}: ${conRaza.mensaje}`);
if (conRaza.ok) creadas.push(conRaza.data.mascota_id);

// ── T3 · LA CLÁUSULA DEL PEZ por la puerta: el motor estampa acuario ───
const acuario = await agregarMascotaAFamilia({
  nombre_mascota: '[TEST S91] El arrecife',
  especie: 'pez',
  tipo_agua: 'marino',
});
check(acuario.ok, 'T3 alta de acuario ok', acuario.ok ? acuario.data.mascota_id : `${acuario.codigo}: ${acuario.mensaje}`);
if (acuario.ok) creadas.push(acuario.data.mascota_id);

const lista = await obtenerMascotasDeFamilia(FAM);
const filaAcuario = lista.ok && acuario.ok ? lista.data.find((m) => m.id === acuario.data.mascota_id) : null;
check(
  filaAcuario?.sujeto === 'acuario' && filaAcuario?.tipo_agua === 'marino',
  'T3b el lector distingue el ACUARIO del individuo',
  filaAcuario ? `sujeto=${filaAcuario.sujeto} agua=${filaAcuario.tipo_agua}` : 'sin fila',
);
const filaPerro = lista.ok && conRaza.ok ? lista.data.find((m) => m.id === conRaza.data.mascota_id) : null;
check(
  filaPerro?.sujeto === 'individuo' && filaPerro?.tipo_agua === null,
  'T3c el par: el perro sigue siendo individuo, sin agua',
  filaPerro ? `sujeto=${filaPerro.sujeto} agua=${filaPerro.tipo_agua}` : 'sin fila',
);

// ── T4 · ROJOS PRODUCIDOS, tipados por el wrapper ──────────────────────
const pezConRaza = await agregarMascotaAFamilia({
  nombre_mascota: '[TEST S91] No debe existir',
  especie: 'pez',
  raza: 'Betta',
});
check(
  !pezConRaza.ok && pezConRaza.codigo === 'raza_no_aplica_acuario',
  'T4 pez con raza rebota TIPADO',
  pezConRaza.ok ? 'PASÓ (mal)' : pezConRaza.codigo,
);
if (pezConRaza.ok) creadas.push(pezConRaza.data.mascota_id);

const perroConAgua = await agregarMascotaAFamilia({
  nombre_mascota: '[TEST S91] No debe existir 2',
  especie: 'perro',
  tipo_agua: 'dulce',
});
check(
  !perroConAgua.ok && perroConAgua.codigo === 'tipo_agua_solo_pez',
  'T4b tipo de agua en un no-pez rebota TIPADO',
  perroConAgua.ok ? 'PASÓ (mal)' : perroConAgua.codigo,
);
if (perroConAgua.ok) creadas.push(perroConAgua.data.mascota_id);

// ── LIMPIEZA quirúrgica por id + residuo ───────────────────────────────
for (const id of creadas) {
  const { error } = await getClient().from('mascotas').delete().eq('id', id);
  if (error) console.log(`  ⚠ no se pudo borrar ${id}: ${error.message}`);
}
const post = await obtenerMascotasDeFamilia(FAM);
const residuo = post.ok ? post.data.filter((m) => m.nombre.startsWith('[TEST S91]')).length : -1;
check(residuo === 0, 'LIMPIEZA residuo 0', `${residuo} filas [TEST S91]`);

console.log(fallos === 0 ? '\nTODO VERDE' : `\n${fallos} FALLOS`);
process.exit(fallos === 0 ? 0 : 1);
