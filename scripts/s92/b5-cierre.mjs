/**
 * S92-A · B5 — LA RE-CORRIDA DE CIERRE Y EL BURN-DOWN.
 *
 * Vuelve a correr, sobre árbol quieto y por CAMINO REAL, todo lo que la sesión
 * declaró cerrado: las curas de S91 **y** las de hoy. Y mide el burn-down
 * contra el snapshot de arranque (regla 81).
 *
 * Se re-corre TODO y no solo lo de hoy porque «debería seguir andando» no es una
 * verificación: la única forma de saber que la tanda 4 no rompió lo que la tanda
 * 1 cerró es volver a preguntarlo.
 *
 * Corre: node scripts/s92/b5-cierre.mjs
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { rest, rpc, sql, tokenDe, guardar, SALIDA, linea } from './lib-s92.mjs';

const envTxt = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
const DEMO_MAIL = envTxt.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
const DEMO_PW = envTxt.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim();

const filas = [];
const anotar = (id, obtenido, ok) => {
  filas.push({ id, obtenido, ok });
  linea(`  ${ok ? '✅' : '🔴'} ${id.padEnd(46)} ${obtenido}`);
};

linea('\n══ B5 · RE-CORRIDA DE CIERRE — todo, por camino real ══\n');
linea('① LAS CURAS DE S91, ¿siguen rigiendo tras cinco migraciones de hoy?\n');

for (const [fn, args, rot] of [
  ['debug_estado_user', { p_email: 'guillo381@gmail.com' }, 'el oráculo de enumeración (S91)'],
  ['debug_session', {}, 'su hermana'],
]) {
  const r = await rpc(fn, args);
  anotar(`anon · ${fn}`, `${r.status >= 400 ? 'REBOTA' : '⚠️ PASA'} ${r.status}`, r.status >= 400);
}
{
  const t = await tokenDe(DEMO_MAIL, DEMO_PW);
  const dir = await rest('/rest/v1/prestadores?select=id,direccion&limit=1', { token: t });
  anotar('auth · prestadores.direccion', `${dir.status >= 400 ? 'REBOTA' : '⚠️ PASA'} ${dir.status}`, dir.status >= 400);
  const vista = await rest('/rest/v1/v_prestadores_publicos?select=id,nombre_comercial&limit=2', { token: t });
  anotar('auth · vista pública responde', `HTTP ${vista.status}`, vista.status === 200);
  const mp = await rpc('obtener_mi_prestador', {}, { token: t });
  anotar('titular · «Tu negocio» abre', `HTTP ${mp.status}`, mp.status === 200);
  const sedes = await rpc('obtener_sedes_de_mis_citas', { p_prestador_ids: [] }, { token: t });
  anotar('titular · lector angosto', `HTTP ${sedes.status}`, sedes.status === 200);

  linea('\n② LAS CURAS DE HOY\n');
  /**
   * D-701 · LA PREGUNTA CORRECTA, y la primera versión de este assert la erró:
   * contaba «cuántas DEFINER alcanza anon» esperando 2, y dio 4 — porque los DOS
   * helpers que esta misma sesión creó (`es_mi_prestador`, `prestador_activo`)
   * son DEFINER y reciben `anon` POR DECISIÓN ESCRITA en su migración (son
   * infraestructura de policy: sin ese EXECUTE, una policy {public} evaluada por
   * anon falla con 42501 en vez de devolver vacío).
   *
   * O sea que el 4 era correcto y el assert estaba mal. La deuda no pide «cero
   * DEFINER con anon» —eso rompería la casa—: pide que **ninguna lo tenga sin
   * que alguien lo haya decidido**. Eso es lo que se mide acá.
   */
  const DECIDIDAS = ['is_admin', 'email_exists', 'es_mi_prestador', 'prestador_activo'];
  const d701 = await sql(
    `SELECT p.proname FROM pg_proc p JOIN pg_namespace n2 ON n2.oid=p.pronamespace
     WHERE n2.nspname='public' AND p.prosecdef AND has_function_privilege('anon', p.oid,'EXECUTE')
     ORDER BY 1`,
    'cierre-d701',
  );
  const sinDecidir = d701.filter((f) => !DECIDIDAS.includes(f.proname));
  anotar(
    'D-701 · DEFINER con anon SIN DECISIÓN',
    `${sinDecidir.length} sin decidir · ${d701.length} en total (eran 59): ${d701.map((f) => f.proname).join(', ')}`,
    sinDecidir.length === 0,
  );

  // D-700
  const d700 = await sql(
    `SELECT count(*)::int AS n FROM pg_policies
     WHERE (COALESCE(qual,'') ~* 'from\\s+prestadores' OR COALESCE(with_check,'') ~* 'from\\s+prestadores')`,
    'cierre-d700',
  );
  anotar('D-700 · policies con predicado crudo', `${d700[0].n} (eran 29)`, d700[0].n < 29);

  // la traza
  const traza = await rest('/rest/v1/_traza_promocion_e164?select=id,valor_despues&limit=3');
  anotar('anon · traza de teléfonos', `${traza.status >= 400 ? 'REBOTA' : traza.cuerpo.trim() === '[]' ? 'VACÍO' : '⚠️ ' + traza.cuerpo.slice(0, 40)} ${traza.status}`,
    traza.status >= 400 || traza.cuerpo.trim() === '[]');
  const filasTraza = await sql(`SELECT count(*)::int AS n FROM public._traza_promocion_e164`, 'cierre-traza');
  anotar('traza · filas intactas', `${filasTraza[0].n} (eran 14 — cerrar no es borrar)`, filasTraza[0].n === 14);

  // catálogos: escritura fuera, lectura viva
  for (const t2 of ['cat_bancos', 'cat_paises', 'cat_tipos_documento_titular']) {
    const lec = await rest(`/rest/v1/${t2}?select=*&limit=1`);
    anotar(`anon LEE ${t2}`, `HTTP ${lec.status}${lec.cuerpo.trim() !== '[]' ? ' con filas' : ' VACÍO ⚠️'}`,
      lec.status === 200 && lec.cuerpo.trim() !== '[]');
  }
  const esc = await sql(
    `SELECT count(*)::int AS n FROM information_schema.role_table_grants
     WHERE table_schema='public'
       AND table_name IN ('cat_bancos','cat_paises','cat_tipos_documento_titular','audit_log')
       AND grantee IN ('anon','authenticated','PUBLIC')
       AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE')`,
    'cierre-esc',
  );
  anotar('escritura de cliente en catálogos/audit', `${esc[0].n} grants`, esc[0].n === 0);

  linea('\n③ EL LADO SANO, otra vez entero\n');
  for (const [id, ruta] of [
    ['mascotas', '/rest/v1/mascotas?select=id,nombre,especie&limit=2'],
    ['familia_miembro', '/rest/v1/familia_miembro?select=id,familia_id,rol&limit=2'],
    ['caso_clinico', '/rest/v1/caso_clinico?select=id,estado&limit=2'],
    ['evento_cita_servicio', '/rest/v1/evento_cita_servicio?select=id,estado,fecha&limit=2'],
    ['prestador_servicios', '/rest/v1/prestador_servicios?select=id,prestador_id,activo&limit=2'],
    ['prestador_horarios', '/rest/v1/prestador_horarios?select=id,prestador_id,activo&limit=2'],
    ['bonos', '/rest/v1/bonos?select=id,prestador_id,estado&limit=2'],
    ['cuentas_comerciales', '/rest/v1/cuentas_comerciales?select=id,estado&limit=2'],
  ]) {
    const r = await rest(ruta, { token: t });
    anotar(`titular lee · ${id}`, `HTTP ${r.status}`, r.status === 200);
  }
}

// ── BURN-DOWN ───────────────────────────────────────────────────────────────
const definerAntes = JSON.parse(readFileSync(join(SALIDA, 'b0-definer.json'), 'utf8')).length;
const policiesAntes = JSON.parse(readFileSync(join(SALIDA, 'b0-policies.json'), 'utf8')).length;

const ahora = await sql(
  `SELECT
     (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.prosecdef AND has_function_privilege('anon', p.oid,'EXECUTE'))::int AS definer_anon,
     (SELECT count(*) FROM pg_policies
       WHERE COALESCE(qual,'') ~* 'from\\s+prestadores' OR COALESCE(with_check,'') ~* 'from\\s+prestadores')::int AS policies_crudas,
     (SELECT count(*) FROM information_schema.role_table_grants
       WHERE grantee='anon' AND table_schema='public'
         AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE'))::int AS grants_escritura,
     (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity)::int AS tablas_sin_rls`,
  'cierre-burndown',
);

linea('\n══ BURN-DOWN DE LA SESIÓN (regla 81) ══\n');
linea('  eje                                          arranque   cierre');
linea('  ' + '─'.repeat(58));
linea(`  DEFINER alcanzables por anon (D-701)             ${String(definerAntes).padStart(4)}     ${String(ahora[0].definer_anon).padStart(4)}`);
linea(`  policies con prestadores crudo (D-700)            ${String(29).padStart(4)}     ${String(ahora[0].policies_crudas).padStart(4)}`);
linea(`  grants de ESCRITURA a anon (D-686)               ${String(861).padStart(4)}     ${String(ahora[0].grants_escritura).padStart(4)}`);
linea(`  tablas de public SIN RLS                            ${String(4).padStart(4)}     ${String(ahora[0].tablas_sin_rls).padStart(4)}`);

guardar('b5-cierre.json', { pruebas: filas, burndown: ahora[0] });

const rojos = filas.filter((f) => !f.ok);
linea(`\n── ${filas.length} pruebas · ${filas.length - rojos.length} verdes · ${rojos.length} rojas ──`);
if (rojos.length) for (const r of rojos) linea(`   🔴 ${r.id}: ${r.obtenido}`);
linea('');
