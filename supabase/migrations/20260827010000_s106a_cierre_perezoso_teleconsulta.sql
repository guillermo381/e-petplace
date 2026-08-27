-- ============================================================================
-- S106-A tanda 3 · LA TELECONSULTA SE CIERRA SOLA — PEREZOSO, NO CRON
--
-- Firma de la mesa sobre la forma que propuso C, con su razón:
--
-- > *«Una regla de tiempo que depende de que alguien esté mirando no es una
-- > regla, es una coincidencia.»*
--
-- ⇒ El cierre **no vive en un temporizador de la pantalla**. Vive en la base y
-- se resuelve **cuando alguien pregunta** — el mismo patrón del hold. **Vale
-- con las dos apps cerradas**, que es el caso que lo motivó: si los dos cuelgan
-- y cierran todo, la consulta igual queda finalizada.
--
-- ── 🔴 SÓLO CIERRA LO QUE OCURRIÓ. NUNCA MARCA UN NO-SHOW ──────────────────
-- Cierra a `completada` **únicamente si hay evidencia de que la consulta pasó**:
-- hechos de sala (`videollamada_hechos`) **o** historia clínica sedimentada.
-- Si no hay evidencia, **NO TOCA LA CITA.**
--
-- > *Cerrar como «completada» una consulta a la que nadie entró afirmaría que
-- > ocurrió — y, peor, **le consumiría a la familia el derecho a la
-- > devolución**, que es plata y está firmada en `LETRA_TELEMEDICINA`.*
--
-- El camino del que no ocurre ya existe y es **de un humano**:
-- `marcar_teleconsulta_no_realizable`, con su devolución. *Un cierre automático
-- que decide sobre plata no es higiene: es una decisión, y no le toca a un
-- lector tomarla.*
--
-- ── ⚠️ EL LÍMITE DEL PEREZOSO, DECLARADO Y NO ESCONDIDO ────────────────────
-- Una cita **que nadie mire nunca** se queda `confirmada` en la tabla. Cualquier
-- lector que vaya **directo a la tabla** —sin pasar por una puerta que llame a
-- este cierre— ve estado viejo.
--
-- *Es el mismo límite que tiene el hold desde S54, y se acepta por la misma
-- razón: quien necesita la verdad, pregunta.* Se escribe acá para que el día
-- que aparezca un lector que no pregunte, se sepa qué mirar.
--
-- ── POR QUÉ `puede_entrar_a_videollamada` PASA A VOLATILE ──────────────────
-- Era `STABLE` y **una función STABLE no puede escribir**. Es la puerta que la
-- pantalla consulta de verdad, así que es donde «alguien pregunta» ocurre.
-- *Volverla VOLATILE no cambia lo que responde: le quita al planner el derecho
-- a cachear la respuesta dentro de una sentencia, que es justo lo que hay que
-- quitarle cuando la respuesta puede cambiar por su propio efecto.*
--
-- ── VEDA 76(g): NO RIGE. Función nueva + REPLACE de otra. Cero DDL de tablas,
--    cero backfill. **Puede escribir `estado` en citas vencidas CON evidencia**
--    — declarado acá porque es escritura, aunque no sea backfill.
-- ── REVERSA: docs/relevamientos/2026-08-27-s106a-REVERSA-cierre-perezoso.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public._cerrar_teleconsulta_si_vencio(p_cita_id uuid)
RETURNS void
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  k_gracia constant interval := interval '10 minutes';
  v_c      record;
  v_fin    timestamp;
  v_ocurrio boolean;
BEGIN
  SELECT c.id, c.fecha, c.hora, c.duracion_minutos, c.estado, c.modalidad
    INTO v_c
  FROM evento_cita_servicio c WHERE c.id = p_cita_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_c.modalidad IS DISTINCT FROM 'telemedicina' THEN RETURN; END IF;
  /* Sólo lo que todavía está vivo. Cancelada, no_realizable, completada y
     no_show ya tienen dueño y no se pisan. */
  IF v_c.estado NOT IN ('confirmada', 'en_curso') THEN RETURN; END IF;

  /* El fin de la ventana + la gracia. Hora de Guayaquil, igual que la puerta
     de entrada: **dos husos sobre la misma cita la corren cinco horas.** */
  v_fin := (v_c.fecha + v_c.hora)
         + make_interval(mins => COALESCE(v_c.duracion_minutos, 20))
         + k_gracia;

  IF (now() AT TIME ZONE 'America/Guayaquil') <= v_fin THEN RETURN; END IF;

  /* 🔴 LA EVIDENCIA. Sin esto no se cierra — ver la cabecera. */
  SELECT EXISTS (SELECT 1 FROM videollamada_hechos vh WHERE vh.cita_id = v_c.id)
      OR EXISTS (SELECT 1 FROM evento_historia_clinica_registrada h WHERE h.cita_id = v_c.id)
    INTO v_ocurrio;

  IF NOT v_ocurrio THEN RETURN; END IF;

  UPDATE evento_cita_servicio
  SET estado = 'completada',
      metadata = COALESCE(metadata, '{}'::jsonb)
               || jsonb_build_object('cerrada_por', 'cierre_perezoso_teleconsulta',
                                     'cerrada_en', now()),
      updated_at = now()
  WHERE id = v_c.id AND estado IN ('confirmada', 'en_curso');
END;
$function$;

COMMENT ON FUNCTION public._cerrar_teleconsulta_si_vencio(uuid) IS
  'S106 · Cierre PEREZOSO de teleconsulta: cuando alguien pregunta y ya pasaron '
  '10 min del fin. SOLO si hay evidencia de que ocurrio (hechos de sala o historia '
  'clinica). JAMAS marca no_show: eso toca plata y es decision de un humano.';

REVOKE EXECUTE ON FUNCTION public._cerrar_teleconsulta_si_vencio(uuid) FROM PUBLIC, anon, authenticated;

-- ── LA PUERTA: pasa a VOLATILE y llama al cierre antes de responder ──────
CREATE OR REPLACE FUNCTION public.puede_entrar_a_videollamada(p_cita_id uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_cita   record;
  v_ahora  timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  v_desde  timestamp;
  v_hasta  timestamp;
  v_es_duenio boolean;
  v_es_prof   boolean;
  v_rol    text;
  v_nombre text;
BEGIN
  /* 🔴 EL CIERRE PEREZOSO — «alguien pregunta», y esta es la puerta por la que
     la pantalla pregunta de verdad. Va ANTES de leer la cita para que lo que se
     lea abajo sea el estado YA resuelto: *preguntar primero y cerrar después
     devolvería, en la misma llamada, un veredicto sobre un estado que la propia
     llamada acaba de dejar viejo.*
     No lanza y no decide sobre plata: si no hay evidencia de que la consulta
     ocurrió, no toca nada. */
  PERFORM public._cerrar_teleconsulta_si_vencio(p_cita_id);
  IF p_cita_id IS NULL OR p_user_id IS NULL THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'cita_inexistente');
  END IF;

  SELECT c.id, c.mascota_id, c.prestador_id, c.empleado_id, c.user_id,
         c.fecha, c.hora, c.duracion_minutos, c.estado, c.estado_reserva, c.modalidad
    INTO v_cita
    FROM evento_cita_servicio c
   WHERE c.id = p_cita_id;

  IF v_cita.id IS NULL THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'cita_inexistente');
  END IF;

  -- ── QUIÉN ES (ver la desviación declarada en la cabecera) ────────────
  v_es_duenio := COALESCE(public._user_es_familia_de_mascota(v_cita.mascota_id, p_user_id), false);

  -- Trampa ①: la sobrecarga de DOS argumentos. La de uno lee auth.uid() y
  -- acá no hay sesión.
  v_es_prof := COALESCE(public.empleado_tiene_capacidad_clinica(v_cita.prestador_id, p_user_id), false);

  -- Y si la cita ya tiene persona asignada, tiene que ser ESA persona. Otro
  -- profesional del mismo negocio no entra a una consulta que no es suya.
  IF v_es_prof AND v_cita.empleado_id IS NOT NULL THEN
    v_es_prof := EXISTS (
      SELECT 1 FROM prestador_empleados pe
       WHERE pe.id = v_cita.empleado_id AND pe.user_id = p_user_id
    );
  END IF;

  IF NOT v_es_duenio AND NOT v_es_prof THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'ajeno_a_la_cita');
  END IF;

  -- Si es las dos cosas, gana profesional (pedido de D).
  v_rol := CASE WHEN v_es_prof THEN 'profesional' ELSE 'dueño' END;

  -- ── ES TELECONSULTA — por MODALIDAD (trampa ②) ───────────────────────
  IF v_cita.modalidad IS DISTINCT FROM 'telemedicina' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'no_es_teleconsulta');
  END IF;

  -- ── VIVA Y PAGADA ───────────────────────────────────────────────────
  -- El orden importa: `cancelada` gana sobre `no_pagada`, porque una cita
  -- cancelada sale de 'pagada' y diría las dos cosas.
  IF v_cita.estado = 'cancelada' OR v_cita.estado_reserva = 'cancelada' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'cita_cancelada');
  END IF;

  IF v_cita.estado = 'no_realizable' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'cita_no_realizable');
  END IF;

  -- *Una sala abierta después de que el vet cerró la consulta es una puerta
  -- sin dueño.*
  IF v_cita.estado IN ('completada', 'no_show', 'rechazada') THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'cita_finalizada');
  END IF;

  IF v_cita.estado_reserva IS DISTINCT FROM 'pagada' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'cita_no_pagada');
  END IF;

  -- ── LA VENTANA, ±15 min, en hora de Guayaquil ───────────────────────
  v_desde := (v_cita.fecha + v_cita.hora) - interval '15 minutes';
  v_hasta := (v_cita.fecha + v_cita.hora)
             + make_interval(mins => COALESCE(v_cita.duracion_minutos, 20))
             + interval '15 minutes';

  IF v_ahora < v_desde OR v_ahora > v_hasta THEN
    RETURN jsonb_build_object(
      'puede', false,
      'motivo', 'fuera_de_ventana',
      -- se devuelve como timestamptz: el local de Guayaquil llevado a
      -- instante absoluto, para que la edge no tenga que saber de zonas.
      'abre_en', (v_desde AT TIME ZONE 'America/Guayaquil')
    );
  END IF;

  SELECT pr.nombre INTO v_nombre FROM profiles pr WHERE pr.id = p_user_id;

  RETURN jsonb_build_object(
    'puede', true,
    'rol', v_rol,
    -- determinístico, sin estado que guardar.
    'sala', p_cita_id::text,
    'identidad', p_user_id::text,
    'nombre', v_nombre
  );
END;
$function$
;

REVOKE EXECUTE ON FUNCTION public.puede_entrar_a_videollamada(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.puede_entrar_a_videollamada(uuid, uuid) TO authenticated;

-- ── CINTURÓN: el discriminador que separa las DOS razones de no cerrar ─────
-- Un cinturón que sólo probara «una cita vencida con evidencia cierra» daría
-- verde con una función que cerrara TODO lo vencido — que es exactamente el
-- defecto que esta migración existe para no cometer. Por eso se prueban **los
-- dos brazos, sobre citas fabricadas y DESHECHAS**.
DO $cinturon$
DECLARE
  v_cita_ok  uuid;
  v_cita_sin uuid;
  v_est_ok   text;
  v_est_sin  text;
BEGIN
  IF has_function_privilege('authenticated','public._cerrar_teleconsulta_si_vencio(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: el cierre quedo alcanzable desde una app';
  END IF;

  -- ① CON EVIDENCIA: una cita vencida que SÍ tuvo sala.
  SELECT c.id INTO v_cita_ok
  FROM evento_cita_servicio c
  WHERE c.modalidad = 'telemedicina'
    AND EXISTS (SELECT 1 FROM videollamada_hechos vh WHERE vh.cita_id = c.id)
  LIMIT 1;
  IF v_cita_ok IS NULL THEN
    RAISE EXCEPTION 'cinturon: no hay teleconsulta con hechos de sala con la que ejercer';
  END IF;

  -- ② SIN EVIDENCIA: una cita vencida a la que nadie entró.
  SELECT c.id INTO v_cita_sin
  FROM evento_cita_servicio c
  WHERE c.modalidad = 'telemedicina'
    AND NOT EXISTS (SELECT 1 FROM videollamada_hechos vh WHERE vh.cita_id = c.id)
    AND NOT EXISTS (SELECT 1 FROM evento_historia_clinica_registrada h WHERE h.cita_id = c.id)
  LIMIT 1;
  IF v_cita_sin IS NULL THEN
    RAISE EXCEPTION 'cinturon: no hay teleconsulta SIN evidencia; el brazo que importa no se ejerceria';
  END IF;

  BEGIN
    -- Las dos se ponen vencidas y vivas, dentro del bloque que se deshace.
    UPDATE evento_cita_servicio
      SET estado = 'confirmada', fecha = (now() AT TIME ZONE 'America/Guayaquil')::date - 1
      WHERE id IN (v_cita_ok, v_cita_sin);

    PERFORM public._cerrar_teleconsulta_si_vencio(v_cita_ok);
    PERFORM public._cerrar_teleconsulta_si_vencio(v_cita_sin);

    SELECT estado INTO v_est_ok  FROM evento_cita_servicio WHERE id = v_cita_ok;
    SELECT estado INTO v_est_sin FROM evento_cita_servicio WHERE id = v_cita_sin;

    IF v_est_ok <> 'completada' THEN
      RAISE EXCEPTION 'cinturon: la vencida CON evidencia no cerró (quedó %)', v_est_ok;
    END IF;
    -- 🔴 EL BRAZO QUE IMPORTA: sin evidencia NO se toca. Cerrarla afirmaría que
    --    ocurrió y le consumiría a la familia el derecho a devolución.
    IF v_est_sin <> 'confirmada' THEN
      RAISE EXCEPTION 'cinturon: la vencida SIN evidencia FUE TOCADA (quedó %) — eso decide sobre plata', v_est_sin;
    END IF;

    RAISE EXCEPTION 'cinturon_ok_deshacer';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'cinturon_ok_deshacer' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'cinturon cierre perezoso: OK · con evidencia cierra · SIN evidencia NO se toca';
END;
$cinturon$;
