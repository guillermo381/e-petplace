-- REVERSA de 20260808060000_s91a_vocabulario_gato_y_acuario.sql (escrita ANTES)
-- ⚠️ NOTA DE DATOS: el rename de `hizo_adentro` migró 1 chip VIVO. Esta
-- reversa lo devuelve a su código viejo — medir antes para saber si alguien
-- registró más con el código nuevo desde entonces:
--   SELECT codigo, count(*) FROM evento_bitacora_chips GROUP BY 1;
BEGIN;
UPDATE evento_bitacora_chips SET codigo='hizo_adentro' WHERE codigo='hizo_fuera_de_lugar';
UPDATE cat_conductas_bitacora SET codigo='hizo_adentro' WHERE codigo='hizo_fuera_de_lugar';
UPDATE cat_conductas_bitacora SET codigo='ladridos_excesivos' WHERE codigo='hizo_mas_ruido';
UPDATE cat_conductas_bitacora SET nombre_familia_en='Chewed something up at home'
 WHERE codigo='destrozo_objetos';
DELETE FROM cat_conductas_bitacora WHERE codigo IN
  ('agua_cambiada','bandeja_normal','bola_de_pelo','arano_muebles',
   'marco_con_orina','maullo_de_noche');
COMMIT;
