/* ═══════════════════════════════════════════════════════════════════════════
   S112-A10 · REPORTAR UNA PUBLICACION · DESISTIR · EL MEMORIAL
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.** Tabla nueva vacia, dos CHECKs ensanchados sobre
   una tabla cuyas filas vivas siguen siendo validas, dos funciones.

   ── 🔴 `desistida` EXIGE TOCAR **DOS** CONSTRAINTS, Y LO MIDIO D:
      `chk_cierre_coherente` sólo admite `cerrada_en` para `aceptada` y
      `declinada` ⇒ **una solicitud `desistida` no se puede ni escribir como
      cerrada, y sin `cerrada_en` la purga de 90 dias JAMAS la ve.**

      *Tocar solo el CHECK del estado deja el borrado de identidad tan
      incumplido como antes, y en silencio.* Es la clase que este vertical ya
      cobro tres veces hoy: **el censo casi siempre encuentra una segunda puerta
      al mismo defecto.**

   ── DESISTIR NO ES DECLINAR, y por eso es un estado propio. Declinar es del
      PUBLICADOR; desistir es de la FAMILIA. Reusar `declinada` haria que el
      refugio viera «yo la declinè» sobre alguien que se fue solo — y el hilo
      queda en lectura para los dos, con la misma dignidad.

   ── 🔴 QUIEN REPORTA NO SE REVELA (N2). El refugio **no puede** leer la tabla:
      su policy de SELECT es sólo del reportante y del admin. *Un reporte cuyo
      autor el reportado puede ver no es un reporte: es una confrontacion.*

   ── EL MEMORIAL NO NECESITA MOTOR NUEVO: vive en `mascotas.estado_vida` y los
      tres lectores lo derivan (`obtener_adoptables` lo excluye en la vista,
      `obtener_mis_adoptables` lo devuelve como estado, `obtener_mi_adoptable`
      tambien). *Lo unico que faltaba era que la ficha no desapareciera en
      silencio, y no desaparece: el refugio la sigue viendo con su estado.*
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

/* ── ① LOS DOS CONSTRAINTS, JUNTOS ───────────────────────────────────────── */
ALTER TABLE public.adopcion_solicitud DROP CONSTRAINT IF EXISTS adopcion_solicitud_estado_check;
ALTER TABLE public.adopcion_solicitud DROP CONSTRAINT IF EXISTS chk_cierre_coherente;

ALTER TABLE public.adopcion_solicitud ADD CONSTRAINT adopcion_solicitud_estado_check
  CHECK (estado = ANY (ARRAY['recibida','en_conversacion','aceptada','declinada','desistida']));

ALTER TABLE public.adopcion_solicitud ADD CONSTRAINT chk_cierre_coherente
  CHECK ((estado = ANY (ARRAY['recibida','en_conversacion']) AND cerrada_en IS NULL)
      OR (estado = ANY (ARRAY['aceptada','declinada','desistida']) AND cerrada_en IS NOT NULL));

/* ── ② DESISTIR ──────────────────────────────────────────────────────────── */
CREATE OR REPLACE FUNCTION public.desistir_solicitud_adopcion(p_solicitud_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_uid uuid := auth.uid(); v_estado text; v_mio boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT s.estado, s.solicitante_user_id = v_uid INTO v_estado, v_mio
    FROM adopcion_solicitud s WHERE s.id = p_solicitud_id FOR UPDATE;
  IF v_estado IS NULL THEN RAISE EXCEPTION 'solicitud_no_existe' USING ERRCODE='22023'; END IF;
  /* 🔴 SOLO la familia desiste. Si el publicador pudiera, tendria una forma de
     cerrar una solicitud sin que quede escrito que la declinó él. */
  IF NOT v_mio THEN RAISE EXCEPTION 'solo_el_solicitante_desiste' USING ERRCODE='42501'; END IF;
  IF v_estado NOT IN ('recibida','en_conversacion') THEN
    RAISE EXCEPTION 'solicitud_terminal: %', v_estado USING ERRCODE='22023';
  END IF;

  UPDATE adopcion_solicitud SET estado='desistida', cerrada_en=now() WHERE id = p_solicitud_id;
  RETURN jsonb_build_object('ok', true, 'estado', 'desistida');
END $fn$;
REVOKE ALL ON FUNCTION public.desistir_solicitud_adopcion(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.desistir_solicitud_adopcion(uuid) TO authenticated;

/* ── ③ REPORTAR (N2) ─────────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS public.adopcion_reporte (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacion_id uuid NOT NULL REFERENCES public.adopcion_publicacion(id) ON DELETE CASCADE,
  reportado_por  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  motivo         text NOT NULL,
  detalle        text,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  atendido_en    timestamptz,
  CONSTRAINT chk_motivo_reporte CHECK (
    motivo IN ('maltrato','venta_encubierta','datos_falsos','no_es_adopcion','otro')),
  CONSTRAINT chk_detalle_largo CHECK (detalle IS NULL OR length(detalle) <= 2000)
);
CREATE INDEX IF NOT EXISTS ix_reporte_publicacion ON public.adopcion_reporte (publicacion_id);
/* Un reporte por persona y publicacion: sin esto, el mismo toque repetido
   inflaria el conteo y haria parecer grave lo que es un doble tap. */
CREATE UNIQUE INDEX IF NOT EXISTS uq_reporte_por_persona
  ON public.adopcion_reporte (publicacion_id, reportado_por) WHERE reportado_por IS NOT NULL;

ALTER TABLE public.adopcion_reporte ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS adopcion_reporte_select ON public.adopcion_reporte;
/* 🔴 EL REFUGIO NO ESTA EN ESTA POLICY, y es el punto entero de N2. */
CREATE POLICY adopcion_reporte_select ON public.adopcion_reporte FOR SELECT TO authenticated
  USING (reportado_por = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.reportar_publicacion(
  p_publicacion_id uuid, p_motivo text, p_detalle text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_uid uuid := auth.uid(); v_id uuid; v_ya uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF p_motivo NOT IN ('maltrato','venta_encubierta','datos_falsos','no_es_adopcion','otro') THEN
    RAISE EXCEPTION 'motivo_no_valido: %', p_motivo USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM adopcion_publicacion WHERE id = p_publicacion_id) THEN
    RAISE EXCEPTION 'publicacion_no_existe' USING ERRCODE='22023';
  END IF;

  /* Idempotente y hablada: el segundo toque devuelve el que ya existe en vez de
     un `23505` crudo — y sobre un acto delicado, un error tecnico se lee como
     «no se pudo denunciar» (`L-424`). */
  SELECT id INTO v_ya FROM adopcion_reporte
   WHERE publicacion_id = p_publicacion_id AND reportado_por = v_uid;
  IF v_ya IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'reporte_id', v_ya, 'ya_existia', true);
  END IF;

  INSERT INTO adopcion_reporte (publicacion_id, reportado_por, motivo, detalle)
       VALUES (p_publicacion_id, v_uid, p_motivo, NULLIF(btrim(COALESCE(p_detalle,'')), ''))
    RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'reporte_id', v_id, 'ya_existia', false);
END $fn$;
REVOKE ALL ON FUNCTION public.reportar_publicacion(uuid,text,text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.reportar_publicacion(uuid,text,text) TO authenticated;

DO $cint$
DECLARE v_admin uuid; v_pub uuid; v_r jsonb; v_n int;
BEGIN
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin::text, 'role','authenticated')::text, true);
  SELECT id INTO v_pub FROM adopcion_publicacion LIMIT 1;
  IF v_pub IS NULL THEN RAISE EXCEPTION 'CINTURON: no hay publicacion para medir'; END IF;

  -- ① ✅ POSITIVO PRIMERO (enunciado de E): si el caso que DEBE pasar no pasa,
  --    ningun rojo de abajo significa nada.
  v_r := public.reportar_publicacion(v_pub, 'datos_falsos', 'sonda del cinturon');
  IF (v_r->>'ok')::boolean IS NOT TRUE OR (v_r->>'ya_existia')::boolean IS NOT FALSE THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: un reporte legitimo no entro: %', v_r;
  END IF;

  -- ② El segundo toque es idempotente y HABLA, no tira un 23505 crudo.
  v_r := public.reportar_publicacion(v_pub, 'otro', NULL);
  IF (v_r->>'ya_existia')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'CINTURON ROJO ②: el segundo reporte no fue idempotente';
  END IF;

  -- ③ 🔴 Un motivo inventado rebota con su nombre.
  BEGIN
    PERFORM public.reportar_publicacion(v_pub, 'porque_si', NULL);
    RAISE EXCEPTION 'CINTURON ROJO ③: un motivo inventado entro';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;

  -- ④ 🔴 EL REFUGIO NO ESTA EN LA POLICY DE LECTURA. Se mide sobre el texto de
  --    la policy porque el brazo tiene que fallar si alguien la ensancha.
  IF (SELECT pg_get_expr(polqual, polrelid) FROM pg_policy
       WHERE polrelid='public.adopcion_reporte'::regclass AND polname='adopcion_reporte_select')
     ~ 'publico_esta_publicacion|gestiona_cuenta_refugio' THEN
    RAISE EXCEPTION 'CINTURON ROJO ④: el refugio puede leer quien lo reportó';
  END IF;

  -- ⑤ 🔴 `desistida` ENTRA EN LAS DOS CONSTRAINTS. El rojo es el de D: sin la
  --    segunda, la fila no se puede escribir como CERRADA y la purga no la ve.
  BEGIN
    INSERT INTO adopcion_solicitud (publicacion_id, solicitante_user_id, country_code,
                                    estado, cerrada_en)
    VALUES (v_pub, v_admin, 'EC', 'desistida', now());
    DELETE FROM adopcion_solicitud WHERE publicacion_id=v_pub AND solicitante_user_id=v_admin;
  EXCEPTION WHEN check_violation THEN
    RAISE EXCEPTION 'CINTURON ROJO ⑤: una solicitud desistida no se puede cerrar — la purga jamas la veria';
  END;

  -- ⑥ CONTROL NEGATIVO de ⑤: un estado inventado SIGUE rebotando. Sin este
  --    brazo, ensanchar el CHECK a cualquier cosa habria pasado ⑤.
  BEGIN
    INSERT INTO adopcion_solicitud (publicacion_id, solicitante_user_id, country_code, estado)
    VALUES (v_pub, v_admin, 'EC', 'abandonada');
    RAISE EXCEPTION 'CINTURON ROJO ⑥: el CHECK del estado dejo de discriminar';
  EXCEPTION WHEN check_violation THEN NULL; END;

  -- ⑦ La purga clasifica el estado nuevo: si D dejo `desistida` sin clasificar,
  --    suena acá y no dentro de tres meses.
  PERFORM public.purgar_postulaciones_vencidas();

  RAISE NOTICE 'CINTURON A10: 7 brazos verdes (3 rojos producidos, 1 positivo primero, 1 control negativo)';

  DELETE FROM adopcion_reporte WHERE publicacion_id = v_pub AND reportado_por = v_admin;
  SELECT count(*) INTO v_n FROM adopcion_reporte;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: residuo % reporte(s)', v_n; END IF;
END $cint$;

COMMIT;
