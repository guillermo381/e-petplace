/* ═══════════════════════════════════════════════════════════════════════════
   S112-A2b · LA VIDRIERA PUEDE MOSTRAR FOTOS, Y EL REFUGIO PUEDE SUBIRLAS
   ───────────────────────────────────────────────────────────────────────────
   Tres huecos que dejo A2, los tres encontrados por E midiendo desde el asiento
   correcto. 76(g) · VEDA: **NO RIGE** — policies y funciones, cero backfill.

   ── ① 🔴 LA POLICY DE `anon` NO PODIA DAR VERDADERO NUNCA.
      `mascotas_select_vidriera_anon` pregunta por filas de `mascotas`,
      `adopcion_publicacion` y `cat_estados_adopcion`. **Las tres tienen RLS que
      `anon` no atraviesa**, y esa RLS se aplica ADENTRO del `EXISTS` ⇒ el
      predicado es falso siempre. Medido por E con sus dos asientos:

        el predicado desde SUPERUSUARIO ...... true
        el MISMO predicado desde ANON ........ false
        lo que anon ve de cada tabla ......... 0 · 0 · 0

      **No era una fuga: estaba cerrado de mas**, y §0 pasos 8 y 9 se dibujaban
      sin una sola foto. *Un permiso que no puede decir que si es indistinguible
      de uno bien puesto hasta que alguien mira la pantalla.*

      La cura es la de la casa: el predicado se muda a un **helper DEFINER**, que
      evalua el join con los permisos de su dueño. La policy no cambia de
      intencion — cambia de asiento.

   ── ② EL REFUGIO NO PODIA SUBIR NI UNA FOTO.
      Las dos policies vivas de `adopcion-fotos` son `is_admin()`. A2 entrego la
      TABLA de fotos y sus tres actos, y el bucket seguia cerrado ⇒ **motor sin
      puerta** (`L-318`), con el agravante de que la tabla daba `ok:true` sobre
      un archivo que nunca iba a poder subirse.

      La carpeta es el `publicacion_id`, y el permiso lo decide **de quien es esa
      publicacion**. No alcanza con «tener rol refugio»: con eso, un refugio
      podria escribir en la carpeta de otro.

   ── ③ `anon` SE BAJABA EL CATALOGO ENTERO EN UN PEDIDO.
      Con `GRANT SELECT` directo sobre `v_adoptables_publicos`, la clave anon
      —que viaja en el bundle— saltea la paginacion, el tope de 50 y la lista
      blanca de filtros: E midio **1005 filas · 1,06 MB · p95 651 ms**.

      No es fuga —ninguna columna prohibida, y los borradores no salen— pero la
      vista **no es una API publica: es el detalle de implementacion de los dos
      lectores**. Se le saca el grant a `anon` y los lectores siguen leyendola
      porque son `SECURITY DEFINER`. ⇒ la paginacion pasa a ser inevitable, no
      opcional, y la vista deja de ser la unica puerta: ahora hay dos.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

/* ── ① EL HELPER QUE LE DA ASIENTO AL PREDICADO ────────────────────────────
   `STABLE` y no `VOLATILE`: se evalua una vez por objeto y el planificador
   puede reusarlo. Devuelve `boolean` puro; sin sesion devuelve lo mismo que con
   ella, porque **no mira quien pregunta**: mira si ese objeto es la portada de
   un animal publicado. Esa es toda su autoridad. */
CREATE OR REPLACE FUNCTION public._objeto_es_portada_de_adoptable(p_nombre text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
  SELECT EXISTS (
    SELECT 1
      FROM public.mascotas m
      JOIN public.adopcion_publicacion p
        ON p.mascota_id = m.id AND p.estado = 'publicada'
     WHERE m.foto_url = p_nombre
       /* El memorial se cae aca tambien: un animal fallecido no muestra su
          cara en la vidriera. Se lee de `estado_vida`, la unica fuente. */
       AND m.estado_vida <> 'fallecida');
$fn$;

COMMENT ON FUNCTION public._objeto_es_portada_de_adoptable(text) IS
  'S112-A2b. Helper de policy. Existe porque el predicado inline se evaluaba '
  'con la RLS del que preguntaba y para `anon` daba SIEMPRE falso: la vidriera '
  'no mostraba una sola foto. No mira quien pregunta — mira si el objeto es la '
  'portada de un animal publicado y vivo.';

REVOKE ALL ON FUNCTION public._objeto_es_portada_de_adoptable(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._objeto_es_portada_de_adoptable(text) TO anon, authenticated;

DROP POLICY IF EXISTS mascotas_select_vidriera_anon ON storage.objects;
CREATE POLICY mascotas_select_vidriera_anon ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'mascotas' AND public._objeto_es_portada_de_adoptable(objects.name));

/* ── ② LA CARPETA ES LA PUBLICACION, Y EL DUEÑO DECIDE ─────────────────────
   `(storage.foldername(name))[1]` es la primera carpeta. Si no es un uuid, el
   cast rebota — por eso se filtra la forma ANTES de castear: un `name` sin
   carpeta haria fallar la policy entera para todos, no solo para el intruso. */
CREATE OR REPLACE FUNCTION public._path_es_de_mi_publicacion(p_nombre text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_carpeta text; v_cta uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  v_carpeta := (storage.foldername(p_nombre))[1];
  IF v_carpeta IS NULL OR v_carpeta !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  THEN RETURN false; END IF;
  SELECT cuenta_comercial_id INTO v_cta FROM public.adopcion_publicacion WHERE id = v_carpeta::uuid;
  IF v_cta IS NULL THEN RETURN false; END IF;
  RETURN public._user_gestiona_cuenta_refugio(v_cta);
END $fn$;

REVOKE ALL ON FUNCTION public._path_es_de_mi_publicacion(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._path_es_de_mi_publicacion(text) TO authenticated;

DROP POLICY IF EXISTS adopcion_fotos_refugio_sube  ON storage.objects;
DROP POLICY IF EXISTS adopcion_fotos_refugio_edita ON storage.objects;
DROP POLICY IF EXISTS adopcion_fotos_refugio_borra ON storage.objects;

CREATE POLICY adopcion_fotos_refugio_sube ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'adopcion-fotos' AND public._path_es_de_mi_publicacion(name));
CREATE POLICY adopcion_fotos_refugio_edita ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'adopcion-fotos' AND public._path_es_de_mi_publicacion(name))
  WITH CHECK (bucket_id = 'adopcion-fotos' AND public._path_es_de_mi_publicacion(name));
CREATE POLICY adopcion_fotos_refugio_borra ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'adopcion-fotos' AND public._path_es_de_mi_publicacion(name));

/* La puerta de la tabla exige la MISMA forma, para que no se pueda registrar
   una fila cuyo archivo el bucket nunca va a aceptar. *Una fila que apunta a un
   archivo imposible es peor que no tener la fila: la pantalla la dibuja.* */
CREATE OR REPLACE FUNCTION public.agregar_foto_adoptable(p_publicacion_id uuid, p_path text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_cta uuid; v_id uuid; v_orden smallint;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT cuenta_comercial_id INTO v_cta FROM adopcion_publicacion WHERE id = p_publicacion_id FOR UPDATE;
  IF v_cta IS NULL THEN RAISE EXCEPTION 'publicacion_no_existe' USING ERRCODE='22023'; END IF;
  IF NOT public._user_gestiona_cuenta_refugio(v_cta) THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501';
  END IF;
  IF p_path IS NULL OR btrim(p_path) = '' THEN
    RAISE EXCEPTION 'path_requerido' USING ERRCODE='22023';
  END IF;
  IF (storage.foldername(btrim(p_path)))[1] IS DISTINCT FROM p_publicacion_id::text THEN
    RAISE EXCEPTION 'path_fuera_de_la_carpeta: la foto va en «%/»', p_publicacion_id
      USING ERRCODE='22023';
  END IF;

  SELECT COALESCE(max(orden)+1, 0) INTO v_orden FROM adopcion_foto WHERE publicacion_id = p_publicacion_id;
  IF v_orden > 19 THEN RAISE EXCEPTION 'tope_de_fotos: 20' USING ERRCODE='22023'; END IF;

  INSERT INTO adopcion_foto (publicacion_id, path, orden, subida_por)
       VALUES (p_publicacion_id, btrim(p_path), v_orden, auth.uid())
    RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'foto_id', v_id, 'orden', v_orden, 'es_portada', v_orden = 0);
END $fn$;
REVOKE ALL ON FUNCTION public.agregar_foto_adoptable(uuid,text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.agregar_foto_adoptable(uuid,text) TO authenticated;

/* ── ③ LA VISTA DEJA DE SER API PUBLICA ───────────────────────────────────── */
REVOKE SELECT ON public.v_adoptables_publicos FROM anon;

/* ═══ CINTURON ════════════════════════════════════════════════════════════ */
DO $cint$
DECLARE v_ok boolean; v_masc uuid; v_foto text; v_estado_previo text;
BEGIN
  -- ① CONTROL POSITIVO del helper: sobre una portada de un animal PUBLICADO
  --    tiene que dar true, y sobre cualquier otra cosa false.
  --    (hoy no hay publicaciones vivas ⇒ el positivo se siembra y se deshace)
  SELECT id, foto_url INTO v_masc, v_foto
    FROM mascotas WHERE familia_id IS NOT NULL AND foto_url IS NOT NULL
      AND estado_vida = 'activa' LIMIT 1;
  IF v_masc IS NULL THEN RAISE EXCEPTION 'CINTURON: no hay mascota con foto para medir'; END IF;
  /* Se guarda el valor EXACTO. La primera version de este cinturon restauraba
     con NULL «porque queda parecido» y la columna es NOT NULL ⇒ la migracion
     abortaba con las cinco mediciones ya hechas. **Es el mismo atajo que A1 ya
     habia curado, repetido en la migracion siguiente**: una cura que vive en un
     archivo no protege al que se escribe despues. */
  SELECT estado_adopcion INTO v_estado_previo FROM mascotas WHERE id = v_masc;

  IF public._objeto_es_portada_de_adoptable(v_foto) THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: el helper dice que si sobre un animal NO publicado';
  END IF;

  INSERT INTO adopcion_publicacion (mascota_id, cuenta_comercial_id, country_code,
                                    estado, ingresado_en)
  SELECT v_masc, (SELECT id FROM cuentas_comerciales LIMIT 1), 'EC', 'publicada', current_date - 40;

  IF NOT public._objeto_es_portada_de_adoptable(v_foto) THEN
    RAISE EXCEPTION 'CINTURON ROJO ①b: el helper dice que NO sobre un animal publicado — la vidriera seguiria sin fotos';
  END IF;

  -- ①c El memorial apaga la portada.
  UPDATE mascotas SET estado_vida = 'fallecida' WHERE id = v_masc;
  IF public._objeto_es_portada_de_adoptable(v_foto) THEN
    RAISE EXCEPTION 'CINTURON ROJO ①c: un animal fallecido sigue mostrando su cara';
  END IF;
  UPDATE mascotas SET estado_vida = 'activa' WHERE id = v_masc;

  -- ② Un path sin carpeta uuid no pasa, y no revienta la policy.
  IF public._path_es_de_mi_publicacion('suelta.jpg') THEN
    RAISE EXCEPTION 'CINTURON ROJO ②: un archivo sin carpeta entro';
  END IF;
  IF public._path_es_de_mi_publicacion('no-es-uuid/x.jpg') THEN
    RAISE EXCEPTION 'CINTURON ROJO ②b: una carpeta que no es uuid entro';
  END IF;
  IF public._path_es_de_mi_publicacion('00000000-0000-0000-0000-000000000000/x.jpg') THEN
    RAISE EXCEPTION 'CINTURON ROJO ②c: una publicacion inexistente entro';
  END IF;

  -- ③ La vista dejo de estar abierta a anon; los lectores siguen abiertos.
  IF has_table_privilege('anon','public.v_adoptables_publicos','SELECT') THEN
    RAISE EXCEPTION 'CINTURON ROJO ③: anon sigue bajandose el catalogo entero';
  END IF;
  IF NOT has_function_privilege('anon','public.obtener_adoptables(jsonb,text,integer)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON ROJO ③b: la vidriera quedo cerrada para anon';
  END IF;

  -- ④ CONTROL POSITIVO de ③: el lector DEFINER todavia ve la vista.
  PERFORM public.obtener_adoptables('{}'::jsonb, NULL, 5);

  -- ⑤ Las tres policies del bucket existen y NINGUNA es is_admin sola.
  IF (SELECT count(*) FROM pg_policy WHERE polrelid='storage.objects'::regclass
       AND polname IN ('adopcion_fotos_refugio_sube','adopcion_fotos_refugio_edita',
                       'adopcion_fotos_refugio_borra')) <> 3 THEN
    RAISE EXCEPTION 'CINTURON ROJO ⑤: falta alguna policy del bucket';
  END IF;

  RAISE NOTICE 'CINTURON A2b: 5 brazos verdes (7 rojos producidos, 3 controles positivos)';

  DELETE FROM adopcion_publicacion WHERE mascota_id = v_masc;
  UPDATE mascotas SET estado_adopcion = v_estado_previo WHERE id = v_masc;
  IF EXISTS (SELECT 1 FROM mascotas WHERE id = v_masc
              AND estado_adopcion IS DISTINCT FROM v_estado_previo) THEN
    RAISE EXCEPTION 'CINTURON: la mascota quedo con otro estado_adopcion';
  END IF;
END $cint$;

COMMIT;
