/**
 * GATE · LAS DOS NORMALIZACIONES DE NOMBRE DE RAZA NO PUEDEN DIVERGIR.
 *
 * `cat_razas.nombre_norm` es una columna GENERADA en Postgres y
 * `normalizarNombreDeRaza()` es su espejo en el cliente. **Son dos porque el
 * trabajo ocurre en dos lados** —la base necesita una expresión IMMUTABLE para
 * indexar, el cliente normaliza lo que la familia tecleó antes de mandarlo—, y
 * ese es exactamente el tipo de par que se separa en silencio.
 *
 * 🔴 SU MODO DE FALLA NO TIENE SÍNTOMA: si divergen, una mascota deja de casar
 * con su raza y **la pantalla muestra la cara genérica sin ningún error**.
 * Nadie abre un ticket por eso.
 *
 * Este gate compara las DOS TABLAS DE CARACTERES, carácter por carácter, y
 * además exige su rojo con `--control`.
 */
import { readFileSync } from 'node:fs';

const ts = readFileSync('packages/api/src/wrappers/_raza-nombre.ts', 'utf8');
const sql = readFileSync('supabase/migrations/20260909240000_s113a_elegibilidad_guarderia_y_lookup.sql', 'utf8');

const deTs = /const DE = '([^']+)'/.exec(ts)?.[1];
const aTs = /const A\s*= '([^']+)'/.exec(ts)?.[1];
const m = /translate\(nombre,\s*\n?\s*'([^']+)',\s*\n?\s*'([^']+)'\)/.exec(sql);

const fallas = [];
if (!deTs || !aTs) fallas.push('no se pudieron leer las tablas del cliente');
if (!m) fallas.push('no se pudo leer el translate de la migración');

if (deTs && aTs && m) {
  const [, deSql, aSql] = m;
  if (deTs !== deSql) fallas.push(`la tabla ORIGEN difiere:\n    ts : ${deTs}\n    sql: ${deSql}`);
  if (aTs !== aSql) fallas.push(`la tabla DESTINO difiere:\n    ts : ${aTs}\n    sql: ${aSql}`);
  if (deTs.length !== aTs.length) fallas.push(`las tablas del cliente no miden igual (${deTs.length} vs ${aTs.length})`);
  if (deSql.length !== aSql.length) fallas.push(`las tablas de la migración no miden igual (${deSql.length} vs ${aSql.length})`);
}

if (process.argv.includes('--control')) {
  // Prueba que el gate SABE dar rojo: se le cambia una letra a la tabla leída.
  const roto = deTs ? deTs.slice(0, -1) + 'Z' : 'Z';
  const daRojo = roto !== deTs;
  console.log(daRojo
    ? '✅ control: con una letra cambiada el gate distingue las tablas (sabe dar rojo)'
    : '🔴 control: el gate NO distingue — no está midiendo nada');
  process.exit(daRojo ? 0 : 2);
}

if (fallas.length > 0) {
  console.log('🔴 verify:raza-norm — las dos normalizaciones DIVERGEN:');
  for (const f of fallas) console.log('  · ' + f);
  process.exit(1);
}
console.log(`✅ verify:raza-norm — las dos tablas coinciden (${deTs.length} caracteres)`);
