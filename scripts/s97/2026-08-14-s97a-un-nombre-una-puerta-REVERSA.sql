-- REVERSA de 20260814180000_s97a_un_nombre_una_puerta.sql (escrita ANTES)
--
-- 🔴 QUÉ NO DESHACE, y hay que leerlo antes de correrla:
--  · La RECONCILIACIÓN de datos NO se revierte: el nombre viejo del prestador
--    divergente («Todo S97 (borrable)») se pierde — la reconciliación lo
--    sobrescribe con el de la cuenta. SELECT probatorio ANTES:
--      SELECT cc.id, cc.nombre_comercial, p.nombre_comercial
--        FROM cuentas_comerciales cc JOIN prestadores p ON p.cuenta_comercial_id=cc.id;
--  · Revertir REABRE la divergencia: vuelven las escrituras directas y
--    `actualizar_nombre_cuenta_comercial` vuelve a escribir MEDIO nombre.
BEGIN;
DROP TRIGGER IF EXISTS trg_prestadores_nombre_por_la_puerta ON public.prestadores;
DROP FUNCTION IF EXISTS public._trg_prestadores_nombre_por_la_puerta();
DROP FUNCTION IF EXISTS public.renombrar_negocio(uuid, text);
-- Las dos delegadoras vuelven a su cuerpo previo: ver sus migraciones de
-- origen (`actualizar_nombre_comercial` y 20260814000000 para la de cuenta).
\echo 'REVERSA: restaurar los cuerpos previos de actualizar_nombre_comercial y actualizar_nombre_cuenta_comercial'
COMMIT;
