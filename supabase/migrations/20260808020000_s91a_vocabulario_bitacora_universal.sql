-- ============================================================================
-- S91-A · EL VOCABULARIO DE LA BITÁCORA SE VUELVE UNIVERSAL — firma en bloque
-- ============================================================================
-- FIRMA DEL FOUNDER (8-ago-2026), en bloque: las 3 reescrituras universales ·
-- las 6 nuevas (16 en total, mínimo digno) · `especies_aplicables` por el
-- patrón vivo · el estatuto preliminar LEVANTADO para este vocabulario.
--
-- ── LA ENMIENDA DEL FOUNDER, Y ES LA QUE MÁS CAMBIA: EL ACUARIO ENTRA ──────
-- Mi censo proponía dejarlo AFUERA. **Quedó viejo por su propia firma del
-- pez**, y el founder lo marcó como L-166 de mesa: el acuario YA VIVE como
-- fila de `mascotas` con `sujeto='acuario'`, así que la bitácora puede colgar
-- de él HOY — no espera al arco. Los peces INDIVIDUALES siguen esperando; el
-- SISTEMA no. Entran sus 3 conductas nombradas.
--
-- ── DOS EJES, NO UNO, porque la letra de diseño pide dos ───────────────────
-- La letra que va a C dice que los chips llegan filtrados «por
-- especies_aplicables Y SUJETO». Son dos preguntas distintas y ninguna cubre
-- a la otra: «¿aplica a un ave?» (especie) y «¿aplica a un individuo o a un
-- sistema?» (sujeto). Con una sola columna, un pez-individuo —que el CHECK
-- todavía permite aunque el alta no lo cree— vería conductas de acuario.
--   · `especies_aplicables text[]`  · `sujetos_aplicables text[]`
--   · NULL = todas, que es el patrón VIVO de
--     `tipos_servicio.especies_elegibles` (S57) — copiado, no inventado.
-- Acá se llenan EXPLÍCITAS en las 19 filas: un NULL «que significa todas» es
-- correcto pero no se lee, y este catálogo lo va a leer gente.
--
-- ── LO QUE NO ENTRA, Y SE DICE ─────────────────────────────────────────────
-- La enmienda glosa el mundo del acuario como «agua, mantenimiento,
-- observación del conjunto». **Las tres conductas NOMBRADAS cubren agua y
-- observación; MANTENIMIENTO no queda cubierto.** No lo invento: lo propongo
-- para el gate en dispositivo — «Le cambié parte del agua», que es EL acto de
-- mantenimiento de un acuario. Se firma mirando los chips, no acá.
--
-- ── EL RENAME DE `jugo_con_otros_perros` → `convivio_bien` ────────────────
-- Medido antes: `evento_bitacora_chips` NO tiene FK al catálogo y tiene
-- **2 chips registrados** (`miedo_ruidos`, `hizo_adentro`) — **cero** con el
-- código viejo. El rename no deja nada huérfano. *Un código que dice
-- `perros` sobrevive al texto y vuelve a sesgar en la próxima lectura.*
--
-- Veda 76(g): NO RIGE — catálogo + 2 columnas nuevas; cero backfill sobre
-- datos de usuario (los 2 chips vivos conservan códigos que no cambian).
-- D-662: `cat_conductas_bitacora` la lee `adiestramiento-bitacora.ts`; las
-- columnas nuevas son ADITIVAS y el bundle vivo no las pide.
-- Reversa: docs/relevamientos/2026-08-08-s91a-REVERSA-vocabulario-bitacora.sql
-- ============================================================================

BEGIN;

ALTER TABLE public.cat_conductas_bitacora
  ADD COLUMN especies_aplicables text[],
  ADD COLUMN sujetos_aplicables  text[];

COMMENT ON COLUMN public.cat_conductas_bitacora.especies_aplicables IS
  'S91: a qué especies se ofrece el chip. NULL = todas (patrón vivo de tipos_servicio.especies_elegibles). Acá van explícitas: un catálogo que se lee no debería exigir saber qué significa un NULL.';
COMMENT ON COLUMN public.cat_conductas_bitacora.sujetos_aplicables IS
  'S91 (cláusula del pez): individuo | acuario. El segundo eje del filtro — un acuario no tiene conductas de individuo y un individuo no tiene agua.';

-- ── ① LAS TRES REESCRITURAS UNIVERSALES ────────────────────────────────────
UPDATE public.cat_conductas_bitacora
   SET nombre_familia = 'Hizo sus necesidades fuera de su lugar',
       nombre_familia_en = 'Went in the wrong place',
       nombre = 'Eliminación fuera del lugar habitual',
       updated_at = now()
 WHERE codigo = 'hizo_adentro';

UPDATE public.cat_conductas_bitacora
   SET nombre_familia = 'Hizo más ruido de lo normal',
       nombre_familia_en = 'Was noisier than usual',
       nombre = 'Vocalización aumentada',
       updated_at = now()
 WHERE codigo = 'ladridos_excesivos';

UPDATE public.cat_conductas_bitacora
   SET codigo = 'convivio_bien',
       nombre_familia = 'Se llevó bien con otros animales',
       nombre_familia_en = 'Got along with other animals',
       nombre = 'Convivencia social positiva',
       updated_at = now()
 WHERE codigo = 'jugo_con_otros_perros';

-- Cuarta, del mismo censo: «lloró» es de perro y gato; un ave grita y un
-- conejo se queda inmóvil. Entra con las tres por ser la misma clase.
UPDATE public.cat_conductas_bitacora
   SET nombre_familia = 'Se alteró cuando salimos',
       nombre_familia_en = 'Got upset when we left',
       updated_at = now()
 WHERE codigo = 'lloro_al_quedarse_solo';

-- ── ② LAS SEIS NUEVAS ──────────────────────────────────────────────────────
INSERT INTO public.cat_conductas_bitacora
  (codigo, nombre, nombre_familia, nombre_familia_en, orden_display, activo, es_seed_preliminar)
VALUES
  ('no_quiso_comer',    'Rechazo de alimento',      'No quiso comer',              'Wouldn''t eat',                 15, true, false),
  ('se_escondio',       'Ocultamiento',             'Se escondió más de lo normal','Hid more than usual',           45, true, false),
  ('se_rasco_o_lamio',  'Prurito o lamido',         'Se rascó o se lamió mucho',   'Scratched or licked a lot',     55, true, false),
  ('vomito',            'Vómito',                   'Vomitó',                      'Threw up',                      25, true, false),
  ('se_arranco_plumas', 'Arrancado de plumas',      'Se arrancó plumas',           'Plucked feathers',              35, true, false),
  ('costo_moverse',     'Dificultad de movimiento', 'Cojeó o le costó moverse',    'Limped or had trouble moving',  65, true, false)
ON CONFLICT (codigo) DO NOTHING;

-- ── ③ LAS TRES DEL ACUARIO (la enmienda) ───────────────────────────────────
INSERT INTO public.cat_conductas_bitacora
  (codigo, nombre, nombre_familia, nombre_familia_en, orden_display, activo, es_seed_preliminar)
VALUES
  ('agua_turbia',       'Turbidez del agua',        'El agua se ve turbia',        'The water looks cloudy',       110, true, false),
  ('habitante_no_bien', 'Habitante en mal estado',  'Un habitante no se ve bien',  'One of them doesn''t look well',120, true, false),
  ('comieron_todos',    'Alimentación del conjunto','Comieron todos',              'They all ate',                 130, true, false)
ON CONFLICT (codigo) DO NOTHING;

-- ── ④ LOS DOS EJES, EXPLÍCITOS EN LAS 19 ───────────────────────────────────
UPDATE public.cat_conductas_bitacora
   SET especies_aplicables = ARRAY['perro','gato','conejo','roedor','ave'],
       sujetos_aplicables  = ARRAY['individuo'],
       es_seed_preliminar  = false,
       updated_at = now()
 WHERE codigo IN ('lloro_al_quedarse_solo','destrozo_objetos','hizo_adentro',
                  'ladridos_excesivos','miedo_ruidos','durmio_tranquilo',
                  'comio_normal','convivio_bien','mas_carinoso','inquieto_en_casa',
                  'no_quiso_comer','se_escondio','costo_moverse');

-- Las tres con especie acotada, con su razón:
--   · rascarse/lamerse: el ave se acicala distinto y su señal es la pluma
--   · vomitar: en conejo y roedor es fisiológicamente casi imposible —
--     ofrecerlo sería pedirle a la familia que observe algo que no ocurre
--   · plumas: no tiene equivalente en ninguna otra
UPDATE public.cat_conductas_bitacora
   SET especies_aplicables = ARRAY['perro','gato','conejo','roedor'],
       sujetos_aplicables  = ARRAY['individuo'], es_seed_preliminar = false, updated_at = now()
 WHERE codigo = 'se_rasco_o_lamio';
UPDATE public.cat_conductas_bitacora
   SET especies_aplicables = ARRAY['perro','gato'],
       sujetos_aplicables  = ARRAY['individuo'], es_seed_preliminar = false, updated_at = now()
 WHERE codigo = 'vomito';
UPDATE public.cat_conductas_bitacora
   SET especies_aplicables = ARRAY['ave'],
       sujetos_aplicables  = ARRAY['individuo'], es_seed_preliminar = false, updated_at = now()
 WHERE codigo = 'se_arranco_plumas';

UPDATE public.cat_conductas_bitacora
   SET especies_aplicables = ARRAY['pez'],
       sujetos_aplicables  = ARRAY['acuario'], es_seed_preliminar = false, updated_at = now()
 WHERE codigo IN ('agua_turbia','habitante_no_bien','comieron_todos');

-- ── ⑤ EL GUARD SE LEVANTA ──────────────────────────────────────────────────
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

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id = p_mascota_id;
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
    ELSIF v_tipo = 'conducta' THEN
      IF NOT EXISTS (SELECT 1 FROM cat_conductas_bitacora c WHERE c.codigo = v_codigo AND c.activo) THEN
        RAISE EXCEPTION 'chip_invalido: %', COALESCE(v_codigo, 'NULL') USING ERRCODE = '22023';
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
DECLARE v_n int; v_acl text;
BEGIN
  SELECT count(*) INTO v_n FROM cat_conductas_bitacora WHERE activo;
  IF v_n <> 19 THEN RAISE EXCEPTION 'cinturon_bitacora: % conductas activas <> 19 (16+3)', v_n; END IF;

  SELECT count(*) INTO v_n FROM cat_conductas_bitacora WHERE es_seed_preliminar;
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturon_bitacora: % siguen preliminares — la firma las levanta TODAS', v_n; END IF;

  SELECT count(*) INTO v_n FROM cat_conductas_bitacora
   WHERE especies_aplicables IS NULL OR sujetos_aplicables IS NULL;
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturon_bitacora: % filas sin sus dos ejes explicitos', v_n; END IF;

  -- ☠️ LO QUE ESTA FIRMA EXISTE PARA IMPEDIR: que un gato vea «Ladró».
  -- Se mide el RESULTADO, no la intención: cero conductas cuyo texto
  -- nombre una especie.
  SELECT count(*) INTO v_n FROM cat_conductas_bitacora
   WHERE activo AND (nombre_familia ILIKE '%perro%' OR nombre_familia ILIKE '%ladr%'
                  OR nombre_familia_en ILIKE '%dog%' OR nombre_familia_en ILIKE '%bark%');
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturon_bitacora: % conductas siguen nombrando al perro', v_n; END IF;

  -- El gato ve 15, el ave 14, el acuario 3 — y los tres conjuntos son
  -- distintos, que es la prueba de que el filtro filtra.
  SELECT count(*) INTO v_n FROM cat_conductas_bitacora
   WHERE activo AND 'gato' = ANY(especies_aplicables) AND 'individuo' = ANY(sujetos_aplicables);
  IF v_n <> 15 THEN RAISE EXCEPTION 'cinturon_bitacora: el gato ve % (esperaba 15)', v_n; END IF;
  SELECT count(*) INTO v_n FROM cat_conductas_bitacora
   WHERE activo AND 'ave' = ANY(especies_aplicables) AND 'individuo' = ANY(sujetos_aplicables);
  IF v_n <> 14 THEN RAISE EXCEPTION 'cinturon_bitacora: el ave ve % (esperaba 14)', v_n; END IF;
  SELECT count(*) INTO v_n FROM cat_conductas_bitacora
   WHERE activo AND 'acuario' = ANY(sujetos_aplicables);
  IF v_n <> 3 THEN RAISE EXCEPTION 'cinturon_bitacora: el acuario ve % (esperaba 3)', v_n; END IF;

  -- El guard murió de verdad en la función viva (no en un comentario).
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='registrar_bitacora_familia'
               AND p.prosrc LIKE '%RAISE EXCEPTION ''sin_contexto_activo''%') THEN
    RAISE EXCEPTION 'cinturon_bitacora: el guard sigue vivo en la funcion';
  END IF;

  FOR v_acl IN SELECT p.proacl::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='registrar_bitacora_familia'
  LOOP
    IF v_acl LIKE '%anon=%' THEN RAISE EXCEPTION 'cinturon_bitacora: anon en proacl'; END IF;
  END LOOP;
END $$;

COMMIT;
