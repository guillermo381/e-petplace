-- S114-A ⑥ · EL LECTOR CONOCE EL CORTE DE F1 — la pantalla dejaba de mentir.
--
-- E midió: obtener_servicios_sin_cerrar() devolvía 62; sólo 6 son accionables.
-- Los otros 56 están fuera del corte (backlog de construcción) y el reloj los
-- saltea PARA SIEMPRE (cero casos, cero eventos económicos). La pantalla decía
-- «no se cobran y la familia recibió su devolución» — ninguna familia recibió
-- nada. Dos lugares que deciden qué objetos importan, y sólo el reloj leía el
-- corte.
--
-- FIRMA DEL FOUNDER: si el backlog viejo es ruido para el reloj, es ruido para
-- la pantalla. El lector lee app_config.f1_corte_cierre_ausente y devuelve SÓLO
-- lo que el reloj puede tocar (fin::date >= corte), con el MISMO criterio que
-- expirar_objetos_sin_cierre. El total fuera de corte se devuelve APARTE, para
-- diagnóstico, y NUNCA mezclado en el número que ve el prestador.
--
-- 76(g) NO RIGE (DB, sin anclas de OTA; función de lectura). Reversa ANTES.

CREATE OR REPLACE FUNCTION public.obtener_servicios_sin_cerrar()
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
  WITH corte AS (
    SELECT valor::date AS d FROM app_config WHERE clave = 'f1_corte_cierre_ausente'
  ),
  items AS (
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
  ),
  -- SÓLO lo accionable: fin >= corte, lo que el reloj puede tocar. Si no hay
  -- corte configurado, `fin::date >= NULL` es NULL ⇒ cero accionables (fail-closed,
  -- igual que el reloj, que sin corte no corre).
  dentro AS (SELECT i.* FROM items i, corte c WHERE i.fin::date >= c.d)
  SELECT jsonb_build_object(
    'cantidad', (SELECT count(*) FROM dentro),
    'items', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'objeto_id', objeto_id, 'objeto_tipo', objeto_tipo, 'servicio', servicio,
        'mascota_nombre', mascota_nombre, 'fecha', fecha,
        'vencido', (now() >= fin + interval '48 hours'))
      ORDER BY (now() >= fin + interval '48 hours') DESC, fin ASC) FROM dentro), '[]'::jsonb),
    -- Diagnóstico, SEPARADO: el backlog fuera de corte que el reloj no toca.
    'fuera_de_corte', (SELECT count(*) FROM items i, corte c WHERE i.fin::date < c.d)
  );
$function$;
REVOKE ALL ON FUNCTION public.obtener_servicios_sin_cerrar() FROM anon, PUBLIC;
