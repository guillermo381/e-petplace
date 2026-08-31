-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A-8 · ① EL DESGLOSE DEL BONO LO GARANTIZA LA TABLA
--
-- 76(g) VEDA: **NO RIGE.** Reemplazo de un trigger. **Cero backfill** — los 7
--   bonos viejos sin desglose son de PRUEBA y quedan donde están; el trigger es
--   AFTER INSERT y no los mira. Se declara, no se les escribe nada.
-- REVERSA: `docs/relevamientos/2026-09-04-s108a-REVERSA-M18.sql`.
--
-- ═══ EL DEFECTO QUE C MIDIÓ, Y SU MITAD YA ESTABA CURADA ═══════════════════
-- C midió (contra `main` de antes de `…160000`) que `comprar_paquete_salidas`
-- no escribe `bono_desglose` ⇒ la edge rebota `desglose_incompleto`.
-- ✅ **Su mitad se curó sola en `20260904160000`**: al hacer que el bono de
--    paseo naciera `pendiente`, el trigger —que exigía justamente eso— pasó a
--    dispararse. Medido en su cinturón: el paquete de paseo nace **con** su
--    desglose. *El productor no escribía el desglose porque el trigger no lo
--    alcanzaba, y lo que lo alcanzó fue cambiarle el estado inicial.*
--
-- ═══ PERO LA GARANTÍA NO ERA DE LA TABLA — orden del founder ═══════════════
-- 🔴 El trigger tenía **TRES huecos**, los tres `RETURN NEW` mudos: estado ≠
--    `pendiente` · sin precio · sin moneda. *Si el bono admite un productor sin
--    desglose, admite el tercero.*
-- ⇒ Corre para **TODO bono** y **REVIENTA** si no puede congelar. Un productor
--   futuro que no lea esta letra no puede insertar un bono sin desglose: no le
--   entra la fila.
-- ⚠️ Medido antes de cerrarlo: **0 prestadores sin moneda** ⇒ el fail-closed no
--    rompe ninguna alta viva.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;
CREATE OR REPLACE FUNCTION public._trg_bono_congela_desglose()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_moneda text; v_fee uuid;
BEGIN
  /* ═══ EL DESGLOSE LO GARANTIZA LA TABLA, NO CADA PRODUCTOR ══════════════
     🔴 Este trigger tenía TRES huecos por los que un bono nacía sin desglose, y
     los tres eran `RETURN NEW` mudos: que no naciera `pendiente`, que no
     tuviera precio, y que no se resolviera la moneda.
     *El primero es el que nos cobró: el paquete de PASEO nacía `pagado`, el
     trigger se saltaba, y la edge lo rechazaba después con `desglose_incompleto`
     — un productor sin desglose, exactamente lo que la letra de la cita
     previene con su trigger «que cubre las siete puertas y la octava que alguien
     escriba sin leer esta letra».*

     ⇒ Ahora **corre para TODO bono** y **REVIENTA si no puede congelar**. Un
     tercer productor que no sepa de esta letra ya no puede crear un bono sin
     desglose: no le va a entrar la fila.

     ⚠️ Medido antes de hacerlo fail-closed: **0 prestadores sin moneda**, así
     que cerrar ese hueco hoy no rompe ninguna alta. Y los **7 bonos viejos sin
     desglose son de PRUEBA y quedan donde están** — el trigger es AFTER INSERT
     y no los mira. */
  IF NEW.precio_total IS NULL THEN
    RAISE EXCEPTION 'bono_sin_precio_no_puede_congelar_desglose' USING ERRCODE='22023';
  END IF;

  SELECT cc.moneda INTO v_moneda
    FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
   WHERE pr.id = NEW.prestador_id;
  IF v_moneda IS NULL THEN
    /* *Un desglose con moneda supuesta cobra en una moneda que nadie eligió* —
       y sin desglose la edge rebota igual, sólo que más tarde y sin decir esto. */
    RAISE EXCEPTION 'bono_sin_moneda_no_puede_congelar_desglose' USING ERRCODE='22023';
  END IF;

  SELECT rfa.fee_config_id INTO v_fee
    FROM prestadores pr
    JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
    CROSS JOIN LATERAL _resolver_fee_aplicable(
      p_cuenta_comercial_id => cc.id,
      p_tipo_actor          => 'prestador_servicios'::tipo_actor_enum,
      p_country_code        => NEW.country_code,
      p_revenue_stream      => 'transaccional'::revenue_stream_enum,
      p_tipo_origen         => 'cita',
      p_categoria_origen    => NULL,
      p_fecha_referencia    => now()
    ) rfa
   WHERE pr.id = NEW.prestador_id;

  INSERT INTO bono_desglose (bono_id, subtotal, impuesto, total, moneda, fee_config_id)
  VALUES (NEW.id, NEW.precio_total, 0, NEW.precio_total, v_moneda, v_fee)
  ON CONFLICT (bono_id) DO NOTHING;   -- se congela UNA vez
  RETURN NEW;
END $function$

;

-- ═══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $c$
DECLARE v_user uuid; v_prest uuid; v_serv uuid; v_fam uuid; v_b uuid; v_n int;
BEGIN
  SELECT b.user_id, b.prestador_id, b.prestador_servicio_id, b.familia_id
    INTO v_user, v_prest, v_serv, v_fam FROM bonos b WHERE b.tipo_servicio='paseo' LIMIT 1;

  -- (a) 🔴 UN BONO `pagado` TAMBIÉN CONGELA. Antes el trigger se lo saltaba,
  --     y ése era el hueco por el que el paseo llegaba sin desglose.
  INSERT INTO bonos (prestador_id, user_id, familia_id, tipo_servicio, prestador_servicio_id,
    unidades_total, unidades_usadas, precio_total, precio_por_unidad,
    fecha_compra, fecha_vencimiento, estado, estado_pago, country_code)
  VALUES (v_prest, v_user, v_fam, 'paseo', v_serv, 3, 0, 30, 10,
          public.hoy_local(), (public.hoy_local()+30)::date, 'activo','pagado','EC')
  RETURNING id INTO v_b;
  IF NOT EXISTS (SELECT 1 FROM bono_desglose WHERE bono_id=v_b) THEN
    RAISE EXCEPTION 'cinturon: un bono PAGADO nacio sin desglose — el hueco sigue';
  END IF;

  /* (b) 🔴 EL HUECO DEL PRECIO YA LO CERRABA LA TABLA — medido al intentar
     ejercerlo: `bonos.precio_total` es **NOT NULL**, así que un bono sin precio
     nunca pudo entrar. *El `RETURN NEW` mudo de ese brazo era letra muerta:
     protegía de un estado que el esquema ya hacía imposible.* Se deja el RAISE
     igual —cuesta nada y deja de ser mudo si algún día la columna se afloja—
     pero **NO se cuenta como brazo ejercido**: no se puede producir su rojo. */
  RAISE NOTICE 'cinturon M18: brazo del precio NO EJERCIBLE — precio_total es NOT NULL, la tabla ya lo impedia';

  -- (c) los 7 viejos NO se tocaron (cero backfill, y se comprueba)
  SELECT count(*) INTO v_n FROM bonos b
   WHERE b.estado_pago='pagado' AND b.id <> v_b
     AND NOT EXISTS (SELECT 1 FROM bono_desglose d WHERE d.bono_id=b.id);
  IF v_n <> 7 THEN
    RAISE EXCEPTION 'cinturon: los bonos viejos cambiaron (esperaba 7 sin desglose, hay %)', v_n;
  END IF;

  RAISE NOTICE 'cinturon M18: 2/2 OK (un bono PAGADO tambien congela · los 7 viejos intactos) — el brazo del precio es INEJERCIBLE y se declara';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M18: fixture deshecho por subtransaccion, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;
