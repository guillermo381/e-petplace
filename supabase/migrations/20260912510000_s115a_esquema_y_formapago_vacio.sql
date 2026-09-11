-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · TRES CORRECCIONES DEL FOUNDER SOBRE LA MIGRACIÓN ANTERIOR
--
-- Las tres nacen de leer un XML real del 0 % y las tres corrigen algo que esta
-- pista acababa de escribir. Se aplican como corrección, no como enmienda: la
-- de abajo estaba mal.
-- ═══════════════════════════════════════════════════════════════════════════

-- ① EL 0 % QUEDA CONFIRMADO CONTRA XML REAL, no contra la ficha.
--    El código era el correcto; lo que estaba mal era su PROCEDENCIA — y esa
--    columna existe justamente para que un dato de ficha no se lea con la
--    autoridad de uno medido.
UPDATE public.cat_tasas_impuesto
   SET codigo_sri = '2', codigo_porcentaje_sri = '0',
       fuente_codigo = 'xml_real_produccion_2026'
 WHERE codigo = 'EC_IVA_0';

-- ② LA VERSIÓN DEL ESQUEMA ES DATO, NO LITERAL.
--    Conviven 1.0.0 y 2.1.0 en producción. La decisión firmada: la que exija el
--    proveedor que se elija, y mientras tanto **2.1.0** — la más nueva, y la que
--    trae `agenteRetencion`, campo que hace falta si el SRI designa a Satori.
--    *Un literal en el generador obliga a un deploy para cambiar de esquema; una
--    fila lo vuelve una decisión.*
ALTER TABLE public.fiscal_emisor
  ADD COLUMN IF NOT EXISTS version_esquema text NOT NULL DEFAULT '2.1.0';

COMMENT ON COLUMN public.fiscal_emisor.version_esquema IS
  'Version del esquema del comprobante (1.0.0 | 2.1.0). Conviven en produccion; '
  'manda la que exija el proveedor elegido. 2.1.0 por defecto: es la mas nueva y '
  'trae agenteRetencion.';

-- ③ LA MONEDA LA PONE EL PROVEEDOR — sale de nuestros datos.
--    La escribí como propiedad del emisor y no lo es: es cómo el generador de
--    XML de cada proveedor arma su campo. *Guardar como decisión propia algo que
--    decide un tercero produce dos fuentes para el mismo valor, y la nuestra
--    envejece sin que nadie la mire.*
ALTER TABLE public.fiscal_emisor DROP COLUMN IF EXISTS moneda_literal;

-- ④ 🔴 EL MAPEO DE FORMAS DE PAGO NACE VACÍO. FAIL-CLOSED DE VERDAD.
--    Lo había cargado con cuatro filas tomadas por parecido con las facturas que
--    tenemos a mano —incluida `deuna → 20` justificada con la de CRECERMED—.
--    **Eso es exactamente lo que la fuente_codigo existe para impedir**: una
--    factura ajena prueba qué usó ESE emisor para SU caso, no cuál es el nuestro.
--    La tabla queda, vacía, y nada se emite hasta que alguien la cargue con un
--    valor que pueda defender.
DELETE FROM public.cat_forma_pago_sri WHERE country_code = 'EC';

COMMENT ON TABLE public.cat_forma_pago_sri IS
  'Mapeo riel → codigo de forma de pago del SRI (tabla 24). NACE VACIA A '
  'PROPOSITO: completarla por parecido con una factura ajena produce un XML '
  'plausible y falso. Sin fila, el documento espera y lo dice.';

-- CINTURÓN — el rojo es que NADA resuelva, que es el estado correcto hoy.
DO $c$
DECLARE v_n int; v_int uuid; v_r jsonb; v_resolvieron int := 0;
BEGIN
  SELECT count(*) INTO v_n FROM public.cat_forma_pago_sri WHERE country_code='EC';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'cinturon 🔴: el mapeo de formas de pago NO quedo vacio (% filas). '
                    'Cargarlo por parecido es el defecto que esta migracion retira.', v_n;
  END IF;

  FOR v_int IN SELECT id FROM public.pagos_intentos ORDER BY creado_en DESC LIMIT 20 LOOP
    v_r := public.fiscal_forma_pago_del_intento(v_int);
    IF COALESCE((v_r->>'ok')::boolean, false) THEN v_resolvieron := v_resolvieron + 1; END IF;
  END LOOP;
  IF v_resolvieron > 0 THEN
    RAISE EXCEPTION 'cinturon 🔴: % intento(s) resolvieron una forma de pago con el '
                    'catalogo VACIO. El fail-closed no cierra.', v_resolvieron;
  END IF;

  IF (SELECT fuente_codigo FROM public.cat_tasas_impuesto WHERE codigo='EC_IVA_0')
     <> 'xml_real_produccion_2026' THEN
    RAISE EXCEPTION 'cinturon: el 0 %% no quedo marcado como medido contra XML real';
  END IF;

  RAISE NOTICE 'cinturon VERDE: mapeo VACIO · 20 intentos y ninguno resuelve · 0 %% confirmado';
END $c$;
