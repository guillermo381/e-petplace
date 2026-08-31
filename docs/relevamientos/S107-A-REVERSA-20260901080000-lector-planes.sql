/* REVERSA de `20260901080000_s107a_lector_de_planes.sql` — escrita ANTES.
   🔴 QUÉ NO DESHACE: sin este lector, `ya_tienes_plan_activo` puede decir que
   NO pero la pantalla **no puede llevar al plan que ya existe** — el id viaja
   en el texto del rebote y parsearlo está prohibido (regla 35). El rebote
   vuelve a ser mudo con mejores palabras. */
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_mis_planes_guarderia();
COMMIT;
