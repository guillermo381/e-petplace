-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A — `schnauzer-miniatura` publicada. Van once.
--
-- Mismo molde que las diez anteriores: firma del founder y fecha, en el mismo
-- acto que el encendido, porque el CHECK los ata.
--
-- ⚠️ Es la ficha de LÍA, y su historia del día es la que la explica: la mascota
-- declara «Schnauzer miniatura» y el catálogo dice «Schnauzer Miniatura» — **una
-- mayúscula la dejaba sin su cara** hasta que `nombre_norm` lo curó esta misma
-- tarde. La raza es una de las 110 que se agregaron hoy, así que su ficha llegó
-- recién con el segundo Batch. *Entre que la mascota existía y que su ficha
-- existe pasó una sesión entera, y las dos puntas se tocaron hoy.*
--
-- 76(g) — VEDA: NO RIGE. UPDATE sobre una fila de contenido propio.
-- ═══════════════════════════════════════════════════════════════════════════
begin;
update public.razas_contenido
   set activo = true,
       revisado_por = '75d0798a-ea90-4a97-a2f2-74f3234d892a'::uuid,
       revisado_en = now()
 where especie = 'perro' and raza_codigo = 'schnauzer-miniatura' and conocida;
commit;
