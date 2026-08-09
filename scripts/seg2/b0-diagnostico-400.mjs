/**
 * S92-BIS · ¿los tres 400 son de PERMISO o de COLUMNA? (R4)
 *
 * Misma clase de duda que S92 resolvió tres veces: un 400 de PostgREST puede ser
 * «no tenés permiso» o «esa columna no existe», y **solo el segundo caso
 * significa que mi assert estaba mal**. La diferencia se lee en el `code`:
 *   · 42501 / «permission denied»  → PERMISO  ⇒ regresión real
 *   · 42703 / PGRST204 / «does not exist» → COLUMNA ⇒ mi assert
 *
 * Y se cierra midiendo las columnas reales y repitiendo la consulta.
 */
import { sql, rest, tokenDe, linea } from './lib-seg2.mjs';
import { readFileSync } from 'node:fs';

const env = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
const t = await tokenDe(
  env.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim(),
  env.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim(),
);

const CASOS = [
  ['cuentas_comerciales', 'id,estado,nombre_legal'],
  ['evento_cita_servicio', 'id,fecha,hora_inicio,estado,tipo_servicio'],
  ['evento_archivo_adjunto', 'id,url,mascota_id'],
];

linea('\n══ DIAGNÓSTICO DE LOS TRES 400 ══\n');
for (const [tabla, cols] of CASOS) {
  const r = await rest(`/rest/v1/${tabla}?select=${cols}&limit=2`, { token: t });
  const clase = /42501|permission denied/i.test(r.cuerpo)
    ? '🔴 PERMISO — regresión real'
    : /42703|PGRST204|does not exist|Could not find/i.test(r.cuerpo)
      ? '✅ COLUMNA — mi assert estaba mal'
      : '⚠️ otra cosa';
  linea(`  ${tabla}`);
  linea(`     pedido : ${cols}`);
  linea(`     HTTP ${r.status} · ${clase}`);
  linea(`     ${r.cuerpo.slice(0, 150)}`);

  const reales = await sql(
    `SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) AS cols
     FROM information_schema.columns WHERE table_schema='public' AND table_name='${tabla}'`,
    `cols-${tabla}`,
  );
  linea(`     columnas REALES: ${reales[0].cols.slice(0, 320)}`);

  // y la consulta bien formada, con las 3 primeras columnas de verdad
  const tres = reales[0].cols.split(', ').slice(0, 4).join(',');
  const ok = await rest(`/rest/v1/${tabla}?select=${tres}&limit=2`, { token: t });
  linea(`     BIEN FORMADA (${tres}) → HTTP ${ok.status}${ok.status === 200 ? ' ✅' : ' 🔴'}\n`);
}
