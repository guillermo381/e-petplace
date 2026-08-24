-- ============================================================================
-- REVERSA de `20260823210000_s104a_invitacion_familia.sql`
-- Escrita ANTES de aplicar. S104-A · tanda 2 · 23-ago-2026
-- ============================================================================
--
-- ⚠️ QUÉ NO DESHACE:
--
--   1. **Los vínculos ya creados por una aceptación NO se revierten.** Si alguien
--      aceptó una invitación, su fila de `familia_miembro` y sus filas de
--      `mascota_familiar_autorizado` **quedan**. Borrarlas sería sacar a una
--      persona de la familia de una mascota sin que nadie lo decida — y eso, en
--      esta casa, es un acto de gobierno (P1), no una reversión técnica.
--      Para sacar a alguien: se le da de baja con `hasta` y `motivo_baja`, que es
--      el camino que el modelo ya tiene.
--
--   2. **Los índices únicos parciales se caen con la reversa**, y eso REABRE la
--      posibilidad de vínculos duplicados (dos filas activas del mismo user en la
--      misma familia / sobre la misma mascota). Se midió 0 duplicados antes de
--      crearlos; revertir no los crea, pero deja de impedirlos.
--
--   3. Las invitaciones pendientes se pierden con la tabla. Nadie queda a medio
--      camino salvo que tuviera el enlace sin usar: ese enlace deja de resolver.
-- ============================================================================

begin;

drop function if exists public.revocar_invitacion_familia(uuid);
drop function if exists public.aceptar_invitacion_familia(text);
drop function if exists public.invitar_a_familia(uuid, text, text);

drop table if exists public.familia_invitaciones;

drop index if exists public.ux_familia_miembro_activo;
drop index if exists public.ux_mascota_familiar_autorizado_activo;

commit;
