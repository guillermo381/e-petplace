-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · 20260907700000 · `D-1001` — LA ESPECIE ENTRA A LAS PUERTAS DE LA
-- MENSUALIDAD DE GUARDERÍA, MONTANDO LA PIEZA QUE YA EXISTE.
--
-- ROJO REPRODUCIDO ANTES DE ESCRIBIR ESTO (1-sep-2026, contra la base):
--   · `guarderia_suscripciones` `20d025ca` está **activa** y su mascota es
--     **Pepe, un AVE**, contra una oferta cuyo recorte es `['gato','perro']`.
--   · Censo por CUERPO de las siete puertas: sólo `reservar_dia_guarderia` y
--     `reservar_dia_de_paquete_guarderia` llaman a `_mascota_elegible_servicio`.
--     Las otras cinco no consultan especie.
--
-- 76(g): **NO RIGE** — cero backfill, cero DDL sobre tablas, cero anclas.
-- Sólo se re-crean dos funciones, aditivamente (L-119: re-crear, jamás DROP).
--
-- REVERSA ESCRITA ANTES:
--   docs/relevamientos/S112-A-REVERSA-20260907700000-especie-mensualidad.sql
--   ⚠️ revertirla REABRE los dos agujeros, incluido el de propiedad.
--
-- LA FILA DE PEPE **NO SE TOCA**: es dato de pruebas y su destino es del
-- founder. Esta migración cierra la puerta; no corrige el pasado.
-- ═══════════════════════════════════════════════════════════════════════════

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

  /* ═══ S112-A · `D-1001` · LA MISMA PIEZA, NO UNA COPIA ═════════════════════
     El censo por cuerpo dio esto, y no es lo que la ficha decía:
     de las SIETE puertas de guardería, **sólo DOS** consultaban especie
     —`reservar_dia_guarderia` y `reservar_dia_de_paquete_guarderia`—, y las dos
     lo hacen con `_mascota_elegible_servicio`. **Esa es la pieza**; acá se
     MONTA, no se reescribe: si mañana la elegibilidad cambia de regla, cambia
     en un solo lugar y las cuatro puertas cambian con ella.

     🔴 Y el censo destapó un segundo hueco en ESTA misma puerta, de otra clase:
     `p_mascota_id` entraba al INSERT **sin que nadie verificara que la mascota
     es de quien firma**. La familia sí se resolvía (`v_fam`), pero de la
     SESIÓN — nunca de la mascota. *Se podía firmar un mandato recurrente sobre
     el animal de otra familia.* Se cierra en el mismo acto: curar el síntoma
     reportado y no censar la clase es media cura.

     El código de servicio es `guarderia_mensual` y no `guarderia_dia`
     **a propósito**: la oferta se resuelve por `guarderia_dia` (así está el
     modelo), pero lo que se está firmando es la mensualidad. Hoy los dos
     recortes son `['perro','gato']` y el resultado es idéntico; el día que
     difieran, esta puerta tiene que leer el suyo. */
  IF p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'mascota_requerida' USING ERRCODE='22023';
  END IF;
  IF NOT public.user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;
  IF NOT public._mascota_elegible_servicio(p_mascota_id, 'guarderia_mensual') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE='22023';
  END IF;

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

CREATE OR REPLACE FUNCTION public.reactivar_mensualidad_guarderia(p_suscripcion_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_auth uuid := auth.uid(); v_fam uuid; v_s record; v_ya uuid;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm
   WHERE fm.user_id = v_auth AND fm.hasta IS NULL LIMIT 1;
  IF v_fam IS NULL THEN RAISE EXCEPTION 'sin_familia' USING ERRCODE='22023'; END IF;

  SELECT * INTO v_s FROM guarderia_suscripciones
   WHERE id = p_suscripcion_id AND familia_id = v_fam FOR UPDATE;
  IF v_s.id IS NULL THEN RAISE EXCEPTION 'plan_no_existe' USING ERRCODE='22023'; END IF;

  /* Idempotente: dos toques del mismo botón no son un error. */
  IF v_s.estado = 'activa' THEN
    RETURN jsonb_build_object('ok', true, 'ya_estaba', true, 'suscripcion_id', v_s.id);
  END IF;
  IF v_s.estado <> 'cancelada' THEN
    RAISE EXCEPTION 'plan_no_cancelado: %', v_s.estado USING ERRCODE='22023';
  END IF;

  /* ═══ S112-A · `D-1001` — LA MISMA PIEZA, TAMBIÉN ACÁ ══════════════════════
     Reactivar NO es «seguir»: la firma de S109 dice que el plan queda
     REACTIVABLE **con ancla NUEVA el día que la familia vuelve** ⇒ es una
     puerta que ABRE un período, y entre la baja y la vuelta pueden haber
     pasado las dos cosas que `_mascota_elegible_servicio` mira: que el animal
     haya muerto (`estado_vida`) o que el recorte de especies del servicio haya
     cambiado. *Una puerta que sólo mira el estado del PLAN no ve nada de eso.* */
  IF NOT public._mascota_elegible_servicio(v_s.mascota_id, 'guarderia_mensual') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE='22023';
  END IF;

  /* 🔴 EL REBOTE CON SU CAMINO, no sólo con su no. *«Esto ya no se reactiva»
     sin decir qué sí se puede hacer deja a la familia mirando un botón muerto.*
     El código es propio y la pantalla lleva a contratar de nuevo. */
  IF v_s.periodo_hasta IS NULL OR v_s.periodo_hasta < public.hoy_local() THEN
    RAISE EXCEPTION 'periodo_vencido_contratar_de_nuevo' USING ERRCODE='22023';
  END IF;

  /* Y el otro rebote que hay que explicar: mientras estuvo cancelada, la
     familia pudo contratar OTRO plan en el mismo lugar. `uq_susc_viva_por_lugar`
     lo impediría con un `duplicate key` crudo — el defecto exacto de `L-424`. */
  SELECT s.id INTO v_ya FROM guarderia_suscripciones s
   WHERE s.familia_id = v_fam AND s.prestador_id = v_s.prestador_id
     AND s.estado = 'activa' AND s.id <> v_s.id LIMIT 1;
  IF v_ya IS NOT NULL THEN
    RAISE EXCEPTION 'ya_tienes_plan_activo: %', v_ya USING ERRCODE='22023';
  END IF;

  /* CANCELAR LA CANCELACIÓN: nada más. No cobra, no re-ancla, no toca el
     período. `cancelada_en` vuelve a NULL porque `chk_susc_cancelacion_coherente`
     lo EXIGE — el invariante se defiende solo. */
  UPDATE guarderia_suscripciones
     SET estado = 'activa', cancelada_en = NULL, updated_at = now()
   WHERE id = v_s.id;

  RETURN jsonb_build_object('ok', true, 'suscripcion_id', v_s.id,
    'corre_hasta', v_s.periodo_hasta, 'cobrada_de_nuevo', false,
    'nota', 'se cancelo la cancelacion: la renovacion vuelve, sin cobro nuevo');
END $function$
;

-- ═══ CINTURÓN · con discriminador, y corre ANTES de que nadie confíe ═══════
DO $cinturon$
DECLARE
  v_ave    uuid := 'abf6e5cc-b59f-40a7-a584-b568cb3b4a6a';  -- Pepe
  v_perro  uuid := 'd2e31d70-54fc-4d47-b425-1617239257eb';  -- Thor, misma familia
  v_err    text;
BEGIN
  /* ① El catálogo tiene que existir, o el guard falla ABIERTO en silencio:
     `_mascota_elegible_servicio` hace LEFT JOIN, y sin fila el recorte es NULL
     y el predicado da TRUE. Un guard que se apaga solo cuando le falta un dato
     no es un guard. */
  IF NOT EXISTS (SELECT 1 FROM tipos_servicio
                  WHERE codigo='guarderia_mensual' AND especies_elegibles IS NOT NULL) THEN
    RAISE EXCEPTION 'CINTURON: no existe tipos_servicio.guarderia_mensual con recorte -> el guard fallaria ABIERTO';
  END IF;

  /* ② LA PIEZA discrimina: el ave NO, el perro SÍ. Sin este par, «rebota» no
     es una medición — una compuerta que siempre dice que no también rebota. */
  IF public._mascota_elegible_servicio(v_ave, 'guarderia_mensual') THEN
    RAISE EXCEPTION 'CINTURON: la pieza acepta un AVE';
  END IF;
  IF NOT public._mascota_elegible_servicio(v_perro, 'guarderia_mensual') THEN
    RAISE EXCEPTION 'CINTURON: la pieza rechaza un PERRO (rechaza todo -> no mide)';
  END IF;

  /* ③ LA PUERTA REAL, por el camino real: con la sesión de la familia de Pepe,
     contratar la mensualidad de un ave tiene que rebotar `mascota_no_elegible`
     ANTES de crear nada. Se corre en subtransacción y se deshace sola. */
  BEGIN
    PERFORM set_config('request.jwt.claims',
      '{"sub":"dd024680-3d1c-4465-b38b-dedab45da037","role":"authenticated"}', true);
    BEGIN
      PERFORM public.contratar_mensualidad_guarderia(
        'de680000-0000-4000-8000-0000000000e5'::uuid, NULL, v_ave, NULL, NULL, 'tarjeta');
      RAISE EXCEPTION 'CINTURON: la puerta ACEPTO un ave';
    EXCEPTION WHEN OTHERS THEN
      v_err := SQLERRM;
      IF v_err NOT LIKE '%mascota_no_elegible%' THEN
        RAISE EXCEPTION 'CINTURON: el ave rebota por otra cosa (%) -> el guard nuevo no es el que corto', v_err;
      END IF;
    END;

    /* ④ EL CONTRA-CASO: el PERRO no puede rebotar por especie. Va a rebotar
       igual (ya tiene plan activo / falta tarjeta), y eso está bien: lo que se
       exige es que NO sea `mascota_no_elegible`. */
    BEGIN
      PERFORM public.contratar_mensualidad_guarderia(
        'de680000-0000-4000-8000-0000000000e5'::uuid, NULL, v_perro, NULL, NULL, 'tarjeta');
      v_err := '(paso sin error)';
    EXCEPTION WHEN OTHERS THEN
      v_err := SQLERRM;
    END;
    IF v_err LIKE '%mascota_no_elegible%' THEN
      RAISE EXCEPTION 'CINTURON: el guard rechaza tambien al PERRO -> rechaza todo';
    END IF;
  END;

  RAISE NOTICE 'CINTURON VERDE: la pieza discrimina, la puerta corta al ave y deja pasar al perro (%)', v_err;
END $cinturon$;
