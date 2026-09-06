-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A — LAS MASCOTAS DE PRUEBA SE PUEDEN NOMBRAR
--
-- Firma del founder (5-sep-2026): **en la familia `guillo381+8` las únicas
-- reales son Thor y Zeus.** Las otras doce son fixture y se marcan; **ninguna se
-- borra hoy.**
--
-- ── EL FRENO QUE HUBO QUE LEVANTAR, y cambia el encargo ─────────────────────
-- 🔴 La orden decía «con la misma marca que ya usan Sombra y Bruma
-- (`creado_por_sistema`)». **Medido: `mascotas` NO TIENE esa columna ni ninguna
-- otra de marca.** La de Sombra y Bruma vive en
-- `eventos_mascota.creado_por_sistema = 'fixture_s113e_memorial'` — o sea que
-- marca **el EVENTO que las volvió memorial, no a la mascota**.
--
-- *Y la diferencia no es formal: con la marca sólo en el evento, un censo de
-- `mascotas` sigue contándolas como reales, que es exactamente el problema que
-- esta orden viene a resolver.* Por eso la columna nace acá.
--
-- ⚠️ EL NOMBRE, elegido y no heredado: la casa tiene DOS grafías vivas —
-- `created_by_sistema` en `familia` y `pedidos`, `creado_por_sistema` en
-- `eventos_mascota`—. Se usa la segunda: es la que el founder nombró y la que
-- usa la tabla hermana con la que estas filas se cruzan todo el tiempo.
--
-- ── POR QUÉ MARCAR Y NO BORRAR ──────────────────────────────────────────────
-- Estas doce tienen eventos, y varias son sujeto de pruebas vivas de otras
-- pistas —Bruma y Sombra son los memoriales sobre los que E y C miden—.
-- *Una mascota de prueba borrada a destiempo no rompe un test: lo vuelve
-- irreproducible, que es peor porque no se nota.* Marcadas, se censan y se
-- borran con una consulta el día que el founder lo diga.
--
-- 76(g) — VEDA: NO RIGE. Una columna nullable y un UPDATE sobre doce filas de
-- una familia de pruebas.
-- ═══════════════════════════════════════════════════════════════════════════
begin;

alter table public.mascotas add column if not exists creado_por_sistema text;

comment on column public.mascotas.creado_por_sistema is
  'Marca de FIXTURE. NULL = mascota real. Existe para que los censos de '
  '«mascotas reales» puedan excluirlas: sin esto se ven exactamente igual que '
  'una real y cualquier número de producto sale inflado. Espeja la grafía de '
  'eventos_mascota.creado_por_sistema.';

create index if not exists idx_mascotas_fixture
  on public.mascotas (familia_id) where creado_por_sistema is not null;

update public.mascotas
   set creado_por_sistema = 'fixture_founder_s113'
 where familia_id = 'ce057f90-82d8-40f8-a816-796c0f2b5b2a'
   and nombre not in ('Thor', 'Zeus');

commit;
