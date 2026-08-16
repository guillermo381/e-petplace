-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · LA PUERTA NO SE HABÍA ENTERADO DE LA COMPETENCIA — enmienda propia
--
-- 🔴 EL HALLAZGO, Y ES MÍO: `20260818000000` movió el UNIQUE de
-- `(variante)` a `(cuenta_comercial_id, variante)` —la opción (b) que el
-- founder firmó para que dos vendedores puedan ofrecer el mismo producto—
-- **y NO tocó el gate que `publicar_oferta_sku` tiene EN SU CUERPO**, que
-- seguía rechazando cualquier segunda oferta publicada de la variante.
--
-- ⇒ **La competencia estaba firmada, el índice movido, y la puerta seguía
-- diciendo que no.** No lo vio ningún typecheck ni ningún cinturón: el mío
-- probó que el ÍNDICE dejaba insertar, que es exactamente lo que medía. *Un
-- cinturón prueba lo que apunta, y yo apunté al índice cuando la decisión
-- vivía en dos lugares.* Apareció recién al intentar sembrar el segundo
-- vendedor — **caminar otra vez encontró lo que medir no.**
--
-- Y el detalle que lo vuelve peor y más fácil de encontrar a la vez: el
-- comentario del gate **nombraba `uq_oferta_publicada_por_variante`**, el
-- índice que esa misma migración había borrado. *Una premisa escrita en un
-- comentario no se entera de que dejó de ser cierta (la ley de esta sesión,
-- cobrándose en mi propio territorio).*
--
-- 🔴 Y EL SEGUNDO DEFECTO, QUE ES PEOR QUE EL GATE: `SELECT … INTO v_previa
-- FROM ofertas WHERE variante_id = … AND estado='publicada'` **deja de tener
-- una sola fila el día que hay competencia** — con dos vendedores publicados,
-- `INTO` se queda con UNA CUALQUIERA. Hoy no rompía porque el gate viejo hacía
-- imposible el caso; al abrir la competencia, la consulta habría empezado a
-- mentir en silencio. **Se acota por cuenta, que es lo que siempre quiso decir.**
--
-- 76(g): NO RIGE. Reversa: restaurar el cuerpo previo (vive en el git de
-- `20260812…` y en el diff de este commit); ⚠️ revertir vuelve a prohibir la
-- competencia que el founder firmó, con el índice ya movido ⇒ quedarían índice
-- y puerta contradiciéndose otra vez, pero al revés.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE v_def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname='public' AND p.proname='publicar_oferta_sku';

  -- ① El gate: se acota a la MISMA cuenta.
  v_def := replace(v_def,
    'SELECT * INTO v_previa FROM ofertas
   WHERE variante_id = v_sku.variante_id AND estado = ''publicada'' FOR UPDATE;',
    'SELECT * INTO v_previa FROM ofertas
   WHERE variante_id = v_sku.variante_id
     AND cuenta_comercial_id = v_sku.cuenta_comercial_id
     AND estado = ''publicada'' FOR UPDATE;');

  -- ② El comentario, que citaba un índice borrado.
  v_def := replace(v_def,
    '--    El UNIQUE parcial `uq_oferta_publicada_por_variante` ya lo vuelve',
    '--    (S99: POR CUENTA — el UNIQUE parcial `uq_oferta_publicada_por_cuenta_variante` lo vuelve');
  v_def := replace(v_def,
    '  -- ── UNA SOLA OFERTA PUBLICADA POR VARIANTE ──────────────────────────────',
    '  -- ── UNA SOLA OFERTA PUBLICADA POR VARIANTE **Y POR VENDEDOR** ───────────');

  IF v_def NOT LIKE '%cuenta_comercial_id = v_sku.cuenta_comercial_id%' THEN
    RAISE EXCEPTION 'La enmienda no encontró el texto a reemplazar — el cuerpo cambió; leerlo antes de re-aplicar (regla 40)';
  END IF;
  EXECUTE v_def;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — el discriminador ES la competencia: dos vendedores publican la
-- misma variante (antes rebotaba), y el mismo vendedor dos veces sigue
-- rebotando (que es lo que el UNIQUE nuevo protege).
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_rol_mig text := current_user;
  v_admin text := '{"sub":"75d0798a-ea90-4a97-a2f2-74f3234d892a","role":"authenticated"}';
  v_var uuid; v_sku_a uuid; v_sku_b uuid; v_r jsonb; v_ok boolean := false;
BEGIN
  -- Una variante con oferta publicada de UN vendedor y un SKU de OTRO
  -- vendedor sobre la misma variante, sin publicar.
  SELECT o.variante_id, o.sku_id, x.id INTO v_var, v_sku_a, v_sku_b
  FROM ofertas o
  JOIN vendedor_skus x ON x.variante_id = o.variante_id
                      AND x.cuenta_comercial_id <> o.cuenta_comercial_id
  WHERE o.estado='publicada'
    AND NOT EXISTS (SELECT 1 FROM ofertas o2 WHERE o2.sku_id = x.id AND o2.estado='publicada')
  LIMIT 1;

  IF v_sku_b IS NULL THEN
    RAISE NOTICE 'CINTURÓN: no hay par para discriminar todavía (la siembra de competencia corre después) — se verifica por el TEXTO del cuerpo';
    IF (SELECT pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
        WHERE n.nspname='public' AND p.proname='publicar_oferta_sku')
       NOT LIKE '%cuenta_comercial_id = v_sku.cuenta_comercial_id%' THEN
      RAISE EXCEPTION 'CINTURÓN: la enmienda no quedó en el cuerpo';
    END IF;
    RETURN;
  END IF;

  PERFORM set_config('request.jwt.claims', v_admin, true);
  SET LOCAL ROLE authenticated;
  v_r := public.publicar_oferta_sku(v_sku_b, 9.99, 'EC');
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
  IF (v_r ->> 'ok') IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'CINTURÓN: el segundo vendedor NO pudo publicar — la competencia sigue cerrada: %', v_r;
  END IF;

  IF (SELECT count(*) FROM ofertas WHERE variante_id = v_var AND estado='publicada') < 2 THEN
    RAISE EXCEPTION 'CINTURÓN: dijo ok y no hay dos ofertas publicadas';
  END IF;
  RAISE NOTICE 'CINTURÓN: dos vendedores publicados sobre la misma variante — la competencia EXISTE';
END $$;
