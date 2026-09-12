-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LA TASA ES PARTE DEL PRECIO CONGELADO (`D-1071`)
--
-- 🔴 EL DEFECTO, encontrado por el founder COMPRANDO: la mitad del catálogo de
--    servicios no se podía cobrar. `pagos-cobro` exige que alguna línea declare
--    su tasa nominal y `cita_desglose` guardaba `subtotal/impuesto/total/moneda`
--    y **ningún código** ⇒ todo lo gravado rebotaba `iva_sin_tasa_declarada`.
--
--    Medido: **15 de 30 tipos activos son `EC_IVA_15`** —paseo, grooming,
--    guardería, hotel, adiestramiento— y **ninguno podía cobrar**. Los 15 que
--    sí cobraban son los exentos, lo clínico. *La despensa funcionaba porque
--    sus líneas salen de `pedido_items`, que sí traen `impuesto_pct`.*
--
-- 🔴 Y LO QUE LO VUELVE BARATO DE CURAR ES LO QUE LO VUELVE FEO: el trigger
--    **ya resolvía `v_cod_iva` y `v_pct`** —los usa para calcular el impuesto—
--    **y los descartaba**. El dato estaba a una línea de distancia.
--
-- 🔴 SE CONGELA, NO SE RESUELVE AL COBRAR (firma del founder, 11-sep-2026):
--    *una tasa resuelta al cobrar cambia bajo los pies y produce un comprobante
--    que no cuadra con lo que la familia aceptó.* Va junto al precio, en el
--    mismo acto, como `pedido_items`.
--
-- 🔴 EL GUARD NO SE AFLOJA. Sin tasa declarada sigue sin cobrar: lo que se cura
--    es que la tasa LLEGUE. *Aflojar el guard habría hecho pasar el mismo
--    comprobante sin tasa, que es el defecto con otra cara.*
--
-- EDGES A DESPLEGAR CON ESTA MIGRACIÓN (`L-536`): **pagos-cobro**.
-- Veda 76(g): RIGE — hay backfill. Reversa: S115-A-REVERSA-20260912730000-*.sql
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.cita_desglose
  ADD COLUMN IF NOT EXISTS codigo_iva  text,
  ADD COLUMN IF NOT EXISTS tarifa_pct  numeric(5,2);

COMMENT ON COLUMN public.cita_desglose.tarifa_pct IS
  'La tarifa NOMINAL vigente a la fecha del SERVICIO, congelada con el precio. '
  'No se recalcula al cobrar: la tasa es parte de lo que la familia aceptó.';

CREATE OR REPLACE FUNCTION public._trg_cita_congela_desglose()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_moneda text; v_fee uuid; v_cat text; v_cod_iva text; v_pct numeric;
  v_base numeric; v_iva numeric; v_ref timestamptz;
BEGIN
  IF NEW.estado_reserva IS DISTINCT FROM 'pendiente_pago' THEN RETURN NEW; END IF;
  IF NEW.precio IS NULL THEN RETURN NEW; END IF;

  SELECT cc.moneda INTO v_moneda
    FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
   WHERE pr.id = NEW.prestador_id;
  IF v_moneda IS NULL THEN RETURN NEW; END IF;

  /* 🔴 LA FECHA DEL SERVICIO, no now(). Mediodía para no rozar el borde. */
  v_ref := NEW.fecha::timestamptz + interval '12 hours';

  SELECT ts.categoria, ts.codigo_iva, ct.pct INTO v_cat, v_cod_iva, v_pct
    FROM tipos_servicio ts
    LEFT JOIN cat_tasas_impuesto ct ON ct.codigo = ts.codigo_iva AND ct.activo
     AND ct.vigencia_desde <= v_ref AND (ct.vigencia_hasta IS NULL OR ct.vigencia_hasta > v_ref)
   WHERE ts.codigo = NEW.tipo_servicio;
  IF v_cod_iva IS NULL OR v_pct IS NULL THEN RETURN NEW; END IF;

  SELECT rfa.fee_config_id INTO v_fee
    FROM prestadores pr
    JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
    CROSS JOIN LATERAL _resolver_fee_aplicable(
      cc.id, 'prestador_servicios'::tipo_actor_enum, NEW.country_code,
      'transaccional'::revenue_stream_enum,
      CASE WHEN v_cat = 'hospedaje' THEN 'estadia' ELSE 'cita' END,
      v_cat, v_ref) rfa
   WHERE pr.id = NEW.prestador_id;

  v_base := round(NEW.precio, 2);
  v_iva  := round(v_base * v_pct / 100, 2);

  /* 🔴 RE-CONGELA AL REAGENDAR, y sólo mientras NO esté pagada (voto de la mesa: el fee
     es el de la fecha en que el servicio ocurre). Una vez pagada, el desglose es un
     hecho: *re-precificar algo que la familia ya pagó es cambiarle el precio después
     de cobrarle.* El guard es el propio `estado_reserva` de arriba. */
  INSERT INTO cita_desglose (cita_id, subtotal, impuesto, total, moneda, fee_config_id, codigo_iva, tarifa_pct)
  VALUES (NEW.id, v_base, v_iva, v_base + v_iva, v_moneda, v_fee, v_cod_iva, v_pct)
  ON CONFLICT (cita_id) DO UPDATE
    SET subtotal = EXCLUDED.subtotal, impuesto = EXCLUDED.impuesto,
        total = EXCLUDED.total, fee_config_id = EXCLUDED.fee_config_id;

  RETURN NEW;
END $function$
;

-- ── BACKFILL, con su conteo antes y después ────────────────────────────────
DO $bf$
DECLARE v_antes int; v_despues int; v_total int;
BEGIN
  SELECT count(*) INTO v_total  FROM public.cita_desglose;
  SELECT count(*) INTO v_antes  FROM public.cita_desglose WHERE tarifa_pct IS NOT NULL;

  /* 🔴 LA TASA DE LA FECHA DEL SERVICIO, no la de hoy — el mismo criterio que
     el trigger. *Backfillear con la tarifa actual reescribiría el pasado con
     un número que en su momento no era el que regía.* */
  UPDATE public.cita_desglose d
     SET codigo_iva = ts.codigo_iva, tarifa_pct = ct.pct
    FROM public.evento_cita_servicio c
    JOIN public.tipos_servicio ts ON ts.codigo = c.tipo_servicio
    JOIN public.cat_tasas_impuesto ct ON ct.codigo = ts.codigo_iva AND ct.activo
     AND ct.vigencia_desde <= (c.fecha::timestamptz + interval '12 hours')
     AND (ct.vigencia_hasta IS NULL OR ct.vigencia_hasta > (c.fecha::timestamptz + interval '12 hours'))
   WHERE d.cita_id = c.id AND d.tarifa_pct IS NULL;

  SELECT count(*) INTO v_despues FROM public.cita_desglose WHERE tarifa_pct IS NOT NULL;
  RAISE NOTICE 'backfill cita_desglose: % de % tenian tasa -> ahora % (+%)',
    v_antes, v_total, v_despues, v_despues - v_antes;

  /* 🔴 LOS QUE QUEDEN SIN TASA SE DECLARAN, no se rellenan. Un desglose cuya
     cita ya no existe, o cuyo tipo salió del catálogo, NO puede inventar una
     tarifa: sigue rebotando en el cobro, que es lo correcto. */
  IF v_despues < v_total THEN
    RAISE NOTICE 'quedan % desglose(s) SIN tasa: su cita o su tipo ya no resuelven. Siguen fail-closed.',
      v_total - v_despues;
  END IF;
END $bf$;

-- ── CINTURÓN · LOS DOS BRAZOS ──────────────────────────────────────────────
DO $cint$
DECLARE v_con int; v_sin int; v_gravados int; v_cubiertos int;
BEGIN
  /* BRAZO 1 · VERDE — un paseo al 15 % ahora declara su tasa. Es el caso REAL
     de hoy: el founder rebotó sobre `paseo` a $11,50. */
  SELECT count(*) INTO v_con FROM public.cita_desglose d
    JOIN public.evento_cita_servicio c ON c.id = d.cita_id
   WHERE c.tipo_servicio LIKE 'paseo%' AND d.tarifa_pct = 15;
  IF v_con = 0 THEN
    RAISE EXCEPTION 'cinturon BRAZO 1: ningun paseo al 15%% quedo con su tasa';
  END IF;

  /* 🔴 BRAZO 2 · ROJO — un desglose SIN tasa tiene que seguir sin poder cobrar.
     *Sin este brazo, aflojar el guard daria verde:* el brazo 1 pasaria igual y
     nadie notaria que la defensa se fue. Se prueba que la columna ADMITE nulo y
     que el guard del cobro sigue exigiendola (el guard vive en la edge, asi que
     aca se verifica su PRECONDICION: que el nulo sea expresable). */
  SELECT count(*) INTO v_sin FROM public.cita_desglose WHERE tarifa_pct IS NULL;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='cita_desglose'
                    AND column_name='tarifa_pct' AND is_nullable='YES') THEN
    RAISE EXCEPTION 'cinturon BRAZO 2: tarifa_pct quedo NOT NULL — un desglose sin tasa deberia poder existir y rebotar, no ser inexpresable';
  END IF;

  /* 🔴 EL CONTROL QUE ESTE DEFECTO PIDE (founder): que TODOS los tipos activos
     puedan cobrarse, no solo los exentos. *Hoy pasaban 15 de 30 y lo destapo el
     founder comprando, no un gate.* */
  SELECT count(*) INTO v_gravados FROM public.tipos_servicio ts
    JOIN public.cat_tasas_impuesto ct ON ct.codigo = ts.codigo_iva AND ct.activo
   WHERE ts.activo AND ct.pct > 0;
  SELECT count(*) INTO v_cubiertos FROM public.tipos_servicio ts
    JOIN public.cat_tasas_impuesto ct ON ct.codigo = ts.codigo_iva AND ct.activo
   WHERE ts.activo AND ct.pct > 0 AND ts.codigo_iva IS NOT NULL;
  IF v_cubiertos <> v_gravados THEN
    RAISE EXCEPTION 'cinturon CONTROL: % de % tipos gravados no resuelven su tasa',
      v_gravados - v_cubiertos, v_gravados;
  END IF;

  RAISE NOTICE 'cinturon tasa: brazo1 % paseo(s) al 15%% con tasa · brazo2 el nulo sigue expresable (% sin tasa) · control %/% tipos gravados resuelven',
    v_con, v_sin, v_cubiertos, v_gravados;
END $cint$;
