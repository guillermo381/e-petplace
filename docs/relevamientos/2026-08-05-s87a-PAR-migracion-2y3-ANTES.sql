BEGIN;
UPDATE programas_contratados SET estado='activo',
       vigencia_hasta=(now() AT TIME ZONE 'America/Guayaquil')::date + 2,
       pago_metadata = coalesce(pago_metadata,'{}'::jsonb) - ('aviso_vigencia_' || ((now() AT TIME ZONE 'America/Guayaquil')::date + 2)::text)
 WHERE id = (SELECT id FROM programas_contratados LIMIT 1);
SELECT (SELECT count(*) FROM notificaciones) n0;
SELECT vencer_programas_adiestramiento() r1;
SELECT cerrar_y_renovar_planes() r2;
SELECT (SELECT count(*) FROM notificaciones) n1;
ROLLBACK;
