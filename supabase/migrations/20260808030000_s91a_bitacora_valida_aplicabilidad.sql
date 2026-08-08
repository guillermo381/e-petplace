-- ============================================================================
-- S91-A · EL MOTOR RECHAZA LO QUE NO APLICA — la puerta única es la verdad
-- ============================================================================
-- ORDEN DE MESA (8-ago-2026): «la pantalla filtra, el motor DEBE rebotar
-- tipado lo que no aplica». Correcto, y son dos trabajos distintos: la
-- superficie filtra para no OFRECER; el motor rechaza para que no ENTRE. Si
-- viviera solo en la UI, cualquier otro caller —un bundle viejo, un script,
-- la próxima superficie— podría colgarle a un acuario una conducta de
-- individuo, y esa fila quedaría en el expediente para siempre.
--
-- Nace `chip_no_aplica_a_la_mascota` (tipado, 22023), hermano del
-- `chip_invalido` que ya existía. **Son dos rebotes distintos a propósito**:
-- «ese código no existe» y «ese código existe pero no es para esta mascota»
-- mandan a la UI a hacer cosas distintas.
--
-- ⚠️ EL FIXTURE DE LA ORDEN NO DISCRIMINA, Y LA CAUSA ES LA FIRMA MISMA.
-- La orden pide «gato + ladró = rebote». **Medido: `ladridos_excesivos` YA
-- NO DICE «Ladró»** — la firma en bloque de hoy lo universalizó a «Hizo más
-- ruido de lo normal» y su `especies_aplicables` incluye a `gato`. Un gato
-- PUEDE usarlo, y debe: un gato que maúlla más de lo normal es exactamente
-- la observación que ese chip existe para capturar. *El fixture describía el
-- mundo de ayer a la mañana.*
--
-- Los casos que SÍ cortan, y son los que el fixture usa:
--   · gato + `se_arranco_plumas`  → rebota por ESPECIE (es de ave)
--   · acuario + `comio_normal`    → rebota por SUJETO (es de individuo)
--   · gato + `agua_turbia`        → rebota por LOS DOS
--   · gato + `vomito`             → PASA (par de control: sin un caso que
--     pase, un guard que rebota todo también daría "verde")
--
-- Alcance declarado: valida el brazo `conducta`. Los chips `objetivo`
-- (currículum de adiestramiento) NO se tocan — ese catálogo no tiene ejes de
-- especie ni sujeto, y dárselos es otra letra. Se dice en vez de que parezca
-- olvido.
--
-- Veda 76(g): NO RIGE — solo código.
-- Reversa: docs/relevamientos/2026-08-08-s91a-REVERSA-bitacora-aplicabilidad.sql
-- ============================================================================

BEGIN;

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

DO $$
DECLARE v_acl text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                 WHERE n.nspname='public' AND p.proname='registrar_bitacora_familia'
                   AND p.prosrc LIKE '%chip_no_aplica_a_la_mascota%') THEN
    RAISE EXCEPTION 'cinturon_aplica: la validacion no quedo en la funcion viva';
  END IF;
  FOR v_acl IN SELECT p.proacl::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='registrar_bitacora_familia'
  LOOP
    IF v_acl LIKE '%anon=%' THEN RAISE EXCEPTION 'cinturon_aplica: anon en proacl'; END IF;
  END LOOP;
END $$;

COMMIT;
