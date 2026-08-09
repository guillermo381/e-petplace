-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260808180000_s92_helpers_policies_vitrina.sql` (S92-A · D-700)
-- ESCRITA ANTES DE APLICAR LA MIGRACIÓN.
--
-- QUÉ DESHACE: devuelve las CINCO policies de vitrina a su expresión original
-- (el `EXISTS`/`IN` crudo sobre `prestadores`) y borra los dos helpers nuevos.
--
-- QUÉ **NO** DESHACE, y es el punto de D-700: volver al predicado crudo vuelve
-- a ATAR esas policies a los grants de COLUMNA de `prestadores`. O sea que la
-- reversa restaura el comportamiento **y también el riesgo**: el día que
-- alguien revoque `estado` o `id`, estas cinco se rompen otra vez y el síntoma
-- aparece en una pantalla que no las menciona.
--
-- El texto de cada policy es el LITERAL leído de `pg_policies` antes de tocar
-- nada (`scripts/s92/salida/b0-policies.json`), no una reconstrucción de
-- memoria — L-208: un CREATE OR REPLACE se arma leyendo el objeto vivo.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ① prestador_especialidades ────────────────────────────────────────────
DROP POLICY IF EXISTS prestador_especialidades_public ON public.prestador_especialidades;
CREATE POLICY prestador_especialidades_public ON public.prestador_especialidades
  FOR SELECT TO authenticated
  USING (
    (prestador_id IN ( SELECT prestadores.id FROM prestadores WHERE (prestadores.estado = 'activo'::text)))
    OR is_admin()
  );

-- ── ② prestador_horarios ──────────────────────────────────────────────────
DROP POLICY IF EXISTS ph_public ON public.prestador_horarios;
CREATE POLICY ph_public ON public.prestador_horarios
  FOR SELECT TO authenticated
  USING (
    (((activo = true) AND (prestador_id IN ( SELECT prestadores.id FROM prestadores WHERE (prestadores.estado = 'activo'::text)))) OR is_admin())
  );

-- ── ③ prestador_servicios ─────────────────────────────────────────────────
DROP POLICY IF EXISTS ps_public ON public.prestador_servicios;
CREATE POLICY ps_public ON public.prestador_servicios
  FOR SELECT TO authenticated
  USING (
    (((activo = true) AND (prestador_id IN ( SELECT prestadores.id FROM prestadores WHERE (prestadores.estado = 'activo'::text)))) OR is_admin())
  );

-- ── ④ prestador_zonas ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS prestador_zonas_public ON public.prestador_zonas;
CREATE POLICY prestador_zonas_public ON public.prestador_zonas
  FOR SELECT TO authenticated
  USING (
    (prestador_id IN ( SELECT prestadores.id FROM prestadores WHERE (prestadores.estado = 'activo'::text)))
    OR is_admin()
  );

-- ── ⑤ prestador_fotos (vitrina: activo OR mío) ────────────────────────────
DROP POLICY IF EXISTS prestador_fotos_select_vitrina ON public.prestador_fotos;
CREATE POLICY prestador_fotos_select_vitrina ON public.prestador_fotos
  FOR SELECT TO authenticated
  USING (
    EXISTS ( SELECT 1 FROM prestadores p
             WHERE ((p.id = prestador_fotos.prestador_id)
                AND ((p.estado = 'activo'::text) OR (p.user_id = auth.uid()))))
  );

-- ── los helpers, al final: si alguna policy quedara apuntándolos, el DROP
--    fallaría y avisaría en vez de dejar una policy rota en silencio.
DROP FUNCTION IF EXISTS public.prestador_activo(uuid);
DROP FUNCTION IF EXISTS public.es_mi_prestador(uuid);

COMMIT;
