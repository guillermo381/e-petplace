-- REVERSA de 20260814170000_s97a_admite_local_catalogo.sql (escrita ANTES)
-- 🔴 Revertir devuelve el literal 'paseo' HARDCODEADO al trigger y quita la
--    columna del catálogo ⇒ la capacidad vuelve a vivir en DOS lugares (el
--    trigger y la tabla de la pantalla), que es la divergencia que C midió.
BEGIN;
CREATE OR REPLACE FUNCTION public._trg_ps_paseo_sin_local()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $f$
BEGIN
  IF NEW.tipo_servicio = 'paseo' AND NEW.atiende_local THEN
    RAISE EXCEPTION 'paseo_no_atiende_en_local: el paseo es SIEMPRE a domicilio — no existe paseo en local (firma del founder, 14-ago-2026)'
      USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END $f$;
DROP FUNCTION IF EXISTS public.obtener_modalidades_por_oficio();
ALTER TABLE public.tipos_servicio DROP COLUMN IF EXISTS admite_atencion_local;
COMMIT;
