-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · G7 · EL PLAN DICE A QUÉ ESPECIES ALCANZA
--
-- Pedido de C por nombre, y su freno era el correcto: **escribir «perro, gato»
-- en la pantalla sería la UI decidiendo una regla de producto.** El recorte
-- vive en `tipos_servicio.especies_elegibles` y hoy dice `["perro","gato"]`.
--
-- 🔴 **NO SE RE-DERIVA LA REGLA: SE EXPONE LA MISMA COLUMNA QUE LEE EL GUARD.**
-- `_mascota_elegible_servicio` decide con
-- `ts.especies_elegibles IS NULL OR ts.especies_elegibles ? m.especie`, y eso
-- es literalmente lo que se calcula acá. *Una segunda implementación de la
-- misma regla se desincroniza el día que alguien agregue una especie —
-- exactamente el defecto que este pedido vino a evitar.*
--
-- ⚠️⚠️ **`especie_aplica` ES SÓLO LA ESPECIE, Y NO ES LA ELEGIBILIDAD ENTERA.**
-- El guard real tiene DOS cláusulas: la especie **y** `estado_vida='activa'`
-- (`D-658`). Devolver el guard completo en un solo booleano sería una trampa:
-- la pantalla diría *«este plan es para perros y gatos»* **sobre un perro en
-- memorial** — una frase verdadera en general y **falsa sobre ese animal**.
-- *Un booleano que junta dos razones obliga a quien lo lee a inventar cuál
-- de las dos fue.* Por eso este campo responde UNA pregunta y su nombre lo
-- dice; el estado de vida se pregunta aparte.
--
-- 76(g) — **NO RIGE**: lector, sin backfill, sin anclas.
-- ═══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.obtener_mis_planes_guarderia();

CREATE OR REPLACE FUNCTION public.obtener_mis_planes_guarderia()
RETURNS TABLE(suscripcion_id uuid, prestador_id uuid, prestador_nombre text,
              mascota_id uuid, mascota_nombre text, mascota_especie text,
              mascota_foto_url text,
              especies_elegibles jsonb, especie_aplica boolean,
              precio_mensual numeric, estado text, periodo_desde date,
              periodo_hasta date, direccion_id uuid, proximo_cobro date)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_fam uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm
   WHERE fm.user_id = auth.uid() AND fm.hasta IS NULL LIMIT 1;
  IF v_fam IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT s.id, s.prestador_id, pr.nombre_comercial,
         s.mascota_id, m.nombre, m.especie, m.foto_url,
         ts.especies_elegibles,
         /* Sin mascota en el mandato no hay pregunta que contestar: NULL, que
            se lee «no aplica la pregunta», jamás `false`, que se leería «este
            animal no puede». */
         CASE WHEN m.id IS NULL THEN NULL
              ELSE (ts.especies_elegibles IS NULL
                    OR ts.especies_elegibles ? m.especie) END,
         s.precio_mensual, s.estado, s.periodo_desde, s.periodo_hasta, s.direccion_id,
         CASE WHEN s.estado = 'activa'
                   AND s.periodo_desde IS NOT NULL
                   AND s.dia_de_cobro IS NOT NULL
              THEN public.proximo_cobro_mensual(s.dia_de_cobro, s.periodo_desde)
              ELSE NULL END
    FROM guarderia_suscripciones s
    JOIN prestadores pr ON pr.id = s.prestador_id
    LEFT JOIN mascotas m ON m.id = s.mascota_id
    /* El código del comprable de la mensualidad. LEFT, para que un catálogo
       incompleto no haga desaparecer el plan de la pantalla. */
    LEFT JOIN tipos_servicio ts ON ts.codigo = 'guarderia_mensual'
   WHERE s.familia_id = v_fam
   ORDER BY (s.estado = 'activa') DESC, s.created_at DESC;
END $fn$;

REVOKE ALL ON FUNCTION public.obtener_mis_planes_guarderia() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_mis_planes_guarderia() TO authenticated;

-- ═══ CINTURÓN — el rojo primero, sobre el caso real (L-459) ═══
DO $c$
DECLARE v_ee jsonb; v_ave boolean; v_perro boolean; v_acl text;
BEGIN
  SELECT especies_elegibles INTO v_ee FROM tipos_servicio WHERE codigo='guarderia_mensual';
  IF v_ee IS NULL THEN
    RAISE NOTICE 'CINTURON: guarderia_mensual sin recorte — especie_aplica sera TRUE para todos';
  END IF;

  /* 🔴 EL DISCRIMINADOR: la misma expresión tiene que dar DISTINTO para un ave
     y para un perro. Si diera lo mismo, el campo no mide nada. */
  v_ave   := (v_ee IS NULL OR v_ee ? 'ave');
  v_perro := (v_ee IS NULL OR v_ee ? 'perro');
  IF v_ave = v_perro THEN
    RAISE EXCEPTION 'CINTURON: especie_aplica NO DISCRIMINA (ave=% perro=%)', v_ave, v_perro;
  END IF;
  IF v_ave THEN RAISE EXCEPTION 'CINTURON: un ave da true contra %', v_ee; END IF;

  /* Y el espejo contra el guard vivo: lo que calcula el lector tiene que
     coincidir con la cláusula de especie del guard, sobre la MISMA columna. */
  IF EXISTS (
    SELECT 1 FROM guarderia_suscripciones s JOIN mascotas m ON m.id=s.mascota_id
     WHERE (v_ee IS NULL OR v_ee ? m.especie) <> public._mascota_elegible_servicio(m.id,'guarderia_mensual')
       AND m.estado_vida = 'activa')
  THEN
    RAISE EXCEPTION 'CINTURON: el lector y el guard difieren sobre una mascota viva';
  END IF;

  SELECT array_to_string(proacl,',') INTO v_acl FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_mis_planes_guarderia';
  IF v_acl ILIKE '%anon=%' THEN RAISE EXCEPTION 'CINTURON: anon en proacl (L-140)'; END IF;

  RAISE NOTICE 'CINTURON VERDE: ave=% perro=% sobre %', v_ave, v_perro, v_ee;
END $c$;
