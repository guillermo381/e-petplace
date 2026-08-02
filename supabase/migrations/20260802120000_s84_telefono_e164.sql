-- S84-A1bis · EL MOTOR DEL TELÉFONO — E.164 ENTERO, CON GUARD EN LA FUENTE
--
-- FIRMADO (2-ago-2026): founder + arquitecto. **Se deroga la regla 28.**
-- Palabra del founder: *un WhatsApp de otro país es normal, no excepcional —
-- restringirlo no tiene sentido.* El número se guarda ENTERO, con su '+'; el
-- país viaja DENTRO del número y no hay columna de indicativo que pueda
-- contradecirlo. `prestadores.telefono_codigo_pais` NO nace.
--
-- ── POR QUÉ SE DEROGA: POR INCOMPLETA, NO POR EQUIVOCADA ──────────────
-- "E.164 sin '+'" **funciona si el país vive en otro lado**. En `profiles`
-- esa mitad existe (`telefono_codigo_pais`); **en `prestadores` nunca se
-- construyó**. La regla era coherente con una mitad que nadie hizo — y sin
-- ella, el número guardado no sabe de dónde es. Se registra así a propósito:
-- derogar culpando al criterio anterior enseña lo contrario de lo que pasó.
--
-- ── EL PRIMER INTENTO CHOCÓ, Y ESO ES PARTE DEL REGISTRO ──────────────
-- La versión de S84-A1 no pudo aplicarse: existían DOS guards que prohibían
-- exactamente lo contrario (`prestadores_telefono_sin_plus` /
-- `prestadores_whatsapp_sin_plus`). **No los encontró la lectura: los
-- encontró el CONTROL POSITIVO de la auto-prueba** — el caso que debía
-- ENTRAR rebotó. La exigencia de que el guard nuevo gritara es la que hizo
-- gritar al viejo. Por eso el bloque ④ conserva su control positivo: es el
-- que ve lo que los rojos no ven.
--
-- ── EL CENSO DE ESCRITORES, RE-CORRIDO ANTES DEL DROP (el freno) ──────
-- Funciones que escriben `prestadores` tocando estas columnas: **DOS**.
--   · `invitar_prestador`       → escribe `whatsapp = ''` literal ⇒ pasa.
--   · `crear_prestador_inicial` → **sin callers** (grep en apps/ y packages/:
--     solo aparece en los tipos generados). Huérfana del legado, D-471.
-- Triggers de la tabla: 5, **ninguno toca tel/wa** (protección de columnas,
-- horarios, gate de vitrina, notificación de estado, updated_at).
-- Edge Functions: `crear_cliente_walkin` toca **`profiles`**, no prestadores.
-- ⇒ **Ningún consumidor no censado escribe sin '+'.** El freno no se cumple.
--
-- ── LOS DATOS: NO SE TOCA NINGUNO, Y ES UNA DECISIÓN ──────────────────
-- Las cinco filas con whatsapp, medidas CON SU DUEÑO:
--   2052f109  Satori Latam sas  573208408790   (wizard — REAL, del founder)
--   d73347ba  Carlos            593987654321   (wizard — REAL)
--   de300000  Paseos Andres     3208408790     (SEED demo — sin indicativo)
--   de580000  Wizard            593999000558   (SEED)
--   de680000  Clínica Aurora    593999000668   (SEED)
--
-- **Observación medida que NO se convierte en acción:** `573208408790`
-- (Satori) y `3208408790` (el seed) son **el mismo número salvo el `57`**.
-- Es tentador deducir que al seed le falta el indicativo colombiano — **y
-- ahí es exactamente donde P21 dice que no**. Se registra como dato, no como
-- cura: la orden es explícita, la fila CO queda como está hasta que su dueño
-- lo confirme.
--
-- **EL CHECK NACE `NOT VALID`, y ése es el mecanismo que hace posible "queda
-- como está".** `NOT VALID` no verifica las filas existentes pero **sí rige
-- para todo INSERT/UPDATE nuevo**: el guard manda hacia adelante y el pasado
-- no se reescribe (mismo patrón que `gps_estado` en S62).
--
-- ⚠️ **EL BORDE QUE ESTO DEJA, DECLARADO PARA QUE NADIE LO DESCUBRA SOLO:**
-- Postgres revalida el CHECK al UPDATE de la fila. Un prestador de esos cinco
-- que abra su perfil y guarde **va a rebotar** hasta que su número traiga el
-- '+'. **No es un daño silencioso** —el wrapper lo dice con voz tipada— pero
-- es fricción real, y le toca al founder en su propio negocio. Vive como
-- **D-619**, con sus dos salidas medidas.
--
-- **Por qué NO se vació ni se promovió nada**, teniendo licencia para lo
-- primero: vaciar **destruye** (y Satori/Carlos resultaron reales, no data de
-- prueba); promover **transforma con una hipótesis**. `NOT VALID` es la única
-- de las tres que **no destruye y no inventa** — y deja la decisión servida
-- con su dato en vez de tomarla de prepo.
--
-- EL REGEX: `^\+[1-9][0-9]{6,14}$` — '+' obligatorio, primer dígito ≠ 0
-- (E.164 no admite indicativo con 0 a la cabeza), 7 a 15 dígitos (15 es el
-- techo del estándar). Sin espacios ni guiones: el formateo es del display.
--
-- EL VACÍO, uno solo por columna, por su restricción heredada:
--   · `telefono` (nullable) → **NULL**. `''` queda PROHIBIDO; el wrapper ya
--     lo convierte con `aNull()`.
--   · `whatsapp` (NOT NULL) → **`''`**.
--
-- 76(g): **NO RIGE** — DDL puro. **Cero escritura de datos** (ver arriba).
-- REVERSA: `docs/relevamientos/2026-08-01-s84a-REVERSA-telefono-e164.sql`
-- — restituye los dos guards viejos, no solo quita los nuevos.

BEGIN;

-- ── ① EL DROP: la regla 28 sale de la fuente ──────────────────────────
ALTER TABLE public.prestadores DROP CONSTRAINT IF EXISTS prestadores_telefono_sin_plus;
ALTER TABLE public.prestadores DROP CONSTRAINT IF EXISTS prestadores_whatsapp_sin_plus;

-- ── ② EL GUARD NUEVO ──────────────────────────────────────────────────
ALTER TABLE public.prestadores
  ADD CONSTRAINT chk_prestadores_telefono_e164
  CHECK (telefono IS NULL OR telefono ~ '^\+[1-9][0-9]{6,14}$') NOT VALID;

ALTER TABLE public.prestadores
  ADD CONSTRAINT chk_prestadores_whatsapp_e164
  CHECK (whatsapp = '' OR whatsapp ~ '^\+[1-9][0-9]{6,14}$') NOT VALID;

-- ── ③ CINTURÓN — la migración no se declara buena sola (L-192) ────────
DO $$
DECLARE v_viejos int; v_nuevos int;
BEGIN
  SELECT count(*) INTO v_viejos FROM pg_constraint
   WHERE conrelid='public.prestadores'::regclass
     AND conname IN ('prestadores_telefono_sin_plus','prestadores_whatsapp_sin_plus');
  IF v_viejos <> 0 THEN RAISE EXCEPTION 'los guards viejos siguen vivos: %', v_viejos; END IF;

  SELECT count(*) INTO v_nuevos FROM pg_constraint
   WHERE conrelid='public.prestadores'::regclass
     AND conname IN ('chk_prestadores_telefono_e164','chk_prestadores_whatsapp_e164');
  IF v_nuevos <> 2 THEN RAISE EXCEPTION 'se esperaban 2 constraints nuevos, hay %', v_nuevos; END IF;
END $$;

-- ── ④ EL GUARD TIENE QUE PODER SALIR ROJO — probado ACÁ ADENTRO ───────
-- Un guard que nadie vio gritar no es un guard. Los cuatro casos malos DEBEN
-- rebotar; si alguno pasa, la migración ABORTA. Y el CONTROL POSITIVO al
-- final: sin él, un guard que rebotara TODO daría los mismos cuatro rojos y
-- parecería correcto. Es el que destapó el choque de A1.
DO $$
DECLARE
  v_id uuid; v_caso text;
  v_malos text[] := ARRAY[
    '593987654321',   -- E.164 sin '+' (exactamente lo que la regla 28 pedía)
    '3208408790',     -- sin indicativo
    '+0593999000',    -- indicativo que arranca en 0
    '+593 99900055'   -- con espacio
  ];
BEGIN
  SELECT id INTO v_id FROM public.prestadores WHERE whatsapp = '' LIMIT 1;
  IF v_id IS NULL THEN
    RAISE NOTICE 'sin fila de whatsapp vacío: la auto-prueba no corre';
    RETURN;
  END IF;

  FOREACH v_caso IN ARRAY v_malos LOOP
    BEGIN
      UPDATE public.prestadores SET whatsapp = v_caso WHERE id = v_id;
      RAISE EXCEPTION 'EL GUARD NO GRITÓ: aceptó %', v_caso;
    EXCEPTION WHEN check_violation THEN
      NULL; -- rebotó: es lo que se quería probar
    END;
  END LOOP;

  -- CONTROL POSITIVO — un E.164 legítimo DEBE entrar.
  UPDATE public.prestadores SET whatsapp = '+573208408790' WHERE id = v_id;
  IF NOT EXISTS (SELECT 1 FROM public.prestadores WHERE id=v_id AND whatsapp='+573208408790') THEN
    RAISE EXCEPTION 'EL CONTROL POSITIVO NO ENTRÓ: el guard rebota todo';
  END IF;
  -- se deja como estaba: la migración no escribe datos.
  UPDATE public.prestadores SET whatsapp = '' WHERE id = v_id;
END $$;

COMMIT;
