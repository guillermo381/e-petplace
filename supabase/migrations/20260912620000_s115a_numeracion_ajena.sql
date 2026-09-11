-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LA NUMERACIÓN AJENA — cuando el XML lo arma el proveedor
--
-- 🔴 LA EXENCIÓN ES DE OCHO DÍGITOS, NO DE LA CLAVE.
--    El pedido fue «declarar exenta la reconstrucción para documentos de
--    proveedor externo, igual que la factura recibida de la clínica». Medido,
--    NO es igual y tratarlo igual costaría caro:
--
--    · La factura de la clínica es `recibido`: NADA de esa clave es nuestro, y
--      lo único verificable es su dígito verificador.
--    · Una factura que Factuplan numera sigue siendo NUESTRA venta, con NUESTRO
--      RUC, NUESTRA fecha y NUESTRO establecimiento. De los 49 dígitos, el
--      proveedor elige OCHO — el código numérico (posiciones 40-47). Los otros
--      41 tienen que seguir cuadrando con la fila.
--
--    *Declararla exenta entera aceptaría en silencio una clave con el RUC de
--    OTRO emisor* — que es exactamente el riesgo que el founder nombró al pedir
--    verificar el RUC contra el XML autorizado, sólo que verificado por el
--    motor en cada fila en vez de por alguien mirando el primer XML.
--
-- 🔴 Y LA OTRA MITAD: EN ESE MODO NO SE TOMA SECUENCIAL.
--    `tomar_secuencial_fiscal` consume un número de NUESTRO contador. Si el que
--    vale es el del proveedor, cada emisión quemaría uno de los nuestros para
--    nada: huecos en la numeración con el mismo mecanismo de `D-1060`, pero
--    sistemático en vez de accidental.
--
-- EDGES A DESPLEGAR CON ESTA MIGRACIÓN (corolario `L-536`):
--   fiscal-emitir · fiscal-webhook
--   pnpm edge:desplegar fiscal-emitir && pnpm edge:desplegar fiscal-webhook
--
-- Veda 76(g): NO RIGE — DDL + reemplazo de funciones, sin backfill de datos.
-- Reversa: docs/relevamientos/S115-A-REVERSA-20260912620000-numeracion-ajena.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① EL EJE NUEVO, que no es el de `sentido` ────────────────────────────────
-- `sentido` dice si la venta es nuestra. `numeracion_origen` dice quién eligió
-- el número. Son ortogonales: una venta NUESTRA puede llevar número AJENO, y
-- ése es justo el caso que no se podía expresar.
ALTER TABLE public.documentos_fiscales
  ADD COLUMN IF NOT EXISTS numeracion_origen text NOT NULL DEFAULT 'casa';

ALTER TABLE public.documentos_fiscales
  DROP CONSTRAINT IF EXISTS chk_documento_fiscal_numeracion_origen;
ALTER TABLE public.documentos_fiscales
  ADD CONSTRAINT chk_documento_fiscal_numeracion_origen
  CHECK (numeracion_origen IN ('casa', 'proveedor'));

COMMENT ON COLUMN public.documentos_fiscales.numeracion_origen IS
  'Quién eligió el número: casa (nuestro secuencial + clave derivada) o '
  'proveedor (el proveedor numera; se anota lo que devuelve y se verifican '
  'los 41 dígitos que siguen siendo nuestros).';

-- ── ② EL CHECK, con su tercera rama ──────────────────────────────────────────
ALTER TABLE public.documentos_fiscales
  DROP CONSTRAINT IF EXISTS chk_documento_fiscal_clave_reconstruible;
ALTER TABLE public.documentos_fiscales
  ADD CONSTRAINT chk_documento_fiscal_clave_reconstruible CHECK (
    clave_acceso IS NULL

    /* (a) La casa numera: la clave es una FUNCIÓN de la fila, byte a byte. */
    OR (sentido = 'emitido' AND numeracion_origen = 'casa'
        AND clave_acceso = public.fiscal_clave_acceso(
              fecha_emision, tipo, ruc_emisor, sri_ambiente,
              establecimiento, punto_emision, secuencial))

    /* (b) El proveedor numera: se verifican los 41 dígitos que son nuestros.
           `left(...,39)` = fecha · tipo · RUC · ambiente · serie · secuencial.
           Sale de la MISMA función que la rama (a) porque los primeros 39
           dígitos no dependen del código numérico — así no hay una segunda
           implementación del formato que pueda divergir de la primera.
           Posición 48 = tipo de emisión, que es 1 (normal) también para ellos.
           Lo único libre son las posiciones 40-47. */
    OR (sentido = 'emitido' AND numeracion_origen = 'proveedor'
        AND clave_acceso ~ '^[0-9]{49}$'
        AND secuencial IS NOT NULL
        AND left(clave_acceso, 39) = left(public.fiscal_clave_acceso(
              fecha_emision, tipo, ruc_emisor, sri_ambiente,
              establecimiento, punto_emision, secuencial), 39)
        AND substring(clave_acceso, 48, 1) = '1'
        AND public._fiscal_dv_modulo11(left(clave_acceso, 48)) = right(clave_acceso, 1)::integer)

    /* (c) Recibido: la clave es de otro emisor. Sólo su dígito verificador. */
    OR (sentido = 'recibido' AND clave_acceso ~ '^[0-9]{49}$'
        AND public._fiscal_dv_modulo11(left(clave_acceso, 48)) = right(clave_acceso, 1)::integer)
  );

-- ── ③ `emitiendo` SIN secuencial es legal SÓLO si numera el proveedor ────────
-- Antes: todo `emitido` fuera de los estados de reposo exigía secuencial. En
-- modo proveedor el secuencial LLEGA CON LA RESPUESTA, así que la ventana entre
-- el POST y el aviso existe y es legítima. Lo que NO se afloja: `autorizada`
-- sigue exigiéndolo — *si el proveedor no dijo con qué número quedó, el
-- documento no está autorizado para nosotros aunque lo esté para él.*
ALTER TABLE public.documentos_fiscales
  DROP CONSTRAINT IF EXISTS chk_documento_fiscal_emitido_declara_secuencial;
ALTER TABLE public.documentos_fiscales
  ADD CONSTRAINT chk_documento_fiscal_emitido_declara_secuencial CHECK (
    sentido <> 'emitido'
    OR estado = ANY (ARRAY['borrador','esperando_receptor','pendiente_manual','anulada']::fiscal_estado_enum[])
    OR (numeracion_origen = 'proveedor' AND estado = 'emitiendo')
    OR (establecimiento IS NOT NULL AND punto_emision IS NOT NULL AND secuencial IS NOT NULL)
  );

-- ── ④ LA RESERVA, con su rama de numeración ajena ───────────────────────────
-- 🔴 DROP explícito de la firma de 8 argumentos ANTES de crear la de 9:
--    `CREATE OR REPLACE` con parámetros distintos NO reemplaza — crea una
--    SOBRECARGA y deja la vieja viva (L-119). Con el default, toda llamada de
--    8 argumentos quedaría AMBIGUA y el motor rebota `is not unique`: la edge
--    que emite dejaría de poder reservar un número.
DROP FUNCTION IF EXISTS public.fiscal_reservar_numero(uuid, jsonb, integer, text, numeric, numeric, numeric, numeric);

CREATE OR REPLACE FUNCTION public.fiscal_reservar_numero(
  p_documento_id uuid, p_canonico jsonb, p_canonico_version integer,
  p_proveedor text, p_subtotal_0 numeric, p_subtotal_15 numeric,
  p_iva numeric, p_total numeric,
  p_numeracion_origen text DEFAULT 'casa'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_d public.documentos_fiscales; v_e public.fiscal_emisor;
  v_sec text; v_clave text; v_amb text; v_filas int;
BEGIN
  IF p_numeracion_origen NOT IN ('casa', 'proveedor') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'numeracion_origen_invalido',
                              'valor', p_numeracion_origen);
  END IF;

  SELECT * INTO v_d FROM public.documentos_fiscales WHERE id = p_documento_id FOR UPDATE;
  IF v_d.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'documento_no_existe');
  END IF;

  /* IDEMPOTENTE: si ya tiene número, se devuelve el que tiene. Un reintento
     que toma número nuevo no es un reintento — es un documento nuevo, y el
     anterior queda como hueco. */
  IF v_d.secuencial IS NOT NULL AND v_d.clave_acceso IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'codigo', 'ya_tenia',
      'secuencial', v_d.secuencial, 'clave_acceso', v_d.clave_acceso);
  END IF;

  SELECT * INTO v_e FROM public.fiscal_emisor LIMIT 1;
  IF v_e.ruc IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_emisor_configurado');
  END IF;
  v_amb := CASE v_e.ambiente WHEN 1 THEN 'pruebas' WHEN 2 THEN 'produccion' ELSE NULL END;
  IF v_amb IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'ambiente_invalido', 'valor', v_e.ambiente);
  END IF;

  /* ── RAMA AJENA: se prepara el documento y NO se toca el contador ──────────
     🔴 Lo que NO se hace acá es la mitad importante: no se llama a
     `tomar_secuencial_fiscal`. El número lo elige el proveedor y llega con su
     respuesta; quemar uno nuestro «por las dudas» dejaría un hueco por cada
     emisión. El documento queda `emitiendo` sin secuencial — estado que el
     CHECK admite SÓLO en esta rama — y `fiscal_anotar_numero_ajeno` lo cierra. */
  IF p_numeracion_origen = 'proveedor' THEN
    UPDATE public.documentos_fiscales SET
      estado = 'emitiendo',
      numeracion_origen = 'proveedor',
      ruc_emisor          = v_e.ruc,
      razon_social_emisor = v_e.razon_social,
      direccion_emisor    = v_e.direccion_matriz,
      sri_ambiente     = v_amb,
      canonico         = p_canonico,
      canonico_version = p_canonico_version,
      proveedor        = p_proveedor,
      subtotal_0  = p_subtotal_0,
      subtotal_15 = p_subtotal_15,
      iva         = p_iva,
      total       = COALESCE(p_total, total)
    WHERE id = p_documento_id;

    GET DIAGNOSTICS v_filas = ROW_COUNT;
    IF v_filas <> 1 THEN
      RAISE EXCEPTION 'persistencia_afecto_% _filas', v_filas
        USING ERRCODE = '25000',
              DETAIL  = 'La preparacion del documento no llego a la fila.';
    END IF;

    RETURN jsonb_build_object('ok', true, 'codigo', 'preparado_numera_el_proveedor',
      'secuencial', NULL, 'clave_acceso', NULL, 'filas', v_filas);
  END IF;

  /* ── RAMA CASA (la de siempre) ────────────────────────────────────────────
     ① El número. Dentro de ESTA transacción: si algo de abajo rebota, vuelve. */
  v_sec := public.tomar_secuencial_fiscal(v_e.ruc, v_e.establecimiento, v_e.punto_emision, v_d.tipo);

  /* ② La clave, derivada — la MISMA función que el CHECK usa para verificarla. */
  v_clave := public.fiscal_clave_acceso(v_d.fecha_emision, v_d.tipo, v_e.ruc, v_amb,
                                        v_e.establecimiento, v_e.punto_emision, v_sec);
  IF v_clave IS NULL THEN
    RAISE EXCEPTION 'clave_no_derivable'
      USING ERRCODE = '22023',
            DETAIL = format('ruc=%s amb=%s estab=%s punto=%s sec=%s fecha=%s',
                            v_e.ruc, v_amb, v_e.establecimiento, v_e.punto_emision,
                            v_sec, v_d.fecha_emision);
  END IF;

  UPDATE public.documentos_fiscales SET
    estado = 'emitiendo',
    numeracion_origen = 'casa',
    establecimiento = v_e.establecimiento,
    punto_emision   = v_e.punto_emision,
    secuencial      = v_sec,
    clave_acceso    = v_clave,
    ruc_emisor      = v_e.ruc,
    razon_social_emisor = v_e.razon_social,
    direccion_emisor    = v_e.direccion_matriz,
    sri_ambiente    = v_amb,
    canonico         = p_canonico,
    canonico_version = p_canonico_version,
    proveedor        = p_proveedor,
    subtotal_0  = p_subtotal_0,
    subtotal_15 = p_subtotal_15,
    iva         = p_iva,
    total       = COALESCE(p_total, total)
  WHERE id = p_documento_id;

  GET DIAGNOSTICS v_filas = ROW_COUNT;
  /* 🔴 CERO FILAS ES UN ROJO, NO UN SILENCIO. */
  IF v_filas <> 1 THEN
    RAISE EXCEPTION 'persistencia_afecto_% _filas', v_filas
      USING ERRCODE = '25000',
            DETAIL = 'La reserva del numero no llego a la fila. El secuencial NO se consume.';
  END IF;

  RETURN jsonb_build_object('ok', true, 'codigo', 'reservado',
    'secuencial', v_sec, 'clave_acceso', v_clave, 'filas', v_filas);
END $function$;

REVOKE EXECUTE ON FUNCTION public.fiscal_reservar_numero(uuid, jsonb, integer, text, numeric, numeric, numeric, numeric, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fiscal_reservar_numero(uuid, jsonb, integer, text, numeric, numeric, numeric, numeric, text) TO service_role;

-- ── ⑤ ANOTAR EL NÚMERO QUE ELIGIÓ EL PROVEEDOR ──────────────────────────────
-- 🔴 DIAGNOSTICA POR SEGMENTO, no por constraint. El CHECK ya impide guardar
--    una clave incoherente, pero lo hace con un `23514` que dice el nombre de
--    la restricción y nada más. *«El RUC de la clave no es el nuestro» y «el
--    secuencial no coincide» son dos problemas distintos con dos culpables
--    distintos, y el código de constraint los vuelve el mismo.* Esta función
--    existe para que la PRIMERA prueba en sandbox devuelva información en vez
--    de un número de error.
CREATE OR REPLACE FUNCTION public.fiscal_anotar_numero_ajeno(
  p_documento_id uuid,
  p_clave text,
  p_secuencial text,
  p_establecimiento text DEFAULT NULL,
  p_punto_emision text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_d public.documentos_fiscales; v_e public.fiscal_emisor;
  v_estab text; v_punto text; v_esperado text; v_filas int;
BEGIN
  SELECT * INTO v_d FROM public.documentos_fiscales WHERE id = p_documento_id FOR UPDATE;
  IF v_d.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'documento_no_existe');
  END IF;

  IF v_d.numeracion_origen <> 'proveedor' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'documento_numera_la_casa',
      'detalle', 'Este documento ya tiene numero propio; anotar uno ajeno lo duplicaria.');
  END IF;

  /* Idempotente, y con el borde que importa: la MISMA clave se acepta (un
     webhook reintentado no es un hecho nuevo); una clave DISTINTA se rechaza
     — serian dos comprobantes reales para un solo documento. */
  IF v_d.clave_acceso IS NOT NULL THEN
    IF v_d.clave_acceso = p_clave THEN
      RETURN jsonb_build_object('ok', true, 'codigo', 'ya_tenia',
        'secuencial', v_d.secuencial, 'clave_acceso', v_d.clave_acceso);
    END IF;
    RETURN jsonb_build_object('ok', false, 'codigo', 'clave_distinta_ya_anotada',
      'clave_guardada', v_d.clave_acceso, 'clave_recibida', p_clave);
  END IF;

  IF p_clave !~ '^[0-9]{49}$' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'clave_formato',
      'largo', length(COALESCE(p_clave, '')));
  END IF;
  IF p_secuencial !~ '^[0-9]{9}$' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'secuencial_formato',
      'valor', p_secuencial);
  END IF;

  SELECT * INTO v_e FROM public.fiscal_emisor LIMIT 1;
  IF v_e.ruc IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_emisor_configurado');
  END IF;
  v_estab := COALESCE(p_establecimiento, v_e.establecimiento);
  v_punto := COALESCE(p_punto_emision,   v_e.punto_emision);

  /* ── EL COTEJO, SEGMENTO POR SEGMENTO ───────────────────────────────────── */
  IF substring(p_clave, 11, 13) <> v_d.ruc_emisor THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'clave_con_ruc_ajeno',
      'ruc_en_la_clave', substring(p_clave, 11, 13), 'ruc_nuestro', v_d.ruc_emisor,
      'detalle', 'El proveedor emitio con OTRO contribuyente. No se anota.');
  END IF;
  IF substring(p_clave, 1, 8) <> to_char(v_d.fecha_emision, 'DDMMYYYY') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'clave_con_otra_fecha',
      'fecha_en_la_clave', substring(p_clave, 1, 8),
      'fecha_de_la_fila', to_char(v_d.fecha_emision, 'DDMMYYYY'));
  END IF;
  IF substring(p_clave, 31, 9) <> p_secuencial THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'clave_y_secuencial_no_coinciden',
      'secuencial_en_la_clave', substring(p_clave, 31, 9), 'secuencial_recibido', p_secuencial);
  END IF;
  IF public._fiscal_dv_modulo11(left(p_clave, 48)) <> right(p_clave, 1)::integer THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'digito_verificador',
      'esperado', public._fiscal_dv_modulo11(left(p_clave, 48)), 'recibido', right(p_clave, 1));
  END IF;

  v_esperado := left(public.fiscal_clave_acceso(v_d.fecha_emision, v_d.tipo, v_d.ruc_emisor,
                       v_d.sri_ambiente, v_estab, v_punto, p_secuencial), 39);
  IF left(p_clave, 39) <> v_esperado THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'clave_no_cuadra_con_la_fila',
      'prefijo_recibido', left(p_clave, 39), 'prefijo_esperado', v_esperado,
      'detalle', 'Difieren ambiente, serie o tipo de comprobante.');
  END IF;

  UPDATE public.documentos_fiscales SET
    establecimiento = v_estab,
    punto_emision   = v_punto,
    secuencial      = p_secuencial,
    clave_acceso    = p_clave
  WHERE id = p_documento_id;

  GET DIAGNOSTICS v_filas = ROW_COUNT;
  IF v_filas <> 1 THEN
    RAISE EXCEPTION 'anotacion_afecto_% _filas', v_filas USING ERRCODE = '25000';
  END IF;

  RETURN jsonb_build_object('ok', true, 'codigo', 'anotado',
    'secuencial', p_secuencial, 'clave_acceso', p_clave,
    'codigo_numerico_del_proveedor', substring(p_clave, 40, 8));
END $function$;

REVOKE EXECUTE ON FUNCTION public.fiscal_anotar_numero_ajeno(uuid, text, text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fiscal_anotar_numero_ajeno(uuid, text, text, text, text) TO service_role;

-- ── ⑤bis EL TRIGGER QUE EXPLICA, con la MISMA tercera rama ─────────────────
-- 🔴 UN GUARD DE DOS CAPAS SE ENMIENDA DOS VECES, O LA CAPA QUE NO APRENDIÓ
--    MANDA (L-424 cobrada sobre sí misma). El CHECK es el piso que no se puede
--    saltear; el trigger EXPLICA. Acá el CHECK aprendió la numeración ajena y
--    el trigger no: el cinturón ABORTÓ escribiendo una clave del proveedor que
--    el CHECK aceptaba y el trigger rechazaba con `clave_no_reconstruible`.
--    *Las dos piezas eran correctas por separado y juntas eran incompatibles* —
--    y el rebote lo produjo el fixture, no producción, porque el cinturón corre
--    ANTES de que la migración se registre.
CREATE OR REPLACE FUNCTION public._trg_documento_fiscal_clave_coherente()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_esperada text;
BEGIN
  IF NEW.clave_acceso IS NULL THEN RETURN NEW; END IF;   -- borrador sin clave: legal

  IF NEW.sentido = 'recibido' THEN
    IF NEW.clave_acceso !~ '^[0-9]{49}$' THEN
      RAISE EXCEPTION 'clave_recibida_mal_formada'
        USING ERRCODE = '23514',
              DETAIL = 'Una clave de acceso son 49 digitos. Llego: ' || length(NEW.clave_acceso) || '.';
    END IF;
    IF public._fiscal_dv_modulo11(left(NEW.clave_acceso, 48)) <> right(NEW.clave_acceso, 1)::int THEN
      RAISE EXCEPTION 'clave_recibida_digito_verificador'
        USING ERRCODE = '23514',
              DETAIL = 'El digito verificador no cierra: se esperaba '
                       || public._fiscal_dv_modulo11(left(NEW.clave_acceso, 48))
                       || ' y dice ' || right(NEW.clave_acceso, 1) || '.',
              HINT = 'La clave de un tercero se transcribe, no se inventa: se relee del papel.';
    END IF;
    RETURN NEW;
  END IF;

  v_esperada := public.fiscal_clave_acceso(
                  NEW.fecha_emision, NEW.tipo, NEW.ruc_emisor, NEW.sri_ambiente,
                  NEW.establecimiento, NEW.punto_emision, NEW.secuencial);

  IF v_esperada IS NULL THEN
    RAISE EXCEPTION 'clave_sin_insumos'
      USING ERRCODE = '23514',
            DETAIL = format('Falta o es invalido alguno de: fecha_emision=%s tipo=%s '
                            'ruc_emisor=%s sri_ambiente=%s establecimiento=%s '
                            'punto_emision=%s secuencial=%s',
                            NEW.fecha_emision, NEW.tipo, NEW.ruc_emisor, NEW.sri_ambiente,
                            NEW.establecimiento, NEW.punto_emision, NEW.secuencial),
            HINT = 'Una clave sin sus insumos es exactamente lo irreconstruible: '
                   'o viajan los siete datos, o no viaja la clave.';
  END IF;

  /* ── NUMERACIÓN AJENA: se exigen los 41 dígitos nuestros, no los 49 ────────
     El proveedor elige el codigo numerico (40-47). Todo lo demas —fecha, tipo,
     RUC, ambiente, serie, secuencial, tipo de emision y el verificador— tiene
     que cuadrar igual. *No es una exencion de la coherencia: es la exencion de
     los ocho digitos que de verdad son suyos.* */
  IF NEW.numeracion_origen = 'proveedor' THEN
    IF left(NEW.clave_acceso, 39) <> left(v_esperada, 39) THEN
      RAISE EXCEPTION 'clave_ajena_no_cuadra_con_la_fila'
        USING ERRCODE = '23514',
              DETAIL = 'prefijo esperado=' || left(v_esperada, 39)
                       || ' · llego=' || left(NEW.clave_acceso, 39),
              HINT = 'El proveedor elige los 8 digitos del codigo numerico. '
                     'Fecha, RUC, ambiente, serie y secuencial siguen siendo de la fila.';
    END IF;
    IF substring(NEW.clave_acceso, 48, 1) <> '1' THEN
      RAISE EXCEPTION 'clave_ajena_tipo_emision'
        USING ERRCODE = '23514',
              DETAIL = 'tipoEmision=' || substring(NEW.clave_acceso, 48, 1) || ', se espera 1 (normal).';
    END IF;
    IF public._fiscal_dv_modulo11(left(NEW.clave_acceso, 48)) <> right(NEW.clave_acceso, 1)::int THEN
      RAISE EXCEPTION 'clave_ajena_digito_verificador'
        USING ERRCODE = '23514',
              DETAIL = 'esperado=' || public._fiscal_dv_modulo11(left(NEW.clave_acceso, 48))
                       || ' · llego=' || right(NEW.clave_acceso, 1);
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.clave_acceso <> v_esperada THEN
    RAISE EXCEPTION 'clave_no_reconstruible'
      USING ERRCODE = '23514',
            DETAIL = 'esperada=' || v_esperada || ' - llego=' || NEW.clave_acceso,
            HINT = 'La clave se DERIVA de la fila. Para otra clave se cambia el dato '
                   'que la produce (secuencial, fecha, establecimiento...), no la clave.';
  END IF;

  RETURN NEW;
END $function$;

-- ── ⑥ CINTURÓN — con su ROJO PROBADO ────────────────────────────────────────
-- 🔴 La primera prueba de un guard nuevo no es que dé VERDE: es que dé ROJO
--    sobre el caso que existe para impedir (L-459). Acá los dos rojos que
--    importan son los que un «declararlo exento» habría dejado pasar: una
--    clave con el RUC de otro contribuyente, y una clave que no cuadra con la
--    serie de la fila.
DO $cint$
DECLARE
  v_id uuid; v_e public.fiscal_emisor;
  v_clave_casa text; v_clave_prov text; v_clave_ajena text;
  v_sec text := '000000777'; v_fecha date := current_date;
  v_sec_antes text; v_sec_despues text; v_r jsonb; v_ok boolean;
BEGIN
  SELECT * INTO v_e FROM public.fiscal_emisor LIMIT 1;
  IF v_e.ruc IS NULL THEN RAISE EXCEPTION 'cinturon: sin emisor configurado'; END IF;

  INSERT INTO public.documentos_fiscales
    (tipo, sentido, estado, total, fecha_emision, ruc_emisor, sri_ambiente,
     establecimiento, punto_emision, numeracion_origen)
  VALUES ('factura', 'emitido', 'borrador', 1.00, v_fecha, v_e.ruc, 'pruebas',
          v_e.establecimiento, v_e.punto_emision, 'proveedor')
  RETURNING id INTO v_id;

  v_clave_casa := public.fiscal_clave_acceso(v_fecha, 'factura', v_e.ruc, 'pruebas',
                    v_e.establecimiento, v_e.punto_emision, v_sec);

  /* La clave del proveedor: mismos 39 primeros, OTRO codigo numerico, DV nuevo. */
  v_clave_prov := left(v_clave_casa, 39) || '42424242' || '1';
  v_clave_prov := v_clave_prov || public._fiscal_dv_modulo11(v_clave_prov)::text;

  -- ── ROJO 1 · el proveedor emitio con OTRO RUC ─────────────────────────────
  v_clave_ajena := substring(v_clave_casa, 1, 10) || '9999999999999'
                || substring(v_clave_casa, 24, 16) || '42424242' || '1';
  v_clave_ajena := v_clave_ajena || public._fiscal_dv_modulo11(v_clave_ajena)::text;
  UPDATE public.documentos_fiscales SET secuencial = v_sec WHERE id = v_id;
  v_r := public.fiscal_anotar_numero_ajeno(v_id, v_clave_ajena, v_sec);
  IF (v_r->>'codigo') <> 'clave_con_ruc_ajeno' THEN
    RAISE EXCEPTION 'cinturon R1: una clave con RUC ajeno NO reboto — devolvio %', v_r;
  END IF;

  -- ── ROJO 2 · el CHECK no deja escribirla ni salteando la funcion ──────────
  v_ok := true;
  BEGIN
    UPDATE public.documentos_fiscales SET clave_acceso = v_clave_ajena WHERE id = v_id;
  EXCEPTION WHEN check_violation THEN v_ok := false;
  END;
  IF v_ok THEN
    RAISE EXCEPTION 'cinturon R2: el CHECK acepto una clave con RUC ajeno';
  END IF;

  -- ── ROJO 3 · en modo CASA, una clave de proveedor no entra ────────────────
  v_ok := true;
  BEGIN
    UPDATE public.documentos_fiscales
       SET numeracion_origen = 'casa', clave_acceso = v_clave_prov WHERE id = v_id;
  EXCEPTION WHEN check_violation THEN v_ok := false;
  END;
  IF v_ok THEN
    RAISE EXCEPTION 'cinturon R3: modo casa acepto una clave que no deriva de la fila';
  END IF;

  -- ── VERDE · en modo PROVEEDOR, la coherente entra ─────────────────────────
  UPDATE public.documentos_fiscales
     SET numeracion_origen = 'proveedor', clave_acceso = NULL, secuencial = NULL
   WHERE id = v_id;
  v_r := public.fiscal_anotar_numero_ajeno(v_id, v_clave_prov, v_sec);
  IF (v_r->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'cinturon V1: la clave coherente del proveedor NO entro — %', v_r;
  END IF;
  IF (v_r->>'codigo_numerico_del_proveedor') <> '42424242' THEN
    RAISE EXCEPTION 'cinturon V1b: no reconocio los ocho digitos ajenos — %', v_r;
  END IF;

  -- ── VERDE · el modo proveedor NO consume secuencial de la casa ────────────
  SELECT ultimo_secuencial::text INTO v_sec_antes FROM public.fiscal_sequences
   WHERE ruc = v_e.ruc AND establecimiento = v_e.establecimiento
     AND punto_emision = v_e.punto_emision AND tipo_documento = 'factura';

  INSERT INTO public.documentos_fiscales
    (tipo, sentido, estado, total, fecha_emision, numeracion_origen)
  VALUES ('factura', 'emitido', 'borrador', 2.00, v_fecha, 'proveedor')
  RETURNING id INTO v_id;
  v_r := public.fiscal_reservar_numero(v_id, '{}'::jsonb, 3, 'factuplan',
                                       0, 2.00, 0, 2.00, 'proveedor');
  IF (v_r->>'codigo') <> 'preparado_numera_el_proveedor' THEN
    RAISE EXCEPTION 'cinturon V2: la rama ajena no preparo el documento — %', v_r;
  END IF;

  SELECT ultimo_secuencial::text INTO v_sec_despues FROM public.fiscal_sequences
   WHERE ruc = v_e.ruc AND establecimiento = v_e.establecimiento
     AND punto_emision = v_e.punto_emision AND tipo_documento = 'factura';
  IF v_sec_antes IS DISTINCT FROM v_sec_despues THEN
    RAISE EXCEPTION 'cinturon V2b: el modo proveedor QUEMO un secuencial (% -> %)',
      v_sec_antes, v_sec_despues;
  END IF;

  RAISE NOTICE 'cinturon numeracion ajena: 3 rojos + 3 verdes OK';
  RAISE EXCEPTION 'rollback_del_cinturon';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM <> 'rollback_del_cinturon' THEN RAISE; END IF;
END $cint$;

-- ── ⑦ L-140 · ninguna funcion nueva nace con EXECUTE para anon ──────────────
DO $l140$
DECLARE v_mal text;
BEGIN
  SELECT string_agg(p.proname, ', ') INTO v_mal
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('fiscal_reservar_numero', 'fiscal_anotar_numero_ajeno')
    AND has_function_privilege('anon', p.oid, 'EXECUTE');
  IF v_mal IS NOT NULL THEN
    RAISE EXCEPTION 'L-140: anon puede ejecutar %', v_mal;
  END IF;
END $l140$;
