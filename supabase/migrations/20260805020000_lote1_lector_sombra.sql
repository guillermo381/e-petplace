-- ============================================================================
-- S87-A · LOTE 1 · PIEZA ⑤ — EL LECTOR DE SOMBRA
--
-- ORDEN DE LA MESA: el instrumento ANTES que el motor. Migrar las siete DEFINER
-- sin poder mirar qué habrían mandado sería migrar a ciegas y auditar al final
-- — exactamente lo que el criterio de éxito firmado prohíbe.
--
-- HOY EL SISTEMA YA ESTÁ EN MODO SOMBRA, PERO ACCIDENTAL: escribe intenciones
-- que nadie lee. Esta pieza lo vuelve DECLARADO (§10.2). La diferencia entre
-- un modo sombra y un INSERT que nadie mira ES ESTE LECTOR.
--
-- SE DISEÑA PARA EL OJO DEL FOUNDER, NO PARA EL NUESTRO. Contesta TRES
-- preguntas por fila, legibles sin SQL:
--     QUÉ habría salido · A QUIÉN · POR QUÉ (o por qué no)
-- Es el documento que se lee en la sesión de sombra ANTES de firmar el primer
-- envío real de cada tipo.
--
-- VEDA 76(g): NO RIGE — un lector nuevo + un REPLACE de la puerta sin backfill.
-- REVERSA escrita ANTES: docs/relevamientos/2026-08-05-s87a-REVERSA-lector-sombra.sql
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- ① LA PUERTA GANA EL CANAL ELEGIDO
--
-- §10.2 pide registrar "qué HABRÍA mandado y a quién". Sin el canal, el
-- registro contesta dos de las tres preguntas. La regla de selección es §7:
-- push primero, email segundo, WhatsApp último; `in_app` es el PISO — no es
-- un canal que "alcanza a alguien", es donde el aviso vive igual.
--
-- Y §7 lo exige explícito: UNA SOLA ENTREGA por intención. **Prohibido el
-- disparo múltiple** — por eso se elige UNO y se guarda cuál, en vez de
-- guardar la lista y decidir después.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.registrar_intencion_notificacion(
  p_tipo                 text,
  p_destinatario_user_id uuid,
  p_mascota_id           uuid  DEFAULT NULL,
  p_evento_id            uuid  DEFAULT NULL,
  p_datos                jsonb DEFAULT '{}'::jsonb,
  p_clave_dedup          text  DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
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
      -- §7: UNA sola entrega. Push primero, email, WhatsApp; in_app es el piso.
      SELECT ch.codigo INTO v_elegido
        FROM public.cat_notificacion_canales ch
       WHERE ch.codigo = ANY(v_canales) AND ch.es_piso = false
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
END $$;

REVOKE EXECUTE ON FUNCTION public.registrar_intencion_notificacion(text, uuid, uuid, uuid, jsonb, text)
  FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- ② EL LECTOR — tres preguntas por fila, en voz humana
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.leer_sombra_notificaciones(
  p_desde timestamptz DEFAULT (now() - interval '7 days'),
  p_hasta timestamptz DEFAULT now()
) RETURNS TABLE (
  cuando        timestamptz,
  que           text,   -- QUÉ habría salido
  categoria     text,
  canal         text,
  a_quien       text,   -- A QUIÉN
  sobre         text,   -- de qué mascota (o '—')
  resultado     text,   -- habría salido / no salió
  por_que       text,   -- POR QUÉ o por qué no, en voz humana
  modo          text    -- sombra declarada / vivo / pre-motor (legado)
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
BEGIN
  -- El registro de sombra dice a quién habría llegado un aviso: es una lista
  -- de personas con su correo. Solo admin.
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'solo_admin' USING ERRCODE = '42501',
      HINT = 'El registro de sombra nombra personas y sus correos.';
  END IF;

  RETURN QUERY
  -- ── lo que el MOTOR NUEVO evaluó ────────────────────────────────────────
  SELECT
    i.created_at,
    t.descripcion,
    i.categoria,
    COALESCE(i.resuelto_como->>'canal_elegido', '—'),
    COALESCE(p.nombre, u.email, i.destinatario_user_id::text),
    COALESCE(m.nombre, '—'),
    CASE
      WHEN i.estado = 'descartada' THEN 'NO habría salido'
      WHEN i.estado = 'diferida'   THEN 'esperaría (techo)'
      WHEN i.en_sombra             THEN 'habría salido'
      ELSE 'sale de verdad'
    END,
    -- ⚠️ `CASE i.motivo WHEN NULL` NUNCA matchea (NULL = NULL es unknown), y
    -- eso dejaba SIN RESPUESTA justo a las filas que PASARON los cinco gates
    -- — una de las tres preguntas que este lector existe para contestar.
    -- Lo destapó su propio fixture. Por eso el NULL se pregunta con IS NULL,
    -- primero y aparte.
    CASE WHEN i.motivo IS NULL
      THEN 'Pasó los cinco gates: momento vital, menores, acceso, consentimiento y techo.'
    ELSE CASE i.motivo
      WHEN 'descartada_memorial'
        THEN 'La mascota está en memorial. El silencio es parte del respeto (§5.1).'
      WHEN 'descartada_memorial_transicion'
        THEN 'Estaba en cola cuando la mascota entró en memorial: la cola se purgó.'
      WHEN 'descartada_menor'
        THEN 'El dato lo aportó un menor. Ninguna notificación se dirige a un menor (P5).'
      WHEN 'descartada_sin_acceso'
        THEN 'Esta persona no tiene vínculo vivo con la mascota (§12.7).'
      WHEN 'descartada_sin_consentimiento'
        THEN 'No dejó ningún canal encendido para esta categoría (§6).'
      WHEN 'diferida_techo'
        THEN 'Alcanzó el techo de avisos de esta categoría en la ventana (§8).'
      ELSE i.motivo
    END END,
    CASE WHEN i.en_sombra THEN 'sombra declarada' ELSE 'vivo' END
  FROM public.notificacion_intencion i
  JOIN public.cat_notificacion_tipos t ON t.codigo = i.tipo
  LEFT JOIN auth.users u ON u.id = i.destinatario_user_id
  LEFT JOIN public.profiles p ON p.id = i.destinatario_user_id
  LEFT JOIN public.mascotas m ON m.id = i.mascota_id
  WHERE i.created_at BETWEEN p_desde AND p_hasta

  UNION ALL

  -- ── el LEGADO: las filas viejas de `notificaciones`. Se muestran como lo
  --    que son —historia anterior al motor— y NO se reinterpretan como si
  --    hubieran pasado por gates que no existían.
  SELECT
    n.created_at,
    COALESCE(t2.descripcion, n.tipo),
    COALESCE(t2.categoria, '(sin categoría)'),
    n.canal,
    COALESCE(p2.nombre, u2.email, n.user_id::text),
    '—',
    CASE WHEN n.enviada THEN 'se envió (legado)' ELSE 'quedó sin enviar (legado)' END,
    'Anterior al motor: nació sin pasar por ningún gate. No se reinterpreta.',
    'pre-motor (legado)'
  FROM public.notificaciones n
  LEFT JOIN public.cat_notificacion_tipos t2 ON t2.codigo = n.tipo
  LEFT JOIN auth.users u2 ON u2.id = n.user_id
  LEFT JOIN public.profiles p2 ON p2.id = n.user_id
  WHERE n.created_at BETWEEN p_desde AND p_hasta

  ORDER BY 1 DESC;
END $$;

COMMENT ON FUNCTION public.leer_sombra_notificaciones(timestamptz, timestamptz) IS
  'EL LECTOR DE SOMBRA (§10.2). Contesta por fila: QUE habria salido, A QUIEN, '
  'y POR QUE o por que no. Es el documento que el founder lee ANTES de firmar '
  'el primer envio real de cada tipo. Solo admin: nombra personas y correos.';

REVOKE EXECUTE ON FUNCTION public.leer_sombra_notificaciones(timestamptz, timestamptz)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leer_sombra_notificaciones(timestamptz, timestamptz)
  TO authenticated;   -- el gate real es is_admin() adentro

COMMIT;
