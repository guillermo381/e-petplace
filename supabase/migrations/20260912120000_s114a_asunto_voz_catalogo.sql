-- S114-A · el asunto de los avisos usa la VOZ del catálogo, no el código del motor.
-- Firma del founder (9-sep, antes del primer WhatsApp real): el asunto salía
-- «guarderia_dia de Thor» —un identificador del motor— y va a un WhatsApp real.
-- La voz existe en el motor: tipos_servicio.nombre («Guardería por Día», «Paseo de
-- Mascotas», «Teleconsulta»), keyed por codigo. _asunto_del_caso usaba v_o.titulo
-- (el código) en el brazo ELSE; ahora lo resuelve por el catálogo. Es la 4ª vez en
-- el arco que un identificador del motor se cuela a una superficie — acá se cierra
-- por mapeo, no a ojo.
--
-- 76(g) NO RIGE (DB, sin anclas de OTA). Reversa ANTES en docs/relevamientos.

CREATE OR REPLACE FUNCTION public._asunto_del_caso(p_tipo text, p_id uuid)
 RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_o record; v_masc text; v_voz text;
BEGIN
  IF p_tipo = 'pedido' THEN RETURN 'tu pedido'; END IF;   -- despensa: sin mascota
  SELECT * INTO v_o FROM _caso_dueno_del_objeto(p_tipo, p_id);
  SELECT nombre INTO v_masc FROM mascotas WHERE id = v_o.mascota_id;
  -- 🔴 LA VOZ DEL SERVICIO VIVE EN EL CATÁLOGO (tipos_servicio.nombre), no en el
  --    código. v_o.titulo es el código (p.ej. 'guarderia_dia'); se traduce acá.
  SELECT nombre INTO v_voz FROM tipos_servicio WHERE codigo = v_o.titulo;
  v_voz := COALESCE(v_voz, v_o.titulo, 'servicio');
  IF v_masc IS NULL THEN RETURN v_voz; END IF;
  RETURN CASE
    WHEN p_tipo = 'estadia' THEN 'la guardería de ' || v_masc
    ELSE v_voz || ' de ' || v_masc   -- «Guardería por Día de Thor», jamás «guarderia_dia de Thor»
  END;
END $function$;
REVOKE ALL ON FUNCTION public._asunto_del_caso(text,uuid) FROM anon, PUBLIC;

-- ── CINTURÓN · sobre un caso REAL (b346b2d8, cita guarderia_dia de Zeus) ──────
DO $cinturon$
DECLARE v_asunto text; v_esperado text;
BEGIN
  v_esperado := (SELECT nombre FROM tipos_servicio WHERE codigo='guarderia_dia');  -- 'Guardería por Día'
  v_asunto := _asunto_del_caso('cita', (SELECT objeto_id FROM casos_postventa WHERE id='b346b2d8-2b3e-4f04-9208-dea387026ca1'));
  IF v_asunto ILIKE '%guarderia_dia%' THEN
    RAISE EXCEPTION 'CINTURÓN: el asunto TODAVÍA trae el código crudo: %', v_asunto;
  END IF;
  IF position(v_esperado in v_asunto) = 0 THEN
    RAISE EXCEPTION 'CINTURÓN: el asunto no usa la voz del catálogo (%). asunto=%', v_esperado, v_asunto;
  END IF;
  RAISE NOTICE 'CINTURÓN VERDE · asunto por catálogo: "%" (voz "%", cero código crudo)', v_asunto, v_esperado;
END $cinturon$;
