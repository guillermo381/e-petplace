/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de `20260901060000_s107a_ya_tienes_plan_activo.sql` — escrita ANTES.
   🔴 QUÉ NO DESHACE: revertir devuelve el rebote CRUDO de Postgres a la cara de
   la familia (`duplicate key value violates unique constraint …`) sobre un plan
   que **ya tiene**. Y vuelve a bloquear DOS canceladas del mismo lugar, que es
   el mismo error crudo por otra puerta.
   ⚠️ El índice se recrea NO parcial: si en el medio quedaron dos canceladas del
   mismo lugar, **este ALTER falla** — y ahí la salida no es forzarlo: es
   decidir qué se hace con esas filas.
   ═══════════════════════════════════════════════════════════════════════════ */
BEGIN;
DROP INDEX IF EXISTS public.uq_susc_viva_por_lugar;
ALTER TABLE public.guarderia_suscripciones
  ADD CONSTRAINT uq_susc_viva_por_lugar UNIQUE (familia_id, prestador_id, estado);
CREATE OR REPLACE FUNCTION public.contratar_mensualidad_guarderia(p_prestador_id uuid, p_tarjeta_id uuid, p_mascota_id uuid DEFAULT NULL::uuid, p_monto_esperado numeric DEFAULT NULL::numeric, p_direccion_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid(); v_fam uuid; v_serv record; v_id uuid; v_dueno uuid; v_doc jsonb;
  v_tarj_estado text; v_exp_mes smallint; v_exp_anio smallint; v_dir_id uuid;
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
COMMIT;
