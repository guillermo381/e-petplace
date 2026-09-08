-- S114-A ⑦ · LOS TRES LECTORES DEL ADMIN LEGADO — ocho pantallas rotas por una
-- misma causa: leen tablas cerradas directo, y el admin es la herramienta con la
-- que se opera en octubre.
--
-- F censó: 3 tablas EXISTEN y están cerradas a propósito, y el admin (autenticado
-- como admin — crear_lote_placas is_admin ya le funciona) recibe permission denied:
--   · pasaporte_lote  → Placas
--   · prestadores     → MascotaDetalle · Citas · Servicios · Prestadores · PrestadorDetalle (5)
--   · seller_perfil   → Sellers · Productos (2)
-- prestadores la cerró S91 con razón (39 columnas legibles por cualquiera).
--
-- FIRMA DEL FOUNDER: construir los tres lectores con gate is_admin(). Y la letra
-- que F ratificó: §9.3 pone la LECTURA del admin POR RLS («casa ve todos»). ⇒
--   · prestadores / seller_perfil: policy is_admin() SELECT — ADITIVA (los no-admin
--     conservan sus policies angostas; sólo el admin gana el todo). Desbloquea los
--     `.from()` de las 7 pantallas SIN tocar ninguna.
--   · pasaporte_lote: su diseño es puerta-RPC (sus hermanas crear_lote_placas /
--     listar_placas_de_lote lo son) ⇒ listar_lotes(), con los conteos que la
--     pantalla calculaba aparte.
--
-- 76(g) NO RIGE (DB, sin anclas de OTA; lectura). Reversa escrita ANTES.

-- ① pasaporte_lote → listar_lotes() (campos exactos de Placas.tsx + conteos)
CREATE OR REPLACE FUNCTION public.listar_lotes()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', l.id, 'nombre', l.nombre, 'cantidad', l.cantidad,
      'proveedor', l.proveedor, 'creado_en', l.creado_en,
      'activadas', (SELECT count(*) FROM pasaporte_placa p WHERE p.lote_id = l.id AND p.activada_en IS NOT NULL),
      'libres',    (SELECT count(*) FROM pasaporte_placa p WHERE p.lote_id = l.id AND p.activada_en IS NULL))
    ORDER BY l.creado_en DESC), '[]'::jsonb)
  FROM pasaporte_lote l
  WHERE is_admin();   -- gate: sin sesión de admin, cero filas (no un error)
$fn$;
REVOKE ALL ON FUNCTION public.listar_lotes() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.listar_lotes() TO authenticated;

-- ② prestadores → el admin lee todo por RLS (§9.3). Aditiva: no toca las policies
--    angostas de los no-admin (S84/S91). Sólo el admin (is_admin()) ve las 39 columnas.
DROP POLICY IF EXISTS prestadores_admin_lee_todo ON public.prestadores;
CREATE POLICY prestadores_admin_lee_todo ON public.prestadores
  FOR SELECT TO authenticated USING (is_admin());

-- ③ seller_perfil → idem.
DROP POLICY IF EXISTS seller_perfil_admin_lee_todo ON public.seller_perfil;
CREATE POLICY seller_perfil_admin_lee_todo ON public.seller_perfil
  FOR SELECT TO authenticated USING (is_admin());
