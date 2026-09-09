-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260911000000_s114a_cat_motivos_postventa.sql`
-- Escrita ANTES de aplicar la migración. S114-A · 7-sep-2026.
--
-- QUÉ DESHACE: la tabla entera y sus 19 filas de catálogo.
--
-- 🔴 QUÉ **NO** DESHACE, y hay que saberlo antes de correrla:
--   · Si para cuando alguien la corra ya existen filas en `casos_postventa`
--     apuntando a un motivo, el DROP **va a fallar por la FK** — y eso es
--     correcto: un caso sin su motivo es un caso que no se puede leer.
--     Primero se resuelven los casos, después se revierte el catálogo.
--   · No toca ningún objeto vivo: esta migración es catálogo puro y no
--     modifica citas, estadías, pedidos ni pagos.
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS public.cat_motivos_postventa;
