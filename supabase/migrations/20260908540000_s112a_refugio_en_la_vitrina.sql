-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · A6 · EL REFUGIO ENTRA A LA VITRINA QUE YA EXISTE
--
-- Orden del founder: *reusá la vitrina del prestador, no una nueva*. Medido
-- por qué se podía y qué costaba:
--   · `v_prestadores_publicos` YA es la lista blanca de §5.2 — nombre, logo,
--     ciudad, sector, descripción, portadas, clip — y **no expone teléfono,
--     correo, dirección, cédula ni RUC**.
--   · `v_adoptables_publicos` YA hace `LEFT JOIN prestadores ON
--     cuenta_comercial_id` ⇒ el modelo anticipaba este reuso.
--   · **Ninguna función discrimina por `tipo` literal** (censo) y la vista
--     lo expone pero **no filtra por él**.
--   · `obtenerPerfilesPublicos` **resuelve por id, jamás lista** ⇒ un refugio
--     NO se cuela en Explorar como prestador reservable. *Ése era el riesgo*
--     *real del reuso y está medido, no supuesto.*
--
-- 🔴 La alternativa (un lector propio) se descartó por lo que dijo C y es
-- correcto: **crea una segunda fuente que puede divergir de la primera** —
-- y el día que diverjan, una de las dos muestra datos viejos sin avisar.
--
-- 🔴 EL LÍMITE DE ESTA DECISIÓN, MEDIDO Y DECLARADO — no lo descubra el
-- founder con un refugio real: `uq_prestadores_user_id` es **1 humano = 1
-- prestador** (`MODELO_FINANCIERO` §2.7). ⇒ **una clínica que además rescata
-- NO puede tener fila de refugio**: ya tiene la suya de clínica. Medido hoy:
-- de 8 cuentas, 4 libres (entre ellas el refugio de prueba) y 4 ya con
-- prestador — **Clínica Aurora es una de las que NO podría**.
--
-- *No se toca ese índice acá.* Sostiene el modelo de oficios entero y
-- ensancharlo para este caso sería mover una regla de plataforma desde un
-- frente que no la decide. **El día que una clínica quiera publicar en
-- adopción, esto se cobra** — y entonces la pregunta es del founder: ¿un
-- humano puede tener dos prestadores, o el refugio deja de ser un prestador?
--
-- 76(g) — NO RIGE: el CHECK se ensancha sin tocar filas (cero `refugio` hoy).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.prestadores DROP CONSTRAINT prestadores_tipo_check;
ALTER TABLE public.prestadores ADD CONSTRAINT prestadores_tipo_check
  CHECK (tipo = ANY (ARRAY['clinica_veterinaria','veterinario_independiente','grooming',
                           'paseador','hotel_mascotas','adiestramiento','laboratorio',
                           'refugio','otro']));

-- ═══ EL FILTRO POR PUBLICADOR ═══
CREATE OR REPLACE FUNCTION public.obtener_adoptables(p_filtros jsonb DEFAULT '{}'::jsonb, p_cursor text DEFAULT NULL::text, p_limite integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
    'country_code','edad_max_meses','edad_min_meses',
    /* S112-A · pedido de C para la vitrina del refugio. **Va acá y no en el
       cliente**: la lista es keyset paginada, así que filtrar la página que
       tocó mostraría «tres de sus animales» sobre un refugio que tiene doce
       — *una lista incompleta que se ve completa*, que es el mismo modo de
       falla que este archivo ya cerró en el cursor. */
    'publicador_id'];
BEGIN
  
  FOR v_k IN SELECT jsonb_object_keys(COALESCE(p_filtros,'{}'::jsonb)) LOOP
    IF NOT (v_k = ANY(v_permitidos)) THEN
      RAISE EXCEPTION 'filtro_no_valido: %', v_k USING ERRCODE='22023';
    END IF;
  END LOOP;

  
  IF p_cursor IS NOT NULL THEN
    IF p_cursor !~ '^[01]\|[^|]+\|[0-9a-f-]{36}$' THEN
      RAISE EXCEPTION 'cursor_no_valido' USING ERRCODE='22023';
    END IF;
    v_cur_rango := split_part(p_cursor,'|',1)::int;
    v_cur_fecha := split_part(p_cursor,'|',2)::timestamptz;
    v_cur_id    := split_part(p_cursor,'|',3)::uuid;
  END IF;

  
  v_conviv := (p_filtros ? 'convive_perros') OR (p_filtros ? 'convive_gatos')
           OR (p_filtros ? 'convive_ninos');

  
  WITH filtrados AS (
    SELECT v.*,
           
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
       AND (p_filtros->>'publicador_id' IS NULL OR v.publicador_id = (p_filtros->>'publicador_id')::uuid)
       AND (p_filtros->>'urgente'      IS NULL OR v.urgente = (p_filtros->>'urgente')::boolean)
       AND (p_filtros->>'esterilizado' IS NULL OR v.esterilizado = 'si')
       AND (p_filtros->>'con_pareja'   IS NULL OR v.pareja_id IS NOT NULL)
       AND (p_filtros->>'edad_max_meses' IS NULL OR (v.fecha_nacimiento IS NOT NULL
            AND (CURRENT_DATE - v.fecha_nacimiento) <= (p_filtros->>'edad_max_meses')::int * 30))
       AND (p_filtros->>'edad_min_meses' IS NULL OR (v.fecha_nacimiento IS NOT NULL
            AND (CURRENT_DATE - v.fecha_nacimiento) >= (p_filtros->>'edad_min_meses')::int * 30))
       
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
END $function$

;

-- ═══ CINTURÓN — con su control negativo, que es el que hace válido al positivo ═══
DO $c$
DECLARE v_n int; v_err text;
BEGIN
  /* ① El CHECK acepta 'refugio'…
     ⚠️ El `whatsapp` va en E.164 VÁLIDO a propósito: `prestadores` tiene NUEVE
     CHECKs y **cualquiera cae en el mismo handler**. Mi primer intento usó
     '+000' y el cinturón reportó *«el CHECK sigue rechazando refugio»*
     midiendo el de WhatsApp — **un rojo del instrumento, no del hecho**. Por
     eso ahora el handler NOMBRA la restricción que falló en vez de suponerla. */
  BEGIN
    INSERT INTO prestadores (user_id, tipo, nombre_comercial, whatsapp, cuenta_comercial_id)
    /* Una cuenta cuyo dueño NO tenga ya un prestador — si no, el rebote es
       de `uq_prestadores_user_id` y **el cinturón mediría el índice, no el
       CHECK que vino a probar**. */
    SELECT cc.owner_profile_id, 'refugio', '__cinturon__', '+593999000111', cc.id
      FROM cuentas_comerciales cc
      LEFT JOIN prestadores p ON p.user_id = cc.owner_profile_id
     WHERE p.id IS NULL LIMIT 1;
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS v_err = CONSTRAINT_NAME;
    RAISE EXCEPTION 'CINTURON: el INSERT de refugio rebotó contra «%»', v_err;
  END;

  /* …② y NO acepta cualquier cosa. Sin este brazo, el de arriba también
     pasaría con un CHECK borrado — y un vocabulario abierto deja entrar
     cualquier oficio inventado. */
  BEGIN
    UPDATE prestadores SET tipo = '__inventado__' WHERE nombre_comercial='__cinturon__';
    RAISE EXCEPTION 'CINTURON: el CHECK dejo pasar un tipo inventado';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  DELETE FROM prestadores WHERE nombre_comercial='__cinturon__';
  SELECT count(*) INTO v_n FROM prestadores WHERE nombre_comercial='__cinturon__';
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: quedo residuo (%)', v_n; END IF;

  /* ③ El filtro nuevo se ACEPTA… */
  PERFORM public.obtener_adoptables(
    p_filtros := jsonb_build_object('publicador_id', gen_random_uuid()));

  /* …④ y uno inventado SIGUE rebotando. Si el ensanche hubiera abierto la
     lista blanca entera, este brazo lo caza. */
  BEGIN
    PERFORM public.obtener_adoptables(p_filtros := jsonb_build_object('color_de_ojos','verde'));
    RAISE EXCEPTION 'CINTURON: la lista blanca de filtros quedo ABIERTA';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    IF v_err NOT LIKE 'filtro_no_valido%' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'CINTURON VERDE: refugio entra al tipo, publicador_id al filtro, y lo inventado sigue rebotando';
END $c$;
