-- ═══════════════════════════════════════════════════════════════════════════
-- S96 · LA OFERTA PUBLICADA DICE DE QUÉ VENDEDOR ES — desbloqueante de la
-- pista D (12-ago): el cliente no podía CREAR un pedido porque no tenía a
-- quién comprarle. Medido: `crear_pedido_despensa`/`calcular_promesa_despensa`
-- exigen `p_cuenta_comercial_id`, el dato vivía SOLO en
-- `vendedor_skus.cuenta_comercial_id`, y la RLS de esa tabla (correcta) se lo
-- cierra al cliente. El checkout era inconstructible desde la app.
--
-- Forma: columna DERIVADA en `ofertas`, estampada por trigger BEFORE INSERT
-- desde el `sku_id` — ningún escritor presente o futuro puede errarla ni
-- omitirla, y `proponer_sku_vendedor`/`publicar_oferta_sku` NO se tocan (la
-- separación catálogo canónico / oferta del vendedor está ELEVADA a la mesa;
-- esta columna no la prejuzga: refuerza que el vendedor es dato de la OFERTA).
-- El vendedor de una oferta PUBLICADA es información de compra, no del panel:
-- viaja por `ofertas_select` (USING true) como el precio.
--
-- 76(g): NO RIGE — DDL + backfill derivado de 6 filas (reconstruible entero).
-- Reversa: scripts/s96/2026-08-12-s96-m12-REVERSA.sql (escrita ANTES; declara
-- que revertir rompe el checkout del cliente).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

ALTER TABLE public.ofertas
  ADD COLUMN cuenta_comercial_id uuid REFERENCES public.cuentas_comerciales(id);

COMMENT ON COLUMN public.ofertas.cuenta_comercial_id IS
  'S96: el vendedor de la oferta, DERIVADO del sku por trigger (jamás lo '
  'estampa un escritor). Es información de compra: el cliente necesita saber '
  'a quién le compra para crear el pedido. La identidad comercial fina sigue '
  'en cuentas_comerciales bajo su propia RLS.';

-- ── Backfill derivado (6 vivas medidas) ─────────────────────────────────────
UPDATE public.ofertas o
   SET cuenta_comercial_id = vs.cuenta_comercial_id
  FROM public.vendedor_skus vs
 WHERE vs.id = o.sku_id;

DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM ofertas WHERE cuenta_comercial_id IS NULL;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'backfill dejó % ofertas sin vendedor — el sku_id es NOT NULL, esto no puede pasar', v_n;
  END IF;
END $$;

-- ── El trigger que la deriva — estructura, no disciplina ────────────────────
CREATE FUNCTION public._trg_oferta_estampa_vendedor()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- SIEMPRE se deriva del sku: el trigger no le cree al escritor ni cuando
  -- escribe (un INSERT con la cuenta equivocada queda corregido, no rebotado —
  -- la fuente de verdad es el sku y el sku ya está validado por su FK).
  SELECT vs.cuenta_comercial_id INTO NEW.cuenta_comercial_id
    FROM vendedor_skus vs WHERE vs.id = NEW.sku_id;
  IF NEW.cuenta_comercial_id IS NULL THEN
    -- Imposible por FK + NOT NULL de vendedor_skus; defensivo y hablado.
    RAISE EXCEPTION 'sku_sin_vendedor: el sku % no resuelve a una cuenta', NEW.sku_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_oferta_estampa_vendedor
  BEFORE INSERT OR UPDATE OF sku_id ON public.ofertas
  FOR EACH ROW EXECUTE FUNCTION public._trg_oferta_estampa_vendedor();

ALTER TABLE public.ofertas ALTER COLUMN cuenta_comercial_id SET NOT NULL;
CREATE INDEX idx_ofertas_cuenta ON public.ofertas (cuenta_comercial_id);

-- ── CINTURÓN — camino real, con la vuelta de rol contra current_user
--    capturado (db push corre como cli_login_postgres con SET ROLE postgres:
--    ni RESET ROLE ni session_user restauran — hallazgo M2 de esta sesión) ──
DO $$
DECLARE
  v_rol_original text := current_user;
  v_sku          record;
  v_oferta       uuid;
  v_cuenta       uuid;
  v_cliente      uuid;
  v_visible      uuid;
  v_n            int;
BEGIN
  -- (a) las 6 vivas coinciden con su sku — cero divergencias.
  SELECT count(*) INTO v_n
    FROM ofertas o JOIN vendedor_skus vs ON vs.id = o.sku_id
   WHERE o.cuenta_comercial_id <> vs.cuenta_comercial_id;
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturón (a): % ofertas divergen de su sku', v_n; END IF;

  SELECT vs.id, vs.variante_id, vs.cuenta_comercial_id
    INTO v_sku FROM vendedor_skus vs LIMIT 1;

  -- (b) INSERT SIN cuenta → el trigger la estampa.
  INSERT INTO ofertas (variante_id, sku_id, precio, estado)
  VALUES (v_sku.variante_id, v_sku.id, 9.99, 'borrador')
  RETURNING id, cuenta_comercial_id INTO v_oferta, v_cuenta;
  IF v_cuenta IS DISTINCT FROM v_sku.cuenta_comercial_id THEN
    RAISE EXCEPTION 'cinturón (b): el trigger estampó % y el sku dice %', v_cuenta, v_sku.cuenta_comercial_id;
  END IF;
  DELETE FROM ofertas WHERE id = v_oferta;

  -- (c) INSERT con cuenta EQUIVOCADA → el trigger la corrige (derivación,
  --     jamás confianza en el escritor).
  INSERT INTO ofertas (variante_id, sku_id, precio, estado, cuenta_comercial_id)
  VALUES (v_sku.variante_id, v_sku.id, 9.99, 'borrador', gen_random_uuid())
  RETURNING id, cuenta_comercial_id INTO v_oferta, v_cuenta;
  IF v_cuenta IS DISTINCT FROM v_sku.cuenta_comercial_id THEN
    RAISE EXCEPTION 'cinturón (c): la cuenta inventada sobrevivió (%)', v_cuenta;
  END IF;
  DELETE FROM ofertas WHERE id = v_oferta;

  -- (d) EL PUNTO ENTERO: un cliente cualquiera LEE el vendedor de una oferta
  --     publicada (RLS real, no supuesta).
  SELECT p.id INTO v_cliente FROM profiles p
   WHERE NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.id = p.id AND a.activo) LIMIT 1;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_cliente, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT cuenta_comercial_id INTO v_visible
    FROM ofertas WHERE estado = 'publicada' LIMIT 1;
  IF v_visible IS NULL THEN
    RAISE EXCEPTION 'cinturón (d): el cliente NO ve el vendedor de la oferta publicada — el bloqueante de D sigue vivo';
  END IF;
  EXECUTE format('SET LOCAL ROLE %I', v_rol_original);
  PERFORM set_config('request.jwt.claims', NULL, true);

  -- (e) residuo 0.
  SELECT count(*) INTO v_n FROM ofertas WHERE precio = 9.99;
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturón (e): residuo % ofertas de fixture', v_n; END IF;

  RAISE NOTICE 'CINTURÓN M12 VERDE: derivada, incorregible por el escritor, visible al cliente, residuo 0';
END $$;

COMMIT;
