-- S82-A r7 · DÍAS CERRADOS DEL PRESTADOR — el motor no los tenía y
-- BLOQUEA RESERVAS (las dos pistas lo midieron; C ya tiene la prop
-- esperando el lector).
--
-- EL HUECO EXACTO, medido: `prestador_horarios` tiene `dia_semana` (los
-- datos vivos ocupan 0..4) y `prestador_bloqueos` existe con UNA lectora
-- (`_prestador_bloqueado`) y CERO filas — pero son RANGOS DE FECHA:
-- vacaciones, no recurrencia semanal. Hoy "el negocio cierra los
-- domingos" y "el negocio todavía no configuró el domingo" producen
-- EXACTAMENTE lo mismo: cero franjas. **El motor no puede distinguir la
-- decisión de la omisión**, y por eso la pantalla no puede decir
-- "cerrado" sin mentir (diría lo mismo del día no configurado).
--
-- LA CURA es una DECLARACIÓN explícita, no una inferencia: si el negocio
-- dice "cierro los domingos", el domingo se apaga CON VOZ; si no dijo
-- nada, el día sigue siendo "sin horarios" (otro estado, otra voz).
--
-- ALCANCE DECLARADO (lo que esta migración NO hace): las puertas de
-- reserva NO se tocan todavía. El día cerrado no tiene franjas, así que
-- el motor de disponibilidad ya devuelve vacío por construcción — no hay
-- fuga que cerrar. Lo que faltaba era el LECTOR para que la superficie
-- lo DIGA; cablearlo como guard duro en las puertas (por si algún día
-- una franja sobrevive a un cierre declarado) es tanda propia, con su
-- discriminador. Se declara para que nadie lo lea como cerrado.
--
-- 76(g): NO RIGE — DDL nuevo, tabla que nace vacía, cero backfill.
-- REVERSA escrita ANTES: docs/relevamientos/2026-07-30-s82a-r7-REVERSA-dias-cerrados.sql

CREATE TABLE public.prestador_dias_cerrados (
  prestador_id uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  /** 0..6 — MISMA convención que prestador_horarios.dia_semana (leída
   *  del literal de esa tabla: sus datos vivos ocupan 0..4). */
  dia_semana smallint NOT NULL,
  /** Voz opcional del negocio ("descanso del equipo"). NULL = sin motivo;
   *  la pantalla dice "cerrado" y nada más — jamás inventa el porqué. */
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (prestador_id, dia_semana),
  CONSTRAINT chk_dia_semana_rango CHECK (dia_semana >= 0 AND dia_semana <= 6)
);

CREATE TRIGGER trg_dias_cerrados_updated_at
  BEFORE UPDATE ON public.prestador_dias_cerrados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.prestador_dias_cerrados ENABLE ROW LEVEL SECURITY;

-- LECTURA PÚBLICA a authenticated: la familia TIENE que poder ver que el
-- negocio cierra los domingos ANTES de intentar reservar (principio de
-- la puerta, Ley 23: no se ofrece lo que va a rechazar).
CREATE POLICY dias_cerrados_select ON public.prestador_dias_cerrados
  FOR SELECT TO authenticated USING (true);

-- ESCRITURA: solo el negocio sobre lo suyo (el helper de la casa, jamás
-- una regla nueva).
CREATE POLICY dias_cerrados_write ON public.prestador_dias_cerrados
  FOR ALL TO authenticated
  USING (user_puede_acceder_prestador(prestador_id))
  WITH CHECK (user_puede_acceder_prestador(prestador_id));

REVOKE ALL ON public.prestador_dias_cerrados FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prestador_dias_cerrados TO authenticated;

-- ── EL LECTOR que C está esperando ──
CREATE OR REPLACE FUNCTION public.obtener_dias_cerrados(p_prestador_id uuid)
RETURNS TABLE (dia_semana smallint, motivo text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT d.dia_semana, d.motivo
    FROM prestador_dias_cerrados d
   WHERE d.prestador_id = p_prestador_id
   ORDER BY d.dia_semana;
$function$;

-- ── LA PUERTA del negocio (declarar / levantar el cierre) ──
CREATE OR REPLACE FUNCTION public.declarar_dia_cerrado(
  p_prestador_id uuid,
  p_dia_semana integer,
  p_cerrado boolean,
  p_motivo text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_puede_acceder_prestador(p_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;
  IF p_dia_semana IS NULL OR p_dia_semana < 0 OR p_dia_semana > 6 THEN
    RAISE EXCEPTION 'dia_invalido' USING ERRCODE = '22023';
  END IF;

  IF p_cerrado THEN
    INSERT INTO prestador_dias_cerrados (prestador_id, dia_semana, motivo)
    VALUES (p_prestador_id, p_dia_semana::smallint, p_motivo)
    ON CONFLICT (prestador_id, dia_semana)
      DO UPDATE SET motivo = EXCLUDED.motivo, updated_at = now();
  ELSE
    DELETE FROM prestador_dias_cerrados
     WHERE prestador_id = p_prestador_id AND dia_semana = p_dia_semana::smallint;
  END IF;

  RETURN jsonb_build_object('ok', true, 'prestador_id', p_prestador_id, 'dia_semana', p_dia_semana, 'cerrado', p_cerrado);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.declarar_dia_cerrado(uuid, integer, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.declarar_dia_cerrado(uuid, integer, boolean, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.obtener_dias_cerrados(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_dias_cerrados(uuid) TO authenticated;

-- ── VERIFICACIÓN: LOS ROJOS PRODUCIDOS (L-192) ──
DO $verif$
DECLARE
  v_ok boolean;
  v_p uuid;
BEGIN
  SELECT id INTO v_p FROM prestadores LIMIT 1;
  IF v_p IS NULL THEN RAISE EXCEPTION 'sin prestador para producir rojos'; END IF;

  -- 1 · ROJO: día fuera de 0..6 rebota en el CHECK de tabla
  v_ok := false;
  BEGIN
    INSERT INTO prestador_dias_cerrados (prestador_id, dia_semana) VALUES (v_p, 7);
    RAISE EXCEPTION 'EL CHECK NO REBOTO dia_semana=7';
  EXCEPTION WHEN check_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'guard de rango sin rojo'; END IF;

  -- 2 · ROJO: la puerta sin sesión rebota 42501
  v_ok := false;
  BEGIN
    PERFORM declarar_dia_cerrado(v_p, 0, true, NULL);
    RAISE EXCEPTION 'la puerta dejo pasar sin auth';
  EXCEPTION WHEN insufficient_privilege THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'gate de auth sin rojo'; END IF;

  -- 3 · la tabla nace VACÍA (nada se inventa: ningún negocio declaró aún)
  IF (SELECT count(*) FROM prestador_dias_cerrados) <> 0 THEN
    RAISE EXCEPTION 'la tabla no nació vacía';
  END IF;

  -- 4 · L-140
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname IN ('declarar_dia_cerrado','obtener_dias_cerrados') AND proacl::text LIKE '%anon=%') THEN
    RAISE EXCEPTION 'L-140: anon con EXECUTE en el motor de días cerrados';
  END IF;

  RAISE NOTICE 'días cerrados: rojos rango/auth PRODUCIDOS · tabla vacía · proacl sin anon';
END;
$verif$;
