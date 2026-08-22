-- ═══════════════════════════════════════════════════════════════════════════
-- S103-D · MIGRACIONES DEL RIEL DEUNA — **SIN NÚMERO, SIN APLICAR**
--
-- Las redacta D, las numera y deposita A (PLAN_MESA_104 §1, L-331).
-- NINGUNA se aplicó. Ninguna se aplica antes del checkpoint 1.
--
-- 🔴 76(g) — VEDA DE ESCRITURA: **NO RIGE en las tres.** Ninguna hace backfill,
--    ninguna ancla a filas vivas, ninguna lee datos que puedan moverse mientras
--    corre. Son DDL aditiva + una tabla nueva vacía.
--
-- 🔴 LO QUE ESTAS MIGRACIONES **NO** CUBREN, y es a propósito:
--    el actuador (`aplicar_evento_de_pago`), `_pago_aprobado` y el barrido
--    (`pagos_pendientes_de_conciliar`) necesitan rama de proveedor — hallazgos
--    3, 4, 5 y 6 del censo (S103-D §3). No entran acá por dos razones:
--      (a) tocan el circuito que HOY cobra plata real de Nuvei;
--      (b) su forma depende del payload real de DeUna, que la tanda 0 no pudo
--          observar (freno §0 de la bitácora).
--    *Escribir la rama de un actuador contra una forma de mensaje imaginada es
--     trabajo que sale verde y significa otra cosa.*
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- M1 · `pagos_intentos` GANA LA FORMA DE DEUNA Y EL ESTADO QUE LE FALTA
--
-- Hallazgos 1 y 2 del censo.
--   · `forma` CHECK vive hoy como ('tokenizacion','redireccion'). DeUna no es
--     ninguna de las dos: no tokenizamos nada y no redirigimos a ningún lado
--     — el cliente teclea un código en OTRA app. Nace `codigo_push`.
--   · `estado` no tiene casilla para `REVERSED_FAILED`, que LETRA_DEUNA §6
--     marca 🔴 «caso de soporte, jamás se resuelve solo». Un estado que la
--     letra declara y la tabla no admite es una fila que no se puede escribir
--     el día que pase.
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.pagos_intentos DROP CONSTRAINT pagos_intentos_forma_check;
ALTER TABLE public.pagos_intentos ADD CONSTRAINT pagos_intentos_forma_check
  CHECK (forma IN ('tokenizacion','redireccion','codigo_push'));

ALTER TABLE public.pagos_intentos DROP CONSTRAINT pagos_intentos_estado_check;
ALTER TABLE public.pagos_intentos ADD CONSTRAINT pagos_intentos_estado_check
  CHECK (estado IN ('iniciado','pendiente','aprobado','rechazado',
                    'expirado','reversado','reverso_fallido'));

-- 🔴 El CHECK viejo de `forma` exigía url_redireccion para la forma
--    'redireccion'. Se re-crea INTACTO: `codigo_push` no la necesita y el
--    predicado ya lo contempla por construcción (sólo mira 'redireccion').
--    *Se re-declara igual porque un DROP silencioso de una defensa ajena es
--     cómo se pierde una regla que nadie recuerda haber tenido.*
--    (verificado: `pagos_intentos_check` NO se toca en esta migración)

COMMENT ON CONSTRAINT pagos_intentos_forma_check ON public.pagos_intentos IS
  'codigo_push = DeUna: el cliente paga desde SU app con un código. No hay token ni redirección.';

-- ── CINTURÓN: el estado malo tiene que volverse expresable, y el bueno seguir vivo
DO $$
DECLARE v_id uuid;
BEGIN
  -- (1) lo nuevo entra
  INSERT INTO pagos_intentos (pedido_id, proveedor, monto, moneda, forma, estado,
                              payload_crudo, clave_idempotencia)
  SELECT id, 'deuna', 1.00, 'USD', 'codigo_push', 'iniciado', '{}'::jsonb,
         'cinturon-m1-'||gen_random_uuid()::text
    FROM pedidos LIMIT 1
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN RAISE EXCEPTION 'cinturon M1: no hay pedido para anclar'; END IF;

  UPDATE pagos_intentos SET estado='reverso_fallido' WHERE id=v_id;

  -- (2) 🔴 CONTRA-CASO: lo inválido tiene que SEGUIR rebotando.
  --     Un CHECK que se amplía de más deja pasar basura sin que nada falle.
  BEGIN
    UPDATE pagos_intentos SET forma='inventada' WHERE id=v_id;
    RAISE EXCEPTION 'cinturon M1: el CHECK de forma dejo pasar un valor invalido';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  RAISE NOTICE 'cinturon M1 OK: codigo_push y reverso_fallido entran; lo invalido rebota';
END $$;
-- ⚠️ El cinturón escribe una fila. **Va dentro de la transacción de la
--    migración y se limpia**: A decide si corre con ROLLBACK aparte o si le
--    agrega el DELETE por `clave_idempotencia LIKE 'cinturon-m1-%'`.

-- ── REVERSA M1 (escrita ANTES de aplicar) ──────────────────────────────────
--   ⚠️ QUÉ NO DESHACE: si ya existieran filas con forma='codigo_push' o
--   estado='reverso_fallido', la reversa **falla** — a propósito. Revertir el
--   vocabulario con filas que lo usan borraría el significado de intentos de
--   pago reales. Primero se migran esas filas, después se revierte.
-- ALTER TABLE public.pagos_intentos DROP CONSTRAINT pagos_intentos_forma_check;
-- ALTER TABLE public.pagos_intentos ADD CONSTRAINT pagos_intentos_forma_check
--   CHECK (forma IN ('tokenizacion','redireccion'));
-- ALTER TABLE public.pagos_intentos DROP CONSTRAINT pagos_intentos_estado_check;
-- ALTER TABLE public.pagos_intentos ADD CONSTRAINT pagos_intentos_estado_check
--   CHECK (estado IN ('iniciado','pendiente','aprobado','rechazado','expirado','reversado'));


-- ───────────────────────────────────────────────────────────────────────────
-- M2 · LAS COLUMNAS DEL RIEL PUSH
--
-- `proveedor_transaction_id` YA EXISTE y ahí va el `transactionId` de DeUna —
-- no nace columna nueva para eso (censo: el candado UNIQUE ya la usa por los
-- dos sujetos, así que §4 de la letra se cumple REUSANDO, no migrando).
--
-- Lo que falta:
--   · `transfer_number`      — el análogo del código de autorización. LETRA_DEUNA
--                              §3.6 lo exige EN EL COMPROBANTE (certificación).
--   · `proveedor_reverso_id` — el `transactionReverseId` de §2, que la letra
--                              manda persistir.
--   · `codigo_numerico`      — los 6 dígitos (firma ① del founder).
--   · `codigo_expira_en`     — su reloj de 3 min FIJOS. Es el SEGUNDO reloj:
--                              el del hold vive en el sujeto y no se toca.
--
-- 🔴 `codigo_numerico` es un dato de pago de vida corta, NO un secreto
--    permanente: lo muestra la pantalla y lo teclea el cliente. Aun así no
--    entra en ningún log (§9 de la letra rige para el riel entero).
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.pagos_intentos
  ADD COLUMN IF NOT EXISTS transfer_number      text,
  ADD COLUMN IF NOT EXISTS proveedor_reverso_id text,
  ADD COLUMN IF NOT EXISTS codigo_numerico      text,
  ADD COLUMN IF NOT EXISTS codigo_expira_en     timestamptz;

ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_codigo_numerico_forma
    CHECK (codigo_numerico IS NULL OR codigo_numerico ~ '^[0-9]{6}$');

-- 🔴 LOS DOS RELOJES NO SE CONFUNDEN, y el CHECK lo vuelve inexpresable:
--    un código sin vencimiento sería un código que nunca muere, y la letra §5
--    dice que vive 3 minutos fijos. *Un dato de vida corta sin su vencimiento
--    al lado se lee, tarde o temprano, como un dato permanente.*
ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_codigo_con_vencimiento
    CHECK ((codigo_numerico IS NULL) = (codigo_expira_en IS NULL));

COMMENT ON COLUMN public.pagos_intentos.codigo_expira_en IS
  'Reloj DEL CÓDIGO (3 min fijos, dato del proveedor). El reloj del HOLD vive en el sujeto y gobierna la sesión — LETRA_DEUNA §6. Dos relojes, dos voces.';
COMMENT ON COLUMN public.pagos_intentos.transfer_number IS
  'Análogo del código de autorización. Requisito de certificación: va en el comprobante (LETRA_DEUNA §3.6).';

-- ── REVERSA M2 ─────────────────────────────────────────────────────────────
--   ⚠️ QUÉ NO DESHACE: los valores se pierden. Si ya hubo cobros DeUna, esto
--   borra el `transfer_number` que el comprobante prometió y el
--   `proveedor_reverso_id` con el que se rastrea una devolución.
-- ALTER TABLE public.pagos_intentos
--   DROP CONSTRAINT IF EXISTS chk_codigo_con_vencimiento,
--   DROP CONSTRAINT IF EXISTS chk_codigo_numerico_forma,
--   DROP COLUMN IF EXISTS codigo_expira_en, DROP COLUMN IF EXISTS codigo_numerico,
--   DROP COLUMN IF EXISTS proveedor_reverso_id, DROP COLUMN IF EXISTS transfer_number;


-- ───────────────────────────────────────────────────────────────────────────
-- M3 · LA REFERENCIA CORTA — el delta más filoso (LETRA_DEUNA §4)
--
-- `internalTransactionReference` admite **< 20 caracteres**. Nuestros UUID
-- miden 36. El `dev_reference = compra` de Nuvei NO se replica.
--
-- La letra fija cuatro condiciones. Cómo las cumple esta forma:
--
--  ① ÚNICA POR CONSTRUCCIÓN, no por probabilidad ingenua
--     → una SECUENCIA. La unicidad la garantiza Postgres, no la suerte.
--       (Un random con UNIQUE+reintento también "no colisiona", pero su
--        garantía es la constraint atrapando el choque; acá no hay choque.)
--
--  ② NO ES UN CONTADOR GLOBAL EXPUESTO
--     → la secuencia se ofusca con un multiplicador modular coprimo. La
--       operación es BIYECTIVA (permutación del espacio), así que **conserva
--       la unicidad exacta** y destruye el orden: dos referencias consecutivas
--       quedan lejos y nadie deduce el volumen del comercio.
--
--  ③ DETERMINÍSTICA POR INTENTO
--     → se persiste en la fila. Se calcula una vez y jamás se recalcula.
--
--  ④ SE RESUELVE A INTENTO POR TABLA, JAMÁS POR PARSING
--     → columna con UNIQUE + índice. Nunca se lee el string para deducir nada.
--
-- Longitud: prefijo 'EP' + 8 chars base36 = **10** (< 20, con margen).
-- Espacio: 36^8 ≈ 2,8 billones. A 1.000 pagos/día son ~7.700 años de secuencia.
-- ───────────────────────────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS public.seq_deuna_referencia AS bigint
  START WITH 1 INCREMENT BY 1 NO CYCLE;

REVOKE ALL ON SEQUENCE public.seq_deuna_referencia FROM anon, authenticated, PUBLIC;

CREATE OR REPLACE FUNCTION public._deuna_base36(p_n bigint)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE v_d constant text := '0123456789abcdefghijklmnopqrstuvwxyz';
        v_out text := ''; v_n bigint := p_n;
BEGIN
  IF v_n < 0 THEN RAISE EXCEPTION 'base36_negativo'; END IF;
  LOOP
    v_out := substr(v_d, (v_n % 36)::int + 1, 1) || v_out;
    v_n := v_n / 36;
    EXIT WHEN v_n = 0;
  END LOOP;
  RETURN lpad(v_out, 8, '0');   -- ancho fijo ⇒ longitud predecible SIEMPRE
END $$;

CREATE OR REPLACE FUNCTION public.deuna_nueva_referencia()
RETURNS text LANGUAGE plpgsql VOLATILE
SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $$
DECLARE
  -- 36^8 = 2.821.109.907.456 — el tamaño del espacio.
  v_m  constant bigint := 2821109907456;
  -- Coprimo con v_m (v_m = 2^16 · 3^16 ⇒ basta que K no sea divisible por 2 ni 3).
  -- 🔴 K NO ES UN SECRETO y no pretende serlo: su trabajo es romper el ORDEN,
  --    no ocultar la identidad. La referencia no es una credencial — es un
  --    identificador que el proveedor ve entero. Lo que compra es que nadie
  --    lea nuestro volumen de ventas de dos referencias consecutivas.
  --
  -- 🔴 EL PRIMER K QUE ESCRIBÍ ERA 1103515245 Y ESTABA MAL: suma de dígitos 27
  --    ⇒ divisible por 3 ⇒ gcd(K, 36^8) = 243 ⇒ **la transformación NO era
  --    biyectiva** y «única por construcción» habría sido una afirmación falsa.
  --    1103515247 es impar y suma 29 ⇒ gcd = 1 ⇒ permutación exacta.
  v_k  constant bigint := 1103515247;
  v_s  bigint;
BEGIN
  -- 🔴 LA PROPIEDAD SE VERIFICA, NO SE CONFÍA. Si alguien cambia K por uno
  --    "más lindo" y pierde la coprimalidad, la unicidad se cae en silencio:
  --    el UNIQUE recién lo atraparía con un pago real rebotando sin causa
  --    visible, millones de referencias después.
  --    *Basta mirar 2 y 3 porque 36^8 = 2^16 · 3^16 y no tiene otros primos.*
  IF v_k % 2 = 0 OR v_k % 3 = 0 THEN
    RAISE EXCEPTION 'deuna_referencia_k_no_coprimo: K=% comparte factor con 36^8 ⇒ el mapa no es biyectivo', v_k;
  END IF;

  v_s := nextval('public.seq_deuna_referencia');
  IF v_s >= v_m THEN
    -- Fail-closed honesto: agotado el espacio, se corta. Envolver reusaría
    -- referencias vivas y el UNIQUE lo rebotaría igual, pero con un error que
    -- no dice nada. *Que el mensaje nombre la causa real.*
    RAISE EXCEPTION 'deuna_referencia_espacio_agotado';
  END IF;
  RETURN 'EP' || public._deuna_base36((v_s * v_k) % v_m);
END $$;

REVOKE ALL ON FUNCTION public.deuna_nueva_referencia() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public._deuna_base36(bigint)   FROM anon, authenticated, PUBLIC;
-- 🔴 L-140: nace sin EXECUTE para anon/PUBLIC. La llama la edge function con
--    service_role. Un generador de referencias abierto a anon es un contador
--    del negocio que cualquiera puede hacer avanzar.

ALTER TABLE public.pagos_intentos
  ADD COLUMN IF NOT EXISTS referencia_corta text;

ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_referencia_corta_cabe
    CHECK (referencia_corta IS NULL OR length(referencia_corta) < 20);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pagos_intentos_referencia_corta
  ON public.pagos_intentos (referencia_corta)
  WHERE referencia_corta IS NOT NULL;

COMMENT ON COLUMN public.pagos_intentos.referencia_corta IS
  'internalTransactionReference de DeUna (<20). Se resuelve a intento POR ESTA COLUMNA, jamás parseando el string — LETRA_DEUNA §4.';

-- ── CINTURÓN: las cuatro condiciones de §4, probadas, no argumentadas ───────
DO $$
DECLARE v_a text; v_b text; v_n int; v_dup int;
BEGIN
  v_a := deuna_nueva_referencia();
  v_b := deuna_nueva_referencia();

  -- ① longitud
  IF length(v_a) >= 20 THEN RAISE EXCEPTION 'cinturon M3: referencia >= 20 (%)', length(v_a); END IF;
  IF length(v_a) <> length(v_b) THEN RAISE EXCEPTION 'cinturon M3: longitud no es fija'; END IF;

  -- ② no consecutiva: dos seguidas NO pueden diferir sólo en el último char.
  --    🔴 Control declarado: esto verifica que la ofuscación HIZO algo. Sin
  --    él, un K=1 (o un error que lo anule) pasaría inadvertido y estaríamos
  --    exponiendo el contador crudo creyendo que no.
  IF substr(v_a,1,9) = substr(v_b,1,9) THEN
    RAISE EXCEPTION 'cinturon M3: dos referencias seguidas son contiguas — la ofuscacion no aplico (%, %)', v_a, v_b;
  END IF;

  -- ③ unicidad real sobre volumen, con control positivo del instrumento
  SELECT count(*), count(*) - count(DISTINCT r) INTO v_n, v_dup
    FROM (SELECT deuna_nueva_referencia() r FROM generate_series(1,5000)) t;
  IF v_n <> 5000 THEN RAISE EXCEPTION 'cinturon M3: el instrumento no genero 5000 (%)', v_n; END IF;
  IF v_dup <> 0 THEN RAISE EXCEPTION 'cinturon M3: % duplicados en 5000', v_dup; END IF;

  -- ④ 🔴 LA UNICIDAD SE PRUEBA POR LA PROPIEDAD, NO POR LA MUESTRA.
  --    El punto ③ es un verde flojo por sí solo y está MEDIDO que lo es: con
  --    K=1103515245 (gcd 243 con 36^8, mapa NO biyectivo) las 5000 salen
  --    igualmente distintas — la primera colisión llegaría 11.600 millones de
  --    referencias después. **Una muestra chica no puede ver la pérdida de
  --    biyectividad: sólo la aritmética puede.**
  --    Este bloque falla la migración si alguien toca K y rompe la coprimalidad.
  BEGIN
    PERFORM deuna_nueva_referencia();   -- dispara el guard interno de la función
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%k_no_coprimo%' THEN
      RAISE EXCEPTION 'cinturon M3: K no es coprimo con 36^8 — la unicidad NO esta garantizada';
    END IF;
    RAISE;
  END;

  RAISE NOTICE 'cinturon M3 OK: len=% fija · no contiguas (% vs %) · 5000 sin duplicados · K coprimo verificado',
    length(v_a), v_a, v_b;
END $$;
-- ⚠️ El cinturón CONSUME ~5002 valores de la secuencia. Es inofensivo (el
--    espacio son 2,8 billones) pero se declara: quien lea la primera
--    referencia real no va a ver 'EP' seguido del inicio del espacio, y eso
--    NO es un defecto.

-- ── REVERSA M3 ─────────────────────────────────────────────────────────────
--   ⚠️ QUÉ NO DESHACE: dropear la secuencia pierde el punto en que iba. Si ya
--   se emitieron referencias reales y se re-crea desde 1, las nuevas
--   COLISIONAN con las viejas y el UNIQUE las rebota — el pago falla sin causa
--   visible. Revertir esto con referencias vivas exige reposicionar la
--   secuencia con setval, no re-crearla.
-- DROP INDEX IF EXISTS public.uq_pagos_intentos_referencia_corta;
-- ALTER TABLE public.pagos_intentos DROP CONSTRAINT IF EXISTS chk_referencia_corta_cabe;
-- ALTER TABLE public.pagos_intentos DROP COLUMN IF EXISTS referencia_corta;
-- DROP FUNCTION IF EXISTS public.deuna_nueva_referencia();
-- DROP FUNCTION IF EXISTS public._deuna_base36(bigint);
-- DROP SEQUENCE IF EXISTS public.seq_deuna_referencia;


-- ───────────────────────────────────────────────────────────────────────────
-- M4 · **PROPUESTA, NO PEDIDO** — el CHECK de `proveedor`
--
-- Censo (hallazgo 7): `pagos_intentos.proveedor` es text NOT NULL **sin CHECK**,
-- y hoy convive con: nuvei · siembra · simulado · seed_gate.
--
-- 🔴 NO LA REDACTO COMO MIGRACIÓN LISTA, y la razón es que el censo la
--    desaconseja: tres de esos cuatro valores son de fixtures y semillas.
--    Un CHECK cerrado los volvería inexpresables y **rompería arneses ajenos**
--    que no son de mi territorio y que no medí.
--
--    *Cerrar un vocabulario sin censar a sus escritores es exactamente el
--     modo de falla que S101 registró con el REVOKE sin reemplazo.*
--
-- ⇒ Queda como ficha para A: censar quién escribe 'siembra'/'simulado'/
--   'seed_gate' y recién entonces decidir si el CHECK nace cerrado, o si el
--   eje correcto es separar proveedor real de origen de fixture.
--   **DeUna NO necesita esta migración para funcionar** — entra igual.
-- ───────────────────────────────────────────────────────────────────────────
