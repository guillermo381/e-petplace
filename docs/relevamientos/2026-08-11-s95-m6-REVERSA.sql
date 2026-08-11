-- ═══════════════════════════════════════════════════════════════════
-- REVERSA DE LA MIGRACIÓN 6 · S95-C — la logística
--   supabase/migrations/20260811170000_s95_m6_logistica.sql
--
-- 🔴 LO QUE PUEDE Y LO QUE NO:
--
--   ✅ PUEDE devolver la estructura entera: las columnas nuevas de `envios`,
--      `devoluciones` y `zonas_cobertura`, el CHECK del transportista, las
--      policies viejas y las 20 zonas a `activo = true`.
--
--   ⚠️ **PERO REVERTIR EL APAGADO DE LAS ZONAS ES LO PELIGROSO DE ESTE
--      ARCHIVO.** Las 20 tarifas son del prototipo del 2-may-2026 y NADIE las
--      verificó contra un transportista real. Encenderlas devuelve el estado
--      en que alguien puede cotizar un envío con números inventados.
--      **Si se revierte esta migración, D-754 vuelve a estar viva Y sin
--      barrera.**
--
--   ❌ NO devuelve los envíos ni los eventos de tracking si hubo despachos
--      reales: esta reversa toca estructura, no datos de operación.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ─── zonas_cobertura ───────────────────────────────────────────────────────
ALTER TABLE public.zonas_cobertura DROP CONSTRAINT IF EXISTS chk_zona_activa_verificada;

-- ⚠️ ACÁ SE REENCIENDEN 19 TARIFAS NO VERIFICADAS. Leer la advertencia de
--    arriba antes de ejecutar.
UPDATE public.zonas_cobertura SET activo = true WHERE ciudad <> 'Loja';
UPDATE public.zonas_cobertura SET activo = false WHERE ciudad = 'Loja';

ALTER TABLE public.zonas_cobertura
  DROP COLUMN IF EXISTS moneda,
  DROP COLUMN IF EXISTS verificada_en,
  DROP COLUMN IF EXISTS verificada_por,
  DROP COLUMN IF EXISTS notas;

-- ─── devoluciones ──────────────────────────────────────────────────────────
ALTER TABLE public.devoluciones DROP COLUMN IF EXISTS moneda;

-- ─── envios ────────────────────────────────────────────────────────────────
ALTER TABLE public.envios DROP CONSTRAINT IF EXISTS chk_envio_retiro_apagado_v1;
ALTER TABLE public.envios DROP CONSTRAINT IF EXISTS envios_transportista_fkey;
ALTER TABLE public.envios ADD CONSTRAINT envios_transportista_check
  CHECK (transportista = ANY (ARRAY['picap'::text,'borzo'::text,'servientrega'::text,
                                    'laar'::text,'tramaco'::text,'propio'::text,'otro'::text]));

ALTER TABLE public.envios
  DROP COLUMN IF EXISTS cuenta_comercial_id,
  DROP COLUMN IF EXISTS bodega_id,
  DROP COLUMN IF EXISTS moneda,
  DROP COLUMN IF EXISTS metodo,
  DROP COLUMN IF EXISTS promesa_entrega_desde,
  DROP COLUMN IF EXISTS promesa_entrega_hasta,
  DROP COLUMN IF EXISTS zona_cobertura_id,
  ADD COLUMN seller_id uuid REFERENCES public.profiles(id);

DROP TABLE IF EXISTS public.cat_transportistas;

-- ─── policies viejas ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS envios_select        ON public.envios;
DROP POLICY IF EXISTS envios_insert        ON public.envios;
DROP POLICY IF EXISTS envios_update        ON public.envios;
DROP POLICY IF EXISTS envios_delete        ON public.envios;
DROP POLICY IF EXISTS envio_eventos_select ON public.envio_eventos;
DROP POLICY IF EXISTS envio_eventos_insert ON public.envio_eventos;
DROP POLICY IF EXISTS devoluciones_select  ON public.devoluciones;
DROP POLICY IF EXISTS devoluciones_insert  ON public.devoluciones;
DROP POLICY IF EXISTS devoluciones_update  ON public.devoluciones;
DROP POLICY IF EXISTS devoluciones_delete  ON public.devoluciones;
DROP POLICY IF EXISTS zonas_select         ON public.zonas_cobertura;
DROP POLICY IF EXISTS zonas_insert         ON public.zonas_cobertura;
DROP POLICY IF EXISTS zonas_update         ON public.zonas_cobertura;
DROP POLICY IF EXISTS zonas_delete         ON public.zonas_cobertura;

CREATE POLICY envios_admin ON public.envios FOR ALL TO authenticated USING (is_admin());
CREATE POLICY envios_owner ON public.envios FOR SELECT TO authenticated
  USING (pedido_id IN (SELECT pedidos.id FROM pedidos WHERE pedidos.user_id = auth.uid()));
CREATE POLICY eventos_admin ON public.envio_eventos FOR ALL TO authenticated USING (is_admin());
CREATE POLICY eventos_owner ON public.envio_eventos FOR SELECT TO authenticated
  USING (envio_id IN (SELECT e.id FROM envios e JOIN pedidos p ON p.id = e.pedido_id
                       WHERE p.user_id = auth.uid()));
CREATE POLICY devoluciones_admin ON public.devoluciones FOR ALL TO authenticated USING (is_admin());
CREATE POLICY devoluciones_owner ON public.devoluciones FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY zonas_admin ON public.zonas_cobertura FOR ALL TO authenticated USING (is_admin());
CREATE POLICY zonas_read  ON public.zonas_cobertura FOR SELECT TO authenticated USING (activo = true);

COMMIT;
