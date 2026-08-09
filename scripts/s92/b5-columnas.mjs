/**
 * S92-A · las columnas REALES de las tablas que cuelgan de un usuario.
 * Cuarta vez en la sesión que adivinar un nombre produce un error: se mide.
 */
import { sql, linea } from './lib-s92.mjs';

const filas = await sql(
  `SELECT table_name, column_name FROM information_schema.columns
   WHERE table_schema='public'
     AND table_name IN ('familia','familia_miembro','mascotas','profiles','prestadores',
                        'cuentas_comerciales','evento_cita_servicio','push_tokens')
     AND (column_name ILIKE '%user%' OR column_name ILIKE '%titular%'
          OR column_name ILIKE '%owner%' OR column_name='id')
   ORDER BY table_name, column_name`,
  'b5-cols',
);
const porTabla = {};
for (const f of filas) (porTabla[f.table_name] ??= []).push(f.column_name);
linea('');
for (const [t, cols] of Object.entries(porTabla)) linea(`  ${t.padEnd(24)} ${cols.join(', ')}`);
linea('');
