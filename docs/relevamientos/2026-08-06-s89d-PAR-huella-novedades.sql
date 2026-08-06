-- PAR S89-D · LA HUELLA DE NOVEDADES (contrato v2) — in-txn, ROLLBACK, residuo 0
-- Secuencia de la orden: huella presente → entrar sin tocar filas → huella
-- ausente → aviso nuevo → huella vuelve. + discriminador «leído intacto».
-- JWT real de guillo381+8 (la cuenta del fixture D-671 — los fixtures SOLO SE
-- LEEN, jamás se tocan). ±1 ms declarado (L-122a: now() constante en la txn).
BEGIN;
SET LOCAL request.jwt.claims = '{"sub":"dd024680-3d1c-4465-b38b-dedab45da037","role":"authenticated"}';

CREATE TEMP TABLE par_resultados (orden int, brazo text, esperado text, obtenido text, verde boolean);

DO $$
DECLARE
  v_uid uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';
  v_h boolean;
  v_antes int;
  v_despues int;
BEGIN
  -- estado virgen del asiento de ESTA app (el ROLLBACK lo restaura)
  DELETE FROM notificacion_campana_visita WHERE user_id = v_uid AND app = 'cliente';

  SELECT count(*) INTO v_antes FROM notificacion_intencion
   WHERE destinatario_user_id = v_uid AND leida_en IS NULL;

  -- BRAZO 1 · sin visita, con avisos transportables → huella PRESENTE
  SET LOCAL ROLE authenticated;
  v_h := public.hay_novedades('cliente');
  RESET ROLE;
  INSERT INTO par_resultados VALUES (1, 'huella presente (sin visita)', 'true', v_h::text, v_h IS TRUE);

  -- BRAZO 2 · entrar (registrar visita) SIN tocar filas → huella AUSENTE
  SET LOCAL ROLE authenticated;
  PERFORM public.registrar_visita_campana('cliente');
  v_h := public.hay_novedades('cliente');
  RESET ROLE;
  INSERT INTO par_resultados VALUES (2, 'la visita apaga la huella', 'false', v_h::text, v_h IS FALSE);

  -- BRAZO 2b · discriminador de la letra: leído POR AVISO intacto
  SELECT count(*) INTO v_despues FROM notificacion_intencion
   WHERE destinatario_user_id = v_uid AND leida_en IS NULL;
  INSERT INTO par_resultados VALUES (3, 'leído intacto (no-leídas antes=después)',
    v_antes::text, v_despues::text, v_antes = v_despues);

  -- BRAZO 3 · aviso NUEVO posterior a la visita → huella VUELVE
  -- (+1 ms declarado; la fila nace clonando la forma de una transportable
  --  REAL — jamás inventando el shape — con clave_dedup propia del par)
  INSERT INTO notificacion_intencion (tipo, categoria, destinatario_user_id, mascota_id, datos,
                                      clave_dedup, estado, en_sombra, resuelto_como, created_at)
  SELECT tipo, categoria, destinatario_user_id, mascota_id, datos,
         'par:s89d:huella-vuelve', estado, en_sombra, resuelto_como, now() + interval '1 millisecond'
    FROM notificacion_intencion
   WHERE destinatario_user_id = v_uid AND resuelto_como->>'despacho' = 'para_transporte'
   ORDER BY created_at DESC LIMIT 1;

  SET LOCAL ROLE authenticated;
  v_h := public.hay_novedades('cliente');
  RESET ROLE;
  INSERT INTO par_resultados VALUES (4, 'aviso nuevo re-enciende la huella', 'true', v_h::text, v_h IS TRUE);
END $$;

SELECT orden, brazo, esperado, obtenido, verde FROM par_resultados ORDER BY orden;
ROLLBACK;

-- ═══ RESULTADO (corrido 6-ago-2026 contra la DB viva, JWT real de +8) ═══
-- 1 · huella presente (sin visita)            esperado true  · obtenido true  ✅
-- 2 · la visita apaga la huella               esperado false · obtenido false ✅
-- 3 · leído intacto (no-leídas antes=después) esperado 7     · obtenido 7     ✅
-- 4 · aviso nuevo re-enciende la huella       esperado true  · obtenido true  ✅
-- Residuo post-ROLLBACK: par:s89d:huella-vuelve = 0 filas ·
-- fixtures D-671 (clave fixture:s88-campana:%) = 20 filas INTACTAS (solo lectura).
