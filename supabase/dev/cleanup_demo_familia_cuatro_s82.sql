-- ═════════════════════════════════════════════════════════════════════
-- CLEANUP del SEED S82 — la familia de cuatro. Par de
-- `seed_demo_familia_cuatro_s82.sql`. Borra POR UUID FIJO (quirúrgico:
-- jamás por nombre ni por "los que parecen demo").
--
-- NO borra el user de auth ni su `profiles`: el user lo creó el founder
-- a mano y puede querer conservarlo para re-sembrar. Borrarlo desde acá
-- sería decidir por él.
--
-- ORDEN: mascotas → miembro → familia (FK RESTRICT; regla 41).
-- SI UNA MASCOTA TIENE EVENTOS/CITAS, ESTE CLEANUP FALLA A PROPÓSITO —
-- el expediente es append-only y no se borra de contrabando: si eso
-- pasa, la demo dejó de ser demo y la decisión es del founder.
-- ═════════════════════════════════════════════════════════════════════
do $cleanup$
declare
  v_fam uuid := 'de820000-0000-4000-8000-0000000000fa';
  v_n int;
begin
  select count(*) into v_n
    from eventos_mascota e join mascotas m on m.id = e.mascota_id
   where m.familia_id = v_fam;
  if v_n > 0 then
    raise exception 'cleanup S82: las mascotas de la familia demo tienen % eventos de expediente. No se borra append-only sin decisión del founder.', v_n;
  end if;

  select count(*) into v_n
    from evento_cita_servicio c join mascotas m on m.id = c.mascota_id
   where m.familia_id = v_fam;
  if v_n > 0 then
    raise exception 'cleanup S82: hay % citas contra estas mascotas. Limpiar las citas primero (cleanup_citas_test.sql).', v_n;
  end if;

  delete from mascotas where familia_id = v_fam;
  delete from familia_miembro where familia_id = v_fam;
  delete from familia where id = v_fam;

  if exists (select 1 from familia where id = v_fam) then
    raise exception 'cleanup S82: la familia sigue viva';
  end if;

  -- EL ARCHIVO DEL AVATAR NO LO BORRA ESTE SCRIPT, y se dice en voz alta
  -- (S82-A r18-bis): los BYTES no viven en una tabla — borrar la fila de
  -- `storage.objects` por SQL dejaría el objeto huérfano en el bucket,
  -- que es exactamente la basura que S47-B0.1 tuvo que barrer a mano
  -- (22 objetos). Se borra por la misma puerta por la que entró:
  --   npx supabase storage rm ss:///mascotas/<uid>/avatar-demo-cuatro-s82.png --experimental
  -- Dejarlo tampoco hace daño: pesa 2.9 KB, vive en la carpeta del
  -- titular demo y solo él lo lee.
  raise notice 'CLEANUP S82 OK — familia de cuatro borrada (el user de auth y su profile QUEDAN, a propósito). EL AVATAR del bucket NO se borró: sacarlo con `supabase storage rm` si molesta (ver nota arriba).';
end;
$cleanup$;
