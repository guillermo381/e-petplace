-- REVERSA de 20260814100000_s97a_naturaleza_solicitada.sql (escrita ANTES de aplicar)
--
-- QUÉ DESHACE: la columna `naturalezas_solicitadas`, sus tres puertas y el
-- brazo que `otorgar_rol_vendedor` ganó para cerrar la solicitud.
--
-- QUÉ **NO** DESHACE, y hay que saberlo antes de correrla:
--  · Las solicitudes ya hechas SE PIERDEN — el dato vive solo en esa columna.
--    Si alguna cuenta tiene una naturaleza solicitada sin resolver, revertir
--    borra la única señal de que alguien la pidió. Correr el SELECT de abajo
--    ANTES y guardar el resultado.
--  · Los roles YA OTORGADOS no se tocan: viven en `cuenta_roles` y esta
--    migración nunca los escribió.
--
-- SELECT probatorio a correr ANTES de revertir:
--   SELECT id, razon_social, naturalezas_solicitadas
--     FROM cuentas_comerciales WHERE cardinality(naturalezas_solicitadas) > 0;

BEGIN;

DROP FUNCTION IF EXISTS public.solicitar_naturaleza_comercial(uuid, text);
DROP FUNCTION IF EXISTS public.retirar_naturaleza_solicitada(uuid, text);
DROP FUNCTION IF EXISTS public.obtener_naturalezas_de_cuenta(uuid);

-- `otorgar_rol_vendedor` vuelve a su cuerpo previo: sin el brazo que limpia la
-- solicitud. Se restaura por CREATE OR REPLACE con la MISMA firma (uuid, text)
-- — jamás DROP: es admin-only y viva, y dropearla deja al admin sin puerta.
-- El cuerpo íntegro previo vive embebido acá porque esta reversa es su ÚNICA
-- fuente si la migración ya corrió.
CREATE OR REPLACE FUNCTION public.otorgar_rol_vendedor(p_cuenta_comercial_id uuid, p_motivo text DEFAULT NULL::text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
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

  RETURN jsonb_build_object('ok', true, 'cuenta_comercial_id', p_cuenta_comercial_id,
                            'ya_lo_tenia', v_ya,
                            'cuenta_activada_ahora', v_activada,
                            'estado_cuenta', 'activa');
END $function$;

ALTER TABLE public.cuentas_comerciales DROP COLUMN IF EXISTS naturalezas_solicitadas;

COMMIT;
