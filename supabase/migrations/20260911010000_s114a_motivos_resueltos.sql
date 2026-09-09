-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · A10 · UNA definición del conjunto resuelto de motivos por objeto
--
-- POR QUÉ EXISTE, y se escribe acá porque el próximo que la lea va a querer
-- borrarla y escribir su propio SELECT:
--
--   §4 de LETRA_POSTVENTA dice que estadía «hereda las de cita». Esa regla no
--   se depositó como filas duplicadas —duplicarlas habría inventado motivos
--   que la letra no lista— así que vive en el LECTOR. Y va a haber más de un
--   lector: la app de la familia dibuja la lista, y el guard del caso valida
--   el motivo. Dos lectores de la misma regla es dos reglas.
--
-- 🔴 EL ROJO, MEDIDO CONTRA EL CATÁLOGO VIVO ANTES DE ESCRIBIR ESTO — y los
--    dos lectores que salen solos fallan en DIRECCIONES OPUESTAS:
--
--    | caso                  | debería | FK (codigo,objeto) | sólo el código |
--    |-----------------------|---------|--------------------|----------------|
--    | estadia + calidad     | entra   | 🔴 rebota          | entra          |
--    | pedido  + calidad     | rebota  | rebota             | 🔴 ENTRA       |
--    | estadia + otra_cosa   | entra   | 🔴 rebota          | entra          |
--    | cita + inventado_xyz  | rebota  | rebota             | rebota         |
--
--    La FK rechaza la herencia legítima **y se come `otra_cosa`** —el «Es otra
--    cosa · contame» que §4 pone al cierre de TODA lista—, dejando a la familia
--    sin esa salida en estadía y en pedido. El SELECT por código acepta un
--    motivo de cita en un pedido, que es el rojo que la mesa nombró.
--    *Cada uno se ve razonable por separado. Ese es el problema.*
--
-- LA CURA: la pertenencia se PUBLICA UNA VEZ y todos la consumen. Nadie
-- escribe su propio SELECT sobre `cat_motivos_postventa`.
--
-- VEDA 76(g): NO RIGE. DDL aditiva + una fila de catálogo; cero backfill.
-- REVERSA: `docs/relevamientos/S114-A-REVERSA-20260911010000-motivos-resueltos.sql`
--          (escrita ANTES de aplicar; declara que revertir hace divergir a los
--           lectores en silencio, que es peor que el estado previo).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① LA HERENCIA COMO DATO, no como un CASE adentro de una vista ──────────
-- Igual que `cat_transiciones_pedido` y `cat_guarderia_transiciones`: en esta
-- casa las reglas de este tipo son filas. Si mañana el pedido hereda de algo,
-- es un INSERT y no una migración que reescribe una vista.
CREATE TABLE public.cat_motivos_herencia (
  objeto     text NOT NULL,
  hereda_de  text NOT NULL,
  CONSTRAINT cat_motivos_herencia_pkey PRIMARY KEY (objeto, hereda_de),
  CONSTRAINT chk_herencia_objeto    CHECK (objeto    IN ('cita','estadia','pedido')),
  CONSTRAINT chk_herencia_hereda_de CHECK (hereda_de IN ('cita','estadia','pedido')),
  -- Un objeto que hereda de sí mismo duplicaría cada fila en el conjunto
  -- resuelto. No es un error teórico: la vista hace UNION y el duplicado
  -- aparecería en la lista que ve la familia.
  CONSTRAINT chk_herencia_no_refleja CHECK (objeto <> hereda_de)
);

COMMENT ON TABLE public.cat_motivos_herencia IS
  'S114 · La herencia de §4 («estadía hereda las de cita») como DATO. Una fila '
  'por relación. NO es transitiva a propósito: si algún día hicieran falta '
  'cadenas, se hace explícito y se mide — una transitividad implícita es una '
  'lista que crece sin que nadie la haya escrito.';

INSERT INTO public.cat_motivos_herencia (objeto, hereda_de) VALUES ('estadia','cita');

ALTER TABLE public.cat_motivos_herencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY cat_motivos_herencia_lee_autenticado
  ON public.cat_motivos_herencia FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.cat_motivos_herencia FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.cat_motivos_herencia TO authenticated;

-- ── ② LA DEFINICIÓN ÚNICA ──────────────────────────────────────────────────
-- Tres fuentes, un solo lugar donde se suman:
--   (a) los motivos PROPIOS del objeto
--   (b) los HEREDADOS, según la fila de arriba
--   (c) los de `objeto='todos'`, que aplican a todo
--
-- `security_invoker = true` NO es prolijidad: sin él la vista corre con los
-- privilegios de quien la creó y se saltea la RLS de `cat_motivos_postventa`
-- (el hallazgo de S92: cuatro vistas del motor bypasseaban RLS con ACL hasta
-- para `anon`).
CREATE VIEW public.v_motivos_resueltos
WITH (security_invoker = true) AS
  SELECT
    o.objeto            AS objeto_resuelto,
    m.codigo,
    m.objeto            AS objeto_origen,
    m.clase,
    m.urgente,
    m.voz,
    m.pide_foto,
    -- Se dice de dónde sale cada uno: la superficie puede querer separar
    -- «los tuyos» de «los que hereda», y sin esta columna tendría que
    -- deducirlo comparando strings.
    CASE
      WHEN m.objeto = 'todos'  THEN 'universal'
      WHEN m.objeto = o.objeto THEN 'propio'
      ELSE 'heredado'
    END                 AS procedencia
  FROM (VALUES ('cita'),('estadia'),('pedido')) AS o(objeto)
  JOIN public.cat_motivos_postventa m
    ON m.activo                      -- 🔴 el conjunto resuelto es de motivos VIVOS:
                                     -- no se abre un caso con un motivo retirado
   AND (
        m.objeto = o.objeto                                    -- (a) propios
     OR m.objeto = 'todos'                                     -- (c) universales
     OR EXISTS (SELECT 1 FROM public.cat_motivos_herencia h    -- (b) heredados
                 WHERE h.objeto = o.objeto AND h.hereda_de = m.objeto)
   );

COMMENT ON VIEW public.v_motivos_resueltos IS
  'S114 · A10 · LA definición del conjunto de motivos de un objeto. Propios + '
  'heredados (cat_motivos_herencia) + universales (objeto=''todos''), sólo los '
  'activos. 🔴 NADIE escribe su propio SELECT sobre cat_motivos_postventa: la '
  'lista de la app y el guard del caso leen de acá, para que no puedan divergir. '
  'Medido antes de existir: la FK (codigo,objeto) rechaza la herencia Y otra_cosa; '
  'el SELECT por código acepta un motivo de cita en un pedido.';

REVOKE ALL ON public.v_motivos_resueltos FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.v_motivos_resueltos TO authenticated;

-- ── ③ EL PREDICADO, sobre la MISMA definición ──────────────────────────────
-- El guard del caso cuelga de acá y no de una copia. Si mañana cambia la
-- herencia, cambia la fila, y la lista y el guard se mueven JUNTOS.
CREATE FUNCTION public._motivo_pertenece_al_objeto(p_codigo text, p_objeto text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
  -- PERTENENCIA, no coincidencia: se pregunta por el conjunto resuelto.
  -- COALESCE porque con `p_codigo` o `p_objeto` en NULL el EXISTS da NULL, y
  -- un guard que devuelve NULL no es un booleano: acierta por cómo trata SQL
  -- a los nulos y deja de acertar el día que alguien lo niega o lo compone
  -- con un OR (la lección de `_nuvei_status_detail_es_reverso`).
  SELECT COALESCE(
    EXISTS (SELECT 1 FROM public.v_motivos_resueltos v
             WHERE v.objeto_resuelto = p_objeto
               AND v.codigo          = p_codigo),
    false);
$fn$;

COMMENT ON FUNCTION public._motivo_pertenece_al_objeto(text, text) IS
  'S114 · A10 · El guard del caso. PERTENECE al conjunto resuelto, jamás '
  '«coincide con la columna objeto». Fail-closed: NULL ⇒ false.';

-- L-140: toda función nace sin EXECUTE para anon y PUBLIC.
REVOKE ALL ON FUNCTION public._motivo_pertenece_al_objeto(text, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._motivo_pertenece_al_objeto(text, text) TO authenticated;

-- ── CINTURÓN · el verde, sobre los MISMOS cuatro casos del rojo ────────────
DO $cinturon$
DECLARE
  v_n int; v_dup int;
  r record;
  v_fallos text := '';
BEGIN
  -- Los cuatro casos del rojo, ahora contra el predicado.
  FOR r IN
    SELECT * FROM (VALUES
      ('estadia','calidad',       true),
      ('pedido', 'calidad',       false),
      ('estadia','otra_cosa',     true),
      ('cita',   'inventado_xyz', false),
      -- y dos más que el rojo no cubría
      ('cita',   'calidad',       true),   -- propio
      ('pedido', 'no_entregado',  true)    -- propio del otro objeto
    ) AS t(objeto, codigo, esperado)
  LOOP
    IF public._motivo_pertenece_al_objeto(r.codigo, r.objeto) <> r.esperado THEN
      v_fallos := v_fallos || format(' %s+%s(esperaba %s)', r.objeto, r.codigo, r.esperado);
    END IF;
  END LOOP;
  IF v_fallos <> '' THEN
    RAISE EXCEPTION 'CINTURÓN: el predicado falla en:%', v_fallos;
  END IF;

  -- Fail-closed con NULL, probado y no supuesto.
  IF public._motivo_pertenece_al_objeto(NULL, 'cita') IS NOT FALSE
     OR public._motivo_pertenece_al_objeto('calidad', NULL) IS NOT FALSE THEN
    RAISE EXCEPTION 'CINTURÓN: el predicado no es fail-closed con NULL';
  END IF;

  -- El conjunto resuelto no duplica: `otra_cosa` una vez por objeto y no más.
  SELECT count(*) INTO v_dup FROM public.v_motivos_resueltos WHERE codigo='otra_cosa';
  IF v_dup <> 3 THEN
    RAISE EXCEPTION 'CINTURÓN: `otra_cosa` aparece % veces, deben ser 3 (una por objeto)', v_dup;
  END IF;

  -- Tamaños: cita 9+1=10 · estadia 2+9+1=12 · pedido 7+1=8
  SELECT count(*) INTO v_n FROM public.v_motivos_resueltos WHERE objeto_resuelto='cita';
  IF v_n <> 10 THEN RAISE EXCEPTION 'CINTURÓN: cita resuelve % motivos, esperaba 10', v_n; END IF;
  SELECT count(*) INTO v_n FROM public.v_motivos_resueltos WHERE objeto_resuelto='estadia';
  IF v_n <> 12 THEN RAISE EXCEPTION 'CINTURÓN: estadia resuelve % motivos, esperaba 12', v_n; END IF;
  SELECT count(*) INTO v_n FROM public.v_motivos_resueltos WHERE objeto_resuelto='pedido';
  IF v_n <>  8 THEN RAISE EXCEPTION 'CINTURÓN: pedido resuelve % motivos, esperaba 8', v_n; END IF;

  -- CONTROL POSITIVO DEL PROPIO CINTURÓN: si el predicado fuera constante
  -- —dijera true a todo o false a todo— los seis casos de arriba no podrían
  -- haber pasado, porque hay tres que esperan true y tres que esperan false.
  -- Se deja escrito: un arnés cuyos casos esperan todos lo mismo no discrimina.

  RAISE NOTICE 'CINTURÓN VERDE · 6 casos (3 true, 3 false) · fail-closed con NULL · cita=10 estadia=12 pedido=8 · otra_cosa x3';
END $cinturon$;
