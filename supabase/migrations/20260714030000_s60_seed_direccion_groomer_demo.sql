-- ============================================================================
-- S60-A2 — SEED APROBADO (founder): el DÓNDE del groomer demo.
--
-- Hueco reportado en el cierre A1 (condición 4 del visto L-144): el único
-- groomer OFERTABLE ([DEMO S44] Paseos Andres, cuenta activa, 6 tallas)
-- tenía direccion/ciudad NULL — los gates founder 4/5 (el QUIÉN y el
-- checkout) veían el fallback "En el local del groomer" en vez de la
-- experiencia real. Dirección CON MARCA DEMO (regla de la casa: cero
-- datos sin marca), acotada al prestador demo por id + nombre.
-- ============================================================================

UPDATE prestadores
SET direccion = '[DEMO S44] Av. República del Salvador y Suecia, local 3',
    ciudad    = 'Quito',
    updated_at = now()
WHERE id = 'de300000-0000-4000-8000-0000000000e5'
  AND nombre_comercial LIKE '[DEMO S44]%'
  AND direccion IS NULL;
