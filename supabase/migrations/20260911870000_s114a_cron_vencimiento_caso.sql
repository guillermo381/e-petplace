-- S114-A ④ · EL VENCIMIENTO ENTRA SOLO — L-318 puro (motor sin cron).
--
-- F midió: la transición con_prestador→con_casa actor 'sistema' está declarada y
-- activa, y hay CERO crones que la disparen. Los casos vencidos se quedan en
-- con_prestador para siempre. (82ff1424 vence 09-sep 15:27; 83e5c976 20:10.)
--
-- El plazo del prestador es casos_postventa.plazo_prestador_hasta (24h desde que
-- el caso entró a con_prestador). Cuando vence sin respuesta, e-PetPlace toma el
-- caso (actor 'sistema'). El cron corre cada hora, como el de F1.
--
-- 76(g) NO RIGE (DB, sin anclas de OTA; el backfill lo hace el reloj, no esta migración).
-- Reversa escrita ANTES. Control positivo + su rojo: scripts/s114/cinturon-vencimiento-caso.sh

CREATE OR REPLACE FUNCTION public.vencer_casos_sin_respuesta()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_caso record; v_n int := 0; v_mov jsonb;
BEGIN
  FOR v_caso IN
    SELECT id FROM casos_postventa
     WHERE etapa = 'con_prestador'
       AND plazo_prestador_hasta IS NOT NULL
       AND plazo_prestador_hasta < now()
  LOOP
    -- la transición con_prestador→con_casa actor 'sistema' ya existe y está activa.
    v_mov := _caso_mover(v_caso.id, 'con_casa', 'sistema', NULL, 'plazo del prestador vencido');
    IF (v_mov->>'ok')::boolean THEN
      v_n := v_n + 1;
      INSERT INTO caso_mensajes (caso_id, autor, tipo, cuerpo)
      VALUES (v_caso.id, 'casa', 'hecho',
        'El prestador no respondió a tiempo; e-PetPlace tomó el caso.');
    END IF;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'vencidos', v_n);
END $fn$;
REVOKE ALL ON FUNCTION public.vencer_casos_sin_respuesta() FROM anon, PUBLIC;

SELECT cron.unschedule('vencer-casos-sin-respuesta')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'vencer-casos-sin-respuesta');
SELECT cron.schedule('vencer-casos-sin-respuesta', '0 * * * *',
  $$SELECT public.vencer_casos_sin_respuesta()$$);
