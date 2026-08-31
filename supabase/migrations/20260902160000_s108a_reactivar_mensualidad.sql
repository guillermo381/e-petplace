-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A-2 · REACTIVAR LA MENSUALIDAD — cancelar la cancelación
--
-- 76(g) VEDA: **NO RIGE.** Función + trigger nuevos. Cero backfill.
-- REVERSA: `docs/relevamientos/2026-09-02-s108a-REVERSA-M8.sql`.
--
-- ═══ LA LETRA ══════════════════════════════════════════════════════════════
-- ⚠️ **LA FIRMA LLEGÓ RELATADA POR S108-C, NO DIRECTO DEL FOUNDER.** Se declara
--    acá para que se pueda vetar leyendo esta migración: *una firma que viaja
--    por una pista es una firma que alguien transcribió.* Lo sustantivo, según C:
--
--  · **Dentro del período pagado, reactivar es CANCELAR LA CANCELACIÓN:** no
--    cobra de nuevo, no re-ancla, la renovación vuelve.
--  · **Fuera del período NO es reactivación: es contratar de nuevo**, con cobro
--    y ancla nuevos. Ese camino ya existe.
--  · Criterio de construcción, verbatim: *«construilo de modo que el caso
--    intermedio no se pueda expresar»*.
--
-- ⇒ Esto contesta las dos preguntas que A-1 dejó ABIERTAS a propósito en su
--   §⑩ (¿re-ancla? ¿cobra?) y las contesta **con un NO cada una**, siempre que
--   el período siga vivo. Sin esa letra no se construía — y se dice porque el
--   hueco no era técnico.
--
-- ═══ POR QUÉ SON DOS CAPAS Y NO UNA — `L-424` ══════════════════════════════
-- El founder pidió que el caso intermedio sea **inexpresable**, no que esté
-- guardado. Pero un CHECK no puede mirar la fecha de hoy (`hoy_local()` no es
-- inmutable) ⇒ el piso tiene que ser un TRIGGER.
-- Y un piso solo no alcanza: **un guard que sólo sabe negarse manda a la
-- familia a adivinar**. Por eso van las dos capas de `L-424`:
--   · el TRIGGER, que no se puede saltear ni desde otra función futura
--   · la RPC, que EXPLICA y devuelve el camino ("esto ya no se reactiva, se
--     contrata de nuevo")
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ① EL PISO: la transición a `activa` sobre un período vencido no existe ──
CREATE OR REPLACE FUNCTION public._trg_susc_guarderia_no_revive_vencida()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp' AS $fn$
BEGIN
  /* 🔴 ACOTADO A LA TRANSICIÓN, y eso importa: un mandato NUEVO nace `activa`
     con `periodo_hasta` NULL —todavía no se cobró— y tiene que poder nacer.
     Lo que se vuelve imposible es **revivir** uno cancelado cuyo período ya
     terminó. *Escribir el guard sobre el estado en vez de sobre la transición
     habría roto la contratación, que es el camino más caminado.* */
  IF OLD.estado = 'cancelada' AND NEW.estado = 'activa' THEN
    IF NEW.periodo_hasta IS NULL OR NEW.periodo_hasta < public.hoy_local() THEN
      RAISE EXCEPTION 'periodo_vencido_no_se_reactiva' USING ERRCODE='22023';
    END IF;
  END IF;
  RETURN NEW;
END $fn$;

CREATE TRIGGER trg_susc_guarderia_no_revive_vencida
  BEFORE UPDATE OF estado ON public.guarderia_suscripciones
  FOR EACH ROW EXECUTE FUNCTION public._trg_susc_guarderia_no_revive_vencida();

-- ── ② LA PUERTA: la que explica ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reactivar_mensualidad_guarderia(p_suscripcion_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $fn$
DECLARE v_auth uuid := auth.uid(); v_fam uuid; v_s record; v_ya uuid;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm
   WHERE fm.user_id = v_auth AND fm.hasta IS NULL LIMIT 1;
  IF v_fam IS NULL THEN RAISE EXCEPTION 'sin_familia' USING ERRCODE='22023'; END IF;

  SELECT * INTO v_s FROM guarderia_suscripciones
   WHERE id = p_suscripcion_id AND familia_id = v_fam FOR UPDATE;
  IF v_s.id IS NULL THEN RAISE EXCEPTION 'plan_no_existe' USING ERRCODE='22023'; END IF;

  /* Idempotente: dos toques del mismo botón no son un error. */
  IF v_s.estado = 'activa' THEN
    RETURN jsonb_build_object('ok', true, 'ya_estaba', true, 'suscripcion_id', v_s.id);
  END IF;
  IF v_s.estado <> 'cancelada' THEN
    RAISE EXCEPTION 'plan_no_cancelado: %', v_s.estado USING ERRCODE='22023';
  END IF;

  /* 🔴 EL REBOTE CON SU CAMINO, no sólo con su no. *«Esto ya no se reactiva»
     sin decir qué sí se puede hacer deja a la familia mirando un botón muerto.*
     El código es propio y la pantalla lleva a contratar de nuevo. */
  IF v_s.periodo_hasta IS NULL OR v_s.periodo_hasta < public.hoy_local() THEN
    RAISE EXCEPTION 'periodo_vencido_contratar_de_nuevo' USING ERRCODE='22023';
  END IF;

  /* Y el otro rebote que hay que explicar: mientras estuvo cancelada, la
     familia pudo contratar OTRO plan en el mismo lugar. `uq_susc_viva_por_lugar`
     lo impediría con un `duplicate key` crudo — el defecto exacto de `L-424`. */
  SELECT s.id INTO v_ya FROM guarderia_suscripciones s
   WHERE s.familia_id = v_fam AND s.prestador_id = v_s.prestador_id
     AND s.estado = 'activa' AND s.id <> v_s.id LIMIT 1;
  IF v_ya IS NOT NULL THEN
    RAISE EXCEPTION 'ya_tienes_plan_activo: %', v_ya USING ERRCODE='22023';
  END IF;

  /* CANCELAR LA CANCELACIÓN: nada más. No cobra, no re-ancla, no toca el
     período. `cancelada_en` vuelve a NULL porque `chk_susc_cancelacion_coherente`
     lo EXIGE — el invariante se defiende solo. */
  UPDATE guarderia_suscripciones
     SET estado = 'activa', cancelada_en = NULL, updated_at = now()
   WHERE id = v_s.id;

  RETURN jsonb_build_object('ok', true, 'suscripcion_id', v_s.id,
    'corre_hasta', v_s.periodo_hasta, 'cobrada_de_nuevo', false,
    'nota', 'se cancelo la cancelacion: la renovacion vuelve, sin cobro nuevo');
END $fn$;

-- L-140
REVOKE EXECUTE ON FUNCTION public.reactivar_mensualidad_guarderia(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reactivar_mensualidad_guarderia(uuid) TO authenticated;

-- ═══ CINTURÓN — con CONTROL POSITIVO, que en esta sesión ya salvó una tanda ══
DO $c$
DECLARE v_s uuid; v_user uuid; v_r jsonb; v_estado text; v_ok boolean;
BEGIN
  SELECT id, autorizada_por INTO v_s, v_user FROM guarderia_suscripciones LIMIT 1;
  IF v_s IS NULL THEN RAISE EXCEPTION 'cinturon: sin mandato con que DISCRIMINAR'; END IF;

  /* (a) CONTROL POSITIVO — la contratación sigue pudiendo nacer `activa` con
     periodo_hasta NULL. *Si el trigger rompiera esto, la migración saldría
     verde y dejaría sin contratar a todo el mundo.* */
  UPDATE guarderia_suscripciones SET estado='cancelada', cancelada_en=now() WHERE id=v_s;
  INSERT INTO guarderia_suscripciones (familia_id, prestador_id, prestador_servicio_id,
    tarjeta_id, autorizada_por, monto_esperado, precio_mensual, estado)
  SELECT g.familia_id, g.prestador_id, g.prestador_servicio_id, g.tarjeta_id,
         g.autorizada_por, g.monto_esperado, g.precio_mensual, 'activa'
    FROM guarderia_suscripciones g WHERE g.id=v_s;
  RAISE NOTICE 'cinturon M8 (a): la contratacion nueva sigue naciendo activa ✅';

  /* 🔴 Y SE APARTA, o el arnés se pisa a sí mismo. La fila que (a) acaba de
     crear queda `activa` en el mismo lugar ⇒ los brazos (c) y (d) rebotarían
     con `ya_tienes_plan_activo`, que es **el guard funcionando** y no lo que
     esos brazos vienen a medir. *Un arnés que choca contra su propia siembra
     reporta un rojo del instrumento con cara de rojo del motor* (`L-437`). */
  UPDATE guarderia_suscripciones SET estado='cancelada', cancelada_en=now()
   WHERE estado='activa' AND id <> v_s;

  -- (b) 🔴 EL PISO: revivir con período vencido es INEXPRESABLE, ni por SQL directo
  UPDATE guarderia_suscripciones
     SET periodo_desde = public.hoy_local() - 60, periodo_hasta = public.hoy_local() - 30
   WHERE id = v_s;
  v_ok := false;
  BEGIN
    UPDATE guarderia_suscripciones SET estado='activa', cancelada_en=NULL WHERE id=v_s;
    v_ok := true;
  EXCEPTION WHEN sqlstate '22023' THEN
    IF SQLERRM NOT LIKE 'periodo_vencido_no_se_reactiva%' THEN
      RAISE EXCEPTION 'cinturon: el piso reboto con otra voz: %', SQLERRM;
    END IF;
  END;
  IF v_ok THEN RAISE EXCEPTION 'cinturon: se REVIVIO una suscripcion vencida por SQL directo'; END IF;

  -- (c) LA PUERTA explica, y con SU codigo
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user::text, 'role','authenticated')::text, true);
  v_ok := false;
  BEGIN
    PERFORM public.reactivar_mensualidad_guarderia(v_s);
    v_ok := true;
  EXCEPTION WHEN sqlstate '22023' THEN
    IF SQLERRM NOT LIKE 'periodo_vencido_contratar_de_nuevo%' THEN
      RAISE EXCEPTION 'cinturon: la puerta reboto con otra voz: %', SQLERRM;
    END IF;
  END;
  IF v_ok THEN RAISE EXCEPTION 'cinturon: la puerta reactivo un periodo vencido'; END IF;

  -- (d) DENTRO del periodo: reactiva, sin cobrar ni re-anclar
  PERFORM set_config('request.jwt.claims','',true);
  UPDATE guarderia_suscripciones
     SET periodo_desde = public.hoy_local() - 5, periodo_hasta = public.hoy_local() + 20
   WHERE id = v_s;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user::text, 'role','authenticated')::text, true);
  v_r := public.reactivar_mensualidad_guarderia(v_s);
  IF COALESCE((v_r->>'ok')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'cinturon: no reactivo dentro del periodo: %', v_r::text;
  END IF;
  IF (v_r->>'cobrada_de_nuevo')::boolean IS NOT FALSE THEN
    RAISE EXCEPTION 'cinturon: declaro un cobro que no debia existir';
  END IF;
  SELECT estado INTO v_estado FROM guarderia_suscripciones WHERE id=v_s;
  IF v_estado <> 'activa' THEN RAISE EXCEPTION 'cinturon: quedo en %', v_estado; END IF;
  IF (v_r->>'corre_hasta')::date <> (public.hoy_local() + 20) THEN
    RAISE EXCEPTION 'cinturon: RE-ANCLO el periodo, y no debia';
  END IF;

  -- (e) idempotente
  v_r := public.reactivar_mensualidad_guarderia(v_s);
  IF (v_r->>'ya_estaba')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'cinturon: el segundo toque no se declaro idempotente';
  END IF;

  RAISE NOTICE 'cinturon M8: 5/5 OK (contratacion intacta · piso inexpresable · puerta con su voz · reactiva sin cobrar ni re-anclar · idempotente)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('request.jwt.claims','',true);
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M8: fixture deshecho por subtransaccion, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;
