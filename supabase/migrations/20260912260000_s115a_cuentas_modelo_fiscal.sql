-- S115-A · TANDA 1 (f) — LA CUENTA DECLARA SU RÉGIMEN, Y EL MODELO BASE ES REVENTA
-- Letra: MODELO_FISCAL v0.3 §6 · v0.4 E1 (el modelo es DATO por cuenta, no ley de plataforma).
-- Reversa: docs/relevamientos/S115-A-REVERSA-20260912260000-cuentas-modelo.sql
-- VEDA 76(g): NO RIGE.

BEGIN;

CREATE TYPE public.regimen_tributario_enum AS ENUM
  ('general', 'rimpe_emprendedor', 'rimpe_negocio_popular');
CREATE TYPE public.tipo_comprobante_enum AS ENUM
  ('factura_electronica', 'nota_venta', 'ninguno');

ALTER TABLE public.cuentas_comerciales
  ADD COLUMN regimen_tributario     public.regimen_tributario_enum,
  ADD COLUMN tipo_comprobante_emite public.tipo_comprobante_enum,
  ADD COLUMN verificado_emisor_en   timestamptz;

/* 🔴 NACEN NULL A PROPÓSITO, y no es un olvido. El régimen de un proveedor **no se
   deriva de nada que tengamos**: se lee de su RUC. Sembrar «general» a las 15
   sería el mismo default cómodo que `profiles.tipo_identificacion` acaba de perder
   en (b). *Lo que no se sabe queda NULL y se dice* — y §6 de la letra pide
   RELEVAR la cohorte antes del 1-oct, que es un acto del founder, no una migración. */
COMMENT ON COLUMN public.cuentas_comerciales.regimen_tributario IS
  'NULL = no relevado. Se lee del RUC del proveedor (§6). Decide con qué documento le factura a Satori y si su IVA da crédito.';
COMMENT ON COLUMN public.cuentas_comerciales.verificado_emisor_en IS
  'Cuándo se verificó contra «Validez de emisor» del SRI. NULL = nunca.';

-- ── EL MODELO BASE PASA A SER REVENTA ───────────────────────────────────────
ALTER TABLE public.cuentas_comerciales
  ALTER COLUMN modelo_comercial SET DEFAULT 'reventa_pura';

/* 🔴 EL REASIENTO SE DERIVA DE LO QUE LA CUENTA **OFRECE**, jamás de su nombre.
   v0.4 E1: en fachada quedan las CLÍNICAS VETERINARIAS; el resto pasa a reventa.
   El único criterio medible de «es una clínica» que la casa tiene es que ofrezca
   servicios `es_medico`. Usar el nombre comercial sería adivinar — y hay cuentas
   llamadas «Clinica S97 (borrable)» y «Dueño todos los servicios» que sólo el dato
   distingue. Las 15 son de prueba (firma del founder), así que el reasiento es
   reversible y no toca plata viva. */
DO $$
DECLARE v_antes_fachada int; v_fachada int; v_reventa int; v_nombres text;
BEGIN
  SELECT count(*) INTO v_antes_fachada FROM public.cuentas_comerciales
   WHERE modelo_comercial = 'marketplace_fachada';
  IF v_antes_fachada <> 15 THEN
    RAISE EXCEPTION 'cinturon_estado_inicial: esperaba 15 en fachada, hay %', v_antes_fachada;
  END IF;

  UPDATE public.cuentas_comerciales cc
     SET modelo_comercial = 'reventa_pura'
   WHERE NOT EXISTS (
     SELECT 1 FROM public.prestadores pr
      JOIN public.prestador_servicios ps ON ps.prestador_id = pr.id
      JOIN public.tipos_servicio ts ON ts.codigo = ps.tipo_servicio
     WHERE pr.cuenta_comercial_id = cc.id AND ts.es_medico
   );

  SELECT count(*) FILTER (WHERE modelo_comercial='marketplace_fachada'),
         count(*) FILTER (WHERE modelo_comercial='reventa_pura')
    INTO v_fachada, v_reventa FROM public.cuentas_comerciales;

  SELECT string_agg(nombre_comercial, ' · ' ORDER BY nombre_comercial) INTO v_nombres
    FROM public.cuentas_comerciales WHERE modelo_comercial='marketplace_fachada';

  RAISE NOTICE 'modelo: fachada % -> % · reventa 0 -> % · en fachada quedan: %',
    v_antes_fachada, v_fachada, v_reventa, v_nombres;

  IF v_fachada + v_reventa <> 15 THEN
    RAISE EXCEPTION 'cinturon_reasiento: % + % <> 15', v_fachada, v_reventa;
  END IF;
  /* Discriminador: si TODAS quedaran en un lado, el predicado no discriminó y el
     reasiento no significó nada. */
  IF v_fachada = 0 OR v_reventa = 0 THEN
    RAISE EXCEPTION 'cinturon_no_discrimina: fachada=% reventa=% — el criterio no separó', v_fachada, v_reventa;
  END IF;
END $$;

COMMIT;
