-- S114-A · PAGO MIXTO ④ · REEMBOLSO PER-SOURCE — cada parte vuelve de donde salió.
--
-- Firma del founder (① de las tres): reembolso PER-SOURCE, a prorrata de
-- saldo_aplicado/compra.total; el parcial también se reparte proporcional.
-- Cuando un caso de postventa sobre un PEDIDO se resuelve con devolución y su
-- compra se pagó mixta, la parte que salió del SALDO vuelve al saldo del hogar
-- (acreditar_saldo_hogar, idempotente por clave del caso); la parte del RIEL la
-- cubre el camino existente (aplicar_reembolso reversa el ledger; el reintegro a
-- la tarjeta es declarado, §7.16). El ledger (comisión/payout) NO cambia: reversa
-- proporcional al monto devuelto, independiente de cómo se pagó.
--
-- 76(g) NO RIGE (DB, sin anclas de OTA). Reversa ANTES en
-- docs/relevamientos/2026-09-08-s114a-REVERSA-20260911980000-reembolso-per-source.sql

CREATE OR REPLACE FUNCTION public.caso_resolver(p_caso_id uuid, p_alcance text, p_monto numeric DEFAULT NULL::numeric, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_yo uuid := auth.uid(); v_c record; v_evento uuid; v_camino text;
  v_inverso uuid; v_mov jsonb; v_actor text;
BEGIN
  IF v_yo IS NULL THEN RETURN jsonb_build_object('ok',false,'codigo','sin_sesion'); END IF;
  SELECT * INTO v_c FROM casos_postventa WHERE id = p_caso_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'codigo','caso_no_existe'); END IF;

  IF is_admin() THEN v_actor := 'casa';
  ELSIF v_c.prestador_id IS NOT NULL AND es_mi_prestador(v_c.prestador_id) THEN v_actor := 'prestador';
  ELSE RETURN jsonb_build_object('ok',false,'codigo','no_podes_resolver');
  END IF;

  IF p_alcance NOT IN ('total','parcial','sin_devolucion') THEN
    RETURN jsonb_build_object('ok',false,'codigo','alcance_invalido');
  END IF;
  IF p_alcance = 'parcial' AND (p_monto IS NULL OR p_monto <= 0) THEN
    RETURN jsonb_build_object('ok',false,'codigo','monto_requerido_en_parcial');
  END IF;


  -- 🔴 GUARD TEMPRANO (S114-A ③ · hallazgo de F): la etapa se verifica ANTES de
  -- tocar la plata. Sin esto, la casa calculaba todo el reembolso (aplicar_reembolso,
  -- que ya movió plata) y RECIÉN fallaba en _caso_mover con un código que no dice
  -- «primero toma el caso». La casa resuelve desde con_casa; el prestador (entre
  -- partes) desde con_prestador. Sin voz: la UI mapea el código (patrón de la casa).
  IF v_actor = 'casa' AND v_c.etapa <> 'con_casa' THEN
    RETURN jsonb_build_object('ok',false,'codigo','caso_no_tomado');
  END IF;
  IF v_actor = 'prestador' AND v_c.etapa <> 'con_prestador' THEN
    RETURN jsonb_build_object('ok',false,'codigo','etapa_incorrecta');
  END IF;

  -- 🔴🔴 LA PREGUNTA DE §6, AL OBJETO Y NO A LA CLASE.
  v_evento := _caso_tiene_devengo(v_c.objeto_tipo, v_c.objeto_id);

  IF p_alcance = 'sin_devolucion' THEN
    v_camino := NULL;
  ELSIF v_evento IS NOT NULL THEN
    -- TIENE DEVENGO ⇒ evento inverso. F4: la comisión se devuelve también —
    -- `aplicar_reembolso` ya reversa `monto_plataforma` proporcionalmente, así
    -- que la firma NO pide fórmula nueva: pide que la letra diga lo que el
    -- código hace, y que esto lo use en vez de escribir la suya.
    v_inverso := aplicar_reembolso(v_evento,
                   COALESCE(p_motivo, 'caso de postventa ' || p_caso_id::text),
                   v_yo,
                   CASE WHEN p_alcance = 'parcial' THEN p_monto ELSE NULL END);
    v_camino := 'aplicar_reembolso';
  ELSE
    -- SIN DEVENGO ⇒ se declara sobre el pago (7.14/7.16). `aplicar_reembolso`
    -- no se toca: no hay nada que reversar en el ledger.
    v_camino := 'declarado_sobre_pago';
  END IF;

  UPDATE casos_postventa
     SET resolucion_alcance = p_alcance,
         monto_devuelto = CASE WHEN p_alcance='sin_devolucion' THEN 0 ELSE p_monto END,
         camino = v_camino, evento_reembolso_id = v_inverso,
         decidido_por = v_yo, resuelto_en = now(), actualizado_en = now()
   WHERE id = p_caso_id;

  -- ═══ 🔴 REEMBOLSO PER-SOURCE (S114-A · firma del founder) ═══════════════════
  -- Si el objeto es un PEDIDO cuya COMPRA se pagó mixta (saldo_aplicado > 0), la
  -- devolución se reparte a prorrata: cada parte vuelve de donde salió. El saldo
  -- vuelve al hogar (acreditar_saldo_hogar); el resto lo cubre el riel por el
  -- camino de arriba (aplicar_reembolso reversa el ledger; el reintegro a la
  -- tarjeta es declarado, §7.16). El PARCIAL se reparte con el mismo factor.
  IF p_alcance <> 'sin_devolucion' AND v_c.objeto_tipo = 'pedido' THEN
    DECLARE
      v_ped record; v_cmp record; v_fam2 uuid; v_r numeric; v_saldo_parte numeric; v_ac jsonb;
    BEGIN
      SELECT p.total AS total, p.compra_id AS compra_id INTO v_ped
        FROM pedidos p WHERE p.id = v_c.objeto_id;
      IF v_ped.compra_id IS NOT NULL THEN
        SELECT c.total AS total, c.saldo_aplicado AS saldo_aplicado, c.user_id AS user_id
          INTO v_cmp FROM compras c WHERE c.id = v_ped.compra_id;
        IF COALESCE(v_cmp.saldo_aplicado,0) > 0 AND COALESCE(v_cmp.total,0) > 0 THEN
          -- monto devuelto de ESTE pedido: total del pedido (total) o el parcial pedido.
          v_r := CASE WHEN p_alcance = 'parcial' THEN p_monto ELSE v_ped.total END;
          v_saldo_parte := ROUND(v_r * v_cmp.saldo_aplicado / v_cmp.total, 2);
          IF v_saldo_parte > 0 THEN
            v_fam2 := _familia_del_user(v_cmp.user_id);
            IF v_fam2 IS NOT NULL THEN
              v_ac := acreditar_saldo_hogar(v_fam2, v_saldo_parte, 'caso',
                        'caso:' || p_caso_id::text || ':saldo_devuelto', p_caso_id);
              -- idempotente: si ya se acreditó (ya_acreditado), no vuelve a sumar.
            END IF;
          END IF;
        END IF;
      END IF;
    END;
  END IF;

  v_mov := _caso_mover(p_caso_id,
             CASE WHEN v_actor='prestador' THEN 'resuelto_entre_partes' ELSE 'resuelto' END,
             v_actor, v_yo, p_motivo);
  IF (v_mov->>'ok')::boolean IS NOT TRUE THEN RETURN v_mov; END IF;

  INSERT INTO caso_mensajes (caso_id, autor, autor_user_id, tipo, cuerpo)
  VALUES (p_caso_id, CASE WHEN v_actor='casa' THEN 'casa' ELSE 'prestador' END, v_yo, 'hecho',
          CASE WHEN p_alcance='sin_devolucion' THEN 'Se resolvió el caso.'
               ELSE 'Se resolvió: hay una devolución para ti.' END);

  RETURN jsonb_build_object('ok', true, 'camino', v_camino,
    'evento_reembolso_id', v_inverso, 'tenia_devengo', (v_evento IS NOT NULL),
    'etapa', (SELECT etapa FROM casos_postventa WHERE id = p_caso_id));
END $function$;

REVOKE ALL ON FUNCTION public.caso_resolver(uuid,text,numeric,text) FROM anon, PUBLIC;

-- ── CINTURÓN · el reparto está en el cuerpo y la prorrata da lo esperado ─────
-- (caso_resolver exige sesión admin/prestador ⇒ su E2E vive en una medición en
--  vivo con JWT real. Acá: el bloque per-source existe, y la fórmula de prorrata
--  da los números firmados.)
DO $cinturon$
DECLARE
  v_def text; v_saldo_total numeric; v_saldo_parcial numeric;
BEGIN
  v_def := pg_get_functiondef('public.caso_resolver(uuid,text,numeric,text)'::regprocedure);
  IF v_def NOT ILIKE '%saldo_devuelto%' OR v_def NOT ILIKE '%acreditar_saldo_hogar%' THEN
    RAISE EXCEPTION 'CINTURÓN: el brazo per-source no está en caso_resolver';
  END IF;

  -- prorrata: pedido 20 sobre compra 20 con saldo 13 ⇒ 13.00 vuelve a saldo
  v_saldo_total := ROUND(20 * 13 / 20.0, 2);
  IF v_saldo_total <> 13.00 THEN RAISE EXCEPTION 'CINTURÓN: prorrata total mal: %', v_saldo_total; END IF;
  -- parcial de 10 sobre compra 20 con saldo 13 ⇒ 6.50
  v_saldo_parcial := ROUND(10 * 13 / 20.0, 2);
  IF v_saldo_parcial <> 6.50 THEN RAISE EXCEPTION 'CINTURÓN: prorrata parcial mal: %', v_saldo_parcial; END IF;

  RAISE NOTICE 'CINTURÓN VERDE · per-source en el cuerpo · prorrata total=13.00 parcial=6.50';
END $cinturon$;
