-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · LA PANTALLA PREGUNTA CON LA MISMA PIEZA CON QUE LA PUERTA DECIDE.
--
-- Pedido de C, medido por C contra el objeto: para apagar el plan ANTES del
-- botón hace falta la elegibilidad en el LECTOR — hoy sólo la sabe la puerta,
-- y la familia se entera al tocar.
--
-- 🔴 NO SE COPIA EL PREDICADO. Este lector llama a `_mascota_elegible_servicio`,
-- exactamente la misma función que cortan las cuatro puertas. *Un lector con su
-- propia copia del criterio es la forma más común de que la pantalla y el motor
-- se separen sin que nadie lo note: la pantalla ofrece y la puerta rechaza.*
--
-- Va gateado por acceso a la mascota: sin el gate esto sería un oráculo — con
-- un uuid cualquiera diría si esa mascota existe, está activa y de qué especie
-- es. **Devuelve `no_access_to_mascota`, no `false`**: false diría «no es
-- elegible» sobre un animal ajeno, que es una respuesta falsa además de fugada.
--
-- 76(g): NO RIGE — aditiva, sin backfill, sin consumidores previos.
-- REVERSA ESCRITA ANTES.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.puede_contratar_guarderia(p_mascota_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_esp text; v_vida text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE='42501';
  END IF;
  IF p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'mascota_requerida' USING ERRCODE='22023';
  END IF;
  IF NOT public.user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;

  SELECT m.especie, m.estado_vida INTO v_esp, v_vida
    FROM mascotas m WHERE m.id = p_mascota_id;

  IF public._mascota_elegible_servicio(p_mascota_id, 'guarderia_mensual') THEN
    RETURN jsonb_build_object('puede', true, 'especie', v_esp);
  END IF;

  /* El motivo se PARTE, porque la voz de la pantalla es distinta: una mascota
     en memorial no es «esta guardería no la recibe». */
  RETURN jsonb_build_object(
    'puede', false,
    'motivo', CASE WHEN v_vida IS DISTINCT FROM 'activa'
                   THEN 'mascota_no_activa' ELSE 'especie_no_admitida' END,
    'especie', v_esp,
    'especies_elegibles', (SELECT ts.especies_elegibles FROM tipos_servicio ts
                            WHERE ts.codigo = 'guarderia_mensual'));
END $fn$;

REVOKE ALL ON FUNCTION public.puede_contratar_guarderia(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.puede_contratar_guarderia(uuid) TO authenticated;

DO $cinturon$
DECLARE r jsonb;
BEGIN
  PERFORM set_config('request.jwt.claims',
    '{"sub":"dd024680-3d1c-4465-b38b-dedab45da037","role":"authenticated"}', true);
  r := public.puede_contratar_guarderia('abf6e5cc-b59f-40a7-a584-b568cb3b4a6a');  -- ave
  IF (r->>'puede')::boolean THEN RAISE EXCEPTION 'CINTURON: el lector acepta un ave'; END IF;
  IF r->>'motivo' <> 'especie_no_admitida' THEN
    RAISE EXCEPTION 'CINTURON: el motivo del ave es % y deberia ser especie_no_admitida', r->>'motivo'; END IF;
  r := public.puede_contratar_guarderia('d2e31d70-54fc-4d47-b425-1617239257eb');  -- perro
  IF NOT (r->>'puede')::boolean THEN RAISE EXCEPTION 'CINTURON: el lector rechaza un perro -> rechaza todo'; END IF;
  BEGIN
    r := public.puede_contratar_guarderia('79930830-1f09-4048-9b15-19dfd86bd31c');  -- ajena
    RAISE EXCEPTION 'CINTURON: el lector respondio sobre una mascota AJENA';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%no_access_to_mascota%' THEN
      RAISE EXCEPTION 'CINTURON: la mascota ajena rebota por otra cosa (%)', SQLERRM; END IF;
  END;
  RAISE NOTICE 'CINTURON VERDE: ave no · perro si · ajena rebota sin responder';
END $cinturon$;

-- L-140: ninguna funcion nueva queda alcanzable por anon.
DO $sonda$
BEGIN
  IF has_function_privilege('anon','public.puede_contratar_guarderia(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'L-140: anon puede ejecutar el lector nuevo';
  END IF;
END $sonda$;
