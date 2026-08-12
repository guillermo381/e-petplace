-- ═══════════════════════════════════════════════════════════════════════════
-- S95-C · MIGRACIÓN 8 — EL BARRIDO FINAL DE RLS Y GRANTS
--
-- El repaso contra los once invariantes. Lo que quedó abierto tras siete
-- migraciones, medido y no supuesto (`scripts/s95/auditar-frente.mjs`):
--
--   ✅ RLS activa en las 25 tablas del frente · cero tablas sin policy
--   ✅ cero policies `ALL` · cero privilegios de `anon` sobre las 23 nuevas
--   ✅ las seis funciones nuevas con `search_path` fijo y sin `anon`
--   🔴 **DOS AGUJEROS, y son las dos tablas que la M1 no pudo apagar:**
--      `seller_perfil` y `resenas_productos` conservan
--      `SELECT, INSERT, UPDATE, DELETE, TRUNCATE` para **`anon`**.
--
-- Reversa (escrita ANTES): docs/relevamientos/2026-08-11-s95-m8-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- LA VEDA **NO RIGE**. Esta migración solo revoca privilegios y escribe
-- comentarios. Cero DDL de estructura, cero filas tocadas, cero anclas.
--
-- ── 🔴 EL HALLAZGO QUE HABILITA ESTA MIGRACIÓN ────────────────────────────
-- Las cinco vistas que bloquearon los DROP de la M1 y la M4 **NO son
-- `security_invoker`** (medido: `reloptions` en NULL). Una vista sin esa
-- opción corre con los privilegios de su DUEÑO, no de quien la consulta.
--
-- **Por lo tanto se le puede quitar TODO privilegio a `anon` y a
-- `authenticated` sobre las dos tablas sin romper ninguna vista.**
--
-- Es el tratamiento «se marca como fuera de uso» que la ficha de firma
-- describía: **la tabla queda, el dato se conserva, y deja de ser alcanzable
-- por el camino normal.** No reemplaza al borrado — lo espera.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 🔴 CINTURÓN 0 · el rojo, REPRODUCIDO antes de curarlo.
--    Un guard que no puede ver el agujero no prueba que lo cerró.
DO $$
DECLARE v_abierto text;
BEGIN
  SELECT string_agg(x || '(' ||
           CASE WHEN has_table_privilege('anon','public.'||x,'INSERT') THEN 'INSERT ' ELSE '' END ||
           CASE WHEN has_table_privilege('anon','public.'||x,'UPDATE') THEN 'UPDATE ' ELSE '' END ||
           CASE WHEN has_table_privilege('anon','public.'||x,'DELETE') THEN 'DELETE' ELSE '' END || ')', ', ')
    INTO v_abierto
  FROM unnest(ARRAY['seller_perfil','resenas_productos']) x
  WHERE has_table_privilege('anon','public.'||x,'INSERT');

  IF v_abierto IS NULL THEN
    RAISE EXCEPTION 'ABORTA: el rojo que esta migración viene a curar NO se reprodujo. O ya se curó en otro lado, o el instrumento mide mal — y las dos cosas exigen mirar antes de seguir.';
  END IF;
  RAISE NOTICE 'ROJO REPRODUCIDO: %', v_abierto;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE A · LAS DOS TABLAS QUE NO SE PUDIERON APAGAR, NEUTRALIZADAS
-- ───────────────────────────────────────────────────────────────────────────
REVOKE ALL ON public.seller_perfil     FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.resenas_productos FROM anon, authenticated, PUBLIC;

COMMENT ON TABLE public.seller_perfil IS
  '☠️ JUBILADA Y NO BORRADA (S95-C). El vendedor es un ROL sobre '
  '`cuentas_comerciales` (MODELO_DESPENSA §8), no un perfil aparte. '
  'NO SE PUDO BORRAR porque `v_pitch_metrics` la lee, y esa vista cuenta '
  'prestadores, mascotas con historia clínica y citas del mes: sirve a un '
  'frente que no es la despensa, y no se reescribe una vista ajena por cuenta '
  'propia. Se le revocó todo privilegio de `anon` y `authenticated`: la vista '
  'sigue funcionando porque NO es security_invoker (corre como su dueño). '
  'PENDIENTE: borrarla cuando el founder confirme que el portal admin no tiene '
  'pantalla que la use. 0 filas.';

COMMENT ON TABLE public.resenas_productos IS
  '☠️ JUBILADA Y NO BORRADA (S95-C). La despensa v1 no tiene opiniones. '
  'NO SE PUDO BORRAR porque `v_resenas_todas` la UNE con las opiniones de '
  'PRESTADORES — borrarla rompe un frente vivo que no tiene nada que ver con '
  'la despensa. Mismo tratamiento y mismo pendiente que `seller_perfil`. '
  '0 filas.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE B · EL BARRIDO — verificación de los once invariantes en la base
-- Lo que sigue no cambia nada: PREGUNTA. Si alguna respuesta es la equivocada,
-- las siete migraciones anteriores se revierten juntas por el COMMIT que no
-- ocurre.
-- ───────────────────────────────────────────────────────────────────────────

-- ① RLS activa en todo el frente · cero policies ALL.
DO $$
DECLARE v_sin_rls text; v_all text; v_sin_policy text;
BEGIN
  SELECT string_agg(c.relname, ', ') INTO v_sin_rls
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity
    AND c.relname IN ('productos','producto_variantes','vendedor_skus','ofertas',
      'cat_familias_producto','cat_tasas_impuesto','inventario_movimientos',
      'inventario_reservas','vendedor_bodegas','pedidos','pedido_items',
      'pedido_estados','cat_estados_pedido','pedido_descuentos','pagos_intentos',
      'pagos_eventos','facturas','envios','envio_eventos','zonas_cobertura',
      'cat_transportistas','devoluciones','evento_producto_asignacion');
  IF v_sin_rls IS NOT NULL THEN RAISE EXCEPTION 'ABORTA ①: sin RLS (%).', v_sin_rls; END IF;

  SELECT string_agg(tablename||'.'||policyname, ', ') INTO v_all FROM pg_policies
   WHERE schemaname='public' AND cmd='ALL'
     AND tablename IN ('productos','producto_variantes','vendedor_skus','ofertas',
      'cat_familias_producto','cat_tasas_impuesto','inventario_movimientos',
      'inventario_reservas','vendedor_bodegas','pedidos','pedido_items',
      'pedido_estados','cat_estados_pedido','pedido_descuentos','pagos_intentos',
      'pagos_eventos','facturas','envios','envio_eventos','zonas_cobertura',
      'cat_transportistas','devoluciones','evento_producto_asignacion');
  IF v_all IS NOT NULL THEN RAISE EXCEPTION 'ABORTA ①: policies ALL (%).', v_all; END IF;

  SELECT string_agg(x, ', ') INTO v_sin_policy FROM unnest(ARRAY['productos',
    'producto_variantes','vendedor_skus','ofertas','inventario_movimientos',
    'pedidos','pedido_estados','pagos_intentos','evento_producto_asignacion']) x
  WHERE NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=x);
  IF v_sin_policy IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA ①: con RLS y SIN POLICY — la tabla es un ladrillo (%).', v_sin_policy;
  END IF;
END $$;

-- ② EL CINTURÓN servicios ↔ productos.
DO $$
DECLARE v_cruces text;
BEGIN
  SELECT string_agg(src.relname||' → '||tgt.relname, ', ') INTO v_cruces
  FROM pg_constraint con
  JOIN pg_class src ON src.oid=con.conrelid
  JOIN pg_class tgt ON tgt.oid=con.confrelid
  JOIN pg_namespace n ON n.oid=src.relnamespace
  WHERE n.nspname='public' AND con.contype='f'
    AND ((src.relname IN ('productos','producto_variantes','vendedor_skus','ofertas',
                          'pedidos','pedido_items','pedido_estados','pagos_intentos',
                          'inventario_movimientos','envios')
          AND tgt.relname IN ('evento_cita_servicio','evento_atencion','prestadores',
                              'prestador_servicios','tipos_servicio','bonos',
                              'suscripciones_servicio','estadias','servicios_exequiales'))
      OR (tgt.relname IN ('productos','producto_variantes','vendedor_skus','ofertas',
                          'pedidos','pedido_items','pedido_estados','pagos_intentos',
                          'inventario_movimientos','envios')
          AND src.relname IN ('evento_cita_servicio','evento_atencion','prestadores',
                              'prestador_servicios','tipos_servicio','bonos',
                              'suscripciones_servicio','estadias','servicios_exequiales')));
  IF v_cruces IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA ②: EL CINTURÓN ESTÁ ROTO (%). Perdió su mitad con multa al salir de VTEX: ahora se sostiene SOLO acá.', v_cruces;
  END IF;
END $$;

-- ③ La compra NO alimenta el loyalty · ④ el vendedor no toca el expediente.
DO $$
DECLARE v_n int; v_p text;
BEGIN
  SELECT count(*) INTO v_n FROM pg_trigger t
    JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_proc p ON p.oid=t.tgfoid
   WHERE NOT t.tgisinternal
     AND c.relname IN ('pedidos','pedido_items','pedido_estados','pagos_intentos',
                       'evento_producto_asignacion','ofertas','vendedor_skus')
     AND pg_get_functiondef(p.oid) ~* '(transacciones_puntos|otorgar_puntos|puntos_usuario|logros)';
  IF v_n > 0 THEN
    RAISE EXCEPTION 'ABORTA ③: % trigger(es) conectan la compra con el motor de puntos. MODELO_LOYALTY §5, sin excepción.', v_n;
  END IF;

  SELECT string_agg(tablename||'.'||policyname, ', ') INTO v_p FROM pg_policies
   WHERE schemaname='public'
     AND tablename IN ('eventos_mascota','mascota_perfil_vigente','mascotas',
                       'evento_vacuna_aplicada','evento_medicacion_prescrita',
                       'evento_producto_asignacion')
     AND (COALESCE(qual,'')||COALESCE(with_check,'')) ~* '(es_vendedor_de|seller|vendedor_skus|ofertas)';
  IF v_p IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA ④: una policy del expediente resuelve por vendedor (%). El rol seller no hereda NADA del rol prestador.', v_p;
  END IF;
END $$;

-- ⑤ La comisión · ⑥ el tipo de evento · ⑨ el financiador.
DO $$
DECLARE v_pct numeric; v_base text; v_n int; v_null text;
BEGIN
  SELECT (resolver_comision_despensa('EC', now())->>'pct')::numeric,
          resolver_comision_despensa('EC', now())->>'base'
    INTO v_pct, v_base;
  IF v_pct <> 10 OR v_base <> 'total_con_impuesto' THEN
    RAISE EXCEPTION 'ABORTA ⑤: la comisión vigente es %%% sobre "%".', v_pct, v_base;
  END IF;

  SELECT count(*) INTO v_n FROM cat_tipos_evento
   WHERE codigo ~* 'producto' AND tabla_tipada = 'evento_producto_asignacion';
  IF v_n <> 1 THEN RAISE EXCEPTION 'ABORTA ⑥: el tipo de compra no es UNO con casa (son %).', v_n; END IF;

  SELECT is_nullable INTO v_null FROM information_schema.columns
   WHERE table_schema='public' AND table_name='pedido_descuentos' AND column_name='financiado_por';
  IF v_null <> 'NO' THEN RAISE EXCEPTION 'ABORTA ⑨: el financiador del descuento es NULLABLE.'; END IF;
END $$;

-- ⑦ Append-only de las cuatro · ⑧ todo monto con su moneda.
DO $$
DECLARE v_mal text; v_huerfano text;
BEGIN
  SELECT string_agg(t||': '||r||' puede '||p, ', ') INTO v_mal
  FROM unnest(ARRAY['pedido_estados','inventario_movimientos','pagos_eventos',
                    'envio_eventos','evento_producto_asignacion']) t,
       unnest(ARRAY['anon','authenticated']) r,
       unnest(ARRAY['UPDATE','DELETE','TRUNCATE']) p
  WHERE has_table_privilege(r, 'public.'||t, p);
  IF v_mal IS NOT NULL THEN RAISE EXCEPTION 'ABORTA ⑦: no son append-only (%).', v_mal; END IF;

  SELECT string_agg(m.table_name||'.'||m.column_name, ', ') INTO v_huerfano
  FROM information_schema.columns m
  WHERE m.table_schema='public'
    AND m.table_name IN ('productos','producto_variantes','vendedor_skus','ofertas',
      'pedidos','pedido_items','pedido_descuentos','pagos_intentos','facturas',
      'envios','zonas_cobertura','devoluciones')
    AND m.data_type='numeric'
    AND m.column_name ~* '(precio|monto|total|subtotal|costo|tarifa|descuento|reembolso)'
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns c2
                     WHERE c2.table_schema='public' AND c2.table_name=m.table_name
                       AND c2.column_name='moneda');
  IF v_huerfano IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA ⑧: montos sin moneda al lado (%).', v_huerfano;
  END IF;
END $$;

-- ⑪ `pedidos` sin puerta anónima · y las dos neutralizadas de verdad.
DO $$
DECLARE v_mal text;
BEGIN
  SELECT string_agg(t||'.'||p, ', ') INTO v_mal
  FROM unnest(ARRAY['pedidos','seller_perfil','resenas_productos']) t,
       unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE']) p
  WHERE has_table_privilege('anon', 'public.'||t, p);
  IF v_mal IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA ⑪: anon conserva privilegio efectivo (%).', v_mal;
  END IF;

  -- CONTRA-CASO: el camino legítimo de `pedidos` sigue abierto. Cerrar todo
  -- no es curar: es romper.
  IF NOT has_table_privilege('authenticated','public.pedidos','INSERT') THEN
    RAISE EXCEPTION 'ABORTA: el barrido dejó a authenticated sin poder crear un pedido.';
  END IF;
END $$;

-- 🔴 EL ÚLTIMO, Y ES EL QUE MÁS FÁCIL SE OLVIDA: L-140 sobre las seis
--    funciones que S95 creó. Una función nace con EXECUTE para anon por
--    default privileges, y ninguna migración lo dice en voz alta.
DO $$
DECLARE v_mal text;
BEGIN
  SELECT string_agg(p.proname, ', ') INTO v_mal
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.proname IN ('es_vendedor_de','resolver_comision_despensa',
                      'expirar_reservas_vencidas','_trg_inventario_aplicar_movimiento',
                      '_trg_pedido_estado_actual','_trg_producto_asignacion_frontera')
    AND has_function_privilege('anon', p.oid, 'EXECUTE');
  IF v_mal IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA L-140: funciones ejecutables por anon (%).', v_mal;
  END IF;

  SELECT string_agg(p.proname, ', ') INTO v_mal
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.proname IN ('es_vendedor_de','resolver_comision_despensa',
                      'expirar_reservas_vencidas','_trg_inventario_aplicar_movimiento',
                      '_trg_pedido_estado_actual','_trg_producto_asignacion_frontera')
    AND p.proconfig IS NULL;
  IF v_mal IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: funciones DEFINER sin search_path fijo (%).', v_mal;
  END IF;
END $$;

COMMIT;
