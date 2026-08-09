/**
 * S92-A · B2 — GENERA EL SQL DE REVERSA LEYENDO LAS POLICIES VIVAS.
 *
 * L-208: un CREATE OR REPLACE se arma leyendo el OBJETO VIVO, jamás una copia
 * guardada. Acá vale doble: transcribir a mano el `qual` de doce policies —
 * varias de tres líneas con subconsultas anidadas— es la forma más segura de
 * escribir una reversa que no revierte. Se lee de `pg_policies` y se imprime.
 *
 * Corre: node scripts/s92/b2-generar-reversa.mjs > (se guarda en salida/)
 */

import { sql, guardar, linea } from './lib-s92.mjs';

const OBJETIVO = [
  ['bonos', 'bonos_prestador_own'],
  ['bonos', 'bonos_prestador_update'],
  ['estadias', 'estadias_prestador_own'],
  ['estadias', 'estadias_prestador_update'],
  ['programas_contratados', 'pc_prestador_own'],
  ['suscripciones_servicio', 'suscr_servicio_prestador_own'],
  ['suscripciones_servicio', 'suscr_servicio_prestador_update'],
  ['solicitudes_emergencia', 'emergencia_prestador'],
  ['prestador_fotos', 'prestador_fotos_delete_titular'],
  ['prestador_fotos', 'prestador_fotos_insert_titular'],
  ['prestador_fotos', 'prestador_fotos_update_titular'],
  ['certificaciones', 'cert_prestador'],
];

const filas = await sql(
  `SELECT schemaname, tablename, policyname, cmd, permissive, roles::text AS roles,
          qual, with_check
   FROM pg_policies
   WHERE (tablename, policyname) IN (${OBJETIVO.map(([t, p]) => `('${t}','${p}')`).join(',')})
   ORDER BY tablename, policyname`,
  'b2-gen-reversa',
);

const partes = [];
for (const f of filas) {
  const roles = f.roles.replace(/[{}]/g, '');
  const cmd = f.cmd === 'ALL' ? 'ALL' : f.cmd;
  let s = `DROP POLICY IF EXISTS ${f.policyname} ON public.${f.tablename};\n`;
  s += `CREATE POLICY ${f.policyname} ON public.${f.tablename}\n`;
  s += `  AS ${f.permissive === 'PERMISSIVE' ? 'PERMISSIVE' : 'RESTRICTIVE'} FOR ${cmd} TO ${roles}\n`;
  if (f.qual) s += `  USING (${f.qual})\n`;
  if (f.with_check) s += `  WITH CHECK (${f.with_check})\n`;
  partes.push(s.trimEnd() + ';');
}

const cuerpo = partes.join('\n\n');
guardar('b2-reversa-generada.sql', cuerpo);

linea(`\n  ${filas.length} policies leídas del objeto vivo.`);
linea('  SQL de reversa en scripts/s92/salida/b2-reversa-generada.sql\n');
linea(cuerpo.slice(0, 1800));
linea('\n  …(completo en el archivo)\n');
