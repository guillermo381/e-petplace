// S74-B · EL CINTURÓN DE LA TIPIFICACIÓN POR MENSAJE (D-508/D-511).
// El wrapper de invitar discrimina los rebotes suaves de
// `crear_empleado_directo` por el LITERAL del mensaje (el RPC no da
// código — tensión regla 35, declarada). El riesgo tiene fecha: el lote
// de strings está pendiente de gate y una mejora de redacción en el
// motor rompería el match EN SILENCIO (la rama cae al genérico).
// Este assert compara los 4 literales DEL WRAPPER (fuente única,
// importada — jamás copiada) contra el prosrc VIVO y falla RUIDOSO si
// divergen. Correr: npx tsx scripts/verify-rebotes-invitacion-s74.mjs
// Es la disciplina candidata "la verdad la firma un assert ejecutable,
// jamás la tabla sola", aplicada a su propio caso. La salida de raíz
// (código o RAISE tipado) viaja con D-509 — esto es el cinturón.
import { execFileSync } from 'node:child_process';

import { REBOTES_INVITAR } from '../packages/api/src/wrappers/equipo';

const sql = "select prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname='crear_empleado_directo'";
const crudo = execFileSync(
  'npx',
  ['supabase', '--experimental', 'db', 'query', '--linked', sql],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
);

const inicio = crudo.indexOf('{');
if (inicio === -1) {
  console.error('FALLO: la query no devolvió JSON. Salida cruda:\n' + crudo.slice(0, 400));
  process.exit(1);
}
const parseado = JSON.parse(crudo.slice(inicio));
const prosrc = parseado?.rows?.[0]?.prosrc;
if (typeof prosrc !== 'string' || prosrc.length === 0) {
  console.error('FALLO: crear_empleado_directo no existe o prosrc vacío — el subsistema cambió.');
  process.exit(1);
}

let fallos = 0;
for (const { literal, codigo } of REBOTES_INVITAR) {
  if (prosrc.includes(`'${literal}'`)) {
    console.log(`ok      ${codigo} · "${literal}"`);
  } else {
    fallos += 1;
    console.error(`DIVERGE ${codigo} · el literal "${literal}" YA NO está en el prosrc — el wrapper va a caer al genérico EN SILENCIO. Actualizar REBOTES_INVITAR (o mejor: el RPC ganó código y este mapeo muere, D-509).`);
  }
}

// La otra dirección: un rebote NUEVO en el motor que el wrapper no conoce.
const rebotesEnMotor = (prosrc.match(/'ok', false/g) ?? []).length;
if (rebotesEnMotor !== REBOTES_INVITAR.length) {
  fallos += 1;
  console.error(
    `DIVERGE conteo: el motor tiene ${rebotesEnMotor} rebotes suaves y el wrapper tipifica ${REBOTES_INVITAR.length} — hay un rebote sin voz (o uno muerto).`,
  );
}

if (fallos > 0) {
  console.error(`\n${fallos} divergencia(s). El bug D-508 está reapareciendo por la puerta de la voz.`);
  process.exit(1);
}
console.log(`\nVERDE: ${REBOTES_INVITAR.length}/${rebotesEnMotor} rebotes calzan contra el motor vivo.`);
