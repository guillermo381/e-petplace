-- ═══════════════════════════════════════════════════════════════════════════
-- S107 · A — EL PRECIO DEL DÍA DEJA DE SER OBLIGATORIO
--
-- Firma de la mesa (29-ago): **lo obligatorio no es el día: es AL MENOS UNA
-- modalidad con precio** — día, algún paquete, o mensual. *Las cuatro se
-- pueden apagar; las cuatro no.*
--
-- ── ④ LO QUE HABÍA QUE VERIFICAR, Y BLOQUEABA ─────────────────────────────
-- Medido: **`prestador_servicios.precio` es `NOT NULL DEFAULT 0`.** Un precio
-- de día nulo **no se podía guardar**. Se abre — y **el invariante se conserva
-- exactamente donde estaba**: un CHECK sigue exigiéndolo para **todos los
-- tipos salvo guardería**. *Abrir una columna compartida sin poner el CHECK
-- habría aflojado los otros cinco oficios de paso, que es justo lo que la
-- firma NO pidió.*
--
-- 🟢 Y lo que NO se rompe, medido antes de tocar: los tres lectores cobrables
-- (`_adiestramiento_`, `_vet_`, `_guarderia_ofertas_cobrables`) **ya exigen
-- `ps.precio IS NOT NULL`** en su WHERE. Una oferta sin precio **desaparece
-- sola de las vitrinas**, sin tocar un lector.
--
-- ⚠️ TRAMPA DECLARADA Y NO CURADA: el `DEFAULT 0` sigue ahí. Quien inserte
-- omitiendo la columna obtiene **`0`, que no es «sin precio»: es GRATIS**. No
-- se toca acá porque el default sirve a los otros oficios y quitarlo es su
-- decisión — **guardería siempre pasa NULL explícito.**
--
-- ── ①②③ LAS TRES REGLAS NUEVAS ────────────────────────────────────────────
-- **Publicar exige: franjas + capacidad + AL MENOS UN PRECIO.** Rebote nuevo:
-- **`sin_precios_configurados`**.
--
-- 🔴 **Y guardar sin ningún precio NO es un error:** guarda, **no publica**, y
-- **el estado es legible**. *Un prestador que configuró su capacidad y sus
-- ventanas y todavía no puso precio no perdió nada — y «visible» sigue siendo
-- verdad, que es lo que la palabra tiene que seguir significando.*
--
-- ── ⑤ LAS ESPECIES: EL CAMINO QUE YA USA GROOMING ─────────────────────────
-- `prestador_servicios.especies_compatibles`, **recortado contra el universo
-- del tipo por el trigger de la firma de dos capas** (`20260829040000`).
-- **No nace ningún camino nuevo** — la función sólo lo EXPONE.
--
-- Reversa: docs/relevamientos/S107-A-REVERSA-20260829080000-precio-opcional.sql
-- 76(g): 🔴 RIGE — el cinturón escribe una oferta real y la deshace en
--        subtransacción. Residuo medido contra LÍNEA BASE, jamás contra cero.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.prestador_servicios ALTER COLUMN precio DROP NOT NULL;

/* El invariante se conserva donde estaba: sólo guardería puede no tener
   precio de día, porque sólo guardería tiene otras tres modalidades. */
ALTER TABLE public.prestador_servicios
  ADD CONSTRAINT chk_precio_obligatorio_salvo_guarderia
  CHECK (precio IS NOT NULL OR tipo_servicio = 'guarderia_dia');

DROP FUNCTION IF EXISTS public.definir_oferta_guarderia(uuid, numeric, numeric, boolean);

CREATE FUNCTION public.definir_oferta_guarderia(
  p_prestador_id   uuid,
  p_precio_dia     numeric DEFAULT NULL,
  p_precio_mensual numeric DEFAULT NULL,
  p_activo         boolean DEFAULT true,
  p_especies       jsonb   DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid; v_recoge time; v_devuelve time; v_jornada int; v_capacidad int;
  v_paquetes int; v_hay_precio boolean; v_publica boolean; v_especies jsonb;
BEGIN
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;
  /* Los precios que SÍ vienen tienen que ser precios. `NULL` = «no ofrezco
     esta modalidad»; `0` o negativo = un error de quien lo escribió. */
  IF p_precio_dia IS NOT NULL AND p_precio_dia <= 0 THEN
    RAISE EXCEPTION 'precio_invalido' USING ERRCODE = '22023';
  END IF;
  IF p_precio_mensual IS NOT NULL AND p_precio_mensual <= 0 THEN
    RAISE EXCEPTION 'precio_mensual_invalido' USING ERRCODE = '22023';
  END IF;

  SELECT min(f.desde) FILTER (WHERE f.tipo = 'recogida'),
         max(f.hasta)  FILTER (WHERE f.tipo = 'devolucion')
    INTO v_recoge, v_devuelve
    FROM guarderia_franjas f WHERE f.prestador_id = p_prestador_id AND f.activo;
  IF v_recoge IS NULL OR v_devuelve IS NULL THEN
    RAISE EXCEPTION 'franjas_no_configuradas' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(sum(e.capacidad_por_dia), 0) INTO v_capacidad
    FROM guarderia_espacios e WHERE e.prestador_id = p_prestador_id AND e.activo;
  IF v_capacidad = 0 THEN
    RAISE EXCEPTION 'sin_espacios_configurados' USING ERRCODE = '22023';
  END IF;

  v_jornada := EXTRACT(epoch FROM (v_devuelve - v_recoge))::int / 60;
  IF v_jornada <= 0 THEN RAISE EXCEPTION 'franjas_se_cruzan' USING ERRCODE = '22023'; END IF;

  SELECT count(*) INTO v_paquetes
    FROM guarderia_paquetes gp WHERE gp.prestador_id = p_prestador_id AND gp.activo;

  /* 🔴 LA REGLA NUEVA: al menos UNA modalidad con precio. */
  v_hay_precio := (p_precio_dia IS NOT NULL) OR (p_precio_mensual IS NOT NULL) OR (v_paquetes > 0);

  IF p_activo AND NOT v_hay_precio THEN
    RAISE EXCEPTION 'sin_precios_configurados' USING ERRCODE = '22023';
  END IF;

  /* 🔴 Y SIN PRECIO NO ES UN ERROR: se guarda y NO se publica. El prestador no
     pierde su capacidad, sus ventanas ni sus especies. */
  v_publica := p_activo AND v_hay_precio;

  v_especies := COALESCE(
    p_especies,
    (SELECT ps.especies_compatibles FROM prestador_servicios ps
      WHERE ps.prestador_id = p_prestador_id AND ps.tipo_servicio = 'guarderia_dia'),
    (SELECT ts.especies_elegibles FROM tipos_servicio ts WHERE ts.codigo = 'guarderia_dia')
  );

  INSERT INTO prestador_servicios (
    prestador_id, tipo_servicio, precio, precio_mensual_plan,
    duracion_minutos, activo, reservable, atiende_local, atiende_domicilio,
    especies_compatibles
  ) VALUES (
    p_prestador_id, 'guarderia_dia', p_precio_dia, p_precio_mensual,
    v_jornada, v_publica, true, true, false, v_especies
  )
  ON CONFLICT (prestador_id) WHERE tipo_servicio = 'guarderia_dia'
    DO UPDATE SET precio               = EXCLUDED.precio,
                  precio_mensual_plan  = EXCLUDED.precio_mensual_plan,
                  duracion_minutos     = EXCLUDED.duracion_minutos,
                  activo               = EXCLUDED.activo,
                  especies_compatibles = EXCLUDED.especies_compatibles,
                  precio_paquete       = NULL
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', true, 'prestador_servicio_id', v_id,
    'jornada_minutos', v_jornada, 'capacidad_dia', v_capacidad,
    'publicada', v_publica,
    /* La pantalla no tiene que deducir por qué no se publicó. */
    'motivo_no_publicada', CASE WHEN v_publica THEN NULL
                                WHEN NOT v_hay_precio THEN 'sin_precio'
                                ELSE 'apagada_por_el_prestador' END);
END $$;

/* ③ EL ESTADO, LEGIBLE EN UN SOLO VIAJE — la pantalla lo pinta, no lo deduce
   ni lo arma con cuatro consultas. */
CREATE FUNCTION public.obtener_estado_guarderia(p_prestador_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_franjas int; v_cap int; v_paq int; v_ps record; v_estado text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_franjas FROM guarderia_franjas WHERE prestador_id = p_prestador_id AND activo;
  SELECT COALESCE(sum(capacidad_por_dia),0) INTO v_cap FROM guarderia_espacios WHERE prestador_id = p_prestador_id AND activo;
  SELECT count(*) INTO v_paq FROM guarderia_paquetes WHERE prestador_id = p_prestador_id AND activo;
  SELECT ps.precio, ps.precio_mensual_plan, ps.activo, ps.especies_compatibles
    INTO v_ps FROM prestador_servicios ps
   WHERE ps.prestador_id = p_prestador_id AND ps.tipo_servicio = 'guarderia_dia';

  v_estado := CASE
    WHEN v_ps IS NULL AND v_franjas = 0 AND v_cap = 0 THEN 'sin_empezar'
    WHEN v_franjas = 0                                THEN 'sin_franjas'
    WHEN v_cap = 0                                    THEN 'sin_capacidad'
    WHEN v_ps.precio IS NULL AND v_ps.precio_mensual_plan IS NULL AND v_paq = 0
                                                      THEN 'sin_precio'
    WHEN v_ps.activo                                  THEN 'publicada'
    ELSE 'apagada'
  END;

  RETURN jsonb_build_object(
    'estado', v_estado,
    'tiene_franjas', v_franjas > 0,
    'capacidad_dia', v_cap,
    'precio_dia', v_ps.precio,
    'precio_mensual', v_ps.precio_mensual_plan,
    'paquetes_activos', v_paq,
    'especies', COALESCE(v_ps.especies_compatibles, '[]'::jsonb),
    'publicada', COALESCE(v_ps.activo, false));
END $$;

REVOKE EXECUTE ON FUNCTION public.definir_oferta_guarderia(uuid, numeric, numeric, boolean, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_estado_guarderia(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.definir_oferta_guarderia(uuid, numeric, numeric, boolean, jsonb) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.obtener_estado_guarderia(uuid) TO authenticated;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
DO $c$
DECLARE
  v_rol text := current_user; v_prest uuid; v_titular uuid; v_esp uuid;
  v_err text; v_r jsonb; v_base int; v_residuo int;
BEGIN
  SELECT (SELECT count(*) FROM guarderia_espacios)+(SELECT count(*) FROM guarderia_franjas)
       + (SELECT count(*) FROM guarderia_paquetes)
       + (SELECT count(*) FROM prestador_servicios WHERE tipo_servicio='guarderia_dia')
    INTO v_base;

  SELECT p.id, p.user_id INTO v_prest, v_titular
    FROM prestadores p JOIN cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
   WHERE p.estado='activo' AND p.user_id IS NOT NULL AND cc.estado='activa'
     AND NOT EXISTS (SELECT 1 FROM guarderia_franjas f WHERE f.prestador_id = p.id)
     AND NOT EXISTS (SELECT 1 FROM prestador_servicios ps WHERE ps.prestador_id=p.id AND ps.tipo_servicio='guarderia_dia')
   LIMIT 1;
  IF v_prest IS NULL THEN RAISE EXCEPTION 'CINTURON ABORTA: no hay prestador sin configurar contra el cual medir.'; END IF;

  BEGIN
    INSERT INTO guarderia_espacios (prestador_id, nombre, capacidad_por_dia, dias_operacion)
      VALUES (v_prest,'__cint_precio__',3,ARRAY[0,1,2,3,4,5,6]) RETURNING id INTO v_esp;
    EXECUTE format('SET LOCAL ROLE %I','authenticated');
    PERFORM set_config('request.jwt.claims', json_build_object('sub',v_titular::text,'role','authenticated')::text, true);
    PERFORM public.definir_franja_guarderia(v_prest,'recogida','07:00','09:00',ARRAY[0,1,2,3,4,5,6]);
    PERFORM public.definir_franja_guarderia(v_prest,'devolucion','16:30','18:30',ARRAY[0,1,2,3,4,5,6]);

    -- A1 · PUBLICAR SIN NINGÚN PRECIO REBOTA, con su código propio
    BEGIN
      PERFORM public.definir_oferta_guarderia(v_prest, NULL, NULL, true);
      RAISE EXCEPTION 'A1 ROJO: publico una guarderia sin ningun precio.';
    EXCEPTION WHEN sqlstate '22023' THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      IF v_err <> 'sin_precios_configurados' THEN
        RAISE EXCEPTION 'A1 ROJO: rebotó por "%", no por sin_precios_configurados.', v_err;
      END IF;
    END;

    -- A2 · GUARDAR SIN PRECIO **NO** ES UN ERROR: guarda y no publica
    v_r := public.definir_oferta_guarderia(v_prest, NULL, NULL, false);
    IF (v_r->>'publicada')::boolean IS NOT FALSE OR (v_r->>'motivo_no_publicada') <> 'sin_precio' THEN
      RAISE EXCEPTION 'A2 ROJO: guardar sin precio deberia dar publicada=false y motivo sin_precio. Dio %', v_r;
    END IF;
    IF (public.obtener_estado_guarderia(v_prest)->>'estado') <> 'sin_precio' THEN
      RAISE EXCEPTION 'A2 ROJO: el estado deberia ser legible como `sin_precio`.';
    END IF;

    -- A3 · CON SOLO MENSUAL (sin dia) PUBLICA — el dia dejo de ser obligatorio
    v_r := public.definir_oferta_guarderia(v_prest, NULL, 320, true);
    IF (v_r->>'publicada')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'A3 ROJO: con precio mensual y sin dia deberia publicar. Dio %', v_r;
    END IF;
    IF (SELECT precio FROM prestador_servicios WHERE prestador_id=v_prest AND tipo_servicio='guarderia_dia') IS NOT NULL THEN
      RAISE EXCEPTION 'A3 ROJO: el precio del dia deberia haber quedado NULL.';
    END IF;

    -- A4 · CON SOLO UN PAQUETE tambien publica
    PERFORM public.definir_paquete_guarderia(v_prest, 10, 200);
    v_r := public.definir_oferta_guarderia(v_prest, NULL, NULL, true);
    IF (v_r->>'publicada')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'A4 ROJO: con un paquete activo deberia publicar. Dio %', v_r;
    END IF;

    -- A5 · LAS ESPECIES SE EXPONEN Y SE RECORTAN contra {perro,gato}
    v_r := public.definir_oferta_guarderia(v_prest, 25, NULL, true, '["perro","equino"]'::jsonb);
    IF (SELECT especies_compatibles FROM prestador_servicios
         WHERE prestador_id=v_prest AND tipo_servicio='guarderia_dia') ? 'equino' THEN
      RAISE EXCEPTION 'A5 ROJO: entro una especie fuera del universo del tipo.';
    END IF;
    IF NOT ((SELECT especies_compatibles FROM prestador_servicios
              WHERE prestador_id=v_prest AND tipo_servicio='guarderia_dia') ? 'perro') THEN
      RAISE EXCEPTION 'A5 ROJO: el recorte se llevo puesta una especie legitima.';
    END IF;

    -- A6 · EL OTRO OFICIO SIGUE OBLIGADO: el CHECK no se aflojo de paso
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    BEGIN
      UPDATE prestador_servicios SET precio = NULL
       WHERE tipo_servicio = 'paseo' AND precio IS NOT NULL;
      RAISE EXCEPTION 'A6 ROJO: un paseo pudo quedarse sin precio.';
    EXCEPTION WHEN check_violation THEN NULL;
    END;

    RAISE EXCEPTION 'CINTURON_OK::6';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    IF v_err NOT LIKE 'CINTURON_OK::%' THEN RAISE; END IF;
  END;

  SELECT (SELECT count(*) FROM guarderia_espacios)+(SELECT count(*) FROM guarderia_franjas)
       + (SELECT count(*) FROM guarderia_paquetes)
       + (SELECT count(*) FROM prestador_servicios WHERE tipo_servicio='guarderia_dia')
    INTO v_residuo;
  IF v_residuo <> v_base THEN
    RAISE EXCEPTION 'CINTURON ROJO: % fila(s) de residuo (base %, ahora %).', v_residuo-v_base, v_base, v_residuo;
  END IF;
  RAISE NOTICE '✅ CINTURON PRECIO OPCIONAL: 6/6 (publicar sin precio rebota · guardar sin precio guarda y no publica · solo mensual publica · solo paquete publica · las especies se recortan · el paseo sigue obligado) · residuo 0';
END $c$;

COMMIT;
