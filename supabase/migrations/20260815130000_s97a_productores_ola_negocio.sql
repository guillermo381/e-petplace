-- S97-A · D-822 · LOS CINCO PRODUCTORES DE LA PRIMERA OLA AL NEGOCIO
--
-- Firma del founder (14-ago). Las VOCES ya viven en `20260815120000`; esto es
-- la otra mitad: **quién las encola y desde qué acto.**
--
-- ⚠️ NOTA DE PROCEDENCIA, declarada: los cuatro primeros se aplicaron a la
-- base ANTES de existir este archivo (empalme por `pg_get_functiondef` vivo,
-- uno a uno, verificando ancla única y conteo de ocurrencias). Este archivo
-- los DEPOSITA con su forma final para que el repo y la base digan lo mismo.
-- *Una función viva sin migración es exactamente el hueco que hace que el
--  próximo `db reset` borre trabajo que nadie sabía que existía.*
--
-- ═══ LA FORMA COMÚN DE LOS CINCO ═══
--   · Cuelgan del ACTO, en su misma transacción: si el hecho ocurrió, el
--     aviso salió. No hay estado intermedio donde perderse.
--   · La VOZ va horneada en `p_datos` con `|| _voz_notificacion(...)` —
--     `despachar-push` lee `datos.titulo` (su línea 205) y cae al genérico si
--     falta. **La lección de D-815: la rama de voz que nadie llama es motor
--     sin puerta en chiquito, y su modo de falla es que NO falla.**
--   · Cada uno con su CLAVE DE DEDUP pensada, no copiada: la del veredicto de
--     documento lleva el veredicto adentro (re-veredictar es un hecho nuevo);
--     las demás se agotan en su entidad.
--   · Sin destinatario NO se avisa y NO se rompe (el fantasma, S97).
--
-- 76(g) — VEDA: **RIGE.** El bloque ⑤ hace un backfill de 8 filas.

BEGIN;

CREATE OR REPLACE FUNCTION public.confirmar_pago_pedido(p_pedido_id uuid, p_proveedor text, p_referencia text, p_clave_idempotencia text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_int uuid; v_ped record; v_reservas int; v_dest uuid; v_items int;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION
      'confirmacion_de_pago_no_es_del_cliente: este camino es del webhook de la pasarela, no de una sesión de persona'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM pagos_eventos WHERE clave_idempotencia = p_clave_idempotencia) THEN
    RETURN jsonb_build_object('ok', true, 'duplicado', true);
  END IF;

  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023'; END IF;

  SELECT count(*) INTO v_reservas FROM inventario_reservas
   WHERE pedido_id = p_pedido_id AND estado = 'vigente';
  IF v_reservas = 0 AND EXISTS (SELECT 1 FROM pedido_items WHERE pedido_id = p_pedido_id) THEN
    RAISE EXCEPTION 'pago_sin_reserva: el pedido % no tiene stock reservado; confirmarlo lo dejaría listo para preparar sin mercadería apartada', p_pedido_id
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO pagos_intentos (pedido_id, proveedor, proveedor_referencia, monto,
                              moneda, forma, estado, payload_crudo, clave_idempotencia,
                              cerrado_en)
    VALUES (p_pedido_id, p_proveedor, p_referencia, v_ped.total, v_ped.moneda,
            'tokenizacion', 'aprobado', p_payload,
            p_clave_idempotencia || ':intento', now())
    RETURNING id INTO v_int;

  INSERT INTO pagos_eventos (intento_id, proveedor, tipo, payload, clave_idempotencia, procesado_en)
    VALUES (v_int, p_proveedor, 'pago_aprobado', p_payload, p_clave_idempotencia, now());

  PERFORM _mover_estado_pedido(p_pedido_id, 'pago_capturado', 'sistema');
  PERFORM _mover_estado_pedido(p_pedido_id, 'stock_reservado', 'sistema');
  PERFORM _mover_estado_pedido(p_pedido_id, 'vendedor_notificado', 'sistema');
  PERFORM _mover_estado_pedido(p_pedido_id, 'liberado_preparacion', 'sistema');

  -- S96: el retiro nace con su código de mostrador. Sin repartidor, sin
  -- ventana — el mismo mecanismo del código de la puerta, en el local.
  IF v_ped.metodo_entrega = 'retiro'
     AND NOT EXISTS (SELECT 1 FROM envios WHERE pedido_id = p_pedido_id) THEN
    INSERT INTO envios (pedido_id, cuenta_comercial_id, country_code, transportista,
                        metodo, estado, codigo_verificacion, destino_direccion,
                        intentos_entrega, costo_envio, moneda, pagado_por)
      VALUES (p_pedido_id, v_ped.cuenta_comercial_id, COALESCE(v_ped.country_code,'EC'),
              'propio', 'retiro', 'pendiente',
              lpad(floor(random() * 10000)::int::text, 4, '0'),
              'Retiro en tienda', 0, 0, COALESCE(v_ped.moneda,'USD'), 'cliente');
  END IF;

  -- ═══ D-822 · LA VITRINA VENDIÓ (productor ①) ═══
  -- Cuelga del PAGO CONFIRMADO, no de la creación del pedido: un pedido sin
  -- pagar todavía no es una venta, y avisar de uno que puede expirar sería
  -- enseñarle al vendedor a desconfiar del aviso.
  SELECT owner_profile_id INTO v_dest
    FROM cuentas_comerciales WHERE id = v_ped.cuenta_comercial_id;
  SELECT count(*) INTO v_items FROM pedido_items WHERE pedido_id = p_pedido_id;

  IF v_dest IS NOT NULL THEN
    PERFORM registrar_intencion_notificacion(
      p_tipo                 => 'pedido_nuevo_vendedor',
      p_destinatario_user_id => v_dest,
      p_datos                => jsonb_build_object(
                                  'pedido_id', p_pedido_id,
                                  'total', to_char(COALESCE(v_ped.total, 0), 'FM999999990.00'),
                                  'items', v_items)
                                || public._voz_notificacion(
                                     'pedido_nuevo_vendedor', v_dest, NULL,
                                     jsonb_build_object(
                                       'total', to_char(COALESCE(v_ped.total, 0), 'FM999999990.00'),
                                       'items', v_items)),
      -- un pedido se paga UNA vez; la función es idempotente por clave de
      -- idempotencia, así que un reintento no puede duplicar el aviso.
      p_clave_dedup          => 'pedido_nuevo:' || p_pedido_id::text
    );
  END IF;

  RETURN jsonb_build_object('ok', true, 'intento_id', v_int);
END $function$;

CREATE OR REPLACE FUNCTION public.otorgar_rol_vendedor(p_cuenta_comercial_id uuid, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_cc   record;
  v_ya   boolean;
  v_activada boolean := false;
  v_dest    uuid;
  v_negocio text;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- Sigue siendo acto de ADMIN. Si el titular pudiera dárselo, cualquiera con
  -- una cuenta comercial se auto-habilitaría a vender sin que nadie revise —
  -- y §4.2 dice lo contrario: el vendedor PROPONE, e-PetPlace PUBLICA.
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'solo_admin_otorga_rol_vendedor' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cc FROM cuentas_comerciales
   WHERE id = p_cuenta_comercial_id FOR UPDATE;
  IF v_cc.id IS NULL THEN
    RAISE EXCEPTION 'cuenta_no_existe' USING ERRCODE = '22023';
  END IF;

  -- 🔴 SOLO SE ACTIVA DESDE `pendiente_validacion`, igual que
  --    `activar_prestador`. Una cuenta SUSPENDIDA o CERRADA no se reactiva por
  --    acá: es otra decisión, con otro dueño y otras razones.
  IF v_cc.estado IN ('suspendida', 'cerrada') THEN
    RAISE EXCEPTION 'cuenta_no_activable: la cuenta está «%» y reactivarla no es parte del alta de un vendedor', v_cc.estado
      USING ERRCODE = '22023';
  END IF;

  IF v_cc.estado = 'pendiente_validacion' THEN
    UPDATE cuentas_comerciales
       SET estado = 'activa',
           activado_en = COALESCE(activado_en, now()),
           activado_por = v_auth,
           updated_at = now()
     WHERE id = p_cuenta_comercial_id;
    v_activada := true;
  END IF;

  SELECT EXISTS (SELECT 1 FROM cuenta_roles
                  WHERE cuenta_comercial_id = p_cuenta_comercial_id
                    AND tipo_actor = 'seller_productos' AND estado = 'activo')
    INTO v_ya;

  INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en, metadata)
  VALUES (p_cuenta_comercial_id, 'seller_productos', 'activo', now(),
          jsonb_build_object('otorgado_por', v_auth, 'motivo', p_motivo))
  ON CONFLICT (cuenta_comercial_id, tipo_actor) DO UPDATE
    SET estado = 'activo', activado_en = COALESCE(cuenta_roles.activado_en, now());

  -- S97: la solicitud queda RESUELTA por el mismo acto que la concede. El
  -- array guarda sólo lo pendiente, así que otorgar es vaciar.
  UPDATE cuentas_comerciales
     SET naturalezas_solicitadas = array_remove(naturalezas_solicitadas, 'seller_productos'::tipo_actor_enum),
         updated_at = now()
   WHERE id = p_cuenta_comercial_id;

  -- ═══ D-822 · «YA PODÉS VENDER» (productor ②) ═══
  -- Cuelga del acto que CONCEDE, no de un cron: si el rol se otorgó, el aviso
  -- salió — no hay estado intermedio donde perderse.
  -- 🔴 Solo avisa cuando el rol es NUEVO (`NOT v_ya`): esta función es
  --    idempotente por su ON CONFLICT, así que re-otorgar no puede volver a
  --    avisar. *Un aviso que se repite por una acción sin efecto enseña a
  --    ignorar los avisos.*
  IF NOT v_ya THEN
    SELECT owner_profile_id, nombre_comercial INTO v_dest, v_negocio
      FROM cuentas_comerciales WHERE id = p_cuenta_comercial_id;
    IF v_dest IS NOT NULL THEN
      PERFORM registrar_intencion_notificacion(
        p_tipo                 => 'naturaleza_venta_aprobada',
        p_destinatario_user_id => v_dest,
        p_datos                => jsonb_build_object('negocio', v_negocio)
                                  || public._voz_notificacion(
                                       'naturaleza_venta_aprobada', v_dest, NULL,
                                       jsonb_build_object('negocio', v_negocio)),
        p_clave_dedup          => 'venta_aprobada:' || p_cuenta_comercial_id::text
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'cuenta_comercial_id', p_cuenta_comercial_id,
                            'ya_lo_tenia', v_ya,
                            'cuenta_activada_ahora', v_activada,
                            'estado_cuenta', 'activa');
END $function$;

CREATE OR REPLACE FUNCTION public.cancelar_cita_suelta(p_cita_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth  uuid := auth.uid();
  v_cita  record;
  v_ahora timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  v_dest  uuid;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita_id FOR UPDATE;
  IF v_cita.id IS NULL OR v_cita.user_id IS DISTINCT FROM v_auth THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  IF v_cita.suscripcion_servicio_id IS NOT NULL THEN
    RAISE EXCEPTION 'cita_es_de_plan' USING ERRCODE = '22023';
  END IF;
  IF v_cita.bono_id IS NOT NULL THEN
    RAISE EXCEPTION 'cita_es_de_paquete' USING ERRCODE = '22023';
  END IF;
  IF v_cita.estado <> 'confirmada' OR v_cita.estado_reserva IS DISTINCT FROM 'pagada' THEN
    RAISE EXCEPTION 'cita_estado_invalido: % / %', v_cita.estado, COALESCE(v_cita.estado_reserva, 'NULL')
      USING ERRCODE = '22023';
  END IF;

  -- P18(b): entre 24 y 2 h solo se reagenda — la plata no se mueve.
  IF (v_cita.fecha + v_cita.hora) - v_ahora < interval '24 hours' THEN
    RAISE EXCEPTION 'ventana_cancelacion_vencida' USING ERRCODE = '22023';
  END IF;

  -- La cancelación se DECLARA sobre el pago (7.16). La cita deja de
  -- estar cubierta: estado_reserva sale de 'pagada' (invariante intacto).
  UPDATE evento_cita_servicio
  SET estado = 'cancelada',
      estado_reserva = 'cancelada',
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'motivo', 'p18_cancelacion_en_ventana',
        'cancelada_en', now(),
        'reembolso_simulado', jsonb_build_object(
          'monto', v_cita.precio,
          'simulado', true,
          'motivo', 'p18_cancelacion_en_ventana',
          'aplicado_en', now()
        )
      ),
      updated_at = now()
  WHERE id = p_cita_id;

  -- ═══ D-822 · EL HUECO EN LA AGENDA DE HOY AVISA HOY (productor ③) ═══
  -- Destinatario: el TITULAR del prestador de la cita — el que tiene que
  -- saber que su hora quedó libre. `v_cita` ya está cargada arriba.
  SELECT pr.user_id INTO v_dest
    FROM prestadores pr WHERE pr.id = v_cita.prestador_id;

  IF v_dest IS NOT NULL THEN
    PERFORM registrar_intencion_notificacion(
      p_tipo                 => 'cita_cancelada_cliente',
      p_destinatario_user_id => v_dest,
      p_mascota_id           => v_cita.mascota_id,
      p_datos                => jsonb_build_object(
                                  'cita_id', p_cita_id,
                                  'cuando', to_char(v_cita.fecha,'DD/MM') || ' ' || to_char(v_cita.hora,'HH24:MI'))
                                || public._voz_notificacion(
                                     'cita_cancelada_cliente', v_dest, v_cita.mascota_id,
                                     jsonb_build_object('cuando',
                                       to_char(v_cita.fecha,'DD/MM') || ' ' || to_char(v_cita.hora,'HH24:MI'))),
      -- una cita se cancela UNA vez: la clave es la cita.
      p_clave_dedup          => 'cita_cancelada:' || p_cita_id::text
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', p_cita_id,
    'estado', 'cancelada',
    'reembolso_monto', v_cita.precio,
    'reembolso_simulado', true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.revisar_documento_prestador(p_documento_id uuid, p_veredicto text, p_notas text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_estado text;
  v_dest       uuid;
  v_tipo_doc   text;
  v_nombre_doc text;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'solo_admin' USING ERRCODE = '42501';
  END IF;
  -- 'vencido' NO es veredicto de admin: es el estado del motor de
  -- vencimientos (LETRA_PERFIL_S79 §7, propuesta sin firma). 'pendiente'
  -- tampoco: des-veredictar no existe — re-veredictar SÍ (es admin).
  IF p_veredicto IS NULL OR p_veredicto NOT IN ('aprobado', 'rechazado') THEN
    RAISE EXCEPTION 'veredicto_invalido' USING ERRCODE = '22023';
  END IF;

  UPDATE public.prestador_documentos
     SET estado         = p_veredicto,
         revisado_por   = v_auth,
         revisado_en    = now(),
         notas_revision = NULLIF(trim(p_notas), '')
   WHERE id = p_documento_id
  RETURNING estado INTO v_estado;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'documento_no_encontrado' USING ERRCODE = '22023';
  END IF;

  -- ═══ D-822 · EL WIZARD SE DESTRABA SIN VIGILANCIA MANUAL (productor ④) ═══
  -- El destinatario es el TITULAR del prestador dueño del documento. `nombre`
  -- puede ser NULL: la voz cae a «documento» genérico, que es honesto —
  -- inventarle un nombre sería peor que no tenerlo.
  SELECT pr.user_id, d.tipo, d.nombre
    INTO v_dest, v_tipo_doc, v_nombre_doc
    FROM prestador_documentos d
    JOIN prestadores pr ON pr.id = d.prestador_id
   WHERE d.id = p_documento_id;

  IF v_dest IS NOT NULL THEN
    PERFORM registrar_intencion_notificacion(
      p_tipo                 => CASE WHEN p_veredicto = 'aprobado'
                                     THEN 'documento_aprobado' ELSE 'documento_rechazado' END,
      p_destinatario_user_id => v_dest,
      p_datos                => jsonb_build_object(
                                  'documento_id', p_documento_id,
                                  'documento', COALESCE(v_nombre_doc, v_tipo_doc),
                                  'motivo', NULLIF(trim(p_notas), ''))
                                || public._voz_notificacion(
                                     CASE WHEN p_veredicto = 'aprobado'
                                          THEN 'documento_aprobado' ELSE 'documento_rechazado' END,
                                     v_dest, NULL,
                                     jsonb_build_object(
                                       'documento', COALESCE(v_nombre_doc, v_tipo_doc),
                                       'motivo', NULLIF(trim(p_notas), ''))),
      -- 🔴 el veredicto va EN la clave: re-veredictar es un hecho nuevo y
      --    merece su aviso (la propia función declara que re-veredictar SÍ
      --    existe). Sin el veredicto, aprobar-tras-rechazar quedaría mudo.
      p_clave_dedup          => 'doc_veredicto:' || p_documento_id::text || ':' || p_veredicto
    );
  END IF;

  RETURN jsonb_build_object('ok', true, 'documento_id', p_documento_id, 'estado', v_estado);
END;
$function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⑤ EL BARRIDO — LA EXPIRACIÓN SE VUELVE UN ACTO (firma (a) del founder)
--
-- 🔴 ESTO DEROGA LA PEREZA **PARA ESTE CASO Y NADA MÁS**, y la línea importa:
--    S78 firmó la expiración PEREZOSA («patrón hold, cero cron») y era
--    CORRECTA — cuando expirar solo le importaba a quien miraba la lista.
--    **D-822 le dio a la expiración un destinatario que NO está mirando: el
--    vet parado en el mostrador.** Y una expiración que solo existe cuando
--    alguien mira no puede avisarle a quien no mira.
--
-- ⚠️ **LAS OTRAS EXPIRACIONES DE LA CASA NO SE TOCAN** — holds, reservas,
--    paquetes. **La firma es de ÉSTA.** *Generalizar el barrido «por
--    prolijidad» convertiría una decisión medida en una migración masiva que
--    nadie pidió.*
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ⑤a EL BACKFILL SIN AVISO — las 8 históricas ──────────────────────────
-- Ya se listaban como expiradas por el lector. Se MATERIALIZA su estado para
-- que el barrido no las tome como novedad, y **NO se avisa**: el eco de una
-- semana muerta es peor que un aviso perdido (mismo criterio que la cola
-- vieja de D-816, medido allá).
UPDATE solicitud_autorizacion_mostrador
   SET estado = 'expirada', updated_at = now()
 WHERE estado = 'pendiente' AND expira_en <= now();

CREATE OR REPLACE FUNCTION public.barrer_solicitudes_expiradas()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE r record; v_n int := 0; v_avisadas int := 0; v_dest uuid;
BEGIN
  FOR r IN
    SELECT s.id, s.mascota_id, s.cuenta_comercial_id, s.solicitada_por_user_id
      FROM solicitud_autorizacion_mostrador s
     WHERE s.estado = 'pendiente' AND s.expira_en <= now()
     FOR UPDATE SKIP LOCKED
  LOOP
    -- ① el ACTO: la fila cambia de estado. **Acá muere la pereza.**
    UPDATE solicitud_autorizacion_mostrador
       SET estado = 'expirada', updated_at = now()
     WHERE id = r.id;
    v_n := v_n + 1;

    -- ② el AVISO cuelga de esa transición, como el trigger de llegada.
    --    Destinatario: QUIEN PIDIÓ — el del mostrador que está esperando,
    --    no el negocio entero. *El aviso va a quien tiene la pregunta.*
    v_dest := r.solicitada_por_user_id;
    IF v_dest IS NOT NULL THEN
      PERFORM registrar_intencion_notificacion(
        p_tipo                 => 'solicitud_mostrador_expirada',
        p_destinatario_user_id => v_dest,
        p_mascota_id           => r.mascota_id,
        p_datos                => jsonb_build_object('solicitud_id', r.id)
                                  || public._voz_notificacion(
                                       'solicitud_mostrador_expirada', v_dest, r.mascota_id, '{}'::jsonb),
        -- una solicitud expira UNA vez: el estado ya no vuelve a 'pendiente',
        -- así que el barrido no puede re-tomarla. La clave es la red.
        p_clave_dedup          => 'solicitud_expirada:' || r.id::text
      );
      v_avisadas := v_avisadas + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('expiradas', v_n, 'avisadas', v_avisadas);
END $function$;

REVOKE ALL ON FUNCTION public.barrer_solicitudes_expiradas() FROM PUBLIC, anon, authenticated;

-- ── ⑤b EL RELOJ: se cuelga del tick que YA corre cada minuto ────────────
-- No nace un cron nuevo: `expirar-citas-pendientes` ya corre cada minuto y es
-- SQL directo. *Un job más para una función más es cómo se llega a once jobs
-- que nadie puede auditar de un vistazo.*
SELECT cron.alter_job(
  job_id  => (SELECT jobid FROM cron.job WHERE jobname = 'expirar-citas-pendientes'),
  command => 'SELECT expirar_citas_pendientes(); SELECT public.barrer_solicitudes_expiradas();'
);

-- ═══ CINTURÓN CON DISCRIMINADOR ═══
DO $cinturon$
DECLARE v_pend int; v_r jsonb; v_cmd text;
BEGIN
  SELECT count(*) INTO v_pend FROM solicitud_autorizacion_mostrador
   WHERE estado = 'pendiente' AND expira_en <= now();
  IF v_pend > 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO: el backfill dejo % vencidas sin materializar.', v_pend;
  END IF;

  -- El barrido sobre cero vencidas devuelve cero y NO rompe (el caso de todos
  -- los minutos del dia).
  v_r := public.barrer_solicitudes_expiradas();
  IF (v_r->>'expiradas')::int <> 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO: barrio % con la cola vacia.', v_r->>'expiradas';
  END IF;

  SELECT command INTO v_cmd FROM cron.job WHERE jobname = 'expirar-citas-pendientes';
  IF v_cmd NOT ILIKE '%barrer_solicitudes_expiradas%' THEN
    RAISE EXCEPTION 'CINTURON ROJO: el barrido NO quedo en el tick — seria motor sin reloj.';
  END IF;

  RAISE NOTICE 'CINTURON OK · backfill sin pendientes · barrido inocuo en vacio · colgado del tick';
END;
$cinturon$;

COMMIT;
