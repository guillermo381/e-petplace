-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · A-B7 — LAS DIRECCIONES: PLACES ID, INSTRUCCIONES Y EL PUNTO
--               OBLIGATORIO
--
-- Fuente de letra: `LETRA_RECORRIDO_DESPENSA_S96` §7 — validadas con Places,
-- con alias, referencia separada, instrucciones de entrega y punto en el
-- mapa. Las dos decisiones que después son caras:
--   ① se guarda el IDENTIFICADOR de Places, no solo el texto — es lo que
--     impide que la dirección y el punto se separen con el tiempo;
--   ② el punto se puede mover a mano Y ES OBLIGATORIO — *Places falla en
--     Quito más de lo que uno espera*; si Places no encuentra la casa, el
--     punto igual existe.
--
-- Lo que YA existía y no se duplica: alias · nombre_receptor · telefono ·
-- referencias (la referencia separada de la calle) · es_principal · lat/lon.
-- Lo que faltaba: places_id · instrucciones_entrega · el punto EXIGIDO ·
-- una sola principal por cuenta.
--
-- La escritura sigue siendo directa por RLS (`dir_own`): la dirección es
-- dato personal del dueño, el patrón de la casa desde S55. El CHECK del
-- punto va NOT VALID: las 2 filas vivas son pre-letra y no se inventan
-- coordenadas (L-139) — toda fila NUEVA entra con su punto o no entra.
--
-- Reversa: scripts/s96/2026-08-12-s96-m5-REVERSA.sql
-- ── DECLARACIÓN 76(g): NO RIGE — DDL aditivo, sin backfill, sin fixtures
--    que escriban datos vivos.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

ALTER TABLE public.direcciones_guardadas
  ADD COLUMN places_id text,
  ADD COLUMN instrucciones_entrega text
    CHECK (instrucciones_entrega IS NULL OR length(instrucciones_entrega) <= 280);

COMMENT ON COLUMN public.direcciones_guardadas.places_id IS
  'S96 · El identificador de Google Places. Se guarda el ID y no solo el texto: '
  'es lo que impide que la dirección y el punto se separen con el tiempo (§7).';
COMMENT ON COLUMN public.direcciones_guardadas.instrucciones_entrega IS
  'S96 · "Dejar en portería, entregar a fulanito". Las lee el repartidor y '
  'deciden la entrega fallida. Texto acotado: no son un canal de conversación.';

-- El punto es obligatorio para toda dirección NUEVA. NOT VALID: las filas
-- pre-letra no se inventan (L-139), y quien las edite va a tener que ponerlo.
ALTER TABLE public.direcciones_guardadas
  ADD CONSTRAINT chk_direccion_con_punto
  CHECK (lat IS NOT NULL AND lon IS NOT NULL) NOT VALID;

-- Una sola principal por cuenta — dos principales son ninguna.
CREATE UNIQUE INDEX uq_direccion_principal
  ON public.direcciones_guardadas (user_id) WHERE es_principal;

-- ── Cinturón estructural ────────────────────────────────────────────────────
DO $$
BEGIN
  -- El CHECK rige para lo nuevo: una fila sin punto tiene que rebotar.
  BEGIN
    INSERT INTO direcciones_guardadas (user_id, country_code, alias, nombre_receptor,
                                       telefono, direccion, ciudad)
      VALUES (gen_random_uuid(), 'EC', '__cint', 'cint', '+593999999999',
              '__cint sin punto', 'Quito');
    RAISE EXCEPTION 'ABORTA: una dirección sin punto entró igual.';
  EXCEPTION
    WHEN check_violation THEN NULL;      -- el rebote esperado
    WHEN not_null_violation THEN
      RAISE EXCEPTION 'ABORTA: la sonda rebotó por un NOT NULL, no por el CHECK del punto — completar la sonda.';
    WHEN foreign_key_violation THEN
      RAISE EXCEPTION 'ABORTA: el CHECK del punto no evaluó primero (rebotó la FK).';
  END;
  -- Y las 2 filas viejas siguen legales (NOT VALID hizo su trabajo).
  IF (SELECT count(*) FROM direcciones_guardadas) < 2 THEN
    RAISE EXCEPTION 'ABORTA: se perdieron direcciones vivas.';
  END IF;
END $$;

COMMIT;
