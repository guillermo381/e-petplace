-- ═════════════════════════════════════════════════════════════════════
-- SEED DEMO S82 — LA FAMILIA DE CUATRO. El extremo que la demo de UNA
-- mascota no puede mostrar, y que se declaró TRES veces en la sesión:
--
--   ① EL CTA APAGADO — con una sola mascota el selector se
--      AUTO-RESUELVE (la elegida viene puesta, corolario S73 de la Ley
--      23: "la puerta no pregunta lo que ya sabe"), así que el estado
--      "sin elegir → CTA deshabilitado" NUNCA se ve. Con cuatro, sí.
--   ② EL BARRIDO DE L-b — el relleno pleno es legal con 2-3 hermanos y
--      SE CAE con 4+. Hoy el máximo del sistema son DOS mascotas
--      (medido: la familia del founder), así que la rama del barrido
--      jamás se pintó en pantalla.
--
-- **NO REEMPLAZA a la familia de una mascota: las dos existen y cada una
-- cubre un extremo.** La de una es la que ya cazó cosas —el CTA muerto
-- del paseo vivió desde S57 justamente porque la familia del founder
-- tiene DOS y nadie vio el caso de una— y esta cubre el otro lado.
--
-- IDEMPOTENTE (re-correr no duplica: todo por UUID fijo con
-- `on conflict do nothing`) y REVERSIBLE con su par
-- `cleanup_demo_familia_cuatro_s82.sql`. UUIDs con prefijo de820000-.
-- NO es migración: se corre a mano, con gate del founder (regla 73).
--
-- ══ PASO PREVIO, ÚNICO Y MANUAL (patrón de la casa, verificado contra
--    los seeds vivos: NINGUNO crea el user de auth — lo exigen y rebotan
--    hablado). El founder crea en Supabase Auth:
--        email: guillo381+cuatro@gmail.com
--    y nada más: **este seed resuelve el uid POR EMAIL** (patrón de
--    `seed_wizard_demo_s58`), así que no hay uuid que pegar a mano ni
--    archivo que editar. Si el user no existe, el seed REBOTA DICIENDO
--    QUÉ FALTA — jamás siembra a medias.
--
-- ══ POR QUÉ ESTE SEED NO ENVEJECE (la respuesta a "¿los datos derivan
--    solos?", declarada acá y no en el reporte): **NO siembra citas, ni
--    eventos, ni nada fechado.** El seed S44 tiene que re-anclar fecha,
--    hora y estado a "hoy" en cada corrida porque siembra citas; éste no
--    tiene una sola fecha viva, así que **corre hoy y en seis meses da
--    exactamente lo mismo**. Los cuatro casos que vino a cubrir
--    (selector, CTA, barrido, filtro por mascota) dependen del CONTEO de
--    hermanos, no del calendario. Si algún día necesita citas, deja de
--    ser barato: eso está declarado abajo, en el costo.
-- ═════════════════════════════════════════════════════════════════════
do $seed$
declare
  v_email text := 'guillo381+cuatro@gmail.com';
  v_uid   uuid;
  v_fam   uuid := 'de820000-0000-4000-8000-0000000000fa';
  -- las cuatro, con uuid fijo para que el cleanup sea quirúrgico
  v_m1 uuid := 'de820000-0000-4000-8000-000000000a01';
  v_m2 uuid := 'de820000-0000-4000-8000-000000000a02';
  v_m3 uuid := 'de820000-0000-4000-8000-000000000a03';
  v_m4 uuid := 'de820000-0000-4000-8000-000000000a04';
  v_n  int;
begin
  select id into v_uid from auth.users where email = v_email;
  if v_uid is null then
    raise exception E'seed S82 familia de cuatro: el user % no existe en auth.users.\n  Crearlo en Supabase Auth con ese email y volver a correr — el seed resuelve el uid solo.', v_email;
  end if;

  insert into profiles (id, email) values (v_uid, v_email)
    on conflict (id) do nothing;

  insert into familia (id, nombre, country_code, created_by_user_id)
    values (v_fam, 'Familia de cuatro (demo S82)', 'EC', v_uid)
    on conflict (id) do nothing;

  insert into familia_miembro (familia_id, user_id, rol)
    values (v_fam, v_uid, 'adulto_titular')
    on conflict do nothing;

  -- LAS CUATRO SON PERRO A PROPÓSITO, y el porqué es de motor: el paseo
  -- declara `especies_elegibles = ["perro"]` (§1bis) y `mascotasElegibles`
  -- filtra ANTES de contar hermanos. Con especies mezcladas, el selector
  -- del paseo mostraría menos de cuatro y el barrido de L-b **volvería a
  -- ser invisible justo en el oficio más restrictivo** — el seed no
  -- cumpliría su único trabajo. Se distinguen por raza y tamaño.
  -- `origen` es NOT NULL con vocabulario cerrado (medido: el CHECK
  -- lista nueve valores, y 'criadero'/'refugio' EXIGEN su id — por eso
  -- ninguno de los dos sirve acá). Se usa 'desconocido', que es el valor
  -- honesto de una demo y el mayoritario del sistema (11 de 16 filas).
  -- ESTE CAMPO LO DESTAPÓ LA PRUEBA IN-TXN: el seed escrito "a ojo"
  -- habría rebotado recién el día que el founder lo corriera.
  insert into mascotas (id, user_id, familia_id, nombre, especie, raza, sexo, country_code, estado_vida, origen, talla, pelaje)
  values
    (v_m1, v_uid, v_fam, 'Roco',  'perro', 'Mestizo',            'macho',  'EC', 'activa', 'desconocido', 'M', 'normal'),
    (v_m2, v_uid, v_fam, 'Nina',  'perro', 'Beagle',             'hembra', 'EC', 'activa', 'desconocido', 'S', 'normal'),
    (v_m3, v_uid, v_fam, 'Bruno', 'perro', 'Labrador',           'macho',  'EC', 'activa', 'desconocido', 'L', 'normal'),
    (v_m4, v_uid, v_fam, 'Lía',   'perro', 'Schnauzer miniatura','hembra', 'EC', 'activa', 'desconocido', 'S', 'largo')
  on conflict (id) do nothing;

  -- ── VERIFICACIÓN: el seed DECLARA lo que dejó (L-192: un seed que no
  --    verifica su propio resultado es una esperanza, no un seed) ──
  select count(*) into v_n from mascotas where familia_id = v_fam;
  if v_n <> 4 then
    raise exception 'seed S82: la familia quedó con % mascotas, se esperaban 4', v_n;
  end if;
  if not exists (select 1 from familia_miembro where familia_id = v_fam and user_id = v_uid) then
    raise exception 'seed S82: el titular no quedó vinculado a la familia';
  end if;

  raise notice 'SEED S82 OK — familia % con 4 perros (Roco · Nina · Bruno · Lía), titular % (%). Los cuatro casos del extremo quedan visibles: selector sin auto-resolver · CTA apagado · barrido L-b · filtro por mascota con 4 chips.', v_fam, v_email, v_uid;
end;
$seed$;
