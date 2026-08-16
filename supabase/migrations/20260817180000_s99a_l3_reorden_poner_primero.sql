-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · L3 — EL MOTOR DEL REORDEN: «Poner primero» (diseño de C, RATIFICADO
-- por mesa SIN enmienda, 17-ago-2026 — la palabra que este motor esperaba).
--
-- LA LETRA QUE IMPLEMENTA, entera:
--  · El reorden lo escribe SOLO EL PANEL; la ventana LEE (firma L3).
--  · Vive en el DETALLE como «Poner primero»; el pedido movido LO DICE
--    («Movido a mano» + «Volver al orden») — un orden alterado que no se
--    declara es un FIFO que miente.
--  · NO cruza bandas — ordena, jamás re-promete: la marca no toca promesa,
--    estado ni narrativa. Las bandas son de la PIEZA (derivadas); la marca
--    solo ordena DENTRO de la banda: movidos primero (marca DESC), después
--    el FIFO por pago_confirmado_en.
--  · Sin arrastre: dos puertas explícitas, jamás un modo de drag&drop —
--    si el FIFO es la ley, el arrastre convierte la excepción en costumbre.
--
-- 76(g): NO RIGE — columna nueva NULLABLE (cero backfill: NULL = orden
-- natural, el estado de TODOS los pedidos de hoy), dos funciones nuevas,
-- vista recreada con columna ADITIVA AL FINAL (bundles vivos leen las
-- columnas que conocen — compatible por construcción, D-662 declarado).
-- Reversa ANTES en docs/relevamientos/2026-08-17-s99a-REVERSA-reorden-
-- poner-primero.sql (declara que revertir PIERDE las marcas vivas).
-- ═══════════════════════════════════════════════════════════════════════════

-- ① LA MARCA — NULL = orden natural. Timestamp y no boolean: N pedidos
--    movidos se ordenan entre sí por CUÁNDO se movieron (el último adelante),
--    y la pieza puede decir «Movido a mano» con su hora si algún día hace
--    falta. Efímera por semántica: muere con el pedido terminal sin trigger
--    (un terminal no se ordena en ninguna cola).
ALTER TABLE public.pedidos ADD COLUMN movido_al_frente_en timestamptz;
COMMENT ON COLUMN public.pedidos.movido_al_frente_en IS
  'S99-L3: marca manual «Poner primero» del panel del vendedor. NULL = orden natural (FIFO por pago). No cruza bandas ni toca promesa — solo ordena dentro de la banda. La escriben poner_pedido_primero / volver_pedido_al_orden, nadie más.';

-- ② LAS DOS PUERTAS — mismas guardas, vocabulario VIVO de la casa
--    (pedido_no_existe · no_sos_el_vendedor; nace solo pedido_terminal).
CREATE OR REPLACE FUNCTION public.poner_pedido_primero(p_pedido_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_cuenta   uuid;
  v_terminal boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;
  SELECT p.cuenta_comercial_id, n.es_terminal
    INTO v_cuenta, v_terminal
  FROM public.pedidos p
  JOIN public.cat_estados_pedido e ON e.codigo = p.estado
  JOIN public.cat_narrativas_pedido n ON n.codigo = e.narrativa
  WHERE p.id = p_pedido_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pedido_no_existe';
  END IF;
  IF NOT public.es_vendedor_de(v_cuenta) THEN
    RAISE EXCEPTION 'no_sos_el_vendedor';
  END IF;
  -- La ventana no ofrece el comando en terminales (AUSENTE, Ley 23) — y el
  -- motor lo respalda: un pedido cerrado no se ordena en ninguna cola.
  IF v_terminal THEN
    RAISE EXCEPTION 'pedido_terminal';
  END IF;
  UPDATE public.pedidos SET movido_al_frente_en = now() WHERE id = p_pedido_id;
  RETURN jsonb_build_object('ok', true, 'movido_al_frente_en', now());
END $$;

CREATE OR REPLACE FUNCTION public.volver_pedido_al_orden(p_pedido_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_cuenta uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501';
  END IF;
  SELECT p.cuenta_comercial_id INTO v_cuenta
  FROM public.pedidos p WHERE p.id = p_pedido_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pedido_no_existe';
  END IF;
  IF NOT public.es_vendedor_de(v_cuenta) THEN
    RAISE EXCEPTION 'no_sos_el_vendedor';
  END IF;
  -- Sin guard de terminal A PROPÓSITO: quitar una marca jamás miente —
  -- volver al orden es siempre legal sobre lo propio (idempotente).
  UPDATE public.pedidos SET movido_al_frente_en = NULL WHERE id = p_pedido_id;
  RETURN jsonb_build_object('ok', true);
END $$;

-- L-140 en las dos:
REVOKE EXECUTE ON FUNCTION public.poner_pedido_primero(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.volver_pedido_al_orden(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.poner_pedido_primero(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.volver_pedido_al_orden(uuid) TO authenticated;

-- ③ LA VENTANA LEE — la marca entra a la vista, ADITIVA AL FINAL (mismo
--    patrón que pago_confirmado_en, la migración anterior).
CREATE OR REPLACE VIEW public.v_pedidos_narrativa AS
 SELECT p.id AS pedido_id,
    p.user_id,
    p.cuenta_comercial_id,
    p.numero_orden,
    p.total,
    p.moneda,
    p.metodo_entrega,
    n.codigo AS narrativa,
        CASE
            WHEN ((n.codigo = 'en_camino'::text) AND (p.metodo_entrega = 'retiro'::text)) THEN 'Listo para retirar'::text
            ELSE n.nombre
        END AS narrativa_nombre,
    n.orden AS narrativa_orden,
    n.es_terminal,
    p.promesa_entrega_desde,
    p.promesa_entrega_hasta,
    p.created_at,
    p.updated_at,
    p.entrega_fecha_objetivo,
    ( SELECT max(pi.cerrado_en) AS max
           FROM pagos_intentos pi
          WHERE ((pi.pedido_id = p.id) AND (pi.estado = 'aprobado'::text))) AS pago_confirmado_en,
    p.movido_al_frente_en
   FROM ((pedidos p
     JOIN cat_estados_pedido e ON ((e.codigo = p.estado)))
     JOIN cat_narrativas_pedido n ON ((n.codigo = e.narrativa)));

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — por BRAZO, RESET-ROLE de la casa. Muta y RESTAURA (residuo 0:
-- el estado final de la marca es NULL, idéntico al inicial de TODOS).
-- Sujetos medidos ANTES: duenodes da83d6d8 (vendedor de Despensa de
-- Pruebas) · pedido no-terminal 2a137ed7 (en_camino) · Diego 4bfafac3
-- (NO vendedor de esa cuenta).
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_r       jsonb;
  v_marca   timestamptz;
  v_pedido  uuid := '2a137ed7-8ef5-4bd8-8e78-aeecae5d4daf';
  v_term    uuid;
  v_err     text;
BEGIN
  -- Brazo ① — el vendedor pone primero: marca estampada.
  PERFORM set_config('request.jwt.claims',
    '{"sub":"da83d6d8-f090-414c-98e0-7fae644f52df","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  v_r := public.poner_pedido_primero(v_pedido);
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  SELECT movido_al_frente_en INTO v_marca FROM public.pedidos WHERE id = v_pedido;
  IF v_marca IS NULL THEN RAISE EXCEPTION 'CINTURÓN ①: la marca no se estampó'; END IF;

  -- Brazo ①b — la VISTA la expone (la ventana lee).
  PERFORM 1 FROM public.v_pedidos_narrativa
   WHERE pedido_id = v_pedido AND movido_al_frente_en IS NOT NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'CINTURÓN ①b: la vista no expone la marca'; END IF;

  -- Brazo ② — el ajeno REBOTA no_sos_el_vendedor (Diego, con sesión válida).
  BEGIN
    PERFORM set_config('request.jwt.claims',
      '{"sub":"4bfafac3-e456-4de7-9484-99e76b7301b0","role":"authenticated"}', true);
    SET LOCAL ROLE authenticated;
    v_r := public.poner_pedido_primero(v_pedido);
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    RAISE EXCEPTION 'CINTURÓN ②: el ajeno NO rebotó';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
    v_err := SQLERRM;
    IF v_err NOT LIKE 'no_sos_el_vendedor%' THEN
      RAISE EXCEPTION 'CINTURÓN ②: rebotó por otra razón — %', v_err;
    END IF;
  END;

  -- Brazo ③ — un TERMINAL rebota pedido_terminal (medido en vivo: el más
  -- reciente entregado/cancelado de la misma cuenta; si no hay, se declara).
  SELECT p.id INTO v_term
  FROM public.pedidos p
  JOIN public.cat_estados_pedido e ON e.codigo = p.estado
  JOIN public.cat_narrativas_pedido n ON n.codigo = e.narrativa
  WHERE p.cuenta_comercial_id = (SELECT cuenta_comercial_id FROM public.pedidos WHERE id = v_pedido)
    AND n.es_terminal
  ORDER BY p.created_at DESC LIMIT 1;
  IF v_term IS NULL THEN
    RAISE NOTICE 'CINTURÓN ③: SIN pedido terminal en la cuenta — brazo declarado no ejercido';
  ELSE
    BEGIN
      PERFORM set_config('request.jwt.claims',
        '{"sub":"da83d6d8-f090-414c-98e0-7fae644f52df","role":"authenticated"}', true);
      SET LOCAL ROLE authenticated;
      v_r := public.poner_pedido_primero(v_term);
      EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
      RAISE EXCEPTION 'CINTURÓN ③: el terminal NO rebotó';
    EXCEPTION WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
      v_err := SQLERRM;
      IF v_err NOT LIKE 'pedido_terminal%' THEN
        RAISE EXCEPTION 'CINTURÓN ③: rebotó por otra razón — %', v_err;
      END IF;
    END;
  END IF;

  -- Brazo ④ — volver al orden RESTAURA (y deja residuo 0 del cinturón).
  PERFORM set_config('request.jwt.claims',
    '{"sub":"da83d6d8-f090-414c-98e0-7fae644f52df","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  v_r := public.volver_pedido_al_orden(v_pedido);
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  SELECT movido_al_frente_en INTO v_marca FROM public.pedidos WHERE id = v_pedido;
  IF v_marca IS NOT NULL THEN RAISE EXCEPTION 'CINTURÓN ④: volver no limpió la marca'; END IF;

  -- Brazo ⑤ — L-140: anon NO ejecuta ninguna de las dos.
  IF has_function_privilege('anon', 'public.poner_pedido_primero(uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.volver_pedido_al_orden(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN ⑤ (L-140): anon tiene EXECUTE';
  END IF;

  -- Residuo 0, verificado global: NINGUNA marca viva queda en la tabla.
  PERFORM 1 FROM public.pedidos WHERE movido_al_frente_en IS NOT NULL;
  IF FOUND THEN RAISE EXCEPTION 'CINTURÓN residuo: quedó una marca viva'; END IF;

  RAISE NOTICE 'CINTURÓN reorden: brazos ①①b②③④⑤ verdes, residuo 0';
END $$;
