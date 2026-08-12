-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260812120000_s96_b1_repartidor_y_maquina.sql
--
-- Deshace: el rol repartidor (tabla + funciones), las columnas nuevas de
-- `envios` y `pedidos`, el estado `hacia_destino`, el actor `repartidor`,
-- las transiciones nuevas, y restaura `esperando_courier` y las funciones
-- `mover_estado_pedido` / `_mover_estado_pedido` a su versión S95-G.
--
-- ⚠️ QUÉ NO DESHACE: si algún pedido real ya pasó por `hacia_destino` o fue
--    movido por el actor `repartidor`, sus filas de `pedido_estados` quedan
--    apuntando a un estado/actor que este script borra del catálogo. La
--    historia append-only NO se toca (L-231): revertir el catálogo sin
--    revertir la historia deja lecturas huérfanas, y ese costo se declara
--    acá en vez de esconderse. Hoy (12-ago-2026) ningún pedido real pasó
--    por esos estados: los 2 vivos están en `entregado` desde S95-K.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ① Funciones nuevas de S96-M1
DROP FUNCTION IF EXISTS public.despachar_pedido(uuid, uuid);
DROP FUNCTION IF EXISTS public.marcar_en_camino_a_destino(uuid);
DROP FUNCTION IF EXISTS public.marcar_entrega_fallida(uuid, text);
DROP FUNCTION IF EXISTS public.registrar_repartidor(uuid, text, text, text, uuid);
DROP FUNCTION IF EXISTS public.actualizar_repartidor(uuid, boolean, text, text, uuid);
DROP FUNCTION IF EXISTS public._es_repartidor_del_pedido(uuid);

-- ② `mover_estado_pedido` vuelve a S95-G (rechaza solo `sistema`; sin mención
--    del repartidor) y `_mover_estado_pedido` pierde la rama repartidor.
CREATE OR REPLACE FUNCTION public.mover_estado_pedido(p_pedido_id uuid, p_hasta text, p_actor text, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_actor = 'sistema' THEN
    RAISE EXCEPTION
      'actor_sistema_no_invocable: «sistema» no es un actor que se pueda declarar desde afuera; lo usa el motor por dentro'
      USING ERRCODE = '42501';
  END IF;
  IF p_actor NOT IN ('cliente','vendedor','admin') THEN
    RAISE EXCEPTION 'actor_desconocido: %', p_actor USING ERRCODE = '42501';
  END IF;
  RETURN _mover_estado_pedido(p_pedido_id, p_hasta, p_actor, p_motivo);
END $function$;

CREATE OR REPLACE FUNCTION public._mover_estado_pedido(p_pedido_id uuid, p_hasta text, p_actor text, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ped    record;
  v_estado record;
  v_trans  record;
  v_uid    uuid := auth.uid();
BEGIN
  IF v_uid IS NULL AND p_actor <> 'sistema' THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN
    RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023';
  END IF;
  IF v_ped.estado = p_hasta THEN
    RETURN jsonb_build_object('ok', true, 'estado', p_hasta, 'sin_cambio', true);
  END IF;
  SELECT * INTO v_estado FROM cat_estados_pedido WHERE codigo = p_hasta;
  IF v_estado.codigo IS NULL THEN
    RAISE EXCEPTION 'estado_no_existe: %', p_hasta USING ERRCODE = '22023';
  END IF;
  IF NOT v_estado.activo THEN
    RAISE EXCEPTION 'estado_inactivo: "%" está modelado pero apagado en v1. Motivo: %',
      p_hasta, COALESCE(v_estado.motivo_inactivo, '(sin declarar)') USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_trans FROM cat_transiciones_pedido
   WHERE desde = v_ped.estado AND hasta = p_hasta AND actor = p_actor AND activo;
  IF v_trans.id IS NULL THEN
    RAISE EXCEPTION 'transicion_no_permitida: % → % por %', v_ped.estado, p_hasta, p_actor
      USING ERRCODE = '22023';
  END IF;
  IF (v_trans.exige_motivo OR v_estado.exige_motivo)
     AND (p_motivo IS NULL OR length(trim(p_motivo)) = 0) THEN
    RAISE EXCEPTION 'motivo_requerido: la transición % → % exige motivo', v_ped.estado, p_hasta
      USING ERRCODE = '22023';
  END IF;
  IF p_actor = 'cliente' AND v_ped.user_id <> v_uid THEN
    RAISE EXCEPTION 'no_es_tu_pedido' USING ERRCODE = '42501';
  ELSIF p_actor = 'vendedor' AND NOT es_vendedor_de(v_ped.cuenta_comercial_id) THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  ELSIF p_actor = 'admin' AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_admin' USING ERRCODE = '42501';
  END IF;
  INSERT INTO pedido_estados (pedido_id, estado_codigo, motivo, movido_por, movido_por_rol)
    VALUES (p_pedido_id, p_hasta, p_motivo, v_uid, p_actor);
  RETURN jsonb_build_object('ok', true, 'pedido_id', p_pedido_id,
                            'desde', v_ped.estado, 'estado', p_hasta,
                            'narrativa', v_estado.narrativa);
END $function$;

-- ③ Transiciones nuevas fuera; las de courier vuelven a activas
DELETE FROM cat_transiciones_pedido
 WHERE (desde, hasta, actor) IN (
   ('en_reparto','hacia_destino','repartidor'),
   ('hacia_destino','entregado','repartidor'),
   ('hacia_destino','entrega_fallida','repartidor'),
   ('en_reparto','entrega_fallida','repartidor'),
   ('en_reparto','entregado','repartidor'),
   ('documentado','en_reparto','vendedor'),
   ('documentado','entregado','vendedor'));

UPDATE cat_transiciones_pedido SET activo = true
 WHERE (desde, hasta) IN (('documentado','esperando_courier'),
                          ('esperando_courier','en_reparto'),
                          ('esperando_courier','entregado_courier'));

-- ④ El estado nuevo fuera; `esperando_courier` vuelve a activo
DELETE FROM cat_estados_pedido WHERE codigo = 'hacia_destino';
UPDATE cat_estados_pedido SET activo = true, motivo_inactivo = NULL
 WHERE codigo = 'esperando_courier';

-- ⑤ El actor `repartidor` sale de los DOS CHECKs
--    ⚠️ Si alguna fila real de `pedido_estados` ya lleva movido_por_rol =
--    'repartidor', este ALTER va a rebotar — y ese rebote es CORRECTO: la
--    historia no se reescribe para complacer una reversa (L-231).
ALTER TABLE cat_transiciones_pedido DROP CONSTRAINT IF EXISTS cat_transiciones_pedido_actor_check;
ALTER TABLE cat_transiciones_pedido ADD CONSTRAINT cat_transiciones_pedido_actor_check
  CHECK (actor = ANY (ARRAY['cliente'::text,'vendedor'::text,'sistema'::text,'admin'::text]));
ALTER TABLE pedido_estados DROP CONSTRAINT IF EXISTS pedido_estados_movido_por_rol_check;
ALTER TABLE pedido_estados ADD CONSTRAINT pedido_estados_movido_por_rol_check
  CHECK (movido_por_rol = ANY (ARRAY['cliente'::text,'vendedor'::text,'sistema'::text,'admin'::text]));

-- ⑥ Columnas nuevas fuera
ALTER TABLE public.envios
  DROP COLUMN IF EXISTS repartidor_id,
  DROP COLUMN IF EXISTS instrucciones_entrega,
  DROP COLUMN IF EXISTS destino_lat,
  DROP COLUMN IF EXISTS destino_lon,
  DROP COLUMN IF EXISTS nombre_receptor,
  DROP COLUMN IF EXISTS telefono_receptor,
  DROP COLUMN IF EXISTS foto_entrega_path,
  DROP COLUMN IF EXISTS salio_en,
  DROP COLUMN IF EXISTS hacia_destino_en;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS entrega_instrucciones;

-- ⑦ La policy de envios vuelve a su forma S95 (sin el brazo del repartidor)
DROP POLICY IF EXISTS envios_select ON public.envios;
CREATE POLICY envios_select ON public.envios FOR SELECT TO authenticated
  USING ((EXISTS (SELECT 1 FROM pedidos p
                  WHERE p.id = envios.pedido_id
                    AND (p.user_id = auth.uid() OR es_vendedor_de(p.cuenta_comercial_id))))
         OR is_admin());

-- ⑧ La tabla del rol, al final (las FKs de envios ya cayeron con la columna)
DROP TABLE IF EXISTS public.repartidores;

COMMIT;
