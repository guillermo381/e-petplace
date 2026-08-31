/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · «YA TIENES UN PLAN CON ESTE LUGAR» — el guard que sabía decir que no
   ═══════════════════════════════════════════════════════════════════════════
   Reportado por el founder desde el aparato. **Es `L-424` otra vez:**

   > **Un guard que vive en un ÍNDICE sólo sabe negarse.**

   El wrapper hacía `fallo(error.message)` y **al founder le llegó el mensaje
   crudo de Postgres sobre una duplicate key.**

   🔴 **Y el efecto real era peor que un mensaje feo:** *su primer toque SÍ
   firmó el mandato* — hay una suscripción activa de Aurora para Thor desde las
   01:24. El segundo rebotó. **No era «no me deja pagar»: era «ya lo tenés y no
   supe explicártelo».**

   ── ① EL CÓDIGO, y con el ID adentro ──────────────────────────────────────
   Nace `ya_tienes_plan_activo`, **y devuelve el id del plan que ya existe**
   para que la pantalla **LLEVE ahí** en vez de mostrar un error. *Un rebote que
   sólo dice que no obliga a la familia a adivinar dónde está lo que ya tiene.*

   ── ② 🔴 Y EL ÍNDICE TENÍA OTRA PUERTA AL MISMO ERROR CRUDO ────────────────
   `uq_susc_viva_por_lugar` era `UNIQUE (familia_id, prestador_id, estado)`
   **sin filtro parcial** ⇒ **una familia tampoco podía tener DOS canceladas
   con el mismo lugar.** Medido con sonda:

   > `duplicate key value violates unique constraint "uq_susc_viva_por_lugar"`

   **Camino real: contratar → cancelar → contratar → cancelar.** Tipar sólo el
   guard de `activa` habría dejado **el mismo mensaje crudo entrando por la otra
   puerta** — o sea media cura. El índice pasa a **PARCIAL sobre `activa`**:
   *un plan vivo por lugar es la regla; el historial de cancelaciones no compite
   con nada.*

   ⚠️ **Nota de método, porque casi mido mal:** la primera sonda rebotó por
   `chk_susc_cancelacion_coherente` (faltaba `cancelada_en`) y **no por el
   índice**. *Un rojo por la razón equivocada está tan roto como un verde por la
   razón equivocada* — se corrigió la sonda antes de concluir.

   ⚖️ VEDA 76(g): **NO RIGE** — el índice se recrea sobre 1 fila `activa`.
   ↩️ REVERSA escrita ANTES:
      `docs/relevamientos/S107-A-REVERSA-20260901060000-plan-activo.sql`
   ═══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ Es un CONSTRAINT, no un índice suelto — `DROP INDEX` lo rebota
   (`2BP01: requires it`). Se suelta por donde se creó. */
ALTER TABLE public.guarderia_suscripciones DROP CONSTRAINT IF EXISTS uq_susc_viva_por_lugar;
DROP INDEX IF EXISTS public.uq_susc_viva_por_lugar;
CREATE UNIQUE INDEX uq_susc_viva_por_lugar
  ON public.guarderia_suscripciones (familia_id, prestador_id)
  WHERE estado = 'activa';

COMMENT ON INDEX public.uq_susc_viva_por_lugar IS
  'UN plan ACTIVO por familia y lugar. Parcial a proposito: la version no parcial '
  'bloqueaba tambien dos canceladas del mismo lugar (contratar-cancelar-contratar-'
  'cancelar) con un 23505 crudo. El rebote hablado vive en '
  'contratar_mensualidad_guarderia (ya_tienes_plan_activo) — el indice solo sabe '
  'negarse (L-424).';

CREATE OR REPLACE FUNCTION public.contratar_mensualidad_guarderia(p_prestador_id uuid, p_tarjeta_id uuid, p_mascota_id uuid DEFAULT NULL::uuid, p_monto_esperado numeric DEFAULT NULL::numeric, p_direccion_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid(); v_fam uuid; v_serv record; v_id uuid; v_dueno uuid; v_doc jsonb;
  v_tarj_estado text; v_exp_mes smallint; v_exp_anio smallint; v_dir_id uuid; v_ya uuid;
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

  /* ═══ LA DIRECCIÓN ES UN DATO DEL MANDATO, NO DE LA SESIÓN ══════════════
     🟢 Firma del founder (31-ago): **las citas del plan las crea el RELOJ, sin
     nadie presente** ⇒ la dirección tiene que quedar acá, igual que el medio de
     pago. *El reloj no puede preguntarle a nadie a dónde pasar a buscar.*

     🔴 **Se resuelve AL FIRMAR, jamás al cobrar.** Si viene NULL se guarda la
     principal **de este momento** — no se deja NULL para que el reloj la
     resuelva después: *eso volvería la dirección un dato de la sesión del reloj
     y la familia habría autorizado una dirección que puede haber cambiado.*

     ⚠️ Cambiarla después cambia **las citas futuras del plan, no las creadas** —
     y eso sale solo de este diseño: el reloj lee el mandato de hoy. */
  IF p_direccion_id IS NULL THEN
    SELECT d.id INTO v_dir_id FROM direcciones_guardadas d
     WHERE d.user_id = v_auth AND d.es_principal LIMIT 1;
  ELSE
    SELECT d.id INTO v_dir_id FROM direcciones_guardadas d
     WHERE d.id = p_direccion_id AND d.user_id = v_auth;
    IF v_dir_id IS NULL THEN
      RAISE EXCEPTION 'direccion_no_valida' USING ERRCODE='22023';
    END IF;
  END IF;

  /* ═══ YA TIENE UN PLAN CON ESTE LUGAR ═══════════════════════════════════
     🔴 Hasta hoy esto lo frenaba **sólo el índice `uq_susc_viva_por_lugar`**,
     y **un guard que vive en un índice sólo sabe negarse** (`L-424`): el
     wrapper hacía `fallo(error.message)` y **al founder le llegó el mensaje
     crudo de Postgres sobre una duplicate key.**

     ⚠️ Y el efecto real era peor que un mensaje feo: **su primer toque SÍ había
     firmado el mandato.** El segundo rebotó ⇒ *no era «no me deja pagar»: era
     «ya lo tenés y no supe explicártelo».*

     Devuelve el **id del plan que ya existe** para que la pantalla LLEVE ahí en
     vez de mostrar un error. *Un rebote que sólo dice que no obliga a la
     familia a adivinar dónde está lo que ya tiene.* */
  SELECT s.id INTO v_ya FROM guarderia_suscripciones s
   WHERE s.familia_id = v_fam AND s.prestador_id = p_prestador_id
     AND s.estado = 'activa' LIMIT 1;
  IF v_ya IS NOT NULL THEN
    RAISE EXCEPTION 'ya_tienes_plan_activo: %', v_ya USING ERRCODE='22023';
  END IF;

  INSERT INTO guarderia_suscripciones (
    familia_id, prestador_id, prestador_servicio_id, mascota_id,
    tarjeta_id, autorizada_por, monto_esperado, precio_mensual, direccion_id)
  VALUES (v_fam, p_prestador_id, v_serv.id, p_mascota_id,
          p_tarjeta_id, v_auth,
          /* El techo del mandato: lo que se pida, o el precio de hoy. */
          COALESCE(p_monto_esperado, v_serv.precio_mensual_plan),
          v_serv.precio_mensual_plan, v_dir_id)
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

/* ═══ CINTURÓN CON DISCRIMINADOR ═════════════════════════════════════════════
     ① 🔑 contratar dos veces -> `ya_tienes_plan_activo` **con el id del plan
        que ya existe** (no un mensaje crudo, y no un rebote mudo)
     ② 🔑 **DOS canceladas del mismo lugar ahora PASAN** — el brazo que prueba
        que el índice se volvió parcial. *Sin él, el guard tipado taparía el
        primer camino y dejaría el segundo escupiendo el 23505.*
     ③ el índice sigue impidiendo DOS ACTIVAS — que es la regla que existe.
   Escribe en SUBTRANSACCIÓN QUE SE DESHACE SOLA (L-406). */
DO $cinturon$
DECLARE
  v_rol text := current_user; v_f uuid; v_p uuid; v_ps uuid; v_t uuid; v_u uuid;
  v_ya uuid; v_r text; v_out text := ''; v_ok int := 0; v_n0 int; v_n1 int;
BEGIN
  SELECT count(*) INTO v_n0 FROM guarderia_suscripciones;
  SELECT s.id, s.familia_id, s.prestador_id, s.prestador_servicio_id, s.tarjeta_id, s.autorizada_por
    INTO v_ya, v_f, v_p, v_ps, v_t, v_u
    FROM guarderia_suscripciones s WHERE s.estado='activa' LIMIT 1;
  IF v_f IS NULL THEN RAISE EXCEPTION 'CINTURON: no hay suscripcion activa — el brazo del duplicado no puede correr'; END IF;

  BEGIN
    EXECUTE format('SET LOCAL request.jwt.claims = %L', json_build_object('sub',v_u,'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    BEGIN PERFORM public.contratar_mensualidad_guarderia(v_p, v_t); v_r := 'PASO';
    EXCEPTION WHEN OTHERS THEN v_r := SQLERRM; END;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    v_out := v_out || format(E'\n  🔑 contratar de nuevo -> %s', v_r);
    IF v_r LIKE 'ya_tienes_plan_activo%' AND v_r LIKE '%'||v_ya::text||'%' THEN v_ok := v_ok + 1; END IF;

    /* ② dos canceladas */
    INSERT INTO guarderia_suscripciones (familia_id, prestador_id, prestador_servicio_id,
      tarjeta_id, autorizada_por, monto_esperado, precio_mensual, estado, cancelada_en)
    VALUES (v_f, v_p, v_ps, v_t, v_u, 100, 100, 'cancelada', now()),
           (v_f, v_p, v_ps, v_t, v_u, 100, 100, 'cancelada', now());
    v_out := v_out || E'\n  🔑 DOS canceladas del mismo lugar -> PASAN (el indice es parcial)';
    v_ok := v_ok + 1;

    /* ③ dos activas siguen prohibidas */
    BEGIN
      INSERT INTO guarderia_suscripciones (familia_id, prestador_id, prestador_servicio_id,
        tarjeta_id, autorizada_por, monto_esperado, precio_mensual, estado)
      VALUES (v_f, v_p, v_ps, v_t, v_u, 100, 100, 'activa');
      v_out := v_out || E'\n  DOS activas -> 🔴 PASAN (la regla se perdio)';
    EXCEPTION WHEN unique_violation THEN
      v_out := v_out || E'\n  DOS activas -> siguen prohibidas';
      v_ok := v_ok + 1;
    END;

    RAISE EXCEPTION 'CINTURON_DESHACER';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF SQLERRM <> 'CINTURON_DESHACER' THEN RAISE; END IF;
  END;

  SELECT count(*) INTO v_n1 FROM guarderia_suscripciones;
  RAISE NOTICE E'\n═══ CINTURON · ya tienes plan activo ═══%\n\n  %/3 · residuo suscripciones %→%', v_out, v_ok, v_n0, v_n1;
  IF v_ok <> 3 THEN RAISE EXCEPTION 'CINTURON ROJO: %/3. %', v_ok, v_out; END IF;
  IF v_n1 <> v_n0 THEN RAISE EXCEPTION 'CINTURON ROJO: residuo'; END IF;
END $cinturon$;
