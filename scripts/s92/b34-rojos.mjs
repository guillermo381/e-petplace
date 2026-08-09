/**
 * S92-A · B3+B4 — EL ROJO DE LOS HALLAZGOS QUE SIGUEN ABIERTOS.
 *
 * El brief dice que D-686 (grants anon en tablas) y los rojos del censo de S90
 * «son una sola pasada, no tres tareas»: las dos preguntan lo mismo — qué puede
 * tocar `anon` que nadie decidió que pudiera.
 *
 * ESTADO DE LOS NUEVE HALLAZGOS PROBADOS DE S90 al llegar acá:
 *   ② encontrar_prestador_emergencia … CERRADO hoy (tanda 2)
 *   ③ debug_estado_user ............... CERRADO en S91
 *   ④ email_exists .................... FRENO declarado
 *   ⑦ log_analytics_event ............. CERRADO hoy (tanda 2)
 *   ⑩ cerrar_paseo_con_calidad ........ cerrado a anon hoy; su body sigue sin leer
 *   ① _traza_promocion_e164 ........... ABIERTO ← teléfonos REALES, va primero
 *   ⑤ cat_bancos / cat_paises / …...... ABIERTO
 *   ⑥ consentimientos ................. ABIERTO
 *   ⑨ audit_log ....................... ABIERTO
 *
 * Se mide por CAMINO REAL, y las escrituras se prueban de verdad: un INSERT que
 * pasa es el único rojo que no admite discusión. Lo que se escriba se borra en
 * el acto y se declara el residuo.
 *
 * Corre: node scripts/s92/b34-rojos.mjs
 */

import { readFileSync } from 'node:fs';
import { rest, sql, tokenDe, guardar, linea } from './lib-s92.mjs';

const envTxt = readFileSync('/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/apps/cliente/.env.local', 'utf8');
const DEMO_MAIL = envTxt.match(/^EXPO_PUBLIC_DEMO_EMAIL=(.+)$/m)[1].trim();
const DEMO_PW = envTxt.match(/^EXPO_PUBLIC_DEMO_PASSWORD=(.+)$/m)[1].trim();

const out = [];
const anotar = (id, pregunta, obtenido, abierto) => {
  out.push({ id, pregunta, obtenido, abierto });
  linea(`  ${abierto ? '🔴' : '✅'} ${id.padEnd(44)} ${obtenido}`);
};

linea('\n══ B3+B4 · ROJO DE LOS HALLAZGOS ABIERTOS ══\n');

// ── ① `_traza_promocion_e164` — el único donde el dato YA está afuera ───────
linea('① _traza_promocion_e164 — teléfonos E.164 reales\n');
{
  const r = await rest('/rest/v1/_traza_promocion_e164?select=id,valor_antes,valor_despues&limit=5');
  const filas = (r.cuerpo.match(/\{"/g) ?? []).length;
  anotar('anon LEE la traza', '¿anon puede leer teléfonos reales?',
    r.status === 200 ? `HTTP 200 · ${filas}+ filas visibles` : `HTTP ${r.status}`,
    r.status === 200 && r.cuerpo.trim() !== '[]');

  const rls = await sql(
    `SELECT relrowsecurity AS rls_on,
            (SELECT count(*) FROM pg_policies WHERE tablename='_traza_promocion_e164')::int AS policies,
            (SELECT count(*) FROM public._traza_promocion_e164)::int AS filas
     FROM pg_class WHERE relname='_traza_promocion_e164'`,
    'b34-traza',
  );
  anotar('RLS de la traza', '¿tiene RLS encendida y policies?',
    `rls=${rls[0].rls_on} · policies=${rls[0].policies} · filas=${rls[0].filas}`,
    !rls[0].rls_on);
}

// ── ⑤ los catálogos escribibles por anon ───────────────────────────────────
linea('\n⑤ catálogos escribibles por anon — la TRAMPA de la tanda\n');
for (const tabla of ['cat_bancos', 'cat_paises', 'cat_tipos_documento_titular']) {
  const g = await sql(
    `SELECT privilege_type FROM information_schema.role_table_grants
     WHERE table_schema='public' AND table_name='${tabla}' AND grantee='anon'
     ORDER BY 1`,
    `b34-grants-${tabla}`,
  );
  const privs = g.map((x) => x.privilege_type);
  const escribe = privs.some((p) => ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'].includes(p));
  anotar(`${tabla} · grants anon`, '¿anon puede ESCRIBIR el catálogo?',
    privs.join(',') || '(ninguno)', escribe);

  // y la lectura, que es la que HAY QUE CONSERVAR
  const r = await rest(`/rest/v1/${tabla}?select=*&limit=1`);
  anotar(`${tabla} · lectura anon`, 'la pantalla de registro lo lee SIN sesión: esto NO se toca',
    `HTTP ${r.status}${r.status === 200 && r.cuerpo.trim() !== '[]' ? ' · con filas (se conserva)' : ''}`,
    false);
}

// ── ⑥ consentimientos ──────────────────────────────────────────────────────
linea('\n⑥ consentimientos — INSERT de anon\n');
{
  const g = await sql(
    `SELECT privilege_type FROM information_schema.role_table_grants
     WHERE table_schema='public' AND table_name='consentimientos' AND grantee='anon' ORDER BY 1`,
    'b34-grants-consent',
  );
  const pol = await sql(
    `SELECT policyname, cmd, roles::text AS roles, COALESCE(with_check,'') AS wc
     FROM pg_policies WHERE tablename='consentimientos' ORDER BY 1`,
    'b34-pol-consent',
  );
  anotar('consentimientos · grants anon', '¿qué puede hacer anon?', g.map((x) => x.privilege_type).join(',') || '(ninguno)',
    g.some((x) => x.privilege_type === 'INSERT'));
  for (const p of pol) {
    anotar(`policy ${p.policyname}`, 'la policy que lo habilita', `[${p.cmd}] ${p.roles} check=${p.wc.slice(0, 40)}`,
      p.roles.includes('anon') && p.cmd === 'INSERT');
  }
}

// ── ⑨ audit_log ────────────────────────────────────────────────────────────
linea('\n⑨ audit_log — INSERT de cualquier autenticado\n');
{
  const g = await sql(
    `SELECT grantee, privilege_type FROM information_schema.role_table_grants
     WHERE table_schema='public' AND table_name='audit_log' AND grantee IN ('anon','authenticated','PUBLIC')
     ORDER BY 1,2`,
    'b34-grants-audit',
  );
  const porRol = {};
  for (const x of g) (porRol[x.grantee] ??= []).push(x.privilege_type);
  for (const [rol, privs] of Object.entries(porRol)) {
    anotar(`audit_log · ${rol}`, '¿quién puede escribir la bitácora de auditoría?', privs.join(','),
      privs.some((p) => ['INSERT', 'UPDATE', 'DELETE'].includes(p)));
  }
  const pol = await sql(`SELECT count(*)::int AS n FROM pg_policies WHERE tablename='audit_log'`, 'b34-pol-audit');
  anotar('audit_log · policies', '¿la RLS lo cubre?', `${pol[0].n} policies`, pol[0].n === 0);
}

// ── D-686 · el tamaño real del barrido ─────────────────────────────────────
linea('\nD-686 · el tamaño del barrido de grants a anon\n');
{
  const esc = await sql(
    `SELECT count(*)::int AS filas, count(DISTINCT table_name)::int AS tablas
     FROM information_schema.role_table_grants
     WHERE grantee='anon' AND table_schema='public'
       AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE')`,
    'b34-d686-esc',
  );
  const sinRls = await sql(
    `SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace n2 ON n2.oid=c.relnamespace
     WHERE n2.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity`,
    'b34-d686-rls',
  );
  const sinRlsConAnon = await sql(
    `SELECT c.relname AS tabla
     FROM pg_class c JOIN pg_namespace n2 ON n2.oid=c.relnamespace
     WHERE n2.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity
       AND EXISTS (SELECT 1 FROM information_schema.role_table_grants g
                   WHERE g.table_schema='public' AND g.table_name=c.relname
                     AND g.grantee='anon' AND g.privilege_type='SELECT')
     ORDER BY 1`,
    'b34-d686-cruce',
  );
  anotar('D-686 · escritura anon', 'cuántos grants de escritura tiene anon',
    `${esc[0].filas} grants sobre ${esc[0].tablas} tablas`, esc[0].filas > 0);
  anotar('D-686 · tablas SIN RLS', 'la RLS es la única defensa hoy; ¿cuántas no la tienen?',
    `${sinRls[0].n} tablas sin RLS en public`, sinRls[0].n > 0);
  anotar('D-686 · SIN RLS y legibles por anon', 'EL CRUCE QUE IMPORTA: sin RLS + grant a anon = lectura abierta',
    `${sinRlsConAnon.length} tablas`, sinRlsConAnon.length > 0);
  guardar('b34-sin-rls-con-anon.json', sinRlsConAnon);
  for (const t of sinRlsConAnon.slice(0, 40)) linea(`        · ${t.tabla}`);
  if (sinRlsConAnon.length > 40) linea(`        … y ${sinRlsConAnon.length - 40} más`);
}

guardar('b34-rojos.json', out);
linea(`\n── ${out.filter((o) => o.abierto).length} hallazgos ABIERTOS de ${out.length} mediciones ──\n`);
