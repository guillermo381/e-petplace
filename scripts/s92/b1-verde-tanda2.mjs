/**
 * S92-A · B1 · TANDA 2 — EL VERDE EN SUS DOS BRAZOS, y el estado de D-701.
 *
 * BRAZO ① las 27 rebotan para `anon` (camino real sobre las que antes
 *          ejecutaban de verdad) · BRAZO ② el camino legítimo sigue vivo.
 * Más el cierre de cuentas de D-701: cuántas quedan y por qué cada una.
 *
 * Corre: node scripts/s92/b1-verde-tanda2.mjs
 */

import { readFileSync } from 'node:fs';
import { rest, rpc, sql, tokenDe, guardar, linea } from './lib-s92.mjs';

const envTxt = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
const DEMO_MAIL = envTxt.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
const DEMO_PW = envTxt.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim();

const filas = [];
const anotar = (id, pregunta, obtenido, ok) => {
  filas.push({ id, pregunta, obtenido, ok });
  linea(`  ${ok ? '✅' : '🔴'} ${id.padEnd(46)} ${obtenido}`);
};

linea('\n══ B1 · TANDA 2 — EL VERDE EN SUS DOS BRAZOS ══\n');
linea('BRAZO ① — anon REBOTA (camino real, sobre las que ANTES ejecutaban)\n');

// las cinco que en el rojo devolvieron 200 ejecutando de verdad
const antes200 = [
  ['get_user_features', { p_user_id: '00000000-0000-0000-0000-000000000000' }, 'devolvía la config de features'],
  ['validate_beta_access', { p_email: 'x@x.com', p_codigo: 'x' }, 'devolvía su mensaje de acceso'],
  ['verificar_identificacion_disponible', { p_country_code: 'EC', p_identificacion: '0000000000' }, 'ORÁCULO DE CÉDULAS: decía {"disponible":true}'],
  ['get_estado_onboarding', {}, 'devolvía 200'],
  ['service_active_in', { p_servicio: 'x', p_pais: 'EC' }, 'devolvía 200'],
  ['encontrar_prestador_emergencia', { p_lat: -0.18, p_lon: -78.47, p_country: 'EC', p_radio_km: 1 }, 'daba lat/lon EXACTAS (letra S84)'],
];
for (const [fn, args, porque] of antes200) {
  const r = await rpc(fn, args);
  const denegado = /permission denied for function/i.test(r.cuerpo);
  const pgrst202 = /PGRST202/.test(r.cuerpo);
  anotar(`anon · ${fn}`, porque,
    denegado ? `REBOTA 401` : pgrst202 ? `oculta a anon (PGRST202)` : `HTTP ${r.status} ${r.cuerpo.slice(0, 50)}`,
    denegado || pgrst202);
}

linea('\nBRAZO ② — el camino legítimo SIGUE FUNCIONANDO  ← el que importa\n');
const token = await tokenDe(DEMO_MAIL, DEMO_PW);

/**
 * ⚠️ Nombres de parámetro MEDIDOS del catálogo, no escritos de memoria: la
 * primera corrida de este verde usó `p_tipo` y `p_country_code`/`p_limite` y
 * cosechó dos 404 que parecían «rompí el camino legítimo». Eran míos —
 * `b1-diagnostico-404.mjs` lo separó en un minuto. Tercera vez en la sesión que
 * un nombre adivinado fabrica un rojo (L-211).
 */
for (const [fn, args, rot] of [
  ['get_estado_onboarding', {}, 'el onboarding responde con sesión'],
  ['verificar_identificacion_disponible', { p_country_code: 'EC', p_identificacion: '0000000000' }, 'el alta de cuenta comercial sigue pudiendo verificar'],
  ['get_user_features', { p_user_id: '00000000-0000-0000-0000-000000000000' }, 'features con sesión'],
  ['encontrar_prestador_emergencia', { p_lat: -0.18, p_lon: -78.47, p_country: 'EC', p_radio_km: 1 }, 'la emergencia sigue disponible para quien tiene sesión'],
]) {
  const r = await rpc(fn, args, { token });
  anotar(`titular · ${fn}`, rot, `HTTP ${r.status}`, r.status === 200);
}

// y el negocio entero, otra vez: es el síntoma que S91 tardó horas en ver
for (const [fn, args, rot] of [
  ['obtener_mi_prestador', {}, '«Tu negocio» sigue abriendo'],
  ['obtener_sedes_de_mis_citas', { p_prestador_ids: [] }, 'el lector angosto sigue vivo'],
]) {
  const r = await rpc(fn, args, { token });
  anotar(`titular · ${fn}`, rot, `HTTP ${r.status}`, r.status === 200);
}
for (const [id, ruta] of [
  ['mascotas', '/rest/v1/mascotas?select=id,nombre,especie&limit=2'],
  ['caso_clinico', '/rest/v1/caso_clinico?select=id,estado&limit=2'],
  ['evento_cita_servicio', '/rest/v1/evento_cita_servicio?select=id,estado,fecha&limit=2'],
]) {
  const r = await rest(ruta, { token });
  anotar(`titular lee · ${id}`, 'las policies siguen dejando pasar', `HTTP ${r.status}`, r.status === 200);
}

// ── EL CIERRE DE CUENTAS DE D-701 ───────────────────────────────────────────
const restantes = await sql(
  `SELECT p.oid::regprocedure::text AS funcion
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.prosecdef AND has_function_privilege('anon', p.oid, 'EXECUTE')
   ORDER BY 1`,
  'd701-restantes',
);
guardar('b1-d701-restantes.json', restantes);

linea('\n── D-701 · CIERRE DE CUENTAS ──');
linea(`  DEFINER alcanzables por anon: 59 al abrir  →  ${restantes.length} ahora`);
for (const r of restantes) linea(`     · ${r.funcion}`);
linea('     ↳ is_admin QUEDA por decisión medida (11 policies {public} la llaman)');
linea('     ↳ email_exists queda en FRENO declarado (su consumidor es un checkout sin sesión)');

const rojos = filas.filter((f) => !f.ok);
linea(`\n── ${filas.length} pruebas · ${filas.length - rojos.length} verdes · ${rojos.length} rojas ──`);
if (rojos.length) for (const r of rojos) linea(`   🔴 ${r.id}: ${r.obtenido}`);
linea('');
