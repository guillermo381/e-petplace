-- ═══════════════════════════════════════════════════════════════════════════
-- S99-A · LA COMPETENCIA ENTRE VENDEDORES — OPCIÓN (b) FIRMADA (founder,
-- 18-ago): **varias ofertas EXISTEN, UNA se muestra, y e-PetPlace elige.**
--
-- LO QUE ESTA MIGRACIÓN HACE, y es SOLO eso: mueve el UNIQUE de VARIANTE a
-- (CUENTA, VARIANTE). Un vendedor no publica dos veces el mismo producto;
-- varios vendedores SÍ pueden publicarlo.
--
-- 🔴 LA FIRMA MADRE ③ DE S94 NO SE TOCA — POR FIN SE CUMPLE LITERAL: dice
-- «UNA sola oferta VISIBLE por producto» y el índice había cerrado
-- EXISTENTE. *Nadie decidió ese rigor: lo eligió una restricción técnica.*
-- La unicidad de lo VISIBLE pasa a ser responsabilidad de la SELECCIÓN
-- (la cadena firmada), no del esquema.
--
-- ⚠️ LO QUE ESTA MIGRACIÓN **NO** HACE, declarado para que nadie lo lea de
-- más: **no elige quién gana.** La cadena firmada (stock → cercanía →
-- calificación → antigüedad + ventana del nuevo) NO se implementa acá
-- porque DOS de sus criterios no tienen dato (censo en el Loop de A,
-- 18-ago). **Hasta que la mesa adjudique el criterio provisional, la
-- vitrina puede mostrar N ofertas del mismo producto** — y eso es
-- VISIBLE, no silencioso: el lector devuelve una fila por oferta.
--
-- 76(g): NO RIGE — un índice; cero datos tocados, cero backfill. Reversa
-- ANTES, **y DECLARA que no puede revertir si ya hay competencia viva**
-- (docs/relevamientos/2026-08-18-s99a-REVERSA-competencia-index.sql).
-- ═══════════════════════════════════════════════════════════════════════════

DROP INDEX IF EXISTS public.uq_oferta_publicada_por_variante;

CREATE UNIQUE INDEX uq_oferta_publicada_por_cuenta_variante
  ON public.ofertas USING btree (cuenta_comercial_id, variante_id)
  WHERE (estado = 'publicada');

COMMENT ON INDEX public.uq_oferta_publicada_por_cuenta_variante IS
  'S99 (firma founder 18-ago, opción b): varias ofertas EXISTEN, una se MUESTRA. Un vendedor no publica dos veces la misma variante; varios vendedores sí. La unicidad de lo VISIBLE es de la SELECCIÓN (cadena stock→cercanía→calificación→antigüedad), jamás del esquema — la firma ③ de S94 habla de VISIBLE.';

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — el DISCRIMINADOR es la competencia misma: lo que ANTES era
-- imposible ahora pasa, y lo que sigue prohibido sigue rebotando. Se hace
-- con los SKUs del choque YA sembrados (D-838) y se REVIERTE entero.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_sku      record;
  v_oferta   uuid;
  v_err      text;
  v_publicadas int;
BEGIN
  -- Un SKU del choque: producto que OTRO ya publica, con precio propio.
  SELECT vs.id, vs.variante_id, vs.cuenta_comercial_id, vs.precio_propuesto
    INTO v_sku
  FROM public.vendedor_skus vs
  WHERE vs.sku_vendedor LIKE 'SIEMBRA-S99-%ESP-%'
    AND vs.precio_propuesto IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.ofertas o
                WHERE o.variante_id = vs.variante_id AND o.estado = 'publicada'
                  AND o.cuenta_comercial_id <> vs.cuenta_comercial_id)
  LIMIT 1;
  IF v_sku.id IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN: sin SKU del choque para discriminar (¿siembra ausente?)';
  END IF;

  -- Brazo ① — LA COMPETENCIA AHORA EXISTE: dos ofertas publicadas de la
  -- MISMA variante, de vendedores distintos. (Antes: violación de índice.)
  INSERT INTO public.ofertas (variante_id, sku_id, precio, moneda, country_code,
                              estado, publicado_por, publicado_en, cuenta_comercial_id)
  VALUES (v_sku.variante_id, v_sku.id, v_sku.precio_propuesto, 'USD', 'EC',
          'publicada', '75d0798a-ea90-4a97-a2f2-74f3234d892a', now(), v_sku.cuenta_comercial_id)
  RETURNING id INTO v_oferta;

  SELECT count(*) INTO v_publicadas FROM public.ofertas
  WHERE variante_id = v_sku.variante_id AND estado = 'publicada';
  IF v_publicadas < 2 THEN
    RAISE EXCEPTION 'CINTURÓN ①: la competencia no quedó expresada (% publicadas)', v_publicadas;
  END IF;

  -- Brazo ② — LO QUE SIGUE PROHIBIDO: el MISMO vendedor dos veces la misma
  -- variante. Tiene que rebotar por el índice nuevo.
  BEGIN
    INSERT INTO public.ofertas (variante_id, sku_id, precio, moneda, country_code,
                                estado, publicado_por, publicado_en, cuenta_comercial_id)
    VALUES (v_sku.variante_id, v_sku.id, v_sku.precio_propuesto, 'USD', 'EC',
            'publicada', '75d0798a-ea90-4a97-a2f2-74f3234d892a', now(), v_sku.cuenta_comercial_id);
    RAISE EXCEPTION 'CINTURÓN ②: el duplicado del MISMO vendedor NO rebotó';
  EXCEPTION WHEN unique_violation THEN
    NULL;  -- correcto: el índice nuevo lo prohíbe
  END;

  -- RESTAURACIÓN — el estado vuelve a como estaba (la competencia real la
  -- crea la mesa cuando adjudique el criterio, no este cinturón).
  DELETE FROM public.ofertas WHERE id = v_oferta;
  SELECT count(*) INTO v_publicadas FROM public.ofertas
  WHERE variante_id = v_sku.variante_id AND estado = 'publicada';
  IF v_publicadas <> 1 THEN
    RAISE EXCEPTION 'CINTURÓN residuo: quedaron % publicadas', v_publicadas;
  END IF;

  RAISE NOTICE 'CINTURÓN competencia: ①② verdes, residuo 0 (la competencia es EXPRESABLE; el duplicado propio sigue prohibido)';
END $$;
