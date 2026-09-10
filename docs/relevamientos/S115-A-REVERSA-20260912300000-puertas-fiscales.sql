-- REVERSA de 20260912300000_s115a_puertas_fiscales.sql (escrita ANTES de aplicar)
BEGIN;
DROP FUNCTION IF EXISTS public.fiscal_mis_documentos();
DROP FUNCTION IF EXISTS public.fiscal_tax_profile_mio();
DROP FUNCTION IF EXISTS public.fiscal_tax_profile_upsert(text, text, text, text, text, text, boolean);
DROP FUNCTION IF EXISTS public.fiscal_admin_listar(text, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS public.fiscal_admin_cerrar_manual(uuid, text, text, timestamptz);
DROP FUNCTION IF EXISTS public.fiscal_ruta_archivo(uuid, text);
COMMIT;
