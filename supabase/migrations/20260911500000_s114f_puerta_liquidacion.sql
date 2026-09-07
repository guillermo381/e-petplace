-- ============================================================================
-- S114-F · LA PUERTA DE LA LIQUIDACIÓN
--
-- VEDA 76(g): NO RIGE. DDL puramente aditiva — crea UNA función nueva, no
-- toca ninguna existente, no escribe una sola fila de datos, no hace backfill.
-- Reversa escrita ANTES: docs/relevamientos/S114-F-REVERSA-20260911500000-*.sql
--
-- ── POR QUÉ EXISTE, MEDIDO ─────────────────────────────────────────────────
-- `generar_liquidacion` (MODELO_FINANCIERO §4.3) existe y funciona, pero:
--
--   has_function_privilege('anon','generar_liquidacion(...)','EXECUTE')          = false
--   has_function_privilege('authenticated','generar_liquidacion(...)','EXECUTE') = false
--
-- ⇒ **ninguna superficie web puede llamarla.** Por eso en la historia del
-- producto hay 36 eventos económicos pendientes y **CERO liquidaciones
-- generadas**: no es que nadie quisiera pagar — es que no había puerta.
--
-- ── LO QUE ESTA MIGRACIÓN NO HACE, A PROPÓSITO ─────────────────────────────
-- NO le concede `EXECUTE` a `generar_liquidacion`. *Abrirla directo dejaría a
-- cualquier `authenticated` generando liquidaciones sobre cuentas ajenas: la
-- función es DEFINER y no tiene gate propio* (medido: su cuerpo no menciona
-- `is_admin`). Lo que se abre es **una puerta con gate**, y la de adentro
-- sigue cerrada.
--
-- ── EL GATE ES EL DE LA CASA, NO UNO NUEVO ─────────────────────────────────
-- `is_admin()` — la misma función que gatea las policies `admin_all_*` de
-- `liquidaciones`, `eventos_economicos` y `liquidacion_eventos`. Un gate nuevo
-- sería una segunda definición de «quién es admin», y dos definiciones de lo
-- mismo divergen.
--
-- ── EL HOLDBACK NO SE EXPONE, Y ES DECISIÓN ────────────────────────────────
-- `generar_liquidacion` acepta `p_aplicar_holdback_pct` y `p_dias_holdback`.
-- Esta puerta los fija en 0 / NULL **porque la retención no está firmada en
-- ninguna letra**: `MODELO_FINANCIERO` la modela y no la decide. *Exponer una
-- perilla que nadie decidió es invitar a que alguien elija un número en una
-- pantalla y eso se vuelva política sin firma.* El día que se firme, se
-- ensancha esta función.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_generar_liquidacion(
  p_cuenta_comercial_id uuid,
  p_country_code        text,
  p_periodo_inicio      date,
  p_periodo_fin         date
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_liquidacion_id uuid;
BEGIN
  -- ① EL GATE, ANTES DE CUALQUIER OTRA COSA.
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'no_sos_admin'
      USING HINT = 'Sólo un admin de plataforma puede generar liquidaciones.';
  END IF;

  -- ② Guardas de forma. Rebotan HABLADO, con código tipado que el wrapper lee.
  IF p_periodo_inicio IS NULL OR p_periodo_fin IS NULL THEN
    RAISE EXCEPTION 'periodo_incompleto';
  END IF;

  IF p_periodo_fin < p_periodo_inicio THEN
    RAISE EXCEPTION 'periodo_invertido';
  END IF;

  -- ③ La cuenta tiene que poder cobrar. Generar una liquidación sobre una
  --    cuenta que no está activa produce una transferencia que nadie ejecuta,
  --    y deja los eventos marcados 'liquidado' sin que nadie haya cobrado.
  --    *Ese estado es peor que el error: miente y no avisa.*
  IF NOT EXISTS (
    SELECT 1 FROM public.cuentas_comerciales
    WHERE id = p_cuenta_comercial_id AND estado = 'activa'
  ) THEN
    RAISE EXCEPTION 'cuenta_no_activa';
  END IF;

  -- ④ Sin eventos en el período no se genera nada. `generar_liquidacion`
  --    podría crear una liquidación en 0; acá se corta antes y se DICE, para
  --    que la pantalla no muestre un comprobante vacío como si fuera un pago.
  IF NOT EXISTS (
    SELECT 1 FROM public.eventos_economicos
    WHERE cuenta_comercial_id = p_cuenta_comercial_id
      AND country_code        = p_country_code
      AND estado              = 'pendiente_liquidar'
      AND fecha_devengo::date BETWEEN p_periodo_inicio AND p_periodo_fin
  ) THEN
    RAISE EXCEPTION 'sin_eventos_en_periodo';
  END IF;

  -- ⑤ El motor. No se reimplementa: se llama.
  v_liquidacion_id := public.generar_liquidacion(
    p_cuenta_comercial_id := p_cuenta_comercial_id,
    p_country_code        := p_country_code,
    p_periodo_inicio      := p_periodo_inicio,
    p_periodo_fin         := p_periodo_fin,
    p_generado_por        := auth.uid(),
    p_aplicar_holdback_pct := 0,
    p_dias_holdback        := NULL
  );

  RETURN v_liquidacion_id;
END;
$$;

-- L-140: las funciones nacen con EXECUTE para anon y PUBLIC por default
-- privileges. Se revoca SIEMPRE y se concede sólo a quien debe.
REVOKE ALL ON FUNCTION public.admin_generar_liquidacion(uuid, text, date, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_generar_liquidacion(uuid, text, date, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_generar_liquidacion(uuid, text, date, date) TO authenticated;

COMMENT ON FUNCTION public.admin_generar_liquidacion(uuid, text, date, date) IS
  'S114-F · Puerta con gate is_admin sobre generar_liquidacion (§4.3). '
  'La de adentro sigue sin EXECUTE para authenticated, a propósito. '
  'Holdback fijo en 0: la retención no está firmada en ninguna letra.';

-- ── CINTURÓN: se prueba EN LA MIGRACIÓN, y en las dos direcciones ──────────
DO $cinturon$
DECLARE
  v_anon  boolean;
  v_auth  boolean;
  v_dentro boolean;
BEGIN
  SELECT has_function_privilege('anon',
    'public.admin_generar_liquidacion(uuid,text,date,date)', 'EXECUTE') INTO v_anon;
  SELECT has_function_privilege('authenticated',
    'public.admin_generar_liquidacion(uuid,text,date,date)', 'EXECUTE') INTO v_auth;
  SELECT has_function_privilege('authenticated',
    'public.generar_liquidacion(uuid,text,date,date,uuid,numeric,integer)', 'EXECUTE') INTO v_dentro;

  IF v_anon THEN
    RAISE EXCEPTION 'CINTURON: la puerta quedó ejecutable por anon';
  END IF;
  IF NOT v_auth THEN
    RAISE EXCEPTION 'CINTURON: la puerta NO es ejecutable por authenticated — nadie podría usarla';
  END IF;
  -- El discriminador: si esto pasara a true, la puerta de adentro se abrió y
  -- el gate se puede saltear. Es la única forma de que este cinturón mienta.
  IF v_dentro THEN
    RAISE EXCEPTION 'CINTURON: generar_liquidacion quedó abierta a authenticated — el gate es salteable';
  END IF;

  RAISE NOTICE 'CINTURON OK: anon=% authenticated=% motor_interno_abierto=%', v_anon, v_auth, v_dentro;
END;
$cinturon$;

COMMIT;
