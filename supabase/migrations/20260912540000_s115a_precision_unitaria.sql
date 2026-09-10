-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LA BASE UNITARIA CONSERVA SU PRECISIÓN
--
-- 🔴 MEDIDO POR E CONTRA FACTURAS REALES: el SRI acepta **seis decimales** en
--    precio unitario y cantidad, y **dos** en los totales — y las facturas de
--    producción los usan (147.8261 · 2.521740). Nuestras columnas eran
--    `numeric(12,2)` y `numeric(12,3)`: **redondeaban al entrar**.
--
--    *No fallaba: guardaba un número parecido.* Y con `chk_base_cuadra`
--    (`base = round(cantidad * precio_unitario - descuento, 2)`) el resultado
--    seguía cuadrando consigo mismo — o sea que la pérdida era invisible desde
--    adentro. La única forma de verla era comparar contra la factura de afuera.
--
-- LA REGLA FIRMADA NO CAMBIA, SE VUELVE SOSTENIBLE: cada línea redondea a dos y
-- el total es la SUMA de las líneas. Lo que cambia es que la **base unitaria**
-- deja de perder su precisión antes de que esa regla la use.
--
--   · `precio_unitario` numeric(12,2) → **numeric(14,6)**
--   · `cantidad`        numeric(12,3) → **numeric(14,6)**
--   · `base`, `descuento`, `valor_iva` **SIGUEN EN 2** — son totales de línea, y
--     ahí dos decimales no es una limitación: es la regla.
--
-- 76(g) — VEDA: **NO RIGE**, y esta vez importa decir por qué: `ALTER TYPE` con
--    precisión MAYOR no toca los datos (Postgres reescribe la tabla sin perder
--    dígitos), y además hay **0 filas**. El riesgo está en la REVERSA, y por eso
--    su archivo lo dice con todas las letras.
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.pagos_desglose_lineas
  ALTER COLUMN precio_unitario TYPE numeric(14,6),
  ALTER COLUMN cantidad        TYPE numeric(14,6);

COMMENT ON COLUMN public.pagos_desglose_lineas.precio_unitario IS
  'Base unitaria con 6 decimales — lo que el SRI acepta y las facturas reales '
  'usan (147.8261). El redondeo a 2 es de la LINEA (`base`), no de este dato.';
COMMENT ON COLUMN public.pagos_desglose_lineas.cantidad IS
  'Cantidad con 6 decimales (facturas reales: 2.521740).';

-- CINTURÓN — el rojo es que un valor de 6 decimales SOBREVIVA al viaje, y que
-- la regla de redondeo de la línea se siga cumpliendo sobre él.
DO $c$
DECLARE v_int uuid; v_pu numeric; v_cant numeric; v_base numeric; v_user uuid;
BEGIN
  SELECT id INTO v_user FROM auth.users LIMIT 1;
  INSERT INTO public.pagos_intentos (proveedor, monto, forma, clave_idempotencia, moneda,
                                     cita_id, pagador_user_id)
  VALUES ('simulador', 372.73, 'tokenizacion', 'prec-'||gen_random_uuid()::text, 'USD',
          (SELECT id FROM public.evento_cita_servicio LIMIT 1), v_user)
  RETURNING id INTO v_int;

  /* Los dos números de la factura real que E midió. */
  INSERT INTO public.pagos_desglose_lineas
    (pago_intento_id, linea, descripcion, cantidad, precio_unitario, descuento,
     codigo_iva, tarifa_pct, origen_tipo, base, valor_iva)
  VALUES (v_int, 1, 'linea de precision', 2.521740, 147.8261, 0,
          'EC_IVA_15', 15, 'cita',
          round(2.521740 * 147.8261 - 0, 2),
          round(round(2.521740 * 147.8261 - 0, 2) * 15 / 100, 2));

  SELECT precio_unitario, cantidad, base INTO v_pu, v_cant, v_base
    FROM public.pagos_desglose_lineas WHERE pago_intento_id = v_int;

  IF v_pu <> 147.826100 THEN
    RAISE EXCEPTION 'cinturon 🔴: el precio unitario se redondeo a % — la precision no entro', v_pu;
  END IF;
  IF v_cant <> 2.521740 THEN
    RAISE EXCEPTION 'cinturon 🔴: la cantidad se redondeo a %', v_cant;
  END IF;
  IF v_base <> round(2.521740 * 147.8261, 2) THEN
    RAISE EXCEPTION 'cinturon: la base no cuadra con la regla de la casa: %', v_base;
  END IF;

  DELETE FROM public.pagos_desglose_lineas WHERE pago_intento_id = v_int;
  DELETE FROM public.pagos_intentos WHERE id = v_int;
  IF (SELECT count(*) FROM public.pagos_desglose_lineas) <> 0 THEN
    RAISE EXCEPTION 'cinturon: residuo en pagos_desglose_lineas';
  END IF;

  RAISE NOTICE 'cinturon VERDE: 147.826100 y 2.521740 sobreviven · base=% (2 dec) · residuo 0',
               round(2.521740 * 147.8261, 2);
END $c$;
