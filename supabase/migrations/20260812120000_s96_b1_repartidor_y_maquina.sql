-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · A-B1/A-B2 — EL REPARTIDOR COMO ROL Y LA MÁQUINA QUE LO RECIBE
--
-- Fuente de letra: `LETRA_RECORRIDO_DESPENSA_S96` §9 (el repartidor entra a v1
-- con pantalla mínima) + `LETRA_PANEL_VENDEDOR_S96` §3/§5 enmendada (el
-- vendedor marca los TRES escalones del local; el cuarto lo marca quien está
-- en la puerta) + decisión founder ① del arranque S96 (la entrega la asigna
-- el SELLER al despachar).
--
-- ── QUÉ CONSTRUYE ──────────────────────────────────────────────────────────
-- ① `repartidores` — el rol. NO es una fila de `cuenta_roles` (eso es de la
--    CUENTA comercial); es una PERSONA del vendedor, con su documento y su
--    `user_id` para la pantalla. Sin herencia de ningún otro rol: un user que
--    solo es repartidor no tiene ninguna otra policy que lo nombre.
-- ② `envios` gana el repartidor asignado, el snapshot que su pantalla lee
--    (dirección · punto · referencia · instrucciones · teléfono) y la
--    evidencia (`foto_entrega_path`). **El repartidor lee SOLO `envios`:
--    jamás `pedidos`, jamás el catálogo, jamás una palabra de la mascota.**
-- ③ El estado `hacia_destino` («vamos hacia vos») — el único paso que solo
--    puede marcar quien está manejando.
-- ④ El actor `repartidor` en la máquina: sus transiciones son DATO, y sus
--    movimientos pasan SOLO por funciones propias (la puerta pública
--    `mover_estado_pedido` lo rechaza, porque entregar exige evidencia y un
--    RPC genérico no puede exigirla).
-- ⑤ `despachar_pedido` — el tercer escalón del vendedor: asigna repartidor,
--    congela el snapshot del destino, genera el código que la familia dice
--    en la puerta, y mueve documentado → en_reparto.
-- ⑥ `esperando_courier` se APAGA: describía el tramo de un tercero y v1
--    entrega con moto propia y repartidor asignado (gemelo de
--    `entregado_courier`/`en_transito`, apagados desde S95-G2).
--
-- LO QUE NO VA ACÁ (va en la M2): `entregar_pedido` v2 con foto + código +
-- destino por ítem. Esta migración deja la máquina lista para recibirlo.
--
-- Reversa (escrita, verificada en disco y LEÍDA antes de aplicar):
--   scripts/s96/2026-08-12-s96-m1-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE.** El cinturón crea un repartidor, un pedido real contra
-- el catálogo vivo, lo lleva hasta `hacia_destino` y lo deshace por id,
-- exigiendo residuo 0 en `pedidos`, `envios`, `repartidores` y el stock.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ① EL ROL — `repartidores`
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE public.repartidores (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_comercial_id uuid NOT NULL REFERENCES public.cuentas_comerciales(id),
  nombre              text NOT NULL CHECK (length(btrim(nombre)) > 0),
  documento           text NOT NULL CHECK (length(btrim(documento)) > 0),
  -- E.164 ENTERO, con su `+` (regla 28 enmendada S84). Opcional: lo exigible
  -- es que si hay valor, sea E.164.
  telefono            text CHECK (telefono IS NULL OR telefono ~ '^\+[1-9][0-9]{6,14}$'),
  -- La pantalla. NULL = todavía no tiene cuenta; su envío existe igual y el
  -- vendedor opera por él (el esqueleto no obliga a que cada repartidor sea
  -- usuario desde el día uno — lo PERMITE, que es lo que la letra pide).
  user_id             uuid REFERENCES public.profiles(id),
  activo              boolean NOT NULL DEFAULT true,
  country_code        text NOT NULL DEFAULT 'EC',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  -- El mismo documento no puede ser dos repartidores de la misma casa.
  CONSTRAINT uq_repartidor_documento UNIQUE (cuenta_comercial_id, documento)
);

COMMENT ON TABLE public.repartidores IS
  'S96 · El repartidor como ROL de e-PetPlace Negocios (LETRA_RECORRIDO_DESPENSA_S96 §9). '
  'Es una persona del vendedor — con moto propia, quien llega a la casa donde vive la '
  'familia es alguien del vendedor y nadie más lo respalda. Su regla de lectura: ve el '
  'envío asignado a él y NADA más, cerrada en policies, no en pantalla. Sin herencia de '
  'ningún otro rol.';

CREATE TRIGGER trg_repartidores_updated BEFORE UPDATE ON public.repartidores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.repartidores ENABLE ROW LEVEL SECURITY;

-- Lectura: el vendedor ve su gente; el repartidor se ve a sí mismo; el equipo
-- e-PetPlace todo. Escritura: NINGUNA policy — la única vía es la función
-- DEFINER (patrón S95-G2: la escritura directa no se prohíbe con una
-- convención, se vuelve imposible quitando la policy).
CREATE POLICY repartidores_select ON public.repartidores FOR SELECT TO authenticated
  USING (es_vendedor_de(cuenta_comercial_id) OR user_id = auth.uid() OR is_admin());

REVOKE INSERT, UPDATE, DELETE ON public.repartidores FROM anon, authenticated;

-- ── El alta y la edición, por la puerta ─────────────────────────────────────
CREATE FUNCTION public.registrar_repartidor(
  p_cuenta_comercial_id uuid,
  p_nombre              text,
  p_documento           text,
  p_telefono            text DEFAULT NULL,
  p_user_id             uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_id uuid; v_existente uuid;
BEGIN
  IF NOT es_vendedor_de(p_cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  IF p_nombre IS NULL OR length(btrim(p_nombre)) = 0 THEN
    RAISE EXCEPTION 'nombre_requerido' USING ERRCODE = '22023';
  END IF;
  IF p_documento IS NULL OR length(btrim(p_documento)) = 0 THEN
    -- Sin documento no hay identidad: con tres repartidores, sin este campo
    -- no se sabe quién entregó qué (LETRA_PANEL_VENDEDOR_S96 §5).
    RAISE EXCEPTION 'documento_requerido' USING ERRCODE = '22023';
  END IF;

  -- IDEMPOTENTE por (cuenta, documento): registrar dos veces no duplica.
  SELECT id INTO v_existente FROM repartidores
   WHERE cuenta_comercial_id = p_cuenta_comercial_id AND documento = btrim(p_documento);
  IF v_existente IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'repartidor_id', v_existente, 'ya_existia', true);
  END IF;

  INSERT INTO repartidores (cuenta_comercial_id, nombre, documento, telefono, user_id)
    VALUES (p_cuenta_comercial_id, btrim(p_nombre), btrim(p_documento),
            NULLIF(btrim(COALESCE(p_telefono,'')),''), p_user_id)
    RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'repartidor_id', v_id, 'ya_existia', false);
END $$;

CREATE FUNCTION public.actualizar_repartidor(
  p_repartidor_id uuid,
  p_activo        boolean DEFAULT NULL,
  p_nombre        text    DEFAULT NULL,
  p_telefono      text    DEFAULT NULL,
  p_user_id       uuid    DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_cc uuid;
BEGIN
  SELECT cuenta_comercial_id INTO v_cc FROM repartidores WHERE id = p_repartidor_id;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'repartidor_no_existe' USING ERRCODE = '22023'; END IF;
  IF NOT es_vendedor_de(v_cc) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;
  UPDATE repartidores SET
    activo   = COALESCE(p_activo, activo),
    nombre   = COALESCE(NULLIF(btrim(COALESCE(p_nombre,'')),''), nombre),
    telefono = CASE WHEN p_telefono IS NULL THEN telefono
                    ELSE NULLIF(btrim(p_telefono),'') END,
    user_id  = COALESCE(p_user_id, user_id),
    updated_at = now()
  WHERE id = p_repartidor_id;
  RETURN jsonb_build_object('ok', true, 'repartidor_id', p_repartidor_id);
END $$;

REVOKE ALL ON FUNCTION public.registrar_repartidor(uuid, text, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_repartidor(uuid, text, text, text, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.actualizar_repartidor(uuid, boolean, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.actualizar_repartidor(uuid, boolean, text, text, uuid) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ② EL ENVÍO GANA SU REPARTIDOR Y EL SNAPSHOT DE SU PANTALLA
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.envios
  ADD COLUMN repartidor_id         uuid REFERENCES public.repartidores(id),
  ADD COLUMN instrucciones_entrega text,
  ADD COLUMN destino_lat           double precision,
  ADD COLUMN destino_lon           double precision,
  ADD COLUMN nombre_receptor       text,
  ADD COLUMN telefono_receptor     text,
  ADD COLUMN foto_entrega_path     text,
  ADD COLUMN salio_en              timestamptz,
  ADD COLUMN hacia_destino_en      timestamptz;

-- Un pedido tiene UN envío en v1: el reintento reusa la fila y suma
-- `intentos_entrega`, no crea otra (dos envíos vivos del mismo pedido serían
-- dos verdades sobre quién lo lleva).
CREATE UNIQUE INDEX uq_envios_pedido ON public.envios (pedido_id);

-- El vocabulario de `envios.estado` es PROPIO del envío (no el del pedido) y
-- gana el paso «hacia el destino». `fallido` ya existía y se usa tal cual.
ALTER TABLE public.envios DROP CONSTRAINT envios_estado_check;
ALTER TABLE public.envios ADD CONSTRAINT envios_estado_check
  CHECK (estado = ANY (ARRAY['pendiente'::text,'recogido'::text,'en_transito'::text,
                             'en_destino'::text,'en_reparto'::text,'hacia_destino'::text,
                             'entregado'::text,'fallido'::text,'devuelto'::text]));

COMMENT ON COLUMN public.envios.instrucciones_entrega IS
  'S96 · Snapshot de las instrucciones que el cliente dio AL COMPRAR ("dejar en '
  'portería"). Las lee el repartidor y deciden la entrega fallida (§9.3): se piden '
  'en el momento de comprar y no en la puerta.';
COMMENT ON COLUMN public.envios.foto_entrega_path IS
  'S96 · Path en el bucket PRIVADO `entregas`. La ven el vendedor y el equipo '
  'e-PetPlace, jamás otro cliente; vive 90 días (D-776); el expediente jamás la toca.';

-- Las instrucciones nacen en el pedido (el carrito las captura) y viajan al
-- envío como snapshot al despachar.
ALTER TABLE public.pedidos ADD COLUMN entrega_instrucciones text;

-- La pantalla del repartidor: SU envío y nada más. El brazo nuevo del SELECT
-- solo matchea los envíos que le fueron asignados — no le abre ni el catálogo
-- ni otros pedidos ni una palabra de la mascota (que en `envios` no existe).
DROP POLICY envios_select ON public.envios;
CREATE POLICY envios_select ON public.envios FOR SELECT TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM pedidos p
             WHERE p.id = envios.pedido_id
               AND (p.user_id = auth.uid() OR es_vendedor_de(p.cuenta_comercial_id))))
    OR EXISTS (SELECT 1 FROM repartidores r
               WHERE r.id = envios.repartidor_id
                 AND r.user_id = auth.uid() AND r.activo)
    OR is_admin());

-- ¿Es quien llama el repartidor asignado al envío de este pedido?
CREATE FUNCTION public._es_repartidor_del_pedido(p_pedido_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM envios e
    JOIN repartidores r ON r.id = e.repartidor_id
    WHERE e.pedido_id = p_pedido_id AND r.user_id = auth.uid() AND r.activo);
$$;
REVOKE ALL ON FUNCTION public._es_repartidor_del_pedido(uuid) FROM PUBLIC, anon;

-- ═══════════════════════════════════════════════════════════════════════════
-- ③ EL ESTADO «VAMOS HACIA VOS» + ④ EL ACTOR `repartidor`
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO cat_estados_pedido (codigo, nombre, descripcion, narrativa, orden,
                                activo, es_terminal, visible_familia, exige_motivo)
VALUES ('hacia_destino', 'Hacia el destino',
        'El repartidor va hacia esta casa: la familia es la próxima parada. Es el '
        'único paso que solo puede marcar quien está manejando — el vendedor en su '
        'local no sabe cuál es la próxima casa (LETRA_RECORRIDO_DESPENSA_S96 §9). '
        'Dispara el único aviso que hace que alguien se quede en casa.',
        'en_camino', 34, true, false, true, false);

-- `esperando_courier` describía un paquete esperando la red de un tercero.
-- Con moto propia y repartidor asignado, el despacho va directo a
-- `en_reparto`. Se APAGA, no se borra (gemelo de entregado_courier).
UPDATE cat_estados_pedido
   SET activo = false,
       motivo_inactivo = 'S96: v1 despacha con moto propia y repartidor asignado — '
         'documentado pasa directo a en_reparto vía despachar_pedido(). Este estado '
         'describe el tramo de un courier tercero; el courier es v2, modelado y apagado.'
 WHERE codigo = 'esperando_courier';
UPDATE cat_transiciones_pedido SET activo = false
 WHERE (desde = 'esperando_courier' OR hasta = 'esperando_courier');

-- El actor nuevo entra a los DOS CHECKs: el del catálogo de transiciones y el
-- de la historia (`pedido_estados.movido_por_rol`) — el cinturón de la primera
-- corrida cazó que el segundo existía y no lo había medido.
ALTER TABLE cat_transiciones_pedido DROP CONSTRAINT cat_transiciones_pedido_actor_check;
ALTER TABLE cat_transiciones_pedido ADD CONSTRAINT cat_transiciones_pedido_actor_check
  CHECK (actor = ANY (ARRAY['cliente'::text,'vendedor'::text,'sistema'::text,
                            'admin'::text,'repartidor'::text]));
ALTER TABLE pedido_estados DROP CONSTRAINT pedido_estados_movido_por_rol_check;
ALTER TABLE pedido_estados ADD CONSTRAINT pedido_estados_movido_por_rol_check
  CHECK (movido_por_rol = ANY (ARRAY['cliente'::text,'vendedor'::text,'sistema'::text,
                                     'admin'::text,'repartidor'::text]));

INSERT INTO cat_transiciones_pedido (desde, hasta, actor, exige_motivo, descripcion, activo) VALUES
  -- El despacho moto propia: el vendedor asigna y el paquete sale del local.
  ('documentado', 'en_reparto', 'vendedor', false,
   'S96 · El tercer escalón del vendedor: despachar_pedido() asigna repartidor y el paquete sale. Dispara el aviso «en ruta».', true),
  -- Retiro en tienda: no hay reparto — el vendedor entrega en el mostrador
  -- contra el código. La exige entregar_pedido v2 (M2), que valida el método.
  ('documentado', 'entregado', 'vendedor', false,
   'S96 · Retiro en tienda: el mismo pedido con otro modo de entrega — sin repartidor, sin ventana, con código en el mostrador.', true),
  -- Los tres movimientos del repartidor. Solo alcanzables por SUS funciones:
  -- la puerta pública mover_estado_pedido rechaza el actor (ver abajo).
  ('en_reparto', 'hacia_destino', 'repartidor', false,
   'S96 · «Voy hacia acá»: la familia es la próxima parada. Solo lo puede marcar quien está manejando.', true),
  ('hacia_destino', 'entregado', 'repartidor', false,
   'S96 · La entrega, con foto y código verificado (entregar_pedido v2).', true),
  ('en_reparto', 'entregado', 'repartidor', false,
   'S96 · La entrega sin haber marcado «voy hacia acá» — el paso intermedio es un aviso, no un peaje.', true),
  ('hacia_destino', 'entrega_fallida', 'repartidor', true,
   'S96 · «No había nadie» desde la puerta. El pedido vuelve y se reagenda; JAMÁS deposita en el expediente.', true),
  ('en_reparto', 'entrega_fallida', 'repartidor', true,
   'S96 · «No había nadie» sin haber marcado el paso intermedio.', true);

-- ═══════════════════════════════════════════════════════════════════════════
-- ⑤ LA MÁQUINA APRENDE EL ACTOR
-- ═══════════════════════════════════════════════════════════════════════════
-- La puerta pública SIGUE rechazando lo que no puede verificar con evidencia:
-- `sistema` porque es el motor hablando consigo mismo, y ahora `repartidor`
-- porque su único movimiento con consecuencias (entregar) exige foto y código
-- — un RPC genérico de transición no puede exigirlos, así que el repartidor
-- mueve SOLO por sus funciones propias.
CREATE OR REPLACE FUNCTION public.mover_estado_pedido(p_pedido_id uuid, p_hasta text, p_actor text, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_actor = 'sistema' THEN
    RAISE EXCEPTION
      'actor_sistema_no_invocable: «sistema» no es un actor que se pueda declarar desde afuera; lo usa el motor por dentro'
      USING ERRCODE = '42501';
  END IF;
  IF p_actor = 'repartidor' THEN
    RAISE EXCEPTION
      'actor_repartidor_no_invocable: el repartidor mueve por sus funciones propias (marcar_en_camino_a_destino, entregar_pedido, marcar_entrega_fallida) — entregar exige foto y código, y esta puerta no puede exigirlos'
      USING ERRCODE = '42501';
  END IF;
  IF p_actor NOT IN ('cliente','vendedor','admin') THEN
    RAISE EXCEPTION 'actor_desconocido: %', p_actor USING ERRCODE = '42501';
  END IF;
  RETURN _mover_estado_pedido(p_pedido_id, p_hasta, p_actor, p_motivo);
END $function$;

-- El anillo interno gana la rama que verifica al repartidor. Los gates por
-- actor siguen ACÁ ADENTRO: las funciones propias le pasan 'repartidor' y
-- esta rama tiene que seguir verificando aunque la llamada venga de adentro.
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

  -- IDEMPOTENCIA: mover al estado en que ya está es un no-op que RESPONDE bien.
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

  -- Los gates por actor SIGUEN ACÁ ADENTRO, y no es redundancia: los
  -- orquestadores le pasan `cliente`, `vendedor` y `repartidor`, y esas
  -- ramas tienen que seguir verificando aunque la llamada venga de adentro
  -- del motor.
  IF p_actor = 'cliente' AND v_ped.user_id <> v_uid THEN
    RAISE EXCEPTION 'no_es_tu_pedido' USING ERRCODE = '42501';
  ELSIF p_actor = 'vendedor' AND NOT es_vendedor_de(v_ped.cuenta_comercial_id) THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  ELSIF p_actor = 'repartidor' AND NOT _es_repartidor_del_pedido(p_pedido_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_repartidor_asignado' USING ERRCODE = '42501';
  ELSIF p_actor = 'admin' AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_admin' USING ERRCODE = '42501';
  END IF;

  INSERT INTO pedido_estados (pedido_id, estado_codigo, motivo, movido_por, movido_por_rol)
    VALUES (p_pedido_id, p_hasta, p_motivo, v_uid, p_actor);

  RETURN jsonb_build_object('ok', true, 'pedido_id', p_pedido_id,
                            'desde', v_ped.estado, 'estado', p_hasta,
                            'narrativa', v_estado.narrativa);
END $function$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⑥ DESPACHAR — el tercer escalón del vendedor, con la asignación adentro
-- ═══════════════════════════════════════════════════════════════════════════
CREATE FUNCTION public.despachar_pedido(
  p_pedido_id     uuid,
  p_repartidor_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_ped record; v_rep record; v_envio uuid; v_codigo text; v_reintento boolean := false;
BEGIN
  SELECT * INTO v_ped FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_ped.id IS NULL THEN RAISE EXCEPTION 'pedido_no_existe' USING ERRCODE = '22023'; END IF;
  IF auth.uid() IS NOT NULL AND NOT es_vendedor_de(v_ped.cuenta_comercial_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_vendedor' USING ERRCODE = '42501';
  END IF;

  IF v_ped.metodo_entrega <> 'despacho' THEN
    -- El retiro no se despacha: se entrega en el mostrador contra el código.
    RAISE EXCEPTION 'retiro_no_se_despacha: este pedido es de retiro en tienda; se entrega en el mostrador'
      USING ERRCODE = '22023';
  END IF;

  -- La decisión ① del founder: la entrega la asigna el SELLER. El repartidor
  -- tiene que ser de SU casa y estar activo — asignarle el envío a un
  -- repartidor ajeno le abriría la dirección de una familia que no es suya.
  SELECT * INTO v_rep FROM repartidores
   WHERE id = p_repartidor_id AND cuenta_comercial_id = v_ped.cuenta_comercial_id AND activo;
  IF v_rep.id IS NULL THEN
    RAISE EXCEPTION 'repartidor_invalido: no existe, no es de esta casa o está inactivo'
      USING ERRCODE = '22023';
  END IF;

  IF v_ped.entrega_direccion IS NULL OR length(btrim(v_ped.entrega_direccion)) = 0 THEN
    -- Sin dirección no hay a dónde ir: el envío nacería con un destino vacío
    -- y el repartidor lo descubriría arriba de la moto.
    RAISE EXCEPTION 'pedido_sin_direccion' USING ERRCODE = '22023';
  END IF;

  v_reintento := (v_ped.estado = 'entrega_fallida');

  -- El envío: UNO por pedido. El reintento reusa la fila (mismo código — la
  -- familia ya lo tiene) y suma el intento; el primer despacho la crea con el
  -- SNAPSHOT que la pantalla del repartidor lee. El código es de 4 dígitos:
  -- se dice en una puerta, de viva voz, una sola vez.
  SELECT id INTO v_envio FROM envios WHERE pedido_id = p_pedido_id;
  IF v_envio IS NULL THEN
    v_codigo := lpad(floor(random() * 10000)::int::text, 4, '0');
    INSERT INTO envios (pedido_id, cuenta_comercial_id, country_code, transportista,
                        metodo, estado, repartidor_id, codigo_verificacion,
                        destino_ciudad, destino_direccion, destino_referencia,
                        instrucciones_entrega, destino_lat, destino_lon,
                        nombre_receptor, telefono_receptor,
                        promesa_entrega_desde, promesa_entrega_hasta,
                        entrega_programada, intentos_entrega, costo_envio, moneda,
                        pagado_por, salio_en)
      VALUES (p_pedido_id, v_ped.cuenta_comercial_id, COALESCE(v_ped.country_code,'EC'),
              'propio', 'despacho', 'en_reparto', p_repartidor_id,
              v_codigo,
              v_ped.entrega_ciudad, v_ped.entrega_direccion, v_ped.entrega_referencias,
              v_ped.entrega_instrucciones, v_ped.entrega_lat, v_ped.entrega_lon,
              v_ped.entrega_nombre_receptor, v_ped.entrega_telefono,
              v_ped.promesa_entrega_desde, v_ped.promesa_entrega_hasta,
              v_ped.entrega_programada, 0, COALESCE(v_ped.costo_envio, 0),
              COALESCE(v_ped.moneda,'USD'), 'seller', now())
      RETURNING id INTO v_envio;
  ELSE
    UPDATE envios SET repartidor_id = p_repartidor_id, estado = 'en_reparto',
                      salio_en = now(), hacia_destino_en = NULL, updated_at = now()
     WHERE id = v_envio;
    SELECT codigo_verificacion INTO v_codigo FROM envios WHERE id = v_envio;
  END IF;

  PERFORM _mover_estado_pedido(p_pedido_id, 'en_reparto', 'vendedor');

  RETURN jsonb_build_object('ok', true, 'envio_id', v_envio,
                            'repartidor_id', p_repartidor_id,
                            'codigo_verificacion', v_codigo,
                            'reintento', v_reintento,
                            'narrativa', 'en_camino');
END $$;

REVOKE ALL ON FUNCTION public.despachar_pedido(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.despachar_pedido(uuid, uuid) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⑦ LOS DOS MOVIMIENTOS SIN EVIDENCIA DEL REPARTIDOR
--    (el tercero — entregar con foto y código — es la M2)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE FUNCTION public.marcar_en_camino_a_destino(p_envio_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_env record;
BEGIN
  SELECT * INTO v_env FROM envios WHERE id = p_envio_id FOR UPDATE;
  IF v_env.id IS NULL THEN RAISE EXCEPTION 'envio_no_existe' USING ERRCODE = '22023'; END IF;
  IF auth.uid() IS NOT NULL AND NOT _es_repartidor_del_pedido(v_env.pedido_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_sos_el_repartidor_asignado' USING ERRCODE = '42501';
  END IF;

  PERFORM _mover_estado_pedido(v_env.pedido_id, 'hacia_destino', 'repartidor');
  UPDATE envios SET estado = 'hacia_destino', hacia_destino_en = now(), updated_at = now()
   WHERE id = p_envio_id;

  RETURN jsonb_build_object('ok', true, 'envio_id', p_envio_id, 'narrativa', 'en_camino');
END $$;

CREATE FUNCTION public.marcar_entrega_fallida(p_envio_id uuid, p_motivo text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_env record; v_actor text;
BEGIN
  SELECT * INTO v_env FROM envios WHERE id = p_envio_id FOR UPDATE;
  IF v_env.id IS NULL THEN RAISE EXCEPTION 'envio_no_existe' USING ERRCODE = '22023'; END IF;

  -- La marca quien está en la puerta (repartidor) — o el vendedor, que es
  -- quien responde cuando el repartidor no tiene cuenta. El admin entra por
  -- la rama repartidor del anillo interno (que lo admite); el motor sin
  -- sesión entra como `sistema`, cuya transición ya existe desde S95.
  IF _es_repartidor_del_pedido(v_env.pedido_id) THEN
    v_actor := 'repartidor';
  ELSIF EXISTS (SELECT 1 FROM pedidos p WHERE p.id = v_env.pedido_id
                  AND es_vendedor_de(p.cuenta_comercial_id)) THEN
    v_actor := 'vendedor';
  ELSIF is_admin() THEN
    v_actor := 'repartidor';
  ELSIF auth.uid() IS NULL THEN
    v_actor := 'sistema';
  ELSE
    RAISE EXCEPTION 'no_podes_operar_este_envio' USING ERRCODE = '42501';
  END IF;

  -- `entrega_fallida` exige motivo en el catálogo: el rebote hablado lo da
  -- el motor si falta. El motivo es la instrucción para el reagendado.
  PERFORM _mover_estado_pedido(v_env.pedido_id, 'entrega_fallida', v_actor, p_motivo);
  UPDATE envios SET estado = 'fallido',
                    intentos_entrega = COALESCE(intentos_entrega, 0) + 1,
                    updated_at = now()
   WHERE id = p_envio_id;

  -- 🔴 Y LO QUE IMPORTA PARA LA CASA: una entrega fallida JAMÁS deposita en
  -- el expediente. Acá no hay un solo INSERT a eventos_mascota — la compra
  -- entra al entregar, y esto no se entregó (LETRA_RECORRIDO §9.3).
  RETURN jsonb_build_object('ok', true, 'envio_id', p_envio_id,
                            'intentos', (SELECT intentos_entrega FROM envios WHERE id = p_envio_id),
                            'narrativa', 'no_llego');
END $$;

REVOKE ALL ON FUNCTION public.marcar_en_camino_a_destino(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marcar_en_camino_a_destino(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.marcar_entrega_fallida(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marcar_entrega_fallida(uuid, text) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN · el circuito entero por el camino real, con contra-casos
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_cc uuid; v_user uuid; v_of uuid; v_sku uuid; v_ped uuid; v_rep uuid; v_envio uuid;
  v_ped_antes int; v_env_antes int; v_rep_antes int; v_disp_antes int;
  v_n int; v_ok boolean; v_msg text; v_estado text; v_res jsonb; v_codigo text;
BEGIN
  SELECT count(*) INTO v_ped_antes FROM pedidos;
  SELECT count(*) INTO v_env_antes FROM envios;
  SELECT count(*) INTO v_rep_antes FROM repartidores;

  SELECT cc.id, cc.owner_profile_id INTO v_cc, v_user
  FROM cuentas_comerciales cc WHERE cc.estado='activa'
    AND EXISTS (SELECT 1 FROM cuenta_roles cr WHERE cr.cuenta_comercial_id=cc.id
                 AND cr.tipo_actor='seller_productos' AND cr.estado='activo') LIMIT 1;
  SELECT o.id, o.sku_id INTO v_of, v_sku FROM ofertas o WHERE o.estado='publicada' LIMIT 1;
  IF v_cc IS NULL OR v_of IS NULL THEN
    RAISE EXCEPTION 'ABORTA: sin vendedor activo y oferta publicada el cinturón no prueba nada.';
  END IF;
  SELECT stock_disponible INTO v_disp_antes FROM vendedor_skus WHERE id = v_sku;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user, 'role','authenticated')::text, true);

  -- ── A · el rol nace por la puerta, idempotente ───────────────────────────
  v_res := registrar_repartidor(v_cc, '__cint Repartidor', 'CINT-0001', '+593999999901', NULL);
  v_rep := (v_res->>'repartidor_id')::uuid;
  IF (registrar_repartidor(v_cc, '__cint Repartidor', 'CINT-0001')->>'ya_existia')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ABORTA: registrar dos veces el mismo documento creó dos repartidores.';
  END IF;

  -- ── B · un pedido real llega a documentado ───────────────────────────────
  PERFORM ajustar_stock_vendedor(v_sku, 2, '__cint_s96m1 carga temporal');
  SELECT (crear_pedido_despensa(v_cc,
            jsonb_build_array(jsonb_build_object('oferta_id', v_of, 'cantidad', 1)),
            '{"nombre_receptor":"cint","telefono":"+593999999999","direccion":"Calle x","ciudad":"Quito","referencias":"porton negro"}'::jsonb,
            '__cint_s96m1')->>'pedido_id')::uuid INTO v_ped;
  PERFORM iniciar_pago_pedido(v_ped, 5);
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM confirmar_pago_pedido(v_ped, '__cint', 'ref', '__cint_s96m1_pago', '{}'::jsonb);
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user, 'role','authenticated')::text, true);
  PERFORM _mover_estado_pedido(v_ped, 'picking', 'vendedor');
  PERFORM empacar_pedido(v_ped,
    (SELECT jsonb_agg(jsonb_build_object('item_id', id, 'lote', '__cint-L1'))
       FROM pedido_items WHERE pedido_id = v_ped), 2.5);
  PERFORM registrar_factura_pedido(v_ped, '__cint 001-001-000000001');

  -- ── C · 🔴 despachar con un repartidor AJENO rebota ──────────────────────
  v_ok := true;
  BEGIN PERFORM despachar_pedido(v_ped, gen_random_uuid());
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok OR v_msg NOT LIKE 'repartidor_invalido%' THEN
    RAISE EXCEPTION 'ABORTA: se despachó con un repartidor que no es de la casa (%).', COALESCE(v_msg,'sin error');
  END IF;

  -- ── D · el despacho real: envío + código + en_reparto ────────────────────
  v_res := despachar_pedido(v_ped, v_rep);
  v_envio  := (v_res->>'envio_id')::uuid;
  v_codigo := v_res->>'codigo_verificacion';
  IF v_codigo IS NULL OR length(v_codigo) <> 4 THEN
    RAISE EXCEPTION 'ABORTA: el despacho no generó el código de la puerta.';
  END IF;
  SELECT estado INTO v_estado FROM pedidos WHERE id = v_ped;
  IF v_estado <> 'en_reparto' THEN
    RAISE EXCEPTION 'ABORTA: tras despachar el pedido quedó en «%».', v_estado;
  END IF;
  -- El snapshot viajó: la pantalla del repartidor no necesita leer pedidos.
  IF (SELECT destino_direccion FROM envios WHERE id = v_envio) IS DISTINCT FROM 'Calle x' THEN
    RAISE EXCEPTION 'ABORTA: el snapshot del destino no viajó al envío.';
  END IF;

  -- ── E · 🔴 la puerta pública rechaza al actor repartidor ─────────────────
  v_ok := true;
  BEGIN PERFORM mover_estado_pedido(v_ped, 'hacia_destino', 'repartidor');
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok OR v_msg NOT LIKE 'actor_repartidor_no_invocable%' THEN
    RAISE EXCEPTION 'ABORTA: la puerta pública dejó pasar al actor repartidor (%).', COALESCE(v_msg,'sin error');
  END IF;

  -- ── F · 🔴 un extraño no puede marcar «voy hacia acá» ────────────────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', gen_random_uuid(), 'role','authenticated')::text, true);
  v_ok := true;
  BEGIN PERFORM marcar_en_camino_a_destino(v_envio);
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok OR v_msg NOT LIKE 'no_sos_el_repartidor_asignado%' THEN
    RAISE EXCEPTION 'ABORTA: un extraño marcó «voy hacia acá» (%).', COALESCE(v_msg,'sin error');
  END IF;

  -- ── G · el repartidor CON cuenta sí puede — y por SU camino ──────────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user, 'role','authenticated')::text, true);
  PERFORM actualizar_repartidor(v_rep, NULL, NULL, NULL, v_user);
  PERFORM marcar_en_camino_a_destino(v_envio);
  SELECT estado INTO v_estado FROM pedidos WHERE id = v_ped;
  IF v_estado <> 'hacia_destino' THEN
    RAISE EXCEPTION 'ABORTA: «voy hacia acá» dejó el pedido en «%».', v_estado;
  END IF;

  -- ── H · «no había nadie»: exige motivo, suma intento, NO deposita ────────
  v_ok := true;
  BEGIN PERFORM marcar_entrega_fallida(v_envio, NULL);
  EXCEPTION WHEN OTHERS THEN v_ok := false; v_msg := SQLERRM; END;
  IF v_ok OR v_msg NOT LIKE 'motivo_requerido%' THEN
    RAISE EXCEPTION 'ABORTA: la fallida pasó sin motivo (%).', COALESCE(v_msg,'sin error');
  END IF;
  SELECT count(*) INTO v_n FROM evento_producto_asignacion;
  PERFORM marcar_entrega_fallida(v_envio, '__cint nadie en casa');
  IF (SELECT count(*) FROM evento_producto_asignacion) <> v_n THEN
    RAISE EXCEPTION 'ABORTA: la entrega fallida depositó en el expediente.';
  END IF;
  IF (SELECT intentos_entrega FROM envios WHERE id = v_envio) <> 1 THEN
    RAISE EXCEPTION 'ABORTA: la fallida no sumó el intento.';
  END IF;

  -- ── I · el reagendado reusa el envío y CONSERVA el código ────────────────
  v_res := despachar_pedido(v_ped, v_rep);
  IF (v_res->>'envio_id')::uuid <> v_envio OR v_res->>'codigo_verificacion' <> v_codigo THEN
    RAISE EXCEPTION 'ABORTA: el reintento creó otro envío o cambió el código que la familia ya tiene.';
  END IF;
  IF (v_res->>'reintento')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ABORTA: el reintento no se declaró como tal.';
  END IF;

  -- ── DESMONTAJE con residuo verificado (76(g)) ────────────────────────────
  PERFORM set_config('request.jwt.claims', '', true);
  DELETE FROM pagos_eventos  WHERE clave_idempotencia LIKE '__cint_s96m1%';
  DELETE FROM pagos_intentos WHERE clave_idempotencia LIKE '__cint_s96m1%';
  DELETE FROM facturas       WHERE pedido_id = v_ped;
  DELETE FROM envio_eventos  WHERE envio_id = v_envio;
  DELETE FROM envios         WHERE id = v_envio;
  UPDATE inventario_reservas SET estado='liberada', cerrada_en=now()
   WHERE pedido_id = v_ped AND estado='vigente';
  DELETE FROM inventario_reservas WHERE pedido_id = v_ped;
  -- El stock se devuelve COMPENSANDO, no borrando (L-231): el saldo lo
  -- mantiene un trigger AFTER INSERT que no se entera del DELETE.
  SELECT stock_disponible INTO v_n FROM vendedor_skus WHERE id = v_sku;
  IF v_n <> v_disp_antes THEN
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_user, 'role','authenticated')::text, true);
    PERFORM ajustar_stock_vendedor(v_sku, v_disp_antes - v_n, '__cint_s96m1 devolucion del fixture');
    PERFORM set_config('request.jwt.claims', '', true);
  END IF;
  DELETE FROM inventario_movimientos
   WHERE referencia_id = v_ped OR motivo LIKE '__cint_s96m1%';
  DELETE FROM pedido_estados WHERE pedido_id = v_ped;
  DELETE FROM pedido_items   WHERE pedido_id = v_ped;
  DELETE FROM pedidos        WHERE clave_idempotencia LIKE '__cint_s96m1%';
  DELETE FROM repartidores   WHERE documento = 'CINT-0001';

  SELECT count(*) INTO v_n FROM pedidos;
  IF v_n <> v_ped_antes THEN RAISE EXCEPTION 'ABORTA 76(g): pedidos % vs %', v_n, v_ped_antes; END IF;
  SELECT count(*) INTO v_n FROM envios;
  IF v_n <> v_env_antes THEN RAISE EXCEPTION 'ABORTA 76(g): envios % vs %', v_n, v_env_antes; END IF;
  SELECT count(*) INTO v_n FROM repartidores;
  IF v_n <> v_rep_antes THEN RAISE EXCEPTION 'ABORTA 76(g): repartidores % vs %', v_n, v_rep_antes; END IF;
  SELECT stock_disponible INTO v_n FROM vendedor_skus WHERE id = v_sku;
  IF v_n <> v_disp_antes THEN
    RAISE EXCEPTION 'ABORTA 76(g): el stock del SKU quedó en % y arrancó en %.', v_n, v_disp_antes;
  END IF;

  RAISE NOTICE 'CINTURÓN S96-M1: el rol nace idempotente, el repartidor ajeno rebota, el despacho asigna y genera código, la puerta pública rechaza al actor, el extraño rebota, «voy hacia acá» corre, la fallida exige motivo y NO deposita, y el reintento conserva envío y código. Residuo 0.';
END $$;

-- ── Cinturón estructural: lo que el fixture no cubre ────────────────────────
DO $$
BEGIN
  -- El estado nuevo existe, activo, con la narrativa de la familia.
  IF NOT EXISTS (SELECT 1 FROM cat_estados_pedido
                 WHERE codigo='hacia_destino' AND activo AND narrativa='en_camino') THEN
    RAISE EXCEPTION 'ABORTA: hacia_destino no quedó activo con narrativa en_camino.';
  END IF;
  -- esperando_courier quedó apagado Y con su porqué.
  IF EXISTS (SELECT 1 FROM cat_estados_pedido
             WHERE codigo='esperando_courier' AND (activo OR motivo_inactivo IS NULL)) THEN
    RAISE EXCEPTION 'ABORTA: esperando_courier sigue activo o sin motivo.';
  END IF;
  -- Ninguna función nueva quedó ejecutable por anon (L-140).
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
      AND p.proname IN ('registrar_repartidor','actualizar_repartidor','despachar_pedido',
                        'marcar_en_camino_a_destino','marcar_entrega_fallida',
                        '_es_repartidor_del_pedido')
      AND has_function_privilege('anon', p.oid, 'EXECUTE')) THEN
    RAISE EXCEPTION 'ABORTA L-140: una función nueva quedó ejecutable por anon.';
  END IF;
END $$;

COMMIT;
