/* ═══════════════════════════════════════════════════════════════════════════
   ARNÉS · EL CAMINO DEL PAQUETE, DE PUNTA A PUNTA — y se deshace
   ═══════════════════════════════════════════════════════════════════════════
   `20260830120000` se aplicó **sin cinturón**, y toca PLATA (el CHECK de bonos,
   el comprador y la reserva contra saldo). *Una migración de plata sin arnés es
   una afirmación sin medición* — el arnés existe acá y se corre.
   ═══════════════════════════════════════════════════════════════════════════ */
BEGIN;
CREATE TEMP TABLE _out (que text, valor text) ON COMMIT DROP;

DO $arnes$
DECLARE
  v_rol text := current_user;
  v_masc uuid; v_user uuid; v_prest uuid; v_fam uuid;
  v_r jsonb; v_res jsonb; v_bono uuid; v_cita uuid;
  v_saldo0 int; v_saldo1 int; v_eco0 int; v_eco1 int;
  v_estado text; v_reserva text; v_bono_en_cita uuid; v_precio numeric;
  /* El próximo día que el lugar OPERA — no «mañana»: Aurora abre L-V y el
     arnés no puede depender de qué día se corra. */
  v_manana date;
BEGIN
  SELECT prestador_id INTO v_prest FROM prestador_servicios WHERE tipo_servicio='guarderia_dia' LIMIT 1;
  SELECT c.mascota_id, c.user_id INTO v_masc, v_user
    FROM evento_cita_servicio c JOIN mascotas m ON m.id=c.mascota_id
   WHERE m.especie IN ('perro','gato') AND c.user_id IS NOT NULL LIMIT 1;
  SELECT familia_id INTO v_fam FROM familia_miembro WHERE user_id=v_user AND hasta IS NULL LIMIT 1;

  SELECT min(d)::date INTO v_manana
    FROM generate_series(public.hoy_local()+1, public.hoy_local()+9, '1 day') d
   WHERE public._guarderia_dia_operativo(v_prest, d::date);

  /* 🔴 LA COMPUERTA DE DOCUMENTOS ES REAL Y REBOTA: sin documentos cargados el
     motor devuelve `documentos_no_disponibles` — fail-closed correcto. El arnés
     carga UN fixture y lo acepta, **dentro del ROLLBACK**.
     ⚠️ Su contenido dice que NO es texto legal: *ninguna pista redacta legal, ni
     siquiera en un fixture que nadie va a leer.* */
  /* ⚠️ El código sale del CHECK vivo — **el vocabulario cerrado NO se amplía
     para que un arnés pase**. Se usa uno de los seis que la casa ya declaró. */
  INSERT INTO guarderia_documentos (codigo, version, contenido, vigente_desde, activo)
  VALUES ('contrato_custodia', 999, '[FIXTURE DE ARNES — NO ES TEXTO LEGAL NI SE PUBLICA]', now(), true);

  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_user, 'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  PERFORM public.aceptar_documentos_guarderia(
    v_fam, jsonb_build_array(jsonb_build_object('codigo','contrato_custodia','version',999)),
    100, 'USD', '[]'::jsonb, NULL, false);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  SELECT count(*) INTO v_eco0 FROM eventos_economicos;

  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_user, 'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  v_r := public.comprar_paquete_guarderia(v_prest, 5);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  v_bono := (v_r->>'bono_id')::uuid;
  v_saldo0 := (v_r->>'saldo_total')::int;
  IF v_bono IS NULL OR v_saldo0 < 5 THEN
    RAISE EXCEPTION 'ARNES: la compra no dejo bono o saldo (%)', v_r;
  END IF;

  /* La reserva NO lleva prestador: el lugar sale del bono. */
  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_user, 'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  v_res := public.reservar_dia_de_paquete_guarderia(v_bono, v_manana, v_masc);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  v_cita := (v_res->>'cita_id')::uuid;
  v_saldo1 := (v_res->>'saldo_restante')::int;

  SELECT estado, estado_reserva, bono_id, precio
    INTO v_estado, v_reserva, v_bono_en_cita, v_precio
    FROM evento_cita_servicio WHERE id=v_cita;

  SELECT count(*) INTO v_eco1 FROM eventos_economicos;

  IF v_estado <> 'confirmada' OR v_reserva <> 'pagada' THEN
    RAISE EXCEPTION 'ARNES: la cita nacio % / %, esperaba confirmada/pagada', v_estado, v_reserva;
  END IF;
  IF v_bono_en_cita IS DISTINCT FROM v_bono THEN
    RAISE EXCEPTION 'ARNES: la cita no quedo atada al bono';
  END IF;
  IF v_saldo1 <> v_saldo0 - 1 THEN
    RAISE EXCEPTION 'ARNES: el saldo paso de % a %, esperaba %', v_saldo0, v_saldo1, v_saldo0-1;
  END IF;
  /* 🔴 EL DISCRIMINADOR QUE IMPORTA: agendar un día de paquete NO TOCA PLATA.
     El desglose se congeló al comprar. Si acá naciera un evento económico,
     estaríamos cobrando dos veces el mismo día. */
  IF v_eco1 <> v_eco0 THEN
    RAISE EXCEPTION 'ARNES: agendar creo % evento(s) economico(s) — deberia ser CERO', v_eco1-v_eco0;
  END IF;

  INSERT INTO _out VALUES
    ('compra: saldo tras comprar 5', v_saldo0::text),
    ('reserva: saldo tras 1 dia',    v_saldo1::text),
    ('la cita nacio',                v_estado||' / '||v_reserva||'  · atada al bono: si'),
    ('precio congelado en la cita',  coalesce(v_precio::text,'NULL')||'  (por_dia del paquete)'),
    ('eventos economicos creados',   (v_eco1-v_eco0)::text||'  ← CERO: el desglose se congelo al comprar'),
    ('el lugar lo puso',             'el BONO — la reserva no recibe prestador');
END
$arnes$;

SELECT que, valor FROM _out;
ROLLBACK;
