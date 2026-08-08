-- REVERSA de 20260808020000_s91a_vocabulario_bitacora_universal.sql
-- ⚠️ Deshace una FIRMA EN BLOQUE del founder (8-ago-2026) y REPONE el guard:
-- la bitácora vuelve a exigir programa o cita de adiestramiento activa.
-- Nota de datos: los chips ya registrados con códigos nuevos quedarían
-- huérfanos del catálogo (no hay FK, así que no rompe: quedan mudos).
-- Medir antes:  SELECT codigo, count(*) FROM evento_bitacora_chips GROUP BY 1;
BEGIN;
DELETE FROM cat_conductas_bitacora WHERE codigo IN (
  'no_quiso_comer','se_escondio','se_rasco_o_lamio','vomito','se_arranco_plumas',
  'costo_moverse','agua_turbia','habitante_no_bien','comieron_todos');
UPDATE cat_conductas_bitacora SET codigo='jugo_con_otros_perros',
       nombre_familia='Jugó bien con otros perros', nombre_familia_en='Played well with other dogs'
 WHERE codigo='convivio_bien';
UPDATE cat_conductas_bitacora SET nombre_familia='Hizo sus necesidades adentro',
       nombre_familia_en='Had an accident indoors' WHERE codigo='hizo_adentro';
UPDATE cat_conductas_bitacora SET nombre_familia='Ladró más de lo normal',
       nombre_familia_en='Barked more than usual' WHERE codigo='ladridos_excesivos';
UPDATE cat_conductas_bitacora SET nombre_familia='Lloró cuando salimos',
       nombre_familia_en='Cried when we left' WHERE codigo='lloro_al_quedarse_solo';
UPDATE cat_conductas_bitacora SET es_seed_preliminar = true;
ALTER TABLE cat_conductas_bitacora DROP COLUMN IF EXISTS especies_aplicables;
ALTER TABLE cat_conductas_bitacora DROP COLUMN IF EXISTS sujetos_aplicables;
-- El guard vuelve re-aplicando el body previo: vive en el historial de esta
-- misma migración (sección ⑤), no se duplica acá.
COMMIT;
