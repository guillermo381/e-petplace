-- ═══════════════════════════════════════════════════════════════════════════
-- S101-A · ⑥ LA TABLA DE TARJETAS GUARDADAS
--
-- Nace en el arco del Add Card, que es el dueño que se le asignó cuando el
-- censo frenó el disparo original por no tener dónde persistir un token.
--
-- Reversa escrita ANTES:
--   docs/relevamientos/2026-08-19-s101-REVERSA-tarjetas-guardadas.sql
--
-- Veda 76(g): NO RIGE. Tabla nueva, aditiva, sin backfill, sin anclas.
--
-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 🔴 LO QUE ESTA TABLA NO GUARDA, Y NO ES NEGOCIABLE                      │
-- │                                                                         │
-- │ NUNCA el PAN. NUNCA el CVC. NUNCA el vencimiento completo.              │
-- │                                                                         │
-- │ Guarda el TOKEN del proveedor y **metadatos de reconocimiento**: bin,    │
-- │ últimos 4, marca. Con eso el dueño distingue «la Visa que termina en     │
-- │ 1111» de otra, y con eso soporte puede hablar de una tarjeta sin verla.  │
-- │ El token solo sirve con NUESTRAS credenciales de servidor: filtrado      │
-- │ solo, no cobra nada.                                                    │
-- │                                                                         │
-- │ El día que alguien agregue una columna `numero` acá, e-PetPlace pasa a   │
-- │ ser PCI. El proveedor ya demostró que lo verifica: el 19-ago rebotó el   │
-- │ camino server-to-server con `401 Application is not PCI`.                │
-- └─────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.tarjetas_guardadas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Titular del token: la tarjeta es de la PERSONA, no del hogar ni de la
  -- familia. Mismo criterio que §2 de LETRA_SALDO — la plata y el medio de
  -- pago vuelven a quien los puso.
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  proveedor       text NOT NULL CHECK (proveedor IN ('nuvei','deuna')),

  -- 🔴 La referencia del token. NO es un dato de tarjeta.
  token           text NOT NULL,

  -- Metadatos de RECONOCIMIENTO, no de pago.
  bin             text CHECK (bin IS NULL OR bin ~ '^[0-9]{6,8}$'),
  ultimos4        text CHECK (ultimos4 IS NULL OR ultimos4 ~ '^[0-9]{4}$'),
  marca           text,
  titular         text,

  -- ⑤ LOS TRES DESENLACES, desde el día uno. `abandonada` existe aunque hoy
  --   casi no se instrumente: sin su lugar, el día que se mida habría que
  --   migrar filas de tarjetas vivas.
  estado          text NOT NULL DEFAULT 'guardada'
                    CHECK (estado IN ('guardada','rechazada','abandonada')),
  motivo_rechazo  text,

  creada_en       timestamptz NOT NULL DEFAULT now(),
  actualizada_en  timestamptz NOT NULL DEFAULT now(),

  -- Un token del proveedor es único: el mismo token no puede pertenecer a dos
  -- personas. Si eso pasara, alguien cobraría con la tarjeta de otro.
  CONSTRAINT uq_tarjeta_token UNIQUE (proveedor, token)
);

COMMENT ON TABLE public.tarjetas_guardadas IS
  'S101. Referencias de token del proveedor + metadatos de reconocimiento. '
  'JAMÁS PAN, JAMÁS CVC, JAMÁS vencimiento. Agregar una columna con el número '
  'convierte a e-PetPlace en PCI.';
COMMENT ON COLUMN public.tarjetas_guardadas.token IS
  'Token del proveedor. Sin nuestras credenciales de servidor no cobra nada; '
  'filtrado solo, no sirve.';
COMMENT ON COLUMN public.tarjetas_guardadas.estado IS
  'guardada | rechazada | abandonada — los tres desenlaces del Add Card, con '
  'lugar desde el día uno para no migrar tarjetas vivas después.';

CREATE INDEX IF NOT EXISTS idx_tarjetas_user
  ON public.tarjetas_guardadas (user_id, estado, creada_en DESC);

ALTER TABLE public.tarjetas_guardadas ENABLE ROW LEVEL SECURITY;

-- El dueño VE las suyas y nada más. No las escribe: quien escribe es el
-- servidor, después de que el proveedor confirmó el token.
CREATE POLICY tarjetas_select_propias ON public.tarjetas_guardadas
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- El dueño puede BORRAR la suya (quitar una tarjeta es derecho de la persona).
CREATE POLICY tarjetas_delete_propias ON public.tarjetas_guardadas
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 🔴 Sin policy de INSERT ni de UPDATE, deliberado: si el cliente pudiera
--    insertar, podría declararse dueño del token de otro. Escribe el servidor.
REVOKE INSERT, UPDATE, TRUNCATE ON public.tarjetas_guardadas FROM anon, authenticated;
REVOKE ALL ON public.tarjetas_guardadas FROM anon;

-- ═══ CINTURÓN ═══
DO $$
DECLARE v_pol int; v_anon boolean; v_ins boolean;
BEGIN
  IF to_regclass('public.tarjetas_guardadas') IS NULL THEN
    RAISE EXCEPTION 'cinturon: la tabla no existe';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.tarjetas_guardadas'::regclass) THEN
    RAISE EXCEPTION 'cinturon: quedó sin RLS';
  END IF;

  SELECT count(*) INTO v_pol FROM pg_policies
   WHERE schemaname='public' AND tablename='tarjetas_guardadas' AND cmd IN ('INSERT','UPDATE','ALL');
  IF v_pol <> 0 THEN
    RAISE EXCEPTION 'cinturon: hay % policies de escritura y no debe haber ninguna', v_pol;
  END IF;

  SELECT has_table_privilege('anon','public.tarjetas_guardadas','SELECT') INTO v_anon;
  SELECT has_table_privilege('authenticated','public.tarjetas_guardadas','INSERT') INTO v_ins;
  IF v_anon OR v_ins THEN
    RAISE EXCEPTION 'cinturon: grants mal — anon_select=% authenticated_insert=%', v_anon, v_ins;
  END IF;

  -- 🔴 Que nadie haya metido una columna de PAN mientras nadie miraba.
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='tarjetas_guardadas'
                AND column_name ~* '^(numero|number|pan|cvc|cvv|expiry|vencimiento)') THEN
    RAISE EXCEPTION 'cinturon: apareció una columna de dato de tarjeta — esta tabla JAMÁS guarda PAN/CVC';
  END IF;
END $$;
