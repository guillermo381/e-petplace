-- S114-A ⑦ (enmienda) · listar_lotes HABLA — el guard como WHERE sólo sabía negar.
--
-- Founder: con el gate como `WHERE is_admin()`, un no-admin recibía [] y «no hay
-- lotes» quedaba indistinguible de «no podés verlos». Es la clase L-424 (un guard
-- que vive en un WHERE/índice sólo sabe negarse) — la casa la cura haciendo hablar
-- al guard (L-321: «el permiso está revocado» es una lectura; «rebotó» es un hecho).
-- Hoy no puede pasar porque al portal sólo se entra por el login de admin — pero
-- esa protección es de quién abre la puerta, no del gate.
--
-- Decisión (una de las dos legítimas): rebote TIPADO con 'sin_permiso'. El vacío
-- deja de ser ambiguo: {ok:true, lotes:[...]} para el admin, {ok:false,
-- codigo:'sin_permiso'} para el resto.
--
-- 76(g) NO RIGE (DB, sin anclas de OTA; lectura). Reversa escrita ANTES.

CREATE OR REPLACE FUNCTION public.listar_lotes()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT CASE WHEN is_admin() THEN
    jsonb_build_object('ok', true, 'lotes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
          'id', l.id, 'nombre', l.nombre, 'cantidad', l.cantidad,
          'proveedor', l.proveedor, 'creado_en', l.creado_en,
          'activadas', (SELECT count(*) FROM pasaporte_placa p WHERE p.lote_id = l.id AND p.activada_en IS NOT NULL),
          'libres',    (SELECT count(*) FROM pasaporte_placa p WHERE p.lote_id = l.id AND p.activada_en IS NULL))
        ORDER BY l.creado_en DESC)
      FROM pasaporte_lote l), '[]'::jsonb))
  ELSE
    -- El guard HABLA: el vacío del no-admin no se confunde con «no hay lotes».
    jsonb_build_object('ok', false, 'codigo', 'sin_permiso')
  END;
$fn$;
REVOKE ALL ON FUNCTION public.listar_lotes() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.listar_lotes() TO authenticated;
