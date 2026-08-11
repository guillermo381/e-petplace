-- ═══════════════════════════════════════════════════════════════════
-- REVERSA DE LA MIGRACIÓN 5 · S95-C — la plata
--   supabase/migrations/20260811160000_s95_m5_plata.sql
--
-- 🔴 LO QUE PUEDE Y LO QUE NO:
--
--   ✅ PUEDE devolver la comisión al 14 % y borrar la del 10 % — hoy, porque
--      ningún evento económico la referencia todavía.
--
--   ❌ 🔴 **DEJA DE PODER EN EL MOMENTO EN QUE EL PRIMER EVENTO ECONÓMICO
--      GUARDE `fee_config_id` APUNTANDO A LA FILA DEL 10 %.** Desde ahí,
--      borrarla deja un evento que no puede explicar cómo se calculó — y ésa
--      es exactamente la trazabilidad que `MODELO_FINANCIERO` §3.2 protege.
--      **Con eventos vivos: NO se borra la fila. Se le cierra la vigencia y se
--      reabre la del 14 %, que es lo que la migración hizo al revés.**
--
--   ❌ NO devuelve los intentos de pago ni los webhooks. Si hubo un cobro real,
--      `pagos_eventos` es el único registro crudo de lo que dijo la pasarela.
--
--   ⚠️ La fila de Colombia NUNCA se tocó: esta reversa tampoco la toca.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ─── PARTE 1 · la pasarela ─────────────────────────────────────────────────
DROP TABLE IF EXISTS public.pagos_eventos;
DROP TABLE IF EXISTS public.pagos_intentos;

-- ─── PARTE 2 · la factura ──────────────────────────────────────────────────
ALTER TABLE public.facturas
  DROP COLUMN IF EXISTS moneda,
  DROP COLUMN IF EXISTS emitida_por_tercero,
  DROP COLUMN IF EXISTS cuenta_comercial_id,
  DROP COLUMN IF EXISTS archivo_url;

DROP POLICY IF EXISTS facturas_insert ON public.facturas;
DROP POLICY IF EXISTS facturas_update ON public.facturas;
DROP POLICY IF EXISTS facturas_delete ON public.facturas;
CREATE POLICY facturas_admin ON public.facturas FOR ALL TO authenticated USING (is_admin());

-- ─── PARTE 3 · la puerta del parámetro ─────────────────────────────────────
DROP FUNCTION IF EXISTS public.resolver_comision_despensa(text, timestamptz);

-- ─── PARTE 4 · la comisión ─────────────────────────────────────────────────
ALTER TABLE public.fee_configs DROP CONSTRAINT IF EXISTS chk_fee_pedido_declara_base;

-- 🔴 EL PASO QUE HAY QUE MIRAR ANTES DE EJECUTAR. Si esta consulta devuelve
--    algo, NO se borre la fila: hay eventos económicos que la citan.
--
--    SELECT count(*) FROM eventos_economicos ee
--    JOIN fee_configs fc ON fc.id = ee.fee_config_id
--    WHERE fc.notas LIKE 'S95-C:%';
--
--    Con resultado > 0, reemplazar el DELETE de abajo por:
--      UPDATE fee_configs SET vigencia_hasta = now() WHERE notas LIKE 'S95-C:%';

DELETE FROM fee_configs
 WHERE tipo_actor = 'seller_productos'
   AND country_code = 'EC'
   AND notas LIKE 'S95-C:%';

-- La del 14 % vuelve a estar abierta.
UPDATE fee_configs
   SET vigencia_hasta = NULL,
       notas = replace(notas, ' | S95-C: vigencia cerrada. La despensa pasa a 10% sobre el total con IVA (MODELO_DESPENSA §1.2). No se borra: eventos viejos apuntan acá.', '')
 WHERE tipo_actor = 'seller_productos'
   AND country_code = 'EC';

COMMIT;
