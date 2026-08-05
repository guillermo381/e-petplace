BEGIN;
UPDATE bonos SET estado='activo', estado_pago='pagado',
       fecha_vencimiento = (now() AT TIME ZONE 'America/Guayaquil')::date + 2,
       unidades_usadas = 0, unidades_total = 5,
       pago_metadata = coalesce(pago_metadata,'{}'::jsonb) - ('aviso_vencimiento_' || ((now() AT TIME ZONE 'America/Guayaquil')::date + 2)::text)
 WHERE id = (SELECT id FROM bonos LIMIT 1);
SELECT vencer_paquetes_salidas() AS resultado;
SELECT (SELECT count(*) FROM notificaciones) AS notif_ahora,
       (SELECT count(*) FROM notificacion_intencion) AS intenciones;
SELECT set_config('request.jwt.claims',
  json_build_object('sub',(SELECT ur.user_id FROM user_roles ur WHERE ur.role='admin' LIMIT 1),'role','authenticated')::text, true);
SELECT que, canal, a_quien, sobre, resultado, por_que, modo
  FROM leer_sombra_notificaciones(now() - interval '2 minutes', now());
ROLLBACK;
