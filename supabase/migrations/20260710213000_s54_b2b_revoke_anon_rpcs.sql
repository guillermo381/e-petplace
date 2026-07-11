-- S54 B2(b) — corrección post-verificación estructural: los DEFAULT
-- PRIVILEGES de Supabase otorgan EXECUTE a anon al crear funciones;
-- el REVOKE FROM PUBLIC de la migración anterior no cubre ese grant
-- explícito. Las 3 RPCs tienen gate auth_required en el body, pero el
-- patrón canónico (skill epetplace-db) exige sin anon.
REVOKE EXECUTE ON FUNCTION public.obtener_slots_disponibles(uuid, uuid, date, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.crear_bloqueo_agenda(uuid, uuid, uuid, date, time) FROM anon;
REVOKE EXECUTE ON FUNCTION public.confirmar_cita_pagada(uuid) FROM anon;
