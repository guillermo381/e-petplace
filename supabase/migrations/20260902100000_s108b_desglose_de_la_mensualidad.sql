-- ═══════════════════════════════════════════════════════════════════════════
-- S108-B · EL DESGLOSE DEL PERÍODO DE LA MENSUALIDAD
--
-- 🔴 EL PORQUÉ. La regla de la casa es **sin desglose congelado no hay cobro**,
--    y la cumplen los cuatro sujetos vivos: `cita_desglose`, `compra_desglose`,
--    `recurrencia_desglose`, `suscripcion_desglose` — más `bono_desglose`, que
--    ya existía. **La mensualidad de guardería era el único sujeto sin dónde
--    congelar su número.** *Cobrar sin desglose es cobrar un número que nadie
--    le mostró a la familia.*
--
-- 🔴 POR QUÉ TABLA + FUNCIÓN Y NO UN TRIGGER, y es coordinación medida, no
--    preferencia: el congelado tiene que ocurrir ANTES del cobro, y **quién
--    abre el período es de la pista A** (`cobrar_periodo_mensualidad_guarderia`,
--    en vuelo mientras se escribe esto). Un trigger sobre `periodo_desde`
--    ataría el congelado al momento en que A resuelva poner esa fecha — y si
--    A termina exigiendo el intento aprobado ANTES de abrir el período, el
--    trigger dispararía tarde y el cobro no tendría contra qué leer.
--    *Un congelador cableado a una decisión de diseño que todavía se está
--    tomando es un congelador que un día no congela.*
--    ⇒ Se entrega **una función idempotente** y A la llama donde su diseño la
--    necesite. El contrato es explícito; el momento, suyo.
--
-- 🔴 VEDA 76(g): NO RIGE. Tabla nueva vacía + función nueva. Cero backfill,
--    cero anclas, cero filas tocadas.
--
-- REVERSA: docs/relevamientos/2026-09-02-s108b-REVERSA-M1.sql (escrita ANTES).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① LA TABLA — espejo de `suscripcion_desglose` ──────────────────────────
/* Mismo juego de columnas, misma PK compuesta por período. *Copiar la forma
   del vecino es lo que permite que el comprobante no tenga que preguntar de
   qué sujeto viene el número.* */
CREATE TABLE IF NOT EXISTS public.guarderia_suscripcion_desglose (
  guarderia_suscripcion_id uuid NOT NULL
    REFERENCES public.guarderia_suscripciones(id) ON DELETE CASCADE,
  periodo       date NOT NULL,
  subtotal      numeric(14,2) NOT NULL,
  impuesto      numeric(14,2) NOT NULL,
  total         numeric(14,2) NOT NULL,
  moneda        text NOT NULL,
  fee_config_id uuid,
  congelado_en  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guarderia_suscripcion_id, periodo),
  /* 🔴 EL TOTAL CIERRA POR CONSTRAINT, no por confianza. Es el invariante que
     el comprobante va a afirmar ante la familia y ante certificación. */
  CONSTRAINT chk_gsd_total_cierra CHECK (total = subtotal + impuesto),
  CONSTRAINT chk_gsd_montos CHECK (subtotal >= 0 AND impuesto >= 0 AND total > 0)
);

COMMENT ON TABLE public.guarderia_suscripcion_desglose IS
  'S108-B · lo que se le prometió a la familia por UN período del plan de '
  'guardería, congelado centavo a centavo. El cobro lo LEE y jamás lo '
  'recalcula: el comprobante dice lo que se cobró, no lo que hoy daría la cuenta.';

ALTER TABLE public.guarderia_suscripcion_desglose ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS guarderia_suscripcion_desglose_select
  ON public.guarderia_suscripcion_desglose;
CREATE POLICY guarderia_suscripcion_desglose_select
  ON public.guarderia_suscripcion_desglose FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.guarderia_suscripciones s
     WHERE s.id = guarderia_suscripcion_desglose.guarderia_suscripcion_id
       /* 🔴 EL PREDICADO ES EL DEL VECINO, COPIADO. `guarderia_suscripciones`
          gatea con este EXISTS inline sobre `familia_miembro`; medido,
          `user_es_de_familia` NO EXISTE en esta base. *Un desglose que se lee
          con una regla distinta de la de su sujeto es una segunda respuesta a
          quién es la familia.* */
       AND (EXISTS (SELECT 1 FROM public.familia_miembro fm
                     WHERE fm.familia_id = s.familia_id
                       AND fm.user_id = auth.uid() AND fm.hasta IS NULL)
            OR public.user_gestiona_prestador(s.prestador_id)
            OR public.is_admin())));

/* 🔴 L-140 · la escritura vive SOLO en la función DEFINER. Sin este REVOKE,
   `authenticated` hereda el INSERT por default privileges y **una familia
   podría congelarse el desglose que quiera**, o sea decidir cuánto se le
   cobra. Es la puerta por la que se llevan la plata, no un permiso de más. */
REVOKE ALL ON public.guarderia_suscripcion_desglose FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.guarderia_suscripcion_desglose TO authenticated;

-- ── ② EL CONGELADOR ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.congelar_desglose_mensualidad_guarderia(
  p_suscripcion_id uuid,
  p_periodo        date
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_s record; v_moneda text; v_fee uuid; v_base numeric(14,2); v_iva numeric(14,2);
BEGIN
  /* Server-only: la llama el motor, jamás una sesión. Mismo molde que el resto
     de las DEFINER de pagos. */
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'solo_servidor' USING ERRCODE='42501';
  END IF;
  IF p_periodo IS NULL THEN
    RAISE EXCEPTION 'periodo_requerido' USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_s FROM guarderia_suscripciones WHERE id = p_suscripcion_id;
  IF v_s.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo','mensualidad_no_existe');
  END IF;

  /* 🔴 EL PRECIO SALE DEL MANDATO, no del catálogo de hoy. `precio_mensual` se
     congeló al firmar. *Leer el precio vigente al cobrar le cambiaría a la
     familia el número que autorizó, sin que nadie lo decidiera.* */
  IF v_s.precio_mensual IS NULL OR v_s.precio_mensual <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'codigo','mandato_sin_precio');
  END IF;

  /* 🔴 LA MONEDA SE RESUELVE Y SE CONGELA — y NO se inventa. Mismo criterio
     que `_trg_cita_congela_desglose`: sin moneda no se congela nada, y el
     cobro rebota fail-closed diciendo que falta el desglose. *Un desglose con
     una moneda supuesta cobra en una moneda que nadie eligió.* */
  SELECT cc.moneda INTO v_moneda
    FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
   WHERE pr.id = v_s.prestador_id;
  IF v_moneda IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo','sin_moneda');
  END IF;

  SELECT rfa.fee_config_id INTO v_fee
    FROM prestadores pr
    JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
    CROSS JOIN LATERAL _resolver_fee_aplicable(
      p_cuenta_comercial_id => cc.id,
      p_tipo_actor          => 'prestador_servicios'::tipo_actor_enum,
      p_country_code        => pr.country_code,
      p_revenue_stream      => 'transaccional'::revenue_stream_enum,
      p_tipo_origen         => 'cita',
      p_categoria_origen    => NULL,
      p_fecha_referencia    => now()) rfa
   WHERE pr.id = v_s.prestador_id;

  /* 🔴 EL IVA SE DERIVA, JAMÁS SE TECLEA — y hoy deriva en 0 **por dato**, no
     por costumbre: los servicios no llevan IVA en el catálogo, que es
     exactamente lo que dicen las dos congeladoras que ya existen
     (`_trg_cita_congela_desglose`, `_trg_bono_congela_desglose`). El día que
     un servicio tribute, este 0 deja de ser correcto **por dato** y se cambia
     acá y en sus dos hermanas, en el mismo acto. */
  v_base := round(v_s.precio_mensual, 2);
  v_iva  := 0;

  INSERT INTO guarderia_suscripcion_desglose
    (guarderia_suscripcion_id, periodo, subtotal, impuesto, total, moneda, fee_config_id)
  VALUES (v_s.id, p_periodo, v_base, v_iva, v_base + v_iva, v_moneda, v_fee)
  /* Se congela UNA vez. Un segundo llamado sobre el mismo período **no
     re-congela**: si el precio del mandato cambió, el período ya vendido
     conserva el suyo. */
  ON CONFLICT (guarderia_suscripcion_id, periodo) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'suscripcion_id', v_s.id, 'periodo', p_periodo,
    'subtotal', v_base, 'impuesto', v_iva, 'total', v_base + v_iva, 'moneda', v_moneda,
    'ya_estaba', NOT FOUND);
END $fn$;

REVOKE ALL ON FUNCTION public.congelar_desglose_mensualidad_guarderia(uuid, date)
  FROM anon, authenticated, PUBLIC;

COMMENT ON FUNCTION public.congelar_desglose_mensualidad_guarderia(uuid, date) IS
  'S108-B · congela el desglose de UN período del plan de guardería. '
  'Idempotente. La llama el motor ANTES de cobrar — sin desglose no hay cobro. '
  'Contrato con S108-A: A la invoca donde su diseño abra el período.';

-- ═══ CINTURÓN — sobre un caso VIVO, con control positivo y rojos producidos ══
/* 🔴 Se ABORTA si no hay una suscripción real contra la cual probar. *Un
   cinturón que no encuentra su caso no está «pasando»: no midió nada.* */
DO $cinturon$
DECLARE
  v_susc uuid; v_r jsonb; v_r2 jsonb; v_n int;
  v_periodo constant date := DATE '1999-01-01';   -- centinela, jamás un período real
BEGIN
  SELECT id INTO v_susc FROM guarderia_suscripciones LIMIT 1;
  IF v_susc IS NULL THEN
    RAISE EXCEPTION 'CINTURON: no hay suscripción viva con la que DISCRIMINAR — '
      'no se declara verde sobre una prueba que no corrió';
  END IF;

  -- ── (a) CONTROL POSITIVO: congela de verdad ──────────────────────────────
  v_r := congelar_desglose_mensualidad_guarderia(v_susc, v_periodo);
  IF (v_r->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'CINTURON: el congelador NO congeló · %', v_r;
  END IF;
  IF (v_r->>'ya_estaba')::boolean THEN
    RAISE EXCEPTION 'CINTURON: dijo «ya estaba» sobre un período centinela nuevo';
  END IF;
  SELECT count(*) INTO v_n FROM guarderia_suscripcion_desglose
   WHERE guarderia_suscripcion_id = v_susc AND periodo = v_periodo;
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: esperaba 1 fila congelada, hay %', v_n; END IF;

  -- ── (b) IDEMPOTENCIA: el segundo llamado NO re-congela ───────────────────
  v_r2 := congelar_desglose_mensualidad_guarderia(v_susc, v_periodo);
  IF (v_r2->>'ya_estaba')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'CINTURON: re-congeló un período ya congelado · %', v_r2;
  END IF;

  -- ── (c) ROJO: el total tiene que cerrar ──────────────────────────────────
  /* No alcanza con que el CHECK exista: se produce el rojo. */
  BEGIN
    INSERT INTO guarderia_suscripcion_desglose
      (guarderia_suscripcion_id, periodo, subtotal, impuesto, total, moneda)
    VALUES (v_susc, DATE '1999-02-01', 100, 15, 999, 'USD');
    RAISE EXCEPTION 'CINTURON: aceptó un total que NO cierra';
  EXCEPTION WHEN check_violation THEN NULL;   -- 🔴 sólo check_violation vale
  END;

  -- ── (d) 🔴 EL ROJO QUE IMPORTA: la familia NO puede escribirse su desglose ─
  /* Se mide con `has_table_privilege`, jamás con un LIKE sobre `relacl`: la
     lección de S92 es que un REVOKE que deja `PUBLIC` intacto no cierra nada,
     y sólo el privilegio efectivo lo dice. */
  IF has_table_privilege('authenticated','public.guarderia_suscripcion_desglose','INSERT')
     OR has_table_privilege('anon','public.guarderia_suscripcion_desglose','INSERT') THEN
    RAISE EXCEPTION 'CINTURON: authenticated/anon PUEDE insertar su propio desglose';
  END IF;
  IF NOT has_table_privilege('authenticated','public.guarderia_suscripcion_desglose','SELECT') THEN
    RAISE EXCEPTION 'CINTURON: la familia no puede LEER su desglose (se pasó de cerrado)';
  END IF;
  IF has_function_privilege('anon','public.congelar_desglose_mensualidad_guarderia(uuid,date)','EXECUTE')
     OR has_function_privilege('authenticated','public.congelar_desglose_mensualidad_guarderia(uuid,date)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: el congelador es ejecutable desde el bundle';
  END IF;

  -- ── (e) RESIDUO 0 ────────────────────────────────────────────────────────
  DELETE FROM guarderia_suscripcion_desglose WHERE periodo IN (DATE '1999-01-01', DATE '1999-02-01');
  SELECT count(*) INTO v_n FROM guarderia_suscripcion_desglose;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: quedó residuo · % filas', v_n; END IF;

  RAISE NOTICE 'CINTURON S108B OK · positivo 1/1 · idempotencia 1/1 · rojos 2/2 · permisos 3/3 · residuo 0';
END $cinturon$;
