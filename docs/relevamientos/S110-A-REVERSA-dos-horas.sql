/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de `20260907440000_s110a_dos_horas_y_acto.sql` — ESCRITA ANTES.

   🔴 QUÉ NO DESHACE:
   1. **DESTRUYE LA AUDITORÍA.** `guarderia_estadia_actos` es el único lugar
      donde viven JUNTAS la hora de la puerta y la del servidor. Al dropearla,
      la divergencia entre las dos —que es el dato entero— desaparece, y las
      estadías quedan con su hora de puerta sin nada que la respalde.
   2. **NO devuelve el estado de las estadías ya movidas.**
   3. Al volver, `obtener_tramo_vivo_de_mi_mascota` y `obtener_punto_vivo`
      vuelven a APAGAR la ventana «voy en camino a buscarlo» — la familia deja
      de ver el vehículo entre que el tramo abre y el animal sube.
   4. Las cinco RPC vuelven a su firma sin `p_ocurrido_en` ⇒ **la cola offline
      del prestador deja de compilar**, y con ella el camino sin señal.

   ⇒ Mirar antes:
      SELECT acto, count(*), max(registrado_en - ocurrido_en) AS mayor_divergencia
        FROM guarderia_estadia_actos GROUP BY acto;
   ═══════════════════════════════════════════════════════════════════════════ */
BEGIN;
DROP FUNCTION IF EXISTS public.marcar_a_bordo_guarderia(uuid, boolean, timestamptz, text, text, text);
DROP FUNCTION IF EXISTS public.marcar_entregada_guarderia(uuid, boolean, timestamptz, text, text, text);
DROP FUNCTION IF EXISTS public.marcar_llegada_guarderia(uuid[], timestamptz);
DROP FUNCTION IF EXISTS public.marcar_retorno_guarderia(uuid[], timestamptz);
DROP FUNCTION IF EXISTS public.marcar_no_recogida_guarderia(uuid, text, timestamptz, text);
DROP FUNCTION IF EXISTS public._guarderia_aplicar_acto(uuid, text, timestamptz, text, text);
DROP TABLE IF EXISTS public.guarderia_estadia_actos;
/* Las dos lecturas del punto vivo hay que reponerlas a mano desde
   `20260829220000_s107a_tramos.sql` — su cuerpo viejo vive ahí. */
COMMIT;
