-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ S101-B · FASE 4 · EL ACTUADOR — CONSTRUIDO Y **APAGADO**                ║
-- ║ ENTREGADA SIN APLICAR — pide firma.                                     ║
-- ║ Reversa: docs/relevamientos/2026-08-20-s101b-REVERSA-20260821090000.sql ║
-- ║ (escrita ANTES, y declara que revertir NO deshace lo confirmado)        ║
-- ║ Regla 76(g): NO RIGE — función nueva + una fila de config, sin backfill.║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- ═══ QUÉ ES ════════════════════════════════════════════════════════════════
--
-- El buzón **recibe y guarda**. El actuador es lo único que **mueve plata**: lee
-- un evento ya persistido y, si corresponde, confirma la compra.
--
-- 🔴 **NACE APAGADO POR BANDERA, Y LA BANDERA VIVE EN LA BASE**, no en el
--    código: encenderlo es un acto de la mesa, no un deploy. *Un actuador que se
--    enciende con un push se enciende sin que nadie lo decida.*
--
-- ═══ ⚖️ LA LEY DEL ACTUADOR (firma de mesa, 20-ago) ═════════════════════════
--
-- **Solo actúa sobre `credencial=SERVER` y `autenticado=true`.**
--
-- Y la razón no es prolijidad: la fórmula del `stoken` usa la *application key*
-- **de la credencial del evento**. Las altas de tarjeta vienen firmadas con la
-- **CLIENT**… y **la CLIENT es pública por diseño: la sirve nuestra propia
-- página de pago.** ⇒ **cualquiera que abra esa página puede fabricar un stoken
-- de alta válido.**
--
-- ⇒ **Los eventos de alta son INFORMATIVOS POR CONSTRUCCIÓN.** Solo el cobro
--   —clave SERVER, que jamás sale del servidor— autentica de verdad.
--   *Tratar los dos iguales sería poner un candado cuya llave está colgada en la
--   puerta.*

-- ── ① LA BANDERA ───────────────────────────────────────────────────────────
INSERT INTO app_config (clave, valor, tipo, descripcion, categoria, es_publico)
VALUES ('pagos_actuador_vivo', 'false', 'booleano',
        'S101-B: si el actuador puede mover estados. APAGADO hasta arbitraje de mesa. '
        'Encenderlo confirma compras de verdad y dispara correos a familias reales.',
        -- 🔴 `integraciones` y no `pagos`: el CHECK de `categoria` tiene
        -- vocabulario CERRADO y `pagos` no está adentro. **Es la tercera vez en
        -- la jornada que invento un valor contra un CHECK** (el `resultado` del
        -- buzón y el estado del reservador fueron las otras dos).
        -- *Un vocabulario cerrado no se amplía de paso mientras construís otra
        -- cosa: se mide primero, y si de verdad falta un valor, eso es una
        -- decisión de letra con su propia firma.*
        'integraciones', false)
ON CONFLICT (clave) DO NOTHING;

-- ── ② EL ACTUADOR ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.aplicar_evento_de_pago(p_evento_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE
  v_e        record;
  v_vivo     boolean;
  v_compra   uuid;
  v_monto    numeric;
  v_estado   text;
  v_tx       text;
  v_auth     text;
  v_res      jsonb;
  v_user     uuid;
BEGIN
  SELECT * INTO v_e FROM webhook_events WHERE id = p_evento_id FOR UPDATE;
  IF v_e.id IS NULL THEN
    RAISE EXCEPTION 'evento_no_existe' USING ERRCODE = '22023';
  END IF;

  -- 🔴 ① ¿ESTÁ ENCENDIDO? Se pregunta PRIMERO y se responde hablado: un
  --    actuador apagado que falla en silencio no se distingue de uno roto.
  SELECT (valor = 'true') INTO v_vivo FROM app_config WHERE clave = 'pagos_actuador_vivo';
  IF NOT COALESCE(v_vivo, false) THEN
    RETURN jsonb_build_object('ok', true, 'aplicado', false, 'motivo', 'actuador_apagado');
  END IF;

  -- 🔴 ② LA LEY: solo eventos autenticados con credencial SERVER.
  IF COALESCE(v_e.stoken_valido, false) IS NOT TRUE
     OR v_e.detalle NOT ILIKE '%credencial=SERVER%' THEN
    RETURN jsonb_build_object('ok', true, 'aplicado', false,
      'motivo', 'evento_no_autenticado_o_no_server');
  END IF;

  -- ③ El vínculo con nuestra compra es el `dev_reference`, que **nosotros**
  --    pusimos al crear el intento: es el id de LA COMPRA, jamás el de un pedido.
  v_compra := NULLIF(v_e.payload->'transaction'->>'dev_reference','')::uuid;
  IF v_compra IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'aplicado', false, 'motivo', 'sin_dev_reference');
  END IF;

  v_estado := v_e.payload->'transaction'->>'status';
  v_monto  := NULLIF(v_e.payload->'transaction'->>'amount','')::numeric;
  v_tx     := v_e.payload->'transaction'->>'id';
  v_auth   := v_e.payload->'transaction'->>'authorization_code';

  -- ④ Solo el aprobado confirma. Todo lo demás **se registra y no mueve nada**:
  --    *un actuador que interpreta estados que no conoce es un actuador que
  --    inventa.* Lo desconocido queda visible, no absorbido.
  IF v_estado IS DISTINCT FROM '1' THEN
    UPDATE webhook_events
       SET resultado = 'desconocido',
           detalle = COALESCE(detalle,'') || ' · actuador: status=' || COALESCE(v_estado,'∅') || ' no confirma'
     WHERE id = p_evento_id;
    RETURN jsonb_build_object('ok', true, 'aplicado', false,
      'motivo', 'status_no_aprobado', 'status', v_estado);
  END IF;

  -- ⑤ LA TRANSICIÓN. `confirmar_pago_compra` ya trae la idempotencia al grano
  --    de la compra (el caso ③ y el webhook tardío mueren ahí), la validación
  --    de monto, y el estampado de los datos de la pasarela.
  v_res := confirmar_pago_compra(
    p_compra_id           => v_compra,
    p_proveedor           => 'nuvei',
    p_referencia          => v_tx,
    p_clave_idempotencia  => 'wh:' || p_evento_id::text,
    p_payload             => v_e.payload,
    p_confirmado_por      => 'webhook',
    p_transaction_id      => v_tx,
    p_monto               => v_monto,
    p_authorization_code  => v_auth,
    p_marca               => v_e.payload->'card'->>'type',
    p_bin                 => v_e.payload->'card'->>'bin',
    p_ultimos4            => v_e.payload->'card'->>'number');

  -- ⑥ 🔴 EL COMPROBANTE — REQUISITO DE CERTIFICACIÓN DE NUVEI (Erick, 20-ago):
  --    *«necesitamos que ese correo adjunte esos 2 códigos»* — el id de
  --    transacción y el código de autorización.
  --
  --    **Lo dispara ACÁ, en la transición a confirmado — JAMÁS la señal
  --    optimista.** *Un correo sobre un pago que todavía no está confirmado
  --    sería exactamente la mentira que toda la letra prohíbe.*
  --
  --    Idempotente por `p_clave_dedup` anclada al EVENTO: un webhook duplicado
  --    no manda dos correos. Y el tipo `pago_confirmado` está **en sombra** en
  --    el catálogo, así que hoy se registra la intención y no sale nada —
  --    *el correo nace apagado por el mecanismo de la casa, no por uno mío.*
  IF COALESCE((v_res->>'duplicado')::boolean, false) IS NOT TRUE THEN
    SELECT user_id INTO v_user FROM compras WHERE id = v_compra;
    PERFORM registrar_intencion_notificacion(
      p_tipo               => 'pago_confirmado',
      p_destinatario_user_id => v_user,
      p_mascota_id         => NULL,
      p_evento_id          => NULL,
      p_datos              => jsonb_build_object(
                                'transaction_id',     v_tx,
                                'authorization_code', v_auth,
                                'monto',              v_monto,
                                'moneda',             (SELECT moneda FROM compras WHERE id = v_compra),
                                'compra_id',          v_compra),
      p_clave_dedup        => 'comprobante:' || v_compra::text);
  END IF;

  UPDATE webhook_events
     SET resultado = 'aplicado',
         detalle = COALESCE(detalle,'') || ' · actuador: ' || COALESCE(v_res::text,'')
   WHERE id = p_evento_id;

  RETURN jsonb_build_object('ok', true, 'aplicado', true, 'compra_id', v_compra,
                            'resultado', v_res);
END $$;

-- La puerta es del servidor. Nadie con sesión de persona la alcanza.
REVOKE ALL ON FUNCTION public.aplicar_evento_de_pago(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aplicar_evento_de_pago(uuid) TO service_role;

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $$
DECLARE v_vivo text; v_acl text; v_tipo int;
BEGIN
  SELECT valor INTO v_vivo FROM app_config WHERE clave='pagos_actuador_vivo';
  IF v_vivo IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION 'CINTURON: el actuador no nacio apagado (%)', v_vivo;
  END IF;

  SELECT array_to_string(p.proacl,',') INTO v_acl FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='aplicar_evento_de_pago';
  IF v_acl ILIKE '%anon=%' OR v_acl ILIKE '%authenticated=%' THEN
    RAISE EXCEPTION 'CINTURON: la puerta del actuador esta abierta a una sesion de persona';
  END IF;

  SELECT count(*) INTO v_tipo FROM cat_notificacion_tipos
   WHERE codigo='pago_confirmado' AND en_sombra;
  IF v_tipo <> 1 THEN
    RAISE EXCEPTION 'CINTURON: el comprobante no esta en sombra — saldrian correos reales';
  END IF;

  RAISE NOTICE 'cinturon verde: actuador apagado, puerta cerrada, comprobante en sombra';
END $$;
