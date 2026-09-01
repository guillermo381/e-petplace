/* REVERSA de `20260907460000_s110a_lector_del_dia_y_punto_vivo.sql` — ESCRITA ANTES.
   🔴 QUÉ NO DESHACE:
   1. Volver la firma vieja del lector **rompe la pantalla del día del
      prestador**, que a partir de S110-C lee `no_recogida_motivo`,
      `no_recogida_en` y `retorno_en`. *Revertir el motor sin revertir el
      bundle deja el día en error.*
   2. Revertir el gate de `registrar_punto_vivo` **REABRE la escritura**:
      cualquier autenticado con un `tramo_id` vuelve a poder falsear la
      ubicación de un vehículo ajeno.
   Los cuerpos viejos viven en `20260829120000` (lector) y `20260829220000`
   (punto). No hay datos que revertir: esta migración no escribe ninguno. */
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_estadias_del_dia(uuid, date);
DROP FUNCTION IF EXISTS public.obtener_estadias_por_rango(uuid, date, date);
-- Reponer sus cuerpos viejos A MANO desde las migraciones citadas arriba.
COMMIT;
