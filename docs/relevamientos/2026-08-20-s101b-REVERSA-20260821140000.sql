-- REVERSA de 20260821140000 — el vencimiento de la tarjeta. ESCRITA ANTES.
-- 🔴 NO deshace: los valores ya guardados se pierden con la columna, y el
--    proveedor no los vuelve a mandar salvo en un alta nueva. Revertir no es
--    volver atrás: es tirar un dato que ya no se puede recuperar sin pedirle a
--    la familia que cargue la tarjeta de nuevo.
ALTER TABLE public.tarjetas_guardadas
  DROP COLUMN IF EXISTS expira_mes,
  DROP COLUMN IF EXISTS expira_anio;
