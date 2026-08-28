// ═══════════════════════════════════════════════════════════════════════════
// S107-A · E2E DE LOS WRAPPERS DE CONFIGURACIÓN DE GUARDERÍA
//
// Por qué existe: **build TS verde ≠ contrato real** (L-114, regla 47). El
// cinturón de la migración probó el MOTOR por su camino real; esto prueba la
// PUERTA — que es otra cosa: los guards de shape, la normalización de códigos
// por prefijo (L-115) y que la RLS deje pasar al titular y no a otro.
//
// La forma es la de la casa (precedente S46/S95-E): sesión REAL por wrapper,
// escritura de verdad, **desmontaje por id y residuo verificado en CERO**.
// 🔴 La clave se lee del keychain EN EL MOMENTO — jamás viaja al repo.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dbQuery } from './lib-db.mjs';
import {
  initApi,
  iniciarSesion,
  definirEspacioGuarderia,
  declararExcepcionEspacioGuarderia,
  definirFranjaGuarderia,
  obtenerFranjasGuarderia,
  obtenerCupoGuarderia,
} from '../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const clave = execFileSync('security',
  ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
  { encoding: 'utf8' }).trim();

let fallos = 0;
const check = (cond, nombre, detalle = '') => {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos += 1;
};
const NOMBRE = '__e2e_s107a__';

// ── El sujeto sale de datos REALES ──────────────────────────────────────────
const ctx = dbQuery(`
  SELECT u.email, p.id AS prestador
    FROM prestadores p JOIN auth.users u ON u.id = p.user_id
   WHERE p.estado='activo' AND u.email = 'guillo381+duenotodo@gmail.com' LIMIT 1`)[0];
if (!ctx) { console.error('ABORTA: no existe el titular de prueba.'); process.exit(1); }

const ses = await iniciarSesion({ email: ctx.email, password: clave });
check(ses.ok === true, 'sesión real del titular', ses.ok ? ctx.email : ses.codigo);
if (!ses.ok) process.exit(1);

const base = dbQuery(`SELECT count(*)::int n FROM guarderia_espacios`)[0].n;

// ── ① ESCRITURA: el espacio ─────────────────────────────────────────────────
const esp = await definirEspacioGuarderia({
  prestadorId: ctx.prestador, nombre: NOMBRE, capacidadPorDia: 8,
  diasOperacion: [1, 2, 3, 4, 5],
});
check(esp.ok === true, 'definirEspacioGuarderia crea', esp.ok ? esp.data.espacioId : esp.codigo);
if (!esp.ok) process.exit(1);
const espacioId = esp.data.espacioId;

// ── ② EL GUARD, POR SU CÓDIGO TIPADO (no por el texto) ──────────────────────
const malo = await definirEspacioGuarderia({
  prestadorId: ctx.prestador, nombre: NOMBRE + '_cap0', capacidadPorDia: 0,
});
check(malo.ok === false && malo.codigo === 'capacidad_invalida',
  'capacidad 0 rebota TIPADO', malo.ok ? 'PASÓ' : malo.codigo);

// ── ③ LAS FRANJAS, con su cruce ─────────────────────────────────────────────
const r1 = await definirFranjaGuarderia({
  prestadorId: ctx.prestador, tipo: 'recogida', desde: '07:00', hasta: '09:00',
  diasSemana: [1, 2, 3, 4, 5],
});
check(r1.ok === true, 'franja de recogida 07:00–09:00', r1.ok ? '' : r1.codigo);

const cruce = await definirFranjaGuarderia({
  prestadorId: ctx.prestador, tipo: 'devolucion', desde: '08:00', hasta: '10:00',
  diasSemana: [1, 2, 3, 4, 5],
});
check(cruce.ok === false && cruce.codigo === 'franjas_se_cruzan',
  'la devolución que pisa la recogida REBOTA', cruce.ok ? 'PASÓ' : cruce.codigo);

const r2 = await definirFranjaGuarderia({
  prestadorId: ctx.prestador, tipo: 'devolucion', desde: '16:30', hasta: '18:30',
  diasSemana: [1, 2, 3, 4, 5],
});
check(r2.ok === true, 'franja de devolución 16:30–18:30', r2.ok ? '' : r2.codigo);

const fr = await obtenerFranjasGuarderia(ctx.prestador);
check(fr.ok === true && fr.data.length === 2 && fr.data[0].tipo === 'recogida',
  'obtenerFranjasGuarderia devuelve las dos, recogida primero',
  fr.ok ? `${fr.data.length} franjas` : fr.codigo);

// ── ④ EL CUPO, EN UN SOLO VIAJE ─────────────────────────────────────────────
const hoy = dbQuery(`SELECT hoy_local()::text d`)[0].d;
const hasta = dbQuery(`SELECT (hoy_local() + 29)::text d`)[0].d;
const cupo = await obtenerCupoGuarderia(ctx.prestador, hoy, hasta);
check(cupo.ok === true && cupo.data.length === 30, 'cupo de 30 días en UN viaje',
  cupo.ok ? `${cupo.data.length} días` : cupo.codigo);
if (cupo.ok) {
  const habiles = cupo.data.filter((d) => d.capacidad === 8).length;
  check(habiles >= 20 && habiles <= 22, 'sólo los días del patrón tienen capacidad',
    `${habiles} días con capacidad 8`);
  check(cupo.data.every((d) => d.sobrevendido === false), 'ningún día nace sobrevendido');
}

// ── ⑤ LA EXCEPCIÓN GANA AL PATRÓN ───────────────────────────────────────────
const manana = dbQuery(
  `SELECT d::text AS d FROM generate_series(hoy_local()+1, hoy_local()+9, interval '1 day') d
    WHERE EXTRACT(dow FROM d) BETWEEN 1 AND 5 LIMIT 1`)[0].d;
const exc = await declararExcepcionEspacioGuarderia({
  espacioId, fecha: manana, disponible: false, motivo: 'e2e',
});
check(exc.ok === true, 'declararExcepcionEspacioGuarderia cierra un día', exc.ok ? '' : exc.codigo);
const cupo2 = await obtenerCupoGuarderia(ctx.prestador, manana, manana);
check(cupo2.ok === true && cupo2.data[0].capacidad === 0,
  'la excepción GANA: capacidad 0 ese día',
  cupo2.ok ? `capacidad ${cupo2.data[0].capacidad}` : cupo2.codigo);

// ── ⑥ EL RANGO INVERTIDO REBOTA TIPADO ──────────────────────────────────────
const inv = await obtenerCupoGuarderia(ctx.prestador, hasta, hoy);
check(inv.ok === false && inv.codigo === 'rango_invertido',
  'rango invertido rebota TIPADO', inv.ok ? 'PASÓ' : inv.codigo);

// ── DESMONTAJE POR ID, y residuo medido ─────────────────────────────────────
dbQuery(`DELETE FROM guarderia_espacios WHERE id = '${espacioId}'`);
dbQuery(`DELETE FROM guarderia_franjas WHERE prestador_id = '${ctx.prestador}'`);
const fin = dbQuery(`
  SELECT (SELECT count(*)::int FROM guarderia_espacios) esp,
         (SELECT count(*)::int FROM guarderia_franjas) fr,
         (SELECT count(*)::int FROM guarderia_espacio_excepciones) exc`)[0];
check(fin.esp === base && fin.fr === 0 && fin.exc === 0,
  'residuo 0 (la excepción cae por CASCADE del espacio)',
  `espacios ${fin.esp} (base ${base}) · franjas ${fin.fr} · excepciones ${fin.exc}`);

console.log(fallos === 0 ? '\n✅ E2E GUARDERÍA-CONFIG: TODO VERDE\n' : `\n🔴 ${fallos} FALLO(S)\n`);
process.exit(fallos === 0 ? 0 : 1);
