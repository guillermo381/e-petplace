-- REVERSA de 20260909180000_s113a_razas_contenido.sql (S113-A · A8)
-- Escrita ANTES de aplicar, como manda la casa.
--
-- 🔴 QUÉ NO DESHACE: **el contenido cargado se pierde.** Las fichas que D
-- generó con el Batch viven SÓLO en esta tabla; el .json de `.ia-conjuntos/`
-- no está versionado. Revertir sin volver a correr `--recoger` deja el
-- contenido irrecuperable, y volver a generarlo CUESTA PLATA.
-- *Antes de correr esto, exportá la tabla.*
begin;
drop table if exists public.razas_contenido cascade;
commit;
