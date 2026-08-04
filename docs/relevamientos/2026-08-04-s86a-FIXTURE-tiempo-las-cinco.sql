-- L-199 · EL ROJO ANTES. El desfase se simula con una zona ADELANTADA
-- (UTC+14): `current_date` dice un día que NO es el del negocio —
-- exactamente lo que pasa en Guayaquil entre las 19:00 y las 24.
BEGIN;
SET LOCAL timezone = 'Pacific/Kiritimati';
CREATE TEMP TABLE r(paso text, resultado text) ON COMMIT DROP;
GRANT SELECT, INSERT ON r TO authenticated;

INSERT INTO r
SELECT 'A · el desfase que se simula',
       'current_date=' || current_date || ' · día real Guayaquil=' ||
       (now() AT TIME ZONE 'America/Guayaquil')::date;

SET LOCAL role authenticated;
SET LOCAL request.jwt.claims = '{"sub":"dd024680-3d1c-4465-b38b-dedab45da037","role":"authenticated"}';

DO $$
DECLARE e text;
        v_manana date := (now() AT TIME ZONE 'America/Guayaquil')::date + 1;
        v_m uuid;
BEGIN
  SELECT id INTO v_m FROM mascotas WHERE user_id = 'dd024680-3d1c-4465-b38b-dedab45da037' LIMIT 1;
  PERFORM public.registrar_desparasitacion(v_m, 'fixture-s86a', NULL, v_manana, NULL, NULL);
  INSERT INTO r VALUES ('B · desparasitación con fecha de MAÑANA',
    '⚠️ LA ACEPTÓ — el guard "no futuro" no ve el día del negocio');
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS e = MESSAGE_TEXT;
  INSERT INTO r VALUES ('B · desparasitación con fecha de MAÑANA', 'rebotó: ' || e);
END $$;

SELECT * FROM r ORDER BY paso;
ROLLBACK;
