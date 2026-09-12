#!/usr/bin/env node
/**
 * verify:tasa-cobrable · el control que `D-1071` pide
 *
 * 🔴 NACE PORQUE EL FOUNDER LO DESTAPÓ COMPRANDO, NO UN GATE. La mitad del
 *    catálogo de servicios —15 de 30 tipos activos— no se podía cobrar, y
 *    ningún instrumento lo medía: los que pasaban eran los exentos, así que
 *    todo se veía normal mientras lo gravado rebotaba en silencio.
 *
 * Mide DOS cosas, y las dos hacen falta:
 *  ① TODOS los tipos activos resuelven su tasa (no sólo los exentos).
 *  ② Los desgloses congelados la declaran — un desglose sin tasa NO se puede
 *    cobrar, y eso es correcto: lo que el gate exige es que no haya ninguno
 *    cuyo tipo SÍ resuelva y que igual se haya quedado sin ella.
 */
import { dbQuery } from './lib-db.mjs';

const SQL = `
select
  (select count(*) from tipos_servicio where activo) as tipos_activos,
  (select count(*) from tipos_servicio ts
     join cat_tasas_impuesto ct on ct.codigo = ts.codigo_iva and ct.activo
    where ts.activo) as tipos_que_resuelven,
  (select count(*) from tipos_servicio ts
     join cat_tasas_impuesto ct on ct.codigo = ts.codigo_iva and ct.activo
    where ts.activo and ct.pct > 0) as gravados,
  (select count(*) from cita_desglose) as desgloses,
  (select count(*) from cita_desglose where tarifa_pct is not null) as con_tasa,
  (select coalesce(string_agg(distinct ts.codigo, ', '), '')
     from cita_desglose d
     join evento_cita_servicio c on c.id = d.cita_id
     join tipos_servicio ts on ts.codigo = c.tipo_servicio
     join cat_tasas_impuesto ct on ct.codigo = ts.codigo_iva and ct.activo
    where d.tarifa_pct is null) as huerfanos`;

const filas = dbQuery(SQL);
const r = Array.isArray(filas) ? filas[0] : filas;
let fallos = 0;
const ok = (c, q, d = '') => { console.log(`  ${c ? '✓' : '✗'} ${q}${d ? ' · ' + d : ''}`); if (!c) fallos++; };

ok(Number(r.tipos_que_resuelven) === Number(r.tipos_activos),
   'TODOS los tipos activos resuelven su tasa',
   `${r.tipos_que_resuelven} de ${r.tipos_activos}`);

/* 🔴 El brazo que discrimina: sin esto, un catálogo donde TODO fuera exento
   pasaría el gate y seguiríamos sin saber si lo gravado cobra. */
ok(Number(r.gravados) > 0,
   'hay tipos GRAVADOS en el catálogo (si no, el gate no mide nada)',
   `${r.gravados} gravados`);

ok(r.huerfanos === '' || r.huerfanos === null,
   'ningún desglose sin tasa cuyo tipo SÍ la resuelve',
   r.huerfanos ? `huérfanos: ${r.huerfanos}` : `${r.con_tasa} de ${r.desgloses} con tasa`);

console.log(fallos === 0 ? '\nverify:tasa-cobrable VERDE' : `\nverify:tasa-cobrable — ${fallos} fallo(s)`);
process.exit(fallos === 0 ? 0 : 1);
