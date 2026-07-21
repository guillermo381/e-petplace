// Verificación S73-A · 🔴 fixture memorial — la frontera mascotasElegibles
// corrida en los 4 oficios con la sesión demo REAL (regla 47 / L-114:
// typecheck verde ≠ contrato). El fixture ('[TEST S73] Memorial', perro,
// estado_vida='fallecida') se inserta y limpia por id FUERA de este script
// (solo-SELECT acá, patrón lib-db).
//
// Qué prueba: una mascota en MEMORIAL no es elegible en NINGÚN oficio —
// incluida la vet, que no filtra especie (multi-especie por diseño): si el
// fixture desapareciera solo del paseo, sería el filtro de especie
// disfrazado; que desaparezca de la VET prueba el camino del momento vital.
import { readFileSync } from 'node:fs';
import {
  initApi,
  iniciarSesion,
  obtenerMascotasDeFamilia,
  obtenerEspeciesElegibles,
  mascotasElegibles,
} from '../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const FAM = 'de300000-0000-4000-8000-0000000000fa';
const FIXTURE = '[TEST S73] Memorial';

let fallos = 0;
function check(cond, nombre, detalle = '') {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos += 1;
}

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) {
  console.log('✗ no se pudo firmar la sesión demo:', login.mensaje);
  process.exit(1);
}

const r = await obtenerMascotasDeFamilia(FAM);
if (!r.ok) {
  console.log('✗ obtenerMascotasDeFamilia falló:', r.mensaje);
  process.exit(1);
}
console.log('— mascotas de la familia demo (lector, literal):');
for (const m of r.data) console.log(`    ${m.nombre} · ${m.especie} · estado_vida=${m.estado_vida}`);

const fixture = r.data.find((m) => m.nombre === FIXTURE);
check(fixture !== undefined, 'T0 el fixture memorial LLEGA por el lector (el lector no esconde: filtra la frontera)');
check(fixture?.estado_vida === 'fallecida', 'T0b estado_vida del fixture angostado = fallecida');

// Los 4 oficios: paseo/grooming/adiestramiento con sus especies del
// catálogo; la vet con null POR DISEÑO (multi-especie).
const oficios = [];
for (const categoria of ['paseo', 'grooming', 'adiestramiento']) {
  const e = await obtenerEspeciesElegibles(categoria);
  if (!e.ok) {
    console.log(`✗ especies de ${categoria} fallaron:`, e.mensaje);
    process.exit(1);
  }
  oficios.push({ oficio: categoria, especies: e.data });
}
oficios.push({ oficio: 'veterinaria', especies: null });

for (const { oficio, especies } of oficios) {
  const elegibles = mascotasElegibles(r.data, especies);
  console.log(
    `— ${oficio} (especies=${especies === null ? 'todas (null)' : JSON.stringify(especies)}): elegibles = [${elegibles.map((m) => m.nombre).join(', ')}]`,
  );
  check(
    !elegibles.some((m) => m.nombre === FIXTURE),
    `${oficio}: el memorial NO es elegible`,
  );
  check(
    elegibles.some((m) => m.estado_vida === 'activa'),
    `${oficio}: al menos una activa sigue elegible (la frontera no vació de más)`,
  );
}

console.log(fallos === 0 ? '\nTODO VERDE' : `\n${fallos} FALLOS`);
process.exit(fallos === 0 ? 0 : 1);
