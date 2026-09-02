/* ═══════════════════════════════════════════════════════════════════════════
   S112-A · LA PURGA VOLVIO A PERDER EL FORMULARIO
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.** Se re-crea una funcion; cero datos se tocan.

   🔴 MEDIDO CONTRA `pg_proc` AL VERIFICAR LO APLICADO (`L-486`), no contra un
   arnes:

     purga · conoce desistida ......... true    ← la cura de D entro
     purga · borra respuestas ......... **false** ← 🔴 la mia se PERDIO
     purga · llama al clasificador .... true

   `A7` le habia enseñado a la purga a borrar `respuestas` y `aceptacion_id`
   —**el founder firmo «a los 90 dias se borra el formulario Y la identidad»**—
   y la migracion de D **re-creo la funcion entera** sin esa linea.

   ── NO ES CULPA DE D NI DE A: es la forma. **Dos pistas curando la MISMA
      funcion por `CREATE OR REPLACE` no se pisan un poco: la ultima se lleva
      todo lo de la primera.** Y no falla al aplicar —las dos migraciones dan
      verde— porque cada una prueba SU cura y ninguna prueba la ajena.

      *El unico instrumento que lo ve es preguntarle al objeto por las DOS
      propiedades, y por eso este cinturon mide las dos.*

   ── LA CURA ESTRUCTURAL, para que no vuelva a pasar: el cinturon de abajo
      **exige las dos a la vez**. Cualquiera que re-cree esta funcion y pierda
      una de las dos mitades se entera al aplicar, no tres meses despues.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

DO $fix$
DECLARE v_def text; v_nueva text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='purgar_postulaciones_vencidas';
  IF v_def IS NULL THEN RAISE EXCEPTION 'FIX: la purga no existe'; END IF;
  IF position('respuestas = NULL' in v_def) > 0 THEN
    RAISE NOTICE 'FIX: la purga ya borraba el formulario'; RETURN;
  END IF;

  v_nueva := replace(v_def,
    'SET solicitante_user_id = NULL, anonimizada_en = now()',
    'SET solicitante_user_id = NULL, anonimizada_en = now(),' || chr(10) ||
    '           /* 🔴 EL FORMULARIO TAMBIEN. El founder firmo «se borra el' || chr(10) ||
    '              formulario Y la identidad» (1-sep). Esta linea se escribio en' || chr(10) ||
    '              `A7`, se perdio cuando otra migracion re-creo la funcion, y' || chr(10) ||
    '              volvio acá. El cinturon de esta migracion exige las DOS' || chr(10) ||
    '              mitades para que la proxima re-creacion no se lleve una. */' || chr(10) ||
    '           respuestas = NULL, aceptacion_id = NULL');
  IF v_nueva = v_def THEN
    RAISE EXCEPTION 'FIX: no encontre el UPDATE de anonimizacion — mirar el cuerpo antes de tocar';
  END IF;

  /* El clasificador de COLUMNAS tambien se llama: es el que hace sonar la
     purga si mañana alguien agrega una columna y no dice si se borra. */
  IF position('_columnas_solicitud_clasificadas' in v_nueva) = 0 THEN
    v_nueva := replace(v_nueva, '  RETURN jsonb_build_object(',
      '  PERFORM public._columnas_solicitud_clasificadas();' || chr(10) ||
      '  RETURN jsonb_build_object(');
  END IF;
  EXECUTE v_nueva;
END $fix$;

/* ═══ CINTURON — EL ROJO ES UNA `desistida` DE VERDAD, PURGADA DE VERDAD ═══ */
DO $cint$
DECLARE
  v_def text; v_pub uuid; v_uid uuid; v_sol uuid; v_r jsonb; v_f record; v_n int;
BEGIN
  /* ── ① 🔴 LAS DOS MITADES, A LA VEZ. Este es el brazo que hace que una
     re-creacion futura no pueda llevarse una sola. */
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='purgar_postulaciones_vencidas';
  IF position('desistida' in v_def) = 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ①a: la purga no conoce `desistida` — se perdio la cura de D';
  END IF;
  IF position('respuestas = NULL' in v_def) = 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ①b: la purga no borra el formulario — se perdio la cura de A7';
  END IF;

  /* ── ② EL ROJO POR CAMINO REAL: una `desistida` con fecha vieja se anonimiza.
     Se SIEMBRA y se deshace: correr la purga sobre una solicitud real
     anonimizaria a una persona desde una migracion (`L-406`). */
  SELECT p.id INTO v_pub FROM adopcion_publicacion p LIMIT 1;
  SELECT s.solicitante_user_id INTO v_uid FROM adopcion_solicitud s
   WHERE s.solicitante_user_id IS NOT NULL LIMIT 1;
  IF v_pub IS NULL OR v_uid IS NULL THEN
    RAISE EXCEPTION 'CINTURON: falta publicacion o usuario — el brazo no puede dar verde por vacio';
  END IF;

  INSERT INTO adopcion_solicitud (publicacion_id, solicitante_user_id, country_code,
                                  estado, cerrada_en, respuestas, aceptacion_id)
  VALUES (v_pub, v_uid, 'EC', 'desistida', now() - interval '100 days',
          '{"hogar":{"adultos":2,"menores_0_5":1,"menores_6_12":0,"menores_13_17":0},
            "vivienda":"departamento","horas_solo":8,"motivo":"sonda de la purga"}'::jsonb,
          NULL)
  RETURNING id INTO v_sol;

  /* ②b CONTROL POSITIVO PRIMERO (`L-482`): la fila sembrada TIENE identidad y
     formulario. Sin esto, un verde de abajo podria ser el de una fila vacia. */
  SELECT solicitante_user_id, respuestas, anonimizada_en INTO v_f
    FROM adopcion_solicitud WHERE id = v_sol;
  IF v_f.solicitante_user_id IS NULL OR v_f.respuestas IS NULL THEN
    RAISE EXCEPTION 'CINTURON ROJO ②b: la fixture nacio sin identidad o sin formulario';
  END IF;

  v_r := public.purgar_postulaciones_vencidas();

  SELECT solicitante_user_id, respuestas, aceptacion_id, anonimizada_en INTO v_f
    FROM adopcion_solicitud WHERE id = v_sol;
  IF v_f.solicitante_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURON ROJO ②: la identidad de una `desistida` de 100 dias sobrevivio';
  END IF;
  IF v_f.respuestas IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURON ROJO ②c: EL FORMULARIO sobrevivio — se borro la identidad y quedo el hogar declarado';
  END IF;
  IF v_f.anonimizada_en IS NULL THEN
    RAISE EXCEPTION 'CINTURON ROJO ②d: no quedo marcada como anonimizada';
  END IF;

  /* ── ③ CONTROL NEGATIVO: una `desistida` RECIENTE **no** se toca. Sin este
     brazo, una purga que anonimizara todo pasaria ② igual. */
  DELETE FROM adopcion_solicitud WHERE id = v_sol;
  INSERT INTO adopcion_solicitud (publicacion_id, solicitante_user_id, country_code,
                                  estado, cerrada_en, respuestas)
  VALUES (v_pub, v_uid, 'EC', 'desistida', now() - interval '3 days',
          '{"hogar":{"adultos":1,"menores_0_5":0,"menores_6_12":0,"menores_13_17":0},
            "vivienda":"otro","horas_solo":2,"motivo":"sonda reciente"}'::jsonb)
  RETURNING id INTO v_sol;

  PERFORM public.purgar_postulaciones_vencidas();
  SELECT solicitante_user_id, respuestas INTO v_f FROM adopcion_solicitud WHERE id = v_sol;
  IF v_f.solicitante_user_id IS NULL OR v_f.respuestas IS NULL THEN
    RAISE EXCEPTION 'CINTURON ROJO ③: una desistida de 3 dias fue purgada — el plazo no se respeta';
  END IF;

  RAISE NOTICE 'CINTURON: 4 brazos verdes (2 rojos producidos, 1 positivo primero, 1 control negativo) · purga: %', v_r;

  DELETE FROM adopcion_solicitud WHERE id = v_sol;
  SELECT count(*) INTO v_n FROM adopcion_solicitud
   WHERE respuestas->>'motivo' LIKE 'sonda%';
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: residuo % solicitud(es) de sonda', v_n; END IF;
END $cint$;

COMMIT;
