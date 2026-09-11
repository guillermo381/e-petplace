-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LOS CÓDIGOS DEL SRI SON DATO, NO NUESTRO VOCABULARIO
--
-- 🔴 MEDIDO EN EL SIMULADOR, y es la clase de defecto que no falla: escribe
--    `<codigoPorcentaje>EC_IVA_15</codigoPorcentaje>` y
--    `<tipoIdentificacionComprador>cedula</tipoIdentificacionComprador>`.
--    *Son nuestros identificadores internos saliendo en un XML que lee el SRI.*
--    El XML se arma, el simulador lo acepta, y el rechazo sólo aparece el día
--    que del otro lado hay un web service de verdad.
--
-- LA TRADUCCIÓN VIVE EN EL CATÁLOGO Y SE CONGELA EN EL CANÓNICO: el canónico se
-- persiste con el documento, así que una factura de hace dos años se reimprime
-- con los códigos que tenía el día que se emitió, aunque el catálogo cambie.
--
-- 76(g) — VEDA: **NO RIGE.** Columnas nuevas nullable + una tabla nueva + una
--    fila de catálogo. Sin backfill destructivo.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- ① LOS DOS CÓDIGOS DEL IMPUESTO
--
-- `codigo_sri` es el TIPO de impuesto (tabla 16 del SRI: 2 = IVA, 3 = ICE,
-- 5 = IRBPNR) y `codigo_porcentaje_sri` es la TARIFA (tabla 17).
--
-- ⚠️ `fuente_codigo` NO es adorno: distingue lo confirmado contra un XML real
--    de lo tomado de la ficha técnica. *Un dato de ficha se lee igual que uno
--    medido y no trae etiqueta — ésa es toda la razón por la que hay que
--    ponérsela a mano.* Hoy sólo el 15 % está confirmado contra un XML de
--    producción ajeno (codigo=2, codigoPorcentaje=4).
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.cat_tasas_impuesto
  ADD COLUMN IF NOT EXISTS codigo_sri            text,
  ADD COLUMN IF NOT EXISTS codigo_porcentaje_sri text,
  ADD COLUMN IF NOT EXISTS fuente_codigo         text;

COMMENT ON COLUMN public.cat_tasas_impuesto.codigo_sri IS
  'Tipo de impuesto del SRI (2=IVA). NULL fuera de Ecuador.';
COMMENT ON COLUMN public.cat_tasas_impuesto.codigo_porcentaje_sri IS
  'Tarifa del SRI (0=0%, 4=15%, 5=5%). Es lo que va en <codigoPorcentaje>.';
COMMENT ON COLUMN public.cat_tasas_impuesto.fuente_codigo IS
  'De dónde salió el código: xml_real_<quien> | ficha_sri. Un dato de ficha no '
  'sostiene una decisión con la misma fuerza que uno medido.';

UPDATE public.cat_tasas_impuesto
   SET codigo_sri = '2', codigo_porcentaje_sri = '4',
       fuente_codigo = 'xml_real_multicines_2026'
 WHERE codigo = 'EC_IVA_15';

UPDATE public.cat_tasas_impuesto
   SET codigo_sri = '2', codigo_porcentaje_sri = '0',
       fuente_codigo = 'ficha_sri_tabla17'
 WHERE codigo = 'EC_IVA_0';

-- 🔴 LA TARIFA QUE NO MODELÁBAMOS. La factura real de La Biferia imprime una
--    línea de IVA 5 % — o sea que existe y circula. Nace ACTIVA porque es una
--    tarifa vigente del país, no una hipótesis nuestra; lo que decide si la
--    usamos es qué `codigo_iva` lleva cada línea de desglose.
INSERT INTO public.cat_tasas_impuesto
  (codigo, country_code, nombre, pct, vigencia_desde, activo,
   codigo_sri, codigo_porcentaje_sri, fuente_codigo)
VALUES
  ('EC_IVA_5', 'EC', 'IVA 5 % Ecuador', 5.00, '2024-04-01'::timestamptz, true,
   '2', '5', 'xml_real_labiferia_2026')
ON CONFLICT (codigo) DO UPDATE
  SET codigo_sri = EXCLUDED.codigo_sri,
      codigo_porcentaje_sri = EXCLUDED.codigo_porcentaje_sri,
      fuente_codigo = EXCLUDED.fuente_codigo;

-- ─────────────────────────────────────────────────────────────────────────
-- ② EL TIPO DE IDENTIFICACIÓN DEL COMPRADOR, TAMBIÉN POR TABLA
--
-- Nuestro vocabulario es el nombre (`cedula`); el SRI quiere su código (`05`).
-- Va por país porque el día que haya un comprador colombiano el mapa es otro,
-- y un `CASE` en el código no tiene dónde poner esa segunda columna.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cat_identificacion_sri (
  country_code text NOT NULL,
  codigo       text NOT NULL,       -- el nuestro: cedula|ruc|pasaporte|consumidor_final
  codigo_sri   text NOT NULL,       -- el suyo: 05|04|06|07
  nombre       text NOT NULL,
  activo       boolean NOT NULL DEFAULT true,
  fuente_codigo text,
  PRIMARY KEY (country_code, codigo)
);

INSERT INTO public.cat_identificacion_sri (country_code, codigo, codigo_sri, nombre, fuente_codigo) VALUES
  ('EC','cedula',           '05','Cédula',            'ficha_sri_tabla6'),
  ('EC','ruc',              '04','RUC',               'ficha_sri_tabla6'),
  ('EC','pasaporte',        '06','Pasaporte',         'ficha_sri_tabla6'),
  ('EC','consumidor_final', '07','Consumidor final',  'ficha_sri_tabla6')
ON CONFLICT (country_code, codigo) DO UPDATE
  SET codigo_sri = EXCLUDED.codigo_sri, nombre = EXCLUDED.nombre;

ALTER TABLE public.cat_identificacion_sri ENABLE ROW LEVEL SECURITY;

/* Es un catálogo público de lectura: quien factura necesita leerlo. La escritura
   NO se concede — el precedente de S92 con los tres catálogos: lo que había que
   cerrar era la escritura, y el SELECT se re-concede EXPLÍCITO para que nadie lo
   revoque por prolijidad y descubra el daño en otra pantalla. */
DROP POLICY IF EXISTS cat_identificacion_sri_lectura ON public.cat_identificacion_sri;
CREATE POLICY cat_identificacion_sri_lectura ON public.cat_identificacion_sri
  FOR SELECT TO authenticated USING (true);
REVOKE INSERT, UPDATE, DELETE ON public.cat_identificacion_sri FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.cat_identificacion_sri TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- ③ CINTURÓN — con su rojo: una tarifa activa de EC SIN código del SRI aborta.
-- ─────────────────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE v_sin int; v_ident int; v_cinco int;
BEGIN
  SELECT count(*) INTO v_sin FROM public.cat_tasas_impuesto
   WHERE country_code = 'EC' AND activo AND (codigo_sri IS NULL OR codigo_porcentaje_sri IS NULL);
  IF v_sin > 0 THEN
    RAISE EXCEPTION 'cinturon 🔴: % tarifa(s) activa(s) de EC sin código del SRI. '
                    'Una tarifa sin código produce un XML que el SRI rechaza.', v_sin;
  END IF;

  SELECT count(*) INTO v_ident FROM public.cat_identificacion_sri WHERE country_code='EC' AND activo;
  IF v_ident <> 4 THEN
    RAISE EXCEPTION 'cinturon: se esperaban 4 tipos de identificación de EC y hay %', v_ident;
  END IF;

  SELECT count(*) INTO v_cinco FROM public.cat_tasas_impuesto
   WHERE codigo='EC_IVA_5' AND codigo_porcentaje_sri='5' AND pct=5.00;
  IF v_cinco <> 1 THEN RAISE EXCEPTION 'cinturon: el IVA 5 %% no quedó cargado'; END IF;

  RAISE NOTICE 'cinturon VERDE: 3 tarifas EC con código, 4 identificaciones, IVA 5 %% vivo';
END $cinturon$;
