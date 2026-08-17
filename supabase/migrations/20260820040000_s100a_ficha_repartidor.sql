-- S100-A · F3 · LA FICHA DEL REPARTIDOR PARA LA FAMILIA — tres campos y nada más.
--
-- ── 🔴 LA FORMA REAL NO ES LA QUE EL PEDIDO DESCRIBÍA, Y SE DECLARA ─────────
-- El encargo decía *«nombre · tipo de vehículo · placa: columnas simples, sin
-- puerta nueva»*. **Medido: `repartidores` NO tiene `tipo` ni `placa`.** Sus
-- columnas son `nombre, documento, telefono, user_id, activo, foto_path,
-- whatsapp, correo, …`. El vehículo vive en **`repartidor_vehiculos`
-- (`repartidor_id, tipo, placa, orden`)**, que es **1:N** — coherente con N12.5
-- («máximo 2 vehículos»).
-- ⇒ No son tres columnas: es un **join**, y con él aparece una pregunta que el
-- pedido no tenía.
--
-- ── 🔴 LA PREGUNTA QUE APARECIÓ AL MEDIR: ¿CUÁL VEHÍCULO ESTÁ MANEJANDO? ────
-- **`envios` NO registra el vehículo del viaje** (medido: cero columnas
-- `%vehic%`). Con hasta 2 por repartidor, mostrar «la placa» sería **elegir uno
-- de N sin criterio** — *exactamente la ley que esta sesión ya cobró dos veces*
-- (`publicadas[0]` en el catálogo · `items[0]` en el checkout).
--
-- **Lo que se hace hoy y por qué es legítimo:** se elige por **`orden` ASC**,
-- que **no es el orden que devuelva la base: es una columna que el vendedor
-- ESCRIBE**. O sea que hay criterio, y está declarado — que es justo lo que a
-- los otros dos casos les faltaba.
--
-- **Lo que hace falta de verdad, y va como deuda:** que **el despacho estampe
-- el vehículo en el envío**. El vehículo usado es un hecho del viaje, no una
-- preferencia del repartidor — y el día que alguien maneje el segundo, la
-- placa que ve la familia en la puerta va a ser la equivocada. *Hoy es
-- invisible porque hay UN solo repartidor con UN solo vehículo.*
--
-- ── QUÉ SALE Y QUÉ NO ───────────────────────────────────────────────────────
-- SALE: `nombre` · `vehiculo_tipo` · `vehiculo_placa`. **La placa manda**,
-- porque es lo que se verifica en la calle (receta ⑤ de B).
-- **NO SALE, y no es un olvido:** documento · teléfono · correo · WhatsApp ·
-- **foto**. La foto queda afuera **por adjudicación de mesa** y con su razón:
-- `repartidores.foto_path` vive en `cuenta-documentos`, **el bucket de los
-- documentos de identidad**. No es riesgo aceptable ni policy fina: *el dato
-- está guardado en el lugar equivocado para el uso que le queremos dar.* Una
-- foto de perfil y una cédula no comparten bucket. **Deuda declarada, fuera de
-- S100.** ⇒ la ficha sale con **tres de cuatro y el hueco se dice** (N13:
-- vacío jamás inventado). *Uber sin foto sigue siendo Uber; sin placa, no.*
--
-- ── POR QUÉ DEFINER Y NO UNA POLICY ────────────────────────────────────────
-- `repartidores_select` y `repartidor_vehiculos_select` son
-- `es_vendedor_de(...) OR user_id = auth.uid() OR is_admin()` ⇒ **la familia no
-- puede leer ninguna de las dos**, y no debe: son datos de un tercero.
-- Molde D-455: **DEFINER angosta, keyed por el ENVÍO — los ids son filtro y
-- jamás permiso.** El gate está en el cuerpo: se contesta solo sobre un envío
-- cuyo pedido es de quien pregunta.
--
-- ── EL DATO VIVO, PARA QUE EL GATE PUEDA DISTINGUIR ─────────────────────────
-- **6 repartidores · 2 con foto · 1 con vehículo cargado.** ⇒ si la ficha sale
-- vacía en 5 de 6, **es por DATO y no por lector**. Se escribe acá para que
-- nadie lea un vacío como una falla.
--
-- VEDA 76(g): NO RIGE — función nueva, sin backfill.
-- REVERSA: `docs/relevamientos/2026-08-17-s100a-REVERSA-ficha-repartidor.sql`.

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_ficha_repartidor(p_envio_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rep uuid;
  v_nombre text;
  v_tipo text; v_placa text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE='42501'; END IF;

  -- 🔴 EL GATE: solo sobre un envío cuyo PEDIDO es de quien pregunta. Un id de
  --    envío ajeno no devuelve nada — el id es filtro, jamás permiso (D-455).
  SELECT e.repartidor_id INTO v_rep
    FROM envios e
    JOIN pedidos p ON p.id = e.pedido_id
   WHERE e.id = p_envio_id
     AND (p.user_id = v_uid OR is_admin());

  -- Sin envío propio, o sin repartidor asignado todavía: **vacío honesto y la
  -- misma respuesta para los dos casos**. Distinguirlos le confirmaría a un
  -- curioso que el envío existe.
  IF v_rep IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'hay_ficha', false);
  END IF;

  SELECT r.nombre INTO v_nombre FROM repartidores r WHERE r.id = v_rep;

  -- El vehículo por `orden` ASC — criterio ESCRITO por el vendedor, no el orden
  -- que devuelva la base (ver la nota larga de la cabecera).
  SELECT v.tipo, v.placa INTO v_tipo, v_placa
    FROM repartidor_vehiculos v
   WHERE v.repartidor_id = v_rep
   ORDER BY v.orden ASC NULLS LAST, v.created_at ASC
   LIMIT 1;

  RETURN jsonb_build_object(
    'ok', true,
    'hay_ficha', true,
    'nombre', v_nombre,
    -- NULL cuando el repartidor no cargó vehículo. La pantalla LO DICE; no
    -- inventa una placa ni esconde la ficha entera por un campo que falta.
    'vehiculo_tipo', v_tipo,
    'vehiculo_placa', v_placa
  );
END $$;

REVOKE ALL ON FUNCTION public.obtener_ficha_repartidor(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_ficha_repartidor(uuid) TO authenticated;

-- ── CINTURÓN ① · L-140 ──────────────────────────────────────────────────────
DO $$
BEGIN
  IF has_function_privilege('anon','public.obtener_ficha_repartidor(uuid)','EXECUTE')
     OR has_function_privilege('public','public.obtener_ficha_repartidor(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN L-140: la ficha quedó alcanzable por anon/PUBLIC';
  END IF;
END $$;

-- ── CINTURÓN ② · LO QUE JAMÁS PUEDE SALIR ───────────────────────────────────
-- No basta con no haberlo escrito: se verifica que el CUERPO no nombre ninguno
-- de los campos sensibles. *Un día alguien agrega un campo "de paso" y nadie
-- se entera — este cinturón es el que se entera.*
DO $$
DECLARE v_src text;
BEGIN
  SELECT prosrc INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_ficha_repartidor';
  IF v_src ~* '(foto_path|documento|telefono|whatsapp|correo)' THEN
    RAISE EXCEPTION 'CINTURÓN: la ficha nombra un campo que JAMÁS puede salir a la familia';
  END IF;
  RAISE NOTICE 'CINTURÓN verde — la ficha expone nombre · vehiculo_tipo · vehiculo_placa y nada más';
END $$;

COMMIT;
