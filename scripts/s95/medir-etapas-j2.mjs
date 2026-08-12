// S95-J2 · ¿QUÉ DEVUELVE EXACTAMENTE `calcular_etapa_vida()`? SOLO LECTURA.
//
// 🔴 NO SE LEE EL CUERPO Y SE CONFÍA: se EJECUTA la función contra fechas que
// caen en cada rama, y se lee lo que devuelve. Un `RETURN` que alguien cambió
// y un comentario que no se actualizó dicen cosas distintas; solo una de las
// dos es la verdad.
import { dbQuery } from '../lib-db.mjs';

console.log('═══ ① LOS VALORES QUE LA FUNCIÓN DEVUELVE DE VERDAD ═══');
// Una fecha por rama y por familia de especie, más el NULL.
const filas = dbQuery(`
  SELECT e.especie, e.caso,
         calcular_etapa_vida(e.nac, e.especie) etapa
  FROM (VALUES
    ('perro', 'recien nacido',   (current_date - 30)),
    ('perro', '2 anios',         (current_date - 730)),
    ('perro', '5 anios',         (current_date - 1825)),
    ('perro', '12 anios',        (current_date - 4380)),
    ('gato',  '6 meses',         (current_date - 180)),
    ('conejo','1 anio',          (current_date - 365)),
    ('ave',   '5 anios',         (current_date - 1825)),
    ('pez',   '3 anios',         (current_date - 1095)),
    ('perro', 'SIN FECHA',       NULL::date)
  ) AS e(especie, caso, nac)
  ORDER BY 1,2`);
console.log(JSON.stringify(filas, null, 1));

const distintos = [...new Set(filas.map((f) => f.etapa))].sort();
console.log(`\n② VOCABULARIO OBSERVADO (${distintos.length} valores): ${distintos.join(' · ')}`);

// ③ ¿Alguien escribe hoy `momentos_aplicables`? Si el catálogo estuviera
//    poblado, el CHECK podría chocar. Se mide antes de escribirlo.
console.log('\n═══ ③ ESTADO DE `momentos_aplicables` EN EL CATÁLOGO ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT count(*) productos,
         count(*) FILTER (WHERE momentos_aplicables <> '{}') con_momento
  FROM productos`), null, 1));

// ④ ¿Hay algún consumidor vivo que compare momento contra el producto?
//    Si lo hay, cerrar el vocabulario lo puede romper.
console.log('\n═══ ④ ¿QUIÉN LEE `momentos_aplicables` HOY? ═══');
console.log(JSON.stringify(dbQuery(`
  SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND pg_get_functiondef(p.oid) LIKE '%momentos_aplicables%'`), null, 1));
console.log(JSON.stringify(dbQuery(`
  SELECT c.relname, c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='v'
    AND pg_get_viewdef(c.oid) LIKE '%momentos_aplicables%'`), null, 1));
