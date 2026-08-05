-- S87-A · LOTE 1 — coherencia con la ley que esta misma sesión escribió.
-- `_trg_mascotas_purga_cola_memorial` quedó con `authenticated=X` por default
-- de Supabase. NO es un agujero (una función de trigger llamada directo rebota
-- 'can only be called as a trigger'), pero la ley de S87 dice que el REVOKE
-- nombra a `authenticated` también — y una ley que su propio autor no aplica
-- deja de ser ley. 76(g): NO RIGE. Reversa: el GRANT inverso.
REVOKE EXECUTE ON FUNCTION public._trg_mascotas_purga_cola_memorial() FROM PUBLIC, anon, authenticated;
