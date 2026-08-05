-- ============================================================================
-- S88-A · LOTE 2 — ENMIENDA §7 FIRMADA: EL CANAL ELEGIDO TIENE TRANSPORTE VIVO
--
-- El hallazgo del gate del primer envío: la selección de §7 elegía push A
-- CIEGAS, sin saber que push no tiene transporte — la intención quedaba
-- encolada esperando un tren que no existe, y la promesa "el 13-ago sale solo"
-- se caía en silencio. FIRMA del founder: el canal elegido es el primero
-- habilitado CON TRANSPORTE VIVO; el motor aprende qué transportes existen.
--
-- La existencia del transporte es DATO del catálogo, no conocimiento de una
-- función: cuando la build de push llegue, push vuelve a ganar con el UPDATE
-- de una fila — sin tocar la puerta.
--
-- VEDA 76(g): NO RIGE — columna nueva + REPLACE. REVERSA escrita ANTES.
-- ============================================================================

BEGIN;

ALTER TABLE public.cat_notificacion_canales
  ADD COLUMN transporte_vivo boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.cat_notificacion_canales.transporte_vivo IS
  'Enmienda §7 (S88): el canal elegido es el primero habilitado CON transporte '
  'vivo. email=true desde el gate del primer envio; push se enciende el dia de '
  'su build; whatsapp el dia de Meta. in_app es el piso y no compite.';

UPDATE public.cat_notificacion_canales SET transporte_vivo = true  WHERE codigo = 'email';
-- push y whatsapp quedan false A PROPÓSITO: sus trenes no existen.
-- in_app queda false y NO IMPORTA: es el piso, se elige por fallback, jamás compite.

CREATE OR REPLACE FUNCTION public.registrar_intencion_notificacion(p_tipo text, p_destinatario_user_id uuid, p_mascota_id uuid DEFAULT NULL::uuid, p_evento_id uuid DEFAULT NULL::uuid, p_datos jsonb DEFAULT '{}'::jsonb, p_clave_dedup text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_cat        record;
  v_tipo       record;
  v_estado     text;
  v_id         uuid;
  v_motivo     text;
  v_canales    text[];
  v_elegido    text;
  v_cuantas    integer;
  v_por_menor  boolean;
BEGIN
  SELECT * INTO v_tipo FROM public.cat_notificacion_tipos WHERE codigo = p_tipo AND activo;
  IF v_tipo IS NULL THEN
    RAISE EXCEPTION 'tipo_desconocido' USING ERRCODE = '22023',
      HINT = 'El tipo no existe en cat_notificacion_tipos o esta inactivo.';
  END IF;
  SELECT * INTO v_cat FROM public.cat_notificacion_categorias WHERE codigo = v_tipo.categoria;

  -- ══ GATE 1 · MOMENTO VITAL (memorial = estado_vida <> 'activa') ══════════
  IF p_mascota_id IS NOT NULL AND v_tipo.categoria <> 'seguridad_cuenta' THEN
    IF EXISTS (SELECT 1 FROM public.mascotas m
                WHERE m.id = p_mascota_id AND m.estado_vida IS DISTINCT FROM 'activa') THEN
      v_motivo := 'descartada_memorial';
    END IF;
  END IF;

  -- ══ GATE 2 · MENORES (P5) ════════════════════════════════════════════════
  IF v_motivo IS NULL AND p_evento_id IS NOT NULL THEN
    SELECT b.aportado_por_menor INTO v_por_menor
      FROM public.evento_bitacora_familia b WHERE b.evento_id = p_evento_id;
    IF COALESCE(v_por_menor, false) THEN
      v_motivo := 'descartada_menor';
    END IF;
  END IF;

  -- ══ GATE 3 · ROL Y ACCESO ════════════════════════════════════════════════
  IF v_motivo IS NULL AND p_mascota_id IS NOT NULL THEN
    IF NOT (
      public._user_es_familia_de_mascota(p_mascota_id, p_destinatario_user_id)
      OR public._user_es_familiar_autorizado_mascota(p_mascota_id, p_destinatario_user_id)
      OR EXISTS (
        SELECT 1
          FROM public.mascota_acceso_prestador map
          JOIN public.prestadores pr ON pr.cuenta_comercial_id = map.cuenta_comercial_id
          LEFT JOIN public.prestador_empleados pe
                 ON pe.prestador_id = pr.id AND pe.activo
         WHERE map.mascota_id = p_mascota_id
           AND map.revocado_en IS NULL
           AND (map.expira_en IS NULL OR map.expira_en > now())
           AND (pr.user_id = p_destinatario_user_id OR pe.user_id = p_destinatario_user_id)
      )
    ) THEN
      v_motivo := 'descartada_sin_acceso';
    END IF;
  END IF;

  -- ══ GATE 4 · CONSENTIMIENTO (§6) ═════════════════════════════════════════
  IF v_motivo IS NULL THEN
    SELECT array_agg(ch.codigo ORDER BY ch.orden) INTO v_canales
      FROM public.cat_notificacion_canales ch
     WHERE public.preferencia_efectiva(p_destinatario_user_id, v_tipo.categoria, ch.codigo);
    IF v_canales IS NULL OR array_length(v_canales, 1) IS NULL THEN
      v_motivo := 'descartada_sin_consentimiento';
    ELSE
      -- §7 ENMENDADO (firma founder, S88 — el hallazgo del gate del primer
      -- envío): UNA sola entrega, y el canal elegido es el primero habilitado
      -- CON TRANSPORTE VIVO. Antes elegía push A CIEGAS —push no tiene
      -- transporte— y la intención quedaba encolada esperando un tren que no
      -- existe. El motor ahora sabe qué transportes existen: es DATO del
      -- catálogo de canales, no conocimiento de esta función. El día que la
      -- build de push llegue, push vuelve a ganar con un UPDATE de una fila.
      SELECT ch.codigo INTO v_elegido
        FROM public.cat_notificacion_canales ch
       WHERE ch.codigo = ANY(v_canales) AND ch.es_piso = false
         AND ch.transporte_vivo
       ORDER BY ch.orden LIMIT 1;
      v_elegido := COALESCE(v_elegido, 'in_app');
    END IF;
  END IF;

  -- ══ GATE 5 · TECHO (§8) — difiere, no descarta: el hecho ocurrió igual ═══
  IF v_motivo IS NULL THEN
    SELECT count(*) INTO v_cuantas
      FROM public.notificacion_intencion i
     WHERE i.destinatario_user_id = p_destinatario_user_id
       AND i.categoria = v_tipo.categoria
       AND i.estado IN ('nacida','encolada','entregada','leida')
       AND i.created_at > now() - make_interval(hours => v_cat.techo_ventana_horas);
    IF v_cuantas >= v_cat.techo_max THEN
      v_motivo := 'diferida_techo';
    END IF;
  END IF;

  v_estado := CASE
                WHEN v_motivo = 'diferida_techo' THEN 'diferida'
                WHEN v_motivo IS NOT NULL        THEN 'descartada'
                ELSE 'nacida'
              END;

  INSERT INTO public.notificacion_intencion (
    tipo, categoria, destinatario_user_id, mascota_id, evento_id, datos,
    clave_dedup, estado, motivo, en_sombra, resuelto_como
  ) VALUES (
    p_tipo, v_tipo.categoria, p_destinatario_user_id, p_mascota_id, p_evento_id, p_datos,
    p_clave_dedup, v_estado, v_motivo, v_tipo.en_sombra,
    jsonb_build_object(
      'canales_habilitados', COALESCE(to_jsonb(v_canales), 'null'::jsonb),
      'canal_elegido',       COALESCE(to_jsonb(v_elegido), 'null'::jsonb),
      'gate_que_corto',      COALESCE(to_jsonb(v_motivo), 'null'::jsonb),
      'evaluado_en',         to_jsonb(now())
    )
  )
  ON CONFLICT (clave_dedup) DO NOTHING
  RETURNING id INTO v_id;

  RETURN v_id;
END $function$

;

REVOKE EXECUTE ON FUNCTION public.registrar_intencion_notificacion(text, uuid, uuid, uuid, jsonb, text)
  FROM PUBLIC, anon, authenticated;

DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM public.cat_notificacion_canales WHERE transporte_vivo;
  IF v_n <> 1 THEN RAISE EXCEPTION 'esperaba_1_transporte_vivo_hay_%', v_n; END IF;
  RAISE NOTICE 'enmienda §7 OK · email es el unico transporte vivo';
END $$;

-- fixture
-- ══ EL PAR FIRMADO (founder): push sin transporte cae a email · push con
--    transporte futuro vuelve a ganar. in-txn ROLLBACK.
DO $$
DECLARE v_u uuid; v_id uuid; v_out text := '';
BEGIN
  SELECT id INTO v_u FROM auth.users WHERE email='guillo381+s87prof@gmail.com';
  -- (el prof no tiene prefs: push HABILITADO por default de operacion)

  -- ── CARA 1: push habilitado pero SIN transporte → gana email ──
  v_id := registrar_intencion_notificacion('cita_confirmada', v_u, NULL, NULL,'{}'::jsonb,'tv:cara1');
  v_out := v_out || format('CARA1(push sin tren)=%s | ',
    (SELECT resuelto_como->>'canal_elegido' FROM notificacion_intencion WHERE id=v_id));

  -- ── CARA 2: el día de la build — push gana de nuevo con UNA fila ──
  UPDATE cat_notificacion_canales SET transporte_vivo=true WHERE codigo='push';
  v_id := registrar_intencion_notificacion('cita_confirmada', v_u, NULL, NULL,'{}'::jsonb,'tv:cara2');
  v_out := v_out || format('CARA2(push con tren)=%s | ',
    (SELECT resuelto_como->>'canal_elegido' FROM notificacion_intencion WHERE id=v_id));

  -- ── CARA 3: nadie con transporte → cae al piso in_app, jamás se pierde ──
  UPDATE cat_notificacion_canales SET transporte_vivo=false WHERE codigo IN ('push','email');
  v_id := registrar_intencion_notificacion('cita_confirmada', v_u, NULL, NULL,'{}'::jsonb,'tv:cara3');
  v_out := v_out || format('CARA3(sin trenes)=%s',
    (SELECT resuelto_como->>'canal_elegido' FROM notificacion_intencion WHERE id=v_id));
  PERFORM set_config('epp.tv', v_out, true);
END $$;
SELECT current_setting('epp.tv', true) AS par_transporte_vivo;
ROLLBACK;
