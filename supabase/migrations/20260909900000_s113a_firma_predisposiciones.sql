-- ============================================================================
-- S113-A · LA FIRMA DEL FOUNDER SOBRE LAS 22 REGLAS (6-sep-2026)
--
-- Las seis razas que hoy tienen mascotas REALES quedan `revisada`; las otras
-- 560 filas siguen `en_revision` y no disparan. *Se revisa por demanda, como
-- las fichas: aprobar 582 de una sentada sería aprobar en bloque, que es lo
-- mismo que no revisar.*
--
-- 🔴 **LA FIRMA SE GUARDA, NO SE SUPONE.** Sin `revisado_por` y `revisado_en`,
-- dentro de un mes nadie puede distinguir una regla que alguien leyó de una
-- que se encendió en una migración — y estas frases terminan en un aviso sobre
-- la salud de un animal. *Un estado sin autor es una afirmación sin dueño.*
--
-- 76(g): **NO RIGE.** Columnas aditivas + UPDATE de 22 filas nombradas una por
-- una: no hay `where` amplio que pueda alcanzar de más.
-- ============================================================================

alter table public.raza_predisposicion
  add column if not exists revisado_por uuid references auth.users(id),
  add column if not exists revisado_en  timestamptz;

/* El estado y la firma van juntos o no van: una fila `revisada` sin autor es
   exactamente lo que este CHECK vuelve inexpresable. */
alter table public.raza_predisposicion
  drop constraint if exists chk_raza_predisp_firma;
alter table public.raza_predisposicion
  add constraint chk_raza_predisp_firma
  check (estado <> 'revisada' or (revisado_por is not null and revisado_en is not null));

update public.raza_predisposicion rp
   set estado = 'revisada',
       revisado_por = '75d0798a-ea90-4a97-a2f2-74f3234d892a'::uuid,  -- founder
       revisado_en = now()
 where (rp.raza_codigo, rp.predisposicion_codigo) in (
   ('american-bully','cadera'), ('american-bully','corazon'), ('american-bully','ojos'),
   ('american-bully','piel'), ('american-bully','respiracion'),
   ('beagle','cadera'), ('beagle','ojos'), ('beagle','peso'),
   ('bulldog-ingles','cadera'), ('bulldog-ingles','ojos'), ('bulldog-ingles','piel'),
   ('bulldog-ingles','respiracion'),
   ('chinchilla','dientes'), ('chinchilla','piel'), ('chinchilla','respiracion'),
   ('labrador-retriever','cadera'), ('labrador-retriever','ojos'), ('labrador-retriever','peso'),
   ('persa','dientes'), ('persa','ojos'), ('persa','respiracion'), ('persa','rinon')
 );

do $$
declare v_rev int; v_total int; v_sin_firma int;
begin
  select count(*) into v_rev from raza_predisposicion where estado='revisada';
  select count(*) into v_total from raza_predisposicion;
  if v_rev <> 22 then
    /* Se nombra el número real: un UPDATE que alcanza menos filas de las
       nombradas casi siempre es un slug que no casa, y sin este control se
       vería como «se aprobaron todas». */
    raise exception 'CINTURON: se firmaron % filas y se esperaban 22 — revisá los slugs', v_rev;
  end if;
  select count(*) into v_sin_firma from raza_predisposicion
   where estado='revisada' and (revisado_por is null or revisado_en is null);
  if v_sin_firma > 0 then raise exception 'CINTURON: % revisadas sin autor', v_sin_firma; end if;
  raise notice 'CINTURON OK · 22 de % firmadas por el founder · el resto sigue en revisión', v_total;
end $$;
