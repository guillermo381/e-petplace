-- ════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260826420000_s106a_vigilancia_cadencia.sql`
-- Escrita ANTES de aplicar.
--
-- QUÉ DESHACE: devuelve el job `vigilar-consumo-video` a su cadencia diaria
-- (`0 10 * * *`) y la función a su forma sin el auto-diagnóstico de cadencia.
--
-- 🔴 QUÉ **NO** DESHACE, y es la razón de esta reversa más que su contenido:
--    **revertir REINTRODUCE EL DEFECTO.** Con cadencia de 24 h contra un
--    `pg_net.ttl` de 6 h, la respuesta de la corrida anterior **siempre está
--    vencida** cuando la siguiente va a cobrarla ⇒ la vigilancia manda
--    «no pude medir» todos los días y **nunca mide**.
--
--    *No es una reversa neutra: es volver a un monitor que se lee como vivo
--    en el ledger de jobs y no vigila nada.* Si alguien la corre, que sea
--    sabiendo eso.
-- ════════════════════════════════════════════════════════════════════════

SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'vigilar-consumo-video'),
  schedule => '0 10 * * *'
);

-- La función vuelve a su forma previa cargando de nuevo
-- `20260826340000_s106a_vigilancia_dos_tiempos.sql` (más `350000`, que le
-- corrigió el campo del cuerpo). No se transcribe acá: **una copia del cuerpo
-- diverge en silencio**; la fuente vive en esas dos migraciones.
