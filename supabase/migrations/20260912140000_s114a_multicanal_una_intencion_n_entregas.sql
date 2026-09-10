-- S114-A · MULTICANAL · la preferencia manda: una intención, N entregas.
-- Firma del founder (10-sep). Antes el motor elegía UN canal por `orden` (carrera),
-- así que con push vivo whatsapp era inalcanzable, y las casillas que la familia
-- marcaba mentían. Ahora: UNA intención (el techo la cuenta una vez) y N ENTREGAS,
-- una por canal REQUERIDO (canal_forzado) ∪ PREFERENCIA-viva. Exento: cita_recordatorio
-- (empujón de alta frecuencia) va por UN canal. §10 enmendado: «una entrega por
-- intención POR CANAL ELEGIDO».
--
-- La trampa que decide el diseño (medida): si fueran N intenciones, el techo se
-- dispararía N× más rápido y descartaría avisos legítimos. Por eso es UNA intención
-- con entregas hijas — el techo (GATE 5 y techo duro) sigue contando la intención.
--
-- 76(g) NO RIGE (DB). Reversa ANTES en docs/relevamientos.

-- ── ① la tabla hija: una fila por (intención, canal), con su estado de transporte ──
CREATE TABLE IF NOT EXISTS public.notificacion_entrega (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intencion_id  uuid NOT NULL REFERENCES public.notificacion_intencion(id) ON DELETE CASCADE,
  canal         text NOT NULL,
  estado        text NOT NULL DEFAULT 'encolada'
                  CHECK (estado = ANY (ARRAY['encolada','aceptada_transporte','fallida'])),
  motivo        text,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  cerrado_en    timestamptz,
  UNIQUE (intencion_id, canal)
);
CREATE INDEX IF NOT EXISTS ix_notif_entrega_cola ON public.notificacion_entrega (canal, estado);
ALTER TABLE public.notificacion_entrega ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notificacion_entrega FROM anon, PUBLIC;
-- transporte-interna: sólo el service_role de los edges la escribe/lee. Sin policy = sin acceso por RLS.

-- ── ② backfill: las encoladas vivas para_transporte reciben su entrega desde canal_elegido ──
INSERT INTO public.notificacion_entrega (intencion_id, canal)
SELECT i.id, i.resuelto_como->>'canal_elegido'
  FROM public.notificacion_intencion i
 WHERE i.estado = 'encolada'
   AND i.resuelto_como->>'despacho' = 'para_transporte'
   AND i.resuelto_como->>'canal_elegido' IS NOT NULL
   AND i.resuelto_como->>'canal_elegido' <> 'in_app'
ON CONFLICT (intencion_id, canal) DO NOTHING;

-- ── ③ las dos funciones ──
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
  v_ensamblado jsonb;
  v_canales_entrega text[];
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
      -- S114 · LA PREFERENCIA MANDA (firma founder): se entrega en la UNIÓN de
      -- los canales REQUERIDOS (canal_forzado, siempre) y los de PREFERENCIA
      -- vivos. El `orden` deja de elegir uno; es a lo sumo desempate de display.
      -- EXENTO: `cita_recordatorio` va por UN canal — es un empujón de alta
      -- frecuencia (111/30d) y por tres entrena a ignorar (firma founder).
      IF p_tipo = 'cita_recordatorio' THEN
        v_canales_entrega := ARRAY(
          SELECT ch.codigo FROM public.cat_notificacion_canales ch
           WHERE ch.codigo = ANY(v_canales) AND ch.es_piso = false AND ch.transporte_vivo
           ORDER BY ch.orden LIMIT 1);
      ELSE
        v_canales_entrega := ARRAY(
          SELECT DISTINCT ch.codigo FROM public.cat_notificacion_canales ch
           WHERE ch.es_piso = false
             AND ( (ch.codigo = ANY(v_canales) AND ch.transporte_vivo)  -- preferencia VIVA
                   OR ch.codigo = v_tipo.canal_forzado ));               -- requerido (siempre)
      END IF;
      -- si ninguno vive, cae al piso in_app (el aviso igual se ve en la campana)
      IF v_canales_entrega IS NULL OR array_length(v_canales_entrega,1) IS NULL THEN
        v_canales_entrega := ARRAY['in_app'];
      END IF;
      v_elegido := v_canales_entrega[1];  -- compat: canal_elegido = el primero
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
      'canales_entrega',     COALESCE(to_jsonb(v_canales_entrega), 'null'::jsonb),
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
AS $function$
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
        -- S114 · UNA ENTREGA POR CANAL ELEGIDO: la intención es UNA (el techo la
        -- cuenta una vez); las entregas son N, una por canal que la familia marcó
        -- (más los requeridos). Cada edge lee las de SU canal y marca la ENTREGA.
        INSERT INTO public.notificacion_entrega (intencion_id, canal)
        SELECT v_i.id, c FROM jsonb_array_elements_text(
                 COALESCE(v_i.resuelto_como->'canales_entrega','[]'::jsonb)) AS c
        ON CONFLICT (intencion_id, canal) DO NOTHING;
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

-- ── CINTURÓN ④ · una familia con 3 canales recibe en los 3, y el techo cuenta UNA ──
DO $cinturon$
DECLARE
  v_fnd uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';
  v_int uuid := gen_random_uuid();
  v_n_entregas int; v_n_techo int;
BEGIN
  BEGIN
    -- una intención nacida, no-sombra, con los 3 canales marcados
    INSERT INTO notificacion_intencion (id,tipo,categoria,destinatario_user_id,estado,en_sombra,datos,resuelto_como)
    VALUES (v_int,'caso_devolucion_por_elegir','operacion',v_fnd,'nacida',false,
      '{"titulo":"sonda multicanal"}'::jsonb,
      jsonb_build_object('despacho','para_transporte','canales_entrega', jsonb_build_array('push','email','whatsapp')));
    PERFORM despachar_notificaciones(false);
    SELECT count(*) INTO v_n_entregas FROM notificacion_entrega WHERE intencion_id=v_int;
    -- el techo por persona cuenta la INTENCIÓN (una), no las entregas
    SELECT count(*) INTO v_n_techo FROM notificacion_intencion
      WHERE destinatario_user_id=v_fnd AND categoria='operacion'
        AND estado IN ('nacida','encolada','aceptada_transporte','leida') AND id=v_int;
    RAISE EXCEPTION 'ROLLBACK_SONDA';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'ROLLBACK_SONDA' THEN RAISE; END IF;
  END;
  IF v_n_entregas <> 3 THEN RAISE EXCEPTION 'CINTURON ROJO: se esperaban 3 entregas, hubo %', v_n_entregas; END IF;
  IF v_n_techo <> 1 THEN RAISE EXCEPTION 'CINTURON ROJO: el techo contó % (esperado 1)', v_n_techo; END IF;
  RAISE NOTICE 'CINTURON VERDE - 3 canales = 3 entregas, techo cuenta 1 intencion (subtx revertida)';
END $cinturon$;
