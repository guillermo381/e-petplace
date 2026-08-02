-- S84-A6 · EL CLIP GANA SU LECTURA — `GRANT SELECT (clip_url)`
--
-- ── LO QUE SE MIDIÓ, Y CORRIGE UNA AFIRMACIÓN DE LA SESIÓN ANTERIOR ──
-- S84-A5 declaró que `clip_url` *"nació sin grant"*. **Medido, es más
-- preciso y distinto:**
--   · `anon` y `authenticated` **SÍ** tienen INSERT/UPDATE/REFERENCES —
--     los heredó de los **7 grants de TABLA** que `prestadores` ya tenía.
--   · Lo que le falta es **`authenticated:SELECT`**, que en esta tabla se
--     concede **por COLUMNA, con lista explícita** (privilegios por
--     columna, estrenados en S79).
-- ⇒ **La regla de la casa SÍ operó** (*toda columna nueva de `prestadores`
--   nace sin grant*): la columna quedó fuera de esa lista. Lo impreciso
--   fue decir "sin grant" a secas. *Se registra porque afirmar sobre un
--   privilegio sin medirlo es exactamente la candidata #17.*
--
-- ── LA PRUEBA DE QUE ES LA REGLA Y NO UN OLVIDO ──────────────────────
-- Las columnas de `prestadores` SIN `authenticated:SELECT` son
-- **exactamente TRES**: `clip_url`, `direccion_envio` y `proposito`.
-- **Las otras dos son de S79 y están así A PROPÓSITO** — se sirven por
-- RPC (`registrar_primer_ingreso` devuelve el propósito), no por SELECT
-- directo. El patrón es deliberado y esta migración lo respeta: **se
-- concede SOLO lo que hace falta, y solo a `authenticated`.**
--
-- ── POR QUÉ `clip_url` SÍ NECESITA SELECT (y las otras dos no) ────────
-- El clip **se pinta en la vitrina y en el propio perfil**: el prestador
-- tiene que ver el que ya subió para decidir si lo reemplaza. No hay RPC
-- que lo sirva ni tiene sentido crear una para un campo de texto — es
-- lectura directa, como `foto_url`.
--
-- ── LO QUE ESTA MIGRACIÓN **NO** HACE, Y ES DECISIÓN ──────────────────
-- **NO le quita a `anon` lo que heredó.** Medido: **las 39 columnas de
-- `prestadores` tienen grants para `anon`**, y vienen de **7 grants de
-- TABLA**, no de la columna. Revocar solo `clip_url` sería **cura de
-- sitio sobre un problema de causa** (L-185) y dejaría la tabla igual de
-- abierta con una excepción que nadie podría explicar. **Se registra
-- entero como D-621** y se cura donde vive, con su censo de consumidores.
--
-- 76(g): NO RIGE — solo privilegios.
-- REVERSA: `REVOKE SELECT (clip_url) ON public.prestadores FROM authenticated;`

BEGIN;

GRANT SELECT (clip_url) ON public.prestadores TO authenticated;

-- ── CINTURÓN (L-192): que el grant exista, y que NO se haya ensanchado ─
DO $$
DECLARE v_sel int; v_anon_nuevo int;
BEGIN
  SELECT count(*) INTO v_sel FROM information_schema.column_privileges
   WHERE table_schema='public' AND table_name='prestadores'
     AND column_name='clip_url' AND grantee='authenticated' AND privilege_type='SELECT';
  IF v_sel <> 1 THEN RAISE EXCEPTION 'clip_url sigue sin SELECT para authenticated'; END IF;

  -- las otras dos NO se tocaron: si esta migración las hubiera barrido
  -- "de paso", habría abierto dos columnas que S79 cerró a propósito.
  SELECT count(*) INTO v_sel FROM information_schema.column_privileges
   WHERE table_schema='public' AND table_name='prestadores'
     AND column_name IN ('direccion_envio','proposito')
     AND grantee='authenticated' AND privilege_type='SELECT';
  IF v_sel <> 0 THEN RAISE EXCEPTION 'se ensanchó a direccion_envio/proposito: %', v_sel; END IF;

  -- y anon no ganó nada nuevo por esta migración (sigue con lo heredado,
  -- que es D-621 y se cura en su ficha, no acá)
  SELECT count(*) INTO v_anon_nuevo FROM information_schema.column_privileges
   WHERE table_schema='public' AND table_name='prestadores'
     AND column_name='clip_url' AND grantee='anon' AND privilege_type='SELECT';
  IF v_anon_nuevo > 1 THEN RAISE EXCEPTION 'anon ganó privilegios nuevos'; END IF;
END $$;

COMMIT;
