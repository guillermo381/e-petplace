/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de `20260907420000_s110a_durante_guarderia.sql`
   ESCRITA ANTES DE APLICAR (regla de la casa desde S67).

   🔴 QUÉ NO DESHACE — se dice primero, porque es lo que importa:

   1. **NO devuelve a `reservada` las estadías que ya se movieron.** Correrla
      deja filas en `recogida_en_curso`, `en_guarderia`, `retorno_en_curso`,
      `entregada` o `no_recogida` **sin ninguna función que pueda moverlas** —
      exactamente el estado del que S110 salió, pero ahora con filas atrapadas
      en medio del día. *Revertir el código no revierte los hechos.*
   2. **NO borra las actas** que los actos únicos levantaron. Un acta es un
      documento probatorio: `guarderia_actas` no se toca acá.
   3. **DROP de las columnas SÍ destruye datos**: `retorno_en`,
      `no_recogida_en`, `no_recogida_motivo` y `no_recogida_detalle` se pierden
      con todo lo escrito en ellas. Si hay filas en `no_recogida`, **el motivo
      por el que la franja cerró sin animal desaparece y no se puede
      reconstruir de ningún otro lado.**
   4. Al volver, `obtener_tramo_vivo_de_mi_mascota` y `obtener_punto_vivo`
      vuelven a **descartar en silencio** (nadie escribe los dos estados que
      filtran). No es un error nuevo: es el defecto que esta migración curó.

   ⇒ Antes de correr esta reversa, mirar:
      SELECT estado, count(*) FROM guarderia_estadias GROUP BY estado;
      SELECT count(*) FROM guarderia_estadias WHERE no_recogida_motivo IS NOT NULL;
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

DROP FUNCTION IF EXISTS public.marcar_a_bordo_guarderia(uuid, boolean, text, text, text);
DROP FUNCTION IF EXISTS public.marcar_llegada_guarderia(uuid[]);
DROP FUNCTION IF EXISTS public.marcar_retorno_guarderia(uuid[]);
DROP FUNCTION IF EXISTS public.marcar_entregada_guarderia(uuid, boolean, text, text, text);
DROP FUNCTION IF EXISTS public.marcar_no_recogida_guarderia(uuid, text, text);
DROP FUNCTION IF EXISTS public.obtener_maquina_estadia_guarderia();
DROP FUNCTION IF EXISTS public.verificar_coherencia_estados_guarderia();
DROP FUNCTION IF EXISTS public._guarderia_aplicar_acto(uuid, text, text, text);
DROP FUNCTION IF EXISTS public._guarderia_estadia_gestionable(uuid);

DROP TABLE IF EXISTS public.cat_guarderia_transiciones;
DROP TABLE IF EXISTS public.cat_guarderia_estados;

ALTER TABLE public.guarderia_estadias
  DROP CONSTRAINT IF EXISTS chk_no_recogida_coherente,
  DROP CONSTRAINT IF EXISTS chk_no_recogida_motivo,
  DROP CONSTRAINT IF EXISTS chk_no_recogida_otro_exige_detalle,
  DROP COLUMN IF EXISTS retorno_en,
  DROP COLUMN IF EXISTS no_recogida_en,
  DROP COLUMN IF EXISTS no_recogida_motivo,
  DROP COLUMN IF EXISTS no_recogida_detalle;

COMMIT;
