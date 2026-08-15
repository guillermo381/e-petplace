-- REVERSA de 20260815110000_s97a_puerta_corte_dias.sql
-- ESCRITA ANTES DE APLICAR: es la definición VIVA capturada de
-- `pg_get_functiondef`, no una reconstrucción.
--
-- 🔴 QUÉ NO DESHACE: los días y festivos que los vendedores ya hayan
--    configurado QUEDAN en la tabla — la columna sigue existiendo. Lo que se
--    pierde es la PUERTA para volver a tocarlos, así que la configuración
--    queda congelada en lo último que se guardó. *Revertir esto no borra
--    datos: los deja sin quien los edite.*
-- ⚠️ Y la firma vuelve a 8 argumentos: todo caller que ya mande los dos
--    nuevos empieza a fallar por aridad. Se revierte junto con el bundle.

BEGIN;

CREATE OR REPLACE FUNCTION public.definir_turno_entrega(p_cuenta_comercial_id uuid, p_codigo text, p_corte time without time zone, p_entrega_desde time without time zone, p_entrega_hasta time without time zone, p_dia_offset integer DEFAULT 0, p_orden integer DEFAULT 1, p_zona_horaria text DEFAULT 'America/Guayaquil'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_id uuid;
BEGIN
  IF NOT es_vendedor_de(p_cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  INSERT INTO entrega_turnos (cuenta_comercial_id, codigo, corte, entrega_desde,
                              entrega_hasta, dia_offset, orden, zona_horaria)
    VALUES (p_cuenta_comercial_id, p_codigo, p_corte, p_entrega_desde,
            p_entrega_hasta, p_dia_offset, p_orden, p_zona_horaria)
  ON CONFLICT (cuenta_comercial_id, codigo)
    DO UPDATE SET corte = EXCLUDED.corte, entrega_desde = EXCLUDED.entrega_desde,
                  entrega_hasta = EXCLUDED.entrega_hasta, dia_offset = EXCLUDED.dia_offset,
                  orden = EXCLUDED.orden, zona_horaria = EXCLUDED.zona_horaria,
                  activo = true
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'turno_id', v_id);
END $function$
;

COMMIT;
