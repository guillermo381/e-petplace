-- ═══════════════════════════════════════════════════════════════════════════
-- S95-J · EL VOCABULARIO DE `tallas_aplicables` SE CIERRA
--
-- Elevado por la Pista I: `tallas_aplicables` y `momentos_aplicables` no
-- tienen CHECK, y son columnas que **deciden qué se le muestra a una mascota**.
-- Es el mismo patrón que ya se corrigió en el estado del pedido: un campo que
-- decide, con vocabulario abierto. Hoy la pantalla traduce contra los
-- diccionarios de la casa y lo que no matchea no se pinta — cura correcta del
-- lado del cliente, pero el dato entra sucio igual.
--
-- ── SE CIERRA UNA DE LAS DOS, Y LA OTRA SE ELEVA ──────────────────────────
--
-- ✅ `tallas_aplicables`: el vocabulario es INEQUÍVOCO y está declarado en la
--    casa desde hace tiempo — `mascotas_talla_check` dice
--    `talla IS NULL OR talla = ANY (ARRAY['S','M','L'])`, y los datos vivos lo
--    confirman (2 L · 4 M · 2 S · 64 sin declarar). El wrapper de grooming usa
--    exactamente esos tres. **No se inventó nada: se copió el CHECK que ya
--    rige sobre la mascota.**
--
-- 🔴 `momentos_aplicables`: **FRENADO Y ELEVADO.** Medido: hay DOS
--    vocabularios vivos y **no son dos versiones del mismo, son dos EJES
--    distintos** —
--      · `calcular_etapa_vida()` devuelve
--        `cachorro | joven | adulto | senior | desconocida` — **puramente
--        etario**, y es lo que la superficie del cliente usa hoy.
--      · `cat_especies_perfil.momentos_vitales_jsonb` modela **M1…M6**, y dos
--        de sus momentos NO dependen de la edad: `M4_disparador =
--        condicion_cronica` y `M6_disparador = fin_vida_marcado`.
--    Un producto que declare `['senior']` y otro que declare `['M5']` no son
--    comparables, y elegir uno por mi cuenta dejaría el otro fuera del
--    catálogo para siempre. *El brief pedía frenar exactamente acá.*
--
-- Reversa (escrita ANTES): scripts/s95/2026-08-12-s95j-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- **NO RIGE.** `productos` tiene CERO filas (medido), así que el CHECK no
-- puede chocar con dato existente y no hay backfill. **Y eso es justamente lo
-- que hace barato cerrarlo hoy:** con el catálogo cargado, el mismo CHECK
-- sería una migración con limpieza de datos atrás.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.productos
  ADD CONSTRAINT chk_productos_tallas_aplicables
  CHECK (tallas_aplicables <@ ARRAY['S','M','L']::text[]);

COMMENT ON COLUMN public.productos.tallas_aplicables IS
  'S95-J · Vocabulario CERRADO contra el mismo que rige en `mascotas.talla` '
  '(S/M/L). Array VACÍO = «aplica a cualquier talla», que es distinto de '
  '«no aplica a ninguna»: por eso el CHECK usa `<@` (contenido en) y no exige '
  'que tenga elementos. La recomendación excluye por lo que el producto '
  'DECLARA, así que un vocabulario abierto acá deja entrar una talla que '
  'nunca va a matchear y el producto queda invisible sin que nadie sepa por qué.';

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN · el valor inválido rebota, el válido pasa, el vacío sigue vivo
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v_ok boolean; v_prod uuid; v_n int; v_antes int;
BEGIN
  SELECT count(*) INTO v_antes FROM productos;

  -- ── A · una talla que no existe REBOTA ───────────────────────────────────
  v_ok := true;
  BEGIN
    INSERT INTO productos (nombre, familia_codigo, estado, tallas_aplicables)
    VALUES ('__cint_s95j_malo', 'alimento', 'activo', ARRAY['XL']::text[]);
  EXCEPTION WHEN check_violation THEN v_ok := false; END;
  IF v_ok THEN
    RAISE EXCEPTION 'ABORTA: entró un producto con talla «XL» — el CHECK no cerró nada.';
  END IF;

  -- ── A2 · y una mezcla de válida + inválida TAMBIÉN rebota ────────────────
  -- Sin este caso, un CHECK mal escrito con `&&` (se solapa) daría verde
  -- aceptando ['M','XL'], que es justo el error silencioso que importa.
  v_ok := true;
  BEGIN
    INSERT INTO productos (nombre, familia_codigo, estado, tallas_aplicables)
    VALUES ('__cint_s95j_mixto', 'alimento', 'activo', ARRAY['M','XL']::text[]);
  EXCEPTION WHEN check_violation THEN v_ok := false; END;
  IF v_ok THEN
    RAISE EXCEPTION 'ABORTA: entró [M, XL] — el CHECK acepta mezclas y deja pasar basura.';
  END IF;

  -- ── B · CONTRA-CASO: las tres válidas SÍ entran ──────────────────────────
  INSERT INTO productos (nombre, familia_codigo, estado, tallas_aplicables)
  VALUES ('__cint_s95j_bueno', 'alimento', 'activo', ARRAY['S','M','L']::text[])
  RETURNING id INTO v_prod;
  IF v_prod IS NULL THEN RAISE EXCEPTION 'ABORTA: se cerró de más — las tallas válidas no entran.'; END IF;
  DELETE FROM productos WHERE id = v_prod;

  -- ── C · CONTRA-CASO: el array VACÍO sigue siendo legal ───────────────────
  -- Es el default y significa «aplica a cualquier talla». Si el CHECK lo
  -- rechazara, todo producto que no declare talla dejaría de poder cargarse.
  INSERT INTO productos (nombre, familia_codigo, estado)
  VALUES ('__cint_s95j_vacio', 'alimento', 'activo')
  RETURNING id INTO v_prod;
  IF v_prod IS NULL THEN RAISE EXCEPTION 'ABORTA: un producto sin tallas declaradas no entra.'; END IF;
  DELETE FROM productos WHERE id = v_prod;

  -- ── D · el vocabulario NO se inventó: es el de `mascotas.talla` ──────────
  -- Si algún día alguien cambia el CHECK de la mascota y no éste, los dos
  -- dejan de decir lo mismo y la recomendación empieza a fallar en silencio.
  SELECT count(*) INTO v_n FROM pg_constraint
   WHERE conrelid='public.mascotas'::regclass AND conname='mascotas_talla_check'
     AND pg_get_constraintdef(oid) LIKE '%''S''%'
     AND pg_get_constraintdef(oid) LIKE '%''M''%'
     AND pg_get_constraintdef(oid) LIKE '%''L''%';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'ABORTA: `mascotas.talla` ya no declara S/M/L — el vocabulario del producto quedaría divergente del de la mascota.';
  END IF;

  SELECT count(*) INTO v_n FROM productos;
  IF v_n <> v_antes THEN
    RAISE EXCEPTION 'ABORTA 76(g): productos quedó en % y arrancó en %.', v_n, v_antes;
  END IF;

  RAISE NOTICE 'CINTURÓN S95-J: talla inválida rebota, mezcla rebota, las tres válidas pasan, el vacío sigue legal. Residuo 0.';
END $$;

COMMIT;
