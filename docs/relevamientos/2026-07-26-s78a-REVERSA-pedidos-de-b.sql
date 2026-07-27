-- REVERSA de la migracion S78-A8 (los dos pedidos de B). Escrita ANTES
-- de aplicar, el 26-jul-2026.
--
-- NOTA HONESTA: revertir el codigo no revierte los datos — aca no hay
-- datos que revertir (cero DDL de tablas, cero backfill): las dos piezas
-- son funciones. La reversa de obtener_jornada_recepcion exige recrear
-- la version de 10 columnas — su cuerpo vivo quedo en la migracion
-- 20260726210000 (es la version que esta reversa restituye).

DROP FUNCTION IF EXISTS public.puede_encender_vitrina();
DROP FUNCTION IF EXISTS public.obtener_jornada_recepcion(uuid, date);
-- ...y recrear la de 20260726210000 (10 columnas) desde ese archivo.
