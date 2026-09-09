-- S114-A · estado_final es SÓLO para finales ALTERNOS (hallazgo de C, caminando).
--
-- C caminó un caso resuelto (Videoconsulta de Zeus): la escalera dibujaba
-- «Resuelto» encendido, pero NO aparecía la línea de estado. Medido contra el
-- objeto: `_caso_mover` seteaba estado_final = p_hasta para CUALQUIER final
-- (es_final), así que un `resuelto` —que está EN LA ESCALERA— quedaba con
-- estado_final='resuelto'. La UI lee `final` (estado_final) como un FinalAlterno
-- (retirado/sin_lugar/resuelto_entre_partes, todos en_escalera=false) y con
-- 'resuelto' caía a la rama de «final alterno», que no dibuja la línea de la
-- escalera — mientras etapa_en_escalera SÍ encendía el paso. Contradicción.
--
-- El diseño (tipo FinalAlterno de C, y la lógica de etapa_previa que sólo congela
-- al caer FUERA de la escalera): estado_final marca el final ALTERNO; un final
-- EN ESCALERA (resuelto, cerrado) se muestra EN la escalera, no como alterno.
--
-- Cura: _caso_mover setea estado_final SÓLO cuando el final es alterno
-- (es_final AND NOT en_escalera). Backfill: los finales en-escalera que ya
-- quedaron con estado_final se ponen en NULL. Los alternos (resuelto_entre_partes)
-- conservan el suyo.
--
-- 76(g) declarada: SÍ rige un backfill de datos (estado_final de finales en
-- escalera → NULL); guard con conteo antes/después. Reversa ANTES.

CREATE OR REPLACE FUNCTION public._caso_mover(p_caso_id uuid, p_hasta text, p_actor text, p_actor_user uuid, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_desde text; v_t record; v_hasta_en_escalera boolean;
BEGIN
  SELECT etapa INTO v_desde FROM casos_postventa WHERE id = p_caso_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'codigo','caso_no_existe'); END IF;

  SELECT * INTO v_t FROM cat_transiciones_caso
   WHERE desde = v_desde AND hasta = p_hasta AND actor = p_actor AND activo;
  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM cat_transiciones_caso WHERE desde=v_desde AND hasta=p_hasta AND activo) THEN
      RETURN jsonb_build_object('ok',false,'codigo','actor_no_puede','desde',v_desde,'hasta',p_hasta,'actor',p_actor);
    END IF;
    RETURN jsonb_build_object('ok',false,'codigo','transicion_inexistente','desde',v_desde,'hasta',p_hasta);
  END IF;

  IF v_t.exige_motivo AND (p_motivo IS NULL OR btrim(p_motivo) = '') THEN
    RETURN jsonb_build_object('ok',false,'codigo','motivo_requerido','hasta',p_hasta);
  END IF;

  SELECT en_escalera INTO v_hasta_en_escalera FROM cat_estados_caso WHERE etapa = p_hasta;

  UPDATE casos_postventa
     SET etapa = p_hasta,
         etapa_previa = CASE
           WHEN NOT v_hasta_en_escalera
                AND (SELECT en_escalera FROM cat_estados_caso WHERE etapa = v_desde)
           THEN v_desde ELSE etapa_previa END,
         -- 🔴 estado_final SÓLO para finales ALTERNOS (fuera de escalera). Un final
         -- EN ESCALERA (resuelto, cerrado) se muestra EN la escalera, no acá.
         estado_final = CASE
           WHEN (SELECT es_final FROM cat_estados_caso WHERE etapa=p_hasta)
                AND NOT COALESCE(v_hasta_en_escalera, false)
           THEN p_hasta ELSE estado_final END,
         cerrado_en = CASE WHEN p_hasta = 'cerrado' THEN now() ELSE cerrado_en END,
         actualizado_en = now()
   WHERE id = p_caso_id;

  RETURN jsonb_build_object('ok', true, 'desde', v_desde, 'hasta', p_hasta);
END $function$;
REVOKE ALL ON FUNCTION public._caso_mover(uuid,text,text,uuid,text) FROM anon, PUBLIC;

-- ── BACKFILL: los finales EN ESCALERA que quedaron con estado_final → NULL ──
DO $backfill$
DECLARE v_antes int; v_despues int;
BEGIN
  SELECT count(*) INTO v_antes FROM casos_postventa c
    WHERE c.estado_final IS NOT NULL
      AND (SELECT en_escalera FROM cat_estados_caso e WHERE e.etapa = c.estado_final);
  RAISE NOTICE 'backfill: % casos con estado_final en-escalera (a limpiar)', v_antes;

  UPDATE casos_postventa c
     SET estado_final = NULL, actualizado_en = now()
   WHERE c.estado_final IS NOT NULL
     AND (SELECT en_escalera FROM cat_estados_caso e WHERE e.etapa = c.estado_final);

  SELECT count(*) INTO v_despues FROM casos_postventa c
    WHERE c.estado_final IS NOT NULL
      AND (SELECT en_escalera FROM cat_estados_caso e WHERE e.etapa = c.estado_final);
  IF v_despues <> 0 THEN RAISE EXCEPTION 'backfill: quedaron % en-escalera con estado_final', v_despues; END IF;
  -- los alternos conservan su estado_final (control)
  IF NOT EXISTS (SELECT 1 FROM casos_postventa WHERE etapa='resuelto_entre_partes' AND estado_final='resuelto_entre_partes') THEN
    RAISE EXCEPTION 'backfill: se borró de más — un alterno perdió su estado_final';
  END IF;
  RAISE NOTICE 'CINTURÓN VERDE · estado_final sólo alternos · % en-escalera limpiados · alternos intactos', v_antes;
END $backfill$;
