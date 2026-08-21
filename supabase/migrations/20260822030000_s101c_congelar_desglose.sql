-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ S101-C · EL DESGLOSE SE CONGELA AL RESERVAR                             ║
-- ║ ENTREGADA SIN APLICAR — pide firma.                                     ║
-- ║ Reversa: docs/relevamientos/2026-08-20-s101c-REVERSA-20260822030000.sql ║
-- ║ (escrita ANTES; declara que revertir APAGA el cobro de citas nuevas)    ║
-- ║ Regla 76(g): NO RIGE — trigger nuevo, sin backfill.                     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- Letra: `LETRA_PAGO_CITAS` §2 y §3 — *nace al reservar.*
--
-- ═══ 🔴 POR QUÉ TRIGGER Y NO UNA LLAMADA EN EL PRODUCTOR ═══════════════════
--
-- **Medido: SIETE funciones insertan citas** — `crear_bloqueo_agenda`,
-- `crear_cita_negocio`, `registrar_atencion_mostrador`, `reservar_salida_paquete`,
-- `_agendar_cita_desde_presupuesto`, `_generar_citas_plan`,
-- `_generar_citas_programa`.
--
-- ⇒ Poner la llamada en una **cubre una**. Y la que quede afuera **no falla: nace
--   sin desglose**, y ese defecto no tiene síntoma hasta que alguien intente
--   cobrarla. *La forma más cara de un hueco es la que solo aparece en el
--   momento de cobrar.*
--
-- ⇒ **El trigger cubre las siete a la vez, y cubre la octava** — la que alguien
--   escriba dentro de seis meses sin leer esta letra.
--
-- ⚠️ **Solo congela lo que va a cobrarse por el motor**: `estado_reserva =
--    'pendiente_pago'`. *Una cita de mostrador, que se cobró en el local, no
--    tiene desglose que congelar — y darle uno sería inventar una promesa que
--    nadie hizo.*

CREATE OR REPLACE FUNCTION public._trg_cita_congela_desglose()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_moneda text;
  v_fee    uuid;
BEGIN
  IF NEW.estado_reserva IS DISTINCT FROM 'pendiente_pago' THEN RETURN NEW; END IF;
  IF NEW.precio IS NULL THEN RETURN NEW; END IF;

  /* 🔴 LA MONEDA SE RESUELVE ACÁ Y SE CONGELA. La cita no tiene columna de
     moneda (medido): vive en la cuenta comercial del prestador. *Resolverla
     al cobrar sería volver a preguntar algo que ya estaba decidido cuando la
     familia vio el precio.* */
  SELECT cc.moneda INTO v_moneda
    FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
   WHERE pr.id = NEW.prestador_id;

  /* Sin moneda no se congela nada — y **no se inventa 'USD'**. La cita queda
     sin desglose, y la compuerta 2 del motor la rebota fail-closed diciendo
     que falta. *Un desglose con una moneda supuesta cobra en una moneda que
     nadie eligió.* */
  IF v_moneda IS NULL THEN RETURN NEW; END IF;

  SELECT rfa.fee_config_id INTO v_fee
    FROM prestadores pr
    JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
    CROSS JOIN LATERAL _resolver_fee_aplicable(
      p_cuenta_comercial_id => cc.id,
      p_tipo_actor          => 'prestador_servicios'::tipo_actor_enum,
      p_country_code        => NEW.country_code,
      p_revenue_stream      => 'transaccional'::revenue_stream_enum,
      p_tipo_origen         => 'cita',
      p_categoria_origen    => NULL,
      p_fecha_referencia    => now()
    ) rfa
   WHERE pr.id = NEW.prestador_id;

  /* 🔴 IMPUESTO EN 0 Y DERIVADO, jamás tecleado: hoy los servicios no llevan
     IVA en el catálogo. El día que lo lleven, se deriva del mismo lugar que
     el de la despensa — y este `0` deja de ser correcto por dato, no por
     costumbre. */
  INSERT INTO cita_desglose (cita_id, subtotal, impuesto, total, moneda, fee_config_id)
  VALUES (NEW.id, NEW.precio, 0, NEW.precio, v_moneda, v_fee)
  ON CONFLICT (cita_id) DO NOTHING;  -- se congela UNA vez; no se re-congela

  RETURN NEW;
END $fn$;

CREATE TRIGGER trg_cita_congela_desglose
  AFTER INSERT ON public.evento_cita_servicio
  FOR EACH ROW EXECUTE FUNCTION public._trg_cita_congela_desglose();

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
   WHERE c.relname='evento_cita_servicio' AND t.tgname='trg_cita_congela_desglose';
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: el congelador no quedó atado'; END IF;

  -- El discriminador: que NO invente moneda. Si algún día alguien pone un
  -- default 'USD', esto lo caza.
  IF pg_get_functiondef('public._trg_cita_congela_desglose()'::regprocedure) ILIKE '%''USD''%' THEN
    RAISE EXCEPTION 'CINTURON: el congelador tiene una moneda literal adentro';
  END IF;

  RAISE NOTICE 'cinturon verde: congela al reservar, con la moneda resuelta y sin inventarla';
END $$;
