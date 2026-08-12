-- ═══════════════════════════════════════════════════════════════════════════
-- S95-G2 · LA PUERTA ÚNICA DEL ALTA — se cierran las escrituras directas
--
-- 🔴 EL HALLAZGO: `reglas_envio` y `vendedor_bodegas` tienen policies de
-- INSERT y UPDATE para `authenticated`. Con esas policies vivas, las tres
-- funciones que S95-G2 acaba de construir son **opcionales**: cualquiera puede
-- escribir la fila directo y saltearse el gate, la validación del tipo apagado
-- y la idempotencia. *Una puerta única que convive con una puerta de servicio
-- no es una puerta única: es una sugerencia.*
--
-- Es D-762 en su forma chica y del lado correcto del tiempo: las 104
-- escrituras directas del portal admin ya son deuda cara; estas dos tablas
-- nacieron ayer y todavía se pueden cerrar sin migrar a nadie.
--
-- ── QUÉ SE CIERRA Y QUÉ NO ────────────────────────────────────────────────
-- Se van las policies de ESCRITURA de las dos tablas. **La lectura queda**:
-- el vendedor tiene que poder ver su regla y su bodega en el panel.
-- `cuenta_roles` ya estaba bien (solo `admin_all_cuenta_roles`).
--
-- Reversa (escrita ANTES): scripts/s95/2026-08-12-s95g2c-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- **NO RIGE.** Solo se borran policies: cero backfill, cero filas tocadas.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP POLICY IF EXISTS reglas_envio_insert ON public.reglas_envio;
DROP POLICY IF EXISTS reglas_envio_update ON public.reglas_envio;
DROP POLICY IF EXISTS bodegas_insert      ON public.vendedor_bodegas;
DROP POLICY IF EXISTS bodegas_update      ON public.vendedor_bodegas;
-- 🔴 Y LAS DE DELETE, que mi primera versión NO cerró y el cinturón encontró
--    abortando: borrar la regla directo se saltea la vigencia —la disciplina
--    de que redefinir cierra la anterior en vez de apilarla— y dejaría al
--    vendedor sin regla sin que ningún camino lo declare.
DROP POLICY IF EXISTS reglas_envio_delete ON public.reglas_envio;
DROP POLICY IF EXISTS bodegas_delete      ON public.vendedor_bodegas;

COMMENT ON TABLE public.reglas_envio IS
  'S95-G2 · SIN policies de escritura a propósito. La única puerta es '
  '`definir_regla_envio_vendedor()`, que valida el tipo, exige `pagado_por` y '
  'no apila reglas. Escribir directo se saltearía las tres cosas.';
COMMENT ON TABLE public.vendedor_bodegas IS
  'S95-G2 · SIN policies de escritura a propósito. La única puerta es '
  '`crear_bodega_vendedor()`, que exige ciudad —sin origen declarado la '
  'promesa de entrega sería inventada— y es idempotente por nombre.';

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN · la escritura directa rebota, la función pasa, la lectura vive
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v_cc uuid; v_dueno uuid; v_n int;
BEGIN
  SELECT cc.id, cc.owner_profile_id INTO v_cc, v_dueno
  FROM cuentas_comerciales cc WHERE cc.estado='activa' AND cc.owner_profile_id IS NOT NULL LIMIT 1;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'ABORTA: sin cuenta activa no se prueba nada.'; END IF;

  -- Cero policies de escritura en las dos tablas.
  SELECT count(*) INTO v_n FROM pg_policies
   WHERE schemaname='public' AND tablename IN ('reglas_envio','vendedor_bodegas')
     AND cmd IN ('INSERT','UPDATE','ALL','DELETE');
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'ABORTA: quedaron % policies de escritura — la puerta de servicio sigue abierta.', v_n;
  END IF;

  -- 🔴 CONTRA-CASO OBLIGATORIO: la LECTURA no se puede haber roto. Sin esto,
  --    cerrar de más daría verde y el panel del vendedor quedaría ciego.
  SELECT count(*) INTO v_n FROM pg_policies
   WHERE schemaname='public' AND tablename IN ('reglas_envio','vendedor_bodegas')
     AND cmd='SELECT';
  IF v_n < 2 THEN
    RAISE EXCEPTION 'ABORTA: se llevó puesta la lectura — el vendedor no podría ver su regla ni su bodega.';
  END IF;

  -- Y la puerta buena SIGUE funcionando: las funciones son DEFINER, así que
  -- la RLS no las alcanza. Si esto rebotara, el alta quedaría sin ningún camino.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_dueno, 'role','authenticated')::text, true);
  IF NOT is_admin() THEN
    -- El titular no es admin: se le da el rol por la vía correcta para poder
    -- probar, y se lo quita al final.
    INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en, metadata)
      VALUES (v_cc,'seller_productos','activo',now(),'{"fixture":"__cint_s95g2c"}'::jsonb)
      ON CONFLICT (cuenta_comercial_id, tipo_actor) DO NOTHING;
  END IF;
  PERFORM crear_bodega_vendedor(v_cc, '__cint_s95g2c', 'Quito');
  SELECT count(*) INTO v_n FROM vendedor_bodegas WHERE nombre='__cint_s95g2c';
  IF v_n <> 1 THEN RAISE EXCEPTION 'ABORTA: la función tampoco pudo escribir — se cerró de más.'; END IF;

  DELETE FROM vendedor_bodegas WHERE nombre='__cint_s95g2c';
  DELETE FROM cuenta_roles WHERE metadata->>'fixture'='__cint_s95g2c';

  RAISE NOTICE 'CINTURÓN S95-G2c: cero escrituras directas, la lectura intacta, la función pasa. Residuo 0.';
END $$;

COMMIT;
