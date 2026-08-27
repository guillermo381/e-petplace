-- ============================================================================
-- S106-A · LA CITA NACE DEL TITULAR — y la continuidad clínica sobrevive
--
-- ── LA FIRMA DEL FOUNDER (27-ago-2026), para los CINCO oficios ─────────────
-- ① Si el animal tiene un **caso clínico abierto** con alguien del equipo, la
--    cita va a ese profesional. **La continuidad manda, y es el primer brazo.**
-- ② Si no hay caso abierto, la cita **NACE DEL TITULAR**.
-- ③ Sólo **recepción** puede moverla · ④ si nadie la mueve, el titular es el
--    único que puede tomarla · ⑤ desde la pizarra, quien la reciba la atiende.
--
-- ⇒ **De S78-A5 se retiran los dos criterios de ABAJO** —menos citas ese día y
-- antigüedad— **no el de arriba.**
--
-- ── LA RAZÓN, escrita porque es lo que hace entender la regla en seis meses ─
-- > *El balanceo por carga reparte pacientes de forma **ARBITRARIA**, y eso es
-- > lo que dejó al founder sin poder tomar una cita de su propia clínica. La
-- > continuidad clínica es lo contrario de arbitraria: **es que quien conoce el
-- > caso lo siga.** En una TELECONSULTA vale más todavía, porque el veterinario
-- > **no puede palpar** y depende de saber la historia.*
--
-- ── 🔴 EL CASO QUE LA ORIGINÓ, MEDIDO — y no fue lo que la mesa suponía ────
-- La cita `c6cdb345` (26/08 22:53) fue a `+7`. Medido contra el objeto:
--
--   | persona            | franja 23:00 | continuidad con Thor |
--   |--------------------|--------------|----------------------|
--   | **titular**        | **sí**       | **sí** (Otitis, 21/07) |
--   | `+7` (la recibió)  | sí           | **no**                |
--   | los otros 6        | no           | no                    |
--
-- ⇒ **`+7` NO ganó por continuidad: ganó por carga o por antigüedad** — los dos
-- criterios que esta migración retira. *(El tercer caso de Thor, «irritación en
-- la piel», se abrió el 27/08 10:06 — **después** de la cita, así que no
-- participó.)*
--
-- ⚠️ **Lo que NO se pudo reconstruir, y se dice en vez de suponerse:** el
-- estado de `_agenda_ocupacion` de ese instante. No se sabe si la continuidad
-- no se aplicó o si el titular estaba momentáneamente lleno. *Con la regla
-- nueva la cita habría ido al titular por cualquiera de los dos brazos, así que
-- la duda no cambia la cura* — pero queda escrita.
--
-- ── LO QUE ESTA MIGRACIÓN NO TOCA, y por qué ───────────────────────────────
-- El `ORDER BY` **sólo REORDENA**: el conjunto de candidatas ya viene filtrado
-- por chip, geometría de franja, matrícula y cupo. *La regla nueva jamás mete a
-- alguien que no podía atender ni saca a nadie* — igual que la de S78.
--
-- ⚠️ **Y su borde, declarado:** si el titular **no está en el pool** (sin franja
-- en ese horario, o con el cupo lleno), la cita cae en quien sí pueda. *La
-- alternativa —rechazar— dejaría la puerta ofreciendo horarios que después
-- rebota, que es lo que la Ley 23 prohíbe.* **«Nace del titular» se cumple
-- siempre que el titular pueda.**
--
-- ── ③ NO SE CONSTRUYE ACÁ: YA EXISTE, Y ESTÁ FRENADO A PROPÓSITO ───────────
-- Medido: `asignar_cita_a_persona` **ya gatea por `empleado_puede_asignar_citas`**
-- —su propio mensaje dice *«quien rutea es la recepción, el administrador o el
-- titular»*— y **rechaza reasignar** una cita que ya tiene persona con
-- `cita_ya_asignada: reasignar exige el aviso a la familia, que aún no existe`.
-- *Es un gate mecánico con su precondición nombrada, del mismo molde que el de
-- la vitrina en S78: el día que el aviso exista, se abre solo.* **No se ablanda
-- acá.**
--
-- ── VEDA 76(g): NO RIGE. `CREATE OR REPLACE` de una función, misma firma.
--    Cero DDL, cero backfill. **Las citas ya asignadas NO se tocan.**
-- ── REVERSA: docs/relevamientos/2026-08-27-s106a-REVERSA-asignacion-titular.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crear_bloqueo_agenda(p_prestador_id uuid, p_servicio_id uuid, p_mascota_id uuid, p_fecha date, p_hora time without time zone, p_modalidad text DEFAULT NULL::text, p_empleado_id uuid DEFAULT NULL::uuid, p_acepta_teleconsulta boolean DEFAULT NULL::boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth        uuid := auth.uid();
  v_servicio    record;
  v_ocupados    int;
  v_country     text;
  v_eje         text;
  v_visibilidad jsonb;
  v_evento_id   uuid;
  v_cita_id     uuid;
  v_expira      timestamptz;
  v_direccion   jsonb;   -- D-339
  v_modalidad   text;    -- S61 D-392
  -- S59-A5: resolución grooming por talla (MODELO_GROOMING §2/§6)
  v_talla          text;
  v_pelaje         text;
  v_precio_talla   numeric;
  v_duracion_talla int;
  -- V0-actor: la persona del hold + la semántica de concurrencia
  v_empleado    uuid;
  v_cupo_techo  int;
  -- S68: reservable en dos niveles + same-day declarativo
  v_ts_reservable boolean;
  v_ts_solo_hoy   boolean;
  -- S106: la categoría decide la modalidad y el consentimiento
  v_categoria     text;
  v_es_tele       boolean;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.estado = 'activo') THEN
    RAISE EXCEPTION 'prestador_inactivo' USING ERRCODE = '22023';
  END IF;

  -- S55-B2: la duración de la oferta entra al snapshot junto al precio.
  SELECT ps.id, ps.tipo_servicio, ps.precio, ps.duracion_minutos, ps.atiende_local, ps.atiende_domicilio, ps.reservable
  INTO v_servicio
  FROM prestador_servicios ps
  WHERE ps.id = p_servicio_id AND ps.prestador_id = p_prestador_id AND ps.activo;
  IF v_servicio.id IS NULL THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;
  IF v_servicio.duracion_minutos IS NULL OR v_servicio.duracion_minutos <= 0 THEN
    RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
  END IF;

  -- S68: la puerta del hold es del MOTOR — reservable en DOS niveles y
  -- el same-day de urgencia (declarativo, tipos_servicio.reserva_solo_hoy).
  SELECT ts.reservable, ts.reserva_solo_hoy, ts.categoria
  INTO v_ts_reservable, v_ts_solo_hoy, v_categoria
  FROM tipos_servicio ts WHERE ts.codigo = v_servicio.tipo_servicio;
  IF NOT v_servicio.reservable OR NOT COALESCE(v_ts_reservable, true) THEN
    RAISE EXCEPTION 'servicio_no_reservable' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(v_ts_solo_hoy, false)
     AND p_fecha <> (now() AT TIME ZONE 'America/Guayaquil')::date THEN  -- D-320, espejo S57/S60
    RAISE EXCEPTION 'urgencia_solo_hoy' USING ERRCODE = '22023';
  END IF;

  v_es_tele := (v_categoria = 'telemedicina');

  -- ═══ S106 · LA MODALIDAD SE DERIVA DEL TIPO, JAMÁS DEL CLIENTE ═══════
  -- La marca del expediente (§7) no puede depender de lo que declare quien
  -- reserva. Se deriva acá, y se rebota en las DOS direcciones.
  IF v_es_tele THEN
    IF p_modalidad IS NOT NULL AND p_modalidad <> 'telemedicina' THEN
      RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE = '22023';
    END IF;
    v_modalidad := 'telemedicina';
  ELSIF p_modalidad = 'telemedicina' THEN
    -- Un caller no puede vestir de teleconsulta un servicio presencial.
    RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE = '22023';
  END IF;

  -- ═══ S106 · SIN CONSENTIMIENTO NO HAY HOLD ══════════════════════════
  -- Se exige ANTES de gastar trabajo (lock, geometría, reparto): rebotar
  -- temprano es más barato y no deja rastro a medias.
  IF v_es_tele AND COALESCE(p_acepta_teleconsulta, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'consentimiento_requerido' USING ERRCODE = '22023';
  END IF;

  -- F3 S57 (§1bis): la elegibilidad por especie manda desde la DB.
  IF NOT _mascota_elegible_servicio(p_mascota_id, v_servicio.tipo_servicio) THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;

  -- P19 (S59): el paseo es GRUPAL por norma.
  IF EXISTS (
       SELECT 1 FROM tipos_servicio ts
       WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo'
     )
     AND NOT _mascota_apta_paseo_grupal(p_mascota_id) THEN
    RAISE EXCEPTION 'paseo_social_no' USING ERRCODE = '22023';
  END IF;

  -- S59-A5 (MODELO_GROOMING §2/§6): el GROOMING cotiza por TALLA del
  -- PERFIL + extra pelaje + recargo domicilio — server-side, ANTES de
  -- validar ventana/cupo, y se CONGELA como snapshot (INTACTO en V0).
  IF v_categoria = 'grooming' THEN
    SELECT m.talla, m.pelaje INTO v_talla, v_pelaje
    FROM mascotas m WHERE m.id = p_mascota_id;
    IF v_talla IS NULL THEN
      RAISE EXCEPTION 'talla_no_declarada' USING ERRCODE = '22023';
    END IF;
    SELECT pst.precio, pst.duracion_minutos
    INTO v_precio_talla, v_duracion_talla
    FROM prestador_servicio_tallas pst
    WHERE pst.prestador_servicio_id = v_servicio.id AND pst.talla = v_talla;
    IF v_precio_talla IS NULL OR v_duracion_talla IS NULL THEN
      RAISE EXCEPTION 'servicio_no_disponible' USING ERRCODE = '22023';
    END IF;
    IF v_pelaje = 'largo' THEN
      v_precio_talla := v_precio_talla + COALESCE(
        (SELECT pr.grooming_extra_pelaje_largo FROM prestadores pr WHERE pr.id = p_prestador_id), 0);
    END IF;
    v_modalidad := COALESCE(p_modalidad, 'local');
    IF v_modalidad NOT IN ('local', 'domicilio') THEN
      RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE = '22023';
    END IF;
    IF v_modalidad = 'domicilio' AND NOT v_servicio.atiende_domicilio THEN
      RAISE EXCEPTION 'modalidad_no_disponible' USING ERRCODE = '22023';
    END IF;
    IF v_modalidad = 'local' AND NOT v_servicio.atiende_local THEN
      RAISE EXCEPTION 'modalidad_no_disponible' USING ERRCODE = '22023';
    END IF;
    IF v_modalidad = 'domicilio' THEN
      v_precio_talla := v_precio_talla + COALESCE(
        (SELECT pr.grooming_recargo_domicilio FROM prestadores pr WHERE pr.id = p_prestador_id), 0);
    END IF;
    v_servicio.precio := v_precio_talla;
    v_servicio.duracion_minutos := v_duracion_talla;
  END IF;

  -- S68: la urgencia A DOMICILIO es domicilio por tipo — hereda VERBATIM
  -- el mecanismo D-339/D-392 (dirección al snapshot + guard del pago).
  IF v_servicio.tipo_servicio = 'urgencia_domicilio' THEN
    IF NOT v_servicio.atiende_domicilio THEN
      RAISE EXCEPTION 'modalidad_no_disponible' USING ERRCODE = '22023';
    END IF;
    v_modalidad := 'domicilio';
  END IF;

  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN   -- D-320
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- D-341: prestador con bloqueo vigente no recibe holds nuevos.
  IF _prestador_bloqueado(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'prestador_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || p_prestador_id::text || ':' || p_fecha::text, 0)
  );

  IF NOT EXISTS (
    SELECT 1 FROM prestador_horarios h
    WHERE h.prestador_id = p_prestador_id
      AND h.activo
      AND h.duracion_slot_minutos > 0
      AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
      AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int          -- regla 32
      AND p_hora >= h.hora_inicio
      AND EXTRACT(EPOCH FROM p_hora)::int + v_servicio.duracion_minutos * 60
          <= EXTRACT(EPOCH FROM h.hora_fin)::int
      AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
  ) THEN
    RAISE EXCEPTION 'fuera_de_horario' USING ERRCODE = '22023';
  END IF;

  SELECT ts.cupo_techo INTO v_cupo_techo
  FROM tipos_servicio ts WHERE ts.codigo = v_servicio.tipo_servicio;

  SELECT pe.id INTO v_empleado
  FROM prestador_horarios h
  JOIN prestador_empleados pe ON pe.id = h.empleado_id AND pe.activo
  WHERE h.prestador_id = p_prestador_id
    AND h.activo
    AND h.duracion_slot_minutos > 0
    AND (h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)
    AND h.dia_semana = EXTRACT(DOW FROM p_fecha)::int
    AND p_hora >= h.hora_inicio
    AND EXTRACT(EPOCH FROM p_hora)::int + v_servicio.duracion_minutos * 60
        <= EXTRACT(EPOCH FROM h.hora_fin)::int
    AND (EXTRACT(EPOCH FROM (p_hora - h.hora_inicio))::int % (h.duracion_slot_minutos * 60)) = 0
    AND (pe.rol = 'dueño' OR EXISTS (
          SELECT 1 FROM prestador_empleado_servicios pes
          WHERE pes.empleado_id = pe.id AND pes.servicio_id = p_servicio_id))
    AND public._empleado_matricula_ok(pe.id, v_servicio.tipo_servicio)
    AND _agenda_ocupacion(pe.id, p_fecha, p_hora, v_servicio.duracion_minutos, NULL, v_servicio.tipo_servicio)
        < LEAST(COALESCE(h.max_citas_por_slot, 1), COALESCE(v_cupo_techo, 1))
    AND (p_empleado_id IS NULL OR pe.id = p_empleado_id)
  -- S78-A5 — LA CONTINUIDAD CLINICA VENCE AL BALANCEO. (Intacta: ver la
  -- reversa para el comentario largo original, que no se reproduce acá
  -- para no duplicar su literal.)
  ORDER BY (CASE WHEN EXISTS (
              SELECT 1 FROM caso_clinico kc
              JOIN tipos_servicio kts ON kts.codigo = v_servicio.tipo_servicio
              WHERE kc.mascota_id = p_mascota_id
                AND kc.estado = 'activo'
                AND kc.empleado_tratante_id = pe.user_id
                AND kts.es_medico
            ) THEN 0 ELSE 1 END),
           /* ═══ S106 · SEGUNDO BRAZO: EL TITULAR ═══════════════════════════
              Firma del founder, 27-ago-2026: **si no hay caso abierto, la cita
              NACE DEL TITULAR.**

              ☠️ Acá vivían los dos criterios que la firma DEROGA — la carga del
              día y la antigüedad. *El balanceo por carga reparte pacientes de
              forma ARBITRARIA*, y eso es lo que dejó al founder sin poder tomar
              una cita de su propia clínica: medido, la persona que la recibió
              **no tenía continuidad con ese animal**, y el titular sí.

              🔴 La continuidad (arriba) NO se retira, y la razón es de producto:
              *es lo contrario de arbitraria — es que quien conoce el caso lo
              siga.* **En teleconsulta vale más todavía, porque el vet no puede
              palpar y depende de saber la historia.** */
           (CASE WHEN pe.rol = 'dueño' THEN 0 ELSE 1 END),
           /* Desempate ESTABLE y sin criterio propio. `created_at` se retira con
              el balanceo: *ordenar por antigüedad es repartir por un dato que no
              dice nada del animal.* Queda el id, que sólo garantiza que dos
              corridas iguales den el mismo resultado. */
           pe.id
  LIMIT 1;
  IF v_empleado IS NULL THEN
    IF p_empleado_id IS NOT NULL THEN
      RAISE EXCEPTION 'persona_no_disponible' USING ERRCODE = '22023';
    END IF;
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  v_ocupados := 0;  -- (la pregunta de cupo ya se respondió por persona)

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id = p_mascota_id;

  SELECT cte.eje_jtbd, cte.visibilidad_default
  INTO v_eje, v_visibilidad
  FROM cat_tipos_evento cte WHERE cte.codigo = 'cita_servicio';
  IF v_eje IS NULL THEN
    RAISE EXCEPTION 'catalogo_cita_servicio_no_encontrado' USING ERRCODE = '22023';
  END IF;

  -- D-339: dirección del hogar al snapshot del hold (NULL honesto).
  -- S106: la teleconsulta NO lleva dirección — no ocurre en ningún lugar.
  IF EXISTS (
    SELECT 1 FROM tipos_servicio ts
    WHERE ts.codigo = v_servicio.tipo_servicio AND ts.categoria = 'paseo'
  )
  OR v_modalidad = 'domicilio' THEN
    v_direccion := _direccion_hogar_snapshot(v_auth);
  END IF;

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
    creado_por_user_id, datos, visibilidad, country_code
  ) VALUES (
    p_mascota_id, 'cita_servicio', v_eje, (p_fecha + p_hora), p_prestador_id,
    v_auth,
    jsonb_build_object('origen', 'crear_bloqueo_agenda', 'tipo_servicio', v_servicio.tipo_servicio),
    v_visibilidad, COALESCE(v_country, 'EC')
  ) RETURNING id INTO v_evento_id;

  v_expira := now() + interval '15 minutes';
  INSERT INTO evento_cita_servicio (
    evento_id, user_id, mascota_id, prestador_id, empleado_id, tipo_servicio,
    fecha, hora, precio, duracion_minutos, estado, estado_reserva, expira_en, country_code,
    direccion_snapshot, modalidad
  ) VALUES (
    v_evento_id, v_auth, p_mascota_id, p_prestador_id, v_empleado, v_servicio.tipo_servicio,
    p_fecha, p_hora, v_servicio.precio, v_servicio.duracion_minutos,
    'pendiente', 'pendiente_pago', v_expira,
    COALESCE(v_country, 'EC'),
    v_direccion,
    COALESCE(v_modalidad, 'presencial')
  ) RETURNING id INTO v_cita_id;

  -- ═══ S106 · EL CONSENTIMIENTO, EN LA MISMA TRANSACCIÓN ══════════════
  -- Acá está la garantía: una teleconsulta con hold y SIN consentimiento
  -- es inexpresable, porque las dos filas nacen o no nace ninguna.
  -- La VERSIÓN la pone el servidor — la pantalla no decide qué texto vio.
  IF v_es_tele THEN
    INSERT INTO consentimientos (user_id, tipo, aceptado, version, cita_id, metadata)
    VALUES (
      v_auth, 'teleconsulta', true, public._version_aviso_teleconsulta(), v_cita_id,
      jsonb_build_object(
        'contexto', 'reserva_teleconsulta',
        'origen', 'crear_bloqueo_agenda',
        -- El abandono del hold deja este registro huérfano de cita pagada,
        -- y es INOFENSIVO: dice que esta persona vio y aceptó el aviso ese
        -- día. La evidencia de haber informado no caduca porque la reserva
        -- no se haya completado.
        'registrado_en', now()
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', v_cita_id,
    'expira_en', v_expira,
    'precio', v_servicio.precio,
    'duracion_minutos', v_servicio.duracion_minutos,
    'fecha', p_fecha,
    'hora', p_hora,
    'modalidad', COALESCE(v_modalidad, 'presencial'),
    'empleado_id', v_empleado
  );
END;
$function$
;

-- ── CINTURÓN: LOS TRES CAMINOS DE LA FIRMA, ejercidos y deshechos ──────────
DO $cinturon$
DECLARE
  v_rol text := current_user;
  v_pr uuid; v_titular uuid; v_otro uuid; v_serv uuid; v_mascota uuid; v_fam uuid;
  v_cita uuid; v_asignado uuid; v_caso uuid; v_err text := '(no rebotó)';
  v_f date; v_h time;
BEGIN
  SELECT pr.id INTO v_pr FROM prestadores pr WHERE pr.nombre_comercial ILIKE '%Aurora%';
  SELECT ps.id INTO v_serv FROM prestador_servicios ps
    WHERE ps.prestador_id=v_pr AND ps.tipo_servicio='telemedicina' AND ps.activo LIMIT 1;
  SELECT pe.id INTO v_titular FROM prestador_empleados pe
    WHERE pe.prestador_id=v_pr AND pe.rol='dueño' AND pe.activo LIMIT 1;
  /* 🔴 EL «OTRO» TIENE QUE CALIFICAR DE VERDAD, no sólo existir.
     El primer intento tomaba cualquier empleado con franjas y el brazo ② dio
     rojo — pero **por la razón equivocada**: el candidato no cubría ese horario
     ni tenía el chip, así que nunca entró al pool y la continuidad no tuvo a
     quién favorecer. *Un rojo por la razón equivocada está tan roto como un
     verde por la razón equivocada.* Acá se exige chip Y franja. */
  SELECT pe.id INTO v_otro FROM prestador_empleados pe
    WHERE pe.prestador_id=v_pr AND pe.rol='empleado' AND pe.activo
      AND EXISTS (SELECT 1 FROM prestador_empleado_servicios pes
                  WHERE pes.empleado_id=pe.id AND pes.servicio_id=v_serv)
      AND EXISTS (SELECT 1 FROM prestador_horarios h
                  WHERE h.empleado_id=pe.id AND h.activo AND h.duracion_slot_minutos > 0)
    LIMIT 1;
  /* 🔴 UNA MASCOTA SIN CASOS ABIERTOS — y no se fabrica cerrando los de Thor.
     El primer intento hacía `UPDATE caso_clinico SET estado='resuelto'` y
     rebotó contra `chk_caso_clinico_cierre_coherente` (cerrar exige sus campos
     de cierre). *Y el rebote fue una suerte: cerrar casos clínicos REALES del
     founder para armar un fixture es tocar el expediente de un animal vivo
     para probar código.* Se elige una mascota que ya cumple la condición. */
  SELECT m.id, fm.user_id INTO v_mascota, v_fam
  FROM mascotas m JOIN familia_miembro fm ON fm.familia_id=m.familia_id AND fm.hasta IS NULL
  WHERE m.especie='perro' AND m.estado_vida='activa'
    AND NOT EXISTS (SELECT 1 FROM caso_clinico kc WHERE kc.mascota_id=m.id AND kc.estado='activo')
  LIMIT 1;

  /* Si no hay un «otro» que califique, el brazo ② no se puede ejercer — y eso
     se DICE. *Saltearlo en silencio dejaría el cinturón verde habiendo probado
     la mitad.* */
  IF v_pr IS NULL OR v_titular IS NULL OR v_otro IS NULL OR v_serv IS NULL OR v_mascota IS NULL THEN
    RAISE EXCEPTION 'cinturon: falta alguna pieza para ejercer (pr=% tit=% otro=% serv=% mas=%)',
      v_pr, v_titular, v_otro, v_serv, v_mascota;
  END IF;

  BEGIN
    -- Se busca un hueco real de mañana por la MISMA puerta que usa la app.
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_fam, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    v_f := (now() AT TIME ZONE 'America/Guayaquil')::date + 1;
    /* 🔴 LA HORA SE ELIGE EN FUNCIÓN DEL CANDIDATO, no al revés. El cuarto
       parámetro de esta puerta es `p_empleado_id`: devuelve **las horas de esa
       persona**. Tomando el `min()` global, la hora caía donde el candidato no
       tenía franja y el brazo ② no se podía ejercer — el instrumento lo dijo en
       vez de dar rojo falso, y esta es su cura. */
    SELECT min(x) INTO v_h
    FROM public.obtener_inicios_vet_disponibles(v_f,'telemedicina',v_mascota,v_otro) t(x);
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF v_h IS NULL THEN RAISE EXCEPTION 'cinturon: no hay hueco mañana para ejercer'; END IF;

    -- ① SIN CASO ABIERTO ⇒ NACE DEL TITULAR. (La mascota ya cumple: se eligió
    --    así arriba, no se fabricó cerrando casos de nadie.)
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_fam, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    SELECT (public.crear_bloqueo_agenda(v_pr, v_serv, v_mascota, v_f, v_h, NULL, NULL, true)->>'cita_id')::uuid
      INTO v_cita;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);

    SELECT empleado_id INTO v_asignado FROM evento_cita_servicio WHERE id=v_cita;
    IF v_asignado IS DISTINCT FROM v_titular THEN
      RAISE EXCEPTION 'cinturon ①: sin caso abierto la cita NO nació del titular (fue a %)', v_asignado;
    END IF;

    -- ② CON CASO ABIERTO DE OTRA PERSONA ⇒ GANA LA CONTINUIDAD.
    DELETE FROM evento_cita_servicio WHERE id=v_cita;
    INSERT INTO caso_clinico (mascota_id, condicion, cuenta_comercial_tratante_id,
                              empleado_tratante_id, estado, abierto_por_user_id)
    SELECT v_mascota, 'cinturon', pr.cuenta_comercial_id, pe.user_id, 'activo', pe.user_id
    FROM prestador_empleados pe JOIN prestadores pr ON pr.id=pe.prestador_id
    WHERE pe.id = v_otro
    RETURNING id INTO v_caso;

    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_fam, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    SELECT (public.crear_bloqueo_agenda(v_pr, v_serv, v_mascota, v_f, v_h, NULL, NULL, true)->>'cita_id')::uuid
      INTO v_cita;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);

    SELECT empleado_id INTO v_asignado FROM evento_cita_servicio WHERE id=v_cita;
    IF v_asignado IS DISTINCT FROM v_otro THEN
      /* 🔴 DOS COSAS DISTINTAS, Y EL CINTURÓN LAS SEPARA: que la continuidad no
         haya ganado, o que el candidato **nunca haya estado en el pool** (sin
         franja en ESA hora, o con el cupo lleno). *Sin esta distinción, un
         candidato que no calificaba produce un rojo que manda a arreglar el
         `ORDER BY`, que está bien.*
         Se pregunta por la puerta real, pidiendo esa persona explícitamente. */
      DELETE FROM evento_cita_servicio WHERE id=v_cita;
      EXECUTE format('SET LOCAL request.jwt.claims = %L',
                     json_build_object('sub', v_fam, 'role','authenticated')::text);
      SET LOCAL ROLE authenticated;
      BEGIN
        PERFORM public.crear_bloqueo_agenda(v_pr, v_serv, v_mascota, v_f, v_h, NULL, v_otro, true);
        v_err := 'PODIA';
      EXCEPTION WHEN OTHERS THEN v_err := SQLERRM; END;
      EXECUTE format('SET LOCAL ROLE %I', v_rol);

      IF v_err = 'PODIA' THEN
        RAISE EXCEPTION 'cinturon ②: el candidato SÍ podía y la continuidad NO ganó — esperaba %, vino %',
                        v_otro, v_asignado;
      END IF;
      RAISE EXCEPTION 'cinturon ②: NO SE PUDO EJERCER — el candidato con caso abierto no califica para % %s (%). El brazo de la continuidad queda SIN PROBAR y eso NO es verde.',
                      v_f, v_h, left(v_err,60);
    END IF;

    -- ③ 🔴 UN NO-RECEPCIÓN NO REASIGNA. Se ejerce por la puerta real.
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_fam, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    BEGIN
      PERFORM public.asignar_cita_a_persona(v_cita, v_titular);
    EXCEPTION WHEN OTHERS THEN v_err := SQLERRM; END;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);

    IF v_err = '(no rebotó)' THEN
      RAISE EXCEPTION 'cinturon ③: la FAMILIA pudo reasignar la cita — el gate de rol no cortó';
    END IF;

    RAISE EXCEPTION 'cinturon_ok_deshacer';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'cinturon_ok_deshacer' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'cinturon asignacion: OK · sin caso nace del titular · con caso gana la continuidad · un ajeno no reasigna';
END;
$cinturon$;
