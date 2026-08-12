-- ═══════════════════════════════════════════════════════════════════════════
-- S95-E · BLOQUE 7 — LA REGLA DE ENVÍO DEL VENDEDOR
--
-- 🔴 ESTE SEED ESTÁ BLOQUEADO A PROPÓSITO Y NO SE PUEDE CORRER HOY.
--
-- El brief lo dice con todas las letras: *«Si todavía no existe la cuenta
-- comercial del vendedor, la regla no se puede cargar: frená y elevá. No
-- inventes una cuenta para que la fila entre.»* Eso es exactamente lo que
-- pasó, y está medido:
--
--   · `cuenta_roles` con `tipo_actor = 'seller_productos'` → **0 filas**.
--   · Las CINCO cuentas comerciales que existen son de PRESTADORES DE
--     SERVICIOS (Paseos Andres · Paseos Shyris · Clínica Aurora · Clínica Los
--     Shyris · Wizard), las cuatro activas con `prestador_servicios:activo`.
--
-- O sea: **no hay vendedor de productos en esta base.** Darle el rol
-- `seller_productos` a una clínica o a un paseador para que la fila entre
-- sería inventar el vendedor — y peor, sería inventarlo en la tabla que
-- gobierna `es_vendedor_de()`, que es el gate de TODO el panel del vendedor.
--
-- ── LO QUE EL FOUNDER TIENE QUE CONTESTAR, y es una sola cosa ──────────────
--   ¿Cuál es la cuenta comercial del vendedor real de la despensa?
--     (a) una de las cinco existentes → decir cuál, y se le agrega el ROL
--         `seller_productos` (una cuenta puede tener los dos roles: la
--         separación de S95 es entre CUENTA y ROL, justamente para esto);
--     (b) una cuenta nueva → hay que crearla con su identificación fiscal,
--         y eso es el alta comercial, no un seed.
--
-- ── LA REGLA, YA FIRMADA (no está en duda; lo que falta es a quién aplicarla)
--   `gratis_sobre_umbral` · umbral 0 · `pagado_por = vendedor`.
--
--   POR QUÉ ASÍ Y NO `plana` CON COSTO CERO (firma del founder): el día que
--   ponga un mínimo de compra, esto es **cambiar un número** en vez de cambiar
--   de tipo de regla.
--
--   POR QUÉ `pagado_por` (firma del founder): **«gratis» no es «nadie paga».**
--   El envío lo está pagando el vendedor de su margen. El día que e-PetPlace
--   subsidie un envío, la diferencia tiene que ser legible en la liquidación —
--   y si no quedó escrito desde el primer pedido, no se puede reconstruir.
--
--   DÓNDE VIVE `pagado_por`, MEDIDO: `reglas_envio` **no tiene esa columna**, y
--   `cat_tipos_regla_envio.parametros_esperados` de `gratis_sobre_umbral` solo
--   declara `{umbral, monto_bajo_umbral}`. Va adentro de `parametros`, que es
--   jsonb libre (el trigger `_trg_regla_envio_tipo_activo` solo valida que el
--   TIPO esté activo — leído, no supuesto). **Y eso además lo mejora:**
--   `cotizar_envio_despensa` devuelve `parametros_aplicados`, y
--   `crear_pedido_despensa` lo congela en `pedidos.envio_cotizacion` ⇒ **quién
--   pagó el envío queda escrito en la fila del pedido**, no en una tabla de
--   configuración que puede cambiar después.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
  v_cuenta uuid;
  v_n      int;
BEGIN
  -- ── EL FRENO. No se toca hasta que exista un vendedor de verdad. ─────────
  SELECT count(*) INTO v_n
  FROM cuenta_roles
  WHERE tipo_actor = 'seller_productos' AND estado = 'activo';

  IF v_n = 0 THEN
    RAISE EXCEPTION
      'BLOQUEADO: no hay ninguna cuenta con rol seller_productos activo. La regla de envío no se carga contra un vendedor inventado. Contestá la pregunta de la cabecera y volvé.';
  END IF;

  IF v_n > 1 THEN
    -- Con dos vendedores hay que decir cuál, no elegir por LIMIT 1: una regla
    -- de envío cargada en el vendedor equivocado se descubre cobrando mal.
    RAISE EXCEPTION
      'BLOQUEADO: hay % cuentas con rol seller_productos. Este seed carga UNA regla y no adivina cuál.', v_n;
  END IF;

  SELECT cuenta_comercial_id INTO v_cuenta
  FROM cuenta_roles
  WHERE tipo_actor = 'seller_productos' AND estado = 'activo';

  INSERT INTO reglas_envio (cuenta_comercial_id, country_code, tipo, parametros,
                            moneda, prioridad, vigencia_desde, activo, notas)
  VALUES (
    v_cuenta, 'EC', 'gratis_sobre_umbral',
    jsonb_build_object(
      'umbral', 0,
      'monto_bajo_umbral', 0,
      -- 🔴 «gratis» no es «nadie paga». Viaja congelado a cada pedido.
      'pagado_por', 'vendedor'
    ),
    'USD', 100, now(), true,
    'S95-E B7 · firma del founder: gratis con umbral 0, pagado por el vendedor. '
    'El umbral existe para que poner un mínimo de compra sea cambiar un número.'
  );

  RAISE NOTICE 'Regla de envío cargada para la cuenta %.', v_cuenta;
END $$;

COMMIT;
