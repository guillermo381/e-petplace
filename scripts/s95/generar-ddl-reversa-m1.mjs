// S95-C · Genera el ARCHIVO DE REVERSA COMPLETO de la migración 1, con el DDL
// leído de la base viva — para que la reversa sea EJECUTABLE y no una promesa.
// SOLO LECTURA sobre la base. Uso:
//   node scripts/s95/generar-ddl-reversa-m1.mjs > docs/relevamientos/2026-08-11-s95-m1-REVERSA.sql
import { dbQuery } from '../lib-db.mjs';

console.log(`-- ═══════════════════════════════════════════════════════════════════
-- REVERSA DE LA MIGRACIÓN 1 · S95-C — limpieza del comercio de legado
--   supabase/migrations/20260811120000_s95_m1_limpieza_comercio.sql
--
-- 🔴 LO QUE ESTA REVERSA PUEDE Y LO QUE NO — se dice antes de la primera línea:
--
--   ✅ PUEDE devolver la ESTRUCTURA: las 14 tablas, sus constraints, sus
--      índices, sus policies, las 2 vistas y las 12 columnas \`vtex_*\`.
--   ✅ PUEDE devolver el estado de permisos de \`pedidos\` anterior a D-757.
--
--   ❌ NO PUEDE devolver NINGUNA FILA. Se borran 137 pedidos, 5 envíos,
--      9 eventos de envío, 5 devoluciones, 2 comisiones, 3 liquidaciones,
--      1 regla de asignación y 1 mensaje. **El DDL se puede recrear; las filas
--      no vuelven.**
--
--   ❌ Y la copia de seguridad tampoco alcanza como red: es diaria y COMPLETA
--      (D-742). Recuperar una fila significa volver la base ENTERA a ayer, y
--      con ella todo lo bueno que pasó desde entonces.
--
--   ⇒ Esta reversa sirve para «se rompió una pantalla del portal admin»,
--      JAMÁS para «necesitaba ese dato».
--
-- Autorización del borrado: firma del founder del 11-ago-2026 sobre las quince
-- fichas — «TODO ES DATA DE PRUEBA, nada es real hoy», incluidas las dos
-- liquidaciones que dicen «pagado» y el mensaje a «Luis».
--
-- Este archivo se GENERA, no se escribe a mano:
--   node scripts/s95/generar-ddl-reversa-m1.mjs > <este archivo>
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ─── PARTE 1 · LAS TABLAS (estructura, sin filas) ──────────────────────`);

const TABLAS = [
  'seller_inventario', 'seller_comisiones', 'seller_documentos',
  'seller_liquidaciones', 'liquidacion_pedidos', 'seller_reglas_asignacion',
  'mensajes_admin_seller', 'pedidos_recurrentes',
  'wishlist', 'lista_espera', 'planes_nutricion', 'checkout_sesiones',
  'vtex_sync_log', 'servicios_exequiales',
];

for (const t of TABLAS) {
  const cols = dbQuery(`
    SELECT column_name, data_type, udt_name, character_maximum_length,
           numeric_precision, numeric_scale, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='${t}' ORDER BY ordinal_position`);

  const tipo = (c) => {
    if (c.data_type === 'USER-DEFINED') return c.udt_name;
    if (c.data_type === 'ARRAY') return c.udt_name.replace(/^_/, '') + '[]';
    if (c.data_type === 'numeric' && c.numeric_precision)
      return `numeric(${c.numeric_precision},${c.numeric_scale})`;
    if (c.data_type === 'character varying' && c.character_maximum_length)
      return `varchar(${c.character_maximum_length})`;
    // `character` sin longitud es `character(1)` — emitirlo pelado deja una
    // reversa que compila y guarda otra cosa. Se declara la longitud siempre.
    if (c.data_type === 'character')
      return `character(${c.character_maximum_length ?? 1})`;
    return c.data_type;
  };

  const lineas = cols.map((c) => {
    let s = `  ${c.column_name} ${tipo(c)}`;
    if (c.column_default) s += ` DEFAULT ${c.column_default}`;
    if (c.is_nullable === 'NO') s += ' NOT NULL';
    return s;
  });

  const cons = dbQuery(`
    SELECT con.conname, pg_get_constraintdef(con.oid) def, con.contype::text
    FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='${t}' ORDER BY con.contype, con.conname`);

  const idx = dbQuery(`
    SELECT indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='${t}'
      AND indexname NOT IN (SELECT conname FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid WHERE c.relname='${t}')`);

  const pols = dbQuery(`
    SELECT policyname, cmd, roles::text, qual, with_check FROM pg_policies
    WHERE schemaname='public' AND tablename='${t}'`);

  console.log(`\n-- ─── ${t} ───────────────────────────────────────────────`);
  console.log(`CREATE TABLE public.${t} (\n${lineas.join(',\n')}\n);`);
  for (const c of cons) console.log(`ALTER TABLE public.${t} ADD CONSTRAINT ${c.conname} ${c.def};`);
  for (const i of idx) console.log(i.indexdef + ';');
  console.log(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;`);
  for (const p of pols) {
    const roles = p.roles.replace(/[{}]/g, '');
    let s = `CREATE POLICY "${p.policyname}" ON public.${t} FOR ${p.cmd} TO ${roles}`;
    if (p.qual) s += `\n  USING (${p.qual})`;
    if (p.with_check) s += `\n  WITH CHECK (${p.with_check})`;
    console.log(s + ';');
  }
}

console.log('\n-- ─── PARTE 2 · LAS DOS VISTAS ──────────────────────────────────────────');
for (const v of ['v_pedido_liquidacion', 'v_recurrentes_pendientes']) {
  const d = dbQuery(`SELECT pg_get_viewdef(c.oid) def FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='${v}'`)[0];
  console.log(`\nCREATE VIEW public.${v} AS\n${d.def}`);
}

// ── PARTE 3 · las columnas vtex_* y las dos que la M1 saca por dependencia ──
const COLUMNAS = dbQuery(`
  SELECT table_name, column_name, data_type, udt_name, character_maximum_length,
         numeric_precision, numeric_scale, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema='public'
    AND ( column_name LIKE 'vtex%'
       OR (table_name='pedidos' AND column_name='recurrente_id')
       OR (table_name='pedido_items' AND column_name='liquidacion_id') )
  ORDER BY table_name, column_name`);

console.log('\n-- ─── PARTE 3 · LAS COLUMNAS ────────────────────────────────────────────');
console.log('-- Las 12 `vtex_*` + las dos que la M1 saca porque bloquean un DROP.');
for (const c of COLUMNAS) {
  const t = c.data_type === 'numeric' && c.numeric_precision
    ? `numeric(${c.numeric_precision},${c.numeric_scale})`
    : c.data_type === 'character' ? `character(${c.character_maximum_length ?? 1})`
    : c.data_type === 'character varying' && c.character_maximum_length
      ? `varchar(${c.character_maximum_length})` : c.data_type;
  console.log(`ALTER TABLE public.${c.table_name} ADD COLUMN ${c.column_name} ${t}${c.column_default ? ' DEFAULT ' + c.column_default : ''};`);
}
console.log(`
-- Sus constraints e índices (medidos, no supuestos):
ALTER TABLE public.productos ADD CONSTRAINT productos_vtex_product_id_key UNIQUE (vtex_product_id);
CREATE INDEX idx_productos_vtex ON public.productos USING btree (vtex_product_id) WHERE (vtex_product_id IS NOT NULL);
ALTER TABLE public.seller_perfil ADD CONSTRAINT seller_perfil_vtex_seller_id_key UNIQUE (vtex_seller_id);
ALTER TABLE public.seller_perfil ADD CONSTRAINT seller_perfil_vtex_estado_sync_check
  CHECK (((vtex_estado_sync = ANY (ARRAY['nunca'::text,'pendiente'::text,'sincronizado'::text,'error'::text])) OR (vtex_estado_sync IS NULL)));
CREATE INDEX idx_seller_perfil_vtex_sync ON public.seller_perfil USING btree (vtex_estado_sync, vtex_ultima_sync) WHERE (vtex_seller_id IS NOT NULL);

-- Y las dos FKs que las columnas de dependencia arrastraban:
ALTER TABLE public.pedidos ADD CONSTRAINT fk_pedido_recurrente
  FOREIGN KEY (recurrente_id) REFERENCES pedidos_recurrentes(id) ON DELETE SET NULL;
ALTER TABLE public.pedido_items ADD CONSTRAINT pedido_items_liquidacion_id_fkey
  FOREIGN KEY (liquidacion_id) REFERENCES seller_liquidaciones(id);

-- ─── PARTE 4 · D-757: devolver la puerta anónima de \`pedidos\` ──────────────
-- 🔴 REVERTIR ESTA PARTE REABRE UNA PUERTA DE ESCRITURA ANÓNIMA.
--    Cualquiera con la clave pública del bundle vuelve a poder crear pedidos.
--    Se incluye por completitud de la reversa, NO porque convenga ejecutarla.
GRANT INSERT, UPDATE, DELETE, TRUNCATE, SELECT ON public.pedidos TO anon;
DROP POLICY IF EXISTS pedidos_insert_propio ON public.pedidos;
CREATE POLICY "Guest pedidos insert" ON public.pedidos FOR INSERT TO public
  WITH CHECK ((user_id IS NULL));
CREATE POLICY "pedidos_insert" ON public.pedidos FOR INSERT TO public
  WITH CHECK (((auth.uid() = user_id) OR ((user_id IS NULL) AND (guest_email IS NOT NULL))));
CREATE POLICY "pedidos_select_guest" ON public.pedidos FOR SELECT TO anon
  USING (false);
CREATE POLICY "reclamar_pedidos_guest" ON public.pedidos FOR UPDATE TO authenticated
  USING (((user_id IS NULL) AND (lower(guest_email) = lower(auth.email()))))
  WITH CHECK ((user_id = auth.uid()));

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- LO QUE ESTA REVERSA NO DESHACE, dicho de nuevo al final porque es lo
-- único que importa: NINGUNA FILA VUELVE. Ni los 137 pedidos, ni sus
-- envíos y devoluciones, ni las dos comisiones al 20 %, ni las tres
-- liquidaciones, ni la regla de asignación, ni el mensaje a «Luis».
-- ═══════════════════════════════════════════════════════════════════`);
