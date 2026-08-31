-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A · LA LLAVE ÚNICA CABLEADA, Y EL AVISO DEL PASEO VA POR CORREO
--
-- 76(g) VEDA: **NO RIGE.** Una función + un UPDATE de catálogo. Cero backfill.
-- REVERSA: `docs/relevamientos/2026-09-04-s108a-REVERSA-M17.sql`.
-- 🤝 Consume `guarderia_recurrente_vivo()` de **S108-B** (`20260904120000`).
--    Su guard `verificar_llave_unica_guarderia()` está HOY EN ROJO nombrando a
--    esta función; con este cableado se pone verde **solo**.
--
-- ═══ EL CANAL DEL PASEO — firma del founder (31-ago) ═══════════════════════
-- *La regla del canal vale para TODO servicio recurrente.* El razonamiento es
-- el de `ignora_techo`: **un aviso de que va a salir plata en tres días, que no
-- llega porque el push está apagado, no es un aviso perdido — es la familia
-- enterándose por el débito.**
-- Se hace por **DATO del catálogo**, como el de guardería. Cero código.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE cat_notificacion_tipos
   SET canal_forzado = 'email'
 WHERE codigo = 'plan_renovacion_proxima';

CREATE OR REPLACE FUNCTION public.avisar_renovaciones_guarderia()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_r record; v_n int := 0; v_prox date;
BEGIN
  /* ═══ LA LLAVE ÚNICA — aviso y cobro se encienden JUNTOS ════════════════
     🟢 Firma del founder (31-ago). **`guarderia_recurrente_vivo()` es el ÚNICO
     lector de la clave**; acá NO se lee `app_config` por cuenta propia —
     `verificar_llave_unica_guarderia()` (S108-B) revienta si alguien lo hace,
     y con razón: *dos lectores es exactamente cómo se llega a «una encendida y
     la otra apagada».*

     🔴 Por qué es estructural y no una nota: **un aviso de cobro que no ocurre
     entrena a la familia a ignorar el próximo, que sí va a ser verdad.** Y el
     caso inverso —cobrar sin haber avisado— queda igualmente inexpresable,
     porque el mismo interruptor gobierna el cron que cobra. */
  IF NOT public.guarderia_recurrente_vivo() THEN
    RETURN jsonb_build_object('ok', true, 'avisado', false,
                              'motivo', 'guarderia_recurrente_apagado');
  END IF;
  FOR v_r IN
    SELECT s.*, cc.moneda
      FROM guarderia_suscripciones s
      JOIN prestadores pr ON pr.id = s.prestador_id
      LEFT JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
     /* 🔴 SOLO PLANES VIVOS. *Avisar de un cobro que no va a ocurrir es peor
        que no avisar*: la familia cancela algo que ya canceló, o vuelve a la app
        a arreglar un problema que no tiene. */
     WHERE s.estado = 'activa'
       /* 🔴 SOLO RENOVACIONES. `periodo_desde IS NULL` es *«autorizado y todavía
          sin cobrar»* ⇒ su primer cobro sale al contratar y **no hay tres días
          que avisar**. Este brazo es lo que impide avisarle a alguien que
          todavía no pagó su primer mes. */
       AND s.periodo_desde IS NOT NULL
       AND s.dia_de_cobro IS NOT NULL
  LOOP
    v_prox := public.guarderia_proximo_cobro(v_r.dia_de_cobro, v_r.periodo_desde);
    CONTINUE WHEN v_prox <> public.hoy_local() + 3;

    PERFORM registrar_intencion_notificacion(
      p_tipo => 'guarderia_renovacion_proxima',
      p_destinatario_user_id => v_r.autorizada_por,
      p_mascota_id => v_r.mascota_id, p_evento_id => NULL,
      p_datos => _voz_notificacion('guarderia_renovacion_proxima', v_r.autorizada_por, v_r.mascota_id,
                   jsonb_build_object('fecha', v_prox,
                                      'monto', to_char(v_r.precio_mensual,'FM999999990.00'),
                                      'moneda', COALESCE(v_r.moneda,'USD')))
                 || jsonb_build_object('suscripcion_id', v_r.id, 'fecha', v_prox,
                                       'monto', v_r.precio_mensual,
                                       'moneda', COALESCE(v_r.moneda,'USD'),
                                       'puede','cancelar'),
      /* La clave lleva el PERÍODO ⇒ un aviso por período, jamás dos. El índice
         único de `notificacion_intencion` es el piso; esto es su llave. */
      p_clave_dedup => 'guarderia_renovacion:' || v_r.id::text || ':' || v_prox::text);
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'avisadas', v_n);
END $function$

;

REVOKE EXECUTE ON FUNCTION public.avisar_renovaciones_guarderia() FROM PUBLIC, anon, authenticated;

-- ═══ CINTURÓN — brazo POSITIVO y NEGATIVO sobre la llave ══════════════════
DO $c$
DECLARE v_r jsonb; v_n int; v_habia text;
BEGIN
  SELECT valor INTO v_habia FROM app_config WHERE clave='guarderia_recurrente_vivo';

  -- (a) 🔴 BRAZO NEGATIVO: con la llave APAGADA el aviso NO sale
  DELETE FROM app_config WHERE clave='guarderia_recurrente_vivo';
  v_r := public.avisar_renovaciones_guarderia();
  IF v_r->>'motivo' <> 'guarderia_recurrente_apagado' THEN
    RAISE EXCEPTION 'cinturon: con la llave apagada el aviso NO se freno: %', v_r::text;
  END IF;

  -- (b) BRAZO POSITIVO: con la llave puesta, la funcion CORRE (devuelve avisadas)
  INSERT INTO app_config (clave, valor) VALUES ('guarderia_recurrente_vivo','true');
  v_r := public.avisar_renovaciones_guarderia();
  IF v_r ? 'motivo' THEN
    RAISE EXCEPTION 'cinturon: con la llave puesta el aviso siguio frenado: %', v_r::text;
  END IF;
  IF NOT (v_r ? 'avisadas') THEN
    RAISE EXCEPTION 'cinturon: con la llave puesta no llego a evaluar: %', v_r::text;
  END IF;

  -- (c) 🔴 UN SOLO LECTOR: esta funcion NO lee app_config por su cuenta
  /* 🔴 SE MIDE SOBRE EL CUERPO SIN COMENTARIOS. La primera versión de este
     brazo dio ROJO por MI PROPIO COMENTARIO, que nombra la clave para explicar
     que no la lee. *`L-170` por tercera vez en esta sesión: un censo por
     `pg_get_functiondef` lee los comentarios como código* — y acá el falso
     positivo habría abortado una migración correcta. */
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='avisar_renovaciones_guarderia'
     AND regexp_replace(regexp_replace(p.prosrc,'/\*.*?\*/','','gs'),'--[^\n]*','','g')
         LIKE '%app_config%';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'cinturon: el aviso lee app_config por su cuenta — dos lectores';
  END IF;

  -- (d) el guard de B pasa a VERDE por este cableado
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname='public' AND p.proname='verificar_llave_unica_guarderia') THEN
    v_r := public.verificar_llave_unica_guarderia();
    IF COALESCE((v_r->>'ok')::boolean, false) IS NOT TRUE THEN
      RAISE EXCEPTION 'cinturon: el guard de la llave sigue ROJO: %', v_r::text;
    END IF;
  ELSE
    RAISE NOTICE 'cinturon M17: ⚠️ el guard de B no existe todavia — brazo (d) NO EJERCIDO';
  END IF;

  -- (e) el aviso del paseo va por correo, por DATO
  SELECT count(*) INTO v_n FROM cat_notificacion_tipos
   WHERE codigo='plan_renovacion_proxima' AND canal_forzado='email';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon: el aviso del paseo no quedo forzado a email'; END IF;

  RAISE NOTICE 'cinturon M17: 5/5 OK (llave apagada NO avisa · llave puesta SI corre · un solo lector · guard de B en verde · paseo por correo)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M17: fixture deshecho por subtransaccion — la llave vuelve a como estaba, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;
