-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LA CLAVE DE ACCESO NO PUEDE DIVERGIR DE SU FILA
--
-- 🔴 EL PROBLEMA, MEDIDO POR E: lo único que ataba `clave_acceso` era UNIQUE.
--    Nada la ligaba a fecha, RUC, ambiente, establecimiento, punto de emisión ni
--    secuencial. *Una clave que no se puede recalcular no falla: deja de poder
--    verificarse, y el día que la clave y un dato de la fila discrepen no hay
--    forma de saber cuál de los dos miente.*
--
-- SE PONE COMO RESTRICCIÓN, NO COMO CHEQUEO QUE HAY QUE ACORDARSE DE CORRER, y
-- en DOS CAPAS —el precedente de `L-424`, tres veces cobrado en esta casa—:
--   · el CHECK es el piso: no se puede saltear, y una columna nueva no lo apaga;
--   · el trigger EXPLICA: dice cuál era la clave esperada y cuál llegó.
--     *Un guard que sólo sabe negarse manda a alguien a adivinar.*
--
-- ⚠️ EL MOMENTO: `documentos_fiscales` tiene **0 filas**. Es el instante más
--    barato de la historia del producto para exigir esto — con mil facturas
--    autorizadas, un CHECK con NOT VALID sería lo único posible.
--
-- 76(g) — VEDA DE ESCRITURA: **NO RIGE**. DDL + funciones nuevas; el único
--    backfill posible es sobre cero filas.
-- L-140 — las tres funciones nuevas cierran con su REVOKE explícito al pie.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- ① LA ZONA DEL EMISOR ES UN DATO, JAMÁS EL RELOJ DE QUIEN EJECUTA
--
-- 🔴 Medido: el TimeZone del servidor es **UTC**, y `fecha_emision` tenía
--    `DEFAULT CURRENT_DATE`. Desde las 19:00 de Guayaquil, `CURRENT_DATE` ya es
--    el día siguiente ⇒ un documento emitido a las 21:30 nacía con la fecha de
--    mañana. *Y no se nota: las dos fechas son plausibles por separado.*
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.fiscal_emisor
  ADD COLUMN IF NOT EXISTS zona_horaria text NOT NULL DEFAULT 'America/Guayaquil';

COMMENT ON COLUMN public.fiscal_emisor.zona_horaria IS
  'Zona horaria del EMISOR. La fecha de un comprobante es la de su emisor, no la '
  'del servidor ni la de la edge. Se lee de acá, nunca se hardcodea.';

CREATE OR REPLACE FUNCTION public.fiscal_hoy()
RETURNS date
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT (now() AT TIME ZONE
           COALESCE((SELECT zona_horaria FROM public.fiscal_emisor LIMIT 1),
                    'America/Guayaquil'))::date;
$$;

COMMENT ON FUNCTION public.fiscal_hoy() IS
  'La fecha de HOY en la zona del emisor. Es el default de documentos_fiscales.fecha_emision.';

ALTER TABLE public.documentos_fiscales
  ALTER COLUMN fecha_emision SET DEFAULT public.fiscal_hoy();

-- ─────────────────────────────────────────────────────────────────────────
-- ② EL MÓDULO 11 DEL SRI, DEL LADO DE LA BASE
--
-- Es una SEGUNDA implementación a propósito: la de TypeScript emite, ésta
-- verifica. *Si las dos salieran del mismo código, la restricción estaría
-- preguntándole a la pieza si está de acuerdo consigo misma.*
--
-- Los dos bordes son de la ficha del SRI, no invenciones: resto 0 ⇒ 0, resto
-- 1 ⇒ 1. Sin ellos el dígito sale 11 o 10 — dos caracteres donde el formato
-- admite uno, y el comprobante rebota sin decir por qué.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._fiscal_dv_modulo11(p_cuerpo48 text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_suma int := 0; v_peso int := 2; i int; v_d int;
BEGIN
  IF p_cuerpo48 IS NULL OR p_cuerpo48 !~ '^[0-9]{48}$' THEN RETURN NULL; END IF;
  FOR i IN REVERSE 48..1 LOOP
    v_suma := v_suma + (substr(p_cuerpo48, i, 1))::int * v_peso;
    v_peso := CASE WHEN v_peso = 7 THEN 2 ELSE v_peso + 1 END;
  END LOOP;
  v_d := 11 - (v_suma % 11);
  RETURN CASE WHEN v_d = 11 THEN 0 WHEN v_d = 10 THEN 1 ELSE v_d END;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- ③ LA CLAVE RECONSTRUIDA DESDE LOS DATOS DE LA FILA
--
-- ddmmaaaa(8) · tipo(2) · ruc(13) · ambiente(1) · estab(3) · punto(3)
-- · secuencial(9) · codigoNumerico(8) · tipoEmision(1) · verificador(1) = 49
--
-- El código numérico ES el secuencial sin su cero inicial — la convención de
-- las dos facturas reales medidas (Multicines 17078 → 00017078; 227ITALY
-- 126825 → 00126825). *Un código aleatorio vuelve la clave irreconstruible por
-- definición: le falta un dato que no vive en ninguna fila.*
--
-- Devuelve NULL —jamás una clave inventada— si le falta un insumo. Quien la
-- llama decide qué hacer con el NULL; ésta no adivina.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fiscal_clave_acceso(
  p_fecha            date,
  p_tipo             public.fiscal_tipo_enum,
  p_ruc              text,
  p_ambiente         text,          -- 'pruebas' | 'produccion' (el vocabulario de la columna)
  p_establecimiento  text,
  p_punto_emision    text,
  p_secuencial       text
) RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_cuerpo text; v_amb text; v_tipo text; v_sec text; v_dv int;
BEGIN
  IF p_fecha IS NULL OR p_ruc IS NULL OR p_ambiente IS NULL
     OR p_establecimiento IS NULL OR p_punto_emision IS NULL OR p_secuencial IS NULL
  THEN RETURN NULL; END IF;

  v_amb := CASE p_ambiente WHEN 'pruebas' THEN '1' WHEN 'produccion' THEN '2' ELSE NULL END;
  v_tipo := CASE p_tipo WHEN 'factura' THEN '01' WHEN 'nota_credito' THEN '04' ELSE NULL END;
  IF v_amb IS NULL OR v_tipo IS NULL THEN RETURN NULL; END IF;

  IF p_ruc !~ '^[0-9]{13}$' OR p_establecimiento !~ '^[0-9]{3}$'
     OR p_punto_emision !~ '^[0-9]{3}$' OR p_secuencial !~ '^[0-9]{1,9}$'
  THEN RETURN NULL; END IF;

  v_sec := lpad(p_secuencial, 9, '0');

  v_cuerpo := to_char(p_fecha, 'DDMMYYYY')
            || v_tipo || p_ruc || v_amb
            || p_establecimiento || p_punto_emision
            || v_sec
            || right(v_sec, 8)          -- el código numérico, DERIVADO
            || '1';                     -- tipo de emisión: 1 = normal (el único vivo)

  IF length(v_cuerpo) <> 48 THEN RETURN NULL; END IF;
  v_dv := public._fiscal_dv_modulo11(v_cuerpo);
  IF v_dv IS NULL THEN RETURN NULL; END IF;
  RETURN v_cuerpo || v_dv::text;
END $$;

COMMENT ON FUNCTION public.fiscal_clave_acceso(date, public.fiscal_tipo_enum, text, text, text, text, text) IS
  'La clave de acceso de 49 dígitos derivada de los datos de la fila. NULL si falta '
  'un insumo — jamás una clave inventada. Es la que exige el CHECK de coherencia.';

-- ─────────────────────────────────────────────────────────────────────────
-- ④ EL PISO: EL CHECK
--
-- ⚠️ EL BORDE QUE, DE NO DECLARARSE, ROMPÍA TODO: las facturas RECIBIDAS.
--    La factura de la clínica en agencia trae la clave de OTRO emisor, con SU
--    código numérico —que puede ser aleatorio: la ficha del SRI lo deja a
--    criterio de cada quien—. *Exigirle nuestra derivación sería rechazar
--    facturas legítimas de terceros por no parecerse a las nuestras.* De ellas
--    se exige lo único universal: 49 dígitos y su verificador.
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.documentos_fiscales
  ADD CONSTRAINT chk_documento_fiscal_clave_reconstruible CHECK (
    clave_acceso IS NULL
    OR (
      sentido = 'emitido'
      AND clave_acceso = public.fiscal_clave_acceso(
            fecha_emision, tipo, ruc_emisor, sri_ambiente,
            establecimiento, punto_emision, secuencial)
    )
    OR (
      sentido = 'recibido'
      AND clave_acceso ~ '^[0-9]{49}$'
      AND public._fiscal_dv_modulo11(left(clave_acceso, 48)) = right(clave_acceso, 1)::int
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- ⑤ LA VOZ: EL TRIGGER QUE EXPLICA
--
-- Corre BEFORE, así que en la práctica es el que habla; el CHECK queda de piso
-- para lo que pudiera saltearlo. *Los dos dicen lo mismo; sólo uno sabe decir
-- qué esperaba.*
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_documento_fiscal_clave_coherente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_esperada text;
BEGIN
  IF NEW.clave_acceso IS NULL THEN RETURN NEW; END IF;   -- borrador sin clave: legal

  IF NEW.sentido = 'recibido' THEN
    IF NEW.clave_acceso !~ '^[0-9]{49}$' THEN
      RAISE EXCEPTION 'clave_recibida_mal_formada'
        USING ERRCODE = '23514',
              DETAIL = 'Una clave de acceso son 49 dígitos. Llegó: ' || length(NEW.clave_acceso) || '.';
    END IF;
    IF public._fiscal_dv_modulo11(left(NEW.clave_acceso, 48)) <> right(NEW.clave_acceso, 1)::int THEN
      RAISE EXCEPTION 'clave_recibida_digito_verificador'
        USING ERRCODE = '23514',
              DETAIL = 'El dígito verificador no cierra: se esperaba '
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
            DETAIL = format('Falta o es inválido alguno de: fecha_emision=%s tipo=%s '
                            'ruc_emisor=%s sri_ambiente=%s establecimiento=%s '
                            'punto_emision=%s secuencial=%s',
                            NEW.fecha_emision, NEW.tipo, NEW.ruc_emisor, NEW.sri_ambiente,
                            NEW.establecimiento, NEW.punto_emision, NEW.secuencial),
            HINT = 'Una clave sin sus insumos es exactamente lo irreconstruible: '
                   'o viajan los siete datos, o no viaja la clave.';
  END IF;

  IF NEW.clave_acceso <> v_esperada THEN
    RAISE EXCEPTION 'clave_no_reconstruible'
      USING ERRCODE = '23514',
            DETAIL = 'esperada=' || v_esperada || ' · llegó=' || NEW.clave_acceso,
            HINT = 'La clave se DERIVA de la fila. Para otra clave se cambia el dato '
                   'que la produce (secuencial, fecha, establecimiento…), no la clave.';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_documento_fiscal_clave_coherente
  BEFORE INSERT OR UPDATE OF clave_acceso, fecha_emision, tipo, ruc_emisor,
                             sri_ambiente, establecimiento, punto_emision, secuencial, sentido
  ON public.documentos_fiscales
  FOR EACH ROW EXECUTE FUNCTION public._trg_documento_fiscal_clave_coherente();

-- ─────────────────────────────────────────────────────────────────────────
-- ⑥ L-140 — toda función nueva nace con EXECUTE para anon; se le quita.
-- ─────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.fiscal_hoy() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._fiscal_dv_modulo11(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fiscal_clave_acceso(date, public.fiscal_tipo_enum, text, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._trg_documento_fiscal_clave_coherente() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fiscal_hoy() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._fiscal_dv_modulo11(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fiscal_clave_acceso(date, public.fiscal_tipo_enum, text, text, text, text, text) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- ⑦ CINTURÓN — sobre la definición VIVA, y con su ROJO adentro.
--    *La primera prueba de un guard no es que dé VERDE: es que dé ROJO sobre
--    el primer caso real* (`L-459`).
-- ─────────────────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE
  v_ruc text; v_clave text; v_paso boolean; v_id uuid; v_msg text; v_ajena text;
BEGIN
  SELECT ruc INTO v_ruc FROM public.fiscal_emisor LIMIT 1;
  IF v_ruc IS NULL THEN RAISE EXCEPTION 'cinturon: no hay emisor configurado'; END IF;

  -- (a) la función produce 49 dígitos y su verificador cierra
  v_clave := public.fiscal_clave_acceso('2026-10-01'::date, 'factura', v_ruc,
                                        'pruebas', '001', '001', '000000042');
  IF v_clave IS NULL OR length(v_clave) <> 49 THEN
    RAISE EXCEPTION 'cinturon: la clave no salió de 49 dígitos: %', coalesce(v_clave,'(null)');
  END IF;
  IF public._fiscal_dv_modulo11(left(v_clave,48)) <> right(v_clave,1)::int THEN
    RAISE EXCEPTION 'cinturon: el verificador no cierra sobre su propia salida';
  END IF;
  IF substr(v_clave,1,8) <> '01102026' THEN
    RAISE EXCEPTION 'cinturon: la fecha en la clave no es la de la fila: %', substr(v_clave,1,8);
  END IF;
  IF substr(v_clave,40,8) <> '00000042' THEN
    RAISE EXCEPTION 'cinturon: el código numérico no se derivó del secuencial: %', substr(v_clave,40,8);
  END IF;

  -- (b) 🔴 EL ROJO: un documento con la clave alterada en UN dígito tiene que rebotar
  BEGIN
    INSERT INTO public.documentos_fiscales
      (country_code, tipo, total, estado, sentido, rol, emitida_por_tercero,
       fecha_emision, ruc_emisor, sri_ambiente, establecimiento, punto_emision,
       secuencial, clave_acceso)
    VALUES ('EC','factura',1,'emitiendo','emitido','venta_cliente',false,
            '2026-10-01', v_ruc, 'pruebas','001','001','000000042',
            overlay(v_clave placing CASE WHEN substr(v_clave,20,1)='7' THEN '8' ELSE '7' END
                    from 20 for 1))
    RETURNING id INTO v_id;
    v_paso := true;
  EXCEPTION WHEN check_violation THEN
    v_paso := false; v_msg := SQLERRM;
  END;
  IF v_paso THEN
    RAISE EXCEPTION 'cinturon 🔴: una clave alterada en un dígito ENTRÓ. El guard no guarda.';
  END IF;

  -- (c) el VERDE: la clave correcta entra, y se deshace
  INSERT INTO public.documentos_fiscales
    (country_code, tipo, total, estado, sentido, rol, emitida_por_tercero,
     fecha_emision, ruc_emisor, sri_ambiente, establecimiento, punto_emision,
     secuencial, clave_acceso)
  VALUES ('EC','factura',1,'emitiendo','emitido','venta_cliente',false,
          '2026-10-01', v_ruc, 'pruebas','001','001','000000042', v_clave)
  RETURNING id INTO v_id;
  DELETE FROM public.documentos_fiscales WHERE id = v_id;

  -- (d) una factura RECIBIDA con clave ajena bien formada PASA (el borde declarado).
  --     Se arma POR PARTES —jamás como un literal de 48 que hay que contar a ojo—
  --     y su código numérico (12345678) NO es su secuencial (999999999): es
  --     exactamente lo que nuestra derivación rechazaría y un tercero puede emitir.
  v_ajena := '01102026' || '01' || '1793240435001' || '1' || '001' || '001'
          || '999999999' || '12345678' || '1';
  IF length(v_ajena) <> 48 THEN
    RAISE EXCEPTION 'cinturon: la clave ajena de prueba salió de % y no de 48', length(v_ajena);
  END IF;
  v_ajena := v_ajena || public._fiscal_dv_modulo11(v_ajena)::text;

  -- (d) una factura RECIBIDA con clave ajena bien formada PASA (el borde declarado)
  INSERT INTO public.documentos_fiscales
    (country_code, tipo, total, estado, sentido, rol, emitida_por_tercero, fecha_emision, clave_acceso)
  VALUES ('EC','factura',1,'pendiente_manual','recibido','factura_tercero_cliente',true,
          '2026-10-01', v_ajena)
  RETURNING id INTO v_id;
  DELETE FROM public.documentos_fiscales WHERE id = v_id;

  -- (e) residuo 0
  IF (SELECT count(*) FROM public.documentos_fiscales) <> 0 THEN
    RAISE EXCEPTION 'cinturon: quedó residuo — % filas', (SELECT count(*) FROM public.documentos_fiscales);
  END IF;

  RAISE NOTICE 'cinturon VERDE: rojo probado (clave alterada rebota: %), verde probado, recibida exenta, residuo 0', left(v_msg, 60);
END $cinturon$;
