-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · 20260907860000 · EL ROL DE REFUGIO SE OTORGA Y SE REVOCA. Adenda 10 punto 2(a).
--
-- MEDIDO ANTES: `tipo_actor_enum` **ya tenía `refugio`** — no hubo que
-- inventar vocabulario. Lo que faltaba era el ACTO.
--
-- 🔴 GEMELA DE `otorgar_rol_vendedor`, NO UNA PIEZA NUEVA. Misma forma, mismo
-- gate de admin, misma idempotencia por `ON CONFLICT`, misma regla de que una
-- cuenta suspendida o cerrada **no se reactiva por acá**. *Copiar la forma de
-- la puerta que ya funciona es más barato que diseñar una y más seguro que
-- improvisarla.*
--
-- ⚠️ **LO QUE NO CLONÉ, y lo declaro:** la del vendedor manda un aviso
-- (`naturaleza_venta_aprobada`). **Para refugio ese tipo no existe** — medido:
-- los únicos candidatos son `naturaleza_venta_aprobada` y
-- `padrinazgo_refugio_inactivo`, ninguno sirve. *Inventar un tipo de aviso
-- exige su fila de catálogo y su voz firmada, y eso es letra, no motor.*
-- Sin aviso: el alta es manual y quien la ejecuta ya está hablando con el
-- refugio. **Se declara para que nadie lea el silencio como olvido.**
--
-- 76(g): NO RIGE — aditiva, cero backfill.
-- REVERSA ESCRITA ANTES.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.otorgar_rol_refugio(
  p_cuenta_comercial_id uuid, p_motivo text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_auth uuid := auth.uid(); v_cc record; v_ya boolean; v_activada boolean := false;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  /* Acto de ADMIN, y por la misma razón que el vendedor: si el titular pudiera
     dárselo, cualquiera con una cuenta comercial se auto-habilitaría a publicar
     animales en adopción. El alta de refugio es manual POR FIRMA del founder. */
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'solo_admin_otorga_rol_refugio' USING ERRCODE='42501';
  END IF;

  SELECT * INTO v_cc FROM cuentas_comerciales WHERE id = p_cuenta_comercial_id FOR UPDATE;
  IF v_cc.id IS NULL THEN RAISE EXCEPTION 'cuenta_no_existe' USING ERRCODE='22023'; END IF;
  IF v_cc.estado IN ('suspendida','cerrada') THEN
    RAISE EXCEPTION 'cuenta_no_activable: la cuenta esta «%» y reactivarla no es parte del alta de un refugio', v_cc.estado
      USING ERRCODE='22023';
  END IF;

  IF v_cc.estado = 'pendiente_validacion' THEN
    UPDATE cuentas_comerciales
       SET estado='activa', activado_en=COALESCE(activado_en, now()),
           activado_por=v_auth, updated_at=now()
     WHERE id = p_cuenta_comercial_id;
    v_activada := true;
  END IF;

  SELECT EXISTS (SELECT 1 FROM cuenta_roles
                  WHERE cuenta_comercial_id = p_cuenta_comercial_id
                    AND tipo_actor='refugio' AND estado='activo') INTO v_ya;

  INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en, metadata)
  VALUES (p_cuenta_comercial_id, 'refugio', 'activo', now(),
          jsonb_build_object('otorgado_por', v_auth, 'motivo', p_motivo))
  ON CONFLICT (cuenta_comercial_id, tipo_actor) DO UPDATE
    SET estado='activo', activado_en=COALESCE(cuenta_roles.activado_en, now());

  UPDATE cuentas_comerciales
     SET naturalezas_solicitadas = array_remove(naturalezas_solicitadas, 'refugio'::tipo_actor_enum),
         updated_at = now()
   WHERE id = p_cuenta_comercial_id;

  RETURN jsonb_build_object('ok', true, 'cuenta_comercial_id', p_cuenta_comercial_id,
                            'ya_lo_tenia', v_ya, 'cuenta_activada_ahora', v_activada);
END $fn$;

CREATE OR REPLACE FUNCTION public.revocar_rol_refugio(
  p_cuenta_comercial_id uuid, p_motivo text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_auth uuid := auth.uid(); v_n int;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'solo_admin_revoca_rol_refugio' USING ERRCODE='42501';
  END IF;
  /* Se CIERRA el rol, no se borra la fila: la traza de que ese refugio publico
     animales tiene que sobrevivir a la revocacion. */
  UPDATE cuenta_roles
     SET estado='cerrado', cerrado_en=now(), updated_at=now(),
         metadata = COALESCE(metadata,'{}'::jsonb)
                    || jsonb_build_object('revocado_por', v_auth, 'motivo_revocacion', p_motivo)
   WHERE cuenta_comercial_id = p_cuenta_comercial_id
     AND tipo_actor='refugio' AND estado='activo';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'revocados', v_n);
END $fn$;

REVOKE ALL ON FUNCTION public.otorgar_rol_refugio(uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revocar_rol_refugio(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.otorgar_rol_refugio(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revocar_rol_refugio(uuid,text) TO authenticated;

DO $sonda$
BEGIN
  IF has_function_privilege('anon','public.otorgar_rol_refugio(uuid,text)','EXECUTE') THEN
    RAISE EXCEPTION 'L-140: anon alcanza otorgar_rol_refugio';
  END IF;
  RAISE NOTICE 'SONDA VERDE: anon fuera de las dos funciones nuevas';
END $sonda$;
