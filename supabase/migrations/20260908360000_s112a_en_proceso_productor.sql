/* ═══════════════════════════════════════════════════════════════════════════
   S112-A · `en_proceso` GANA PRODUCTOR
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.** CHECK ensanchado sobre filas que siguen validas.

   `en_proceso` vivia en la letra del founder (§4.2) y hasta hoy era **derivado
   en el lector**: `obtener_mis_adoptables` lo calculaba mirando si habia una
   solicitud aceptada con menos de dos firmas.

   ── 🔴 POR QUE DERIVARLO NO ALCANZA, y es la razon de esta migracion: **la
      FILA seguia diciendo `publicada`**, asi que la vidriera seguia ofreciendo
      al animal y `crear_solicitud_adopcion` seguia aceptando postulaciones
      nuevas sobre una adopcion en curso. *Un estado que solo existe en el
      lector no cambia lo que las puertas dejan pasar* — y la unica pantalla que
      lo veia era la del refugio.

      Con el estado en la fila, todo lo demas sale gratis: la vista filtra
      `estado='publicada'`, asi que el animal **sale de la vidriera solo**, y la
      puerta de postular **rebota sola**. Cero codigo nuevo en los dos lugares.

   ── EL ARCO COMPLETO, con sus dos productores:
        aceptar la solicitud  →  la publicacion pasa a `en_proceso`
        el traspaso (2 firmas) →  la publicacion pasa a `adoptada`

   ── 🔴 Y EL CAMINO DE VUELTA SE CONSTRUYE ACA, PORQUE SIN EL ESTA MIGRACION
      EMPEORA EL PROBLEMA. Lo midio E al ir a limpiar una sonda:

        la FAMILIA desiste de una aceptada ...... `solicitud_terminal: aceptada`
        el REFUGIO la declina despues de aceptar  `solicitud_terminal`

      **Ninguno de los dos puede volver atras**, y aceptar ya sacaba al animal
      de la vidriera ⇒ *un refugio que acepta por error, o una familia que
      desaparece, deja al animal ENTERRADO: fuera de la vidriera, sin adopcion
      firmada, y sin ninguna puerta que lo devuelva.* **No es un borde raro: «el
      refugio acepta y despues la familia no aparece» es el desenlace mas comun
      de una adopcion que no se concreta**, y §0 no lo contempla.

      La salida: **`aceptada` deja de ser terminal MIENTRAS NO HAYA NINGUNA
      FIRMA.** Con cero firmas cualquiera de las dos partes se baja —la familia
      desiste, el refugio declina— y **la publicacion vuelve a `publicada`**.
      Con una firma ya puesta la puerta se cierra: *bajarse de un acta que
      alguien firmo no es cerrar una conversacion, y no se resuelve con el mismo
      boton.*

      ⚠️ Volver a la vidriera pasa por `cambiar_estado_adoptable`, asi que **la
      regla de los seis meses se aplica otra vez** — es lo correcto: volver a la
      vidriera es publicar. Si el animal dejo de cumplirla en el medio, el
      refugio se entera ahi.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

ALTER TABLE public.adopcion_publicacion DROP CONSTRAINT IF EXISTS chk_estado_adoptable;
ALTER TABLE public.adopcion_publicacion ADD CONSTRAINT chk_estado_adoptable
  CHECK (estado IN ('borrador','publicada','pausada','en_proceso','adoptada','no_disponible'));

/* `en_proceso` va a `no_aplica` en el catalogo de la mascota, igual que
   `no_disponible`: `cat_estados_adopcion` tiene cinco valores y ninguno es
   este. *No se le agrega una fila a un catalogo que otra pantalla lee para
   decidir la vidriera, sin medir quien mas lo consulta.* */
CREATE OR REPLACE FUNCTION public._trg_publicacion_sincroniza_mascota()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
BEGIN
  UPDATE public.mascotas
     SET estado_adopcion = CASE NEW.estado
                             WHEN 'no_disponible' THEN 'no_aplica'
                             WHEN 'en_proceso'    THEN 'no_aplica'
                             ELSE NEW.estado END,
         updated_at = now()
   WHERE id = NEW.mascota_id;
  RETURN NEW;
END $fn$;

/* ── ① EL PRIMER PRODUCTOR: aceptar mueve la publicacion ─────────────────── */
DO $ac$
DECLARE v_def text; v_nueva text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='cerrar_solicitud_adopcion';
  IF position('en_proceso' in v_def) > 0 THEN RAISE NOTICE 'AC: ya estaba'; RETURN; END IF;

  v_nueva := replace(v_def,
    '  RETURN jsonb_build_object(''ok'', true, ''estado'', p_estado_final);',
    '  /* S112-A · EL PRIMER PRODUCTOR DE `en_proceso`. Aceptar saca al animal' || chr(10) ||
    '     de la vidriera y cierra la puerta de postular — las dos cosas salen' || chr(10) ||
    '     gratis del estado de la fila: la vista filtra `publicada` y' || chr(10) ||
    '     `crear_solicitud_adopcion` tambien. Antes esto era DERIVADO en un' || chr(10) ||
    '     lector, y la fila seguia diciendo `publicada` ⇒ el animal seguia' || chr(10) ||
    '     ofreciendose con una adopcion en curso. */' || chr(10) ||
    '  IF p_estado_final = ''aceptada'' THEN' || chr(10) ||
    '    UPDATE adopcion_publicacion SET estado = ''en_proceso'', actualizada_en = now()' || chr(10) ||
    '     WHERE id = v_pub AND estado = ''publicada'';' || chr(10) ||
    '  END IF;' || chr(10) || chr(10) ||
    '  RETURN jsonb_build_object(''ok'', true, ''estado'', p_estado_final);');
  IF v_nueva = v_def THEN
    RAISE EXCEPTION 'AC: no encontre el RETURN — mirar el cuerpo antes de tocar';
  END IF;
  EXECUTE v_nueva;
END $ac$;

/* ── ①bis LA SALIDA: `aceptada` deja de ser terminal SIN FIRMAS ─────────── */
DO $sal$
DECLARE v_def text; v_nueva text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='cerrar_solicitud_adopcion';
  IF position('adopcion_firma' in v_def) > 0 THEN RAISE NOTICE 'SAL: ya estaba'; RETURN; END IF;

  v_nueva := replace(v_def,
'  IF v_estado IN (''aceptada'',''declinada'') THEN
    RAISE EXCEPTION ''solicitud_terminal'' USING ERRCODE=''22023'';
  END IF;',
'  /* 🔴 `aceptada` NO es terminal mientras NADIE haya firmado. Antes lo era, y
     con aceptar sacando al animal de la vidriera eso lo dejaba ENTERRADO: sin
     adopcion firmada y sin puerta de vuelta. Lo midio E.
     Con una firma puesta la puerta se cierra: *bajarse de un acta que alguien
     firmo no es cerrar una conversacion.* */
  IF v_estado = ''declinada'' OR v_estado = ''desistida'' THEN
    RAISE EXCEPTION ''solicitud_terminal'' USING ERRCODE=''22023'';
  END IF;
  IF v_estado = ''aceptada'' THEN
    IF EXISTS (SELECT 1 FROM adopcion_firma f WHERE f.solicitud_id = p_solicitud_id) THEN
      RAISE EXCEPTION ''acta_ya_firmada'' USING ERRCODE=''22023'';
    END IF;
    IF p_estado_final = ''aceptada'' THEN
      RAISE EXCEPTION ''solicitud_terminal'' USING ERRCODE=''22023'';
    END IF;
    /* Se baja: el animal VUELVE a la vidriera. Sin esta linea la salida
       existiria y el animal seguiria enterrado igual. */
    UPDATE adopcion_publicacion SET estado = ''publicada'', actualizada_en = now()
     WHERE id = v_pub AND estado = ''en_proceso'';
  END IF;');
  IF v_nueva = v_def THEN
    RAISE EXCEPTION 'SAL: no encontre el guard terminal — mirar el cuerpo antes de tocar';
  END IF;
  EXECUTE v_nueva;
END $sal$;

/* ── ② EL LECTOR DEJA DE DERIVARLO: una sola fuente ──────────────────────── */
DO $le$
DECLARE v_def text; v_nueva text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_mis_adoptables';
  IF position('adopcion_solicitud s2' in v_def) = 0 THEN
    RAISE NOTICE 'LE: el lector ya no deriva'; RETURN;
  END IF;

  v_nueva := regexp_replace(v_def,
    '''estado'', CASE WHEN m\.estado_vida = ''fallecida'' THEN ''memorial''.*?ELSE p\.estado END,',
    '''estado'', CASE WHEN m.estado_vida = ''fallecida'' THEN ''memorial''' || chr(10) ||
    '                       ELSE p.estado END,   -- `en_proceso` sale de la FILA (S112-A)',
    'ns');
  IF v_nueva = v_def THEN
    RAISE EXCEPTION 'LE: no encontre el CASE derivado — mirar el cuerpo antes de tocar';
  END IF;
  EXECUTE v_nueva;
END $le$;

/* ═══ CINTURON ════════════════════════════════════════════════════════════ */
DO $cint$
DECLARE
  v_admin uuid; v_pub uuid; v_masc uuid; v_uid uuid; v_sol uuid;
  v_estado_prev text; v_n int; v_lista jsonb; v_dueno uuid;
BEGIN
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin::text, 'role','authenticated')::text, true);

  SELECT p.id, p.mascota_id, p.estado INTO v_pub, v_masc, v_estado_prev
    FROM adopcion_publicacion p WHERE p.estado = 'publicada' LIMIT 1;
  IF v_pub IS NULL THEN
    RAISE EXCEPTION 'CINTURON: no hay publicacion publicada — el brazo no puede dar verde por vacio';
  END IF;

  -- ① ✅ POSITIVO PRIMERO: el animal ESTA en la vidriera antes de nada.
  SELECT count(*) INTO v_n FROM v_adoptables_publicos WHERE publicacion_id = v_pub;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: la publicacion elegida no esta en la vidriera — la fixture no sirve';
  END IF;

  -- ② 🔴 EL ROJO: con `en_proceso`, SALE de la vidriera **sola**.
  UPDATE adopcion_publicacion SET estado = 'en_proceso' WHERE id = v_pub;
  SELECT count(*) INTO v_n FROM v_adoptables_publicos WHERE publicacion_id = v_pub;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ②: un animal en proceso sigue ofreciendose en la vidriera';
  END IF;

  -- ③ 🔴 Y LA PUERTA DE POSTULAR REBOTA, tambien sola.
  SELECT u.id INTO v_uid FROM auth.users u
   WHERE u.id <> v_admin
     AND EXISTS (SELECT 1 FROM consentimientos c
                  WHERE c.user_id = u.id AND c.tipo = 'condiciones_adopcion')
   LIMIT 1;
  IF v_uid IS NOT NULL THEN
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_uid::text, 'role','authenticated')::text, true);
    BEGIN
      PERFORM public.crear_solicitud_adopcion(v_pub,
        '{"hogar":{"adultos":1,"menores_0_5":0,"menores_6_12":0,"menores_13_17":0},
          "vivienda":"otro","horas_solo":1,"motivo":"sonda en_proceso"}'::jsonb);
      RAISE EXCEPTION 'CINTURON ROJO ③: se pudo postular a un animal con adopcion en curso';
    EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_admin::text, 'role','authenticated')::text, true);
  END IF;

  -- ④ El trigger sincronizo la mascota a `no_aplica` (el catalogo no tiene
  --    `en_proceso` y no se le agrega sin medir quien mas lo lee).
  SELECT count(*) INTO v_n FROM mascotas
   WHERE id = v_masc AND estado_adopcion = 'no_aplica';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'CINTURON ROJO ④: el trigger no sincronizo `en_proceso`';
  END IF;

  -- ⑤ ✅ El lector del portal lo devuelve DE LA FILA, no derivado.
  --    🔴 Desde el asiento del REFUGIO, no del admin: `obtener_mis_adoptables`
  --    gatea por `_user_gestiona_cuenta_refugio`, y el admin no OPERA esa
  --    cuenta — la primera version de este brazo media desde el asiento
  --    equivocado y daba lista vacia, que se lee igual que «no lo ve».
  SELECT cc.owner_profile_id INTO v_dueno
    FROM adopcion_publicacion p JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
   WHERE p.id = v_pub;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_dueno::text, 'role','authenticated')::text, true);
  SELECT public.obtener_mis_adoptables() INTO v_lista;
  IF jsonb_array_length(v_lista) = 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ⑤a: el asiento del refugio no ve NINGUN animal — la fixture no sirve';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_lista) x
                  WHERE (x->>'publicacion_id')::uuid = v_pub
                    AND x->>'estado' = 'en_proceso') THEN
    RAISE EXCEPTION 'CINTURON ROJO ⑤: el portal no ve `en_proceso` en la fila';
  END IF;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin::text, 'role','authenticated')::text, true);

  -- ⑥ 🔴 CONTROL NEGATIVO: un estado inventado sigue rebotando. Sin este brazo,
  --    haber ensanchado el CHECK a cualquier cosa habria pasado ②.
  BEGIN
    UPDATE adopcion_publicacion SET estado = 'en_tramite' WHERE id = v_pub;
    RAISE EXCEPTION 'CINTURON ROJO ⑥: el CHECK del estado dejo de discriminar';
  EXCEPTION WHEN check_violation THEN NULL; END;

  -- ⑦ ✅ LA SALIDA EXISTE: con CERO firmas, declinar una aceptada devuelve el
  --    animal a la vidriera. Es el caso de Bruno, y el mas comun de una
  --    adopcion que no se concreta.
  UPDATE adopcion_publicacion SET estado = 'en_proceso' WHERE id = v_pub;
  INSERT INTO adopcion_solicitud (publicacion_id, solicitante_user_id, country_code,
                                  estado, cerrada_en, respuestas)
  VALUES (v_pub, COALESCE(v_uid, v_admin), 'EC', 'aceptada', now(),
          '{"hogar":{"adultos":1,"menores_0_5":0,"menores_6_12":0,"menores_13_17":0},
            "vivienda":"otro","horas_solo":1,"motivo":"sonda de la salida"}'::jsonb)
  RETURNING id INTO v_sol;

  /* Declina EL PUBLICADOR, que es quien la letra habilita — y el asiento es el
     del dueño de la cuenta, no el del admin. */
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_dueno::text, 'role','authenticated')::text, true);
  PERFORM public.cerrar_solicitud_adopcion(v_sol, 'declinada');

  SELECT count(*) INTO v_n FROM adopcion_publicacion
   WHERE id = v_pub AND estado = 'publicada';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'CINTURON ROJO ⑦: declinar una aceptada NO devolvio el animal a la vidriera';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM adopcion_solicitud WHERE id=v_sol AND estado='declinada') THEN
    RAISE EXCEPTION 'CINTURON ROJO ⑦b: la solicitud no quedo declinada';
  END IF;

  -- ⑧ 🔴 CONTROL: CON una firma puesta, la puerta se CIERRA. Sin este brazo, la
  --    salida seria una forma de deshacer un acto ya firmado.
  UPDATE adopcion_solicitud SET estado='aceptada' WHERE id = v_sol;
  INSERT INTO adopcion_firma (solicitud_id, user_id, papel, version_acta, codigo_acta,
                              hash_renderizado, hash_fuente, folio)
  VALUES (v_sol, v_admin, 'adoptante', 1, 'acta_adopcion', 'x', 'y', 'F-SONDA');
  BEGIN
    PERFORM public.cerrar_solicitud_adopcion(v_sol, 'declinada');
    RAISE EXCEPTION 'CINTURON ROJO ⑧: se pudo declinar un acta YA FIRMADA';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin::text, 'role','authenticated')::text, true);

  ALTER TABLE adopcion_firma DISABLE TRIGGER trg_adopcion_firma_inmutable;
  DELETE FROM adopcion_firma WHERE solicitud_id = v_sol;
  ALTER TABLE adopcion_firma ENABLE TRIGGER trg_adopcion_firma_inmutable;
  DELETE FROM adopcion_solicitud WHERE id = v_sol;

  RAISE NOTICE 'CINTURON: 8 brazos verdes (4 rojos producidos, 2 positivos, 1 control negativo)';

  UPDATE adopcion_publicacion SET estado = v_estado_prev WHERE id = v_pub;
  SELECT count(*) INTO v_n FROM adopcion_publicacion WHERE id=v_pub AND estado = v_estado_prev;
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: la publicacion no volvio a su estado'; END IF;
END $cint$;

COMMIT;
