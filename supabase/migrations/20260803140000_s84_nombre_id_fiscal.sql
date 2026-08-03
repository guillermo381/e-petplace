-- S84-A32bis · EL NOMBRE DEL DOCUMENTO FISCAL, POR PAÍS Y FIGURA
--
-- PREGUNTA DE C, CONTESTADA POR LA MESA: el nombre del documento **viene
-- del catálogo, no se hardcodea**.
--
-- ── LA RAZÓN, que C midió y es correcta ──────────────────────────────
-- **En Colombia una persona jurídica no tiene RUC: tiene NIT.** Y como el
-- país del documento SE ELIGE (§3 de la letra), la pantalla va a estar en
-- EC mostrando un documento de otro país. **Hardcodear "RUC" hace que
-- mienta apenas alguien elija Colombia** — el mismo caso del teléfono,
-- otra vez.
--
-- ── LA FORMA YA EXISTE: se espeja, no se inventa ─────────────────────
-- `cat_paises.mascara_id_fiscal` es **jsonb keyed por figura fiscal**
-- (`{"persona_natural": "^\d{10}$", …}`). **El nombre usa la MISMA
-- forma** — misma clave, mismo tipo, misma tabla. *Una segunda estructura
-- para el mismo eje es como nacen las divergencias.*
--
-- ⚠️ CORRECCIÓN A UN DATO DEL REPORTE, medida antes de construir:
-- se dijo que *"la validación del número NO hay que inventarla porque la
-- máscara ya está"*. **Es cierto SOLO para Ecuador: de los 23 países del
-- catálogo, UNO tiene máscara y tipos fiscales. CO, MX y US los tienen en
-- `{}`.** ⇒ no es *"ya está"*, es *"está para el único país activo"*.
--
-- ── CONSECUENCIA DE DISEÑO, y por eso el fallback NO es una alternativa
-- **22 de 23 países van a caer sin nombre declarado.** Por lo tanto la
-- pantalla **necesita** el genérico —*"tu identificación fiscal"*— no como
-- plan B sino como **el camino normal fuera de Ecuador**.
-- **Genérico y verdadero le gana a específico y falso**, y acá además es
-- lo que va a pasar casi siempre.
--
-- 76(g): RIGE — escribe UNA fila (`EC`), la única con datos fiscales.
-- REVERSA: `ALTER TABLE public.cat_paises DROP COLUMN nombre_id_fiscal;`

BEGIN;

ALTER TABLE public.cat_paises
  ADD COLUMN IF NOT EXISTS nombre_id_fiscal jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.cat_paises.nombre_id_fiscal IS
  'Nombre VISIBLE del documento fiscal por figura, keyed igual que mascara_id_fiscal. EC: RUC · CO: NIT. Vacío = el país no lo declara ⇒ la superficie dice el genérico ("tu identificación fiscal"), jamás el de otro país.';

-- Ecuador — el único país activo y el único con datos fiscales.
-- NO se llenan los otros 22: inventarles el nombre sería exactamente lo
-- que esta columna viene a evitar (L-180).
UPDATE public.cat_paises
   SET nombre_id_fiscal = jsonb_build_object(
     'persona_natural',          'Cédula',
     'persona_natural_obligada', 'RUC',
     'persona_juridica',         'RUC',
     'entidad_sin_fines_lucro',  'RUC'
   )
 WHERE codigo_iso2 = 'EC';

DO $$
DECLARE v_ec text; v_otros int;
BEGIN
  SELECT nombre_id_fiscal->>'persona_juridica' INTO v_ec FROM public.cat_paises WHERE codigo_iso2='EC';
  IF v_ec IS DISTINCT FROM 'RUC' THEN RAISE EXCEPTION 'EC no quedó con su nombre: %', v_ec; END IF;

  -- EL CINTURÓN QUE IMPORTA: que NADIE haya rellenado los otros 22.
  -- Un nombre inventado para Colombia se vería perfectamente normal.
  SELECT count(*) INTO v_otros FROM public.cat_paises
   WHERE codigo_iso2 <> 'EC' AND nombre_id_fiscal::text <> '{}';
  IF v_otros <> 0 THEN
    RAISE EXCEPTION 'se rellenaron % países que no declararon nada', v_otros;
  END IF;
END $$;

COMMIT;
