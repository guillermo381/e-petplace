-- S114-A · R80 · LAS TRES VOCES DEL MOTOR, DE VOSEO A TUTEO.
--
-- R80 (regla de B, sobre el hallazgo de C) cazó tres cadenas en voseo que
-- salen de migraciones S114-A y LE LLEGAN A UNA FAMILIA. La casa firmó TUTEO
-- NEUTRO en S51, y la voz de una función del motor se lee igual que la de una
-- pantalla: no hay motor-interno acá, las tres son voz de producto.
--
-- Una migración aplicada NO se edita ⇒ la cura va en esta migración nueva. Las
-- tres migraciones de origen conservan su voseo histórico (no se pueden tocar):
-- entran a la lápida de R80 (`MIGRACIONES_CON_VOSEO`, en la rama de B) para que
-- R80 quede verde y una migración NUEVA con voseo siga saliendo roja. Las
-- entradas de lápida se le pasaron a B por buzón — no se cruza territorio.
--
-- Reemplazo literal servido por C (`docs/loop/buzon/S114-C-para-A-...`):
--   contame → cuéntame · para vos → para ti · marcá → marca
--
-- 76(g) NO RIGE: no toca anclas de OTA (es DB); no hay backfill de escritura de
-- negocio. Reversa escrita ANTES en docs/relevamientos/2026-09-08-s114a-REVERSA-*.

-- ① cat_motivos_postventa · el «Otro» que invita a contar (§4).
UPDATE cat_motivos_postventa
   SET voz = 'Es otra cosa · cuéntame'
 WHERE codigo = 'otra_cosa' AND objeto = 'todos';

-- ② cat_notificacion_tipos · el aviso del servicio sin cerrar (F1).
UPDATE cat_notificacion_tipos
   SET descripcion = 'El servicio no se cerró; marca el cierre antes de que quede sin ejecutar.'
 WHERE codigo = 'servicio_sin_cerrar';

-- ③ caso_resolver · el mensaje al cerrar un caso con devolución. CREATE OR
--    REPLACE con el cuerpo VIVO (traído con pg_get_functiondef), un solo literal
--    cambiado: «para vos» → «para ti».
CREATE OR REPLACE FUNCTION public.caso_resolver(p_caso_id uuid, p_alcance text, p_monto numeric DEFAULT NULL::numeric, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_yo uuid := auth.uid(); v_c record; v_evento uuid; v_camino text;
  v_inverso uuid; v_mov jsonb; v_actor text;
BEGIN
  IF v_yo IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_sesion'); END IF;
  SELECT * INTO v_c FROM casos_postventa WHERE id = p_caso_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'codigo','caso_no_existe'); END IF;

  IF is_admin() THEN v_actor := 'casa';
  ELSIF v_c.prestador_id IS NOT NULL AND es_mi_prestador(v_c.prestador_id) THEN v_actor := 'prestador';
  ELSE RETURN jsonb_build_object('ok',false,'codigo','no_podes_resolver');
  END IF;

  IF p_alcance NOT IN ('total','parcial','sin_devolucion') THEN
    RETURN jsonb_build_object('ok',false,'codigo','alcance_invalido');
  END IF;
  IF p_alcance = 'parcial' AND (p_monto IS NULL OR p_monto <= 0) THEN
    RETURN jsonb_build_object('ok',false,'codigo','monto_requerido_en_parcial');
  END IF;

  -- 🔴🔴 LA PREGUNTA DE §6, AL OBJETO Y NO A LA CLASE.
  v_evento := _caso_tiene_devengo(v_c.objeto_tipo, v_c.objeto_id);

  IF p_alcance = 'sin_devolucion' THEN
    v_camino := NULL;
  ELSIF v_evento IS NOT NULL THEN
    -- TIENE DEVENGO ⇒ evento inverso. F4: la comisión se devuelve también —
    -- `aplicar_reembolso` ya reversa `monto_plataforma` proporcionalmente, así
    -- que la firma NO pide fórmula nueva: pide que la letra diga lo que el
    -- código hace, y que esto lo use en vez de escribir la suya.
    v_inverso := aplicar_reembolso(v_evento,
                   COALESCE(p_motivo, 'caso de postventa ' || p_caso_id::text),
                   v_yo,
                   CASE WHEN p_alcance = 'parcial' THEN p_monto ELSE NULL END);
    v_camino := 'aplicar_reembolso';
  ELSE
    -- SIN DEVENGO ⇒ se declara sobre el pago (7.14/7.16). `aplicar_reembolso`
    -- no se toca: no hay nada que reversar en el ledger.
    v_camino := 'declarado_sobre_pago';
  END IF;

  UPDATE casos_postventa
     SET resolucion_alcance = p_alcance,
         monto_devuelto = CASE WHEN p_alcance='sin_devolucion' THEN 0 ELSE p_monto END,
         camino = v_camino, evento_reembolso_id = v_inverso,
         decidido_por = v_yo, resuelto_en = now(), actualizado_en = now()
   WHERE id = p_caso_id;

  v_mov := _caso_mover(p_caso_id,
             CASE WHEN v_actor='prestador' THEN 'resuelto_entre_partes' ELSE 'resuelto' END,
             v_actor, v_yo, p_motivo);
  IF (v_mov->>'ok')::boolean IS NOT TRUE THEN RETURN v_mov; END IF;

  INSERT INTO caso_mensajes (caso_id, autor, autor_user_id, tipo, cuerpo)
  VALUES (p_caso_id, CASE WHEN v_actor='casa' THEN 'casa' ELSE 'prestador' END, v_yo, 'hecho',
          CASE WHEN p_alcance='sin_devolucion' THEN 'Se resolvió el caso.'
               ELSE 'Se resolvió: hay una devolución para ti.' END);

  RETURN jsonb_build_object('ok', true, 'camino', v_camino,
    'evento_reembolso_id', v_inverso, 'tenia_devengo', (v_evento IS NOT NULL),
    'etapa', (SELECT etapa FROM casos_postventa WHERE id = p_caso_id));
END $function$;
