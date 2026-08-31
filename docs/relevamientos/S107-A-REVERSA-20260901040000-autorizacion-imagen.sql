/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de `20260901040000_s107a_autorizacion_imagen.sql` — escrita ANTES.
   🔴 QUÉ NO DESHACE: revertir deja el interruptor de imagen **sin lector** (un
   control que arranca siempre en «no» y le dice «no autorizaste» a quien sí lo
   hizo) y **sin puerta propia** — o sea, obliga a usar el aceptador de
   términos como interruptor, que es lo que esta migración vino a evitar
   porque **acepta contratos que la familia no leyó**. No borra el valor de
   `redes_autorizadas` de nadie.
   ═══════════════════════════════════════════════════════════════════════════ */
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_autorizacion_guarderia(uuid);
DROP FUNCTION IF EXISTS public.fijar_redes_autorizadas(uuid, boolean);
COMMIT;
