-- ═══════════════════════════════════════════════════════════════════════════
-- S113-E · REVERSA de la migración `ia_uso` — ESCRITA ANTES DE APLICAR NADA
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Regla de la casa: la reversa se escribe ANTES que la migración, y declara
-- QUÉ NO DESHACE.
--
-- ── QUÉ DESHACE ────────────────────────────────────────────────────────────
-- La vista, la tabla, sus índices y sus policies. Después de correr esto, el
-- esquema queda byte-equivalente a como estaba antes de la migración.
--
-- ── 🔴 QUÉ **NO** DESHACE ──────────────────────────────────────────────────
-- **BORRA LOS DATOS DE USO YA REGISTRADOS.** `ia_uso` es una tabla de medición
-- append-only: cada fila es una llamada a un modelo que ya ocurrió y que ya se
-- pagó. Revertir esta migración no “desregistra” esas llamadas — las pierde, y
-- con ellas el único registro de cuánto costó la inferencia hasta ese momento.
-- No hay forma de reconstruirlas: el proveedor no expone el `usage` por llamada
-- retroactivamente atado a nuestra `pieza`.
--
-- ⇒ Si se revierte con filas dentro, EXPORTAR PRIMERO:
--      \copy (select * from public.ia_uso) to 'ia_uso_backup.csv' csv header
--
-- ── QUÉ NO TOCA (y por eso es segura) ──────────────────────────────────────
-- Cero efecto sobre cualquier otra tabla, función, policy o grant de la casa.
-- La migración es puramente aditiva: no altera nada preexistente, así que la
-- reversa no tiene que restaurar nada de terceros.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP VIEW IF EXISTS public.v_ia_costo_por_pieza_dia;

-- Las policies y los índices caen con la tabla; se nombran igual para que la
-- reversa siga siendo legible como inventario de lo que la migración creó.
DROP TABLE IF EXISTS public.ia_uso;

COMMIT;

-- ── CINTURÓN DE LA REVERSA ────────────────────────────────────────────────
-- Un DROP que no dropeó nada sale en silencio con `IF EXISTS`. Esto lo caza.
DO $$
BEGIN
  IF to_regclass('public.ia_uso') IS NOT NULL THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: public.ia_uso sigue existiendo';
  END IF;
  IF to_regclass('public.v_ia_costo_por_pieza_dia') IS NOT NULL THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: la vista sigue existiendo';
  END IF;
  RAISE NOTICE 'reversa ia_uso: OK — tabla y vista ausentes';
END $$;
