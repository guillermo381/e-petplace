-- ═══════════════════════════════════════════════════════════════════════════
-- S109-A · EL PLAN DE PASEO GANA MEDIO DE PAGO, ANCLA Y RIEL
--
-- 76(g) VEDA: **NO RIGE.** DDL aditiva + dos funciones nuevas. **Cero backfill**
--   — la única suscripción viva queda como está y su `riel` nace NULL: *no se
--   le inventa un riel a un plan que se contrató cuando no había ninguno.*
-- REVERSA: `docs/relevamientos/2026-09-06-s109a-REVERSA-M23.sql`.
--
-- ═══ LO QUE EL CENSO ENCONTRÓ, y es peor que «le falta una columna» ════════
-- 🔴 `suscripciones_servicio` **no tiene con qué cobrar**: su único campo de
--    medio es `kushki_subscription_id`, del proveedor que la casa ya jubiló.
-- 🔴 Y `cerrar_y_renovar_planes` **NO COBRA — sólo renueva.** Medido sobre el
--    cuerpo sin comentarios: no toca `pagos_intentos`. *El plan de paseo lleva
--    renovándose gratis, y eso no se ve como un defecto porque el servicio se
--    presta igual.*
--
-- ═══ EL RIEL, firmado hoy ══════════════════════════════════════════════════
-- 🟢 *El cobro recurrente va sólo con tarjeta. DeUna no hace recurrencia: se le
--    manda a la familia un link cada mes y paga a mano.*
-- ⇒ La suscripción **sabe con qué riel se contrató**, y el cron ramifica por ahí
--   sin reescribirse: `tarjeta` cobra · `deuna` emite el pedido del mes.
-- 🔴 `riel` es NOT NULL para todo lo nuevo pero **nullable en la tabla**, a
--    propósito: la fila vieja no se rellena. *Ponerle `tarjeta` a un plan que se
--    contrató sin medio sería declarar un hecho que no ocurrió* — y el cron lo
--    tiene que poder distinguir para no cobrarle a alguien que nunca autorizó.
--
-- ⚠️ Y `tarjeta_id` es NULL cuando el riel es `deuna`: ahí no hay tarjeta que
--    guardar. El CHECK lo ata: **tarjeta ⇒ hay tarjeta**, y es inexpresable un
--    plan de tarjeta sin medio.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.suscripciones_servicio
  ADD COLUMN tarjeta_id uuid REFERENCES public.tarjetas_guardadas(id),
  ADD COLUMN riel text,
  ADD COLUMN dia_de_cobro smallint,
  ADD COLUMN pago_expira_en timestamptz;

ALTER TABLE public.suscripciones_servicio
  ADD CONSTRAINT chk_susc_riel_valido CHECK (
    riel IS NULL OR (
      riel IN ('tarjeta','deuna')
      /* 🔴 Un plan de TARJETA sin tarjeta es inexpresable: es lo único que el
         cron necesita para poder cobrar, y descubrirlo el día del cobro sería
         descubrirlo con la familia esperando su paseo. */
      AND (riel <> 'tarjeta' OR tarjeta_id IS NOT NULL)
    ));

ALTER TABLE public.suscripciones_servicio
  ADD CONSTRAINT chk_susc_dia_de_cobro_valido
  CHECK (dia_de_cobro IS NULL OR dia_de_cobro BETWEEN 1 AND 31);

ALTER TABLE public.suscripciones_servicio
  ADD CONSTRAINT chk_susc_hold_solo_si_no_pagado
  CHECK (pago_expira_en IS NULL OR estado_pago = 'pendiente');

COMMENT ON COLUMN public.suscripciones_servicio.riel IS
  'S109-A · `tarjeta` cobra sola cada mes · `deuna` emite un link y la familia '
  'paga a mano. NULL = plan contratado antes de que existiera el riel: el cron '
  'NO puede cobrarle, y esa ignorancia es correcta.';
COMMENT ON COLUMN public.suscripciones_servicio.dia_de_cobro IS
  'S109-A · el dia del mes del PRIMER cobro. Sin el, un febrero baja el dia y no '
  'vuelve nunca. Lo escribe el primer cobro.';

-- ── LA COMPUERTA DEL PLAN — ensaya el acto REAL ───────────────────────────
/* Misma forma que la del programa y la de la mensualidad, por la misma razón:
   `contratar_plan_paseo` genera las citas del período, y ese acto **puede
   fallar después del débito**. *Un freno que sólo actúa cuando la plata ya se
   movió no evita vender lo que no se tiene: obliga a devolverlo.* */
CREATE OR REPLACE FUNCTION public.verificar_compuerta_plan(p_suscripcion_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_s record; v_n int;
BEGIN
  SELECT * INTO v_s FROM suscripciones_servicio WHERE id = p_suscripcion_id;
  IF v_s.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'codigo','plan_no_existe'); END IF;
  IF v_s.periodo_inicio IS NULL OR v_s.periodo_fin IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo','plan_sin_periodo');
  END IF;
  BEGIN
    v_n := _generar_citas_plan(v_s.id, v_s.periodo_inicio, v_s.periodo_fin, now());
    IF v_n < 1 THEN RAISE EXCEPTION '__ENSAYO__:sin_dias_en_el_periodo'; END IF;
    RAISE EXCEPTION '__ENSAYO_OK__:%', v_n;
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '__ENSAYO_OK__:%' THEN
        RETURN jsonb_build_object('ok', true,
          'citas', replace(SQLERRM,'__ENSAYO_OK__:','')::int);
      END IF;
      RETURN jsonb_build_object('ok', false, 'codigo','citas_no_agendables',
                                'causa', replace(SQLERRM,'__ENSAYO__:',''));
  END;
END $fn$;

REVOKE EXECUTE ON FUNCTION public.verificar_compuerta_plan(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verificar_compuerta_plan(uuid) TO authenticated;

-- ── LA CONFIRMACIÓN: acá nacen las citas del período ──────────────────────
CREATE OR REPLACE FUNCTION public.confirmar_pago_plan_paseo(p_suscripcion_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_s record; v_n int; v_dia smallint;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE='42501';
  END IF;
  SELECT * INTO v_s FROM suscripciones_servicio WHERE id = p_suscripcion_id FOR UPDATE;
  IF v_s.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'codigo','plan_no_existe'); END IF;
  IF v_s.estado_pago = 'pagado' THEN
    RETURN jsonb_build_object('ok', true, 'duplicado', true, 'suscripcion_id', p_suscripcion_id);
  END IF;
  IF v_s.estado_pago <> 'pendiente' THEN
    RETURN jsonb_build_object('ok', false, 'codigo','estado_pago_inesperado','estado_pago', v_s.estado_pago);
  END IF;
  IF v_s.estado = 'cancelada' THEN
    RETURN jsonb_build_object('ok', false, 'codigo','pago_tardio_plan_cancelado');
  END IF;

  /* El día original se fija en el PRIMER cobro y no se vuelve a tocar. */
  v_dia := COALESCE(v_s.dia_de_cobro, EXTRACT(day FROM v_s.periodo_inicio)::smallint);

  UPDATE suscripciones_servicio
     SET estado_pago = 'pagado', estado = 'activa', pago_expira_en = NULL,
         dia_de_cobro = v_dia, activado_en = COALESCE(activado_en, now()),
         pago_metadata = COALESCE(pago_metadata,'{}'::jsonb) || jsonb_build_object('pagado_en', now())
   WHERE id = p_suscripcion_id;

  v_n := _generar_citas_plan(v_s.id, v_s.periodo_inicio, v_s.periodo_fin, now());
  IF v_n < 1 THEN
    RAISE EXCEPTION 'plan_sin_citas: el periodo no genero ninguna' USING ERRCODE='22023';
  END IF;

  RETURN jsonb_build_object('ok', true, 'suscripcion_id', p_suscripcion_id,
    'citas', v_n, 'periodo_inicio', v_s.periodo_inicio, 'periodo_fin', v_s.periodo_fin,
    'dia_de_cobro', v_dia, 'riel', v_s.riel);
END $fn$;

REVOKE EXECUTE ON FUNCTION public.confirmar_pago_plan_paseo(uuid) FROM PUBLIC, anon, authenticated;

-- ═══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $c$
DECLARE v_n int;
BEGIN
  -- (a) 🔴 UN PLAN DE TARJETA SIN TARJETA ES INEXPRESABLE — rojo producido
  BEGIN
    UPDATE suscripciones_servicio SET riel='tarjeta', tarjeta_id=NULL
     WHERE id = (SELECT id FROM suscripciones_servicio ORDER BY created_at LIMIT 1);
    RAISE EXCEPTION 'cinturon: entro un plan de TARJETA sin tarjeta';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- (b) un riel inventado tampoco entra
  BEGIN
    UPDATE suscripciones_servicio SET riel='paypal'
     WHERE id = (SELECT id FROM suscripciones_servicio ORDER BY created_at LIMIT 1);
    RAISE EXCEPTION 'cinturon: entro un riel que no existe';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- (c) 🔴 LA FILA VIEJA NO SE RELLENÓ: su riel sigue NULL, y eso es correcto
  SELECT count(*) INTO v_n FROM suscripciones_servicio WHERE riel IS NOT NULL;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'cinturon: se le invento riel a % plan(es) viejo(s) — cero backfill', v_n;
  END IF;

  -- (d) el hold es inexpresable sobre lo pagado
  BEGIN
    UPDATE suscripciones_servicio SET pago_expira_en = now()
     WHERE estado_pago='pagado' AND id = (SELECT id FROM suscripciones_servicio
                                           WHERE estado_pago='pagado' ORDER BY created_at LIMIT 1);
    IF FOUND THEN RAISE EXCEPTION 'cinturon: un plan PAGADO acepto ventana de pago viva'; END IF;
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  RAISE NOTICE 'cinturon M23: 4/4 OK (tarjeta sin tarjeta inexpresable · riel inventado rebota · cero backfill del viejo · hold solo sobre lo no pagado)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M23: fixture deshecho por subtransaccion, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;
