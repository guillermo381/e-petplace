-- S114-A · la bandeja de casos dice DE QUÉ SERVICIO HABLAN (dirección §5)
-- La fila decía «Una cita»; §5 pide «Paseo de Thor · martes 9». obtener_mis_casos
-- gana servicio + mascota + fecha del objeto; la app compone la voz y el formato.
-- 76(g): NO RIGE — cambia un lector, sin datos.
BEGIN;
CREATE OR REPLACE FUNCTION public.obtener_mis_casos()
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'caso_id', c.id, 'objeto_tipo', c.objeto_tipo, 'objeto_id', c.objeto_id,
    'motivo', c.motivo_codigo, 'clase', c.clase, 'etapa', c.etapa,
    'plazo_hasta', c.plazo_prestador_hasta, 'creado_en', c.creado_en,
    -- §5 · de qué servicio hablan (la app pone la voz y el formato de fecha)
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
  ) ORDER BY
    (SELECT es_final FROM cat_estados_caso ce WHERE ce.etapa = c.etapa) ASC,
    c.creado_en DESC), '[]'::jsonb)
  FROM casos_postventa c
  WHERE c.familia_user_id = auth.uid();
$function$;
COMMIT;
