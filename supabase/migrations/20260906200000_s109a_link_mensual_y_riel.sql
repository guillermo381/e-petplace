-- ═══════════════════════════════════════════════════════════════════════════
-- S109-A · LA MÁQUINA DEL MES POR LINK, Y EL LECTOR DEL PLAN DE PASEO
--
-- 76(g) VEDA: **NO RIGE.** Tabla nueva vacía + cuatro funciones. Cero backfill.
-- REVERSA: `docs/relevamientos/2026-09-06-s109a-REVERSA-M27.sql`.
--
-- ═══ LA MÁQUINA, firmada entera ════════════════════════════════════════════
-- 🟢 `emitido` → `pagado` (llega el webhook) → o **vence sin pagarse** ⇒ el plan
--    **NO RENUEVA y queda REACTIVABLE** (firma del founder: *ese plan sólo se
--    pausa*, la firma 10 se sostiene sin excepción).
--
-- 🔴 **EL PEDIDO NACE PENDIENTE Y NO OTORGA** — misma ley que el bono. Lo único
--    distinto es la ventana: **no son 15 minutos, es hasta el fin del período ya
--    pagado.** *La familia no está esperando para empezar: ya está siendo
--    servida, y lo que se define es si sigue.*
--
-- 🔴 **EL PERÍODO YA PAGADO NO SE TOCA MIENTRAS TANTO.** El interruptor detiene
--    la RENOVACIÓN, jamás el servicio en curso. Por eso esta tabla **no escribe
--    una sola fila de citas ni mueve un estado de suscripción**: sólo registra
--    si el mes siguiente se pidió y si se pagó.
--
-- ═══ LA FRONTERA CON EL PROVEEDOR, EN UN SOLO LUGAR Y DECLARADA ════════════
-- ⚠️ Lo que **NO se sabe** y el founder está preguntando hoy: la llamada que
--    crea el link en DeUna, cuánto vive, si lleva NUESTRA referencia adentro,
--    qué webhook vuelve, y si se regenera con la misma referencia.
--    ⇒ Todo eso entra por **`url_proveedor` y `referencia_proveedor`**, que
--    nacen NULL, y por **un solo punto de escritura**. *La máquina de estados no
--    los necesita para existir: la respuesta se llena sin tocarla.*
--
-- ⚠️ Y LA TRAMPA QUE NO SE RESUELVE POR SUPOSICIÓN: el aviso de 3 días y el link
--    **pueden no poder viajar juntos**. Si el link vive menos de 3 días, el
--    aviso anuncia y el link sale aparte el día del cobro. ⇒ **son dos actos
--    SEPARABLES**: `emitir_link_mensual` no avisa, y el aviso no emite.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.cobro_link_mensual (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  /* Los dos sujetos recurrentes que pueden ir por link. XOR, como el de pagos:
     un pedido de mes pertenece a UNO. */
  suscripcion_servicio_id  uuid REFERENCES public.suscripciones_servicio(id),
  guarderia_suscripcion_id uuid REFERENCES public.guarderia_suscripciones(id),
  periodo      date NOT NULL,
  estado       text NOT NULL DEFAULT 'emitido',
  monto        numeric(14,2) NOT NULL,
  moneda       text NOT NULL,
  /* 🔴 LA VENTANA ES EL FIN DEL PERÍODO PAGADO, no 15 minutos. */
  vence_en     date NOT NULL,
  emitido_en   timestamptz NOT NULL DEFAULT now(),
  pagado_en    timestamptz,
  /* ⚠️ LA FRONTERA DEL PROVEEDOR — nacen NULL y se llenan cuando conteste. */
  referencia_proveedor text,
  url_proveedor        text,
  CONSTRAINT chk_clm_un_solo_sujeto CHECK (
    ((suscripcion_servicio_id IS NOT NULL)::int + (guarderia_suscripcion_id IS NOT NULL)::int) = 1),
  CONSTRAINT chk_clm_estado CHECK (estado IN ('emitido','pagado','vencido')),
  /* `pagado` ⟺ tiene fecha de pago. Un pedido pagado sin cuándo es un estado
     que no se puede auditar. */
  CONSTRAINT chk_clm_pagado_con_fecha CHECK ((estado = 'pagado') = (pagado_en IS NOT NULL)),
  CONSTRAINT chk_clm_monto CHECK (monto > 0)
);

/* UN pedido por sujeto y período: emitirlo dos veces le pediría plata dos veces
   por el mismo mes. El índice es el piso; la función explica. */
CREATE UNIQUE INDEX IF NOT EXISTS uq_clm_susc_periodo
  ON public.cobro_link_mensual (suscripcion_servicio_id, periodo)
  WHERE suscripcion_servicio_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_clm_guarderia_periodo
  ON public.cobro_link_mensual (guarderia_suscripcion_id, periodo)
  WHERE guarderia_suscripcion_id IS NOT NULL;

ALTER TABLE public.cobro_link_mensual ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cobro_link_mensual_select ON public.cobro_link_mensual;
CREATE POLICY cobro_link_mensual_select ON public.cobro_link_mensual FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM suscripciones_servicio s
             WHERE s.id = cobro_link_mensual.suscripcion_servicio_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM guarderia_suscripciones g
                JOIN familia_miembro fm ON fm.familia_id = g.familia_id
               WHERE g.id = cobro_link_mensual.guarderia_suscripcion_id
                 AND fm.user_id = auth.uid() AND fm.hasta IS NULL)
    OR public.is_admin());
REVOKE ALL ON public.cobro_link_mensual FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.cobro_link_mensual TO authenticated;

-- ── EMITIR — y NO avisa: son dos actos separables ─────────────────────────
CREATE OR REPLACE FUNCTION public.emitir_link_mensual(
  p_sujeto text, p_sujeto_id uuid, p_periodo date
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_monto numeric; v_moneda text; v_vence date; v_riel text; v_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE='42501';
  END IF;
  /* 🔴 LA LLAVE GOBIERNA TAMBIÉN ESTO. Tres actos, un interruptor: cobro por
     tarjeta, emisión del link, aviso de 3 días. Apagada, nada recurrente ocurre
     en ningún riel, en ninguna dirección. */
  IF NOT public.guarderia_recurrente_vivo() THEN
    RETURN jsonb_build_object('ok', false, 'codigo','recurrente_apagado');
  END IF;

  IF p_sujeto = 'suscripcion_servicio' THEN
    SELECT s.precio_mensual, 'USD', s.periodo_fin, s.riel INTO v_monto, v_moneda, v_vence, v_riel
      FROM suscripciones_servicio s WHERE s.id = p_sujeto_id;
  ELSIF p_sujeto = 'mensualidad_guarderia' THEN
    SELECT g.precio_mensual, 'USD', g.periodo_hasta, g.riel INTO v_monto, v_moneda, v_vence, v_riel
      FROM guarderia_suscripciones g WHERE g.id = p_sujeto_id;
  ELSE
    /* Un sujeto que no se sabe emitir GRITA. Con siete en el XOR, un `else`
       que asume es una adivinanza que compila. */
    RAISE EXCEPTION 'sujeto_sin_emisor_de_link: %', p_sujeto USING ERRCODE='22023';
  END IF;

  IF v_monto IS NULL THEN RETURN jsonb_build_object('ok', false, 'codigo','sujeto_no_existe'); END IF;
  IF v_riel IS DISTINCT FROM 'deuna' THEN
    /* 🔴 No se le emite link a un plan de tarjeta: ése cobra solo. Y a uno de
       riel NULL tampoco — nunca autorizó nada. */
    RETURN jsonb_build_object('ok', false, 'codigo','riel_no_emite_link', 'riel', v_riel);
  END IF;
  IF v_vence IS NULL THEN RETURN jsonb_build_object('ok', false, 'codigo','sin_periodo_pagado'); END IF;

  INSERT INTO cobro_link_mensual (suscripcion_servicio_id, guarderia_suscripcion_id,
                                  periodo, monto, moneda, vence_en)
  VALUES (CASE WHEN p_sujeto='suscripcion_servicio' THEN p_sujeto_id END,
          CASE WHEN p_sujeto='mensualidad_guarderia' THEN p_sujeto_id END,
          p_periodo, v_monto, v_moneda, v_vence)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    /* Ya se le pidió por este mes. No es un error: es que no hay que pedir dos
       veces. Se dice, en vez de dejar el `duplicate key` crudo (`L-424`). */
    RETURN jsonb_build_object('ok', true, 'ya_emitido', true, 'periodo', p_periodo);
  END IF;

  /* ⚠️ ACÁ VA LA LLAMADA AL PROVEEDOR — y es el ÚNICO lugar. Hoy la fila nace
     sin `url_proveedor`: la máquina de estados ya funciona sin ella, y el día
     que DeUna conteste se llena acá sin tocar nada más. */
  RETURN jsonb_build_object('ok', true, 'link_id', v_id, 'periodo', p_periodo,
    'monto', v_monto, 'vence_en', v_vence,
    'url_proveedor', NULL,
    'nota', 'pedido registrado — la url del proveedor entra cuando DeUna conteste');
END $fn$;

-- ── PAGADO ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.marcar_link_mensual_pagado(p_link_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_l record;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE='42501';
  END IF;
  SELECT * INTO v_l FROM cobro_link_mensual WHERE id = p_link_id FOR UPDATE;
  IF v_l.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'codigo','link_no_existe'); END IF;
  IF v_l.estado = 'pagado' THEN
    RETURN jsonb_build_object('ok', true, 'duplicado', true, 'link_id', p_link_id);
  END IF;
  IF v_l.estado = 'vencido' THEN
    /* 🔴 PAGO TARDÍO SOBRE UN LINK VENCIDO: se NOMBRA, no se aplica.
       ⚠️ Qué hacer con esa plata **NO ESTÁ FIRMADO** — la mesa preguntó si
       reactivar re-ancla el día y espera respuesta. Hasta entonces esto sólo
       registra que llegó, para que alguien lo mire. */
    RETURN jsonb_build_object('ok', false, 'codigo','pago_tardio_link_vencido',
                              'link_id', p_link_id, 'vencio_el', v_l.vence_en);
  END IF;
  UPDATE cobro_link_mensual SET estado='pagado', pagado_en = now() WHERE id = p_link_id;
  RETURN jsonb_build_object('ok', true, 'link_id', p_link_id, 'periodo', v_l.periodo);
END $fn$;

-- ── VENCE SIN PAGARSE ⇒ EL PLAN NO RENUEVA, Y QUEDA REACTIVABLE ───────────
CREATE OR REPLACE FUNCTION public.vencer_links_mensuales()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_n int := 0; v_p int := 0;
BEGIN
  UPDATE cobro_link_mensual SET estado = 'vencido'
   WHERE estado = 'emitido' AND vence_en < public.hoy_local();
  GET DIAGNOSTICS v_n = ROW_COUNT;

  /* 🔴 EL PLAN NO RENUEVA — y NO SE CANCELA. Firma del founder: *ese plan sólo
     se pausa; queda REACTIVABLE.* Se apaga `auto_renovar`, que es exactamente
     «no renueva», y el estado queda `activa` hasta que su período termine solo.
     *El interruptor detiene la RENOVACIÓN, jamás el servicio en curso: el mes
     ya pagado corre hasta su fin.* */
  UPDATE suscripciones_servicio s SET auto_renovar = false
   WHERE s.auto_renovar
     AND EXISTS (SELECT 1 FROM cobro_link_mensual l
                  WHERE l.suscripcion_servicio_id = s.id AND l.estado = 'vencido');
  GET DIAGNOSTICS v_p = ROW_COUNT;

  RETURN jsonb_build_object('ok', true, 'links_vencidos', v_n, 'planes_sin_renovar', v_p);
END $fn$;

-- ── EL LECTOR DEL PLAN DE PASEO, con su próximo cobro YA CALCULADO ────────
/* 🔴 Pedido del founder: *la fecha no vuelve porque la pantalla encuentre cómo
   calcularla, vuelve porque el motor la empieza a decir.* Y va **resuelta**: el
   dato crudo dejaría a la pantalla a un paso de recalcular la regla. */
CREATE OR REPLACE FUNCTION public.obtener_mis_planes_paseo()
RETURNS TABLE(suscripcion_id uuid, prestador_id uuid, mascota_id uuid,
              precio_mensual numeric, estado text, estado_pago text, riel text,
              periodo_inicio date, periodo_fin date, auto_renovar boolean,
              proximo_cobro date, link_estado text, link_vence_en date)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT s.id, s.prestador_id, s.mascota_id, s.precio_mensual, s.estado, s.estado_pago,
         s.riel, s.periodo_inicio, s.periodo_fin, s.auto_renovar,
         /* NULL honesto: sin cobrar todavía, cancelado, o sin auto-renovación.
            Inventar una fecha para un plan que no va a cobrar es la misma
            mentira, del otro lado. */
         CASE WHEN s.estado = 'activa' AND s.auto_renovar
                   AND s.periodo_inicio IS NOT NULL AND s.dia_de_cobro IS NOT NULL
              THEN public.proximo_cobro_mensual(s.dia_de_cobro, s.periodo_inicio)
              ELSE NULL END,
         l.estado, l.vence_en
    FROM suscripciones_servicio s
    LEFT JOIN LATERAL (
      SELECT cl.estado, cl.vence_en FROM cobro_link_mensual cl
       WHERE cl.suscripcion_servicio_id = s.id ORDER BY cl.periodo DESC LIMIT 1) l ON true
   WHERE s.user_id = auth.uid()
   ORDER BY (s.estado = 'activa') DESC, s.created_at DESC;
END $fn$;

REVOKE EXECUTE ON FUNCTION public.emitir_link_mensual(text,uuid,date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.marcar_link_mensual_pagado(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.vencer_links_mensuales() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.obtener_mis_planes_paseo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_mis_planes_paseo() TO authenticated;

-- ═══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $c$
DECLARE v_s uuid; v_r jsonb; v_n int; v_auto boolean; v_est text;
BEGIN
  -- (a) 🔴 CON LA LLAVE APAGADA NO SE EMITE NADA
  SELECT id INTO v_s FROM guarderia_suscripciones ORDER BY created_at LIMIT 1;
  v_r := public.emitir_link_mensual('mensualidad_guarderia', v_s, public.hoy_local());
  IF v_r->>'codigo' <> 'recurrente_apagado' THEN
    RAISE EXCEPTION 'cinturon: emitio con la llave apagada: %', v_r::text;
  END IF;

  -- con la llave puesta (y el selector declarado, que es lo que la ata)
  UPDATE app_config SET valor='true' WHERE clave='guarderia_recurrente_vivo';
  INSERT INTO app_config (clave,valor) VALUES ('selector_mensualidad_cableado','true')
    ON CONFLICT (clave) DO UPDATE SET valor='true';

  -- (b) 🔴 A UN PLAN DE TARJETA NO SE LE EMITE LINK
  UPDATE guarderia_suscripciones SET riel='tarjeta' WHERE id=v_s AND tarjeta_id IS NOT NULL;
  v_r := public.emitir_link_mensual('mensualidad_guarderia', v_s, public.hoy_local());
  IF v_r->>'codigo' <> 'riel_no_emite_link' THEN
    RAISE EXCEPTION 'cinturon: le emitio link a un plan de TARJETA: %', v_r::text;
  END IF;

  -- (c) un sujeto sin emisor GRITA
  BEGIN
    PERFORM public.emitir_link_mensual('bono', v_s, public.hoy_local());
    RAISE EXCEPTION 'cinturon: emitio link para un sujeto sin emisor';
  EXCEPTION WHEN sqlstate '22023' THEN
    IF SQLERRM NOT LIKE 'sujeto_sin_emisor_de_link%' THEN
      RAISE EXCEPTION 'cinturon: reboto con otra voz: %', SQLERRM;
    END IF;
  END;

  -- (d) 🔴 EL VENCIMIENTO NO RENUEVA Y NO CANCELA — se FABRICA el caso
  SELECT id, auto_renovar INTO v_s, v_auto FROM suscripciones_servicio
   WHERE estado='activa' ORDER BY created_at LIMIT 1;
  IF v_s IS NOT NULL THEN
    UPDATE suscripciones_servicio SET auto_renovar = true WHERE id = v_s;
    INSERT INTO cobro_link_mensual (suscripcion_servicio_id, periodo, monto, moneda, vence_en, estado)
    VALUES (v_s, public.hoy_local(), 50, 'USD', public.hoy_local() - 1, 'emitido');
    PERFORM public.vencer_links_mensuales();
    SELECT auto_renovar, estado INTO v_auto, v_est FROM suscripciones_servicio WHERE id=v_s;
    IF v_auto IS NOT FALSE THEN
      RAISE EXCEPTION 'cinturon: el link vencido NO detuvo la renovacion';
    END IF;
    IF v_est = 'cancelada' THEN
      RAISE EXCEPTION 'cinturon: el link vencido CANCELO el plan — solo se pausa';
    END IF;
  ELSE
    RAISE NOTICE 'cinturon M27: ⚠️ brazo (d) NO EJERCIDO — sin plan activo';
  END IF;

  RAISE NOTICE 'cinturon M27: 4/4 OK (llave apagada no emite · tarjeta no lleva link · sujeto sin emisor grita · el vencido PAUSA y no cancela)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M27: fixture deshecho — la llave vuelve a false, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;
