-- S82-A r7 · CURA DE DATO: el prefijo "[DEMO Sxx]" se está VIENDO en la
-- UI (reporte founder — llega a `titulo_fuente`, que sale de
-- `prestadores.nombre_comercial` / `cuentas_comerciales.nombre_comercial`
-- vía timeline.ts:141 y :470, y lo pinta el detalle del paseo).
--
-- SEIS FILAS MEDIDAS antes de tocar (3 prestadores + 3 cuentas):
--   [DEMO S44] Paseos Andres · [DEMO S68] Clínica Aurora · [DEMO S58] Wizard
--
-- POR QUÉ SE PUEDE BORRAR SIN PERDER LA MARCA (auditoría, no supuesto):
-- la marca de "esto es semilla" NO vive en el nombre — `prestadores` no
-- tiene columna de seed, pero **los ids son reconocibles por
-- construcción** (`de300000-…`, `de580000-…`, `de680000-…`: el prefijo
-- `de` + la sesión que los sembró), y los catálogos que sí llevan la
-- marca formal la tienen en `es_seed_preliminar`. El prefijo en el
-- nombre era contaminación de UI: un dato de mesa viajando a la cara del
-- dueño.
--
-- 76(g) **RIGE** — es backfill sobre dato vivo. Anclas: 6 filas
-- esperadas, verificadas abajo; la reversa trae los SEIS literales (es
-- su única fuente).
-- REVERSA escrita ANTES: docs/relevamientos/2026-07-30-s82a-r7-REVERSA-prefijo-demo.sql

-- El corte es del PREFIJO exacto `[DEMO Sxx] `, jamás un trim ciego: un
-- nombre real que contenga corchetes queda intacto.
UPDATE public.prestadores
   SET nombre_comercial = regexp_replace(nombre_comercial, '^\[DEMO S[0-9]+\]\s*', '')
 WHERE nombre_comercial ~ '^\[DEMO S[0-9]+\]';

UPDATE public.cuentas_comerciales
   SET nombre_comercial = regexp_replace(nombre_comercial, '^\[DEMO S[0-9]+\]\s*', '')
 WHERE nombre_comercial ~ '^\[DEMO S[0-9]+\]';

-- ── VERIFICACIÓN 76(g): las anclas, y el rojo de la NO-contaminación ──
DO $verif$
DECLARE
  v_quedan integer;
  v_curados integer;
BEGIN
  SELECT (SELECT count(*) FROM prestadores WHERE nombre_comercial ~ '^\[DEMO')
       + (SELECT count(*) FROM cuentas_comerciales WHERE nombre_comercial ~ '^\[DEMO') INTO v_quedan;
  IF v_quedan <> 0 THEN
    RAISE EXCEPTION 'quedan % nombres con prefijo DEMO', v_quedan;
  END IF;

  -- las 6 filas medidas siguen existiendo CON su nombre limpio (el
  -- backfill limpió, no borró — el ancla es que el negocio sigue ahí)
  SELECT count(*) INTO v_curados FROM prestadores
   WHERE id IN ('de300000-0000-4000-8000-0000000000e5',
                'de680000-0000-4000-8000-0000000000e5',
                'de580000-0000-4000-8000-0000000000b1')
     AND nombre_comercial IN ('Paseos Andres', 'Clínica Aurora', 'Wizard');
  IF v_curados <> 3 THEN
    RAISE EXCEPTION '76(g): ancla rota — % de 3 prestadores con nombre limpio esperado', v_curados;
  END IF;

  SELECT count(*) INTO v_curados FROM cuentas_comerciales
   WHERE id IN ('de300000-0000-4000-8000-0000000000cc',
                'de580000-0000-4000-8000-00000000c0c1',
                'de680000-0000-4000-8000-0000000000cc')
     AND nombre_comercial IN ('Paseos Andres', 'Clínica Aurora', 'Wizard');
  IF v_curados <> 3 THEN
    RAISE EXCEPTION '76(g): ancla rota — % de 3 cuentas con nombre limpio esperado', v_curados;
  END IF;

  RAISE NOTICE 'prefijo DEMO: 6/6 curados · 0 contaminados restantes · los negocios siguen vivos';
END;
$verif$;
