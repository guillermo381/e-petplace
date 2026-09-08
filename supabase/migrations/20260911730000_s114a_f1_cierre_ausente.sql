-- S114-A · F1 — LA REGLA DEL CIERRE AUSENTE (la firma que sostiene la clase 1)
-- ═══════════════════════════════════════════════════════════════════════════
-- Firmada desde el arranque del arco, sin motor. E la tenía en naranja con el
-- bloqueante nombrado: `no_ejecutado` EXISTÍA sólo como MOTIVO en
-- cat_motivos_postventa, así que un grep concluía «construido» y no lo estaba.
--
-- ① no_ejecutado pasa a ser un ESTADO donde vive un estado —CHECK o catálogo—:
--    · cita   → nuevo valor del CHECK de `estado` (distinto de `no_show`: no_show
--               lo marca el prestador y DEVENGA; no_ejecutado es nadie-marcó y NO
--               devenga)
--    · estadía → nuevo estado terminal en cat_guarderia_estados
--    · pedido  → nuevo estado en cat_estados_pedido
--    + motivo `no_ejecutado`/estadia (cita ya lo tiene; pedido usa `no_entregado`)
--    + tipo de aviso `servicio_sin_cerrar` (al prestador, a las 24 h)
--
-- ② el reloj: a las 24 h de la hora de fin declarada, aviso al prestador; a las
--    48 h sin cierre, el objeto queda no_ejecutado (no devenga) y DISPARA la
--    clase 1 — irreversible por el prestador (si aparece diciendo que sí lo hizo,
--    es un caso de clase 2 suyo, no un UPDATE).
--
-- 🔴 GAP QUE F1 CIERRA (⑤): la rama clase-1 de `abrir_caso` auto-resolvía SIN
--    poner monto_devuelto ⇒ la familia nunca veía la carta de destino. F1 pone
--    el monto (= lo que la familia pagó) por un helper único que usan tanto la
--    apertura por familia como el reloj.
--
-- ALCANCE de este lote: el reloj cubre CITA y ESTADÍA (los dos casos claros de
-- «cierre ausente»). El ESTADO no_ejecutado se agrega también a PEDIDO (aditivo,
-- lo deja listo), pero su brazo del reloj queda DECLARADO: pedido tiene 30
-- estados y su propio flujo de entrega_fallida/devuelto — cuál cuenta como
-- «no ejecutado» sin pisar ese flujo es decisión de la pista de despensa.
--
-- Reversa: docs/relevamientos/2026-09-07-s114a-REVERSA-f1-cierre-ausente.sql
-- 76(g): NO RIGE — DDL + catálogos aditivos, sin backfill de negocio.

BEGIN;

-- ═══ ① EL ESTADO no_ejecutado ══════════════════════════════════════════════
ALTER TABLE evento_cita_servicio DROP CONSTRAINT evento_cita_servicio_estado_check;
ALTER TABLE evento_cita_servicio ADD CONSTRAINT evento_cita_servicio_estado_check
  CHECK (estado = ANY (ARRAY['pendiente','confirmada','en_curso','completada',
    'cancelada','no_show','rechazada','no_realizable','no_ejecutado']));

INSERT INTO cat_guarderia_estados (estado, es_terminal, orden, escritor)
  VALUES ('no_ejecutado', true, 99, 'reloj') ON CONFLICT (estado) DO NOTHING;

INSERT INTO cat_estados_pedido (codigo, nombre, es_terminal, orden, activo, narrativa, visible_familia, exige_motivo)
  VALUES ('no_ejecutado','No ejecutado', true, 99, true, 'no_llego', false, false)
  ON CONFLICT (codigo) DO NOTHING;

INSERT INTO cat_motivos_postventa (codigo, objeto, clase, urgente, voz, pide_foto, activo)
  VALUES ('no_ejecutado','estadia',1,false,'No lo cuidaron / no me lo devolvieron',false,true)
  ON CONFLICT (codigo, objeto) DO NOTHING;

INSERT INTO cat_notificacion_tipos (codigo, categoria, descripcion, en_sombra, activo, audiencia, ignora_techo, plantilla_idioma)
  VALUES ('servicio_sin_cerrar','operacion',
    'El servicio no se cerró; marcá el cierre antes de que quede sin ejecutar.',
    true, true, 'prestador', false, 'es')
  ON CONFLICT (codigo) DO NOTHING;

-- ═══ HELPER · la plata del objeto (refund completo del no_ejecutado) ════════
CREATE OR REPLACE FUNCTION public._pago_del_objeto(p_tipo text, p_id uuid)
 RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_c record; v_sus record; v_dias int; v_monto numeric;
BEGIN
  IF p_tipo = 'cita' THEN
    SELECT precio INTO v_monto FROM evento_cita_servicio WHERE id = p_id;
    RETURN COALESCE(v_monto, 0);
  ELSIF p_tipo = 'estadia' THEN
    SELECT c.precio, c.metadata INTO v_c
      FROM guarderia_estadias e JOIN evento_cita_servicio c ON c.id = e.cita_id
     WHERE e.id = p_id;
    -- mensualidad: el día vale su reparto (mismo criterio que _devengar_estadia)
    IF v_c.metadata->>'origen' = 'mensualidad' AND (v_c.metadata->>'suscripcion_id') IS NOT NULL THEN
      SELECT precio_mensual, periodo_desde, periodo_hasta INTO v_sus
        FROM guarderia_suscripciones WHERE id = (v_c.metadata->>'suscripcion_id')::uuid;
      IF v_sus.precio_mensual IS NULL THEN RETURN 0; END IF;
      SELECT count(*) INTO v_dias FROM guarderia_estadias e2
        JOIN evento_cita_servicio c2 ON c2.id = e2.cita_id
       WHERE c2.metadata->>'suscripcion_id' = v_c.metadata->>'suscripcion_id'
         AND c2.fecha >= v_sus.periodo_desde AND c2.fecha <= v_sus.periodo_hasta;
      IF v_dias IS NULL OR v_dias < 1 THEN v_dias := 1; END IF;
      RETURN ROUND(v_sus.precio_mensual / v_dias, 2);
    END IF;
    RETURN COALESCE(v_c.precio, 0);   -- día suelto o paquete
  ELSIF p_tipo = 'pedido' THEN
    SELECT total INTO v_monto FROM pedidos WHERE id = p_id;
    RETURN COALESCE(v_monto, 0);
  END IF;
  RETURN 0;
END $fn$;

-- ═══ HELPER · resolver un caso clase-1 a favor de la familia ════════════════
-- Pone monto (= lo que pagó) y camino (con/sin devengo AL OBJETO), y mueve a
-- resuelto. Sin sesión: lo usa la apertura por familia (con actor) y el reloj
-- (actor NULL). Un no_ejecutado nunca tiene devengo ⇒ camino declarado_sobre_pago.
CREATE OR REPLACE FUNCTION public._resolver_caso_clase1(p_caso_id uuid, p_actor uuid DEFAULT NULL)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_c record; v_monto numeric; v_evento uuid; v_camino text; v_inverso uuid;
BEGIN
  SELECT * INTO v_c FROM casos_postventa WHERE id = p_caso_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  v_monto  := _pago_del_objeto(v_c.objeto_tipo, v_c.objeto_id);
  v_evento := _caso_tiene_devengo(v_c.objeto_tipo, v_c.objeto_id);
  IF v_evento IS NOT NULL THEN
    v_inverso := aplicar_reembolso(v_evento, 'caso clase 1 ' || p_caso_id::text, p_actor, NULL);
    v_camino  := 'aplicar_reembolso';
  ELSE
    v_camino  := 'declarado_sobre_pago';
  END IF;
  UPDATE casos_postventa
     SET resolucion_alcance = 'total', monto_devuelto = COALESCE(v_monto, 0),
         camino = v_camino, evento_reembolso_id = v_inverso,
         resuelto_en = now(), actualizado_en = now()
   WHERE id = p_caso_id;
  PERFORM _caso_mover(p_caso_id, 'resuelto', 'sistema', p_actor, NULL);
END $fn$;

-- ═══ abrir_caso · la rama clase-1 ahora PONE EL MONTO (usa el helper) ═══════
CREATE OR REPLACE FUNCTION public.abrir_caso(p_objeto_tipo text, p_objeto_id uuid, p_motivo text, p_relato text DEFAULT NULL::text, p_procedencia text DEFAULT 'familia'::text, p_modo text DEFAULT NULL::text, p_confirmado_por uuid DEFAULT NULL::uuid, p_resumen_confirmado text DEFAULT NULL::text, p_foto_url text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
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

  IF v_o.mascota_id IS NOT NULL AND EXISTS (
       SELECT 1 FROM mascotas m WHERE m.id = v_o.mascota_id AND m.estado_vida = 'memorial') THEN
    RETURN jsonb_build_object('ok',false,'codigo','mascota_en_memorial');
  END IF;

  IF v_o.cerrado_en IS NOT NULL
     AND v_o.cerrado_en < now() - (caso_ventana_dias() || ' days')::interval THEN
    RETURN jsonb_build_object('ok',false,'codigo','fuera_de_ventana',
      'cerrado_en', v_o.cerrado_en, 'dias', caso_ventana_dias());
  END IF;

  IF NOT _motivo_pertenece_al_objeto(p_motivo, p_objeto_tipo) THEN
    RETURN jsonb_build_object('ok',false,'codigo','motivo_no_pertenece',
      'motivo', p_motivo, 'objeto', p_objeto_tipo);
  END IF;

  SELECT id INTO v_existe FROM casos_postventa
   WHERE objeto_tipo = p_objeto_tipo AND objeto_id = p_objeto_id
     AND etapa NOT IN ('cerrado','retirado','sin_lugar','resuelto_entre_partes');
  IF v_existe IS NOT NULL THEN
    RETURN jsonb_build_object('ok',false,'codigo','caso_ya_abierto','caso_id',v_existe);
  END IF;

  SELECT clase, urgente INTO v_m FROM v_motivos_resueltos
   WHERE objeto_resuelto = p_objeto_tipo AND codigo = p_motivo LIMIT 1;

  IF v_m.clase = 1 THEN v_etapa := 'recibido'; v_plazo := NULL;
  ELSIF v_m.clase = 3 THEN v_etapa := 'recibido'; v_plazo := NULL;
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

  INSERT INTO caso_mensajes (caso_id, autor, tipo, cuerpo)
  VALUES (v_caso, 'casa', 'hecho', 'Recibimos tu caso.');

  IF v_m.clase = 1 THEN
    -- 🔴 F1 ⑤: la clase 1 se resuelve a favor de la familia CON su monto puesto,
    --    para que la carta de destino aparezca. Antes sólo movía a resuelto.
    PERFORM _resolver_caso_clase1(v_caso, v_yo);
  ELSIF v_m.clase = 3 THEN
    PERFORM _caso_mover(v_caso, 'con_casa', 'sistema', NULL, NULL);
  ELSE
    PERFORM _caso_mover(v_caso, 'con_prestador', 'sistema', NULL, NULL);
  END IF;

  RETURN jsonb_build_object('ok', true, 'caso_id', v_caso,
    'etapa', (SELECT etapa FROM casos_postventa WHERE id = v_caso),
    'clase_resuelta', v_m.clase, 'urgente', v_m.urgente);
END $function$;

-- ═══ EL SISTEMA ABRE EL CASO no_ejecutado (sin sesión, lo llama el reloj) ════
CREATE OR REPLACE FUNCTION public._abrir_caso_no_ejecutado(p_tipo text, p_id uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_o record; v_motivo text; v_clase int; v_caso uuid; v_existe uuid;
BEGIN
  SELECT * INTO v_o FROM _caso_dueno_del_objeto(p_tipo, p_id);
  IF v_o.familia_user_id IS NULL THEN RETURN NULL; END IF;
  IF v_o.mascota_id IS NOT NULL AND EXISTS (
       SELECT 1 FROM mascotas m WHERE m.id = v_o.mascota_id AND m.estado_vida = 'memorial') THEN
    RETURN NULL;   -- memorial: no se abre caso (mismo criterio que abrir_caso)
  END IF;
  -- idempotente: si el objeto ya tiene un caso, no se duplica
  SELECT id INTO v_existe FROM casos_postventa WHERE objeto_tipo=p_tipo AND objeto_id=p_id;
  IF v_existe IS NOT NULL THEN RETURN v_existe; END IF;

  v_motivo := CASE p_tipo WHEN 'pedido' THEN 'no_entregado' ELSE 'no_ejecutado' END;
  SELECT clase INTO v_clase FROM v_motivos_resueltos
   WHERE objeto_resuelto = p_tipo AND codigo = v_motivo LIMIT 1;

  INSERT INTO casos_postventa (objeto_tipo, objeto_id, motivo_codigo, clase,
      familia_user_id, prestador_id, cuenta_comercial_id, etapa, procedencia)
  VALUES (p_tipo, p_id, v_motivo, COALESCE(v_clase, 1),
      v_o.familia_user_id, v_o.prestador_id, v_o.cuenta_comercial_id, 'recibido', 'sistema')
  RETURNING id INTO v_caso;

  INSERT INTO caso_mensajes (caso_id, autor, tipo, cuerpo)
  VALUES (v_caso, 'casa', 'hecho', 'El servicio no se cerró a tiempo. Abrimos tu caso.');

  PERFORM _resolver_caso_clase1(v_caso, NULL);   -- monto = lo pagado, camino declarado
  RETURN v_caso;
END $fn$;

-- ═══ ② EL RELOJ ═════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.expirar_objetos_sin_cierre()
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_avisos int := 0; v_noej int := 0; r record; v_fin timestamptz;
BEGIN
  -- ── CITA · fin = fecha + hora + duración (hora local Guayaquil) ──
  FOR r IN
    SELECT c.id, pr.user_id AS prest_user, c.mascota_id,
      ((c.fecha::timestamp + c.hora) AT TIME ZONE 'America/Guayaquil')
        + (COALESCE(c.duracion_minutos,60)||' minutes')::interval AS fin
    FROM evento_cita_servicio c JOIN prestadores pr ON pr.id = c.prestador_id
    WHERE c.estado IN ('confirmada','en_curso') AND c.estado_reserva = 'pagada'
  LOOP
    IF now() >= r.fin + interval '48 hours' THEN
      UPDATE evento_cita_servicio SET estado = 'no_ejecutado' WHERE id = r.id;
      PERFORM _abrir_caso_no_ejecutado('cita', r.id);
      v_noej := v_noej + 1;
    ELSIF now() >= r.fin + interval '24 hours' THEN
      PERFORM registrar_intencion_notificacion('servicio_sin_cerrar', r.prest_user,
        r.mascota_id, NULL, jsonb_build_object('objeto_tipo','cita','objeto_id',r.id),
        'sin_cerrar:cita:'||r.id::text);
      v_avisos := v_avisos + 1;
    END IF;
  END LOOP;

  -- ── ESTADÍA · fin = fin del día de la estadía (Guayaquil) ──
  FOR r IN
    SELECT e.id, pr.user_id AS prest_user, c.mascota_id,
      ((c.fecha + interval '1 day')::timestamp AT TIME ZONE 'America/Guayaquil') AS fin
    FROM guarderia_estadias e
    JOIN evento_cita_servicio c ON c.id = e.cita_id
    JOIN prestadores pr ON pr.id = c.prestador_id
    WHERE e.estado NOT IN ('entregada','no_recogida','cancelada','no_ejecutado')
      AND c.estado_reserva = 'pagada'
  LOOP
    IF now() >= r.fin + interval '48 hours' THEN
      UPDATE guarderia_estadias SET estado = 'no_ejecutado', updated_at = now() WHERE id = r.id;
      PERFORM _abrir_caso_no_ejecutado('estadia', r.id);
      v_noej := v_noej + 1;
    ELSIF now() >= r.fin + interval '24 hours' THEN
      PERFORM registrar_intencion_notificacion('servicio_sin_cerrar', r.prest_user,
        r.mascota_id, NULL, jsonb_build_object('objeto_tipo','estadia','objeto_id',r.id),
        'sin_cerrar:estadia:'||r.id::text);
      v_avisos := v_avisos + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('avisos', v_avisos, 'no_ejecutadas', v_noej, 'corrido_en', now());
END $fn$;

-- L-140: sin anon/PUBLIC en las funciones nuevas
REVOKE ALL ON FUNCTION public._pago_del_objeto(text,uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public._resolver_caso_clase1(uuid,uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public._abrir_caso_no_ejecutado(text,uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.expirar_objetos_sin_cierre() FROM anon, PUBLIC;

-- ═══ EL CRON — cada hora ════════════════════════════════════════════════════
SELECT cron.schedule('expirar-objetos-sin-cierre', '0 * * * *',
  $$SELECT public.expirar_objetos_sin_cierre()$$);

COMMIT;
