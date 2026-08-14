-- REVERSA de 20260814120000_s97a_lectores_atender_y_lapida.sql (escrita ANTES)
--
-- QUÉ DESHACE: los dos lectores nuevos y el REVOKE de `crear_mascota_walkin`.
--
-- 🔴 QUÉ **NO** DESHACE, y es la advertencia que importa: revertir REABRE
--    `crear_mascota_walkin` a `authenticated` — la puerta que crea mascotas
--    SIN correo, que nadie puede reclamar jamás (D-794). Revertir esta
--    migración vuelve a poner esa trampa al alcance de cualquier pantalla.
--    Si se revierte, D-794 vuelve a estar 🔴 ABIERTA.
--
-- Los dos lectores no tienen datos que perder: no escriben nada.

BEGIN;

DROP FUNCTION IF EXISTS public.negocio_atiende_en_local(uuid);
DROP FUNCTION IF EXISTS public.puede_ofrecer_rol_recepcion(uuid);

GRANT EXECUTE ON FUNCTION public.crear_mascota_walkin(uuid,text,text,text,text,text,date,text,text) TO authenticated;
COMMENT ON FUNCTION public.crear_mascota_walkin(uuid,text,text,text,text,text,date,text,text) IS NULL;

COMMIT;
