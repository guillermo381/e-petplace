-- ============================================================================
-- S88-A · LOTE D-660 · TANDA ④bis — EL TRIGGER QUE MI CENSO NO VIO
--
-- ⚠️ HUECO DE CENSO, declarado: D-660 censó POLICIES y RPCs. **Los TRIGGERS no
-- estaban en la lista** — y `_prestador_empleados_protege_gobierno` (D-526)
-- gatea por titularidad con la misma premisa caducada. Lo cazó el fixture de
-- la tanda ④ al intentar la baja: `gobierno_protegido`.
-- *Un censo declara qué clases mira; el que mira dos de tres encuentra dos
-- tercios de la verdad y reporta el total.* Re-corrido sobre triggers: **es el
-- ÚNICO** — la clase queda cerrada, no abierta.
--
-- QUÉ HACE ESTE TRIGGER, y por qué es correcto que exista: impide que un
-- empleado se reactive solo, se cambie el rol o se mude de negocio (el agujero
-- A0bis de S76). Su predicado dice «titular O admin de plataforma»; le faltaba
-- el ADMINISTRADOR — que es exactamente quien debe poder dar de baja.
--
-- LO QUE **NO** CAMBIA: sigue protegiendo `rol`, `activo` y `prestador_id`
-- contra el propio empleado. Un profesional o recepción siguen sin poder
-- tocarse el gobierno — se prueba en el fixture, en las dos direcciones.
--
-- VEDA 76(g): NO RIGE. REVERSA: el cuerpo anterior está transcrito arriba.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public._prestador_empleados_protege_gobierno()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
BEGIN
  IF current_user = 'authenticated'
     -- D-660: la puerta única. Antes decía «titular O is_admin()» y por eso el
     -- ADMINISTRADOR no podía dar de baja a nadie. El helper incluye los tres.
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
END $$;

REVOKE EXECUTE ON FUNCTION public._prestador_empleados_protege_gobierno() FROM PUBLIC, anon, authenticated;

COMMIT;
