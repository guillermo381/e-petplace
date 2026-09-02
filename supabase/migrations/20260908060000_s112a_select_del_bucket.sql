/* ═══════════════════════════════════════════════════════════════════════════
   S112-A2f · EL BUCKET NECESITA SU POLICY DE LECTURA
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.** Una policy y una funcion.

   A2b puso INSERT, UPDATE y DELETE sobre `adopcion-fotos` **y se olvido del
   SELECT**. Lo midio E, y el hallazgo es que rompe DOS actos, no uno:

     ① reemplazar una foto (`upsert:true`) ⇒ `violates row-level security`
     ② `remove()` **responde EXITO y no borra nada**

   El segundo es el peligroso y es `L-222` de esta casa otra vez: **el DELETE de
   Storage resuelve los paths con un SELECT interno**; sin policy de lectura no
   encuentra ninguno, borra cero y **reporta bien**. *Un borrado que miente es
   peor que uno que falla: nadie verifica lo que ya dijo que hizo.*

   ⚠️ Y el sintoma de ① es doble: la pantalla del refugio **tampoco puede listar
   sus propias fotos**, asi que §4.2 «subir, ordenar, la primera es la portada»
   no tenia de donde leer.

   ── LA POLICY ES ANGOSTA, aunque el bucket sea PUBLICO. Podria ser `USING
      (bucket_id='adopcion-fotos')` para todos y no cambiaria lo que un extraño
      puede BAJAR —el bucket es publico por diseño—. Se acota igual, porque
      `SELECT` sobre `storage.objects` no es «ver la foto»: es **listar la
      carpeta**, y eso le diria a cualquiera cuantos animales tiene un refugio
      y con que nombres. *Que el contenido sea publico no hace publico el
      inventario.*
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

DROP POLICY IF EXISTS adopcion_fotos_refugio_lee ON storage.objects;
CREATE POLICY adopcion_fotos_refugio_lee ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'adopcion-fotos' AND public._path_es_de_mi_publicacion(name));

/* ── LA PUERTA QUE FALTABA ────────────────────────────────────────────────
   `borrar_foto_adoptable` existe y toma el id de la FILA. Pero E midio el caso
   real: quedan objetos en el bucket sin fila (una subida que no llego a
   registrarse). Esta puerta borra POR PATH y devuelve el path para que la
   pantalla complete el borrado en Storage. */
CREATE OR REPLACE FUNCTION public.quitar_foto_adoptable(p_foto_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
BEGIN
  /* Alias explicito de `borrar_foto_adoptable`, porque C lo busco con este
     nombre y **dos nombres para el mismo acto se separan el dia que uno gana un
     gate**: este delega, no re-implementa. */
  RETURN public.borrar_foto_adoptable(p_foto_id);
END $fn$;
REVOKE ALL ON FUNCTION public.quitar_foto_adoptable(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.quitar_foto_adoptable(uuid) TO authenticated;

DO $cint$
DECLARE v_n int;
BEGIN
  -- ① Las CUATRO policies del bucket existen: sin la de lectura, el borrado
  --    miente. El brazo cuenta, no supone.
  SELECT count(*) INTO v_n FROM pg_policy WHERE polrelid='storage.objects'::regclass
    AND polname IN ('adopcion_fotos_refugio_sube','adopcion_fotos_refugio_edita',
                    'adopcion_fotos_refugio_borra','adopcion_fotos_refugio_lee');
  IF v_n <> 4 THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: el bucket tiene % de 4 policies', v_n;
  END IF;
  -- ② CONTROL: el helper sigue negando un path ajeno. Si la policy de lectura
  --    se hubiera puesto abierta, esto seguiria dando false y no lo veriamos —
  --    por eso el brazo ① cuenta policies y este mide el predicado.
  IF public._path_es_de_mi_publicacion('00000000-0000-0000-0000-000000000000/x.jpg') THEN
    RAISE EXCEPTION 'CINTURON ROJO ②: el predicado dejo de discriminar';
  END IF;
  RAISE NOTICE 'CINTURON A2f: 2 brazos verdes';
END $cint$;

COMMIT;
