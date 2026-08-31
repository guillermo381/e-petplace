-- ═══════════════════════════════════════════════════════════════════════════
-- S109-A · ① LA MENSUALIDAD DEJA DE SER INEXPRESABLE POR DEUNA, Y GANA RIEL
--
-- 76(g) VEDA: **NO RIGE.** DDL aditiva + relajar un NOT NULL + un reemplazo.
--   **Cero backfill** — el mandato vivo tiene tarjeta y su `riel` se declara
--   `tarjeta`, que es el hecho: se contrató con una y la tiene guardada.
-- REVERSA: `docs/relevamientos/2026-09-06-s109a-REVERSA-M25.sql`.
-- L-119: la firma gana `p_riel` con DEFAULT ⇒ los llamadores vivos siguen
--   compilando; igual se hace DROP explícito de la vieja.
--
-- ═══ EL DEFECTO, medido por S108-C ═════════════════════════════════════════
-- 🔴 `guarderia_suscripciones.tarjeta_id` era **NOT NULL** y la puerta exigía
--    tarjeta ⇒ **un mandato de DeUna era INEXPRESABLE**, y C tenía esa fila
--    frenada con un «muy pronto».
--    *El esquema estaba diciendo «todo cobro recurrente pasa por una tarjeta», y
--    eso dejó de ser cierto el día que el founder firmó el link mensual.*
--
-- 🔴 Y NO ALCANZA CON AFLOJAR EL NOT NULL: sin `riel`, un mandato sin tarjeta
--    y uno con tarjeta rota se ven igual. **La suscripción tiene que SABER con
--    qué riel se contrató** — es lo que el cron necesita para ramificar sin
--    reescribirse. El CHECK ata las dos mitades: `tarjeta ⇒ hay tarjeta`.
--
-- ⚠️ Y el brazo DeUna **rechaza** una tarjeta que no va a usar: *guardar un medio
--    que este riel nunca va a debitar deja una autorización viva sin acto que la
--    consuma*, y quien la lea va a creer que hay un cobro automático que no hay.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.guarderia_suscripciones ALTER COLUMN tarjeta_id DROP NOT NULL;
ALTER TABLE public.guarderia_suscripciones ADD COLUMN riel text;

/* La fila viva SÍ tiene tarjeta: declarar su riel no es inventar un hecho, es
   escribir el que ya ocurrió. Es la única escritura de datos de esta tanda y se
   declara — no es backfill de comportamiento, es nombrar lo que ya era. */
UPDATE public.guarderia_suscripciones SET riel = 'tarjeta' WHERE tarjeta_id IS NOT NULL;

ALTER TABLE public.guarderia_suscripciones
  ADD CONSTRAINT chk_gs_riel_valido CHECK (
    riel IS NULL OR (
      riel IN ('tarjeta','deuna')
      AND (riel <> 'tarjeta' OR tarjeta_id IS NOT NULL)
      /* Y al revés: un mandato de DeUna con tarjeta guardada es el estado que
         el brazo de arriba rechaza — acá se vuelve imposible, no vigilado. */
      AND (riel <> 'deuna'   OR tarjeta_id IS NULL)
    ));

COMMENT ON COLUMN public.guarderia_suscripciones.riel IS
  'S109-A · `tarjeta` cobra sola cada mes · `deuna` emite un link y la familia '
  'paga a mano. El cron ramifica por aca sin reescribirse.';

DROP FUNCTION IF EXISTS public.contratar_mensualidad_guarderia(uuid,uuid,uuid,numeric,uuid);

CREATE OR REPLACE FUNCTION public.contratar_mensualidad_guarderia(p_prestador_id uuid, p_tarjeta_id uuid, p_mascota_id uuid DEFAULT NULL::uuid, p_monto_esperado numeric DEFAULT NULL::numeric, p_direccion_id uuid DEFAULT NULL::uuid, p_riel text DEFAULT 'tarjeta'::text)
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
END $function$

;

REVOKE EXECUTE ON FUNCTION public.contratar_mensualidad_guarderia(uuid,uuid,uuid,numeric,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contratar_mensualidad_guarderia(uuid,uuid,uuid,numeric,uuid,text) TO authenticated;

-- ═══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $c$
DECLARE v_n int; v_fam uuid; v_prest uuid; v_user uuid; v_riel text;
BEGIN
  -- (a) UNA sola firma (L-119)
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='contratar_mensualidad_guarderia';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon: quedaron % sobrecargas', v_n; END IF;

  -- (b) 🔴 EL DISCRIMINADOR: un mandato SIN TARJETA ahora ENTRA. Antes el NOT
  --     NULL lo hacia imposible; ese es el defecto que C midio.
  SELECT g.familia_id, g.prestador_id, g.autorizada_por INTO v_fam, v_prest, v_user
    FROM guarderia_suscripciones g ORDER BY g.created_at LIMIT 1;
  UPDATE guarderia_suscripciones SET estado='cancelada', cancelada_en=now() WHERE estado='activa';
  INSERT INTO guarderia_suscripciones (familia_id, prestador_id, prestador_servicio_id,
    tarjeta_id, autorizada_por, monto_esperado, precio_mensual, estado, riel)
  SELECT g.familia_id, g.prestador_id, g.prestador_servicio_id,
         NULL, g.autorizada_por, g.monto_esperado, g.precio_mensual, 'activa', 'deuna'
    FROM guarderia_suscripciones g ORDER BY g.created_at LIMIT 1;

  -- (c) 🔴 Y UN MANDATO DE DEUNA CON TARJETA ES INEXPRESABLE — rojo producido
  BEGIN
    UPDATE guarderia_suscripciones SET tarjeta_id = (SELECT id FROM tarjetas_guardadas ORDER BY id LIMIT 1)
     WHERE riel='deuna';
    RAISE EXCEPTION 'cinturon: un mandato de DEUNA acepto tarjeta guardada';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- (d) y uno de TARJETA sin tarjeta tampoco
  BEGIN
    UPDATE guarderia_suscripciones SET riel='tarjeta', tarjeta_id=NULL WHERE riel='deuna';
    RAISE EXCEPTION 'cinturon: un mandato de TARJETA acepto no tener tarjeta';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- (e) la fila vieja quedo declarada `tarjeta`, que es el hecho
  SELECT riel INTO v_riel FROM guarderia_suscripciones
   WHERE tarjeta_id IS NOT NULL ORDER BY created_at LIMIT 1;
  IF v_riel <> 'tarjeta' THEN
    RAISE EXCEPTION 'cinturon: el mandato con tarjeta no quedo declarado tarjeta (%)', v_riel;
  END IF;

  RAISE NOTICE 'cinturon M25: 5/5 OK (una firma · DeUna SIN tarjeta ENTRA · DeUna con tarjeta inexpresable · tarjeta sin tarjeta inexpresable · el viejo declarado)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M25: fixture deshecho por subtransaccion, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;
