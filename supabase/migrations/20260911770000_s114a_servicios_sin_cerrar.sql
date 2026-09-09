-- S114-A · C8 · «lo que te espera» del prestador: servicios sin cerrar (§2 · F1)
-- El espejo del reloj, del lado del prestador: los objetos pasados su hora de
-- fin que todavía no cerró. La línea de las 48 h le dice que NO se cobra, y eso
-- es verdad en el ledger (F1: a las 48 h queda no_ejecutado y no devenga).
--   · sin_cerrar (accionable): pasado fin, aún cerrable → si lo cierra, cobra.
--   · vencido: pasado fin+48 h → perdió el cobro (el reloj lo hará no_ejecutado).
-- Excluye lo ya cerrado (completada/entregada/no_recogida/cancelada) y lo ya
-- no_ejecutado (resuelto, no accionable). Mismo cómputo de fin que el reloj.
-- 76(g): NO RIGE — lector nuevo, sin datos.
BEGIN;
CREATE OR REPLACE FUNCTION public.obtener_servicios_sin_cerrar()
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
  WITH items AS (
    -- CITAS · fin = fecha + hora + duración (hora local Guayaquil)
    SELECT c.id AS objeto_id, 'cita'::text AS objeto_tipo, c.tipo_servicio AS servicio,
           (SELECT m.nombre FROM mascotas m WHERE m.id = c.mascota_id) AS mascota_nombre,
           c.fecha::text AS fecha,
           ((c.fecha::timestamp + c.hora) AT TIME ZONE 'America/Guayaquil')
             + (COALESCE(c.duracion_minutos,60)||' min')::interval AS fin
    FROM evento_cita_servicio c
    WHERE c.prestador_id IS NOT NULL AND es_mi_prestador(c.prestador_id)
      AND c.estado IN ('confirmada','en_curso') AND c.estado_reserva = 'pagada'
      AND now() >= ((c.fecha::timestamp + c.hora) AT TIME ZONE 'America/Guayaquil')
                   + (COALESCE(c.duracion_minutos,60)||' min')::interval
    UNION ALL
    -- ESTADÍAS · fin = fin del día de la estadía (Guayaquil)
    SELECT e.id, 'estadia'::text, 'guarderia'::text,
           (SELECT m.nombre FROM mascotas m WHERE m.id = c.mascota_id),
           c.fecha::text,
           ((c.fecha + interval '1 day')::timestamp AT TIME ZONE 'America/Guayaquil')
    FROM guarderia_estadias e
    JOIN evento_cita_servicio c ON c.id = e.cita_id
    WHERE c.prestador_id IS NOT NULL AND es_mi_prestador(c.prestador_id)
      AND e.estado NOT IN ('entregada','no_recogida','cancelada','no_ejecutado')
      AND c.estado_reserva = 'pagada'
      AND now() >= ((c.fecha + interval '1 day')::timestamp AT TIME ZONE 'America/Guayaquil')
  )
  SELECT jsonb_build_object(
    'cantidad', (SELECT count(*) FROM items),
    'items', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'objeto_id', objeto_id, 'objeto_tipo', objeto_tipo, 'servicio', servicio,
        'mascota_nombre', mascota_nombre, 'fecha', fecha,
        'vencido', (now() >= fin + interval '48 hours'))
      ORDER BY (now() >= fin + interval '48 hours') DESC, fin ASC) FROM items), '[]'::jsonb));
$function$;
REVOKE ALL ON FUNCTION public.obtener_servicios_sin_cerrar() FROM anon, PUBLIC;
COMMIT;
