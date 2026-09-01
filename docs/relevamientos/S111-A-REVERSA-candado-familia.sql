/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de `20260907480000_s111a_candado_familia_mascota.sql`
   ESCRITA ANTES DE APLICAR.

   🔴 QUÉ NO DESHACE — y acá es lo único que importa:

   1. **CORRERLA REABRE LA PUERTA.** Vuelve a dejar que cualquier familiar
      adulto —o el dueño directo, por el brazo legacy— escriba
      `mascotas.familia_id` **hacia una familia que no es suya**, desde la app,
      con la clave anon del bundle. Medido en S110 con la sonda: pasaba hacia
      ajena y hacia propia.
   2. **NO revierte los traspasos que ya hayan ocurrido.** Una mascota que
      cambió de familia se queda donde está; su evento de transferencia, si
      existe, tampoco se borra — y **es correcto que no se borre**: un evento
      del expediente no se deshace revirtiendo código.
   3. **NO desarma el camino nuevo.** Si para entonces existe la RPC de
      traspaso, sigue funcionando: corre como DEFINER y nunca dependió de este
      trigger. *Lo único que la reversa hace es volver a permitir el camino
      VIEJO, que es el que no deja rastro.*

   ⇒ Mirar antes de correrla:
      SELECT count(*) FROM mascotas WHERE familia_id IS NOT NULL;
      SELECT count(*) FROM eventos_mascota
       WHERE tipo_evento = 'transferencia_familia';   -- si ya existe el tipo
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

DROP TRIGGER IF EXISTS trg_mascotas_protege_familia ON public.mascotas;
DROP FUNCTION IF EXISTS public._mascotas_protege_familia();

COMMIT;
