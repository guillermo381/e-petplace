-- ═══════════════════════════════════════════════════════════════════════════
-- S97-A · `registrar_factura_pedido` PISABA EL DEFAULT CON UN NULL EXPLÍCITO
-- (14-ago-2026)
--
-- HALLAZGO: lo encontró la SIEMBRA del pedido de `duenotodo`, llamando la
-- puerta por el camino real con sus parámetros opcionales en NULL.
--
-- EL DEFECTO, medido:
--   · `facturas.estado` es **NOT NULL con DEFAULT 'pendiente'**.
--   · `registrar_factura_pedido(..., p_estado_sri text DEFAULT NULL)` lo
--     escribe **explícitamente** en el INSERT.
--   ⇒ **Un NULL explícito PISA el default.** El default de una columna solo
--     rige cuando la columna se OMITE del INSERT; si alguien la nombra con
--     NULL, el default no participa.
--
-- 🔴 Y EL SÍNTOMA ES EL CARO: el llamador recibe un **23502 crudo de
--    Postgres** —«null value in column "estado" violates not-null»— en vez de
--    un rebote hablado. *Una puerta cuyo parámetro es opcional en la firma y
--    obligatorio en los hechos miente sobre su propio contrato*, y lo hace
--    con un error que no se le puede mostrar a nadie (Ley 13).
--
-- LA CURA: `COALESCE(p_estado_sri, 'pendiente')` — el default vuelve a regir
-- para quien no declara estado, que es el caso normal. **`pendiente` es el
-- valor que la propia columna eligió**; no se inventa uno nuevo.
--
-- Por qué `pendiente` y no `autorizada`: en Ecuador la factura electrónica
-- falla seguido (`MODELO_DESPENSA` §8.6bis: *la factura se REGISTRA, no se
-- emite*). Nacer `autorizada` sin que el SRI lo diga sería afirmar un hecho
-- ajeno — el mismo defecto que la casa lleva cazado todo el mes.
--
-- 76(g): NO RIGE — CREATE OR REPLACE, misma firma, sin backfill, sin anclas.
-- REVERSA escrita ANTES, y avisa que revertir reintroduce el 23502.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DO $mig$
DECLARE v_def text;
BEGIN
  SELECT pg_get_functiondef('public.registrar_factura_pedido(uuid,text,text,text,numeric,text)'::regprocedure)
    INTO v_def;

  -- Se edita el cuerpo VIVO, no una copia de memoria: la migración de origen
  -- podría haber sido enmendada por otra tanda y reescribirla desde cero
  -- perdería esos cambios en silencio.
  IF position('p_estado_sri, p_archivo_url' IN v_def) = 0 THEN
    RAISE EXCEPTION 'ABORTA: el cuerpo vivo no tiene la forma esperada — la cura se escribió contra otra versión';
  END IF;

  v_def := replace(v_def, 'p_estado_sri, p_archivo_url',
                          'COALESCE(p_estado_sri, ''pendiente''), p_archivo_url');
  EXECUTE v_def;
END $mig$;

-- ── CINTURÓN CON DISCRIMINADOR ───────────────────────────────────────────
DO $$
DECLARE v_def text; v_ped uuid; v_r jsonb; v_estado text;
BEGIN
  SET LOCAL ROLE postgres;

  SELECT pg_get_functiondef('public.registrar_factura_pedido(uuid,text,text,text,numeric,text)'::regprocedure) INTO v_def;
  IF position('COALESCE(p_estado_sri' IN v_def) = 0 THEN
    RAISE EXCEPTION 'CINTURON: la cura no quedó en el cuerpo vivo';
  END IF;
  IF position('''pendiente''' IN v_def) = 0 THEN
    RAISE EXCEPTION 'CINTURON: el fallback no es pendiente';
  END IF;

  -- EL DISCRIMINADOR: un pedido `empacado` real, facturado SIN estado.
  -- Antes de la cura esto reventaba 23502; ahora nace 'pendiente'.
  SELECT id INTO v_ped FROM pedidos WHERE estado = 'empacado' LIMIT 1;
  IF v_ped IS NULL THEN
    RAISE NOTICE 'CINTURON: sin pedido empacado — el brazo funcional queda SIN SUJETO y se DICE (no se declara verde por ausencia)';
  ELSE
    v_r := registrar_factura_pedido(v_ped, 'CINTURON-S97-'||substr(gen_random_uuid()::text,1,6), NULL, NULL, NULL, NULL);
    SELECT estado INTO v_estado FROM facturas WHERE pedido_id = v_ped ORDER BY created_at DESC LIMIT 1;
    IF v_estado IS DISTINCT FROM 'pendiente' THEN
      RAISE EXCEPTION 'CINTURON: la factura nacio «%» (esperaba pendiente)', v_estado;
    END IF;
    RAISE NOTICE 'OK factura sin estado nace «pendiente» (antes: 23502 crudo)';
  END IF;

  RAISE NOTICE 'CINTURON factura: el NULL explicito ya no pisa el default';
END $$;

COMMIT;
