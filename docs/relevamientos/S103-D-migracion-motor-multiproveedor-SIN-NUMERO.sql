-- ═══════════════════════════════════════════════════════════════════════════
-- S103-D · CONTRATO D→A · EL MOTOR VE UN **PROVEEDOR**, NO A NUVEI
--          **SIN NÚMERO · SIN APLICAR** — la numera y deposita A (L-331)
--
-- Cubre los hallazgos 3, 4, 5 y 6 del censo (bitácora S103-D §3):
--   3. `aplicar_evento_de_pago` autentica por `credencial=SERVER` — concepto
--      de Nuvei. Un evento DeUna se IGNORA en silencio (L-318 con un proveedor
--      en lugar de un sujeto).
--   4. `p_proveedor => 'nuvei'` literal dentro del actuador.
--   5. `_pago_aprobado` es Nuvei-only por vocabulario.
--   6. El barrido sólo mira compras, sin proveedor y sin ventana de 7 días.
--
-- 🔴 POR QUÉ AHORA SÍ SE PUEDE ESCRIBIR, cuando la tanda 0 dijo que no:
--    porque `LETRA_DEUNA` §7 ordena que **el webhook jamás transicione solo** y
--    que la verdad la dé la **consulta activa**. El actuador se alimenta del
--    payload de `payment/info` — **y ése quedó MEDIDO contra QA** (§2quater),
--    aun con el `pointOfSale` bloqueado.
--    *Lo que sigue sin medir es el payload del WEBHOOK, y por diseño ese no
--     decide nada: es una señal que dispara una consulta.*
--
-- 🔴 76(g) — VEDA: **NO RIGE.** Sin backfill, sin anclas a filas vivas.
--    Reemplaza cuerpos de función; no toca una sola fila de datos.
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- N1 · `_pago_aprobado` GANA EL VOCABULARIO DE DEUNA
--
-- Hoy (medido, cuerpo vivo): mira `transaction.status IN ('1','success')` y
-- `transaction.current_status = 'APPROVED'` — la forma de Nuvei.
-- DeUna contesta plano: `{"status":"APPROVED", ...}`.
--
-- 🔴 SE AGREGA UNA RAMA, NO SE REESCRIBE LA VIEJA. La de Nuvei queda
--    byte-idéntica: hoy cobra plata real y su comportamiento no puede moverse
--    ni un signo por una migración que viene a habilitar otro riel.
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public._pago_aprobado(p_crudo jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $function$
  SELECT
    -- ── NUVEI: intacto, tal cual estaba ──────────────────────────────────
    (
      ( lower(coalesce(p_crudo->'transaction'->>'status','')) IN ('1','success')
        OR upper(coalesce(p_crudo->'transaction'->>'current_status','')) = 'APPROVED' )
      AND upper(coalesce(p_crudo->'transaction'->>'current_status','APPROVED'))
          NOT IN ('CANCELLED','REJECTED','FAILURE','EXPIRED')
    )
    -- ── DEUNA: status plano en la raíz, medido en payment/info ───────────
    -- 🔴 `APPROVED` Y NADA MÁS. `PENDING` no confirma, y `REVERSED` /
    --    `REVERSED_FAILED` menos todavía. *Ante señales que se contradicen no
    --    se confirma: un cobro confirmado de más es plata que hay que ir a
    --    devolver.* (misma ley que la rama de arriba)
    OR (
      upper(coalesce(p_crudo->>'status','')) = 'APPROVED'
      -- 🔴 EL CANDADO DEL FANTASMA — §2quater. Una consulta por algo que NO
      --    EXISTE devuelve HTTP 200 con status PENDING y `amount: 0`. Si
      --    alguna vez el proveedor devolviera APPROVED con amount 0, sería un
      --    registro vacío y no un cobro. **Nunca se confirma con monto cero.**
      AND coalesce((p_crudo->>'amount')::numeric, 0) > 0
    );
$function$;

COMMENT ON FUNCTION public._pago_aprobado(jsonb) IS
  'Dos vocabularios: Nuvei (transaction.status/current_status) y DeUna (status plano + amount>0). La rama DeUna exige monto porque una consulta a algo inexistente devuelve 200/PENDING/amount 0 — S103-D §2quater.';

-- ── CINTURÓN N1: los dos vocabularios, y los dos contra-casos ──────────────
DO $$
BEGIN
  -- Nuvei sigue exactamente igual (regresión)
  IF NOT _pago_aprobado('{"transaction":{"status":"success"}}'::jsonb)
    THEN RAISE EXCEPTION 'N1: se rompio Nuvei success'; END IF;
  IF _pago_aprobado('{"transaction":{"status":"success","current_status":"REJECTED"}}'::jsonb)
    THEN RAISE EXCEPTION 'N1: Nuvei confirma con current_status REJECTED'; END IF;

  -- DeUna aprueba
  IF NOT _pago_aprobado('{"status":"APPROVED","amount":12.50}'::jsonb)
    THEN RAISE EXCEPTION 'N1: DeUna APPROVED no confirma'; END IF;

  -- 🔴 CONTRA-CASOS: lo que NO debe confirmar
  IF _pago_aprobado('{"status":"PENDING","amount":12.50}'::jsonb)
    THEN RAISE EXCEPTION 'N1: DeUna confirma un PENDING'; END IF;
  IF _pago_aprobado('{"status":"APPROVED","amount":0}'::jsonb)
    THEN RAISE EXCEPTION 'N1: DeUna confirma con amount 0 — el fantasma paso'; END IF;
  IF _pago_aprobado('{"status":"REVERSED","amount":12.50}'::jsonb)
    THEN RAISE EXCEPTION 'N1: DeUna confirma un REVERSED'; END IF;
  IF _pago_aprobado('{}'::jsonb)
    THEN RAISE EXCEPTION 'N1: confirma un payload vacio'; END IF;

  RAISE NOTICE 'cinturon N1 OK: dos vocabularios, cuatro contra-casos, Nuvei sin regresion';
END $$;

-- ── REVERSA N1 (escrita ANTES) ─────────────────────────────────────────────
--   ⚠️ QUÉ NO DESHACE: si ya hubo cobros DeUna confirmados, revertir **no los
--   desconfirma** — deja el motor sin poder reconocer los siguientes.
-- CREATE OR REPLACE FUNCTION public._pago_aprobado(p_crudo jsonb)
-- RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
--   SELECT
--     ( lower(coalesce(p_crudo->'transaction'->>'status','')) IN ('1','success')
--       OR upper(coalesce(p_crudo->'transaction'->>'current_status','')) = 'APPROVED' )
--     AND upper(coalesce(p_crudo->'transaction'->>'current_status','APPROVED'))
--         NOT IN ('CANCELLED','REJECTED','FAILURE','EXPIRED');
-- $$;


-- ───────────────────────────────────────────────────────────────────────────
-- N2 · EL ACTUADOR DEJA DE HABLAR SÓLO NUVEI
--
-- 🔴 EL DEFECTO CENTRAL, y es exactamente `L-318`: la puerta autentica con
--    `detalle NOT ILIKE '%credencial=SERVER%'`, que es el stoken de Nuvei.
--    **DeUna no tiene stoken.** Su defensa son dos capas distintas (§7):
--      ① secreto propio en header, validado en el buzón;
--      ② consulta activa obligatoria — sólo la respuesta VERIFICADA alimenta.
--    Sin esta migración, un evento DeUna sale por `evento_no_autenticado_o_no_server`
--    y **la compra/cita se queda quieta, sin error, sin log y sin síntoma.**
--
-- La cura no relaja la puerta: **la hace por proveedor**, y para DeUna exige
-- una marca que SÓLO el buzón puede poner después de verificar contra el API.
-- ───────────────────────────────────────────────────────────────────────────

-- El vocabulario de `webhook_events.resultado` gana el estado del reverso.
ALTER TABLE public.webhook_events DROP CONSTRAINT IF EXISTS webhook_events_resultado_check;
ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_resultado_check
  CHECK (resultado IN ('recibido','aplicado','duplicado','stoken_invalido',
                       'monto_no_coincide','desconocido','ilegible',
                       -- nuevos, DeUna:
                       'secreto_invalido',        -- ① falló el header propio
                       'no_verificado',           -- ② la consulta activa no confirmó
                       'reversado','reverso_fallido'));

-- 🔴 EL PREDICADO DE AUTENTICIDAD, POR PROVEEDOR Y EN UN SOLO LUGAR.
--    *Duplicar esta decisión entre el actuador y el buzón es garantizar que
--     algún día digan cosas distintas.*
CREATE OR REPLACE FUNCTION public._evento_autenticado(p_evento webhook_events)
RETURNS boolean LANGUAGE sql STABLE
SET search_path TO 'public','pg_temp' AS $function$
  SELECT CASE p_evento.proveedor
    -- NUVEI: intacto. stoken válido Y credencial SERVER (la CLIENT es pública
    -- por diseño — la sirve nuestra propia página de pago).
    WHEN 'nuvei' THEN
      coalesce(p_evento.stoken_valido, false)
      AND p_evento.detalle ILIKE '%credencial=SERVER%'
    -- DEUNA: no hay stoken. `stoken_valido` guarda el veredicto del SECRETO
    -- PROPIO del header, y la marca `verificado=si` **sólo la escribe el buzón
    -- después de que `payment/info` confirmó** (§7 capa ②).
    -- 🔴 Las dos condiciones, jamás una: un webhook con el secreto correcto y
    --    datos falsos muere en la consulta.
    WHEN 'deuna' THEN
      coalesce(p_evento.stoken_valido, false)
      AND p_evento.detalle ILIKE '%verificado=si%'
    -- 🔴 FAIL-CLOSED: un proveedor que nadie enseñó NO se autentica.
    --    *Es la lección L-318 escrita como default: lo desconocido no pasa,
    --     en vez de pasar en silencio.*
    ELSE false
  END;
$function$;

REVOKE ALL ON FUNCTION public._evento_autenticado(webhook_events) FROM anon, authenticated, PUBLIC;

-- ── CINTURÓN N2 ────────────────────────────────────────────────────────────
DO $$
DECLARE e webhook_events;
BEGIN
  e.proveedor:='nuvei'; e.stoken_valido:=true; e.detalle:='receta=… · credencial=SERVER · autenticado=true';
  IF NOT _evento_autenticado(e) THEN RAISE EXCEPTION 'N2: regresion Nuvei SERVER'; END IF;
  e.detalle:='credencial=CLIENT';
  IF _evento_autenticado(e) THEN RAISE EXCEPTION 'N2: Nuvei acepto CLIENT'; END IF;

  e.proveedor:='deuna'; e.stoken_valido:=true; e.detalle:='secreto=ok · verificado=si';
  IF NOT _evento_autenticado(e) THEN RAISE EXCEPTION 'N2: DeUna verificado no pasa'; END IF;
  -- 🔴 las dos capas son AND, no OR
  e.detalle:='secreto=ok · verificado=no';
  IF _evento_autenticado(e) THEN RAISE EXCEPTION 'N2: DeUna paso SIN consulta activa'; END IF;
  e.stoken_valido:=false; e.detalle:='secreto=ok · verificado=si';
  IF _evento_autenticado(e) THEN RAISE EXCEPTION 'N2: DeUna paso con secreto invalido'; END IF;

  -- fail-closed del desconocido
  e.proveedor:='inventado'; e.stoken_valido:=true; e.detalle:='verificado=si · credencial=SERVER';
  IF _evento_autenticado(e) THEN RAISE EXCEPTION 'N2: un proveedor desconocido se autentico'; END IF;

  RAISE NOTICE 'cinturon N2 OK: Nuvei sin regresion, DeUna exige sus DOS capas, lo desconocido no pasa';
END $$;


-- ── EL ACTUADOR, con los tres puntos de Nuvei sacados ──────────────────────
-- 🔴 A: esta función es larga y su cuerpo vivo tiene comentarios que valen.
--    **Se entrega el DIFF conceptual, no un cuerpo reescrito de memoria**, para
--    que el depósito no pierda una línea de lo que S101 dejó escrito.
--    Tres cambios y nada más:
--
--  (1) LA PUERTA — reemplazar el bloque literal:
--        IF COALESCE(v_e.stoken_valido,false) IS NOT TRUE
--           OR v_e.detalle NOT ILIKE '%credencial=SERVER%' THEN
--      por:
--        IF NOT _evento_autenticado(v_e) THEN
--      (mismo RETURN, mismo motivo `evento_no_autenticado_o_no_server`)
--
--  (2) EL SUJETO — `dev_reference` es de Nuvei. DeUna trae la referencia corta:
--        v_ref := COALESCE(
--          NULLIF(v_e.payload->'transaction'->>'dev_reference','')::uuid,   -- nuvei
--          (SELECT COALESCE(i.compra_id, i.cita_id) FROM pagos_intentos i    -- deuna
--             WHERE i.referencia_corta =
--                   NULLIF(v_e.payload->>'internalTransactionReference',''))
--        );
--      🔴 SE RESUELVE POR TABLA, JAMÁS PARSEANDO EL STRING — LETRA_DEUNA §4.
--
--  (3) EL PROVEEDOR — hoy `p_proveedor => 'nuvei'` está LITERAL en la llamada
--      a `confirmar_pago_compra`. Pasa a `p_proveedor => v_e.proveedor`.
--      *Un literal que nombra a un proveedor dentro de un motor que ya tiene
--       eje `proveedor` es la misma clase de defecto que el `compra_id` para
--       una cita: el dato del camino viejo colándose en el nuevo.*


-- ───────────────────────────────────────────────────────────────────────────
-- N3 · EL BARRIDO VE PROVEEDOR, SUJETO Y LA VENTANA DE 7 DÍAS
--
-- Hoy: `JOIN compras` y nada más — ni citas, ni proveedor, ni ventana.
-- (Que no vea CITAS es un hueco que ya existe para Nuvei; se cura de paso y
--  se declara, porque arreglar sólo la mitad DeUna dejaría el otro medio ciego.)
--
-- 🔴 LA VENTANA DE 7 DÍAS ES DE DEUNA Y NO ES COSMÉTICA: pasado ese plazo el
--    proveedor deja de saber de la transacción. Y como `NOT_FOUND` **no se
--    emite** (§2quater), nada nos avisaría: seguiríamos consultando un
--    `PENDING` eterno. **El corte lo ponemos nosotros, por reloj.**
-- ───────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.pagos_pendientes_de_conciliar(integer);

CREATE OR REPLACE FUNCTION public.pagos_pendientes_de_conciliar(
  p_minutos_de_gracia integer DEFAULT 10,
  p_proveedor text DEFAULT NULL          -- NULL = todos
)
RETURNS TABLE(
  intento_id uuid, proveedor text, sujeto text, sujeto_id uuid,
  transaction_id text, referencia_corta text, monto numeric,
  creado_en timestamptz, fuera_de_ventana boolean
)
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $function$
  -- COMPRAS que intentaron pagar y no llegaron a `pagada`.
  SELECT i.id, i.proveedor, 'compra', c.id,
         i.proveedor_transaction_id, i.referencia_corta, c.total, i.creado_en,
         -- 🔴 LA VENTANA: DeUna deja de responder pasados 7 días. Se marca en
         --    vez de excluirse — *un huérfano que desaparece de la lista deja
         --    de ser un problema visible sin haber dejado de ser un problema.*
         (i.proveedor = 'deuna' AND i.creado_en < now() - interval '7 days')
    FROM compras c
    JOIN pagos_intentos i ON i.compra_id = c.id
   WHERE c.estado IN ('creada','esperando_pago')
     AND i.estado IN ('iniciado','pendiente')
     AND (p_proveedor IS NULL OR i.proveedor = p_proveedor)
     -- Nuvei necesita el id del proveedor para poder preguntar; DeUna puede
     -- consultarse por NUESTRA referencia (`idType "1"`), así que le alcanza
     -- con cualquiera de las dos.
     AND (i.proveedor_transaction_id IS NOT NULL OR i.referencia_corta IS NOT NULL)
     AND i.creado_en < now() - make_interval(mins => p_minutos_de_gracia)

  UNION ALL

  -- CITAS — el hueco que ya existía para Nuvei, curado de paso y declarado.
  SELECT i.id, i.proveedor, 'cita', ec.id,
         i.proveedor_transaction_id, i.referencia_corta, cd.total, i.creado_en,
         (i.proveedor = 'deuna' AND i.creado_en < now() - interval '7 days')
    FROM evento_cita_servicio ec
    JOIN pagos_intentos i ON i.cita_id = ec.id
    LEFT JOIN cita_desglose cd ON cd.cita_id = ec.id
   WHERE ec.estado_reserva <> 'pagada'
     AND i.estado IN ('iniciado','pendiente')
     AND (p_proveedor IS NULL OR i.proveedor = p_proveedor)
     AND (i.proveedor_transaction_id IS NOT NULL OR i.referencia_corta IS NOT NULL)
     AND i.creado_en < make_interval(mins => -p_minutos_de_gracia) + now()

  ORDER BY 8;
$function$;

REVOKE ALL ON FUNCTION public.pagos_pendientes_de_conciliar(integer,text) FROM anon, authenticated, PUBLIC;

COMMENT ON FUNCTION public.pagos_pendientes_de_conciliar(integer,text) IS
  'Intentos sin confirmar, de los DOS sujetos y de cualquier proveedor. `fuera_de_ventana` marca los DeUna de más de 7 días: pasado ese plazo el proveedor ya no responde y, como NOT_FOUND no se emite, nada avisaria solo — S103-D §2quater.';

-- ⚠️ **A: LA FIRMA CAMBIA** (agrega `p_proveedor`, y el RETURNS TABLE es otro).
--    `pagos-conciliar` la llama hoy. **El DROP + CREATE va en la MISMA
--    transacción que el redeploy de esa función, o queda una ventana con el
--    barrido roto.** Precedente: el orden cron→deploy de D-713 en S92-BIS.

-- ── REVERSA N3 ─────────────────────────────────────────────────────────────
--   ⚠️ QUÉ NO DESHACE: vuelve a dejar las CITAS sin barrido (hueco previo) y
--   los intentos DeUna sin ventana. No pierde datos; pierde vigilancia.
-- DROP FUNCTION IF EXISTS public.pagos_pendientes_de_conciliar(integer,text);
-- CREATE OR REPLACE FUNCTION public.pagos_pendientes_de_conciliar(p_minutos_de_gracia integer DEFAULT 10)
-- RETURNS TABLE(compra_id uuid, transaction_id text, monto numeric, creado_en timestamptz)
-- LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $$
--   SELECT DISTINCT c.id, i.proveedor_transaction_id, c.total, i.creado_en
--     FROM compras c JOIN pagos_intentos i ON i.compra_id = c.id
--    WHERE c.estado IN ('creada','esperando_pago')
--      AND i.proveedor_transaction_id IS NOT NULL
--      AND i.creado_en < now() - make_interval(mins => p_minutos_de_gracia)
--    ORDER BY i.creado_en;
-- $$;


-- ───────────────────────────────────────────────────────────────────────────
-- N4 · EL HALLAZGO CON NOMBRE — `huerfano_deuna_vencido`
--
-- `LETRA_DEUNA` §3.5 lo pide por nombre. Nace como DATO, no como string suelto
-- en el código (precedente: 46 transiciones como dato en S95).
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.pagos_intentos
  ADD COLUMN IF NOT EXISTS hallazgo text,
  ADD COLUMN IF NOT EXISTS hallazgo_en timestamptz;

ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_hallazgo_vocabulario
    CHECK (hallazgo IS NULL OR hallazgo IN (
      'confirmado_tardio',        -- llegó por consulta activa, no por webhook
      'reversado_mismo_dia',      -- huérfano detectado y reversado a tiempo
      'huerfano_escalado',        -- Nuvei: pasó el corte de lote
      'huerfano_deuna_vencido',   -- DeUna: >7 días, el proveedor ya no responde
      'monto_no_coincide',
      'reverso_fallido'           -- REVERSED_FAILED: 🔴 jamás se resuelve solo
    ));

ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_hallazgo_con_fecha
    CHECK ((hallazgo IS NULL) = (hallazgo_en IS NULL));

COMMENT ON COLUMN public.pagos_intentos.hallazgo IS
  'Resolución del barrido, vocabulario cerrado (LETRA_MOTOR_PAGOS §6 y LETRA_DEUNA §3.5). huerfano_deuna_vencido: pasados 7 dias DeUna deja de responder y NOT_FOUND nunca se emite — el corte lo pone nuestro reloj.';

-- ── REVERSA N4 ─────────────────────────────────────────────────────────────
--   ⚠️ QUÉ NO DESHACE: se pierden los hallazgos ya registrados — que son
--   justamente la traza de los casos que alguien tuvo que ir a resolver a mano.
-- ALTER TABLE public.pagos_intentos
--   DROP CONSTRAINT IF EXISTS chk_hallazgo_con_fecha,
--   DROP CONSTRAINT IF EXISTS chk_hallazgo_vocabulario,
--   DROP COLUMN IF EXISTS hallazgo_en, DROP COLUMN IF EXISTS hallazgo;
