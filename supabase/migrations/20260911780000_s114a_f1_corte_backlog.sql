-- S114-A · F1 · el reloj arranca con CORTE — no procesa el backlog de construcción
-- Decisión de mesa (founder, 7-sep-2026): los 107 citas + 18 estadías con fin
-- ANTERIOR al corte son ruido de construcción, no incumplimientos —ningún dato
-- de servicio es real, producción es octubre— y procesarlos crearía 125 casos y
-- 125 devoluciones que ensuciarían todos los números que E dejó limpios (casos
-- por objeto, tiempo a resolución, plata devuelta por causa).
--
-- El corte vive como DATO (app_config), no como literal en el código, para que
-- en octubre se pueda ver contra qué se cortó. La LETRA lo documenta (§2).
-- El reloj sólo mira objetos cuyo fin declarado es >= el corte.
-- 76(g): NO RIGE — config + función, sin backfill.
BEGIN;

INSERT INTO app_config (clave, valor, tipo, descripcion, categoria, es_publico)
VALUES ('f1_corte_cierre_ausente', '2026-09-07', 'texto',
  'F1 · el reloj del cierre ausente sólo expira objetos cuyo fin sea >= esta fecha. Los anteriores son ruido de construcción (decisión de mesa 7-sep-2026).',
  'general', false)
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = now();

CREATE OR REPLACE FUNCTION public.expirar_objetos_sin_cierre()
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_avisos int := 0; v_noej int := 0; v_saltados int := 0; r record; v_corte date;
BEGIN
  SELECT valor::date INTO v_corte FROM app_config WHERE clave = 'f1_corte_cierre_ausente';
  -- Sin corte configurado NO se corre a ciegas sobre todo: se sale diciendo por qué.
  IF v_corte IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_corte_configurado');
  END IF;

  -- ── CITA · fin = fecha + hora + duración (hora local Guayaquil) ──
  FOR r IN
    SELECT c.id, pr.user_id AS prest_user, c.mascota_id,
      ((c.fecha::timestamp + c.hora) AT TIME ZONE 'America/Guayaquil')
        + (COALESCE(c.duracion_minutos,60)||' minutes')::interval AS fin
    FROM evento_cita_servicio c JOIN prestadores pr ON pr.id = c.prestador_id
    WHERE c.estado IN ('confirmada','en_curso') AND c.estado_reserva = 'pagada'
  LOOP
    IF r.fin::date < v_corte THEN v_saltados := v_saltados + 1; CONTINUE; END IF;  -- backlog: fuera
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
    IF r.fin::date < v_corte THEN v_saltados := v_saltados + 1; CONTINUE; END IF;  -- backlog: fuera
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

  RETURN jsonb_build_object('ok', true, 'corte', v_corte, 'avisos', v_avisos,
    'no_ejecutadas', v_noej, 'saltados_por_corte', v_saltados, 'corrido_en', now());
END $fn$;

-- EL RELOJ, ahora con corte, cada hora
SELECT cron.schedule('expirar-objetos-sin-cierre', '0 * * * *',
  $$SELECT public.expirar_objetos_sin_cierre()$$);

COMMIT;
