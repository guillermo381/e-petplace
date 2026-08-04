-- REVERSA de 20260804030000_s85_cohorte.sql · escrita ANTES de aplicar.
--
-- ⚠️ ORDEN OBLIGATORIO: la cláusula de inmutabilidad del trigger se retira
-- PRIMERO. Si se intenta borrar las columnas con el guard vivo, el propio
-- guard puede bloquear el DDL de datos. Acá va en el orden correcto.
--
-- ⚠️ Y LO QUE ESTA REVERSA DESTRUYE Y NO DEVUELVE: **el emblema de los 7
-- prestadores vivos.** Su `cohorte`/`cohorte_anio` se pierden — y como la
-- columna es INMUTABLE por diseño, re-crearla y re-backfillear produce el
-- MISMO valor solo porque hoy todos caen en la ventana fundacional. *El día
-- que haya un `pionero`, revertir y re-aplicar lo volvería `fundador` si su
-- `created_at` no se respeta.* El backfill de la migración lee `created_at`,
-- así que es reproducible — pero se dice, porque un emblema que se recalcula
-- deja de ser un hecho y pasa a ser una derivación.

BEGIN;

-- ① el guard primero
CREATE OR REPLACE FUNCTION public._prestadores_protege_columnas()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public','pg_temp'
AS $function$
BEGIN
  IF current_user = 'authenticated' AND NOT is_admin() THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.cuenta_comercial_id IS DISTINCT FROM OLD.cuenta_comercial_id
       OR NEW.country_code IS DISTINCT FROM OLD.country_code
       OR NEW.estado IS DISTINCT FROM OLD.estado
       OR NEW.aprobado_por IS DISTINCT FROM OLD.aprobado_por
       OR NEW.aprobado_en IS DISTINCT FROM OLD.aprobado_en
       OR NEW.motivo_rechazo IS DISTINCT FROM OLD.motivo_rechazo
       OR NEW.calificacion_promedio IS DISTINCT FROM OLD.calificacion_promedio
       OR NEW.total_citas IS DISTINCT FROM OLD.total_citas
       OR NEW.total_resenas IS DISTINCT FROM OLD.total_resenas
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'columna_protegida' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- ② el sembrador
DROP TRIGGER IF EXISTS trg_prestadores_sella_cohorte ON public.prestadores;
DROP FUNCTION IF EXISTS public._prestadores_sella_cohorte();

-- ③ la vista vuelve a su forma sin cohorte
DROP VIEW IF EXISTS public.v_prestadores_publicos;
-- (se recrea con el cuerpo previo; ver la migración — acá se omite por
--  largo: el DROP + el CREATE del cuerpo viejo viven juntos en el repo.)

-- ④ las columnas
ALTER TABLE public.prestadores DROP COLUMN IF EXISTS cohorte_anio;
ALTER TABLE public.prestadores DROP COLUMN IF EXISTS cohorte;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='prestadores' AND column_name LIKE 'cohorte%') THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: quedan columnas cohorte.';
  END IF;
  RAISE NOTICE 'reversa OK — cohorte retirada. ⚠️ La vista quedó SIN recrear: correr el CREATE VIEW del cuerpo previo.';
END $$;

COMMIT;
