-- ═════════════════════════════════════════════════════════════════════
-- S68-A10 — guard de PISO de duración para las ofertas médicas
-- La UI clampeará (B9), pero la DB manda — espejo del principio de
-- chk_paseo_duracion_menu; nace como TRIGGER porque la regla cruza el
-- catálogo (es_medico vive en tipos_servicio — un CHECK no joinea).
-- Regla: duracion_minutos % 5 = 0 AND BETWEEN 10 AND 240. NULL también
-- rebota para tipos médicos (una oferta médica sin duración no puede
-- servir agenda — declarado). Error tipado: duracion_invalida (23514,
-- espejo del guard §14.2).
--
-- 76(g) — declaración de veda: ADITIVA PURA (función + trigger nuevos);
-- sin backfill, sin ancla sobre datos vivos — la veda NO rige. CERO
-- lectores tocados → sin byte-check. Probatorio previo relevado: cero
-- ofertas médicas vivas fuera del piso (el guard no vara filas).
-- No toca catálogo → ley S67 no aplica (declarado).
-- ═════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._trg_ps_duracion_vet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
BEGIN
  IF EXISTS (
       SELECT 1 FROM tipos_servicio ts
       WHERE ts.codigo = NEW.tipo_servicio AND ts.es_medico
     )
     AND (NEW.duracion_minutos IS NULL
          OR NEW.duracion_minutos % 5 <> 0
          OR NEW.duracion_minutos NOT BETWEEN 10 AND 240)
  THEN
    RAISE EXCEPTION 'duracion_invalida' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_ps_duracion_vet ON public.prestador_servicios;
CREATE TRIGGER trg_ps_duracion_vet
  BEFORE INSERT OR UPDATE OF duracion_minutos, tipo_servicio
  ON public.prestador_servicios
  FOR EACH ROW
  EXECUTE FUNCTION public._trg_ps_duracion_vet();

-- L-140 de nacimiento: función de trigger — nadie la ejecuta directo.
REVOKE ALL ON FUNCTION public._trg_ps_duracion_vet() FROM PUBLIC, anon, authenticated;

-- Sonda probatoria L-140
DO $do$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.proname, p.proacl
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = '_trg_ps_duracion_vet'
  LOOP
    RAISE NOTICE 'S68-A10 L-140 proacl %: %', r.proname, r.proacl;
    IF r.proacl::text LIKE '%anon=%' THEN
      RAISE EXCEPTION 'S68-A10 abort L-140: anon con EXECUTE en %', r.proname;
    END IF;
  END LOOP;
  RAISE NOTICE 'S68-A10 L-140: el guard nace sin anon';
END;
$do$;

-- Probatorio de no-varado: cero ofertas médicas vivas fuera del piso.
DO $do$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n
  FROM prestador_servicios ps
  JOIN tipos_servicio ts ON ts.codigo = ps.tipo_servicio
  WHERE ts.es_medico
    AND (ps.duracion_minutos IS NULL
         OR ps.duracion_minutos % 5 <> 0
         OR ps.duracion_minutos NOT BETWEEN 10 AND 240);
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'S68-A10 abort: % ofertas médicas vivas fuera del piso — backfill antes del guard', v_n;
  END IF;
  RAISE NOTICE 'S68-A10: cero ofertas médicas fuera del piso — el guard no vara filas';
END;
$do$;

NOTIFY pgrst, 'reload schema';
