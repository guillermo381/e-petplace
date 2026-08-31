/* REVERSA de `20260829190000_s107a_digest_acl.sql` — ESCRITA ANTES DE APLICAR.
   Devuelve el EXECUTE a `authenticated` sobre el barrido del digest.
   🔴 QUÉ NO DESHACE: nada más — es un solo GRANT. Y correr esta reversa
   REABRE la superficie: un usuario logueado podría disparar el barrido.
   No hay motivo conocido para correrla; queda por disciplina, no por uso. */
BEGIN;
GRANT EXECUTE ON FUNCTION public.encolar_resumen_media_guarderia() TO authenticated;
COMMIT;
