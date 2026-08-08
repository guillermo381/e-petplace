-- REVERSA de 20260807190000_s91a_grants_l140_tablas.sql (escrita ANTES)
-- Restaura el default FLOJO de Supabase sobre las tres tablas nuevas.
-- ⚠️ Correrla REABRE la puerta que la migración cerró: anon vuelve a tener
-- INSERT/UPDATE/DELETE a nivel tabla (hoy los bloquea solo la RLS). Se
-- revierte únicamente si algo se rompió por falta de grant, y se declara.

BEGIN;

GRANT ALL ON TABLE public.cat_razas TO anon, authenticated;
GRANT ALL ON TABLE public.cat_hitos_narrativos TO anon, authenticated;
GRANT ALL ON TABLE public.evento_hito_narrativo TO anon, authenticated;

COMMIT;
