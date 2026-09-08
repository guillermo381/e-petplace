-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · C6 · `obtener_mis_casos` (omisión de C, treinta líneas) + C②
--
-- Dos cosas que C midió montando el motor, las dos correctas:
--
-- ③ C6 no tenía lector para la familia — omisión declarada de C, no defecto del
--    motor. Es `obtenerCasosDelPrestador` con el asiento cambiado: la familia
--    ve los SUYOS, abiertos primero.
--
-- ② EL FINAL ALTERNO BORRABA LA ETAPA PREVIA. `_caso_mover` escribía
--    `etapa = estado_final = p_hasta`, así que con un final alterno (`retirado`,
--    `sin_lugar`, `resuelto_entre_partes`) la escalera perdía en qué paso
--    estaba y **no se dibujaba** — se mostraba la etiqueta del final sola.
--    §3.1 quiere la fila congelada donde estaba con la línea reemplazada.
--    ⇒ `casos_postventa` gana `etapa_previa`, que `_caso_mover` llena SÓLO al
--    entrar a un final que no está en la escalera, y `leer_caso` la devuelve
--    como `etapa_en_escalera`. *Guardar el paso previo es lo que separa una
--    escalera verdadera de una con un paso inventado.*
--
-- VEDA 76(g): NO RIGE — una columna nullable + dos funciones; cero backfill
--    (ningún caso llegó todavía a un final alterno; la columna nace NULL y es
--    correcto que lo sea para los que ya están).
-- REVERSA: escrita ANTES.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.casos_postventa
  ADD COLUMN IF NOT EXISTS etapa_previa text REFERENCES public.cat_estados_caso(etapa);

COMMENT ON COLUMN public.casos_postventa.etapa_previa IS
  'S114 · C② · el paso EN LA ESCALERA antes de caer a un final alterno '
  '(retirado/sin_lugar/resuelto_entre_partes). NULL mientras el caso siga en '
  'la escalera. Lo llena _caso_mover, no una app.';

-- _caso_mover: guardar la etapa previa al entrar a un final FUERA de escalera
CREATE OR REPLACE FUNCTION public._caso_mover(
  p_caso_id uuid, p_hasta text, p_actor text, p_actor_user uuid, p_motivo text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
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
         -- 🔴 C② · congelar el paso previo SÓLO al caer a un final fuera de
         -- escalera, y sólo si venías DE la escalera. Si el destino está en la
         -- escalera, no hay nada que congelar.
         etapa_previa = CASE
           WHEN NOT v_hasta_en_escalera
                AND (SELECT en_escalera FROM cat_estados_caso WHERE etapa = v_desde)
           THEN v_desde ELSE etapa_previa END,
         estado_final = CASE WHEN (SELECT es_final FROM cat_estados_caso WHERE etapa=p_hasta)
                             THEN p_hasta ELSE estado_final END,
         cerrado_en = CASE WHEN p_hasta = 'cerrado' THEN now() ELSE cerrado_en END,
         actualizado_en = now()
   WHERE id = p_caso_id;

  RETURN jsonb_build_object('ok', true, 'desde', v_desde, 'hasta', p_hasta);
END $fn$;

-- leer_caso: devolver etapa_en_escalera (el paso previo si el actual es final alterno)
CREATE OR REPLACE FUNCTION public.leer_caso(p_caso_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_c record; v_o record; v_en_esc boolean;
BEGIN
  SELECT * INTO v_c FROM casos_postventa WHERE id = p_caso_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'codigo','no_existe'); END IF;
  IF NOT (v_c.familia_user_id = auth.uid()
          OR (v_c.prestador_id IS NOT NULL AND es_mi_prestador(v_c.prestador_id))
          OR is_admin()) THEN
    RETURN jsonb_build_object('ok',false,'codigo','no_es_tuyo');
  END IF;
  SELECT * INTO v_o FROM _caso_dueno_del_objeto(v_c.objeto_tipo, v_c.objeto_id);
  SELECT en_escalera INTO v_en_esc FROM cat_estados_caso WHERE etapa=v_c.etapa;
  RETURN jsonb_build_object('ok', true, 'caso_id', v_c.id, 'etapa', v_c.etapa,
    'clase', v_c.clase, 'motivo', v_c.motivo_codigo,
    'en_escalera', v_en_esc,
    -- 🔴 C② · el paso que la escalera dibuja: si el actual es final alterno,
    -- el previo congelado; si no, el actual.
    'etapa_en_escalera', CASE WHEN v_en_esc THEN v_c.etapa ELSE v_c.etapa_previa END,
    'final', v_c.estado_final,
    'cerrado', (SELECT es_final FROM cat_estados_caso WHERE etapa=v_c.etapa),
    'plazo_hasta', v_c.plazo_prestador_hasta,
    'objeto', jsonb_build_object('tipo', v_c.objeto_tipo, 'id', v_c.objeto_id,
                                 'titulo', v_o.titulo, 'fecha', v_o.cerrado_en),
    'resolucion', jsonb_build_object('alcance', v_c.resolucion_alcance,
                    'monto', v_c.monto_devuelto, 'camino', v_c.camino,
                    'destino', v_c.destino, 'destino_estado', v_c.destino_estado),
    'accion_pendiente', CASE WHEN v_c.resuelto_en IS NOT NULL AND v_c.destino IS NULL
                              AND COALESCE(v_c.monto_devuelto,0) > 0
                             THEN 'elegir_devolucion' ELSE NULL END);
END $fn$;

-- ③ C6 · el lector de la familia
CREATE OR REPLACE FUNCTION public.obtener_mis_casos()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'caso_id', c.id, 'objeto_tipo', c.objeto_tipo, 'objeto_id', c.objeto_id,
    'motivo', c.motivo_codigo, 'clase', c.clase, 'etapa', c.etapa,
    'plazo_hasta', c.plazo_prestador_hasta, 'creado_en', c.creado_en
  ) ORDER BY
    -- abiertos primero (§ C6), después por fecha
    (SELECT es_final FROM cat_estados_caso ce WHERE ce.etapa = c.etapa) ASC,
    c.creado_en DESC), '[]'::jsonb)
  FROM casos_postventa c
  WHERE c.familia_user_id = auth.uid();
$fn$;

REVOKE ALL ON FUNCTION public.obtener_mis_casos() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_mis_casos() TO authenticated;
REVOKE ALL ON FUNCTION public._caso_mover(uuid,text,text,uuid,text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._caso_mover(uuid,text,text,uuid,text) TO authenticated;
REVOKE ALL ON FUNCTION public.leer_caso(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.leer_caso(uuid) TO authenticated;

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE v_r jsonb;
BEGIN
  -- la columna existe y referencia el catálogo
  IF NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
    WHERE c.relname='casos_postventa' AND a.attname='etapa_previa' AND NOT a.attisdropped) THEN
    RAISE EXCEPTION 'CINTURÓN: falta etapa_previa';
  END IF;
  -- obtener_mis_casos devuelve un array (vacío o no) y no rompe
  IF jsonb_typeof(obtener_mis_casos()) <> 'array' THEN
    RAISE EXCEPTION 'CINTURÓN: obtener_mis_casos no devuelve array';
  END IF;
  IF has_function_privilege('anon','public.obtener_mis_casos()','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN: anon puede leer casos ajenos';
  END IF;
  RAISE NOTICE 'CINTURÓN VERDE · etapa_previa presente · obtener_mis_casos array · anon sin EXECUTE';
END $cinturon$;
