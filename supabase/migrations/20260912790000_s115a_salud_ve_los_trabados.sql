-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · EL LECTOR DE SALUD VE LOS TRABADOS, NO SÓLO LA COLA DEL RELOJ
--
-- 🔴 EL DEFECTO, ENCONTRADO POR SU PROPIO CINTURÓN: la migración anterior
--    imprimió `veredicto = apagado_y_sin_cola` **con diez documentos sin
--    emitir en la base**. No mentía sobre lo que medía —la cola del reloj
--    (`borrador` + `emitiendo`) está de verdad en cero— pero *«sin cola» se lee
--    como «no hay nada esperando»*, y había diez.
--
--    Los otros estados no son cola del reloj **a propósito**: un
--    `pendiente_manual` o un `esperando_receptor` no los puede destrabar el
--    reloj, los destraba una persona o la familia. Pero son exactamente lo que
--    un tablero de salud existe para mostrar: **facturas que la familia espera
--    y que nadie está mirando.**
--
--    *Es la misma clase que este mismo archivo vino a cazar, un piso más
--    arriba: un estado sano que se dice sin haber mirado todo.* El grito del
--    reloj sirve para el reloj; el veredicto de salud tiene que responder «¿hay
--    alguien esperando una factura?», que es otra pregunta.
--
-- VEDA 76(g): NO RIGE — reemplaza un lector, cero datos.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.fiscal_salud_emision_automatica()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v jsonb; v_ultima public.fiscal_emision_corridas; v_cola int; v_encendido bool;
        v_gritos int; v_sin_correr interval; v_trabados jsonb; v_trabados_n int;
BEGIN
  IF NOT (is_admin() OR auth.uid() IS NULL) THEN
    RAISE EXCEPTION 'no_sos_admin' USING ERRCODE='42501';
  END IF;

  SELECT (valor = 'true') INTO v_encendido
    FROM app_config WHERE clave='fiscal_emision_automatica';
  SELECT * INTO v_ultima FROM fiscal_emision_corridas ORDER BY corrida_en DESC LIMIT 1;

  /* LA COLA DEL RELOJ: lo que el barrido SÍ puede tocar. */
  SELECT count(*) INTO v_cola FROM documentos_fiscales
   WHERE estado IN ('borrador','emitiendo') AND sentido='emitido';

  /* LOS TRABADOS: lo que el reloj NO puede destrabar y alguien tiene que ver.
     Se abren por estado, porque cada uno tiene un dueño distinto — y un total
     sin desglose manda a buscar en el lugar equivocado. */
  SELECT coalesce(jsonb_object_agg(estado, n), '{}'::jsonb), coalesce(sum(n),0)
    INTO v_trabados, v_trabados_n
    FROM (SELECT estado, count(*) AS n FROM documentos_fiscales
           WHERE sentido='emitido'
             AND estado IN ('pendiente_manual','esperando_receptor','no_autorizada')
           GROUP BY estado) t;

  SELECT count(*) INTO v_gritos FROM fiscal_emision_corridas
   WHERE grito IS NOT NULL AND corrida_en > now() - interval '24 hours';

  v_sin_correr := CASE WHEN v_ultima.corrida_en IS NULL THEN NULL
                       ELSE now() - v_ultima.corrida_en END;

  v := jsonb_build_object(
    'encendido', coalesce(v_encendido,false),
    'cola_del_reloj', v_cola,
    'trabados', v_trabados,
    'trabados_total', v_trabados_n,
    'ultima_corrida', v_ultima.corrida_en,
    'hace', v_sin_correr::text,
    'ultima', CASE WHEN v_ultima.id IS NULL THEN NULL ELSE jsonb_build_object(
        'disparo', v_ultima.disparo, 'procesados', v_ultima.procesados,
        'emitidos', v_ultima.emitidos, 'rebotados', v_ultima.rebotados,
        'por_motivo', v_ultima.por_motivo, 'grito', v_ultima.grito) END,
    'gritos_24h', v_gritos,
    /* 🔴 EL VEREDICTO CONTESTA «¿HAY ALGUIEN ESPERANDO UNA FACTURA?», y por eso
       los trabados pesan aunque el reloj esté impecable. «Sano» se reserva
       para cuando no espera nadie. */
    'veredicto',
      CASE
        WHEN v_trabados_n > 0 AND NOT coalesce(v_encendido,false)
          THEN format('apagado · %s trabado(s) esperando: %s', v_trabados_n, v_trabados::text)
        WHEN v_trabados_n > 0
          THEN format('%s trabado(s) que el reloj NO destraba: %s', v_trabados_n, v_trabados::text)
        WHEN NOT coalesce(v_encendido,false) AND v_cola > 0
          THEN format('apagado_con_%s_en_cola', v_cola)
        WHEN NOT coalesce(v_encendido,false) THEN 'apagado_y_sin_nada_esperando'
        WHEN v_ultima.id IS NULL THEN 'encendido_y_JAMAS_CORRIO'
        WHEN v_sin_correr > interval '20 minutes'
          THEN format('encendido_pero_no_corre_hace_%s', v_sin_correr::text)
        WHEN v_gritos > 0 THEN format('%s_corrida(s)_gritaron_en_24h', v_gritos)
        ELSE 'sano'
      END);
  RETURN v;
END $fn$;

REVOKE EXECUTE ON FUNCTION public.fiscal_salud_emision_automatica() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fiscal_salud_emision_automatica() TO authenticated;

DO $cint$
DECLARE v jsonb;
BEGIN
  v := fiscal_salud_emision_automatica();
  -- El discriminador: HOY hay trabados, así que el veredicto NO puede decir
  -- que no espera nadie. Si algún día no hay, este assert se relaja solo.
  IF (v->>'trabados_total')::int > 0
     AND v->>'veredicto' LIKE '%sin_nada_esperando%' THEN
    RAISE EXCEPTION 'cinturon: hay % trabados y el veredicto dice que no espera nadie',
      v->>'trabados_total';
  END IF;
  RAISE NOTICE 'cinturon OK · cola=% · trabados=% · veredicto=%',
    v->>'cola_del_reloj', v->>'trabados', v->>'veredicto';
END $cint$;
