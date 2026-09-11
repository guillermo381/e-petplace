-- S115-A · TANDA 3 (①) — LOS FEES FIRMADOS, COMO DATO
-- Letra: MODELO_ECONOMICO v1.1 · D-A. Reversa: docs/relevamientos/S115-A-REVERSA-20260912340000-fees-firmados.sql
-- VEDA 76(g): NO RIGE (no hay backfill; los eventos viejos NO se recalculan — §3.2).
--
-- 🔴 EL HALLAZGO QUE ORDENA ESTA MIGRACIÓN: `categoria_origen` ERA LETRA MUERTA.
--    La columna existe, `_resolver_fee_aplicable` la ordena por especificidad desde
--    siempre… **y nadie la manda.** Medido en los diez callers:
--      · `_trg_cita_congela_desglose`, `confirmar_cita_pagada`,
--        `_trg_bono_congela_desglose`, `congelar_desglose_mensualidad_guarderia`
--        pasan `p_categoria_origen => NULL` **literal**;
--      · sólo `crear_evento_economico` reenvía un valor (el suyo);
--      · y cinco más ni siquiera nombran el parámetro.
--    ⇒ Cablear el 12 % de clínicas contra `categoria_origen` HOY sería construir un
--      fee que nadie puede alcanzar: *motor sin puerta* (`L-318`). La puerta se abre
--      en la migración siguiente (①b), que hace que los congeladores manden la
--      categoría real. **Esta migración deja las filas listas y lo DECLARA.**

BEGIN;

-- ── LA COLUMNA NUEVA ────────────────────────────────────────────────────────
ALTER TABLE public.fee_configs
  ADD COLUMN minimo_por_transaccion numeric NOT NULL DEFAULT 0
    CHECK (minimo_por_transaccion >= 0);

COMMENT ON COLUMN public.fee_configs.minimo_por_transaccion IS
  'Piso en la MONEDA de la cuenta. La comisión efectiva es MAX(base × pct, este mínimo). Existe porque el porcentaje NUNCA cubre la parte fija de un ticket chico (3DS, mensajes, factura electrónica) — MODELO_ECONOMICO D-A.';

-- ── LAS VIEJAS SE CIERRAN, NO SE BORRAN ─────────────────────────────────────
/* §3.2: los eventos viejos apuntan a estas filas y siguen diciendo su porcentaje.
   Borrarlas dejaría 61 eventos económicos apuntando a la nada. */
UPDATE public.fee_configs
   SET vigencia_hasta = '2026-10-01 00:00:00-05'::timestamptz,
       notas = COALESCE(notas,'') || ' | S115 (10-sep-2026): cerrada por la firma del modelo economico v1.1 (D-A). No se borra: eventos viejos apuntan aca y siguen diciendo su porcentaje.'
 WHERE country_code = 'EC' AND vigencia_hasta IS NULL
   AND tipo_actor IN ('prestador_servicios','seller_productos');

-- ── LAS NUEVAS, VIGENTES DESDE EL 1-OCT-2026 ────────────────────────────────
/* 🔴 `categoria_origen` NULL en las de CUIDADO **a propósito**: son el DEFAULT del
   vertical. Las cinco puertas de paquete/plan/programa no mandan categoría (medido)
   y todas son de cuidado ⇒ caen acá y aciertan. La excepción —clínicas— va keyeada
   por categoría, y su puerta la abre ①b. */

-- CUIDADO · 18 %, mínimo $1,50 — paseo · grooming · guardería · adiestramiento
INSERT INTO public.fee_configs
  (tipo_actor, country_code, revenue_stream, tipo_origen, categoria_origen,
   tipo_calculo, parametros, minimo_por_transaccion, absorbe_descuento_default,
   prioridad, vigencia_desde, activo, notas)
VALUES
  ('prestador_servicios','EC','transaccional','cita', NULL,'porcentual',
   '{"pct": 18, "base": "subtotal"}'::jsonb, 1.50,'plataforma', 0,
   '2026-10-01 00:00:00-05', true,
   'S115 · MODELO_ECONOMICO v1.1 D-A: cuidado (paseo/grooming/adiestramiento) 18% sobre subtotal, minimo 1,50. Default del vertical: las puertas de paquete y plan no mandan categoria y todas son de cuidado.'),
  ('prestador_servicios','EC','transaccional','estadia', NULL,'porcentual',
   '{"pct": 18, "base": "subtotal"}'::jsonb, 1.50,'plataforma', 0,
   '2026-10-01 00:00:00-05', true,
   'S115 · MODELO_ECONOMICO v1.1 D-A: guarderia 18% sobre subtotal, minimo 1,50.'),

-- CLÍNICAS EN AGENCIA · 12 % + IVA, mínimo $3,00 (consulta) y $2,00 (telemedicina)
/* 🔴 «+IVA» NO es una tasa distinta de comisión: es que la comision de INTERMEDIACION
   es un servicio gravado y Satori le factura al prestador con IVA 15 %. El 12 % es
   la base; el IVA lo agrega el documento, no este porcentaje. */
  ('prestador_servicios','EC','transaccional','cita','veterinario','porcentual',
   '{"pct": 12, "base": "subtotal", "comision_lleva_iva": true, "iva_pct": 15}'::jsonb, 3.00,'plataforma', 10,
   '2026-10-01 00:00:00-05', true,
   'S115 · MODELO_ECONOMICO v1.1 D-A: clinicas en agencia 12% + IVA, minimo 3,00. ⚠️ SU PUERTA la abre 20260912350000 (los congeladores mandan la categoria real): sin eso esta fila NO se alcanza.'),
  ('prestador_servicios','EC','transaccional','cita','telemedicina','porcentual',
   '{"pct": 12, "base": "subtotal", "comision_lleva_iva": true, "iva_pct": 15}'::jsonb, 2.00,'plataforma', 10,
   '2026-10-01 00:00:00-05', true,
   'S115 · MODELO_ECONOMICO v1.1 D-A: telemedicina en agencia 12% + IVA, minimo 2,00. Misma dependencia de puerta que veterinario.'),

-- DESPENSA · 15 %
/* Los dos mínimos ($2,00 alimento / $1,00 resto) se separan por `categoria_origen`.
   El de RESTO va como default del vertical y el de alimento keyeado — al revés que
   en servicios, porque acá la mayoría del catálogo es alimento a 0 % y su mínimo es
   el más alto: *si el default fuera el caro, un accesorio de $3 pagaría $2*. */
  ('seller_productos','EC','transaccional','pedido', NULL,'porcentual',
   '{"pct": 15, "base": "total_con_impuesto"}'::jsonb, 1.00,'plataforma', 0,
   '2026-10-01 00:00:00-05', true,
   'S115 · MODELO_ECONOMICO v1.1 D-A: despensa 15%, minimo 1,00 (resto del catalogo).'),
  ('seller_productos','EC','transaccional','pedido','alimento','porcentual',
   '{"pct": 15, "base": "total_con_impuesto"}'::jsonb, 2.00,'plataforma', 10,
   '2026-10-01 00:00:00-05', true,
   'S115 · MODELO_ECONOMICO v1.1 D-A: despensa alimento 15%, minimo 2,00. ⚠️ Requiere que la puerta del pedido mande categoria_origen=alimento — HOY NO LO HACE (medido). Declarado, no supuesto.');

-- ── EL RESOLVER DEVUELVE TAMBIÉN EL MÍNIMO ──────────────────────────────────
DROP FUNCTION IF EXISTS public._resolver_fee_aplicable(uuid, tipo_actor_enum, text, revenue_stream_enum, text, text, timestamptz);
CREATE OR REPLACE FUNCTION public._resolver_fee_aplicable(
  p_cuenta_comercial_id uuid, p_tipo_actor tipo_actor_enum, p_country_code text,
  p_revenue_stream revenue_stream_enum, p_tipo_origen text,
  p_categoria_origen text DEFAULT NULL, p_fecha_referencia timestamptz DEFAULT now())
RETURNS TABLE(fee_config_id uuid, tipo_calculo tipo_calculo_fee_enum, parametros jsonb,
              absorbe_descuento_default quien_absorbe_descuento_enum, es_default boolean,
              minimo_por_transaccion numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
BEGIN
  RETURN QUERY
  SELECT fc.id, fc.tipo_calculo, fc.parametros, fc.absorbe_descuento_default,
         (fc.cuenta_comercial_id IS NULL), fc.minimo_por_transaccion
  FROM fee_configs fc
  WHERE fc.activo = true
    AND fc.country_code = p_country_code
    AND fc.revenue_stream = p_revenue_stream
    AND p_fecha_referencia >= fc.vigencia_desde
    AND (fc.vigencia_hasta IS NULL OR p_fecha_referencia < fc.vigencia_hasta)
    AND (fc.cuenta_comercial_id = p_cuenta_comercial_id
         OR (fc.cuenta_comercial_id IS NULL AND fc.tipo_actor = p_tipo_actor))
    AND (fc.tipo_origen IS NULL OR fc.tipo_origen = p_tipo_origen)
    AND (fc.categoria_origen IS NULL OR fc.categoria_origen = p_categoria_origen)
  ORDER BY (fc.cuenta_comercial_id IS NOT NULL) DESC,
           (fc.tipo_origen IS NOT NULL) DESC,
           (fc.categoria_origen IS NOT NULL) DESC,
           fc.prioridad DESC, fc.vigencia_desde DESC
  LIMIT 1;
END $fn$;
REVOKE EXECUTE ON FUNCTION public._resolver_fee_aplicable(uuid, tipo_actor_enum, text, revenue_stream_enum, text, text, timestamptz) FROM PUBLIC, anon;

-- La pública espeja la firma nueva (y conserva su gate D-348)
DROP FUNCTION IF EXISTS public.resolver_fee_aplicable(uuid, tipo_actor_enum, text, revenue_stream_enum, text, text, timestamptz);
CREATE OR REPLACE FUNCTION public.resolver_fee_aplicable(
  p_cuenta_comercial_id uuid, p_tipo_actor tipo_actor_enum, p_country_code text,
  p_revenue_stream revenue_stream_enum, p_tipo_origen text,
  p_categoria_origen text DEFAULT NULL, p_fecha_referencia timestamptz DEFAULT now())
RETURNS TABLE(fee_config_id uuid, tipo_calculo tipo_calculo_fee_enum, parametros jsonb,
              absorbe_descuento_default quien_absorbe_descuento_enum, es_default boolean,
              minimo_por_transaccion numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_rol text := coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role','');
BEGIN
  IF v_rol = 'authenticated' THEN
    IF NOT is_admin() AND NOT EXISTS (
      SELECT 1 FROM cuentas_comerciales cc
       WHERE cc.id = p_cuenta_comercial_id AND cc.owner_profile_id = auth.uid()
    ) THEN RAISE EXCEPTION 'cuenta_ajena' USING ERRCODE='42501'; END IF;
  END IF;
  RETURN QUERY SELECT * FROM _resolver_fee_aplicable(
    p_cuenta_comercial_id, p_tipo_actor, p_country_code, p_revenue_stream,
    p_tipo_origen, p_categoria_origen, p_fecha_referencia);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.resolver_fee_aplicable(uuid, tipo_actor_enum, text, revenue_stream_enum, text, text, timestamptz) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.resolver_fee_aplicable(uuid, tipo_actor_enum, text, revenue_stream_enum, text, text, timestamptz) TO authenticated;

-- ── LA COMISIÓN EFECTIVA: MAX(base × pct, mínimo), Y SE DICE CUÁL MANDÓ ─────
CREATE OR REPLACE FUNCTION public.comision_efectiva(p_base numeric, p_pct numeric, p_minimo numeric)
RETURNS jsonb LANGUAGE sql IMMUTABLE
AS $fn$
  SELECT jsonb_build_object(
    'porcentual', round(COALESCE(p_base,0) * COALESCE(p_pct,0) / 100, 2),
    'minimo',     COALESCE(p_minimo, 0),
    'comision',   GREATEST(round(COALESCE(p_base,0) * COALESCE(p_pct,0) / 100, 2), COALESCE(p_minimo,0)),
    /* 🔴 EL SNAPSHOT DICE CUÁL DE LOS DOS MANDÓ. Sin esto, un evento de $1,50
       sobre una base de $8 se lee como «18 % mal calculado» en vez de «el mínimo
       aplicó». *Un número sin su razón obliga a reconstruirla, y se reconstruye mal.* */
    'aplico',     CASE WHEN round(COALESCE(p_base,0) * COALESCE(p_pct,0)/100, 2) >= COALESCE(p_minimo,0)
                       THEN 'porcentual' ELSE 'minimo' END);
$fn$;
REVOKE EXECUTE ON FUNCTION public.comision_efectiva(numeric, numeric, numeric) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.comision_efectiva(numeric, numeric, numeric) TO authenticated;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $$
DECLARE v_nuevas int; v_cerradas int; v_ejemplo jsonb;
BEGIN
  SELECT count(*) INTO v_nuevas FROM public.fee_configs WHERE notas LIKE 'S115%';
  IF v_nuevas <> 6 THEN RAISE EXCEPTION 'cinturon_filas: esperaba 6 nuevas, hay %', v_nuevas; END IF;

  SELECT count(*) INTO v_cerradas FROM public.fee_configs
   WHERE vigencia_hasta = '2026-10-01 00:00:00-05'::timestamptz;
  IF v_cerradas < 3 THEN RAISE EXCEPTION 'cinturon_cierre: solo % cerradas', v_cerradas; END IF;

  /* Discriminador del mínimo: un paseo de $6 al 18 % da $1,08 ⇒ manda el MÍNIMO
     de $1,50. Si diera 'porcentual', el MAX no está haciendo nada. */
  v_ejemplo := public.comision_efectiva(6.00, 18, 1.50);
  IF v_ejemplo->>'aplico' <> 'minimo' OR (v_ejemplo->>'comision')::numeric <> 1.50 THEN
    RAISE EXCEPTION 'cinturon_minimo_mudo: %', v_ejemplo;
  END IF;
  /* Y el contra-caso: sobre $20 manda el porcentaje ($3,60). Sin esto, un mínimo
     que siempre gana también daría verde. */
  v_ejemplo := public.comision_efectiva(20.00, 18, 1.50);
  IF v_ejemplo->>'aplico' <> 'porcentual' OR (v_ejemplo->>'comision')::numeric <> 3.60 THEN
    RAISE EXCEPTION 'cinturon_minimo_muerde_de_mas: %', v_ejemplo;
  END IF;
END $$;

COMMIT;
