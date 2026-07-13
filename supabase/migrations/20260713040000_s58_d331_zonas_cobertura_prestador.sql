-- ═══════════════════════════════════════════════════════════════════
-- S58-A · D-331 — ZONAS DE COBERTURA DEL PRESTADOR: contrato mínimo v1
-- Decisión founder S58: v1 DECLARATIVA (el dueño ve "Cubre: …"; el
-- motor NO filtra aún — el filtro es deuda nueva con disparo propio,
-- D-367) + jerarquía CIUDAD → ZONAS colgando de country_config (un
-- prestador puede cubrir Bogotá Y Quito — cruza país).
--
-- RELEVAMIENTO PREVIO (L-144, reporte en sesión): `zonas_cobertura`
-- es de ENVÍOS (transportista/tarifas, 20 filas, policies admin/read,
-- CERO callers en funciones) y `cat_zonas_trabajo_grooming` es del
-- CUERPO en grooming — NINGUNA se toca. `country_config` NO tiene
-- geografía de ciudades (config por país: EC activo, CO inactivo) →
-- decisión técnica (doble check con el relevamiento): nace el catálogo
-- puente `cat_ciudades` (regla 21) FK a country_config(country_code)
-- UNIQUE, y la cobertura declarada `prestador_zonas` como puente
-- prestador → ciudad.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1 · Catálogo de ciudades (la geografía que faltaba) ──────────────
CREATE TABLE IF NOT EXISTS public.cat_ciudades (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL REFERENCES public.country_config(country_code),
  nombre       text NOT NULL,
  activo       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_cat_ciudades_pais_nombre UNIQUE (country_code, nombre)
);

COMMENT ON TABLE public.cat_ciudades IS
  'S58/D-331: geografía nivel CIUDAD colgando de country_config. Catálogo administrado (admin escribe); la cobertura del prestador (prestador_zonas) y — a futuro — direcciones/filtros cuelgan de acá.';

ALTER TABLE public.cat_ciudades ENABLE ROW LEVEL SECURITY;

-- lectura: todo authenticated ve las activas (patrón cat_*)
CREATE POLICY cat_ciudades_select_authenticated ON public.cat_ciudades
  FOR SELECT TO authenticated USING (activo = true OR is_admin());
-- escritura: solo admin (catálogo administrado)
CREATE POLICY cat_ciudades_admin ON public.cat_ciudades
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Seed: las 8 ciudades EC ya vivas en el negocio (zonas_cobertura de
-- envíos las usa como texto) + Bogotá CO (el ejemplo literal del
-- founder: la cobertura cruza país).
INSERT INTO public.cat_ciudades (country_code, nombre) VALUES
  ('EC', 'Ambato'), ('EC', 'Cuenca'), ('EC', 'Guayaquil'), ('EC', 'Ibarra'),
  ('EC', 'Loja'), ('EC', 'Manta'), ('EC', 'Quito'), ('EC', 'Santo Domingo'),
  ('CO', 'Bogotá')
ON CONFLICT (country_code, nombre) DO NOTHING;

-- ── 2 · La cobertura DECLARADA del prestador ─────────────────────────
CREATE TABLE IF NOT EXISTS public.prestador_zonas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  ciudad_id    uuid NOT NULL REFERENCES public.cat_ciudades(id) ON DELETE RESTRICT,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_prestador_zonas UNIQUE (prestador_id, ciudad_id)
);

COMMENT ON TABLE public.prestador_zonas IS
  'S58/D-331 v1 DECLARATIVA: la fila declara "cubre esta ciudad" — presencia = declarada, borrado = ya no. El motor de slots/oferta NO la consulta todavía (D-367, disparo propio). La v1 no miente: declara, no filtra.';

ALTER TABLE public.prestador_zonas ENABLE ROW LEVEL SECURITY;

-- el prestador escribe LAS SUYAS (predicado de propiedad de la casa,
-- espejo de prestador_servicios_own)
CREATE POLICY prestador_zonas_own ON public.prestador_zonas
  FOR ALL TO authenticated
  USING (prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()) OR is_admin())
  WITH CHECK (prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()) OR is_admin());

-- lectura pública de las DECLARADAS de prestadores activos (la ficha
-- del paseador mostrará "Cubre: …" — espejo de ps_public)
CREATE POLICY prestador_zonas_public ON public.prestador_zonas
  FOR SELECT TO authenticated
  USING (prestador_id IN (SELECT id FROM public.prestadores WHERE estado = 'activo') OR is_admin());

CREATE INDEX IF NOT EXISTS idx_prestador_zonas_prestador ON public.prestador_zonas (prestador_id);
CREATE INDEX IF NOT EXISTS idx_prestador_zonas_ciudad ON public.prestador_zonas (ciudad_id);

-- Sin funciones nuevas → sin proacl que verificar (L-140 no aplica);
-- las tablas quedan bajo RLS: anon no tiene policy → no ve nada.
