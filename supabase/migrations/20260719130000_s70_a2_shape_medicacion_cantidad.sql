-- S70-A2 (1/1 SHAPE) — evento_medicacion_prescrita gana `cantidad`
-- (decisión founder: la HC OkVet de Thor dicta "Enzimax, tabletas,
-- Cantidad: 10"). numeric NULL honesto — la cantidad no siempre se dicta.
-- Nada más se toca del shape. 76(g): aditiva pura, no rige.
ALTER TABLE public.evento_medicacion_prescrita
  ADD COLUMN IF NOT EXISTS cantidad numeric;

COMMENT ON COLUMN public.evento_medicacion_prescrita.cantidad IS
  'Cantidad total dispensada/indicada (p.ej. 10 tabletas). NULL honesto si el vet no la dictó (S70-A2).';
