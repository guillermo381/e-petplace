-- S88-A · ☑️ EL ÚLTIMO ACTO — `in_app` gana transporte
--
-- 76(g) — VEDA: NO RIGE. **UNA fila de catálogo.**
--
-- ⚖️ LA LEY DE SECUENCIA, CUMPLIDA AL PIE (lámina de la campana, S88):
--     ① el LECTOR            ✅ 20260805280000
--     ② la PIEZA y la PANTALLA ✅ B (glifo + Badge) · C (avisos + techo)
--     ③ el GATE DEL FOUNDER  ✅ VERDE en dispositivo sobre 019fd58a-4157
--     ④ ESTA LÍNEA           ← el último acto, y solo ahora
--
-- **El founder programó una cita durante el gate y no le llegó nada. Era
-- CORRECTO:** `in_app` no tenía transporte y la ley decía que no lo tuviera
-- hasta que su pantalla existiera y él la viera. *Ese silencio no fue un
-- defecto: fue la ley funcionando, y es la cara «antes» de este par.*
--
-- PAR MEDIDO:
--   ANTES  — una intención nueva por el camino real → canal elegido = EMAIL,
--            0 en la campana.
--   DESPUÉS — la misma → canal elegido = IN_APP y aparece en la campana.

BEGIN;

UPDATE cat_notificacion_canales
   SET transporte_vivo = true
 WHERE codigo = 'in_app';

DO $belt$
DECLARE v_vivo boolean; v_orden int;
BEGIN
  SELECT transporte_vivo, orden INTO v_vivo, v_orden
  FROM cat_notificacion_canales WHERE codigo = 'in_app';
  IF NOT v_vivo THEN RAISE EXCEPTION 'CINTURON: in_app sigue sin transporte'; END IF;

  -- ⚠️ Y EL QUE IMPORTA TANTO COMO EL OTRO: `in_app` es el canal de ORDEN 1,
  --    así que encenderlo lo vuelve el PRIMERO en la selección. El correo
  --    deja de ganar por descarte donde in_app está habilitado — que es lo
  --    que la enmienda §7 dice, y ahora rige de verdad.
  IF v_orden <> 1 THEN
    RAISE EXCEPTION 'CINTURON: in_app dejó de ser el piso (orden %) — la selección cambia de forma', v_orden;
  END IF;
  RAISE NOTICE 'CINTURON VERDE: in_app con transporte, y sigue siendo el piso (orden 1).';
END
$belt$;

COMMIT;
