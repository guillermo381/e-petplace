/* ═══════════════════════════════════════════════════════════════════════════
   S113-A · lote 0, adendas (b) e (i) — EL RECUERDO DONDE SE VE, Y UNA SOLA
   PUERTA PARA EL ANTIPARASITARIO
   Migración 20260909040000 · reversa: docs/loop/S113-A-REVERSA-20260909040000.sql

   ═══ (i) 🔴 ERROR PROPIO: CONSTRUÍ UNA PUERTA QUE YA EXISTÍA ════════════════
   `registrar_desparasitacion` existe desde S82-A, con su wrapper
   `registrarDesparasitacion` en `packages/api/src/wrappers/salud.ts:53`.
   En `20260909000000` nació `registrar_desparasitacion_familia`, que hace lo
   mismo. **Se DROPea acá: una cosa, una puerta.**

   **Cómo pasó, y es una lección que ya tenía escrita.** Para vacunas censé los
   productores SQL de la tabla (`pg_get_functiondef ~ 'insert into
   evento_vacuna_aplicada'` → 2). Para desparasitación medí **filas** (0) y
   policies, y leí «0 filas» como «nadie la escribe».
   ***Cero observaciones no es cero productores: un cero prueba que nadie
   corrió, jamás que nadie puede.*** El mismo censo, corrido sobre la otra
   tabla, la habría encontrado.

   **La existente es MEJOR que la mía y por eso gana**, no por antigüedad:
   su gate es `user_es_familiar_adulto_de_mascota` — *familiar adulto*, más
   estricto que el titular que yo exigía.

   **Lo que sí le faltaba, medido en `pg_get_functiondef`:**
   · `procedencia = declarado_por_familia` → **YA la escribe**, por el trigger
     `_trg_desparasitacion_crear_evento` (`prestador_id` NULL ⇒ familia), y
     `desparasitacion_aplicada` es `es_clinico=true` así que la puerta de
     eventos la estampa de verdad.
   · `modo_captura` → **NO la escribía.** Se agrega acá con la MISMA regla que
     el carnet y la nota clínica: por el marcador, porque el evento lo crea el
     trigger y `eventos_mascota` no tiene policy de UPDATE.

   ═══ (b) EL RECUERDO SE MUDA A `evento_hito_narrativo` ══════════════════════
   `20260909000000` lo puso en `evento_nota_dueno` con una razón medida (esa
   tabla tenía CRUD del titular y la otra no tenía policy de INSERT).
   **La mesa dictó `hito_narrativo`, y una medición nueva le da la razón:**

   🔴 **`nota_dueno` NO LO PINTA NINGÚN LECTOR.** Medido en el árbol:
   `packages/api/src/wrappers/timeline.ts:282` discrimina
   `e.tipo === 'hito_narrativo' && datos.clave_hito`, y `nota_dueno` **no
   aparece** ni en `timeline.ts` ni en `apps/cliente/src/lib/voz-hecho.ts`.
   ⇒ *Un recuerdo en `nota_dueno` sería invisible en la Línea de Vida — o sea,
   invisible en el único lugar donde un recuerdo tiene sentido.*

   Lo que hacía falta para que `hito_narrativo` lo hospede, y por qué es seguro:
   · **`texto` y `foto_url` como columnas reales**, no dentro de `contexto`
     jsonb. La foto lleva su CHECK de path (espejo de
     `evento_vacuna_aplicada.archivo_url`): *un dato que nace como prosa
     después no se puede consultar.*
   · **Una policy de INSERT ANGOSTA**: la familia sólo puede insertar con
     `clave = 'recuerdo_familia'`. **No puede fabricar `adopcion_completada`
     ni `llego_a_la_familia`** — los hitos del sistema siguen siendo del
     sistema. Esa cláusula es lo que hace segura la decisión de la mesa.
   · La tabla **no tiene trigger** (sus 3 productores crean el evento y le
     pasan `evento_id`), así que la RPC hace lo mismo — con `datos.clave_hito`,
     que es literalmente lo que el timeline lee.

   ⚠️ **`evento_nota_dueno.foto_url` y su categoría `recuerdo` quedan DORMIDAS
   y se declara**: 0 filas, ningún escritor. No se borran para no gastar otra
   migración en una tabla que nadie toca; **la única puerta de recuerdo es la
   de acá**.

   ── 76(g) VEDA: **NO RIGE.** Cero backfill. Dos columnas nullable, una
      policy, y funciones. Nada reescribe el pasado.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══ ① EL MARCADOR GANA `procedencia` ══════════════════════════════════════
   `hito_narrativo` es `es_clinico=false`, y `_crear_evento_padre_auto` escribe
   procedencia **sólo para tipos clínicos** — regla suya, escrita en su cuerpo.
   La mesa pidió `declarado_por_familia` en el recuerdo, así que la marca pasa
   por el mismo marcador, con las MISMAS tres reglas: vocabulario cerrado,
   NULL→valor sin pisar, y el gate del acceso adentro.
   El parámetro va al final con DEFAULT ⇒ las llamadas de 2 argumentos que ya
   existen (`registrar_vacunas_de_carnet`, `sedimentar_nota_clinica`) resuelven
   a esta firma sin tocarse. Se DROPea la vieja: un DEFAULT no reemplaza,
   SOBRECARGA (L-119). */
DROP FUNCTION IF EXISTS public._marcar_modo_captura_evento(uuid[], text);

CREATE OR REPLACE FUNCTION public._marcar_modo_captura_evento(
  p_evento_ids uuid[],
  p_modo       text DEFAULT NULL,
  p_procedencia text DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_n int;
BEGIN
  IF p_modo IS NULL AND p_procedencia IS NULL THEN RETURN 0; END IF;

  IF p_modo IS NOT NULL
     AND p_modo NOT IN ('tecleado','dictado','extraido_por_ia','automatico') THEN
    RAISE EXCEPTION 'modo_captura_invalido' USING ERRCODE = '22023';
  END IF;
  IF p_procedencia IS NOT NULL
     AND p_procedencia NOT IN ('declarado_por_familia','verificado_por_prestador','declarado_por_prestador') THEN
    RAISE EXCEPTION 'procedencia_invalida' USING ERRCODE = '22023';
  END IF;

  IF p_evento_ids IS NULL OR array_length(p_evento_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE eventos_mascota e
     SET modo_captura = COALESCE(e.modo_captura, p_modo),
         procedencia  = COALESCE(e.procedencia,  p_procedencia)
   WHERE e.id = ANY(p_evento_ids)
     AND (  (p_modo        IS NOT NULL AND e.modo_captura IS NULL)
         OR (p_procedencia IS NOT NULL AND e.procedencia  IS NULL) )
     AND public.user_tiene_acceso_a_mascota(e.mascota_id);

  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$fn$;

REVOKE ALL ON FUNCTION public._marcar_modo_captura_evento(uuid[], text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._marcar_modo_captura_evento(uuid[], text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public._marcar_modo_captura_evento(uuid[], text, text) TO authenticated;

/* ═══ ② UNA SOLA PUERTA PARA EL ANTIPARASITARIO ═════════════════════════════ */
DROP FUNCTION IF EXISTS public.registrar_desparasitacion_familia(uuid, text, text, date, date, text);

CREATE OR REPLACE FUNCTION public.registrar_desparasitacion(p_mascota_id uuid, p_producto text, p_tipo text DEFAULT NULL::text, p_fecha_aplicada date DEFAULT NULL::date, p_fecha_proxima date DEFAULT NULL::date, p_notas text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_id uuid;
  v_country text;
  v_evento uuid;
  v_marcados int;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_es_familiar_adulto_de_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF p_producto IS NULL OR length(trim(p_producto)) = 0 THEN
    RAISE EXCEPTION 'producto_requerido' USING ERRCODE = '22023';
  END IF;
  IF p_tipo IS NOT NULL AND p_tipo NOT IN ('interna', 'externa', 'mixta') THEN
    RAISE EXCEPTION 'tipo_invalido' USING ERRCODE = '22023';
  END IF;
  -- lo declarado por familia es un hecho PASADO: la aplicación no es futura
  IF p_fecha_aplicada IS NOT NULL AND p_fecha_aplicada > public.hoy_local() THEN
    RAISE EXCEPTION 'fecha_futura' USING ERRCODE = '22023';
  END IF;
  IF p_fecha_proxima IS NOT NULL AND p_fecha_aplicada IS NOT NULL AND p_fecha_proxima < p_fecha_aplicada THEN
    RAISE EXCEPTION 'orden_fechas_invalido' USING ERRCODE = '22023';
  END IF;

  -- eventos_mascota.country_code es NOT NULL (hallazgo del rojo crudo):
  -- el país del evento es el de la MASCOTA, derivado — jamás pedido.
  SELECT country_code INTO v_country FROM mascotas WHERE id = p_mascota_id;

  INSERT INTO evento_desparasitacion_aplicada (mascota_id, country_code, producto, tipo_desparasitacion, fecha_aplicada, fecha_proxima, notas)
  VALUES (p_mascota_id, v_country, trim(p_producto), p_tipo, p_fecha_aplicada, p_fecha_proxima, p_notas)
  RETURNING id, evento_id INTO v_id, v_evento;

  /* S113-A · MODO DE CAPTURA. Misma regla que el carnet y la nota clínica:
     la marca no viaja en el INSERT porque la escribe el trigger, y esta
     función es DEFINER pero `eventos_mascota` no tiene policy de UPDATE —
     así que pasa por el marcador, que re-chequea el acceso.
     Por esta puerta entra SIEMPRE la familia tecleando: no hay parámetro. */
  v_marcados := public._marcar_modo_captura_evento(ARRAY[v_evento], 'tecleado');
  IF v_marcados <> 1 THEN
    RAISE EXCEPTION 'marca_incompleta: marcó % de 1', v_marcados;
  END IF;

  RETURN jsonb_build_object('ok', true, 'id', v_id, 'mascota_id', p_mascota_id);
END;
$function$
;

/* ═══ ③ EL RECUERDO EN SU LUGAR ═════════════════════════════════════════════ */
ALTER TABLE public.evento_hito_narrativo ADD COLUMN IF NOT EXISTS texto text;
ALTER TABLE public.evento_hito_narrativo ADD COLUMN IF NOT EXISTS foto_url text;

ALTER TABLE public.evento_hito_narrativo DROP CONSTRAINT IF EXISTS hito_foto_es_path;
ALTER TABLE public.evento_hito_narrativo ADD CONSTRAINT hito_foto_es_path
  CHECK (foto_url IS NULL OR foto_url NOT LIKE 'http%');

/* 🔴 LA POLICY ANGOSTA. La cláusula `clave = 'recuerdo_familia'` es lo que
   hace segura la mudanza: la familia gana una puerta de escritura sobre la
   tabla de los hitos del SISTEMA, y esa cláusula le impide fabricar
   `adopcion_completada`, `llego_a_la_familia` o `mundo_nuevo_empieza`.
   El acceso es dueño-o-familia, y NO `user_tiene_acceso_a_mascota`, que
   incluiría al prestador: **un recuerdo lo escribe la familia.** */
/* ═══ ③bis 🔴 `clave` TIENE FK A UN CATÁLOGO — tercer freno que encontró el
   cinturón, y el tercero que era una restricción real y no un descuido:
   `evento_hito_narrativo_clave_fkey → cat_hitos_narrativos(clave)`, con
   `ON DELETE RESTRICT`. Sin fila de catálogo, la puerta nace tapiada — el
   mismo modo de falla que `nota_dueno` tenía con su eje.

   ⚠️ Y la fila NO es trámite: las cuatro existentes documentan **la voz** de
   su hito («Una vida nueva empieza», «[Nombre] llegó a la familia»…). El
   recuerdo es de otra clase y la descripción lo dice: **su voz es el texto de
   la familia**, no una frase de la casa. Es la diferencia entre un hito que
   el sistema narra y uno que la familia escribe. */
INSERT INTO public.cat_hitos_narrativos (clave, descripcion, activo)
VALUES ('recuerdo_familia',
        'Un recuerdo que escribe la FAMILIA: texto libre, foto, o los dos, con su fecha. '
        'A diferencia de los otros cuatro hitos, NO tiene voz de la casa — la voz ES el '
        'texto de la familia, y la pantalla lo muestra tal cual. Los otros cuatro los '
        'produce el sistema en un momento de la vida del animal; éste lo produce una '
        'persona cuando quiere. Su puerta es `registrar_recuerdo_familia` (S113-A).',
        true)
ON CONFLICT (clave) DO NOTHING;

/* 🔴 EL GRANT, que la policy sola no reemplaza (L-216). Medido antes:
   `authenticated` tenía SELECT y **NO** INSERT sobre esta tabla, y el control
   positivo del instrumento es que sobre `evento_vacuna_aplicada` sí lo tiene.
   *Una policy sin grant no alcanza nada* — y el primer intento de este arnés
   murió exactamente ahí, con `42501 permission denied`.
   **`anon` NO se toca**: sigue sin SELECT y sin INSERT, y el cinturón lo mide. */
GRANT INSERT ON public.evento_hito_narrativo TO authenticated;

DROP POLICY IF EXISTS hito_narrativo_insert_recuerdo ON public.evento_hito_narrativo;
CREATE POLICY hito_narrativo_insert_recuerdo ON public.evento_hito_narrativo
  FOR INSERT TO authenticated
  WITH CHECK (
    clave = 'recuerdo_familia'
    AND (
      EXISTS (SELECT 1 FROM mascotas m WHERE m.id = mascota_id AND m.user_id = auth.uid())
      OR public._user_es_de_la_familia_de(auth.uid(), mascota_id)
    )
  );

/* La versión que escribía en `evento_nota_dueno` muere: una sola puerta. */
DROP FUNCTION IF EXISTS public.registrar_recuerdo_familia(uuid, text, date, text);

CREATE OR REPLACE FUNCTION public.registrar_recuerdo_familia(
  p_mascota_id uuid,
  p_texto      text DEFAULT NULL,
  p_fecha      date DEFAULT NULL,
  p_foto_url   text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_uid      uuid := auth.uid();
  v_texto    text;
  v_foto     text;
  v_pais     text;
  v_fecha    date;
  v_evento   uuid;
  v_id       uuid;
  v_marcados int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  v_texto := nullif(btrim(coalesce(p_texto,'')), '');
  v_foto  := nullif(btrim(coalesce(p_foto_url,'')), '');

  /* Los dos campos son opcionales, pero un recuerdo sin ninguno **no es un
     recuerdo**: es una fila vacía en la Línea de Vida de una familia. */
  IF v_texto IS NULL AND v_foto IS NULL THEN
    RAISE EXCEPTION 'recuerdo_vacio' USING ERRCODE='22023';
  END IF;

  IF v_foto IS NOT NULL THEN
    IF v_foto LIKE 'http%' THEN
      RAISE EXCEPTION 'foto_invalida: es una URL, se espera un path del bucket' USING ERRCODE='22023';
    END IF;
    IF split_part(v_foto, '/', 1) <> v_uid::text THEN
      RAISE EXCEPTION 'foto_invalida: el path no está en la carpeta del dueño' USING ERRCODE='22023';
    END IF;
  END IF;

  v_fecha := coalesce(p_fecha, public.hoy_local());
  IF v_fecha > public.hoy_local() THEN
    RAISE EXCEPTION 'fecha_futura' USING ERRCODE='22023';
  END IF;

  SELECT coalesce(m.country_code, 'EC') INTO v_pais FROM mascotas m WHERE m.id = p_mascota_id;
  IF v_pais IS NULL THEN
    RAISE EXCEPTION 'sin_acceso_mascota' USING ERRCODE='42501';   -- la RLS la ocultó
  END IF;

  /* `evento_hito_narrativo` NO tiene trigger — sus tres productores del
     sistema crean el padre y le pasan `evento_id`. Acá se hace igual, por la
     MISMA puerta (`_crear_evento_padre_auto`), y `datos.clave_hito` es
     literalmente lo que lee `timeline.ts:282` para reconocerlo. */
  v_evento := public._crear_evento_padre_auto(
    p_mascota_id, 'hito_narrativo', 'identidad',
    v_fecha::timestamptz,
    NULL, NULL, v_uid, NULL, v_pais,
    jsonb_build_object('clave_hito', 'recuerdo_familia'),
    'declarado_por_familia');

  INSERT INTO evento_hito_narrativo (evento_id, mascota_id, country_code, clave, contexto, texto, foto_url)
  VALUES (v_evento, p_mascota_id, v_pais, 'recuerdo_familia', '{}'::jsonb, v_texto, v_foto)
  RETURNING id INTO v_id;

  /* La procedencia la pide la mesa y el motor no la escribe sola: la puerta
     de eventos sólo la estampa en tipos CLÍNICOS, y un recuerdo no lo es.
     Va por el marcador, con el mismo gate. */
  v_marcados := public._marcar_modo_captura_evento(ARRAY[v_evento], 'tecleado', 'declarado_por_familia');
  IF v_marcados <> 1 THEN
    RAISE EXCEPTION 'marca_incompleta: marcó % de 1', v_marcados;
  END IF;

  RETURN jsonb_build_object('ok', true, 'hito_id', v_id, 'evento_id', v_evento);
END;
$fn$;

REVOKE ALL ON FUNCTION public.registrar_recuerdo_familia(uuid, text, date, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_recuerdo_familia(uuid, text, date, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.registrar_recuerdo_familia(uuid, text, date, text) TO authenticated;

/* ═══════════════════════════════════════════════════════════════════════════
   EL CINTURÓN — ROJO ANTES QUE VERDE, EN LAS DOS PUERTAS
   Subtransacción que se deshace sola (L-406).
   ═══════════════════════════════════════════════════════════════════════════ */
DO $cinturon$
DECLARE
  k_masc    uuid := '73c381cc-9f7c-4b82-91f6-a415c8b1676f';
  k_titular uuid := '632727a3-9682-4fa7-b569-19a6399736ff';
  k_ajeno   uuid := '4f572081-26a5-4d3b-9d80-25ea751fdc9c';
  v_r       jsonb; v_modo text; v_proc text; v_n int; v_msg text;
BEGIN
  BEGIN

  /* ⓪ CONTROL POSITIVO del fixture y de la premisa */
  IF NOT EXISTS (SELECT 1 FROM mascotas WHERE id=k_masc AND user_id=k_titular) THEN
    RAISE EXCEPTION 'ARNES: el fixture ya no existe — re-medir';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='registrar_desparasitacion_familia') THEN
    RAISE EXCEPTION 'ARNES: la puerta duplicada sigue viva';
  END IF;
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='_marcar_modo_captura_evento';
  IF v_n <> 1 THEN RAISE EXCEPTION 'ARNES: el marcador tiene % firmas, esperaba 1', v_n; END IF;

  /* ① L-140 */
  IF has_function_privilege('anon','public.registrar_recuerdo_familia(uuid,text,date,text)','EXECUTE')
     OR has_function_privilege('anon','public._marcar_modo_captura_evento(uuid[],text,text)','EXECUTE') THEN
    RAISE EXCEPTION 'L-140: anon alcanza una puerta nueva';
  END IF;
  IF NOT has_function_privilege('authenticated','public.registrar_recuerdo_familia(uuid,text,date,text)','EXECUTE') THEN
    RAISE EXCEPTION 'ARNES: authenticated no alcanza el recuerdo — el gate mide mal';
  END IF;

  /* ①bis la fila de catálogo existe — sin ella la puerta nace tapiada */
  IF NOT EXISTS (SELECT 1 FROM cat_hitos_narrativos WHERE clave='recuerdo_familia' AND activo) THEN
    RAISE EXCEPTION 'ARNES: falta la fila de catálogo recuerdo_familia';
  END IF;

  /* ② EL GRANT quedó donde debía, y anon NO lo ganó de paso */
  IF NOT has_table_privilege('authenticated','public.evento_hito_narrativo','INSERT') THEN
    RAISE EXCEPTION 'ARNES: falta el GRANT de INSERT a authenticated';
  END IF;
  IF has_table_privilege('anon','public.evento_hito_narrativo','INSERT')
     OR has_table_privilege('anon','public.evento_hito_narrativo','SELECT') THEN
    RAISE EXCEPTION 'ARNES: anon ganó acceso a la tabla de hitos';
  END IF;

  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', k_titular::text, 'role','authenticated')::text, true);

  /* ═══ EL RECUERDO ════════════════════════════════════════════════════════ */

  /* ✅ VERDE: nace en el hito, con las DOS marcas y el dato que el timeline lee */
  v_r := public.registrar_recuerdo_familia(k_masc, 'ARNES S113 recuerdo', NULL,
                                           k_titular::text || '/foto-arnes.jpg');
  SELECT modo_captura, procedencia INTO v_modo, v_proc
    FROM eventos_mascota WHERE id = (v_r->>'evento_id')::uuid;
  IF v_modo IS DISTINCT FROM 'tecleado' THEN
    RAISE EXCEPTION 'ARNES recuerdo: modo_captura quedó %, esperaba tecleado', v_modo;
  END IF;
  IF v_proc IS DISTINCT FROM 'declarado_por_familia' THEN
    RAISE EXCEPTION 'ARNES recuerdo: procedencia quedó %, esperaba declarado_por_familia', v_proc;
  END IF;
  /* 🔴 lo que hace que el recuerdo SE VEA: el timeline discrimina por esto */
  SELECT count(*) INTO v_n FROM eventos_mascota
   WHERE id=(v_r->>'evento_id')::uuid AND tipo='hito_narrativo'
     AND datos->>'clave_hito' = 'recuerdo_familia';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'ARNES: el evento no lleva datos.clave_hito — el timeline no lo vería';
  END IF;
  SELECT count(*) INTO v_n FROM evento_hito_narrativo
   WHERE id=(v_r->>'hito_id')::uuid AND clave='recuerdo_familia'
     AND texto IS NOT NULL AND foto_url IS NOT NULL;
  IF v_n <> 1 THEN RAISE EXCEPTION 'ARNES: la fila no quedó con texto y foto'; END IF;

  /* ✅ sólo foto, sin texto: es un recuerdo legítimo */
  v_r := public.registrar_recuerdo_familia(k_masc, NULL, NULL, k_titular::text || '/f2.jpg');
  IF v_r->>'ok' <> 'true' THEN RAISE EXCEPTION 'ARNES: rechazó un recuerdo de sólo foto'; END IF;

  /* 🔴 ROJO ①: sin texto NI foto */
  BEGIN
    PERFORM public.registrar_recuerdo_familia(k_masc, '  ', NULL, NULL);
    RAISE EXCEPTION 'ARNES: aceptó un recuerdo vacío';
  EXCEPTION WHEN sqlstate '22023' THEN NULL;
  END;

  /* 🔴 ROJO ②: URL en vez de path · ROJO ③: carpeta ajena · ROJO ④: fecha futura */
  BEGIN
    PERFORM public.registrar_recuerdo_familia(k_masc, 'x', NULL, 'https://x/y.jpg');
    RAISE EXCEPTION 'ARNES: aceptó una URL'; EXCEPTION WHEN sqlstate '22023' THEN NULL;
  END;
  BEGIN
    PERFORM public.registrar_recuerdo_familia(k_masc, 'x', NULL, k_ajeno::text || '/y.jpg');
    RAISE EXCEPTION 'ARNES: aceptó carpeta ajena'; EXCEPTION WHEN sqlstate '22023' THEN NULL;
  END;
  BEGIN
    PERFORM public.registrar_recuerdo_familia(k_masc, 'x', public.hoy_local() + 1, NULL);
    RAISE EXCEPTION 'ARNES: aceptó fecha futura'; EXCEPTION WHEN sqlstate '22023' THEN NULL;
  END;

  /* 🔴 ROJO ⑤ — EL QUE HACE SEGURA LA MUDANZA: la familia NO puede fabricar
     un hito del sistema. Se prueba contra la POLICY, por INSERT directo. */
  BEGIN
    INSERT INTO evento_hito_narrativo (evento_id, mascota_id, country_code, clave)
    VALUES (gen_random_uuid(), k_masc, 'EC', 'adopcion_completada');
    RAISE EXCEPTION 'ARNES: la familia PUDO fabricar un hito del sistema';
  EXCEPTION WHEN insufficient_privilege OR foreign_key_violation THEN NULL;
  END;

  /* ═══ EL ANTIPARASITARIO — LA PUERTA QUE YA EXISTÍA ══════════════════════ */

  /* ✅ VERDE: ahora escribe modo_captura, y su procedencia sigue viniendo del trigger */
  v_r := public.registrar_desparasitacion(k_masc, 'ARNES S113 antiparasitario',
                                          'interna', public.hoy_local(), public.hoy_local() + 30, NULL);
  SELECT e.modo_captura, e.procedencia INTO v_modo, v_proc
    FROM evento_desparasitacion_aplicada d JOIN eventos_mascota e ON e.id = d.evento_id
   WHERE d.id = (v_r->>'id')::uuid;
  IF v_modo IS DISTINCT FROM 'tecleado' THEN
    RAISE EXCEPTION 'ARNES desp: modo_captura quedó %, esperaba tecleado', v_modo;
  END IF;
  IF v_proc IS DISTINCT FROM 'declarado_por_familia' THEN
    RAISE EXCEPTION 'ARNES desp: procedencia quedó %, esperaba declarado_por_familia', v_proc;
  END IF;

  /* 🔴 ROJO ⑥: su guard de orden de fechas sigue vivo */
  BEGIN
    PERFORM public.registrar_desparasitacion(k_masc, 'x', 'interna',
              public.hoy_local(), public.hoy_local() - 1, NULL);
    RAISE EXCEPTION 'ARNES: aceptó fecha_proxima anterior';
  EXCEPTION WHEN sqlstate '22023' THEN NULL;
  END;

  /* ═══ 🔴 EL DISCRIMINADOR: un tercero, la misma mascota, rebota ══════════ */
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', k_ajeno::text, 'role','authenticated')::text, true);
  BEGIN
    PERFORM public.registrar_recuerdo_familia(k_masc, 'intruso', NULL, NULL);
    RAISE EXCEPTION 'ARNES: un tercero escribió un recuerdo ajeno';
  EXCEPTION WHEN sqlstate '42501' OR sqlstate '22023' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg LIKE 'recuerdo_vacio%' OR v_msg LIKE 'foto_invalida%' THEN
      RAISE EXCEPTION 'ARNES: rebotó por forma, NO por acceso: %', v_msg;
    END IF;
  END;
  BEGIN
    PERFORM public.registrar_desparasitacion(k_masc, 'intruso', 'interna', public.hoy_local(), NULL, NULL);
    RAISE EXCEPTION 'ARNES: un tercero escribió un antiparasitario ajeno';
  EXCEPTION WHEN sqlstate '42501' THEN NULL;
  END;

  SET LOCAL ROLE postgres;
  RAISE EXCEPTION 'ROLLBACK_ARNES_OK';

  EXCEPTION WHEN OTHERS THEN
    SET LOCAL ROLE postgres;
    IF SQLERRM = 'ROLLBACK_ARNES_OK' THEN
      RAISE NOTICE '✅ CINTURÓN S113-A (b)+(i) VERDE — arnés deshecho, residuo 0';
    ELSE RAISE;
    END IF;
  END;
END;
$cinturon$;
