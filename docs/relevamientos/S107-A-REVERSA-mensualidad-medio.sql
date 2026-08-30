/* REVERSA de `20260830200000_s107a_mensualidad_medio.sql` — ESCRITA ANTES DE APLICAR.
   🔴 QUÉ NO DESHACE:
   ① **Si ya hay suscripciones creadas, el DROP se lleva la RAÍZ DE AUTORIZACIÓN
      de cobros que pudieron ocurrir.** *Un registro de quién autorizó qué no se
      borra por prolijidad: es lo único que se puede mostrar ante un contracargo.*
      Antes de correrla hay que exportar la tabla.
   ② No toca `tarjetas_guardadas` ni nada del motor de pagos. */
BEGIN;
DROP FUNCTION IF EXISTS public.contratar_mensualidad_guarderia(uuid, uuid, uuid, numeric);
DROP TABLE IF EXISTS public.guarderia_suscripciones;
COMMIT;
