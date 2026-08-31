-- ═══════════════════════════════════════════════════════════════════════════
-- S109-A · EL MANDATO POR DEUNA DEJA DE SER INEXPRESABLE, Y NACE EL LECTOR DEL
--          MES PENDIENTE
--
-- 76(g) VEDA: **NO RIGE.** Un DEFAULT y un lector nuevo. **Cero backfill.**
-- REVERSA: `docs/relevamientos/2026-09-07-s109a-REVERSA-M32.sql`.
--
-- ═══ ① UNA PALABRA QUE FALTABA, medida por S109-C ══════════════════════════
-- 🔴 `p_tarjeta_id uuid` **sin `DEFAULT`** ⇒ el tipo generado lo marca
--    **requerido** (`p_tarjeta_id: string`, mientras `p_riel?: string` sí es
--    opcional). Y el cuerpo rebota `deuna_no_lleva_tarjeta` si llega con valor.
--    ⇒ **Para contratar por DeUna hay que mandar `NULL`, y el tipo no deja
--    mandarlo.** *El motor ya sabía hacerlo y la firma no dejaba pedirlo.*
--
-- 🟢 **Y C hizo lo correcto: NO lo tapó con un cast.** Lo habría puesto en
--    verde en treinta segundos *y habría dejado el agujero de forma intacto* —
--    justo el que `deuna_no_lleva_tarjeta` existe para cerrar. **Un `as` que
--    silencia un tipo silencia también la razón por la que ese tipo estaba mal.**
--
-- ⚠️ `L-119` MEDIDA, no supuesta: el parámetro es el 2.º y **todos los que le
--    siguen ya tienen DEFAULT**, así que agregar el suyo no reordena nada y la
--    firma sigue siendo la misma para Postgres. **Cuerpo tomado DEL OBJETO**
--    con una sola palabra cambiada.
--
-- ═══ ② EL LECTOR DEL MES PENDIENTE — pedido de S109-C ══════════════════════
-- Sin él, la tarjeta de Cuenta que el founder firmó **no tiene de dónde sacar
-- cuánto ni hasta cuándo**.
-- 🔴 **Y su forma la fija la firma de los DOS RELOJES:** devuelve **el del MES**
--    (`vence_en`, que es el fin del período pagado) **y el del CÓDIGO**
--    (`codigo_expira_en`) **por separado y nombrados distinto**.
--    *Si la pantalla los junta en un contador, va a decir que se acabó algo que
--    no se acabó.* El lector no los mezcla ni elige por la pantalla.
-- ⚠️ Y **no compara contra `now()`**: devuelve instantes. *Quien pinta el reloj
--    decide si venció; un veredicto del servidor envejece en el viaje.*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.contratar_mensualidad_guarderia(p_prestador_id uuid, p_tarjeta_id uuid DEFAULT NULL::uuid, p_mascota_id uuid DEFAULT NULL::uuid, p_monto_esperado numeric DEFAULT NULL::numeric, p_direccion_id uuid DEFAULT NULL::uuid, p_riel text DEFAULT 'tarjeta'::text)
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
  /* ═══ EL RIEL DECIDE SI HACE FALTA TARJETA ═══════════════════════════════
     🟢 Firma del founder: *el cobro recurrente va sólo con tarjeta de crédito.
     DeUna no hace recurrencia: se le manda un link cada mes y la familia paga a
     mano.* ⇒ un mandato de DeUna **no tiene tarjeta que guardar**, y exigirla
     lo volvía inexpresable — medido por S108-C, que tenía la fila de DeUna
     frenada con un «muy pronto». */
  IF p_riel NOT IN ('tarjeta','deuna') THEN
    RAISE EXCEPTION 'riel_no_valido: %', p_riel USING ERRCODE='22023';
  END IF;

  IF p_riel = 'deuna' THEN
    /* 🔴 Y NO SE ACEPTA UNA TARJETA QUE NO SE VA A USAR. *Guardar un medio que
       este riel nunca va a debitar deja una autorización viva sin acto que la
       consuma* — y el día que alguien la lea, va a creer que hay un cobro
       automático que no existe. */
    IF p_tarjeta_id IS NOT NULL THEN
      RAISE EXCEPTION 'deuna_no_lleva_tarjeta' USING ERRCODE='22023';
    END IF;
    v_dueno := v_auth;   -- el mandato es de quien lo autoriza, sin medio guardado
  ELSE
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
  END IF;   -- fin del brazo TARJETA

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
    tarjeta_id, autorizada_por, monto_esperado, precio_mensual, direccion_id, riel)
  VALUES (v_fam, p_prestador_id, v_serv.id, p_mascota_id,
          p_tarjeta_id, v_auth,
          /* El techo del mandato: lo que se pida, o el precio de hoy. */
          COALESCE(p_monto_esperado, v_serv.precio_mensual_plan),
          v_serv.precio_mensual_plan, v_dir_id, p_riel)
  RETURNING id INTO v_id;

  /* ═══ EL MANDATO QUEDA FIRMADO, Y EL COBRO SIGUE AHORA ══════════════════
     ✏️ La nota vieja decía *«el cobro espera la firma de los días del plan»* —
     **esa firma llegó** (ANCLA del founder, 31-ago: *pagar es arrancar*).
     Dejarla diría que falta algo que ya se decidió.

     🔴 Esta función NO cobra, y eso es correcto: el cobro sale por la edge con
     la sesión de la familia, igual que la compra y la cita. Lo que devuelve es
     el sujeto para que la puerta lo cobre.

     **Cómo se lee `periodo_desde IS NULL`:** *«autorizado y todavía sin
     cobrar»*. No se inventó un estado — `guarderia_suscripciones_estado_check`
     es vocabulario cerrado (activa|pausada|cancelada|vencida) y ensancharlo
     para esto sería decisión de letra, no un valor más que se agrega. El dato
     que ya existe lo dice. */
  RETURN jsonb_build_object('ok', true, 'suscripcion_id', v_id,
    'precio_mensual', v_serv.precio_mensual_plan,
    'monto_esperado', COALESCE(p_monto_esperado, v_serv.precio_mensual_plan),
    'cobrada', false,
    'riel', p_riel,
    'cobro_pendiente', true,
    'nota', 'mandato firmado — el cobro del primer periodo sale ahora, por la puerta de pago');
END $function$;

REVOKE EXECUTE ON FUNCTION public.contratar_mensualidad_guarderia(uuid,uuid,uuid,numeric,uuid,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.contratar_mensualidad_guarderia(uuid,uuid,uuid,numeric,uuid,text) TO authenticated;

-- ② ───────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_mes_pendiente_guarderia()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_r jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  SELECT jsonb_agg(jsonb_build_object(
           'link_id', l.id,
           'suscripcion_id', l.guarderia_suscripcion_id,
           'prestador_nombre', pr.nombre_comercial,
           'periodo', l.periodo,
           'monto', l.monto, 'moneda', l.moneda,
           /* 🔴 EL RELOJ DEL MES. Es el fin del período YA PAGADO: hasta ese
              día la familia puede pagar el siguiente. */
           'mes_vence_en', l.vence_en,
           'intento_id', l.intento_id,
           /* 🔴 EL RELOJ DEL CÓDIGO, APARTE Y CON OTRO NOMBRE. Es de DeUna y
              dura minutos, no días. *Juntarlos en un contador diría que se
              acabó algo que no se acabó.* */
           'codigo', i.codigo_numerico,
           'codigo_expira_en', i.codigo_expira_en))
    INTO v_r
    FROM cobro_link_mensual l
    JOIN guarderia_suscripciones g ON g.id = l.guarderia_suscripcion_id
    JOIN prestadores pr ON pr.id = g.prestador_id
    LEFT JOIN pagos_intentos i ON i.id = l.intento_id
   WHERE l.estado = 'emitido'
     AND g.autorizada_por = auth.uid();

  RETURN jsonb_build_object('ok', true, 'meses', COALESCE(v_r, '[]'::jsonb));
END $function$;

REVOKE EXECUTE ON FUNCTION public.obtener_mes_pendiente_guarderia() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_mes_pendiente_guarderia() TO authenticated;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
DO $cint$
DECLARE v_args text;
BEGIN
  SELECT pg_get_function_arguments(p.oid) INTO v_args
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='contratar_mensualidad_guarderia';
  IF v_args !~ 'p_tarjeta_id uuid DEFAULT' THEN
    RAISE EXCEPTION 'CINTURON ①: p_tarjeta_id sigue sin DEFAULT — el mandato por DeUna sigue siendo inexpresable desde el cliente tipado. args=%', v_args;
  END IF;
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.proname='contratar_mensualidad_guarderia') <> 1 THEN
    RAISE EXCEPTION 'CINTURON ①: quedo una sobrecarga viva (L-119)';
  END IF;
  RAISE NOTICE 'CINTURON ① OK - p_tarjeta_id con DEFAULT y una sola firma';

  /* ② El lector separa los dos relojes: se exige que NOMBRE los dos, porque
     el defecto que evita es que la pantalla los junte. */
  IF NOT (regexp_replace(regexp_replace(
            (SELECT pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname='public' AND p.proname='obtener_mes_pendiente_guarderia'),
            '/\*.*?\*/','','gs'),'--[^\n]*','','g') ~ 'mes_vence_en'
      AND regexp_replace(regexp_replace(
            (SELECT pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname='public' AND p.proname='obtener_mes_pendiente_guarderia'),
            '/\*.*?\*/','','gs'),'--[^\n]*','','g') ~ 'codigo_expira_en') THEN
    RAISE EXCEPTION 'CINTURON ②: el lector no expone los DOS relojes por separado';
  END IF;
  RAISE NOTICE 'CINTURON ② OK - los dos relojes viajan separados y con nombres distintos';

  RAISE NOTICE 'CINTURON VERDE - 2 brazos';
END $cint$;

COMMIT;
