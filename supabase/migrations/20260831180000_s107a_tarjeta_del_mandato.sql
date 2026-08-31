/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · LA TARJETA DEL MANDATO — dos distinciones que eran nuestras
   ═══════════════════════════════════════════════════════════════════════════
   🟢 Firma de mesa (31-ago): **«no inventes distinciones que el proveedor no
   te da»** — y antes de ampliar vocabulario, medir qué devuelve realmente el
   riel de pagos.

   ── LO MEDIDO, y separa tres cosas que venían juntas ──────────────────────

   ① **VENCIDA → era HUECO NUESTRO, y se cierra acá.**
      `tarjetas_guardadas.expira_mes` y `expira_anio` **son columnas nuestras y
      están pobladas** (2 de 2 vivas). *No hace falta preguntarle nada al
      proveedor para saber que una tarjeta venció.*

   ② **NO GUARDADA → otro hueco nuestro, y más grave de lo que se pedía.**
      El `estado` es `guardada|rechazada|abandonada` y **esta puerta no lo
      miraba**: se podía firmar un **mandato de cobro recurrente** sobre una
      tarjeta `rechazada`. *Nadie lo había pedido — apareció al medir.*

   ③ **«NO VERIFICADA» NO EXISTE.** No es un estado de la tabla ni del
      proveedor: una tarjeta `guardada` **ya pasó el alta 3DS**. **Se dice que
      no existe en vez de inventarla** — que es exactamente lo que la firma
      prohíbe.

   🔒 **Y LA QUE SÍ ES DEL PROVEEDOR SIGUE BLOQUEADA, con ficha:** *por qué*
   rechazó viaja en el crudo (`err.type`, `err.description`, `tx.message`,
   `tx.status_detail`) y **`pagos-cobro` lo aplana a PROSA** en
   `motivo_rechazo` — 400 caracteres de texto libre, útil para diagnosticar e
   inservible para decidir una voz. **Es `D-867`, viva y bloqueada por la tabla
   de códigos de Erick**: sin saber qué significa `31` no se puede mapear, y
   *mapear por parecido sería el defecto que ese censo vino a medir.*

   > **Mientras `D-867` siga abierta, la pantalla dice UNA sola cosa honesta
   > sobre un rechazo del banco. Eso es un LÍMITE declarado, no una omisión.**

   ⚖️ VEDA 76(g): **NO RIGE** — reemplazo de cuerpo, sin backfill.
   ↩️ REVERSA escrita ANTES:
      `docs/relevamientos/S107-A-REVERSA-20260831180000-tarjeta-del-mandato.sql`
   ═══════════════════════════════════════════════════════════════════════════ */

CREATE OR REPLACE FUNCTION public.contratar_mensualidad_guarderia(p_prestador_id uuid, p_tarjeta_id uuid, p_mascota_id uuid DEFAULT NULL::uuid, p_monto_esperado numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid(); v_fam uuid; v_serv record; v_id uuid; v_dueno uuid; v_doc jsonb;
  v_tarj_estado text; v_exp_mes smallint; v_exp_anio smallint;
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
  SELECT t.user_id, t.estado, t.expira_mes, t.expira_anio
    INTO v_dueno, v_tarj_estado, v_exp_mes, v_exp_anio
    FROM tarjetas_guardadas t WHERE t.id = p_tarjeta_id;
  IF v_dueno IS NULL THEN RAISE EXCEPTION 'tarjeta_no_existe' USING ERRCODE='22023'; END IF;
  IF v_dueno <> v_auth THEN RAISE EXCEPTION 'tarjeta_de_otra_persona' USING ERRCODE='42501'; END IF;

  /* ═══ LAS DOS DISTINCIONES QUE NO NECESITAN AL PROVEEDOR ═════════════════
     🟢 Firma de mesa (31-ago): *«no inventes distinciones que el proveedor no
     te da»*. Medido — de las tres que la pantalla quería, **dos son NUESTRAS y
     una no existe**:

     · **VENCIDA** → `expira_mes`/`expira_anio` viven en NUESTRA tabla y están
       poblados. **No hace falta preguntarle a nadie.** Era hueco propio.
     · **NO GUARDADA** → el `estado` es `guardada|rechazada|abandonada`, y esta
       puerta **no lo miraba**: se podía firmar un mandato recurrente sobre una
       tarjeta `rechazada`. *Hueco propio también.*
     · «no verificada» **NO EXISTE** — no es un estado de la tabla ni del
       proveedor: una `guardada` ya pasó el alta 3DS. **Se dice que no existe
       en vez de inventarla.**

     🔒 Y la que SÍ es del proveedor —**por qué** rechazó— sigue bloqueada por
     `D-867`: la causa viaja en el crudo (`err.type`, `status_detail`) y se
     aplana a prosa en `motivo_rechazo`. **Tiparla exige la tabla de códigos de
     Erick; mapear `31` por parecido sería el defecto que ese censo vino a
     medir.** */
  IF v_tarj_estado <> 'guardada' THEN
    RAISE EXCEPTION 'tarjeta_no_guardada: %', v_tarj_estado USING ERRCODE='22023';
  END IF;
  IF v_exp_anio IS NOT NULL AND v_exp_mes IS NOT NULL
     AND make_date(v_exp_anio, v_exp_mes, 1) + interval '1 month' <= date_trunc('day', now())
  THEN
    RAISE EXCEPTION 'tarjeta_vencida' USING ERRCODE='22023';
  END IF;

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
   CINTURÓN CON DISCRIMINADOR — y el brazo que importa es el que PASA
   ───────────────────────────────────────────────────────────────────────────
   Probar que una vencida rebota no alcanza: un guard que rechazara TODA
   tarjeta también rebotaría. **El brazo que discrimina es la tarjeta buena
   firmando el mandato.**
     ① vencida (expiró el mes pasado)  → `tarjeta_vencida`
     ② `rechazada`                     → `tarjeta_no_guardada`
     ③ 🔑 vigente y `guardada`         → **FIRMA el mandato**
   Escribe en SUBTRANSACCIÓN QUE SE DESHACE SOLA (L-406).
   ═══════════════════════════════════════════════════════════════════════════ */
DO $cinturon$
DECLARE
  v_rol text := current_user; v_user uuid; v_fam uuid; v_prest uuid; v_tarj uuid;
  v_r text; v_out text := ''; v_ok int := 0; v_s0 int; v_s1 int;
  v_mes_pas date := (date_trunc('month', now()) - interval '1 month')::date;
BEGIN
  SELECT count(*) INTO v_s0 FROM guarderia_suscripciones;
  SELECT ps.prestador_id INTO v_prest FROM prestador_servicios ps
   WHERE ps.tipo_servicio='guarderia_dia' AND ps.activo AND ps.precio_mensual_plan > 0 LIMIT 1;
  SELECT t.id, t.user_id INTO v_tarj, v_user FROM tarjetas_guardadas t
   WHERE t.estado='guardada' LIMIT 1;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm WHERE fm.user_id=v_user AND fm.hasta IS NULL LIMIT 1;
  IF v_prest IS NULL OR v_tarj IS NULL OR v_fam IS NULL THEN
    RAISE EXCEPTION 'CINTURON: falta fixture vivo — el arnes NO midio nada';
  END IF;

  BEGIN
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub',v_user,'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    PERFORM public.aceptar_documentos_guarderia(v_fam, NULL);
    EXECUTE format('SET LOCAL ROLE %I', v_rol);

    /* ① vencida */
    UPDATE tarjetas_guardadas SET expira_mes = EXTRACT(month FROM v_mes_pas)::smallint,
                                  expira_anio = EXTRACT(year FROM v_mes_pas)::smallint
     WHERE id = v_tarj;
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub',v_user,'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    BEGIN PERFORM public.contratar_mensualidad_guarderia(v_prest, v_tarj); v_r := 'PASO';
    EXCEPTION WHEN OTHERS THEN v_r := SQLERRM; END;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    v_out := v_out || format(E'\n  vencida el %s     -> %s', to_char(v_mes_pas,'MM/YYYY'), v_r);
    IF v_r = 'tarjeta_vencida' THEN v_ok := v_ok + 1; END IF;

    /* ② rechazada */
    UPDATE tarjetas_guardadas SET estado='rechazada',
           expira_mes = 12, expira_anio = 2099 WHERE id = v_tarj;
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub',v_user,'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    BEGIN PERFORM public.contratar_mensualidad_guarderia(v_prest, v_tarj); v_r := 'PASO';
    EXCEPTION WHEN OTHERS THEN v_r := SQLERRM; END;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    v_out := v_out || format(E'\n  estado=rechazada       -> %s', v_r);
    IF v_r LIKE 'tarjeta_no_guardada%' THEN v_ok := v_ok + 1; END IF;

    /* ③ 🔑 la buena PASA */
    UPDATE tarjetas_guardadas SET estado='guardada' WHERE id = v_tarj;
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub',v_user,'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    BEGIN PERFORM public.contratar_mensualidad_guarderia(v_prest, v_tarj); v_r := 'FIRMA';
    EXCEPTION WHEN OTHERS THEN v_r := SQLERRM; END;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    v_out := v_out || format(E'\n  🔑 vigente y guardada  -> %s', v_r);
    IF v_r = 'FIRMA' THEN v_ok := v_ok + 1; END IF;

    RAISE EXCEPTION 'CINTURON_DESHACER';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF SQLERRM <> 'CINTURON_DESHACER' THEN RAISE; END IF;
  END;

  SELECT count(*) INTO v_s1 FROM guarderia_suscripciones;
  RAISE NOTICE E'\n═══ CINTURON · la tarjeta del mandato ═══%\n\n  %/3 · residuo suscripciones %→%', v_out, v_ok, v_s0, v_s1;
  IF v_ok <> 3 THEN RAISE EXCEPTION 'CINTURON ROJO: %/3. %', v_ok, v_out; END IF;
  IF v_s1 <> v_s0 THEN RAISE EXCEPTION 'CINTURON ROJO: residuo'; END IF;
END $cinturon$;
