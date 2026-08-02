-- S84-A9 (b) · LA PROMOCIÓN MECÁNICA — antepone '+' SOLO donde el propio
-- número ya trae su indicativo. Firmada 2-ago-2026.
--
-- ── VA DESPUÉS DE (a′), Y EL ORDEN ES LA DECISIÓN ────────────────────
-- (a′) —la pantalla proponiendo el país— ya está commiteada (`56ac016`).
-- **Si esta migración corriera primero, las filas quedarían curadas y el
-- bug de la pantalla se volvería INVISIBLE** hasta que apareciera un dato
-- legado nuevo, cuando nadie recuerde por qué. (a′) cura la CAUSA; esto
-- cura los DATOS. Una sola de las dos deja la mitad viva.
--
-- ── QUÉ HACE, Y POR QUÉ NO ES INFERIR ────────────────────────────────
-- Antepone `+` **únicamente si el valor ya empieza con el prefijo de un
-- país del catálogo** (greedy por el MÁS LARGO — el mismo criterio que
-- `normalizar_telefono` usa en su rama internacional, `ORDER BY length
-- DESC`: se espeja, no se inventa).
--
-- **El indicativo no se agrega: ya estaba escrito en el número.** Lo que
-- se agrega es el `+`, que es notación. P21 prohíbe DERIVAR el país del
-- `country_code`; acá el país sale del **propio valor**, no del perfil.
--
-- **Y la fila del seed cae sola del lado de "no se toca"**, sin nombrarla:
-- `3208408790` no empieza con ningún prefijo del catálogo, así que el
-- WHERE no la alcanza. *La regla la excluye por su forma, no por una
-- excepción escrita a mano — que es lo que la hace auditable.*
--
-- ── EL GUARD QUE EVITA EL FALSO POSITIVO (espejo del de la pantalla) ──
-- Un número NACIONAL puede empezar por casualidad con los dígitos de un
-- prefijo. Igual que en (a′), **solo se promueve si el país DECLARA su
-- `formato_telefono` y el E.164 resultante lo CUMPLE**. Los 14 países sin
-- formato declarado NO se promueven: inventarles una regla sería el dato
-- inventado de L-180.
--
-- 76(g): **RIGE** — esto ESCRIBE. Alcance declarado: `prestadores`,
-- columnas `telefono` y `whatsapp`, solo filas que cumplan el predicado.
-- Anclas literales medidas ANTES, y verificadas fila por fila DESPUÉS.
-- REVERSA: `docs/relevamientos/2026-08-02-s84a-REVERSA-promocion-e164.sql`
-- — y ahí se declara que revertir NO es simétrico (ver su cabecera).

BEGIN;

-- ── ① El resolvedor del prefijo, como CTE reusable ────────────────────
CREATE TEMP TABLE _promocion AS
WITH candidatos AS (
  SELECT p.id,
         'whatsapp'::text AS col,
         p.whatsapp       AS valor,
         cp.codigo_iso2,
         cp.prefijo_telefono,
         cp.formato_telefono,
         length(regexp_replace(cp.prefijo_telefono, '\D', '', 'g')) AS largo_pref
    FROM public.prestadores p
    JOIN public.cat_paises cp
      ON p.whatsapp ~ ('^' || regexp_replace(cp.prefijo_telefono, '\D', '', 'g'))
   WHERE p.whatsapp <> '' AND p.whatsapp !~ '^\+'
  UNION ALL
  SELECT p.id, 'telefono', p.telefono, cp.codigo_iso2, cp.prefijo_telefono,
         cp.formato_telefono,
         length(regexp_replace(cp.prefijo_telefono, '\D', '', 'g'))
    FROM public.prestadores p
    JOIN public.cat_paises cp
      ON p.telefono ~ ('^' || regexp_replace(cp.prefijo_telefono, '\D', '', 'g'))
   WHERE p.telefono IS NOT NULL AND p.telefono <> '' AND p.telefono !~ '^\+'
),
mejor AS (
  SELECT DISTINCT ON (id, col) id, col, valor, codigo_iso2, formato_telefono,
         '+' || valor AS propuesto
    FROM candidatos
   ORDER BY id, col, largo_pref DESC   -- greedy: el prefijo MÁS LARGO gana
)
SELECT * FROM mejor
 -- el guard: solo si el país DECLARA formato y el resultado lo CUMPLE
 WHERE formato_telefono IS NOT NULL
   AND formato_telefono <> ''
   AND propuesto ~ formato_telefono;

-- ── ② La foto ANTES (76(g): las anclas, medidas y no recordadas) ──────
DO $$
DECLARE r record; v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM _promocion;
  RAISE NOTICE 'filas a promover: %', v_n;
  FOR r IN SELECT * FROM _promocion LOOP
    RAISE NOTICE '  % · % : % → % (%)', r.id, r.col, r.valor, r.propuesto, r.codigo_iso2;
  END LOOP;
END $$;

-- ── ③ La escritura ────────────────────────────────────────────────────
UPDATE public.prestadores p
   SET whatsapp = m.propuesto
  FROM _promocion m
 WHERE p.id = m.id AND m.col = 'whatsapp';

UPDATE public.prestadores p
   SET telefono = m.propuesto
  FROM _promocion m
 WHERE p.id = m.id AND m.col = 'telefono';

-- ── ④ CINTURÓN (L-192) — y el que importa: VALIDATE CONSTRAINT ────────
DO $$
DECLARE v_sucias int; v_seed int;
BEGIN
  -- ninguna fila promovida quedó fuera de E.164
  SELECT count(*) INTO v_sucias
    FROM public.prestadores p JOIN _promocion m ON m.id = p.id
   WHERE (m.col='whatsapp' AND p.whatsapp !~ '^\+[1-9][0-9]{6,14}$')
      OR (m.col='telefono' AND p.telefono !~ '^\+[1-9][0-9]{6,14}$');
  IF v_sucias <> 0 THEN RAISE EXCEPTION 'quedaron % promovidas fuera de E.164', v_sucias; END IF;

  -- LA FILA DEL SEED SIGUE INTACTA — se verifica, no se confía en el WHERE.
  SELECT count(*) INTO v_seed FROM public.prestadores
   WHERE whatsapp = '3208408790';
  IF v_seed <> 1 THEN
    RAISE EXCEPTION 'la fila sin indicativo fue tocada (esperada 1, hay %)', v_seed;
  END IF;
END $$;

-- ⑤ EL CIERRE DE D-619 — si esto corre, no queda pasado ilegal. Y si
-- aborta, DICE cuántas faltan en vez de dejar el constraint mintiendo
-- `NOT VALID` para siempre.
-- ⚠️ Se espera que ABORTE mientras la fila del seed siga sin indicativo:
-- ese es su trabajo. Por eso va en su propio bloque, capturado y hablado.
DO $$
BEGIN
  ALTER TABLE public.prestadores VALIDATE CONSTRAINT chk_prestadores_whatsapp_e164;
  ALTER TABLE public.prestadores VALIDATE CONSTRAINT chk_prestadores_telefono_e164;
  RAISE NOTICE 'VALIDATE OK — los dos constraints quedan validados. D-619 muere.';
EXCEPTION WHEN check_violation THEN
  RAISE NOTICE 'VALIDATE rebotó: queda pasado que no cumple (esperado: la fila del seed sin indicativo). D-619 SIGUE ABIERTA.';
END $$;

DROP TABLE _promocion;

COMMIT;
