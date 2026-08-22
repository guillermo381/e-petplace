-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · LA MEMORIA DEL MEDIO DE PAGO ELEGIDO
--
-- Pedido de la mesa (22-ago-2026), sobre la medición de la pista C: `elegido`
-- vive en `useState` y **muere con la pantalla**; `user_preferencias` solo tiene
-- idioma; el carrito declara que no persiste.
--
-- 🔴 POR QUÉ ES PRECONDICIÓN Y NO UNA COMODIDAD: la firma del founder
--    (`LETRA_DEUNA` §6bis) dice **«DeUna por defecto, salvo que el cliente haya
--    elegido otro»**. **Sin memoria, la segunda mitad de esa frase es
--    inejecutable** — el default pisaría la elección en cada compra, que es
--    exactamente el «reset por compra» que la firma prohíbe.
--    *Un default que no sabe qué eligió la persona no es un default: es una
--    imposición con buenos modales.*
--
-- 📌 DECLARACIÓN 76(g) — LA VEDA: **NO RIGE.** Aditiva pura: dos columnas
--    nullable, un trigger y una función. **Cero backfill, cero UPDATE sobre
--    datos existentes** (las 4 filas de `user_preferencias` quedan intactas y
--    nacen con la preferencia en NULL, que es la verdad: nadie eligió todavía).
-- ═══════════════════════════════════════════════════════════════════════════

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ ① LA REVERSA — ESCRITA ANTES DE APLICAR                                   ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
--
-- **Qué NO deshace:** las preferencias que la gente haya guardado. Son dato de
-- ELECCIÓN del cliente y **nadie más las tiene** — al revertir, cada persona
-- vuelve a "no eligió nunca" y el default la vuelve a pisar. *No es catastrófico
-- como perder un pago, pero tampoco es gratis: es olvidarle a alguien algo que
-- nos dijo.*
--
/*  ── REVERSA (no ejecutar salvo que haya que revertir) ──────────────────────
BEGIN;
DROP FUNCTION IF EXISTS public.guardar_medio_pago_preferido(text, uuid);
DROP TRIGGER IF EXISTS trg_tarjeta_borrada_limpia_preferencia ON public.tarjetas_guardadas;
DROP FUNCTION IF EXISTS public._tarjeta_borrada_limpia_preferencia();
ALTER TABLE public.user_preferencias
  DROP CONSTRAINT IF EXISTS chk_medio_preferido_coherente,
  DROP COLUMN IF EXISTS tarjeta_preferida_id,
  DROP COLUMN IF EXISTS medio_pago_preferido;
COMMIT;
    ── FIN REVERSA ──────────────────────────────────────────────────────── */


BEGIN;

-- ── GUARD ──────────────────────────────────────────────────────────────────
DO $guard$
DECLARE v_col int;
BEGIN
  SELECT count(*) INTO v_col FROM information_schema.columns
   WHERE table_schema='public' AND table_name='user_preferencias'
     AND column_name='medio_pago_preferido';
  IF v_col > 0 THEN
    RAISE EXCEPTION 'ABORTA: la preferencia ya existe. Releer antes de tocar.';
  END IF;
END $guard$;


-- ── ①  LAS DOS COLUMNAS, y por qué son DOS ─────────────────────────────────
--
-- 🔴 **Una sola FK a `tarjetas_guardadas` NO ALCANZA, y ésa es la decisión de
--    forma de esta migración: DeUna NO es una tarjeta.** No tiene fila en
--    `tarjetas_guardadas` —no hay alta, no hay token (`LETRA_DEUNA` §1)— así que
--    una FK sola **no puede expresar «el cliente eligió DeUna»**.
--
--    *La salida fácil era guardar un texto polimórfico —`'deuna'` o el uuid como
--    string— y se descartó: un campo que a veces es un id y a veces un nombre no
--    se puede consultar, no se puede referenciar y su día malo llega cuando
--    alguien lo joinea.*
ALTER TABLE public.user_preferencias
  ADD COLUMN medio_pago_preferido text,
  ADD COLUMN tarjeta_preferida_id uuid REFERENCES public.tarjetas_guardadas(id) ON DELETE SET NULL;

-- El estado incoherente se vuelve INEXPRESABLE, en vez de vigilado:
ALTER TABLE public.user_preferencias
  ADD CONSTRAINT chk_medio_preferido_coherente CHECK (
       (medio_pago_preferido IS NULL     AND tarjeta_preferida_id IS NULL)
    OR (medio_pago_preferido = 'deuna'   AND tarjeta_preferida_id IS NULL)
    OR (medio_pago_preferido = 'tarjeta' AND tarjeta_preferida_id IS NOT NULL)
  );

COMMENT ON COLUMN public.user_preferencias.medio_pago_preferido IS
  'NULL = nunca eligió (rige el default de LETRA_DEUNA §6bis) · deuna · tarjeta. '
  'Son DOS columnas porque DeUna no es una tarjeta: no tiene fila en '
  'tarjetas_guardadas, asi que una FK sola no puede expresar esa eleccion.';

COMMENT ON COLUMN public.user_preferencias.tarjeta_preferida_id IS
  'Cual tarjeta, solo cuando medio_pago_preferido = tarjeta. El CHECK vuelve '
  'inexpresable "eligio deuna y ademas apunta a una tarjeta".';


-- ── ②  BORRAR LA TARJETA BORRA LA PREFERENCIA QUE LA NOMBRABA ──────────────
--
-- 🔴 **Sin esto, la migración NO SE PUEDE APLICAR y el defecto es sutil:** el
--    `ON DELETE SET NULL` de la FK dejaría `medio_pago_preferido='tarjeta'` con
--    `tarjeta_preferida_id` en NULL — **que el CHECK de arriba prohíbe** ⇒ **el
--    borrado de la tarjeta FALLARÍA**, y la persona no podría borrar su propia
--    tarjeta sin saber por qué.
--
--    *Un CHECK bien puesto puede volver imposible una operación legítima en otra
--    tabla, y el síntoma aparece lejos de la causa.* Por eso el trigger corre
--    **BEFORE**: limpia las dos columnas y la FK ya no tiene nada que hacer.
CREATE OR REPLACE FUNCTION public._tarjeta_borrada_limpia_preferencia()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
BEGIN
  UPDATE public.user_preferencias
     SET medio_pago_preferido = NULL,
         tarjeta_preferida_id = NULL,
         updated_at = now()
   WHERE tarjeta_preferida_id = OLD.id;
  RETURN OLD;
END $function$;

CREATE TRIGGER trg_tarjeta_borrada_limpia_preferencia
  BEFORE DELETE ON public.tarjetas_guardadas
  FOR EACH ROW EXECUTE FUNCTION public._tarjeta_borrada_limpia_preferencia();

-- **Y la consecuencia de producto, declarada:** al borrar la tarjeta preferida,
-- la persona vuelve a "no eligió" y **el default de §6bis vuelve a regir**.
-- *Es lo correcto —no podemos preferirle una tarjeta que ya no existe— pero es
-- un cambio silencioso de su elección, así que la pantalla debería decirlo si
-- alguna vez muestra la preferencia como un ajuste.*


-- ── ③  LA PUERTA ───────────────────────────────────────────────────────────
--
-- Upsert, porque `user_preferencias` puede no tener fila todavía (hoy: 4 filas
-- para toda la base). **La tarjeta se verifica del lado del servidor**: que sea
-- del que llama y que esté guardada. *Aceptar un uuid ajeno acá dejaría a
-- cualquiera apuntar su preferencia a la tarjeta de otro — no cobraría nada,
-- pero filtraría que esa tarjeta existe.*
CREATE OR REPLACE FUNCTION public.guardar_medio_pago_preferido(
  p_medio text,
  p_tarjeta_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE='42501'; END IF;

  IF p_medio IS NOT NULL AND p_medio NOT IN ('deuna','tarjeta') THEN
    RAISE EXCEPTION 'medio_invalido' USING ERRCODE='22023';
  END IF;

  IF p_medio = 'tarjeta' THEN
    IF p_tarjeta_id IS NULL THEN
      RAISE EXCEPTION 'tarjeta_requerida' USING ERRCODE='22023';
    END IF;
    PERFORM 1 FROM public.tarjetas_guardadas
      WHERE id = p_tarjeta_id AND user_id = v_uid AND estado = 'guardada';
    IF NOT FOUND THEN
      /* Misma respuesta para «no existe» y «es de otro» — si no, es un oráculo
         de tarjetas ajenas. */
      RAISE EXCEPTION 'tarjeta_no_disponible' USING ERRCODE='42501';
    END IF;
  ELSIF p_medio = 'deuna' AND p_tarjeta_id IS NOT NULL THEN
    /* No se ignora en silencio: quien manda las dos cosas cree que puede, y el
       día que el server confíe guarda una preferencia incoherente. */
    RAISE EXCEPTION 'deuna_no_lleva_tarjeta' USING ERRCODE='22023';
  END IF;

  INSERT INTO public.user_preferencias (user_id, medio_pago_preferido, tarjeta_preferida_id, updated_at)
       VALUES (v_uid, p_medio, CASE WHEN p_medio='tarjeta' THEN p_tarjeta_id ELSE NULL END, now())
  ON CONFLICT (user_id) DO UPDATE
     SET medio_pago_preferido = EXCLUDED.medio_pago_preferido,
         tarjeta_preferida_id = EXCLUDED.tarjeta_preferida_id,
         updated_at = now();

  RETURN jsonb_build_object('ok', true, 'medio', p_medio, 'tarjeta_id',
                            CASE WHEN p_medio='tarjeta' THEN p_tarjeta_id ELSE NULL END);
END $function$;

REVOKE ALL ON FUNCTION public.guardar_medio_pago_preferido(text, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.guardar_medio_pago_preferido(text, uuid) TO authenticated;

-- **El LECTOR no nace acá a propósito:** `user_pref_select_own` ya deja a cada
-- quien leer su propia fila, así que la superficie lee la tabla por el camino
-- que ya existe. *Una función de lectura nueva sería una segunda puerta a un
-- dato que ya tiene la suya.*


-- ── CINTURÓN, CON DISCRIMINADOR POR BRAZO ──────────────────────────────────
DO $cinturon$
DECLARE v_n int;
BEGIN
  -- (a) El estado incoherente es inexpresable.
  BEGIN
    UPDATE public.user_preferencias SET medio_pago_preferido='tarjeta', tarjeta_preferida_id=NULL
     WHERE user_id = (SELECT user_id FROM public.user_preferencias LIMIT 1);
    RAISE EXCEPTION 'ABORTA: el CHECK dejó pasar tarjeta sin id.';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- (b) Un medio inventado tampoco entra.
  BEGIN
    UPDATE public.user_preferencias SET medio_pago_preferido='paypal'
     WHERE user_id = (SELECT user_id FROM public.user_preferencias LIMIT 1);
    RAISE EXCEPTION 'ABORTA: el CHECK aceptó un medio que no existe.';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- (c) El trigger existe y es BEFORE DELETE — su ausencia rompe el borrado de
  --     tarjetas, que es un camino vivo.
  SELECT count(*) INTO v_n FROM pg_trigger
   WHERE tgrelid='public.tarjetas_guardadas'::regclass
     AND tgname='trg_tarjeta_borrada_limpia_preferencia';
  IF v_n <> 1 THEN RAISE EXCEPTION 'ABORTA: falta el trigger que limpia la preferencia.'; END IF;

  -- (d) Las 4 filas existentes quedaron INTACTAS y sin preferencia.
  SELECT count(*) INTO v_n FROM public.user_preferencias WHERE medio_pago_preferido IS NOT NULL;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'ABORTA: alguien nació con preferencia. Nadie eligió todavía: eso sería inventarle una elección.';
  END IF;

  RAISE NOTICE 'CINTURON VERDE — coherencia cerrada · vocabulario cerrado · trigger en pie · 0 preferencias inventadas';
END $cinturon$;

COMMIT;
