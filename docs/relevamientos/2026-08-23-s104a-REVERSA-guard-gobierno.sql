-- ============================================================================
-- REVERSA de `20260823150000_s104a_guard_gobierno_invoker.sql`
-- Escrita ANTES de aplicar. S104-A · 23-ago-2026 · D-890
-- ============================================================================
--
-- 🔴 REVERTIR REABRE UN AGUJERO VIVO, MEDIDO: con la versión DEFINER, **8 de 8
-- empleados no-gestores pudieron cambiar el `activo` de su propia fila**
-- (`row_count = 1` en los ocho, con `user_gestiona_prestador` devolviendo
-- `false`). Eso es un empleado dado de baja reactivándose solo.
--
-- La única razón legítima para correr esto es que el guard INVOKER esté
-- frenando un camino LEGÍTIMO que el censo no vio. En ese caso la cura NO es
-- volver a DEFINER —que apaga el guard entero— sino **agregar ese camino a la
-- condición** o pasarlo por una RPC DEFINER, como los otros cuatro escritores.
--
-- Censo hecho antes de curar (D-528, abierto desde S76, queda cerrado con esto):
-- los escritores de `prestador_empleados` son CUATRO y los cuatro son DEFINER
-- (`aceptar_invitacion_pendiente_login` · `crear_empleado_directo` ·
-- `dar_de_baja_empleado` · `invitar_prestador`) ⇒ pasan por `current_user`
-- distinto de 'authenticated'. El único escritor directo desde el repo
-- (`empleado-matricula.ts`) toca `matricula_profesional` y
-- `matricula_pais_emisor`, que este guard NO vigila.
-- ============================================================================

begin;

create or replace function public._prestador_empleados_protege_gobierno()
returns trigger
language plpgsql
security definer                     -- ⚠️ ESTO es lo que apaga el guard
set search_path to 'public', 'pg_temp'
as $function$
BEGIN
  IF current_user = 'authenticated'
     AND NOT public.user_gestiona_prestador(OLD.prestador_id)
  THEN
    IF NEW.activo        IS DISTINCT FROM OLD.activo
       OR NEW.rol        IS DISTINCT FROM OLD.rol
       OR NEW.prestador_id IS DISTINCT FROM OLD.prestador_id
    THEN
      RAISE EXCEPTION 'gobierno_protegido' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $function$;

commit;
