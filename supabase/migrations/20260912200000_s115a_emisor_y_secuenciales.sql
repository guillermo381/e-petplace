-- S115-A · TANDA 1 (c) — EL EMISOR Y SUS SECUENCIALES
-- Letra: MODELO_FISCAL v0.3 §8 (3) · v0.4 E5 («los datos del emisor son DATO, nunca constantes»).
-- Reversa: docs/relevamientos/S115-A-REVERSA-20260912200000-emisor-secuenciales.sql
-- VEDA 76(g): NO RIGE (tablas nuevas; la semilla del emisor no ancla ids ajenos).

BEGIN;

-- ── EL EMISOR ────────────────────────────────────────────────────────────────
/* 🔴 UNA FILA, y que haya dos es inexpresable. Los datos salen del certificado de
   RUC del 14-ago-2026 y NO son constantes: la leyenda de régimen va a cambiar el
   día que Satori actualice actividades (v0.4 · E2), y el ambiente cambia el día
   del encendido. Por eso son fila, no `const` en un .ts. */
CREATE TABLE public.fiscal_emisor (
  id                      boolean PRIMARY KEY DEFAULT true,
  ruc                     text NOT NULL,
  razon_social            text NOT NULL,
  nombre_comercial        text,
  direccion_matriz        text NOT NULL,
  establecimiento         text NOT NULL,
  punto_emision           text NOT NULL,
  obligado_contabilidad   boolean NOT NULL,
  leyenda_regimen         text,
  agente_retencion        boolean NOT NULL DEFAULT false,
  contribuyente_especial  text,
  ambiente                smallint NOT NULL,
  actualizado_en          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_fiscal_emisor_una_fila CHECK (id),
  CONSTRAINT chk_fiscal_emisor_ruc_13   CHECK (ruc ~ '^[0-9]{13}$'),
  CONSTRAINT chk_fiscal_emisor_estab    CHECK (establecimiento ~ '^[0-9]{3}$'),
  CONSTRAINT chk_fiscal_emisor_punto    CHECK (punto_emision   ~ '^[0-9]{3}$'),
  /* ambiente 1 = pruebas · 2 = producción (ficha técnica del SRI). Un tercero
     no existe: dejarlo abierto permitiría emitir contra un ambiente inventado. */
  CONSTRAINT chk_fiscal_emisor_ambiente CHECK (ambiente IN (1, 2))
);

COMMENT ON TABLE public.fiscal_emisor IS
  'Los datos del emisor, leídos del certificado de RUC (14-ago-2026). DATO, jamás constante: la leyenda de régimen y el ambiente cambian sin tocar código.';

INSERT INTO public.fiscal_emisor
  (ruc, razon_social, nombre_comercial, direccion_matriz, establecimiento, punto_emision,
   obligado_contabilidad, leyenda_regimen, agente_retencion, contribuyente_especial, ambiente)
VALUES
  ('1793240435001',
   'SATORI INOV LATAM S.A.S.',
   'e-PetPlace',
   'Av. de los Shyris y Av. República de El Salvador, Edificio IQON, of. 2705, Quito',
   '001', '002',
   true,
   'CONTRIBUYENTE RÉGIMEN RIMPE',
   false,
   NULL,          -- contribuyente especial: NO ⇒ sin número de resolución
   1);            -- 1 = PRUEBAS. El encendido es un UPDATE, no un deploy.

ALTER TABLE public.fiscal_emisor ENABLE ROW LEVEL SECURITY;
/* Sin policy para `authenticated`: nada fiscal del emisor llega al bundle.
   Lo leen las funciones DEFINER y las edges con service_role. */
CREATE POLICY fiscal_emisor_admin ON public.fiscal_emisor
  FOR SELECT TO authenticated USING (is_admin());

-- ── LOS SECUENCIALES ─────────────────────────────────────────────────────────
CREATE TABLE public.fiscal_sequences (
  ruc               text NOT NULL,
  establecimiento   text NOT NULL,
  punto_emision     text NOT NULL,
  tipo_documento    public.fiscal_tipo_enum NOT NULL,
  ultimo_secuencial bigint NOT NULL DEFAULT 0,
  actualizado_en    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ruc, establecimiento, punto_emision, tipo_documento),
  CONSTRAINT chk_fiscal_seq_no_retrocede CHECK (ultimo_secuencial >= 0)
);

COMMENT ON TABLE public.fiscal_sequences IS
  'El contador por punto de emisión y tipo. Se toma SIEMPRE con SELECT ... FOR UPDATE dentro de tomar_secuencial_fiscal(). MAX+1 sobre documentos_fiscales está PROHIBIDO: dos emisiones concurrentes leerían el mismo máximo.';

ALTER TABLE public.fiscal_sequences ENABLE ROW LEVEL SECURITY;
/* Cero policies: NADIE la lee ni la escribe por PostgREST. Sólo la función
   DEFINER de abajo. Un contador fiscal que un cliente puede mover es una
   numeración que se puede duplicar a pedido. */

INSERT INTO public.fiscal_sequences (ruc, establecimiento, punto_emision, tipo_documento)
SELECT e.ruc, e.establecimiento, e.punto_emision, t
  FROM public.fiscal_emisor e,
       unnest(ARRAY['factura','nota_credito']::public.fiscal_tipo_enum[]) AS t;

-- ── LA PUERTA ATÓMICA ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.tomar_secuencial_fiscal(
  p_ruc text, p_establecimiento text, p_punto_emision text, p_tipo public.fiscal_tipo_enum)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_n bigint;
BEGIN
  /* 🔴 FOR UPDATE, jamás MAX+1. Dos emisiones simultáneas que leen el máximo de
     `documentos_fiscales` obtienen el MISMO número y una de las dos factura con
     un secuencial ya usado — que ante el SRI no es un bug: es un comprobante
     rechazado y un hueco en la numeración que hay que explicar. */
  SELECT ultimo_secuencial + 1 INTO v_n
    FROM public.fiscal_sequences
   WHERE ruc = p_ruc AND establecimiento = p_establecimiento
     AND punto_emision = p_punto_emision AND tipo_documento = p_tipo
     FOR UPDATE;

  IF v_n IS NULL THEN
    RAISE EXCEPTION 'secuencia_no_existe'
      USING ERRCODE = '22023',
            DETAIL  = 'No hay contador para ese punto de emisión y tipo. Se siembra, no se inventa.';
  END IF;

  UPDATE public.fiscal_sequences SET ultimo_secuencial = v_n, actualizado_en = now()
   WHERE ruc = p_ruc AND establecimiento = p_establecimiento
     AND punto_emision = p_punto_emision AND tipo_documento = p_tipo;

  RETURN lpad(v_n::text, 9, '0');   -- el SRI numera a 9 dígitos
END $fn$;

REVOKE EXECUTE ON FUNCTION public.tomar_secuencial_fiscal(text, text, text, public.fiscal_tipo_enum) FROM PUBLIC, anon, authenticated;
/* Ni siquiera `authenticated`: el secuencial lo toma la EMISIÓN, del lado del
   servidor. Un cliente que puede consumir numeración puede agujerearla. */

COMMIT;
