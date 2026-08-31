-- ═══════════════════════════════════════════════════════════════════════════
-- S109-A · LA VENTANA DEL PROGRAMA VIAJA · EL HUECO DEL BARRIDO SE DECLARA ·
--          Y EL LINK VENCIDO CIERRA SU INTENTO
--
-- 76(g) VEDA: **NO RIGE.** Un DROP+CREATE de lector, un reemplazo, un lector
--   nuevo y un COMMENT. **Cero backfill.**
-- REVERSA: `docs/relevamientos/2026-09-07-s109a-REVERSA-M30.sql`.
-- L-119: `obtener_mis_programas` CAMBIA su firma ⇒ **DROP explícito**.
-- L-442: la firma GANA una columna. *Agregar una clave es seguro; quitarla es
--   lo que rompe validadores.* Aun así el wrapper se actualiza EN EL MISMO
--   ARCO y se declara al publicar — que es la mitad que la lección prescribe.
--
-- ═══ ① LA VENTANA DEL PROGRAMA — pedido de S109-C ══════════════════════════
-- El programa nace `pendiente` con `pago_expira_en`, igual que el bono, y el
-- lector **no lo proyectaba** ⇒ la tarjeta del programa queda coja frente a sus
-- dos hermanas. *Sin ventana declarada la pantalla no puede decir cuánto falta,
-- y lo único peor que no decirlo es inventar un reloj.*
--
-- ═══ ② EL HUECO DEL BARRIDO, DECLARADO EN VEZ DE SILENCIOSO ════════════════
-- 🔴 `pagos_pendientes_de_conciliar` mira **intentos NO terminales**. Un intento
--    `aprobado` cuyo sujeto no se movió **es terminal**, así que el barrido pasa
--    de largo — *y hasta hoy pasaba de largo en silencio.*
--    ⇒ Nace `pagos_conciliacion_cobertura()`, que devuelve **lo que el barrido
--    levanta Y lo que queda fuera de su alcance, uno al lado del otro**, y el
--    barrido gana un `COMMENT` que lo dice y nombra al lector que sí los ve.
--    *Un hueco declarado se puede mirar; uno silencioso no.* Y se declara
--    **consultable**, no en prosa: una nota la lee quien abre el archivo, una
--    función la puede leer cualquiera que pregunte.
--    ⚠️ **No cura ni compensa: NOMBRA.** El caso «acto 2 falló» necesita una
--    persona, y lo que faltaba era que una persona pudiera encontrarlo.
--
-- ═══ ③ EL LINK VENCIDO TIENE QUE CERRAR SU INTENTO ═════════════════════════
-- 🔴 Lo destapó la medición que el founder pidió antes de forkear. **Medido:**
--    · **NINGUNA función vence intentos por antigüedad** — la ventana de 15
--      minutos **no vive en `pagos_intentos`: vive en el SUJETO**
--      (`bonos.pago_expira_en` y su CHECK). El intento no tiene reloj propio.
--    · El vocabulario de `estado` **ya tiene `expirado`** ⇒ un intento de vida
--      larga que muere tiene estado legal **sin ensanchar nada**.
--    · `pagos_intentos.codigo_expira_en` ya existe: **el modelo YA lleva un
--      vencimiento por instrumento que no es el hold de 15 minutos.**
--    ⇒ **El modelo de intento TOLERA la ventana larga** y no hay que forkear.
--      La ventana vive en `cobro_link_mensual.vence_en` y su reloj es
--      `vencer_links_mensuales`.
--    🔴 **Pero faltaba media vuelta:** al vencer el link, su intento quedaba
--      `iniciado` **para siempre** ⇒ el barrido lo tomaría como no-terminal y
--      seguiría preguntándole al proveedor por un link que nadie va a pagar.
--      *Un intento inmortal es basura que el barrido persigue.* Acá se cierra.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ① ───────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.obtener_mis_programas();

CREATE FUNCTION public.obtener_mis_programas()
RETURNS TABLE(programa_contratado_id uuid, prestador_id uuid, prestador_nombre text,
              mascota_id uuid, sesiones_total integer, sesiones_usadas integer,
              sesiones_quedan integer, precio_total numeric, precio_por_sesion numeric,
              estado text, estado_pago text, no_pagado_a_tiempo boolean,
              vigencia_hasta date, primera_sesion date,
              pago_expira_en timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  RETURN QUERY
  SELECT pc.id, pc.prestador_id, pr.nombre_comercial, pc.mascota_id,
         pc.n_sesiones,
         COALESCE((SELECT count(*)::int FROM evento_cita_servicio c
                    WHERE c.programa_contratado_id = pc.id
                      AND c.estado IN ('completada','no_show')), 0),
         GREATEST(pc.n_sesiones - COALESCE((SELECT count(*)::int FROM evento_cita_servicio c
                    WHERE c.programa_contratado_id = pc.id
                      AND c.estado IN ('completada','no_show')), 0), 0),
         pc.precio_total, pc.precio_unitario_efectivo,
         pc.estado, pc.estado_pago,
         (pc.pago_metadata ? 'cancelado_por_hold_en'),
         pc.vigencia_hasta, pc.fecha_inicio,
         /* 🔴 LA VENTANA, TAL CUAL ESTÁ EN LA FILA. El lector NO la interpreta
            ni la compara contra `now()`: *quien pinta el reloj decide si ya
            venció, y el servidor le da el instante, no un veredicto que va a
            envejecer entre la respuesta y el render.* */
         pc.pago_expira_en
    FROM programas_contratados pc
    JOIN prestadores pr ON pr.id = pc.prestador_id
   /* 🔴 SIN FILTRO DE PAGO — la lección del paquete: filtrar acá volvería
      INVISIBLE el programa que la familia intentó comprar y no se cobró. */
   WHERE pc.user_id = auth.uid()
   ORDER BY (pc.estado = 'activo') DESC, pc.created_at DESC;
END $function$;

REVOKE EXECUTE ON FUNCTION public.obtener_mis_programas() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_mis_programas() TO authenticated;

-- ② ───────────────────────────────────────────────────────────────────────
COMMENT ON FUNCTION public.pagos_pendientes_de_conciliar(integer, text) IS
  'Levanta intentos NO TERMINALES con id de transacción del proveedor. '
  'NO LEVANTA — y se declara acá en vez de callarlo — los intentos APROBADOS '
  'cuyo sujeto no se movió («acto 2 falló»): son terminales, así que este '
  'barrido pasa de largo. Ésos los lista pagos_aprobados_sin_sujeto_movido(), '
  'y necesitan una persona. Ver pagos_conciliacion_cobertura().';

CREATE OR REPLACE FUNCTION public.pagos_conciliacion_cobertura()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
  SELECT jsonb_build_object(
    'ok', true,
    'medido_en', now(),
    'cubre', jsonb_build_object(
      'que', 'intentos NO terminales con transaction_id del proveedor',
      'quien', 'pagos_pendientes_de_conciliar()',
      'automatico', true,
      'cuantos', (SELECT count(*) FROM public.pagos_pendientes_de_conciliar())),
    /* 🔴 EL HUECO, AL LADO DE LO CUBIERTO Y CON SU NÚMERO. *Un hueco escrito
       lejos de lo que sí funciona no se lee nunca; acá el que mira la cobertura
       ve las dos cifras en la misma respuesta.* */
    'no_cubre', jsonb_build_object(
      'que', 'intentos APROBADOS cuyo sujeto no se movio (acto 2 fallo)',
      'por_que', 'son terminales — el barrido solo mira no terminales',
      'quien_los_ve', 'pagos_aprobados_sin_sujeto_movido()',
      'automatico', false,
      'necesita', 'una persona',
      'cuantos', (public.pagos_aprobados_sin_sujeto_movido()->>'cuantos')::int,
      'monto_detenido', (public.pagos_aprobados_sin_sujeto_movido()->>'monto_detenido')::numeric));
$function$;

REVOKE EXECUTE ON FUNCTION public.pagos_conciliacion_cobertura() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.pagos_conciliacion_cobertura() TO service_role;

-- ③ ───────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.vencer_links_mensuales()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_n int := 0; v_p int := 0; v_i int := 0;
BEGIN
  UPDATE cobro_link_mensual SET estado = 'vencido'
   WHERE estado = 'emitido' AND vence_en < public.hoy_local();
  GET DIAGNOSTICS v_n = ROW_COUNT;

  /* 🔴 Y SU INTENTO SE CIERRA. Sin esto el intento queda `iniciado` para
     siempre y `pagos_pendientes_de_conciliar` —que mira los NO terminales—
     seguiría preguntándole al proveedor por un link que nadie va a pagar.
     `expirado` ya estaba en el vocabulario: no se ensancha nada. */
  UPDATE pagos_intentos i SET estado = 'expirado', cerrado_en = now()
   WHERE i.estado = 'iniciado'
     AND EXISTS (SELECT 1 FROM cobro_link_mensual l
                  WHERE l.intento_id = i.id AND l.estado = 'vencido');
  GET DIAGNOSTICS v_i = ROW_COUNT;

  /* 🔴 EL PLAN NO RENUEVA — y NO SE CANCELA. Firma del founder: *ese plan sólo
     se pausa; queda REACTIVABLE.* El mes ya pagado corre hasta su fin. */
  UPDATE suscripciones_servicio s SET auto_renovar = false
   WHERE s.auto_renovar
     AND EXISTS (SELECT 1 FROM cobro_link_mensual l
                  WHERE l.suscripcion_servicio_id = s.id AND l.estado = 'vencido');
  GET DIAGNOSTICS v_p = ROW_COUNT;

  RETURN jsonb_build_object('ok', true, 'links_vencidos', v_n,
                            'intentos_expirados', v_i, 'planes_sin_renovar', v_p);
END $function$;

REVOKE EXECUTE ON FUNCTION public.vencer_links_mensuales() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.vencer_links_mensuales() TO service_role;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
DO $cint$
DECLARE v_c jsonb; v_cols int;
BEGIN
  SELECT count(*) INTO v_cols
    FROM information_schema.columns
   WHERE table_name='obtener_mis_programas';  -- no aplica: es funcion, se mide abajo

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname='obtener_mis_programas'
       AND pg_get_function_result(p.oid) ~ 'pago_expira_en timestamp with time zone') THEN
    RAISE EXCEPTION 'CINTURON ①: la ventana no viaja en la firma del lector';
  END IF;
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.proname='obtener_mis_programas') <> 1 THEN
    RAISE EXCEPTION 'CINTURON ①: quedo una sobrecarga viva (L-119)';
  END IF;
  RAISE NOTICE 'CINTURON OK - la ventana viaja y no hay sobrecarga';

  v_c := public.pagos_conciliacion_cobertura();
  IF (v_c->'no_cubre'->>'cuantos') IS NULL THEN
    RAISE EXCEPTION 'CINTURON ②: la cobertura no dice cuantos quedan fuera';
  END IF;
  IF (v_c->'no_cubre'->>'automatico')::boolean IS NOT FALSE THEN
    RAISE EXCEPTION 'CINTURON ②: el hueco se esta declarando como automatico';
  END IF;
  IF obj_description('public.pagos_pendientes_de_conciliar(integer, text)'::regprocedure) IS NULL THEN
    RAISE EXCEPTION 'CINTURON ②: el barrido no declara su hueco por escrito';
  END IF;
  RAISE NOTICE 'CINTURON OK - cobertura: levanta % / fuera de alcance % ($%)',
    v_c->'cubre'->>'cuantos', v_c->'no_cubre'->>'cuantos', v_c->'no_cubre'->>'monto_detenido';

  IF NOT (regexp_replace(regexp_replace(
            (SELECT pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname='public' AND p.proname='vencer_links_mensuales'),
            '/\*.*?\*/','','gs'),'--[^\n]*','','g') ~ 'estado = ''expirado''') THEN
    RAISE EXCEPTION 'CINTURON ③: el link vencido no cierra su intento — queda inmortal y el barrido lo persigue';
  END IF;
  RAISE NOTICE 'CINTURON OK - el link vencido expira su intento';

  RAISE NOTICE 'CINTURON VERDE - 3 brazos';
END $cint$;

COMMIT;
