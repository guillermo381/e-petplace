/**
 * S92-A · B2 — ¿están libres los nombres de los helpers? (regla: se lee el
 * registry antes de pedir un artefacto — L-175: se ENSANCHA, jamás se copia.)
 */
import { sql, linea } from './lib-s92.mjs';

const candidatos = ['es_mi_prestador', 'prestador_activo', 'es_prestador_del_usuario', 'user_gestiona_prestador'];
const filas = await sql(
  `SELECT p.proname, pg_get_function_arguments(p.oid) AS args, p.prosecdef AS definer,
          COALESCE(array_to_string(p.proconfig,','),'(sin config)') AS config,
          pg_get_functiondef(p.oid) AS def
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN (${candidatos.map((c) => `'${c}'`).join(',')})
   ORDER BY 1`,
  'b2-nombres',
);

linea('\n══ NOMBRES CANDIDATOS ══\n');
for (const c of candidatos) {
  const hit = filas.filter((f) => f.proname === c);
  if (hit.length === 0) linea(`  LIBRE     · ${c}`);
  else for (const h of hit) linea(`  OCUPADO   · ${h.proname}(${h.args})  definer=${h.definer}  ${h.config}`);
}

const ug = filas.find((f) => f.proname === 'user_gestiona_prestador');
if (ug) {
  linea('\n  ── `user_gestiona_prestador` YA EXISTE: es el molde de la casa. Su cuerpo: ──');
  linea(ug.def.split('\n').map((l) => '     ' + l).join('\n'));
}
linea('');
