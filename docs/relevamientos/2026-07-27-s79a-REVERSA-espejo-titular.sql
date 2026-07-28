-- ═════════════════════════════════════════════════════════════════════
-- REVERSA de 20260727220000_s79_espejo_titular.sql (escrita ANTES de
-- aplicar).
--
-- NOTA DE DATOS: la pieza ② de la migración es un BACKFILL (las filas
-- dueño de Paseos Shyris y Clínica Los Shyris + sus empleado_roles).
-- Esta reversa las BORRA — es segura HOY (filas de membresía sin FKs
-- entrantes con historia: cero franjas, cero citas de esos empleados al
-- momento de aplicar), pero si después de la aplicación esos empleados
-- acumulan franjas u ocupación, borrarlos rompe regla 41: RELEVAR FKs
-- antes de ejecutar esta reversa en ese futuro.
-- Los bodies de invitar/activar vuelven a su versión v2 (las de
-- 20260727210000 y 20260727190000 respectivamente — verbatim en esos
-- archivos; misma firma, CREATE OR REPLACE re-aplicable desde ahí).
-- ═════════════════════════════════════════════════════════════════════
begin;

-- ② deshacer el backfill (empleado_roles primero por FK)
DELETE FROM public.empleado_roles er
USING public.prestador_empleados pe
WHERE er.empleado_id = pe.id
  AND pe.rol = 'dueño'
  AND pe.prestador_id IN ('8026077e-f96f-4127-9597-8f4b2646a1b2', '5e53c898-2c6d-4061-a1a6-84b58dcdd524');

DELETE FROM public.prestador_empleados pe
WHERE pe.rol = 'dueño'
  AND pe.prestador_id IN ('8026077e-f96f-4127-9597-8f4b2646a1b2', '5e53c898-2c6d-4061-a1a6-84b58dcdd524');

-- ①/③ restaurar los bodies v2: re-correr la sección de invitar_prestador
-- de supabase/migrations/20260727210000_s79_hermanas_geo_e_invitar.sql y
-- la de activar_prestador de 20260727190000_s79_invariante_cuenta.sql
-- (misma firma en ambos: CREATE OR REPLACE directo, sin DROP).

commit;
