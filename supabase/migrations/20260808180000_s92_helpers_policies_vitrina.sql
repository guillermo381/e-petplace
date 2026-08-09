-- ══════════════════════════════════════════════════════════════════════════
-- S92-A · D-700 · LOS DOS HELPERS + LAS CINCO POLICIES DE VITRINA
--
-- Nacen los helpers que D-700 pidió y se migra la primera tanda de policies:
-- las cinco de VITRINA, que son homogéneas (todas preguntan «¿este prestador
-- está activo?») y de bajo riesgo (lectura pública de la vitrina).
--
-- ── DECLARACIÓN 76(g) · VEDA ──────────────────────────────────────────────
-- **NO RIGE.** DDL aditivo (dos funciones nuevas) + reemplazo de policies. No
-- hay backfill; la verificación es funcional sobre filas vivas pero **no ancla
-- snapshots**: compara contra el baseline que ya se tomó y guardó en disco
-- (`scripts/s92/salida/b2-baseline-antes.json`), así que una escritura del
-- founder durante la ventana no invalida nada — cambiaría el conteo, no el
-- veredicto (que es «el titular ve lo suyo y el ajeno no ve lo ajeno»).
--
-- ── POR QUÉ DOS HELPERS Y NO UNO, y por qué NINGUNO ES `user_gestiona_prestador`
-- El censo de las 29 policies con predicado crudo (`scripts/s92/b2-anatomia-policies.mjs`)
-- encontró DOS predicados distintos, no uno:
--   (A) «este prestador es MÍO»   → `... WHERE user_id = auth.uid()`   (24 usos)
--   (B) «este prestador está ACTIVO» → `... WHERE estado = 'activo'`    (5 usos)
-- Un helper único solo sirve si el predicado es el mismo; acá son dos, así que
-- son dos, cada uno con UN propósito.
--
-- **Y `user_gestiona_prestador` NO se reusa, aunque es el molde de la casa y
-- estaba ahí:** su cuerpo es titular **OR administrador OR is_admin**. Sustituir
-- con él el predicado «soy el titular» **AMPLIARÍA el acceso** — un
-- administrador de negocio pasaría a ver bonos, estadías y suscripciones que
-- hoy solo ve el titular. *Un helper de seguridad que ensancha en silencio es
-- peor que el predicado crudo que reemplaza*, y ampliar es el primer freno del
-- arranque. Por eso nace `es_mi_prestador`, con la semántica EXACTA.
--
-- ── LA AUDIENCIA DE LOS HELPERS, decidida y no heredada ───────────────────
-- EXECUTE para `authenticated` **y `anon`**. No es descuido: tres de las
-- policies que los van a usar (en la tanda siguiente) tienen rol `{public}`, y
-- una policy `{public}` evaluada por `anon` que llame a una función sin EXECUTE
-- **falla con 42501 en vez de devolver vacío**. Es el mismo criterio con el que
-- `is_admin` queda abierta (ver `20260808170000`): un helper de policy es
-- infraestructura de policy. Sin sesión devuelven `false`, no filas.
--
-- Reversa: `docs/relevamientos/2026-08-08-s92a-REVERSA-tanda3-helpers-y-vitrina.sql`
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ① LOS HELPERS ─────────────────────────────────────────────────────────

/**
 * ¿El prestador `p_prestador_id` es del usuario de la sesión?
 *
 * SECURITY DEFINER a propósito: es lo que **desata la policy de los grants de
 * columna de `prestadores`**. Con el `EXISTS` crudo, la policy lee la tabla con
 * los permisos del consultante, así que un REVOKE sobre `user_id` o `id` la
 * rompe — que es exactamente D-700 y L-215. Acá la lectura ocurre con los
 * permisos del dueño de la función y la policy deja de depender de ellos.
 *
 * SEMÁNTICA EXACTA del predicado que reemplaza: SOLO el titular. Ni
 * administrador ni admin de plataforma — para eso está `user_gestiona_prestador`,
 * que es OTRA pregunta.
 */
CREATE OR REPLACE FUNCTION public.es_mi_prestador(p_prestador_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.prestadores p
    WHERE p.id = p_prestador_id
      AND p.user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.es_mi_prestador(uuid) IS
  'S92/D-700 · ¿el prestador es del usuario de la sesión? SOLO titular (no administrador, no is_admin: eso es user_gestiona_prestador). DEFINER para que la policy no dependa de los grants de columna de prestadores.';

/**
 * ¿El prestador está activo? — el predicado de VITRINA.
 * Mismo motivo para el DEFINER: hoy estas policies dependen de poder leer la
 * columna `estado` de `prestadores`, y esa dependencia es invisible desde la
 * pantalla que se rompe.
 */
CREATE OR REPLACE FUNCTION public.prestador_activo(p_prestador_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.prestadores p
    WHERE p.id = p_prestador_id
      AND p.estado = 'activo'
  );
$$;

COMMENT ON FUNCTION public.prestador_activo(uuid) IS
  'S92/D-700 · ¿el prestador está activo? Predicado de vitrina. DEFINER para desatar la policy de los grants de columna de prestadores.';

-- La audiencia, ESCRITA (y no heredada del default — que es toda la lección de D-701).
REVOKE ALL ON FUNCTION public.es_mi_prestador(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prestador_activo(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.es_mi_prestador(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.prestador_activo(uuid) TO authenticated, anon;

-- ── ② LAS CINCO POLICIES DE VITRINA ───────────────────────────────────────
-- Cada una conserva su rol, su comando y su semántica; lo único que cambia es
-- que el predicado deja de leer la tabla con los permisos del consultante.

DROP POLICY IF EXISTS prestador_especialidades_public ON public.prestador_especialidades;
CREATE POLICY prestador_especialidades_public ON public.prestador_especialidades
  FOR SELECT TO authenticated
  USING (public.prestador_activo(prestador_id) OR is_admin());

DROP POLICY IF EXISTS ph_public ON public.prestador_horarios;
CREATE POLICY ph_public ON public.prestador_horarios
  FOR SELECT TO authenticated
  USING ((activo = true AND public.prestador_activo(prestador_id)) OR is_admin());

DROP POLICY IF EXISTS ps_public ON public.prestador_servicios;
CREATE POLICY ps_public ON public.prestador_servicios
  FOR SELECT TO authenticated
  USING ((activo = true AND public.prestador_activo(prestador_id)) OR is_admin());

DROP POLICY IF EXISTS prestador_zonas_public ON public.prestador_zonas;
CREATE POLICY prestador_zonas_public ON public.prestador_zonas
  FOR SELECT TO authenticated
  USING (public.prestador_activo(prestador_id) OR is_admin());

-- ésta es la única que usa LOS DOS predicados: la vitrina del activo, más la
-- del titular mirando su propio negocio aunque todavía no esté activo.
DROP POLICY IF EXISTS prestador_fotos_select_vitrina ON public.prestador_fotos;
CREATE POLICY prestador_fotos_select_vitrina ON public.prestador_fotos
  FOR SELECT TO authenticated
  USING (public.prestador_activo(prestador_id) OR public.es_mi_prestador(prestador_id));

-- ══════════════════════════════════════════════════════════════════════════
-- EL CINTURÓN
-- ══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_crudas int;
  v_helpers int;
  v_ejemplo_activo boolean;
BEGIN
  -- (a) las cinco ya no pueden nombrar `prestadores` crudo
  SELECT count(*) INTO v_crudas
  FROM pg_policies
  WHERE policyname IN ('prestador_especialidades_public','ph_public','ps_public',
                       'prestador_zonas_public','prestador_fotos_select_vitrina')
    AND (COALESCE(qual,'') ~* 'from\s+prestadores' OR COALESCE(with_check,'') ~* 'from\s+prestadores');
  IF v_crudas > 0 THEN
    RAISE EXCEPTION 'CINTURÓN (a): % de las 5 siguen leyendo prestadores crudo', v_crudas;
  END IF;

  -- (b) los dos helpers existen, son DEFINER y tienen search_path fijo
  SELECT count(*) INTO v_helpers
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname='public' AND p.proname IN ('es_mi_prestador','prestador_activo')
    AND p.prosecdef
    AND EXISTS (SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%');
  IF v_helpers <> 2 THEN
    RAISE EXCEPTION 'CINTURÓN (b): esperaba 2 helpers DEFINER con search_path fijo, hay %', v_helpers;
  END IF;

  -- (c) EL BRAZO DE SEMÁNTICA, que es el que importa: el helper tiene que
  --     contestar `true` para un prestador que de verdad está activo. Un helper
  --     que devuelve siempre false «cierra» todo y el cinturón (a) igual pasaría.
  SELECT public.prestador_activo(id) INTO v_ejemplo_activo
  FROM public.prestadores WHERE estado = 'activo' LIMIT 1;
  IF v_ejemplo_activo IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'CINTURÓN (c): prestador_activo() dice % sobre un prestador REALMENTE activo — la vitrina quedaría vacía', v_ejemplo_activo;
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE — 5 policies sin predicado crudo · 2 helpers DEFINER con search_path · semántica verificada contra una fila viva';
END
$cinturon$;

COMMIT;
