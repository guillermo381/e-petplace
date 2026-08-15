CREATE OR REPLACE FUNCTION public.otorgar_rol_vendedor(p_cuenta_comercial_id uuid, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid();
  v_cc   record;
  v_ya   boolean;
  v_activada boolean := false;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- Sigue siendo acto de ADMIN. Si el titular pudiera dárselo, cualquiera con
  -- una cuenta comercial se auto-habilitaría a vender sin que nadie revise —
  -- y §4.2 dice lo contrario: el vendedor PROPONE, e-PetPlace PUBLICA.
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'solo_admin_otorga_rol_vendedor' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cc FROM cuentas_comerciales
   WHERE id = p_cuenta_comercial_id FOR UPDATE;
  IF v_cc.id IS NULL THEN
    RAISE EXCEPTION 'cuenta_no_existe' USING ERRCODE = '22023';
  END IF;

  -- 🔴 SOLO SE ACTIVA DESDE `pendiente_validacion`, igual que
  --    `activar_prestador`. Una cuenta SUSPENDIDA o CERRADA no se reactiva por
  --    acá: es otra decisión, con otro dueño y otras razones.
  IF v_cc.estado IN ('suspendida', 'cerrada') THEN
    RAISE EXCEPTION 'cuenta_no_activable: la cuenta está «%» y reactivarla no es parte del alta de un vendedor', v_cc.estado
      USING ERRCODE = '22023';
  END IF;

  IF v_cc.estado = 'pendiente_validacion' THEN
    UPDATE cuentas_comerciales
       SET estado = 'activa',
           activado_en = COALESCE(activado_en, now()),
           activado_por = v_auth,
           updated_at = now()
     WHERE id = p_cuenta_comercial_id;
    v_activada := true;
  END IF;

  SELECT EXISTS (SELECT 1 FROM cuenta_roles
                  WHERE cuenta_comercial_id = p_cuenta_comercial_id
                    AND tipo_actor = 'seller_productos' AND estado = 'activo')
    INTO v_ya;

  INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en, metadata)
  VALUES (p_cuenta_comercial_id, 'seller_productos', 'activo', now(),
          jsonb_build_object('otorgado_por', v_auth, 'motivo', p_motivo))
  ON CONFLICT (cuenta_comercial_id, tipo_actor) DO UPDATE
    SET estado = 'activo', activado_en = COALESCE(cuenta_roles.activado_en, now());

  -- S97: la solicitud queda RESUELTA por el mismo acto que la concede. El
  -- array guarda sólo lo pendiente, así que otorgar es vaciar.
  UPDATE cuentas_comerciales
     SET naturalezas_solicitadas = array_remove(naturalezas_solicitadas, 'seller_productos'::tipo_actor_enum),
         updated_at = now()
   WHERE id = p_cuenta_comercial_id;

  RETURN jsonb_build_object('ok', true, 'cuenta_comercial_id', p_cuenta_comercial_id,
                            'ya_lo_tenia', v_ya,
                            'cuenta_activada_ahora', v_activada,
                            'estado_cuenta', 'activa');
END $function$
