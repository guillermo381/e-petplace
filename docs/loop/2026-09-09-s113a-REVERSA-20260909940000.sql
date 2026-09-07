-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260909940000_s113a_on_conflict_parcial.sql
--
-- ⚠️ ESCRITA DESPUÉS DE APLICAR, y se declara: la casa exige escribirla ANTES.
-- Es un incumplimiento mío, no una excepción — queda anotado acá y en el parte.
--
-- ── QUÉ DESHACE ────────────────────────────────────────────────────────────
-- Devuelve `generar_avisos_coach()` a sus `on conflict` SIN predicado. Los tres
-- ON CONFLICT diarios tuvieron que repetir `where clave is null` cuando el
-- índice diario pasó a ser PARCIAL (20260909920000): Postgres exige que el
-- predicado del índice esté en la cláusula, o no lo resuelve.
--
-- 🔴 QUÉ **NO** DESHACE, y por qué revertir sola no alcanza:
-- Esta reversa NO restaura el índice diario a su forma total. Si se aplica
-- SIN revertir también `20260909920000`, la función queda pidiendo un índice
-- que ya no existe y **el generador entero falla** — no sólo las
-- anticipaciones: también las vacunas y las citas de mañana de TODAS las
-- familias. *Es exactamente el defecto que la 940000 vino a curar.*
--   ⇒ Revertir SIEMPRE en pareja: primero ésta, después la de 920000.
--
-- Tampoco borra los avisos ya nacidos. Un aviso es una foto de lo que se dijo.
-- ═══════════════════════════════════════════════════════════════════════════

-- El cuerpo previo vive en 20260909860000 / 20260909880000, que son su fuente.
-- No se transcribe acá para no dejar una TERCERA copia divergiendo:
--   \i supabase/migrations/20260909880000_s113a_predisposiciones_en_revision.sql
-- y después revertir 20260909920000 con su propia reversa.

select 'reversa 940000: aplicar en pareja con la de 920000 — ver cabecera' as nota;
