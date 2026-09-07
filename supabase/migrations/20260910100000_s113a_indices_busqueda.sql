-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A · FASE 3 — LOS ÍNDICES QUE LE FALTABAN A LA BÚSQUEDA
--
-- 🔴 **ESTO NO CURA UN PROBLEMA MEDIDO, y se dice.** El p95 de hoy es
-- **14,8 ms** (30 corridas, 10 términos, sin contar el viaje) contra un
-- objetivo de 200. *Vender esto como una optimización sería vender una cura
-- sin enfermedad.*
--
-- Se agregan porque el p95 de hoy **no predice el de mañana**: `papeles_familia`
-- tiene 0 filas y `pedidos` unos pocos cientos. Sin índice, cada búsqueda
-- recorre la tabla entera, y eso escala con el uso — el día que la bóveda tenga
-- los exámenes de mil familias, el número de arriba deja de existir.
--
-- ⚠️ Y EL PROPIO NÚMERO SE LEE CON CUIDADO: **30 muestras no dan un p95**, dan
-- casi el máximo. Es una señal, no un percentil (ley de E: *una corrida no es
-- una medición*). Lo que sí sostiene es el orden de magnitud: milisegundos de
-- un dígito, no cientos.
-- ═══════════════════════════════════════════════════════════════════════════

-- Las citas: se busca por el motivo, que es lo que la familia recuerda
-- («la de la vacuna»), no por el id.
create index if not exists idx_fts_citas_motivo
  on public.evento_cita_servicio
  using gin (to_tsvector('spanish', coalesce(motivo, '')));

-- Los pedidos, por su NÚMERO: es lo que la familia tiene a mano cuando
-- pregunta. Se indexa como texto porque se busca como texto.
create index if not exists idx_fts_pedidos_numero
  on public.pedidos
  using gin (to_tsvector('spanish', coalesce(numero_orden, '')));

-- La bóveda: título y origen del papel.
create index if not exists idx_fts_papeles
  on public.papeles_familia
  using gin (to_tsvector('spanish',
    coalesce(titulo, '') || ' ' || coalesce(origen, '')));

-- 🔴 Y LOS ANALITOS, que es lo que de verdad se busca. Sin este índice, buscar
-- «hematocrito» obliga a recorrer TODOS los valores de TODOS los papeles —
-- la tabla que más rápido crece de las cuatro: un solo hemograma trae veinte
-- filas.
create index if not exists idx_fts_papel_valor
  on public.papel_valor
  using gin (to_tsvector('spanish', analito));
