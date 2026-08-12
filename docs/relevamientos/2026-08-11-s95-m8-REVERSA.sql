-- ═══════════════════════════════════════════════════════════════════
-- REVERSA DE LA MIGRACIÓN 8 · S95-C — el barrido final
--   supabase/migrations/20260811190000_s95_m8_barrido.sql
--
-- 🔴 LO QUE PUEDE Y LO QUE NO:
--
--   ✅ La deshace ENTERA sin pérdida de dato: esta migración solo revoca
--      privilegios y escribe comentarios. Ninguna fila se tocó.
--
--   ⚠️ **PERO REVERTIRLA REABRE DOS PUERTAS DE ESCRITURA ANÓNIMA.** `anon`
--      vuelve a tener INSERT, UPDATE y DELETE sobre `seller_perfil` y
--      `resenas_productos` — que es el estado que la migración vino a cerrar,
--      y el mismo agujero que D-757 cerró en `pedidos`.
--
--   ⇒ Se incluye por completitud de la reversa, NO porque convenga ejecutarla.
--      **Si el objetivo es revertir otra migración, esta parte se deja quieta:
--      los grants de estas dos tablas no bloquean nada.**
--
--   El resto de la migración (los ocho bloques de verificación) NO tiene
--   reversa porque no cambia nada: pregunta.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ⚠️ ACÁ SE REABREN LAS DOS PUERTAS. Leer arriba.
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.seller_perfil TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.resenas_productos TO anon, authenticated;

COMMENT ON TABLE public.seller_perfil IS NULL;
COMMENT ON TABLE public.resenas_productos IS NULL;

COMMIT;
