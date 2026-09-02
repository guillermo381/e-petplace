-- REVERSA de 20260908540000 · `prestadores.tipo` deja de aceptar 'refugio' y
-- `obtener_adoptables` pierde el filtro por publicador.
-- 🔴 REVERTIR CON UNA FILA 'refugio' VIVA FALLA: el CHECK la rechazaría. Se
-- borran primero, y eso BORRA LA VITRINA del refugio (portada, logo, historia).
DO $r$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM prestadores WHERE tipo='refugio';
  IF v_n > 0 THEN
    RAISE WARNING 'REVERSA: se borran % fila(s) de refugio — su vitrina se pierde', v_n;
    DELETE FROM prestador_fotos WHERE prestador_id IN (SELECT id FROM prestadores WHERE tipo='refugio');
    DELETE FROM prestadores WHERE tipo='refugio';
  END IF;
END $r$;
ALTER TABLE public.prestadores DROP CONSTRAINT prestadores_tipo_check;
ALTER TABLE public.prestadores ADD CONSTRAINT prestadores_tipo_check
  CHECK (tipo = ANY (ARRAY['clinica_veterinaria','veterinario_independiente','grooming',
                           'paseador','hotel_mascotas','adiestramiento','laboratorio','otro']));
-- `obtener_adoptables` se recupera de pg_get_functiondef del commit anterior.
