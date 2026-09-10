-- REVERSA de 20260912160000_s114a_estadia_no_ejecutado.sql
-- Escrita ANTES de aplicar (regla 76).
--
-- ⚠️ NO SIEMPRE PUEDE REVERTIR. La migración agrega 'no_ejecutado' al CHECK de
-- guarderia_estadias para que el reloj F1 pueda marcar las estadías que cruzaron
-- las 48 h. Una vez que el reloj marcó una fila 'no_ejecutado', quitar el valor
-- del CHECK haría que esa fila viole su propio CHECK ⇒ el ALTER falla.
-- Por eso esta reversa ABORTA si existe alguna fila 'no_ejecutado', diciendo por
-- qué, en vez de romper. Para revertir de verdad habría que decidir a qué estado
-- vuelven esas estadías — decisión de producto, no de reversa.

DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM guarderia_estadias WHERE estado = 'no_ejecutado';
  IF v_n > 0 THEN
    RAISE EXCEPTION 'REVERSA IMPOSIBLE: % estadías ya están en no_ejecutado; quitarlo del CHECK las dejaría inválidas. Decidí primero a qué estado vuelven.', v_n;
  END IF;
END $$;

ALTER TABLE guarderia_estadias DROP CONSTRAINT guarderia_estadias_estado_check;
ALTER TABLE guarderia_estadias ADD CONSTRAINT guarderia_estadias_estado_check
  CHECK (estado = ANY (ARRAY['reservada','recogida_en_curso','en_guarderia',
    'retorno_en_curso','entregada','cancelada','no_recogida']));
