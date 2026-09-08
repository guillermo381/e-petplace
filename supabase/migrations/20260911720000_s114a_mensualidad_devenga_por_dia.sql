-- S114-A · LA MENSUALIDAD DE GUARDERÍA DEVENGA POR DÍA EJECUTADO
-- ═══════════════════════════════════════════════════════════════════════════
-- Defecto medido (adenda URGENTE, clase L-499): `_devengar_estadia` detectaba
-- la mensualidad leyendo `cita.suscripcion_servicio_id`, y el aplicador de
-- guardería NUNCA escribe esa columna. Peor: `suscripcion_servicio_id` es FK a
-- `suscripciones_servicio` (planes de PASEO) — la suscripción de guardería vive
-- en `guarderia_suscripciones`, y escribir su id en esa columna VIOLARÍA el FK
-- (medido: 761ac1ce no existe en suscripciones_servicio). Escribir la columna
-- es imposible por construcción.
--
-- ⇒ EL CABLE MEDIDO: la mensualidad se reconoce por `cita.metadata`:
--     metadata->>'origen' = 'mensualidad'  +  metadata->>'suscripcion_id'
--   (medido: las 22 estadías del sujeto 761ac1ce lo llevan; 110 citas de
--    mensualidad en toda la base, todas guarderia_dia).
--
-- 🔴 EL REPARTO (F10 · §8): «por día ejecutado, no por mes cobrado». La letra
--   fija el PRINCIPIO, no el denominador. Lo tomo DE LA FUENTE, no de una
--   fórmula inventada:
--     denominador = número de estadías contratadas del período.
--   El motor genera las estadías del mes (medido: 22, exactamente los días
--   hábiles de 2026-09-07→2026-10-06 — guardería es diurna de semana). Un
--   denominador de días CALENDARIO (29/30) fabricaría breakage fantasma:
--   cobraría por días de fin de semana que la mensualidad no entitla.
--   Con el denominador = días contratados, ejecutar todos devenga el mes entero;
--   ejecutar menos deja el resto como breakage real (mismo modelo que el paquete).
--   ⚠️ Declarado a la mesa para ratificación: la letra no fija el denominador;
--   esta es la derivación de A del dato. Limitación conocida: si la mensualidad
--   renueva, el conteo usa el período VIGENTE de la suscripción (no re-escribe
--   los períodos pasados) — igual que el resto del motor snapshotea por período.
--
-- Reversa: docs/relevamientos/2026-09-07-s114a-REVERSA-mensualidad.sql
-- 76(g): NO RIGE — DDL de función + columna aditiva sin backfill de negocio.

BEGIN;

-- ── ③ (pedido de E) columna para MARCAR SIEMBRA en guarderia_estadias ───────
-- guarderia_estadias no tiene campo de texto; una siembra que no se puede
-- marcar se lee mañana como tráfico real. Aditiva, nullable, sin default.
ALTER TABLE guarderia_estadias
  ADD COLUMN IF NOT EXISTS nota_siembra text;
COMMENT ON COLUMN guarderia_estadias.nota_siembra IS
  'S114 · marca de siembra/prueba. NULL = fila real. La escribe quien siembra; ningún camino de producto la lee como dato.';

-- ── ① EL CABLE + ② EL REPARTO POR DÍA ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public._devengar_estadia(p_estadia_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_e record; v_c record; v_cuenta record; v_monto numeric(14,2);
  v_sus record; v_dias int; v_via text; v_ev uuid; v_susid uuid;
BEGIN
  SELECT * INTO v_e FROM guarderia_estadias WHERE id = p_estadia_id;
  IF NOT FOUND OR v_e.estado <> 'entregada' THEN RETURN NULL; END IF;

  SELECT c.id, c.precio, c.estado_reserva, c.prestador_id, c.country_code,
         c.metadata, c.suscripcion_servicio_id, c.bono_id
    INTO v_c FROM evento_cita_servicio c WHERE c.id = v_e.cita_id;
  IF v_c.id IS NULL THEN RETURN NULL; END IF;
  IF v_c.estado_reserva IS DISTINCT FROM 'pagada' THEN RETURN NULL; END IF;

  -- idempotente, anclado en la ESTADÍA (LETRA §8 enmienda ②)
  IF EXISTS (SELECT 1 FROM eventos_economicos ee
             WHERE ee.origen_tipo='estadia' AND ee.origen_id=p_estadia_id
               AND ee.tipo_evento='cita_pagada') THEN
    RETURN NULL;
  END IF;

  v_susid := NULLIF(v_c.metadata->>'suscripcion_id','')::uuid;

  IF v_c.metadata->>'origen' = 'mensualidad' AND v_susid IS NOT NULL THEN
    -- MENSUALIDAD · por día ejecutado.
    -- El vínculo vive en el metadata de la cita (el FK suscripcion_servicio_id
    -- apunta a otra tabla y no se puede usar). La suscripción vive en
    -- guarderia_suscripciones.
    SELECT precio_mensual, periodo_desde, periodo_hasta INTO v_sus
      FROM guarderia_suscripciones WHERE id = v_susid;
    IF v_sus.precio_mensual IS NULL OR v_sus.precio_mensual <= 0 THEN
      RETURN NULL;  -- mandato sin precio: nada que devengar (honesto)
    END IF;
    -- denominador = días CONTRATADOS del período (las estadías generadas),
    -- no días calendario. De la fuente: el motor ya eligió los días hábiles.
    SELECT count(*) INTO v_dias
      FROM guarderia_estadias e2
      JOIN evento_cita_servicio c2 ON c2.id = e2.cita_id
     WHERE c2.metadata->>'suscripcion_id' = v_susid::text
       AND c2.fecha >= v_sus.periodo_desde
       AND c2.fecha <= v_sus.periodo_hasta;
    IF v_dias IS NULL OR v_dias < 1 THEN v_dias := 1; END IF;
    v_monto := ROUND(v_sus.precio_mensual / v_dias, 2);
    v_via := 'guarderia_mensualidad_dia';
  ELSE
    -- DÍA SUELTO o PAQUETE · el precio unitario del día vive en cita.precio
    v_monto := v_c.precio;
    v_via := CASE WHEN v_c.bono_id IS NOT NULL THEN 'guarderia_paquete' ELSE 'guarderia_dia' END;
  END IF;

  IF v_monto IS NULL OR v_monto < 0 THEN
    RAISE EXCEPTION 'estadia_sin_precio' USING ERRCODE='22023';
  END IF;
  -- un día de precio 0 (cortesía) no crea evento: no hay plata que devengar.
  IF v_monto = 0 THEN RETURN NULL; END IF;

  SELECT cc.id, cc.moneda INTO v_cuenta
    FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
   WHERE pr.id = v_c.prestador_id;
  IF v_cuenta.id IS NULL THEN
    RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE='22023';
  END IF;

  v_ev := crear_evento_economico(
    p_tipo_evento         => 'cita_pagada'::tipo_evento_economico_enum,
    p_revenue_stream      => 'transaccional'::revenue_stream_enum,
    p_cuenta_comercial_id => v_cuenta.id,
    p_country_code        => v_c.country_code,
    p_moneda              => v_cuenta.moneda,
    p_monto_bruto         => v_monto,
    p_monto_kushki_fee    => 0,
    p_origen_tipo         => 'estadia',
    p_origen_id           => p_estadia_id,
    p_fecha_devengo       => now(),
    p_fecha_cobro_kushki  => (v_c.metadata ->> 'pagado_en')::timestamptz,
    p_metadata            => jsonb_build_object('pago_simulado', true, 'via', v_via));
  RETURN v_ev;
END $function$;

COMMIT;
