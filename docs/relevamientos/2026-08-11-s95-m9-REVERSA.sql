-- ═══════════════════════════════════════════════════════════════════
-- REVERSA DEL BLOQUE 1 · S95-D — logística escalable
--   supabase/migrations/20260811200000_s95_m9_logistica_escalable.sql
--
-- 🔴 LO QUE PUEDE Y LO QUE NO:
--
--   ✅ HOY la deshace ENTERA sin pérdida: las dos tablas nuevas nacieron
--      vacías (el cinturón ④ lo verifica) y las columnas agregadas a
--      `producto_variantes`, `cat_transportistas`, `vendedor_bodegas` y
--      `pedidos` no tienen datos — esas cuatro tablas están en cero salvo
--      `cat_transportistas`, cuyas 7 filas solo pierden el factor volumétrico.
--
--   ❌ DEJA DE SERVIR CON EL PRIMER PEDIDO REAL: `pedidos.envio_cotizacion` es
--      el ACTA de cómo se cotizó ese envío. Borrarla deja pedidos cuyo costo
--      de envío no se puede explicar ni reproducir — que es exactamente la
--      trazabilidad que el bloque vino a dar.
--
--   ❌ Y con reglas de envío vivas, borrar `reglas_envio` deja a los pedidos
--      con `envio_regla_id` apuntando a nada.
--
--   ⇒ Con pedidos reales, esta reversa NO se ejecuta.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ─── pedidos: la cotización congelada ──────────────────────────────────────
ALTER TABLE public.pedidos
  DROP COLUMN IF EXISTS envio_regla_id,
  DROP COLUMN IF EXISTS envio_tipo_regla,
  DROP COLUMN IF EXISTS envio_transportista,
  DROP COLUMN IF EXISTS envio_peso_fisico_kg,
  DROP COLUMN IF EXISTS envio_peso_volumetrico_kg,
  DROP COLUMN IF EXISTS envio_peso_facturable_kg,
  DROP COLUMN IF EXISTS envio_cotizacion;

-- ─── la regla y su catálogo ────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_regla_envio_tipo_activo ON public.reglas_envio;
DROP FUNCTION IF EXISTS public._trg_regla_envio_tipo_activo();
DROP TABLE IF EXISTS public.reglas_envio;
DROP TABLE IF EXISTS public.cat_tipos_regla_envio;

-- ─── la promesa ────────────────────────────────────────────────────────────
ALTER TABLE public.vendedor_bodegas
  DROP COLUMN IF EXISTS hora_corte,
  DROP COLUMN IF EXISTS horas_preparacion,
  DROP COLUMN IF EXISTS dias_operacion,
  DROP COLUMN IF EXISTS zona_horaria;

-- ─── el peso volumétrico ───────────────────────────────────────────────────
ALTER TABLE public.cat_transportistas
  DROP COLUMN IF EXISTS factor_volumetrico,
  DROP COLUMN IF EXISTS notas;

ALTER TABLE public.producto_variantes
  DROP COLUMN IF EXISTS largo_cm,
  DROP COLUMN IF EXISTS ancho_cm,
  DROP COLUMN IF EXISTS alto_cm;

-- NOTA: `zonas_cobertura` NO se toca. Sus 20 filas siguen apagadas y marcadas
-- sin verificar, exactamente como las dejó la M6 de S95-C.

COMMIT;
