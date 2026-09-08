-- REVERSA de `20260911630000_s114a_cerrado_en_por_objeto.sql`. Escrita ANTES.
-- 🔴 Repone el ancla en `entregado` con fallback a `created_at`, que le cierra
--    la puerta del caso justo a las DOS fallas de clase 1 del pedido
--    (`no_entregado` y `cancelado_vendedor`): sin `entregado`, la ventana de
--    7 días se cuenta desde que se HIZO el pedido y no desde que falló.
--    Daño medido el 7-sep: 0 casos, porque en los datos de prueba cancelar
--    ocurre el mismo día que crear. **Eso no lo vuelve inocuo: lo vuelve
--    invisible con los datos de hoy.**
CREATE OR REPLACE FUNCTION public._caso_dueno_del_objeto(p_tipo text, p_id uuid)
RETURNS TABLE (familia_user_id uuid, prestador_id uuid, cuenta_comercial_id uuid,
               cerrado_en timestamptz, mascota_id uuid, titulo text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
BEGIN
  IF p_tipo = 'cita' THEN
    RETURN QUERY SELECT c.user_id, c.prestador_id, p.cuenta_comercial_id,
      COALESCE(a.cerrada_en, (c.fecha + c.hora)::timestamptz), c.mascota_id, c.tipo_servicio
      FROM evento_cita_servicio c LEFT JOIN prestadores p ON p.id = c.prestador_id
      LEFT JOIN evento_atencion a ON a.cita_id = c.id WHERE c.id = p_id;
  ELSIF p_tipo = 'estadia' THEN
    RETURN QUERY SELECT c.user_id, c.prestador_id, p.cuenta_comercial_id,
      COALESCE(e.entregada_en, e.no_recogida_en, (c.fecha)::timestamptz), c.mascota_id, 'guarderia'::text
      FROM guarderia_estadias e JOIN evento_cita_servicio c ON c.id = e.cita_id
      LEFT JOIN prestadores p ON p.id = c.prestador_id WHERE e.id = p_id;
  ELSIF p_tipo = 'pedido' THEN
    RETURN QUERY SELECT ped.user_id, NULL::uuid, ped.cuenta_comercial_id,
      COALESCE((SELECT max(pe.created_at) FROM pedido_estados pe
                 WHERE pe.pedido_id = ped.id AND pe.estado_codigo = 'entregado'), ped.created_at),
      NULL::uuid, COALESCE(ped.numero_orden, 'Pedido')
      FROM pedidos ped WHERE ped.id = p_id;
  END IF;
END $fn$;
