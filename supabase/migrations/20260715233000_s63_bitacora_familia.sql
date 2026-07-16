-- ═════════════════════════════════════════════════════════════════════
-- S63-A — LA BITÁCORA DE LA FAMILIA (MODELO_ADIESTRAMIENTO v1.1 §7):
-- la familia registra lo que evidencia de su mascota entre sesiones.
-- Patrón novedades del paseo PERO DEL LADO FAMILIA — molde relevado
-- contra DB viva (L-144): evento_paseo_novedades (satélite con
-- codigo+detalle) + cat_novedades_paseo (catálogo con nombre_familia
-- D-387 y es_seed_preliminar en la fila).
--
-- Decisión de vocabulario (Code, doble check del arquitecto): DOS
-- vocabularios con intersección, como leyó el arquitecto —
--   · cat_objetivos_adiestramiento (ya existe): "lo vi hacer sentado
--     en casa" ES un objetivo del currículum, leído en voz de familia.
--   · cat_conductas_bitacora (NACE acá, es_seed_preliminar=true):
--     "lloró cuando salimos" no lo lista ningún currículum — conducta
--     observada del hogar.
-- El chip de la bitácora porta su fuente (chip_tipo objetivo|conducta)
-- y el RPC valida contra el catálogo que corresponde.
--
-- P5 RIGE (MODELO_LOYALTY §7.3): aportado_por_menor se DERIVA
-- server-side de familia_miembro.rol='menor' (CHECK relevado:
-- adulto_titular|adulto_autorizado|menor|cuidador_externo) — jamás lo
-- declara el cliente. El flag viaja también en datos del hito para que
-- el motor de loyalty (B4, futuro) filtre sin re-join.
--
-- SEDIMENTO del Bio-Expediente: hito en eventos_mascota con tipo
-- propio 'bitacora_familia' (clon fiel de la fila 'nota_dueno' —
-- raíz, autoría del dueño) + detalle + chips. DOS capas, no tres: la
-- bitácora no es una atención (sin estados ni cierre).
--
-- v1 vive DENTRO del contexto del programa/servicio activo (§7): el
-- RPC exige matrícula ACTIVA o cita de adiestramiento viva; la
-- bitácora UNIVERSAL es diferido declarado (§7/§9) y NO se construye.
-- evento_nota_dueno (legacy, cero UI) queda INTACTO — es nota suelta
-- sin chips, sin P5 y sin ancla de contexto: no sirve de chasis.
-- ═════════════════════════════════════════════════════════════════════

-- ── 0. El tipo del hito: clon fiel de 'nota_dueno' ────────────────────
INSERT INTO public.cat_tipos_evento
SELECT (jsonb_populate_record(c, jsonb_build_object(
  'codigo', 'bitacora_familia',
  'nombre', 'Bitacora de la familia',
  'descripcion', 'Observacion de conducta registrada por la familia entre sesiones de adiestramiento (MODELO_ADIESTRAMIENTO 7). Sedimento del Bio-Expediente aportado por la FAMILIA.',
  'tabla_tipada', 'evento_bitacora_familia'
))).*
FROM public.cat_tipos_evento c
WHERE c.codigo = 'nota_dueno'
ON CONFLICT (codigo) DO NOTHING;

-- ── 1. El catálogo propio: conductas observadas del hogar ─────────────
CREATE TABLE public.cat_conductas_bitacora (
  codigo             text PRIMARY KEY,
  nombre             text NOT NULL,
  descripcion        text,
  orden_display      integer NOT NULL DEFAULT 0,
  activo             boolean NOT NULL DEFAULT true,
  pais_codigo        text,
  es_seed_preliminar boolean NOT NULL DEFAULT true,
  nombre_familia     text NOT NULL,
  nombre_familia_en  text NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cat_conductas_bitacora IS
  'Conductas OBSERVADAS por la familia (MODELO_ADIESTRAMIENTO §7) — el vocabulario propio de la bitácora, con intersección conceptual pero identidad distinta del currículum (cat_objetivos_adiestramiento). es_seed_preliminar=true hasta validación con adiestrador real (§10.3).';

CREATE TRIGGER trg_cat_conductas_bitacora_updated_at
  BEFORE UPDATE ON public.cat_conductas_bitacora
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cat_conductas_bitacora ENABLE ROW LEVEL SECURITY;
CREATE POLICY cat_conductas_bitacora_select_authenticated
  ON public.cat_conductas_bitacora FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.cat_conductas_bitacora TO authenticated;
GRANT ALL ON public.cat_conductas_bitacora TO service_role;

INSERT INTO public.cat_conductas_bitacora
  (codigo, nombre, orden_display, nombre_familia, nombre_familia_en) VALUES
  ('lloro_al_quedarse_solo', 'Vocalización al quedarse solo',  10, 'Lloró cuando salimos', 'Cried when we left'),
  ('destrozo_objetos',       'Destrucción de objetos',         20, 'Rompió algo en casa', 'Chewed something up at home'),
  ('hizo_adentro',           'Eliminación inapropiada',        30, 'Hizo sus necesidades adentro', 'Had an accident indoors'),
  ('ladridos_excesivos',     'Ladrido excesivo',               40, 'Ladró más de lo normal', 'Barked more than usual'),
  ('miedo_ruidos',           'Sensibilidad a ruidos',          50, 'Se asustó con ruidos fuertes', 'Got scared by loud noises'),
  ('durmio_tranquilo',       'Descanso tranquilo',             60, 'Durmió tranquilo', 'Slept calmly'),
  ('comio_normal',           'Apetito normal',                 70, 'Comió normal', 'Ate normally'),
  ('jugo_con_otros_perros',  'Juego social positivo',          80, 'Jugó bien con otros perros', 'Played well with other dogs'),
  ('mas_carinoso',           'Búsqueda de contacto',           90, 'Estuvo más cariñoso', 'Was extra affectionate'),
  ('inquieto_en_casa',       'Inquietud en el hogar',         100, 'Estuvo inquieto en casa', 'Was restless at home')
ON CONFLICT (codigo) DO NOTHING;

-- ── 2. La entrada de la bitácora (DOS capas: hito + detalle) ──────────
CREATE TABLE public.evento_bitacora_familia (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id              uuid NOT NULL REFERENCES public.eventos_mascota(id) ON DELETE CASCADE,
  mascota_id             uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE RESTRICT,
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  -- el ancla del contexto §7 (v1): la matrícula si existe; NULL = el
  -- contexto fue una cita suelta viva (el guard del RPC lo exigió igual)
  programa_contratado_id uuid REFERENCES public.programas_contratados(id) ON DELETE SET NULL,
  texto                  text,
  -- P5 (LOYALTY §7.3): derivado server-side, JAMÁS del cliente. El
  -- motor de loyalty (B4) NO acumula estas filas.
  aportado_por_menor     boolean NOT NULL DEFAULT false,
  country_code           text NOT NULL DEFAULT 'EC',
  created_at             timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.evento_bitacora_familia.aportado_por_menor IS
  'P5 / MODELO_LOYALTY §7.3: derivado de familia_miembro.rol=''menor'' del autor al registrar. Estas filas JAMÁS acumulan en el motor de loyalty.';

CREATE INDEX idx_ebf_mascota ON public.evento_bitacora_familia (mascota_id, created_at DESC);
CREATE INDEX idx_ebf_programa ON public.evento_bitacora_familia (programa_contratado_id)
  WHERE programa_contratado_id IS NOT NULL;

CREATE TABLE public.evento_bitacora_chips (
  bitacora_id uuid NOT NULL REFERENCES public.evento_bitacora_familia(id) ON DELETE CASCADE,
  -- la fuente del chip: el currículum ("ya hace sentado en casa") o la
  -- conducta observada ("lloró cuando salimos") — dos vocabularios con
  -- intersección (decisión arquitecto S63)
  chip_tipo   text NOT NULL,
  codigo      text NOT NULL,
  PRIMARY KEY (bitacora_id, chip_tipo, codigo),
  CONSTRAINT chk_bitacora_chip_tipo CHECK (chip_tipo IN ('objetivo', 'conducta'))
);

-- RLS: lectura por acceso a la mascota (cubre familia Y prestador con
-- cita — el Antes del adiestrador lee por acá, helper S47); escritura
-- SOLO por la RPC (verdad firme, cero policy de INSERT).
ALTER TABLE public.evento_bitacora_familia ENABLE ROW LEVEL SECURITY;
CREATE POLICY bitacora_select ON public.evento_bitacora_familia
  FOR SELECT TO authenticated USING (user_tiene_acceso_a_mascota(mascota_id));
CREATE POLICY bitacora_delete_admin ON public.evento_bitacora_familia
  FOR DELETE TO authenticated USING (is_admin());
GRANT SELECT ON public.evento_bitacora_familia TO authenticated;
GRANT ALL ON public.evento_bitacora_familia TO service_role;

ALTER TABLE public.evento_bitacora_chips ENABLE ROW LEVEL SECURITY;
CREATE POLICY bitacora_chips_select ON public.evento_bitacora_chips
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM evento_bitacora_familia b
    WHERE b.id = bitacora_id AND user_tiene_acceso_a_mascota(b.mascota_id)
  ));
CREATE POLICY bitacora_chips_delete_admin ON public.evento_bitacora_chips
  FOR DELETE TO authenticated USING (is_admin());
GRANT SELECT ON public.evento_bitacora_chips TO authenticated;
GRANT ALL ON public.evento_bitacora_chips TO service_role;

-- ── 3. La escritura: RPC del lado FAMILIA ─────────────────────────────
CREATE OR REPLACE FUNCTION public.registrar_bitacora_familia(
  p_mascota_id uuid,
  p_texto text DEFAULT NULL,
  p_chips jsonb DEFAULT '[]'::jsonb
)
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
  IF v_programa IS NULL AND NOT EXISTS (
    SELECT 1
    FROM evento_cita_servicio c
    JOIN tipos_servicio ts ON ts.codigo = c.tipo_servicio AND ts.categoria = 'adiestramiento'
    WHERE c.mascota_id = p_mascota_id
      AND c.estado IN ('confirmada', 'en_curso')
      AND c.estado_reserva = 'pagada'
  ) THEN
    -- la bitácora UNIVERSAL es diferido declarado (§7) — el rebote lo
    -- dice tipado para que la UI hable con camino, jamás mudo
    RAISE EXCEPTION 'sin_contexto_activo' USING ERRCODE = '22023';
  END IF;

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

-- ── 4. L-140: ley en dos partes ───────────────────────────────────────
REVOKE ALL ON FUNCTION public.registrar_bitacora_familia(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_bitacora_familia(uuid, text, jsonb) TO authenticated, service_role;
