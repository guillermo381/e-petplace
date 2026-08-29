-- ═══════════════════════════════════════════════════════════════════════════
-- S107-C · LOS DOS CAMINOS TRISTES QUE EXIGEN ESCRIBIR — **EN SUBTRANSACCIÓN**
--
--   ① pago rechazado a mitad      ② acta con salvedad
--
-- 🔴 TODO ESTO SE DESHACE. La corrida entera vive entre `BEGIN` y `ROLLBACK`:
--    **no queda una fila en Aurora.** El residuo se mide DESPUÉS, aparte, y su
--    medición es parte del entregable — *una corrida que dice «deshice todo»
--    sin contar filas es una promesa, no una prueba.*
--
-- ⚠️ **NO SE USA `RAISE` COMO SEÑAL DE ÉXITO.** El precedente de la casa es
--    caro: en S75 un `RAISE` usado como «terminó bien» en un fixture que mutaba
--    coló un `DELETE` a producción. Acá el éxito se dice con `NOTICE` y el
--    deshacer lo hace el `ROLLBACK` explícito, que corre pase lo que pase.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

/* 🔴 LA SALIDA VA A UNA TABLA TEMPORAL, no a `RAISE NOTICE`: **el cliente de
   `db query` devuelve FILAS y se come los avisos.** *La primera corrida terminó
   «sin error» y sin una sola línea — un verde mudo, que es la peor forma de
   verde.* */
CREATE TEMP TABLE _res(n serial, linea text) ON COMMIT DROP;

DO $$
DECLARE
  v_rol       text := current_user;
  v_masc      uuid; v_duenio uuid; v_prest uuid; v_prest_user uuid;
  v_fecha     date;
  v_res       jsonb; v_cita uuid; v_estadia uuid; v_expira timestamptz;
  v_cupo_antes int; v_cupo_desp int;
  v_acta      jsonb; v_acta_id uuid;
  v_leida     jsonb;
  v_estado    text;
BEGIN
  -- ── EL TERRENO, medido: nada se inventa ──────────────────────────────────
  -- ⚠️ **CUATRO NOMBRES QUE ESCRIBÍ DE MEMORIA Y ESTABAN MAL**, en una sola
  -- corrida: `familias`→`familia` · `titular_id` (no existe; el titular vive en
  -- `familia_miembro`) · `'titular'`→`'adulto_titular'` ·
  -- `'guarderia'`→`'guarderia_dia'`.
  -- *La regla de la casa, demostrada cuatro veces seguidas: **nombrar de
  -- memoria es adivinar con más pasos.*** El cinturón los frenó a todos.
  SELECT m.id, m.familia_id INTO v_masc, v_duenio
    FROM mascotas m WHERE m.nombre = 'Thor' AND m.especie = 'perro' LIMIT 1;
  SELECT fm.user_id INTO v_duenio
    FROM familia_miembro fm
   WHERE fm.familia_id = v_duenio AND fm.hasta IS NULL AND fm.rol = 'adulto_titular'
   LIMIT 1;

  SELECT pr.id, pr.user_id INTO v_prest, v_prest_user
    FROM prestadores pr
    JOIN prestador_servicios ps ON ps.prestador_id = pr.id
   WHERE ps.tipo_servicio = 'guarderia_dia' AND ps.activo LIMIT 1;

  IF v_masc IS NULL OR v_duenio IS NULL OR v_prest IS NULL THEN
    RAISE EXCEPTION 'CINTURON: falta terreno (mascota=%, dueño=%, prestador=%)',
      v_masc, v_duenio, v_prest;
  END IF;

  -- El próximo día que el lugar SÍ opera — jamás una fecha fija.
  SELECT d::date INTO v_fecha
    FROM generate_series(public.hoy_local() + 1, public.hoy_local() + 20, '1 day') d
   WHERE public._guarderia_dia_operativo(v_prest, d::date) LIMIT 1;
  IF v_fecha IS NULL THEN RAISE EXCEPTION 'CINTURON: el lugar no opera ningun dia de los proximos 20'; END IF;
  INSERT INTO _res(linea) VALUES (format('terreno · mascota=%s dueño=%s prestador=%s fecha=%s', v_masc, v_duenio, v_prest, v_fecha));

  SELECT (public.cupo_guarderia_del_dia(v_prest, v_fecha)->>'disponible')::int INTO v_cupo_antes;

  -- ── ⓪ LA PRECONDICIÓN, CREADA ACÁ DENTRO ────────────────────────────────
  -- 🔴 **Medido: hay CERO documentos y CERO aceptaciones**, así que hoy
  -- `reservar_dia_guarderia` rebota `documentos_no_disponibles` y **ningún
  -- camino triste se puede correr.** *Eso NO es un defecto: es la regla de
  -- perímetro del founder funcionando —«sin documento cargado la reserva no se
  -- abre»—.* Se crean acá, dentro de la subtransacción, **igual que A crea el
  -- sábado en su cinturón**: la precondición se fabrica, se ejerce el motor, y
  -- el `ROLLBACK` se lleva todo.
  -- Los SEIS del CHECK — medidos del objeto, no elegidos.
  -- ⚠️ `protocolo_no_retiro` entra porque **el motor lo exige**; su SUPERFICIE
  -- sigue fuera de mi perímetro por orden del founder y no se toca.
  INSERT INTO guarderia_documentos (codigo, version, contenido, vigente_desde, activo)
  SELECT c, 1, 'CONTENIDO DE PRUEBA — subtransaccion S107-C', now(), true
    FROM unnest(ARRAY['contrato_custodia','declaracion_sanitaria','declaracion_comportamiento',
                      'autorizacion_urgencia_veterinaria','autorizacion_transporte','protocolo_no_retiro']) c;
  INSERT INTO guarderia_aceptaciones (familia_id, documento_codigo, documento_version, aceptado_por, aceptado_en)
  SELECT m.familia_id, d.codigo, 1, v_duenio, now()
    FROM mascotas m, guarderia_documentos d WHERE m.id = v_masc;
  INSERT INTO _res(linea) VALUES ('⓪ precondicion creada en la subtransaccion (6 documentos + 6 aceptaciones)');

  -- ═══ ① PAGO RECHAZADO A MITAD ═══════════════════════════════════════════
  -- El rechazo NO es una función: es la AUSENCIA de confirmación. Lo que hay
  -- que probar es qué queda cuando el pago no llega.
  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_duenio, 'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  v_res := public.reservar_dia_guarderia(v_prest, v_masc, v_fecha);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  v_cita    := (v_res->>'cita_id')::uuid;
  v_estadia := (v_res->>'estadia_id')::uuid;
  v_expira  := (v_res->>'expira_en')::timestamptz;
  INSERT INTO _res(linea) VALUES (format('① reserva · cita=%s estadia=%s expira=%s', v_cita, v_estadia, v_expira));

  SELECT (public.cupo_guarderia_del_dia(v_prest, v_fecha)->>'disponible')::int INTO v_cupo_desp;
  IF v_cupo_desp <> v_cupo_antes - 1 THEN
    INSERT INTO _res(linea) VALUES (format('🔴 ①.a EL CUPO NO SE TOMÓ: antes=%s despues=%s (el hold no reserva lugar)', v_cupo_antes, v_cupo_desp));
  ELSE
    INSERT INTO _res(linea) VALUES (format('✓ ①.a el hold TOMA cupo: %s → %s', v_cupo_antes, v_cupo_desp));
  END IF;

  SELECT estado_reserva INTO v_estado FROM evento_cita_servicio WHERE id = v_cita;
  IF v_estado <> 'pendiente_pago' THEN
    INSERT INTO _res(linea) VALUES (format('🔴 ①.b la cita NO nace pendiente_pago: %s', v_estado));
  ELSE
    INSERT INTO _res(linea) VALUES ('✓ ①.b sin pago, la cita queda `pendiente_pago` con su hold — la familia puede volver a pagar');
  END IF;

  -- 🔴 LO QUE DE VERDAD IMPORTA: ¿la familia la VE para poder ir a pagarla?
  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_duenio, 'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  -- Devuelve un SETOF, no jsonb.
  SELECT count(*) INTO v_cupo_desp
    FROM public.obtener_mis_estadias_guarderia(v_masc) e
   WHERE e.cita_id = v_cita;
  EXECUTE format('SET LOCAL ROLE %I', v_rol);
  IF v_cupo_desp = 0 THEN
    INSERT INTO _res(linea) VALUES ('🔴 ①.c LA FAMILIA NO VE SU RESERVA SIN PAGAR — no tiene como volver a pagarla');
  ELSE
    INSERT INTO _res(linea) VALUES ('✓ ①.c la familia VE su reserva pendiente de pago (D-319: el hold propio se muestra)');
  END IF;

  -- ═══ ② ACTA CON SALVEDAD ════════════════════════════════════════════════
  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_prest_user, 'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  v_acta := public.levantar_acta_guarderia(
    v_estadia, 'devolucion', true, 'Correa y manta', 'Lo devolvemos con una raspadura en la pata',
    now(), gen_random_uuid()::text);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);
  v_acta_id := (v_acta->>'acta_id')::uuid;
  INSERT INTO _res(linea) VALUES (format('② acta levantada por el PRESTADOR · id=%s', v_acta_id));

  -- La conformidad la deja el DUEÑO, desde su sesión (Ley 67).
  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_duenio, 'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  PERFORM public.confirmar_acta_guarderia(v_acta_id, 'con_reserva', 'La raspadura no estaba cuando lo entregue');
  v_leida := public.obtener_acta_guarderia(v_acta_id);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  RAISE NOTICE '② leida · conformidad=% · reservaTexto=% · cerradaEn=% · recibidaEn=%',
    v_leida->>'conformidad', v_leida->>'reservaTexto', v_leida->>'cerradaEn', v_leida->>'recibidaEn';

  IF v_leida->>'conformidad' <> 'con_reserva' THEN
    INSERT INTO _res(linea) VALUES (format('🔴 ②.a la conformidad NO quedo `con_reserva`: %s', v_leida->>'conformidad'));
  ELSE
    INSERT INTO _res(linea) VALUES ('✓ ②.a la salvedad quedo registrada como `con_reserva`');
  END IF;
  IF coalesce(v_leida->>'reservaTexto','') = '' THEN
    INSERT INTO _res(linea) VALUES ('🔴 ②.b EL TEXTO DE LA SALVEDAD SE PERDIO — una salvedad sin texto es una queja muda');
  ELSE
    INSERT INTO _res(linea) VALUES ('✓ ②.b el texto de la salvedad viaja de vuelta');
  END IF;

  INSERT INTO _res(linea) VALUES ('── corrida completa. TODO se deshace en el ROLLBACK de abajo.');
END $$;

SELECT n, linea FROM _res ORDER BY n;

ROLLBACK;

-- ═══════════════════════════════════════════════════════════════════════════
-- EL RESIDUO — **se mide DESPUÉS del ROLLBACK y es parte del entregable.**
-- *Una corrida que dice «deshice todo» sin contar filas es una promesa, no una
-- prueba.* Medido el 29-ago tras la corrida verde: **las cinco en 0.**
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 'guarderia_documentos' t, count(*) n FROM guarderia_documentos
UNION ALL SELECT 'guarderia_aceptaciones', count(*) FROM guarderia_aceptaciones
UNION ALL SELECT 'guarderia_estadias',     count(*) FROM guarderia_estadias
UNION ALL SELECT 'guarderia_actas',        count(*) FROM guarderia_actas
UNION ALL SELECT 'citas_guarderia',        count(*) FROM evento_cita_servicio WHERE tipo_servicio = 'guarderia_dia'
ORDER BY 1;
