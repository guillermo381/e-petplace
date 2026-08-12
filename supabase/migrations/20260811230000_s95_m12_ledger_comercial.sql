-- ═══════════════════════════════════════════════════════════════════════════
-- S95-D · BLOQUE 4 — EL LEDGER COMERCIAL
--
-- Firma del founder: **«Los huecos de hoy serán arrepentimientos del futuro.»**
-- *Un reporte se rehace desde eventos; los eventos no se rehacen desde un
-- reporte.*
--
-- **TABLA PROPIA, SEPARADA DEL EXPEDIENTE.** El expediente es clínico y no
-- puede recibir lo que NO pasó. Esto registra **intención y fricción**: lo que
-- alguien quiso y no pudo.
--
-- Reversa (escrita ANTES): docs/relevamientos/2026-08-11-s95-m12-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- LA VEDA **NO RIGE**. DDL puramente aditivo: dos tablas nuevas y un catálogo.
-- Cero backfill, cero borrado, cero anclas sobre datos vivos.
--
-- ── REGLA 21 CUMPLIDA ANTES DE CREAR ──────────────────────────────────────
-- Se buscó qué reusar. `metricas_negocio` es un AGREGADO DIARIO (gmv_dia, mau,
-- ticket_promedio) con 0 filas — no un ledger de eventos. `audit_log` es de
-- seguridad. Ninguna sirve: un agregado no se puede desagregar.
--
-- ── 🔴 LO QUE ESTA TABLA NO ES, Y VA EN SU PROPIO COMENTARIO ──────────────
-- `MODELO_LOYALTY` §7.5 prohíbe la urgencia artificial, la pérdida inducida y
-- el FOMO. **El carrito abandonado es el dark pattern más clásico del
-- comercio.** Este dato se captura para decidir QUÉ COMPRAR y QUÉ MEJORAR.
-- **JAMÁS para perseguir a la familia con «tu carrito te espera».**
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE A · EL VOCABULARIO DE SEÑALES
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.cat_senales_comerciales (
  codigo          text PRIMARY KEY,
  nombre          text NOT NULL,
  que_decide      text NOT NULL,   -- para qué sirve este dato. Sin esto, un log crece sin razón.
  orden           integer NOT NULL,
  activo          boolean NOT NULL DEFAULT true,
  motivo_inactivo text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (activo OR motivo_inactivo IS NOT NULL)
);

INSERT INTO public.cat_senales_comerciales (codigo, nombre, que_decide, orden, activo) VALUES
  ('busqueda_sin_resultado', 'Búsqueda con cero resultados',
   'La señal más valiosa del ecommerce: demanda de algo que no vendés. Decide qué sumar al catálogo.', 1, true),
  ('sin_stock_en_intencion', 'Sin stock al momento de querer comprarlo',
   'Venta perdida con voluntad PROBADA. Ordena qué comprar y en qué cantidad.', 2, true),
  ('fuera_de_cobertura', 'Fuera de zona de entrega',
   'Dónde expandir la logística. Un mapa de demanda que la operación todavía no alcanza.', 3, true),
  ('pago_fallido', 'Pago rechazado',
   '🔴 Suele ser INVISIBLE y es plata pura. 8 % de rechazo contra 3 % es enorme y no se ve si no se registra.', 4, true),
  ('carrito_abandonado', 'Carrito abandonado',
   'Fricción o precio. 🔴 JAMÁS para perseguir a la familia (MODELO_LOYALTY §7.5).', 5, true),
  ('checkout_abandonado', 'Checkout abandonado',
   'Fricción en el paso final: costo de envío que sorprende, formulario largo, pago que no anda.', 6, true),
  ('excluido_por_recomendacion', 'Excluido por la recomendación',
   '🔴 ÚNICO NUESTRO: no se mostró porque la mascota es alérgica o no le corresponde. NO es venta perdida — es el producto FUNCIONANDO.', 7, true),
  ('cancelacion_con_motivo', 'Cancelación con motivo',
   'Calidad del vendedor y del catálogo.', 8, true),
  ('devolucion_con_motivo', 'Devolución con motivo',
   'Calidad del producto y de la ficha: si devuelven por «no era lo que esperaba», la ficha miente.', 9, true);

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE B · EL LEDGER
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.senales_comerciales (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senal          text NOT NULL REFERENCES public.cat_senales_comerciales(codigo),

  -- ── REGLA DE DISEÑO ② · CAPTURA ANTES DEL LOGIN ─────────────────────────
  -- Si el evento exigiera usuario, se pierde la BOCA DEL EMBUDO ENTERA: quien
  -- busca «dieta renal» y no encuentra nada, se va antes de crear cuenta.
  visitante_id   text,                                    -- seudónimo, del dispositivo
  user_id        uuid REFERENCES public.profiles(id),     -- si ya tiene sesión
  sesion_id      text,

  -- ── 🔴 REGLA DE DISEÑO ① · CONTEXTO DE MASCOTA SIN IDENTIDAD ────────────
  -- Especie, talla, momento vital y condición. **JAMÁS `mascota_id`, JAMÁS FK
  -- a `mascotas`.** Permite decir "340 búsquedas de dieta renal, perro senior
  -- grande, y no teníamos nada" SIN convertir el log en un rastro de una
  -- mascota concreta.
  ctx_especie          text,
  ctx_talla            text,
  ctx_momento_vital    text,
  ctx_condicion        text,
  ctx_tiene_alergias   boolean,

  -- Qué pasó
  termino_busqueda text,
  producto_id      uuid REFERENCES public.productos(id),
  variante_id      uuid REFERENCES public.producto_variantes(id),
  familia_codigo   text REFERENCES public.cat_familias_producto(codigo),
  pedido_id        uuid REFERENCES public.pedidos(id),
  monto            numeric(10,2),
  moneda           text NOT NULL DEFAULT 'USD',
  country_code     text NOT NULL DEFAULT 'EC',
  ciudad           text,
  sector           text,
  motivo           text,
  detalle          jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- ── REGLA DE DISEÑO ③ · VERSIÓN DE ESQUEMA EN CADA FILA ─────────────────
  -- Un log que vive años CAMBIA DE FORMA. Sin versión, el histórico se vuelve
  -- ilegible y hay que adivinar qué significaba cada campo en cada época.
  version_esquema  integer NOT NULL DEFAULT 1,

  ocurrido_en      timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now(),

  -- Al menos una forma de agrupar, o la fila no sirve para nada.
  CHECK (visitante_id IS NOT NULL OR user_id IS NOT NULL OR sesion_id IS NOT NULL)
);

CREATE INDEX idx_senales_tipo_fecha ON public.senales_comerciales (senal, ocurrido_en DESC);
CREATE INDEX idx_senales_busqueda   ON public.senales_comerciales (termino_busqueda)
  WHERE termino_busqueda IS NOT NULL;
CREATE INDEX idx_senales_ctx        ON public.senales_comerciales (ctx_especie, ctx_talla, ctx_momento_vital);

COMMENT ON TABLE public.senales_comerciales IS
  'INTENCIÓN Y FRICCIÓN: lo que alguien quiso y no pudo. '
  'SEPARADA DEL EXPEDIENTE a propósito — el expediente es clínico y no puede '
  'recibir lo que NO pasó. '
  '🔴 LÍMITE QUE NO ES TÉCNICO: MODELO_LOYALTY §7.5 prohíbe la urgencia '
  'artificial, la pérdida inducida y el FOMO, y el carrito abandonado es el '
  'dark pattern más clásico del comercio. **ESTE DATO SE CAPTURA PARA DECIDIR '
  'QUÉ COMPRAR Y QUÉ MEJORAR. JAMÁS PARA PERSEGUIR A LA FAMILIA CON «TU '
  'CARRITO TE ESPERA».** Está escrito acá y no solo en un documento porque un '
  'documento no se lee cuando alguien va a escribir la campaña.';

COMMENT ON COLUMN public.senales_comerciales.ctx_especie IS
  '🔴 CONTEXTO SIN IDENTIDAD. Nunca hay `mascota_id` ni FK a `mascotas` en '
  'esta tabla — el juez lo verifica. Permite «340 búsquedas de dieta renal, '
  'perro senior grande, y no teníamos nada» sin que el log sea el rastro de '
  'una mascota concreta. '
  'Y es el foso extendido a la analítica: NINGUNA tienda del mundo puede armar '
  'ese dato, porque no sabe qué perro hay del otro lado.';

COMMENT ON COLUMN public.senales_comerciales.visitante_id IS
  'CAPTURA ANTES DEL LOGIN. Seudónimo del dispositivo. Si el evento exigiera '
  'usuario se pierde la boca del embudo entera: quien busca algo que no '
  'tenemos se va antes de crear cuenta, y ésa es justo la señal más valiosa.';

COMMENT ON COLUMN public.senales_comerciales.version_esquema IS
  'Un log que vive años cambia de forma. Sin versión, el histórico se vuelve '
  'ilegible y hay que adivinar qué significaba cada campo en cada época.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE C · RLS Y GRANTS
-- 🔴 Append-only, y NADIE lo lee salvo el admin: es dato de decisión de
--    negocio, no del vendedor ni de la familia.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.cat_senales_comerciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senales_comerciales     ENABLE ROW LEVEL SECURITY;

CREATE POLICY cat_senales_select ON public.cat_senales_comerciales FOR SELECT TO authenticated USING (true);
CREATE POLICY cat_senales_insert ON public.cat_senales_comerciales FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY cat_senales_update ON public.cat_senales_comerciales FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY cat_senales_delete ON public.cat_senales_comerciales FOR DELETE TO authenticated USING (is_admin());

-- Escribir: cualquiera con sesión puede dejar su propia señal (es su propia
-- fricción). Leer: SOLO el admin — el vendedor no ve el embudo de la
-- plataforma, y la familia no tiene por qué ver su propio rastro de intención.
CREATE POLICY senales_insert ON public.senales_comerciales FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY senales_select ON public.senales_comerciales FOR SELECT TO authenticated
  USING (is_admin());

REVOKE ALL ON public.cat_senales_comerciales, public.senales_comerciales
  FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cat_senales_comerciales TO authenticated;
-- 🔴 APPEND-ONLY EN EL GRANT: sin UPDATE ni DELETE. Un ledger que se edita no
--    es un ledger.
GRANT SELECT, INSERT ON public.senales_comerciales TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- CINTURONES
-- ───────────────────────────────────────────────────────────────────────────

-- 🔴 ① LAS TRES REGLAS DE DISEÑO QUE NO SE PUEDEN AGREGAR DESPUÉS.
DO $$
DECLARE v_fk text; v_col text;
BEGIN
  -- ① CERO FK al expediente. Ni a `mascotas`, ni a `eventos_mascota`, ni a
  --   ninguna tabla clínica. Si esta FK existiera, el log dejaría de ser
  --   anónimo por construcción y pasaría a serlo por disciplina.
  SELECT string_agg(tgt.relname, ', ') INTO v_fk
  FROM pg_constraint con
  JOIN pg_class src ON src.oid=con.conrelid
  JOIN pg_class tgt ON tgt.oid=con.confrelid
  WHERE con.contype='f' AND src.relname='senales_comerciales'
    AND tgt.relname IN ('mascotas','eventos_mascota','mascota_perfil_vigente',
                        'evento_producto_asignacion','familia','familia_miembro');
  IF v_fk IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA ①: el ledger comercial tiene FK al expediente (%). El contexto va SIN identidad.', v_fk;
  END IF;

  SELECT string_agg(column_name, ', ') INTO v_col FROM information_schema.columns
   WHERE table_schema='public' AND table_name='senales_comerciales'
     AND column_name IN ('mascota_id','pet_hash','familia_id');
  IF v_col IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA ①: el ledger tiene columna de identidad de mascota (%).', v_col;
  END IF;

  -- ② Captura antes del login: `user_id` NULLABLE.
  SELECT is_nullable INTO v_col FROM information_schema.columns
   WHERE table_schema='public' AND table_name='senales_comerciales' AND column_name='user_id';
  IF v_col <> 'YES' THEN
    RAISE EXCEPTION 'ABORTA ②: `user_id` es NOT NULL. Se pierde la boca del embudo entera.';
  END IF;

  -- ③ Versión de esquema NOT NULL.
  SELECT is_nullable INTO v_col FROM information_schema.columns
   WHERE table_schema='public' AND table_name='senales_comerciales' AND column_name='version_esquema';
  IF v_col <> 'NO' THEN
    RAISE EXCEPTION 'ABORTA ③: `version_esquema` es NULLABLE. El histórico se vuelve ilegible.';
  END IF;
END $$;

-- 🔴 ② EL LEDGER FUNCIONA SIN SESIÓN, y con contexto de mascota que NO
--    identifica a ninguna. Se prueba escribiendo, no leyendo el esquema.
DO $$
DECLARE v_n int; v_ok boolean := false;
BEGIN
  -- La señal más valiosa: alguien SIN CUENTA busca algo que no tenemos.
  INSERT INTO senales_comerciales
    (senal, visitante_id, ctx_especie, ctx_talla, ctx_momento_vital, ctx_condicion,
     termino_busqueda, country_code, ciudad, detalle)
  VALUES
    ('busqueda_sin_resultado', '__cint_visitante_1', 'perro', 'grande', 'M5', 'renal',
     'dieta renal', 'EC', 'Quito', '{"cinturon":"s95_m12"}'::jsonb);

  SELECT count(*) INTO v_n FROM senales_comerciales
   WHERE detalle->>'cinturon' = 's95_m12' AND user_id IS NULL;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'ABORTA: no se pudo registrar una señal sin sesión. La boca del embudo queda ciega.';
  END IF;

  -- La consulta que justifica la tabla entera: demanda agregada por contexto.
  SELECT count(*) INTO v_n FROM senales_comerciales
   WHERE senal='busqueda_sin_resultado' AND ctx_especie='perro'
     AND ctx_talla='grande' AND ctx_momento_vital='M5';
  IF v_n < 1 THEN
    RAISE EXCEPTION 'ABORTA: no se puede agrupar demanda por contexto de mascota. La tabla no sirve para lo que existe.';
  END IF;

  -- Y una fila SIN ninguna forma de agrupar rebota: sería ruido sin sujeto.
  BEGIN
    INSERT INTO senales_comerciales (senal, termino_busqueda) VALUES ('busqueda_sin_resultado','x');
  EXCEPTION WHEN check_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: se aceptó una señal sin visitante, sin usuario y sin sesión.';
  END IF;

  DELETE FROM senales_comerciales WHERE detalle->>'cinturon' = 's95_m12';
  DELETE FROM senales_comerciales WHERE visitante_id LIKE '\_\_cint%';
END $$;

-- ③ Append-only por privilegio efectivo · anon sin nada · cero ALL.
DO $$
DECLARE v_mal text; v_all text;
BEGIN
  SELECT string_agg(r||' puede '||p, ', ') INTO v_mal
  FROM unnest(ARRAY['anon','authenticated']) r, unnest(ARRAY['UPDATE','DELETE','TRUNCATE']) p
  WHERE has_table_privilege(r, 'public.senales_comerciales', p);
  IF v_mal IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: el ledger comercial no es append-only (%).', v_mal;
  END IF;
  IF has_table_privilege('anon','public.senales_comerciales','SELECT')
     OR has_table_privilege('anon','public.senales_comerciales','INSERT') THEN
    RAISE EXCEPTION 'ABORTA: anon sobre el ledger comercial.';
  END IF;

  SELECT string_agg(tablename||'.'||policyname, ', ') INTO v_all FROM pg_policies
   WHERE schemaname='public' AND cmd='ALL'
     AND tablename IN ('senales_comerciales','cat_senales_comerciales');
  IF v_all IS NOT NULL THEN RAISE EXCEPTION 'ABORTA: policies ALL (%).', v_all; END IF;
END $$;

-- ④ Toda señal declara QUÉ DECIDE. Un log cuyas filas no dicen para qué
--    sirven crece sin razón y nadie lo mira nunca.
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM cat_senales_comerciales
   WHERE que_decide IS NULL OR length(trim(que_decide)) = 0;
  IF v_n > 0 THEN
    RAISE EXCEPTION 'ABORTA: % señal(es) sin declarar qué deciden.', v_n;
  END IF;
  SELECT count(*) INTO v_n FROM senales_comerciales;
  IF v_n > 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % señales de fixture.', v_n; END IF;
END $$;

COMMIT;
