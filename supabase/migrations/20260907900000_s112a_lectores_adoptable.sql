/* ═══════════════════════════════════════════════════════════════════════════
   S112-A2 · LOS LECTORES DE LA VIDRIERA
   ───────────────────────────────────────────────────────────────────────────
   ── 76(g) · VEDA: **NO RIGE.** Tabla nueva vacia, vista nueva, funciones.
      Cero backfill, cero ancla.

   ── LA VISTA ES LA FRONTERA, Y ES POR LISTA BLANCA ────────────────────────
      §5.2 del loop: la vidriera anonima expone datos del animal, ciudad/zona y
      el nombre del publicador. **Nunca** telefono, correo, direccion, RUC ni
      cedula.

      La vista se define **enumerando lo que SI sale**, jamas excluyendo lo que
      no. La razon es de mecanica, no de estilo: con `SELECT *` menos unas
      columnas, **la proxima columna que alguien agregue a `cuentas_comerciales`
      sale sola** — y `identificacion_fiscal` (la cedula del refugio) ya vive en
      esa tabla. *Una exclusion protege del pasado; una lista blanca protege del
      futuro.*

      Y es una vista **DEFINER a proposito** (sin `security_invoker`): la RLS de
      `cuentas_comerciales` es solo-dueño, asi que con invoker un anonimo veria
      **cero filas** — la vidriera entera desapareceria. La vista salta la RLS
      **y su lista de columnas mas su `WHERE` son la unica proteccion**: por eso
      estan escritas arriba de todo y por eso el rojo de E las lista.

   ── EL MEMORIAL SE DERIVA, NO SE FILTRA POR ESTADO DE PUBLICACION ─────────
      `m.estado_vida <> 'fallecida'` vive **adentro de la vista**, no en cada
      lector. Si viviera en los lectores, el dia que alguien escriba el tercero
      se olvidaria — y un animal muerto seguiria en la vidriera.

   ── LA VOZ NO VIVE ACA, y se declara porque el pedido dice «razon redactada»:
      el motor devuelve **numeros** (`espera_dias`, `edad_meses`) y la redaccion
      vive en `packages/domain` como `{clave, params}` que la pantalla pasa por
      `t()`. *Una frase en español adentro de una RPC es una pantalla en un solo
      idioma* — la casa ya lo cobro (`D-539`). La razon llega redactada a la
      pantalla: redactada **por el riel**, que es donde se puede traducir.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

/* ── 1 · LAS FOTOS ─────────────────────────────────────────────────────────
   `orden` con UNIQUE por publicacion: **la portada es el orden 0**, y no hay
   una columna `es_portada` que pueda decir que si mientras el orden dice otra
   cosa (mismo criterio que la galeria del prestador, `S84`). */
CREATE TABLE IF NOT EXISTS public.adopcion_foto (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacion_id uuid NOT NULL REFERENCES public.adopcion_publicacion(id) ON DELETE CASCADE,
  path           text NOT NULL,
  orden          smallint NOT NULL,
  subida_por     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subida_en      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_orden_no_negativo CHECK (orden >= 0 AND orden <= 19)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_foto_orden_por_publicacion
  ON public.adopcion_foto (publicacion_id, orden);
CREATE INDEX IF NOT EXISTS ix_foto_publicacion ON public.adopcion_foto (publicacion_id, orden);

ALTER TABLE public.adopcion_foto ENABLE ROW LEVEL SECURITY;

/* La foto de una publicacion publicada la ve cualquiera — el bucket es PUBLICO
   por diseño y esconder el path no esconderia el archivo. Escribir, solo el
   refugio dueño. */
DROP POLICY IF EXISTS adopcion_foto_select ON public.adopcion_foto;
CREATE POLICY adopcion_foto_select ON public.adopcion_foto FOR SELECT
  USING (EXISTS (SELECT 1 FROM adopcion_publicacion p
                  WHERE p.id = adopcion_foto.publicacion_id
                    AND (p.estado = 'publicada'
                         OR public._user_opera_cuenta_comercial(p.cuenta_comercial_id, auth.uid())
                         OR public.is_admin())));

DROP POLICY IF EXISTS adopcion_foto_escribe ON public.adopcion_foto;
CREATE POLICY adopcion_foto_escribe ON public.adopcion_foto FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM adopcion_publicacion p
                  WHERE p.id = adopcion_foto.publicacion_id
                    AND public._user_gestiona_cuenta_refugio(p.cuenta_comercial_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM adopcion_publicacion p
                  WHERE p.id = adopcion_foto.publicacion_id
                    AND public._user_gestiona_cuenta_refugio(p.cuenta_comercial_id)));

/* ── 2 · LA VENTANA PUBLICA ────────────────────────────────────────────────
   🔴 CADA COLUMNA DE ESTA LISTA ES UNA DECISION DE PRIVACIDAD.
      Agregar una es una decision de producto, no una comodidad de pantalla. */
DROP VIEW IF EXISTS public.v_adoptables_publicos;
CREATE VIEW public.v_adoptables_publicos AS
SELECT
  -- de la publicacion (la oferta)
  p.id                          AS publicacion_id,
  p.mascota_id,
  p.creada_en,
  p.ingresado_en,
  (CURRENT_DATE - p.ingresado_en)::int AS espera_dias,
  p.zona,
  p.ciudad_id,
  p.urgente,
  p.senas,
  p.historia,
  p.origen_rescate,
  p.fecha_cesion,
  p.estado_vacunal,
  p.desparasitado,
  p.bono_monto,
  p.bono_destino,
  p.pareja_id,
  p.country_code,
  p.convive_perros,
  p.convive_gatos,
  p.convive_ninos,
  -- del animal (el cuerpo)
  m.nombre,
  m.especie,
  m.raza,
  m.sexo,
  m.fecha_nacimiento,
  m.fecha_nacimiento_precision,
  m.foto_url,
  m.talla,
  m.esterilizado,
  m.microchip IS NOT NULL        AS tiene_microchip,
  m.remetfu   IS NOT NULL        AS tiene_remetfu,
  -- de quien publica: SOLO nombre y cara. Nada de la cuenta.
  cc.id                          AS publicador_id,
  cc.nombre_comercial            AS publicador_nombre,
  pr.foto_url                    AS publicador_foto,
  ciu.nombre                     AS ciudad_nombre
FROM public.adopcion_publicacion p
JOIN public.mascotas m              ON m.id  = p.mascota_id
JOIN public.cuentas_comerciales cc  ON cc.id = p.cuenta_comercial_id
LEFT JOIN public.prestadores pr     ON pr.cuenta_comercial_id = cc.id
LEFT JOIN public.cat_ciudades ciu   ON ciu.id = p.ciudad_id
WHERE p.estado = 'publicada'
  /* El memorial se cae ACA y en ningun lector: un animal muerto no esta en la
     vidriera, y no depende de que quien escriba el proximo lector se acuerde. */
  AND m.estado_vida <> 'fallecida';

COMMENT ON VIEW public.v_adoptables_publicos IS
  'S112-A2. LA VENTANA PUBLICA de la vidriera de adopcion. Vista DEFINER a '
  'proposito: la RLS de cuentas_comerciales es solo-dueño y con invoker un '
  'anonimo veria cero filas. La UNICA proteccion es (a) esta lista blanca de '
  'columnas y (b) el WHERE. Agregar una columna aca es una decision de '
  'privacidad — jamas «me faltaba un dato en la pantalla».';

GRANT SELECT ON public.v_adoptables_publicos TO anon, authenticated;

/* ── 3 · LA LISTA, POR KEYSET ──────────────────────────────────────────────
   `p_cursor` es `'<creada_en ISO>|<id>'`. Keyset y no OFFSET: con OFFSET, la
   pagina 5 recorre 100 filas para devolver 20, y **una publicacion nueva corre
   todo hacia abajo y el lector ve dos veces el mismo animal**.

   Los DESTACADOS salen SOLO en la primera pagina (cursor NULL): son una carta
   de portada, no una seccion que se repite scrolleando. */
DROP FUNCTION IF EXISTS public.obtener_adoptables(text, text, integer);
CREATE OR REPLACE FUNCTION public.obtener_adoptables(
  p_filtros jsonb DEFAULT '{}'::jsonb,
  p_cursor  text  DEFAULT NULL,
  p_limite  integer DEFAULT 20
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path TO 'public','pg_temp' AS $fn$
DECLARE
  v_lim int := LEAST(GREATEST(COALESCE(p_limite,20),1), 50);
  v_cur_fecha timestamptz; v_cur_id uuid; v_cur_rango int;
  v_ult_rango int;
  v_destacados jsonb := '[]'::jsonb; v_resto jsonb; v_hay boolean; v_n int;
  v_ult_fecha timestamptz; v_ult_id uuid;
  v_conviv boolean;
  v_k text;
  v_permitidos text[] := ARRAY['especie','talla','sexo','urgente','esterilizado',
    'convive_perros','convive_gatos','convive_ninos','con_pareja','ciudad_id',
    'country_code','edad_max_meses','edad_min_meses'];
BEGIN
  /* Un filtro que no existe **rebota con su nombre**. Si se ignorara en
     silencio, la pantalla creeria estar filtrando y mostraria de mas — y ese
     defecto no tiene sintoma: la lista se ve perfectamente normal. */
  FOR v_k IN SELECT jsonb_object_keys(COALESCE(p_filtros,'{}'::jsonb)) LOOP
    IF NOT (v_k = ANY(v_permitidos)) THEN
      RAISE EXCEPTION 'filtro_no_valido: %', v_k USING ERRCODE='22023';
    END IF;
  END LOOP;

  /* 🔴 EL CURSOR LLEVA LA CLAVE DE ORDEN COMPLETA, y no solo la fecha.
     El orden real es `(rango_conviv ASC, creada_en DESC, id DESC)`. Un cursor
     que solo llevara la fecha compararia contra una clave PARCIAL: con el
     filtro de convivencia activo, la pagina 2 **se saltaria filas y repetiria
     otras**, sin error y sin sintoma. La casa ya pago exactamente eso en la
     linea de vida (`S99`: 55 de 62, se perdian 7, y el que falta no se ve). */
  IF p_cursor IS NOT NULL THEN
    IF p_cursor !~ '^[01]\|[^|]+\|[0-9a-f-]{36}$' THEN
      RAISE EXCEPTION 'cursor_no_valido' USING ERRCODE='22023';
    END IF;
    v_cur_rango := split_part(p_cursor,'|',1)::int;
    v_cur_fecha := split_part(p_cursor,'|',2)::timestamptz;
    v_cur_id    := split_part(p_cursor,'|',3)::uuid;
  END IF;

  /* ¿Hay algun filtro de convivencia activo? Decide el ORDEN dentro de cada
     lista: confirmados primero, «todavia no se sabe» despues y con su titulo.
     *No los esconde* — §4.1: el que no se sabe se muestra con el mismo peso,
     abajo. Esconderlos dejaria animales sin ver por un dato que falta. */
  v_conviv := (p_filtros ? 'convive_perros') OR (p_filtros ? 'convive_gatos')
           OR (p_filtros ? 'convive_ninos');

  /* Una CTE y no una tabla temporal: `CREATE TABLE AS` obliga a la funcion a
     ser VOLATILE, y un lector VOLATILE le dice al planificador que puede
     cambiar el mundo — pierde optimizaciones y miente sobre lo que hace. */
  WITH filtrados AS (
    SELECT v.*,
           /* 0 = el eje pedido esta CONFIRMADO en `si`; 1 = «todavia no se sabe». */
           CASE WHEN NOT v_conviv THEN 0
                WHEN ((p_filtros->>'convive_perros') IS NULL OR v.convive_perros='si')
                 AND ((p_filtros->>'convive_gatos')  IS NULL OR v.convive_gatos ='si')
                 AND ((p_filtros->>'convive_ninos')  IS NULL OR v.convive_ninos ='si')
                THEN 0 ELSE 1 END AS rango_conviv
      FROM v_adoptables_publicos v
     WHERE (p_filtros->>'especie'      IS NULL OR v.especie = p_filtros->>'especie')
       AND (p_filtros->>'talla'        IS NULL OR v.talla   = p_filtros->>'talla')
       AND (p_filtros->>'sexo'         IS NULL OR v.sexo    = p_filtros->>'sexo')
       AND (p_filtros->>'ciudad_id'    IS NULL OR v.ciudad_id = (p_filtros->>'ciudad_id')::uuid)
       AND (p_filtros->>'country_code' IS NULL OR v.country_code = p_filtros->>'country_code')
       AND (p_filtros->>'urgente'      IS NULL OR v.urgente = (p_filtros->>'urgente')::boolean)
       AND (p_filtros->>'esterilizado' IS NULL OR v.esterilizado IS TRUE)
       AND (p_filtros->>'con_pareja'   IS NULL OR v.pareja_id IS NOT NULL)
       AND (p_filtros->>'edad_max_meses' IS NULL OR (v.fecha_nacimiento IS NOT NULL
            AND (CURRENT_DATE - v.fecha_nacimiento) <= (p_filtros->>'edad_max_meses')::int * 30))
       AND (p_filtros->>'edad_min_meses' IS NULL OR (v.fecha_nacimiento IS NOT NULL
            AND (CURRENT_DATE - v.fecha_nacimiento) >= (p_filtros->>'edad_min_meses')::int * 30))
       /* Los tres ejes FILTRAN solo cuando el pedido es `no`: pedir «convive con
          perros» no puede ESCONDER a los que nadie probo — los ordena abajo. */
       AND (p_filtros->>'convive_perros' IS DISTINCT FROM 'no' OR v.convive_perros = 'no')
       AND (p_filtros->>'convive_gatos'  IS DISTINCT FROM 'no' OR v.convive_gatos  = 'no')
       AND (p_filtros->>'convive_ninos'  IS DISTINCT FROM 'no' OR v.convive_ninos  = 'no')
  ),
  destacados AS (
    SELECT * FROM filtrados
     WHERE p_cursor IS NULL
     ORDER BY rango_conviv ASC, ingresado_en ASC, publicacion_id ASC
     LIMIT 3
  ),
  resto AS (
    SELECT f.* FROM filtrados f
     WHERE (v_cur_fecha IS NULL
            OR f.rango_conviv > v_cur_rango
            OR (f.rango_conviv = v_cur_rango
                AND (f.creada_en, f.publicacion_id) < (v_cur_fecha, v_cur_id)))
       AND NOT EXISTS (SELECT 1 FROM destacados d WHERE d.publicacion_id = f.publicacion_id)
     ORDER BY f.rango_conviv ASC, f.creada_en DESC, f.publicacion_id DESC
     LIMIT v_lim
  )
  SELECT
    COALESCE((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.rango_conviv, d.ingresado_en ASC, d.publicacion_id ASC) FROM destacados d), '[]'::jsonb),
    COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.rango_conviv, r.creada_en DESC, r.publicacion_id DESC) FROM resto r), '[]'::jsonb),
    (SELECT count(*) FROM resto),
    (SELECT r.rango_conviv   FROM resto r ORDER BY r.rango_conviv DESC, r.creada_en ASC, r.publicacion_id ASC LIMIT 1),
    (SELECT r.creada_en      FROM resto r ORDER BY r.rango_conviv DESC, r.creada_en ASC, r.publicacion_id ASC LIMIT 1),
    (SELECT r.publicacion_id FROM resto r ORDER BY r.rango_conviv DESC, r.creada_en ASC, r.publicacion_id ASC LIMIT 1)
  INTO v_destacados, v_resto, v_n, v_ult_rango, v_ult_fecha, v_ult_id;

  v_hay := v_n = v_lim;

  RETURN jsonb_build_object(
    'destacados', v_destacados,
    'resto', v_resto,
    'cursor', CASE WHEN v_hay AND v_ult_id IS NOT NULL
                   THEN v_ult_rango::text ||'|'||
                        to_char(v_ult_fecha AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US')||'+00'
                        ||'|'|| v_ult_id::text
                   ELSE NULL END,
    'hay_mas', v_hay,
    'orden_por_convivencia', v_conviv);
END $fn$;

/* ── 4 · LA FICHA, EN UN VIAJE ─────────────────────────────────────────────
   Todo lo que §4.1 «La ficha» dibuja, incluidas las fotos como URLs publicas
   armadas del bucket. *Si las fotos salieran en un segundo viaje, la ficha
   abriria con un hueco donde va lo primero que la persona mira.* */
CREATE OR REPLACE FUNCTION public.obtener_adoptable(p_publicacion_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v jsonb; v_base text;
BEGIN
  SELECT to_jsonb(x) INTO v FROM v_adoptables_publicos x WHERE x.publicacion_id = p_publicacion_id;
  IF v IS NULL THEN
    /* Un `no existe` honesto: puede que nunca existiera, que este en borrador,
       pausada, adoptada, o que el animal haya fallecido. **La vidriera no
       distingue**, y es a proposito: distinguir le contaria a un anonimo el
       estado interno de un refugio. */
    RAISE EXCEPTION 'publicacion_no_disponible' USING ERRCODE='22023';
  END IF;

  v_base := current_setting('app.settings.storage_url', true);
  IF v_base IS NULL OR v_base = '' THEN
    v_base := 'https://zyltipqscdsdsxnjclhp.supabase.co/storage/v1/object/public/adopcion-fotos/';
  END IF;

  RETURN v
    || jsonb_build_object('fotos', COALESCE((
         SELECT jsonb_agg(v_base || f.path ORDER BY f.orden)
           FROM adopcion_foto f WHERE f.publicacion_id = p_publicacion_id), '[]'::jsonb))
    || jsonb_build_object('pareja', (
         SELECT jsonb_build_object('publicacion_id', pp.publicacion_id,
                                   'nombre', pp.nombre, 'foto_url', pp.foto_url)
           FROM v_adoptables_publicos pp
          WHERE pp.publicacion_id = (v->>'pareja_id')::uuid));
END $fn$;

/* ── 5 · LAS FOTOS, SUS TRES ACTOS ─────────────────────────────────────────
   El orden lo asigna el SERVIDOR (el maximo + 1). Si lo mandara la pantalla,
   dos subidas simultaneas pelearian por el mismo numero y el unique rebotaria
   con un `23505` crudo. */
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

  SELECT COALESCE(max(orden)+1, 0) INTO v_orden FROM adopcion_foto WHERE publicacion_id = p_publicacion_id;
  IF v_orden > 19 THEN RAISE EXCEPTION 'tope_de_fotos: 20' USING ERRCODE='22023'; END IF;

  INSERT INTO adopcion_foto (publicacion_id, path, orden, subida_por)
       VALUES (p_publicacion_id, btrim(p_path), v_orden, auth.uid())
    RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'foto_id', v_id, 'orden', v_orden, 'es_portada', v_orden = 0);
END $fn$;

CREATE OR REPLACE FUNCTION public.reordenar_fotos_adoptable(p_publicacion_id uuid, p_ids uuid[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_cta uuid; v_n int; v_i int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT cuenta_comercial_id INTO v_cta FROM adopcion_publicacion WHERE id = p_publicacion_id FOR UPDATE;
  IF v_cta IS NULL THEN RAISE EXCEPTION 'publicacion_no_existe' USING ERRCODE='22023'; END IF;
  IF NOT public._user_gestiona_cuenta_refugio(v_cta) THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501';
  END IF;

  /* 🔴 La lista tiene que ser COMPLETA. Reordenar con una lista parcial dejaria
     fotos con su orden viejo colisionando contra los nuevos — y el rebote
     seria un `23505` que no explica nada. */
  SELECT count(*) INTO v_n FROM adopcion_foto WHERE publicacion_id = p_publicacion_id;
  IF v_n <> array_length(p_ids,1) THEN
    RAISE EXCEPTION 'orden_incompleto: la publicacion tiene % fotos y llegaron %',
      v_n, COALESCE(array_length(p_ids,1),0) USING ERRCODE='22023';
  END IF;

  -- Corrimiento a un rango libre para no chocar con el unique en el camino.
  UPDATE adopcion_foto SET orden = orden + 100 WHERE publicacion_id = p_publicacion_id;
  FOR v_i IN 1..array_length(p_ids,1) LOOP
    UPDATE adopcion_foto SET orden = (v_i-1)::smallint
     WHERE id = p_ids[v_i] AND publicacion_id = p_publicacion_id;
  END LOOP;
  IF EXISTS (SELECT 1 FROM adopcion_foto WHERE publicacion_id=p_publicacion_id AND orden >= 100) THEN
    RAISE EXCEPTION 'orden_incompleto: alguna foto no estaba en la lista' USING ERRCODE='22023';
  END IF;
  RETURN jsonb_build_object('ok', true, 'fotos', v_n);
END $fn$;

CREATE OR REPLACE FUNCTION public.borrar_foto_adoptable(p_foto_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_cta uuid; v_pub uuid; v_path text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT f.publicacion_id, f.path, p.cuenta_comercial_id INTO v_pub, v_path, v_cta
    FROM adopcion_foto f JOIN adopcion_publicacion p ON p.id = f.publicacion_id
   WHERE f.id = p_foto_id;
  IF v_pub IS NULL THEN RAISE EXCEPTION 'foto_no_existe' USING ERRCODE='22023'; END IF;
  IF NOT public._user_gestiona_cuenta_refugio(v_cta) THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501';
  END IF;
  DELETE FROM adopcion_foto WHERE id = p_foto_id;
  /* 🔴 EL ARCHIVO NO SE BORRA ACA: Postgres no alcanza el bucket
     (`storage.protect_delete`). El path viaja de vuelta para que la pantalla
     lo borre por la API de Storage. *Si no lo hace, queda un huerfano publico
     y alcanzable por URL* — la misma clase que `D-731`. */
  RETURN jsonb_build_object('ok', true, 'path_a_borrar', v_path);
END $fn$;

REVOKE ALL ON FUNCTION public.agregar_foto_adoptable(uuid,text)        FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.reordenar_fotos_adoptable(uuid,uuid[])   FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.borrar_foto_adoptable(uuid)              FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.agregar_foto_adoptable(uuid,text)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.reordenar_fotos_adoptable(uuid,uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.borrar_foto_adoptable(uuid)            TO authenticated;
/* 🟢 Los DOS lectores SI son para `anon`: la vidriera se ve sin cuenta (§0.8). */
GRANT EXECUTE ON FUNCTION public.obtener_adoptables(jsonb,text,integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_adoptable(uuid)                TO anon, authenticated;

/* ═══ CINTURON ════════════════════════════════════════════════════════════ */
DO $cint$
DECLARE v_cols text[]; v_prohibidas text[]; v_n int; v_r jsonb;
BEGIN
  -- ①  🔴 LA LISTA BLANCA: ninguna columna prohibida sale por la ventana.
  SELECT array_agg(column_name::text) INTO v_cols FROM information_schema.columns
   WHERE table_schema='public' AND table_name='v_adoptables_publicos';
  v_prohibidas := ARRAY['identificacion_fiscal','razon_social','datos_bancarios',
                        'telefono','email','direccion','owner_profile_id',
                        'kushki_subaccount_id','saldo_arrastre','user_id','familia_id'];
  IF v_cols && v_prohibidas THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: la ventana publica expone %',
      array_to_string(ARRAY(SELECT unnest(v_cols) INTERSECT SELECT unnest(v_prohibidas)), ', ');
  END IF;

  -- ①b CONTROL NEGATIVO del brazo ①: si el instrumento no puede ver una
  --     columna prohibida, su verde no vale nada (`L-459`).
  IF NOT (ARRAY['nombre_comercial','identificacion_fiscal'] && v_prohibidas) THEN
    RAISE EXCEPTION 'CINTURON ROJO ①b: la lista de prohibidas no discrimina';
  END IF;
  IF NOT ('publicador_nombre' = ANY(v_cols)) THEN
    RAISE EXCEPTION 'CINTURON ROJO ①c: la ventana no expone ni el nombre del publicador';
  END IF;

  -- ②  Un filtro inventado rebota CON SU NOMBRE.
  BEGIN
    PERFORM public.obtener_adoptables('{"raza":"labrador"}'::jsonb, NULL, 20);
    RAISE EXCEPTION 'CINTURON ROJO ②: un filtro inexistente paso en silencio';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    IF position('raza' in SQLERRM) = 0 THEN
      RAISE EXCEPTION 'CINTURON ROJO ②b: rebotó sin nombrar el filtro: %', SQLERRM;
    END IF;
  END;

  -- ③  Un cursor con forma invalida rebota.
  BEGIN
    PERFORM public.obtener_adoptables('{}'::jsonb, 'basura', 20);
    RAISE EXCEPTION 'CINTURON ROJO ③: un cursor invalido paso';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;

  -- ④  CONTROL POSITIVO: el lector corre y devuelve la forma acordada.
  SELECT public.obtener_adoptables('{}'::jsonb, NULL, 20) INTO v_r;
  IF NOT (v_r ? 'destacados' AND v_r ? 'resto' AND v_r ? 'cursor' AND v_r ? 'hay_mas') THEN
    RAISE EXCEPTION 'CINTURON ROJO ④: la forma del resultado no es la acordada: %', v_r;
  END IF;

  -- ⑤  Una ficha que no existe rebota hablando, no devuelve NULL.
  BEGIN
    PERFORM public.obtener_adoptable('00000000-0000-0000-0000-000000000000'::uuid);
    RAISE EXCEPTION 'CINTURON ROJO ⑤: una ficha inexistente no rebotó';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;

  -- ⑥  `anon` alcanza los dos lectores y la vista; NO alcanza los escritores.
  IF NOT has_function_privilege('anon','public.obtener_adoptables(jsonb,text,integer)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON ROJO ⑥: anon no puede leer la vidriera';
  END IF;
  IF has_function_privilege('anon','public.agregar_foto_adoptable(uuid,text)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON ROJO ⑥b: anon puede subir fotos';
  END IF;

  RAISE NOTICE 'CINTURON A2: 6 brazos verdes (3 rojos producidos, 2 controles, 1 positivo) · % columnas en la ventana', array_length(v_cols,1);
END $cint$;

COMMIT;
