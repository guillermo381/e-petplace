/* ═══════════════════════════════════════════════════════════════════════════
   S112-A · EL ACTA NO SE FIRMA CON EL ANIMAL EN MEMORIAL
   ───────────────────────────────────────────────────────────────────────────
   🟢 **FIRMA DEL FOUNDER (2-sep).** Hasta hoy el motor lo permitia, y A lo
   habia declarado como DECISION —*«lo que hay que poder cerrar es el tramite,
   no la adopcion»*—. **El founder decidio lo contrario, y es su llamada:** un
   acta de adopcion de un animal que murio no es un tramite que se cierra, es un
   documento que no tiene objeto.

   76(g) · VEDA: **NO RIGE.** CHECKs ensanchados sobre filas que siguen validas.

   ── EL ESTADO NUEVO ES PROPIO, no `declinada`. **Declinar es un acto del
      publicador**; acá no decidio nadie — murio el animal. Reusar `declinada`
      le diria a la familia «el refugio no continuo con tu postulacion» sobre
      algo que el refugio no eligio. *Y el que lee el expediente dentro de un año
      no tendria como distinguir las dos cosas.*

   ── LA VOZ ES DE DUELO Y **NO INVITA A OTRO ANIMAL** (D-3). Se dice lo que
      paso y se acompaña; ofrecerle otro adoptable a alguien que acaba de perder
      al que eligio trata a un animal como un reemplazo.

   ── EL DESENLACE SE AVISA IGUAL, y ese principio ya estaba escrito por D en
      `_avisar_adopcion_cierre`: *«el memorial NO apaga el desenlace de una
      solicitud que ya se cerro: la familia tiene derecho a saber que paso con
      su postulacion aunque el animal haya muerto. Callar acá dejaria a alguien
      esperando para siempre una respuesta que ya existe.»* Esta migracion le
      agrega su tercer brazo.

   ── Y SE CLASIFICA EN LA PURGA: a los 90 dias la identidad se va, igual que
      `declinada` y `desistida`. Una postulacion que no termino en adopcion no
      guarda a la persona, sin importar por que no termino.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

/* ── ① EL VOCABULARIO — LOS DOS CHECKS, como enseñó `desistida` ──────────── */
ALTER TABLE public.adopcion_solicitud DROP CONSTRAINT IF EXISTS adopcion_solicitud_estado_check;
ALTER TABLE public.adopcion_solicitud DROP CONSTRAINT IF EXISTS chk_cierre_coherente;

ALTER TABLE public.adopcion_solicitud ADD CONSTRAINT adopcion_solicitud_estado_check
  CHECK (estado = ANY (ARRAY['recibida','en_conversacion','aceptada','declinada',
                             'desistida','no_concretada_fallecimiento']));

ALTER TABLE public.adopcion_solicitud ADD CONSTRAINT chk_cierre_coherente
  CHECK ((estado = ANY (ARRAY['recibida','en_conversacion']) AND cerrada_en IS NULL)
      OR (estado = ANY (ARRAY['aceptada','declinada','desistida',
                              'no_concretada_fallecimiento']) AND cerrada_en IS NOT NULL));

/* ── ② LA PURGA LO CLASIFICA ─────────────────────────────────────────────── */
DO $pur$
DECLARE v_def text; v_nueva text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='purgar_postulaciones_vencidas';
  IF position('no_concretada_fallecimiento' in v_def) > 0 THEN
    RAISE NOTICE 'PUR: ya clasificado'; RETURN;
  END IF;
  v_nueva := replace(v_def,
    'c_purga    constant text[] := ARRAY[''declinada'', ''desistida''];',
    'c_purga    constant text[] := ARRAY[''declinada'', ''desistida'', ''no_concretada_fallecimiento''];');
  IF v_nueva = v_def THEN
    RAISE EXCEPTION 'PUR: no encontre `c_purga` — mirar el cuerpo antes de tocar';
  END IF;
  EXECUTE v_nueva;
END $pur$;

/* ── ③ EL TIPO DE AVISO Y SU VOZ ─────────────────────────────────────────── */
INSERT INTO public.cat_notificacion_tipos
  (codigo, categoria, descripcion, en_sombra, activo, audiencia, canal_forzado, ignora_techo)
VALUES ('adopcion_no_concretada_fallecimiento', 'relacional',
        'El animal por el que alguien postuló falleció. Voz de duelo, SIN invitación a otro animal (D-3).',
        false, true, 'cliente', NULL, false)
ON CONFLICT (codigo) DO UPDATE SET activo = true;

DO $voz$
DECLARE v_def text; v_nueva text; v_n int;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='_voz_adopcion';
  IF position('no_concretada_fallecimiento' in v_def) > 0 THEN
    RAISE NOTICE 'VOZ: ya estaba'; RETURN;
  END IF;

  /* El ancla aparece DOS veces —una por idioma— y se CUENTA antes de tocar: un
     replace que matchea una sola dejaria la voz a medias en el otro idioma, y
     eso no falla: devuelve el titulo en ingles a alguien que lee en español. */
  SELECT count(*) INTO v_n FROM regexp_matches(v_def, 'WHEN ''adopcion_acta_lista'' THEN', 'g');
  IF v_n <> 2 THEN
    RAISE EXCEPTION 'VOZ: esperaba 2 anclas (es + en) y encontre % — mirar el cuerpo antes de tocar', v_n;
  END IF;

  v_nueva := replace(v_def,
    'WHEN ''adopcion_acta_lista'' THEN',
    'WHEN ''adopcion_no_concretada_fallecimiento'' THEN jsonb_build_object(' || chr(10) ||
    '        ''titulo'',  coalesce(v_n || '' falleció'', ''El animal falleció''),' || chr(10) ||
    '        ''mensaje'', ''Tu postulación no va a poder continuar. Lamentamos mucho darte esta noticia.'')' || chr(10) ||
    '      WHEN ''adopcion_acta_lista'' THEN');

  /* El brazo se inserto DOS veces —una por CASE— y el segundo queda en el CASE
     ingles con texto en español. Se corrige el segundo por posicion. */
  v_nueva := regexp_replace(v_nueva,
    '(WHEN ''adopcion_no_concretada_fallecimiento'' THEN jsonb_build_object\(\s*''titulo'',\s*coalesce\(v_n \|\| '' falleció'', ''El animal falleció''\),\s*''mensaje'', ''Tu postulación no va a poder continuar\. Lamentamos mucho darte esta noticia\.''\))(.*WHEN ''adopcion_no_concretada_fallecimiento'' THEN jsonb_build_object\(\s*''titulo'',\s*)coalesce\(v_n \|\| '' falleció'', ''El animal falleció''\),(\s*''mensaje'', )''Tu postulación no va a poder continuar\. Lamentamos mucho darte esta noticia\.''',
    '\1\2coalesce(v_n || '' passed away'', ''The animal passed away''),\3''Your application cannot continue. We are very sorry to give you this news.''',
    'ns');
  EXECUTE v_nueva;
END $voz$;

/* ── ④ EL EMISOR GANA SU TERCER BRAZO ───────────────────────────────────── */
DO $em$
DECLARE v_def text; v_nueva text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='_avisar_adopcion_cierre';
  IF position('no_concretada_fallecimiento' in v_def) > 0 THEN
    RAISE NOTICE 'EM: ya estaba'; RETURN;
  END IF;
  v_nueva := replace(v_def,
    'WHEN ''declinada'' THEN ''adopcion_solicitud_declinada'' END;',
    'WHEN ''declinada'' THEN ''adopcion_solicitud_declinada''' || chr(10) ||
    '              WHEN ''no_concretada_fallecimiento''' || chr(10) ||
    '                            THEN ''adopcion_no_concretada_fallecimiento'' END;');
  IF v_nueva = v_def THEN
    RAISE EXCEPTION 'EM: no encontre el CASE del emisor — mirar el cuerpo antes de tocar';
  END IF;
  EXECUTE v_nueva;
END $em$;

/* ── ⑤ EL TRIGGER: la muerte cierra las solicitudes vivas ────────────────── */
CREATE OR REPLACE FUNCTION public._trg_mascotas_cierra_solicitudes_memorial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_s record;
BEGIN
  IF NEW.estado_vida = 'fallecida' AND COALESCE(OLD.estado_vida,'') <> 'fallecida' THEN
    FOR v_s IN
      SELECT s.id FROM adopcion_solicitud s
        JOIN adopcion_publicacion p ON p.id = s.publicacion_id
       WHERE p.mascota_id = NEW.id
         AND s.estado IN ('recibida','en_conversacion','aceptada')
    LOOP
      UPDATE adopcion_solicitud
         SET estado = 'no_concretada_fallecimiento', cerrada_en = now()
       WHERE id = v_s.id;
      /* El aviso sale DESPUES del UPDATE: el emisor lee el estado de la fila.
         Si saliera antes, `_avisar_adopcion_cierre` lanzaria
         `cierre_sin_desenlace` — su propio guard, bien puesto. */
      PERFORM public._avisar_adopcion_cierre(v_s.id);
    END LOOP;
  END IF;
  RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_mascotas_cierra_solicitudes_memorial ON public.mascotas;
CREATE TRIGGER trg_mascotas_cierra_solicitudes_memorial
  AFTER UPDATE OF estado_vida ON public.mascotas
  FOR EACH ROW EXECUTE FUNCTION public._trg_mascotas_cierra_solicitudes_memorial();

/* ── ⑥ LAS DOS PUERTAS DE LA FIRMA ──────────────────────────────────────── */
DO $g$
DECLARE v_def text; v_nueva text; v_f text;
BEGIN
  v_f := '  /* 🟢 FIRMA DEL FOUNDER (2-sep): EL ACTA NO SE FIRMA CON EL ANIMAL EN' || chr(10) ||
         '     MEMORIAL. Un acta de adopcion de un animal que murio no es un tramite' || chr(10) ||
         '     que se cierra: es un documento que no tiene objeto. */' || chr(10) ||
         '  IF EXISTS (SELECT 1 FROM adopcion_solicitud s' || chr(10) ||
         '               JOIN adopcion_publicacion p ON p.id = s.publicacion_id' || chr(10) ||
         '               JOIN mascotas m ON m.id = p.mascota_id' || chr(10) ||
         '              WHERE s.id = p_solicitud_id AND m.estado_vida = ''fallecida'') THEN' || chr(10) ||
         '    RAISE EXCEPTION ''animal_en_memorial'' USING ERRCODE=''22023'';' || chr(10) ||
         '  END IF;' || chr(10) || chr(10);

  FOR v_def IN
    SELECT pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname IN ('firmar_acta_adopcion','solicitar_codigo_firma')
  LOOP
    IF position('animal_en_memorial' in v_def) > 0 THEN CONTINUE; END IF;
    v_nueva := replace(v_def,
      '  IF v_uid IS NULL THEN RAISE EXCEPTION ''auth_required'' USING ERRCODE=''42501''; END IF;',
      '  IF v_uid IS NULL THEN RAISE EXCEPTION ''auth_required'' USING ERRCODE=''42501''; END IF;' || chr(10) || chr(10) || v_f);
    IF v_nueva = v_def THEN
      RAISE EXCEPTION 'GATE: no encontre el guard de sesion — mirar el cuerpo antes de tocar';
    END IF;
    EXECUTE v_nueva;
  END LOOP;
END $g$;

/* ═══ CINTURON — EL ROJO PRIMERO, SOBRE UNA MASCOTA SEMBRADA ══════════════ */
DO $cint$
DECLARE
  v_fam uuid; v_cta uuid; v_m uuid; v_pub uuid; v_sol uuid; v_uid uuid; v_n int; v_e text;
BEGIN
  SELECT id INTO v_cta FROM cuentas_comerciales
   WHERE id IN (SELECT cuenta_comercial_id FROM cuenta_roles WHERE tipo_actor='refugio') LIMIT 1;
  SELECT fm.familia_id, fm.user_id INTO v_fam, v_uid FROM familia_miembro fm
   WHERE fm.hasta IS NULL LIMIT 1;
  IF v_cta IS NULL OR v_fam IS NULL THEN
    RAISE EXCEPTION 'CINTURON: falta refugio o familia — el brazo no puede dar verde por vacio';
  END IF;

  INSERT INTO mascotas (nombre, especie, sexo, country_code, familia_id, origen,
                        fecha_nacimiento, fecha_nacimiento_precision, estado_vida, esterilizado)
  VALUES ('__cinturon_memorial__','perro','macho','EC',v_fam,'encontrado',
          current_date - 900,'estimada','activa','si')
  RETURNING id INTO v_m;

  INSERT INTO adopcion_publicacion (mascota_id, cuenta_comercial_id, country_code,
                                    estado, ingresado_en)
  VALUES (v_m, v_cta, 'EC', 'publicada', current_date - 60) RETURNING id INTO v_pub;

  INSERT INTO adopcion_solicitud (publicacion_id, solicitante_user_id, country_code,
                                  estado, respuestas)
  VALUES (v_pub, v_uid, 'EC', 'en_conversacion',
          '{"hogar":{"adultos":1,"menores_0_5":0,"menores_6_12":0,"menores_13_17":0},
            "vivienda":"otro","horas_solo":1,"motivo":"sonda memorial"}'::jsonb)
  RETURNING id INTO v_sol;

  -- ① ✅ POSITIVO PRIMERO (`L-482`): con el animal VIVO, la solicitud esta viva.
  SELECT estado INTO v_e FROM adopcion_solicitud WHERE id = v_sol;
  IF v_e <> 'en_conversacion' THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: la fixture no nacio viva (%)', v_e;
  END IF;

  -- ② 🔴 EL ROJO: la muerte cierra la solicitud, con su estado propio.
  UPDATE mascotas SET estado_vida = 'fallecida' WHERE id = v_m;
  SELECT estado INTO v_e FROM adopcion_solicitud WHERE id = v_sol;
  IF v_e <> 'no_concretada_fallecimiento' THEN
    RAISE EXCEPTION 'CINTURON ROJO ②: la solicitud quedo en «%» — el trigger no la cerro', v_e;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM adopcion_solicitud WHERE id=v_sol AND cerrada_en IS NOT NULL) THEN
    RAISE EXCEPTION 'CINTURON ROJO ②a: quedo cerrada SIN fecha — la purga jamas la veria';
  END IF;

  -- ②b 🔴 NO se disfraza de `declinada`: son actos distintos.
  IF v_e = 'declinada' THEN
    RAISE EXCEPTION 'CINTURON ROJO ②b: se reuso `declinada` para una muerte';
  END IF;

  -- ③ 🔴 LAS DOS PUERTAS DE LA FIRMA REBOTAN, y con el motivo nombrado.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_uid::text, 'role','authenticated')::text, true);
  BEGIN
    PERFORM public.solicitar_codigo_firma(v_sol);
    RAISE EXCEPTION 'CINTURON ROJO ③: se emitio codigo para un animal en memorial';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    IF position('animal_en_memorial' in SQLERRM) = 0 THEN
      RAISE EXCEPTION 'CINTURON ROJO ③b: rebotó por otra cosa: %', SQLERRM;
    END IF;
  END;
  BEGIN
    PERFORM public.firmar_acta_adopcion(v_sol, '00000000');
    RAISE EXCEPTION 'CINTURON ROJO ③c: se firmo el acta de un animal en memorial';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    IF position('animal_en_memorial' in SQLERRM) = 0 THEN
      RAISE EXCEPTION 'CINTURON ROJO ③d: rebotó por otra cosa: %', SQLERRM;
    END IF;
  END;

  -- ④ ✅ EL AVISO SALIO, con voz de duelo y SIN invitar a otro animal.
  SELECT count(*) INTO v_n FROM notificacion_intencion
   WHERE tipo = 'adopcion_no_concretada_fallecimiento' AND destinatario_user_id = v_uid;
  IF v_n = 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ④: la familia no recibio aviso del desenlace';
  END IF;
  IF EXISTS (SELECT 1 FROM notificacion_intencion
              WHERE tipo='adopcion_no_concretada_fallecimiento'
                AND (datos->>'mensaje') ~* '(otro animal|otras mascotas|ver mas|adopta)') THEN
    RAISE EXCEPTION 'CINTURON ROJO ④b: la voz de duelo invita a otro animal (D-3)';
  END IF;

  -- ⑤ 🔴 CONTROL NEGATIVO: un estado inventado sigue rebotando.
  BEGIN
    UPDATE adopcion_solicitud SET estado='cancelada' WHERE id = v_sol;
    RAISE EXCEPTION 'CINTURON ROJO ⑤: el CHECK del estado dejo de discriminar';
  EXCEPTION WHEN check_violation THEN NULL; END;

  RAISE NOTICE 'CINTURON: 6 brazos verdes (4 rojos producidos, 1 positivo primero, 1 control negativo)';

  DELETE FROM notificacion_intencion
   WHERE tipo='adopcion_no_concretada_fallecimiento' AND destinatario_user_id = v_uid;
  DELETE FROM adopcion_solicitud WHERE id = v_sol;
  DELETE FROM adopcion_publicacion WHERE id = v_pub;
  DELETE FROM mascotas WHERE id = v_m;
  SELECT count(*) INTO v_n FROM mascotas WHERE nombre='__cinturon_memorial__';
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: residuo % mascota(s)', v_n; END IF;
END $cint$;

COMMIT;
