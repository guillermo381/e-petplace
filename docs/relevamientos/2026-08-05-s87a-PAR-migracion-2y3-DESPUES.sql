BEGIN;
UPDATE programas_contratados SET estado='activo',
       vigencia_hasta=(now() AT TIME ZONE 'America/Guayaquil')::date + 2,
       pago_metadata = coalesce(pago_metadata,'{}'::jsonb) - ('aviso_vigencia_' || ((now() AT TIME ZONE 'America/Guayaquil')::date + 2)::text)
 WHERE id = (SELECT id FROM programas_contratados LIMIT 1);
SELECT vencer_programas_adiestramiento() r1;
SELECT cerrar_y_renovar_planes() r2;
SELECT (SELECT count(*) FROM notificaciones) notif_ahora,
       (SELECT count(*) FROM notificacion_intencion) intenciones;
SELECT set_config('request.jwt.claims',
  json_build_object('sub',(SELECT ur.user_id FROM user_roles ur WHERE ur.role='admin' LIMIT 1),'role','authenticated')::text, true);
SELECT que, canal, sobre, resultado, por_que FROM leer_sombra_notificaciones(now() - interval '2 minutes', now());
ROLLBACK;
