-- S115-A · TANDA 1 — LA VISTA DE COMPATIBILIDAD QUE D-662 EXIGE
-- Reversa: DROP VIEW public.facturas;
-- VEDA 76(g): NO RIGE.
--
-- 🔴 DEFECTO PROPIO, Y LO CAZÓ EL TYPECHECK POR CASUALIDAD.
--    La migración (a) renombró `facturas` → `documentos_fiscales`. Medido DESPUÉS:
--    `packages/api/src/wrappers/despensa-seguimiento.ts:667` hace `.from('facturas')`
--    y lo consume `apps/cliente/.../pedidos/pedido/[pedidoId].tsx` — o sea **una
--    pantalla viva del bundle PUBLICADO**. Sin esta vista, el detalle de pedido del
--    cliente empezaba a devolver 400 hoy, y esta tanda NO publica.
--
--    ⚠️ Y lo que más pesa: **ningún gate lo iba a ver**. El typecheck lo cazó sólo
--    porque este mismo lote agregó un wrapper en `packages/api`; si el trabajo
--    hubiera sido puramente de base, la migración habría salido verde y la pantalla
--    habría roto en producción. *D-662 dice «toda migración que renombre declara
--    qué bundles vivos la consultan» — la declaré para columnas y me la salté para
--    la TABLA.*
--
--    La cura es la que la propia D-662 prescribe: compatible hacia atrás. La vista
--    devuelve los nombres VIEJOS (`iva_valor`, `descuento_total`) para que el bundle
--    publicado no note nada, y muere en la pasada que siga al próximo publish.

BEGIN;

CREATE VIEW public.facturas
WITH (security_invoker = true) AS
/* 🔴 `security_invoker` NO es opcional: sin él la vista corre con los permisos de
   quien la creó y **saltea la RLS de `documentos_fiscales`** — una persona vería
   los comprobantes de otra. Es exactamente el hallazgo de S104 sobre las cuatro
   vistas del motor que bypasseaban RLS con ACL total. */
SELECT
  id, pedido_id, suscripcion_id, user_id, country_code, numero_factura, clave_acceso,
  tipo::text            AS tipo,
  ruc_emisor, razon_social_emisor, direccion_emisor,
  tipo_identificacion, identificacion, razon_social, direccion, email,
  subtotal_0, subtotal_12, subtotal_15,
  iva                   AS iva_valor,          -- el nombre viejo, para el bundle viejo
  total,
  descuento             AS descuento_total,    -- ídem
  items,
  estado::text          AS estado,
  sri_fecha_autorizacion, sri_numero_autorizacion, sri_ambiente, sri_error,
  xml_url, pdf_url, fecha_emision, created_at, updated_at, moneda,
  emitida_por_tercero, cuenta_comercial_id, archivo_url
FROM public.documentos_fiscales;

COMMENT ON VIEW public.facturas IS
  'LÁPIDA VIVA (S115-A): compatibilidad para el bundle publicado que todavía hace .from(''facturas''). Muere en la pasada siguiente al próximo publish del cliente — no se le agregan columnas ni consumidores nuevos.';

GRANT SELECT ON public.facturas TO authenticated;

DO $$
DECLARE v int;
BEGIN
  /* Discriminador: la vista tiene que servir EXACTAMENTE las 8 columnas que el
     wrapper vivo selecciona. Que exista no prueba que sirva. */
  SELECT count(*) INTO v FROM information_schema.columns
   WHERE table_schema='public' AND table_name='facturas'
     AND column_name IN ('id','pedido_id','numero_factura','clave_acceso',
                         'archivo_url','pdf_url','estado','fecha_emision');
  IF v <> 8 THEN RAISE EXCEPTION 'cinturon_compat: la vista sirve % de 8 columnas del wrapper vivo', v; END IF;
END $$;

COMMIT;
