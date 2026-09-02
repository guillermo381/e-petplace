/* ═══════════════════════════════════════════════════════════════════════════
   S112-A9c · LOS FALTANTES DEL ACTA REVENTABAN EN VEZ DE NOMBRARSE
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.**

   🔴 DEFECTO MIO, EN A9, Y LO ENCONTRO E POR CAMINO REAL.
   `v_falt text[] := '{}'` seguido de trece `v_falt := v_falt || 'literal'`.
   Con el literal SIN TIPO, Postgres resuelve `anyarray || anyarray` e intenta
   castear el texto a `text[]` ⇒ **`malformed array literal`**, un error crudo
   que la persona ve tal cual.

   ── LO QUE LO VUELVE GRAVE NO ES EL CAST: ES CUANDO DISPARA.
      Revienta **en la PRIMERA variable que de verdad falte** ⇒ el unico camino
      que pasaba era el acta COMPLETA — *que es justo la que nunca va a ocurrir
      en el primer uso real, porque nadie tiene cedula cargada.*
      Es mi propio `acta_incompleta` «que nombra los faltantes»: la intencion
      estaba bien y la implementacion reventaba antes de poder nombrarlos.

   ── 🔴 Y LO QUE HAY QUE ANOTAR ES POR QUE MI CINTURON NO LO VIO:
      sus seis brazos median privilegios, indices, triggers y una solicitud
      INEXISTENTE. **Ninguno rendrizo un acta REAL con un dato faltante**, que
      es el unico camino donde el defecto vive. *Un cinturon que no ejerce el
      camino que la funcion existe para recorrer no mide la funcion: mide su
      andamiaje.* Este arreglo entra con ese brazo, y el brazo **da rojo contra
      la version vieja**.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

DO $fix$
DECLARE v_def text; v_nueva text; v_n int;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='_renderizar_acta';
  IF v_def IS NULL THEN RAISE EXCEPTION 'FIX: _renderizar_acta no existe'; END IF;

  /* Se tipan las TRECE de una: `|| 'algo';` pasa a `|| 'algo'::text;`. Se hace
     por patron y **se cuenta**, porque un replace que no matchea no falla —
     devuelve el texto igual y la funcion se recrearia con el defecto adentro. */
  v_nueva := regexp_replace(v_def, 'v_falt \|\| ''([a-z_]+)''', 'v_falt || ''\1''::text', 'g');
  SELECT count(*) INTO v_n FROM regexp_matches(v_def, 'v_falt \|\| ''[a-z_]+''', 'g');
  IF v_n <> 13 THEN
    RAISE EXCEPTION 'FIX: esperaba 13 concatenaciones sin tipo y encontre % — mirar el cuerpo antes de tocar', v_n;
  END IF;
  IF v_nueva = v_def THEN RAISE EXCEPTION 'FIX: el patron no matcheo'; END IF;
  EXECUTE v_nueva;
END $fix$;

/* ═══ EL BRAZO QUE FALTABA: RENDERIZA UN ACTA REAL CON UN DATO FALTANTE ════ */
DO $cint$
DECLARE v_sol uuid; v_acta jsonb; v_falt jsonb; v_admin uuid;
BEGIN
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin::text, 'role','authenticated')::text, true);

  SELECT id INTO v_sol FROM adopcion_solicitud ORDER BY creada_en DESC LIMIT 1;
  IF v_sol IS NULL THEN
    /* NO se da verde por vacio: si no hay solicitud, el brazo no midio nada y
       lo dice (`L-437`). */
    RAISE EXCEPTION 'CINTURON: no hay ninguna solicitud para renderizar — el brazo no puede dar verde por vacio';
  END IF;

  -- ① 🔴 EL ROJO QUE E PRODUJO: renderizar un acta a la que le falta algo.
  --    Contra la version vieja esto tira `malformed array literal`.
  v_acta := public._renderizar_acta(v_sol);
  v_falt := v_acta->'faltantes';

  -- ② ✅ Y NOMBRA. Un `faltantes` vacio sobre una base donde NADIE tiene cedula
  --    seria un verde falso: querria decir que la rama no se ejecuto.
  IF jsonb_typeof(v_falt) <> 'array' THEN
    RAISE EXCEPTION 'CINTURON ROJO ②: faltantes no es un array: %', v_falt;
  END IF;
  IF jsonb_array_length(v_falt) = 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ②b: faltantes vino VACIO — con 0 cedulas cargadas en la casa, eso significa que la rama no corrio';
  END IF;
  IF NOT (v_falt ? 'adoptante_cedula') THEN
    RAISE EXCEPTION 'CINTURON ROJO ②c: faltantes no nombra adoptante_cedula, que hoy falta en todas las filas';
  END IF;

  -- ③ ✅ El texto renderizado existe y tiene los datos del animal puestos.
  IF (v_acta->>'texto_renderizado') IS NULL
     OR length(v_acta->>'texto_renderizado') < 1000 THEN
    RAISE EXCEPTION 'CINTURON ROJO ③: el acta renderizada vino corta o vacia';
  END IF;
  IF position('{{animal_nombre}}' in (v_acta->>'texto_renderizado')) > 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ③b: quedaron llaves sin resolver en el acta';
  END IF;

  -- ④ ✅ Los DOS hashes viajan y son DISTINTOS entre si.
  IF (v_acta->>'hash_renderizado') IS NULL OR (v_acta->>'hash_fuente') IS NULL THEN
    RAISE EXCEPTION 'CINTURON ROJO ④: falta alguno de los dos hashes';
  END IF;
  IF (v_acta->>'hash_renderizado') = (v_acta->>'hash_fuente') THEN
    RAISE EXCEPTION 'CINTURON ROJO ④b: los dos hashes son iguales — el renderizado no identifica ESTA acta';
  END IF;

  RAISE NOTICE 'CINTURON A9c: 4 brazos verdes · faltantes nombra % variable(s)',
    jsonb_array_length(v_falt);
END $cint$;

COMMIT;
