-- ═══════════════════════════════════════════════════════════════════════════
-- S101-B · EL `uid` DEL PROVEEDOR — la divergencia que el débito destapó
--
-- 🔴 EL DEFECTO, MEDIDO EN EL APARATO (20-ago): el débito rebotó con
--    `OperationNotAllowedException: uid does not match`.
--
--    La tarjeta se tokeniza con **el handle del alta** como `uid` ante el
--    proveedor (así lo diseñamos: `Payment.addCard(alta, …)`), y el cobro
--    mandaba **el id del usuario de auth**. **Divergen.**
--
--    *Y lo teníamos escrito nosotros mismos en otra puerta:* el arnés de
--    S101-A advertía exactamente esta divergencia para el `stoken`
--    —«registrar uno y mandar otro daría false por una razón que no es la
--    fórmula»—. **Es la misma, un piso más abajo**, y esta vez la nombró el
--    proveedor.
--
-- ⇒ La tarjeta guarda **con qué uid se tokenizó**, y el cobro usa ESE.
--    *El uid del proveedor no es el nuestro: es un dato del vínculo con él, y
--    por eso vive en la fila del vínculo.*
--
-- ⚠️ VEDA 76(g): **NO RIGE para el DDL** — columna aditiva nullable.
--    **SÍ hay backfill**, y se declara: se deriva de `altas_tarjeta`, la única
--    fuente que sabe con qué handle nació cada tarjeta.
-- ⚠️ REVERSA ESCRITA ANTES: `docs/relevamientos/2026-08-20-s101b-REVERSA-uid-proveedor.sql`
--    — y declara que revertir **reintroduce un defecto medido**.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.tarjetas_guardadas
  ADD COLUMN IF NOT EXISTS proveedor_uid text;

COMMENT ON COLUMN public.tarjetas_guardadas.proveedor_uid IS
  'S101-B. El uid con el que la tarjeta se tokenizó ante el proveedor (el '
  'handle del alta). EL COBRO DEBE USAR ESTE, no el id de auth: si divergen, '
  'el proveedor rebota "uid does not match" (medido, 20-ago).';

-- ── BACKFILL: derivado de las altas, jamás inventado ────────────────────────
UPDATE public.tarjetas_guardadas t
   SET proveedor_uid = a.id::text
  FROM public.altas_tarjeta a
 WHERE a.tarjeta_id = t.id
   AND t.proveedor_uid IS NULL;

-- Las tarjetas nuevas lo reciben por la función; ésta lo estampa.
CREATE OR REPLACE FUNCTION public.resolver_alta_tarjeta(
  p_alta_id        uuid,
  p_desenlace      text,
  p_token          text    DEFAULT NULL,
  p_bin            text    DEFAULT NULL,
  p_ultimos4       text    DEFAULT NULL,
  p_marca          text    DEFAULT NULL,
  p_titular        text    DEFAULT NULL,
  p_motivo         text    DEFAULT NULL,
  p_alias          text    DEFAULT NULL,
  p_stoken_valido  boolean DEFAULT NULL,
  p_stoken_detalle text    DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $fn$
DECLARE v_a public.altas_tarjeta%ROWTYPE; v_t uuid;
BEGIN
  IF p_desenlace NOT IN ('guardada','rechazada','abandonada') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'desenlace_invalido');
  END IF;

  SELECT * INTO v_a FROM public.altas_tarjeta WHERE id = p_alta_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'codigo', 'alta_no_existe'); END IF;

  IF v_a.estado <> 'pendiente' THEN
    RETURN jsonb_build_object('ok', true, 'duplicado', true,
      'estado', v_a.estado, 'tarjeta_id', v_a.tarjeta_id);
  END IF;

  IF now() > v_a.expira_en THEN
    UPDATE public.altas_tarjeta SET estado='abandonada', cerrada_en=now(), motivo='alta_vencida'
     WHERE id = p_alta_id;
    RETURN jsonb_build_object('ok', false, 'codigo', 'alta_vencida');
  END IF;

  IF p_desenlace = 'guardada' THEN
    IF p_token IS NULL OR btrim(p_token) = '' THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'token_ausente');
    END IF;

    INSERT INTO public.tarjetas_guardadas
      (user_id, proveedor, token, bin, ultimos4, marca, titular, estado, alias, proveedor_uid)
    VALUES
      (v_a.user_id, v_a.proveedor, p_token, p_bin, p_ultimos4, p_marca, p_titular,
       'guardada', NULLIF(btrim(COALESCE(p_alias,'')),''),
       -- 🔴 EL HANDLE DEL ALTA ES EL uid ANTE EL PROVEEDOR.
       v_a.id::text)
    ON CONFLICT (proveedor, token) DO UPDATE
      SET actualizada_en = now(),
          alias = COALESCE(NULLIF(btrim(COALESCE(EXCLUDED.alias,'')),''),
                           public.tarjetas_guardadas.alias),
          -- El uid NO se pisa: el token sigue atado al uid con el que nació.
          proveedor_uid = COALESCE(public.tarjetas_guardadas.proveedor_uid, EXCLUDED.proveedor_uid)
      WHERE public.tarjetas_guardadas.user_id = v_a.user_id
    RETURNING id INTO v_t;

    IF v_t IS NULL THEN
      UPDATE public.altas_tarjeta
         SET estado='rechazada', cerrada_en=now(), motivo='token_de_otro_dueno',
             stoken_valido=p_stoken_valido, stoken_detalle=p_stoken_detalle
       WHERE id = p_alta_id;
      RETURN jsonb_build_object('ok', false, 'codigo', 'token_de_otro_dueno');
    END IF;

    UPDATE public.altas_tarjeta
       SET estado='guardada', tarjeta_id=v_t, cerrada_en=now(),
           stoken_valido=p_stoken_valido, stoken_detalle=p_stoken_detalle
     WHERE id = p_alta_id;
    RETURN jsonb_build_object('ok', true, 'estado', 'guardada', 'tarjeta_id', v_t);
  END IF;

  UPDATE public.altas_tarjeta
     SET estado=p_desenlace, cerrada_en=now(),
         motivo=COALESCE(NULLIF(btrim(COALESCE(p_motivo,'')),''),
                         'sin_motivo_declarado:'||p_desenlace),
         stoken_valido=p_stoken_valido, stoken_detalle=p_stoken_detalle
   WHERE id = p_alta_id;
  RETURN jsonb_build_object('ok', true, 'estado', p_desenlace);
END;
$fn$;

REVOKE ALL ON FUNCTION public.resolver_alta_tarjeta(uuid,text,text,text,text,text,text,text,text,boolean,text)
  FROM PUBLIC, anon, authenticated;

DO $cint$
DECLARE v_sin int; v_auth boolean;
BEGIN
  SELECT count(*) INTO v_sin FROM public.tarjetas_guardadas
   WHERE estado='guardada' AND proveedor_uid IS NULL
     AND EXISTS (SELECT 1 FROM public.altas_tarjeta a WHERE a.tarjeta_id = tarjetas_guardadas.id);
  IF v_sin > 0 THEN
    RAISE EXCEPTION 'ABORTA: % tarjetas con alta conocida quedaron sin proveedor_uid', v_sin;
  END IF;

  SELECT has_function_privilege('authenticated',
    'public.resolver_alta_tarjeta(uuid,text,text,text,text,text,text,text,text,boolean,text)','EXECUTE')
    INTO v_auth;
  IF v_auth THEN RAISE EXCEPTION 'ABORTA: resolver_alta_tarjeta alcanzable por authenticated'; END IF;
END;
$cint$;

COMMIT;
