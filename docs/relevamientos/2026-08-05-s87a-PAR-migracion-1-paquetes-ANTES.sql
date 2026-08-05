BEGIN;
-- FABRICO el caso: un bono pagado, con salidas sin usar, venciendo en 2 dias.
UPDATE bonos SET estado='activo', estado_pago='pagado',
       fecha_vencimiento = (now() AT TIME ZONE 'America/Guayaquil')::date + 2,
       unidades_usadas = 0, unidades_total = 5,
       pago_metadata = coalesce(pago_metadata,'{}'::jsonb) - ('aviso_vencimiento_' || ((now() AT TIME ZONE 'America/Guayaquil')::date + 2)::text)
 WHERE id = (SELECT id FROM bonos LIMIT 1);
SELECT (SELECT count(*) FROM notificaciones) AS notif_antes;
SELECT vencer_paquetes_salidas() AS resultado;
SELECT (SELECT count(*) FROM notificaciones) AS notif_despues,
       (SELECT count(*) FROM notificaciones WHERE tipo='sistema'
          AND titulo='Tu paquete de salidas vence pronto') AS filas_del_aviso;
ROLLBACK;
