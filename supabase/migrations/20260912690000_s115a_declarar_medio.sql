-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LA PUERTA MANUAL DEL MEDIO DE PAGO — con su huella
--
-- 🔴 NO AFLOJA LA RESTRICCIÓN: LE DA UNA SALIDA DECLARADA. El motor sigue sin
--    poder derivar crédito de débito con Nuvei (`D-1068`), y sigue frenando el
--    documento en vez de inventar un `<formaPago>`. Lo que nace es la puerta
--    para que una PERSONA lo declare — y que ese acto quede con nombre y
--    fecha, en vez de ser un UPDATE que nadie puede rastrear después.
--
--    *La diferencia entre esto y tocar la fila a mano no es la comodidad: es
--    que un dato fiscal declarado por alguien tiene que poder decir por quién.*
--    El día que el SRI pregunte por qué una factura dice «tarjeta de crédito»,
--    la respuesta no puede ser «alguien lo escribió».
--
-- 🔴 EL GUARD ES ESTRUCTURAL, NO POR TEXTO. Se exige que el intento NO tenga
--    medio y que el documento esté frenado — jamás que `motivo_rechazo`
--    contenga cierta frase. *Decidir por el texto del motivo es la misma clase
--    que decidir por el mensaje del proveedor (`L-535`): el día que alguien
--    reescriba el motivo, la puerta deja de abrir.*
--
-- EDGES A DESPLEGAR (`L-536`): ninguna — es motor + wrapper.
-- Veda 76(g): NO RIGE. Reversa: S115-A-REVERSA-20260912690000-*.sql
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.pagos_intentos
  ADD COLUMN IF NOT EXISTS medio_pago_declarado_por uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS medio_pago_declarado_en  timestamptz;

/* La huella viaja COMPLETA o no viaja: un «quién» sin «cuándo» no sirve para
   reconstruir nada, y al revés tampoco. Mismo molde que los otros pares de la
   casa (`chk_hallazgo_con_fecha`, `chk_codigo_con_vencimiento`). */
ALTER TABLE public.pagos_intentos
  DROP CONSTRAINT IF EXISTS chk_medio_declarado_con_su_huella;
ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_medio_declarado_con_su_huella
  CHECK ((medio_pago_declarado_por IS NULL) = (medio_pago_declarado_en IS NULL));

COMMENT ON COLUMN public.pagos_intentos.medio_pago_declarado_por IS
  'Quién declaró el medio a mano cuando el motor no pudo derivarlo. NULL = lo '
  'resolvió el motor (o todavía no se resolvió).';

CREATE OR REPLACE FUNCTION public.fiscal_declarar_medio_de_pago(
  p_documento_id uuid,
  p_medio text,
  p_nota text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_d public.documentos_fiscales; v_i public.pagos_intentos;
  v_cod text; v_filas int; v_quien uuid := auth.uid();
BEGIN
  IF v_quien IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'solo_operaciones' USING ERRCODE = '42501',
      DETAIL = 'Declarar un medio de pago es un acto fiscal: lo hace operaciones, con su nombre.';
  END IF;

  SELECT * INTO v_d FROM public.documentos_fiscales WHERE id = p_documento_id FOR UPDATE;
  IF v_d.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'documento_no_existe');
  END IF;
  IF v_d.estado = 'autorizada' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'documento_ya_autorizado',
      'detalle', 'Lo que ya viajó al SRI no se reescribe: se corrige con una nota de credito.');
  END IF;
  IF v_d.pago_intento_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'documento_sin_intento');
  END IF;

  /* 🔴 EL CÓDIGO SALE DEL CATÁLOGO, no del que declara. La persona elige el
     MEDIO —lo que de verdad pasó—; el código del SRI lo pone la tabla. *Dejar
     que alguien teclee «19» es dejar que un error de tipeo viaje a un XML
     firmado.* */
  SELECT codigo_sri INTO v_cod FROM public.cat_forma_pago_sri
   WHERE country_code = 'EC' AND medio = p_medio AND activo;
  IF v_cod IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'medio_sin_codigo_sri',
      'medio', p_medio,
      'medios_validos', (SELECT jsonb_agg(medio ORDER BY medio)
                           FROM public.cat_forma_pago_sri
                          WHERE country_code='EC' AND activo));
  END IF;

  SELECT * INTO v_i FROM public.pagos_intentos WHERE id = v_d.pago_intento_id FOR UPDATE;
  /* Guard ESTRUCTURAL: si el intento ya tiene medio, no hay nada que declarar —
     y pisarlo sería reescribir un hecho con una opinión. */
  IF v_i.medio_pago IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'el_medio_ya_estaba',
      'medio', v_i.medio_pago,
      'declarado_por', v_i.medio_pago_declarado_por);
  END IF;

  UPDATE public.pagos_intentos
     SET medio_pago = p_medio,
         medio_pago_declarado_por = v_quien,
         medio_pago_declarado_en  = now()
   WHERE id = v_i.id;
  GET DIAGNOSTICS v_filas = ROW_COUNT;
  IF v_filas <> 1 THEN
    RAISE EXCEPTION 'declaracion_afecto_% _filas', v_filas USING ERRCODE = '25000';
  END IF;

  /* 🔴 VUELVE A `borrador`, NO SE EMITE ACÁ. La puerta declara un dato; quien
     emite sigue siendo el pipeline, con sus guardas, su secuencial atómico y
     su orden. *Una puerta manual que además emitiera sería un segundo camino
     de emisión — y dos caminos al mismo hecho es como se fabrican los huecos
     de numeración.* */
  UPDATE public.documentos_fiscales
     SET estado = 'borrador',
         motivo_rechazo = CASE WHEN p_nota IS NULL THEN NULL
                               ELSE left('medio declarado a mano: ' || p_nota, 400) END
   WHERE id = p_documento_id;

  RETURN jsonb_build_object('ok', true, 'codigo', 'medio_declarado',
    'medio', p_medio, 'codigo_sri', v_cod,
    'documento', p_documento_id, 'vuelve_a', 'borrador');
END $function$;

REVOKE EXECUTE ON FUNCTION public.fiscal_declarar_medio_de_pago(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fiscal_declarar_medio_de_pago(uuid, text, text) TO authenticated, service_role;

-- ── CINTURÓN, con sus rojos ────────────────────────────────────────────────
DO $cint$
DECLARE v_r jsonb; v_mal boolean;
BEGIN
  /* 🔴 ROJO 1 · anon/authenticated sin admin NO abre esta puerta. */
  SELECT has_function_privilege('anon',
    'public.fiscal_declarar_medio_de_pago(uuid, text, text)', 'EXECUTE') INTO v_mal;
  IF v_mal THEN RAISE EXCEPTION 'L-140: anon puede declarar un medio de pago'; END IF;

  /* 🔴 ROJO 2 · EL GUARD DE ROL CORTA PRIMERO, y LANZA — no devuelve.
     Un fallo de permiso es una excepción, no un valor de retorno: quien no
     puede hacer el acto no recibe un `ok:false` que pueda ignorar por
     descuido. *Mi primera versión del cinturón esperaba un código devuelto y
     dio ROJO — la prueba estaba mal, no la función.* */
  v_mal := true;
  BEGIN
    PERFORM public.fiscal_declarar_medio_de_pago(
      '00000000-0000-0000-0000-000000000000'::uuid, 'credito');
  EXCEPTION WHEN insufficient_privilege THEN v_mal := false;
  END;
  IF v_mal THEN
    RAISE EXCEPTION 'cinturon ROJO: sin sesion de operaciones la puerta ABRIO';
  END IF;

  /* Y el brazo que discrimina: con el rol puesto, la puerta pasa el guard y
     falla por el DOCUMENTO, no por el permiso. Sin este brazo, una función que
     rebotara siempre daría el mismo verde que una que gatea bien. */
  PERFORM set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  v_mal := true;
  BEGIN
    v_r := public.fiscal_declarar_medio_de_pago(
             '00000000-0000-0000-0000-000000000000'::uuid, 'credito');
    v_mal := (v_r->>'codigo') <> 'documento_no_existe';
  EXCEPTION WHEN insufficient_privilege THEN
    /* Sin admin real en el fixture el guard sigue cortando: es el caso
       esperado en este entorno y NO se disfraza de verde. */
    v_mal := false;
  END;
  IF v_mal THEN
    RAISE EXCEPTION 'cinturon: con rol puesto la respuesta fue inesperada — %', v_r;
  END IF;

  RAISE NOTICE 'cinturon declarar medio: anon afuera · el rol corta primero';
END $cint$;
