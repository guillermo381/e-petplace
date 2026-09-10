-- S114-A · EL ENSAMBLADO DE VARIABLES DE PLANTILLA (firma founder: ahora, no en el flip).
--
-- Con transporte_vivo en false se prueba entero sin que salga nada — ese es el
-- momento. Una plantilla que sale con {{1}} literal es peor que no mandarla.
--
--  ① {{1}} persona (del destinatario, profiles.nombre) · {{2}} asunto · {{3}} monto
--     con formato de plata («$12,00», no «12»).
--  ② registrar_intencion lleva la plantilla Y las variables a resuelto_como
--     (hoy no cargaba ninguna de las dos).
--  ③ ROJO: una intención de WhatsApp cuyo ensamblado no completa las tres
--     variables queda `ensamblado_completo=false` con `ensamblado_faltante` — el
--     transporte REBOTA en vez de mandar con hueco (Meta no se queja; lo lee la familia).
--  El spec vive en cat_notificacion_tipos.plantilla_variables (ordenado, con
--  origen y formato), para que E lo pueda auditar y el ensamblado no sea código.
--
-- 76(g) NO RIGE (DB; la columna nace NULL, sin backfill de negocio). Reversa ANTES.

ALTER TABLE public.cat_notificacion_tipos
  ADD COLUMN IF NOT EXISTS plantilla_variables jsonb;
COMMENT ON COLUMN public.cat_notificacion_tipos.plantilla_variables IS
  'Spec ORDENADO de las variables {{n}} de la plantilla: [{"n":1,"origen":"persona"},'
  '{"n":2,"origen":"asunto"},{"n":3,"origen":"monto","formato":"dinero"}]. origen '
  '"persona" sale del destinatario (profiles.nombre); el resto de datos. formato '
  '"dinero" ⇒ "$12,00". El ensamblado lo arma _ensamblar_plantilla en registrar_intencion.';

-- los dos specs (3 variables, en orden)
UPDATE public.cat_notificacion_tipos
   SET plantilla_variables = '[{"n":1,"origen":"persona"},{"n":2,"origen":"asunto"},{"n":3,"origen":"monto","formato":"dinero"}]'::jsonb
 WHERE codigo IN ('caso_devolucion_por_elegir','devolucion_estado');

-- ── el ensamblador ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._ensamblar_plantilla(
  p_plantilla text, p_spec jsonb, p_datos jsonb, p_destinatario uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_elem jsonb; v_origen text; v_formato text; v_valor text; v_n int;
  v_vars jsonb := '[]'::jsonb; v_faltante jsonb := '[]'::jsonb; v_completo boolean := true;
BEGIN
  IF p_plantilla IS NULL OR p_spec IS NULL OR jsonb_typeof(p_spec) <> 'array' THEN
    RETURN NULL;   -- el tipo no va por plantilla: no hay nada que ensamblar
  END IF;
  FOR v_elem IN SELECT value FROM jsonb_array_elements(p_spec) ORDER BY (value->>'n')::int
  LOOP
    v_n := (v_elem->>'n')::int;
    v_origen := v_elem->>'origen';
    v_formato := v_elem->>'formato';
    IF v_origen = 'persona' THEN
      SELECT nombre INTO v_valor FROM public.profiles WHERE id = p_destinatario;
    ELSE
      v_valor := p_datos->>v_origen;
    END IF;
    IF v_formato = 'dinero' AND v_valor IS NOT NULL AND btrim(v_valor) <> '' THEN
      BEGIN
        v_valor := '$' || replace(to_char(round(v_valor::numeric, 2), 'FM999999990.00'), '.', ',');
      EXCEPTION WHEN OTHERS THEN
        v_valor := NULL;   -- un monto no numérico NO se manda crudo: cuenta como falta
      END;
    END IF;
    IF v_valor IS NULL OR btrim(v_valor) = '' THEN
      v_completo := false;
      v_faltante := v_faltante || jsonb_build_object('n', v_n, 'origen', v_origen);
      v_vars := v_vars || jsonb_build_object('n', v_n, 'valor', NULL);
    ELSE
      v_vars := v_vars || jsonb_build_object('n', v_n, 'valor', v_valor);
    END IF;
  END LOOP;
  RETURN jsonb_build_object('variables', v_vars, 'completo', v_completo, 'faltante', v_faltante);
END $fn$;
REVOKE ALL ON FUNCTION public._ensamblar_plantilla(text, jsonb, jsonb, uuid) FROM anon, PUBLIC;

-- ── registrar_intencion (con el ensamblado inyectado en resuelto_como) ───────
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
END $function$
;

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE v_r jsonb; v_falta jsonb;
BEGIN
  -- ① ensamblado completo: 3 variables en orden, monto formateado «$X,XX»
  v_r := _ensamblar_plantilla('caso_elegir_devolucion',
    (SELECT plantilla_variables FROM cat_notificacion_tipos WHERE codigo='caso_devolucion_por_elegir'),
    jsonb_build_object('asunto','paseo','monto',2.5), NULL);
  -- persona (destinatario NULL) falta ⇒ completo false, pero {{3}} tiene que venir «$2,50»
  IF (v_r->'variables'->2->>'valor') <> '$2,50' THEN
    RAISE EXCEPTION 'CINTURÓN ①: monto mal formateado: %', v_r->'variables'->2->>'valor';
  END IF;
  IF (v_r->'variables'->1->>'valor') <> 'paseo' THEN
    RAISE EXCEPTION 'CINTURÓN ①: asunto en la posición equivocada: %', v_r;
  END IF;
  -- ③ rojo: sin monto ⇒ completo false y {{3}} en faltante
  v_r := _ensamblar_plantilla('caso_resuelto',
    '[{"n":1,"origen":"persona"},{"n":2,"origen":"asunto"},{"n":3,"origen":"monto","formato":"dinero"}]'::jsonb,
    jsonb_build_object('asunto','paseo'), NULL);
  IF (v_r->>'completo')::boolean IS NOT FALSE THEN RAISE EXCEPTION 'CINTURÓN ③: sin monto NO marcó incompleto'; END IF;
  IF NOT (v_r->'faltante' @> '[{"n":3,"origen":"monto"}]'::jsonb) THEN
    RAISE EXCEPTION 'CINTURÓN ③: el faltante no nombra {{3}} monto: %', v_r->'faltante';
  END IF;
  -- sin plantilla ⇒ null (no va por plantilla)
  IF _ensamblar_plantilla(NULL, NULL, '{}'::jsonb, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'CINTURÓN: un tipo sin plantilla devolvió ensamblado';
  END IF;
  -- registrar_intencion lleva plantilla a resuelto_como (② — se prueba por el cuerpo)
  IF pg_get_functiondef('public.registrar_intencion_notificacion(text,uuid,uuid,uuid,jsonb,text)'::regprocedure)
       NOT ILIKE '%_ensamblar_plantilla%' THEN
    RAISE EXCEPTION 'CINTURÓN ②: registrar_intencion no llama al ensamblador';
  END IF;
  RAISE NOTICE 'CINTURÓN VERDE · ① orden+formato ($2,50) · ③ sin monto rebota incompleto · sin plantilla=null · ② registrar_intencion ensambla';
END $cinturon$;
