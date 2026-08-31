-- ═══════════════════════════════════════════════════════════════════════════
-- S108-A-3 · EL LECTOR DE PLANES DEVUELVE LA FECHA DEL PRÓXIMO COBRO, RESUELTA
--
-- 76(g) VEDA: **NO RIGE.** Reemplazo de un lector. Cero backfill.
-- REVERSA: `docs/relevamientos/2026-09-03-s108a-REVERSA-M11.sql`.
-- L-119: la firma cambia (una columna más) ⇒ **DROP explícito** de la vieja.
--
-- ═══ POR QUÉ LA FECHA RESUELTA Y NO EL `dia_de_cobro` ══════════════════════
-- 🤝 Pedido de **S108-C**, con su razón, que es la correcta: *«si la pantalla
--    arma la llamada, la pantalla vuelve a estar a un paso de recalcular la
--    regla»*. Exponer `dia_de_cobro` la obligaba a componer
--    `guarderia_proximo_cobro(dia, periodo_desde)` — y el día que la regla
--    cambie, cambia en dos lugares.
--
-- 🔴 Y HAY UN DEFECTO DE CLASE DETRÁS, que C encontró en SU pantalla y por eso
--    lo pidió: **estaba diciendo «el próximo cobro sale el {fecha}» usando
--    `periodo_hasta`** — que es el FIN DEL PERÍODO PAGADO, no el día del cobro.
--    La fecha salía **corrida un día**. *Un día de diferencia en una fecha de
--    cobro no se lee como un error: se lee como que te cobraron antes de lo que
--    dijiste.*
--    ⇒ Con `proximo_cobro` resuelto acá, **ninguna superficie tiene que
--    deducirlo**, y deducirlo mal deja de ser posible.
--
-- ✅ Medido antes: el aviso por correo (`avisar_renovaciones_guarderia`) **NO
--    tenía el gemelo** — su `fecha` sale de `guarderia_proximo_cobro` y su
--    cuerpo no nombra `periodo_hasta` ni una vez. Se verificó contra el objeto
--    en vez de confiar en el recuerdo de haberlo escrito bien.
--
-- ⚠️ `proximo_cobro` es NULL cuando el plan todavía no se cobró
--    (`periodo_desde`/`dia_de_cobro` NULL) o cuando está cancelado. **NULL
--    honesto**: *inventar una fecha para un plan que no va a cobrar es la misma
--    mentira, del otro lado.*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.obtener_mis_planes_guarderia();

CREATE OR REPLACE FUNCTION public.obtener_mis_planes_guarderia()
RETURNS TABLE(suscripcion_id uuid, prestador_id uuid, prestador_nombre text,
              mascota_id uuid, precio_mensual numeric, estado text,
              periodo_desde date, periodo_hasta date, direccion_id uuid,
              proximo_cobro date)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $fn$
DECLARE v_fam uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm
   WHERE fm.user_id = auth.uid() AND fm.hasta IS NULL LIMIT 1;
  IF v_fam IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT s.id, s.prestador_id, pr.nombre_comercial, s.mascota_id,
         s.precio_mensual, s.estado, s.periodo_desde, s.periodo_hasta, s.direccion_id,
         /* La regla vive en UN solo lugar y se aplica acá. Un plan cancelado no
            tiene próximo cobro: decirle una fecha a alguien que canceló sería
            avisarle de una plata que no le vamos a sacar. */
         CASE WHEN s.estado = 'activa'
                   AND s.periodo_desde IS NOT NULL
                   AND s.dia_de_cobro IS NOT NULL
              THEN public.guarderia_proximo_cobro(s.dia_de_cobro, s.periodo_desde)
              ELSE NULL END
    FROM guarderia_suscripciones s
    JOIN prestadores pr ON pr.id = s.prestador_id
   WHERE s.familia_id = v_fam
   ORDER BY (s.estado = 'activa') DESC, s.created_at DESC;
END $fn$;

REVOKE EXECUTE ON FUNCTION public.obtener_mis_planes_guarderia() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_mis_planes_guarderia() TO authenticated;

-- ═══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $c$
DECLARE v_s uuid; v_user uuid; v_n int; v_prox date; v_hasta date; v_rol text := current_user;
BEGIN
  SELECT id, autorizada_por INTO v_s, v_user FROM guarderia_suscripciones LIMIT 1;
  IF v_s IS NULL THEN RAISE EXCEPTION 'cinturon: sin plan con que DISCRIMINAR'; END IF;

  -- (a) UNA sola firma (L-119)
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_mis_planes_guarderia';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon: quedaron % sobrecargas', v_n; END IF;

  /* (b) 🔴 EL DISCRIMINADOR: se siembra un fin de mes donde `periodo_hasta` y
     el próximo cobro DIFIEREN. Con un mes normal los dos coincidirían y el
     brazo daría verde sin distinguir nada. */
  UPDATE guarderia_suscripciones
     SET estado='activa', cancelada_en=NULL,
         periodo_desde = DATE '2026-01-31', dia_de_cobro = 31,
         periodo_hasta = DATE '2026-02-27'
   WHERE id = v_s;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user::text, 'role','authenticated')::text, true);
  SELECT p.proximo_cobro, p.periodo_hasta INTO v_prox, v_hasta
    FROM public.obtener_mis_planes_guarderia() p WHERE p.suscripcion_id = v_s;
  PERFORM set_config('request.jwt.claims','',true);

  IF v_prox IS NULL THEN RAISE EXCEPTION 'cinturon: no devolvio proximo_cobro'; END IF;
  IF v_prox <> DATE '2026-02-28' THEN
    RAISE EXCEPTION 'cinturon: proximo_cobro = % (esperaba 2026-02-28)', v_prox;
  END IF;
  IF v_prox = v_hasta THEN
    RAISE EXCEPTION 'cinturon: proximo_cobro coincide con periodo_hasta — el brazo NO discrimina';
  END IF;

  -- (c) CANCELADO: NULL honesto, no una fecha inventada
  UPDATE guarderia_suscripciones SET estado='cancelada', cancelada_en=now() WHERE id=v_s;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user::text, 'role','authenticated')::text, true);
  SELECT p.proximo_cobro INTO v_prox
    FROM public.obtener_mis_planes_guarderia() p WHERE p.suscripcion_id = v_s;
  PERFORM set_config('request.jwt.claims','',true);
  IF v_prox IS NOT NULL THEN
    RAISE EXCEPTION 'cinturon: dio fecha de cobro sobre un plan CANCELADO: %', v_prox;
  END IF;

  RAISE NOTICE 'cinturon M11: 4/4 OK (una firma · fecha resuelta y DISTINTA de periodo_hasta · sin cobrar NULL · cancelado NULL)';
  RAISE EXCEPTION 'FIXTURE_ROLLBACK_OK';
EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('request.jwt.claims','',true);
  IF SQLERRM = 'FIXTURE_ROLLBACK_OK' THEN
    RAISE NOTICE 'cinturon M11: fixture deshecho por subtransaccion, residuo 0';
  ELSE RAISE;
  END IF;
END $c$;

COMMIT;
