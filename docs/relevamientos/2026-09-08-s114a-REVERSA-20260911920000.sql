-- REVERSA de 20260911920000_s114a_lectores_admin_legado.sql — escrita ANTES.
DROP FUNCTION IF EXISTS public.listar_lotes();
DROP POLICY IF EXISTS prestadores_admin_lee_todo ON public.prestadores;
DROP POLICY IF EXISTS seller_perfil_admin_lee_todo ON public.seller_perfil;
-- NO revierte datos. Revertir RE-CIERRA las 8 pantallas del admin legado.
