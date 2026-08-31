/* ═══════════════════════════════════════════════════════════════════════════
   S109-B · EL CONCEPTO DEL PLAN DE PASEO — el sexto sujeto dice qué se compró

   Medido ejerciendo (`DF-2108346`, $138, plan activo y pagado):
   `_concepto_de_pago` **no conoce el plan** y cae a su fail-closed
   `'Pago en e-PetPlace'`. *El cobro entero funciona y el respaldo no dice qué
   se compró* — que es exactamente lo que la firma del founder separó del
   criterio fiscal: **decir QUÉ se compró no es una decisión tributaria.**

   Espeja la rama ④: el mandato de guardería dice «Plan mensual de guardería».

   ⚠️ ESTO NO ALCANZA SOLO, y se declara: la rama `recurrente` del actuador
   —por donde pasa el plan— **no emite ningún comprobante** (medido: el actuador
   emite 3 y ninguno es de ella). Con esta migración el concepto EXISTE; falta
   que alguien lo pida. *Un concepto sin emisor es la misma forma de motor sin
   puerta que esta sesión pagó cuatro veces* — se pasa a A, que es de quien es
   esa rama.

   Veda 76(g): NO RIGE — sin backfill, sin anclas, sin datos tocados.
   ═══════════════════════════════════════════════════════════════════════════ */

DO $mig$
DECLARE
  v_src text; v_nuevo text;
  v_viejo CONSTANT text := '    -- ④ MENSUALIDAD de guardería: el mandato.
    (SELECT ''Plan mensual de guardería''
       FROM guarderia_suscripciones g WHERE g.id = p_sujeto),';
  v_nueva CONSTANT text := '    -- ④ MENSUALIDAD de guardería: el mandato.
    (SELECT ''Plan mensual de guardería''
       FROM guarderia_suscripciones g WHERE g.id = p_sujeto),

    -- ⑥ PLAN DE PASEO: el sexto sujeto. Mismo criterio que ④ — se nombra el
    --    compromiso, no su aritmética. *La familia contrató un plan mensual,
    --    no «N salidas»: decir el número acá lo haría sonar a un paquete, que
    --    es otro producto y otro comprobante.*
    (SELECT ''Plan mensual de paseos''
       FROM suscripciones_servicio s WHERE s.id = p_sujeto),';
BEGIN
  SELECT pg_get_functiondef(oid) INTO v_src FROM pg_proc WHERE proname = '_concepto_de_pago';
  IF v_src IS NULL THEN RAISE EXCEPTION '_concepto_de_pago no existe'; END IF;
  IF position(v_viejo in v_src) = 0 THEN
    RAISE EXCEPTION 'la rama ④ cambió: se aborta en vez de adivinar';
  END IF;

  v_nuevo := replace(v_src, v_viejo, v_nueva);
  /* *Un `replace` que no encuentra su texto devuelve el original y la migración
     corre verde sin cambiar nada.* Ya cobró una vez hoy. */
  IF position('suscripciones_servicio s WHERE s.id = p_sujeto' in v_nuevo) = 0 THEN
    RAISE EXCEPTION 'el reemplazo no entró: se aborta';
  END IF;
  EXECUTE v_nuevo;
END $mig$;

/* ── CINTURÓN, con su control positivo y su rojo fabricado ────────────────── */
DO $cint$
DECLARE v_plan uuid; v_men uuid; v_dice text;
BEGIN
  SELECT id INTO v_plan FROM suscripciones_servicio LIMIT 1;
  SELECT id INTO v_men  FROM guarderia_suscripciones LIMIT 1;

  /* ① control positivo: si no hay plan vivo, el brazo NO puede medir y se dice.
        *Un cinturón que corre sobre cero filas da verde sin haber probado nada.* */
  IF v_plan IS NULL THEN RAISE EXCEPTION 'sin plan con que medir: el cinturón no concluye'; END IF;

  v_dice := _concepto_de_pago(v_plan);
  IF v_dice <> 'Plan mensual de paseos' THEN
    RAISE EXCEPTION 'el plan sigue diciendo «%»', v_dice;
  END IF;

  /* ② DISCRIMINADOR: la mensualidad de guardería NO puede haber cambiado. Sin
        este brazo, una rama nueva que capturara de más daría verde en ①. */
  IF v_men IS NOT NULL AND _concepto_de_pago(v_men) <> 'Plan mensual de guardería' THEN
    RAISE EXCEPTION 'la rama nueva se comió la mensualidad de guardería: «%»',
      _concepto_de_pago(v_men);
  END IF;

  /* ③ el fail-closed sigue vivo: un id que no es de nadie cae al neutro. */
  IF _concepto_de_pago('00000000-0000-4000-8000-000000000000'::uuid) <> 'Pago en e-PetPlace' THEN
    RAISE EXCEPTION 'el fail-closed dejó de decir el concepto neutro';
  END IF;

  RAISE NOTICE 'concepto del plan: 3 brazos verdes';
END $cint$;
