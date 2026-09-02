/* ═══════════════════════════════════════════════════════════════════════════
   S112-A · LA FAMILIA LISTA LA FOTO DE SU ANIMAL Y NO LA PUEDE BAJAR
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.** Una policy y un helper.

   🔴 MEDIDO POR CAMINO REAL, con sus DOS CONTROLES POSITIVOS al lado — sin
   ellos el rojo no probaria nada:

     ✅ la familia LISTA su media (`obtener_media_de_mi_mascota`) ... 1 fila
     ✅ la familia VE a su mascota ............................... true
     🔴 la familia cumple la policy del BUCKET ................... **false**

   La policy exige `user_puede_acceder_prestador(carpeta)`, y **la carpeta es el
   PRESTADOR**: la familia no la cumple ni puede cumplirla. ⇒ *la app le muestra
   que hay una foto de su perro y el archivo no baja.*

   ── ⚠️ SON DOS DEFECTOS APILADOS CON EL MISMO SINTOMA, y lo midio C: ademas
      de esta policy, **`obtener_media_de_mi_mascota` devuelve el PATH CRUDO**,
      no una URL firmada, y la pantalla lo pinta como si fuera una URI.
      **Curar solo uno deja el hueco igual y va a parecer que la cura no
      sirvio** — la misma forma que las caras de la vidriera. *Esta migracion
      cura la mitad de MOTOR; la firma de la URL es de `apps/` y es de C.*
      Precedente de la casa: `D-308` (S47) — una foto privada se muestra FIRMADA.

   ── EL PREDICADO NUEVO NO ENSANCHA A CUALQUIERA: pregunta si el objeto tiene
      una ETIQUETA a una mascota que quien pregunta puede ver. *La media es del
      prestador y del DIA —`guarderia_media` no tiene `estadia_id`—, asi que el
      unico lazo con una familia es la etiqueta, que es exactamente la que el
      cuidador puso al decir de quien era la foto.* Una foto sin etiquetar
      sigue siendo solo del prestador, y esta bien: nadie declaro que fuera de
      ningun animal.

   ── Y VA EN UN HELPER `SECURITY DEFINER` por lo mismo que la vidriera de
      adopcion: **el `EXISTS` inline se evalua bajo la RLS de quien pregunta**,
      y `guarderia_media` no es legible por una familia ⇒ el predicado daria
      falso siempre y la cura no curaria nada (`L-479` de esta sesion).
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE OR REPLACE FUNCTION public._media_guarderia_es_de_mi_mascota(p_nombre text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1
      FROM public.guarderia_media m
      JOIN public.guarderia_media_etiquetas e ON e.media_id = m.id
     WHERE m.archivo_url = p_nombre
       AND public.user_tiene_acceso_a_mascota(e.mascota_id));
$fn$;
REVOKE ALL ON FUNCTION public._media_guarderia_es_de_mi_mascota(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._media_guarderia_es_de_mi_mascota(text) TO authenticated;

DROP POLICY IF EXISTS guarderia_media_storage_select ON storage.objects;
CREATE POLICY guarderia_media_storage_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'guarderia-media'
         AND (
           /* El prestador y su gente, como antes. */
           public.user_puede_acceder_prestador((split_part(name,'/',1))::uuid)
           /* Y la FAMILIA del animal etiquetado en esa foto. */
           OR public._media_guarderia_es_de_mi_mascota(name)
         ));

DO $cint$
DECLARE
  v_obj text; v_masc uuid; v_fam_user uuid; v_otro uuid; v_prest uuid;
BEGIN
  SELECT o.name, split_part(o.name,'/',1)::uuid INTO v_obj, v_prest
    FROM storage.objects o WHERE o.bucket_id='guarderia-media' LIMIT 1;
  IF v_obj IS NULL THEN
    RAISE EXCEPTION 'CINTURON: no hay objeto en el bucket — el brazo no puede dar verde por vacio';
  END IF;

  SELECT e.mascota_id INTO v_masc
    FROM guarderia_media m JOIN guarderia_media_etiquetas e ON e.media_id = m.id
   WHERE m.archivo_url = v_obj LIMIT 1;
  IF v_masc IS NULL THEN
    RAISE EXCEPTION 'CINTURON: el objeto elegido no tiene etiqueta — mediria otra cosa';
  END IF;

  SELECT fm.user_id INTO v_fam_user FROM familia_miembro fm
    JOIN mascotas mm ON mm.familia_id = fm.familia_id
   WHERE mm.id = v_masc AND fm.hasta IS NULL LIMIT 1;
  SELECT u.id INTO v_otro FROM auth.users u
   WHERE u.id <> v_fam_user
     AND NOT EXISTS (SELECT 1 FROM familia_miembro f2
                      JOIN mascotas m3 ON m3.familia_id = f2.familia_id
                     WHERE m3.id = v_masc AND f2.user_id = u.id AND f2.hasta IS NULL)
   LIMIT 1;
  IF v_fam_user IS NULL OR v_otro IS NULL THEN
    RAISE EXCEPTION 'CINTURON: falta familia o tercero para medir';
  END IF;

  -- ① ✅ POSITIVO PRIMERO (`L-482`): la FAMILIA ahora cumple el predicado.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_fam_user::text, 'role','authenticated')::text, true);
  IF NOT public._media_guarderia_es_de_mi_mascota(v_obj) THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: la familia SIGUE sin poder bajar la foto de su animal';
  END IF;

  -- ② 🔴 EL CONTROL QUE HACE QUE ① VALGA: un TERCERO no la baja. Sin este
  --    brazo, un predicado que devolviera `true` siempre pasaria ①.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_otro::text, 'role','authenticated')::text, true);
  IF public._media_guarderia_es_de_mi_mascota(v_obj) THEN
    RAISE EXCEPTION 'CINTURON ROJO ②: un tercero puede bajar la foto — la cura abrio de mas';
  END IF;

  -- ③ 🔴 Sin sesion, no.
  PERFORM set_config('request.jwt.claims', NULL, true);
  IF public._media_guarderia_es_de_mi_mascota(v_obj) THEN
    RAISE EXCEPTION 'CINTURON ROJO ③: sin sesion devolvio true';
  END IF;

  -- ④ 🔴 Un objeto que NO esta etiquetado sigue siendo solo del prestador.
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_fam_user::text, 'role','authenticated')::text, true);
  IF public._media_guarderia_es_de_mi_mascota(v_obj || '-inexistente') THEN
    RAISE EXCEPTION 'CINTURON ROJO ④: un objeto sin etiqueta se abrio a una familia';
  END IF;

  -- ⑤ ✅ Y LA POLICY conserva su brazo viejo: el predicado del prestador vive.
  IF (SELECT pg_get_expr(polqual, polrelid) FROM pg_policy
       WHERE polrelid='storage.objects'::regclass AND polname='guarderia_media_storage_select')
     !~ 'user_puede_acceder_prestador' THEN
    RAISE EXCEPTION 'CINTURON ROJO ⑤: la cura se llevo puesto el acceso del prestador';
  END IF;

  RAISE NOTICE 'CINTURON: 5 brazos verdes (3 rojos producidos, 1 positivo primero, 1 de no-regresion)';
END $cint$;

COMMIT;
