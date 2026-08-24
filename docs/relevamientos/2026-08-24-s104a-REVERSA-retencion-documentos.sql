-- REVERSA de `20260824030000_s104a_retencion_documentos.sql` · S104-A
-- ⚠️ NO deshace los archivos ya borrados: el borrado de Storage es real y no
-- tiene vuelta. Tampoco repone `archivo_url` en las filas que el trigger
-- limpió — y no debe: esa limpieza ES el cumplimiento de §6.2 («concluida la
-- verificación, la Compañía no conserva la imagen»).
-- Revertir REABRE la conservación indefinida que D-901 vino a cerrar.
begin;
drop trigger if exists trg_documento_purga_al_verificar on public.prestador_documentos;
drop function if exists public._trg_documento_purga_al_verificar();
drop function if exists public.purgar_documentos_vencidos();
alter table public.prestador_documentos drop column if exists documento_ultimos4;
commit;
