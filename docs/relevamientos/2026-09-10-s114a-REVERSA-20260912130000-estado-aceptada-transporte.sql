-- REVERSA de 20260912130000. Restaura el CHECK y las funciones con 'entregada'.
-- NOTA: NO deshace el backfill de datos (las filas quedan en aceptada_transporte).
ALTER TABLE notificacion_intencion DROP CONSTRAINT notificacion_intencion_estado_check;
ALTER TABLE notificacion_intencion ADD CONSTRAINT notificacion_intencion_estado_check
  CHECK (estado = ANY (ARRAY['nacida','encolada','entregada','leida','descartada','fallida','diferida']));
CREATE OR REPLACE FUNCTION public.registrar_intencion_notificacion(p_tipo text, p_destinatario_user_id uuid, p_mascota_id uuid DEFAULT NULL::uuid, p_evento_id uuid DEFAULT NULL::uuid, p_datos jsonb DEFAULT '{}'::jsonb, p_clave_dedup text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$;
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
  v_ensamblado jsonb;
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
      -- 🔴 EL CANAL FORZADO GANA AL SELECTOR (S101-B). Hay tipos cuyo canal
      --    es un REQUISITO y no una preferencia: el comprobante de pago tiene
      --    que ser un CORREO porque lo exige la certificación de la pasarela
      --    (literal de Erick, 20-ago). *Un requisito no se somete al orden de
      --    canales, y por eso el forzado se lee del CATÁLOGO — cualquiera puede
      --    ver cuáles tipos lo tienen mirando una tabla, en vez de descubrirlo
      --    leyendo esta función.*
      --    push/in_app pueden ACOMPAÑAR; lo que no pueden es sustituirlo.
      IF v_tipo.canal_forzado IS NOT NULL THEN
        v_elegido := v_tipo.canal_forzado;
      ELSE
        SELECT ch.codigo INTO v_elegido
          FROM public.cat_notificacion_canales ch
         WHERE ch.codigo = ANY(v_canales) AND ch.es_piso = false
           AND ch.transporte_vivo
         ORDER BY ch.orden LIMIT 1;
        v_elegido := COALESCE(v_elegido, 'in_app');
      END IF;
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
    /* 🔴 EL COMPROBANTE NO SE DIFIERE (S101-B). El techo existe para que la app
       no sature con AVISOS —*avisar todo enseña a ignorar los avisos*— y esa
       razón no aplica a un RESPALDO de transacción: nadie compra diez veces en
       un día por error, y si lo hace, cada compra necesita su comprobante.
       Además es requisito de certificación del proveedor, y **un requisito no
       se somete a un techo de frecuencia**.
       Medido el 20-ago en el gate: el correo no llegó con
       `gate_que_corto: diferida_techo`, con el founder en 20 de 20. */
    IF v_cuantas >= v_cat.techo_max AND NOT COALESCE(v_tipo.ignora_techo, false) THEN
      v_motivo := 'diferida_techo';
    END IF;
  END IF;

  v_estado := CASE
                WHEN v_motivo = 'diferida_techo' THEN 'diferida'
                WHEN v_motivo IS NOT NULL        THEN 'descartada'
                ELSE 'nacida'
              END;

  -- 🔴 S114-A · ENSAMBLADO DE VARIABLES DE PLANTILLA. Se arma ACÁ (donde están
  -- el tipo, sus datos y el destinatario) y queda en resuelto_como, para que:
  -- (a) el transporte lo lea o REBOTE si está incompleto (no manda con hueco),
  -- (b) E lo mire en sombra sin que salga nada. Null si el tipo no va por plantilla.
  v_ensamblado := public._ensamblar_plantilla(
    v_tipo.plantilla_whatsapp, v_tipo.plantilla_variables, p_datos, p_destinatario_user_id);

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
      'evaluado_en',         to_jsonb(now()),
      'plantilla',           COALESCE(to_jsonb(v_tipo.plantilla_whatsapp), 'null'::jsonb),
      'plantilla_idioma',    COALESCE(to_jsonb(v_tipo.plantilla_idioma), 'null'::jsonb),
      'variables',           COALESCE(v_ensamblado->'variables', 'null'::jsonb),
      'ensamblado_completo', COALESCE(v_ensamblado->'completo', 'null'::jsonb),
      'ensamblado_faltante', COALESCE(v_ensamblado->'faltante', 'null'::jsonb)
    )
  )
  ON CONFLICT (clave_dedup) DO NOTHING
  RETURNING id INTO v_id;

  RETURN v_id;
END $function$;


CREATE OR REPLACE FUNCTION public.despachar_notificaciones(p_seco boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$;
DECLARE
  v_global      record;
  v_i           record;
  v_cfg         record;
  v_cat         record;
  v_entregadas  integer;
  v_retenidas   integer := 0;
  v_vencidas    integer := 0;
  v_sombra      integer := 0;
  v_por_techo   integer := 0;
  v_transporte  integer := 0;
  v_motivo      text;
BEGIN
  SELECT * INTO v_global FROM public.notificacion_config WHERE alcance = 'global';

  FOR v_i IN
    SELECT * FROM public.notificacion_intencion
     WHERE estado = 'nacida' ORDER BY created_at
  LOOP
    SELECT * INTO v_cfg FROM public.notificacion_config WHERE alcance = v_i.categoria;
    SELECT * INTO v_cat FROM public.cat_notificacion_categorias WHERE codigo = v_i.categoria;
    v_motivo := NULL;

    -- ══ ③ VIGENCIA — la cola vuelve a pasar por la puerta ═══════════════════
    -- Se evalúa PRIMERO: un aviso vencido no se retiene "para después", muere.
    -- Retenerlo sería guardar para mañana algo que ya no tiene sentido hoy.
    IF v_cat.vigencia_horas IS NOT NULL
       AND v_i.created_at < now() - make_interval(hours => v_cat.vigencia_horas) THEN
      v_vencidas := v_vencidas + 1;
      IF NOT p_seco THEN
        UPDATE public.notificacion_intencion
           SET estado = 'descartada', motivo = 'descartada_vencida', updated_at = now()
         WHERE id = v_i.id;
      END IF;
      CONTINUE;
    END IF;

    -- ══ ① KILL SWITCH — global primero, después la categoría ════════════════
    IF NOT v_global.despacho_activo THEN
      v_motivo := 'retenida_kill_switch_global';
    ELSIF NOT COALESCE(v_cfg.despacho_activo, true) THEN
      v_motivo := 'retenida_kill_switch_' || v_i.categoria;
    END IF;

    -- ══ ② TECHO DURO — el FUSIBLE, del sistema entero ═══════════════════════
    -- Cuenta lo YA ENTREGADO en la ventana. No es el gate 5 (que es por
    -- persona): una persona puede estar bajo su techo y el sistema mandando
    -- cien mil.
    IF v_motivo IS NULL THEN
      SELECT count(*) INTO v_entregadas
        FROM public.notificacion_intencion i
       WHERE i.estado IN ('entregada','leida')
         AND i.updated_at > now() - make_interval(hours => v_global.techo_duro_ventana_horas);
      IF v_entregadas >= v_global.techo_duro_max THEN
        v_motivo := 'retenida_techo_duro';
        v_por_techo := v_por_techo + 1;
        -- El fusible SALTA y NO se auto-rearma: se apaga el despacho y se dice.
        IF NOT p_seco AND v_global.despacho_activo THEN
          UPDATE public.notificacion_config
             SET despacho_activo = false, apagado_en = now(),
                 motivo = 'techo_duro_saltado: ' || v_entregadas || ' entregas en '
                       || v_global.techo_duro_ventana_horas || 'h', updated_at = now()
           WHERE alcance = 'global';
          SELECT * INTO v_global FROM public.notificacion_config WHERE alcance = 'global';
        END IF;
      END IF;
    END IF;

    IF v_motivo IS NOT NULL THEN
      v_retenidas := v_retenidas + 1;
      IF NOT p_seco THEN
        UPDATE public.notificacion_intencion
           SET resuelto_como = COALESCE(resuelto_como,'{}'::jsonb)
                             || jsonb_build_object('despacho', v_motivo,
                                                   'despacho_en', to_jsonb(now())),
               updated_at = now()
         WHERE id = v_i.id;   -- ⚠️ el estado NO cambia: sigue `nacida`, esperando
      END IF;
      CONTINUE;
    END IF;

    -- ══ PASA. Y acá está la única razón por la que hoy nada sale ════════════
    -- El tipo está EN SOMBRA (§10.2): se registra qué habría salido y NO se
    -- entrega. El primer envío real de cada tipo es gate del founder.
    IF v_i.en_sombra THEN
      v_sombra := v_sombra + 1;
      IF NOT p_seco THEN
        UPDATE public.notificacion_intencion
           SET estado = 'encolada',
               resuelto_como = COALESCE(resuelto_como,'{}'::jsonb)
                             || jsonb_build_object('despacho', 'sombra_habria_salido',
                                                   'despacho_en', to_jsonb(now())),
               updated_at = now()
         WHERE id = v_i.id;
      END IF;
    ELSE
      -- S88 · EL ENCHUFE DEL TRANSPORTE (donde el RAISE decia "el correo va
      -- aca"): la intencion queda ENCOLADA y marcada para_transporte. Quien
      -- entrega es la Edge Function `despachar-correo` (la unica voz al
      -- exterior): la levanta, habla con el proveedor y escribe de vuelta
      -- entregada/fallida con su causa. La DB jamas llama al proveedor.
      v_transporte := v_transporte + 1;
      IF NOT p_seco THEN
        UPDATE public.notificacion_intencion
           SET estado = 'encolada',
               resuelto_como = COALESCE(resuelto_como,'{}'::jsonb)
                             || jsonb_build_object('despacho', 'para_transporte',
                                                   'despacho_en', to_jsonb(now())),
               updated_at = now()
         WHERE id = v_i.id;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'seco', p_seco,
    'despacho_global_activo', v_global.despacho_activo,
    'sombra_habrian_salido', v_sombra,
    'retenidas', v_retenidas,
    'retenidas_por_techo', v_por_techo,
    'vencidas_al_reevaluar', v_vencidas,
    'para_transporte', v_transporte
  );
END $function$;

