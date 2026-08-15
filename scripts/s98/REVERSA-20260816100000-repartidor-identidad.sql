-- REVERSA de 20260816100000_s98a_repartidor_identidad_y_vehiculos.sql
-- ESCRITA ANTES DE APLICAR (regla de la casa).
--
-- ── QUÉ DESHACE ────────────────────────────────────────────────────────────
--   · las cuatro columnas de identidad de `repartidores` con sus CHECKs y su FK
--   · la tabla `repartidor_vehiculos` ENTERA, con sus filas
--
-- ── 🔴 QUÉ **NO** DESHACE, y hay que leerlo ANTES de correrla ───────────────
--
-- ① **BORRA DATOS DE IDENTIDAD DE PERSONAS REALES, y no hay dónde buscarlos.**
--    `tipo_documento`, `whatsapp` y los dos paths son lo único que el vendedor
--    sabe de quién le entrega. Al revertir, cada repartidor vuelve a ser
--    nombre + número de documento, **y el WhatsApp por el que se lo llama
--    desaparece**. *No es una columna técnica: es el teléfono al que llamás
--    cuando un pedido no llegó.*
--
-- ② **`repartidor_vehiculos` se va COMPLETA.** Las placas no viven en ningún
--    otro lado — no hay tabla espejo ni JSON de respaldo. Revertir es perder
--    qué moto tiene cada quién.
--
-- ③ 🔴 **LOS ARCHIVOS DE STORAGE SOBREVIVEN Y QUEDAN HUÉRFANOS.** Las fotos
--    del documento y de la cara siguen en `cuenta-documentos`, **ilocalizables**
--    porque su única referencia era la columna que esta reversa borra.
--    *Es exactamente el mecanismo de D-731* (una fila borrada dejando el blob
--    vivo para siempre), y acá el blob es **la cédula de una persona**.
--    ⇒ **Antes de correr esta reversa se exportan los paths**, o se deja PII
--      almacenada que nadie puede ni encontrar ni borrar.
--
-- ④ Las puertas (`registrar_repartidor` / `actualizar_repartidor`) las revierte
--    su propia reversa. Correr ESTA sola deja las puertas apuntando a columnas
--    que ya no existen ⇒ **el orden de reversa es: puertas PRIMERO, esquema
--    después.** Al revés, el alta queda rota entre una y otra.

BEGIN;

-- ⑤ El export de rescate, para que ③ no dependa de que alguien se acuerde.
--    Se conserva fuera del alcance de esta reversa a propósito: si el DROP
--    se lleva la tabla, el rastro de los blobs tiene que sobrevivirlo.
CREATE TABLE IF NOT EXISTS public._rescate_repartidor_paths_s98 AS
  SELECT id, cuenta_comercial_id, nombre, documento,
         tipo_documento, whatsapp, documento_foto_path, foto_path, now() AS exportado_en
    FROM public.repartidores
   WHERE documento_foto_path IS NOT NULL OR foto_path IS NOT NULL;

DROP TABLE IF EXISTS public.repartidor_vehiculos;

ALTER TABLE public.repartidores
  DROP CONSTRAINT IF EXISTS chk_repartidores_whatsapp_e164,
  DROP CONSTRAINT IF EXISTS chk_repartidores_doc_foto_es_path,
  DROP CONSTRAINT IF EXISTS chk_repartidores_foto_es_path,
  DROP CONSTRAINT IF EXISTS fk_repartidores_tipo_documento;

ALTER TABLE public.repartidores
  DROP COLUMN IF EXISTS tipo_documento,
  DROP COLUMN IF EXISTS documento_foto_path,
  DROP COLUMN IF EXISTS foto_path,
  DROP COLUMN IF EXISTS whatsapp;

COMMIT;
