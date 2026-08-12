-- ═══════════════════════════════════════════════════════════════════════════
-- S95-D · BLOQUE 1 — LOGÍSTICA ESCALABLE
--
-- **El problema medido:** el esqueleto de S95-C modela UNA sola forma de
-- tarifa (base + por kg, en `zonas_cobertura`). Sirve para el vendedor actual
-- y se rompe con el segundo.
--
-- **La ley de esta tanda:** se modela completo, se construye solo lo que se
-- usa. Los siete tipos de regla nacen HOY como filas de catálogo; **cinco
-- nacen apagados**. Un camino que nadie recorre es una fila con su bandera en
-- false, jamás una función — las columnas muertas no se pudren, el código
-- muerto sí.
--
-- Reversa (escrita ANTES): docs/relevamientos/2026-08-11-s95-m9-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE.** Toca `zonas_cobertura` (20 filas) y `pedidos`. El
-- cinturón cuenta las zonas y sus activas antes y después, y exige que
-- `pedidos` siga en cero. Un INSERT en la ventana aborta.
--
-- ── LO QUE ESTE BLOQUE VIENE A EVITAR ─────────────────────────────────────
-- *Un vendedor nuevo con otra política de envío tiene que ser una FILA. Si es
-- una migración, este bloque falló.*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 🔴 CINTURÓN 0 · la foto (la veda vive acá).
DO $$
DECLARE v_z int; v_za int; v_p int;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE activo) INTO v_z, v_za FROM zonas_cobertura;
  SELECT count(*) INTO v_p FROM pedidos;
  IF (v_z, v_za, v_p) IS DISTINCT FROM (20, 0, 0) THEN
    RAISE EXCEPTION 'ABORTA: la foto era 20 zonas / 0 activas / 0 pedidos y hoy es %/%/%.', v_z, v_za, v_p;
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE A · LOS SIETE TIPOS DE REGLA — cinco nacen APAGADOS
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.cat_tipos_regla_envio (
  codigo              text PRIMARY KEY,
  nombre              text NOT NULL,
  descripcion         text,
  -- La FORMA que `reglas_envio.parametros` debe traer para este tipo. Es
  -- documentación EJECUTABLE: el motor la puede leer para validar.
  parametros_esperados jsonb NOT NULL DEFAULT '{}'::jsonb,
  usa_zonas           boolean NOT NULL DEFAULT false,
  usa_peso            boolean NOT NULL DEFAULT false,
  orden               integer NOT NULL,
  activo              boolean NOT NULL DEFAULT false,
  motivo_inactivo     text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  -- Un tipo apagado dice POR QUÉ. Sin esto, en tres meses nadie sabe si está
  -- apagado por decisión o por olvido.
  CHECK (activo OR motivo_inactivo IS NOT NULL)
);

INSERT INTO public.cat_tipos_regla_envio
  (codigo, nombre, descripcion, parametros_esperados, usa_zonas, usa_peso, orden, activo, motivo_inactivo) VALUES
  ('plana', 'Tarifa plana',
   'Un solo precio, sin importar peso ni destino.',
   '{"monto": "numeric"}'::jsonb, false, false, 1, true, NULL),

  ('gratis_sobre_umbral', 'Gratis sobre un mínimo',
   'Envío gratis si el pedido supera un monto; tarifa fija por debajo. La más usada del mundo real.',
   '{"umbral": "numeric", "monto_bajo_umbral": "numeric"}'::jsonb, false, false, 2, true, NULL),

  ('por_peso', 'Por peso',
   'Base más un monto por kilo facturable.',
   '{"base": "numeric", "por_kg": "numeric"}'::jsonb, false, true, 3, false,
   'v1 no lo usa. Se enciende cuando el vendedor cobre por kilo.'),

  ('por_zona_peso', 'Por zona y peso',
   'La tarifa sale de zonas_cobertura, cruzada con el peso facturable.',
   '{"usar_zonas_cobertura": true}'::jsonb, true, true, 4, false,
   'v1 no lo usa Y sus datos NO están verificados: las 20 filas de zonas_cobertura son del prototipo del 2-may (D-754). Encender este tipo sin verificarlas es cotizar con números inventados.'),

  ('api_transportista', 'Cotización en vivo del transportista',
   'Se le pregunta al courier por API en el momento de cotizar.',
   '{"proveedor": "text", "credencial_ref": "text"}'::jsonb, false, true, 5, false,
   'No hay integración con ningún transportista. Es v2.'),

  ('flota_propia', 'Reparto propio del vendedor',
   'El vendedor reparte con su gente; la tarifa la define él.',
   '{"monto": "numeric", "radio_km": "numeric"}'::jsonb, false, false, 6, false,
   'v1 no lo usa. Se enciende si el vendedor real reparte con moto propia (D-745).'),

  ('retiro', 'Retiro en tienda',
   'La familia retira en la bodega del vendedor. Costo cero.',
   '{}'::jsonb, false, false, 7, false,
   'MODELO_DESPENSA §11.2 lo deja fuera de v1. Se modela y nace apagado, igual que el CHECK de metodo_entrega en pedidos y envios.');

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE B · LA REGLA DE ENVÍO — una fila por política, jamás una migración
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.reglas_envio (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_comercial_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id) ON DELETE RESTRICT,
  country_code        text NOT NULL DEFAULT 'EC' REFERENCES public.country_config(country_code),
  tipo                text NOT NULL REFERENCES public.cat_tipos_regla_envio(codigo),
  parametros          jsonb NOT NULL DEFAULT '{}'::jsonb,
  moneda              text NOT NULL DEFAULT 'USD',
  -- Cuando dos reglas aplican, gana la de mayor prioridad. Sin esto, el
  -- desempate sería por orden de inserción — o sea, por casualidad.
  prioridad           integer NOT NULL DEFAULT 0,
  vigencia_desde      timestamptz NOT NULL DEFAULT now(),
  vigencia_hasta      timestamptz,
  activo              boolean NOT NULL DEFAULT true,
  notas               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reglas_envio_cuenta ON public.reglas_envio (cuenta_comercial_id, country_code, activo);

COMMENT ON TABLE public.reglas_envio IS
  'Un vendedor nuevo con otra política de envío es una FILA. Si alguna vez '
  'hace falta una migración para eso, este diseño falló. '
  'zonas_cobertura pasa a ser el DATO de un tipo (por_zona_peso), no el modelo '
  'entero — que es lo que era en S95-C.';

-- 🔴 EL GUARD QUE HACE REAL LA LEY DE LA TANDA: no se puede activar una regla
--    de un tipo apagado. El camino existe en el modelo y está CERRADO en la
--    operación — y el rechazo es explícito, no un silencio.
CREATE OR REPLACE FUNCTION public._trg_regla_envio_tipo_activo()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_activo boolean; v_motivo text;
BEGIN
  IF NOT NEW.activo THEN RETURN NEW; END IF;   -- una regla apagada puede ser de cualquier tipo
  SELECT activo, motivo_inactivo INTO v_activo, v_motivo
    FROM cat_tipos_regla_envio WHERE codigo = NEW.tipo;
  IF NOT COALESCE(v_activo, false) THEN
    RAISE EXCEPTION 'tipo_regla_envio_inactivo: el tipo "%" está apagado en el catálogo. Motivo: %', NEW.tipo, COALESCE(v_motivo,'(sin declarar)')
      USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_regla_envio_tipo_activo
  BEFORE INSERT OR UPDATE ON public.reglas_envio
  FOR EACH ROW EXECUTE FUNCTION public._trg_regla_envio_tipo_activo();

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE C · EL PESO QUE SE COBRA NO ES EL PESO REAL
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.producto_variantes
  ADD COLUMN largo_cm numeric(8,2) CHECK (largo_cm IS NULL OR largo_cm > 0),
  ADD COLUMN ancho_cm numeric(8,2) CHECK (ancho_cm IS NULL OR ancho_cm > 0),
  ADD COLUMN alto_cm  numeric(8,2) CHECK (alto_cm  IS NULL OR alto_cm  > 0);

COMMENT ON COLUMN public.producto_variantes.largo_cm IS
  'Para el PESO VOLUMÉTRICO. El transportista cobra el mayor entre el peso '
  'físico y (largo × ancho × alto ÷ factor). Una bolsa de 15 kg es densa y se '
  'cobra por peso; una cama pesa 2 kg, ocupa una caja enorme y se cobra como '
  '12. Camas y juguetes son los candidatos de §11.3: el día que entren, el '
  'flete calcularía mal en el PEOR caso posible si esto no existiera.';

-- El factor es DEL TRANSPORTISTA, no una constante universal (5000 y 6000 son
-- los dos usuales, y no coinciden entre couriers).
ALTER TABLE public.cat_transportistas
  ADD COLUMN factor_volumetrico integer
    CHECK (factor_volumetrico IS NULL OR factor_volumetrico > 0),
  ADD COLUMN notas text;

UPDATE public.cat_transportistas SET
  factor_volumetrico = CASE codigo
    WHEN 'servientrega' THEN 6000
    WHEN 'laar'         THEN 6000
    WHEN 'tramaco'      THEN 6000
    ELSE NULL END,
  notas = CASE codigo
    WHEN 'picap'  THEN 'Mensajería urbana: cobra por distancia, no por volumen. Sin factor.'
    WHEN 'borzo'  THEN 'Mensajería urbana: cobra por distancia, no por volumen. Sin factor.'
    WHEN 'propio' THEN 'Reparto del vendedor: la tarifa la define él.'
    WHEN 'otro'   THEN 'Sin factor declarado.'
    ELSE 'Factor 6000 es el usual del courier nacional ecuatoriano. 🔴 NO VERIFICADO contra tarifario oficial (D-754).' END;

COMMENT ON COLUMN public.cat_transportistas.factor_volumetrico IS
  '🔴 LOS VALORES SEMBRADOS NO ESTÁN VERIFICADOS contra ningún tarifario. '
  '6000 es el usual del courier nacional en Ecuador, pero eso es conocimiento '
  'general, no un dato medido — mismo estatus que las 20 tarifas de '
  'zonas_cobertura (D-754). NULL significa «este transportista no cobra por '
  'volumen», que es distinto de «no lo sabemos».';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE D · LA PROMESA NO ES EL TRÁNSITO
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.vendedor_bodegas
  ADD COLUMN hora_corte          time,
  ADD COLUMN horas_preparacion   integer NOT NULL DEFAULT 24
    CHECK (horas_preparacion >= 0),
  ADD COLUMN dias_operacion      integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
  ADD COLUMN zona_horaria        text NOT NULL DEFAULT 'America/Guayaquil';

COMMENT ON COLUMN public.vendedor_bodegas.hora_corte IS
  'LA PROMESA ES CORTE + PREPARACIÓN + TRÁNSITO, no solo tránsito. '
  'Un pedido a las 6 de la tarde NO sale hoy — y ésa es la causa número uno de '
  'promesas incumplidas en ecommerce. Con `hora_corte` NULL, el motor asume '
  'que no hay corte y lo DICE en la cotización; no lo inventa.';
COMMENT ON COLUMN public.vendedor_bodegas.dias_operacion IS
  'Convención de la casa (regla 32): 0=Domingo … 6=Sábado. Default L-V.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE E · LA COTIZACIÓN SE CONGELA EN EL PEDIDO
-- Igual que el precio y el impuesto. Si mañana cambia la tarifa, el pedido de
-- hoy sigue siendo reproducible.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.pedidos
  ADD COLUMN envio_regla_id            uuid REFERENCES public.reglas_envio(id),
  ADD COLUMN envio_tipo_regla          text REFERENCES public.cat_tipos_regla_envio(codigo),
  ADD COLUMN envio_transportista       text REFERENCES public.cat_transportistas(codigo),
  ADD COLUMN envio_peso_fisico_kg      numeric(10,3),
  ADD COLUMN envio_peso_volumetrico_kg numeric(10,3),
  ADD COLUMN envio_peso_facturable_kg  numeric(10,3),
  -- El snapshot completo: qué parámetros tenía la regla ESE día, qué bodega,
  -- qué corte, qué tránsito. Un jsonb acá es correcto porque es un ACTA, no un
  -- modelo: nadie consulta por sus claves, se lee entero para reproducir.
  ADD COLUMN envio_cotizacion          jsonb;

COMMENT ON COLUMN public.pedidos.envio_cotizacion IS
  'ACTA de la cotización, congelada al crear el pedido: qué peso se usó, qué '
  'regla la produjo con qué parámetros, qué transportista, qué bodega, qué '
  'corte y qué se prometió. Es jsonb porque se lee ENTERO para reproducir, no '
  'por sus claves — si algún día se consulta por una clave, esa clave sube a '
  'columna.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE F · RLS Y GRANTS
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.cat_tipos_regla_envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reglas_envio          ENABLE ROW LEVEL SECURITY;

CREATE POLICY cat_regla_envio_select ON public.cat_tipos_regla_envio FOR SELECT TO authenticated USING (true);
CREATE POLICY cat_regla_envio_insert ON public.cat_tipos_regla_envio FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY cat_regla_envio_update ON public.cat_tipos_regla_envio FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY cat_regla_envio_delete ON public.cat_tipos_regla_envio FOR DELETE TO authenticated USING (is_admin());

-- El vendedor ve y propone SU política de envío; publicarla es de plataforma
-- —misma lógica que la oferta: el vendedor propone, e-PetPlace cura—.
CREATE POLICY reglas_envio_select ON public.reglas_envio FOR SELECT TO authenticated
  USING (es_vendedor_de(cuenta_comercial_id) OR is_admin());
CREATE POLICY reglas_envio_insert ON public.reglas_envio FOR INSERT TO authenticated
  WITH CHECK (is_admin());
CREATE POLICY reglas_envio_update ON public.reglas_envio FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY reglas_envio_delete ON public.reglas_envio FOR DELETE TO authenticated
  USING (is_admin());

-- 🔴 El REVOKE nombra a `authenticated`: los DEFAULT PRIVILEGES de Supabase le
--    dan TODO a cada tabla nueva y un GRANT de menos NO lo quita. Es el defecto
--    que el cinturón de la M3 cazó en S95-C.
REVOKE ALL ON public.cat_tipos_regla_envio, public.reglas_envio
  FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cat_tipos_regla_envio TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reglas_envio          TO authenticated;

REVOKE ALL ON FUNCTION public._trg_regla_envio_tipo_activo() FROM PUBLIC, anon;

-- ───────────────────────────────────────────────────────────────────────────
-- CINTURONES
-- ───────────────────────────────────────────────────────────────────────────

-- 🔴 ① LA LEY DE LA TANDA, PROBADA POR REBOTE: una regla ACTIVA de un tipo
--    APAGADO no puede existir. Si esto no rebota, «se modela completo, se
--    construye lo que se usa» es una intención y no un mecanismo.
DO $$
DECLARE v_cc uuid; v_ok boolean := false; v_id uuid;
BEGIN
  SELECT id INTO v_cc FROM cuentas_comerciales LIMIT 1;

  -- Los dos tipos VIVOS entran.
  INSERT INTO reglas_envio (cuenta_comercial_id, tipo, parametros, notas)
    VALUES (v_cc, 'plana', '{"monto": 4.50}'::jsonb, '__cint_m9');
  INSERT INTO reglas_envio (cuenta_comercial_id, tipo, parametros, notas)
    VALUES (v_cc, 'gratis_sobre_umbral', '{"umbral": 40, "monto_bajo_umbral": 4.50}'::jsonb, '__cint_m9');

  -- 🔴 Un tipo APAGADO, activo, REBOTA.
  BEGIN
    INSERT INTO reglas_envio (cuenta_comercial_id, tipo, parametros, activo, notas)
      VALUES (v_cc, 'api_transportista', '{}'::jsonb, true, '__cint_m9');
  EXCEPTION WHEN others THEN v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: se activó una regla de un tipo APAGADO. La ley de la tanda no está siendo exigida.';
  END IF;

  -- CONTRA-CASO: el mismo tipo, con la regla APAGADA, SÍ entra. El modelo
  -- tiene que poder alojar el camino cerrado — si no, no se modeló completo.
  INSERT INTO reglas_envio (cuenta_comercial_id, tipo, parametros, activo, notas)
    VALUES (v_cc, 'retiro', '{}'::jsonb, false, '__cint_m9') RETURNING id INTO v_id;

  -- Y encenderla después también rebota (el trigger corre en UPDATE).
  v_ok := false;
  BEGIN
    UPDATE reglas_envio SET activo = true WHERE id = v_id;
  EXCEPTION WHEN others THEN v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: una regla apagada se encendió a un tipo apagado. El trigger no cubre el UPDATE.';
  END IF;

  DELETE FROM reglas_envio WHERE notas = '__cint_m9';
END $$;

-- ② Los siete tipos existen y solo DOS están vivos. Si algún día alguien
--    enciende uno sin decidirlo, este número lo dice.
DO $$
DECLARE v_t int; v_a int; v_sin_motivo text;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE activo) INTO v_t, v_a FROM cat_tipos_regla_envio;
  IF v_t <> 7 THEN RAISE EXCEPTION 'ABORTA: se esperaban 7 tipos de regla y hay %.', v_t; END IF;
  IF v_a <> 2 THEN
    RAISE EXCEPTION 'ABORTA: hay % tipos ACTIVOS y v1 solo usa dos (plana, gratis_sobre_umbral).', v_a;
  END IF;
  SELECT string_agg(codigo, ', ') INTO v_sin_motivo FROM cat_tipos_regla_envio
   WHERE NOT activo AND motivo_inactivo IS NULL;
  IF v_sin_motivo IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: tipos apagados sin decir por qué (%). En tres meses nadie sabe si es decisión u olvido.', v_sin_motivo;
  END IF;
END $$;

-- ③ La veda se cierra · anon sin nada · cero policies ALL.
DO $$
DECLARE v_z int; v_za int; v_p int; v_all text; v_anon text;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE activo) INTO v_z, v_za FROM zonas_cobertura;
  SELECT count(*) INTO v_p FROM pedidos;
  IF (v_z, v_za, v_p) IS DISTINCT FROM (20, 0, 0) THEN
    RAISE EXCEPTION 'ABORTA: alguien escribió durante la ventana (%/%/%).', v_z, v_za, v_p;
  END IF;

  SELECT string_agg(tablename||'.'||policyname, ', ') INTO v_all FROM pg_policies
   WHERE schemaname='public' AND cmd='ALL' AND tablename IN ('reglas_envio','cat_tipos_regla_envio');
  IF v_all IS NOT NULL THEN RAISE EXCEPTION 'ABORTA: policies ALL (%).', v_all; END IF;

  SELECT string_agg(x, ', ') INTO v_anon FROM unnest(ARRAY['reglas_envio','cat_tipos_regla_envio']) x
  WHERE has_table_privilege('anon','public.'||x,'SELECT') OR has_table_privilege('anon','public.'||x,'INSERT');
  IF v_anon IS NOT NULL THEN RAISE EXCEPTION 'ABORTA: anon sobre (%).', v_anon; END IF;
END $$;

-- ④ Residuo 0.
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM reglas_envio;
  IF v_n > 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % reglas de fixture.', v_n; END IF;
END $$;

COMMIT;
