-- S115-A · TANDA 1 (b) — LA IDENTIDAD TRIBUTARIA DEL CLIENTE
-- Letra: MODELO_FISCAL v0.3 §8 (2) · v0.4. Reversa: docs/relevamientos/S115-A-REVERSA-20260912190000-tax-profiles.sql
-- VEDA 76(g): NO RIGE (tabla nueva + un UPDATE derivado, sin anclar ids).

BEGIN;

CREATE TYPE public.tipo_identificacion_enum AS ENUM
  ('ruc', 'cedula', 'pasaporte', 'consumidor_final');

CREATE TABLE public.tax_profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo_identificacion public.tipo_identificacion_enum NOT NULL,
  identificacion      text NOT NULL,
  razon_social        text,
  direccion           text,
  email               text,
  telefono            text,
  es_predeterminado   boolean NOT NULL DEFAULT false,
  verificado_en       timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_tax_profile UNIQUE (user_id, tipo_identificacion, identificacion),
  /* Consumidor final es UN número y es el de la ley; que se pueda escribir otro
     lo volvería un campo libre con cara de vocabulario cerrado. */
  CONSTRAINT chk_tax_profile_consumidor_final CHECK (
    tipo_identificacion <> 'consumidor_final' OR identificacion = '9999999999999'
  ),
  /* Una RAZÓN SOCIAL sin RUC no es un contribuyente: es un nombre suelto. */
  CONSTRAINT chk_tax_profile_identificacion_no_vacia CHECK (length(trim(identificacion)) > 0)
);

COMMENT ON TABLE public.tax_profiles IS
  'Identidad tributaria del RECEPTOR de un comprobante. El documento fiscal guarda un SNAPSHOT de estos campos: cambiar el perfil no reescribe una factura ya emitida.';

CREATE INDEX idx_tax_profiles_user ON public.tax_profiles (user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_tax_profile_predeterminado
  ON public.tax_profiles (user_id) WHERE es_predeterminado AND user_id IS NOT NULL;

ALTER TABLE public.tax_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY tax_profiles_own_select ON public.tax_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
CREATE POLICY tax_profiles_own_insert ON public.tax_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY tax_profiles_own_update ON public.tax_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
/* Sin policy de DELETE a propósito: un perfil tributario referenciado por un
   documento emitido no se borra — se deja de usar. */

CREATE TRIGGER trg_tax_profiles_updated BEFORE UPDATE ON public.tax_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- documentos_fiscales.tax_profile_id gana su FK ahora que la tabla existe
ALTER TABLE public.documentos_fiscales
  ADD CONSTRAINT documentos_fiscales_tax_profile_id_fkey
  FOREIGN KEY (tax_profile_id) REFERENCES public.tax_profiles(id) ON DELETE RESTRICT;

-- ── EL DEFAULT QUE MENTÍA ────────────────────────────────────────────────────
/* 🔴 182 filas de `profiles` dicen `tipo_identificacion = 'cedula'` y sólo DOS
   tienen cédula. No lo escribió nadie: es el `column_default`. Un default cómodo
   se lee como un hecho, y la ley del founder es explícita — *lo que no se sabe
   queda NULL y se dice*.
   Se hacen las dos mitades: se quita el default (arregla el futuro) Y se nulea
   lo que nunca fue declarado (arregla el pasado). El predicado es DERIVADO, no
   elegido: sin `cedula` no hay identificación que tipar. Las 2 reales no se tocan. */
DO $$
DECLARE v_antes int; v_despues int; v_reales int;
BEGIN
  SELECT count(*) INTO v_antes  FROM public.profiles WHERE tipo_identificacion IS NOT NULL;
  SELECT count(*) INTO v_reales FROM public.profiles WHERE cedula IS NOT NULL;
  UPDATE public.profiles SET tipo_identificacion = NULL
   WHERE tipo_identificacion IS NOT NULL AND cedula IS NULL;
  SELECT count(*) INTO v_despues FROM public.profiles WHERE tipo_identificacion IS NOT NULL;
  RAISE NOTICE 'tipo_identificacion declarado: % -> % (con cedula real: %)', v_antes, v_despues, v_reales;
  IF v_despues <> v_reales THEN
    RAISE EXCEPTION 'cinturon_nulear: quedaron % declarados y hay % con cedula', v_despues, v_reales;
  END IF;
END $$;

ALTER TABLE public.profiles ALTER COLUMN tipo_identificacion DROP DEFAULT;

COMMIT;
