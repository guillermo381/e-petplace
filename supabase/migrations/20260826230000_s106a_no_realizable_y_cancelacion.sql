-- ═══════════════════════════════════════════════════════════════════════
-- S106-A · 2g + 2h — LA CONSULTA QUE SE CORTA · LA CANCELACIÓN EN VENTANA
-- ═══════════════════════════════════════════════════════════════════════
--
-- LETRA: LETRA_TELEMEDICINA v1.1 §4 y §5, con la enmienda del camino de la
-- plata (firma ③ de CP1): **la devolución va AL MEDIO DE PAGO, gestionada
-- por soporte** — jamás como saldo, porque el motor de saldo no existe.
--
-- ─── LA REGLA QUE GOBIERNA ESTA MIGRACIÓN ──────────────────────────────
--
--   > **EL SISTEMA REGISTRA. NO PROMETE, NO DEVUELVE, NO JUZGA.**
--
-- Las tres partes importan:
--   · **No promete** — la devolución la ejecuta una persona en el panel del
--     proveedor. Una fila que dijera «devuelto» sin que nadie devolviera
--     sería peor que no tener fila.
--   · **No devuelve** — no hay motor de saldo (`D-926`) y el reverso por API
--     solo existe dentro de la ventana del riel (Nuvei mismo día · DeUna
--     24 h). Fuera de ahí es trámite bancario.
--   · **No juzga** — §5 es explícito: *«no se investiga de quién fue la
--     culpa, y es deliberado»*. El sistema no mide la conexión de nadie, así
--     que no puede atribuirla. *Un proceso de disputa sobre un hecho que
--     nadie registró produce una resolución arbitraria con apariencia de
--     justicia.*
--
-- ─── EL VOCABULARIO SE AMPLÍA POR LETRA, NO DE PASO ────────────────────
-- `estado` gana **`no_realizable`**. La regla de la casa dice que un
-- vocabulario cerrado no se amplía de paso — **acá no es de paso: es §5 de
-- una letra firmada**, y el valor nuevo existe porque el acto existe.
--
-- ⚠️ **Y NO se reusa `cancelada`**, aunque sería más barato: una consulta
-- que no se pudo prestar **no es una cancelación**. Quien lea el expediente
-- dentro de tres años tiene que poder distinguir «la familia no vino» de
-- «la videollamada se cortó». *Meter dos hechos en un estado es perder el
-- que importa.*
--
-- ─── LA PUERTA VIEJA SE CIERRA PARA TELEMEDICINA ───────────────────────
-- `cancelar_cita_suelta` **no filtraba por tipo de servicio** — una
-- teleconsulta confirmada y pagada entraba por ahí y salía con
-- `reembolso_simulado` en la metadata, que es exactamente lo que la firma ③
-- vino a dejar de prometer. **Se corta con rebote tipado y se rutea a la
-- puerta propia.** *Dos puertas para el mismo acto es una puerta que nadie
-- vigila.*
--
-- ─── VEDA 76(g): **NO RIGE.** ──────────────────────────────────────────
-- El ALTER del CHECK es aditivo (agrega un valor al ARRAY permitido) y se
-- valida contra las 198 citas vivas, que ya cumplen. Tabla nueva vacía. Sin
-- backfill, sin anclas. Sin ventana de veda.
--
-- ─── REVERSA ───────────────────────────────────────────────────────────
-- docs/relevamientos/2026-08-25-s106a-REVERSA-no-realizable-y-cancelacion.sql
-- 🔴 Declara que su DROP **borra plata pendiente de devolver**.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1 · El vocabulario, por letra ─────────────────────────────────────
ALTER TABLE public.evento_cita_servicio DROP CONSTRAINT IF EXISTS evento_cita_servicio_estado_check;
ALTER TABLE public.evento_cita_servicio ADD CONSTRAINT evento_cita_servicio_estado_check
  CHECK (estado = ANY (ARRAY[
    'pendiente','confirmada','en_curso','completada','cancelada','no_show','rechazada',
    'no_realizable'   -- S106 · LETRA_TELEMEDICINA §5
  ]));

-- ─── 2 · El registro que lee soporte ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.solicitudes_devolucion (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id       uuid NOT NULL REFERENCES public.evento_cita_servicio(id) ON DELETE RESTRICT,
  user_id       uuid NOT NULL REFERENCES auth.users(id),
  monto         numeric NOT NULL,
  moneda        text NOT NULL DEFAULT 'USD',
  motivo        text NOT NULL,
  estado        text NOT NULL DEFAULT 'pendiente',
  detalle       text,
  creada_por    uuid NOT NULL REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  resuelta_en   timestamptz,
  resuelta_por  uuid REFERENCES auth.users(id),
  nota_soporte  text,
  CONSTRAINT chk_devolucion_motivo CHECK (motivo IN (
    'teleconsulta_no_realizable',      -- §5
    'teleconsulta_cancelada_en_ventana', -- §4
    'teleconsulta_ausencia_profesional'  -- §4, la enmienda del caso simétrico
  )),
  CONSTRAINT chk_devolucion_estado CHECK (estado IN ('pendiente','resuelta','rechazada')),
  -- La coherencia de la resolución, inexpresable al revés: no se puede
  -- marcar resuelta sin decir quién y cuándo.
  CONSTRAINT chk_devolucion_resolucion CHECK (
    (estado = 'pendiente' AND resuelta_en IS NULL AND resuelta_por IS NULL)
    OR (estado <> 'pendiente' AND resuelta_en IS NOT NULL AND resuelta_por IS NOT NULL)
  ),
  -- Una cita genera UNA solicitud. Reintentar no duplica la plata.
  CONSTRAINT uq_devolucion_por_cita UNIQUE (cita_id)
);

COMMENT ON TABLE public.solicitudes_devolucion IS
  'S106 · El registro legible para soporte de una devolución que hay que '
  'ejecutar A MANO en el panel del proveedor. EL SISTEMA REGISTRA, NO '
  'PROMETE: `estado=pendiente` significa «alguien tiene que devolver esta '
  'plata», jamás «ya se devolvió». Nace porque el motor de saldo no existe '
  '(D-926) y el reverso por API solo corre dentro de la ventana del riel.';

ALTER TABLE public.solicitudes_devolucion ENABLE ROW LEVEL SECURITY;

-- El dueño ve la suya (para que la app pueda decirle «está en trámite»).
-- Escribir y resolver son actos del servidor y de admin, jamás del cliente.
CREATE POLICY devolucion_select_propia ON public.solicitudes_devolucion
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

REVOKE ALL ON public.solicitudes_devolucion FROM anon;
GRANT SELECT ON public.solicitudes_devolucion TO authenticated;

-- ─── 3 · §5 · LA CONSULTA QUE SE CORTA ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.marcar_teleconsulta_no_realizable(
  p_cita_id uuid,
  p_detalle text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_auth uuid := auth.uid();
  v_cita record;
  v_cat  text;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita_id FOR UPDATE;
  IF v_cita.id IS NULL THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;

  -- La marca es del PRESTADOR de ESTA cita — no de cualquiera del negocio
  -- ajeno, y no del dueño. Rechazo tipado y distinto del de estado.
  IF NOT user_puede_acceder_prestador(v_cita.prestador_id) THEN
    RAISE EXCEPTION 'no_es_el_prestador_de_la_cita' USING ERRCODE = '42501';
  END IF;

  SELECT ts.categoria INTO v_cat FROM tipos_servicio ts WHERE ts.codigo = v_cita.tipo_servicio;
  IF v_cat IS DISTINCT FROM 'telemedicina' THEN
    RAISE EXCEPTION 'cita_no_es_teleconsulta' USING ERRCODE = '22023';
  END IF;

  -- Solo MIENTRAS no está completada. Una consulta que ya se prestó no se
  -- vuelve no realizable: eso sería deshacer un hecho, no registrarlo.
  IF v_cita.estado IN ('completada','cancelada','no_show','no_realizable','rechazada') THEN
    RAISE EXCEPTION 'cita_estado_invalido: %', v_cita.estado USING ERRCODE = '22023';
  END IF;

  UPDATE evento_cita_servicio
     SET estado = 'no_realizable',
         estado_reserva = CASE WHEN estado_reserva = 'pagada' THEN 'cancelada' ELSE estado_reserva END,
         metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
           'no_realizable', jsonb_build_object(
             'marcada_por', v_auth,
             'marcada_en', now(),
             'detalle', p_detalle,
             -- §5: NO se investiga la culpa. Este campo NO existe a propósito.
             'atribucion', 'no_se_investiga'
           )),
         updated_at = now()
   WHERE id = p_cita_id;

  -- Solo hay plata que devolver si hubo plata. Una teleconsulta que nunca
  -- se pagó no genera solicitud — y decirlo así evita una fila fantasma.
  IF v_cita.estado_reserva = 'pagada' AND COALESCE(v_cita.precio,0) > 0 THEN
    INSERT INTO solicitudes_devolucion (cita_id, user_id, monto, motivo, creada_por, detalle)
    VALUES (p_cita_id, v_cita.user_id, v_cita.precio,
            'teleconsulta_no_realizable', v_auth, p_detalle)
    ON CONFLICT (cita_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', p_cita_id,
    'estado', 'no_realizable',
    'devolucion_registrada', (v_cita.estado_reserva = 'pagada' AND COALESCE(v_cita.precio,0) > 0),
    'monto', CASE WHEN v_cita.estado_reserva = 'pagada' THEN v_cita.precio ELSE NULL END
  );
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.marcar_teleconsulta_no_realizable(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.marcar_teleconsulta_no_realizable(uuid, text) TO authenticated;

-- ─── 4 · §4 · LA CANCELACIÓN EN VENTANA (30 min) ───────────────────────
CREATE OR REPLACE FUNCTION public.cancelar_teleconsulta(p_cita_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_auth    uuid := auth.uid();
  v_cita    record;
  v_ahora   timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  v_ventana int;
  v_cat     text;
  v_hay_plata boolean;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita_id FOR UPDATE;
  IF v_cita.id IS NULL OR v_cita.user_id IS DISTINCT FROM v_auth THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;

  SELECT ts.categoria INTO v_cat FROM tipos_servicio ts WHERE ts.codigo = v_cita.tipo_servicio;
  IF v_cat IS DISTINCT FROM 'telemedicina' THEN
    RAISE EXCEPTION 'cita_no_es_teleconsulta' USING ERRCODE = '22023';
  END IF;

  IF v_cita.estado <> 'confirmada' THEN
    RAISE EXCEPTION 'cita_estado_invalido: %', v_cita.estado USING ERRCODE = '22023';
  END IF;

  -- La ventana sale del CATÁLOGO (S106 · 2b): telemedicina = 30 min.
  v_ventana := public._ventana_cancelacion_minutos(v_cita.tipo_servicio);
  IF (v_cita.fecha + v_cita.hora) - v_ahora < make_interval(mins => v_ventana) THEN
    RAISE EXCEPTION 'ventana_cancelacion_vencida' USING ERRCODE = '22023';
  END IF;

  v_hay_plata := (v_cita.estado_reserva = 'pagada' AND COALESCE(v_cita.precio,0) > 0);

  UPDATE evento_cita_servicio
     SET estado = 'cancelada',
         estado_reserva = CASE WHEN estado_reserva = 'pagada' THEN 'cancelada' ELSE estado_reserva END,
         metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
           'motivo', 'teleconsulta_cancelacion_en_ventana',
           'cancelada_en', now(),
           'ventana_minutos', v_ventana),
         updated_at = now()
   WHERE id = p_cita_id;

  IF v_hay_plata THEN
    INSERT INTO solicitudes_devolucion (cita_id, user_id, monto, motivo, creada_por)
    VALUES (p_cita_id, v_cita.user_id, v_cita.precio,
            'teleconsulta_cancelada_en_ventana', v_auth)
    ON CONFLICT (cita_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', p_cita_id,
    'estado', 'cancelada',
    'ventana_minutos', v_ventana,
    'devolucion_registrada', v_hay_plata,
    -- 🔴 La superficie promete «a tu medio de pago» con plazo honesto, y
    -- JAMÁS «al instante». Este campo existe para que la voz NO invente.
    'via_devolucion', CASE WHEN v_hay_plata THEN 'medio_de_pago_por_soporte' ELSE NULL END
  );
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.cancelar_teleconsulta(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.cancelar_teleconsulta(uuid) TO authenticated;

-- ─── 5 · La puerta vieja se cierra para telemedicina ───────────────────
CREATE OR REPLACE FUNCTION public.cancelar_cita_suelta(p_cita_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth    uuid := auth.uid();
  v_cita    record;
  v_ahora   timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  v_dest    uuid;
  v_ventana int;
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

  -- S106: la teleconsulta tiene su propia puerta, porque su devolución NO
  -- es la simulada de P18 sino un registro para soporte. Rebote tipado que
  -- NOMBRA la puerta correcta — un rebote que no dice a dónde ir manda a
  -- soporte a adivinar.
  IF EXISTS (SELECT 1 FROM tipos_servicio ts
              WHERE ts.codigo = v_cita.tipo_servicio AND ts.categoria = 'telemedicina') THEN
    RAISE EXCEPTION 'usar_cancelar_teleconsulta' USING ERRCODE = '22023';
  END IF;

  IF v_cita.estado <> 'confirmada' OR v_cita.estado_reserva IS DISTINCT FROM 'pagada' THEN
    RAISE EXCEPTION 'cita_estado_invalido: % / %', v_cita.estado, COALESCE(v_cita.estado_reserva, 'NULL')
      USING ERRCODE = '22023';
  END IF;

  v_ventana := public._ventana_cancelacion_minutos(v_cita.tipo_servicio);
  IF (v_cita.fecha + v_cita.hora) - v_ahora < make_interval(mins => v_ventana) THEN
    RAISE EXCEPTION 'ventana_cancelacion_vencida' USING ERRCODE = '22023';
  END IF;

  UPDATE evento_cita_servicio
  SET estado = 'cancelada',
      estado_reserva = 'cancelada',
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'motivo', 'p18_cancelacion_en_ventana',
        'cancelada_en', now(),
        'ventana_minutos', v_ventana,
        'reembolso_simulado', jsonb_build_object(
          'monto', v_cita.precio, 'simulado', true,
          'motivo', 'p18_cancelacion_en_ventana', 'aplicado_en', now())),
      updated_at = now()
  WHERE id = p_cita_id;

  SELECT pr.user_id INTO v_dest FROM prestadores pr WHERE pr.id = v_cita.prestador_id;
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
      p_clave_dedup          => 'cita_cancelada:' || p_cita_id::text);
  END IF;

  RETURN jsonb_build_object('ok', true, 'cita_id', p_cita_id, 'estado', 'cancelada',
    'reembolso_monto', v_cita.precio, 'reembolso_simulado', true);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.cancelar_cita_suelta(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.cancelar_cita_suelta(uuid) TO authenticated;

-- ─── 6 · CINTURÓN ──────────────────────────────────────────────────────
DO $cinturon$
DECLARE v_ok boolean; v_n int;
BEGIN
  -- El vocabulario admite el valor nuevo y NO perdió los viejos.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conname='evento_cita_servicio_estado_check'
                    AND pg_get_constraintdef(oid) ILIKE '%no_realizable%') THEN
    RAISE EXCEPTION 'CINTURON: el CHECK no admite no_realizable';
  END IF;
  FOREACH v_ok IN ARRAY ARRAY[true] LOOP NULL; END LOOP;
  SELECT count(*) INTO v_n FROM evento_cita_servicio;  -- las vivas siguen válidas
  RAISE NOTICE 'CINTURON: % citas vivas siguen cumpliendo el CHECK ampliado', v_n;

  -- El estado malo de la devolución es INEXPRESABLE: resuelta sin quién.
  BEGIN
    INSERT INTO solicitudes_devolucion (cita_id, user_id, monto, motivo, creada_por, estado)
    SELECT c.id, c.user_id, 1, 'teleconsulta_no_realizable', c.user_id, 'resuelta'
      FROM evento_cita_servicio c LIMIT 1;
    RAISE EXCEPTION 'CINTURON: se pudo marcar resuelta una devolución sin quién ni cuándo';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- Y el motivo es vocabulario cerrado.
  BEGIN
    INSERT INTO solicitudes_devolucion (cita_id, user_id, monto, motivo, creada_por)
    SELECT c.id, c.user_id, 1, 'motivo_inventado', c.user_id
      FROM evento_cita_servicio c LIMIT 1;
    RAISE EXCEPTION 'CINTURON: el motivo de devolución NO está cerrado';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  IF EXISTS (SELECT 1 FROM solicitudes_devolucion) THEN
    RAISE EXCEPTION 'CINTURON: las pruebas dejaron residuo en solicitudes_devolucion';
  END IF;

  -- La puerta vieja nombra la nueva.
  SELECT pg_get_functiondef(p.oid) ILIKE '%usar_cancelar_teleconsulta%' INTO v_ok
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='cancelar_cita_suelta';
  IF NOT v_ok THEN
    RAISE EXCEPTION 'CINTURON: cancelar_cita_suelta no corta telemedicina';
  END IF;

  IF has_function_privilege('anon','public.cancelar_teleconsulta(uuid)','EXECUTE')
     OR has_function_privilege('anon','public.marcar_teleconsulta_no_realizable(uuid, text)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON L-140: alguna RPC nueva quedó abierta a anon';
  END IF;

  RAISE NOTICE 'CINTURON OK — vocabulario por letra, estados malos inexpresables, residuo 0, puerta vieja cortada, anon cerrado';
END
$cinturon$;

COMMIT;
