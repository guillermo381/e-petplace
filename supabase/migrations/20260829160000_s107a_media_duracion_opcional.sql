-- ═══════════════════════════════════════════════════════════════════════════
-- S107 · A — `p_duracion_s` GANA SU DEFAULT
--
-- Lo pidió el typecheck, y tenía razón: **una foto no tiene duración**, pero el
-- parámetro nació sin `DEFAULT` ⇒ PostgREST lo tipa como **obligatorio** y el
-- llamador tendría que mandar algo para un campo que no existe en su caso.
--
-- 🔴 Se cura en la FIRMA, no con un cast en el wrapper. *Un `as unknown as
-- number` habría hecho compilar una mentira* — y la regla 34 de la casa
-- prohíbe justamente eso. `CREATE OR REPLACE` agrega el default sin cambiar la
-- firma, así que no hay sobrecarga zombi (L-119 no aplica acá).
--
-- Reversa: no hace falta — quitar un DEFAULT es volver a exigir un dato que la
-- foto no tiene. Si alguien la quiere, es este mismo `CREATE OR REPLACE` sin
-- el `DEFAULT NULL`.
-- 76(g): NO RIGE — sólo cambia el default de un parámetro.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.publicar_media_guarderia(
  p_prestador_id       uuid,
  p_clave_idempotencia text,
  p_tipo               text,
  p_archivo_url        text,
  p_duracion_s         numeric DEFAULT NULL,
  p_mascota_ids        uuid[]  DEFAULT NULL,
  p_capturada_en       timestamptz DEFAULT now()
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_media uuid; v_fecha date; v_m uuid; v_estadia uuid; v_evento uuid; v_n int := 0;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;
  IF p_clave_idempotencia IS NULL OR length(btrim(p_clave_idempotencia)) = 0 THEN
    RAISE EXCEPTION 'clave_idempotencia_requerida' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_media FROM guarderia_media
   WHERE prestador_id = p_prestador_id AND clave_idempotencia = p_clave_idempotencia;
  IF v_media IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'media_id', v_media, 'ya_existia', true);
  END IF;

  IF p_mascota_ids IS NULL OR array_length(p_mascota_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'media_sin_etiquetas' USING ERRCODE = '22023';
  END IF;

  v_fecha := (p_capturada_en AT TIME ZONE 'America/Guayaquil')::date;

  INSERT INTO guarderia_media (prestador_id, fecha, tipo, archivo_url, duracion_s,
                               capturada_en, autor_user_id, clave_idempotencia)
       VALUES (p_prestador_id, v_fecha, p_tipo, p_archivo_url, p_duracion_s,
               p_capturada_en, v_user, p_clave_idempotencia)
    RETURNING id INTO v_media;

  FOREACH v_m IN ARRAY p_mascota_ids LOOP
    SELECT g.id INTO v_estadia
      FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
     WHERE c.prestador_id = p_prestador_id AND c.mascota_id = v_m AND c.fecha = v_fecha
       AND g.estado <> 'cancelada'
     LIMIT 1;
    IF v_estadia IS NULL THEN
      RAISE EXCEPTION 'mascota_sin_estadia_ese_dia' USING ERRCODE = '22023';
    END IF;

    INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
                                 creado_por_user_id, datos, country_code)
         VALUES (v_m, 'foto_guarderia', 'cuidado_externo', p_capturada_en, p_prestador_id,
                 v_user, jsonb_build_object('media_id', v_media, 'tipo', p_tipo), 'EC')
      RETURNING id INTO v_evento;

    INSERT INTO guarderia_media_etiquetas (media_id, mascota_id, estadia_id, evento_id)
         VALUES (v_media, v_m, v_estadia, v_evento);
    v_n := v_n + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'media_id', v_media, 'ya_existia', false, 'etiquetas', v_n);
END $$;

REVOKE EXECUTE ON FUNCTION public.publicar_media_guarderia(uuid, text, text, text, numeric, uuid[], timestamptz) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.publicar_media_guarderia(uuid, text, text, text, numeric, uuid[], timestamptz) TO authenticated;

DO $c$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='publicar_media_guarderia';
  -- L-119: una sola firma, jamás una sobrecarga zombi.
  IF v_n <> 1 THEN RAISE EXCEPTION 'ROJO: quedaron % sobrecargas de publicar_media_guarderia.', v_n; END IF;
  RAISE NOTICE '✅ una sola firma · p_duracion_s con DEFAULT NULL';
END $c$;

COMMIT;
