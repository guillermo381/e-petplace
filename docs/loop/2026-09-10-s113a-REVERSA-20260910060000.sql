-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260910060000_s113a_boveda.sql               (ESCRITA ANTES)
--
-- ── QUÉ DESHACE ────────────────────────────────────────────────────────────
-- Borra la puerta y las dos tablas de la bóveda.
--
-- 🔴 QUÉ **NO** DESHACE, y es lo que la vuelve peligrosa:
-- ① **NO borra los archivos del bucket `papeles-familia`.** Postgres no puede:
--    `storage.protect_delete` rebota el DELETE sobre `storage.objects`, y aun
--    sin él quedaría el blob. Los papeles que una familia trajo de su clínica
--    anterior siguen en Storage, huérfanos y sin fila que los nombre.
--    *Un archivo sin fila no es basura: es el examen de un animal que nadie
--    puede volver a encontrar.* Se barren por Storage API, a mano y a
--    conciencia, como se hizo en `D-731`.
-- ② **NO borra los eventos ya sedimentados.** Un examen que entró al
--    expediente es del animal: la bóveda es la PUERTA, no la dueña del dato.
--    Revertir la puerta no des-transcribe lo que ya se transcribió.
-- ③ Si hay filas en `papel_valor`, la reversa ABORTA. Es a propósito: obliga
--    a decidir a mano en vez de perder transcripciones en silencio.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare n int;
begin
  select count(*) into n from public.papel_valor;
  if n > 0 then
    raise exception 'hay % valor(es) transcritos: decidí qué hacer con ellos antes de revertir', n;
  end if;
end $$;

drop function if exists public.registrar_papel_de_familia(uuid, text, text, date, text, jsonb, text);
drop function if exists public.obtener_papeles_de_mascota(uuid);
drop table if exists public.papel_valor;
drop table if exists public.papeles_familia;

select 'reversa 20260910060000 · los archivos del bucket NO se borraron' as nota;
