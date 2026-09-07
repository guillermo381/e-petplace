#!/usr/bin/env node
/**
 * ⭐ EL CRUCE · «emitió alguna vez» contra «tiene productor» (S114-A ④)
 *
 * LA REGLA: un tipo de aviso que YA EMITIÓ y hoy no tiene productor es una
 * CONTRADICCIÓN, no una deuda. Alguien lo produjo —las intenciones están ahí—
 * y después el productor desapareció. *Un tipo sin productor que nunca emitió
 * es trabajo pendiente; uno que emitió y dejó de tenerlo es una regresión, y
 * las dos cosas se ven idénticas mirando sólo la columna `activo`.*
 *
 * EL CASO FUNDANTE: `pedido_nuevo_vendedor` emitió 4 veces entre el 16 y el
 * 18-ago; su productor vivía dentro de `confirmar_pago_pedido` y se perdió el
 * 21-ago al redefinirla con CREATE OR REPLACE. Nada falló. El pedido siguió
 * avanzando y la familia siguió viendo su estado — lo único que dejó de pasar
 * es que del otro lado alguien se enterara. Medido: 14 pedidos pasaron por
 * `vendedor_notificado` y sólo 4 avisaron.
 *
 * 🔴 EL CIEGO QUE ESTE GATE **SÍ** CONOCE, y por el que un cruce ingenuo
 *    reporta 6 rojos de los cuales 5 son falsos:
 *    hay tipos cuyo productor no es una LÍNEA sino una FILA —
 *    `_guarderia_aplicar_acto` lee `cat_guarderia_transiciones.tipo_notificacion`
 *    y emite lo que el catálogo diga. Buscarlos por literal en `pg_proc` no los
 *    encuentra. *Un censo por literal acota; no cierra.*
 */
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';

const SQL = `
with t as (
  select c.codigo, c.activo, c.en_sombra,
    (select count(*) from notificacion_intencion i where i.tipo = c.codigo) as n_int,
    exists(select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname='public' and pg_get_functiondef(p.oid) like '%''' || c.codigo || '''%'
             and p.proname not like '\\_voz%'
             and p.proname <> 'obtener_avisos_del_hogar') as por_literal,
    exists(select 1 from cat_guarderia_transiciones g where g.tipo_notificacion = c.codigo) as por_dato
  from cat_notificacion_tipos c
)
select codigo, n_int, por_literal, por_dato, activo
from t order by codigo;`;

const tmp = '/tmp/verify-emitio-sin-productor.sql';
writeFileSync(tmp, SQL);
let filas;
try {
  const out = execSync(
    `npx supabase --experimental db query --linked --file ${tmp}`,
    { encoding: 'utf8', stdio: ['ignore','pipe','ignore'], cwd: process.cwd() },
  );
  filas = JSON.parse(out).rows;
} catch (e) {
  // 🔴 NO CONCLUYENTE, jamás verde. Un gate que no pudo medir y sale 0 se lee
  //    como salud en cada corrida siguiente.
  console.log('⚠️  NO CONCLUYENTE · no se pudo consultar la base.');
  console.log('   (sin acceso al proyecto linkeado; el gate NO da verde por no haber medido)');
  process.exit(2);
} finally { try { unlinkSync(tmp); } catch {} }

const conProductor = (f) => f.por_literal || f.por_dato;
const rojos   = filas.filter((f) => f.n_int > 0 && !conProductor(f));
const deuda   = filas.filter((f) => f.n_int === 0 && !conProductor(f));
const porDato = filas.filter((f) => f.por_dato);

console.log('⭐ CRUCE · ¿algún tipo EMITIÓ y hoy no tiene quién lo produzca?\n');
console.log(`   tipos              : ${filas.length}`);
console.log(`   productor por línea: ${filas.filter((f) => f.por_literal).length}`);
console.log(`   productor por fila : ${porDato.length}  (${porDato.map((f) => f.codigo).join(', ')})`);
console.log(`   sin productor      : ${filas.filter((f) => !conProductor(f)).length}`);

// CONTROL POSITIVO DEL INSTRUMENTO. Si el reconocedor de productores estuviera
// roto, TODO saldría sin productor y los rojos serían ruido. Se exige que
// encuentre productores por las DOS vías antes de creerle a un rojo.
if (filas.filter((f) => f.por_literal).length === 0 || porDato.length === 0) {
  console.log('\n⚠️  NO CONCLUYENTE · el reconocedor no encontró productores por alguna de las');
  console.log('    dos vías. Sus rojos no se pueden distinguir de un instrumento ciego.');
  process.exit(2);
}

if (deuda.length > 0) {
  console.log(`\n   ${deuda.length} tipo(s) sin productor que NUNCA emitieron — deuda de`);
  console.log('   construcción (D-673), no contradicción. No es rojo:');
  console.log('     ' + deuda.map((f) => f.codigo).join(' · '));
}

if (rojos.length === 0) {
  console.log('\n✅ VERDE · ningún tipo emitió y se quedó sin productor.');
  process.exit(0);
}

console.log(`\n🔴 ${rojos.length} tipo(s) EMITIERON Y HOY NO TIENEN PRODUCTOR:`);
for (const f of rojos) {
  console.log(`   ${f.codigo}  ·  ${f.n_int} intención(es)  ·  activo=${f.activo}`);
}
console.log('\n   Alguien las produjo y el productor desapareció. Eso es una');
console.log('   regresión, no un pendiente: el aviso dejó de salir sin que nada fallara.');
process.exit(1);
