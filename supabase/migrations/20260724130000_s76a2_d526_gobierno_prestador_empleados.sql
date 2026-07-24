-- S76-A2 v2 (D-526) — gobierno de prestador_empleados: activo/rol/prestador_id
-- solo los escribe (por escritura DIRECTA authenticated) el titular o el admin.
-- Espejo de _prestadores_protege_columnas (D-389). Cierra el agujero A0bis.
--
-- La llave de D-389: la guarda solo aplica a current_user='authenticated'
-- (escritura directa PostgREST). Los RPC SECURITY DEFINER corren como su owner
-- (current_user != 'authenticated') y pasan — la activacion del invitado
-- (aceptar_invitacion_pendiente_login, crear_empleado_directo) NO se rompe
-- (verificado en A2bis).
--
-- prestador_id ENTRA al IF (mover la fila logra el mismo fin sin tocar
-- activo/rol: fila ACTIVA en negocio ajeno). Titularidad contra OLD.prestador_id:
-- protege el negocio del que la fila SALE.
--
-- Borde declarado (D-526, no se cierra aca): con OLD, el titular del negocio
-- ORIGEN puede setear prestador_id a otro negocio. El agujero del EMPLEADO
-- (self-move) queda cerrado. La v2 con REVOKE por columna decide el resto.
-- 76(g): DDL sin backfill -> NO RIGE para la migracion.

CREATE OR REPLACE FUNCTION public._prestador_empleados_protege_gobierno()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF current_user = 'authenticated'
     AND NOT is_admin()
     AND NOT EXISTS (
       SELECT 1 FROM prestadores p
       WHERE p.id = OLD.prestador_id AND p.user_id = auth.uid()
     )
  THEN
    IF NEW.activo        IS DISTINCT FROM OLD.activo
       OR NEW.rol        IS DISTINCT FROM OLD.rol
       OR NEW.prestador_id IS DISTINCT FROM OLD.prestador_id
    THEN
      RAISE EXCEPTION 'gobierno_protegido' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public._prestador_empleados_protege_gobierno() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS prestador_empleados_protege_gobierno ON public.prestador_empleados;
CREATE TRIGGER prestador_empleados_protege_gobierno
  BEFORE UPDATE ON public.prestador_empleados
  FOR EACH ROW EXECUTE FUNCTION public._prestador_empleados_protege_gobierno();
