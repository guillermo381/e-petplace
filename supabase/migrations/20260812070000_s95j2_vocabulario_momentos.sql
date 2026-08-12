-- ═══════════════════════════════════════════════════════════════════════════
-- S95-J2 · `momentos_aplicables` SE CIERRA CONTRA LA ETAPA ETARIA
--
-- Firma del founder: **`cachorro` · `joven` · `adulto` · `senior`.**
-- **M1–M6 NO entra al catálogo de productos.** Se queda donde está: en el
-- expediente.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- 🔴 EL PORQUÉ, ESCRITO ACÁ Y NO SOLO EN UN REPORTE
--
-- S95-J midió que hay DOS vocabularios vivos y frenó, porque **no son dos
-- versiones del mismo eje** — son dos ejes distintos:
--   · `calcular_etapa_vida()` → cachorro | joven | adulto | senior |
--     desconocida. **Puramente etario.**
--   · `cat_especies_perfil.momentos_vitales_jsonb` → M1…M6, y **dos de sus
--     momentos no dependen de la edad**: `M4_disparador = condicion_cronica`,
--     `M6_disparador = fin_vida_marcado`.
--
-- Se eligió la etapa etaria por TRES razones, y la primera es la que decide:
--
--   ① **UN PRODUCTO NO PUEDE DECLARARSE «PARA EL MOMENTO M6».** M6 es
--      memorial, y `MODELO_LOYALTY` §7.1 apaga TODO el motor en memorial —
--      cero hitos, cero rachas, cero beneficios, cero menciones. Un alimento
--      etiquetado para fin de vida es exactamente lo que ese artículo
--      prohíbe. *Y el apagado es estructural, no un filtro de pantalla.*
--
--   ② **M4 —condición crónica— ya está mejor cubierto** por la exclusión dura
--      por condición y alergia (`MODELO_DESPENSA` §6), que es MÁS PRECISA que
--      un momento: excluye por la condición documentada, no por la etapa.
--
--   ③ **Son dos ejes con dueños distintos.** M1–M6 es el eje del VÍNCULO con
--      la mascota; la etapa etaria es el eje del PRODUCTO. Mezclarlos obligaría
--      a un fabricante a hablar el idioma del expediente, y **ningún fabricante
--      rotula sus bolsas así.**
--
-- *El próximo que vea dos vocabularios vivos va a querer saber por qué se
-- eligió éste, y `M6 = memorial` no se deduce leyendo el esquema.*
--
-- ═══════════════════════════════════════════════════════════════════════════
-- 🔴 QUÉ PASA CON `desconocida` — LA PREGUNTA QUE EL BRIEF PIDIÓ RESOLVER
--
-- MEDIDO EJECUTANDO la función (no leyendo su cuerpo): devuelve CINCO valores,
-- y `desconocida` es uno de ellos — sale cuando la mascota no tiene fecha de
-- nacimiento.
--
-- **`desconocida` NO entra al CHECK**, y la razón es que las dos columnas
-- hablan de cosas distintas:
--   · `calcular_etapa_vida()` describe **A LA MASCOTA**: en qué etapa está, o
--     que no lo sabemos.
--   · `momentos_aplicables` describe **AL PRODUCTO**: para qué etapa sirve.
--
-- **Un alimento «para etapa desconocida» no significa nada.** Y lo que esa
-- declaración querría decir —«sirve para cualquier etapa»— **ya tiene su
-- forma**: el array VACÍO, que además es el DEFAULT. La misma convención que
-- `tallas_aplicables` cerró en S95-J.
--
-- ⚠️ EL RIESGO QUE ESTO DEJA, DECLARADO: si alguien escribiera
-- `momentos_aplicables = ARRAY[calcular_etapa_vida(...)]` para una mascota sin
-- fecha, el CHECK va a rebotar. **Ese rebote es CORRECTO** —es un error de
-- categoría: se estaría metiendo el estado de una mascota adentro de la
-- declaración de un producto— pero quien lo vea sin este comentario va a creer
-- que el CHECK está mal. Por eso queda escrito.
--
-- Y del lado del match, cuando la recomendación filtre por etapa: una mascota
-- `desconocida` va a ver **solo los productos sin etapa declarada**. Es la
-- respuesta honesta — no sabemos su etapa, así que no le ofrecemos nada que
-- dependa de ella.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- Reversa (escrita, verificada en disco y LEÍDA antes de aplicar):
--   scripts/s95/2026-08-12-s95j2-REVERSA.sql
--   *En S95-J la reversa se escribió después porque un heredoc falló en
--   silencio dentro de un comando encadenado. Acá se hizo en pasos separados.*
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- **NO RIGE.** `productos` tiene CERO filas y CERO con momento declarado
-- (medido), así que el CHECK no puede chocar con dato existente y no hay
-- backfill. **Y eso es lo que lo hace barato HOY:** con el catálogo cargado,
-- el mismo CHECK sería una migración con limpieza de datos atrás.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 🔴 CONTENCIÓN (`<@`), NO SOLAPAMIENTO (`&&`). Es el hallazgo ② de S95-J
--    aplicado: con `&&` bastaba UN valor válido para que pasara la fila
--    entera, así que `['adulto','M6']` habría entrado. **Vocabulario cerrado
--    en apariencia, basura adentro** — y justamente el valor que la razón ①
--    existe para impedir.
ALTER TABLE public.productos
  ADD CONSTRAINT chk_productos_momentos_aplicables
  CHECK (momentos_aplicables <@ ARRAY['cachorro','joven','adulto','senior']::text[]);

COMMENT ON COLUMN public.productos.momentos_aplicables IS
  'S95-J2 · Vocabulario CERRADO contra la ETAPA ETARIA (cachorro/joven/adulto/'
  'senior), el mismo eje que produce `calcular_etapa_vida()`. M1–M6 NO entra: '
  'es el eje del VÍNCULO y vive en el expediente — y M6 es memorial, que '
  'MODELO_LOYALTY §7.1 apaga entero. `desconocida` tampoco entra: describe a la '
  'MASCOTA, no al producto; «sirve para cualquier etapa» se dice con el array '
  'VACÍO, que es el default.';

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN · el inválido rebota, la mezcla rebota, los válidos pasan
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v_ok boolean; v_prod uuid; v_n int; v_antes int; v_etapas text[];
BEGIN
  SELECT count(*) INTO v_antes FROM productos;

  -- ── A · 🔴 EL CASO QUE DECIDE: `M6` NO ENTRA ─────────────────────────────
  v_ok := true;
  BEGIN
    INSERT INTO productos (nombre, familia_codigo, estado, momentos_aplicables)
    VALUES ('__cint_s95j2_m6', 'alimento', 'activo', ARRAY['M6']::text[]);
  EXCEPTION WHEN check_violation THEN v_ok := false; END;
  IF v_ok THEN
    RAISE EXCEPTION 'ABORTA: entró un producto «para M6» — memorial, que MODELO_LOYALTY §7.1 apaga entero.';
  END IF;

  -- ── A2 · LA MEZCLA TAMBIÉN REBOTA — el discriminador del operador ────────
  -- Con `&&` en vez de `<@` esta fila PASARÍA, y sería la puerta de M6 por el
  -- costado. Sin este caso, el CHECK parecería correcto estando mal.
  v_ok := true;
  BEGIN
    INSERT INTO productos (nombre, familia_codigo, estado, momentos_aplicables)
    VALUES ('__cint_s95j2_mixto', 'alimento', 'activo', ARRAY['adulto','M6']::text[]);
  EXCEPTION WHEN check_violation THEN v_ok := false; END;
  IF v_ok THEN
    RAISE EXCEPTION 'ABORTA: entró [adulto, M6] — el CHECK usa solapamiento y deja pasar M6 por el costado.';
  END IF;

  -- ── A3 · `desconocida` rebota, por la decisión escrita arriba ────────────
  v_ok := true;
  BEGIN
    INSERT INTO productos (nombre, familia_codigo, estado, momentos_aplicables)
    VALUES ('__cint_s95j2_desc', 'alimento', 'activo', ARRAY['desconocida']::text[]);
  EXCEPTION WHEN check_violation THEN v_ok := false; END;
  IF v_ok THEN
    RAISE EXCEPTION 'ABORTA: entró un producto «para etapa desconocida», que no significa nada.';
  END IF;

  -- ── B · CONTRA-CASO: las cuatro válidas SÍ entran ────────────────────────
  INSERT INTO productos (nombre, familia_codigo, estado, momentos_aplicables)
  VALUES ('__cint_s95j2_bueno', 'alimento', 'activo',
          ARRAY['cachorro','joven','adulto','senior']::text[])
  RETURNING id INTO v_prod;
  IF v_prod IS NULL THEN
    RAISE EXCEPTION 'ABORTA: se cerró de más — las cuatro etapas válidas no entran.';
  END IF;
  DELETE FROM productos WHERE id = v_prod;

  -- ── C · CONTRA-CASO: el array VACÍO sigue siendo legal ───────────────────
  -- Es el DEFAULT y significa «sirve para cualquier etapa». Si el CHECK lo
  -- rechazara, ningún producto sin etapa declarada podría cargarse — o sea,
  -- casi todos.
  INSERT INTO productos (nombre, familia_codigo, estado)
  VALUES ('__cint_s95j2_vacio', 'alimento', 'activo')
  RETURNING id INTO v_prod;
  IF v_prod IS NULL THEN
    RAISE EXCEPTION 'ABORTA: un producto sin etapa declarada no entra.';
  END IF;
  DELETE FROM productos WHERE id = v_prod;

  -- ── D · EL VOCABULARIO NO SE INVENTÓ: es el que la función PRODUCE ───────
  -- Se ejecuta `calcular_etapa_vida()` contra cuatro fechas que caen en cada
  -- rama y se exige que devuelva exactamente estos cuatro. Si alguien cambia
  -- la función y no este CHECK, los dos dejan de decir lo mismo y la
  -- recomendación empieza a fallar en silencio.
  SELECT array_agg(DISTINCT e ORDER BY e) INTO v_etapas FROM (
    SELECT calcular_etapa_vida(current_date - 30,   'perro') e
    UNION SELECT calcular_etapa_vida(current_date - 730,  'perro')
    UNION SELECT calcular_etapa_vida(current_date - 1825, 'perro')
    UNION SELECT calcular_etapa_vida(current_date - 4380, 'perro')
  ) s;
  IF v_etapas <> ARRAY['adulto','cachorro','joven','senior']::text[] THEN
    RAISE EXCEPTION 'ABORTA: `calcular_etapa_vida` ya no produce las cuatro etapas del CHECK, produce %. El vocabulario del producto quedaría divergente del de la mascota.', v_etapas;
  END IF;

  -- ── E · y `desconocida` SIGUE siendo un valor que la casa produce ────────
  -- No se prohíbe que exista: se prohíbe que un PRODUCTO lo declare. Si la
  -- función dejara de producirlo, la decisión de arriba habría cambiado de
  -- premisa y hay que releerla.
  IF calcular_etapa_vida(NULL::date, 'perro') <> 'desconocida' THEN
    RAISE EXCEPTION 'ABORTA: `calcular_etapa_vida` ya no devuelve «desconocida» sin fecha — la premisa de la decisión cambió.';
  END IF;

  SELECT count(*) INTO v_n FROM productos;
  IF v_n <> v_antes THEN
    RAISE EXCEPTION 'ABORTA 76(g): productos quedó en % y arrancó en %.', v_n, v_antes;
  END IF;

  RAISE NOTICE 'CINTURÓN S95-J2: M6 rebota, la mezcla rebota, desconocida rebota, las cuatro pasan, el vacío sigue legal. Residuo 0.';
END $$;

COMMIT;
