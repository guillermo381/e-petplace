-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A · EL LECTOR DE SALDO DEL PROGRAMA, EN VOCABULARIO DE SESIONES
--
-- 76(g) VEDA: **NO RIGE.** Función nueva de LECTURA. Cero backfill.
-- REVERSA: `docs/relevamientos/2026-09-05-s108a-REVERSA-M21.sql`.
--
-- 🤝 Pedido de **S108-C**, y su razón es el guard mudo: *«adiestramiento no
--    tiene superficie de producto y no existe ningún lector de saldo de
--    sesiones — sin eso, un programa pendiente no se puede decir en ninguna
--    pantalla».*
--
-- 🔴 EL SALDO SE CUENTA POR LAS CITAS QUE EXISTEN, no por un contador. Es la
--    diferencia estructural que hizo al programa sujeto propio: un bono lleva
--    `unidades_usadas`; acá **la sesión 3 es una fila con su número**, y lo que
--    queda es lo que todavía no se agendó o no se dio.
--    *Contarlo con un contador paralelo sería una segunda verdad sobre lo mismo.*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_mis_programas()
RETURNS TABLE(programa_contratado_id uuid, prestador_id uuid, prestador_nombre text,
              mascota_id uuid, sesiones_total int, sesiones_usadas int, sesiones_quedan int,
              precio_total numeric, precio_por_sesion numeric,
              estado text, estado_pago text, no_pagado_a_tiempo boolean,
              vigencia_hasta date, primera_sesion date)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  RETURN QUERY
  SELECT pc.id, pc.prestador_id, pr.nombre_comercial, pc.mascota_id,
         pc.n_sesiones,
         /* USADAS = las sesiones que ya ocurrieron o se dieron por dadas. */
         COALESCE((SELECT count(*)::int FROM evento_cita_servicio c
                    WHERE c.programa_contratado_id = pc.id
                      AND c.estado IN ('completada','no_show')), 0),
         /* QUEDAN = total menos lo consumido. Las canceladas NO consumen: si un
            reverso o una cancelación las mató, esas sesiones no se dieron. */
         GREATEST(pc.n_sesiones - COALESCE((SELECT count(*)::int FROM evento_cita_servicio c
                    WHERE c.programa_contratado_id = pc.id
                      AND c.estado IN ('completada','no_show')), 0), 0),
         pc.precio_total, pc.precio_unitario_efectivo,
         pc.estado, pc.estado_pago,
         /* Murió porque se venció su ventana de PAGO, no por reverso ni por
            vigencia. La marca la deja el barrido; espejo del bono. */
         (pc.pago_metadata ? 'cancelado_por_hold_en'),
         pc.vigencia_hasta, pc.fecha_inicio
    FROM programas_contratados pc
    JOIN prestadores pr ON pr.id = pc.prestador_id
   /* 🔴 SIN FILTRO DE PAGO — la lección del paquete: filtrar acá volvería
      INVISIBLE el programa que la familia intentó comprar y no se cobró.
      *La superficie decide qué contar; el lector no esconde.* */
   WHERE pc.user_id = auth.uid()
   ORDER BY (pc.estado = 'activo') DESC, pc.created_at DESC;
END $fn$;

REVOKE EXECUTE ON FUNCTION public.obtener_mis_programas() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_mis_programas() TO authenticated;

-- ═══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $c$
DECLARE v_pc uuid; v_user uuid; v_r record; v_rol text := current_user;
BEGIN
  /* El caso se FABRICA (aviso de S108-B): un programa PENDIENTE, que es
     exactamente el que el filtro viejo habría escondido. */
  INSERT INTO programas_contratados (programa_id, user_id, mascota_id, prestador_id,
    prestador_servicio_id, n_sesiones, precio_total, precio_unitario_efectivo,
    duracion_minutos, vigencia_hasta, estado, estado_pago, country_code,
    fecha_inicio, hora, pago_expira_en)
  SELECT pc.programa_id, pc.user_id, pc.mascota_id, pc.prestador_id, pc.prestador_servicio_id,
         4, 160, 40, 60, public.hoy_local()+120, 'activo', 'pendiente', 'EC',
         (public.hoy_local()+100)::date, '11:00'::time, now() + interval '15 minutes'
    FROM programas_contratados pc ORDER BY pc.created_at LIMIT 1
  RETURNING id, user_id INTO v_pc, v_user;
  IF v_pc IS NULL THEN RAISE EXCEPTION 'cinturon: sin programa de referencia'; END IF;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user::text, 'role','authenticated')::text, true);
  SELECT * INTO v_r FROM public.obtener_mis_programas() p WHERE p.programa_contratado_id = v_pc;
  PERFORM set_config('request.jwt.claims','',true);

  -- 🔴 EL DISCRIMINADOR: el PENDIENTE aparece. Con el filtro viejo, no.
  IF v_r.programa_contratado_id IS NULL THEN
    RAISE EXCEPTION 'cinturon: el programa PENDIENTE no aparece — sigue invisible';
  END IF;
  IF v_r.estado_pago <> 'pendiente' THEN
    RAISE EXCEPTION 'cinturon: no expone el crudo del pago (%)', v_r.estado_pago;
  END IF;
  IF v_r.sesiones_total <> 4 OR v_r.sesiones_quedan <> 4 OR v_r.sesiones_usadas <> 0 THEN
    RAISE EXCEPTION 'cinturon: el vocabulario de sesiones miente (% / % / %)',
      v_r.sesiones_total, v_r.sesiones_usadas, v_r.sesiones_quedan;
  END IF;

  RAISE NOTICE 'cinturon M21: 3/3 OK (el PENDIENTE aparece · expone el crudo · cuenta sesiones sin contador)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('request.jwt.claims','',true);
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M21: fixture deshecho por subtransaccion, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;
