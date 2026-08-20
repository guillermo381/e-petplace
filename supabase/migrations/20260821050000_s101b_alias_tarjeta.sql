-- ═══════════════════════════════════════════════════════════════════════════
-- S101-B · EL ALIAS DE LA TARJETA — «Visa de Kari»
--
-- Firma del founder, 20-ago-2026: **la familia puede nombrar su tarjeta al
-- guardarla.**
--
-- 🔴 TRES REGLAS QUE LA MIGRACIÓN HACE CUMPLIR, no que confía en que se
--    cumplan:
--    ① **Opcional siempre.** `NULL` es un estado normal, no un pendiente.
--       *Una tarjeta sin nombre es perfectamente usable; exigirlo sería
--       inventar un requisito que nadie pidió.*
--    ② **Es DATO DEL CLIENTE: se guarda tal cual y JAMÁS se usa para lógica.**
--       No decide, no agrupa, no enruta, no se compara. *El día que algo
--       ramifique por el alias, el texto que una persona escribió para
--       reconocer su tarjeta pasa a ser una llave — y las llaves no se
--       tipean a mano.*
--    ③ **Largo acotado por CHECK.** Un campo de texto libre sin techo en una
--       tabla de medios de pago es una puerta para meter cualquier cosa.
--
-- ⚠️ VEDA 76(g): **NO RIGE.** Columna aditiva NULLABLE, sin backfill.
-- ⚠️ REVERSA ESCRITA ANTES:
--    `docs/relevamientos/2026-08-20-s101b-REVERSA-alias-tarjeta.sql`
--    — y declara que **borra texto que las familias escribieron y no se puede
--    reconstruir.**
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.tarjetas_guardadas
  ADD COLUMN IF NOT EXISTS alias text
    CHECK (alias IS NULL OR (btrim(alias) <> '' AND length(alias) <= 40));

COMMENT ON COLUMN public.tarjetas_guardadas.alias IS
  'S101-B. Nombre que la familia le dio a su tarjeta («Visa de Kari»). '
  'OPCIONAL. Dato del cliente: se guarda tal cual y JAMÁS se usa para lógica.';

-- La función gana `p_alias`. **La firma vieja se DROPea explícitamente**: sin
-- eso quedarían dos sobrecargas y PostgREST elegiría por su cuenta (L-119).
DROP FUNCTION IF EXISTS public.resolver_alta_tarjeta(uuid, text, text, text, text, text, text, text, boolean, text);

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
  -- 🔴 EL ALIAS ES DATO DEL CLIENTE (firma del founder, 20-ago). Se guarda tal
  --    cual, **jamás se usa para lógica**: no decide, no agrupa, no busca.
  --    Opcional siempre — una tarjeta sin nombre es una tarjeta perfectamente
  --    usable, y exigirlo sería inventar un requisito que nadie pidió.
  p_alias          text    DEFAULT NULL,
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
      (user_id, proveedor, token, bin, ultimos4, marca, titular, estado, alias)
    VALUES
      (v_a.user_id, v_a.proveedor, p_token, p_bin, p_ultimos4, p_marca,
       p_titular, 'guardada',
       -- Vacío y NULL son lo mismo acá: «no le puso nombre».
       NULLIF(btrim(COALESCE(p_alias, '')), ''))
    ON CONFLICT (proveedor, token) DO UPDATE
      -- El mismo token re-presentado por su MISMO dueño no es un alta nueva.
      -- Si fuera de otro dueño, el UNIQUE hace que esto no pueda pasar en
      -- silencio: la fila existente manda y el WHERE lo deja sin efecto.
      SET actualizada_en = now(),
          -- Re-presentar la misma tarjeta con un nombre nuevo lo actualiza;
          -- sin nombre, **no borra el que ya tenía**.
          alias = COALESCE(NULLIF(btrim(COALESCE(EXCLUDED.alias, '')), ''),
                           public.tarjetas_guardadas.alias)
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

REVOKE ALL ON FUNCTION public.resolver_alta_tarjeta(uuid, text, text, text, text, text, text, text, text, boolean, text)
  FROM PUBLIC, anon, authenticated;

DO $cinturon$
DECLARE v_sobrecargas int; v_auth boolean;
BEGIN
  -- ① Una sola sobrecarga: dos firmas vivas serían PostgREST eligiendo.
  SELECT count(*) INTO v_sobrecargas FROM pg_proc
   WHERE proname = 'resolver_alta_tarjeta'
     AND pronamespace = 'public'::regnamespace;
  IF v_sobrecargas <> 1 THEN
    RAISE EXCEPTION 'ABORTA: % sobrecargas de resolver_alta_tarjeta (debe ser 1)', v_sobrecargas;
  END IF;

  -- ② Sigue siendo camino de servidor.
  SELECT has_function_privilege('authenticated',
    'public.resolver_alta_tarjeta(uuid, text, text, text, text, text, text, text, text, boolean, text)',
    'EXECUTE') INTO v_auth;
  IF v_auth THEN
    RAISE EXCEPTION 'ABORTA: resolver_alta_tarjeta alcanzable por authenticated';
  END IF;

  -- ③ 🔴 El alias no puede volverse obligatorio por descuido.
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='tarjetas_guardadas'
                AND column_name='alias' AND is_nullable='NO') THEN
    RAISE EXCEPTION 'ABORTA: alias quedo NOT NULL — es opcional por firma';
  END IF;
END;
$cinturon$;

COMMIT;
