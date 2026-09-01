/* REVERSA de `20260907600000_s111a_avisos_del_durante.sql` — ESCRITA ANTES.
   🔴 QUÉ HACE AL CORRERLA: **la familia deja de enterarse de que recogieron a
   su animal, de que llegó, de que volvió a casa y de que no se pudo recoger.**
   El durante sigue funcionando entero y vuelve a ser invisible — que es
   exactamente el décimo hallazgo del gate del founder.
   NO borra las notificaciones ya emitidas ni las intenciones encoladas.
   ⚠️ Volver el CHECK de `notificaciones.tipo` a su lista anterior **FALLA si
   ya se emitió alguno de los cuatro**: mirar antes.
      SELECT tipo, count(*) FROM notificaciones WHERE tipo LIKE 'guarderia_%' GROUP BY 1; */
BEGIN;
ALTER TABLE public.cat_guarderia_transiciones DROP COLUMN IF EXISTS tipo_notificacion;
DELETE FROM public.cat_notificacion_tipos WHERE codigo IN
  ('guarderia_a_bordo','guarderia_llegada','guarderia_entregada','guarderia_no_recogida');
/* `_guarderia_aplicar_acto` vuelve a su cuerpo sin aviso: se repone A MANO
   desde `20260907440000`, que es su última versión sin esto. */
COMMIT;
