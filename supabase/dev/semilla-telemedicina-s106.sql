-- ============================================================================
-- SEMILLA DE TELECONSULTA · S106-A tanda 2 · 26-ago-2026
--
-- Crea una cita de telemedicina REAL, **por las puertas reales**, para que
-- `video-token` (pista D) pueda ejercer su camino feliz. Nunca lo ejerció: era
-- la única pieza del circuito sin datos con que probarse.
--
-- 🔴 POR QUÉ ESTO ES UNA TRANSACCIÓN Y NO UNA SECUENCIA DE PASOS
--
--    La puerta real está cerrada por el switch de plataforma
--    `tipos_servicio.telemedicina.reservable = false`, que es LA LLAVE DEL
--    FOUNDER y va última. `crear_bloqueo_agenda` lo lee (verificado contra el
--    cuerpo vivo), así que sin abrirlo no hay cita.
--
--    **Firma del founder, 26-ago: se abre y se cierra DENTRO de una sola
--    transacción.** La opción de prenderlo a mano unos minutos parecía más
--    prudente y es MENOS segura: deja una ventana real en la que alguien podría
--    reservar. Acá, por MVCC, **ninguna otra sesión ve nunca `true`** — el único
--    estado que se compromete es `false`, idéntico al de antes.
--
--    ⇒ El invariante «nadie puede reservar telemedicina» queda **demostrable
--    por el motor**, no dependiente de que nadie entre en el momento
--    equivocado.
--
-- 🔴 CERO INSERT DIRECTO. Todo pasa por las RPC que usa la app:
--    `aceptar_minimos_servicio` → `crear_bloqueo_agenda` → `confirmar_cita_pagada`.
--    *Un fixture que inserta a mano prueba que la tabla acepta filas, no que el
--    circuito funcione — y es exactamente el verde flojo que esta semilla
--    existe para no dar.*
--
-- USO:
--   npx supabase --experimental db query --linked --file supabase/dev/semilla-telemedicina-s106.sql
--
-- Para volver a sembrar más adelante, se cambian `k_fecha` y `k_hora` y se
-- corre igual. **Es una puerta repetible, no una cita suelta.**
-- ============================================================================

BEGIN;

CREATE TEMP TABLE _semilla_res(paso text, detalle text) ON COMMIT DROP;

DO $$
DECLARE
  -- El rol al que hay que volver. **Se captura, jamás `RESET ROLE`**: bajo
  -- ciertas vías `RESET` vuelve al rol de LOGIN de la herramienta y no al de
  -- acá — el instrumento funciona y restaura OTRA cosa.
  k_rol_origen  constant text := current_user;

  k_prestador   constant uuid := 'de680000-0000-4000-8000-0000000000e5'; -- Clínica Aurora
  k_oferta      constant uuid := '13733856-f23a-4e18-82ab-a0a74cf91b18'; -- telemedicina 20' $30
  k_mascota     constant uuid := 'd2e31d70-54fc-4d47-b425-1617239257eb'; -- Thor
  k_dueno       constant uuid := 'dd024680-3d1c-4465-b38b-dedab45da037'; -- guillo381+8
  k_aurora_user constant uuid := '4f572081-26a5-4d3b-9d80-25ea751fdc9c'; -- titular de Aurora

  -- 🔧 PUNTO DE EDICIÓN: la fecha y la hora de la cita semilla.
  --    La ventana de entrada es ±15 min alrededor de `k_hora`, en Guayaquil.
  k_fecha       constant date := DATE '2026-08-26';
  k_hora        constant time := TIME '12:00';

  v_switch_previo boolean;
  v_res           jsonb;
  v_cita          uuid;
  -- El registro se ACUMULA y se escribe al final, con el rol de origen
  -- restaurado: `authenticated` no puede escribir en la tabla temporal, y
  -- darle permiso para que el fixture funcione sería aflojar la prueba.
  v_log           jsonb := '[]'::jsonb;
BEGIN
  ---------------------------------------------------------------------------
  -- ⓪ Se lee el switch ANTES, para poder devolverlo a su valor exacto y no a
  --    uno supuesto. *Restaurar a `false` «porque siempre fue false» es una
  --    creencia; restaurar a lo leído es una medición.*
  ---------------------------------------------------------------------------
  SELECT reservable INTO v_switch_previo FROM tipos_servicio WHERE codigo = 'telemedicina';
  IF v_switch_previo IS NULL THEN
    RAISE EXCEPTION 'no_existe_tipo_servicio_telemedicina';
  END IF;
  v_log := v_log || jsonb_build_object('paso','0_switch_previo','detalle',v_switch_previo::text);

  UPDATE tipos_servicio SET reservable = true WHERE codigo = 'telemedicina';

  ---------------------------------------------------------------------------
  -- ① Aurora acepta los mínimos del servicio — POR SU PUERTA, con su sesión.
  --    Sin esto la oferta no es cobrable (el gate vive en la LECTURA).
  ---------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', k_aurora_user, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  v_res := aceptar_minimos_servicio(k_prestador, 'telemedicina');
  v_log := v_log || jsonb_build_object('paso','1_minimos','detalle',v_res::text);

  ---------------------------------------------------------------------------
  -- ② El dueño reserva. Acá viaja el consentimiento de teleconsulta: la RPC lo
  --    EXIGE y lo registra en la misma transacción, así que una teleconsulta
  --    con hold y sin consentimiento es inexpresable.
  ---------------------------------------------------------------------------
  EXECUTE format('SET LOCAL ROLE %I', k_rol_origen);
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', k_dueno, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  v_res := crear_bloqueo_agenda(
    k_prestador, k_oferta, k_mascota, k_fecha, k_hora,
    NULL,   -- p_modalidad: se DERIVA server-side de la categoría. No se dicta.
    NULL,   -- p_empleado_id: lo resuelve el motor.
    true    -- p_acepta_teleconsulta
  );
  v_log := v_log || jsonb_build_object('paso','2_reserva','detalle',v_res::text);

  v_cita := (v_res->>'cita_id')::uuid;
  IF v_cita IS NULL THEN
    RAISE EXCEPTION 'la_reserva_no_devolvio_cita_id: %', v_res;
  END IF;

  ---------------------------------------------------------------------------
  -- ③ El pago. Sandbox y DECLARADO como tal: no entra plata real.
  --
  -- 🔴 ESTE PASO CORRE COMO EL SERVIDOR, Y NO ES UN ATAJO.
  --    `confirmar_cita_pagada` está REVOCADA de `authenticated` desde S101
  --    (`D-855`): un cliente no puede declarar pagada su propia cita, y el
  --    ensayo lo confirmó rebotando con `42501` — *la defensa se probó, no se
  --    leyó*. En producción la llama el motor de pagos con `service_role`
  --    después del webhook. Acá la llama el rol de origen, que es el mismo
  --    lado del mostrador. **Lo que se saltea es el proveedor, no el gate.**
  ---------------------------------------------------------------------------
  EXECUTE format('SET LOCAL ROLE %I', k_rol_origen);
  v_res := confirmar_cita_pagada(v_cita);
  v_log := v_log || jsonb_build_object('paso','3_pago','detalle',v_res::text);
  v_log := v_log || jsonb_build_object('paso','4_cita_id','detalle',v_cita::text);

  ---------------------------------------------------------------------------
  -- ④ Se devuelve el switch a lo que estaba. **Antes del COMMIT**, así que
  --    ninguna sesión ve jamás el valor abierto.
  ---------------------------------------------------------------------------
  EXECUTE format('SET LOCAL ROLE %I', k_rol_origen);
  UPDATE tipos_servicio SET reservable = v_switch_previo WHERE codigo = 'telemedicina';

  ---------------------------------------------------------------------------
  -- ⑤ CINTURÓN. Si por lo que sea el switch no quedó como estaba, **aborta
  --    todo**: prefiero no tener semilla antes que dejar telemedicina abierta.
  ---------------------------------------------------------------------------
  IF (SELECT reservable FROM tipos_servicio WHERE codigo = 'telemedicina') IS DISTINCT FROM v_switch_previo THEN
    RAISE EXCEPTION 'cinturon: el switch no volvio a su valor previo';
  END IF;
  v_log := v_log || jsonb_build_object('paso','5_switch_restaurado','detalle','ok');
  INSERT INTO _semilla_res SELECT e->>'paso', e->>'detalle' FROM jsonb_array_elements(v_log) e;
END $$;

SELECT paso, detalle FROM _semilla_res ORDER BY paso;
