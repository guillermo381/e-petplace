-- S114-A · el tope del parcial cubre TODAS las citas — y declara el borde de estadía.
--
-- Medido tras 20260912010000: el tope quedaba NULL en 4 de 8 citas (sin devengo Y
-- sin cita_desglose) y en la estadía. Para citas, la fuente que faltaba es el
-- PRECIO propio de la cita (evento_cita_servicio.precio) — el objeto_id de un caso
-- 'cita' ES esa fila. Con eso las 8 citas tienen tope.
--
-- 🔴 BORDE DECLARADO — ESTADÍA DE GUARDERÍA: su objeto vive en guarderia_estadias,
-- que NO tiene columna de total (el costo está en el modelo de suscripción/paquete,
-- que devenga). ⇒ una estadía CON devengo queda capada por el devengo (monto_bruto,
-- rama de arriba del helper); una estadía SIN devengo NO tiene tope acá. Es un
-- borde raro (una estadía real pagada devenga), se declara en vez de adivinar el
-- total en un modelo que no lo expone en una columna. Si aparece, es su propia ficha.
--
-- 76(g) NO RIGE. Reversa ANTES.

CREATE OR REPLACE FUNCTION public._caso_monto_objeto(p_tipo text, p_id uuid)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_ev uuid; v_bruto numeric;
BEGIN
  -- el devengo es el valor bruto de lo cobrado: tope autoritativo (cubre estadía
  -- pagada, cita devengada, pedido devengado).
  v_ev := _caso_tiene_devengo(p_tipo, p_id);
  IF v_ev IS NOT NULL THEN
    SELECT monto_bruto INTO v_bruto FROM eventos_economicos WHERE id = v_ev;
    RETURN v_bruto;
  END IF;
  -- sin devengo: el total del objeto por tipo.
  RETURN CASE p_tipo
    WHEN 'pedido' THEN (SELECT total FROM pedidos WHERE id = p_id)
    -- la cita: su desglose congelado, o su precio propio si no tiene desglose.
    WHEN 'cita'   THEN COALESCE(
                         (SELECT total FROM cita_desglose WHERE cita_id = p_id),
                         (SELECT precio FROM evento_cita_servicio WHERE id = p_id))
    ELSE NULL END;   -- estadía sin devengo: sin tope acá (borde declarado)
END $fn$;
REVOKE ALL ON FUNCTION public._caso_monto_objeto(text, uuid) FROM anon, PUBLIC;

DO $cinturon$
DECLARE v_null_citas int;
BEGIN
  SELECT count(*) INTO v_null_citas FROM casos_postventa
   WHERE objeto_tipo='cita' AND _caso_monto_objeto(objeto_tipo, objeto_id) IS NULL;
  IF v_null_citas <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN: quedan % citas sin tope (esperaba 0)', v_null_citas;
  END IF;
  RAISE NOTICE 'CINTURÓN VERDE · las 8 citas tienen tope (desglose o precio) · estadía sin devengo declarada sin tope';
END $cinturon$;
