-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260813002000_s96_alergia_entendimientos_grants.sql
-- Deshace: re-concede a authenticated los grants de escritura heredados del
-- default privilege. ⚠️ Revertir REABRE el residuo de L-140 en forma de tabla:
-- la RLS seguiría bloqueando (cero policies de escritura), pero el juez 45
-- vuelve a rojo — y con razón: un grant que la RLS tapa es una puerta a un
-- descuido futuro, no una defensa.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;
GRANT INSERT, UPDATE, DELETE ON public.alergia_entendimientos TO authenticated;
COMMIT;
