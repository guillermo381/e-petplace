-- REVERSA de `20260805010000_lote1_puerta_intenciones.sql` (S87-A).
-- Escrita ANTES de aplicar.
--
-- ⚠️ NOTA DE DATOS: aditiva pura HOY (tabla nueva sin filas + funciones +
-- un trigger sobre `mascotas` que solo PURGA cola). Revertir no pierde ningún
-- dato de negocio.
--
-- PERO revertir tiene una consecuencia que hay que decir: se pierden las
-- intenciones registradas y su registro de SOMBRA (§10.2) — que es
-- precisamente la evidencia de qué habría salido y a quién. Si ya corrió
-- sombra, esa historia no se recupera.
--
-- Y lo más importante: revertir DEVUELVE EL SISTEMA AL MODO SOMBRA
-- ACCIDENTAL — las siete DEFINER vuelven a escribir sin ningún gate de §5.

BEGIN;

DROP TRIGGER IF EXISTS trg_mascotas_purga_cola_memorial ON public.mascotas;
DROP FUNCTION IF EXISTS public._trg_mascotas_purga_cola_memorial();
DROP FUNCTION IF EXISTS public.registrar_intencion_notificacion(text, uuid, uuid, uuid, jsonb, text);
DROP TABLE IF EXISTS public.notificacion_intencion;

ALTER TABLE public.cat_notificacion_categorias
  DROP COLUMN IF EXISTS techo_ventana_horas,
  DROP COLUMN IF EXISTS techo_max;

COMMIT;
