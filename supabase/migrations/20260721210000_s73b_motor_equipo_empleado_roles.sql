-- ─────────────────────────────────────────────────────────────────────
-- S73-B · EL MOTOR DE EQUIPO — empleado_roles + helper único + backfill
-- titulares (LETRA_EQUIPO_V1_S73 §2-§4, sobre el literal 500ee8d).
--
-- ESTADO: PROPUESTA v3 (mesa OK a archivos; regla 73 — NO se aplica sin
-- la palabra del founder). v2: INSERT/DELETE de la hija por
-- empleado_tiene_rol(…, ARRAY['dueño']) — un co-dueño por la hija
-- gobierna igual que el estructural, nadie re-implementa el EXISTS
-- (letra §4). v3: el brazo dueño del SELECT también va por el helper —
-- quien puede ASIGNAR puede VER los roles de su equipo (rol sin vista
-- era el mismo hueco). El helper nace ANTES que las policies.
--
-- Qué hace (aditivo):
--   1. Tabla hija `empleado_roles` — el rol acumulable del vínculo
--      persona×negocio, con autor y fecha (auditable de nacimiento).
--      UNIQUE(empleado_id, rol): N roles = N filas; la UNIQUE del
--      vínculo (prestador_id, user_id) queda INTACTA.
--   2. Helper único `empleado_tiene_rol(prestador_id, roles[])` — la
--      UNIÓN firmada por el founder ES esta función. SECURITY DEFINER
--      (las policies lo llaman sin recursión de RLS), search_path
--      fijado, REVOKE anon/PUBLIC.
--   3. Backfill SOLO titulares: cada fila rol='dueño' del vínculo →
--      fila 'dueño' en la hija (asignado_por = el propio titular:
--      materialización S67, no hubo otro autor).
--   4. La columna `rol` vieja del vínculo queda CONGELADA (comment);
--      su DROP es deuda con disparo (D-486; precedente D-471: el
--      portal legado comparte la DB).
--
-- Qué NO hace: el gate D-464 sobre las policies clínicas — migración
-- APARTE, SOLO tras la adjudicación founder de las 5 filas no-titulares
-- (letra §5: un empleado sin rol tras el gate pierde lectura clínica,
-- y eso es decisión, no accidente).
--
-- 76(g) — DECLARACIÓN DE VEDA: migración ADITIVA (tabla + función +
-- backfill acotado). El único cómputo sobre datos vivos es el backfill,
-- que ancla el conjunto de titulares (filas rol='dueño'); el assert de
-- igualdad corre DENTRO de la misma transacción de la migración
-- (atómico), así que la veda NO RIGE: no hay ventana entre snapshot y
-- veredicto que el founder deba respetar.
-- ─────────────────────────────────────────────────────────────────────

-- 1 ── la tabla hija
CREATE TABLE public.empleado_roles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id   uuid NOT NULL REFERENCES public.prestador_empleados(id) ON DELETE CASCADE,
  rol           text NOT NULL CHECK (rol IN ('dueño', 'profesional', 'recepcion')),
  asignado_por  uuid NOT NULL REFERENCES auth.users(id),
  asignado_en   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT empleado_roles_unique UNIQUE (empleado_id, rol)
);

COMMENT ON TABLE public.empleado_roles IS
  'S73: rol acumulable del vínculo persona×negocio (LETRA_EQUIPO_V1). '
  'N filas = N permisos sumados (unión, jamás "rol activo"). '
  'La credencial NO vive acá (es de la persona: prestador_documentos + ciclo §14.2).';

ALTER TABLE public.empleado_roles ENABLE ROW LEVEL SECURITY;

-- 2 ── el helper único de autorización (ANTES que las policies: lo llaman)
-- Dos patas, deliberadas (ratificado por mesa):
--   (a) la hija: N filas de rol del vínculo ACTIVO.
--   (b) el dueño ESTRUCTURAL: prestadores.user_id (uq_prestadores_user_id)
--       cuenta como 'dueño' aunque la hija no tenga fila — un prestador
--       futuro creado por un wizard que no siembre la hija JAMÁS puede
--       quedar afuera de su propia clínica por el gate. La hija sigue
--       siendo la verdad EXPLÍCITA y auditable; la pata estructural es
--       el piso de seguridad. Solo responde por 'dueño' (assert T3).
CREATE FUNCTION public.empleado_tiene_rol(p_prestador_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM prestador_empleados pe
      JOIN empleado_roles er ON er.empleado_id = pe.id
      WHERE pe.prestador_id = p_prestador_id
        AND pe.user_id = auth.uid()
        AND pe.activo = true
        AND er.rol = ANY (p_roles)
    )
    OR (
      'dueño' = ANY (p_roles)
      AND EXISTS (
        SELECT 1 FROM prestadores p
        WHERE p.id = p_prestador_id AND p.user_id = auth.uid()
      )
    );
$$;

COMMENT ON FUNCTION public.empleado_tiene_rol(uuid, text[]) IS
  'S73 LETRA_EQUIPO §4: LA puerta única de autorización por rol del negocio. '
  'Toda policy/RPC que gatee por rol la llama; nadie re-implementa el EXISTS.';

-- L-140: los default privileges regalan EXECUTE a anon/PUBLIC en el
-- CREATE — se revoca explícito y se otorga el mínimo.
REVOKE EXECUTE ON FUNCTION public.empleado_tiene_rol(uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.empleado_tiene_rol(uuid, text[]) TO authenticated;

-- 3 ── RLS de la hija (la superficie de gobierno es S74)
--   ver: el propio empleado (brazo 1 — lectura de identidad, =auth.uid()
--   sin helper, mesa v2) · quien porta rol 'dueño' del negocio (brazo 2 —
--   VÍA HELPER, edición mesa v3: un co-dueño por la hija que puede
--   ASIGNAR también tiene que poder VER los roles de su equipo; rol sin
--   vista era el mismo hueco de la v2 donde faltaba) · admin.
CREATE POLICY empleado_roles_select ON public.empleado_roles
  FOR SELECT TO authenticated
  USING (
    empleado_id IN (SELECT pe.id FROM public.prestador_empleados pe WHERE pe.user_id = auth.uid())
    OR empleado_id IN (
      SELECT pe.id FROM public.prestador_empleados pe
      WHERE empleado_tiene_rol(pe.prestador_id, ARRAY['dueño'])
    )
    OR is_admin()
  );

--   asignar/quitar: quien porta rol 'dueño' del negocio del vínculo —
--   VÍA EL HELPER (enmienda mesa v2): un co-dueño por la hija gobierna
--   igual que el estructural, y nadie re-implementa el EXISTS.
--   asignado_por siempre = quien ejecuta (with_check).
CREATE POLICY empleado_roles_insert_duenio ON public.empleado_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    asignado_por = auth.uid()
    AND (
      empleado_id IN (
        SELECT pe.id FROM public.prestador_empleados pe
        WHERE empleado_tiene_rol(pe.prestador_id, ARRAY['dueño'])
      )
      OR is_admin()
    )
  );

CREATE POLICY empleado_roles_delete_duenio ON public.empleado_roles
  FOR DELETE TO authenticated
  USING (
    empleado_id IN (
      SELECT pe.id FROM public.prestador_empleados pe
      WHERE empleado_tiene_rol(pe.prestador_id, ARRAY['dueño'])
    )
    OR is_admin()
  );

-- 4 ── backfill SOLO titulares (los 5 'empleado' esperan adjudicación
--      founder — letra §3)
INSERT INTO public.empleado_roles (empleado_id, rol, asignado_por)
SELECT pe.id, 'dueño', pe.user_id
FROM public.prestador_empleados pe
WHERE pe.rol = 'dueño';

-- 5 ── la columna vieja queda congelada
COMMENT ON COLUMN public.prestador_empleados.rol IS
  'CONGELADA S73 (LETRA_EQUIPO §2): la verdad de roles vive en empleado_roles. '
  'Esta columna queda como legacy de lectura del portal viejo; su DROP es '
  'deuda con disparo D-486 (portal legado jubilado / auditoría D-471). NO '
  'escribir lógica nueva contra ella.';

-- 6 ── verificación imperativa EN LA MISMA TRANSACCIÓN (falla = rollback
--      de toda la migración)
DO $$
DECLARE
  v_titulares  integer;
  v_backfill   integer;
  v_acl        aclitem[];
  v_acl_txt    text;
BEGIN
  -- el backfill cubrió EXACTAMENTE a los titulares vivos (76(g): el
  -- ancla y su veredicto viven en la misma txn — atómico)
  SELECT count(*) INTO v_titulares FROM prestador_empleados WHERE rol = 'dueño';
  SELECT count(*) INTO v_backfill FROM empleado_roles WHERE rol = 'dueño';
  IF v_titulares IS DISTINCT FROM v_backfill THEN
    RAISE EXCEPTION 'backfill desparejo: % titulares vs % filas dueño', v_titulares, v_backfill;
  END IF;
  -- hoy son 5 — si el número cambió entre la propuesta y la aplicación,
  -- FRENAR y reportar (no es error de SQL: es dato nuevo para la mesa)
  IF v_titulares <> 5 THEN
    RAISE EXCEPTION 'se esperaban 5 titulares (literal 500ee8d) y hay % — frenar y reportar', v_titulares;
  END IF;

  -- L-140: proacl de la función SIN anon
  SELECT proacl INTO v_acl FROM pg_proc
  WHERE oid = 'public.empleado_tiene_rol(uuid, text[])'::regprocedure;
  v_acl_txt := COALESCE(v_acl::text, '');
  IF v_acl_txt LIKE '%anon=%' THEN
    RAISE EXCEPTION 'L-140: empleado_tiene_rol quedó ejecutable por anon: %', v_acl_txt;
  END IF;

  -- RLS habilitada en la hija
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.empleado_roles'::regclass) THEN
    RAISE EXCEPTION 'empleado_roles sin RLS';
  END IF;

  -- las TRES policies citan el helper (mesa v2: INSERT/DELETE · mesa v3:
  -- el brazo dueño del SELECT — rol sin vista era el mismo hueco)
  IF (SELECT count(*) FROM pg_policies
      WHERE schemaname='public' AND tablename='empleado_roles'
        AND policyname IN ('empleado_roles_select','empleado_roles_insert_duenio','empleado_roles_delete_duenio')
        AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empleado_tiene_rol%') <> 3 THEN
    RAISE EXCEPTION 'edicion v3 incompleta: las 3 policies deben citar empleado_tiene_rol';
  END IF;
END $$;
