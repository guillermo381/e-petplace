// S75-A1 (R1 + C1) — el assert que el typecheck NO puede dar: `obtenerMiPrestador`
// resuelve IDENTIDAD, y la identidad no es un tipo. Dos JWT REALES (L-151):
//
//   (1) EL TITULAR — no-regresión de las 26 pantallas: el wrapper devuelve
//       EXACTAMENTE la misma fila que la consulta de siempre (`user_id`),
//       campo por campo contra la DB. Si el paso 2 se comiera el camino del
//       titular, esto se pone rojo.
//   (2) UN EMPLEADO ACTIVO SEMBRADO — el caso que hasta S74 recibía
//       `sin_prestador` (D-512). Fixture de assert, JAMÁS camino de producto:
//       el handshake sigue pospuesto (§8.8) y lo restituye la superficie de B.
//
// Y de yapa C1: `obtenerComisionVigenteCita` corre por R1 (L-150) — si
// duplicara el resolvedor, el empleado quedaría sin comisión en el taller.
//
// El fixture se limpia POR ID y la limpieza se VERIFICA (residuos 0).
//   Correr:  pnpm tsx scripts/verify-r1-resolvedor-s75.mts
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { initApi, getClient } from '../packages/api/src/client';
import { obtenerMiPrestador, type MiPrestador } from '../packages/api/src/wrappers/prestador';
import { obtenerComisionVigenteCita } from '../packages/api/src/wrappers/fees';

// ── constantes del fixture ──────────────────────────────────────────────────
const NEGOCIO_FIXTURE = 'de580000-0000-4000-8000-0000000000b1'; // [DEMO S58] Wizard
const NEGOCIO_FIXTURE_NOMBRE = '[DEMO S58] Wizard';
const TITULAR_DEL_FIXTURE = '9faf03c3-30a4-45a3-9083-eb6bc20f5684'; // created_by NOT NULL
const EMAIL_FIXTURE = 'guillo381+r1fixture@gmail.com';
const PASSWORD_FIXTURE = 'fixture-r1-s75';

const COLUMNAS = [
  'id', 'nombre_comercial', 'tipo', 'country_code', 'cuenta_comercial_id',
  'direccion', 'ciudad', 'grooming_extra_pelaje_largo', 'grooming_recargo_domicilio',
  'descripcion', 'telefono', 'whatsapp', 'email_contacto', 'sitio_web', 'estado',
] as const;

// ── harness ─────────────────────────────────────────────────────────────────
let fallos = 0;
const check = (cond: boolean, nombre: string) => {
  console.log(`${cond ? '✓' : '✗ FALLA'} ${nombre}`);
  if (!cond) fallos++;
};

function sql(consulta: string): Record<string, unknown>[] {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', consulta], {
    encoding: 'utf8',
  });
  if (r.status !== 0) throw new Error(`db query falló: ${(r.stderr || r.stdout).slice(0, 500)}`);
  const i = r.stdout.indexOf('{');
  if (i === -1) throw new Error(`db query sin JSON: ${r.stdout.slice(0, 400)}`);
  return JSON.parse(r.stdout.slice(i)).rows as Record<string, unknown>[];
}

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
) as Record<string, string>;

initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function entrarComo(email: string, password: string): Promise<string> {
  await getClient().auth.signOut();
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`login de ${email} falló: ${error?.message ?? 'sin sesión'}`);
  return data.session.user.id;
}

let idFixture: string | null = null; // fila de prestador_empleados
let userFixture: string | null = null; // auth user

try {
  // ══ PASO 1 · EL TITULAR: no-regresión de las 26 ═══════════════════════════
  console.log('\n── PASO 1 · titular (no-regresión de las 26 consumidoras) ──');
  const uidTitular = await entrarComo(env.EXPO_PUBLIC_DEMO_EMAIL, env.EXPO_PUBLIC_DEMO_PASSWORD);

  const [esperado] = sql(
    `select ${COLUMNAS.join(', ')} from prestadores where user_id = '${uidTitular}'`,
  );
  check(esperado !== undefined, 'el titular tiene fila propia en prestadores (premisa del assert)');

  const r1Titular = await obtenerMiPrestador();
  check(r1Titular.ok, 'obtenerMiPrestador ok para el titular');
  if (r1Titular.ok && esperado) {
    const fila = r1Titular.data as unknown as Record<string, unknown>;
    // Los `numeric` viajan distinto por cada transporte (el CLI los da como
    // texto — "2.00" —, PostgREST como número — 2): se comparan por VALOR,
    // no por su representación. Comparar strings acá daba un rojo que era
    // del assert, no del wrapper.
    const iguales = (a: unknown, b: unknown) => {
      if (a === null || b === null || a === undefined || b === undefined) return (a ?? null) === (b ?? null);
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb) && a !== '' && b !== '') return na === nb;
      return JSON.stringify(a) === JSON.stringify(b);
    };
    const distintas = COLUMNAS.filter((c) => !iguales(fila[c], esperado[c]));
    check(
      distintas.length === 0,
      `la fila del titular es IDÉNTICA a la de la consulta de siempre (${COLUMNAS.length} columnas)` +
        (distintas.length ? ` — difieren: ${distintas.join(', ')}` : ''),
    );
    check(Object.keys(fila).length === COLUMNAS.length, 'sin columnas de más ni de menos');
  }

  const feeTitular = await obtenerComisionVigenteCita();
  check(feeTitular.ok, `C1 por R1 para el titular${feeTitular.ok ? ` (${feeTitular.data.porcentaje}%)` : ` — ${feeTitular.codigo}`}`);

  // ══ PASO 2 · sembrar el empleado activo ══════════════════════════════════
  console.log('\n── PASO 2 · fixture: empleado ACTIVO (jamás camino de producto) ──');
  const anon = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  const alta = await anon.auth.signUp({ email: EMAIL_FIXTURE, password: PASSWORD_FIXTURE });
  if (alta.error && !/already/i.test(alta.error.message)) {
    throw new Error(`signUp del fixture falló: ${alta.error.message}`);
  }
  const [u] = sql(`select id from auth.users where email = '${EMAIL_FIXTURE}'`);
  userFixture = String(u?.id ?? '');
  check(userFixture.length > 0, `auth user del fixture listo (${userFixture.slice(0, 8)}…)`);

  const [ins] = sql(
    `insert into prestador_empleados (prestador_id, user_id, rol, nombre, activo, created_by)
     values ('${NEGOCIO_FIXTURE}', '${userFixture}', 'empleado', '[FIXTURE S75] assert R1', true, '${TITULAR_DEL_FIXTURE}')
     returning id`,
  );
  idFixture = String(ins?.id ?? '');
  check(idFixture.length > 0, `vínculo activo sembrado (${idFixture.slice(0, 8)}…)`);
  check(
    sql(`select count(*)::int c from empleado_roles where empleado_id = '${idFixture}'`)[0].c === 0,
    'el fixture NO tiene rol asignado — es identidad pura, cero permiso (D-490/D-513 intactas)',
  );

  // ══ PASO 3 · EL EMPLEADO: el caso que hasta S74 rebotaba ═════════════════
  console.log('\n── PASO 3 · empleado activo (el destrabe de D-512) ──');
  await entrarComo(EMAIL_FIXTURE, PASSWORD_FIXTURE);

  const r1Empleado = await obtenerMiPrestador();
  check(r1Empleado.ok, `obtenerMiPrestador ok para el empleado${r1Empleado.ok ? '' : ` — ${r1Empleado.codigo}`}`);
  if (r1Empleado.ok) {
    check(r1Empleado.data.id === NEGOCIO_FIXTURE, 'devuelve el negocio de SU vínculo, no otro');
    check(
      r1Empleado.data.nombre_comercial === NEGOCIO_FIXTURE_NOMBRE,
      `nombre_comercial = "${r1Empleado.data.nombre_comercial}"`,
    );
    check(r1Empleado.data.cuenta_comercial_id !== null, 'trae cuenta_comercial_id (lo que C1 necesita)');
  }

  // C1 llega hasta la RPC (prueba de que consume R1: antes ni siquiera
  // resolvía el negocio), y ahí choca con el gate D-348 de
  // `resolver_fee_aplicable`, que exige ser `owner_profile_id` de la
  // cuenta comercial. Es el MURO R2 del canon, y para un empleado SIN rol
  // administrativo la negativa es CORRECTA (la plata es del eje
  // administrativo — LETRA_ROLES_EQUIPO_S74 §2). Lo que se exige acá es
  // que la negativa sea HONESTA y que jamás se fabrique un número.
  const feeEmpleado = await obtenerComisionVigenteCita();
  check(
    !feeEmpleado.ok && feeEmpleado.codigo === 'cuenta_ajena',
    `C1 del empleado rebota TIPADO como cuenta_ajena, jamás con un número inventado ` +
      `(${feeEmpleado.ok ? `DEVOLVIÓ ${feeEmpleado.data.porcentaje}%` : feeEmpleado.codigo})`,
  );

  // ══ PASO 4 · el empleado DESACTIVADO vuelve a sin_prestador ══════════════
  console.log('\n── PASO 4 · el vínculo INACTIVO no resuelve (el gate es activo=true) ──');
  sql(`update prestador_empleados set activo = false where id = '${idFixture}'`);
  const r1Inactivo = await obtenerMiPrestador();
  check(
    !r1Inactivo.ok && r1Inactivo.codigo === 'sin_prestador',
    `empleado inactivo → sin_prestador (${r1Inactivo.ok ? 'DEVOLVIÓ FILA' : r1Inactivo.codigo})`,
  );
} finally {
  // ══ LIMPIEZA por id + verificación de residuos ═════════════════════════════
  console.log('\n── LIMPIEZA (por id, con verificación) ──');
  await getClient().auth.signOut();
  if (idFixture) sql(`delete from prestador_empleados where id = '${idFixture}'`);
  if (userFixture) sql(`delete from auth.users where id = '${userFixture}'`);

  const residuos = sql(
    `select
       (select count(*) from prestador_empleados where nombre like '[FIXTURE S75]%')::int as vinculos,
       (select count(*) from auth.users where email = '${EMAIL_FIXTURE}')::int as usuarios,
       (select count(*) from profiles where id = '${userFixture ?? '00000000-0000-0000-0000-000000000000'}')::int as perfiles,
       (select count(*) from prestador_empleados where prestador_id = '${NEGOCIO_FIXTURE}')::int as empleados_del_negocio`,
  )[0];
  console.log(`   residuos: ${JSON.stringify(residuos)}`);
  check(
    residuos.vinculos === 0 && residuos.usuarios === 0 && residuos.perfiles === 0,
    'residuos 0 (vínculo, auth user y profile borrados)',
  );
}

console.log(`\n${fallos === 0 ? '✓ TODO VERDE' : `✗ ${fallos} FALLA(S)`}`);
process.exit(fallos === 0 ? 0 : 1);
