/**
 * S92-A · B0 (2ª mitad) — ¿LAS CURAS DE S91 SIGUEN RIGIENDO?
 *
 * Todo por CAMINO REAL (PostgREST con la anon key o un JWT de usuario), que es
 * el único veredicto que entra al reporte (REGLA 1). El catálogo se usa solo
 * para dar contexto al número, jamás para declarar verde.
 *
 * Cada prueba declara QUÉ PREGUNTA CONTESTA (REGLA 4 / L-211), porque un verde
 * sobre el lugar equivocado es peor que un rojo: el rojo se investiga, el verde
 * se archiva.
 *
 * Corre: node scripts/s92/b0-curas-s91-siguen.mjs
 */

import { rest, rpc, tokenDe, sql, guardar, linea, URL } from './lib-s92.mjs';
import { readFileSync } from 'node:fs';

const envTxt = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
const DEMO_MAIL = envTxt.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
const DEMO_PW = envTxt.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim();

const resultados = [];
const anotar = (id, pregunta, esperado, obtenido, ok) => {
  resultados.push({ id, pregunta, esperado, obtenido, ok });
  linea(`  ${ok ? '✅' : '🔴'} ${id} — ${obtenido}`);
  linea(`       pregunta: ${pregunta}`);
};

linea('\n══ B0 · ¿SIGUEN RIGIENDO LAS CURAS DE S91? — todo por camino real ══\n');

// ── ① EL ORÁCULO (D-701) — el repro LITERAL del rojo de S91 ──────────────────
linea('① D-701 · debug_estado_user / debug_session como anon');
{
  const r1 = await rpc('debug_estado_user', { p_email: 'guillo381@gmail.com' });
  anotar(
    'D-701 debug_estado_user',
    '¿anon puede pedir el oráculo de enumeración? (el mismo curl del rojo de S91)',
    'rebote 401/403/404',
    `HTTP ${r1.status} · ${r1.cuerpo.slice(0, 120)}`,
    r1.status >= 400,
  );
  const r2 = await rpc('debug_session', {});
  anotar(
    'D-701 debug_session',
    '¿anon puede pedir la hermana de la misma migración?',
    'rebote 4xx',
    `HTTP ${r2.status} · ${r2.cuerpo.slice(0, 120)}`,
    r2.status >= 400,
  );
}

// ── ② LA FUGA DE `prestadores` (S91) ─────────────────────────────────────────
// La pregunta NO es "¿puedo leer la tabla?" sino "¿puedo leer ESTAS columnas?"
// (L-212: un count(*) no toca ninguna columna y pasa siempre).
linea('\n② La fuga de `prestadores` — con las COLUMNAS reales, no count(*)');
{
  const anonTodo = await rest('/rest/v1/prestadores?select=*&limit=1');
  anotar(
    'fuga/anon select=*',
    '¿anon lee la tabla `prestadores` entera?',
    'rebote o vacío',
    `HTTP ${anonTodo.status} · ${anonTodo.cuerpo.slice(0, 140)}`,
    anonTodo.status >= 400 || anonTodo.cuerpo.trim() === '[]',
  );

  const token = await tokenDe(DEMO_MAIL, DEMO_PW);

  // columnas SENSIBLES: el autenticado cualquiera NO debe poder pedirlas
  const sensibles = await rest('/rest/v1/prestadores?select=id,direccion&limit=1', { token });
  anotar(
    'fuga/auth direccion',
    '¿un autenticado pide `direccion` directo de la tabla? (la columna de S84)',
    'rebote 401/403 — la vista pública no la expone',
    `HTTP ${sensibles.status} · ${sensibles.cuerpo.slice(0, 140)}`,
    sensibles.status >= 400,
  );

  // la VISTA pública, que es la fuente canónica
  const vista = await rest('/rest/v1/v_prestadores_publicos?select=id,nombre_comercial&limit=2', { token });
  anotar(
    'fuga/vista pública',
    '¿la fuente canónica (`v_prestadores_publicos`) SIGUE respondiendo? — el lado sano',
    'PASA 200 con filas',
    `HTTP ${vista.status} · ${vista.cuerpo.slice(0, 100)}`,
    vista.status === 200,
  );

  // y que la vista NO exponga lat/lon ni direccion (S84 + S91)
  const vistaLeak = await rest('/rest/v1/v_prestadores_publicos?select=direccion&limit=1', { token });
  anotar(
    'fuga/vista sin direccion',
    '¿la vista pública expone `direccion`? (si la expusiera, el lector angosto sobraría)',
    'rebote — la columna no existe en la vista',
    `HTTP ${vistaLeak.status} · ${vistaLeak.cuerpo.slice(0, 140)}`,
    vistaLeak.status >= 400,
  );

  // ── ③ EL LECTOR ANGOSTO (molde D-455) ──────────────────────────────────────
  linea('\n③ `obtener_sedes_de_mis_citas` — el lector angosto que reemplazó al grant');
  const sedes = await rpc('obtener_sedes_de_mis_citas', { p_prestador_ids: [] }, { token });
  anotar(
    'D-455 lector angosto',
    '¿el lector angosto responde a un autenticado con sesión? (los ids son filtro, no permiso)',
    'PASA 200',
    `HTTP ${sedes.status} · ${sedes.cuerpo.slice(0, 120)}`,
    sedes.status === 200,
  );
  const sedesAnon = await rpc('obtener_sedes_de_mis_citas', { p_prestador_ids: [] });
  anotar(
    'D-455 anon rebota',
    '¿anon puede usar el lector angosto? — el otro brazo del par',
    'rebote o vacío',
    `HTTP ${sedesAnon.status} · ${sedesAnon.cuerpo.slice(0, 120)}`,
    sedesAnon.status >= 400 || sedesAnon.cuerpo.trim() === '[]',
  );

  // ── ④ LAS OCHO POLICIES que rompió `cuenta_comercial_id` ───────────────────
  // El síntoma de S91 fue «ningún titular abre Tu negocio». La prueba del lado
  // sano es que el titular SIGUE abriendo su negocio por el camino de la app.
  linea('\n④ Las 8 policies del re-grant de `cuenta_comercial_id` — el lado sano');
  const miPrestador = await rpc('obtener_mi_prestador', {}, { token });
  anotar(
    'S91 regrant/obtener_mi_prestador',
    '¿el titular abre «Tu negocio»? — el síntoma exacto del 42501 de S91',
    'PASA 200 con su fila',
    `HTTP ${miPrestador.status} · ${miPrestador.cuerpo.slice(0, 120)}`,
    miPrestador.status === 200 && miPrestador.cuerpo.trim() !== 'null' && miPrestador.cuerpo.trim() !== '[]',
  );
  const cuentas = await rest('/rest/v1/cuentas_comerciales?select=id,estado&limit=2', { token });
  anotar(
    'S91 regrant/cuentas_comerciales',
    '¿la policy de `cuentas_comerciales` (2 de las 8) sigue dejando pasar al dueño?',
    'PASA 200',
    `HTTP ${cuentas.status} · ${cuentas.cuerpo.slice(0, 120)}`,
    cuentas.status === 200,
  );
}

guardar('b0-curas-s91.json', resultados);
const rojos = resultados.filter((r) => !r.ok);
linea(`\n── ${resultados.length} pruebas · ${resultados.length - rojos.length} verdes · ${rojos.length} rojas ──`);
if (rojos.length) {
  linea('\n🔴 LO QUE NO SIGUE RIGIENDO:');
  for (const r of rojos) linea(`   · ${r.id}: esperaba ${r.esperado}, obtuvo ${r.obtenido}`);
}
linea('');
