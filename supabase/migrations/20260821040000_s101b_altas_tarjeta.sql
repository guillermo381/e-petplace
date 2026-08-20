-- ═══════════════════════════════════════════════════════════════════════════
-- S101-B · LAS ALTAS DE TARJETA — la fila que vuelve medible a `abandonada`
--
-- Firma de mesa (19-ago): el handle del alta es el `id` de una fila propia,
-- emitida SERVER-SIDE con el usuario del auth y un TTL corto.
--
-- 🔴 POR QUÉ UNA TABLA Y NO UN TOKEN SIN ESTADO:
--    `abandonada` es **un alta que venció sin desenlace**. Sin fila no hay
--    vencimiento, y sin vencimiento el estado no se puede medir: habría que
--    deducirlo del retorno del navegador, que confunde TRES cosas distintas
--    —que la familia cerró la ventana, que el navegador falló, y que el alta
--    de verdad venció—. **Solo la fila que expiró es un hecho.**
--    *La casa persiste todo, incluso lo rechazado.*
--
-- ⚠️ VEDA 76(g): **NO RIGE.** DDL aditivo puro, sin backfill, sin anclas.
--    Ninguna fila existente se toca.
--
-- ⚠️ REVERSA ESCRITA ANTES:
--    `docs/relevamientos/2026-08-19-s101b-REVERSA-altas-tarjeta.sql`
--
-- 🔴 EXPIRACIÓN PEREZOSA, no cron. Precedente de la casa (el hold de S54, el
--    vencido de S69): **la corrección la da la lectura**, el cron es higiene.
--    Un alta vencida es vencida aunque nadie haya pasado a marcarla.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.altas_tarjeta (
  -- 🔴 ESTE `id` ES EL HANDLE. Viaja en la URL de la página y **es el mismo
  --    valor que se usa como `uid` ante el proveedor** — el que entra al
  --    `stoken`. Si divergieran, el stoken daría `false` por una razón que no
  --    es la fórmula, y se quemaría la observación diagnosticando otra cosa.
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  proveedor       text NOT NULL DEFAULT 'nuvei'
                    CHECK (proveedor IN ('nuvei','deuna')),

  -- `pendiente` es el estado inicial y el único que puede vencer.
  estado          text NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','guardada','rechazada','abandonada')),

  -- A qué tarjeta dio lugar, cuando dio lugar a una.
  tarjeta_id      uuid REFERENCES public.tarjetas_guardadas(id) ON DELETE SET NULL,

  -- 🔴 JAMÁS NULL en un desenlace que no sea `guardada` (L-316: un rechazo sin
  --    motivo obliga a abrir el crudo, y nadie abre el crudo cuando hay una
  --    explicación plausible a mano).
  motivo          text,

  -- La verificación del `stoken` del proveedor, con su procedencia — mismo
  -- patrón que el buzón de S101-A: el `false` tiene que poder distinguir
  -- «la fórmula está mal» de «lo leí del lugar equivocado».
  stoken_valido   boolean,
  stoken_detalle  text,

  creada_en       timestamptz NOT NULL DEFAULT now(),
  expira_en       timestamptz NOT NULL,
  cerrada_en      timestamptz,

  -- Un alta cerrada tiene fecha de cierre; una pendiente no la tiene.
  -- *Sin esto, un alta muerta es indistinguible de una en vuelo para
  --  cualquiera que mire la tabla* (defecto que S101-A ya pagó una vez).
  CONSTRAINT chk_alta_cierre_coherente CHECK (
    (estado = 'pendiente' AND cerrada_en IS NULL)
    OR (estado <> 'pendiente' AND cerrada_en IS NOT NULL)
  ),
  CONSTRAINT chk_alta_ttl CHECK (expira_en > creada_en)
);

COMMENT ON TABLE public.altas_tarjeta IS
  'S101-B. Altas de tarjeta en curso. El id ES el handle que porta la página '
  'del Add Card y el uid ante el proveedor. JAMÁS guarda PAN, CVC ni '
  'vencimiento — para eso no hay columna y no debe haberla nunca.';

COMMENT ON COLUMN public.altas_tarjeta.expira_en IS
  'TTL corto. Un alta vencida sin desenlace ES `abandonada`, y la lectura lo '
  'deriva sola: la expiración es PEREZOSA, el cron sería higiene.';

CREATE INDEX IF NOT EXISTS idx_altas_tarjeta_user
  ON public.altas_tarjeta (user_id, creada_en DESC);

CREATE INDEX IF NOT EXISTS idx_altas_tarjeta_pendientes
  ON public.altas_tarjeta (expira_en)
  WHERE estado = 'pendiente';

-- ── RLS ────────────────────────────────────────────────────────────────────
-- La persona ve SUS altas y nada más. **Cero policies de escritura**, igual
-- que `tarjetas_guardadas`: si el cliente pudiera escribir, podría declararse
-- dueño de un alta ajena o marcarse una `guardada` que nunca ocurrió.
ALTER TABLE public.altas_tarjeta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS altas_select_propias ON public.altas_tarjeta;
CREATE POLICY altas_select_propias ON public.altas_tarjeta
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON public.altas_tarjeta FROM anon, authenticated;
GRANT SELECT ON public.altas_tarjeta TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ① EMITIR EL HANDLE — la única puerta por la que nace un alta.
--    DEFINER porque escribe una tabla sin policy de INSERT a propósito.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.crear_alta_tarjeta(
  p_proveedor text DEFAULT 'nuvei'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id  uuid;
  v_exp timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_sesion');
  END IF;

  IF p_proveedor NOT IN ('nuvei','deuna') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'proveedor_invalido');
  END IF;

  -- 🔴 TTL de 15 minutos: el mismo número que el hold de la agenda (S54).
  --    No es una constante nueva — es la ventana que la casa ya considera
  --    razonable para que una persona termine un trámite en una pantalla.
  v_exp := now() + interval '15 minutes';

  INSERT INTO public.altas_tarjeta (user_id, proveedor, expira_en)
  VALUES (v_uid, p_proveedor, v_exp)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', true, 'alta_id', v_id, 'expira_en', v_exp
  );
END;
$$;

REVOKE ALL ON FUNCTION public.crear_alta_tarjeta(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_alta_tarjeta(text) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ② LEER EL ALTA — y es acá donde `abandonada` se DERIVA.
--    La fila puede seguir diciendo `pendiente`: si venció, la lectura dice
--    `abandonada`. **La expiración es perezosa por diseño.**
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.obtener_alta_tarjeta(p_alta_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_a   public.altas_tarjeta%ROWTYPE;
  v_est text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_sesion');
  END IF;

  SELECT * INTO v_a FROM public.altas_tarjeta
   WHERE id = p_alta_id AND user_id = v_uid;

  IF NOT FOUND THEN
    -- Misma respuesta para «no existe» y «es de otro»: distinguirlas
    -- convertiría esta función en un oráculo de handles ajenos.
    RETURN jsonb_build_object('ok', false, 'codigo', 'alta_no_existe');
  END IF;

  v_est := v_a.estado;
  IF v_est = 'pendiente' AND now() > v_a.expira_en THEN
    v_est := 'abandonada';     -- 🔴 derivado, no escrito
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'alta_id', v_a.id,
    'estado', v_est,
    'vencida', (v_a.estado = 'pendiente' AND now() > v_a.expira_en),
    'motivo', v_a.motivo,
    'tarjeta_id', v_a.tarjeta_id,
    'expira_en', v_a.expira_en
  );
END;
$$;

REVOKE ALL ON FUNCTION public.obtener_alta_tarjeta(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_alta_tarjeta(uuid) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ③ CERRAR EL ALTA — SOLO service_role. Es el camino del servidor, jamás de
--    una sesión de persona: si viviera en `authenticated`, cualquiera con la
--    anon key podría declararse dueño de un token de tarjeta.
--    (Mismo criterio que `confirmar_pago_pedido`, D-764.)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.resolver_alta_tarjeta(
  p_alta_id        uuid,
  p_desenlace      text,
  p_token          text    DEFAULT NULL,
  p_bin            text    DEFAULT NULL,
  p_ultimos4       text    DEFAULT NULL,
  p_marca          text    DEFAULT NULL,
  p_titular        text    DEFAULT NULL,
  -- 🔴 El motivo tiene parámetro PROPIO. La primera versión de esta función
  --    lo tomaba de `p_titular` —un defecto mío, cazado antes de aplicar—:
  --    habría escrito el nombre del titular en la columna que explica por qué
  --    se rechazó un alta. *Verosímil y falso: la fila se veía completa.*
  p_motivo         text    DEFAULT NULL,
  p_stoken_valido  boolean DEFAULT NULL,
  p_stoken_detalle text    DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_a  public.altas_tarjeta%ROWTYPE;
  v_t  uuid;
BEGIN
  IF p_desenlace NOT IN ('guardada','rechazada','abandonada') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'desenlace_invalido');
  END IF;

  SELECT * INTO v_a FROM public.altas_tarjeta WHERE id = p_alta_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'alta_no_existe');
  END IF;

  -- IDEMPOTENCIA: cerrar dos veces deja el mismo resultado y no duplica
  -- tarjetas. El segundo intento lo dice, no lo esconde.
  IF v_a.estado <> 'pendiente' THEN
    RETURN jsonb_build_object(
      'ok', true, 'duplicado', true,
      'estado', v_a.estado, 'tarjeta_id', v_a.tarjeta_id);
  END IF;

  -- 🔴 UN ALTA VENCIDA NO SE PUEDE COMPLETAR. Si el navegador llega tarde con
  --    un token bueno, se cierra como `abandonada` y **la tarjeta no nace**.
  --    *El TTL no es decorativo: es el que vuelve medible a `abandonada`.*
  IF now() > v_a.expira_en THEN
    UPDATE public.altas_tarjeta
       SET estado = 'abandonada', cerrada_en = now(), motivo = 'alta_vencida'
     WHERE id = p_alta_id;
    RETURN jsonb_build_object('ok', false, 'codigo', 'alta_vencida');
  END IF;

  IF p_desenlace = 'guardada' THEN
    IF p_token IS NULL OR btrim(p_token) = '' THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'token_ausente');
    END IF;

    -- La tarjeta nace por la ÚNICA puerta, con el dueño del alta.
    INSERT INTO public.tarjetas_guardadas
      (user_id, proveedor, token, bin, ultimos4, marca, titular, estado)
    VALUES
      (v_a.user_id, v_a.proveedor, p_token, p_bin, p_ultimos4, p_marca,
       p_titular, 'guardada')
    ON CONFLICT (proveedor, token) DO UPDATE
      -- El mismo token re-presentado por su MISMO dueño no es un alta nueva.
      -- Si fuera de otro dueño, el UNIQUE hace que esto no pueda pasar en
      -- silencio: la fila existente manda y el WHERE lo deja sin efecto.
      SET actualizada_en = now()
      WHERE public.tarjetas_guardadas.user_id = v_a.user_id
    RETURNING id INTO v_t;

    IF v_t IS NULL THEN
      -- El token ya pertenece a OTRA persona. No se toca nada.
      UPDATE public.altas_tarjeta
         SET estado = 'rechazada', cerrada_en = now(),
             motivo = 'token_de_otro_dueno',
             stoken_valido = p_stoken_valido, stoken_detalle = p_stoken_detalle
       WHERE id = p_alta_id;
      RETURN jsonb_build_object('ok', false, 'codigo', 'token_de_otro_dueno');
    END IF;

    UPDATE public.altas_tarjeta
       SET estado = 'guardada', tarjeta_id = v_t, cerrada_en = now(),
           stoken_valido = p_stoken_valido, stoken_detalle = p_stoken_detalle
     WHERE id = p_alta_id;

    RETURN jsonb_build_object('ok', true, 'estado', 'guardada', 'tarjeta_id', v_t);
  END IF;

  -- rechazada | abandonada — 🔴 el motivo JAMÁS queda NULL (L-316: un rechazo
  -- sin motivo obliga a abrir el crudo, y nadie lo abre cuando hay una
  -- explicación plausible a mano). Si el llamador no lo dijo, se deriva del
  -- propio desenlace en vez de dejar el hueco.
  UPDATE public.altas_tarjeta
     SET estado = p_desenlace, cerrada_en = now(),
         motivo = COALESCE(NULLIF(btrim(COALESCE(p_motivo, '')), ''),
                           'sin_motivo_declarado:' || p_desenlace),
         stoken_valido = p_stoken_valido, stoken_detalle = p_stoken_detalle
   WHERE id = p_alta_id;

  RETURN jsonb_build_object('ok', true, 'estado', p_desenlace);
END;
$$;

REVOKE ALL ON FUNCTION public.resolver_alta_tarjeta(uuid, text, text, text, text, text, text, text, boolean, text)
  FROM PUBLIC, anon, authenticated;

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
-- Aborta si la tabla quedara sin RLS, con policy de escritura, o si el cierre
-- del alta quedara alcanzable desde una sesión de persona.
DO $cinturon$
DECLARE
  v_rls  boolean;
  v_esc  int;
  v_auth boolean;
BEGIN
  SELECT relrowsecurity INTO v_rls
    FROM pg_class WHERE oid = 'public.altas_tarjeta'::regclass;
  IF NOT v_rls THEN
    RAISE EXCEPTION 'ABORTA: altas_tarjeta sin RLS';
  END IF;

  SELECT count(*) INTO v_esc FROM pg_policies
   WHERE schemaname='public' AND tablename='altas_tarjeta'
     AND cmd IN ('INSERT','UPDATE','DELETE','ALL');
  IF v_esc > 0 THEN
    RAISE EXCEPTION 'ABORTA: altas_tarjeta tiene % policy(s) de escritura', v_esc;
  END IF;

  SELECT has_function_privilege('authenticated',
    'public.resolver_alta_tarjeta(uuid, text, text, text, text, text, text, text, boolean, text)', 'EXECUTE')
    INTO v_auth;
  IF v_auth THEN
    RAISE EXCEPTION 'ABORTA: resolver_alta_tarjeta alcanzable por authenticated';
  END IF;

  -- 🔴 El día que alguien agregue una columna de PAN/CVC acá, e-PetPlace pasa
  --    a ser PCI y ningún typecheck lo va a decir.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='altas_tarjeta'
       AND column_name ~* '(pan|cvc|cvv|numero_tarjeta|expiry|vencimiento)'
  ) THEN
    RAISE EXCEPTION 'ABORTA: altas_tarjeta tiene una columna de datos de tarjeta';
  END IF;
END;
$cinturon$;

COMMIT;
