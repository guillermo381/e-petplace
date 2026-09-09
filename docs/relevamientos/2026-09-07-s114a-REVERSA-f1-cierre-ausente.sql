-- REVERSA de 20260911730000_s114a_f1_cierre_ausente.sql
-- Restaura abrir_caso, quita el cron, dropea los helpers y quita el estado no_ejecutado.
-- ⚠️ NO revierte objetos ya marcados no_ejecutado ni casos abiertos por el reloj (si los hubiera).
BEGIN;
SELECT cron.unschedule('expirar-objetos-sin-cierre');
DROP FUNCTION IF EXISTS expirar_objetos_sin_cierre();
DROP FUNCTION IF EXISTS _abrir_caso_no_ejecutado(text,uuid);
DROP FUNCTION IF EXISTS _resolver_caso_clase1(uuid,uuid);
DROP FUNCTION IF EXISTS _pago_del_objeto(text,uuid);
-- restaurar abrir_caso al cuerpo previo:
CREATE OR REPLACE FUNCTION public.abrir_caso(p_objeto_tipo text, p_objeto_id uuid, p_motivo text, p_relato text DEFAULT NULL::text, p_procedencia text DEFAULT 'familia'::text, p_modo text DEFAULT NULL::text, p_confirmado_por uuid DEFAULT NULL::uuid, p_resumen_confirmado text DEFAULT NULL::text, p_foto_url text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_yo uuid := auth.uid(); v_o record; v_m record; v_caso uuid; v_existe uuid;
  v_etapa text; v_plazo timestamptz;
BEGIN
  IF v_yo IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_sesion'); END IF;

  SELECT * INTO v_o FROM _caso_dueno_del_objeto(p_objeto_tipo, p_objeto_id);
  IF v_o.familia_user_id IS NULL THEN
    RETURN jsonb_build_object('ok',false,'codigo','objeto_no_existe');
  END IF;
  IF v_o.familia_user_id <> v_yo THEN
    RETURN jsonb_build_object('ok',false,'codigo','objeto_no_es_tuyo');
  END IF;

  -- 🔴 MEMORIAL. C ya lo frena en la pantalla y lo pidió igual acá, con razón:
  -- el guard de la pantalla protege a quien mira, no a quien llama.
  IF v_o.mascota_id IS NOT NULL AND EXISTS (
       SELECT 1 FROM mascotas m WHERE m.id = v_o.mascota_id AND m.estado_vida = 'memorial') THEN
    RETURN jsonb_build_object('ok',false,'codigo','mascota_en_memorial');
  END IF;

  -- LA VENTANA (§5 · F7), exigida en el motor y con el MISMO número que la app.
  IF v_o.cerrado_en IS NOT NULL
     AND v_o.cerrado_en < now() - (caso_ventana_dias() || ' days')::interval THEN
    RETURN jsonb_build_object('ok',false,'codigo','fuera_de_ventana',
      'cerrado_en', v_o.cerrado_en, 'dias', caso_ventana_dias());
  END IF;

  -- 🔴 EL MOTIVO PERTENECE AL CONJUNTO RESUELTO (A10), no coincide con la columna.
  IF NOT _motivo_pertenece_al_objeto(p_motivo, p_objeto_tipo) THEN
    RETURN jsonb_build_object('ok',false,'codigo','motivo_no_pertenece',
      'motivo', p_motivo, 'objeto', p_objeto_tipo);
  END IF;

  -- 🔴 YA HAY UNO: se devuelve SU ID (L-424). Un guard que sólo sabe negarse
  -- manda a «probá de nuevo» sobre algo que va a fallar siempre.
  SELECT id INTO v_existe FROM casos_postventa
   WHERE objeto_tipo = p_objeto_tipo AND objeto_id = p_objeto_id
     AND etapa NOT IN ('cerrado','retirado','sin_lugar','resuelto_entre_partes');
  IF v_existe IS NOT NULL THEN
    RETURN jsonb_build_object('ok',false,'codigo','caso_ya_abierto','caso_id',v_existe);
  END IF;

  -- LA CLASE VIENE DE LA FILA (§4). El cliente no la manda y no puede.
  SELECT clase, urgente INTO v_m FROM v_motivos_resueltos
   WHERE objeto_resuelto = p_objeto_tipo AND codigo = p_motivo LIMIT 1;

  -- La etapa inicial y el plazo salen de la clase, no de un parámetro.
  IF v_m.clase = 1 THEN v_etapa := 'recibido'; v_plazo := NULL;
  ELSIF v_m.clase = 3 THEN v_etapa := 'recibido'; v_plazo := NULL;   -- «sin plazo, es ahora»
  ELSE v_etapa := 'recibido'; v_plazo := now() + interval '24 hours';
  END IF;

  INSERT INTO casos_postventa (objeto_tipo, objeto_id, motivo_codigo, clase,
      familia_user_id, prestador_id, cuenta_comercial_id, etapa, plazo_prestador_hasta,
      relato, resumen_confirmado, procedencia, modo, confirmado_por, foto_url)
  VALUES (p_objeto_tipo, p_objeto_id, p_motivo, v_m.clase,
      v_yo, v_o.prestador_id, v_o.cuenta_comercial_id, v_etapa, v_plazo,
      p_relato, p_resumen_confirmado, COALESCE(p_procedencia,'familia'), p_modo,
      p_confirmado_por, p_foto_url)
  RETURNING id INTO v_caso;

  -- §3.3: «el primer mensaje lo escribe la casa cuando abro el caso. No hay
  -- hilo vacío.» Por eso lo escribe ESTA función y no la pantalla.
  INSERT INTO caso_mensajes (caso_id, autor, tipo, cuerpo)
  VALUES (v_caso, 'casa', 'hecho', 'Recibimos tu caso.');

  -- El ruteo por clase (§5), por la puerta y con actor `sistema`.
  IF v_m.clase = 1 THEN
    PERFORM _caso_mover(v_caso, 'resuelto', 'sistema', NULL);
    UPDATE casos_postventa SET resuelto_en = now() WHERE id = v_caso;
  ELSIF v_m.clase = 3 THEN
    PERFORM _caso_mover(v_caso, 'con_casa', 'sistema', NULL);
  ELSE
    PERFORM _caso_mover(v_caso, 'con_prestador', 'sistema', NULL);
  END IF;

  RETURN jsonb_build_object('ok', true, 'caso_id', v_caso,
    'etapa', (SELECT etapa FROM casos_postventa WHERE id = v_caso),
    'clase_resuelta', v_m.clase, 'urgente', v_m.urgente);
END $function$
;
DELETE FROM cat_notificacion_tipos WHERE codigo='servicio_sin_cerrar';
DELETE FROM cat_motivos_postventa WHERE codigo='no_ejecutado' AND objeto='estadia';
DELETE FROM cat_estados_pedido WHERE codigo='no_ejecutado';
DELETE FROM cat_guarderia_estados WHERE estado='no_ejecutado';
ALTER TABLE evento_cita_servicio DROP CONSTRAINT evento_cita_servicio_estado_check;
ALTER TABLE evento_cita_servicio ADD CONSTRAINT evento_cita_servicio_estado_check CHECK (estado = ANY (ARRAY['pendiente','confirmada','en_curso','completada','cancelada','no_show','rechazada','no_realizable']));
COMMIT;
