-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · EL ACTUADOR: DOS CURAS EN UN ACTO
--   ①  🔴 DEJA DE REVENTAR EN SU PRIMER GATE  (bloqueante, hallazgo de hoy)
--   ②  DEJA DE ADIVINAR EL SUJETO             (el `else` que asume compra)
--
-- Van juntas porque **la ② es inalcanzable sin la ①**: mientras el actuador
-- muera en su primera línea, ninguna cura río abajo se puede siquiera probar.
--
-- ═══ ① EL BLOQUEANTE ═══════════════════════════════════════════════════════
--
-- `aplicar_evento_de_pago` declara `v_e record`, lee la fila con
-- `SELECT * INTO v_e` y se la pasa a `_evento_autenticado(p_evento
-- webhook_events)`. **PostgreSQL no puede castear `record` a un tipo compuesto
-- nombrado** y lanza:
--
--     cannot cast type record to webhook_events
--
-- ⇒ **el actuador ABORTA EN SU PRIMER GATE, en TODA llamada, para los DOS
--    proveedores.** No confirma un pago ni por error.
--
-- ── CÓMO SE ENCONTRÓ, y por qué ningún gate podía ────────────────────────
-- Apareció como un ROJO INESPERADO dentro del arnés de la cura ②: el brazo
-- «antes» esperaba `compra_no_existe` y recibió el error de casteo. *El arnés
-- no encontró lo que buscaba: encontró algo peor, porque para producir su rojo
-- tuvo que llamar a la función de verdad.*
--
-- ── LA MEDICIÓN QUE LO FECHA, y descarta la lectura tranquilizadora ──────
-- `webhook_events` tiene **23 filas con la huella del actuador** — y las 23 son
-- del **20 y 21 de agosto**, la última el **21-ago 17:09 Guayaquil**. El
-- actuador multiproveedor (el que introdujo `_evento_autenticado`) nació HOY.
-- **Desde entonces, CERO.**
--
-- 🔴 Y lo que explica que nadie lo notara: **los dos únicos eventos de hoy
--    murieron ANTES, en la edge, por `credencial=CLIENT`.** O sea que el
--    actuador roto **nunca fue llamado por un evento legítimo**. *No hubo
--    síntoma porque no hubo tráfico — y el día que llegue el primer webhook
--    bueno, el pago no se confirma.*
--
-- ── LA CURA: UNA PALABRA ─────────────────────────────────────────────────
-- `v_e record` → `v_e webhook_events`. Medido con las dos formas lado a lado:
-- con `record` FALLA, con la variable tipada devuelve `false` limpiamente.
--
-- ⚠️ **Y la lección que deja, que vale más que la línea:** una función auxiliar
--    que recibe un tipo compuesto **cambia el contrato de llamada de su
--    llamador**, y ese cambio *typechequea, deploya y compila*. Sólo falla en
--    ejecución, y sólo si alguien la ejecuta.
--
-- ═══ ② LA ADIVINANZA ═══════════════════════════════════════════════════════
--
-- El actuador decidía: `EXISTS cita → si no, ASUME compra`.
-- **Con DOS sujetos era una dicotomía correcta. Con CUATRO es una adivinanza
-- que compila** — `chk_intento_un_solo_sujeto` admite hoy
-- `pedido · cita · recurrencia · suscripcion_servicio`, y el CHECK creció a
-- cuatro **en mi propia migración de hoy** (`20260822235000`).
--
-- Es `§10.3` volviendo a pasar CON LA REGLA YA ESCRITA: *«agregar un sujeto
-- obliga a censar TODOS los consumidores del evento, no sólo la puerta»*.
--
-- No alcanza con que sea ruidoso: `confirmar_pago_compra` **lanza**
-- `compra_no_existe`, pero **el diagnóstico miente sobre el mecanismo** — dice
-- que falta una compra cuando la verdad es que *eso nunca fue una compra*, y
-- manda al lector a buscar un pedido perdido.
--
-- La cura cambia **asumir** por **verificar**, y nada más. 🔴 **NO se agrega
-- el manejo de recurrencia ni de suscripción acá, y es deliberado:** aplicar un
-- cobro recurrente es un acto de plata con su propia letra (el ACTO 2 lo
-- dispara `renovar_plan_cobrado`). Meterlo de contrabando en la cura de un
-- `else` sería el vicio que esta migración viene a cerrar.
--
-- ═══ VEDA 76(g) ════════════════════════════════════════════════════════════
-- **NO RIGE.** Reemplaza el cuerpo de una función. Cero backfill, cero filas de
-- negocio. Los fixtures se borran EN LA MISMA transacción, con residuo
-- asertado.
--
-- ═══ REVERSA ═══════════════════════════════════════════════════════════════
-- `docs/relevamientos/2026-08-22-s103a-REVERSA-20260822250000.sql`, escrita
-- ANTES. Dice con todas las letras que **revertir repone las dos fallas**, y
-- que la ① deja el motor de pagos MUERTO — o sea que esa reversa es sólo para
-- el caso de que la cura resulte peor, jamás por prolijidad.
--
-- ═══ MÉTODO ════════════════════════════════════════════════════════════════
-- Se parchea el objeto VIVO por texto, abortando si un ancla no aparece o
-- aparece más de una vez. **Jamás se pega un cuerpo reconstruido de memoria** —
-- son ~150 líneas que mueven plata real.
-- ═══════════════════════════════════════════════════════════════════════════

DO $arnes$
DECLARE
  v_def text; v_nuevo text; v_veces int;
  v_ev_malo uuid; v_ev_bueno uuid; v_sujeto_falso uuid; v_compra_ok uuid;
  v_r jsonb; v_antes text; v_residuo int;
  ANCLA_COMPRA constant text := '  v_res := confirmar_pago_compra(';
  ANCLA_DECL   constant text := 'v_e record;';
BEGIN
  -- ═══ ① LAS DOS ANCLAS, UNA VEZ CADA UNA ════════════════════════════════
  SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'aplicar_evento_de_pago';
  IF v_def IS NULL THEN RAISE EXCEPTION 'ABORTA ①: no existe el actuador'; END IF;

  v_veces := (length(v_def) - length(replace(v_def, ANCLA_COMPRA, ''))) / length(ANCLA_COMPRA);
  IF v_veces <> 1 THEN
    RAISE EXCEPTION 'ABORTA ①: el ancla de compra aparece % veces (se esperaba 1)', v_veces;
  END IF;
  v_veces := (length(v_def) - length(replace(v_def, ANCLA_DECL, ''))) / length(ANCLA_DECL);
  IF v_veces <> 1 THEN
    RAISE EXCEPTION 'ABORTA ①: `v_e record;` aparece % veces (se esperaba 1)', v_veces;
  END IF;
  IF position('sujeto_no_aplicable' in v_def) > 0 THEN
    RAISE EXCEPTION 'ABORTA ①: la cura YA esta aplicada';
  END IF;

  -- ═══ ② EL FIXTURE — un sujeto que NO es compra ni cita ══════════════════
  v_sujeto_falso := gen_random_uuid();
  IF EXISTS (SELECT 1 FROM compras WHERE id = v_sujeto_falso)
     OR EXISTS (SELECT 1 FROM evento_cita_servicio WHERE id = v_sujeto_falso) THEN
    RAISE EXCEPTION 'ABORTA ②: el uuid sorteado colisiono';
  END IF;

  INSERT INTO webhook_events (proveedor, ambiente, transaction_id, payload,
                              stoken_valido, resultado, detalle)
  VALUES ('nuvei', 'sandbox', 'arnes-s103-malo',
          jsonb_build_object('transaction', jsonb_build_object(
            'dev_reference', v_sujeto_falso::text, 'status','1',
            'amount','1.00', 'id','arnes-s103-malo',
            'authorization_code','ARN103')),
          true, 'recibido', 'arnes S103 · credencial=SERVER')
  RETURNING id INTO v_ev_malo;

  -- ═══ ③ 🔴 EL ANTES — el rojo se PRODUCE, y es el bloqueante ═════════════
  --     Este brazo es el que encontro la falla ①: pedia `compra_no_existe` y
  --     recibio el error de casteo. Ahora exige EXACTAMENTE ese error, porque
  --     es el estado real del objeto hoy. *Si algun dia deja de darlo, esta
  --     migracion ya no hace falta y el arnes lo va a decir abortando.*
  BEGIN
    v_r := public.aplicar_evento_de_pago(v_ev_malo);
    v_antes := '(NO lanzo) → ' || v_r::text;
  EXCEPTION WHEN OTHERS THEN
    v_antes := SQLERRM;
  END;
  IF position('cannot cast type record' in v_antes) = 0 THEN
    RAISE EXCEPTION 'ABORTA ③: esperaba el error de casteo del actuador VIVO. Dio: %', v_antes;
  END IF;
  RAISE NOTICE '③ ANTES (rojo producido, y es el BLOQUEANTE): «%»', v_antes;

  -- ═══ ④ LAS DOS CURAS ════════════════════════════════════════════════════
  --  ①  el casteo: una palabra
  v_nuevo := replace(v_def, ANCLA_DECL, 'v_e webhook_events;');
  --  ②  el sujeto: verificar en vez de asumir
  v_nuevo := replace(v_nuevo, ' v_cuantos int;', ' v_cuantos int; v_que_es text;');
  IF position('v_que_es text;' in v_nuevo) = 0 THEN
    RAISE EXCEPTION 'ABORTA ④: no se hallo el DECLARE para agregar v_que_es';
  END IF;

  v_nuevo := replace(v_nuevo, ANCLA_COMPRA, $inject$  -- S103: EL SUJETO SE VERIFICA, NO SE ASUME.
  --  Con dos sujetos «si no es cita, es compra» era una dicotomia. Con cuatro
  --  —el CHECK admite pedido, cita, recurrencia y suscripcion_servicio— es una
  --  adivinanza que compila. Y adivinar mal aca no es un error de logica: es
  --  aplicar plata sobre el objeto equivocado.
  --  El rebote NOMBRA lo que encontro: un `compra_no_existe` sobre una
  --  recurrencia manda al lector a buscar un pedido que jamas existio.
  IF NOT EXISTS (SELECT 1 FROM compras WHERE id = v_ref) THEN
    v_que_es := CASE
      WHEN EXISTS (SELECT 1 FROM pedidos_recurrencias   WHERE id = v_ref) THEN 'recurrencia'
      WHEN EXISTS (SELECT 1 FROM suscripciones_servicio WHERE id = v_ref) THEN 'suscripcion_servicio'
      WHEN EXISTS (SELECT 1 FROM pedidos               WHERE id = v_ref) THEN 'pedido'
      ELSE 'desconocido' END;
    UPDATE webhook_events SET resultado = 'desconocido',
      detalle = COALESCE(detalle,'') || ' · actuador: sujeto ' || v_que_es || ' — no aplicable por esta puerta'
     WHERE id = p_evento_id;
    RETURN jsonb_build_object('ok', true, 'aplicado', false,
      'motivo', 'sujeto_no_aplicable', 'sujeto', v_que_es, 'sujeto_id', v_ref);
  END IF;

$inject$ || ANCLA_COMPRA);
  IF position('sujeto_no_aplicable' in v_nuevo) = 0 THEN
    RAISE EXCEPTION 'ABORTA ④: la inyeccion no entro';
  END IF;

  EXECUTE v_nuevo;

  -- ═══ ⑤ EL DESPUÉS — el mismo evento, ya sin reventar ════════════════════
  UPDATE webhook_events SET resultado = 'recibido',
         detalle = 'arnes S103 · credencial=SERVER' WHERE id = v_ev_malo;
  v_r := public.aplicar_evento_de_pago(v_ev_malo);
  IF v_r->>'motivo' IS DISTINCT FROM 'sujeto_no_aplicable' THEN
    RAISE EXCEPTION 'ABORTA ⑤: esperaba sujeto_no_aplicable, dio %', v_r;
  END IF;
  IF v_r->>'sujeto' IS DISTINCT FROM 'desconocido' THEN
    RAISE EXCEPTION 'ABORTA ⑤: el rebote no nombro el sujeto — dio %', v_r->>'sujeto';
  END IF;
  IF (v_r->>'aplicado')::boolean THEN
    RAISE EXCEPTION 'ABORTA ⑤: 🔴 APLICO un sujeto no reconocido';
  END IF;
  RAISE NOTICE '⑤ DESPUES: el actuador CORRE (cura ①) y rebota «sujeto_no_aplicable» (cura ②)';

  -- ═══ ⑥ 🔴 CONTROL POSITIVO — que el guard no se coma a la compra ════════
  --     Sin este brazo, un actuador que rebotara TODO tambien pasaria ⑤.
  --     *Se mide que sabe decir que SI, no solo que sabe decir que no.*
  SELECT id INTO v_compra_ok FROM compras WHERE estado = 'pagada' LIMIT 1;
  IF v_compra_ok IS NULL THEN
    RAISE EXCEPTION 'ABORTA ⑥: no hay compra pagada para el control positivo — el brazo NO se corrio, y no medir no es aprobar';
  END IF;

  INSERT INTO webhook_events (proveedor, ambiente, transaction_id, payload,
                              stoken_valido, resultado, detalle)
  VALUES ('nuvei', 'sandbox', 'arnes-s103-bueno',
          jsonb_build_object('transaction', jsonb_build_object(
            'dev_reference', v_compra_ok::text, 'status','1',
            'amount','1.00', 'id','arnes-s103-bueno',
            'authorization_code','ARN103')),
          true, 'recibido', 'arnes S103 · credencial=SERVER')
  RETURNING id INTO v_ev_bueno;

  v_r := public.aplicar_evento_de_pago(v_ev_bueno);
  IF v_r->>'motivo' = 'sujeto_no_aplicable' THEN
    RAISE EXCEPTION 'ABORTA ⑥: el guard SE COMIO una compra real — sobre-dispara';
  END IF;
  --  La compra elegida ya esta pagada ⇒ `confirmar_pago_compra` devuelve
  --  duplicado y NO mueve un centavo. Es el control mas barato posible: prueba
  --  el camino sin ejercerlo sobre plata viva.
  RAISE NOTICE '⑥ CONTROL POSITIVO: una compra REAL atraviesa el guard → sujeto=% aplicado=%',
               COALESCE(v_r->>'sujeto','(ninguno)'), COALESCE(v_r->>'aplicado','(ninguno)');

  -- ═══ ⑦ LIMPIEZA Y RESIDUO ═══════════════════════════════════════════════
  DELETE FROM webhook_events WHERE id IN (v_ev_malo, v_ev_bueno);
  SELECT count(*) INTO v_residuo FROM webhook_events
   WHERE transaction_id IN ('arnes-s103-malo','arnes-s103-bueno');
  IF v_residuo <> 0 THEN
    RAISE EXCEPTION 'ABORTA ⑦: quedaron % fixtures sin borrar', v_residuo;
  END IF;

  RAISE NOTICE 'ARNES 7/7 VERDE — el actuador CORRE y VERIFICA el sujeto. Residuo 0.';
END $arnes$;
