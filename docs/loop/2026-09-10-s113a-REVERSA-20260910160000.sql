-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260910160000_s113a_boveda_confirmacion.sql   (ESCRITA ANTES)
--
-- Deshace la partición en dos actos y devuelve la puerta única.
--
-- 🔴 QUÉ VUELVE A ROMPERSE, con su número: la confirmación humana vuelve a
-- vivir en la PANTALLA, y E llegó al último guard desde PostgREST sin confirmar
-- nada. *Revertir esto no restaura un estado neutro: reabre la puerta por la
-- que un papel entra al expediente sin que nadie lo haya mirado.*
--
-- Y se pierden `literal` y `referencia`: el texto crudo del extractor, que es
-- la única red cuando el parseo sale mal.
--
-- ⚠️ ABORTA si hay papeles `por_confirmar`: quedarían huérfanos de puerta.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare n int;
begin
  select count(*) into n from public.papeles_familia where estado = 'por_confirmar';
  if n > 0 then
    raise exception 'hay % papel(es) sin confirmar: decidí qué hacer antes de revertir', n;
  end if;
end $$;

drop function if exists public.confirmar_papel(uuid, jsonb);
drop function if exists public.registrar_papel_extraido(uuid, text, text, text, date, text, jsonb);
alter table public.papel_valor drop column if exists literal;
alter table public.papel_valor drop column if exists referencia;
alter table public.papeles_familia drop column if exists estado;

select 'reversa 20260910160000 · la confirmación vuelve a la pantalla' as nota;
