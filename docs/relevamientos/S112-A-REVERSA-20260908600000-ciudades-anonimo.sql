-- REVERSA de 20260908600000 · la vidriera anónima deja de ver el catálogo de ciudades.
-- ⚠️ Revertir NO da error en ningún lado: vuelve a leer cero filas con 200.
-- El filtro «Ciudad» de adopción queda vacío para quien mira sin sesión, y
-- eso se lee como «no hay ciudades cargadas». **Un grant sin policy no falla:
-- calla** — por eso esta reversa avisa en vez de deshacer en silencio.
DO $r$ BEGIN RAISE WARNING 'REVERSA: la vidriera anonima vuelve a leer 0 ciudades, sin error'; END $r$;
DROP POLICY IF EXISTS cat_ciudades_select_anon ON public.cat_ciudades;
