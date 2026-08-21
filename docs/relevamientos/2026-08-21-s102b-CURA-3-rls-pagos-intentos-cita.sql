-- ═══════════════════════════════════════════════════════════════════════════
-- S102-B · CURA 3 — EL DUEÑO VE SUS INTENTOS DE PAGO DE CITA
--            (la policy que quedó atrás del ensanche de S101)
--
-- 🔴 ESTADO: **PREPARADA Y NO APLICADA.**
-- ORIGEN: relevo 2, punto 4(b).
-- TERRITORIO: la DB es de A. B redacta, A aplica.
--
-- ── EL DEFECTO, medido con discriminador (21-ago) ──────────────────────────
--    S101 llevó el motor de pagos a los cuatro oficios y `pagos_intentos` ganó
--    la columna `cita_id`. **Su policy de SELECT no se enteró:**
--
--        pagos_select : EXISTS (SELECT 1 FROM pedidos p
--                               WHERE p.id = pagos_intentos.pedido_id
--                                 AND p.user_id = auth.uid())
--                       OR is_admin()
--
--    Con `pedido_id` NULL el EXISTS es falso siempre ⇒ solo `is_admin()` ve.
--
--    Población: 34 intentos con `pedido_id` · **7 con `cita_id` y pedido NULL**.
--    Rojo producido con el MISMO usuario, la MISMA tabla, la MISMA consulta:
--        ve intentos de pedido : 33
--        ve intentos de cita   :  0
--
--    **Es fail-closed ⇒ NO es un agujero de seguridad: es un motor sin puerta
--    del lado de la LECTURA.** Y su causa es literalmente la lección que S101
--    escribió y firmó — *agregar un sujeto obliga a censar TODOS los
--    consumidores del evento, no solo la puerta* (L-318). **Acá el consumidor
--    no censado fue una POLICY.**
--
-- ── DECLARACIÓN 76(g) — VEDA: **NO RIGE.** Es un DROP+CREATE de policy. Cero
--    DDL sobre datos, cero backfill, cero snapshot anclado.
-- ═══════════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ ⓪ 🔴 LA TENSIÓN QUE ESTA CURA NO PUEDE RESOLVER SOLA — LEER ANTES DE FIRMAR║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
--
-- **`pagos_intentos` NO REGISTRA QUIÉN PAGÓ.** No hay columna de pagador.
-- Para los pedidos, el dueño se deriva de `pedidos.user_id` (el comprador).
-- Para las citas **no existe equivalente**: hay que derivarlo de la mascota.
--
-- Y eso choca de frente con letra FIRMADA:
--
--   · `LETRA_SALDO` §2 (RIGE, firma founder 19-ago): *«Del usuario que pagó.
--     La plata vuelve a quien la puso, no al hogar ni a la familia.»*
--   · Dictamen de mesa 21-ago (relevo 2, punto 3): *«el pago tiene dueño y el
--     comprobante es del pago.»*
--
-- ⇒ **La lectura coherente es que el INTENTO DE PAGO también es del pagador.**
--   Esta cura no puede implementar eso porque el dato no existe todavía.
--
-- > ### **CURA 3 Y LA CURA DEL COMPROBANTE (dictamen 3) NECESITAN LA MISMA
-- > ### PIEZA QUE FALTA: una columna de PAGADOR. Son la misma cura.**
--
-- **Las dos variantes, con su costo, para que la firma sea informada:**
--
--   VARIANTE A — la de abajo. Deriva el dueño de la mascota vía el helper
--     único de la casa. **Cero schema, reversible, aplicable hoy.**
--     Es MÁS ANCHA que §2: admite a la familia, no solo a quien pagó.
--     ⚖️ **Medido hoy — y por eso es defendible: 7 citas con intento, el helper
--        admite 7 personas, una por cita. CERO personas de más.**
--        *La equivalencia es un HECHO DE DATOS, no una propiedad del diseño.*
--     ☠️ Deja de ser equivalente **la primera familia con dos adultos**.
--
--   VARIANTE B — `pagos_intentos.pagador_user_id`, poblada por el motor de
--     cobro (S101), y la policy pasa a `pagador_user_id = auth.uid()`.
--     **Cumple §2 exactamente y sirve TAMBIÉN al dictamen 3.**
--     Costo: schema + tocar el motor de cobro + un backfill que **no se puede
--     hacer honestamente** — de los 7 intentos vivos no hay registro de quién
--     puso la tarjeta; derivarlo del titular sería inventar el dato que la
--     columna existe para no inventar. *(Salida limpia: la columna nace
--     NULLABLE, el motor la puebla de acá en adelante, y la policy la lee con
--     el fallback de la variante A para las filas viejas — declarado, no
--     silencioso.)*
--
-- **MI VOTO: (B), construida junto con la cura del comprobante, y (A) mientras
-- tanto SI la mesa quiere destrabar la lectura ya.** Razón: son la misma pieza,
-- y aplicar A y después B toca la misma policy dos veces — pero A es
-- reversible, hoy es exactamente equivalente, y no bloquea nada de B.
--
-- **Lo que NO recomiendo es aplicar A y darla por cerrada:** su equivalencia
-- vence sin avisar, y el modo de falla es que alguien vea el intento de pago de
-- otro adulto de su hogar.


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ ① LA REVERSA — ESCRITA ANTES                                              ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
--
-- QUÉ DESHACE: restaura la policy EXACTA de hoy, copiada de `pg_policies` el
--              21-ago-2026 (no re-escrita de memoria).
--
-- ⚠️ QUÉ **NO** DESHACE: nada de datos — esta cura no escribe filas. Revertir
--    devuelve los 7 intentos de cita a ser invisibles para su dueño.

/*  ── REVERSA (no ejecutar salvo que haya que revertir) ──
DROP POLICY IF EXISTS pagos_select ON public.pagos_intentos;

CREATE POLICY pagos_select ON public.pagos_intentos
  FOR SELECT TO authenticated
  USING (
    (EXISTS ( SELECT 1 FROM pedidos p
               WHERE p.id = pagos_intentos.pedido_id
                 AND p.user_id = auth.uid()))
    OR is_admin()
  );

DO $rev$
DECLARE v_q text;
BEGIN
  SELECT qual INTO v_q FROM pg_policies
   WHERE schemaname='public' AND tablename='pagos_intentos' AND policyname='pagos_select';
  IF v_q ILIKE '%cita_id%' THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: la policy sigue nombrando cita_id';
  END IF;
END $rev$;
*/


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ ② LA MIGRACIÓN — VARIANTE A                                               ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

BEGIN;

-- ── Guard de estado: se firmó sobre lo que se midió ────────────────────────
DO $guard$
DECLARE v_q text;
BEGIN
  SELECT qual INTO v_q FROM pg_policies
   WHERE schemaname='public' AND tablename='pagos_intentos' AND policyname='pagos_select';

  IF v_q IS NULL THEN
    RAISE EXCEPTION 'ABORTA: la policy pagos_select no existe. Releer antes de tocar.';
  END IF;
  IF v_q ILIKE '%cita_id%' THEN
    RAISE EXCEPTION 'ABORTA: la policy YA conoce cita_id. Alguien la curó antes — no re-aplicar a ciegas.';
  END IF;
  IF v_q NOT ILIKE '%pedido_id%' THEN
    RAISE EXCEPTION 'ABORTA: la policy no es la medida el 21-ago (no nombra pedido_id): %', v_q;
  END IF;
END $guard$;

DROP POLICY IF EXISTS pagos_select ON public.pagos_intentos;

-- El brazo del pedido queda VERBATIM. El de la cita se AGREGA.
-- *No se re-escribe lo que ya funcionaba: se ensancha.*
CREATE POLICY pagos_select ON public.pagos_intentos
  FOR SELECT TO authenticated
  USING (
    -- ① PEDIDO — intacto, tal cual estaba.
    (EXISTS ( SELECT 1 FROM pedidos p
               WHERE p.id = pagos_intentos.pedido_id
                 AND p.user_id = auth.uid()))
    -- ② CITA — el ensanche de S101 que faltaba.
    --    Se usa el helper ÚNICO de la casa (`_user_es_familia_de_mascota`,
    --    S69: «una sola verdad») y NO se re-implementa el predicado inline.
    --    Tampoco se usa `mascotas.user_id`, que es la columna legacy que D-485
    --    tiene marcada y que está NULL en 51 de 75 mascotas.
    OR (EXISTS ( SELECT 1 FROM evento_cita_servicio c
                  WHERE c.id = pagos_intentos.cita_id
                    AND public._user_es_familia_de_mascota(c.mascota_id, auth.uid())))
    -- ③ ADMIN — intacto.
    OR is_admin()
  );

-- ── CINTURÓN, con DISCRIMINADOR POR BRAZO ──────────────────────────────────
-- Un cinturón que prueba «ahora ve las citas» sin probar «sigue viendo los
-- pedidos» no distingue un ensanche de un reemplazo.
DO $cinturon$
DECLARE v_ped int; v_cita int; v_uid uuid;
BEGIN
  -- Un usuario REAL con intentos de pedido, elegido del dato y no inventado.
  SELECT p.user_id INTO v_uid
    FROM pagos_intentos pi JOIN pedidos p ON p.id = pi.pedido_id
   GROUP BY p.user_id ORDER BY count(*) DESC LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'ABORTA: no hay caso con resultado conocido para discriminar. Un censo que da vacío no prueba nada.';
  END IF;

  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_uid::text, 'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  SELECT count(*) FILTER (WHERE pedido_id IS NOT NULL),
         count(*) FILTER (WHERE cita_id IS NOT NULL AND pedido_id IS NULL)
    INTO v_ped, v_cita
    FROM pagos_intentos;

  RESET ROLE;

  -- BRAZO ①: lo que ya funcionaba, sigue funcionando.
  IF v_ped = 0 THEN
    RAISE EXCEPTION 'ABORTA: se rompió el brazo del PEDIDO (ve 0, antes veía 33).';
  END IF;

  RAISE NOTICE 'CINTURON — pedidos visibles: % · citas visibles: %', v_ped, v_cita;
  RAISE NOTICE 'NOTA: v_cita puede ser 0 si este usuario no tiene citas propias. '
               'El brazo ② se gatea con el usuario dueño de una de las 7 citas con intento.';
END $cinturon$;

COMMIT;


-- ═══════════════════════════════════════════════════════════════════════════
-- ③ EL GATE QUE ESTA MIGRACIÓN **NO** PUEDE CORRER SOLA
-- ═══════════════════════════════════════════════════════════════════════════
--
-- El cinturón de arriba prueba que el brazo del PEDIDO sobrevive. Para probar
-- el brazo de la CITA hace falta el JWT del dueño de una de las 7 citas con
-- intento — dato que se resuelve al aplicar, no al redactar.
--
-- **Discriminador exigido a quien aplique (par antes/después, mismo usuario):**
--
--     antes  →  ve intentos de cita = 0
--     después →  ve intentos de cita ≥ 1
--
-- *Sin el par, el verde no distingue «la cura funcionó» de «este usuario nunca
--  tuvo una cita». Es el mismo estándar con el que se midió el rojo.*
