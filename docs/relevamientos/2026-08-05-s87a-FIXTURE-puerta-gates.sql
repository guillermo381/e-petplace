-- ============================================================================
-- S87-A · LOTE 1 · PIEZA ② — LA PUERTA ÚNICA Y LOS CINCO GATES DE §5
--
-- Hoy siete DEFINER vivas insertan intenciones SIN CONSULTAR NINGÚN GATE. Esta
-- pieza construye la puerta por la que van a pasar. NO cierra todavía la puerta
-- trasera: ese es el paso 6 del orden firmado, DESPUÉS de migrar las siete.
--
-- LOS CINCO GATES (MODELO_NOTIFICACIONES §5), en su orden y sin excepción:
--   1 MOMENTO VITAL · 2 MENORES (P5) · 3 ROL Y ACCESO · 4 CONSENTIMIENTO ·
--   5 TECHO DE FRECUENCIA
--
-- ⚠️ EL GATE 1 SE ESCRIBE CONTRA LO VIVO, NO CONTRA LA LETRA:
-- `memorial` NO ES UN VALOR. `mascotas.estado_vida` es CHECK(activa|perdida|
-- fallecida) y el producto ya define memorial como `<> 'activa'` (literal vivo
-- en adiestramiento-antes.ts:195 y grooming-atencion.ts:397). Un gate escrito
-- contra `= 'memorial'` habría corrido VERDE Y NO HABRÍA APAGADO NADA — letra
-- muerta silenciosa (L-192). Y con `<> 'activa'`, `perdida` queda adentro del
-- silencio, que es lo correcto: a una familia que perdió a su mascota tampoco
-- se le manda un recordatorio de vacuna.
--
-- VEDA 76(g): NO RIGE — aditiva, sin backfill, sin anclas.
-- REVERSA escrita ANTES:
--   docs/relevamientos/2026-08-05-s87a-REVERSA-puerta-intenciones.sql
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- ① EL TECHO SE VUELVE DATO (gate 5). Sin esto el gate 5 sería un número
--    escrito a mano adentro de una función — la clase de cosa que nadie
--    encuentra el día que hay que cambiarla.
-- ---------------------------------------------------------------------------
ALTER TABLE public.cat_notificacion_categorias
  ADD COLUMN techo_ventana_horas integer NOT NULL DEFAULT 24,
  ADD COLUMN techo_max           integer NOT NULL DEFAULT 20;

-- Las no apagables tienen techo alto A PROPÓSITO: un techo bajo sobre
-- `salud_seguridad` sería apagar por la ventana lo que §3 prohíbe apagar
-- por la puerta.
UPDATE public.cat_notificacion_categorias
   SET techo_max = 200 WHERE apagable_existencia = false;
UPDATE public.cat_notificacion_categorias
   SET techo_max = 5   WHERE codigo = 'comercial';

-- ---------------------------------------------------------------------------
-- ② LA TABLA DE INTENCIONES
--
-- `notificaciones` (la vieja, 26 filas) NO se toca: es historia. El motor
-- nuevo escribe acá. Las descartadas SE GUARDAN CON SU MOTIVO — una intención
-- que un gate mató sin dejar rastro vuelve como "el aviso no llegó" y no hay
-- forma de contestar (§10.6).
-- ---------------------------------------------------------------------------
CREATE TABLE public.notificacion_intencion (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          text NOT NULL REFERENCES public.cat_notificacion_tipos(codigo),
  categoria     text NOT NULL REFERENCES public.cat_notificacion_categorias(codigo),
  destinatario_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mascota_id    uuid REFERENCES public.mascotas(id) ON DELETE SET NULL,
  -- §10.6: la referencia al hecho que la disparó. Es lo que contesta
  -- "¿por qué me llegó esto?", que es la pregunta que siempre llega.
  evento_id     uuid REFERENCES public.eventos_mascota(id) ON DELETE SET NULL,
  datos         jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- §10.1: una intención = una entrega. Un reintento jamás duplica.
  clave_dedup   text UNIQUE,
  estado        text NOT NULL DEFAULT 'nacida'
    CHECK (estado IN ('nacida','encolada','entregada','leida','descartada','fallida','diferida')),
  motivo        text,
  -- §10.2: en sombra se registra QUÉ HABRÍA PASADO y no se entrega.
  en_sombra     boolean NOT NULL,
  resuelto_como jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT intencion_descartada_dice_por_que
    CHECK (estado <> 'descartada' OR motivo IS NOT NULL)
);

CREATE INDEX idx_intencion_pendientes ON public.notificacion_intencion (estado, created_at)
  WHERE estado IN ('nacida','encolada');
CREATE INDEX idx_intencion_techo ON public.notificacion_intencion
  (destinatario_user_id, categoria, created_at);

COMMENT ON TABLE public.notificacion_intencion IS
  'La cola de intenciones del motor (MODELO_NOTIFICACIONES). Se escribe SOLO '
  'por registrar_intencion_notificacion. Las descartadas se conservan con su '
  'motivo: sin rastro no se puede contestar "por que me llego esto" (§10.6).';

-- ---------------------------------------------------------------------------
-- ③ LA PUERTA ÚNICA — los cinco gates de §5, en orden
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
  v_cuantas    integer;
  v_por_menor  boolean;
BEGIN
  SELECT * INTO v_tipo FROM public.cat_notificacion_tipos WHERE codigo = p_tipo AND activo;
  IF v_tipo IS NULL THEN
    RAISE EXCEPTION 'tipo_desconocido' USING ERRCODE = '22023',
      HINT = 'El tipo no existe en cat_notificacion_tipos o esta inactivo.';
  END IF;
  SELECT * INTO v_cat FROM public.cat_notificacion_categorias WHERE codigo = v_tipo.categoria;

  -- ══ GATE 1 · MOMENTO VITAL ═══════════════════════════════════════════════
  -- Memorial apaga TODO. Único sobreviviente: `seguridad_cuenta`, porque es
  -- de la PERSONA y no de la mascota (§5.1).
  IF p_mascota_id IS NOT NULL AND v_tipo.categoria <> 'seguridad_cuenta' THEN
    IF EXISTS (SELECT 1 FROM public.mascotas m
                WHERE m.id = p_mascota_id AND m.estado_vida IS DISTINCT FROM 'activa') THEN
      v_motivo := 'descartada_memorial';
    END IF;
  END IF;

  -- ══ GATE 2 · MENORES (P5) ════════════════════════════════════════════════
  -- `aportado_por_menor` vive SOLO en `evento_bitacora_familia`. Para los
  -- tipos cuyo origen no es la bitácora el gate NO APLICA — y se dice, jamás
  -- se finge que evaluó.
  IF v_motivo IS NULL AND p_evento_id IS NOT NULL THEN
    SELECT b.aportado_por_menor INTO v_por_menor
      FROM public.evento_bitacora_familia b WHERE b.evento_id = p_evento_id;
    IF COALESCE(v_por_menor, false) THEN
      v_motivo := 'descartada_menor';
    END IF;
  END IF;

  -- ══ GATE 3 · ROL Y ACCESO ════════════════════════════════════════════════
  -- "Sin esta capa, el motor filtra por push lo que la RLS cerró" (§2). Nadie
  -- recibe avisos de una mascota con la que no tiene vínculo vivo (§12.7).
  --
  -- ⚠️ MEDIDO AL CONSTRUIR: `user_tiene_acceso_a_mascota` toma UN SOLO
  -- argumento y resuelve contra `auth.uid()` — el CALLER. Acá el caller es una
  -- DEFINER del motor, NO el destinatario: usarla habría evaluado a la persona
  -- equivocada y el gate habría corrido verde mintiendo. Se usa el helper de
  -- DOS argumentos, y la pata prestador se escribe explícita en vez de
  -- suponerse cubierta.
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
           AND (pr.user_id = p_destinatario_user_id
                OR pe.user_id = p_destinatario_user_id)
      )
    ) THEN
      v_motivo := 'descartada_sin_acceso';
    END IF;
  END IF;

  -- ══ GATE 4 · CONSENTIMIENTO (§6) ═════════════════════════════════════════
  -- Si NINGÚN canal quedó habilitado, no hay por dónde: se descarta. En una
  -- categoría no apagable esto es inalcanzable por construcción — el piso
  -- `in_app` no se puede apagar (trigger de la pieza ③).
  IF v_motivo IS NULL THEN
    SELECT array_agg(ch.codigo ORDER BY ch.orden) INTO v_canales
      FROM public.cat_notificacion_canales ch
     WHERE public.preferencia_efectiva(p_destinatario_user_id, v_tipo.categoria, ch.codigo);
    IF v_canales IS NULL OR array_length(v_canales, 1) IS NULL THEN
      v_motivo := 'descartada_sin_consentimiento';
    END IF;
  END IF;

  -- ══ GATE 5 · TECHO DE FRECUENCIA (§8) ════════════════════════════════════
  -- Por persona y ventana, configurable POR CATEGORÍA (dato, no número
  -- escrito a mano). No descarta: DIFIERE — el hecho ocurrió igual.
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
    -- §10.2: el registro de sombra. QUÉ habría salido y POR DÓNDE.
    jsonb_build_object(
      'canales_habilitados', COALESCE(to_jsonb(v_canales), 'null'::jsonb),
      'gate_que_corto',      COALESCE(to_jsonb(v_motivo), 'null'::jsonb),
      'evaluado_en',         to_jsonb(now())
    )
  )
  ON CONFLICT (clave_dedup) DO NOTHING   -- §10.1: un reintento jamás duplica
  RETURNING id INTO v_id;

  RETURN v_id;   -- NULL = deduplicada (ya existía). Es un dato, no un fallo.
END $$;

-- ---------------------------------------------------------------------------
-- ④ LA REGLA DE LA TRANSICIÓN (§5.1) — ES UN TRIGGER, NO UN GATE
--
-- El gate 1 protege lo que NACE. Lo ya encolado lo purga esto. "Un recordatorio
-- de vacuna que llega el día después es la peor falla imaginable de este
-- producto" — y el gate de nacimiento NO la cubre, porque esas filas ya
-- nacieron.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._trg_mascotas_purga_cola_memorial()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
BEGIN
  IF NEW.estado_vida IS DISTINCT FROM 'activa'
     AND OLD.estado_vida IS NOT DISTINCT FROM 'activa' THEN
    UPDATE public.notificacion_intencion
       SET estado = 'descartada',
           motivo = 'descartada_memorial_transicion',
           updated_at = now()
     WHERE mascota_id = NEW.id
       AND estado IN ('nacida','encolada','diferida')
       AND categoria <> 'seguridad_cuenta';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_mascotas_purga_cola_memorial
  AFTER UPDATE OF estado_vida ON public.mascotas
  FOR EACH ROW EXECUTE FUNCTION public._trg_mascotas_purga_cola_memorial();

-- ---------------------------------------------------------------------------
-- ⑤ PRIVILEGIOS — L-140 con la ley de S87 (authenticated también hereda).
--     La puerta la llaman las DEFINER del motor, no las pantallas.
-- ---------------------------------------------------------------------------
ALTER TABLE public.notificacion_intencion ENABLE ROW LEVEL SECURITY;

CREATE POLICY intencion_propia_select ON public.notificacion_intencion
  FOR SELECT TO authenticated USING (destinatario_user_id = auth.uid());

REVOKE ALL ON public.notificacion_intencion FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.notificacion_intencion TO authenticated;

REVOKE EXECUTE ON FUNCTION public.registrar_intencion_notificacion(text, uuid, uuid, uuid, jsonb, text)
  FROM PUBLIC, anon, authenticated;

-- (sigue el fixture)
-- ═══ FIXTURE DEL GATE 1, CON EL CASO FABRICADO (orden del founder) ═══
DO $$
DECLARE
  v_m uuid; v_u uuid; v_r text := ''; v_id uuid; v_est text; v_mot text; v_purgadas int;
BEGIN
  -- par real: una mascota ACTIVA y alguien de su familia
  SELECT m.id, fm.user_id INTO v_m, v_u
    FROM mascotas m JOIN familia_miembro fm ON fm.familia_id = m.familia_id
   WHERE m.estado_vida = 'activa' AND fm.hasta IS NULL LIMIT 1;

  -- ── VERDE 1: mascota ACTIVA → la intención PASA ──────────────────────────
  v_id := registrar_intencion_notificacion('cita_recordatorio', v_u, v_m, NULL, '{}'::jsonb, 'fix-activa');
  SELECT estado, motivo INTO v_est, v_mot FROM notificacion_intencion WHERE id = v_id;
  v_r := v_r || format('V1(activa)=%s/%s | ', v_est, coalesce(v_mot,'-'));

  -- ── FABRICO EL CASO: la mascota entra en memorial ────────────────────────
  UPDATE mascotas SET estado_vida = 'fallecida' WHERE id = v_m;

  -- ── ROJO 1: nueva intención sobre mascota en memorial → MUERE ────────────
  v_id := registrar_intencion_notificacion('cita_recordatorio', v_u, v_m, NULL, '{}'::jsonb, 'fix-memorial');
  SELECT estado, motivo INTO v_est, v_mot FROM notificacion_intencion WHERE id = v_id;
  v_r := v_r || format('R1(memorial)=%s/%s | ', v_est, coalesce(v_mot,'-'));

  -- ── LA COLA SE PURGA: la de V1 tiene que haber muerto en la transición ───
  SELECT count(*) INTO v_purgadas FROM notificacion_intencion
   WHERE clave_dedup = 'fix-activa' AND estado = 'descartada'
     AND motivo = 'descartada_memorial_transicion';
  v_r := v_r || format('PURGA(la encolada murio)=%s | ', v_purgadas);

  -- ── VERDE 2: seguridad_cuenta SOBREVIVE al memorial (es de la persona) ───
  v_id := registrar_intencion_notificacion('sistema', v_u, v_m, NULL, '{}'::jsonb, 'fix-sobrevive');
  SELECT estado, motivo INTO v_est, v_mot FROM notificacion_intencion WHERE id = v_id;
  v_r := v_r || format('V2(seguridad_cuenta)=%s/%s | ', v_est, coalesce(v_mot,'-'));

  -- ── VERDE 3: DEDUP — el mismo aviso dos veces no duplica ─────────────────
  v_id := registrar_intencion_notificacion('sistema', v_u, v_m, NULL, '{}'::jsonb, 'fix-sobrevive');
  v_r := v_r || format('V3(dedup devuelve NULL)=%s | ', coalesce(v_id::text,'NULL'));

  -- ── ROJO 2: destinatario SIN acceso a la mascota ─────────────────────────
  -- Par ELEGIDO POR MEDICION: 'Zeus 5' no tiene NINGUN acceso de prestador vivo
  -- y la cuenta de recepcion no es de su familia. (El intento anterior uso a
  -- Thor, que SI es alcanzable por Aurora: el gate hizo bien y el caso estaba mal.)
  v_id := registrar_intencion_notificacion('sistema',
            '31bb74c0-a769-4ce0-9db8-65d9b33f7652'::uuid,
            '272f1db3-82fb-4564-9fd5-631a179f55e7'::uuid, NULL, '{}'::jsonb, 'fix-sinacceso');
  SELECT estado, motivo INTO v_est, v_mot FROM notificacion_intencion WHERE id = v_id;
  v_r := v_r || format('R2(sin acceso)=%s/%s', v_est, coalesce(v_mot,'-'));

  PERFORM set_config('epp.fix', v_r, true);
END $$;
SELECT current_setting('epp.fix', true) AS fixture_gate1;
ROLLBACK;
