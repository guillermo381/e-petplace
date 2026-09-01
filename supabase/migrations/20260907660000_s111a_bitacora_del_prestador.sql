-- ══════════════════════════════════════════════════════════════════════════
-- S111-A · LA BITÁCORA DEL PRESTADOR — el escritor que faltaba
--
-- REVERSA: docs/relevamientos/2026-09-01-s111a-REVERSA-bitacora-prestador.sql
--          (escrita ANTES; ABORTA si hay bitácoras vivas ancladas a estadía)
-- 76(g): **NO RIGE** — no computa anclas sobre datos vivos. Cero backfill.
--
-- ══ LO QUE NO SE INVENTA, Y POR QUÉ ═══════════════════════════════════════
-- El vocabulario **YA EXISTE y sirve**: `cat_conductas_bitacora` es la bitácora
-- UNIVERSAL de S91 —25 conductas activas, 15 aplicables a perro— y son
-- exactamente *«cómo se portó hoy»*: `durmio_tranquilo`, `no_quiso_comer`,
-- `se_escondio`, `miedo_ruidos`, `hizo_fuera_de_lugar`…
-- ⚠️ El currículum del adiestramiento vive en OTRAS DOS tablas
-- (`cat_objetivos_adiestramiento`, `cat_curriculum_adiestramiento`), así que la
-- premisa de «ese vocabulario describe avances de un currículum» era falsa.
-- **Lo que faltaba no era vocabulario: era el ESCRITOR del prestador.**
--
-- ══ POR QUÉ REUSA LA TABLA Y NO CREA UNA PARALELA ═════════════════════════
-- Medido: `evento_bitacora_chips.bitacora_id` tiene **FK a
-- `evento_bitacora_familia(id)`** y su PK es `(bitacora_id, chip_tipo, codigo)`.
-- Una tabla paralela obligaría a duplicar el puente de chips — *exactamente lo
-- que no hay que duplicar*. Se agrega `estadia_id` y listo.
-- ⚠️ **El nombre de la tabla es HISTÓRICO, no una afirmación de permiso**: nació
-- cuando sólo la familia escribía. Desde S91 la bitácora es universal y desde
-- hoy tiene DOS escritores. Quien distingue es la **procedencia**, que es donde
-- esta casa la registra desde S69.
--
-- ══ LA IDEMPOTENCIA SALE DE LA FORMA, NO DE UN CONTADOR ═══════════════════
-- Medido: **una estadía ES un día** (no tiene fecha propia; la toma de su cita).
-- ⇒ `(estadía, conducta, día)` ≡ `(estadía, conducta)`.
-- Con **UNA fila de bitácora por estadía**, la PK del puente da la idempotencia
-- **gratis**: el segundo toque del mismo chip cae en `ON CONFLICT DO NOTHING`.
-- *No se cuenta nada ni se compara nada: el estado duplicado es inexpresable*
-- (`L-222`).
--
-- ══ 🔴 UNA TENSIÓN QUE SE DECLARA EN VEZ DE RESOLVERSE SOLA ═══════════════
-- El guard de estado terminal bloquea los TRES: `cancelada`, `no_recogida` y
-- **`entregada`**. Los dos primeros son indiscutibles —*el animal nunca estuvo:
-- anotar una conducta sería fabricar un hecho*—.
-- **`entregada` es el discutible, y lo digo:** el animal SÍ estuvo, y las manos
-- del cuidador quedan libres JUSTO después de entregar. Con este guard, no
-- puede anotar a las 18:05 lo que vio a las 15:00.
-- Se construye **como se pidió** y se deja nombrado: si el founder quiere la
-- ventana, es sacar `'entregada'` de UNA lista. *No reinterpreto una orden, y
-- tampoco escondo el borde que veo.*
-- ══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ══ ① EL ANCLA A LA ESTADÍA ══════════════════════════════════════════════
ALTER TABLE public.evento_bitacora_familia
  ADD COLUMN IF NOT EXISTS estadia_id uuid REFERENCES public.guarderia_estadias(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.evento_bitacora_familia.estadia_id IS
  'S111-A · Ancla a la estadía cuando la bitácora la escribe el PRESTADOR. NULL '
  'cuando la escribe la familia. Quien distingue quién habló es '
  '`eventos_mascota.procedencia`, no esta columna.';

COMMENT ON TABLE public.evento_bitacora_familia IS
  'La bitácora del expediente. ⚠️ El nombre es HISTÓRICO: nació cuando sólo la '
  'familia escribía. Desde S91 es universal y desde S111 tiene DOS escritores '
  '(familia y prestador). La procedencia del evento dice cuál.';

-- UNA bitácora por estadía. **Ésta es la idempotencia**: con una sola fila, la
-- PK de `evento_bitacora_chips` hace que el mismo chip dos veces sea imposible.
CREATE UNIQUE INDEX IF NOT EXISTS uq_bitacora_por_estadia
  ON public.evento_bitacora_familia (estadia_id)
  WHERE estadia_id IS NOT NULL;

-- ══ ② EL ESCRITOR ════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.registrar_bitacora_guarderia(
  p_estadia_id uuid,
  p_chips      jsonb DEFAULT '[]'::jsonb,
  p_texto      text  DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_prest     uuid;
  v_estado    text;
  v_masc      uuid;
  v_especie   text;
  v_sujeto    text;
  v_country   text;
  v_eje       text;
  v_visib     jsonb;
  v_evento    uuid;
  v_bitacora  uuid;
  v_ya        boolean := false;
  v_chip      jsonb;
  v_codigo    text;
  v_tipo      text;
  v_n         int := 0;
  v_nuevos    int := 0;
BEGIN
  -- GATE: el prestador que gestiona esta estadía. Lanza solo si no.
  v_prest := public._guarderia_estadia_gestionable(p_estadia_id);

  SELECT g.estado, c.mascota_id INTO v_estado, v_masc
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE g.id = p_estadia_id;

  -- GUARD DE ESTADO TERMINAL. Rebota HABLADO y con el estado adentro: un guard
  -- que sólo sabe negarse manda a probar de nuevo algo que nunca va a andar.
  IF v_estado = ANY (ARRAY['cancelada','no_recogida','entregada']) THEN
    RAISE EXCEPTION 'estadia_terminal: %', v_estado USING ERRCODE = '22023',
      HINT = 'La estadia ya cerro. Sobre cancelada o no_recogida el animal nunca estuvo.';
  END IF;

  -- ≥1 chip o texto: registrar la nada no es una observación (espejo del de familia)
  IF (p_texto IS NULL OR length(btrim(p_texto)) = 0)
     AND (p_chips IS NULL OR jsonb_array_length(p_chips) = 0) THEN
    RAISE EXCEPTION 'bitacora_vacia' USING ERRCODE = '22023';
  END IF;

  SELECT m.country_code, m.especie, m.sujeto INTO v_country, v_especie, v_sujeto
    FROM mascotas m WHERE m.id = v_masc;
  SELECT cte.eje_jtbd, cte.visibilidad_default INTO v_eje, v_visib
    FROM cat_tipos_evento cte WHERE cte.codigo = 'bitacora_familia';
  IF v_eje IS NULL THEN
    RAISE EXCEPTION 'catalogo_bitacora_no_encontrado' USING ERRCODE = '22023';
  END IF;

  -- ── LA FILA: una por estadía. Si ya existe, se REUSA. ──────────────────
  SELECT b.id, b.evento_id INTO v_bitacora, v_evento
    FROM evento_bitacora_familia b WHERE b.estadia_id = p_estadia_id;

  IF v_bitacora IS NULL THEN
    INSERT INTO eventos_mascota (
      mascota_id, tipo, eje_jtbd, fecha_evento, creado_por_user_id,
      datos, visibilidad, country_code, procedencia
    ) VALUES (
      v_masc, 'bitacora_familia', v_eje, now(), auth.uid(),
      jsonb_build_object('origen','bitacora_guarderia','estadia_id',p_estadia_id,
                         'prestador_id',v_prest,'aportado_por_menor',false),
      v_visib, COALESCE(v_country,'EC'),
      -- 🔴 EL TERCER NIVEL, y es el que hace honesto al expediente: quien
      -- observó fue el prestador. `verificado_por_prestador` sigue SIN
      -- productor y no se usa acá — esto es lo que él DECLARA haber visto.
      'declarado_por_prestador'
    ) RETURNING id INTO v_evento;

    INSERT INTO evento_bitacora_familia (
      evento_id, mascota_id, user_id, texto, aportado_por_menor, country_code, estadia_id
    ) VALUES (
      v_evento, v_masc, auth.uid(),
      NULLIF(btrim(COALESCE(p_texto,'')),''), false, COALESCE(v_country,'EC'), p_estadia_id
    ) RETURNING id INTO v_bitacora;
  ELSE
    v_ya := true;
    -- El texto se AGREGA, no se pisa: dos observaciones del día son dos, y
    -- pisar la primera perdería lo que el cuidador ya había escrito.
    IF p_texto IS NOT NULL AND length(btrim(p_texto)) > 0 THEN
      UPDATE evento_bitacora_familia
         SET texto = btrim(COALESCE(texto || E'\n', '') || btrim(p_texto))
       WHERE id = v_bitacora;
    END IF;
  END IF;

  -- ── LOS CHIPS, validados contra SU catálogo ────────────────────────────
  FOR v_chip IN SELECT * FROM jsonb_array_elements(COALESCE(p_chips,'[]'::jsonb))
  LOOP
    v_tipo   := COALESCE(v_chip ->> 'tipo', 'conducta');
    v_codigo := v_chip ->> 'codigo';
    IF v_tipo <> 'conducta' THEN
      RAISE EXCEPTION 'chip_invalido: %', COALESCE(v_tipo,'NULL') USING ERRCODE='22023',
        HINT = 'La bitacora del prestador registra CONDUCTAS. Los objetivos son del adiestramiento.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM cat_conductas_bitacora c WHERE c.codigo=v_codigo AND c.activo) THEN
      RAISE EXCEPTION 'chip_invalido: %', COALESCE(v_codigo,'NULL') USING ERRCODE='22023';
    END IF;
    -- LA PUERTA ÚNICA ES LA VERDAD, NO LA PANTALLA (espejo exacto del escritor
    -- de la familia): la superficie filtra para no OFRECER lo que no aplica; el
    -- motor lo RECHAZA para que no ENTRE.
    IF NOT EXISTS (
      SELECT 1 FROM cat_conductas_bitacora c
       WHERE c.codigo = v_codigo
         AND (c.especies_aplicables IS NULL OR v_especie = ANY(c.especies_aplicables))
         AND (c.sujetos_aplicables  IS NULL OR v_sujeto  = ANY(c.sujetos_aplicables))
    ) THEN
      RAISE EXCEPTION 'chip_no_aplica_a_la_mascota: %', COALESCE(v_codigo,'NULL')
        USING ERRCODE='22023';
    END IF;

    INSERT INTO evento_bitacora_chips (bitacora_id, chip_tipo, codigo)
    VALUES (v_bitacora, 'conducta', v_codigo)
    ON CONFLICT DO NOTHING;
    IF FOUND THEN v_nuevos := v_nuevos + 1; END IF;
    v_n := v_n + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true, 'bitacoraId', v_bitacora, 'eventoId', v_evento,
    'estadiaId', p_estadia_id, 'yaExistia', v_ya,
    'chipsRecibidos', v_n, 'chipsNuevos', v_nuevos);
END $fn$;

-- L-140
REVOKE EXECUTE ON FUNCTION public.registrar_bitacora_guarderia(uuid, jsonb, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.registrar_bitacora_guarderia(uuid, jsonb, text) TO authenticated;

COMMIT;
