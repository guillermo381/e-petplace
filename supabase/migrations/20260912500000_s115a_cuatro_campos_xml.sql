-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LOS CUATRO CAMPOS QUE E MIDIÓ CONTRA EL XML REAL
--
-- 76(g) — VEDA: NO RIGE. Columnas nullable + una tabla de catálogo + un lector.
-- ═══════════════════════════════════════════════════════════════════════════

-- ① dirEstablecimiento — la dirección del LOCAL, distinta de dirMatriz.
--    Para nosotros el establecimiento 001 es la oficina de la Shyris. Nace
--    igual a la matriz sólo si nadie la declara, y eso se ve en el dato.
ALTER TABLE public.fiscal_emisor
  ADD COLUMN IF NOT EXISTS direccion_establecimiento text;

COMMENT ON COLUMN public.fiscal_emisor.direccion_establecimiento IS
  'Direccion del establecimiento emisor (<dirEstablecimiento>), distinta de la '
  'matriz. Si es NULL el canonico cae a dirMatriz — y lo dice, no lo esconde.';

-- ③ moneda — el literal que el SRI espera, medido contra un XML real:
--    «US Dollar», no «USD» ni «DOLAR». Es propiedad de cómo ESTE emisor escribe
--    su XML, así que vive con el emisor y no en una constante.
ALTER TABLE public.fiscal_emisor
  ADD COLUMN IF NOT EXISTS moneda_literal text NOT NULL DEFAULT 'US Dollar';

COMMENT ON COLUMN public.fiscal_emisor.moneda_literal IS
  'El literal de <moneda> en el XML. Medido contra factura real: «US Dollar».';

-- ④ formaPago — código del catálogo del SRI (tabla 24), derivado del riel.
--
-- 🔴 LA MEDICIÓN QUE CAMBIÓ EL ALCANCE: la base **no distingue crédito de
--    débito**. `marca` es la marca de la tarjeta (vi=Visa, di=Diners), `forma`
--    es el flujo (tokenizacion|codigo_push), y `medios_pago_orden` de app_config
--    dice `deuna,debito,credito` — o sea que **el producto ofrece los tres y el
--    intento no guarda cuál eligió la familia**. Hay escritor en la pantalla y
--    no hay registro en la fila.
--    Con `formaPago` obligatorio en el XML eso deja de ser incómodo y pasa a
--    bloquear: nace la columna que falta, y la puerta de cobro tiene que
--    empezar a escribirla (va al buzón de B).
ALTER TABLE public.pagos_intentos
  ADD COLUMN IF NOT EXISTS medio_pago text;

COMMENT ON COLUMN public.pagos_intentos.medio_pago IS
  'Con QUE se pago: credito | debito | deuna | saldo. Lo elige la familia en el '
  'checkout y hasta S115 no se registraba. Sin esto no se puede derivar '
  '<formaPago> y el documento no se emite (fail-closed, a proposito).';

CREATE TABLE IF NOT EXISTS public.cat_forma_pago_sri (
  country_code text NOT NULL,
  medio        text NOT NULL,        -- el nuestro
  codigo_sri   text NOT NULL,        -- tabla 24 del SRI
  nombre       text NOT NULL,
  activo       boolean NOT NULL DEFAULT true,
  fuente_codigo text,
  PRIMARY KEY (country_code, medio)
);

INSERT INTO public.cat_forma_pago_sri (country_code, medio, codigo_sri, nombre, fuente_codigo) VALUES
  ('EC','credito','19','Tarjeta de credito',                          'ficha_sri_tabla24'),
  ('EC','debito', '16','Tarjeta de debito',                           'ficha_sri_tabla24'),
  /* DeUna: el founder midió una factura real de CRECERMED que usa el 20 para
     este caso. Se toma ése y NO «transferencia»: hay un XML que lo respalda. */
  ('EC','deuna',  '20','Otros con utilizacion del sistema financiero','xml_real_crecermed_2026'),
  /* Saldo e-PetPlace: la plata ya entró por su propio riel y ya se facturó
     entonces; al gastarla no vuelve a pasar por el sistema financiero. */
  ('EC','saldo',  '01','Sin utilizacion del sistema financiero',      'ficha_sri_tabla24')
ON CONFLICT (country_code, medio) DO UPDATE
  SET codigo_sri = EXCLUDED.codigo_sri, nombre = EXCLUDED.nombre;

ALTER TABLE public.cat_forma_pago_sri ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cat_forma_pago_sri_lectura ON public.cat_forma_pago_sri;
CREATE POLICY cat_forma_pago_sri_lectura ON public.cat_forma_pago_sri
  FOR SELECT TO authenticated USING (true);
REVOKE INSERT, UPDATE, DELETE ON public.cat_forma_pago_sri FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.cat_forma_pago_sri TO authenticated, service_role;

-- EL RESOLVEDOR — con la única derivación que la medición autoriza.
CREATE OR REPLACE FUNCTION public.fiscal_forma_pago_del_intento(p_intento_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_i public.pagos_intentos; v_medio text; v_cod text; v_como text;
BEGIN
  SELECT * INTO v_i FROM public.pagos_intentos WHERE id = p_intento_id;
  IF v_i.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'intento_no_existe');
  END IF;

  IF v_i.medio_pago IS NOT NULL THEN
    v_medio := v_i.medio_pago; v_como := 'declarado';
  ELSIF v_i.proveedor = 'deuna' THEN
    /* La ÚNICA derivación que la medición sostiene: en DeUna el proveedor y el
       medio son la misma cosa. Con nuvei NO se puede — la fila no dice si fue
       crédito o débito, y adivinar produciría un XML plausible y falso, que es
       el defecto exacto que estos catálogos vinieron a cerrar. */
    v_medio := 'deuna'; v_como := 'derivado_del_proveedor';
  ELSE
    RETURN jsonb_build_object('ok', false, 'codigo', 'medio_de_pago_no_declarado',
      'proveedor', v_i.proveedor,
      'detalle', 'La fila no dice con que se pago y no se puede derivar. '
                 'No se inventa: el documento espera.');
  END IF;

  SELECT codigo_sri INTO v_cod FROM public.cat_forma_pago_sri
   WHERE country_code = 'EC' AND medio = v_medio AND activo;
  IF v_cod IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'medio_sin_codigo_sri', 'medio', v_medio);
  END IF;

  RETURN jsonb_build_object('ok', true, 'medio', v_medio, 'codigo_sri', v_cod, 'como', v_como);
END $$;

REVOKE EXECUTE ON FUNCTION public.fiscal_forma_pago_del_intento(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fiscal_forma_pago_del_intento(uuid) TO authenticated, service_role;

-- CINTURÓN: los cuatro medios mapean, la derivación de DeUna anda, y nuvei
-- SIN medio declarado REBOTA (que es el fail-closed pedido, no un accidente).
DO $c$
DECLARE v_r jsonb; v_int uuid; v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM public.cat_forma_pago_sri WHERE country_code='EC' AND activo;
  IF v_n <> 4 THEN RAISE EXCEPTION 'cinturon: se esperaban 4 medios y hay %', v_n; END IF;

  SELECT id INTO v_int FROM public.pagos_intentos WHERE proveedor='deuna' LIMIT 1;
  IF v_int IS NOT NULL THEN
    v_r := public.fiscal_forma_pago_del_intento(v_int);
    IF (v_r->>'codigo_sri') <> '20' OR (v_r->>'como') <> 'derivado_del_proveedor' THEN
      RAISE EXCEPTION 'cinturon: DeUna no derivo al 20: %', v_r::text;
    END IF;
  END IF;

  SELECT id INTO v_int FROM public.pagos_intentos
   WHERE proveedor='nuvei' AND medio_pago IS NULL LIMIT 1;
  IF v_int IS NOT NULL THEN
    v_r := public.fiscal_forma_pago_del_intento(v_int);
    IF COALESCE((v_r->>'ok')::boolean,false) THEN
      RAISE EXCEPTION 'cinturon 🔴: nuvei sin medio declarado RESOLVIO. '
                      'El fail-closed no cierra y el XML saldria con un formaPago inventado.';
    END IF;
  END IF;

  RAISE NOTICE 'cinturon VERDE: 4 medios · DeUna deriva al 20 · nuvei sin medio rebota';
END $c$;
