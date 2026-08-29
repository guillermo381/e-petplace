/* ════════════════════════════════════════════════════════════════════════════
   REVERSA de `20260829180000_s107a_digest_media_guarderia.sql`
   ESCRITA ANTES DE APLICAR (regla de la casa).

   🔴 QUÉ **NO** DESHACE, y hay que saberlo antes de correrla:

   ① **Las intenciones ya encoladas NO se borran.** Si el barrido llegó a
      correr, hay filas en `notificacion_intencion` con tipo
      `guarderia_media_resumen`. Borrarlas sería reescribir el registro de
      avisos que ya ocurrieron — y algunas pueden estar YA ENTREGADAS.
      *Un ledger de avisos no se corrige borrando filas.* Se dejan, y el
      tipo queda huérfano en ellas a propósito.
   ② **Las preferencias sembradas para el gate SE BORRAN** (es el único dato
      que esta reversa sí toca), y con eso las cuentas vuelven a heredar el
      default de la categoría. **Si alguna persona TOCÓ su preferencia
      después de la siembra, esta reversa le borra su elección** — por eso
      el DELETE está acotado por `evidencia->>'origen' = 's107a-gate'`, que
      la siembra estampa justamente para poder distinguirlas.
      ✏️ **Este archivo decía `origen = '…'` — una COLUMNA que no existe.**
      Se midió antes de aplicar: la tabla tiene `evidencia jsonb`, que es
      donde el opt-in de WhatsApp ya guarda su procedencia. *No hacía falta
      una columna nueva: hacía falta leer la que ya estaba.*
   ③ **No revierte `_voz_notificacion` a su cuerpo anterior automáticamente.**
      El brazo nuevo se retira con el `CREATE OR REPLACE` de más abajo, que
      NO está escrito acá porque son 408 líneas: se REGENERA del objeto con
      `pg_get_functiondef` ANTES de aplicar la migración y se guarda al lado
      de este archivo. Ver el paso 0.
   ════════════════════════════════════════════════════════════════════════════ */

-- PASO 0 · el cuerpo viejo de la voz, guardado antes de aplicar:
--   \copy (select pg_get_functiondef('public._voz_notificacion(text,uuid,uuid,jsonb)'::regprocedure)) to 'voz-antes.sql'
-- y se aplica ese archivo acá. SIN ese archivo, esta reversa deja el brazo vivo
-- (inofensivo: un CASE con un tipo que ya no existe nunca se alcanza).

BEGIN;

-- ① el cron
SELECT cron.unschedule('resumen-media-guarderia')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'resumen-media-guarderia');

-- ② el barrido
DROP FUNCTION IF EXISTS public.encolar_resumen_media_guarderia();

-- ③ las preferencias SEMBRADAS por el gate — y sólo ésas
DELETE FROM public.user_notificacion_prefs
 WHERE categoria = 'resumen'
   AND evidencia->>'origen' = 's107a-gate';

-- ④ el tipo. Va ÚLTIMO: mientras exista una intención que lo nombre, el
--    DELETE puede rebotar por FK — y ese rebote es correcto (ver ①).
DELETE FROM public.cat_notificacion_tipos WHERE codigo = 'guarderia_media_resumen';

COMMIT;
