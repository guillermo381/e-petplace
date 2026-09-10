-- S115-A · TANDA 1 (a) — EL LIBRO FISCAL ÚNICO
-- `facturas` (viva desde el portal legado, sin origen en ninguna migración — D-416)
-- pasa a ser `documentos_fiscales`: UN solo libro, con `sentido` y `rol` como DATO.
-- Letra: MODELO_FISCAL v0.4 · E5. Reversa: docs/relevamientos/S115-A-REVERSA-20260912180000-libro-fiscal.sql
--
-- VEDA 76(g): NO RIGE. Esta migración no hace backfill ni ancla ids: borra fixtures
-- declarados y cambia estructura. No hay dato vivo que otra pista pueda estar moviendo.
--
-- 🔴 TRES COSAS QUE EL OBJETO DIJO DISTINTO A LA LETRA, y por qué no se obedeció al pie:
--   ① La letra lista `subtotal_0 · subtotal_15 · iva · descuento · total` como columnas
--      que FALTAN. Medido: `subtotal_0`, `subtotal_15` y `total` YA EXISTEN, y las otras
--      dos existen con otro nombre (`iva_valor`, `descuento_total`). Crear `iva` al lado
--      de `iva_valor` sería fabricar el drift que este trabajo viene a cerrar ⇒ se
--      RENOMBRAN a los nombres de la letra. Cero columnas duplicadas.
--   ② `numero_factura` es NOT NULL y tiene UNIQUE propio. Un BORRADOR todavía no tiene
--      número, y el secuencial lo asigna la emisión ⇒ pierde el NOT NULL y su UNIQUE
--      (lo reemplaza el compuesto de la letra).
--   ③ 🔴 `direccion` YA EXISTE en la tabla: es la DIRECCIÓN del receptor (venía en las
--      37 heredadas). La letra pide `direccion` para el eje emitido|recibido. Obedecerla
--      al pie dejaría `documentos_fiscales.direccion = 'emitido'` al lado de
--      `tax_profiles.direccion = 'Av. Shyris...'` ⇒ el eje se llama **`sentido`** y la
--      dirección sigue siendo la dirección. *Una palabra con dos significados en el mismo
--      dominio es un defecto, lo nombre quien lo nombre.* Se declara en el acta y en el
--      contrato para B y C, que reciben `sentido`, jamás `direccion`.
--   ④ `user_id` es NOT NULL. Un `comprobante_proveedor` (proveedor → Satori) no tiene
--      usuario CLIENTE ⇒ pierde el NOT NULL. La RLS queda fail-closed: sin `user_id`
--      sólo lo ve un admin.
--
-- Lo que NO se toca a propósito: `subtotal_12` queda. Es el fósil de la era del 12 %
-- y la letra no pidió retirarlo; se declara en el acta en vez de borrarlo en silencio.

BEGIN;

-- ── 0 · LOS FIXTURES SE VAN (firma del founder: ningún dato es real) ──────────
DO $$
DECLARE v_antes int; v_despues int;
BEGIN
  SELECT count(*) INTO v_antes FROM public.facturas;
  IF v_antes <> 6 THEN
    RAISE EXCEPTION 'cinturon_filas_inesperadas: esperaba 6 fixtures, hay %', v_antes;
  END IF;
  -- Cinturón: si alguna NO fuera de tercero o tuviera IVA, no es fixture y se aborta.
  IF EXISTS (SELECT 1 FROM public.facturas
              WHERE emitida_por_tercero IS NOT TRUE
                 OR COALESCE(iva_valor,0) <> 0) THEN
    RAISE EXCEPTION 'cinturon_hay_algo_real: una fila no cumple el perfil de fixture';
  END IF;
  DELETE FROM public.facturas;
  SELECT count(*) INTO v_despues FROM public.facturas;
  IF v_despues <> 0 THEN RAISE EXCEPTION 'cinturon_borrado_incompleto: quedan %', v_despues; END IF;
  RAISE NOTICE 'fixtures: % -> %', v_antes, v_despues;
END $$;

-- ── 1 · VOCABULARIOS CERRADOS ────────────────────────────────────────────────
CREATE TYPE public.fiscal_sentido_enum AS ENUM ('emitido', 'recibido');
CREATE TYPE public.fiscal_rol_enum AS ENUM (
  'venta_cliente',            -- Satori vende (reventa_pura)
  'comision_prestador',       -- Satori factura su comisión (marketplace_fachada)
  'comprobante_proveedor',    -- el proveedor factura a Satori (gate del payout)
  'factura_tercero_cliente'   -- el proveedor factura al cliente (agencia)
);
CREATE TYPE public.fiscal_tipo_enum AS ENUM ('factura', 'nota_credito');
CREATE TYPE public.fiscal_estado_enum AS ENUM (
  'borrador', 'esperando_receptor', 'emitiendo',
  'autorizada', 'no_autorizada', 'pendiente_manual', 'anulada'
);

-- ── 2 · EL RENOMBRE ──────────────────────────────────────────────────────────
ALTER TABLE public.facturas RENAME TO documentos_fiscales;
ALTER INDEX facturas_pkey             RENAME TO documentos_fiscales_pkey;
ALTER INDEX facturas_clave_acceso_key RENAME TO documentos_fiscales_clave_acceso_key;
ALTER INDEX idx_facturas_pedido       RENAME TO idx_documentos_fiscales_pedido;
ALTER INDEX idx_facturas_estado       RENAME TO idx_documentos_fiscales_estado;
ALTER INDEX idx_facturas_user         RENAME TO idx_documentos_fiscales_user;
ALTER POLICY facturas_owner  ON public.documentos_fiscales RENAME TO documentos_fiscales_owner;
ALTER POLICY facturas_insert ON public.documentos_fiscales RENAME TO documentos_fiscales_insert;
ALTER POLICY facturas_update ON public.documentos_fiscales RENAME TO documentos_fiscales_update;
ALTER POLICY facturas_delete ON public.documentos_fiscales RENAME TO documentos_fiscales_delete;

-- ── 3 · LOS NOMBRES DE LA LETRA (renombre, jamás columna nueva) ──────────────
ALTER TABLE public.documentos_fiscales RENAME COLUMN iva_valor       TO iva;
ALTER TABLE public.documentos_fiscales RENAME COLUMN descuento_total TO descuento;

-- ── 4 · LAS OBLIGATORIEDADES QUE EL MODELO NUEVO NO PUEDE SOSTENER ──────────
ALTER TABLE public.documentos_fiscales ALTER COLUMN user_id        DROP NOT NULL;
ALTER TABLE public.documentos_fiscales ALTER COLUMN numero_factura DROP NOT NULL;
ALTER TABLE public.documentos_fiscales DROP CONSTRAINT facturas_numero_factura_key;

-- ── 5 · tipo y estado pasan a enum ──────────────────────────────────────────
ALTER TABLE public.documentos_fiscales DROP CONSTRAINT facturas_tipo_check;
ALTER TABLE public.documentos_fiscales DROP CONSTRAINT facturas_estado_check;
ALTER TABLE public.documentos_fiscales ALTER COLUMN tipo   DROP DEFAULT;
ALTER TABLE public.documentos_fiscales ALTER COLUMN estado DROP DEFAULT;
ALTER TABLE public.documentos_fiscales
  ALTER COLUMN tipo TYPE public.fiscal_tipo_enum USING tipo::public.fiscal_tipo_enum;
ALTER TABLE public.documentos_fiscales
  ALTER COLUMN estado TYPE public.fiscal_estado_enum USING 'borrador'::public.fiscal_estado_enum;
ALTER TABLE public.documentos_fiscales ALTER COLUMN tipo   SET DEFAULT 'factura';
ALTER TABLE public.documentos_fiscales ALTER COLUMN estado SET DEFAULT 'borrador';

-- ── 6 · LAS COLUMNAS QUE FALTABAN DE VERDAD ─────────────────────────────────
ALTER TABLE public.documentos_fiscales
  ADD COLUMN sentido                 public.fiscal_sentido_enum NOT NULL DEFAULT 'emitido',
  ADD COLUMN rol                     public.fiscal_rol_enum       NOT NULL DEFAULT 'venta_cliente',
  ADD COLUMN pago_intento_id         uuid REFERENCES public.pagos_intentos(id) ON DELETE RESTRICT,
  ADD COLUMN tax_profile_id          uuid,
  ADD COLUMN establecimiento         text,
  ADD COLUMN punto_emision           text,
  ADD COLUMN secuencial              text,
  ADD COLUMN canonico                jsonb,
  ADD COLUMN canonico_version        int,
  ADD COLUMN proveedor               text,
  ADD COLUMN referencia_proveedor    text,
  ADD COLUMN documento_referencia_id uuid REFERENCES public.documentos_fiscales(id) ON DELETE RESTRICT,
  ADD COLUMN autorizado_en           timestamptz;

COMMENT ON COLUMN public.documentos_fiscales.sentido IS
  'emitido = lo emite Satori · recibido = documento de un tercero que la casa archiva.';
COMMENT ON COLUMN public.documentos_fiscales.rol IS
  'Qué ES este documento en el modelo. Con `sentido` reemplaza a la tabla comprobantes_proveedor (v0.4 E5).';
COMMENT ON COLUMN public.documentos_fiscales.canonico IS
  'El documento canónico v1 con el que se emitió — la fuente de la que salió el XML.';

-- ── 7 · LAS REGLAS EN LA BASE ───────────────────────────────────────────────
-- (a) el secuencial es único POR punto de emisión y tipo, sólo para lo EMITIDO
CREATE UNIQUE INDEX uq_documento_fiscal_secuencial
  ON public.documentos_fiscales (establecimiento, punto_emision, secuencial, tipo)
  WHERE sentido = 'emitido' AND secuencial IS NOT NULL;

-- (b) un emitido que ya salió del borrador declara sus tres piezas de numeración
ALTER TABLE public.documentos_fiscales
  ADD CONSTRAINT chk_documento_fiscal_emitido_declara_secuencial CHECK (
    sentido <> 'emitido'
    OR estado IN ('borrador','esperando_receptor','pendiente_manual','anulada')
    OR (establecimiento IS NOT NULL AND punto_emision IS NOT NULL AND secuencial IS NOT NULL)
  );

-- (c) una nota de crédito apunta SIEMPRE a su factura
ALTER TABLE public.documentos_fiscales
  ADD CONSTRAINT chk_documento_fiscal_nota_credito_referencia CHECK (
    tipo <> 'nota_credito' OR documento_referencia_id IS NOT NULL
  );

-- (d) 🔴 `emitida_por_tercero` y `sentido` dicen lo MISMO: que se contradigan
--     se vuelve inexpresable en vez de quedar como dos verdades conviviendo.
ALTER TABLE public.documentos_fiscales
  ADD CONSTRAINT chk_documento_fiscal_tercero_coherente CHECK (
    emitida_por_tercero = (sentido = 'recibido')
  );

-- (e) UN documento por pago: la idempotencia del outbox vive en la BASE, no en el código
CREATE UNIQUE INDEX uq_documento_fiscal_pago
  ON public.documentos_fiscales (pago_intento_id)
  WHERE pago_intento_id IS NOT NULL;

CREATE INDEX idx_documentos_fiscales_estado_sentido
  ON public.documentos_fiscales (estado, sentido, created_at DESC);

-- ── 8 · UN AUTORIZADO NO SE EDITA ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_documento_fiscal_inmutable()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_permitido public.documentos_fiscales;
BEGIN
  /* 🔴 Una factura autorizada es un hecho ante el SRI: corregirla es emitir una
     NOTA DE CRÉDITO, jamás un UPDATE. Lo único que puede moverse después de la
     autorización son los ARCHIVOS (llegan por webhook, DESPUÉS del estado), el
     paso a `anulada`, y `updated_at`.

     Se compara por LO QUE PUEDE CAMBIAR, no por una lista de prohibidos: una
     lista de prohibidos deja pasar en silencio toda columna futura, y esta tabla
     va a crecer. Así, una columna nueva nace protegida. */
  IF OLD.estado <> 'autorizada' THEN RETURN NEW; END IF;

  IF (NEW.estado IS DISTINCT FROM OLD.estado) AND NEW.estado <> 'anulada' THEN
    RAISE EXCEPTION 'documento_autorizado_no_cambia_de_estado'
      USING ERRCODE = '42501',
            DETAIL  = 'De autorizada solo se sale a anulada; una corrección es una nota de crédito.';
  END IF;

  v_permitido            := OLD;
  v_permitido.xml_url    := NEW.xml_url;
  v_permitido.pdf_url    := NEW.pdf_url;
  v_permitido.estado     := NEW.estado;
  v_permitido.updated_at := NEW.updated_at;

  IF ROW(NEW.*) IS DISTINCT FROM ROW(v_permitido.*) THEN
    RAISE EXCEPTION 'documento_autorizado_es_inmutable'
      USING ERRCODE = '42501',
            DETAIL  = 'Solo xml_url, pdf_url, estado->anulada y updated_at pueden moverse.';
  END IF;

  RETURN NEW;
END $fn$;
REVOKE EXECUTE ON FUNCTION public._trg_documento_fiscal_inmutable() FROM PUBLIC, anon;

CREATE TRIGGER trg_documentos_fiscales_inmutable
  BEFORE UPDATE ON public.documentos_fiscales
  FOR EACH ROW EXECUTE FUNCTION public._trg_documento_fiscal_inmutable();

-- ── 9 · LA PUERTA DEL VENDEDOR SIGUE VIVA (el rename la habría roto) ────────
CREATE OR REPLACE FUNCTION public.registrar_factura_pedido(p_pedido_id uuid, p_numero text, p_clave_acceso text DEFAULT NULL::text, p_archivo_url text DEFAULT NULL::text, p_total numeric DEFAULT NULL::numeric, p_estado_sri text DEFAULT 'autorizada'::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_ped record; v_fac uuid; v_existente uuid; v_modelo text; v_rol public.fiscal_rol_enum;
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

  SELECT id INTO v_existente FROM documentos_fiscales WHERE pedido_id = p_pedido_id LIMIT 1;
  IF v_existente IS NOT NULL THEN
    IF v_ped.estado = 'empacado' THEN
      PERFORM _mover_estado_pedido(p_pedido_id, 'documentado', 'sistema');
    END IF;
    RETURN jsonb_build_object('ok', true, 'factura_id', v_existente, 'ya_existia', true);
  END IF;

  /* 🔴 EL ROL SE DERIVA DEL MODELO DE LA CUENTA, no se elige.
     En `reventa_pura` el vendedor le factura a SATORI (comprobante de costo, gate
     del payout). En `marketplace_fachada` le factura AL CLIENTE. Es el mismo acto
     del vendedor y dos documentos distintos del modelo — decidirlo por el emisor
     sería adivinar. */
  SELECT modelo_comercial::text INTO v_modelo
    FROM cuentas_comerciales WHERE id = v_ped.cuenta_comercial_id;
  IF v_modelo IS NULL THEN
    RAISE EXCEPTION 'cuenta_sin_modelo_comercial' USING ERRCODE = '22023';
  END IF;
  v_rol := CASE WHEN v_modelo = 'marketplace_fachada'
                THEN 'factura_tercero_cliente'::public.fiscal_rol_enum
                ELSE 'comprobante_proveedor'::public.fiscal_rol_enum END;

  INSERT INTO documentos_fiscales (pedido_id, user_id, cuenta_comercial_id, country_code,
                        numero_factura, clave_acceso, tipo, total, moneda,
                        estado, archivo_url, emitida_por_tercero, fecha_emision,
                        sentido, rol)
    VALUES (p_pedido_id, v_ped.user_id, v_ped.cuenta_comercial_id,
            COALESCE(v_ped.country_code,'EC'), trim(p_numero), p_clave_acceso,
            'factura', COALESCE(p_total, v_ped.total), COALESCE(v_ped.moneda,'USD'),
            /* el documento de un TERCERO llega ya autorizado por él, o queda a mano */
            CASE WHEN p_estado_sri = 'autorizada' THEN 'autorizada'::public.fiscal_estado_enum
                 ELSE 'pendiente_manual'::public.fiscal_estado_enum END,
            p_archivo_url, true, now(),
            'recibido'::public.fiscal_sentido_enum, v_rol)
    RETURNING id INTO v_fac;

  PERFORM _mover_estado_pedido(p_pedido_id, 'documentado', 'sistema');
  RETURN jsonb_build_object('ok', true, 'factura_id', v_fac, 'estado', 'documentado', 'rol', v_rol);
END $function$;
REVOKE EXECUTE ON FUNCTION public.registrar_factura_pedido(uuid, text, text, text, numeric, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.registrar_factura_pedido(uuid, text, text, text, numeric, text) TO authenticated;

COMMIT;
