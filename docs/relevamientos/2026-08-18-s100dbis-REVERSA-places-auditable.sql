-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260820100000_s100dbis_places_auditable.sql`
-- Escrita ANTES de aplicar la migración (regla de la casa).
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 🔴 QUÉ DESHACE Y QUÉ **NO**:
--
-- DESHACE: devuelve las dos RPC a su firma de 7 y 9 argumentos, y quita las
-- tres columnas de auditoría de `direcciones_guardadas`.
--
-- ⚠️ **REVERTIR ESTO NO ROMPE NADA HOY, Y ESO ES JUSTAMENTE LO PELIGROSO.**
-- La app sigue guardando direcciones igual: lo que se pierde es **la capacidad
-- de saber si el punto guardado es el que Places resolvió o uno que el mapa
-- corrió sin que el dueño se enterara**. *El síntoma de esta reversa no es un
-- error: es que dentro de seis meses una entrega falle y no haya contra qué
-- comparar.*
--
-- ⚠️ **Y BORRA DATO QUE NO SE PUEDE RECONSTRUIR.** `lat_places`/`lon_places`
-- son la coordenada que Places devolvió en el momento de resolver: **no se
-- puede volver a calcular después** (Places puede contestar distinto, y el
-- texto pudo cambiar). Un `DROP COLUMN` acá es pérdida definitiva de la única
-- evidencia de la divergencia.
--
-- ⇒ Si hay que revertir por un problema de las RPC, **revertí SOLO las
-- funciones y dejá las columnas**: son aditivas, nullables y no molestan a
-- nadie. Los tres `DROP COLUMN` están al final y separados a propósito.
--
-- NO DESHACE: las direcciones ya guardadas quedan como están. Nunca tuvieron
-- estos datos y **no se inventan retroactivamente** (decisión del founder:
-- *«no inventes un places_id retroactivo»*).

-- ── ① las funciones vuelven a su firma vieja ──────────────────────────────
DROP FUNCTION IF EXISTS public.guardar_direccion_hogar(
  text, text, text, text, text, double precision, double precision,
  text, double precision, double precision);
DROP FUNCTION IF EXISTS public.guardar_direccion_con_alias(
  text, text, text, text, text, text, double precision, double precision, uuid,
  text, double precision, double precision);

-- ⚠️ Y ACÁ FALTA ALGO A PROPÓSITO: **esta reversa NO recrea las funciones
-- viejas.** Sus cuerpos viven en esta misma migración (la que se revierte) y
-- en el historial de `pg_get_functiondef`. *Recrearlas de memoria acá sería
-- escribir una tercera versión del cuerpo, y la tercera versión de un cuerpo
-- copiado a mano es donde entra el error que nadie va a mirar.*
-- Se restauran copiándolas del bloque «CUERPO VIEJO» de la migración.

-- ── ② las columnas: solo si de verdad hay que quitarlas (ver arriba) ──────
-- ALTER TABLE public.direcciones_guardadas DROP COLUMN IF EXISTS lat_places;
-- ALTER TABLE public.direcciones_guardadas DROP COLUMN IF EXISTS lon_places;
-- ALTER TABLE public.direcciones_guardadas DROP COLUMN IF EXISTS punto_movido_a_mano;
