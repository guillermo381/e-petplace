-- S82-A r4 · MOTOR DE DESPARASITACIÓN (mandato: molde de vacunas, cero
-- modelo paralelo). Es el SEGUNDO tipo fecha-sola del expediente — el
-- disparo de D-312 SUENA con esta migración (la precisión fecha-sola
-- viaja por la puerta única: timeline.ts agrega el tipo en esta tanda).
--
-- CLONADO DEL LITERAL (regla 40, pg_get_functiondef de
-- _trg_vacuna_crear_evento + policies de evento_vacuna_aplicada):
-- tabla tipada + trigger que crea el padre por _crear_evento_padre_auto
-- (eje 'salud'; procedencia declarado_por_prestador solo con
-- prestador_id — S69) + RLS espejo. HALLAZGO DECLARADO, no curado: la
-- policy INSERT del molde gatea por mascotas.user_id LEGACY (clase
-- D-485) — la puerta DEFINER de abajo cubre a la familia REAL por
-- user_es_familiar_adulto_de_mascota, que es el camino del producto.
--
-- 76(g): NO RIGE — DDL aditivo, sin backfill.
-- REVERSA escrita ANTES: docs/relevamientos/2026-07-30-s82a-REVERSA-desparasitacion.sql

CREATE TABLE public.evento_desparasitacion_aplicada (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid UNIQUE REFERENCES public.eventos_mascota(id) ON DELETE SET NULL,
  mascota_id uuid NOT NULL REFERENCES public.mascotas(id),
  prestador_id uuid REFERENCES public.prestadores(id),
  empleado_id uuid,
  country_code text,
  producto text NOT NULL CONSTRAINT chk_desparasitacion_producto CHECK (length(trim(producto)) > 0),
  -- vocabulario CERRADO chico + NULL honesto (el carnet real no siempre lo dice)
  tipo_desparasitacion text CONSTRAINT chk_desparasitacion_tipo
    CHECK (tipo_desparasitacion IS NULL OR tipo_desparasitacion IN ('interna', 'externa', 'mixta')),
  fecha_aplicada date,
  fecha_proxima date,
  CONSTRAINT chk_desparasitacion_orden_fechas
    CHECK (fecha_proxima IS NULL OR fecha_aplicada IS NULL OR fecha_proxima >= fecha_aplicada),
  lote text,
  notas text,
  archivo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_desparasitacion_mascota ON public.evento_desparasitacion_aplicada (mascota_id, fecha_aplicada DESC);

-- ── EL CATÁLOGO (hallazgo del rojo crudo: _crear_evento_padre_auto
--    consulta cat_tipos_evento.es_clinico — sin la fila, la procedencia
--    nace NULL). Clon de la fila de vacuna_aplicada (leída del literal);
--    propaga_a_perfil=false HONESTO: no hay campo de snapshot que
--    propagar (la vacuna sí propaga; la desparasitación se lee de su
--    tipada). Regla S67: tocar el catálogo exige coherencia en 0 (abajo).
INSERT INTO public.cat_tipos_evento
  (codigo, nombre, descripcion, eje_jtbd, es_clinico, es_mvp, activo,
   propaga_a_perfil, puede_ser_raiz, puede_ser_subevento, tipos_padre_validos, tabla_tipada)
VALUES
  ('desparasitacion_aplicada', 'Desparasitación aplicada',
   'Aplicación de desparasitante a la mascota', 'salud', true, true, true,
   false, true, true, ARRAY['cita_servicio'], 'evento_desparasitacion_aplicada');

-- ── el trigger del padre — clon del literal de _trg_vacuna_crear_evento ──
CREATE OR REPLACE FUNCTION public._trg_desparasitacion_crear_evento()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.evento_id IS NULL THEN
    NEW.evento_id := _crear_evento_padre_auto(
      NEW.mascota_id, 'desparasitacion_aplicada', 'salud',
      COALESCE(NEW.fecha_aplicada::timestamptz, now()),
      NEW.prestador_id, NEW.empleado_id,
      auth.uid(), CASE WHEN auth.uid() IS NULL THEN 'sistema' ELSE NULL END,
      NEW.country_code,
      jsonb_build_object('producto', NEW.producto, 'tipo_desparasitacion', NEW.tipo_desparasitacion),
      CASE WHEN NEW.prestador_id IS NOT NULL THEN 'declarado_por_prestador' ELSE 'declarado_por_familia' END
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- L-140: la fn de trigger nace con EXECUTE para anon — se revoca YA
REVOKE EXECUTE ON FUNCTION public._trg_desparasitacion_crear_evento() FROM PUBLIC, anon;

CREATE TRIGGER trg_desparasitacion_crear_evento
  BEFORE INSERT ON public.evento_desparasitacion_aplicada
  FOR EACH ROW EXECUTE FUNCTION public._trg_desparasitacion_crear_evento();

CREATE TRIGGER trg_evento_desparasitacion_updated_at
  BEFORE UPDATE ON public.evento_desparasitacion_aplicada
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── RLS espejo de evento_vacuna_aplicada (policies leídas del literal) ──
ALTER TABLE public.evento_desparasitacion_aplicada ENABLE ROW LEVEL SECURITY;

CREATE POLICY desparasitacion_select ON public.evento_desparasitacion_aplicada
  FOR SELECT TO authenticated
  USING (user_acceso_clinico_a_mascota(mascota_id));

CREATE POLICY desparasitacion_insert ON public.evento_desparasitacion_aplicada
  FOR INSERT TO authenticated
  WITH CHECK (
    (mascota_id IN (SELECT id FROM mascotas WHERE user_id = auth.uid()))
    OR user_puede_escribir_clinico(prestador_id, mascota_id)
  );

CREATE POLICY desparasitacion_update ON public.evento_desparasitacion_aplicada
  FOR UPDATE TO authenticated
  USING (user_puede_escribir_clinico(prestador_id, mascota_id))
  WITH CHECK (user_puede_escribir_clinico(prestador_id, mascota_id));

CREATE POLICY desparasitacion_delete_admin ON public.evento_desparasitacion_aplicada
  FOR DELETE TO authenticated
  USING (is_admin());

REVOKE ALL ON public.evento_desparasitacion_aplicada FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evento_desparasitacion_aplicada TO authenticated;

-- ── LA PUERTA de la familia (molde P19 — la RLS del molde gatea por
--    user_id legacy; la familia REAL entra por acá) ──
CREATE OR REPLACE FUNCTION public.registrar_desparasitacion(
  p_mascota_id uuid,
  p_producto text,
  p_tipo text DEFAULT NULL,
  p_fecha_aplicada date DEFAULT NULL,
  p_fecha_proxima date DEFAULT NULL,
  p_notas text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_id uuid;
  v_country text;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_es_familiar_adulto_de_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF p_producto IS NULL OR length(trim(p_producto)) = 0 THEN
    RAISE EXCEPTION 'producto_requerido' USING ERRCODE = '22023';
  END IF;
  IF p_tipo IS NOT NULL AND p_tipo NOT IN ('interna', 'externa', 'mixta') THEN
    RAISE EXCEPTION 'tipo_invalido' USING ERRCODE = '22023';
  END IF;
  -- lo declarado por familia es un hecho PASADO: la aplicación no es futura
  IF p_fecha_aplicada IS NOT NULL AND p_fecha_aplicada > CURRENT_DATE THEN
    RAISE EXCEPTION 'fecha_futura' USING ERRCODE = '22023';
  END IF;
  IF p_fecha_proxima IS NOT NULL AND p_fecha_aplicada IS NOT NULL AND p_fecha_proxima < p_fecha_aplicada THEN
    RAISE EXCEPTION 'orden_fechas_invalido' USING ERRCODE = '22023';
  END IF;

  -- eventos_mascota.country_code es NOT NULL (hallazgo del rojo crudo):
  -- el país del evento es el de la MASCOTA, derivado — jamás pedido.
  SELECT country_code INTO v_country FROM mascotas WHERE id = p_mascota_id;

  INSERT INTO evento_desparasitacion_aplicada (mascota_id, country_code, producto, tipo_desparasitacion, fecha_aplicada, fecha_proxima, notas)
  VALUES (p_mascota_id, v_country, trim(p_producto), p_tipo, p_fecha_aplicada, p_fecha_proxima, p_notas)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id, 'mascota_id', p_mascota_id);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.registrar_desparasitacion(uuid, text, text, date, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_desparasitacion(uuid, text, text, date, date, text) TO authenticated;

-- ── Verificación imperativa: LOS ROJOS PRODUCIDOS (L-192) ──
DO $verif$
DECLARE
  v_ok boolean;
  v_id uuid;
  v_country text;
BEGIN
  SELECT id, country_code INTO v_id, v_country FROM mascotas LIMIT 1;
  IF v_id IS NULL THEN RAISE EXCEPTION 'sin mascota para producir rojos'; END IF;

  -- 0 · REGLA S67: el catálogo tocado exige coherencia tipada en 0
  IF (SELECT count(*) FROM verificar_coherencia_tablas_tipadas()) > 0 THEN
    RAISE EXCEPTION 'catalogo incoherente tras sembrar desparasitacion_aplicada';
  END IF;

  -- 1 · producto vacío rebota en el CHECK de tabla
  v_ok := false;
  BEGIN
    INSERT INTO evento_desparasitacion_aplicada (mascota_id, country_code, producto) VALUES (v_id, v_country, '   ');
    RAISE EXCEPTION 'EL CHECK NO REBOTO producto vacio';
  EXCEPTION WHEN check_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'guard de producto sin rojo'; END IF;

  -- 2 · orden de fechas rebota
  v_ok := false;
  BEGIN
    INSERT INTO evento_desparasitacion_aplicada (mascota_id, country_code, producto, fecha_aplicada, fecha_proxima)
    VALUES (v_id, v_country, 'X', '2026-07-01', '2026-06-01');
    RAISE EXCEPTION 'EL CHECK NO REBOTO fechas invertidas';
  EXCEPTION WHEN check_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'guard de orden de fechas sin rojo'; END IF;

  -- 3 · tipo fuera del vocabulario rebota
  v_ok := false;
  BEGIN
    INSERT INTO evento_desparasitacion_aplicada (mascota_id, country_code, producto, tipo_desparasitacion) VALUES (v_id, v_country, 'X', 'oral');
    RAISE EXCEPTION 'EL CHECK NO REBOTO tipo invalido';
  EXCEPTION WHEN check_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'guard de tipo sin rojo'; END IF;

  -- 4 · la puerta sin sesión rebota 42501
  v_ok := false;
  BEGIN
    PERFORM registrar_desparasitacion(v_id, 'Drontal');
    RAISE EXCEPTION 'la puerta dejo pasar sin auth';
  EXCEPTION WHEN insufficient_privilege THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'gate de auth sin rojo'; END IF;

  -- 5 · L-140: proacl sin anon (trigger fn + puerta)
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname IN ('registrar_desparasitacion', '_trg_desparasitacion_crear_evento')
      AND proacl::text LIKE '%anon=%'
  ) THEN
    RAISE EXCEPTION 'L-140: anon con EXECUTE en el motor de desparasitacion';
  END IF;

  RAISE NOTICE 'desparasitacion: rojos producto/fechas/tipo/auth PRODUCIDOS · proacl sin anon';
END;
$verif$;
