-- S100-A · EL NOMBRE DE LA TIENDA EN CADA BLOQUE DE LA DIVISIÓN (F6 firmado).
--
-- ── POR QUÉ HACE FALTA UNA PUERTA Y NO UN SELECT ────────────────────────────
-- Medido: `cuentas_comerciales` tiene `nombre_comercial`, y sus dos policies
-- SELECT son `is_admin()` y **owner/gestor**. ⇒ **la familia NO puede leer el
-- nombre de la tienda a la que le compra.**
--
-- ── POR QUÉ IMPORTA, Y NO ES COSMÉTICO ──────────────────────────────────────
-- El resumen dice «Entrega 1 de 2», y **eso no explica POR QUÉ son dos**. La
-- razón de la división es que **son dos tiendas**. Sin el nombre, la familia
-- ve una compra partida sin causa visible — *y una división que no se entiende
-- se lee como un error del sistema, no como una consecuencia de lo que compró.*
--
-- ── EL MOLDE ES EL DE LA CASA, NO UNO NUEVO ─────────────────────────────────
-- `obtener_nombres_negocio_por_presupuesto` (D-455) ya resolvió exactamente
-- esto en otro dominio: **DEFINER angosta, keyed por un id que el que pregunta
-- ya posee, UN solo campo expuesto.** *Los ids son filtro y jamás permiso.*
--
-- QUÉ SALE: `nombre_comercial`. QUÉ NO: razón social, RUC, dirección, dueño,
-- ni ninguna otra columna — hay un cinturón que lo verifica.
--
-- VEDA 76(g): NO RIGE (función nueva, sin backfill).
-- REVERSA: `docs/relevamientos/2026-08-17-s100a-REVERSA-nombres-tienda.sql`.

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_nombres_tienda_por_pedido(p_pedido_ids uuid[])
RETURNS TABLE (pedido_id uuid, nombre_comercial text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
  SELECT p.id, c.nombre_comercial
  FROM pedidos p
  JOIN cuentas_comerciales c ON c.id = p.cuenta_comercial_id
  -- 🔴 EL GATE: solo pedidos DE QUIEN PREGUNTA. Un id ajeno no devuelve fila —
  --    no rebota distinto, simplemente no está: distinguirlo le confirmaría a
  --    un curioso que ese pedido existe.
  WHERE p.id = ANY(p_pedido_ids)
    AND (p.user_id = auth.uid() OR is_admin());
$$;

REVOKE ALL ON FUNCTION public.obtener_nombres_tienda_por_pedido(uuid[]) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_nombres_tienda_por_pedido(uuid[]) TO authenticated;

DO $$
DECLARE v_src text;
BEGIN
  IF has_function_privilege('anon','public.obtener_nombres_tienda_por_pedido(uuid[])','EXECUTE')
     OR has_function_privilege('public','public.obtener_nombres_tienda_por_pedido(uuid[])','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN L-140: quedó alcanzable por anon/PUBLIC';
  END IF;
  SELECT prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_nombres_tienda_por_pedido';
  -- No basta con no haberlo escrito hoy: se verifica contra el campo que
  -- alguien agregue "de paso" mañana.
  IF v_src ~* '(razon_social|ruc|identificacion|direccion|owner_profile_id|telefono)' THEN
    RAISE EXCEPTION 'CINTURÓN: la función nombra un campo que no puede salir a la familia';
  END IF;
  RAISE NOTICE 'CINTURÓN verde — expone nombre_comercial y nada más';
END $$;

COMMIT;
