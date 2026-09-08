-- S114-A · la bandeja del PRESTADOR también dice de qué servicio hablan (§5)
-- Misma enriquecida que obtener_mis_casos: las dos bandejas comparten
-- FilaBandejaCaso, y §5 aplica a ambas.
-- 76(g): NO RIGE — cambia un lector.
BEGIN;
CREATE OR REPLACE FUNCTION public.obtener_casos_del_prestador()
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'caso_id', c.id, 'objeto_tipo', c.objeto_tipo, 'objeto_id', c.objeto_id,
    'motivo', c.motivo_codigo, 'clase', c.clase, 'etapa', c.etapa,
    'plazo_hasta', c.plazo_prestador_hasta, 'creado_en', c.creado_en,
    'servicio', CASE c.objeto_tipo
       WHEN 'cita'    THEN (SELECT ec.tipo_servicio FROM evento_cita_servicio ec WHERE ec.id = c.objeto_id)
       WHEN 'estadia' THEN 'guarderia'
       WHEN 'pedido'  THEN 'despensa' END,
    'mascota_nombre', CASE c.objeto_tipo
       WHEN 'cita'    THEN (SELECT m.nombre FROM evento_cita_servicio ec JOIN mascotas m ON m.id = ec.mascota_id WHERE ec.id = c.objeto_id)
       WHEN 'estadia' THEN (SELECT m.nombre FROM guarderia_estadias e JOIN evento_cita_servicio ec ON ec.id = e.cita_id JOIN mascotas m ON m.id = ec.mascota_id WHERE e.id = c.objeto_id)
       ELSE NULL END,
    'objeto_fecha', CASE c.objeto_tipo
       WHEN 'cita'    THEN (SELECT ec.fecha::text FROM evento_cita_servicio ec WHERE ec.id = c.objeto_id)
       WHEN 'estadia' THEN (SELECT ec.fecha::text FROM guarderia_estadias e JOIN evento_cita_servicio ec ON ec.id = e.cita_id WHERE e.id = c.objeto_id)
       WHEN 'pedido'  THEN (SELECT ped.entrega_fecha_objetivo::text FROM pedidos ped WHERE ped.id = c.objeto_id) END,
    'pedido_numero', CASE c.objeto_tipo
       WHEN 'pedido' THEN (SELECT ped.numero_orden FROM pedidos ped WHERE ped.id = c.objeto_id) ELSE NULL END
  ) ORDER BY c.creado_en DESC), '[]'::jsonb)
  FROM casos_postventa c
  WHERE c.prestador_id IS NOT NULL AND es_mi_prestador(c.prestador_id);
$function$;
COMMIT;
