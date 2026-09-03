-- S112-A · LOS DOS LECTORES DE LA LISTA DICEN CUÁNTOS SIN LEER
-- 76(g) — NO RIGE: lectores, sin backfill y sin anclas.
-- L-119: DROP explícito porque cambia el TABLE de retorno.
DROP FUNCTION IF EXISTS public.obtener_mis_solicitudes_adopcion();
DROP FUNCTION IF EXISTS public.obtener_solicitudes_de_mis_publicaciones(boolean);
CREATE OR REPLACE FUNCTION public.obtener_mis_solicitudes_adopcion()
 RETURNS TABLE(solicitud_id uuid, publicacion_id uuid, estado text, creada_en timestamp with time zone, cerrada_en timestamp with time zone, mascota_id uuid, mascota_nombre text, mascota_especie text, mascota_foto_url text, publicador_nombre text, mensajes jsonb, sin_leer integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT s.id, s.publicacion_id, s.estado, s.creada_en, s.cerrada_en,
         m.id, m.nombre, m.especie, m.foto_url, c.nombre_comercial,
         public._hilo_mensajes(s.id),
         /* 🔴 SE CUENTA EN EL SERVIDOR, y la razón es de C: derivarlo en la
            pantalla obliga a **traer los mensajes de todos los hilos para
            contar los de cada uno** — hoy anda porque la lista ya los trae
            para la vista previa, *y se rompe el día que la lista pagine*.
            Un contador derivado en el cliente depende de cuántas páginas se
            pidieron, que es exactamente lo que un contador no puede depender.

            Sin fila en `adopcion_lectura` **todo cuenta como sin leer** — es
            lo correcto: nunca abrió el hilo. Y **los propios no cuentan**:
            *nadie tiene mensajes sin leer de sí mismo.* */
         (SELECT count(*)::int FROM adopcion_mensaje am
           WHERE am.solicitud_id = s.id
             AND am.autor_user_id IS DISTINCT FROM auth.uid()
             AND am.creado_en > COALESCE(
                   (SELECT l.leido_hasta FROM adopcion_lectura l
                     WHERE l.solicitud_id = s.id AND l.user_id = auth.uid()),
                   '-infinity'::timestamptz))
    FROM adopcion_solicitud s
    JOIN adopcion_publicacion p ON p.id = s.publicacion_id
    JOIN mascotas m             ON m.id = p.mascota_id
    JOIN cuentas_comerciales c  ON c.id = p.cuenta_comercial_id
   WHERE s.solicitante_user_id = auth.uid()
   ORDER BY s.creada_en DESC;
END $function$

;
CREATE OR REPLACE FUNCTION public.obtener_solicitudes_de_mis_publicaciones(p_solo_por_revisar boolean DEFAULT false)
 RETURNS TABLE(solicitud_id uuid, publicacion_id uuid, estado text, creada_en timestamp with time zone, cerrada_en timestamp with time zone, solicitante_user_id uuid, solicitante_nombre text, mascota_id uuid, mascota_nombre text, mascota_especie text, mascota_foto_url text, mensajes jsonb, sin_leer integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT s.id, s.publicacion_id, s.estado, s.creada_en, s.cerrada_en,
         s.solicitante_user_id, pr.nombre,
         
         m.id, m.nombre, m.especie, m.foto_url,
         public._hilo_mensajes(s.id),
         /* 🔴 SE CUENTA EN EL SERVIDOR, y la razón es de C: derivarlo en la
            pantalla obliga a **traer los mensajes de todos los hilos para
            contar los de cada uno** — hoy anda porque la lista ya los trae
            para la vista previa, *y se rompe el día que la lista pagine*.
            Un contador derivado en el cliente depende de cuántas páginas se
            pidieron, que es exactamente lo que un contador no puede depender.

            Sin fila en `adopcion_lectura` **todo cuenta como sin leer** — es
            lo correcto: nunca abrió el hilo. Y **los propios no cuentan**:
            *nadie tiene mensajes sin leer de sí mismo.* */
         (SELECT count(*)::int FROM adopcion_mensaje am
           WHERE am.solicitud_id = s.id
             AND am.autor_user_id IS DISTINCT FROM auth.uid()
             AND am.creado_en > COALESCE(
                   (SELECT l.leido_hasta FROM adopcion_lectura l
                     WHERE l.solicitud_id = s.id AND l.user_id = auth.uid()),
                   '-infinity'::timestamptz))
    FROM adopcion_solicitud s
    JOIN adopcion_publicacion p ON p.id = s.publicacion_id
    JOIN mascotas m             ON m.id = p.mascota_id
    LEFT JOIN profiles pr       ON pr.id = s.solicitante_user_id
   
   WHERE public._user_publico_esta_publicacion(s.publicacion_id, auth.uid())
     AND (NOT p_solo_por_revisar OR s.estado IN ('recibida','en_conversacion'))
   ORDER BY s.creada_en DESC;
END $function$

;
REVOKE ALL ON FUNCTION public.obtener_mis_solicitudes_adopcion() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_mis_solicitudes_adopcion() TO authenticated;
REVOKE ALL ON FUNCTION public.obtener_solicitudes_de_mis_publicaciones(boolean) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_solicitudes_de_mis_publicaciones(boolean) TO authenticated;

-- ═══ CINTURÓN — con su control negativo, que es el que lo hace válido ═══
DO $c$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['public.obtener_mis_solicitudes_adopcion()',
                           'public.obtener_solicitudes_de_mis_publicaciones(boolean)'] LOOP
    IF pg_get_function_result(r::regprocedure) NOT ILIKE '%sin_leer%' THEN
      RAISE EXCEPTION 'CINTURON: % no trae sin_leer', r;
    END IF;
    /* L-119: lo que ya traían no puede haberse perdido al re-crear. */
    IF pg_get_function_result(r::regprocedure) NOT ILIKE '%mensajes%'
       OR pg_get_function_result(r::regprocedure) NOT ILIKE '%mascota_especie%' THEN
      RAISE EXCEPTION 'CINTURON: % perdio una columna al re-crear', r;
    END IF;
  END LOOP;

  /* 🔴 EL CONTROL: el contador NO cuenta los mensajes propios. Sin este brazo,
     una cuenta que contara todo daría números que suben solos al escribir —
     *y la persona vería «1 sin leer» de un mensaje que acaba de mandar.* */
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public'
         AND p.proname IN ('obtener_mis_solicitudes_adopcion','obtener_solicitudes_de_mis_publicaciones')
         AND regexp_replace(p.prosrc,'/\*.*?\*/','','gs') ILIKE '%autor_user_id IS DISTINCT FROM auth.uid()%') <> 2
  THEN
    RAISE EXCEPTION 'CINTURON: algun lector cuenta los mensajes PROPIOS como sin leer';
  END IF;

  RAISE NOTICE 'CINTURON VERDE: los dos lectores cuentan sin leer, y ninguno cuenta los propios';
END $c$;
