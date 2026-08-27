-- ════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260826440000_s106a_vista_publica_zona.sql`
-- Escrita ANTES de aplicar.
--
-- 🔴 REVERTIR REINTRODUCE EL DEFECTO, Y ES UN P0.
--    Volver la vista a calcular `zona_lat`/`zona_lon` leyendo `p.lat`/`p.lon`
--    la deja rebotando con `permission denied for table prestadores` **para
--    toda familia logueada** —`authenticated` no tiene grant sobre esas dos
--    columnas y la vista es `security_invoker`— ⇒ el listado público de
--    prestadores vuelve a caerse entero, en los cinco oficios.
--
--    *No es una reversa neutra. Si alguien la corre, que sea sabiendo que
--    apaga la vitrina del producto.*
--
-- ⚠️ Y NO se cura concediendo `lat`/`lon`: eso desharía S84, que sacó la
--    coordenada exacta del teléfono a propósito. El helper existe justamente
--    para no tener que elegir entre la vitrina y la privacidad.
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.v_prestadores_publicos
WITH (security_invoker = true) AS
SELECT id, user_id, tipo, nombre_comercial, descripcion, foto_url, ciudad, sector,
  CASE WHEN lat IS NULL OR lon IS NULL THEN NULL::double precision
       ELSE lat + (500::numeric * (0.30 + (abs(hashtext(id::text || 'd'::text)) % 1000)::numeric / 1000::numeric * 0.60))::double precision * cos(((abs(hashtext(id::text)) % 3600)::numeric / 3600::numeric * 2::numeric)::double precision * pi()) / 111320::double precision
  END AS zona_lat,
  CASE WHEN lat IS NULL OR lon IS NULL THEN NULL::double precision
       ELSE lon + (500::numeric * (0.30 + (abs(hashtext(id::text || 'd'::text)) % 1000)::numeric / 1000::numeric * 0.60))::double precision * sin(((abs(hashtext(id::text)) % 3600)::numeric / 3600::numeric * 2::numeric)::double precision * pi()) / (111320::double precision * GREATEST(cos(radians(lat)), 0.01::double precision))
  END AS zona_lon,
  CASE WHEN lat IS NULL OR lon IS NULL THEN NULL::integer ELSE 500 END AS zona_radio_m,
  calificacion_promedio, total_resenas, total_citas, acepta_emergencias,
  radio_cobertura_km, country_code, cohorte, cohorte_anio,
  COALESCE((SELECT jsonb_agg(jsonb_build_object('id', ps.id, 'tipo', ps.tipo_servicio, 'nombre', COALESCE(ps.nombre_custom, ps.tipo_servicio), 'precio', ps.precio, 'duracion_minutos', ps.duracion_minutos, 'categoria', ts.categoria) ORDER BY ps.tipo_servicio)
           FROM prestador_servicios ps LEFT JOIN tipos_servicio ts ON ts.codigo = ps.tipo_servicio
          WHERE ps.prestador_id = p.id AND ps.activo = true), '[]'::jsonb) AS servicios,
  COALESCE((SELECT jsonb_agg(pf.url ORDER BY pf.orden, pf.creado_en)
           FROM prestador_fotos pf WHERE pf.prestador_id = p.id), '[]'::jsonb) AS portadas,
  clip_url
FROM prestadores p
WHERE estado = 'activo'::text;

DROP FUNCTION IF EXISTS public._zona_aproximada(uuid);
