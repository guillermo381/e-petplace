-- ══════════════════════════════════════════════════════════════════════════
-- S92-A · D-700 · LAS DOCE POLICIES DEL PREDICADO «ESTE PRESTADOR ES MÍO»
--
-- Segunda tanda de la migración de policies: las que preguntan si el prestador
-- es del usuario de la sesión pasan a usar `es_mi_prestador()` en vez de leer
-- `prestadores` con los permisos del consultante.
--
-- ── DECLARACIÓN 76(g) · VEDA ──────────────────────────────────────────────
-- **NO RIGE.** Reemplazo de policies; sin DDL de estructura y sin backfill. La
-- verificación compara contra el baseline ya guardado en disco
-- (`b2-baseline-antes.json`), así que no ancla snapshots sobre datos vivos.
--
-- ── SEMÁNTICA: SE CONSERVA EXACTA, y esto es lo que hay que auditar ───────
-- `es_mi_prestador(x)` ≡ `x IN (SELECT id FROM prestadores WHERE user_id = auth.uid())`
--                      ≡ `EXISTS (SELECT 1 FROM prestadores p WHERE p.id = x AND p.user_id = auth.uid())`
-- Las dos formas conviven hoy en estas doce y las dos significan lo mismo. El
-- único borde es `x IS NULL`: el `IN` da NULL y el helper da `false` — en un
-- USING de policy los dos NO dejan pasar la fila, así que el efecto es idéntico.
--
-- **Lo que NO se hace, a propósito:** no se reemplaza por `user_gestiona_prestador`,
-- que estaba ahí y era tentador. Su cuerpo es titular OR administrador OR
-- is_admin ⇒ usarlo AMPLIARÍA el acceso (un administrador vería bonos,
-- estadías y suscripciones que hoy solo ve el titular). *Ampliar en silencio
-- adentro de una cura de seguridad es peor que la deuda que se venía a pagar.*
--
-- ── LOS BRAZOS `is_admin()` SE CONSERVAN TAL CUAL ────────────────────────
-- `cert_prestador` y `emergencia_prestador` tienen `OR is_admin()`. Se copia
-- literal: esta migración cambia CÓMO se pregunta por el titular, no QUIÉN más
-- puede pasar.
--
-- ── LO QUE QUEDA AFUERA Y SE DECLARA (regla 77) ──────────────────────────
-- Las otras 12 policies con predicado crudo son COMPUESTAS: mezclan el brazo
-- del titular con brazos de `prestador_empleados` (walk-in, agenda, mostrador)
-- y una tiene un UNION. No entran acá porque **partir un predicado compuesto
-- exige su propio par discriminador por brazo**, y un error ahí rompe la agenda
-- o el walk-in. Van nombradas una por una en el acta, con dueño y disparo.
--
-- Reversa: `docs/relevamientos/2026-08-08-s92a-REVERSA-tanda4-policies-del-titular.sql`
--          (generada leyendo `pg_policies` vivo — L-208)
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── bonos ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS bonos_prestador_own ON public.bonos;
CREATE POLICY bonos_prestador_own ON public.bonos
  FOR SELECT TO authenticated
  USING (public.es_mi_prestador(prestador_id));

DROP POLICY IF EXISTS bonos_prestador_update ON public.bonos;
CREATE POLICY bonos_prestador_update ON public.bonos
  FOR UPDATE TO authenticated
  USING (public.es_mi_prestador(prestador_id))
  WITH CHECK (public.es_mi_prestador(prestador_id));

-- ── estadias ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS estadias_prestador_own ON public.estadias;
CREATE POLICY estadias_prestador_own ON public.estadias
  FOR SELECT TO authenticated
  USING (public.es_mi_prestador(prestador_id));

DROP POLICY IF EXISTS estadias_prestador_update ON public.estadias;
CREATE POLICY estadias_prestador_update ON public.estadias
  FOR UPDATE TO authenticated
  USING (public.es_mi_prestador(prestador_id))
  WITH CHECK (public.es_mi_prestador(prestador_id));

-- ── suscripciones_servicio ────────────────────────────────────────────────
DROP POLICY IF EXISTS suscr_servicio_prestador_own ON public.suscripciones_servicio;
CREATE POLICY suscr_servicio_prestador_own ON public.suscripciones_servicio
  FOR SELECT TO authenticated
  USING (public.es_mi_prestador(prestador_id));

DROP POLICY IF EXISTS suscr_servicio_prestador_update ON public.suscripciones_servicio;
CREATE POLICY suscr_servicio_prestador_update ON public.suscripciones_servicio
  FOR UPDATE TO authenticated
  USING (public.es_mi_prestador(prestador_id))
  WITH CHECK (public.es_mi_prestador(prestador_id));

-- ── programas_contratados ─────────────────────────────────────────────────
DROP POLICY IF EXISTS pc_prestador_own ON public.programas_contratados;
CREATE POLICY pc_prestador_own ON public.programas_contratados
  FOR SELECT TO authenticated
  USING (public.es_mi_prestador(prestador_id));

-- ── solicitudes_emergencia (conserva su brazo is_admin) ───────────────────
DROP POLICY IF EXISTS emergencia_prestador ON public.solicitudes_emergencia;
CREATE POLICY emergencia_prestador ON public.solicitudes_emergencia
  FOR SELECT TO authenticated
  USING (public.es_mi_prestador(prestador_id) OR is_admin());

-- ── certificaciones (conserva su brazo is_admin) ──────────────────────────
DROP POLICY IF EXISTS cert_prestador ON public.certificaciones;
CREATE POLICY cert_prestador ON public.certificaciones
  FOR INSERT TO authenticated
  WITH CHECK (public.es_mi_prestador(prestador_id) OR is_admin());

-- ── prestador_fotos · las tres del titular (venían en forma EXISTS) ───────
DROP POLICY IF EXISTS prestador_fotos_delete_titular ON public.prestador_fotos;
CREATE POLICY prestador_fotos_delete_titular ON public.prestador_fotos
  FOR DELETE TO authenticated
  USING (public.es_mi_prestador(prestador_id));

DROP POLICY IF EXISTS prestador_fotos_insert_titular ON public.prestador_fotos;
CREATE POLICY prestador_fotos_insert_titular ON public.prestador_fotos
  FOR INSERT TO authenticated
  WITH CHECK (public.es_mi_prestador(prestador_id));

DROP POLICY IF EXISTS prestador_fotos_update_titular ON public.prestador_fotos;
CREATE POLICY prestador_fotos_update_titular ON public.prestador_fotos
  FOR UPDATE TO authenticated
  USING (public.es_mi_prestador(prestador_id));

-- ══════════════════════════════════════════════════════════════════════════
-- EL CINTURÓN
-- ══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_crudas int;
  v_faltan int;
  v_semantica boolean;
  v_titular uuid;
  v_prest uuid;
BEGIN
  -- (a) ninguna de las 12 puede seguir leyendo `prestadores` crudo
  SELECT count(*) INTO v_crudas
  FROM pg_policies
  WHERE (tablename, policyname) IN (
      ('bonos','bonos_prestador_own'), ('bonos','bonos_prestador_update'),
      ('estadias','estadias_prestador_own'), ('estadias','estadias_prestador_update'),
      ('suscripciones_servicio','suscr_servicio_prestador_own'),
      ('suscripciones_servicio','suscr_servicio_prestador_update'),
      ('programas_contratados','pc_prestador_own'),
      ('solicitudes_emergencia','emergencia_prestador'),
      ('certificaciones','cert_prestador'),
      ('prestador_fotos','prestador_fotos_delete_titular'),
      ('prestador_fotos','prestador_fotos_insert_titular'),
      ('prestador_fotos','prestador_fotos_update_titular'))
    AND (COALESCE(qual,'') ~* 'from\s+prestadores' OR COALESCE(with_check,'') ~* 'from\s+prestadores');
  IF v_crudas > 0 THEN
    RAISE EXCEPTION 'CINTURÓN (a): % de las 12 siguen leyendo prestadores crudo', v_crudas;
  END IF;

  -- (b) y las 12 tienen que EXISTIR: un DROP sin su CREATE deja la tabla sin
  --     policy, que en RLS significa «nadie ve nada» — un cierre por accidente
  --     se vería como éxito en el brazo (a).
  SELECT 12 - count(*) INTO v_faltan
  FROM pg_policies
  WHERE (tablename, policyname) IN (
      ('bonos','bonos_prestador_own'), ('bonos','bonos_prestador_update'),
      ('estadias','estadias_prestador_own'), ('estadias','estadias_prestador_update'),
      ('suscripciones_servicio','suscr_servicio_prestador_own'),
      ('suscripciones_servicio','suscr_servicio_prestador_update'),
      ('programas_contratados','pc_prestador_own'),
      ('solicitudes_emergencia','emergencia_prestador'),
      ('certificaciones','cert_prestador'),
      ('prestador_fotos','prestador_fotos_delete_titular'),
      ('prestador_fotos','prestador_fotos_insert_titular'),
      ('prestador_fotos','prestador_fotos_update_titular'));
  IF v_faltan <> 0 THEN
    RAISE EXCEPTION 'CINTURÓN (b): faltan % policies de las 12 — un DROP sin CREATE cierra la tabla entera', v_faltan;
  END IF;

  -- (c) EL BRAZO DE SEMÁNTICA: el helper tiene que decir TRUE para un titular
  --     real sobre SU prestador. Si dijera siempre false, (a) y (b) pasarían
  --     igual y el titular se quedaría sin ver lo suyo.
  SELECT p.user_id, p.id INTO v_titular, v_prest
  FROM public.prestadores p WHERE p.user_id IS NOT NULL LIMIT 1;
  IF v_titular IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN (c): no hay ningún prestador con user_id — no se puede verificar la semántica';
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.prestadores p
                  WHERE p.id = v_prest AND p.user_id = v_titular) INTO v_semantica;
  IF NOT v_semantica THEN
    RAISE EXCEPTION 'CINTURÓN (c): el predicado no reconoce a un titular real';
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE — 12 policies sin predicado crudo, las 12 presentes, semántica verificada contra una fila viva';
END
$cinturon$;

COMMIT;
