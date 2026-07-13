-- ════════════════════════════════════════════════════════════════════
-- S59-A3 — FUNDACIÓN DEL GROOMING (MODELO_GROOMING.md v1.0, letra
-- firmada founder S59). Seis patas:
--   (a) L-140: las 36 funciones grooming nacieron pre-L-140 con EXECUTE
--       de anon (35/36 probado con sonda) y PUBLIC en varias — se cura
--       en bloque, mismo patrón S54. Los GRANTs de authenticated se
--       CONSERVAN (solo muere el acceso anónimo/heredado).
--   (b) DEVENGO §10.2: cerrar_grooming_con_calidad injerta
--       crear_evento_economico variante (b) — espejo LITERAL de
--       cerrar_paseo_con_calidad (incluida la cura S54-T4 del no-op
--       silencioso en la promoción de la cita).
--   (c) ESPECIES §5: grooming y grooming_completo pasan de NULL (pez
--       elegible) al techo de plataforma ["perro","gato"].
--   (d) OFERTA §2/§6: nace prestador_servicio_tallas (precio y duración
--       por servicio × talla S/M/L) + prestadores.grooming_extra_pelaje_
--       largo (UN extra fijo del groomer). DECISIÓN DE ESTRUCTURA:
--       tabla propia (no config jsonb) — el server de cobro va a LEER
--       de acá y congelar snapshot en la cita; una tabla tipada da
--       CHECKs duros (precio ≥ 0, duración en pasos de 15' rango
--       30-240, UNIQUE por talla) que el jsonb no puede dar. La regla
--       "3 tallas si el servicio está activo" vive en CONSTRAINT
--       TRIGGERs DIFERIDOS (se valida al commit — el wizard inserta
--       oferta+tallas en una transacción).
--   (e) PERFIL §3: mascotas.talla (S/M/L) + mascotas.pelaje
--       (normal/largo) — NULL honesto hasta que el dueño declare;
--       editables por la familia vía RLS existente (mascotas_update_
--       codueño, relevada).
--   (f) DISCREPANCIA §2: nace grooming_talla_discrepancias + RPC
--       registrar_discrepancia_talla_grooming (misma mecánica que el
--       registro del NO de P19: tabla de solo-lectura + RPC escritor
--       único; además CORRIGE el perfil — letra §2: "no se recotiza,
--       se registra y el perfil se corrige").
-- ════════════════════════════════════════════════════════════════════

-- ── (a) L-140 GROOMING: el barrido de los 36 ────────────────────────
REVOKE EXECUTE ON FUNCTION public._grooming_atencion_terminada(p_grooming_id uuid, OUT o_mascota_id uuid, OUT o_prestador_id uuid, OUT o_country_code text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._trg_sincronizar_restricciones_mascota() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._trg_temperamento_crear_evento() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.agregar_incidencia_atencion(p_atencion_id uuid, p_incidencia_codigo text, p_descripcion text, p_severidad text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.agregar_nota_atencion(p_atencion_id uuid, p_texto text, p_via text, p_categoria text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.agregar_servicio_grooming(p_grooming_id uuid, p_servicio_codigo text, p_nota text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.agregar_zona_grooming(p_grooming_id uuid, p_zona_codigo text, p_nota text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cerrar_grooming_con_calidad(p_grooming_id uuid, p_mensaje_familia text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.crear_prestador_inicial(p_cuenta_comercial_id uuid, p_tipo text, p_nombre_comercial text, p_ciudad text, p_descripcion text, p_telefono text, p_whatsapp text, p_email_contacto text, p_sitio_web text, p_direccion text, p_sector text, p_lat double precision, p_lon double precision, p_acepta_emergencias boolean, p_acepta_telemedicina boolean, p_radio_cobertura_km integer, p_matricula_profesional text, p_metadata jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.eje_de_tipo_servicio(p_tipo_servicio text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.escenario_d167_setup() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.escenario_grooming_confirmado_persistente() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.escenario_grooming_iniciado() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.iniciar_atencion_grooming(p_cita_id uuid, p_empleado_id uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_cita_de_grooming(p_grooming_id uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_grooming_por_cita(p_cita_id uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_mis_atenciones_grooming(p_desde date, p_hasta date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_resumen_cierre_grooming(p_grooming_id uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_resumen_cierre_paseo(p_atencion_id uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_resumen_dia_grooming(p_prestador_id uuid, p_fecha date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_ultima_atencion_grooming(p_mascota_id uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.pausar_atencion(p_atencion_id uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.quitar_estado_pelaje_grooming(p_grooming_id uuid, p_momento text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.quitar_servicio_grooming(p_grooming_id uuid, p_servicio_codigo text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.quitar_zona_grooming(p_grooming_id uuid, p_zona_codigo text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reanudar_atencion(p_atencion_id uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_archivo_grooming(p_grooming_id uuid, p_storage_path text, p_tipo text, p_descripcion text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_estado_pelaje_en_cierre(p_grooming_id uuid, p_momento text, p_estado_codigo text, p_nota text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_estado_pelaje_grooming(p_grooming_id uuid, p_momento text, p_estado_codigo text, p_nota text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_producto_grooming(p_grooming_id uuid, p_producto_codigo text, p_producto_otro text, p_cantidad numeric, p_unidad text, p_nota text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_rasgo_identidad_personal(p_mascota_id uuid, p_subtipo text, p_titulo_corto text, p_descripcion text, p_relevante_para text[], p_familia_miembro_id uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.simular_prestador_inicia_grooming(p_cita_id uuid, p_session_id uuid, p_empleado_id uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.terminar_atencion_grooming(p_grooming_id uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.terminar_atencion_paseo(p_atencion_id uuid, p_gps_motivo_fallo text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.test_cleanup_all() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.test_sb1_transversales_genericas() FROM PUBLIC, anon;

-- ── (b) DEVENGO AL CIERRE — cerrar_grooming_con_calidad NATIVA con el
--        bloque económico espejo del paseo (variante (b)) ─────────────
CREATE OR REPLACE FUNCTION public.cerrar_grooming_con_calidad(p_grooming_id uuid, p_mensaje_familia text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_mascota_id uuid; v_prestador_id uuid; v_country_code text; v_now timestamptz := now(); v_atencion_id uuid;
  v_cita_id uuid;
  v_cita record;
  v_cuenta record;
  v_evento_econ uuid;
  v_tiene_servicio boolean; v_recibir boolean; v_entregar boolean; v_tiene_nota_foto boolean;
BEGIN
  -- guard estricto: solo 'terminada' (antes _editable_en_cierre aceptaba cerrada_con_pendiente, DM-S35.8 eliminado)
  SELECT o_mascota_id, o_prestador_id, o_country_code INTO v_mascota_id, v_prestador_id, v_country_code
  FROM _grooming_atencion_terminada(p_grooming_id);
  SELECT evento_atencion_id INTO v_atencion_id FROM eventos_mascota_grooming WHERE id = p_grooming_id;

  -- guards de calidad (piso obligatorio §8, intactos)
  SELECT EXISTS (SELECT 1 FROM evento_grooming_servicios_aplicados WHERE grooming_id = p_grooming_id) INTO v_tiene_servicio;
  IF NOT v_tiene_servicio THEN RAISE EXCEPTION 'calidad_falta_servicio: cerrar con calidad requiere al menos un servicio aplicado' USING ERRCODE = '22023'; END IF;
  SELECT EXISTS (SELECT 1 FROM evento_grooming_archivos WHERE grooming_id = p_grooming_id AND tipo = 'foto_recibir')
    OR EXISTS (SELECT 1 FROM evento_grooming_estados_pelaje WHERE grooming_id = p_grooming_id AND momento = 'recibir') INTO v_recibir;
  SELECT EXISTS (SELECT 1 FROM evento_grooming_archivos WHERE grooming_id = p_grooming_id AND tipo = 'foto_entregar')
    OR EXISTS (SELECT 1 FROM evento_grooming_estados_pelaje WHERE grooming_id = p_grooming_id AND momento = 'entregar') INTO v_entregar;
  IF NOT v_recibir THEN RAISE EXCEPTION 'calidad_falta_estado_recibir: cerrar con calidad requiere estado al recibir (foto u observacion)' USING ERRCODE = '22023'; END IF;
  IF NOT v_entregar THEN RAISE EXCEPTION 'calidad_falta_estado_entregar: cerrar con calidad requiere estado al entregar (foto u observacion)' USING ERRCODE = '22023'; END IF;
  SELECT EXISTS (SELECT 1 FROM evento_grooming_notas WHERE grooming_id = p_grooming_id)
    OR EXISTS (SELECT 1 FROM evento_grooming_archivos WHERE grooming_id = p_grooming_id) INTO v_tiene_nota_foto;
  IF NOT v_tiene_nota_foto THEN RAISE EXCEPTION 'calidad_falta_nota_o_foto: cerrar con calidad requiere al menos una nota o foto' USING ERRCODE = '22023'; END IF;

  -- cerrar la atención
  UPDATE evento_atencion SET estado = 'cerrada_con_calidad', cerrada_en = v_now,
    mensaje_familia = COALESCE(p_mensaje_familia, mensaje_familia) WHERE id = v_atencion_id;

  -- completar el turno + DEVENGO — espejo LITERAL de cerrar_paseo_con_
  -- calidad (S59 §10.2; incluye la cura S54-T4: sin no-op silencioso)
  SELECT cita_id INTO v_cita_id FROM evento_atencion WHERE id = v_atencion_id;
  IF v_cita_id IS NOT NULL THEN
    SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = v_cita_id FOR UPDATE;
    IF v_cita.estado = 'en_curso' THEN
      UPDATE evento_cita_servicio SET estado = 'completada', updated_at = now()
      WHERE id = v_cita_id;
    ELSIF v_cita.estado = 'completada' THEN
      NULL;  -- idempotente: el turno ya estaba completado
    ELSE
      RAISE EXCEPTION 'cita_no_promovible: %', COALESCE(v_cita.estado, 'cita_inexistente')
        USING ERRCODE = '22023';
    END IF;

    -- DEVENGO AL CIERRE [variante (b)]: solo citas pagadas por
    -- confirmar_cita_pagada (invariante §1). Legacy (NULL) pasa de largo.
    IF v_cita.estado_reserva = 'pagada'
       AND NOT EXISTS (
         SELECT 1 FROM eventos_economicos ee
         WHERE ee.origen_tipo = 'cita'
           AND ee.origen_id = v_cita_id
           AND ee.tipo_evento = 'cita_pagada'
       )
    THEN
      IF v_cita.precio IS NULL OR v_cita.precio < 0 THEN
        RAISE EXCEPTION 'cita_sin_precio' USING ERRCODE = '22023';
      END IF;

      SELECT cc.id, cc.moneda INTO v_cuenta
      FROM prestadores pr
      JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
      WHERE pr.id = v_prestador_id;
      IF v_cuenta.id IS NULL THEN
        RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE = '22023';
      END IF;

      v_evento_econ := crear_evento_economico(
        p_tipo_evento         => 'cita_pagada'::tipo_evento_economico_enum,
        p_revenue_stream      => 'transaccional'::revenue_stream_enum,
        p_cuenta_comercial_id => v_cuenta.id,
        p_country_code        => v_cita.country_code,
        p_moneda              => v_cuenta.moneda,
        p_monto_bruto         => v_cita.precio,
        p_monto_kushki_fee    => 0,   -- simulación honesta: no inventamos fee
        p_origen_tipo         => 'cita',
        p_origen_id           => v_cita_id,
        p_fecha_devengo       => v_now,
        p_fecha_cobro_kushki  => (v_cita.metadata ->> 'pagado_en')::timestamptz,
        p_metadata            => jsonb_build_object('pago_simulado', true, 'via', 'cerrar_grooming_con_calidad')
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'grooming_id', p_grooming_id, 'estado', 'cerrada_con_calidad', 'cerrada_en', v_now, 'evento_economico_id', v_evento_econ);
END;
$function$;

-- misma firma: los grants no cambian; el REVOKE de (a) ya la cubrió —
-- se re-afirma L-140 por el CREATE OR REPLACE (cinturón y tirador).
REVOKE EXECUTE ON FUNCTION public.cerrar_grooming_con_calidad(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cerrar_grooming_con_calidad(uuid, text) TO authenticated;

-- ── (c) ESPECIES §5: muere el NULL = pez elegible ────────────────────
UPDATE tipos_servicio
SET especies_elegibles = '["perro","gato"]'::jsonb
WHERE codigo IN ('grooming', 'grooming_completo');

-- ── (d) ESTRUCTURA DE OFERTA §2/§6: la matriz servicio × talla ───────
CREATE TABLE prestador_servicio_tallas (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_servicio_id uuid NOT NULL REFERENCES prestador_servicios(id) ON DELETE CASCADE,
  talla                 text NOT NULL CHECK (talla IN ('S','M','L')),
  precio                numeric(14,2) NOT NULL CHECK (precio >= 0),
  -- §6: pasos de 15', rango 30-240 (defaults sugeridos 60/90 viven en
  -- el wizard de la B, jamás acá — la DB no impone defaults de negocio)
  duracion_minutos      int NOT NULL CHECK (duracion_minutos BETWEEN 30 AND 240 AND duracion_minutos % 15 = 0),
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prestador_servicio_id, talla)
);
COMMENT ON TABLE prestador_servicio_tallas IS
  'MODELO_GROOMING §2/§6 (S59): precio y duración POR TALLA de una oferta. El server de cobro LEE de acá y congela snapshot en la cita — cero precio calculado en cliente. 3 tallas obligatorias si la oferta grooming está activa (constraint triggers diferidos).';

-- RLS espejo de prestador_servicios (relevada): dueño ALL + lectura
-- pública de ofertas activas de prestadores activos.
ALTER TABLE prestador_servicio_tallas ENABLE ROW LEVEL SECURITY;
CREATE POLICY pst_own ON prestador_servicio_tallas
  FOR ALL TO authenticated
  USING (
    prestador_servicio_id IN (
      SELECT ps.id FROM prestador_servicios ps
      JOIN prestadores pr ON pr.id = ps.prestador_id
      WHERE pr.user_id = auth.uid()
    ) OR is_admin()
  )
  WITH CHECK (
    prestador_servicio_id IN (
      SELECT ps.id FROM prestador_servicios ps
      JOIN prestadores pr ON pr.id = ps.prestador_id
      WHERE pr.user_id = auth.uid()
    ) OR is_admin()
  );
CREATE POLICY pst_public ON prestador_servicio_tallas
  FOR SELECT TO authenticated
  USING (
    prestador_servicio_id IN (
      SELECT ps.id FROM prestador_servicios ps
      JOIN prestadores pr ON pr.id = ps.prestador_id
      WHERE ps.activo AND pr.estado = 'activo'
    )
  );

-- §2: UN extra fijo por pelaje largo, DEL GROOMER (no por servicio —
-- "6 precios + UN extra"). NULL honesto = sin extra declarado.
ALTER TABLE prestadores
  ADD COLUMN grooming_extra_pelaje_largo numeric(14,2)
  CHECK (grooming_extra_pelaje_largo IS NULL OR grooming_extra_pelaje_largo >= 0);
COMMENT ON COLUMN prestadores.grooming_extra_pelaje_largo IS
  'MODELO_GROOMING §2 (S59): UN extra fijo que suma al precio por talla cuando la mascota tiene pelaje largo — solo plata, la silla no se estira. NULL = sin extra.';

-- La regla "3 tallas si la oferta grooming está ACTIVA": constraint
-- triggers DIFERIDOS (el wizard inserta oferta + tallas en una tx y
-- se valida al COMMIT).
CREATE FUNCTION public._trg_grooming_tallas_completas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $trg$
DECLARE
  v_ps record;
  v_n int;
  v_ps_id uuid;
BEGIN
  -- disparado desde prestador_servicios (NEW) o desde la tabla de
  -- tallas (NEW/OLD según operación)
  IF TG_TABLE_NAME = 'prestador_servicios' THEN
    v_ps_id := NEW.id;
  ELSE
    v_ps_id := COALESCE(NEW.prestador_servicio_id, OLD.prestador_servicio_id);
  END IF;

  SELECT ps.id, ps.tipo_servicio, ps.activo INTO v_ps
  FROM prestador_servicios ps WHERE ps.id = v_ps_id;

  IF v_ps.id IS NULL OR NOT v_ps.activo
     OR v_ps.tipo_servicio NOT IN ('grooming', 'grooming_completo') THEN
    RETURN NULL;  -- solo rige para ofertas grooming ACTIVAS
  END IF;

  SELECT count(*) INTO v_n FROM prestador_servicio_tallas WHERE prestador_servicio_id = v_ps.id;
  IF v_n <> 3 THEN
    RAISE EXCEPTION 'oferta_grooming_tallas_incompletas: la oferta activa % tiene % tallas (requiere S, M y L)', v_ps.id, v_n
      USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$trg$;
REVOKE EXECUTE ON FUNCTION public._trg_grooming_tallas_completas() FROM PUBLIC, anon;

CREATE CONSTRAINT TRIGGER trg_ps_grooming_tallas
  AFTER INSERT OR UPDATE OF activo, tipo_servicio ON prestador_servicios
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION _trg_grooming_tallas_completas();

CREATE CONSTRAINT TRIGGER trg_pst_grooming_tallas
  AFTER INSERT OR UPDATE OR DELETE ON prestador_servicio_tallas
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION _trg_grooming_tallas_completas();

-- BACKFILL de la única oferta grooming viva (seed demo a6099987, $15
-- 60'): 3 tallas al precio/duración flat actuales — derivación
-- declarada con marca DEMO en metadata; el groomer real la pisa desde
-- su wizard. Sin esto, la oferta activa violaría el invariante nuevo.
INSERT INTO prestador_servicio_tallas (prestador_servicio_id, talla, precio, duracion_minutos, metadata)
SELECT ps.id, t.talla, ps.precio, ps.duracion_minutos,
       jsonb_build_object('demo', true, 'backfill', 'migracion_s59a3_flat')
FROM prestador_servicios ps
CROSS JOIN (VALUES ('S'),('M'),('L')) AS t(talla)
WHERE ps.tipo_servicio IN ('grooming','grooming_completo');

-- ── (e) PERFIL §3: talla y pelaje de la mascota ──────────────────────
ALTER TABLE mascotas
  ADD COLUMN talla text CHECK (talla IS NULL OR talla IN ('S','M','L')),
  ADD COLUMN pelaje text CHECK (pelaje IS NULL OR pelaje IN ('normal','largo'));
COMMENT ON COLUMN mascotas.talla IS
  'MODELO_GROOMING §3 (S59): declarada por el dueño, editable siempre (RLS mascotas_update_codueño); NULL honesto hasta declarar. El catálogo de razas (D-379) la pre-llenará como sugerencia.';
COMMENT ON COLUMN mascotas.pelaje IS
  'MODELO_GROOMING §3 (S59): normal/largo — largo suma el extra fijo del groomer (§2). NULL honesto hasta declarar.';

-- ── (f) DISCREPANCIA §2: registro talla-hallada-vs-declarada ─────────
CREATE TABLE grooming_talla_discrepancias (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mascota_id      uuid NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
  cita_id         uuid NOT NULL REFERENCES evento_cita_servicio(id),
  prestador_id    uuid REFERENCES prestadores(id),
  talla_declarada text CHECK (talla_declarada IS NULL OR talla_declarada IN ('S','M','L')),
  talla_observada text NOT NULL CHECK (talla_observada IN ('S','M','L')),
  country_code    text NOT NULL DEFAULT 'EC',
  created_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE grooming_talla_discrepancias IS
  'MODELO_GROOMING §2 (S59): la discrepancia hallada en el Antes NO recotiza la cita — se registra acá (patrón P19) y el perfil se corrige. Insumo para detectar perfiles sistemáticamente mal declarados.';

ALTER TABLE grooming_talla_discrepancias ENABLE ROW LEVEL SECURITY;
CREATE POLICY gtd_select ON grooming_talla_discrepancias
  FOR SELECT TO authenticated
  USING (is_admin() OR user_tiene_acceso_a_mascota(mascota_id) OR user_puede_acceder_prestador(prestador_id));
-- escritura: SOLO vía la RPC (DEFINER) — sin policy de INSERT/UPDATE/DELETE.

CREATE FUNCTION public.registrar_discrepancia_talla_grooming(p_cita_id uuid, p_talla_observada text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_cita record;
  v_declarada text;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_talla_observada IS NULL OR p_talla_observada NOT IN ('S','M','L') THEN
    RAISE EXCEPTION 'talla_invalida' USING ERRCODE = '22023';
  END IF;

  SELECT c.id, c.mascota_id, c.prestador_id, c.tipo_servicio, c.country_code INTO v_cita
  FROM evento_cita_servicio c WHERE c.id = p_cita_id;
  IF v_cita.id IS NULL THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  -- la registra el GROOMER de esa cita, en el Antes
  IF NOT user_puede_acceder_prestador(v_cita.prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_cita.tipo_servicio AND ts.categoria = 'grooming'
  ) THEN
    RAISE EXCEPTION 'cita_no_es_grooming' USING ERRCODE = '22023';
  END IF;

  SELECT m.talla INTO v_declarada FROM mascotas m WHERE m.id = v_cita.mascota_id;
  IF v_declarada IS NOT DISTINCT FROM p_talla_observada THEN
    RAISE EXCEPTION 'talla_sin_discrepancia' USING ERRCODE = '22023';
  END IF;

  INSERT INTO grooming_talla_discrepancias
    (mascota_id, cita_id, prestador_id, talla_declarada, talla_observada, country_code)
  VALUES
    (v_cita.mascota_id, p_cita_id, v_cita.prestador_id, v_declarada, p_talla_observada,
     COALESCE(v_cita.country_code, 'EC'));

  -- §2: el perfil SE CORRIGE (esa cita no se recotiza — el snapshot
  -- congelado manda; las próximas cotizan con la talla real).
  UPDATE mascotas SET talla = p_talla_observada, updated_at = now()
  WHERE id = v_cita.mascota_id;

  RETURN jsonb_build_object('ok', true, 'mascota_id', v_cita.mascota_id,
    'talla_declarada', v_declarada, 'talla_observada', p_talla_observada);
END;
$function$;

-- L-140: toda función nueva nace con EXECUTE para anon — se mata.
REVOKE EXECUTE ON FUNCTION public.registrar_discrepancia_talla_grooming(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_discrepancia_talla_grooming(uuid, text) TO authenticated;
