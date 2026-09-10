-- REVERSA de 20260912180000_s115a_libro_fiscal.sql  (escrita ANTES de aplicar)
--
-- 🔴 QUÉ NO PUEDE REVERTIR, declarado antes que nada:
--    Las 6 filas FIXTURE de `facturas` se BORRAN en la migración por firma del
--    founder («ningún dato es real»). Esta reversa NO las restaura: no existe
--    fuente de la que traerlas. Revertir devuelve la ESTRUCTURA, jamás esos datos.
--    (Sus números eran: 111 · A1234 · S97-001-000001 · CINTURON-S97-6f3e9d ·
--     001-001-000000042 · SIEMBRA-001-001-000000001 — todos con subtotales e IVA
--     en cero, items vacío, emitida_por_tercero=true. Se dejan escritos acá como
--     constancia, NO como respaldo: sus ids y sus FKs no se conservan.)
--
-- 🔴 Y LA SEGUNDA: si después de aplicar esta migración se emitió cualquier
--    documento REAL, esta reversa NO se corre — perdería el libro fiscal.
--    Verificar primero:  SELECT count(*) FROM documentos_fiscales;

BEGIN;

-- 1 · la puerta del vendedor vuelve a apuntar a `facturas`
DROP FUNCTION IF EXISTS public.registrar_factura_pedido(uuid, text, text, text, numeric, text);

-- 2 · fuera lo agregado
DROP TRIGGER IF EXISTS trg_documentos_fiscales_inmutable ON public.documentos_fiscales;
DROP FUNCTION IF EXISTS public._trg_documento_fiscal_inmutable();

ALTER TABLE public.documentos_fiscales
  DROP CONSTRAINT IF EXISTS uq_documento_fiscal_secuencial,
  DROP CONSTRAINT IF EXISTS chk_documento_fiscal_emitido_declara_secuencial,
  DROP CONSTRAINT IF EXISTS chk_documento_fiscal_nota_credito_referencia;

ALTER TABLE public.documentos_fiscales
  DROP COLUMN IF EXISTS sentido,
  DROP COLUMN IF EXISTS rol,
  DROP COLUMN IF EXISTS pago_intento_id,
  DROP COLUMN IF EXISTS tax_profile_id,
  DROP COLUMN IF EXISTS establecimiento,
  DROP COLUMN IF EXISTS punto_emision,
  DROP COLUMN IF EXISTS secuencial,
  DROP COLUMN IF EXISTS subtotal_15_nuevo,
  DROP COLUMN IF EXISTS descuento,
  DROP COLUMN IF EXISTS canonico,
  DROP COLUMN IF EXISTS canonico_version,
  DROP COLUMN IF EXISTS proveedor,
  DROP COLUMN IF EXISTS referencia_proveedor,
  DROP COLUMN IF EXISTS documento_referencia_id,
  DROP COLUMN IF EXISTS autorizado_en;

-- 3 · tipo y estado vuelven a text con su CHECK viejo
ALTER TABLE public.documentos_fiscales ALTER COLUMN tipo TYPE text USING tipo::text;
ALTER TABLE public.documentos_fiscales ALTER COLUMN tipo SET DEFAULT 'factura';
ALTER TABLE public.documentos_fiscales ALTER COLUMN estado TYPE text USING estado::text;
ALTER TABLE public.documentos_fiscales ALTER COLUMN estado SET DEFAULT 'pendiente';
ALTER TABLE public.documentos_fiscales
  ADD CONSTRAINT facturas_tipo_check CHECK (tipo = ANY (ARRAY['factura','nota_credito','nota_debito','liquidacion_compra'])),
  ADD CONSTRAINT facturas_estado_check CHECK (estado = ANY (ARRAY['pendiente','enviada','autorizada','rechazada','anulada']));

DROP TYPE IF EXISTS public.fiscal_sentido_enum;
DROP TYPE IF EXISTS public.fiscal_rol_enum;
DROP TYPE IF EXISTS public.fiscal_tipo_enum;
DROP TYPE IF EXISTS public.fiscal_estado_enum;

-- 4 · vuelven las obligatoriedades y el UNIQUE de numero_factura
ALTER TABLE public.documentos_fiscales ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.documentos_fiscales ALTER COLUMN numero_factura SET NOT NULL;
ALTER TABLE public.documentos_fiscales
  ADD CONSTRAINT facturas_numero_factura_key UNIQUE (numero_factura);

-- 5 · el nombre vuelve
ALTER INDEX IF EXISTS documentos_fiscales_pkey            RENAME TO facturas_pkey;
ALTER INDEX IF EXISTS documentos_fiscales_clave_acceso_key RENAME TO facturas_clave_acceso_key;
ALTER INDEX IF EXISTS idx_documentos_fiscales_pedido      RENAME TO idx_facturas_pedido;
ALTER INDEX IF EXISTS idx_documentos_fiscales_estado      RENAME TO idx_facturas_estado;
ALTER INDEX IF EXISTS idx_documentos_fiscales_user        RENAME TO idx_facturas_user;
ALTER TABLE public.documentos_fiscales RENAME TO facturas;

ALTER POLICY documentos_fiscales_owner  ON public.facturas RENAME TO facturas_owner;
ALTER POLICY documentos_fiscales_insert ON public.facturas RENAME TO facturas_insert;
ALTER POLICY documentos_fiscales_update ON public.facturas RENAME TO facturas_update;
ALTER POLICY documentos_fiscales_delete ON public.facturas RENAME TO facturas_delete;

-- 6 · la puerta del vendedor, como estaba (cuerpo VIVO embebido: esta reversa es
--     su única fuente si la migración ya corrió)
CREATE OR REPLACE FUNCTION public.registrar_factura_pedido(p_pedido_id uuid, p_numero text, p_clave_acceso text DEFAULT NULL::text, p_archivo_url text DEFAULT NULL::text, p_total numeric DEFAULT NULL::numeric, p_estado_sri text DEFAULT 'autorizada'::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_ped record; v_fac uuid; v_existente uuid;
BEGIN
  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023'; END IF;
  IF auth.uid() IS NOT NULL
     AND NOT es_vendedor_de(v_ped.cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  IF p_numero IS NULL OR length(trim(p_numero)) = 0 THEN
    RAISE EXCEPTION 'numero_factura_requerido' USING ERRCODE = '22023';
  END IF;
  SELECT id INTO v_existente FROM facturas WHERE pedido_id = p_pedido_id LIMIT 1;
  IF v_existente IS NOT NULL THEN
    IF v_ped.estado = 'empacado' THEN
      PERFORM _mover_estado_pedido(p_pedido_id, 'documentado', 'sistema');
    END IF;
    RETURN jsonb_build_object('ok', true, 'factura_id', v_existente, 'ya_existia', true);
  END IF;
  INSERT INTO facturas (pedido_id, user_id, cuenta_comercial_id, country_code,
                        numero_factura, clave_acceso, tipo, total, moneda,
                        estado, archivo_url, emitida_por_tercero, fecha_emision)
    VALUES (p_pedido_id, v_ped.user_id, v_ped.cuenta_comercial_id,
            COALESCE(v_ped.country_code,'EC'), trim(p_numero), p_clave_acceso,
            'factura', COALESCE(p_total, v_ped.total), COALESCE(v_ped.moneda,'USD'),
            COALESCE(p_estado_sri, 'pendiente'), p_archivo_url, true, now())
    RETURNING id INTO v_fac;
  PERFORM _mover_estado_pedido(p_pedido_id, 'documentado', 'sistema');
  RETURN jsonb_build_object('ok', true, 'factura_id', v_fac, 'estado', 'documentado');
END $function$;
REVOKE EXECUTE ON FUNCTION public.registrar_factura_pedido(uuid, text, text, text, numeric, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.registrar_factura_pedido(uuid, text, text, text, numeric, text) TO authenticated;

COMMIT;
