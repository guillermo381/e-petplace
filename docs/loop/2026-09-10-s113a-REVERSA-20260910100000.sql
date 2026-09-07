-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260910100000_s113a_indices_busqueda.sql      (ESCRITA ANTES)
--
-- Borra los índices GIN de la búsqueda. Es la reversa más barata de la sesión:
-- un índice no guarda datos, así que **no se pierde nada** — sólo se vuelve a
-- recorrer la tabla.
--
-- ⚠️ Con los volúmenes de HOY eso no se nota (p95 medido: 14,8 ms sin índices
-- nuevos, contra un objetivo de 200). *Se dice para que nadie revierta creyendo
-- que apaga un incendio, ni deje de revertir creyendo que lo enciende.*
-- ═══════════════════════════════════════════════════════════════════════════

drop index if exists public.idx_fts_citas_motivo;
drop index if exists public.idx_fts_pedidos_numero;
drop index if exists public.idx_fts_papeles;
drop index if exists public.idx_fts_papel_valor;

select 'reversa 20260910100000 · sólo índices, cero datos' as nota;
