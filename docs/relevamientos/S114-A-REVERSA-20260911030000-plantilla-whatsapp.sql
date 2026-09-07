-- REVERSA de `20260911030000_s114a_plantilla_whatsapp.sql` (⑤). Escrita ANTES.
-- QUÉ DESHACE: el resolvedor y las dos columnas del catálogo.
-- 🔴 QUÉ NO DESHACE, y por qué importa: revertir esto deja al despachador de
--    WhatsApp otra vez sin forma de nombrar una plantilla desde la base —
--    y como el canal está APAGADO (`transporte_vivo=false`), el hueco no
--    produce ningún síntoma hasta el día del flip. Ese es exactamente el
--    motivo por el que esta pieza va ANTES del flip y no después.
DROP FUNCTION IF EXISTS public.resolver_plantilla_whatsapp(text);
ALTER TABLE public.cat_notificacion_tipos DROP COLUMN IF EXISTS plantilla_whatsapp;
ALTER TABLE public.cat_notificacion_tipos DROP COLUMN IF EXISTS plantilla_idioma;
