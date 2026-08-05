-- S88-A · FIXTURE TANDA ③ — el par con el admin (exige apagar su pata de
-- plataforma ⇒ vive acá, no en la migración). in-txn ROLLBACK.
BEGIN;
DO $$
DECLARE
  v_admin uuid := '29cd91e2-7f31-47d2-ab16-166ce100e3bd';
  v_tit uuid := '4f572081-26a5-4d3b-9d80-25ea751fdc9c';
  v_rol text := current_user; v_n int; v_r text := '';
BEGIN
  UPDATE admin_users SET activo=false WHERE id=v_admin;
  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_admin,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE prestador_especialidades SET prestador_id=prestador_id; GET DIAGNOSTICS v_n=ROW_COUNT; v_r:=v_r||'especialidades='||v_n||' ';
  UPDATE prestador_zonas          SET prestador_id=prestador_id; GET DIAGNOSTICS v_n=ROW_COUNT; v_r:=v_r||'zonas='||v_n||' ';
  UPDATE prestador_bloqueos       SET prestador_id=prestador_id; GET DIAGNOSTICS v_n=ROW_COUNT; v_r:=v_r||'bloqueos='||v_n||' ';
  UPDATE prestador_documentos     SET prestador_id=prestador_id; GET DIAGNOSTICS v_n=ROW_COUNT; v_r:=v_r||'documentos='||v_n||' ';
  UPDATE prestador_servicio_tallas SET prestador_servicio_id=prestador_servicio_id; GET DIAGNOSTICS v_n=ROW_COUNT; v_r:=v_r||'tallas='||v_n||' ';
  UPDATE prestador_programas      SET prestador_servicio_id=prestador_servicio_id; GET DIAGNOSTICS v_n=ROW_COUNT; v_r:=v_r||'programas='||v_n;
  EXECUTE format('SET LOCAL ROLE %I', v_rol);
  PERFORM set_config('epp.t3', v_r, true);
END $$;
-- ⚠️ LECTURA DEL RESULTADO — los ceros NO son «no puede», son «no hay».
-- Medido en la misma corrida: Aurora tiene 0 zonas, 0 tallas, 0 programas y
-- 0 bloqueos; el resto de esas tablas pertenece a OTROS prestadores.
--   documentos = 2 escritos de 9 totales  ← prueba LAS DOS MITADES:
--     escribe lo suyo (2 de Aurora) y NO TOCA lo ajeno (los otros 7).
-- Las cuatro tablas vacías para Aurora quedan SIN PROBAR y se declara:
-- un fixture no puede probar una policy sobre una tabla sin filas.
SELECT current_setting('epp.t3', true) AS admin_escribe_las_seis,
       (SELECT count(*) FROM prestador_documentos) AS documentos_totales,
       (SELECT count(*) FROM prestador_documentos
         WHERE prestador_id='de680000-0000-4000-8000-0000000000e5') AS documentos_de_aurora;
ROLLBACK;
