/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de `20260831140000_s107a_origen_de_la_estadia.sql` — escrita ANTES.
   ═══════════════════════════════════════════════════════════════════════════
   🔴 QUÉ NO DESHACE: revertir le saca a la fila del hub el único dato que dice
   de dónde salió la reserva. La superficie NO puede volver a deducirlo de
   `precio IS NULL` — *el día que un día suelto también venga sin precio, la
   marca «Con tu paquete» empieza a mentir sin que nadie lo note.* Si esta
   proyección se va, la marca se va con ella.
   ═══════════════════════════════════════════════════════════════════════════ */
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_mis_estadias_guarderia(uuid);
CREATE OR REPLACE FUNCTION public.obtener_mis_estadias_guarderia(p_mascota_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(cita_id uuid, estadia_id uuid, mascota_id uuid, mascota_nombre text, prestador_id uuid, prestador_nombre text, fecha date, precio numeric, estado_cita text, estado_reserva text, estado_estadia text, a_bordo_en timestamp with time zone, llegada_en timestamp with time zone, entregada_en timestamp with time zone, acta_recogida_id uuid, acta_devolucion_id uuid, tramo_recogida_id uuid, tramo_devolucion_id uuid, es_proxima boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
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
         /* ✏️ LOS DOS TRAMOS — no faltaba entidad, faltaba proyección. Con
            estos dos campos el mapa del punto vivo se enciende solo. */
         e.tramo_recogida_id, e.tramo_devolucion_id,
         (c.fecha >= public.hoy_local()
          AND c.estado IN ('pendiente','confirmada','en_curso')) AS es_proxima
    FROM evento_cita_servicio c
    JOIN mascotas m      ON m.id = c.mascota_id
    JOIN prestadores pr  ON pr.id = c.prestador_id
    LEFT JOIN guarderia_estadias e ON e.cita_id = c.id
    LEFT JOIN guarderia_actas ar ON ar.estadia_id = e.id AND ar.direccion = 'recogida'
    LEFT JOIN guarderia_actas ad ON ad.estadia_id = e.id AND ad.direccion = 'devolucion'
   WHERE c.tipo_servicio = 'guarderia_dia'
     AND (p_mascota_id IS NULL OR c.mascota_id = p_mascota_id)
     AND user_tiene_acceso_a_mascota(c.mascota_id)
     AND (c.estado_reserva = 'pagada'
          OR (c.estado_reserva = 'pendiente_pago' AND c.expira_en > now()))
   ORDER BY c.fecha DESC, c.id;
END $function$
;
COMMIT;
