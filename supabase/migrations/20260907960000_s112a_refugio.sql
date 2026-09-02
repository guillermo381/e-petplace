/* ═══════════════════════════════════════════════════════════════════════════
   S112-A4 · EL REFUGIO: SU VERIFICACION, SU CUENTA Y SU ARRANQUE
   ── y la cura del estado que A1 dejo huerfano.
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.** Cuatro columnas nullable sobre `cuenta_roles`
   (7 filas vivas, ninguna se toca), funciones nuevas, cero backfill.

   ── 🔴 PRIMERO, LA CURA: EL TRASPASO NO PODIA TERMINAR NUNCA.
      A1 jubilo el estado `retirada` y **no censo a sus escritores**. Quedo uno:
      el ULTIMO `UPDATE` de `traspasar_mascota_a_familia`, que escribe
      `estado='retirada'` — un valor que el CHECK nuevo no admite.

      *Curar no es censar*, y esta es la factura: el rename se hizo mirando la
      tabla y no a quien la escribe. **Ningun gate lo habria visto**, porque el
      traspaso tiene cero consumidores y nadie lo llamo nunca; lo destapo E
      produciendo el CONTROL POSITIVO de otro rojo — el brazo que existe para
      probar que el instrumento discrimina.

      El censo ahora CIERRA, no acota (`L-437`): de las 7 funciones que tocan
      `adopcion_publicacion` o `estado_adopcion`, **`traspasar_mascota_a_familia`
      es la unica que nombra `retirada`**, y hay 0 filas con ese valor porque el
      CHECK no las deja nacer.

      El valor correcto es **`adoptada`**, y estaba a la vista en el CHECK y en
      el catalogo: *un animal que encontro casa no esta «retirado» — eso es lo
      contrario de lo que le paso.* Y `retirada_en` vuelve a `NULL`: la fecha de
      retiro es del que sale de la vidriera sin adoptarse.

   ── LA VERIFICACION DEL REFUGIO TIENE CRITERIO ESCRITO (N4, pedido del
      abogado). Va en COLUMNAS y no en `metadata`: *lo que un abogado pide para
      poder sostener una decision no se guarda en un jsonb donde nada obliga a
      que este*. `tipo_verificacion` es vocabulario cerrado; `criterio` es texto
      libre a proposito — describe QUE se reviso, y eso no se enumera.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

/* ── ① LA CURA DEL TRASPASO ───────────────────────────────────────────────
   Se toca UNA linea de un cuerpo largo, y por eso se hace con `regexp_replace`
   sobre la definicion viva en vez de reescribir la funcion entera: reescribirla
   de memoria arrastraria cualquier cambio que otra pista le haya hecho hoy. */
DO $cura$
DECLARE v_def text; v_nueva text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname='public' AND p.proname='traspasar_mascota_a_familia';
  IF v_def IS NULL THEN RAISE EXCEPTION 'CURA: traspasar_mascota_a_familia no existe'; END IF;
  IF position('''retirada''' in v_def) = 0 THEN
    RAISE NOTICE 'CURA: ya estaba curada (no dice retirada)';
    RETURN;
  END IF;

  v_nueva := replace(v_def,
    E'  -- \u2463 la publicaci\u00f3n se cierra\n  UPDATE adopcion_publicacion\n'
    '     SET estado=''retirada'', retirada_en = now(), motivo_retiro = ''adoptada''',
    E'  -- \u2463 la publicaci\u00f3n se cierra. **`adoptada`, no `retirada`**: un animal\n'
    '  --    que encontro casa no esta «retirado» — eso es lo contrario de lo que le\n'
    '  --    paso. `retirada_en` es del que sale de la vidriera SIN adoptarse.\n'
    '  UPDATE adopcion_publicacion\n'
    '     SET estado=''adoptada'', retirada_en = NULL, motivo_retiro = NULL');

  IF v_nueva = v_def THEN
    /* 🔴 Si el patron no matcheo, el cuerpo cambio de forma y reemplazar a
       ciegas dejaria la funcion rota en silencio. Se aborta y se dice. */
    RAISE EXCEPTION 'CURA: el UPDATE final no tiene la forma esperada — mirar el cuerpo antes de tocar';
  END IF;
  EXECUTE v_nueva;
END $cura$;

/* ── ② LA VERIFICACION CON CRITERIO ───────────────────────────────────────── */
ALTER TABLE public.cuenta_roles
  ADD COLUMN IF NOT EXISTS verificado_por        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verificado_en         timestamptz,
  ADD COLUMN IF NOT EXISTS tipo_verificacion     text,
  ADD COLUMN IF NOT EXISTS criterio_verificacion text;

DO $$ BEGIN
  ALTER TABLE public.cuenta_roles ADD CONSTRAINT chk_tipo_verificacion CHECK (
    tipo_verificacion IS NULL OR tipo_verificacion IN ('organizacion','rescatista'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN public.cuenta_roles.criterio_verificacion IS
  'S112-A4 (N4). QUE se reviso para verificar este rol. Texto libre a proposito: '
  'describe una revision y eso no se enumera. Lo pidio el abogado para que la '
  'verificacion de un refugio tenga constancia — por eso es columna y no jsonb.';

/* ── ③ OTORGAR, CON TIPO Y CRITERIO ─────────────────────────────────────── */
DROP FUNCTION IF EXISTS public.otorgar_rol_refugio(uuid, text);
CREATE OR REPLACE FUNCTION public.otorgar_rol_refugio(
  p_cuenta_comercial_id uuid,
  p_tipo text,
  p_criterio text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_auth uuid := auth.uid(); v_cc record; v_ya boolean; v_activada boolean := false;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  /* Acto de ADMIN por la misma razon que el vendedor: si el titular pudiera
     darselo, cualquiera con una cuenta comercial se auto-habilitaria a publicar
     animales en adopcion. */
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'solo_admin_otorga_rol_refugio' USING ERRCODE='42501';
  END IF;
  IF p_tipo NOT IN ('organizacion','rescatista') THEN
    RAISE EXCEPTION 'tipo_de_refugio_no_valido: %', p_tipo USING ERRCODE='22023';
  END IF;
  /* 🔴 El criterio es OBLIGATORIO. Si fuera opcional, la constancia que el
     abogado pidio existiria a veces — y una constancia que a veces no esta no
     sirve para sostener nada. */
  IF p_criterio IS NULL OR btrim(p_criterio) = '' THEN
    RAISE EXCEPTION 'criterio_requerido: escribi que se revisó para verificar este refugio'
      USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_cc FROM cuentas_comerciales WHERE id = p_cuenta_comercial_id FOR UPDATE;
  IF v_cc.id IS NULL THEN RAISE EXCEPTION 'cuenta_no_existe' USING ERRCODE='22023'; END IF;
  IF v_cc.estado IN ('suspendida','cerrada') THEN
    RAISE EXCEPTION 'cuenta_no_activable: la cuenta esta «%» y reactivarla no es parte del alta de un refugio',
      v_cc.estado USING ERRCODE='22023';
  END IF;

  IF v_cc.estado = 'pendiente_validacion' THEN
    UPDATE cuentas_comerciales
       SET estado='activa', activado_en=COALESCE(activado_en, now()),
           activado_por=v_auth, updated_at=now()
     WHERE id = p_cuenta_comercial_id;
    v_activada := true;
  END IF;

  SELECT EXISTS (SELECT 1 FROM cuenta_roles WHERE cuenta_comercial_id = p_cuenta_comercial_id
                  AND tipo_actor='refugio' AND estado='activo') INTO v_ya;

  INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en,
                            verificado_por, verificado_en, tipo_verificacion,
                            criterio_verificacion, metadata)
  VALUES (p_cuenta_comercial_id, 'refugio', 'activo', now(),
          v_auth, now(), p_tipo, btrim(p_criterio),
          jsonb_build_object('otorgado_por', v_auth))
  ON CONFLICT (cuenta_comercial_id, tipo_actor) DO UPDATE
    SET estado='activo',
        activado_en   = COALESCE(cuenta_roles.activado_en, now()),
        /* Re-verificar PISA la verificacion vieja: la constancia que vale es la
           ultima que alguien firmo, no la primera. */
        verificado_por        = v_auth,
        verificado_en         = now(),
        tipo_verificacion     = EXCLUDED.tipo_verificacion,
        criterio_verificacion = EXCLUDED.criterio_verificacion;

  UPDATE cuentas_comerciales
     SET naturalezas_solicitadas = array_remove(naturalezas_solicitadas, 'refugio'::tipo_actor_enum),
         updated_at = now()
   WHERE id = p_cuenta_comercial_id;

  RETURN jsonb_build_object('ok', true, 'cuenta_comercial_id', p_cuenta_comercial_id,
    'ya_lo_tenia', v_ya, 'cuenta_activada_ahora', v_activada,
    'tipo', p_tipo, 'verificado_en', now());
END $fn$;

/* ── ④ MI CUENTA DE REFUGIO ───────────────────────────────────────────────
   **Nombra el rol**, no hace un CROSS JOIN contra todas mis cuentas: una
   persona puede tener una cuenta comercial que NO es refugio, y devolverla
   haria que el portal se abriera para un veterinario. */
CREATE OR REPLACE FUNCTION public.obtener_mi_cuenta_refugio()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_uid uuid := auth.uid(); v_r jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT jsonb_build_object(
           'cuenta_comercial_id', c.id,
           'nombre_comercial',    c.nombre_comercial,
           'estado',              c.estado,
           'country_code',        c.country_code,
           'tipo',                r.tipo_verificacion,
           'verificado_en',       r.verificado_en,
           /* 🔴 `criterio_verificacion` NO viaja: es la constancia interna de
              por que la casa verifico a este refugio, no un dato de su perfil.
              *Devolverlo lo pondria a un toque de una pantalla.* */
           'puede_publicar',      c.estado = 'activa')
    INTO v_r
    FROM cuentas_comerciales c
    JOIN cuenta_roles r ON r.cuenta_comercial_id = c.id
                       AND r.tipo_actor = 'refugio' AND r.estado = 'activo'
   WHERE public._user_opera_cuenta_comercial(c.id, v_uid)
   LIMIT 1;

  /* `null` honesto y no un objeto vacio: «no sos refugio» y «sos un refugio sin
     datos» son dos cosas distintas y la pantalla las dibuja distinto. */
  RETURN COALESCE(v_r, 'null'::jsonb);
END $fn$;

REVOKE ALL ON FUNCTION public.otorgar_rol_refugio(uuid,text,text) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.obtener_mi_cuenta_refugio() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.otorgar_rol_refugio(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_mi_cuenta_refugio() TO authenticated;

/* ── ⑤ LA RAMA REFUGIO DEL ARRANQUE ───────────────────────────────────────
   Hunk ADITIVO sobre `obtener_contexto_arranque`: se agregan DOS claves y no se
   toca ninguna de las trece que ya devuelve. *Reescribir esa funcion para
   agregar una rama es como se pierden las otras doce.* */
DO $arr$
DECLARE v_def text; v_nueva text; v_ancla text; v_con_var text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_contexto_arranque';
  IF v_def IS NULL THEN RAISE EXCEPTION 'ARRANQUE: la funcion no existe'; END IF;
  IF position('''refugio''' in v_def) > 0 THEN
    RAISE NOTICE 'ARRANQUE: la rama refugio ya estaba'; RETURN;
  END IF;

  v_ancla := '  RETURN jsonb_build_object(' || chr(10) || '    ''ok'', true,';
  v_nueva := replace(v_def, v_ancla,
      '  -- EL REFUGIO (S112-A4). Aditivo: dos claves, cero cambios en las otras.' || chr(10)
   || '  v_refugio := public.obtener_mi_cuenta_refugio();' || chr(10) || chr(10)
   || v_ancla || chr(10)
   || '    ''es_refugio'', v_refugio IS NOT NULL AND v_refugio <> ''null''::jsonb,' || chr(10)
   || '    ''refugio'', v_refugio,');
  IF v_nueva = v_def THEN
    RAISE EXCEPTION 'ARRANQUE: no encontre el RETURN — mirar el cuerpo antes de tocar';
  END IF;
  /* La DECLARE se toca por REGEX y **se verifica que haya cambiado**: un
     `replace` con el espaciado equivocado no falla — devuelve el texto igual, y
     la funcion se recrearia usando una variable que no declaro. */
  v_con_var := regexp_replace(v_nueva, '(\s+v_mostrador\s+boolean := false;)',
                              '\1' || chr(10) || '  v_refugio jsonb;');
  IF v_con_var = v_nueva THEN
    RAISE EXCEPTION 'ARRANQUE: no encontre la DECLARE — mirar el cuerpo antes de tocar';
  END IF;
  v_nueva := v_con_var;
  EXECUTE v_nueva;
END $arr$;

/* ═══ CINTURON ════════════════════════════════════════════════════════════ */
DO $cint$
DECLARE v_admin uuid; v_def text; v_ctx jsonb; v_cta uuid; v_n int;
BEGIN
  -- ① 🔴 EL ROJO DEL RENAME: nadie escribe ya el estado jubilado.
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND pg_get_functiondef(p.oid) ~ '''retirada''';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: quedan % funcion(es) escribiendo el estado jubilado', v_n;
  END IF;
  -- ①b CONTROL NEGATIVO: el instrumento SI puede ver un estado en el cuerpo.
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND pg_get_functiondef(p.oid) ~ '''adoptada''';
  IF v_n = 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ①b: el censo no ve NINGUN estado — mide otra cosa';
  END IF;
  -- ①c El traspaso quedo escribiendo el estado correcto.
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='traspasar_mascota_a_familia';
  /* Se compara con los espacios NORMALIZADOS. La primera version comparaba
     literal y dio rojo por un espacio alrededor del `=` — un assert que mide
     el formateo en vez del hecho. */
  IF regexp_replace(v_def, '\s+', '', 'g') !~ 'SETestado=''adoptada'',retirada_en=NULL' THEN
    RAISE EXCEPTION 'CINTURON ROJO ①c: el traspaso no quedo escribiendo adoptada';
  END IF;

  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin::text, 'role','authenticated')::text, true);

  -- ② 🔴 ROJO: sin criterio no se otorga.
  SELECT id INTO v_cta FROM cuentas_comerciales LIMIT 1;
  BEGIN
    PERFORM public.otorgar_rol_refugio(v_cta, 'organizacion', '   ');
    RAISE EXCEPTION 'CINTURON ROJO ②: se otorgo el rol SIN criterio escrito';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    IF position('criterio_requerido' in SQLERRM) = 0 THEN
      RAISE EXCEPTION 'CINTURON ROJO ②b: rebotó por otra cosa: %', SQLERRM;
    END IF;
  END;

  -- ③ 🔴 ROJO: un tipo inventado no entra.
  BEGIN
    PERFORM public.otorgar_rol_refugio(v_cta, 'fundacion', 'revisé el RUC');
    RAISE EXCEPTION 'CINTURON ROJO ③: un tipo de refugio inventado entro';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;

  -- ④ ✅ POSITIVO: el arranque responde y trae las dos claves nuevas SIN
  --    perder las viejas.
  v_ctx := public.obtener_contexto_arranque();
  IF NOT (v_ctx ? 'es_refugio' AND v_ctx ? 'refugio') THEN
    RAISE EXCEPTION 'CINTURON ROJO ④: el arranque no trae la rama refugio';
  END IF;
  IF NOT (v_ctx ? 'prestador' AND v_ctx ? 'cuenta_comercial' AND v_ctx ? 'moneda'
          AND v_ctx ? 'repartidor_de' AND v_ctx ? 'oficios_locales') THEN
    RAISE EXCEPTION 'CINTURON ROJO ④b: el hunk aditivo se llevo puestas claves viejas';
  END IF;

  -- ⑤ 🔴 ROJO: `anon` no alcanza ninguna de las dos.
  IF has_function_privilege('anon','public.otorgar_rol_refugio(uuid,text,text)','EXECUTE')
     OR has_function_privilege('anon','public.obtener_mi_cuenta_refugio()','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON ROJO ⑤: anon alcanza el alta de refugio';
  END IF;

  RAISE NOTICE 'CINTURON A4: 5 brazos verdes (4 rojos producidos, 1 control negativo, 1 positivo)';
END $cint$;

COMMIT;
