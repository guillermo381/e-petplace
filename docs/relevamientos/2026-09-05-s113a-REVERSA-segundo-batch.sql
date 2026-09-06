-- REVERSA de 20260909280000_s113a_segundo_batch.sql (S113-A)
-- Escrita ANTES de aplicar.
--
-- 🔴 QUÉ NO DESHACE:
-- ① Las fichas del segundo Batch se borran, y **regenerarlas cuesta plata**.
--    Los .json siguen versionados en `docs/loop/`, así que la carga se rehace
--    sin volver a llamar al modelo — pero el `do update` de las por-especie
--    **pisó el contenido vacío de `gato-comun` y `criollo`, y eso no vuelve**:
--    revertir las deja borradas, no vacías como estaban.
-- ② Las seis filas «por especie» se van con sus fichas por cascade.
begin;
delete from public.razas_contenido
 where generado_el >= '2026-09-05T23:00:00Z' and not activo;
delete from public.cat_razas
 where especie = slug and especie in ('pez','ave','conejo','reptil','roedor','cobaya');
commit;
