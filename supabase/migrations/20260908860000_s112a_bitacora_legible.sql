-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · LA BITÁCORA DEL CUIDADOR SE PUEDE LEER
--
-- 🟢 **FIRMA DEL FOUNDER (3-sep):** se lee **por estadía mientras dura el día
-- Y en el expediente después**; los chips **viajan dentro del evento**, con su
-- `nombre_familia` resuelto; **una voz por mano** — «anotaste» sólo si lo
-- escribió la familia, «el cuidador anotó» si vino de la guardería.
--
-- **Lo medido antes de construir:** `evento_bitacora_chips` tenía **9 filas
-- vivas y CERO lectores**. La conducta se escribía y **no había puerta por
-- donde salir** — el prestador marcaba y la familia no lo veía por ningún lado.
--
-- ⚠️ **El discriminador de la voz es `prestador_id`, y NO el tipo**: el mismo
-- `bitacora_familia` lo escriben las dos manos. *Una sola voz para los dos le
-- diría «anotaste» a una familia sobre algo que anotó el cuidador.*
--
-- 76(g) — NO RIGE: lectores nuevos, sin backfill y sin anclas.
-- ═══════════════════════════════════════════════════════════════════════════

/* Los chips de N eventos en UN viaje. Se pide por lote a propósito: uno por
   evento sería una petición por fila del timeline, y el costo de la casa es
   la PETICIÓN, no el dato (`L-223`). */
CREATE OR REPLACE FUNCTION public.chips_de_bitacora(p_evento_ids uuid[])
RETURNS TABLE(evento_id uuid, codigo text, nombre_familia text, nombre_familia_en text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
  SELECT b.evento_id, ch.codigo, c.nombre_familia, c.nombre_familia_en
    FROM evento_bitacora_familia b
    JOIN evento_bitacora_chips ch ON ch.bitacora_id = b.id
    JOIN cat_conductas_bitacora c ON c.codigo = ch.codigo
   WHERE b.evento_id = ANY(p_evento_ids)
     /* 🔴 LA PUERTA: la MISMA que decide si esa persona puede ver a la
        mascota. *Un lector de chips con su propia regla sería una segunda
        puerta al mismo expediente, y las dos puertas se separan.* */
     AND public.user_tiene_acceso_a_mascota(b.mascota_id)
   ORDER BY b.evento_id, ch.codigo;
$fn$;
REVOKE ALL ON FUNCTION public.chips_de_bitacora(uuid[]) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.chips_de_bitacora(uuid[]) TO authenticated;

/* La bitácora de UNA estadía — el «SU DÍA» mientras dura. */
CREATE OR REPLACE FUNCTION public.obtener_bitacora_de_estadia(p_estadia_id uuid)
RETURNS TABLE(evento_id uuid, mascota_id uuid, texto text,
              anotada_en timestamptz, prestador_id uuid, autor text,
              chips jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT e.id, e.mascota_id, b.texto, e.fecha_evento, e.prestador_id,
         pr.nombre_comercial,
         COALESCE((SELECT jsonb_agg(jsonb_build_object(
                            'codigo', ch.codigo,
                            'nombreFamilia', c.nombre_familia,
                            'nombreFamiliaEn', c.nombre_familia_en) ORDER BY ch.codigo)
                     FROM evento_bitacora_chips ch
                     JOIN cat_conductas_bitacora c ON c.codigo = ch.codigo
                    WHERE ch.bitacora_id = b.id), '[]'::jsonb)
    FROM evento_bitacora_familia b
    JOIN eventos_mascota e ON e.id = b.evento_id
    LEFT JOIN prestadores pr ON pr.id = e.prestador_id
   WHERE b.estadia_id = p_estadia_id
     /* Misma puerta que arriba, por la misma razón. */
     AND public.user_tiene_acceso_a_mascota(b.mascota_id)
   ORDER BY e.fecha_evento;
END $fn$;
REVOKE ALL ON FUNCTION public.obtener_bitacora_de_estadia(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_bitacora_de_estadia(uuid) TO authenticated;

-- ═══ CINTURÓN — el rojo con su control positivo al lado ═══
DO $c$
DECLARE v_fam uuid; v_otro uuid; v_ev uuid; v_masc uuid; v_n int; v_n2 int;
BEGIN
  SELECT e.id, e.mascota_id INTO v_ev, v_masc FROM eventos_mascota e
   WHERE e.tipo='bitacora_familia' AND e.datos->>'origen'='bitacora_guarderia' LIMIT 1;
  IF v_ev IS NULL THEN
    RAISE NOTICE 'CINTURON: sin bitacora de cuidador — los brazos NO se pudieron ejercer';
    RETURN;
  END IF;

  /* ① El POSITIVO: quien puede ver la mascota ve sus chips. */
  /* El vínculo vive en `mascotas.familia_id`, no en una tabla puente —
     medido: `familia_mascota` no existe. */
  SELECT fm.user_id INTO v_fam FROM familia_miembro fm
    JOIN mascotas m ON m.familia_id = fm.familia_id
   WHERE m.id = v_masc AND fm.hasta IS NULL LIMIT 1;
  IF v_fam IS NULL THEN
    RAISE NOTICE 'CINTURON: la mascota no tiene familia — el positivo NO se pudo ejercer';
  ELSE
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_fam, 'role','authenticated')::text, true);
    SELECT count(*) INTO v_n FROM public.chips_de_bitacora(ARRAY[v_ev]);
    IF v_n = 0 THEN RAISE EXCEPTION 'CINTURON: la familia del animal NO ve sus chips'; END IF;
  END IF;

  /* ② 🔴 EL ROJO: una familia AJENA no ve nada. Sin este brazo, un lector que
     devolviera todo daría el mismo verde arriba. */
  SELECT fm.user_id INTO v_otro FROM familia_miembro fm
   WHERE fm.hasta IS NULL
     AND NOT EXISTS (SELECT 1 FROM mascotas m
                      WHERE m.familia_id = fm.familia_id AND m.id = v_masc)
   LIMIT 1;
  IF v_otro IS NULL THEN
    RAISE NOTICE 'CINTURON: no hay familia ajena — el ROJO NO se pudo ejercer';
  ELSE
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_otro, 'role','authenticated')::text, true);
    SELECT count(*) INTO v_n2 FROM public.chips_de_bitacora(ARRAY[v_ev]);
    IF v_n2 <> 0 THEN
      RAISE EXCEPTION 'CINTURON: una familia AJENA ve % chip(s)', v_n2;
    END IF;
  END IF;

  RAISE NOTICE 'CINTURON VERDE: la familia del animal ve % chip(s), la ajena ve 0', v_n;
END $c$;
