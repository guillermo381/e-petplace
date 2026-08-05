-- ============================================================================
-- S88-A · LOTE 2 · PIEZA ④ — KILL SWITCH Y TECHO DURO
--
-- Construida contra la letra firmada en
-- `docs/relevamientos/2026-08-05-s87a-diseno-pieza4-killswitch-techo.md`.
--
-- LA VARA DE S88 RIGE DESDE ACÁ: «ningún mensaje sale sin que el modo de
-- pararlo exista construido y probado». **④ ES ese modo** — por eso es la
-- primera pieza del Lote 2 y no la última.
--
-- LAS TRES FIRMAS QUE ESTA MIGRACIÓN EJECUTA:
--  ① el kill switch vive en el DESPACHO, no en la puerta — el rastro tiene que
--    poder contestar «¿por qué NO me llegó?» el día del apagón, que es el día
--    en que esa pregunta se hace.
--  ② fusible `global 500/24 h`, que SIGUE al uso medido y jamás lo anticipa.
--  ③ re-encender = la cola VUELVE A PASAR POR LA PUERTA; solo lo vigente sale.
--
-- VEDA 76(g): NO RIGE — aditiva, sin backfill.
-- REVERSA escrita ANTES: docs/relevamientos/2026-08-05-s88a-REVERSA-pieza4.sql
--   (y declara que revertir deja al motor SIN modo de pararse).
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- ① LA VIGENCIA CUELGA DE LA CATEGORÍA (firma ③)
--
-- «Hay avisos que envejecen y avisos que no» — §5.1 ya lo había contestado
-- para el memorial; la firma lo saca del caso y lo vuelve regla. Acá se vuelve
-- DATO: `NULL` = no envejece nunca.
-- ---------------------------------------------------------------------------
ALTER TABLE public.cat_notificacion_categorias
  ADD COLUMN vigencia_horas integer;

COMMENT ON COLUMN public.cat_notificacion_categorias.vigencia_horas IS
  'Cuantas horas sigue teniendo sentido un aviso de esta categoria. NULL = NO '
  'ENVEJECE (firma S87: hay avisos que envejecen y avisos que no). Se aplica al '
  're-encender: la cola vuelve a pasar por la puerta y solo lo vigente sale.';

UPDATE public.cat_notificacion_categorias SET vigencia_horas = CASE codigo
  -- Lo que envejece: si la cita ya pasó, avisarla es ruido.
  WHEN 'operacion'  THEN 24
  WHEN 'relacional' THEN 72
  WHEN 'resumen'    THEN 24
  WHEN 'comercial'  THEN 24
  -- Lo que NO envejece, y el porqué de cada uno:
  --  · salud_seguridad  — el cuerpo de la mascota no deja de importar.
  --  · seguridad_cuenta — un acceso raro de ayer sigue siendo un acceso raro.
  --  · saldo_pagado     — un cobro que falló seis horas atrás sigue urgente.
  ELSE NULL
END;

-- ---------------------------------------------------------------------------
-- ② LA CONFIG — el kill switch y el fusible, SIN DEPLOY (firma ①②)
-- ---------------------------------------------------------------------------
CREATE TABLE public.notificacion_config (
  alcance      text PRIMARY KEY,          -- 'global' o el código de una categoría
  despacho_activo boolean NOT NULL DEFAULT true,
  -- quién lo apagó, cuándo y POR QUÉ. El motivo es obligatorio al apagar:
  -- un apagón sin razón escrita nadie sabe cuándo se puede levantar, y el que
  -- lo levante seis horas después no va a ser el que lo bajó.
  apagado_por  uuid REFERENCES auth.users(id),
  apagado_en   timestamptz,
  motivo       text,
  techo_duro_ventana_horas integer NOT NULL DEFAULT 24,
  techo_duro_max           integer NOT NULL DEFAULT 500,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT apagon_dice_por_que
    CHECK (despacho_activo = true OR motivo IS NOT NULL)
);

COMMENT ON TABLE public.notificacion_config IS
  'El kill switch (§10.3) y el techo duro (§10.4). Se lee EN CADA TICK del '
  'despachador, jamas al arrancar: un valor cacheado hace que el kill switch '
  'tarde lo que tarde un reinicio, que es lo que no se puede permitir.';

INSERT INTO public.notificacion_config (alcance, techo_duro_max) VALUES ('global', 500);
INSERT INTO public.notificacion_config (alcance, techo_duro_max)
SELECT codigo, 500 FROM public.cat_notificacion_categorias;

-- ---------------------------------------------------------------------------
-- ③ EL DESPACHADOR
--
-- Hoy NO ENTREGA NADA, y no porque le falte código: **los 37 tipos están en
-- sombra** (§10.2). Lo que hace es decidir qué HABRÍA salido y dejarlo escrito.
--
-- `p_seco = true` (default): no muta, solo cuenta — para poder mirar antes de
-- accionar. `p_seco = false`: aplica las transiciones.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.despachar_notificaciones(p_seco boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
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
      -- Rama inalcanzable HOY (cero tipos fuera de sombra) y escrita a
      -- propósito: el día que un tipo se despierte, el transporte se enchufa
      -- ACÁ y en ningún otro lado.
      RAISE EXCEPTION 'transporte_no_existe'
        USING ERRCODE = '0A000',
              HINT = 'El tipo ' || v_i.tipo || ' salio de sombra y no hay '
                  || 'transporte conectado. Lote 2: el correo va aca.';
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'seco', p_seco,
    'despacho_global_activo', v_global.despacho_activo,
    'sombra_habrian_salido', v_sombra,
    'retenidas', v_retenidas,
    'retenidas_por_techo', v_por_techo,
    'vencidas_al_reevaluar', v_vencidas
  );
END $$;

-- ---------------------------------------------------------------------------
-- ④ EL LECTOR APRENDE A DECIR "RETENIDA"
--
-- Sin esto, una intención retenida por el kill switch se leería "habría
-- salido" — que es exactamente lo contrario de lo que pasó, y en el día en que
-- más importa. El instrumento tiene que saber decir el estado nuevo.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.leer_sombra_notificaciones(
  p_desde timestamptz DEFAULT (now() - interval '7 days'),
  p_hasta timestamptz DEFAULT now()
) RETURNS TABLE (
  cuando timestamptz, que text, categoria text, canal text,
  a_quien text, sobre text, resultado text, por_que text, modo text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'solo_admin' USING ERRCODE = '42501',
      HINT = 'El registro de sombra nombra personas y sus correos.';
  END IF;

  RETURN QUERY
  SELECT
    i.created_at,
    t.descripcion,
    i.categoria,
    COALESCE(i.resuelto_como->>'canal_elegido', '—'),
    COALESCE(p.nombre, u.email, i.destinatario_user_id::text),
    COALESCE(m.nombre, '—'),
    CASE
      WHEN i.estado = 'descartada' THEN 'NO habría salido'
      WHEN i.estado = 'diferida'   THEN 'esperaría (techo por persona)'
      WHEN i.resuelto_como->>'despacho' LIKE 'retenida_%' THEN 'RETENIDA — el despacho está frenado'
      WHEN i.estado = 'encolada' AND i.en_sombra THEN 'habría salido'
      WHEN i.en_sombra THEN 'habría salido (sin despachar todavía)'
      ELSE 'sale de verdad'
    END,
    CASE WHEN i.resuelto_como->>'despacho' = 'retenida_kill_switch_global'
           THEN 'El despacho global está apagado. La intención espera: no se perdió.'
         WHEN i.resuelto_como->>'despacho' = 'retenida_techo_duro'
           THEN 'Saltó el techo duro del sistema. El fusible NO se rearma solo (§10.4).'
         WHEN i.resuelto_como->>'despacho' LIKE 'retenida_kill_switch_%'
           THEN 'El despacho de esta categoría está apagado. La intención espera.'
         WHEN i.motivo = 'descartada_vencida'
           THEN 'Al re-encender ya no tenía sentido: su categoría envejece y venció.'
         WHEN i.motivo IS NULL
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

  SELECT n.created_at, COALESCE(t2.descripcion, n.tipo),
         COALESCE(t2.categoria, '(sin categoría)'), n.canal,
         COALESCE(p2.nombre, u2.email, n.user_id::text), '—',
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

-- ---------------------------------------------------------------------------
-- ⑤ PRIVILEGIOS — L-140 con la ley de S87 (`authenticated` también hereda).
-- ---------------------------------------------------------------------------
ALTER TABLE public.notificacion_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY config_admin ON public.notificacion_config
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

REVOKE ALL ON public.notificacion_config FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON public.notificacion_config TO authenticated;  -- el gate real es is_admin()

REVOKE EXECUTE ON FUNCTION public.despachar_notificaciones(boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.leer_sombra_notificaciones(timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.leer_sombra_notificaciones(timestamptz, timestamptz) TO authenticated;

COMMIT;
