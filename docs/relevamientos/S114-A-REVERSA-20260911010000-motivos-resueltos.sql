-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260911010000_s114a_motivos_resueltos.sql`  (A10)
-- Escrita ANTES de aplicar. S114-A · 7-sep-2026.
--
-- QUÉ DESHACE: la definición única del conjunto resuelto y su predicado.
--
-- 🔴 QUÉ **NO** DESHACE, y es lo que hay que saber antes de correrla:
--   Revertir esto NO devuelve el sistema a «antes»: lo devuelve a un estado
--   donde CADA LECTOR vuelve a escribir su propio SELECT sobre el catálogo —
--   que es exactamente el defecto que esta migración vino a hacer inexpresable.
--   Si para entonces ya hay dos lectores, revertir los deja divergir en
--   silencio: ninguno falla, cada uno ofrece una lista distinta.
--   ⇒ Antes de revertir, censar consumidores:
--        select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--        where n.nspname='public' and pg_get_functiondef(p.oid)
--              ~* '(v_motivos_resueltos|_motivo_pertenece_al_objeto)';
--      y en el repo:  grep -rn "motivos_resueltos\|motivosDeObjeto" packages/ apps/
-- ═══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public._motivo_pertenece_al_objeto(text, text);
DROP VIEW     IF EXISTS public.v_motivos_resueltos;
DROP TABLE    IF EXISTS public.cat_motivos_herencia;
