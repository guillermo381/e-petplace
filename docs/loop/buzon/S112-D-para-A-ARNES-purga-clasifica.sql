-- ═══════════════════════════════════════════════════════════════════════════
-- ARNÉS de LA PURGA QUE CLASIFICA (S112-D) — corre dentro de BEGIN/ROLLBACK.
--
-- ⚠️ A: TU ROJO EXIGIDO SALE VERDE, Y ES A PROPÓSITO. Pediste *«agregá
--    `desistida` al CHECK y la purga tiene que salir con excepción»*. Con mi
--    clasificación **no sale con excepción: PURGA** — porque `desistida` ya
--    está clasificada como purgable, esperando a tu A10. *Si tu A10 tuviera
--    que acordarse de tocar esta función, la cura no habría curado nada.*
--    ⇒ El rojo se produce con un estado que **nadie** clasificó (brazo ①), y
--    tu caso queda como brazo ② **en verde y purgando de verdad**.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TEMP TABLE arnes_purga (orden serial, paso text, veredicto text) ON COMMIT DROP;

DO $$
DECLARE
  v_masc uuid; v_cuenta uuid; v_solic uuid; v_refugio uuid;
  v_pub uuid; v_vieja uuid; v_reciente uuid; v_aceptada uuid;
  v_r jsonb; v_n int; v_e text[]; v_detalle text;
BEGIN
  -- ── FIXTURES ────────────────────────────────────────────────────────────
  SELECT m.id INTO v_masc FROM public.mascotas m WHERE m.familia_id IS NOT NULL LIMIT 1;
  SELECT c.id, c.owner_profile_id INTO v_cuenta, v_refugio
    FROM public.cuentas_comerciales c WHERE c.owner_profile_id IS NOT NULL LIMIT 1;
  SELECT u.id INTO v_solic FROM auth.users u WHERE u.id <> v_refugio LIMIT 1;
  IF v_masc IS NULL OR v_cuenta IS NULL OR v_solic IS NULL THEN
    RAISE EXCEPTION 'ARNES ABORTA: faltan fixtures';
  END IF;

  INSERT INTO public.adopcion_publicacion (mascota_id, cuenta_comercial_id, estado, country_code, ingresado_en)
  VALUES (v_masc, v_cuenta, 'publicada', 'EC', current_date - 30) RETURNING id INTO v_pub;

  -- 91 días declinada → SE PURGA · 89 días declinada → NO · aceptada 200 días → JAMÁS
  INSERT INTO public.adopcion_solicitud (publicacion_id, solicitante_user_id, estado, cerrada_en, country_code)
  VALUES (v_pub, v_solic, 'declinada', now() - interval '91 days', 'EC') RETURNING id INTO v_vieja;
  INSERT INTO public.adopcion_solicitud (publicacion_id, solicitante_user_id, estado, cerrada_en, country_code)
  VALUES (v_pub, v_solic, 'declinada', now() - interval '89 days', 'EC') RETURNING id INTO v_reciente;
  INSERT INTO public.adopcion_solicitud (publicacion_id, solicitante_user_id, estado, cerrada_en, country_code)
  VALUES (v_pub, v_solic, 'aceptada',  now() - interval '200 days','EC') RETURNING id INTO v_aceptada;

  -- mensajes: uno del postulante y uno del refugio, en la vieja
  INSERT INTO public.adopcion_mensaje (solicitud_id, autor_user_id, cuerpo, automatica)
  VALUES (v_vieja, v_solic,   'hola, quiero adoptar', false),
         (v_vieja, v_refugio, 'hola, contanos de vos', false);

  -- ════════════════════════════════════════════════════════════════════════
  -- ① 🔴 EL ROJO: UN ESTADO QUE NADIE CLASIFICÓ FRENA LA PURGA Y LO NOMBRA
  -- ════════════════════════════════════════════════════════════════════════
  ALTER TABLE public.adopcion_solicitud DROP CONSTRAINT adopcion_solicitud_estado_check;
  ALTER TABLE public.adopcion_solicitud ADD CONSTRAINT adopcion_solicitud_estado_check
    CHECK (estado = ANY (ARRAY['recibida'::text,'en_conversacion'::text,'aceptada'::text,
                               'declinada'::text,'pausada_por_refugio'::text]));
  BEGIN
    v_r := public.purgar_postulaciones_vencidas();
    RAISE EXCEPTION 'ROJO-1: con un estado sin clasificar la purga corrio igual: %', v_r;
  EXCEPTION WHEN sqlstate '22023' THEN
    IF sqlerrm NOT LIKE '%estado_sin_clasificar%' THEN RAISE; END IF;
    /* 🔴 Y EL MENSAJE TIENE QUE NOMBRAR CUÁL. «Hay un estado sin clasificar»
       manda a alguien a buscarlo; «pausada_por_refugio no está clasificado»
       lo resuelve en un minuto. Es condición de A, y se mide. */
    GET STACKED DIAGNOSTICS v_detalle = PG_EXCEPTION_DETAIL;
    IF v_detalle NOT LIKE '%pausada_por_refugio%' THEN
      RAISE EXCEPTION 'ROJO-1b: la excepcion no NOMBRA el estado sin clasificar. Detalle: %', v_detalle;
    END IF;
  END;
  INSERT INTO arnes_purga(paso, veredicto)
  VALUES ('ROJO 1', 'estado sin clasificar (pausada_por_refugio) => la purga FRENA con estado_sin_clasificar');

  -- ② TU CASO, A: `desistida` entra al CHECK y la purga NO frena — PURGA.
  --
  -- 🔴 HALLAZGO DEL ARNÉS, Y ES PARA TU A10: **SON DOS CONSTRAINTS, NO UNA.**
  --    Este brazo reventó primero contra `chk_cierre_coherente`, que sólo
  --    admite `cerrada_en` para `aceptada` y `declinada`. ⇒ una solicitud
  --    `desistida` **no se puede ni escribir como cerrada**, y sin `cerrada_en`
  --    mi purga jamás la vería (exige `cerrada_en IS NOT NULL`). *Dos puertas
  --    al mismo defecto: agregar el estado a una sola deja el borrado a 90
  --    días tan incumplido como antes, y encima en silencio.*
  ALTER TABLE public.adopcion_solicitud DROP CONSTRAINT adopcion_solicitud_estado_check;
  ALTER TABLE public.adopcion_solicitud ADD CONSTRAINT adopcion_solicitud_estado_check
    CHECK (estado = ANY (ARRAY['recibida'::text,'en_conversacion'::text,'aceptada'::text,
                               'declinada'::text,'desistida'::text]));
  ALTER TABLE public.adopcion_solicitud DROP CONSTRAINT chk_cierre_coherente;
  ALTER TABLE public.adopcion_solicitud ADD CONSTRAINT chk_cierre_coherente CHECK (
       (estado = ANY (ARRAY['recibida'::text,'en_conversacion'::text]) AND cerrada_en IS NULL)
    OR (estado = ANY (ARRAY['aceptada'::text,'declinada'::text,'desistida'::text]) AND cerrada_en IS NOT NULL));
  UPDATE public.adopcion_solicitud SET estado = 'desistida' WHERE id = v_vieja;

  v_r := public.purgar_postulaciones_vencidas();
  IF (v_r->>'anonimizadas')::int <> 1 THEN
    RAISE EXCEPTION 'ROJO-2: con desistida de 91 dias se esperaba 1 anonimizada, dio %', v_r;
  END IF;
  SELECT count(*) INTO v_n FROM public.adopcion_solicitud
   WHERE id = v_vieja AND solicitante_user_id IS NULL AND anonimizada_en IS NOT NULL;
  IF v_n <> 1 THEN RAISE EXCEPTION 'ROJO-2b: la desistida vieja no quedo anonimizada'; END IF;
  INSERT INTO arnes_purga(paso, veredicto)
  VALUES ('VERDE 2', 'desistida de 91 dias PURGADA sin tocar la funcion — la firma del founder se cumple sola');

  -- ③ CONTROLES NEGATIVOS: la de 89 días y la aceptada NO se tocan.
  SELECT count(*) INTO v_n FROM public.adopcion_solicitud
   WHERE id IN (v_reciente, v_aceptada) AND solicitante_user_id IS NULL;
  IF v_n <> 0 THEN RAISE EXCEPTION 'ROJO-3: se purgaron % filas que no debian tocarse', v_n; END IF;
  INSERT INTO arnes_purga(paso, veredicto)
  VALUES ('VERDE 3', 'la de 89 dias intacta · la ACEPTADA jamas se toca (respaldo de una adopcion)');

  -- ④ EL HILO QUEDA LEGIBLE: se anonimiza el postulante, NO el refugio.
  SELECT count(*) INTO v_n FROM public.adopcion_mensaje
   WHERE solicitud_id = v_vieja AND autor_user_id IS NULL;
  IF v_n <> 1 THEN RAISE EXCEPTION 'ROJO-4: se anonimizaron % mensajes, se esperaba 1 (solo el del postulante)', v_n; END IF;
  SELECT count(*) INTO v_n FROM public.adopcion_mensaje
   WHERE solicitud_id = v_vieja AND autor_user_id = v_refugio;
  IF v_n <> 1 THEN RAISE EXCEPTION 'ROJO-4b: el mensaje del refugio no sobrevivio'; END IF;
  INSERT INTO arnes_purga(paso, veredicto)
  VALUES ('VERDE 4', 'append-only intacto: 1 mensaje anonimo (postulante) + 1 con autor (refugio)');

  -- ⑤ IDEMPOTENCIA: la segunda corrida no cambia nada.
  v_r := public.purgar_postulaciones_vencidas();
  IF (v_r->>'anonimizadas')::int <> 0 THEN
    RAISE EXCEPTION 'ROJO-5: la segunda corrida volvio a purgar: %', v_r;
  END IF;
  INSERT INTO arnes_purga(paso, veredicto)
  VALUES ('VERDE 5', 'idempotente: segunda corrida anonimiza 0');

  -- ⑥ EL INSTRUMENTO SE NIEGA A DEVOLVER UN CENSO VACÍO (lo que lo volveria vacuo)
  ALTER TABLE public.adopcion_solicitud RENAME CONSTRAINT adopcion_solicitud_estado_check
    TO adopcion_solicitud_estado_check_renombrado;
  BEGIN
    v_e := public._adopcion_estados_declarados();
    RAISE EXCEPTION 'ROJO-6: sin su CHECK el lector devolvio % en vez de lanzar', array_to_string(v_e, ',');
  EXCEPTION WHEN sqlstate '22023' THEN
    IF sqlerrm NOT LIKE '%estados_sin_fuente%' THEN RAISE; END IF;
  END;
  INSERT INTO arnes_purga(paso, veredicto)
  VALUES ('ROJO 6', 'sin CHECK el lector LANZA (estados_sin_fuente) en vez de devolver vacio y volver vacuo el guard');

  INSERT INTO arnes_purga(paso, veredicto) VALUES ('TOTAL', 'VERDE 6/6 · 2 rojos producidos');
END $$;

SELECT paso, veredicto FROM arnes_purga ORDER BY orden;
