-- REVERSA de 20260908080000_s112a_d485_familia.sql — ESCRITA ANTES DE APLICAR.
--
-- 🔴 QUE **NO** DESHACE, y hay que leerlo antes de correrla:
--   · Revertir esto **le saca a TODA familia el acceso a sus propias mascotas**
--     salvo por la via legacy `mascotas.user_id`. Toda mascota traspasada, y
--     toda mascota cuya familia tenga mas de un miembro adulto, deja de verse.
--     Es MAS ancho que el defecto que cura: no vuelve al estado anterior de
--     adopcion — rompe familias que hoy funcionan por otra via.
--   · Los `user_id` que el traspaso ya haya reapuntado al titular destino
--     **NO vuelven al refugio**, y esta bien que no vuelvan: devolverlos seria
--     reponerle al refugio el acceso de dueño sobre un animal que entrego.
BEGIN;

CREATE OR REPLACE FUNCTION public.user_tiene_acceso_a_mascota_como(p_user_id uuid, p_mascota_id uuid)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_user_id uuid := p_user_id; v_caducidad_meses integer;
BEGIN
  IF v_user_id IS NULL THEN RETURN false; END IF;
  IF is_admin() THEN RETURN true; END IF;
  IF EXISTS (SELECT 1 FROM mascotas WHERE id = p_mascota_id AND user_id = v_user_id)
  THEN RETURN true; END IF;
  SELECT COALESCE((SELECT valor::integer FROM app_config
    WHERE clave = 'acceso_prestador_caducidad_meses'), 6) INTO v_caducidad_meses;
  IF EXISTS (
    SELECT 1 FROM mascota_acceso_prestador map
    WHERE map.mascota_id = p_mascota_id AND map.revocado_en IS NULL
      AND (map.expira_en IS NULL OR map.expira_en > now())
      AND map.cuenta_comercial_id IN (
        SELECT cuenta_comercial_id FROM prestadores WHERE user_id = v_user_id
        UNION
        SELECT p.cuenta_comercial_id FROM prestador_empleados pe
        JOIN prestadores p ON p.id = pe.prestador_id
        WHERE pe.user_id = v_user_id AND pe.activo = true)
      AND (map.metodo_otorgamiento <> 'cita_automatica' OR EXISTS (
          SELECT 1 FROM evento_cita_servicio ecs
          JOIN prestadores p2 ON p2.id = ecs.prestador_id
          WHERE ecs.mascota_id = map.mascota_id
            AND p2.cuenta_comercial_id = map.cuenta_comercial_id
            AND ecs.fecha >= (now() - make_interval(months => v_caducidad_meses))::date))
  ) THEN RETURN true; END IF;
  RETURN false;
END;
$function$;

DROP FUNCTION IF EXISTS public._user_es_de_la_familia_de(uuid, uuid);
COMMIT;
