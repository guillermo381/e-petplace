-- S115-A · TANDA 3 (② ④ ⑤) — LA TARIFA DE SERVICIO, LOS MEDIOS DE PAGO Y LAS SUSCRIPCIONES
-- Letra: MODELO_ECONOMICO v1.1 · D-B, D-D. Reversa: docs/relevamientos/S115-A-REVERSA-20260912360000-tarifa-y-medios.sql
-- VEDA 76(g): NO RIGE.

BEGIN;

-- ══ ② LA TARIFA DE SERVICIO ══════════════════════════════════════════════════
/* 🔴 NO va como fila de `tipos_servicio`, y no es capricho: esa tabla tiene un CHECK
   cerrado sobre `categoria` (veterinario|grooming|paseo|hospedaje|adiestramiento|
   telemedicina|emergencia|otro) y meterla ahí obligaría a AMPLIAR el vocabulario para
   que la migración pase — que es justo lo que la casa prohíbe. Además no es un
   servicio que un prestador ofrezca: es un ítem de PLATAFORMA.
   ⇒ Vive como DATO en `app_config` y se materializa como una LÍNEA del desglose,
   con `origen_tipo = 'tarifa_servicio'`. */

INSERT INTO public.app_config (clave, valor, tipo, descripcion, categoria, es_publico) VALUES
  ('tarifa_servicio_monto', '0.99', 'numero',
   'Tarifa de servicio a la familia, por RESERVA o PEDIDO (una sola vez por pago, no por item). NETA: el IVA se agrega con tarifa_servicio_codigo_iva. MODELO_ECONOMICO D-B.',
   'legal', false),
  ('tarifa_servicio_codigo_iva', 'EC_IVA_15', 'texto',
   'Codigo de tarifa de IVA de la tarifa de servicio. DATO: si la tarifa general cambia, cambia aca.',
   'legal', false),
  ('tarifa_servicio_promo_hasta', '2026-12-31', 'texto',
   'Hasta cuando la tarifa va PROMOCIONADA A CERO (F&F, cupon financiado por la plataforma - Decision H). La linea SE VE igual, con su descuento: el dia que se apaga la promo no hay que construir nada.',
   'legal', false)
ON CONFLICT (clave) DO NOTHING;

CREATE OR REPLACE FUNCTION public.tarifa_servicio_vigente(p_fecha date DEFAULT current_date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_monto numeric; v_cod text; v_hasta date; v_pct numeric; v_promo boolean;
BEGIN
  SELECT valor::numeric INTO v_monto FROM app_config WHERE clave='tarifa_servicio_monto';
  SELECT valor          INTO v_cod   FROM app_config WHERE clave='tarifa_servicio_codigo_iva';
  SELECT valor::date    INTO v_hasta FROM app_config WHERE clave='tarifa_servicio_promo_hasta';

  /* Sin configuración NO se inventa una tarifa: se devuelve apagada. *Cobrarle a una
     familia $0,99 porque un default lo dijo es cobrar sin que nadie lo haya decidido.* */
  IF v_monto IS NULL OR v_cod IS NULL THEN
    RETURN jsonb_build_object('vigente', false, 'motivo', 'sin_configuracion');
  END IF;

  SELECT pct INTO v_pct FROM cat_tasas_impuesto
   WHERE codigo = v_cod AND activo AND vigencia_desde <= now()
     AND (vigencia_hasta IS NULL OR vigencia_hasta > now());
  IF v_pct IS NULL THEN
    RETURN jsonb_build_object('vigente', false, 'motivo', 'sin_tarifa_iva_vigente');
  END IF;

  v_promo := (v_hasta IS NOT NULL AND p_fecha <= v_hasta);

  RETURN jsonb_build_object(
    'vigente', true,
    'base',      CASE WHEN v_promo THEN 0 ELSE round(v_monto, 2) END,
    'descuento', CASE WHEN v_promo THEN round(v_monto, 2) ELSE 0 END,
    'monto_lista', round(v_monto, 2),
    'codigo_iva', v_cod,
    'tarifa_pct', v_pct,
    'valor_iva', CASE WHEN v_promo THEN 0 ELSE round(round(v_monto,2) * v_pct / 100, 2) END,
    /* 🔴 EN PROMO LA LÍNEA NO DESAPARECE: base 0 con su descuento visible. *Una línea
       que se esconde mientras es gratis hay que construirla el día que se cobra, y ese
       día el usuario ve aparecer un cargo nuevo.* El asiento del cupón (margen
       negativo, caso 8.2) existe desde hoy. */
    'promocionada', v_promo);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.tarifa_servicio_vigente(date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.tarifa_servicio_vigente(date) TO authenticated;

-- ══ ④ LOS MEDIOS DE PAGO, COMO DATO ══════════════════════════════════════════
INSERT INTO public.app_config (clave, valor, tipo, descripcion, categoria, es_publico) VALUES
  ('medios_pago_orden', 'deuna,debito,credito', 'texto',
   'Orden en que el checkout OFRECE los medios. DeUna primero por costo de riel: credito corriente cuesta 6,35% + 0,05 del total; debito 2,9%. Cada punto de mezcla que sale de credito vale ~4% del ticket (MODELO_ECONOMICO D-D). Es DATO: se reordena sin deploy.',
   'integraciones', false),
  ('pago_diferido_vivo', 'false', 'booleano',
   'DIFERIDO APAGADO. Cuesta entre 7,7% y 15% del total segun plazo (calculadora Nuvei) — mas que cualquier comision de la casa. Bandera propia para que encenderlo sea una decision, no un descuido.',
   'integraciones', false),
  ('saldo_bono_recarga_pct', '3', 'numero',
   'Bono de recarga de saldo: +3% al recargar por DeUna. APAGADO hasta que el founder lo encienda (ver saldo_bono_recarga_minimo). Su costo entra al P&L de gestion como marketing, igual que un cupon.',
   'integraciones', false),
  ('saldo_bono_recarga_minimo', '0', 'numero',
   'Monto minimo para el bono de recarga. En CERO = APAGADO (ninguna recarga califica). Se enciende poniendo 50, que es el valor firmado. *Un cero es un apagado que no exige otra bandera.*',
   'integraciones', false)
ON CONFLICT (clave) DO NOTHING;

-- ══ ⑤ LAS SUSCRIPCIONES — DISEÑADAS Y APAGADAS ═══════════════════════════════
/* 🔴 LO QUE MEDÍ, Y POR ESO NO SE FUERZA NADA MÁS QUE ESTO:
   `suscripcion_desglose` y `recurrencia_desglose` tienen **CERO filas** — el motor de
   recurrencia NUNCA congeló un desglose. Ya lo declaré en la T1, y hoy lo re-medí:
   sigue vacío. Además `escribir_lineas_del_intento` rebota para `recurrencia` con
   `recurrencia_sin_desglose_congelado`, a propósito.
   ⇒ Se dejan las filas de fee para que el día del encendido no haya migración, y
     **NADA más**: sin pantalla, sin cobro, sin cablear el motor. *Cablear una
     suscripción sobre un desglose que nunca se escribió sería construir sobre un
     camino que nadie recorrió.* */
INSERT INTO public.fee_configs
  (tipo_actor, country_code, revenue_stream, tipo_origen, tipo_calculo, parametros,
   minimo_por_transaccion, absorbe_descuento_default, prioridad, vigencia_desde, activo, notas)
VALUES
  ('plataforma_directa','EC','recurrente','suscripcion_prime','fijo',
   '{"monto": 4.99, "moneda": "USD", "codigo_iva": "EC_IVA_15"}'::jsonb, 0,'plataforma', 0,
   '2026-10-01 00:00:00-05', false,
   'S115 · SUSCRIPCION Prime familia $4,99/mes. APAGADA (activo=false): fila lista para que el encendido no sea una migracion. El motor de recurrencia NO la soporta hoy — suscripcion_desglose tiene 0 filas, medido.'),
  ('plataforma_directa','EC','recurrente','suscripcion_prestador','fijo',
   '{"monto": 9.99, "moneda": "USD", "codigo_iva": "EC_IVA_15"}'::jsonb, 0,'plataforma', 0,
   '2026-10-01 00:00:00-05', false,
   'S115 · SUSCRIPCION Plan del prestador $9,99/mes. APAGADA (activo=false). Misma medicion que Prime.');

-- ══ CINTURÓN ═════════════════════════════════════════════════════════════════
DO $$
DECLARE v jsonb; v_n int;
BEGIN
  -- La tarifa está PROMOCIONADA hoy: base 0, descuento 0,99, y la línea EXISTE
  v := public.tarifa_servicio_vigente(current_date);
  IF NOT (v->>'vigente')::boolean THEN RAISE EXCEPTION 'cinturon_tarifa: no vigente · %', v; END IF;
  IF (v->>'base')::numeric <> 0 OR (v->>'descuento')::numeric <> 0.99 THEN
    RAISE EXCEPTION 'cinturon_promo: en F&F la base debe ser 0 con descuento 0,99 · %', v;
  END IF;
  -- DISCRIMINADOR: después de la promo cobra 0,99 + IVA 0,15
  v := public.tarifa_servicio_vigente('2027-01-15'::date);
  IF (v->>'base')::numeric <> 0.99 OR (v->>'valor_iva')::numeric <> 0.15 THEN
    RAISE EXCEPTION 'cinturon_post_promo: esperaba 0,99 + 0,15 · %', v;
  END IF;

  SELECT count(*) INTO v_n FROM public.app_config
   WHERE clave IN ('tarifa_servicio_monto','tarifa_servicio_codigo_iva','tarifa_servicio_promo_hasta',
                   'medios_pago_orden','pago_diferido_vivo','saldo_bono_recarga_pct','saldo_bono_recarga_minimo');
  IF v_n <> 7 THEN RAISE EXCEPTION 'cinturon_config: esperaba 7 claves, hay %', v_n; END IF;

  IF (SELECT count(*) FROM public.app_config WHERE clave IN
      ('tarifa_servicio_monto','medios_pago_orden','pago_diferido_vivo') AND es_publico) <> 0 THEN
    RAISE EXCEPTION 'cinturon_publico: alguna clave de plata quedo marcada publica';
  END IF;

  SELECT count(*) INTO v_n FROM public.fee_configs WHERE notas LIKE 'S115 · SUSCRIPCION%' AND activo;
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturon_suscripcion_encendida: % filas activas', v_n; END IF;
END $$;

COMMIT;
