/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · LA COMPUERTA DE DOCUMENTOS, EN LAS CUATRO PUERTAS
   ═══════════════════════════════════════════════════════════════════════════
   Hallazgo de C, y tenia razon: **`comprar_paquete_guarderia` no llamaba al
   gate.** `reservar_dia_guarderia` si; `reservar_dia_de_paquete_guarderia`
   tambien; el COMPRADOR no ⇒ le cobrabamos el paquete entero a una familia que
   no acepto las condiciones, para frenarla despues, con la plata ya tomada.
   *Es la peor forma de este defecto: cobra primero y rechaza despues.*

   🔴 EL CENSO AGRANDO EL HALLAZGO: son **DOS** las puertas sin compuerta, no
   una. `contratar_mensualidad_guarderia` tampoco la tenia — y es la mas cara,
   porque no toma un pago suelto sino un **MANDATO RECURRENTE**. Hoy no cobra;
   el dia que las tres claves de `app_config` enciendan el reloj, cobra sola
   todos los meses. *Un mandato firmado sin condiciones aceptadas se repite.*

   ☠️ DAÑO MEDIDO: **CERO.** `bonos(guarderia_dia)=0`,
   `guarderia_suscripciones=0`, `guarderia_aceptaciones=0`. Nadie compro nada
   todavia — el defecto es real y grave, y no cobro de mas ni una vez.

   ⚠️ Y UN TERCERO, QUE NO ES DE PLATA PERO DEJA A LA FAMILIA SIN CAMINO:
   `_guarderia_puede_reservar` devolvia el motivo en el vocabulario del ESTADO
   (`faltan`) y cada puerta lo traducia por su cuenta. La del dia suelto
   traducia bien; la del paquete lo pasaba crudo ⇒ emitia `faltan`, **un codigo
   que ningun wrapper conoce**, y la familia veia el mensaje generico sin saber
   que le faltaba aceptar los terminos. La traduccion se muda a la FUENTE: dos
   puertas que traducen no pueden mantenerse iguales; una fuente que traduce,
   si.

   📋 LO QUE ESTA MIGRACION **NO** CURA — y es lo unico que queda entre la
   familia y la compra: **`guarderia_documentos` tiene CERO filas.** El
   perimetro funciona; falta el CONTENIDO, y el contenido es texto legal:
   ninguna pista lo redacta (regla del founder, vigente). Ficha **D-977**.

   ⚖️ VEDA 76(g): **NO RIGE** — DDL sin backfill, sin anclas.
   ↩️ REVERSA escrita ANTES:
      `docs/relevamientos/S107-A-REVERSA-20260831020000-gate-en-las-cuatro-puertas.sql`
      (declara que revertir REABRE el cobro sin compuerta, y que no devuelve
       plata que se haya tomado en el medio).
   ═══════════════════════════════════════════════════════════════════════════ */

CREATE OR REPLACE FUNCTION public._guarderia_puede_reservar(p_mascota_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_san jsonb; v_doc jsonb; v_familia uuid; v_duro boolean;
BEGIN
  SELECT COALESCE((SELECT valor::boolean FROM app_config
                    WHERE clave = 'guarderia_gate_sanitario_duro'), false)
    INTO v_duro;

  v_san := public.evaluar_requisitos_guarderia(p_mascota_id);
  /* 🔴 SÓLO FRENA SI EL FLAG ESTÁ ENCENDIDO. Con el flag apagado el resultado
     **igual viaja** —en `sanitario`— para que el semáforo diga la verdad
     completa: *informar no es lo mismo que callar.* */
  IF v_duro AND v_san->>'estado' <> 'al_dia' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'requisitos_sanitarios',
                              'faltantes', v_san->'faltantes');
  END IF;

  SELECT m.familia_id INTO v_familia FROM mascotas m WHERE m.id = p_mascota_id;
  v_doc := public.evaluar_documentos_guarderia(v_familia);
  IF v_doc->>'estado' <> 'al_dia' THEN
    /* 🔴 EL MOTIVO SE NORMALIZA ACA, EN LA FUENTE, Y NO EN CADA PUERTA.
       `evaluar_documentos_guarderia` habla el vocabulario del ESTADO de la
       familia (`faltan`); las puertas hablan el del REBOTE
       (`documentos_sin_aceptar`). Son dos vocabularios legitimamente
       distintos — y traducir entre ellos EN CADA CONSUMIDOR es lo que dejo a
       `reservar_dia_de_paquete_guarderia` emitiendo `faltan`, un codigo que
       **ningun wrapper conoce**: la familia veia el mensaje generico y se
       quedaba sin camino. Traducido en la fuente, las dos puertas no pueden
       divergir. */
    RETURN jsonb_build_object('puede', false,
                              'motivo', CASE v_doc->>'estado'
                                          WHEN 'faltan' THEN 'documentos_sin_aceptar'
                                          ELSE v_doc->>'estado' END,
                              'faltantes', v_doc->'faltantes', 'sanitario', v_san);
  END IF;

  RETURN jsonb_build_object('puede', true, 'sanitario', v_san,
                            'gate_sanitario_duro', v_duro);
END $function$
;

CREATE OR REPLACE FUNCTION public.reservar_dia_guarderia(p_prestador_id uuid, p_mascota_id uuid, p_fecha date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ps record; v_gate jsonb; v_cupo jsonb;
  v_cita uuid; v_estadia uuid; v_espacio uuid;
  v_user uuid := auth.uid(); v_direccion jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'guarderia_dia') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  IF p_fecha < public.hoy_local() THEN RAISE EXCEPTION 'fecha_pasada' USING ERRCODE = '22023'; END IF;
  IF p_fecha = public.hoy_local() THEN RAISE EXCEPTION 'reserva_mismo_dia' USING ERRCODE = '22023'; END IF;
  IF NOT public._guarderia_dia_operativo(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'dia_no_operativo' USING ERRCODE = '22023';
  END IF;

  v_gate := public._guarderia_puede_reservar(p_mascota_id);
  IF (v_gate->>'puede')::boolean IS NOT TRUE THEN
    /* El motivo YA viene normalizado por el gate — esta puerta lo levanta tal
       cual. *La traduccion que vivia aca era correcta y la de la puerta del
       paquete no: por eso la traduccion se mudo a la fuente.* */
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = v_gate->>'motivo';
  END IF;

  SELECT ps.id, ps.precio, ps.duracion_minutos, pr.country_code INTO v_ps
    FROM prestador_servicios ps JOIN prestadores pr ON pr.id = ps.prestador_id
   WHERE ps.prestador_id = p_prestador_id AND ps.tipo_servicio = 'guarderia_dia'
     AND ps.activo AND ps.reservable;
  IF v_ps.id IS NULL THEN RAISE EXCEPTION 'guarderia_no_disponible' USING ERRCODE = '22023'; END IF;
  IF v_ps.precio IS NULL THEN
    -- el día suelto puede no ofrecerse (firma 29-ago): entonces no se reserva por día
    RAISE EXCEPTION 'no_ofrece_dia_suelto' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_prestador_id::text || p_fecha::text));
  v_cupo := public.cupo_guarderia_del_dia(p_prestador_id, p_fecha);
  IF (v_cupo->>'disponible')::int <= 0 THEN RAISE EXCEPTION 'sin_cupo' USING ERRCODE = '22023'; END IF;

  SELECT e.id INTO v_espacio FROM guarderia_espacios e
   WHERE e.prestador_id = p_prestador_id AND e.activo ORDER BY e.created_at LIMIT 1;
  v_direccion := _direccion_hogar_snapshot(v_user);

  INSERT INTO evento_cita_servicio (
    user_id, mascota_id, prestador_id, tipo_servicio, fecha, precio,
    duracion_minutos, estado, estado_reserva, expira_en, modalidad,
    direccion_snapshot, country_code
  ) VALUES (
    v_user, p_mascota_id, p_prestador_id, 'guarderia_dia', p_fecha, v_ps.precio,
    v_ps.duracion_minutos, 'pendiente', 'pendiente_pago',
    now() + interval '15 minutes', 'presencial', v_direccion,
    COALESCE(v_ps.country_code, 'EC')
  ) RETURNING id INTO v_cita;

  INSERT INTO guarderia_estadias (cita_id, espacio_id)
    VALUES (v_cita, v_espacio) RETURNING id INTO v_estadia;

  RETURN jsonb_build_object('ok', true, 'cita_id', v_cita, 'estadia_id', v_estadia,
                            'precio', v_ps.precio, 'expira_en', now() + interval '15 minutes');
END $function$
;

CREATE OR REPLACE FUNCTION public.comprar_paquete_guarderia(p_prestador_id uuid, p_tamano integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid(); v_familia uuid; v_country text;
  v_serv record; v_paq record; v_cuenta record; v_fee uuid;
  v_hoy date := public.hoy_local(); v_vence date;
  v_total numeric(14,2); v_bono uuid; v_roll record; v_doc jsonb;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_familia FROM familia_miembro fm
   WHERE fm.user_id = v_auth AND fm.hasta IS NULL LIMIT 1;
  IF v_familia IS NULL THEN RAISE EXCEPTION 'sin_familia' USING ERRCODE='22023'; END IF;

  /* ═══ LA COMPUERTA, ANTES DE TODO LO DEMAS ═══════════════════════════════
     🔴 Este chequeo **no estaba**, y es la peor forma del defecto: la puerta
     de la RESERVA si gateaba, la de la COMPRA no ⇒ le cobrabamos el paquete
     entero a una familia que no acepto las condiciones, y recien al ir a usar
     su primer dia la frenabamos, con la plata ya tomada. *Cobrar primero y
     rechazar despues.*

     ⚠️ Se llama a `evaluar_documentos_guarderia` (la mitad de FAMILIA) y **no**
     a `_guarderia_puede_reservar` (que ademas exige mascota): el paquete es
     DEL HOGAR y nace sin mascota —se elige al reservar—, asi que no hay animal
     contra el cual evaluar lo sanitario. Forzar uno seria evaluar los
     requisitos de una mascota arbitraria, y le impediria a una familia con dos
     perros comprar por el que si esta al dia. **Lo sanitario se queda donde el
     sujeto existe: en la puerta del DIA.**

     Va antes del lock de rollover a proposito: se rebota sin haber tocado
     ninguna fila. */
  v_doc := public.evaluar_documentos_guarderia(v_familia);
  IF v_doc->>'estado' <> 'al_dia' THEN
    RAISE EXCEPTION USING ERRCODE='22023',
      MESSAGE = CASE v_doc->>'estado'
                  WHEN 'faltan' THEN 'documentos_sin_aceptar'
                  ELSE v_doc->>'estado' END;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id=p_prestador_id AND pr.estado='activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE='22023';
  END IF;

  SELECT ps.id, ps.tipo_servicio INTO v_serv
    FROM prestador_servicios ps
   WHERE ps.prestador_id=p_prestador_id AND ps.tipo_servicio='guarderia_dia' AND ps.activo;
  IF v_serv.id IS NULL THEN RAISE EXCEPTION 'guarderia_no_disponible' USING ERRCODE='22023'; END IF;

  /* 🔴 EL TAMAÑO SE VALIDA CONTRA LA TABLA, no contra un `IN (5,10,15)`: los
     presets son DATO del prestador. Un hardcode acá le impediría ofrecer 20 el
     día que la mesa lo firme, y nadie sabría por qué. */
  SELECT gp.tamano, gp.precio INTO v_paq
    FROM guarderia_paquetes gp
   WHERE gp.prestador_id=p_prestador_id AND gp.tamano=p_tamano AND gp.activo;
  IF v_paq.tamano IS NULL THEN RAISE EXCEPTION 'paquete_no_disponible' USING ERRCODE='22023'; END IF;
  IF v_paq.precio IS NULL OR v_paq.precio <= 0 THEN
    RAISE EXCEPTION 'paquete_no_disponible' USING ERRCODE='22023';
  END IF;

  -- PRE-VALIDACIÓN del motor financiero ANTES de cobrar (patrón S54).
  SELECT cc.id, cc.estado INTO v_cuenta
    FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id=pr.cuenta_comercial_id
   WHERE pr.id=p_prestador_id;
  IF v_cuenta.id IS NULL THEN RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE='22023'; END IF;
  IF v_cuenta.estado <> 'activa' THEN RAISE EXCEPTION 'cuenta_no_activa: %', v_cuenta.estado USING ERRCODE='22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cuenta_roles cr
                  WHERE cr.cuenta_comercial_id=v_cuenta.id
                    AND cr.tipo_actor='prestador_servicios' AND cr.estado='activo') THEN
    RAISE EXCEPTION 'cuenta_sin_rol_activo' USING ERRCODE='22023';
  END IF;
  SELECT COALESCE(f.country_code, pr.country_code, 'EC') INTO v_country
    FROM familia f, prestadores pr WHERE f.id=v_familia AND pr.id=p_prestador_id;
  SELECT rfa.fee_config_id INTO v_fee FROM _resolver_fee_aplicable(
    v_cuenta.id, 'prestador_servicios'::tipo_actor_enum, v_country,
    'transaccional'::revenue_stream_enum, 'cita', NULL, now()) rfa;
  IF v_fee IS NULL THEN RAISE EXCEPTION 'sin_fee_config' USING ERRCODE='22023'; END IF;

  v_vence := (v_hoy + interval '1 month')::date;
  v_total := round(v_paq.precio, 2);   -- el precio del paquete es TOTAL, no unitario

  -- ROLLOVER (P16e), por HOGAR: lock primero, conteo después.
  PERFORM 1 FROM bonos b
   WHERE b.familia_id=v_familia AND b.prestador_id=p_prestador_id
     AND b.tipo_servicio='guarderia_dia' AND b.estado='activo' AND b.estado_pago='pagado'
     AND b.unidades_usadas < b.unidades_total AND b.fecha_vencimiento >= v_hoy
   FOR UPDATE;
  SELECT count(*)::int AS bonos, COALESCE(sum(unidades_total-unidades_usadas),0)::int AS dias
    INTO v_roll FROM bonos b
   WHERE b.familia_id=v_familia AND b.prestador_id=p_prestador_id
     AND b.tipo_servicio='guarderia_dia' AND b.estado='activo' AND b.estado_pago='pagado'
     AND b.unidades_usadas < b.unidades_total AND b.fecha_vencimiento >= v_hoy;

  INSERT INTO bonos (
    prestador_id, user_id, familia_id, mascota_id, tipo_servicio, descripcion,
    unidades_total, unidades_usadas, duracion_minutos,
    precio_total, precio_por_unidad, fecha_compra, fecha_vencimiento,
    estado, estado_pago, country_code, prestador_servicio_id, pago_metadata
  ) VALUES (
    p_prestador_id, v_auth, v_familia, NULL, 'guarderia_dia',
    'Paquete de ' || p_tamano || ' días de guardería (vigencia mensual, del hogar)',
    p_tamano, 0,
    /* 🔴 `duracion_minutos` NULL a propósito: **una estadía no dura minutos, dura
       un DÍA.** Poner la jornada acá lo haría parecer un slot de agenda. */
    NULL,
    v_total, round(v_paq.precio / p_tamano, 2),
    v_hoy, v_vence, 'activo', 'pagado',
    v_country, v_serv.id,
    jsonb_build_object('pagado_en', now(), 'pago_simulado', true,
                       'dias_rollover', v_roll.dias)
  ) RETURNING id INTO v_bono;

  IF v_roll.bonos > 0 THEN
    UPDATE bonos b SET fecha_vencimiento = v_vence,
      pago_metadata = b.pago_metadata || jsonb_build_object('rollover_extendido_por', v_bono, 'rollover_en', now())
     WHERE b.familia_id=v_familia AND b.prestador_id=p_prestador_id
       AND b.tipo_servicio='guarderia_dia' AND b.estado='activo' AND b.estado_pago='pagado'
       AND b.unidades_usadas < b.unidades_total AND b.id <> v_bono;
  END IF;

  RETURN jsonb_build_object('ok', true, 'bono_id', v_bono, 'dias', p_tamano,
    'total', v_total, 'por_dia', round(v_paq.precio / p_tamano, 2),
    'vence_el', v_vence, 'dias_rollover', v_roll.dias,
    'saldo_total', p_tamano + v_roll.dias, 'pagado_en', now());
END $function$
;

CREATE OR REPLACE FUNCTION public.contratar_mensualidad_guarderia(p_prestador_id uuid, p_tarjeta_id uuid, p_mascota_id uuid DEFAULT NULL::uuid, p_monto_esperado numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid(); v_fam uuid; v_serv record; v_id uuid; v_dueno uuid; v_doc jsonb;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm
   WHERE fm.user_id=v_auth AND fm.hasta IS NULL LIMIT 1;
  IF v_fam IS NULL THEN RAISE EXCEPTION 'sin_familia' USING ERRCODE='22023'; END IF;

  /* ═══ LA MISMA COMPUERTA — y C no llego a ver esta puerta ════════════════
     La ficha llego por el comprador de paquete; el censo mostro que
     **son DOS las puertas sin gate**, y esta es la mas cara: no toma un pago,
     toma un MANDATO RECURRENTE. Hoy no cobra (`cobrada:false`), pero el dia
     que las tres claves de `app_config` enciendan el reloj, cobra sola todos
     los meses. *Un mandato que se firma sin condiciones aceptadas es peor que
     un cobro suelto: se repite.* */
  v_doc := public.evaluar_documentos_guarderia(v_fam);
  IF v_doc->>'estado' <> 'al_dia' THEN
    RAISE EXCEPTION USING ERRCODE='22023',
      MESSAGE = CASE v_doc->>'estado'
                  WHEN 'faltan' THEN 'documentos_sin_aceptar'
                  ELSE v_doc->>'estado' END;
  END IF;

  /* 🔴 LA TARJETA TIENE QUE SER DE QUIEN AUTORIZA. *Autorizar un cobro
     recurrente sobre la tarjeta de otro es exactamente lo que la raíz de
     autorización existe para impedir.* */
  SELECT t.user_id INTO v_dueno FROM tarjetas_guardadas t WHERE t.id = p_tarjeta_id;
  IF v_dueno IS NULL THEN RAISE EXCEPTION 'tarjeta_no_existe' USING ERRCODE='22023'; END IF;
  IF v_dueno <> v_auth THEN RAISE EXCEPTION 'tarjeta_de_otra_persona' USING ERRCODE='42501'; END IF;

  SELECT ps.id, ps.precio_mensual_plan INTO v_serv
    FROM prestador_servicios ps
   WHERE ps.prestador_id=p_prestador_id AND ps.tipo_servicio='guarderia_dia' AND ps.activo;
  IF v_serv.id IS NULL THEN RAISE EXCEPTION 'guarderia_no_disponible' USING ERRCODE='22023'; END IF;
  IF v_serv.precio_mensual_plan IS NULL OR v_serv.precio_mensual_plan <= 0 THEN
    RAISE EXCEPTION 'no_ofrece_mensualidad' USING ERRCODE='22023';
  END IF;

  INSERT INTO guarderia_suscripciones (
    familia_id, prestador_id, prestador_servicio_id, mascota_id,
    tarjeta_id, autorizada_por, monto_esperado, precio_mensual)
  VALUES (v_fam, p_prestador_id, v_serv.id, p_mascota_id,
          p_tarjeta_id, v_auth,
          /* El techo del mandato: lo que se pida, o el precio de hoy. */
          COALESCE(p_monto_esperado, v_serv.precio_mensual_plan),
          v_serv.precio_mensual_plan)
  RETURNING id INTO v_id;

  /* ⚠️ CERO COBRO Y CERO CUPO: el motor de cobro y los días del plan **no
     existen todavía** (decisión de mesa abierta). Esto registra el MANDATO. */
  RETURN jsonb_build_object('ok', true, 'suscripcion_id', v_id,
    'precio_mensual', v_serv.precio_mensual_plan,
    'monto_esperado', COALESCE(p_monto_esperado, v_serv.precio_mensual_plan),
    'cobrada', false,
    'nota', 'mandato registrado — el cobro espera la firma de los dias del plan');
END $function$
;

/* ═══════════════════════════════════════════════════════════════════════════
   CINTURON CON DISCRIMINADOR — y el discriminador es lo que lo hace un arnes
   y no una afirmacion.
   ───────────────────────────────────────────────────────────────────────────
   🔴 «REBOTA» NO ES UNA MEDICION: una compuerta que siempre dice que no
   tambien rebota. El arnes recorre los **TRES ESTADOS** de los documentos y
   exige **TRES RESPUESTAS DISTINTAS** en cada una de las dos puertas:

     0 · sin documentos cargados  → `documentos_no_disponibles`  (es NUESTRO)
     1 · cargados y sin aceptar   → `documentos_sin_aceptar`     (es de ELLA)
     2 · aceptados                → PASA

   ⚠️ Y ESTA ES LA LECCION QUE DEJA (L-438): el arnes que ya existia
   —`S107-A-ARNES-paquete-guarderia.sql`— **sembraba el documento y lo aceptaba
   ANTES de comprar**, o sea preparaba la precondicion del gate que venia a
   vigilar ⇒ jamas pudo descubrir que el gate faltaba. Salio verde todas las
   veces. *Un arnes que cumple la precondicion de una compuerta no puede ver
   que la compuerta no existe: prueba el camino feliz y es ciego a la puerta.*

   Escribe en SUBTRANSACCION QUE SE DESHACE SOLA (L-406); la DDL queda afuera.
   ═══════════════════════════════════════════════════════════════════════════ */
DO $cinturon$
DECLARE
  v_rol text := current_user;
  v_user uuid; v_fam uuid; v_prest uuid; v_tam int; v_tarj uuid;
  v_r text; v_out text := '';
  v_docs0 int; v_acep0 int; v_bonos0 int; v_susc0 int;
  v_docs1 int; v_acep1 int; v_bonos1 int; v_susc1 int;
  v_ok int := 0;

BEGIN
  SELECT count(*) INTO v_docs0  FROM guarderia_documentos;
  SELECT count(*) INTO v_acep0  FROM guarderia_aceptaciones;
  SELECT count(*) INTO v_bonos0 FROM bonos WHERE tipo_servicio='guarderia_dia';
  SELECT count(*) INTO v_susc0  FROM guarderia_suscripciones;

  SELECT ps.prestador_id INTO v_prest FROM prestador_servicios ps
   WHERE ps.tipo_servicio='guarderia_dia' AND ps.activo
     AND ps.precio_mensual_plan > 0 LIMIT 1;
  SELECT gp.tamano INTO v_tam FROM guarderia_paquetes gp
   WHERE gp.prestador_id=v_prest AND gp.activo ORDER BY gp.tamano LIMIT 1;
  SELECT c.user_id INTO v_user FROM evento_cita_servicio c JOIN mascotas m ON m.id=c.mascota_id
   WHERE m.especie IN ('perro','gato') AND c.user_id IS NOT NULL LIMIT 1;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm
   WHERE fm.user_id=v_user AND fm.hasta IS NULL LIMIT 1;
  SELECT t.id INTO v_tarj FROM tarjetas_guardadas t WHERE t.user_id=v_user LIMIT 1;

  IF v_prest IS NULL OR v_tam IS NULL OR v_fam IS NULL OR v_tarj IS NULL THEN
    RAISE EXCEPTION 'CINTURON: falta fixture vivo (prest=% tam=% fam=% tarj=%) — el arnes NO midio nada',
                    v_prest, v_tam, v_fam, v_tarj;
  END IF;
  IF v_docs0 <> 0 THEN
    RAISE EXCEPTION 'CINTURON: el estado 0 exige CERO documentos y hay % — el arnes no puede distinguir', v_docs0;
  END IF;

  BEGIN  -- ═══ subtransaccion que se deshace sola ═══

    /* ── ESTADO 0 · sin documentos ────────────────────────────────────── */
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_user, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    BEGIN PERFORM public.comprar_paquete_guarderia(v_prest, v_tam); v_r := 'PASO';
    EXCEPTION WHEN OTHERS THEN v_r := SQLERRM; END;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    v_out := v_out || format(E'\n  compra   estado 0 -> %s', v_r);
    IF v_r = 'documentos_no_disponibles' THEN v_ok := v_ok + 1; END IF;

    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_user, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    BEGIN PERFORM public.contratar_mensualidad_guarderia(v_prest, v_tarj, NULL, NULL); v_r := 'PASO';
    EXCEPTION WHEN OTHERS THEN v_r := SQLERRM; END;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    v_out := v_out || format(E'\n  mensual  estado 0 -> %s', v_r);
    IF v_r = 'documentos_no_disponibles' THEN v_ok := v_ok + 1; END IF;

    /* ── ESTADO 1 · cargados, sin aceptar ─────────────────────────────── */
    /* ⚠️ El codigo sale del CHECK vivo — un vocabulario cerrado NO se amplia
       para que un arnes pase. El contenido dice que no es texto legal:
       *ninguna pista redacta legal, ni en un fixture que nadie va a leer.* */
    INSERT INTO guarderia_documentos (codigo, version, contenido, vigente_desde, activo)
    VALUES ('contrato_custodia', 999, '[FIXTURE DE ARNES — NO ES TEXTO LEGAL NI SE PUBLICA]', now(), true);

    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_user, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    BEGIN PERFORM public.comprar_paquete_guarderia(v_prest, v_tam); v_r := 'PASO';
    EXCEPTION WHEN OTHERS THEN v_r := SQLERRM; END;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    v_out := v_out || format(E'\n  compra   estado 1 -> %s', v_r);
    IF v_r = 'documentos_sin_aceptar' THEN v_ok := v_ok + 1; END IF;

    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_user, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    BEGIN PERFORM public.contratar_mensualidad_guarderia(v_prest, v_tarj, NULL, NULL); v_r := 'PASO';
    EXCEPTION WHEN OTHERS THEN v_r := SQLERRM; END;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    v_out := v_out || format(E'\n  mensual  estado 1 -> %s', v_r);
    IF v_r = 'documentos_sin_aceptar' THEN v_ok := v_ok + 1; END IF;

    /* ── ESTADO 2 · aceptados ─────────────────────────────────────────── */
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_user, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    PERFORM public.aceptar_documentos_guarderia(
      v_fam, jsonb_build_array(jsonb_build_object('codigo','contrato_custodia','version',999)),
      100, 'USD', '[]'::jsonb, NULL, false);

    BEGIN PERFORM public.comprar_paquete_guarderia(v_prest, v_tam); v_r := 'PASO';
    EXCEPTION WHEN OTHERS THEN v_r := SQLERRM; END;
    v_out := v_out || format(E'\n  compra   estado 2 -> %s', v_r);
    IF v_r = 'PASO' THEN v_ok := v_ok + 1; END IF;

    BEGIN PERFORM public.contratar_mensualidad_guarderia(v_prest, v_tarj, NULL, NULL); v_r := 'PASO';
    EXCEPTION WHEN OTHERS THEN v_r := SQLERRM; END;
    v_out := v_out || format(E'\n  mensual  estado 2 -> %s', v_r);
    IF v_r = 'PASO' THEN v_ok := v_ok + 1; END IF;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);

    RAISE EXCEPTION 'CINTURON_DESHACER';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF SQLERRM <> 'CINTURON_DESHACER' THEN RAISE; END IF;
  END;

  /* ── RESIDUO: la subtransaccion se deshizo de verdad ──────────────────── */
  SELECT count(*) INTO v_docs1  FROM guarderia_documentos;
  SELECT count(*) INTO v_acep1  FROM guarderia_aceptaciones;
  SELECT count(*) INTO v_bonos1 FROM bonos WHERE tipo_servicio='guarderia_dia';
  SELECT count(*) INTO v_susc1  FROM guarderia_suscripciones;

  RAISE NOTICE E'\n═══ CINTURON · la compuerta en las cuatro puertas ═══%\n\n  6 de 6 esperados: %  ·  residuo docs %→% acep %→% bonos %→% susc %→%',
    v_out, v_ok, v_docs0, v_docs1, v_acep0, v_acep1, v_bonos0, v_bonos1, v_susc0, v_susc1;

  IF v_ok <> 6 THEN
    RAISE EXCEPTION 'CINTURON ROJO: %/6 respuestas esperadas. %', v_ok, v_out;
  END IF;
  IF (v_docs1,v_acep1,v_bonos1,v_susc1) IS DISTINCT FROM (v_docs0,v_acep0,v_bonos0,v_susc0) THEN
    RAISE EXCEPTION 'CINTURON ROJO: el arnes dejo residuo';
  END IF;
END $cinturon$;

/* ═══════════════════════════════════════════════════════════════════════════
   L-140 · LA AUDIENCIA SE MIDE, NO SE SUPONE
   ───────────────────────────────────────────────────────────────────────────
   `CREATE OR REPLACE` conserva el ACL — pero eso es una creencia hasta que se
   pregunta. Y por **L-436**: un cinturon que chequea UNA audiencia certifica
   UNA audiencia ⇒ se preguntan **las dos**, `anon` y `authenticated`, en las
   cuatro funciones.
   ═══════════════════════════════════════════════════════════════════════════ */
DO $acl$
DECLARE r record; v_mal text := '';
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS firma,
           has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon_puede,
           has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_puede
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname IN
       ('_guarderia_puede_reservar','reservar_dia_guarderia',
        'comprar_paquete_guarderia','contratar_mensualidad_guarderia')
  LOOP
    IF r.anon_puede THEN v_mal := v_mal || format(E'\n  🔴 anon PUEDE ejecutar %s', r.firma); END IF;
    IF NOT r.auth_puede THEN v_mal := v_mal || format(E'\n  🔴 authenticated NO puede ejecutar %s', r.firma); END IF;
    RAISE NOTICE '  ACL % · anon=% authenticated=%', r.firma, r.anon_puede, r.auth_puede;
  END LOOP;
  IF v_mal <> '' THEN RAISE EXCEPTION 'ACL ROJO:%', v_mal; END IF;
END $acl$;
