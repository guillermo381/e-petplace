-- REVERSA de `20260808150000_s91a_sedes_de_mis_citas.sql` — escrita ANTES.
-- Nota: revertir deja al hub del dueño SIN la dirección de la sede (el "dónde"
-- de su propia cita). La alternativa que la reversa NO debe tomar es conceder
-- SELECT (direccion) a authenticated: eso expone la dirección exacta de TODO
-- negocio activo a cualquier autenticado, que es lo que S84 cerró.
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_sedes_de_mis_citas(uuid[]);
COMMIT;
