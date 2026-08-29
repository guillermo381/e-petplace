CREATE OR REPLACE FUNCTION public.obtener_mis_estadias_guarderia(p_mascota_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(cita_id uuid, estadia_id uuid, mascota_id uuid, mascota_nombre text, prestador_id uuid, prestador_nombre text, fecha date, precio numeric, estado_cita text, estado_reserva text, estado_estadia text, a_bordo_en timestamp with time zone, llegada_en timestamp with time zone, entregada_en timestamp with time zone, acta_recogida_id uuid, acta_devolucion_id uuid, es_proxima boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  /* Si piden una mascota, se verifica el acceso a ESA. Sin filtro, el WHERE de
     abajo acota por `user_tiene_acceso_a_mascota` fila por fila — nunca se
     devuelve una estadía de una familia ajena. */
  IF p_mascota_id IS NOT NULL AND NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  SELECT c.id, e.id, c.mascota_id, m.nombre,
         c.prestador_id, pr.nombre_comercial,
         c.fecha, c.precio,
         c.estado, c.estado_reserva, e.estado,
         e.a_bordo_en, e.llegada_en, e.entregada_en,
         ar.id, ad.id,
         (c.fecha >= public.hoy_local()
          AND c.estado IN ('pendiente','confirmada','en_curso')) AS es_proxima
    FROM evento_cita_servicio c
    JOIN mascotas m      ON m.id = c.mascota_id
    JOIN prestadores pr  ON pr.id = c.prestador_id
    LEFT JOIN guarderia_estadias e ON e.cita_id = c.id
    /* Las actas por dirección, para que la pantalla del acta no tenga que
       preguntar de nuevo: si hay id, hay acta. */
    LEFT JOIN guarderia_actas ar ON ar.estadia_id = e.id AND ar.direccion = 'recogida'
    LEFT JOIN guarderia_actas ad ON ad.estadia_id = e.id AND ad.direccion = 'devolucion'
   WHERE c.tipo_servicio = 'guarderia_dia'
     AND (p_mascota_id IS NULL OR c.mascota_id = p_mascota_id)
     AND user_tiene_acceso_a_mascota(c.mascota_id)
     /* Firme, o el hold VIGENTE de esta familia (D-319). El vencido no: es un
        intento que ya no existe, y mostrarlo sería ofrecer algo que se cae. */
     AND (c.estado_reserva = 'pagada'
          OR (c.estado_reserva = 'pendiente_pago' AND c.expira_en > now()))
   ORDER BY c.fecha DESC, c.id;
END $function$
