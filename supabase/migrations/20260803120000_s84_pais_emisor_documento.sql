-- S84-A32 ① · EL PAÍS DEL DOCUMENTO — se DECLARA, jamás se deriva.
--
-- FIRMADO (2-ago-2026, sobre `LETRA_VERIFICACION_S85` §3):
-- **la columna nace ANTES que la pantalla.**
--
-- ── POR QUÉ ANTES, y no "en el mismo lote" ───────────────────────────
-- Si la pantalla naciera primero, **los documentos cargados mientras
-- tanto no tendrían país** — y el dato no se recupera después: nadie va a
-- volver a abrir un PDF para anotar de dónde era. **El país o se captura
-- al cargar, o se pierde.**
--
-- ── LA REGLA: P21, EN OTRO CAMPO ─────────────────────────────────────
-- **El país del documento NO es el país del negocio.** Un vet colombiano
-- ejerciendo en Quito tiene **tarjeta colombiana**.
-- **Está PROHIBIDO derivarlo de `prestadores.country_code`.**
--
-- *Y no es una precaución teórica: el caso ya nos mordió en S84 con el
-- teléfono. Las siete filas de `prestadores` tienen `country_code='EC'` y
-- el WhatsApp del founder es `+57`. Derivar del perfil habría escrito
-- `+593` sobre un número colombiano; acá escribiría **"cédula
-- ecuatoriana" sobre una tarjeta colombiana**. Mismo error, otro campo.*
--
-- ── POR QUÉ `text` CON CHECK DE FORMA Y NO FK A `cat_paises` ─────────
-- `cat_paises` tiene **23 países** y el mundo tiene más. Una FK diría
-- *"solo se aceptan documentos de estos 23"*, que **no es una regla que
-- nadie firmó** — y el primer prestador con un título de un país fuera de
-- la lista quedaría sin poder cargarlo.
-- **Se valida la FORMA (ISO-3166-1 alfa-2), no la pertenencia a un
-- catálogo.** *Es la misma decisión que la casa tomó con `vacunas`: texto
-- libre con excepción curada, en vez de un catálogo que rebota lo real.*
--
-- ── NULL ES "NO DECLARADO", Y ES HONESTO ─────────────────────────────
-- La columna es **NULLABLE a propósito**: hay **9 documentos ya cargados**
-- y ninguno declaró país. **Ponerles `'EC'` por defecto sería exactamente
-- lo que esta migración viene a prohibir** — inventar el país que nadie
-- dijo. **Quedan en NULL, que dice la verdad: no se preguntó.**
--
-- 76(g): **NO RIGE** — DDL puro, **cero backfill** (ver arriba: el
-- backfill sería la inferencia prohibida).
-- REVERSA: `docs/relevamientos/2026-08-03-s84a-REVERSA-pais-emisor.sql`

BEGIN;

ALTER TABLE public.prestador_documentos
  ADD COLUMN IF NOT EXISTS pais_emisor text;

-- ISO-3166-1 alfa-2. NULL pasa: es "no declarado".
ALTER TABLE public.prestador_documentos
  ADD CONSTRAINT chk_prestador_documentos_pais_iso2
  CHECK (pais_emisor IS NULL OR pais_emisor ~ '^[A-Z]{2}$');

COMMENT ON COLUMN public.prestador_documentos.pais_emisor IS
  'País que EMITIÓ el documento (ISO-3166-1 alfa-2). SE DECLARA — está prohibido derivarlo de prestadores.country_code (P21): un vet colombiano en Quito tiene tarjeta colombiana. NULL = no declarado, jamás "el del negocio".';

-- La columna nace SIN grant (regla de la casa para columnas nuevas), y se
-- concede solo lo que hace falta: el prestador la escribe al cargar y la
-- lee en su lista.
GRANT SELECT (pais_emisor), UPDATE (pais_emisor), INSERT (pais_emisor)
  ON public.prestador_documentos TO authenticated;

-- ── CINTURÓN (L-192) ──────────────────────────────────────────────────
DO $$
DECLARE v_col int; v_sel int; v_backfill int;
BEGIN
  SELECT count(*) INTO v_col FROM information_schema.columns
   WHERE table_schema='public' AND table_name='prestador_documentos' AND column_name='pais_emisor';
  IF v_col <> 1 THEN RAISE EXCEPTION 'la columna no quedó'; END IF;

  SELECT count(*) INTO v_sel FROM information_schema.column_privileges
   WHERE table_schema='public' AND table_name='prestador_documentos'
     AND column_name='pais_emisor' AND grantee='authenticated' AND privilege_type='SELECT';
  IF v_sel <> 1 THEN RAISE EXCEPTION 'falta SELECT para authenticated'; END IF;

  -- EL CINTURÓN QUE IMPORTA: que NADIE haya rellenado el país.
  -- Un backfill acá sería la inferencia que la letra prohíbe, y sería
  -- invisible: nueve filas con 'EC' se ven perfectamente normales.
  SELECT count(*) INTO v_backfill FROM public.prestador_documentos WHERE pais_emisor IS NOT NULL;
  IF v_backfill <> 0 THEN
    RAISE EXCEPTION 'ALGUIEN RELLENÓ el país en % filas — la letra lo prohíbe', v_backfill;
  END IF;
END $$;

-- ── AUTO-PRUEBA: el CHECK tiene que poder salir rojo ─────────────────
DO $$
DECLARE v_id uuid; v_caso text;
BEGIN
  SELECT id INTO v_id FROM public.prestador_documentos LIMIT 1;
  IF v_id IS NULL THEN RAISE NOTICE 'sin documentos: la auto-prueba no corre'; RETURN; END IF;

  FOREACH v_caso IN ARRAY ARRAY['ec', 'ECU', 'E1', 'Ecuador'] LOOP
    BEGIN
      UPDATE public.prestador_documentos SET pais_emisor = v_caso WHERE id = v_id;
      RAISE EXCEPTION 'EL CHECK NO GRITÓ: aceptó %', v_caso;
    EXCEPTION WHEN check_violation THEN NULL; END;
  END LOOP;

  -- control positivo: un ISO2 legítimo entra (sin él, un CHECK que
  -- rebotara todo daría los mismos cuatro rojos y parecería correcto).
  UPDATE public.prestador_documentos SET pais_emisor = 'CO' WHERE id = v_id;
  IF NOT EXISTS (SELECT 1 FROM public.prestador_documentos WHERE id=v_id AND pais_emisor='CO') THEN
    RAISE EXCEPTION 'EL CONTROL POSITIVO NO ENTRÓ';
  END IF;
  -- se deja como estaba: esta migración NO escribe datos.
  UPDATE public.prestador_documentos SET pais_emisor = NULL WHERE id = v_id;
END $$;

COMMIT;
