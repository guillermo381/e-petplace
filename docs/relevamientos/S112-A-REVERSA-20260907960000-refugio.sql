-- REVERSA de 20260907960000_s112a_refugio.sql — ESCRITA ANTES DE APLICAR.
--
-- 🔴 QUE **NO** DESHACE:
--   · El CRITERIO de verificacion escrito (`criterio_verificacion`) se PIERDE.
--     El abogado lo pidio justamente para que la verificacion de un refugio
--     tenga constancia; borrar la columna borra la constancia, y no vive en
--     ningun otro lado. La reversa lo VUELCA a `metadata` antes de borrar, que
--     es lo maximo que se puede conservar sin la columna.
--   · Los roles `refugio` ya otorgados **siguen otorgados**: esto revierte
--     COMO se otorgan, no QUE se otorgaron.
--   · La rama `refugio` de `obtener_contexto_arranque` desaparece ⇒ **la app de
--     negocios deja de saber que una cuenta es refugio** y el portal se queda
--     sin su entrada.

BEGIN;

UPDATE public.cuenta_roles
   SET metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
         'verificado_por', verificado_por, 'verificado_en', verificado_en,
         'tipo_verificacion', tipo_verificacion, 'criterio_verificacion', criterio_verificacion)
 WHERE verificado_en IS NOT NULL OR criterio_verificacion IS NOT NULL;

DROP FUNCTION IF EXISTS public.obtener_mi_cuenta_refugio();
DROP FUNCTION IF EXISTS public.otorgar_rol_refugio(uuid, text, text);

CREATE OR REPLACE FUNCTION public.otorgar_rol_refugio(p_cuenta_comercial_id uuid, p_motivo text DEFAULT NULL)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_auth uuid := auth.uid(); v_cc record; v_ya boolean; v_activada boolean := false;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT is_admin() THEN RAISE EXCEPTION 'solo_admin_otorga_rol_refugio' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_cc FROM cuentas_comerciales WHERE id = p_cuenta_comercial_id FOR UPDATE;
  IF v_cc.id IS NULL THEN RAISE EXCEPTION 'cuenta_no_existe' USING ERRCODE='22023'; END IF;
  IF v_cc.estado IN ('suspendida','cerrada') THEN
    RAISE EXCEPTION 'cuenta_no_activable: la cuenta esta «%»', v_cc.estado USING ERRCODE='22023';
  END IF;
  IF v_cc.estado = 'pendiente_validacion' THEN
    UPDATE cuentas_comerciales SET estado='activa', activado_en=COALESCE(activado_en, now()),
           activado_por=v_auth, updated_at=now() WHERE id = p_cuenta_comercial_id;
    v_activada := true;
  END IF;
  SELECT EXISTS (SELECT 1 FROM cuenta_roles WHERE cuenta_comercial_id = p_cuenta_comercial_id
                  AND tipo_actor='refugio' AND estado='activo') INTO v_ya;
  INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en, metadata)
  VALUES (p_cuenta_comercial_id, 'refugio', 'activo', now(),
          jsonb_build_object('otorgado_por', v_auth, 'motivo', p_motivo))
  ON CONFLICT (cuenta_comercial_id, tipo_actor) DO UPDATE
    SET estado='activo', activado_en=COALESCE(cuenta_roles.activado_en, now());
  UPDATE cuentas_comerciales
     SET naturalezas_solicitadas = array_remove(naturalezas_solicitadas, 'refugio'::tipo_actor_enum),
         updated_at = now() WHERE id = p_cuenta_comercial_id;
  RETURN jsonb_build_object('ok', true, 'cuenta_comercial_id', p_cuenta_comercial_id,
                            'ya_lo_tenia', v_ya, 'cuenta_activada_ahora', v_activada);
END $function$;

ALTER TABLE public.cuenta_roles
  DROP COLUMN IF EXISTS verificado_por,
  DROP COLUMN IF EXISTS verificado_en,
  DROP COLUMN IF EXISTS tipo_verificacion,
  DROP COLUMN IF EXISTS criterio_verificacion;

COMMIT;
