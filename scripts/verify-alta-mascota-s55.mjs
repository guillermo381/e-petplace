// Asserts imperativos S55-A A2 — agregarMascotaAFamilia contra DB viva
// con la sesión demo (regla 47 / L-114: build verde ≠ contrato).
// Escribe UNA mascota de test en la familia demo e imprime su id para
// la limpieza quirúrgica server-side (verificación 0 residuos aparte).
import { readFileSync } from 'node:fs';
import {
  initApi,
  iniciarSesion,
  agregarMascotaAFamilia,
  obtenerMascotasDeFamilia,
  obtenerEstadoHogar,
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

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) {
  console.log('✗ no se pudo firmar la sesión demo:', login.mensaje);
  process.exit(1);
}

const FAM = 'de300000-0000-4000-8000-0000000000fa';

// T1 — alta feliz en la familia derivada server-side
const alta = await agregarMascotaAFamilia({
  nombre_mascota: '[TEST S55] Alta',
  especie: 'perro',
  fecha_nacimiento: '2023-03-01',
  precision_fecha: 'aproximada',
  sexo: 'macho',
});
check(alta.ok, 'T1 agregarMascotaAFamilia ok', alta.ok ? alta.data.mascota_id : `${alta.codigo}: ${alta.mensaje}`);
check(alta.ok && alta.data.familia_id === FAM, 'T1b la familia es la del caller (derivada, no parámetro)');
check(alta.ok && alta.data.pet_hash.length > 0, 'T1c pet_hash generado');

// T2 — la mascota nueva aparece en la lista de la familia
const lista = await obtenerMascotasDeFamilia(FAM);
check(
  lista.ok && lista.data.some((m) => m.id === (alta.ok ? alta.data.mascota_id : '')),
  'T2 obtenerMascotasDeFamilia la incluye',
  lista.ok ? `${lista.data.length} mascotas` : lista.codigo,
);

// T3 — el estado del hogar responde con señales en cero (peldaño 0 honesto)
const eh = alta.ok ? await obtenerEstadoHogar([alta.data.mascota_id]) : { ok: false, codigo: 'skip', mensaje: '' };
check(eh.ok, 'T3 obtenerEstadoHogar responde para la nueva');
if (eh.ok && alta.ok) {
  const s = eh.data.senales.find((x) => x.mascota_id === alta.data.mascota_id);
  check(!!s && s.vacunas_total === 0 && s.ultima_atencion_cerrada === null, 'T3b señales en cero (historia que empieza)');
}

// T4 — error tipado: especie inválida
const mala = await agregarMascotaAFamilia({ nombre_mascota: 'X', especie: 'dragon' });
check(!mala.ok && mala.codigo === 'especie_invalida_o_inactiva', 'T4 especie inválida → tipado', mala.ok ? 'PUDO' : mala.codigo);

// T5 — error tipado: nombre vacío
const sinNombre = await agregarMascotaAFamilia({ nombre_mascota: '   ', especie: 'perro' });
check(!sinNombre.ok && sinNombre.codigo === 'nombre_mascota_requerido', 'T5 nombre vacío → tipado', sinNombre.ok ? 'PUDO' : sinNombre.codigo);

console.log(`\nMASCOTA_TEST_ID=${alta.ok ? alta.data.mascota_id : 'NINGUNA'} (limpieza quirúrgica server-side por id)`);
console.log(fallos === 0 ? 'TODOS LOS ASSERTS PASARON' : `${fallos} ASSERT(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
