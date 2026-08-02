-- REVERSA de `20260802220000_s84_zona_aproximada.sql` (S84-A19)
-- Escrita ANTES de aplicar.
--
-- ⚠️ **CORRER ESTO REABRE UN AGUJERO DE PRIVACIDAD.** No es una reversa
-- neutra: devuelve `lat`/`lon` EXACTAS a `v_prestadores_publicos`, o sea
-- vuelve a poner la dirección de la casa de tres prestadores al alcance de
-- cualquier usuario con sesión. **Si se corre, que sea a sabiendas y por un
-- rato** — y que D-624 vuelva a 🔴 en el mismo acto.
--
-- Se escribe igual, y completa, porque una migración sin reversa es una
-- migración que nadie se anima a revertir cuando hace falta de verdad.
--
-- LO QUE **NO** DEVUELVE, declarado: los grants anchos que la vista tenía
-- antes (INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER para
-- `authenticated`). **Se restituye SOLO `SELECT`** — eran privilegio que
-- nadie pidió, no había consumidor (censo: 0), y restituirlos sería
-- reponer una segunda deuda al revertir la primera.

BEGIN;

DROP VIEW IF EXISTS public.v_prestadores_publicos;

CREATE VIEW public.v_prestadores_publicos
WITH (security_invoker = true) AS
SELECT p.id,
    p.user_id,
    p.tipo,
    p.nombre_comercial,
    p.descripcion,
    p.foto_url,
    p.ciudad,
    p.sector,
    p.lat,          -- ⚠️ EXACTA — el agujero de D-624
    p.lon,          -- ⚠️ EXACTA — el agujero de D-624
    p.calificacion_promedio,
    p.total_resenas,
    p.total_citas,
    p.acepta_emergencias,
    p.acepta_telemedicina,
    p.radio_cobertura_km,
    p.country_code,
    COALESCE(jsonb_agg(jsonb_build_object('id', ps.id, 'tipo', ps.tipo_servicio, 'nombre', COALESCE(ps.nombre_custom, ps.tipo_servicio), 'precio', ps.precio, 'duracion_minutos', ps.duracion_minutos)) FILTER (WHERE ps.id IS NOT NULL AND ps.activo = true), '[]'::jsonb) AS servicios
   FROM prestadores p
     LEFT JOIN prestador_servicios ps ON ps.prestador_id = p.id
  WHERE p.estado = 'activo'::text
  GROUP BY p.id;

REVOKE ALL ON public.v_prestadores_publicos FROM anon, PUBLIC;
GRANT SELECT ON public.v_prestadores_publicos TO authenticated;

COMMIT;
