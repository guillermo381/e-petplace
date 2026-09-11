-- S115-A · ② el bono a su valor firmado · ③ la puerta del régimen tributario
-- Reversa: docs/relevamientos/S115-A-REVERSA-20260912430000-regimen.sql
-- VEDA 76(g): NO RIGE.

BEGIN;

-- ══ ② EL MÍNIMO DEL BONO A SU VALOR FIRMADO ══════════════════════════════════
/* 🔴 Estaba en 0 y la letra dice «$50 o más». Era MI default, no una decisión: lo puse
   en cero para que el cero fuera el apagado, y así el dato quedó contradiciendo la letra.
   *Un apagado que además miente sobre el valor firmado es peor que un apagado limpio.*
   ⇒ El valor va a 50 —el firmado— y el APAGADO pasa a su bandera propia. */
UPDATE public.app_config SET valor = '50',
  descripcion = 'Monto minimo en USD para el bono de recarga de saldo (firmado: $50 o mas). El encendido NO depende de este numero: depende de saldo_bono_recarga_vivo.'
 WHERE clave = 'saldo_bono_recarga_minimo';

INSERT INTO public.app_config (clave, valor, tipo, descripcion, categoria, es_publico)
VALUES ('saldo_bono_recarga_vivo', 'false', 'booleano',
  'El bono de recarga (+3% cargando $50 o mas por DeUna) esta APAGADO hasta que el founder lo encienda. Bandera propia para que el VALOR firmado y el ENCENDIDO sean dos cosas distintas.',
  'integraciones', false)
ON CONFLICT (clave) DO NOTHING;

-- ══ ③ LA PUERTA DEL RÉGIMEN — sin esto la compuerta de liquidación no valida nada ══
/* 🔴 NO ES UN DEFECTO QUE ESTÉ EN NULL: es captura que no existía. El régimen se LEE
   del RUC del proveedor y nadie tenía dónde escribirlo. Sin este dato, la compuerta de
   la liquidación (§1.3: «sin comprobante del período, no se paga») no tiene contra qué
   validar — no sabe si esperar una factura electrónica o una nota de venta. */
CREATE OR REPLACE FUNCTION public.declarar_regimen_tributario(
  p_cuenta_comercial_id uuid, p_regimen text, p_tipo_comprobante text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_cc public.cuentas_comerciales;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sin_sesion' USING ERRCODE='42501'; END IF;

  SELECT * INTO v_cc FROM cuentas_comerciales WHERE id = p_cuenta_comercial_id;
  IF v_cc.id IS NULL THEN RAISE EXCEPTION 'cuenta_no_existe' USING ERRCODE='22023'; END IF;

  /* Lo declara SU dueño o un admin (F lo carga desde el portal). El regimen de un
     tercero no lo escribe cualquiera: decide con que documento se le paga. */
  IF NOT (v_cc.owner_profile_id = auth.uid() OR is_admin()) THEN
    RAISE EXCEPTION 'cuenta_ajena' USING ERRCODE='42501';
  END IF;

  IF p_regimen NOT IN ('general','rimpe_emprendedor','rimpe_negocio_popular') THEN
    RAISE EXCEPTION 'regimen_invalido' USING ERRCODE='22023';
  END IF;
  IF p_tipo_comprobante NOT IN ('factura_electronica','nota_venta','ninguno') THEN
    RAISE EXCEPTION 'tipo_comprobante_invalido' USING ERRCODE='22023';
  END IF;

  /* 🔴 EL PAR TIENE QUE SER COHERENTE, y la coherencia es de la NORMA, no nuestra:
     un RIMPE negocio popular emite NOTA DE VENTA; los otros dos, factura electronica.
     Dejar cualquier combinacion crearia una cuenta que dice «general» y «nota de venta»,
     y la compuerta de liquidacion esperaria un documento que ese regimen no emite. */
  IF (p_regimen = 'rimpe_negocio_popular' AND p_tipo_comprobante = 'factura_electronica')
     OR (p_regimen <> 'rimpe_negocio_popular' AND p_tipo_comprobante = 'nota_venta') THEN
    RAISE EXCEPTION 'par_regimen_comprobante_incoherente'
      USING ERRCODE='22023',
            DETAIL=format('%s no emite %s', p_regimen, p_tipo_comprobante);
  END IF;

  UPDATE cuentas_comerciales
     SET regimen_tributario     = p_regimen::public.regimen_tributario_enum,
         tipo_comprobante_emite = p_tipo_comprobante::public.tipo_comprobante_enum,
         updated_at = now()
   WHERE id = p_cuenta_comercial_id;

  /* `verificado_emisor_en` NO se toca acá a proposito: declarar no es verificar.
     Lo pone quien chequee contra «Validez de emisor» del SRI (tanda 2). */
  RETURN jsonb_build_object('ok', true, 'cuenta_comercial_id', p_cuenta_comercial_id,
    'regimen', p_regimen, 'tipo_comprobante', p_tipo_comprobante, 'verificado', false);
END $fn$;
REVOKE EXECUTE ON FUNCTION public.declarar_regimen_tributario(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.declarar_regimen_tributario(uuid, text, text) TO authenticated;

DO $$
DECLARE v text;
BEGIN
  SELECT valor INTO v FROM app_config WHERE clave='saldo_bono_recarga_minimo';
  IF v <> '50' THEN RAISE EXCEPTION 'cinturon_bono: el minimo quedo en %', v; END IF;
  SELECT valor INTO v FROM app_config WHERE clave='saldo_bono_recarga_vivo';
  IF v <> 'false' THEN RAISE EXCEPTION 'cinturon_bono_encendido: quedo en %', v; END IF;
  IF (SELECT count(*) FROM cuentas_comerciales WHERE regimen_tributario IS NOT NULL) <> 0 THEN
    RAISE EXCEPTION 'cinturon_regimen: esta migracion NO declara regimenes, solo abre la puerta';
  END IF;
END $$;

COMMIT;
