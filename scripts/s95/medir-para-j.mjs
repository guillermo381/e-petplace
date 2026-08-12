// S95-J · Medición previa. SOLO LECTURA. Regla 22.
//   J.1 ¿qué forma tiene `productos.imagenes`? (no asumir array de URLs)
//   J.2 ¿cuál es el vocabulario VIVO de tallas y de momentos vitales?
import { dbQuery } from '../lib-db.mjs';
const p = (r) => console.log(JSON.stringify(r, null, 1));

console.log('═══ J.1 · LAS COLUMNAS DE FOTO ═══');
p(dbQuery(`
  SELECT column_name, data_type, udt_name, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='productos'
    AND column_name IN ('imagen_url','imagenes')`));

console.log('\n── ¿hay filas con foto para mirar la forma? ──');
p(dbQuery(`
  SELECT count(*) total,
         count(*) FILTER (WHERE imagen_url IS NOT NULL) con_url,
         count(*) FILTER (WHERE imagenes IS NOT NULL) con_imagenes
  FROM productos`));

console.log('\n── el DEFAULT y el COMMENT dicen la forma cuando no hay datos ──');
p(dbQuery(`
  SELECT a.attname, pg_get_expr(d.adbin, d.adrelid) def,
         col_description(a.attrelid, a.attnum) comentario
  FROM pg_attribute a
  LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
  WHERE a.attrelid='public.productos'::regclass
    AND a.attname IN ('imagen_url','imagenes')`));

console.log('\n═══ J.2 · EL VOCABULARIO DE TALLAS, donde la casa ya lo declara ═══');
console.log('── CHECK de `mascotas.talla` ──');
p(dbQuery(`
  SELECT conname, pg_get_constraintdef(oid) d FROM pg_constraint
  WHERE conrelid='public.mascotas'::regclass AND contype='c'
    AND pg_get_constraintdef(oid) ~ 'talla'`));

console.log('\n── ¿hay catálogo de tallas en tabla? ──');
p(dbQuery(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema='public' AND table_name ~ 'talla'`));

console.log('\n── valores VIVOS de talla en mascotas ──');
p(dbQuery(`SELECT talla, count(*) n FROM mascotas GROUP BY talla ORDER BY 1`));

console.log('\n═══ J.2 · EL VOCABULARIO DE MOMENTOS VITALES ═══');
p(dbQuery(`
  SELECT table_name, string_agg(column_name,', ' ORDER BY ordinal_position) cols
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name ~ 'especies_perfil|momento'
  GROUP BY table_name`));

console.log('\n── el productor: `calcular_etapa_vida` ──');
p(dbQuery(`
  SELECT pg_get_functiondef(p.oid) d FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='calcular_etapa_vida'`));

console.log('\n── ¿hay CHECK hoy en productos para estas dos columnas? ──');
p(dbQuery(`
  SELECT conname, pg_get_constraintdef(oid) d FROM pg_constraint
  WHERE conrelid='public.productos'::regclass AND contype='c'`));
