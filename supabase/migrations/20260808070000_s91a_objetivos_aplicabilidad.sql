-- ============================================================================
-- S91-A · LOS OBJETIVOS GANAN APLICABILIDAD — el hueco que A había declarado
-- ============================================================================
-- HALLAZGO DE D, y me corrige: cuando construí la validación de aplicabilidad
-- de la bitácora (`20260808030000`) dejé el brazo `objetivo` AFUERA y lo
-- declaré fuera de alcance: *«ese catálogo no tiene ejes de especie ni
-- sujeto, y dárselos es otra letra»*. **La declaración era cierta y la
-- consecuencia era peor de lo que dije: los 23 objetivos —todos de
-- adiestramiento CANINO— caían enteros sobre cualquier mascota**, así que la
-- bitácora de un gato ofrecía «Pasea sin tirar de la correa» y la de un
-- acuario también. D lo midió y lo nombró: era **la segunda fuente del 🔴 del
-- acuario**, la que quedó viva después de curar la primera.
--
-- **UN ALCANCE DECLARADO NO DEJA DE SER UN AGUJERO POR ESTAR DECLARADO.** Es
-- la misma forma que el «límite» que este mismo día se le escribió al guard
-- de la veda y cobró a las horas. *Declarar es honesto; no es una cura.*
--
-- ── LA APLICABILIDAD NO SE INVENTA: SE DERIVA DE DONDE YA VIVE ─────────────
-- Los 23 son de un servicio que es **de perros y solo de perros**, y eso está
-- dicho en DOS lugares independientes, medidos antes de sembrar:
--   · `MODELO_ADIESTRAMIENTO` §2 — «ESPECIES: solo perros v1 (founder S62)»
--   · `tipos_servicio.especies_elegibles` para `adiestramiento` = `{perro}`
--     — o sea que **el MOTOR ya lo decía**.
-- Por eso el seed **no tipea `{perro}` a mano: lo LEE de `tipos_servicio`**.
-- Un valor copiado a mano coincide con su fuente hasta la primera enmienda;
-- uno leído de ella nace ya de acuerdo, y el cinturón verifica que los dos
-- sigan diciendo lo mismo.
--
-- **Y se siembra como ES, no como conviene** (orden de mesa): los 23 quedan
-- SOLO perro, incluidos los que un loro podría aprender (`truco_pata`,
-- `sentado`). *No es una afirmación sobre lo que un animal puede aprender: es
-- que el currículum pertenece a un servicio que hoy solo se vende para
-- perros. Ofrecerle a una familia de gato un objetivo de un servicio que no
-- puede contratar es la clase de promesa vacía que el producto no hace.*
-- El día que el servicio abra a otra especie, su currículum viaja con él.
--
-- ── EL BRAZO DEL MOTOR, ESPEJO EXACTO ──────────────────────────────────────
-- El mismo predicado y el mismo código tipado (`chip_no_aplica_a_la_mascota`)
-- que el brazo de conductas. **Dos validaciones hermanas que divergen es cómo
-- se pierde una frontera** — se escriben iguales a propósito.
--
-- Veda 76(g): NO RIGE — 2 columnas nuevas + seed de catálogo; cero dato de
-- usuario (los chips de objetivo registrados no se tocan).
-- D-662: `cat_objetivos_adiestramiento` la lee `obtenerVocabularioBitacora`;
-- las columnas son ADITIVAS y el bundle vivo no las pide.
-- Reversa: docs/relevamientos/2026-08-08-s91a-REVERSA-objetivos-aplicabilidad.sql
-- ============================================================================

BEGIN;

ALTER TABLE public.cat_objetivos_adiestramiento
  ADD COLUMN especies_aplicables text[],
  ADD COLUMN sujetos_aplicables  text[];

COMMENT ON COLUMN public.cat_objetivos_adiestramiento.especies_aplicables IS
  'S91: a qué especies se ofrece el objetivo en la bitácora. Sembrado DERIVANDO de tipos_servicio.especies_elegibles del adiestramiento ({perro}), no tipeado a mano: el currículum pertenece al servicio, y el servicio es de perros (MODELO_ADIESTRAMIENTO §2). Si el servicio abre a otra especie, su currículum viaja con él.';
COMMENT ON COLUMN public.cat_objetivos_adiestramiento.sujetos_aplicables IS
  'S91: individuo | acuario. Los 23 son de individuo — un sistema no aprende a sentarse.';

-- El seed LEE su fuente en vez de repetirla.
UPDATE public.cat_objetivos_adiestramiento
   -- ⚠️ `tipos_servicio.especies_elegibles` es **jsonb**, no `text[]` —
   -- medido por el error que este mismo UPDATE produjo en su primer intento
   -- (42804). Se convierte explícito en vez de asumir que dos columnas que
   -- significan lo mismo tienen el mismo tipo.
   SET especies_aplicables = (
         SELECT ARRAY(SELECT jsonb_array_elements_text(ts.especies_elegibles))
           FROM tipos_servicio ts
          WHERE ts.codigo = 'adiestramiento'
          LIMIT 1),
       sujetos_aplicables = ARRAY['individuo'],
       updated_at = now();

CREATE OR REPLACE FUNCTION public.registrar_bitacora_familia(p_mascota_id uuid, p_texto text DEFAULT NULL::text, p_chips jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth       uuid := auth.uid();
  v_now        timestamptz := now();
  v_country    text;
  v_menor      boolean;
  v_programa   uuid;
  v_chip       jsonb;
  v_tipo       text;
  v_codigo     text;
  v_n_chips    int := 0;
  v_eje        text;
  v_visib      jsonb;
  v_evento_id  uuid;
  v_bitacora   uuid;
  v_especie    text;
  v_sujeto     text;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;

  -- §7 v1: la bitácora vive DENTRO del contexto del programa/servicio
  -- activo. Primero la matrícula activa (el ancla queda en la fila);
  -- si no hay, una cita de adiestramiento VIVA cubre el contexto.
  SELECT pc.id INTO v_programa
  FROM programas_contratados pc
  WHERE pc.mascota_id = p_mascota_id AND pc.estado = 'activo'
  ORDER BY pc.created_at DESC
  LIMIT 1;
  -- EL GUARD `sin__contexto` MURIO ACA (S91, firma del founder): la
  -- bitacora es UNIVERSAL — de la MASCOTA, no del adiestramiento. Era un
  -- diferido DECLARADO desde S63, no un olvido, y su condicion se cumplio:
  -- el vocabulario ya tiene especie y sujeto, asi que un gato no ve
  -- «Ladro» ni un acuario conductas de individuo.
  -- El ancla al programa SE CONSERVA (v_programa, arriba): cuando hay un
  -- programa activo la fila lo sigue registrando. Se solto la EXIGENCIA,
  -- jamas el dato.

  -- ≥1 chip o texto: registrar la nada no es una observación
  IF (p_texto IS NULL OR length(btrim(p_texto)) = 0)
     AND (p_chips IS NULL OR jsonb_array_length(p_chips) = 0) THEN
    RAISE EXCEPTION 'bitacora_vacia' USING ERRCODE = '22023';
  END IF;

  -- P5: derivado del ROL del autor en la familia de la mascota —
  -- jamás lo declara el cliente (LOYALTY §7.3)
  SELECT EXISTS (
    SELECT 1
    FROM familia_miembro fm
    JOIN mascotas m ON m.familia_id = fm.familia_id
    WHERE m.id = p_mascota_id AND fm.user_id = v_auth
      AND fm.rol = 'menor' AND fm.hasta IS NULL
  ) INTO v_menor;

  SELECT m.country_code, m.especie, m.sujeto
    INTO v_country, v_especie, v_sujeto
    FROM mascotas m WHERE m.id = p_mascota_id;
  SELECT cte.eje_jtbd, cte.visibilidad_default INTO v_eje, v_visib
  FROM cat_tipos_evento cte WHERE cte.codigo = 'bitacora_familia';
  IF v_eje IS NULL THEN
    RAISE EXCEPTION 'catalogo_bitacora_no_encontrado' USING ERRCODE = '22023';
  END IF;

  -- el hito: SEDIMENTO del Bio-Expediente (la primera superficie donde
  -- la FAMILIA deposita evidencia conductual estructurada, §7)
  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento,
    creado_por_user_id, datos, visibilidad, country_code
  ) VALUES (
    p_mascota_id, 'bitacora_familia', v_eje, v_now,
    v_auth,
    jsonb_build_object('origen', 'bitacora_familia',
                       'programa_contratado_id', v_programa,
                       'aportado_por_menor', v_menor),
    v_visib, COALESCE(v_country, 'EC')
  ) RETURNING id INTO v_evento_id;

  INSERT INTO evento_bitacora_familia (
    evento_id, mascota_id, user_id, programa_contratado_id,
    texto, aportado_por_menor, country_code
  ) VALUES (
    v_evento_id, p_mascota_id, v_auth, v_programa,
    NULLIF(btrim(COALESCE(p_texto, '')), ''), v_menor, COALESCE(v_country, 'EC')
  ) RETURNING id INTO v_bitacora;

  -- los chips, validados contra SU catálogo (dos vocabularios §7)
  FOR v_chip IN SELECT * FROM jsonb_array_elements(COALESCE(p_chips, '[]'::jsonb))
  LOOP
    v_tipo := v_chip ->> 'tipo';
    v_codigo := v_chip ->> 'codigo';
    IF v_tipo = 'objetivo' THEN
      IF NOT EXISTS (SELECT 1 FROM cat_objetivos_adiestramiento o WHERE o.codigo = v_codigo AND o.activo) THEN
        RAISE EXCEPTION 'chip_invalido: %', COALESCE(v_codigo, 'NULL') USING ERRCODE = '22023';
      END IF;
      -- S91 · ESPEJO EXACTO del brazo de conductas. Cuando se construyo la
      -- validacion de aplicabilidad, este brazo quedo AFUERA y se declaro
      -- fuera de alcance («ese catalogo no tiene ejes»). D midio la
      -- consecuencia y era peor que la declaracion: los 23 objetivos CANINOS
      -- caian enteros sobre cualquier mascota. Un alcance declarado no deja
      -- de ser un agujero por estar declarado.
      IF NOT EXISTS (
        SELECT 1 FROM cat_objetivos_adiestramiento o
         WHERE o.codigo = v_codigo
           AND (o.especies_aplicables IS NULL OR v_especie = ANY(o.especies_aplicables))
           AND (o.sujetos_aplicables  IS NULL OR v_sujeto  = ANY(o.sujetos_aplicables))
      ) THEN
        RAISE EXCEPTION 'chip_no_aplica_a_la_mascota: %', COALESCE(v_codigo, 'NULL')
          USING ERRCODE = '22023';
      END IF;
    ELSIF v_tipo = 'conducta' THEN
      IF NOT EXISTS (SELECT 1 FROM cat_conductas_bitacora c WHERE c.codigo = v_codigo AND c.activo) THEN
        RAISE EXCEPTION 'chip_invalido: %', COALESCE(v_codigo, 'NULL') USING ERRCODE = '22023';
      END IF;
      -- S91 · LA PUERTA UNICA ES LA VERDAD, NO LA PANTALLA.
      -- La superficie filtra por especie y sujeto para no OFRECER lo que no
      -- aplica; el motor lo RECHAZA para que no ENTRE. Son dos trabajos
      -- distintos: si esto viviera solo en la UI, cualquier caller —un
      -- bundle viejo, un script, la proxima superficie— podria colgarle a un
      -- acuario una conducta de individuo y la fila quedaria para siempre.
      -- NULL en cualquiera de los dos ejes = 'aplica a todo' (el patron de
      -- tipos_servicio.especies_elegibles). Hoy las 19 filas los tienen
      -- explicitos, pero el COALESCE evita que una fila futura sin ejes
      -- rebote todo en silencio.
      IF NOT EXISTS (
        SELECT 1 FROM cat_conductas_bitacora c
         WHERE c.codigo = v_codigo
           AND (c.especies_aplicables IS NULL OR v_especie = ANY(c.especies_aplicables))
           AND (c.sujetos_aplicables  IS NULL OR v_sujeto  = ANY(c.sujetos_aplicables))
      ) THEN
        RAISE EXCEPTION 'chip_no_aplica_a_la_mascota: %', COALESCE(v_codigo, 'NULL')
          USING ERRCODE = '22023';
      END IF;
    ELSE
      RAISE EXCEPTION 'chip_invalido: %', COALESCE(v_tipo, 'NULL') USING ERRCODE = '22023';
    END IF;
    INSERT INTO evento_bitacora_chips (bitacora_id, chip_tipo, codigo)
    VALUES (v_bitacora, v_tipo, v_codigo)
    ON CONFLICT DO NOTHING;
    v_n_chips := v_n_chips + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'bitacora_id', v_bitacora,
    'evento_id', v_evento_id,
    'programa_contratado_id', v_programa,
    'chips', v_n_chips,
    'aportado_por_menor', v_menor,
    'registrada_en', v_now
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.registrar_bitacora_familia(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.registrar_bitacora_familia(uuid, text, jsonb) TO authenticated;

-- ── Cinturones ──────────────────────────────────────────────────────────────
DO $$
DECLARE v_n int; v_esp text[]; v_ts text[]; v_acl text;
BEGIN
  -- Los 23 quedaron con sus dos ejes, sin excepción
  SELECT count(*) INTO v_n FROM cat_objetivos_adiestramiento
   WHERE especies_aplicables IS NULL OR sujetos_aplicables IS NULL;
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturon_objetivos: % filas sin sus dos ejes', v_n; END IF;

  SELECT count(*) INTO v_n FROM cat_objetivos_adiestramiento;
  IF v_n <> 23 THEN RAISE EXCEPTION 'cinturon_objetivos: % filas <> 23', v_n; END IF;

  -- EL SEED COINCIDE CON SU FUENTE (no se copió: se derivó, y se verifica)
  SELECT DISTINCT especies_aplicables INTO v_esp FROM cat_objetivos_adiestramiento;
  SELECT ARRAY(SELECT jsonb_array_elements_text(especies_elegibles)) INTO v_ts
    FROM tipos_servicio WHERE codigo='adiestramiento' LIMIT 1;
  IF v_esp IS DISTINCT FROM v_ts THEN
    RAISE EXCEPTION 'cinturon_objetivos: el seed (%) no coincide con tipos_servicio (%)', v_esp, v_ts;
  END IF;

  -- LO QUE ESTE ACTO EXISTE PARA IMPEDIR: que un gato o un acuario vea un
  -- objetivo canino. Se mide el RESULTADO.
  SELECT count(*) INTO v_n FROM cat_objetivos_adiestramiento
   WHERE activo AND 'gato' = ANY(especies_aplicables);
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturon_objetivos: el gato ve % objetivos caninos', v_n; END IF;
  SELECT count(*) INTO v_n FROM cat_objetivos_adiestramiento
   WHERE activo AND 'acuario' = ANY(sujetos_aplicables);
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturon_objetivos: el acuario ve % objetivos', v_n; END IF;

  -- Y el perro los sigue viendo TODOS: el filtro no puede vaciar al dueño real
  SELECT count(*) INTO v_n FROM cat_objetivos_adiestramiento
   WHERE activo AND 'perro' = ANY(especies_aplicables) AND 'individuo' = ANY(sujetos_aplicables);
  IF v_n <> 23 THEN RAISE EXCEPTION 'cinturon_objetivos: el perro ve % de 23', v_n; END IF;

  -- EL BRAZO DEL MOTOR: los DOS validan aplicabilidad (conducta + objetivo)
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='registrar_bitacora_familia'
     AND p.prosrc LIKE '%cat_objetivos_adiestramiento o%especies_aplicables%';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'cinturon_objetivos: el brazo de objetivos NO valida aplicabilidad';
  END IF;

  SELECT p.proacl::text INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='registrar_bitacora_familia';
  IF v_acl LIKE '%anon=%' THEN RAISE EXCEPTION 'cinturon_objetivos: anon en proacl'; END IF;
END $$;

COMMIT;
