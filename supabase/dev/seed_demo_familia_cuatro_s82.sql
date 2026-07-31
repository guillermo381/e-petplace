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
  -- La foto de Nina. PATH, jamás URL (bucket PRIVADO desde S47; el CHECK
  -- `mascotas_foto_url_es_path` rebota cualquier cosa que empiece con
  -- http). La carpeta es el user_id del titular, que es como el bucket
  -- está particionado — se resuelve abajo, con el uid ya leído, para que
  -- el path no quede hardcodeado dos veces.
  v_foto text;
  v_n  int;
begin
  select id into v_uid from auth.users where email = v_email;
  if v_uid is null then
    raise exception E'seed S82 familia de cuatro: el user % no existe en auth.users.\n  Crearlo en Supabase Auth con ese email y volver a correr — el seed resuelve el uid solo.', v_email;
  end if;
  v_foto := v_uid::text || '/avatar-demo-cuatro-s82.png';

  -- EL SEED NO PUEDE SUBIR BYTES: los objetos del bucket no viven en una
  -- tabla que un INSERT alcance. Si el archivo no está, la fila tendría
  -- un path que no resuelve y la app pintaría un hueco — el avatar roto
  -- es PEOR que el fallback de iniciales, porque parece un bug del
  -- render. Así que se verifica su existencia y, si falta, el seed DICE
  -- cómo subirlo en vez de sembrar una promesa (L-192).
  if not exists (select 1 from storage.objects
                  where bucket_id = 'mascotas' and name = v_foto) then
    raise exception E'seed S82: falta el archivo del avatar en el bucket.\n  Generarlo y subirlo (una sola vez):\n    node supabase/dev/generar_avatar_demo_s82.mjs /tmp/avatar-nina.png\n    npx supabase storage cp /tmp/avatar-nina.png ss:///mascotas/% --experimental', v_foto;
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
  -- NINA LLEVA FOTO, LAS OTRAS TRES NO (S82-A r18-bis) — y la MEZCLA es
  -- el punto: una lista donde TODAS tienen foto no prueba el fallback, y
  -- una donde ninguna la tiene no prueba el render. Con 1 de 4 conviven
  -- los dos caminos en la misma pantalla, en todos los tamaños a la vez.
  -- Nina es la SEGUNDA alfabéticamente pero la primera que el ojo cruza
  -- en el orden del seed tras Roco; el founder la nombró por eso.
  --
  -- LOS CAMPOS DE ENCUADRE NO SE TOCAN A PROPÓSITO: quedan en su DEFAULT
  -- (cx .5 · cy .42 · z 1.3, migración 20260729233000). El discriminador
  -- tiene que probar el encuadre POR DEFECTO, que es el que va a ver el
  -- 99% de las mascotas reales — sembrar valores a medida probaría un
  -- caso que casi nadie tiene.
  insert into mascotas (id, user_id, familia_id, nombre, especie, raza, sexo, country_code, estado_vida, origen, talla, pelaje, foto_url)
  values
    (v_m1, v_uid, v_fam, 'Roco',  'perro', 'Mestizo',            'macho',  'EC', 'activa', 'desconocido', 'M', 'normal', null),
    (v_m2, v_uid, v_fam, 'Nina',  'perro', 'Beagle',             'hembra', 'EC', 'activa', 'desconocido', 'S', 'normal', v_foto),
    (v_m3, v_uid, v_fam, 'Bruno', 'perro', 'Labrador',           'macho',  'EC', 'activa', 'desconocido', 'L', 'normal', null),
    (v_m4, v_uid, v_fam, 'Lía',   'perro', 'Schnauzer miniatura','hembra', 'EC', 'activa', 'desconocido', 'S', 'largo',   null)
  on conflict (id) do nothing;

  -- El `do nothing` de arriba no alcanza para una familia YA sembrada
  -- antes de que existiera la foto (que es el caso del founder hoy): sin
  -- este UPDATE, re-correr el seed lo dejaría exactamente igual y el
  -- silencio parecería éxito. Es idempotente y solo toca a Nina.
  update mascotas set foto_url = v_foto where id = v_m2 and foto_url is distinct from v_foto;

  -- ── VERIFICACIÓN: el seed DECLARA lo que dejó (L-192: un seed que no
  --    verifica su propio resultado es una esperanza, no un seed) ──
  select count(*) into v_n from mascotas where familia_id = v_fam;
  if v_n <> 4 then
    raise exception 'seed S82: la familia quedó con % mascotas, se esperaban 4', v_n;
  end if;
  if not exists (select 1 from familia_miembro where familia_id = v_fam and user_id = v_uid) then
    raise exception 'seed S82: el titular no quedó vinculado a la familia';
  end if;
  -- La MEZCLA es el discriminador: exactamente una con foto y tres sin
  -- ella. Si alguna vez quedan 0 (el UPDATE no corrió) o 4 (alguien las
  -- sembró todas), el seed dejó de probar lo que vino a probar.
  select count(*) into v_n from mascotas where familia_id = v_fam and foto_url is not null;
  if v_n <> 1 then
    raise exception 'seed S82: quedaron % mascotas con foto, se esperaba exactamente 1 (la mezcla ES el discriminador)', v_n;
  end if;

  raise notice 'SEED S82 OK — familia % con 4 perros (Roco · Nina · Bruno · Lía), titular % (%). Los cuatro casos del extremo quedan visibles: selector sin auto-resolver · CTA apagado · barrido L-b · filtro por mascota con 4 chips.', v_fam, v_email, v_uid;
end;
$seed$;
