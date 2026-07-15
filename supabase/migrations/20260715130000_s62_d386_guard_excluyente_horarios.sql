-- ═══════════════════════════════════════════════════════════════════
-- S62 · D-386 — EL GUARD EXCLUYENTE DE HORARIOS
--
-- Letra founder (S60, firmada): el prestador con varios oficios ELIGE —
-- horarios POR SERVICIO o franjas UNIVERSALES para todo; jamás
-- mezclados. Cláusula del arquitecto: la OCUPACIÓN del motor sigue
-- GLOBAL por prestador (las franjas declaradas se independizan, el
-- cuerpo no) — esta migración NO toca _agenda_ocupacion ni ningún
-- lector.
--
-- Diseño (relevamiento S62 contra DB viva): NUEVE funciones del motor
-- portan el filtro aditivo inline `(servicio_id IS NULL OR servicio_id
-- = <oferta>)`. La cirugía NO reescribe los nueve bodies: hace la
-- mezcla IMPOSIBLE en la fuente (guard por trigger sobre
-- prestador_horarios — las franjas se escriben directo por RLS, el
-- trigger muerde todos los caminos). Bajo el invariante "un prestador
-- solo tiene franjas de SU modo", el filtro aditivo devuelve
-- EXACTAMENTE las franjas que rigen según la elección: universal →
-- solo existen NULL; por_servicio → solo existen específicas. Los
-- lectores respetan la elección POR INVARIANTE, probado por asserts.
--
-- Piezas:
--   1. prestadores.modo_horarios ('universal' | 'por_servicio',
--      default universal — la verdad de hoy: cero filas específicas).
--   2. Trigger _horarios_respetan_modo: la franja que contradice el
--      modo REBOTA tipada.
--   3. Trigger _modo_horarios_sin_franjas_ajenas: cambiar de modo con
--      franjas del modo viejo REBOTA tipado (primero se limpian).
--   4. RPC elegir_modo_horarios(p_modo): el camino de escritura de la
--      elección para la UI (errores tipados; el trigger 3 es la red).
--   5. UNIQUE pasa a NULLS NOT DISTINCT: la franja general duplicada
--      exacta por fin rebota en DB (la anti-duplicación vivía solo en
--      el wrapper — hallazgo S61).
-- ═══════════════════════════════════════════════════════════════════

-- 1 ▸ la columna de la ELECCIÓN
ALTER TABLE public.prestadores
  ADD COLUMN modo_horarios text NOT NULL DEFAULT 'universal'
  CONSTRAINT prestadores_modo_horarios_valido
  CHECK (modo_horarios IN ('universal', 'por_servicio'));

COMMENT ON COLUMN public.prestadores.modo_horarios IS
  'D-386: la elección del prestador — franjas universales (servicio_id NULL) O por servicio (servicio_id NOT NULL); jamás mezcladas. Guard: triggers _horarios_respetan_modo / _modo_horarios_sin_franjas_ajenas.';

-- 2 ▸ el guard EXCLUYENTE sobre las franjas
CREATE OR REPLACE FUNCTION public._horarios_respetan_modo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_modo text;
BEGIN
  SELECT p.modo_horarios INTO v_modo
  FROM public.prestadores p
  WHERE p.id = NEW.prestador_id;

  IF v_modo = 'universal' AND NEW.servicio_id IS NOT NULL THEN
    RAISE EXCEPTION 'franja_especifica_en_modo_universal'
      USING ERRCODE = '23514',
            HINT = 'El prestador eligió horarios universales: la franja no lleva servicio. Cambiar la elección primero (elegir_modo_horarios).';
  END IF;

  IF v_modo = 'por_servicio' AND NEW.servicio_id IS NULL THEN
    RAISE EXCEPTION 'franja_universal_en_modo_por_servicio'
      USING ERRCODE = '23514',
            HINT = 'El prestador eligió horarios por servicio: la franja exige su servicio. Cambiar la elección primero (elegir_modo_horarios).';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public._horarios_respetan_modo() FROM PUBLIC, anon;

CREATE TRIGGER trg_horarios_respetan_modo
  BEFORE INSERT OR UPDATE OF servicio_id, prestador_id
  ON public.prestador_horarios
  FOR EACH ROW
  EXECUTE FUNCTION public._horarios_respetan_modo();

-- 3 ▸ el modo no cambia con franjas del modo viejo vivas
CREATE OR REPLACE FUNCTION public._modo_horarios_sin_franjas_ajenas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.modo_horarios = OLD.modo_horarios THEN
    RETURN NEW;
  END IF;

  IF NEW.modo_horarios = 'universal' AND EXISTS (
    SELECT 1 FROM public.prestador_horarios h
    WHERE h.prestador_id = NEW.id AND h.servicio_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'franjas_del_otro_modo_existen'
      USING ERRCODE = '23514',
            HINT = 'Quedan franjas por servicio: eliminarlas antes de pasar a horarios universales.';
  END IF;

  IF NEW.modo_horarios = 'por_servicio' AND EXISTS (
    SELECT 1 FROM public.prestador_horarios h
    WHERE h.prestador_id = NEW.id AND h.servicio_id IS NULL
  ) THEN
    RAISE EXCEPTION 'franjas_del_otro_modo_existen'
      USING ERRCODE = '23514',
            HINT = 'Quedan franjas universales: eliminarlas antes de pasar a horarios por servicio.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public._modo_horarios_sin_franjas_ajenas() FROM PUBLIC, anon;

CREATE TRIGGER trg_modo_horarios_sin_franjas_ajenas
  BEFORE UPDATE OF modo_horarios
  ON public.prestadores
  FOR EACH ROW
  EXECUTE FUNCTION public._modo_horarios_sin_franjas_ajenas();

-- 4 ▸ el camino de escritura de la elección (para la UI de la B)
CREATE OR REPLACE FUNCTION public.elegir_modo_horarios(p_modo text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_prestador_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  IF p_modo IS NULL OR p_modo NOT IN ('universal', 'por_servicio') THEN
    RAISE EXCEPTION 'modo_invalido' USING ERRCODE = '22023';
  END IF;

  SELECT p.id INTO v_prestador_id
  FROM public.prestadores p
  WHERE p.user_id = auth.uid();

  IF v_prestador_id IS NULL THEN
    RAISE EXCEPTION 'prestador_no_encontrado' USING ERRCODE = 'P0002';
  END IF;

  -- el trigger _modo_horarios_sin_franjas_ajenas es la red: si quedan
  -- franjas del modo viejo, este UPDATE rebota
  -- 'franjas_del_otro_modo_existen' y el error viaja tipado al wrapper.
  UPDATE public.prestadores
  SET modo_horarios = p_modo
  WHERE id = v_prestador_id;

  RETURN p_modo;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.elegir_modo_horarios(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.elegir_modo_horarios(text) TO authenticated, service_role;

-- 5 ▸ la franja general duplicada exacta por fin rebota en DB
--     (UNIQUE clásico: NULLs no colisionan — hallazgo S61; PG17 trae
--     NULLS NOT DISTINCT). La clave GANA empleado_id: el relevamiento
--     S62 contra datos vivos mostró que el prestador legacy 2052f109
--     tiene pares legítimos (franja del prestador con empleado_id NULL
--     + franja de su empleado a la misma hora) que el UNIQUE viejo
--     nunca mordió — son recursos distintos, no duplicados.
ALTER TABLE public.prestador_horarios
  DROP CONSTRAINT prestador_horarios_prestador_id_servicio_id_dia_semana_hora_key;

ALTER TABLE public.prestador_horarios
  ADD CONSTRAINT prestador_horarios_franja_unica
  UNIQUE NULLS NOT DISTINCT (prestador_id, servicio_id, empleado_id, dia_semana, hora_inicio);
