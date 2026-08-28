-- ═══════════════════════════════════════════════════════════════════════════
-- S107 · LA VERDAD VENCIDA DEL REVERSO — el sujeto SI se mueve
--
-- Firma del founder: 27-ago-2026.
-- Reversa escrita ANTES:
--   docs/relevamientos/S107-CERT-REVERSA-20260827210000-verdad-vencida.sql
-- 76(g): **NO RIGE** — DDL pura, sin backfill, sin anclas, cero filas tocadas.
--
-- 🔴 EL DEFECTO, medido en vivo DOS veces el 27-ago (DF-2106074 compra y
--    DF-2106081 cita): la MISMA respuesta se contradecia a si misma. El bloque
--    `registro` afirmaba que el sujeto seguia quieto y el nivel de arriba de la
--    edge decia que se habia movido — y el de arriba tenia razon: la compra
--    quedo `cancelada`, el pedido `cancelado_sistema`, y en la cita ademas se
--    libero el horario y salio el aviso al prestador.
--
--    La constante fue cierta el dia que se escribio y quedo FALSA el dia que
--    nacio el trigger `trg_pagos_intentos_reverso_mueve_sujeto`, que mueve el
--    sujeto exactamente cuando estas funciones ponen el estado en `reversado`.
--
--    > *No hay typecheck para una verdad vencida: una constante que afirma sobre
--    > el mundo se vuelve falsa cuando el mundo cambia, y no lo avisa.*
--
--    Su costo no era cosmetico: mandaba a soporte a mover a mano algo que el
--    motor ya habia movido.
--
-- 🔑 LA CURA NO ES OTRA CONSTANTE: es una LECTURA. Adopta el criterio que YA
--    rige en las dos edges (`pagos-reverso/index.ts:254` ·
--    `pagos-reverso-deuna/index.ts:233`), que derivan el veredicto de la
--    ausencia del marcador `sujeto_no_movido` que el trigger escribe al fallar.
--    *No se inventa un segundo criterio: se adopta el vigente, para que el dia
--    que uno se corrija no queden dos.*
--
-- ⚠️ ALCANCE: nadie consume `registro.sujeto_movido` — medido por grep en
--    `supabase/functions`, `packages` y `apps`. Su unico lector es un humano
--    leyendo el JSON, que es exactamente a quien enganaba.
--
-- 🔴 DOS NOTAS DE METODO, las dos cobradas al escribir esta migracion:
--    1. **L-170**: la primera version citaba la frase vieja VERBATIM en el
--       comentario, y el cinturon —que busca esa frase— la encontro y abortó.
--       *Un censo por texto lee el comentario que explica por que algo ya no
--       rige como si todavia rigiera.* Por eso aca la letra vieja se DESCRIBE.
--    2. **`pg_get_functiondef` NO devuelve el punto y coma final**: dos
--       definiciones concatenadas dan SQL invalido, y el error aparece recien
--       al aplicar. Cada cuerpo lleva su `;` explicito.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.registrar_reverso_nuvei(p_intento_id uuid, p_reverso_id text, p_status_detail text, p_refund_amount numeric, p_auth_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_i        pagos_intentos;
  v_ahora    timestamptz := now();
  v_local    timestamp;
  v_hallazgo text;
BEGIN
  SELECT * INTO v_i FROM pagos_intentos WHERE id = p_intento_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'intento_no_existe');
  END IF;

  IF v_i.proveedor <> 'nuvei' THEN
    /* 🔴 Fail-closed por PROVEEDOR. Esta función habla el vocabulario de
       Nuvei; aplicarla a un intento de DeUna guardaría un `status_detail`
       que en ese riel significa otra cosa. *Los dos rieles ya se cruzaron
       dos veces en esta mesa; acá el cruce es inexpresable.* */
    RETURN jsonb_build_object('ok', false, 'codigo', 'proveedor_no_es_nuvei',
                              'proveedor', v_i.proveedor);
  END IF;

  -- ② IDEMPOTENCIA antes que nada: un reintento no es un segundo reverso.
  IF v_i.estado = 'reversado' THEN
    RETURN jsonb_build_object('ok', true, 'codigo', 'ya_reversado',
                              'reverso_id', v_i.proveedor_reverso_id);
  END IF;

  IF v_i.estado <> 'aprobado' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'intento_no_aprobado',
                              'estado', v_i.estado);
  END IF;

  -- ① LA VENTANA, contra `cerrado_en` y en hora de Guayaquil.
  IF v_i.cerrado_en IS NULL THEN
    /* Sin fecha de cobro no se puede afirmar que estamos dentro de la ventana.
       *Y no se asume que sí: asumir acá es pedir un refund que el proveedor va
       a rechazar, con un registro nuestro diciendo que lo pedimos bien.* */
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_fecha_de_cobro');
  END IF;

  v_local := v_ahora AT TIME ZONE 'America/Guayaquil';
  IF (v_i.cerrado_en AT TIME ZONE 'America/Guayaquil')::date <> v_local::date THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'fuera_de_ventana_otro_dia',
      'cobrado', (v_i.cerrado_en AT TIME ZONE 'America/Guayaquil')::date,
      'hoy', v_local::date);
  END IF;

  IF v_local::time >= TIME '17:00' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'fuera_de_ventana_corte',
      'hora_local', to_char(v_local, 'HH24:MI'));
  END IF;

  /* ③ EL HALLAZGO DICE LA VERDAD DEL PROVEEDOR, no la nuestra.
     `7` = total (lo esperado) · `34` = PARCIAL. **Nunca pedimos parcial**
     —la edge no manda `order.amount`— pero el código existe en su doc y puede
     llegar. *Un estado del proveedor que no esperábamos no se descarta: se
     registra con nombre, porque es plata que se movió distinto de lo pedido.* */
  v_hallazgo := CASE
    WHEN p_status_detail = '34' THEN 'reverso_fallido'  -- parcial ⇒ a soporte
    ELSE 'reversado_mismo_dia'
  END;

  UPDATE pagos_intentos
     SET estado = 'reversado',
         proveedor_reverso_id = p_reverso_id,
         /* 🔴 El auth del refund NO pisa el del cobro: son dos hechos y el del
            cobro es la evidencia de que se cobró. Va al crudo. */
         payload_crudo = coalesce(payload_crudo, '{}'::jsonb) || jsonb_build_object(
           'reverso', jsonb_build_object(
             'status_detail', p_status_detail,
             'refund_amount', p_refund_amount,
             'authorization_code', p_auth_code,
             'en', v_ahora)),
         hallazgo = v_hallazgo,
         hallazgo_en = v_ahora,
         actualizado_en = v_ahora
   WHERE id = p_intento_id;

  RETURN jsonb_build_object(
    'ok', true, 'codigo', 'reversado',
    'hallazgo', v_hallazgo,
    'parcial_inesperado', (p_status_detail = '34'),
    /* 🔴 SE LEE, NO SE AFIRMA. Aca habia una constante en `false`, con un
       comentario que mandaba avisarle al llamador que el circuito quedaba a
       medias y una nota que mandaba mover el sujeto a mano — las dos apoyadas
       en `D-923`. **`D-923` esta cerrada**: el trigger mueve el sujeto en el
       mismo acto que el UPDATE de arriba. Se deriva del marcador que el propio
       trigger escribe cuando falla, que es el mismo criterio que usa la edge. */
    'sujeto_movido', NOT coalesce(
      (SELECT payload_crudo ? 'sujeto_no_movido' FROM pagos_intentos WHERE id = p_intento_id),
      false),
    'nota', 'el sujeto lo mueve trg_pagos_intentos_reverso_mueve_sujeto (D-923 cerrada)');
END $function$;

CREATE OR REPLACE FUNCTION public.registrar_reverso_deuna(p_intento_id uuid, p_reverso_id text, p_monto numeric, p_estado_info text, p_crudo jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_i     pagos_intentos;
  v_ahora timestamptz := now();
  v_horas numeric;
BEGIN
  SELECT * INTO v_i FROM pagos_intentos WHERE id = p_intento_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'intento_no_existe');
  END IF;

  IF v_i.proveedor <> 'deuna' THEN
    /* Fail-closed por riel, igual que su hermana y por la misma razón: los dos
       vocabularios se cruzaron dos veces en esta mesa. Acá es inexpresable. */
    RETURN jsonb_build_object('ok', false, 'codigo', 'proveedor_no_es_deuna',
                              'proveedor', v_i.proveedor);
  END IF;

  IF v_i.estado = 'reversado' THEN
    RETURN jsonb_build_object('ok', true, 'codigo', 'ya_reversado',
                              'reverso_id', v_i.proveedor_reverso_id);
  END IF;

  IF v_i.estado <> 'aprobado' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'intento_no_aprobado',
                              'estado', v_i.estado);
  END IF;

  /* ③ 🔴 LAS DOS CONDICIONES, Y NINGUNA ALCANZA SOLA.
     Sin `transactionReverseId` lo que hubo fue una cancelación de QR; sin
     `REVERSED` en `payment/info` no hay confirmación del proveedor de que la
     plata volvió. *Un `status: true` no entra en esta decisión ni de paso.* */
  IF p_reverso_id IS NULL OR btrim(p_reverso_id) = '' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_transaction_reverse_id',
      'nota', 'sin ese id lo que ocurrio fue una cancelacion de QR, no un reverso');
  END IF;

  IF upper(coalesce(p_estado_info,'')) <> 'REVERSED' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'info_no_confirma_reverso',
      'estado_info', p_estado_info,
      'nota', 'el proveedor no confirmo REVERSED: no se marca de nuestro lado');
  END IF;

  /* ① LA VENTANA: 24 HORAS desde el cobro. NO «mismo día», que es Nuvei. */
  IF v_i.cerrado_en IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_fecha_de_cobro');
  END IF;

  v_horas := extract(epoch FROM (v_ahora - v_i.cerrado_en)) / 3600.0;
  IF v_horas > 24 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'fuera_de_ventana_24h',
      'horas_desde_el_cobro', round(v_horas, 2),
      'nota', 'la ventana de DeUna son 24 horas; pasado eso es gestion manual');
  END IF;

  UPDATE pagos_intentos
     SET estado = 'reversado',
         /* ② acá esta columna GUARDA ALGO NUEVO, a diferencia de Nuvei. */
         proveedor_reverso_id = p_reverso_id,
         payload_crudo = coalesce(payload_crudo, '{}'::jsonb) || jsonb_build_object(
           'reverso', jsonb_build_object(
             'transaction_reverse_id', p_reverso_id,
             'monto', p_monto,
             'estado_info', p_estado_info,
             'crudo', p_crudo,
             'en', v_ahora)),
         hallazgo = 'reversado_mismo_dia',   -- vocabulario cerrado por CHECK
         hallazgo_en = v_ahora,
         actualizado_en = v_ahora
   WHERE id = p_intento_id;

  RETURN jsonb_build_object(
    'ok', true, 'codigo', 'reversado',
    'reverso_id', p_reverso_id,
    'horas_desde_el_cobro', round(v_horas, 2),
    /* 🔴 SE LEE, NO SE AFIRMA. Aca habia una constante en `false`, con un
       comentario que mandaba avisarle al llamador que el circuito quedaba a
       medias y una nota que mandaba mover el sujeto a mano — las dos apoyadas
       en `D-923`. **`D-923` esta cerrada**: el trigger mueve el sujeto en el
       mismo acto que el UPDATE de arriba. Se deriva del marcador que el propio
       trigger escribe cuando falla, que es el mismo criterio que usa la edge. */
    'sujeto_movido', NOT coalesce(
      (SELECT payload_crudo ? 'sujeto_no_movido' FROM pagos_intentos WHERE id = p_intento_id),
      false),
    'nota', 'el sujeto lo mueve trg_pagos_intentos_reverso_mueve_sujeto (D-923 cerrada)');
END $function$;

-- ── CINTURON: se verifica contra la definicion VIVA, jamas contra este archivo ──
DO $cinturon$
DECLARE v_mal int; v_ok int;
BEGIN
  SELECT count(*) INTO v_mal
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname IN ('registrar_reverso_nuvei','registrar_reverso_deuna')
     AND pg_get_functiondef(p.oid) LIKE '%no se mueve%';
  IF v_mal > 0 THEN
    RAISE EXCEPTION 'CINTURON: % funcion(es) siguen con la verdad vencida', v_mal;
  END IF;

  SELECT count(*) INTO v_ok
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname IN ('registrar_reverso_nuvei','registrar_reverso_deuna')
     AND pg_get_functiondef(p.oid) LIKE '%sujeto_no_movido%';
  IF v_ok <> 2 THEN
    RAISE EXCEPTION 'CINTURON: solo % de 2 derivan el sujeto del marcador', v_ok;
  END IF;

  RAISE NOTICE 'CINTURON VERDE: 2/2 derivan del marcador, 0 afirman de mas';
END $cinturon$;
