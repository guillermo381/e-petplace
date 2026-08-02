-- ⛔ PROPUESTA — **NO APLICADA, Y FUERA DE `supabase/migrations/` A
--    PROPÓSITO.** Un archivo en `migrations/` es la promesa de que se
--    aplica; éste no puede aplicarse todavía, así que no vive ahí —
--    para que ningún `db push` de ninguna pista lo corra por inercia.
--
-- ── EL FRENO (la condición que la orden S84-A1 puso, y que se cumplió) ─
-- **YA EXISTEN DOS GUARDS QUE PROHÍBEN EXACTAMENTE LO QUE LA MESA
-- ADJUDICÓ**, uno por columna, vivos en la DB (medidos con
-- `pg_get_constraintdef`, no recordados):
--
--   prestadores_telefono_sin_plus
--     CHECK (telefono IS NULL OR telefono !~ '^\+')
--   prestadores_whatsapp_sin_plus
--     CHECK (whatsapp IS NULL OR whatsapp !~ '^\+')
--
-- Son la **regla 28 del CONTRATO** cableada en la fuente. No es una
-- convención suelta ni un comentario: es un guard duro que rebota el '+'.
--
-- CÓMO SE DESTAPÓ, y por qué vale contarlo: el freno NO lo encontró la
-- lectura — lo encontró **el control positivo de la auto-prueba** (④).
-- El intento de escribir un E.164 legítimo rebotó con
-- `prestadores_whatsapp_sin_plus`. **La misma exigencia de que el guard
-- pudiera gritar es la que hizo gritar al guard que ya estaba.** Sin ese
-- control positivo, la migración habría fallado más tarde y en otro
-- lado, o —peor— habría "pasado" sin que su rojo probara nada.
--
-- ESTADO DE LA DB TRAS EL INTENTO: **intacta**. Todo corrió dentro de
-- una transacción y el fallo la revirtió entera — los siete valores
-- quedaron idénticos y no se creó ningún constraint. Verificado después,
-- no supuesto.
--
-- LO QUE FALTA PARA QUE ESTO SE PUEDA APLICAR — y es de la mesa, no mío:
-- **hay que DROPear los dos guards `*_sin_plus`**, y eso es derogar la
-- regla 28 en la fuente. Un DROP de guard firmado no se hace de prepo
-- (es el aprendizaje central de S83: dos letras firmadas que se
-- contradicen son peores que una equivocada). El pedido de firma está en
-- **D-613**; cuando esté firmado, este archivo vuelve a `migrations/`
-- con los dos DROP a la cabeza y se aplica tal cual.
--
-- ───────────────────────────────────────────────────────────────────────
-- S84-A1 · EL MOTOR DEL TELÉFONO — E.164 ENTERO, CON GUARD EN LA FUENTE
--
-- ADJUDICADO POR LA MESA (1-ago-2026): el teléfono y el whatsapp del
-- prestador se guardan ENTEROS, con su '+'. NO nace
-- `prestadores.telefono_codigo_pais`: los consumidores (wa.me, tel:, la
-- página pública de §4.4) leen E.164, guardarlo partido obliga a
-- reconstruirlo en cada uno, y dos números de países distintos —el caso
-- real del founder, que opera en EC con línea CO— no caben en una
-- columna de indicativo.
--
-- ── POR QUÉ SE PUEDE PONER EL GUARD HOY, Y NO SE VA A PODER MAÑANA ────
-- Con datos vivos, un CHECK de formato sobre una columna de contacto es
-- impagable: exige backfill, exige decidir qué hacer con lo que no
-- encaja, y cada fila mal formada es un usuario real que se queda sin
-- guardar. Hoy son SIETE filas de prueba y el founder las declaró
-- descartables. **La ventana se aprovecha ahora porque no vuelve.**
--
-- ── LO MEDIDO ANTES DE ESCRIBIR (nada de esto se supuso) ──────────────
-- ① Son **SIETE** filas, no cinco. Las siete con `country_code='EC'`.
-- ② `telefono` está en **NULL en las siete**. Nunca se escribió.
-- ③ `whatsapp` es **NOT NULL sin default**: su "sin dato" es `''`, y dos
--    filas ya lo usan así. El wrapper lo tenía relevado.
-- ④ **NINGUNA de las cinco con dato está en E.164**: cero traen '+'.
--    Cuatro son E.164 sin '+' (`593987654321`) y **una no trae
--    indicativo en absoluto** (`3208408790`, un número colombiano de 10
--    dígitos en un prestador con `country_code='EC'`).
--
--    ⚠️ ESA FILA ES LA PRUEBA VIVA DE P21, y por eso se registra acá en
--    vez de borrarse en silencio: derivar el prefijo del `country_code`
--    le habría escrito **+593 a un número colombiano** — un valor
--    plausible, con typecheck verde y el significado mal (L-180/L-139).
--    Es exactamente el caso del founder. **La cura es vaciar, no
--    adivinar.**
--
-- ⑤ Lo de ④ NO es azar: es **la regla 28 del CONTRATO** cumpliéndose
--    ("Persistencia E.164 sin '+' para teléfonos"). Estos datos no son
--    ruido — son data que obedecía una letra firmada. La adjudicación de
--    la mesa la **enmienda**; el pedido de firma está en D-613.
--    *Nota que la enmienda vuelve fácil: en `profiles.telefono`, 15 de
--    24 filas con dato YA guardan con '+'. La regla 28 estaba rota de
--    facto en la tabla de más volumen; esta migración regulariza en la
--    dirección en la que la casa ya iba.*
--
-- ── QUÉ ESCRITORES TOCAN ESTAS COLUMNAS (censo, no lista heredada) ────
--   · `invitar_prestador`  → escribe `whatsapp = ''` literal. **Pasa el
--     CHECK sin tocarlo.** Es el camino vivo del alta.
--   · `crear_prestador_inicial` → toca las dos, **y NO TIENE CALLERS**
--     (grep en `apps/` y `packages/`: solo aparece en los tipos
--     generados). Huérfana del legacy, familia D-471. Se declara y no se
--     cura: jubilarla es otro acto.
--     *De paso, medido: hace `NULLIF(trim(p_whatsapp),'')` sobre una
--     columna NOT NULL — con whatsapp vacío ya viola la restricción HOY.
--     Bug pre-existente que este archivo no crea ni empeora.*
--   · `actualizarPerfilPrestador` (wrapper) → es el ÚNICO que rompería,
--     porque hoy tira el '+' antes de mandar. Se cura en el mismo lote,
--     con error TIPADO: el CHECK es la red, jamás la voz.
--
-- ── EL VACÍO, Y POR QUÉ QUEDA UNO SOLO POR COLUMNA ────────────────────
--   · `telefono`  (nullable) → **NULL** es el vacío. `''` queda
--     PROHIBIDO por el CHECK; el wrapper ya lo convierte con `aNull()`.
--   · `whatsapp`  (NOT NULL) → **`''`** es el vacío, por su restricción
--     heredada.
-- Son dos representaciones distintas porque las columnas nacieron
-- distintas; lo que este archivo garantiza es que **cada una tiene UNA
-- sola**, y que ningún tercer estado ("  ", '+', '+0…') es expresable.
--
-- El campo sigue siendo **OPCIONAL**: lo que se exige no es que haya
-- número, sino que si lo hay, sea E.164.
--
-- EL REGEX: `^\+[1-9][0-9]{6,14}$` — '+' obligatorio, primer dígito
-- distinto de 0 (E.164 no admite indicativo con 0 a la cabeza), total de
-- 7 a 15 dígitos (15 es el techo del estándar). Sin espacios ni guiones:
-- el formateo es del display, no de la columna.
--
-- 76(g): **NO RIGE para el DDL**; el UPDATE de vaciado sí escribe, y se
-- declara: son las 7 filas de `prestadores`, columnas `telefono` y
-- `whatsapp`, **por licencia nominal del founder acotada a esas dos**.
-- Nada más se toca — los fixtures de paseo/vet se quedan donde están.
-- REVERSA: `docs/relevamientos/2026-08-01-s84a-REVERSA-telefono-e164.sql`
-- (escrita ANTES, con los siete valores literales por si alguien los
-- quiere de vuelta a mano — el código se revierte, los datos no).

BEGIN;

-- ── ① VACIAR (licencia del founder, acotada a estas dos columnas) ─────
UPDATE public.prestadores SET telefono = NULL WHERE telefono IS NOT NULL;
UPDATE public.prestadores SET whatsapp = ''   WHERE whatsapp <> '';

-- ── ② EL GUARD, en la fuente ──────────────────────────────────────────
ALTER TABLE public.prestadores
  ADD CONSTRAINT chk_prestadores_telefono_e164
  CHECK (telefono IS NULL OR telefono ~ '^\+[1-9][0-9]{6,14}$');

ALTER TABLE public.prestadores
  ADD CONSTRAINT chk_prestadores_whatsapp_e164
  CHECK (whatsapp = '' OR whatsapp ~ '^\+[1-9][0-9]{6,14}$');

-- ── ③ CINTURÓN — que la migración no se declare buena sola ────────────
-- (L-192: una verificación cuyo modo de falla es el silencio no es una
-- verificación. Estos DOS bloques ABORTAN la migración si mienten.)
DO $$
DECLARE v_sucias int; v_constraints int;
BEGIN
  SELECT count(*) INTO v_sucias FROM public.prestadores
   WHERE (telefono IS NOT NULL AND telefono !~ '^\+[1-9][0-9]{6,14}$')
      OR (whatsapp <> '' AND whatsapp !~ '^\+[1-9][0-9]{6,14}$');
  IF v_sucias <> 0 THEN
    RAISE EXCEPTION 'quedaron % filas fuera de E.164 tras el vaciado', v_sucias;
  END IF;

  SELECT count(*) INTO v_constraints FROM pg_constraint
   WHERE conrelid = 'public.prestadores'::regclass
     AND conname IN ('chk_prestadores_telefono_e164','chk_prestadores_whatsapp_e164');
  IF v_constraints <> 2 THEN
    RAISE EXCEPTION 'se esperaban 2 constraints, hay %', v_constraints;
  END IF;
END $$;

-- ④ EL GUARD TIENE QUE PODER SALIR ROJO — y se prueba ACÁ, adentro de la
-- propia migración, no en un archivo aparte que nadie vuelve a correr.
-- Un guard que nadie vio gritar no es un guard: los tres casos de abajo
-- DEBEN rebotar, y si alguno pasa, la migración ABORTA.
DO $$
DECLARE v_id uuid; v_paso text; v_malos text[] := ARRAY['593987654321','3208408790','+0593999','+59399 000558'];
BEGIN
  SELECT id INTO v_id FROM public.prestadores LIMIT 1;
  IF v_id IS NULL THEN RAISE NOTICE 'sin filas: la auto-prueba no corre'; RETURN; END IF;

  FOREACH v_paso IN ARRAY v_malos LOOP
    BEGIN
      UPDATE public.prestadores SET whatsapp = v_paso WHERE id = v_id;
      RAISE EXCEPTION 'EL GUARD NO GRITÓ: aceptó %', v_paso;
    EXCEPTION WHEN check_violation THEN
      NULL; -- rebotó, que es lo que se quería probar
    END;
  END LOOP;

  -- y el control positivo: un E.164 legítimo DEBE entrar (si el guard
  -- rebotara todo, los rojos de arriba no probarían nada).
  UPDATE public.prestadores SET whatsapp = '+593999000558' WHERE id = v_id;
  UPDATE public.prestadores SET whatsapp = ''              WHERE id = v_id;
END $$;

COMMIT;
