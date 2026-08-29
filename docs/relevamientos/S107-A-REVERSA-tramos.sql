/* REVERSA de `20260829220000_s107a_tramos.sql` — ESCRITA ANTES DE APLICAR.

   🔴 QUÉ **NO** DESHACE, y hay que leerlo antes de correrla:
   ① **Los puntos vivos ya emitidos se BORRAN con la FK** (`ON DELETE CASCADE`).
      No es pérdida real: un punto vivo es efímero por diseño (una fila por
      tramo, pisada por cada emisión) — pero se dice, porque «cascade» no es una
      palabra que deba sorprender a nadie.
   ② **Deja `obtener_punto_vivo` SIN GATE otra vez.** Correr esta reversa
      REABRE la fuga: cualquiera con un `tramo_id` vuelve a ver la ubicación en
      vivo de un vehículo. *No hay motivo conocido para correrla; queda por
      disciplina.*
   ③ **No revierte `obtener_punto_vivo` a su cuerpo anterior automáticamente**:
      el cuerpo previo se guardó al lado, en
      `S107-A-REVERSA-punto-vivo-antes-del-gate.sql`, y se aplica a mano. */
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_tramo_vivo_de_mi_mascota(uuid);
DROP FUNCTION IF EXISTS public.cerrar_tramo_guarderia(uuid);
DROP FUNCTION IF EXISTS public.abrir_tramo_guarderia(uuid, date, text, uuid[]);
ALTER TABLE public.guarderia_tramo_punto DROP CONSTRAINT IF EXISTS guarderia_tramo_punto_tramo_id_fkey;
ALTER TABLE public.guarderia_estadias DROP COLUMN IF EXISTS tramo_recogida_id;
ALTER TABLE public.guarderia_estadias DROP COLUMN IF EXISTS tramo_devolucion_id;
DROP TABLE IF EXISTS public.guarderia_tramos;
-- y el cuerpo viejo de obtener_punto_vivo, desde su archivo (ver ③).
COMMIT;
