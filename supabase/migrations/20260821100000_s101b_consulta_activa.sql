-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ S101-B · FASE 6 · LA CONSULTA ACTIVA — el reconciliador                 ║
-- ║ ENTREGADA SIN APLICAR — pide firma.                                     ║
-- ║ Reversa: docs/relevamientos/2026-08-20-s101b-REVERSA-20260821100000.sql ║
-- ║ (escrita ANTES; declara que NO deshace reconciliaciones ni desagenda)   ║
-- ║ Regla 76(g): NO RIGE — dos funciones nuevas, sin backfill.              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- ═══ POR QUÉ EXISTE — LOS DOS CASOS QUE EL ACTUADOR NO PUEDE CUBRIR ═════════
--
-- El actuador vive del webhook. Le faltan **dos de los cuatro casos de §6**, y
-- los dos son de la misma familia: **el webhook no llegó.**
--
-- **②** *vuelve el teléfono, el webhook no llegó* → la pantalla espera y el tope
--   habla, pero **nadie reconcilia**.
-- **④** *no llega ninguno* → **un pago cobrado por Nuvei y nunca confirmado
--   queda invisible, con la plata ya debitada al cliente.**
--
-- 🔴 Y no es hipotético: **el 20-ago el callback del primer débito real se
--    perdió** porque nuestro buzón devolvió 500. Con este barrido, esa compra se
--    habría resuelto sola el mismo día. *Sin él, el único aviso de que algo
--    salió mal es que un cliente reclame.*
--
-- ═══ 🔴 LA REGLA MADRE DE ESTA PIEZA ════════════════════════════════════════
--
-- **EL BARRIDO JAMÁS DECLARA RECHAZADO POR SU CUENTA. ESCALA.**
--
-- Que el proveedor no nos muestre una transacción aprobada puede significar tres
-- cosas distintas —no se cobró · se cobró y su lectura tarda · le preguntamos
-- mal— y **desde acá no se distinguen**. *Marcar «rechazado» convierte una duda
-- nuestra en un veredicto contra el cliente, que es exactamente la trampa que
-- las voces de esta sesión vinieron a cerrar.* Lo que no entendemos **se
-- escala con su crudo**, y lo mira una persona.
--
-- ═══ LA CADENCIA (E4, firmada) ══════════════════════════════════════════════
--
-- Pasada **~12:00** y **última a las 16:15 America/Guayaquil** — 45 min antes
-- del corte más temprano (**Medianet 17:00**; Datafast 17:50).
-- **Porque el reverso es MISMO DÍA:** un huérfano detectado hoy se reversa;
-- detectado mañana es plata del cliente retenida y un trámite con el banco
-- (§6ter, literal de Erick).
--
-- 🔴 **EL JOB NO SE AGENDA ACÁ.** Se agenda con firma al desplegar, porque
--    agendarlo es empezar a tocar plata en un horario. *Una migración que
--    enciende un reloj lo enciende para siempre y sin que nadie lo mire.*

-- ── ① QUIÉN NECESITA QUE LE PREGUNTEMOS ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.pagos_pendientes_de_conciliar(
  p_minutos_de_gracia integer DEFAULT 10
) RETURNS TABLE (compra_id uuid, transaction_id text, monto numeric, creado_en timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
  -- Compras que intentaron pagar y no llegaron a `pagada`, con un intento que
  -- YA tiene id de transacción del proveedor: sin ese id no hay a quién
  -- preguntarle, y un intento recién nacido todavía puede estar en vuelo —
  -- de ahí los minutos de gracia.
  SELECT DISTINCT c.id, i.proveedor_transaction_id, c.total, i.creado_en
    FROM compras c
    JOIN pagos_intentos i ON i.compra_id = c.id
   WHERE c.estado IN ('creada','esperando_pago')
     AND i.proveedor_transaction_id IS NOT NULL
     AND i.creado_en < now() - make_interval(mins => p_minutos_de_gracia)
   ORDER BY i.creado_en;
$$;

-- ── ② EL RESOLVEDOR ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.resolver_consulta_activa(
  p_compra_id uuid,
  p_crudo     jsonb,
  p_origen    text DEFAULT 'barrido'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE
  v_estado  text;
  v_tx      text;
  v_auth    text;
  v_monto   numeric;
  v_compra  record;
  v_res     jsonb;
  v_user    uuid;
  v_resol   text;
BEGIN
  -- Puerta de servidor: este camino confirma pagos.
  IF auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'consulta_activa_no_es_del_cliente' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_compra FROM compras WHERE id = p_compra_id FOR UPDATE;
  IF v_compra.id IS NULL THEN
    RAISE EXCEPTION 'compra_no_existe' USING ERRCODE = '22023';
  END IF;

  -- Idempotencia: si ya está pagada, esto no hace nada. El barrido puede correr
  -- dos veces sin consecuencias.
  IF v_compra.estado = 'pagada' THEN
    RETURN jsonb_build_object('ok', true, 'resolucion', 'ya_estaba_pagada');
  END IF;

  v_estado := p_crudo->'transaction'->>'status';
  v_tx     := p_crudo->'transaction'->>'id';
  v_auth   := p_crudo->'transaction'->>'authorization_code';
  v_monto  := NULLIF(p_crudo->'transaction'->>'amount','')::numeric;

  IF v_estado = '1' THEN
    -- ══ CONFIRMADO TARDÍO ══════════════════════════════════════════════════
    -- El proveedor dice que sí y nosotros no lo sabíamos. `confirmado_por` lo
    -- deja escrito: sin ese dato no se puede auditar cuál de los cuatro casos
    -- ocurrió (letra §4).
    v_res := confirmar_pago_compra(
      p_compra_id          => p_compra_id,
      p_proveedor          => 'nuvei',
      p_referencia         => v_tx,
      p_clave_idempotencia => 'ca:' || COALESCE(v_tx, p_compra_id::text),
      p_payload            => p_crudo,
      p_confirmado_por     => 'consulta_activa',
      p_transaction_id     => v_tx,
      p_monto              => v_monto,
      p_authorization_code => v_auth,
      p_marca              => p_crudo->'card'->>'type',
      p_bin                => p_crudo->'card'->>'bin',
      p_ultimos4           => p_crudo->'card'->>'number');
    v_resol := 'confirmado_tardio';

    -- El comprobante también nace acá: **la familia no tiene por qué saber si
    -- su pago se confirmó por webhook o porque fuimos a preguntar.** Mismo
    -- `clave_dedup` que el actuador ⇒ si los dos caminos corren, va UN correo.
    IF COALESCE((v_res->>'duplicado')::boolean, false) IS NOT TRUE THEN
      SELECT user_id INTO v_user FROM compras WHERE id = p_compra_id;
      PERFORM registrar_intencion_notificacion(
        p_tipo => 'pago_confirmado', p_destinatario_user_id => v_user,
        p_mascota_id => NULL, p_evento_id => NULL,
        p_datos => jsonb_build_object('transaction_id', v_tx,
                     'authorization_code', v_auth, 'monto', v_monto,
                     'moneda', v_compra.moneda, 'compra_id', p_compra_id),
        p_clave_dedup => 'comprobante:' || p_compra_id::text);
    END IF;
  ELSE
    -- ══ 🔴 TODO LO DEMÁS: SE ESCALA, NO SE DECIDE ══════════════════════════
    -- `huerfano_escalado` cubre el no-encontrado, el estado que no conocemos y
    -- el rechazo aparente. **No se marca la compra de ninguna forma**: sigue
    -- esperando, y una persona mira el crudo.
    -- *La diferencia entre «el banco dijo que no» y «no pudimos averiguarlo» no
    -- la puede resolver un barrido, y fingir que sí es lo que hace que alguien
    -- pague dos veces algo que ya pagó.*
    v_resol := 'huerfano_escalado';
  END IF;

  -- La traza va SIEMPRE, resuelva o escale: es la única prueba de qué dijo el
  -- proveedor y cuándo se lo preguntamos.
  INSERT INTO pagos_eventos (intento_id, proveedor, tipo, payload, clave_idempotencia, procesado_en)
  SELECT i.id, 'nuvei', 'consulta_activa',
         jsonb_build_object('crudo', p_crudo, 'resolucion', v_resol, 'origen', p_origen),
         'ca:' || COALESCE(v_tx, p_compra_id::text) || ':' || i.id::text, now()
    FROM pagos_intentos i WHERE i.compra_id = p_compra_id
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'resolucion', v_resol,
                            'compra_id', p_compra_id, 'transaction_id', v_tx);
END $$;

REVOKE ALL ON FUNCTION public.pagos_pendientes_de_conciliar(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.resolver_consulta_activa(uuid, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pagos_pendientes_de_conciliar(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.resolver_consulta_activa(uuid, jsonb, text) TO service_role;

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $$
DECLARE v_acl text; v_def text;
BEGIN
  FOR v_acl IN
    SELECT array_to_string(p.proacl, ',') FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname='public'
       AND p.proname IN ('pagos_pendientes_de_conciliar','resolver_consulta_activa')
  LOOP
    IF v_acl ILIKE '%anon=%' OR v_acl ILIKE '%authenticated=%' THEN
      RAISE EXCEPTION 'CINTURON: la consulta activa quedo alcanzable desde una sesion de persona';
    END IF;
  END LOOP;

  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='resolver_consulta_activa';
  -- 🔴 EL DISCRIMINADOR: que el barrido NO pueda declarar rechazado. Si alguna
  --    vez aparece ese estado acá, la regla madre se rompio.
  IF v_def ~ 'estado[[:space:]]*(:)?=[[:space:]]*''rechazad' THEN
    RAISE EXCEPTION 'CINTURON: el barrido esta declarando rechazado por su cuenta';
  END IF;
  IF v_def NOT ILIKE '%huerfano_escalado%' THEN
    RAISE EXCEPTION 'CINTURON: falta la salida de escalamiento';
  END IF;

  RAISE NOTICE 'cinturon verde: la consulta activa confirma o escala, y nunca rechaza';
END $$;
