-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A · EL ARCO DEL PROGRAMA — nace pendiente, ensaya, confirma, se reversa
--
-- 76(g) VEDA: **NO RIGE.** Dos columnas + dos funciones nuevas + tres
--   reemplazos. **Cero backfill**: los 2 programas vivos son de prueba, quedan
--   `pagado` y con sus citas donde están.
-- REVERSA: `docs/relevamientos/2026-09-05-s108a-REVERSA-M20.sql`.
--
-- ═══ LA FIRMA, Y POR QUÉ LAS DOS MITADES CONVIVEN ══════════════════════════
-- 🟢 *El programa se contrata igual que el paquete: elijo → pago → espero con
--    voz → salgo con la primera sesión agendada.* Y a la vez **sigue siendo
--    sujeto propio**, porque sus sesiones están numeradas y siguen un currículum.
--    **La familia nunca ve esa diferencia** — vive en el XOR, no en la pantalla.
--
-- ═══ LO QUE CAMBIA, Y ES LO MÁS CARO DE LOS TRES ═══════════════════════════
-- 🔴 `contratar_programa` **creaba las N citas al comprar**. Eso es dar la
--    agenda de un profesional antes de cobrar — y no es un día: son N.
--    Las sesiones nacen ahora en `confirmar_pago_programa`.
--
-- 🔴 Y POR ESO NECESITA COMPUERTA, que es lo que el founder mandó medir: su
--    acto 2 **puede fallar después del débito** (cupo, agenda, el UNIQUE de
--    `(programa, sesion_numero)`). *Un freno que sólo puede actuar cuando la
--    plata ya se movió no evita vender lo que no se tiene: obliga a devolverlo.*
--    ⇒ `verificar_compuerta_programa` **ENSAYA EL ACTO REAL** —llama a
--    `_generar_citas_programa`— en una subtransacción que se deshace. *Una
--    validación que reimplementa las razones del acto se separa de él en el
--    tercer cambio; un ensayo del acto no puede divergir porque ES él.*
--    Es la pieza de S108-B, aplicada al tercer sujeto y no reinventada.
--
-- 🔴 Y LA FECHA Y LA HORA SE PERSISTEN. Antes viajaban como parámetros porque
--    las sesiones nacían en el mismo acto que la compra. Con la confirmación
--    asincrónica, **quien la aplica no puede preguntarle a nadie cuándo empieza
--    el programa** — mismo criterio que la dirección del mandato mensual.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.programas_contratados ADD COLUMN fecha_inicio date;
ALTER TABLE public.programas_contratados ADD COLUMN hora time;

-- ── ① LA COMPUERTA: ensaya el acto REAL ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.verificar_compuerta_programa(p_programa_contratado_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_pc record; v_n int;
BEGIN
  SELECT * INTO v_pc FROM programas_contratados WHERE id = p_programa_contratado_id;
  IF v_pc.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'codigo','programa_no_existe'); END IF;
  IF v_pc.fecha_inicio IS NULL OR v_pc.hora IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo','programa_sin_fecha');
  END IF;

  /* 🔴 EL ENSAYO ES EL ACTO. Se llama a la MISMA función que va a correr al
     confirmar, dentro de un bloque que **siempre se deshace**. Si no cabe, acá
     rebota — con la plata todavía sin mover. */
  BEGIN
    v_n := _generar_citas_programa(v_pc.id, v_pc.fecha_inicio, v_pc.hora, now());
    IF v_n <> v_pc.n_sesiones THEN
      RAISE EXCEPTION '__ENSAYO__:no_caben_las_sesiones (generadas % de %)', v_n, v_pc.n_sesiones;
    END IF;
    RAISE EXCEPTION '__ENSAYO_OK__';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM = '__ENSAYO_OK__' THEN
        RETURN jsonb_build_object('ok', true, 'sesiones', v_pc.n_sesiones);
      END IF;
      /* La causa REAL viaja: sin ella el rebote obliga a reproducir el caso. */
      RETURN jsonb_build_object('ok', false, 'codigo','sesiones_no_agendables',
                                'causa', replace(SQLERRM, '__ENSAYO__:', ''));
  END;
END $fn$;

REVOKE EXECUTE ON FUNCTION public.verificar_compuerta_programa(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verificar_compuerta_programa(uuid) TO authenticated;

-- ── ② LA CONFIRMACIÓN: acá nacen las sesiones ─────────────────────────────
CREATE OR REPLACE FUNCTION public.confirmar_pago_programa(p_programa_contratado_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_pc record; v_n int;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE='42501';
  END IF;
  SELECT * INTO v_pc FROM programas_contratados WHERE id = p_programa_contratado_id FOR UPDATE;
  IF v_pc.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'codigo','programa_no_existe'); END IF;
  IF v_pc.estado_pago = 'pagado' THEN
    RETURN jsonb_build_object('ok', true, 'duplicado', true, 'programa_contratado_id', p_programa_contratado_id);
  END IF;
  IF v_pc.estado_pago <> 'pendiente' THEN
    RETURN jsonb_build_object('ok', false, 'codigo','estado_pago_inesperado', 'estado_pago', v_pc.estado_pago);
  END IF;
  /* Plata que llega tarde sobre un programa ya vencido: se NOMBRA. */
  IF v_pc.estado = 'cancelado' THEN
    RETURN jsonb_build_object('ok', false, 'codigo','pago_tardio_programa_cancelado',
                              'programa_contratado_id', p_programa_contratado_id);
  END IF;

  UPDATE programas_contratados
     SET estado_pago = 'pagado', pago_expira_en = NULL,
         pago_metadata = COALESCE(pago_metadata,'{}'::jsonb) || jsonb_build_object('pagado_en', now()),
         updated_at = now()
   WHERE id = p_programa_contratado_id;

  /* Y AHORA las sesiones. Si no caben, la excepción sube: el llamador la
     atrapa como acto 2 fallido y la marca con su causa. */
  v_n := _generar_citas_programa(v_pc.id, v_pc.fecha_inicio, v_pc.hora, now());
  IF v_n <> v_pc.n_sesiones THEN
    RAISE EXCEPTION 'programa_incompleto: generadas % de %', v_n, v_pc.n_sesiones USING ERRCODE='22023';
  END IF;

  RETURN jsonb_build_object('ok', true, 'programa_contratado_id', p_programa_contratado_id,
    'sesiones', v_n, 'primera_sesion', v_pc.fecha_inicio, 'vigencia_hasta', v_pc.vigencia_hasta);
END $fn$;

REVOKE EXECUTE ON FUNCTION public.confirmar_pago_programa(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.contratar_programa(p_prestador_id uuid, p_servicio_id uuid, p_programa_id uuid, p_mascota_id uuid, p_fecha_inicio date, p_hora time without time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth      uuid := auth.uid();
  v_servicio  record;
  v_programa  record;
  v_cuenta    record;
  v_fee       uuid;
  v_hoy_local date := (now() AT TIME ZONE 'America/Guayaquil')::date;  -- D-320
  v_pagado_en timestamptz := now();
  v_vigencia  date;
  v_unitario  numeric(14,2);
  v_pc_id     uuid;
  v_generadas int;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF p_hora IS NULL OR p_fecha_inicio IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;
  -- §12.2: todas al comprar — el arranque jamás en el pasado ni hoy
  -- (el gate temporal del cierre exige aire entre compra y sesión 1).
  IF p_fecha_inicio <= v_hoy_local THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;

  SELECT ps.id, ps.tipo_servicio INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'adiestramiento' AND ts.activo
  ) THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- §1bis heredado (F3 S57): la elegibilidad por especie manda desde la DB.
  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;

  SELECT pp.* INTO v_programa
  FROM prestador_programas pp
  WHERE pp.id = p_programa_id AND pp.prestador_servicio_id = p_servicio_id AND pp.activo;
  IF v_programa.id IS NULL THEN
    RAISE EXCEPTION 'programa_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- una matrícula ACTIVA del mismo programa por mascota
  IF EXISTS (
    SELECT 1 FROM programas_contratados pc
    WHERE pc.programa_id = p_programa_id AND pc.mascota_id = p_mascota_id
      AND pc.estado = 'activo'
  ) THEN
    RAISE EXCEPTION 'programa_duplicado' USING ERRCODE = '22023';
  END IF;

  -- ── PRE-VALIDACIÓN del motor financiero ANTES de cobrar (patrón
  --    confirmar_cita_pagada): un cobro que el motor rechazará al
  --    cierre es un cobro que promete mentira.
  SELECT cc.id, cc.estado INTO v_cuenta
  FROM prestadores pr
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
  WHERE pr.id = p_prestador_id;
  IF v_cuenta.id IS NULL THEN
    RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE = '22023';
  END IF;
  IF v_cuenta.estado <> 'activa' THEN
    RAISE EXCEPTION 'cuenta_no_activa: %', v_cuenta.estado USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM cuenta_roles cr
    WHERE cr.cuenta_comercial_id = v_cuenta.id
      AND cr.tipo_actor = 'prestador_servicios' AND cr.estado = 'activo'
  ) THEN
    RAISE EXCEPTION 'cuenta_sin_rol_activo' USING ERRCODE = '22023';
  END IF;
  SELECT rfa.fee_config_id INTO v_fee
  FROM _resolver_fee_aplicable(
    v_cuenta.id, 'prestador_servicios'::tipo_actor_enum,
    (SELECT m.country_code FROM mascotas m WHERE m.id = p_mascota_id),
    'transaccional'::revenue_stream_enum, 'cita', NULL, now()
  ) rfa;
  IF v_fee IS NULL THEN
    RAISE EXCEPTION 'sin_fee_config' USING ERRCODE = '22023';
  END IF;

  -- vigencia congelada A LA FECHA DE COMPRA (decisión founder S63)
  v_vigencia := v_hoy_local + v_programa.vigencia_dias;
  v_unitario := round(v_programa.precio_programa / v_programa.n_sesiones, 2);

  -- UN cobro simulado DECLARADO por el programa entero (jamás el ledger).
  INSERT INTO programas_contratados (
    programa_id, user_id, mascota_id, prestador_id, prestador_servicio_id,
    n_sesiones, precio_total, precio_unitario_efectivo, duracion_minutos,
    vigencia_hasta, estado, estado_pago, country_code, pago_metadata,
    /* 🔴 LA FECHA Y LA HORA SE PERSISTEN, y antes no hacía falta: las sesiones
       nacían en el mismo acto que la compra. Con el cobro real la confirmación
       es ASINCRÓNICA — *quien la aplica no puede preguntarle a nadie cuándo
       empieza el programa.* Mismo criterio que la dirección del mandato. */
    fecha_inicio, hora, pago_expira_en
  ) VALUES (
    p_programa_id, v_auth, p_mascota_id, p_prestador_id, p_servicio_id,
    v_programa.n_sesiones, v_programa.precio_programa, v_unitario,
    v_programa.duracion_minutos_sesion,
    v_vigencia, 'activo', 'pendiente',
    COALESCE((SELECT m.country_code FROM mascotas m WHERE m.id = p_mascota_id), 'EC'),
    /* ☠️ MUERE `pago_simulado`: el programa cobra por el riel de verdad. */
    '{}'::jsonb,
    p_fecha_inicio, p_hora, now() + interval '15 minutes'
  ) RETURNING id INTO v_pc_id;

  /* ═══ LAS SESIONES YA NO NACEN ACÁ ══════════════════════════════════════
     🔴 Generarlas al comprar era **dar la agenda antes de cobrar**: N horas de
     un profesional comprometidas por un pago que todavía no ocurrió. Nacen en
     `confirmar_pago_programa`, cuando la plata entró.

     Lo que sí corre acá es el **ENSAYO**: `verificar_compuerta_programa` ejecuta
     la generación REAL en una subtransacción que se deshace. *Una validación que
     reimplementa las razones del acto se separa de él en el tercer cambio; un
     ensayo del acto no puede divergir de él porque ES él.*
     ⚠️ Y el ensayo se repite en la puerta de pago, inmediatamente antes del
     débito: entre esta llamada y el cobro pasa el tiempo que la familia tarda en
     tocar «pagar», y la agenda puede llenarse en el medio. */
  v_generadas := (public.verificar_compuerta_programa(v_pc_id)->>'sesiones')::int;
  IF v_generadas <> v_programa.n_sesiones THEN
    RAISE EXCEPTION 'programa_incompleto' USING ERRCODE = '22023';
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'programa_contratado_id', v_pc_id,
    'estado_pago', 'pendiente',
    'cobro_pendiente', true,
    'pago_expira_en', now() + interval '15 minutes',
    'n_sesiones', v_programa.n_sesiones,
    'primera_sesion', p_fecha_inicio,
    'ultima_sesion', p_fecha_inicio + ((v_programa.n_sesiones - 1) * 7),
    'vigencia_hasta', v_vigencia,
    'precio_total', v_programa.precio_programa,
    'precio_unitario_efectivo', v_unitario,
    'nota', 'programa registrado — las sesiones se agendan cuando el pago se confirme'
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.mover_sujeto_por_reverso(p_intento_id uuid, p_motivo text DEFAULT 'reverso del proveedor'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_i pagos_intentos; v_sujeto text; v_id uuid; v_ahora timestamptz := now();
  v_ped record; v_dest uuid; v_negocio text; v_prest uuid; v_avisos int := 0;
  v_futuras int := 0; v_pasadas int := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_i FROM pagos_intentos WHERE id = p_intento_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'codigo','intento_no_existe'); END IF;

  /* 🔴 SÓLO SOBRE UN INTENTO YA REVERSADO. *Mover el sujeto de un intento vivo
     sería cancelar un pedido pagado por una llamada equivocada* — y esta
     función tiene poder para hacerlo. El estado terminal ES la autorización. */
  IF v_i.estado NOT IN ('reversado','reverso_fallido') THEN
    RETURN jsonb_build_object('ok', false, 'codigo','intento_no_reversado','estado', v_i.estado);
  END IF;

  /* ¿QUÉ SUJETO? — del intento, sin `else` que asuma.
     ✏️ El comentario decía «el CHECK admite cuatro» y **admitía cinco desde que
     nació `bono_id`**; hoy admite SEIS. *Un comentario que cuenta de menos es
     como el guard que sabe de menos: el que lee cree que la lista está completa.* */
  IF    v_i.cita_id IS NOT NULL THEN v_sujeto := 'cita';         v_id := v_i.cita_id;
  ELSIF v_i.compra_id IS NOT NULL THEN v_sujeto := 'compra';     v_id := v_i.compra_id;
  ELSIF v_i.suscripcion_servicio_id IS NOT NULL THEN v_sujeto := 'suscripcion'; v_id := v_i.suscripcion_servicio_id;
  ELSIF v_i.recurrencia_id IS NOT NULL THEN v_sujeto := 'recurrencia'; v_id := v_i.recurrencia_id;
  ELSIF v_i.bono_id IS NOT NULL THEN v_sujeto := 'bono';         v_id := v_i.bono_id;
  ELSIF v_i.guarderia_suscripcion_id IS NOT NULL THEN v_sujeto := 'mensualidad_guarderia'; v_id := v_i.guarderia_suscripcion_id;
  ELSIF v_i.programa_contratado_id IS NOT NULL THEN v_sujeto := 'programa'; v_id := v_i.programa_contratado_id;
  ELSE RETURN jsonb_build_object('ok', false, 'codigo','sujeto_indeterminado'); END IF;

  -- ══ CITA ══ se cancela, libera el horario, y se enteran LOS DOS:
  --    la familia (le devolvieron la plata) y el prestador (recupera la hora)
  IF v_sujeto = 'cita' THEN
    UPDATE evento_cita_servicio
       SET estado = 'cancelada', estado_reserva = 'cancelada',
           metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
             'cancelada_por_reverso_en', v_ahora, 'motivo', p_motivo),
           updated_at = v_ahora
     WHERE id = v_id AND estado <> 'cancelada';

    /* El aviso va al PRESTADOR: *es su agenda y su tiempo.* Se resuelve el
       destinatario desde el prestador, no desde la cita, porque la cita no
       guarda a quién avisarle. */
    SELECT c.prestador_id INTO v_prest FROM evento_cita_servicio c WHERE c.id = v_id;
    SELECT p.user_id INTO v_dest FROM prestadores p WHERE p.id = v_prest;
    IF v_dest IS NOT NULL THEN
      PERFORM registrar_intencion_notificacion(
        p_tipo => 'pago_reversado', p_destinatario_user_id => v_dest,
        p_mascota_id => NULL, p_evento_id => NULL,
        /* 🔴 EL TEXTO SE PIDE, NO SE ESCRIBE ACÁ. Antes viajaba inline y eso
           lo dejaba **fuera del único lugar donde las voces se firman y se
           traducen** — quince productores usan `_voz_notificacion` y éste no.
           *Un aviso que nace donde nadie lo revisa nace en español y se queda
           en español.* */
        p_datos => _voz_notificacion('pago_reversado', v_dest, NULL,
                     jsonb_build_object('sujeto','cita'))
                   || jsonb_build_object('sujeto','cita','sujeto_id', v_id, 'motivo', p_motivo),
        p_clave_dedup => 'reverso:cita:' || v_id::text || ':prestador');
      v_avisos := v_avisos + 1;
    END IF;

    /* 🔴 Y A LA FAMILIA — firma del founder, 27-ago: *un movimiento de plata se
       le avisa a quien puso la plata.* Antes solo se avisaba al prestador, con
       la razon escrita «es su agenda y su tiempo» — que decidia a quien avisar
       de una CANCELACION, no de una DEVOLUCION. **Que la cita desaparezca sin
       explicacion es peor que cualquier voz.**

       El destinatario es el PAGADOR del intento, no el titular de la familia:
       *quien puso la plata es quien la recupera.* Medido: 0 de 24 intentos de
       cita tienen `pagador_user_id` nulo. */
    IF v_i.pagador_user_id IS NOT NULL THEN
      PERFORM registrar_intencion_notificacion(
        p_tipo => 'pago_reversado', p_destinatario_user_id => v_i.pagador_user_id,
        p_mascota_id => NULL, p_evento_id => NULL,
        p_datos => _voz_notificacion('pago_reversado', v_i.pagador_user_id, NULL,
                     jsonb_build_object('sujeto','cita','para','familia'))
                   || jsonb_build_object('sujeto','cita','sujeto_id', v_id, 'motivo', p_motivo),
        /* 🔴 LA CLAVE LLEVA AL DESTINATARIO. Sin eso el dedup se come el
           segundo aviso: la clave vieja era `reverso:cita:<id>` para los dos, y
           **la familia nunca se habria enterado, en silencio.** */
        p_clave_dedup => 'reverso:cita:' || v_id::text || ':familia');
      v_avisos := v_avisos + 1;
    END IF;

  -- ══ COMPRA + PEDIDOS ══ por la PUERTA, que además libera el inventario
  ELSIF v_sujeto = 'compra' THEN
    FOR v_ped IN SELECT p.* FROM pedidos p WHERE p.compra_id = v_id
                  AND p.estado NOT IN ('cancelado_sistema','cancelado_cliente','cancelado_vendedor')
    LOOP
      /* 🔴 EL FALLO DE UN PEDIDO NO TUMBA LA CANCELACIÓN DE LOS OTROS ni la de
         la compra: *la plata ya volvió y el estado tiene que reflejarlo aunque
         una transición puntual rebote.* El motivo queda escrito igual. */
      BEGIN
        /* 🔴 `'sistema'`, no `'admin'`: esto corre desde un trigger, **sin
           sesión**. Con `'admin'` rebotaba `auth_requerido` y el pedido
           quedaba vivo con su reserva apartada. *El actor no es una etiqueta
           decorativa: es lo que decide si la puerta abre.* */
        PERFORM cancelar_pedido_despensa(v_ped.id, 'sistema', p_motivo);
      EXCEPTION WHEN OTHERS THEN
        UPDATE pedidos SET notas_admin = COALESCE(notas_admin,'') ||
               ' · reverso no pudo cancelar: ' || SQLERRM WHERE id = v_ped.id;
      END;

      -- si estaba en preparación o más allá, el VENDEDOR se entera
      IF v_ped.estado IN ('liberado_preparacion','documentado','en_reparto','hacia_destino') THEN
        SELECT cc.nombre_comercial INTO v_negocio FROM cuentas_comerciales cc
         WHERE cc.id = v_ped.cuenta_comercial_id;
        SELECT cc.owner_profile_id INTO v_dest FROM cuentas_comerciales cc
         WHERE cc.id = v_ped.cuenta_comercial_id;
        IF v_dest IS NOT NULL THEN
          PERFORM registrar_intencion_notificacion(
            p_tipo => 'pago_reversado', p_destinatario_user_id => v_dest,
            p_mascota_id => NULL, p_evento_id => NULL,
            /* Mismo tipo, otro destinatario: la voz bifurca por `sujeto`.
               Va el `numero_orden` porque **es lo que el vendedor tiene
               pegado en la caja** — un uuid no le sirve para encontrarla. */
            p_datos => _voz_notificacion('pago_reversado', v_dest, NULL,
                         jsonb_build_object('sujeto','pedido',
                           'numero_orden', v_ped.numero_orden))
                       || jsonb_build_object('sujeto','pedido','sujeto_id', v_ped.id,
                            'negocio', v_negocio, 'motivo', p_motivo),
            p_clave_dedup => 'reverso:pedido:' || v_ped.id::text);
          v_avisos := v_avisos + 1;
        END IF;
      END IF;
    END LOOP;

    UPDATE compras SET estado = 'cancelada', updated_at = v_ahora
     WHERE id = v_id AND estado <> 'cancelada';

  -- ══ SUSCRIPCIÓN ══ se corta y NO renueva
  ELSIF v_sujeto = 'suscripcion' THEN
    UPDATE suscripciones_servicio
       SET estado = 'cancelada', auto_renovar = false,
           cancelado_en = v_ahora, motivo_cancelacion = p_motivo
     WHERE id = v_id AND estado <> 'cancelada';

  -- ══ BONO (paquete de guardería) ══ el saldo muere y los días futuros con él
  ELSIF v_sujeto = 'bono' THEN
    /* La plata volvió ⇒ el saldo no puede seguir en pie. `reembolsado` ya
       existe en `bonos_estado_pago_valido`: no se inventa un estado. */
    UPDATE bonos SET estado = 'cancelado', estado_pago = 'reembolsado',
           pago_metadata = COALESCE(pago_metadata,'{}'::jsonb)
                           || jsonb_build_object('reversado_en', v_ahora, 'motivo', p_motivo)
     WHERE id = v_id AND estado_pago <> 'reembolsado';

    /* 🔴 SÓLO LOS DÍAS QUE TODAVÍA NO OCURRIERON. *Cancelar una estadía que el
       perro ya vivió sería escribir que no pasó algo que pasó* — el prestador
       ya trabajó ese día. Se cancela lo futuro y **lo ya ocurrido se CUENTA y
       se devuelve**, para que una persona vea que hubo servicio prestado contra
       plata devuelta. La casa no decide sola qué hacer con eso. */
    UPDATE evento_cita_servicio
       SET estado = 'cancelada', estado_reserva = 'cancelada',
           metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
             'cancelada_por_reverso_en', v_ahora, 'motivo', p_motivo),
           updated_at = v_ahora
     WHERE bono_id = v_id AND fecha >= public.hoy_local() AND estado <> 'cancelada';
    GET DIAGNOSTICS v_futuras = ROW_COUNT;

    SELECT count(*) INTO v_pasadas FROM evento_cita_servicio
     WHERE bono_id = v_id AND fecha < public.hoy_local() AND estado <> 'cancelada';

    UPDATE guarderia_estadias e SET estado = 'cancelada'
     WHERE e.estado NOT IN ('cancelada','cerrada')
       AND EXISTS (SELECT 1 FROM evento_cita_servicio c
                    WHERE c.id = e.cita_id AND c.bono_id = v_id
                      AND c.fecha >= public.hoy_local());

    IF v_i.pagador_user_id IS NOT NULL THEN
      PERFORM registrar_intencion_notificacion(
        p_tipo => 'pago_reversado', p_destinatario_user_id => v_i.pagador_user_id,
        p_mascota_id => NULL, p_evento_id => NULL,
        p_datos => _voz_notificacion('pago_reversado', v_i.pagador_user_id, NULL,
                     jsonb_build_object('sujeto','bono','para','familia'))
                   || jsonb_build_object('sujeto','bono','sujeto_id', v_id,
                        'dias_cancelados', v_futuras, 'motivo', p_motivo),
        p_clave_dedup => 'reverso:bono:' || v_id::text || ':familia');
      v_avisos := v_avisos + 1;
    END IF;

  -- ══ MENSUALIDAD DE GUARDERÍA ══ el mandato se corta y no vuelve a cobrar
  ELSIF v_sujeto = 'mensualidad_guarderia' THEN
    UPDATE guarderia_suscripciones
       SET estado = 'cancelada', cancelada_en = v_ahora, updated_at = v_ahora
     WHERE id = v_id AND estado <> 'cancelada';

    /* Los días del mes que todavía no ocurrieron. **No hay FK**: la cita guarda
       su origen en `metadata`, así que el vínculo se lee de ahí — y se declara
       acá para que nadie lo busque como columna. */
    UPDATE evento_cita_servicio
       SET estado = 'cancelada', estado_reserva = 'cancelada',
           metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
             'cancelada_por_reverso_en', v_ahora, 'motivo', p_motivo),
           updated_at = v_ahora
     WHERE metadata->>'suscripcion_id' = v_id::text
       AND fecha >= public.hoy_local() AND estado <> 'cancelada';
    GET DIAGNOSTICS v_futuras = ROW_COUNT;

    SELECT count(*) INTO v_pasadas FROM evento_cita_servicio
     WHERE metadata->>'suscripcion_id' = v_id::text
       AND fecha < public.hoy_local() AND estado <> 'cancelada';

    UPDATE guarderia_estadias e SET estado = 'cancelada'
     WHERE e.estado NOT IN ('cancelada','cerrada')
       AND EXISTS (SELECT 1 FROM evento_cita_servicio c
                    WHERE c.id = e.cita_id
                      AND c.metadata->>'suscripcion_id' = v_id::text
                      AND c.fecha >= public.hoy_local());

    IF v_i.pagador_user_id IS NOT NULL THEN
      PERFORM registrar_intencion_notificacion(
        p_tipo => 'pago_reversado', p_destinatario_user_id => v_i.pagador_user_id,
        p_mascota_id => NULL, p_evento_id => NULL,
        p_datos => _voz_notificacion('pago_reversado', v_i.pagador_user_id, NULL,
                     jsonb_build_object('sujeto','mensualidad_guarderia','para','familia'))
                   || jsonb_build_object('sujeto','mensualidad_guarderia','sujeto_id', v_id,
                        'dias_cancelados', v_futuras, 'motivo', p_motivo),
        p_clave_dedup => 'reverso:guarderia_susc:' || v_id::text || ':familia');
      v_avisos := v_avisos + 1;
    END IF;

  -- ══ PROGRAMA DE ADIESTRAMIENTO ══ el saldo muere y las sesiones futuras con él
  ELSIF v_sujeto = 'programa' THEN
    UPDATE programas_contratados
       /* ✏️ NO se escribe `motivo_vencimiento`: `chk_pc_motivo_solo_vencido` lo
          reserva para el estado `vencido`, y **un reverso cancela, no vence** —
          son dos finales distintos y el esquema ya los separaba. *El motivo
          viaja igual, en `pago_metadata`, que es donde vive el resto de la
          historia del pago.* Lo enseñó el CHECK, no un documento. */
       SET estado = 'cancelado', estado_pago = 'reembolsado',
           pago_metadata = COALESCE(pago_metadata,'{}'::jsonb)
                           || jsonb_build_object('reversado_en', v_ahora, 'motivo', p_motivo),
           updated_at = v_ahora
     WHERE id = v_id AND estado_pago <> 'reembolsado';

    /* 🔴 SÓLO LAS SESIONES QUE NO OCURRIERON. *Cancelar una sesión que el perro
       ya tuvo sería escribir que no pasó algo que pasó* — el adiestrador ya
       trabajó ese día. Lo ya ocurrido se CUENTA y se devuelve. */
    UPDATE evento_cita_servicio
       SET estado = 'cancelada', estado_reserva = 'cancelada',
           metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
             'cancelada_por_reverso_en', v_ahora, 'motivo', p_motivo),
           updated_at = v_ahora
     WHERE programa_contratado_id = v_id
       AND fecha >= public.hoy_local() AND estado <> 'cancelada';
    GET DIAGNOSTICS v_futuras = ROW_COUNT;

    SELECT count(*) INTO v_pasadas FROM evento_cita_servicio
     WHERE programa_contratado_id = v_id
       AND fecha < public.hoy_local() AND estado <> 'cancelada';

    IF v_i.pagador_user_id IS NOT NULL THEN
      PERFORM registrar_intencion_notificacion(
        p_tipo => 'pago_reversado', p_destinatario_user_id => v_i.pagador_user_id,
        p_mascota_id => NULL, p_evento_id => NULL,
        p_datos => _voz_notificacion('pago_reversado', v_i.pagador_user_id, NULL,
                     jsonb_build_object('sujeto','programa','para','familia'))
                   || jsonb_build_object('sujeto','programa','sujeto_id', v_id,
                        'sesiones_canceladas', v_futuras, 'motivo', p_motivo),
        p_clave_dedup => 'reverso:programa:' || v_id::text || ':familia');
      v_avisos := v_avisos + 1;
    END IF;

  -- ══ RECURRENCIA ══
  ELSE
    UPDATE pedidos_recurrencias SET estado = 'cancelada' WHERE id = v_id AND estado <> 'cancelada';
  END IF;

  RETURN jsonb_build_object('ok', true, 'sujeto', v_sujeto, 'sujeto_id', v_id,
                            'avisos', v_avisos, 'motivo', p_motivo,
                            /* Se DEVUELVEN los dos números: lo que se canceló y
                               lo que ya había ocurrido y NO se tocó. */
                            'dias_cancelados', v_futuras,
                            'dias_ya_ocurridos', v_pasadas);
END $function$

;
CREATE OR REPLACE FUNCTION public.aplicar_evento_de_pago(p_evento_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_e webhook_events; v_vivo boolean; v_ref uuid; v_monto numeric; v_estado text;
  v_tx text; v_auth text; v_res jsonb; v_user uuid; v_negocio text; v_moneda text;
  v_es_cita boolean; v_intento uuid; v_refcorta text; v_tocadas int; v_src jsonb; v_cuantos int; v_que_es text; v_acto jsonb; v_mov jsonb;
  v_sub numeric; v_imp numeric; v_periodo date;
BEGIN
  SELECT * INTO v_e FROM webhook_events WHERE id = p_evento_id FOR UPDATE;
  IF v_e.id IS NULL THEN RAISE EXCEPTION 'evento_no_existe' USING ERRCODE='22023'; END IF;

  SELECT (valor = 'true') INTO v_vivo FROM app_config WHERE clave = 'pagos_actuador_vivo';
  IF NOT COALESCE(v_vivo, false) THEN
    RETURN jsonb_build_object('ok', true, 'aplicado', false, 'motivo', 'actuador_apagado');
  END IF;

  /* (1) LA PUERTA — por PROVEEDOR y en un solo lugar. Mismo RETURN y mismo
     motivo que antes: si el motivo cambia, cambia lo que un tablero muestra. */
  IF NOT _evento_autenticado(v_e) THEN
    RETURN jsonb_build_object('ok', true, 'aplicado', false,
      'motivo', 'evento_no_autenticado_o_no_server');
  END IF;

  /* (2) LA FUENTE DE VERDAD, POR PROVEEDOR — §7.
     DeUna: SÓLO `info`, la respuesta verificada. Sin ella no se confirma.
     Nuvei: su propio payload, sin tocar. */
  IF v_e.proveedor = 'deuna' THEN
    v_src := v_e.payload->'info';
    IF v_src IS NULL OR jsonb_typeof(v_src) <> 'object' THEN
      UPDATE webhook_events SET resultado='no_verificado',
        detalle = COALESCE(detalle,'') || ' · actuador: sin consulta verificada'
       WHERE id = p_evento_id;
      RETURN jsonb_build_object('ok', true, 'aplicado', false,
        'motivo', 'sin_consulta_verificada');
    END IF;
  ELSE
    v_src := v_e.payload;
  END IF;

  /* (3) LAS CINCO EXTRACCIONES, POR VOCABULARIO. */
  IF v_e.proveedor = 'deuna' THEN
    v_refcorta := NULLIF(v_src->>'internalTransactionReference','');
    /* 🔴 LA AMBIGÜEDAD SE NOMBRA ACÁ, NO SE DELEGA AL ÍNDICE.
       Hoy `uq_pagos_intentos_referencia_corta` hace imposible el duplicado —
       pero un `SELECT … INTO` sin cota tomaría UNA FILA SIN AVISAR el día que
       ese índice se caiga o alguien lo afloje. *Una defensa que vive en otra
       pieza no es una defensa: es una coincidencia.* El motor se defiende solo
       y con nombre propio. */
    SELECT count(*) INTO v_cuantos FROM pagos_intentos WHERE referencia_corta = v_refcorta;
    IF v_cuantos > 1 THEN
      UPDATE webhook_events SET resultado='desconocido',
        detalle = COALESCE(detalle,'') || ' · actuador: referencia ambigua (' || v_cuantos || ')'
       WHERE id = p_evento_id;
      RETURN jsonb_build_object('ok', false, 'aplicado', false,
        'motivo', 'referencia_ambigua', 'cuantos', v_cuantos);
    END IF;
    /* ✏️ LOS CUATRO SUJETOS QUE ESTA RAMA SABE RESOLVER. Eran dos; los otros
       caían en `sujeto_no_soportado` — correcto y sin mover nada. *En DeUna el
       sujeto NO viaja en el payload: se resuelve desde nuestro propio intento
       por la referencia corta, así que agregar un sujeto es agregarlo acá.* */
    SELECT i.id, COALESCE(i.compra_id, i.cita_id, i.bono_id, i.guarderia_suscripcion_id, i.programa_contratado_id)
      INTO v_intento, v_ref
      FROM pagos_intentos i WHERE i.referencia_corta = v_refcorta;
    IF v_ref IS NULL THEN
      /* ═══ UN SUJETO QUE NO SÉ MOVER SE NOMBRA Y SE MARCA ═══════════════════
         🔴 Firma del founder (31-ago): **un sujeto desconocido que devuelve
         éxito es un cobro que no ocurrió reportado como ocurrido, y es el peor
         defecto posible en el motor de pagos.**

         Esta rama devolvía `ok: true` **sin escribir nada en el evento**: el
         webhook lo logueaba y devolvía 200. *No hay columna que se pueda
         listar, contar ni alertar — sólo una línea de consola que nadie mira.*

         El XOR de `pagos_intentos` admite **cinco** sujetos y esta ruta resuelve
         **dos** (`compra_id`, `cita_id`). Los otros tres —y todo el que se
         agregue— caían acá en silencio. Ahora se distingue **«el intento no
         existe»** de **«existe y su sujeto no lo sé mover»**, que son dos cosas
         distintas y sólo la segunda es un problema nuestro. */
      IF v_intento IS NOT NULL THEN
        SELECT CASE
                 WHEN i.bono_id                IS NOT NULL THEN 'bono'
                 WHEN i.guarderia_suscripcion_id IS NOT NULL THEN 'mensualidad_guarderia'
                 WHEN i.recurrencia_id         IS NOT NULL THEN 'recurrencia'
                 WHEN i.suscripcion_servicio_id IS NOT NULL THEN 'suscripcion_servicio'
                 WHEN i.pedido_id              IS NOT NULL THEN 'pedido'
                 ELSE 'sin_sujeto' END
          INTO v_que_es FROM pagos_intentos i WHERE i.id = v_intento;
        UPDATE webhook_events SET resultado = 'desconocido',
          detalle = COALESCE(detalle,'') || ' · actuador: sujeto ' || v_que_es
                    || ' — esta puerta no lo sabe mover'
         WHERE id = p_evento_id;
        RETURN jsonb_build_object('ok', false, 'aplicado', false,
          'motivo', 'sujeto_no_soportado', 'sujeto', v_que_es,
          'intento_id', v_intento, 'referencia', v_refcorta);
      END IF;
      UPDATE webhook_events SET resultado = 'desconocido',
        detalle = COALESCE(detalle,'') || ' · actuador: no hay intento con esa referencia'
       WHERE id = p_evento_id;
      RETURN jsonb_build_object('ok', false, 'aplicado', false,
        'motivo', 'sin_referencia_corta', 'referencia', v_refcorta);
    END IF;
    v_estado := v_src->>'status';
    v_monto  := NULLIF(v_src->>'amount','')::numeric;
    v_tx     := v_src->>'transactionId';
    v_auth   := NULLIF(v_src->>'transferNumber','');   -- §3.6
  ELSE
    -- NUVEI: byte-idéntico a lo que había. No se mueve un signo.
    v_ref := NULLIF(v_src->'transaction'->>'dev_reference','')::uuid;
    IF v_ref IS NULL THEN
      RETURN jsonb_build_object('ok', true, 'aplicado', false, 'motivo', 'sin_dev_reference');
    END IF;
    v_estado := v_src->'transaction'->>'status';
    v_monto  := NULLIF(v_src->'transaction'->>'amount','')::numeric;
    v_tx     := v_src->'transaction'->>'id';
    v_auth   := v_src->'transaction'->>'authorization_code';
  END IF;

  /* (3bis) 🔴 ¿ES UN REVERSO? — LA PREGUNTA QUE FALTABA, Y VA **ANTES** DEL
     CLASIFICADOR DE APROBACIÓN A PROPÓSITO.
     Un reverso de Nuvei llega con `status = 2`, **igual que un rechazo**: para
     `_pago_aprobado` los dos son "no confirma" y morían juntos en
     `desconocido`. *No fallaba — los CONFUNDÍA, y un evento que se confunde
     con otro no deja síntoma: deja un contador de rechazos que parece normal.*

     MEDIDO contra el evento REAL `DF-2102135` (25-ago-2026, sandbox, reverso
     ejercido por el founder desde el panel):
        status=2 · status_detail=7 · current_status=CANCELLED
        carrier_code=ReversedByMerchant · message="Reverse by mock"
     y **`transaction.id` NO CAMBIA** — Nuvei no emite un id de reverso propio
     (a diferencia de DeUna, que sí: ver `LETRA_DEUNA` §8). Por eso el intento
     se encuentra por su `proveedor_transaction_id` y no por una referencia
     nueva que en este riel no existe.

     🔴 DÓNDE VIVE CADA VOCABULARIO, y por qué son dos y no uno:
       · «¿esto ES un reverso?» → `_nuvei_status_detail_es_reverso` (acá abajo)
       · «¿qué CLASE de reverso es?» → `registrar_reverso_nuvei` (pista D)
     Son dos preguntas distintas con dueños distintos. Juntarlas en una lista
     sola obligaría a que el actuador supiera de reversos parciales, que es
     asunto de quien registra, no de quien reconoce. */
  IF v_e.proveedor <> 'deuna'
     AND _nuvei_status_detail_es_reverso(v_src->'transaction'->>'status_detail')
  THEN
    SELECT i.id INTO v_intento FROM pagos_intentos i
     WHERE i.proveedor_transaction_id = v_tx AND i.proveedor = 'nuvei';

    IF v_intento IS NULL THEN
      /* *Un reverso sin intento no se ignora: se nombra.* Es plata que el
         proveedor dice haber devuelto sobre un cobro que nosotros no
         registramos — el caso más grave posible, y el único aviso que va a
         haber es esta línea. */
      UPDATE webhook_events SET resultado='desconocido',
        detalle = COALESCE(detalle,'') || ' · actuador: REVERSO SIN INTENTO (tx=' || COALESCE(v_tx,'?') || ')'
       WHERE id = p_evento_id;
      /* 🔴 `ok:false` — firma del founder (31-ago): **plata devuelta que no
         encontró su intento.** Un `ok` acá dice «resuelto» sobre dinero que
         quedó sin dueño. *Es un estado que exige intervención humana, y un ok
         lo hace invisible.* */
      RETURN jsonb_build_object('ok', false, 'aplicado', false,
        'motivo', 'reverso_sin_intento', 'tx', v_tx);
    END IF;

    /* 🔴 `refund_amount` NO EXISTE en el payload del reverso — MEDIDO sobre
       `DF-2102135`. Lo único que viaja es `amount`, que es el monto de LA
       TRANSACCIÓN ORIGINAL. Se pasa como tal y se declara acá: quien lea
       `reverso.refund_amount` en el crudo está leyendo el monto del cobro, no
       un refund que el proveedor haya declarado aparte. *Un campo que se llama
       como otro miente sin equivocarse.* */
    v_acto := registrar_reverso_nuvei(
      v_intento,
      v_tx,
      v_src->'transaction'->>'status_detail',
      NULLIF(v_src->'transaction'->>'amount','')::numeric,
      v_src->'transaction'->>'authorization_code');

    UPDATE webhook_events
       SET resultado = CASE WHEN COALESCE((v_acto->>'ok')::boolean, false)
                            THEN 'aplicado' ELSE 'desconocido' END,
           detalle = COALESCE(detalle,'') || ' · actuador: reverso ' || COALESCE(v_acto->>'codigo','?')
     WHERE id = p_evento_id;

    /* 🔴 EL SUJETO NO SE MOVIÓ, y se dice DOS VECES a propósito.
       `registrar_reverso_nuvei` ya lo declara en su respuesta; el actuador lo
       repite en la suya porque **es su llamador el que queda a medias**, y
       nadie debería tener que abrir dos funciones para enterarse de que la
       compra sigue diciendo `pagada` sobre plata devuelta. `D-923`, dueño A. */
    /* 🔴 `D-923` CERRADA: el sujeto SE MUEVE, y recién ahora.
       Antes esta rama devolvía `sujeto_movido: false` con la deuda escrita —
       *la plata había vuelto y la compra seguía diciendo `pagada`.* La orden
       importa: **D registra el reverso primero** (idempotente, con su ventana)
       y sólo si eso salió bien se mueve el sujeto. Al revés cancelaríamos un
       pedido por un reverso que el proveedor todavía no confirmó. */
    /* 🔴 YA NO SE LLAMA A MANO. El sujeto lo mueve
       `trg_pagos_intentos_reverso_mueve_sujeto`, que dispara cuando el intento
       ENTRA en estado terminal — **sin importar qué riel lo reversó**.
       *Cablear la llamada por riel es cómo el segundo riel se olvida: DeUna
       tuvo su función de registro construida y su sujeto quedó sin mover.*
       Lo que se lee acá es el resultado, no la orden. */
    /* 🔴 ANTES ESTO AFIRMABA SOBRE OTRA COSA. Decía `sujeto_movido: true` con
       sólo mirar que el INTENTO estuviera reversado — que es lo que acababa de
       hacer el UPDATE de arriba, no lo que hizo el trigger. *Un campo que
       responde una pregunta distinta de la que su nombre hace miente sin
       equivocarse.* Ahora se lee la EVIDENCIA que el trigger deja cuando no
       pudo mover el sujeto. (Hallazgo cruzado de S108-B, verificado acá.) */
    SELECT jsonb_build_object(
             'ok', i.estado IN ('reversado','reverso_fallido')
                   AND NOT (COALESCE(i.payload_crudo,'{}'::jsonb) ? 'sujeto_no_movido'),
             'via', 'trigger', 'estado', i.estado,
             'fallo', COALESCE(i.payload_crudo,'{}'::jsonb)->'sujeto_no_movido')
      INTO v_mov FROM pagos_intentos i WHERE i.id = v_intento;

    RETURN jsonb_build_object('ok', true,
      'aplicado', COALESCE((v_acto->>'ok')::boolean, false),
      'motivo', 'reverso_nuvei', 'acto', v_acto,
      'sujeto_movido', COALESCE((v_mov->>'ok')::boolean, false),
      'movimiento', v_mov);
  END IF;

  IF NOT _pago_aprobado(v_src) THEN
    UPDATE webhook_events SET resultado='desconocido',
      detalle = COALESCE(detalle,'') || ' · actuador: status=' || COALESCE(v_estado,'0') || ' no confirma'
     WHERE id = p_evento_id;
    RETURN jsonb_build_object('ok', true, 'aplicado', false,
      'motivo', 'status_no_aprobado', 'status', v_estado);
  END IF;

  /* 🔴 QUÉ SUJETO ES — se pregunta a los datos, no se supone por el formato. */
  SELECT EXISTS (SELECT 1 FROM evento_cita_servicio WHERE id = v_ref) INTO v_es_cita;

  IF v_es_cita THEN
    IF EXISTS (SELECT 1 FROM evento_cita_servicio
                WHERE id = v_ref AND estado_reserva = 'pagada') THEN
      UPDATE webhook_events SET resultado='duplicado' WHERE id = p_evento_id;
      RETURN jsonb_build_object('ok', true, 'aplicado', false, 'motivo', 'cita_ya_pagada');
    END IF;

    IF v_monto IS NOT NULL AND v_monto <> (SELECT total FROM cita_desglose WHERE cita_id = v_ref) THEN
      UPDATE webhook_events SET resultado='monto_no_coincide' WHERE id = p_evento_id;
      /* 🔴 `ok:false` — firma del founder: **llegó plata por otro monto**, y es
       el caso donde más importa que alguien mire. */
    RETURN jsonb_build_object('ok', false, 'aplicado', false, 'motivo', 'monto_no_coincide');
    END IF;

    UPDATE evento_cita_servicio
       SET estado = 'confirmada', estado_reserva = 'pagada',
           metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
             'pagado_en', now(), 'transaction_id', v_tx, 'authorization_code', v_auth),
           updated_at = now()
     WHERE id = v_ref;

    UPDATE pagos_intentos
       SET estado='aprobado', confirmado_por='webhook', payload_crudo=v_e.payload,
           authorization_code=v_auth,
           proveedor_transaction_id = COALESCE(proveedor_transaction_id, v_tx),
           cerrado_en=now(), actualizado_en=now()
     WHERE ((v_intento IS NOT NULL AND id = v_intento)
        OR (v_intento IS NULL AND cita_id = v_ref AND proveedor_transaction_id = v_tx))
       /* 🔴 D-916 · GUARD DE ESTADO TERMINAL. Sin esto, un evento de aprobacion
          posterior a un reverso devuelve el intento a 'aprobado' y la cita
          revive: plata devuelta que vuelve a contarse como cobrada. */
       AND estado NOT IN ('reversado','reverso_fallido');
    GET DIAGNOSTICS v_tocadas = ROW_COUNT;

    SELECT m.user_id INTO v_user FROM evento_cita_servicio c
      JOIN mascotas m ON m.id = c.mascota_id WHERE c.id = v_ref;
    SELECT cc.nombre_comercial, d.moneda INTO v_negocio, v_moneda
      FROM evento_cita_servicio c
      JOIN prestadores p ON p.id = c.prestador_id
      JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
      LEFT JOIN cita_desglose d ON d.cita_id = c.id
     WHERE c.id = v_ref;

    PERFORM registrar_intencion_notificacion(
      p_tipo => 'pago_confirmado', p_destinatario_user_id => v_user,
      p_mascota_id => NULL, p_evento_id => NULL,
      p_datos => jsonb_build_object(
        'titulo','Tu pago quedó confirmado',
        'mensaje','Guarda estos datos: son el respaldo de tu pago.',
        'negocio', v_negocio, 'concepto', _concepto_de_pago(v_ref),
        'transaction_id', v_tx, 'authorization_code', v_auth,
        'monto', v_monto, 'moneda', COALESCE(v_moneda,'USD'),
        /* 🔴 EL IMPUESTO, DESGLOSADO — `L-318` en su forma más callada: el
           comprobante llevaba el total y **ningún campo de impuesto**. Medido
           antes de curar: **0 de 27 comprobantes emitidos lo llevaron**, y ni
           `aplicar_evento_de_pago` ni `confirmar_pago_compra` mencionaban la
           palabra. *No era que faltaba el dato: faltaba el campo* — así que
           levantar el guard del IVA no lo habría hecho aparecer.
           Sale del DESGLOSE CONGELADO, jamás recalculado: el comprobante tiene
           que decir lo que se cobró, no lo que hoy daría la cuenta. */
        'subtotal', (SELECT subtotal FROM cita_desglose WHERE cita_id = v_ref),
        'impuesto', (SELECT impuesto FROM cita_desglose WHERE cita_id = v_ref),
        'sujeto_id', v_ref),
      p_clave_dedup => 'comprobante:' || v_ref::text);

    UPDATE webhook_events SET resultado='aplicado',
      detalle = COALESCE(detalle,'') || ' · actuador: CITA confirmada · intentos=' || v_tocadas
     WHERE id = p_evento_id;
    RETURN jsonb_build_object('ok', true, 'aplicado', true, 'sujeto','cita',
                              'cita_id', v_ref, 'intentos_cerrados', v_tocadas);
  END IF;

  -- ══ LA COMPRA ══════════════════════════════════════════════════════════
  -- S103: LOS OTROS DOS SUJETOS — el cobro recurrente.
  --  🔴 EL ORDEN NO ES ESTILO: `renovar_plan_cobrado` y
  --  `crear_pedido_de_recurrencia_cobrada` EXIGEN un intento ya `aprobado`
  --  (la plata dispara el acto, jamas el reloj) => se marca PRIMERO y se
  --  dispara DESPUES. Al reves devolverian `sin_cobro_aprobado` sobre un cobro
  --  que si ocurrio.
  IF v_intento IS NULL THEN
    SELECT i.id INTO v_intento FROM pagos_intentos i
     WHERE (i.recurrencia_id = v_ref OR i.suscripcion_servicio_id = v_ref)
       AND i.estado IN ('iniciado','pendiente','aprobado','expirado')
     ORDER BY i.creado_en DESC LIMIT 1;
  END IF;

  IF v_intento IS NOT NULL
     AND EXISTS (SELECT 1 FROM pagos_intentos WHERE id = v_intento
                  AND (recurrencia_id IS NOT NULL OR suscripcion_servicio_id IS NOT NULL)) THEN
    UPDATE pagos_intentos
       SET estado='aprobado', confirmado_por='webhook', payload_crudo=v_e.payload,
           authorization_code=v_auth,
           proveedor_transaction_id = COALESCE(proveedor_transaction_id, v_tx),
           cerrado_en=now(), actualizado_en=now()
     WHERE id = v_intento
       /* 🔴 D-916 · el mismo guard. Son DOS UPDATE y los dos lo necesitan:
          curar uno solo deja la puerta abierta por el otro sujeto. */
       AND estado NOT IN ('reversado','reverso_fallido');

    --  🔴 EL ACTO 2 SE ATRAPA A PROPOSITO: el cobro YA OCURRIO. Si renovar o
    --  crear el pedido falla, el intento tiene que quedar `aprobado` igual —
    --  dejar caer la excepcion revertiria la marca del pago y el proveedor
    --  reintentaria contra un cobro ya hecho. El fallo se escribe con su
    --  nombre para que una persona lo vea.
    BEGIN
      SELECT CASE
        WHEN i.suscripcion_servicio_id IS NOT NULL
          THEN renovar_plan_cobrado(i.suscripcion_servicio_id, i.suscripcion_periodo)
        ELSE crear_pedido_de_recurrencia_cobrada(i.recurrencia_id, i.recurrencia_periodo)
      END INTO v_acto FROM pagos_intentos i WHERE i.id = v_intento;
    EXCEPTION WHEN OTHERS THEN
      v_acto := jsonb_build_object('ok', false, 'motivo', 'acto2_fallo', 'causa', SQLERRM);
    END;

    UPDATE webhook_events SET resultado='aplicado',
      /* ✏️ LA CAUSA SE PUBLICA. Se capturaba en `v_acto->>'causa'` y se
         DESCARTABA: en `webhook_events` quedaba `acto2=false` y nada más.
         *Un fallo que no dice por qué obliga a re-ejecutar el caso — y en pagos
         re-ejecutar es volver a mover plata.* (Hallazgo de S108-B, que tuvo que
         reproducir a mano un cobro real de $100 para saber la causa.) */
      detalle = COALESCE(detalle,'') || ' · actuador: recurrente · acto2=' || COALESCE(v_acto->>'ok','?')
                || COALESCE(' · ' || COALESCE('causa=' || (v_acto->>'causa'),
                                                 'codigo=' || (v_acto->>'codigo')), '')
     WHERE id = p_evento_id;
    RETURN jsonb_build_object('ok', true, 'aplicado', true, 'sujeto','recurrente',
                              'intento_id', v_intento, 'acto2', v_acto);
  END IF;

  -- ══ LOS DOS SUJETOS DE GUARDERÍA ═══════════════════════════════════════
  --  El paquete (`bono`) y la mensualidad. Mismo orden que el recurrente y por
  --  la misma razón: **se marca el intento PRIMERO y se dispara el acto
  --  DESPUÉS**, porque las dos puertas exigen un cobro ya aprobado.
  IF v_intento IS NULL THEN
    SELECT i.id INTO v_intento FROM pagos_intentos i
     WHERE (i.bono_id = v_ref OR i.guarderia_suscripcion_id = v_ref
            OR i.programa_contratado_id = v_ref)
       AND i.estado IN ('iniciado','pendiente','aprobado','expirado')
     ORDER BY i.creado_en DESC LIMIT 1;
  END IF;

  IF v_intento IS NOT NULL
     AND EXISTS (SELECT 1 FROM pagos_intentos WHERE id = v_intento
                  AND (bono_id IS NOT NULL OR guarderia_suscripcion_id IS NOT NULL
                       OR programa_contratado_id IS NOT NULL)) THEN

    /* ═══ EL MONTO SE VERIFICA CONTRA LO CONGELADO — fail-CLOSED ═══════════
       🔴 El paquete se compara contra `bono_desglose`, que es el precio que se
       le prometió a la familia al comprar. **Si no hay desglose, NO se
       confirma.** Medido hoy: `bono_desglose` tiene 0 filas — nadie lo alimenta
       todavía (es de S108-B). *Escribir la comparación igual pero dejándola
       pasar cuando falta la fila sería un guard decorativo: con NULL, `<>` da
       NULL y todo pasa. Un cheque que no puede fallar no es un cheque.*
       ⇒ Esta rama queda BLOQUEADA a propósito hasta que el desglose exista, y
       lo dice con nombre propio en vez de aprobar a ciegas.

       La mensualidad no tiene tabla de desglose, pero **sí tiene techo**:
       `monto_esperado` es lo que la familia autorizó en el mandato. Cobrar por
       encima de eso es exceder la autorización, no un redondeo. */
    IF EXISTS (SELECT 1 FROM pagos_intentos WHERE id=v_intento AND bono_id IS NOT NULL) THEN
      IF NOT EXISTS (SELECT 1 FROM bono_desglose bd
                      JOIN pagos_intentos i ON i.bono_id = bd.bono_id
                     WHERE i.id = v_intento) THEN
        UPDATE webhook_events SET resultado='desconocido',
          detalle = COALESCE(detalle,'') || ' · actuador: bono sin desglose congelado'
         WHERE id = p_evento_id;
        RETURN jsonb_build_object('ok', false, 'aplicado', false,
          'motivo', 'sin_desglose_congelado', 'sujeto', 'bono', 'sujeto_id', v_ref);
      END IF;
      IF v_monto IS NOT NULL AND v_monto <> (
           SELECT bd.total FROM bono_desglose bd
            JOIN pagos_intentos i ON i.bono_id = bd.bono_id WHERE i.id = v_intento) THEN
        UPDATE webhook_events SET resultado='monto_no_coincide' WHERE id = p_evento_id;
        RETURN jsonb_build_object('ok', false, 'aplicado', false,
          'motivo', 'monto_no_coincide', 'sujeto', 'bono', 'sujeto_id', v_ref);
      END IF;
    ELSIF EXISTS (SELECT 1 FROM pagos_intentos WHERE id=v_intento AND programa_contratado_id IS NOT NULL) THEN
      /* Mismo fail-closed que el bono: sin desglose congelado NO se confirma. */
      IF NOT EXISTS (SELECT 1 FROM programa_desglose pd
                      JOIN pagos_intentos i ON i.programa_contratado_id = pd.programa_contratado_id
                     WHERE i.id = v_intento) THEN
        UPDATE webhook_events SET resultado='desconocido',
          detalle = COALESCE(detalle,'') || ' · actuador: programa sin desglose congelado'
         WHERE id = p_evento_id;
        RETURN jsonb_build_object('ok', false, 'aplicado', false,
          'motivo', 'sin_desglose_congelado', 'sujeto', 'programa', 'sujeto_id', v_ref);
      END IF;
      IF v_monto IS NOT NULL AND v_monto <> (
           SELECT pd.total FROM programa_desglose pd
            JOIN pagos_intentos i ON i.programa_contratado_id = pd.programa_contratado_id
           WHERE i.id = v_intento) THEN
        UPDATE webhook_events SET resultado='monto_no_coincide' WHERE id = p_evento_id;
        RETURN jsonb_build_object('ok', false, 'aplicado', false,
          'motivo', 'monto_no_coincide', 'sujeto', 'programa', 'sujeto_id', v_ref);
      END IF;
    ELSE
      IF v_monto IS NOT NULL AND v_monto > (
           SELECT g.monto_esperado FROM guarderia_suscripciones g
            JOIN pagos_intentos i ON i.guarderia_suscripcion_id = g.id WHERE i.id = v_intento) THEN
        UPDATE webhook_events SET resultado='monto_no_coincide' WHERE id = p_evento_id;
        RETURN jsonb_build_object('ok', false, 'aplicado', false,
          'motivo', 'monto_excede_mandato', 'sujeto', 'mensualidad_guarderia', 'sujeto_id', v_ref);
      END IF;
    END IF;

    UPDATE pagos_intentos
       SET estado='aprobado', confirmado_por='webhook', payload_crudo=v_e.payload,
           authorization_code=v_auth,
           proveedor_transaction_id = COALESCE(proveedor_transaction_id, v_tx),
           cerrado_en=now(), actualizado_en=now()
     WHERE id = v_intento
       /* 🔴 D-916 · el mismo guard que las otras dos ramas: nunca se re-aprueba
          un intento que ya volvió. Son TRES UPDATE ahora, y los tres lo llevan. */
       AND estado NOT IN ('reversado','reverso_fallido');

    /* El ACTO 2 se atrapa: **el cobro YA OCURRIÓ.** Si acreditar el paquete o
       generar el mes falla, el intento tiene que quedar `aprobado` igual —
       dejar caer la excepción revertiría la marca del pago y el proveedor
       reintentaría contra un cobro ya hecho. */
    BEGIN
      SELECT CASE
        WHEN i.bono_id IS NOT NULL
          THEN confirmar_pago_bono(i.bono_id)
        WHEN i.programa_contratado_id IS NOT NULL
          THEN confirmar_pago_programa(i.programa_contratado_id)
        /* El período ancla en el INTENTO, jamás en el reloj — *pagar es
           arrancar*, firma del founder del 31-ago. */
        ELSE cobrar_periodo_mensualidad_guarderia(i.guarderia_suscripcion_id, NULL, i.id)
      END INTO v_acto FROM pagos_intentos i WHERE i.id = v_intento;
    EXCEPTION WHEN OTHERS THEN
      v_acto := jsonb_build_object('ok', false, 'motivo', 'acto2_fallo', 'causa', SQLERRM);
    END;

    SELECT CASE WHEN i.bono_id IS NOT NULL THEN 'bono'
                WHEN i.programa_contratado_id IS NOT NULL THEN 'programa'
                ELSE 'mensualidad_guarderia' END
      INTO v_que_es FROM pagos_intentos i WHERE i.id = v_intento;

    UPDATE webhook_events
       SET resultado = CASE WHEN COALESCE((v_acto->>'ok')::boolean, false)
                            THEN 'aplicado' ELSE 'desconocido' END,
           detalle = COALESCE(detalle,'') || ' · actuador: ' || v_que_es
                     || ' · acto2=' || COALESCE(v_acto->>'ok','?')
                     || COALESCE(' (' || (v_acto->>'motivo') || ')','')
                     /* 🔴 LA MISMA LÍNEA, Y ACÁ ES PEOR: este defecto NO ES MÍO
                        DE ORIGEN — lo COPIÉ de la rama recurrente, que lo tiene
                        desde S103. *La segunda puerta al defecto era la puerta
                        de la que copié.* Cuando se cura una clase, se cura donde
                        está y donde nació. */
                     || COALESCE(' · ' || COALESCE('causa=' || (v_acto->>'causa'),
                                                      'codigo=' || (v_acto->>'codigo')), '')
     WHERE id = p_evento_id;

    /* ═══ EL ANCLA VUELVE AL INTENTO — hallazgo de S108-B, y es real ═══════
       Su edge escribe `guarderia_suscripcion_periodo` al CREAR el intento
       (mi CHECK lo exige junto con la suscripción), o sea **antes de que exista
       `cerrado_en`**: es un PRONÓSTICO. El ancla del plan sale del pago. Los dos
       coinciden casi siempre — y «casi siempre» no es siempre: con el cobro a
       las 23:50 y el webhook a las 00:05 la columna dice un mes y el plan otro.
       *Una columna que queda con la estimación es la que va a leer quien audite
       el cobro, y va a auditar contra un dato que nadie corrigió.* Se escribe
       el hecho encima. */
    IF v_que_es = 'mensualidad_guarderia'
       AND COALESCE((v_acto->>'ok')::boolean, false)
       AND (v_acto->>'periodo_desde') IS NOT NULL THEN
      UPDATE pagos_intentos
         SET guarderia_suscripcion_periodo = (v_acto->>'periodo_desde')::date
       WHERE id = v_intento;
    END IF;

    /* ═══ EL COMPROBANTE — bloque de S108-B, pegado literal ═════════════════
       🤝 Llegó como texto SQL completo y autocontenido (regla de la casa: un
       pedido entre pistas no viaja por referencia), y B lo ejerció antes de
       mandarlo, con prueba de cable incluida —borró el desglose y verificó que
       gritara—. **No se reinterpretó.**

       ✏️ LO ÚNICO QUE A LE AGREGÓ, y se declara: va envuelto en su propio
       BEGIN/EXCEPTION. *El cobro YA OCURRIÓ y el sujeto YA SE MOVIÓ; si armar
       el comprobante falla —un negocio sin cuenta comercial, un destinatario
       que no resuelve—, dejar caer la excepción revertiría la marca del pago y
       el proveedor reintentaría contra un cobro ya hecho.* Es el mismo criterio
       que ya protege al acto 2, aplicado al aviso.

       Las decisiones son de B y quedan escritas en su parte: sólo si el acto 2
       salió bien · el período sale de `periodo_desde` y no de la columna del
       intento · **la clave de dedup lleva el período**, porque un mandato tiene
       N cobros sobre el MISMO id y sin eso el comprobante del segundo mes se
       deduplica contra el del primero y no sale nunca · y el concepto queda
       neutro a propósito, con su tensión declarada contra §10.1 hasta que el
       contador conteste si un paquete de días tributa como un día. */
    BEGIN
      IF COALESCE((v_acto->>'ok')::boolean, false) THEN
        SELECT
          COALESCE(i.pagador_user_id,
            CASE WHEN i.bono_id IS NOT NULL
                 THEN (SELECT b.user_id FROM bonos b WHERE b.id = i.bono_id)
                 ELSE (SELECT g.autorizada_por FROM guarderia_suscripciones g
                        WHERE g.id = i.guarderia_suscripcion_id) END),
          cc.nombre_comercial,
          (SELECT g.periodo_desde FROM guarderia_suscripciones g
            WHERE g.id = i.guarderia_suscripcion_id)
        INTO v_user, v_negocio, v_periodo
        FROM pagos_intentos i
        JOIN prestadores pr ON pr.id = COALESCE(
               (SELECT b.prestador_id FROM bonos b WHERE b.id = i.bono_id),
               (SELECT g.prestador_id FROM guarderia_suscripciones g
                 WHERE g.id = i.guarderia_suscripcion_id))
        JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
       WHERE i.id = v_intento;

        SELECT bd.subtotal, bd.impuesto, bd.moneda INTO v_sub, v_imp, v_moneda
          FROM pagos_intentos i JOIN bono_desglose bd ON bd.bono_id = i.bono_id
         WHERE i.id = v_intento;
        IF v_sub IS NULL THEN
          SELECT d.subtotal, d.impuesto, d.moneda INTO v_sub, v_imp, v_moneda
            FROM pagos_intentos i
            JOIN guarderia_suscripcion_desglose d
              ON d.guarderia_suscripcion_id = i.guarderia_suscripcion_id
             AND d.periodo = v_periodo
           WHERE i.id = v_intento;
        END IF;

        PERFORM registrar_intencion_notificacion(
          p_tipo => 'pago_confirmado', p_destinatario_user_id => v_user,
          p_mascota_id => NULL, p_evento_id => NULL,
          p_datos => jsonb_build_object(
            'titulo','Tu pago quedó confirmado',
            'mensaje','Guarda estos datos: son el respaldo de tu pago.',
            'negocio', v_negocio,
            'concepto', _concepto_de_pago(v_ref),
            'transaction_id', v_tx, 'authorization_code', v_auth,
            'monto', v_monto, 'moneda', COALESCE(v_moneda,'USD'),
            'subtotal', v_sub, 'impuesto', v_imp,
            'sujeto_id', v_ref),
          p_clave_dedup => 'comprobante:' || v_ref::text
                           || COALESCE(':' || v_periodo::text, ''));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      UPDATE webhook_events
         SET detalle = COALESCE(detalle,'') || ' · comprobante NO emitido: ' || SQLERRM
       WHERE id = p_evento_id;
    END;

    /* 🔴 `ok` SIGUE AL ACTO, no al cobro. Si la plata entró y el paquete no se
       acreditó, **eso exige una persona**: la familia pagó y no tiene sus días.
       Divergencia declarada contra la rama recurrente, que devuelve `ok:true`
       aunque su acto 2 falle — y se elige distinto por la firma del 31-ago
       (*un éxito sobre plata que no se aplicó es la mentira más cara que puede
       decir este motor*). Medido y ya escrito por el propio actuador: **ningún
       consumidor lee `ok`** — el webhook mira el error de Postgres y la consulta
       activa lee `aplicado` — así que esto NO dispara reintentos. */
    RETURN jsonb_build_object(
      'ok', COALESCE((v_acto->>'ok')::boolean, false),
      'aplicado', COALESCE((v_acto->>'ok')::boolean, false),
      'sujeto', v_que_es, 'sujeto_id', v_ref,
      'intento_id', v_intento, 'acto2', v_acto);
  END IF;

  -- S103: EL SUJETO SE VERIFICA, NO SE ASUME.
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
      /* ✏️ Los dos sujetos de guardería. Sin estas dos líneas un bono se
         nombraba `desconocido` — cierto, e inútil para el que lee. */
      WHEN EXISTS (SELECT 1 FROM bonos                  WHERE id = v_ref) THEN 'bono'
      WHEN EXISTS (SELECT 1 FROM guarderia_suscripciones WHERE id = v_ref) THEN 'mensualidad_guarderia'
      ELSE 'desconocido' END;
    UPDATE webhook_events SET resultado = 'desconocido',
      detalle = COALESCE(detalle,'') || ' · actuador: sujeto ' || v_que_es || ' — no aplicable por esta puerta'
     WHERE id = p_evento_id;
    /* 🔴 `ok:false`: NO SE APLICÓ. Medido antes de cambiarlo — **ningún
       consumidor lee `ok`**: `aplicar_consulta_activa_deuna` lee `aplicado` y
       el webhook mira el error de Postgres. *Un «ok» sobre plata que no se
       aplicó es la mentira más cara que puede decir este motor.* */
    RETURN jsonb_build_object('ok', false, 'aplicado', false,
      'motivo', 'sujeto_no_aplicable', 'sujeto', v_que_es, 'sujeto_id', v_ref);
  END IF;

  v_res := confirmar_pago_compra(
    p_compra_id => v_ref, p_proveedor => v_e.proveedor, p_referencia => v_tx,
    p_clave_idempotencia => 'wh:' || p_evento_id::text, p_payload => v_e.payload,
    p_confirmado_por => 'webhook', p_transaction_id => v_tx, p_monto => v_monto,
    p_authorization_code => v_auth, p_marca => v_src->'card'->>'type',
    p_bin => v_src->'card'->>'bin', p_ultimos4 => v_src->'card'->>'number');

  IF COALESCE((v_res->>'duplicado')::boolean, false) IS NOT TRUE THEN
    SELECT c.user_id, c.moneda INTO v_user, v_moneda FROM compras c WHERE c.id = v_ref;
    SELECT cc.nombre_comercial INTO v_negocio
      FROM pedidos p JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
     WHERE p.compra_id = v_ref LIMIT 1;
    PERFORM registrar_intencion_notificacion(
      p_tipo => 'pago_confirmado', p_destinatario_user_id => v_user,
      p_mascota_id => NULL, p_evento_id => NULL,
      p_datos => jsonb_build_object(
        'titulo','Tu pago quedó confirmado',
        'mensaje','Guarda estos datos: son el respaldo de tu pago.',
        'negocio', v_negocio, 'concepto', _concepto_de_pago(v_ref),
        'transaction_id', v_tx, 'authorization_code', v_auth,
        'monto', v_monto, 'moneda', COALESCE(v_moneda,'USD'),
        /* Mismo desglose congelado, del lado de la compra. `compra_desglose`
           tiene una línea POR PEDIDO ⇒ se SUMAN: un comprobante es de la
           compra entera, y mostrar la línea de un solo vendedor diría menos
           impuesto del que la familia pagó. */
        'subtotal', (SELECT sum(subtotal) FROM compra_desglose WHERE compra_id = v_ref),
        'impuesto', (SELECT sum(impuesto) FROM compra_desglose WHERE compra_id = v_ref),
        'envio',    (SELECT sum(envio)    FROM compra_desglose WHERE compra_id = v_ref),
        'sujeto_id', v_ref),
      p_clave_dedup => 'comprobante:' || v_ref::text);
  END IF;

  UPDATE webhook_events SET resultado='aplicado',
    detalle = COALESCE(detalle,'') || ' · actuador: ' || COALESCE(v_res::text,'')
   WHERE id = p_evento_id;
  RETURN jsonb_build_object('ok', true, 'aplicado', true, 'sujeto','compra',
                            'compra_id', v_ref, 'resultado', v_res);
END $function$

;

-- ═══ CINTURÓN — el caso se FABRICA, no se busca (aviso de S108-B) ═════════
DO $c$
DECLARE v_pc uuid; v_r jsonb; v_n int; v_estado text; v_pago text; v_int uuid; v_user uuid; v_evt uuid;
BEGIN
  /* 🔴 SE FABRICA EL SUJETO. Aviso de S108-B que vale para los dos: un
     `LIMIT 1` sin `ORDER BY` devuelve una fila arbitraria que puede cambiar sin
     que nadie toque nada — con sólo insertar otra. *Un arnés que ELIGE su caso
     depende de un orden que no declaró.* Acá se crea el propio. */
  INSERT INTO programas_contratados (programa_id, user_id, mascota_id, prestador_id,
    prestador_servicio_id, n_sesiones, precio_total, precio_unitario_efectivo,
    duracion_minutos, vigencia_hasta, estado, estado_pago, country_code,
    fecha_inicio, hora, pago_expira_en)
  SELECT pc.programa_id, pc.user_id, pc.mascota_id, pc.prestador_id, pc.prestador_servicio_id,
         2, 80, 40, 60, public.hoy_local() + 120, 'activo', 'pendiente', 'EC',
         (public.hoy_local() + 95)::date, '10:00'::time, now() + interval '15 minutes'
    FROM programas_contratados pc ORDER BY pc.created_at LIMIT 1
  RETURNING id, user_id INTO v_pc, v_user;
  IF v_pc IS NULL THEN RAISE EXCEPTION 'cinturon: sin programa de referencia'; END IF;

  -- (a) el desglose se congelo POR TRIGGER
  IF NOT EXISTS (SELECT 1 FROM programa_desglose WHERE programa_contratado_id=v_pc) THEN
    RAISE EXCEPTION 'cinturon: el programa nacio SIN desglose congelado';
  END IF;

  -- (b) 🔴 LA COMPUERTA APRUEBA UN MES LIBRE, y NO deja residuo
  v_r := public.verificar_compuerta_programa(v_pc);
  IF COALESCE((v_r->>'ok')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'cinturon: la compuerta rechazo un caso LIBRE: %', v_r::text;
  END IF;
  SELECT count(*) INTO v_n FROM evento_cita_servicio WHERE programa_contratado_id=v_pc;
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturon: el ENSAYO dejo % citas — no se deshizo', v_n; END IF;

  -- (c) 🔴 EL ROJO SE FABRICA: se ocupa el dia de la primera sesion
  /* 🔴 EL EVENTO SE CREA DE VERDAD. El primer intento reusaba el `evento_id`
     de otra cita y chocaba contra `evento_cita_servicio_evento_id_unique`:
     *la cita no es un dato suelto, cuelga de un evento del expediente, y una
     copia que roba el evento de otra no es la cita que se quería sembrar.* */
  INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
                               creado_por_user_id, datos, visibilidad, country_code)
  SELECT pc.mascota_id, 'cita_servicio',
         (SELECT cte.eje_jtbd FROM cat_tipos_evento cte WHERE cte.codigo='cita_servicio'),
         ((public.hoy_local() + 95)::date + '10:00'::time), pc.prestador_id, pc.user_id,
         jsonb_build_object('origen','cinturon_m20'),
         (SELECT cte.visibilidad_default FROM cat_tipos_evento cte WHERE cte.codigo='cita_servicio'),
         'EC'
    FROM programas_contratados pc WHERE pc.id = v_pc
  RETURNING id INTO v_evt;

  INSERT INTO evento_cita_servicio (evento_id, user_id, mascota_id, prestador_id,
    tipo_servicio, fecha, precio, duracion_minutos, estado, estado_reserva, country_code,
    programa_contratado_id, sesion_numero)
  SELECT v_evt, pc.user_id, pc.mascota_id, pc.prestador_id, 'adiestramiento',
         (public.hoy_local() + 95)::date, 0, 60, 'confirmada','pagada', 'EC', v_pc, 1
    FROM programas_contratados pc WHERE pc.id = v_pc;
  v_r := public.verificar_compuerta_programa(v_pc);
  IF COALESCE((v_r->>'ok')::boolean,true) IS NOT FALSE THEN
    RAISE EXCEPTION 'cinturon: la compuerta APROBO con la sesion 1 ya ocupada: %', v_r::text;
  END IF;
  IF v_r->>'causa' IS NULL THEN
    RAISE EXCEPTION 'cinturon: rechazo SIN causa — obliga a reproducir el caso';
  END IF;
  DELETE FROM evento_cita_servicio WHERE programa_contratado_id=v_pc;

  -- (d) la confirmacion pone pagado Y CREA las sesiones
  v_r := public.confirmar_pago_programa(v_pc);
  IF COALESCE((v_r->>'ok')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'cinturon: no confirmo: %', v_r::text;
  END IF;
  SELECT estado_pago INTO v_pago FROM programas_contratados WHERE id=v_pc;
  SELECT count(*) INTO v_n FROM evento_cita_servicio WHERE programa_contratado_id=v_pc;
  IF v_pago <> 'pagado' OR v_n <> 2 THEN
    RAISE EXCEPTION 'cinturon: confirmo mal (pago=% sesiones=%)', v_pago, v_n;
  END IF;

  -- (e) idempotente
  v_r := public.confirmar_pago_programa(v_pc);
  IF COALESCE((v_r->>'duplicado')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'cinturon: la segunda confirmacion no se declaro duplicada';
  END IF;

  -- (f) 🔴 EL REVERSO lo mueve, por el TRIGGER
  INSERT INTO pagos_intentos (programa_contratado_id, proveedor, monto, moneda, forma, estado,
    clave_idempotencia, payload_crudo, pagador_user_id, pagador_origen)
  VALUES (v_pc,'nuvei',80,'USD','tokenizacion','aprobado','cinturon:m20:'||v_pc::text,
          '{}'::jsonb, v_user,'sesion')
  RETURNING id INTO v_int;
  UPDATE pagos_intentos SET estado='reversado' WHERE id=v_int;
  SELECT estado, estado_pago INTO v_estado, v_pago FROM programas_contratados WHERE id=v_pc;
  IF v_estado <> 'cancelado' OR v_pago <> 'reembolsado' THEN
    /* 🔴 SE LEE LA CAUSA QUE EL TRIGGER DEJÓ. La primera versión de este brazo
       decía sólo «no movió» — y eso obliga a reproducir el caso a mano, que es
       exactamente el defecto que esta misma sesión curó en el actuador. */
    RAISE EXCEPTION 'cinturon: el reverso no movio el programa (% / %) · causa=%',
      v_estado, v_pago,
      COALESCE((SELECT payload_crudo->'sujeto_no_movido'->>'causa' FROM pagos_intentos WHERE id=v_int),
               (SELECT payload_crudo->'sujeto_no_movido'->>'codigo' FROM pagos_intentos WHERE id=v_int),
               '(el trigger no dejo nota — no llego a llamar)');
  END IF;
  SELECT count(*) INTO v_n FROM evento_cita_servicio
   WHERE programa_contratado_id=v_pc AND estado <> 'cancelada';
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturon: quedaron % sesiones futuras vivas tras el reverso', v_n; END IF;

  RAISE NOTICE 'cinturon M20: 6/6 OK (desglose por trigger · compuerta aprueba libre SIN residuo · rechaza el ocupado CON causa · confirma y crea las N · idempotente · el reverso las cancela)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M20: fixture deshecho por subtransaccion, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;
