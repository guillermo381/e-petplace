-- ═══════════════════════════════════════════════════════════════════
-- REVERSA DE LA MIGRACIÓN 7 · S95-C — el puente al Bio-Expediente
--   supabase/migrations/20260811180000_s95_m7_expediente.sql
--
-- 🔴 LO QUE PUEDE Y LO QUE NO:
--
--   ✅ HOY la deshace sin pérdida: `evento_producto_asignacion` nació vacía y
--      `eventos_mascota` NO se tocó — sin backfill, sin borrado, sin edición
--      de las 295 filas vivas (el cinturón lo verifica y aborta si cambiaron).
--
--   ❌ 🔴 **CON LA PRIMERA COMPRA DEPOSITADA, ESTA REVERSA DESTRUYE
--      EXPEDIENTE.** No es una tabla de operación: es la vida documentada de
--      una mascota, append-only, que VIAJA CON ELLA si cambia de familia
--      (BIO_EXPEDIENTE P2/E1). **Un evento del expediente no se borra nunca —
--      ni siquiera para revertir una migración.**
--
--   ⇒ Con eventos vivos, esta reversa NO se ejecuta. Se desactiva el tipo
--     (`cat_tipos_evento.activo = false` + `deprecado_motivo`), que es como
--     esta casa jubila un catálogo sin romper lo que ya se registró.
--
--   ⚠️ Y revertir `modo_captura` (D-753) borra el dato de si un evento lo
--      asistió una IA. Esa columna es barata hoy y cara después precisamente
--      porque su valor no se puede reconstruir mirando la fila.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

DROP TRIGGER IF EXISTS trg_producto_asignacion_frontera ON public.evento_producto_asignacion;
DROP FUNCTION IF EXISTS public._trg_producto_asignacion_frontera();

-- 🔴 ANTES DE EJECUTAR: si esto devuelve > 0, PARAR. Hay expediente adentro.
--
--    SELECT count(*) FROM evento_producto_asignacion;
--
DROP TABLE IF EXISTS public.evento_producto_asignacion;

ALTER TABLE public.eventos_mascota
  DROP CONSTRAINT IF EXISTS chk_producto_asignacion_procedencia;

-- ⚠️ Borra el dato de D-753 para TODOS los eventos, no solo los de compra.
ALTER TABLE public.eventos_mascota DROP COLUMN IF EXISTS modo_captura;

UPDATE public.cat_tipos_evento
   SET tabla_tipada = NULL, updated_at = now()
 WHERE codigo = 'producto_asignacion';

COMMIT;
