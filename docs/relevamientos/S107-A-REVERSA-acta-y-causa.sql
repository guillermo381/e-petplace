/* REVERSA de `20260830100000_s107a_acta_y_causa.sql` — ESCRITA ANTES DE APLICAR.
   🔴 QUÉ NO DESHACE: nada de datos. Pero **correrla reinstala los dos defectos**:
   ① las dos actas de una estadía vuelven a mostrar LAS MISMAS fotos (la de
      recogida con las de la devolución), y con eso el acta deja de poder
      responder cuándo apareció una lesión;
   ② el domingo de un lugar que abre L-V vuelve a decir «se llenó».
   Cuerpos previos: `S107-A-REVERSA-acta-y-causa-antes.sql`. */
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_acta_guarderia(uuid);
DROP FUNCTION IF EXISTS public.obtener_resumen_guarderias(text, date, uuid, double precision, double precision);
-- re-crear desde el archivo de cuerpos previos.
COMMIT;
