-- ═══════════════════════════════════════════════════════════════════════════
-- S71-A · D-455 + E2 (vara cruzada del Hogar v2) — dos piezas chicas de motor
--
-- (1) D-455 — EL NOMBRE DEL NEGOCIO NO LE LLEGA AL DUEÑO.
--     La cita `por_coordinar` (nacida de presupuesto aprobado) y el
--     presupuesto mismo no pueden decirle al dueño QUIÉN lo va a contactar:
--     `prestador_id` es NULL cuando no hubo empleado emisor (D-439 retiró la
--     heurística) y `cuentas_comerciales` tiene RLS solo-owner — verificado
--     con el JWT del titular real: count = 0.
--
--     Cura: UNA función DEFINER angosta, keyed POR PRESUPUESTO (la fila que
--     el dueño YA puede ver por la policy S69 con _user_es_familia_de_mascota).
--     Expone EXACTAMENTE un campo (nombre_comercial) y solo para presupuestos
--     de mascotas de la familia del caller. La RLS de cuentas_comerciales
--     queda INTACTA para todo lo demás. Sirve a los DOS lectores del cliente
--     (presupuestos-familia y citasMascota) con el mismo gate.
--
-- (2) E2 — LO PERECEDERO PRIMERO. `obtener_solicitudes_pendientes_dueno`
--     ordenaba `created_at DESC`: una solicitud a punto de expirar (10' de
--     vida, patrón hold) podía quedar DEBAJO de una recién creada. La sección
--     "Ponte al día" del Hogar v2 muestra 3 y pliega el resto — con el orden
--     viejo, la que expira primero podía quedar plegada. ORDER BY expira_en
--     ASC. Misma firma ⇒ CREATE OR REPLACE es reemplazo real, cero zombi
--     (L-119 no aplica).
--
-- 76(g): migración ADITIVA pura (una función nueva + un ORDER BY) — la veda
-- de escritura NO RIGE. Cero cambio de datos, cero cambio de shape existente.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── (1) D-455: el nombre del negocio, por presupuesto ───────────────────────

CREATE OR REPLACE FUNCTION public.obtener_nombres_negocio_por_presupuesto(p_presupuesto_ids uuid[])
RETURNS TABLE(presupuesto_id uuid, nombre_comercial text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;

  -- El gate es EL MISMO helper único de S69 (L-150: una sola verdad de
  -- acceso): solo presupuestos de mascotas de la familia del caller.
  -- Presupuesto ajeno en el array = fila ausente, jamás error (el caller
  -- no aprende ni que existe).
  RETURN QUERY
  SELECT p.id, cc.nombre_comercial
  FROM presupuesto p
  JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
  WHERE p.id = ANY(p_presupuesto_ids)
    AND public._user_es_familia_de_mascota(p.mascota_id, v_uid);
END;
$$;

-- L-140: el default privilege le dio EXECUTE a anon en el CREATE — se quita
-- explícito y se otorga el mínimo.
REVOKE EXECUTE ON FUNCTION public.obtener_nombres_negocio_por_presupuesto(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_nombres_negocio_por_presupuesto(uuid[]) TO authenticated, service_role;

-- ── (2) E2: lo perecedero primero en las solicitudes del dueño ──────────────
-- Body VERBATIM del vivo (pg_get_functiondef relevado en esta tanda) salvo
-- la última línea: ORDER BY s.created_at DESC → s.expira_en ASC.

CREATE OR REPLACE FUNCTION public.obtener_solicitudes_pendientes_dueno()
RETURNS TABLE(solicitud_id uuid, tipo text, mascota_id uuid, mascota_nombre text, negocio_nombre text, expira_en timestamp with time zone)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.tipo,
    s.mascota_id,
    COALESCE(m.nombre, s.payload_alta->>'nombre'),   -- alta: el nombre propuesto
    cc.nombre_comercial,
    s.expira_en
  FROM solicitud_autorizacion_mostrador s
  JOIN cuentas_comerciales cc ON cc.id = s.cuenta_comercial_id
  LEFT JOIN mascotas m ON m.id = s.mascota_id
  WHERE s.estado = 'pendiente' AND s.expira_en > now()
    AND (
      (s.tipo = 'atencion'     AND public._user_es_familia_de_mascota(s.mascota_id, v_uid)) OR
      (s.tipo = 'alta_mascota' AND s.destino_user_id = v_uid)
    )
  ORDER BY s.expira_en ASC;   -- E2: lo perecedero primero (era created_at DESC)
END;
$$;

-- CREATE OR REPLACE conserva el ACL vivo ({postgres, authenticated,
-- service_role} — relevado), pero se re-asserta explícito igual: el estado
-- final no depende de lo que había.
REVOKE EXECUTE ON FUNCTION public.obtener_solicitudes_pendientes_dueno() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_solicitudes_pendientes_dueno() TO authenticated, service_role;

-- ── Verificación estructural in-migration (L-140) ───────────────────────────
DO $$
DECLARE
  v_acl aclitem[];
BEGIN
  SELECT proacl INTO v_acl FROM pg_proc
  WHERE proname = 'obtener_nombres_negocio_por_presupuesto';
  IF v_acl::text LIKE '%anon=%' THEN
    RAISE EXCEPTION 'L-140: anon conserva EXECUTE en obtener_nombres_negocio_por_presupuesto';
  END IF;

  SELECT proacl INTO v_acl FROM pg_proc
  WHERE proname = 'obtener_solicitudes_pendientes_dueno';
  IF v_acl::text LIKE '%anon=%' THEN
    RAISE EXCEPTION 'L-140: anon conserva EXECUTE en obtener_solicitudes_pendientes_dueno';
  END IF;

  IF (SELECT count(*) FROM pg_proc WHERE proname = 'obtener_solicitudes_pendientes_dueno') <> 1 THEN
    RAISE EXCEPTION 'L-119: sobrecarga zombi de obtener_solicitudes_pendientes_dueno';
  END IF;
END $$;
