-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de «EL INAPAGABLE MIRA TAMBIÉN EL PASADO» (S112-D)
--
-- ⚠️ ESCRITA ANTES QUE LA MIGRACIÓN.
--
-- 🔴 LO QUE NO DESHACE, y es lo que importa: **revertir esto NO devuelve un
--    estado neutro.** Devuelve el estado medido el 2-sep: el `CHECK` sigue
--    protegiendo las escrituras NUEVAS y **vuelve a ser ciego al pasado**. Si
--    para entonces alguna categoría ya pasó a inapagable con filas apagadas
--    debajo, revertir **las deja ahí, calladas** — y esas filas significan
--    personas que no reciben un aviso que la casa declaró obligatorio.
--
-- Autor: pista D (S112) · para: pista A (e-petplace-78)
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP TRIGGER IF EXISTS trg_categorias_inapagable_mira_el_pasado
  ON public.cat_notificacion_categorias;
DROP FUNCTION IF EXISTS public._categorias_inapagable_mira_el_pasado();

COMMIT;
