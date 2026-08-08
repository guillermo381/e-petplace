-- ⚠️ ESTADO AL CIERRE DE LA TANDA: **ATENDIDO POR A, CON UNA DIFERENCIA.**
-- A aplicó cinco migraciones (20260807170000 → 190000) que cubren ① el
-- catálogo (105 filas, contadas en DB) y ② `p_raza` — más `p_tipo_agua` y
-- `mascotas.sujeto`, que este pedido no había pensado porque la cláusula del
-- pez se firmó después. Y ③ `evento_hito_narrativo` existe con DOS claves.
--
-- 🔴 LO ÚNICO QUE NO ENTRÓ: **`p_origen`.** Medido: `grep -c p_origen` sobre
-- 20260807183000 → 0, y las dos firmas vivas (`pg_get_function_arguments`)
-- confirman `p_raza` y `p_tipo_agua` y nada más. ⇒ el paso 3 pregunta el
-- origen y el dato se pierde en el viaje. El bloque ② de este archivo sigue
-- siendo el pedido literal de esa mitad.
--
-- Se conserva entero como REGISTRO: sirve para leer qué se pidió contra qué
-- se aplicó. No se re-aplica.

-- ============================================================================
-- S91 · PEDIDO DE LA PISTA D A LA PISTA A — EL ALTA DE MASCOTA
--
-- 76b: texto COMPLETO y autocontenido. Los dos bodies de abajo salieron de
-- `pg_get_functiondef` contra la DB VIVA en esta sesión (7-ago-2026) — no de
-- un reporte previo (L-166). Lo único que D cambió está marcado « ⬅ D ».
--
-- D NO es escritora de DB. Este archivo se aplica, se enmienda o se rebota;
-- lo que D construye contra él vive detrás de una degradación honesta hasta
-- que exista (la pantalla funciona sin sugerencias, no miente sobre ellas).
--
-- ── EL ORDEN IMPORTA ────────────────────────────────────────────────────────
-- ① cat_razas + seed          → sin esto el paso 2 no tiene qué sugerir
-- ② p_raza/p_origen en las 2 RPCs del dueño → sin esto lo elegido NO SE GUARDA
-- ③ evento_hito_narrativo     → CONTRATO, no SQL: la forma la pone A
--
-- ⚠️ ② ES EL QUE SANGRA. Hoy el paso 2 y el campo ORIGEN se pueden construir,
-- mostrar y elegir — y lo elegido se pierde en el viaje. Un alta que pregunta
-- la raza y la tira es peor que una que no la pregunta.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- ① D-379 · EL CATÁLOGO DE RAZAS
-- ════════════════════════════════════════════════════════════════════════════
--
-- Medido en esta sesión: CERO tablas de raza en `public`.
--   (El grep por `%raza%` devuelve `_traza_promocion_e164` — es «traza», no
--    «raza». Falso positivo declarado para que nadie lo lea como que existe.)
--
-- LA LLAVE ES NATURAL, y no es capricho: `(especie, slug)` es exactamente lo
-- que nombra el objeto del bucket (`perro/akita-inu.webp`). Un uuid de
-- superficie obligaría a mantener DOS identidades del mismo hecho.

create table if not exists public.cat_razas (
  especie     text    not null references public.cat_especies (codigo) on update cascade,
  slug        text    not null,
  nombre      text    not null,
  imagen_ruta text    not null,
  activo      boolean not null default true,
  primary key (especie, slug)
);

comment on table public.cat_razas is
  'D-379 · el catálogo SUGIERE, el dueño CONFIRMA (lámina ALTA S91). Sembrado '
  'desde supabase/dev/mapeo-razas-especies.json — el nombre viaja CON su acento; '
  'des-slugificar fabricaría el dato.';

-- ⚠️ RLS Y GRANTS: **espejen los de `cat_especies`, no los inventen.** Es un
-- catálogo de lectura de la misma familia y con los mismos lectores. D no los
-- escribe acá a propósito: copiarlos de memoria sería exactamente el clon que
-- §6 prohíbe, y equivocarlos abriría una tabla nueva a `anon` (L-140).
--
-- Lo único que D SÍ afirma sobre permisos, porque lo necesita:
--   · el dueño autenticado tiene que poder LEER el catálogo entero
--   · NADIE lo escribe desde el producto (se siembra por migración)


-- ── EL SEED — 105 filas, del insumo rescatado ───────────────────────────────
-- Fuente: `supabase/dev/mapeo-razas-especies.json` (rescatado por A en S90).
-- Contadas en esta sesión: ave 10 · conejo 8 · gato 20 · perro 44 · pez 10 ·
-- roedor 8 · reptil 5 = 105. Reconcilia EXACTO con los 111 objetos del bucket
-- que A midió: 105 razas + 6 genéricos (uno por especie ofrecida).
--
-- DOS COSAS QUE EL SEED NO ARREGLA, y se dicen en vez de maquillarse:
--
--   (a) **11 nombres traen un paréntesis de la carpeta de origen** — p. ej.
--       «Agapornis (Lovebird)». Va VERBATIM. Limpiarlos es una decisión de
--       DATO de la mesa; hacerlo acá sería D editando contenido que no midió.
--
--   (b) **`reptil` entra con sus 5 filas y `activo = true`.** No es un
--       descuido: la puerta de especie ya vive en `cat_especies` y una fila de
--       raza de una especie no ofrecida no es alcanzable. Ver el HALLAZGO ⚠️
--       al pie de este archivo — que dice por qué esa frase es HOY falsa.

insert into public.cat_razas (especie, slug, nombre, imagen_ruta) values
  ('ave', 'agapornis', 'Agapornis (Lovebird)', 'ave/agapornis.webp'),
  ('ave', 'cacatua-alba', 'Cacatúa Alba', 'ave/cacatua-alba.webp'),
  ('ave', 'canario', 'Canario', 'ave/canario.webp'),
  ('ave', 'conuro-mejillas-verdes', 'Conuro Mejillas Verdes', 'ave/conuro-mejillas-verdes.webp'),
  ('ave', 'diamante-mandarin', 'Diamante Mandarín', 'ave/diamante-mandarin.webp'),
  ('ave', 'eclectus', 'Eclectus', 'ave/eclectus.webp'),
  ('ave', 'guacamayo-azul-y-amarillo', 'Guacamayo Azul y Amarillo', 'ave/guacamayo-azul-y-amarillo.webp'),
  ('ave', 'loro-yaco-africano', 'Loro Yaco Africano', 'ave/loro-yaco-africano.webp'),
  ('ave', 'ninfa', 'Ninfa (Cockatiel)', 'ave/ninfa.webp'),
  ('ave', 'periquito-australiano', 'Periquito Australiano', 'ave/periquito-australiano.webp'),
  ('conejo', 'californian', 'Californian', 'conejo/californian.webp'),
  ('conejo', 'english-angora', 'English Angora', 'conejo/english-angora.webp'),
  ('conejo', 'holland-lop', 'Holland Lop', 'conejo/holland-lop.webp'),
  ('conejo', 'lionhead', 'Lionhead', 'conejo/lionhead.webp'),
  ('conejo', 'mini-lop', 'Mini Lop', 'conejo/mini-lop.webp'),
  ('conejo', 'mini-rex', 'Mini Rex', 'conejo/mini-rex.webp'),
  ('conejo', 'netherland-dwarf', 'Netherland Dwarf', 'conejo/netherland-dwarf.webp'),
  ('conejo', 'rex', 'Rex', 'conejo/rex.webp'),
  ('gato', 'abisinio', 'Abisinio', 'gato/abisinio.webp'),
  ('gato', 'american-shorthair', 'American Shorthair', 'gato/american-shorthair.webp'),
  ('gato', 'azul-ruso', 'Azul Ruso', 'gato/azul-ruso.webp'),
  ('gato', 'bengali', 'Bengalí', 'gato/bengali.webp'),
  ('gato', 'birmano', 'Birmano (Birman)', 'gato/birmano.webp'),
  ('gato', 'bosque-de-noruega', 'Bosque de Noruega', 'gato/bosque-de-noruega.webp'),
  ('gato', 'british-shorthair', 'British Shorthair', 'gato/british-shorthair.webp'),
  ('gato', 'cornish-rex', 'Cornish Rex', 'gato/cornish-rex.webp'),
  ('gato', 'devon-rex', 'Devon Rex', 'gato/devon-rex.webp'),
  ('gato', 'exotic-shorthair', 'Exotic Shorthair', 'gato/exotic-shorthair.webp'),
  ('gato', 'gato-comun', 'Gato Común', 'gato/gato-comun.webp'),
  ('gato', 'maine-coon', 'Maine Coon', 'gato/maine-coon.webp'),
  ('gato', 'oriental-de-pelo-corto', 'Oriental de Pelo Corto', 'gato/oriental-de-pelo-corto.webp'),
  ('gato', 'persa', 'Persa', 'gato/persa.webp'),
  ('gato', 'ragdoll', 'Ragdoll', 'gato/ragdoll.webp'),
  ('gato', 'scottish-fold', 'Scottish Fold', 'gato/scottish-fold.webp'),
  ('gato', 'siames', 'Siamés', 'gato/siames.webp'),
  ('gato', 'siberiano', 'Siberiano', 'gato/siberiano.webp'),
  ('gato', 'sphynx', 'Sphynx (Esfinge)', 'gato/sphynx.webp'),
  ('gato', 'turkish-angora', 'Turkish Angora (Angora Turco)', 'gato/turkish-angora.webp'),
  ('pez', 'corydora', 'Corydora', 'pez/corydora.webp'),
  ('pez', 'disco', 'Disco', 'pez/disco.webp'),
  ('pez', 'guppy', 'Guppy', 'pez/guppy.webp'),
  ('pez', 'koi', 'Koi', 'pez/koi.webp'),
  ('pez', 'molly', 'Molly', 'pez/molly.webp'),
  ('pez', 'pez-betta', 'Pez Betta (Betta splendens)', 'pez/pez-betta.webp'),
  ('pez', 'pez-dorado', 'Pez Dorado (Goldfish)', 'pez/pez-dorado.webp'),
  ('pez', 'pez-angel-de-agua-dulce', 'Pez Ángel de Agua Dulce (Escalar)', 'pez/pez-angel-de-agua-dulce.webp'),
  ('pez', 'platy', 'Platy', 'pez/platy.webp'),
  ('pez', 'tetra-neon', 'Tetra Neón', 'pez/tetra-neon.webp'),
  ('perro', 'akita-inu', 'Akita Inu', 'perro/akita-inu.webp'),
  ('perro', 'american-bully', 'American Bully', 'perro/american-bully.webp'),
  ('perro', 'beagle', 'Beagle', 'perro/beagle.webp'),
  ('perro', 'bernese', 'Bernese', 'perro/bernese.webp'),
  ('perro', 'bichon-frise', 'Bichon Frise', 'perro/bichon-frise.webp'),
  ('perro', 'border-collie', 'Border Collie', 'perro/border-collie.webp'),
  ('perro', 'boston-terrier', 'Boston terrier', 'perro/boston-terrier.webp'),
  ('perro', 'boxer', 'Boxer', 'perro/boxer.webp'),
  ('perro', 'bull-terrier', 'Bull Terrier', 'perro/bull-terrier.webp'),
  ('perro', 'bulldog-frances', 'Bulldog_Frances', 'perro/bulldog-frances.webp'),
  ('perro', 'bulldog-ingles', 'Bulldog_Ingles', 'perro/bulldog-ingles.webp'),
  ('perro', 'charles-spaniel', 'Charles Spaniel', 'perro/charles-spaniel.webp'),
  ('perro', 'chihuahua', 'Chihuahua', 'perro/chihuahua.webp'),
  ('perro', 'chow-chow', 'Chow Chow', 'perro/chow-chow.webp'),
  ('perro', 'cocker-spaniel', 'Cocker Spaniel', 'perro/cocker-spaniel.webp'),
  ('perro', 'collie', 'Collie', 'perro/collie.webp'),
  ('perro', 'criollo', 'Criollo', 'perro/criollo.webp'),
  ('perro', 'dalmata', 'Dalmata', 'perro/dalmata.webp'),
  ('perro', 'doberman', 'Doberman', 'perro/doberman.webp'),
  ('perro', 'golden-retriever', 'Golden retriever', 'perro/golden-retriever.webp'),
  ('perro', 'gran-danes', 'Gran Danes', 'perro/gran-danes.webp'),
  ('perro', 'husky-siberiano', 'Husky Siberiano', 'perro/husky-siberiano.webp'),
  ('perro', 'jack-rusell', 'Jack_Rusell', 'perro/jack-rusell.webp'),
  ('perro', 'labrador-retriever', 'Labrador_Retriever', 'perro/labrador-retriever.webp'),
  ('perro', 'maltes', 'Maltes', 'perro/maltes.webp'),
  ('perro', 'pastor-belga', 'Pastor Belga', 'perro/pastor-belga.webp'),
  ('perro', 'pastor-aleman', 'Pastor_Aleman', 'perro/pastor-aleman.webp'),
  ('perro', 'pekines', 'Pekines', 'perro/pekines.webp'),
  ('perro', 'pinscher', 'Pinscher', 'perro/pinscher.webp'),
  ('perro', 'pitbul-terrier', 'Pitbul Terrier', 'perro/pitbul-terrier.webp'),
  ('perro', 'pomerania', 'Pomerania', 'perro/pomerania.webp'),
  ('perro', 'poodle', 'Poodle', 'perro/poodle.webp'),
  ('perro', 'pug', 'Pug', 'perro/pug.webp'),
  ('perro', 'rottweiler', 'Rottweiler', 'perro/rottweiler.webp'),
  ('perro', 'salchicha', 'Salchicha', 'perro/salchicha.webp'),
  ('perro', 'samoyedo', 'Samoyedo', 'perro/samoyedo.webp'),
  ('perro', 'san-bernardo', 'San Bernardo', 'perro/san-bernardo.webp'),
  ('perro', 'shiba-inu', 'Shiba Inu', 'perro/shiba-inu.webp'),
  ('perro', 'shih-tzu', 'Shih_Tzu', 'perro/shih-tzu.webp'),
  ('perro', 'shnauzer', 'Shnauzer', 'perro/shnauzer.webp'),
  ('perro', 'springer-spaniel', 'Springer Spaniel', 'perro/springer-spaniel.webp'),
  ('perro', 'stanffordshire-bull-terrier', 'Stanffordshire Bull Terrier', 'perro/stanffordshire-bull-terrier.webp'),
  ('perro', 'weimaraner', 'Weimaraner', 'perro/weimaraner.webp'),
  ('perro', 'yorkshire-terrier', 'Yorkshire_Terrier', 'perro/yorkshire-terrier.webp'),
  ('reptil', 'dragon-barbudo', 'Dragón Barbudo', 'reptil/dragon-barbudo.webp'),
  ('reptil', 'gecko-leopardo', 'Gecko Leopardo', 'reptil/gecko-leopardo.webp'),
  ('reptil', 'piton-bola', 'Pitón Bola', 'reptil/piton-bola.webp'),
  ('reptil', 'serpiente-del-maiz', 'Serpiente del Maíz', 'reptil/serpiente-del-maiz.webp'),
  ('reptil', 'tortuga-rusa', 'Tortuga Rusa', 'reptil/tortuga-rusa.webp'),
  ('roedor', 'chinchilla', 'Chinchilla (Chinchilla lanigera)', 'roedor/chinchilla.webp'),
  ('roedor', 'cobaya-o-cuy', 'Cobaya o Cuy', 'roedor/cobaya-o-cuy.webp'),
  ('roedor', 'degu', 'Degu', 'roedor/degu.webp'),
  ('roedor', 'hamster-ruso', 'Hámster Ruso', 'roedor/hamster-ruso.webp'),
  ('roedor', 'hamster-sirio', 'Hámster Sirio', 'roedor/hamster-sirio.webp'),
  ('roedor', 'jerbo-o-gerbil-mongol', 'Jerbo o Gerbil Mongol', 'roedor/jerbo-o-gerbil-mongol.webp'),
  ('roedor', 'rata-domestica', 'Rata Doméstica (Rattus norvegicus domestica)', 'roedor/rata-domestica.webp'),
  ('roedor', 'raton-domestico', 'Ratón Doméstico (Mus musculus domesticus)', 'roedor/raton-domestico.webp')
on conflict (especie, slug) do nothing;


-- ════════════════════════════════════════════════════════════════════════════
-- ② LAS DOS RPCs DEL DUEÑO GANAN `p_raza` Y `p_origen`
-- ════════════════════════════════════════════════════════════════════════════
--
-- ⚠️ **L-119: AGREGAR UN PARÁMETRO CON DEFAULT ES UNA SOBRECARGA, NO UN
-- REEMPLAZO.** Sin el DROP explícito quedan DOS funciones vivas con el mismo
-- nombre, y la vieja —la que tira la raza— sigue siendo elegible. El cinturón
-- (a) del pie mide `sobrecargas = 1` justamente porque este error no da
-- síntoma: compila, corre, y pierde el dato en silencio.

drop function if exists public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text);
drop function if exists public.agregar_mascota_a_familia(text, text, date, text, text, text);


-- ── LA REGLA FIRMADA QUE GOBIERNA `p_raza`, y por qué NO se valida ──────────
-- Lámina ALTA S91: «el catálogo SUGIERE, el dueño CONFIRMA — jamás pisa lo
-- declarado». ⇒ `p_raza` es TEXTO LIBRE. Un `p_raza in (select slug from
-- cat_razas …)` parecería una mejora obvia y **rompería la letra**: volvería
-- imposible el mestizo con nombre propio, la raza que el catálogo no tiene, y
-- el «no sé» escrito a mano. `mascotas.raza` ya es `text` libre y lo escriben
-- tres RPCs del prestador sin validar — esto no afloja nada: lo iguala.
--
-- `p_origen` SÍ se valida: su CHECK existe y es cerrado (9 valores, medido).

create or replace function public.crear_familia_con_primera_mascota(
  p_nombre_familia   text,
  p_nombre_mascota   text,
  p_especie          text,
  p_fecha_nacimiento date default null,
  p_precision_fecha  text default null,
  p_sexo             text default null,
  p_foto_url         text default null,
  p_raza             text default null,   -- ⬅ D
  p_origen           text default null    -- ⬅ D
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid        uuid := auth.uid();
  v_familia_id uuid;
  v_miembro_id uuid;
  v_mascota_id uuid;
  v_pet_hash   text;
begin
  if v_uid is null then
    raise exception 'no_autenticado';
  end if;

  if btrim(coalesce(p_nombre_familia, '')) = '' then
    raise exception 'nombre_familia_requerido';
  end if;

  if btrim(coalesce(p_nombre_mascota, '')) = '' then
    raise exception 'nombre_mascota_requerido';
  end if;

  -- Un onboarding por user: si ya es miembro vigente de una familia
  -- estandar, el front debe mandarlo al home, no acá.
  if exists (
    select 1
    from familia_miembro fm
    join familia f on f.id = fm.familia_id
    where fm.user_id = v_uid
      and fm.hasta is null
      and f.tipo = 'estandar'
  ) then
    raise exception 'familia_ya_existe';
  end if;

  -- Mismo guard y código que crear_alta_asistida_* (vocabulario de la casa)
  if not exists (
    select 1 from cat_especies
    where codigo = p_especie and acepta_nuevos_registros = true
  ) then
    raise exception 'especie_invalida_o_inactiva';
  end if;

  -- Guards tipados espejo de los CHECKs (el error de constraint no es tipado)
  if p_sexo is not null and p_sexo not in ('macho', 'hembra', 'desconocido') then
    raise exception 'sexo_invalido';
  end if;

  if p_precision_fecha is not null
     and p_precision_fecha not in ('exacta', 'aproximada', 'estimada') then
    raise exception 'precision_fecha_invalida';
  end if;

  if p_precision_fecha is not null and p_fecha_nacimiento is null then
    raise exception 'precision_sin_fecha';
  end if;

  -- ⬅ D · espejo tipado del CHECK de `mascotas.origen` (9 valores, medido en
  -- esta sesión con pg_get_constraintdef). El front solo ofrece cinco; los
  -- otros cuatro son de otros caminos y el guard no los inventa ni los cierra.
  if p_origen is not null and p_origen not in (
    'criadero', 'refugio', 'adoptado', 'comprado_particular', 'nacido_en_casa',
    'encontrado', 'transferido', 'desconocido', 'alta_asistida'
  ) then
    raise exception 'origen_invalido';
  end if;

  -- familia: tipo estandar + cuenta NULL (chk_familia_virtual_tiene_cuenta),
  -- created_by_user_id seteado + created_by_sistema NULL (chk_familia_creador_xor)
  insert into familia (nombre, tipo, created_by_user_id)
  values (btrim(p_nombre_familia), 'estandar', v_uid)
  returning id into v_familia_id;

  insert into familia_miembro (familia_id, user_id, rol, motivo_alta)
  values (v_familia_id, v_uid, 'adulto_titular', 'onboarding_dueno')
  returning id into v_miembro_id;

  -- pet_hash es GENERATED ALWAYS (L-080): no se inserta, se devuelve.
  insert into mascotas (
    nombre, especie, origen, familia_id, user_id,
    fecha_nacimiento, fecha_nacimiento_precision, sexo, foto_url, raza  -- ⬅ D
  )
  values (
    btrim(p_nombre_mascota), p_especie,
    coalesce(p_origen, 'desconocido'),                                  -- ⬅ D
    v_familia_id, v_uid,
    p_fecha_nacimiento, p_precision_fecha, p_sexo, p_foto_url,
    nullif(btrim(coalesce(p_raza, '')), '')                             -- ⬅ D
  )
  returning id, pet_hash into v_mascota_id, v_pet_hash;

  return jsonb_build_object(
    'familia_id', v_familia_id,
    'familia_miembro_id', v_miembro_id,
    'mascota_id', v_mascota_id,
    'pet_hash', v_pet_hash
  );
end;
$function$;


create or replace function public.agregar_mascota_a_familia(
  p_nombre_mascota   text,
  p_especie          text,
  p_fecha_nacimiento date default null,
  p_precision_fecha  text default null,
  p_sexo             text default null,
  p_foto_url         text default null,
  p_raza             text default null,   -- ⬅ D
  p_origen           text default null    -- ⬅ D
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid        uuid := auth.uid();
  v_familia_id uuid;
  v_mascota_id uuid;
  v_pet_hash   text;
begin
  if v_uid is null then
    raise exception 'no_autenticado';
  end if;

  if btrim(coalesce(p_nombre_mascota, '')) = '' then
    raise exception 'nombre_mascota_requerido';
  end if;

  -- La familia del caller: membresía VIGENTE en familia estandar con rol
  -- adulto. Una sola por diseño (guard familia_ya_existe del onboarding).
  select fm.familia_id
    into v_familia_id
    from familia_miembro fm
    join familia f on f.id = fm.familia_id
   where fm.user_id = v_uid
     and fm.hasta is null
     and f.tipo = 'estandar'
     and fm.rol in ('adulto_titular', 'adulto_autorizado')
   limit 1;

  if v_familia_id is null then
    raise exception 'sin_familia_activa';
  end if;

  -- Mismo guard y código que el onboarding (vocabulario de la casa)
  if not exists (
    select 1 from cat_especies
    where codigo = p_especie and acepta_nuevos_registros = true
  ) then
    raise exception 'especie_invalida_o_inactiva';
  end if;

  if p_sexo is not null and p_sexo not in ('macho', 'hembra', 'desconocido') then
    raise exception 'sexo_invalido';
  end if;

  if p_precision_fecha is not null
     and p_precision_fecha not in ('exacta', 'aproximada', 'estimada') then
    raise exception 'precision_fecha_invalida';
  end if;

  if p_precision_fecha is not null and p_fecha_nacimiento is null then
    raise exception 'precision_sin_fecha';
  end if;

  -- ⬅ D · idéntico al de su gemela: un solo vocabulario de error para el
  -- mismo hecho, en las dos puertas.
  if p_origen is not null and p_origen not in (
    'criadero', 'refugio', 'adoptado', 'comprado_particular', 'nacido_en_casa',
    'encontrado', 'transferido', 'desconocido', 'alta_asistida'
  ) then
    raise exception 'origen_invalido';
  end if;

  -- pet_hash es GENERATED ALWAYS (L-080): no se inserta, se devuelve.
  insert into mascotas (
    nombre, especie, origen, familia_id, user_id,
    fecha_nacimiento, fecha_nacimiento_precision, sexo, foto_url, raza  -- ⬅ D
  )
  values (
    btrim(p_nombre_mascota), p_especie,
    coalesce(p_origen, 'desconocido'),                                  -- ⬅ D
    v_familia_id, v_uid,
    p_fecha_nacimiento, p_precision_fecha, p_sexo, p_foto_url,
    nullif(btrim(coalesce(p_raza, '')), '')                             -- ⬅ D
  )
  returning id, pet_hash into v_mascota_id, v_pet_hash;

  return jsonb_build_object(
    'familia_id', v_familia_id,
    'mascota_id', v_mascota_id,
    'pet_hash', v_pet_hash
  );
end;
$function$;

-- L-140 · las dos nacen sin anon/PUBLIC (los default privileges de la casa ya
-- están curados desde S54, pero el cinturón (d) lo MIDE en vez de suponerlo).
revoke all on function public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text, text, text) from anon, public;
revoke all on function public.agregar_mascota_a_familia(text, text, date, text, text, text, text, text) from anon, public;
grant execute on function public.crear_familia_con_primera_mascota(text, text, text, date, text, text, text, text, text) to authenticated;
grant execute on function public.agregar_mascota_a_familia(text, text, date, text, text, text, text, text) to authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- LOS CINTURONES — adentro de la migración, que aborte si alguno miente
-- ════════════════════════════════════════════════════════════════════════════
do $$
declare
  v_n int;
  v_src text;
begin
  -- (a) L-119 · UNA sola firma viva por nombre. El error que este cinturón
  --     caza no da síntoma: la vieja sigue siendo elegible y tira la raza.
  select count(*) into v_n from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'crear_familia_con_primera_mascota';
  if v_n <> 1 then
    raise exception 'cinturon_alta (a): crear_familia_con_primera_mascota tiene % firmas vivas, se esperaba 1', v_n;
  end if;
  select count(*) into v_n from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'agregar_mascota_a_familia';
  if v_n <> 1 then
    raise exception 'cinturon_alta (a): agregar_mascota_a_familia tiene % firmas vivas, se esperaba 1', v_n;
  end if;

  -- (b) EL ORIGEN HARDCODEADO TIENE QUE HABER MUERTO. Es el discriminador
  --     real de este pedido: si sobrevive, el paso 3 pregunta y la DB ignora.
  --     ⚠️ L-170: `prosrc` lee los comentarios como código. Este cinturón
  --     busca el literal EN SU POSICIÓN de INSERT, no la palabra suelta —
  --     por eso el comentario de arriba puede nombrar 'desconocido' sin
  --     dispararlo. (En S90 este mismo error se cobró una vez: un cinturón se
  --     disparó contra el comentario que lo explicaba.)
  for v_src in
    select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('crear_familia_con_primera_mascota', 'agregar_mascota_a_familia')
  loop
    if v_src !~ 'coalesce\(p_origen' then
      raise exception 'cinturon_alta (b): una de las dos RPCs no usa coalesce(p_origen, ...) — el origen sigue hardcodeado';
    end if;
  end loop;

  -- (c) el catálogo quedó sembrado entero
  select count(*) into v_n from public.cat_razas;
  if v_n <> 105 then
    raise exception 'cinturon_alta (c): cat_razas tiene % filas, se esperaban 105', v_n;
  end if;
  -- y con su acento intacto: si el seed viajó mal codificado, esto cae
  select count(*) into v_n from public.cat_razas where nombre ~ '[áéíóúÁÉÍÓÚñÑ]';
  if v_n <> 14 then
    raise exception 'cinturon_alta (c): % nombres con acento/ñ, se esperaban 14 — el seed viajó mal codificado', v_n;
  end if;

  -- (d) L-140 · ninguna de las dos quedó ejecutable por anon
  select count(*) into v_n from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('crear_familia_con_primera_mascota', 'agregar_mascota_a_familia')
     and array_to_string(coalesce(p.proacl, '{}'::aclitem[]), ',') like '%anon=%';
  if v_n <> 0 then
    raise exception 'cinturon_alta (d): % funciones del alta ejecutables por anon', v_n;
  end if;
end $$;


-- ════════════════════════════════════════════════════════════════════════════
-- ③ `evento_hito_narrativo` — CONTRATO, NO SQL. La forma la pone A.
-- ════════════════════════════════════════════════════════════════════════════
--
-- D **no escribe esta tabla ni la propone**: la maquinaria de eventos
-- (padre + tipada con `UNIQUE(evento_id)`, la puerta única con su
-- `p_procedencia`, `verificar_coherencia_tablas_tipadas()`) es de A, y
-- calcarla de memoria es exactamente el clon de §6. Lo que D declara es lo
-- que el alta PRODUCE y CUÁNDO:
--
--   · SE EMITE UNO SOLO, al crearse la mascota, en la misma transacción del
--     alta. Si el hito falla, **el alta NO se cae** — la mascota ya nació y
--     perder el hito es barato; perder el alta no. (Mismo criterio que el
--     encuadre de foto en el cierre actual, que ya está declarado así.)
--   · SU CONTENIDO NO ES TEXTO LIBRE DEL DUEÑO: es la voz de la casa. Lo que
--     el alta aporta es el ANCLA (mascota + fecha) y, si lo hay, el `origen`
--     — que es lo que le da su matiz («lo encontré» y «nació en casa» no son
--     el mismo hito).
--   · LA VOZ SE FIRMA EN EL GATE, y D la lleva como PROPUESTA. Hasta la firma,
--     D **no emite el hito**: una tabla vacía es honesta, una tabla sembrada
--     con letra inventada no se puede despoblar.
--
-- ⇒ Lo que D necesita de A es UNA función con esta forma, y su nombre:
--      registrar_hito_narrativo(p_mascota_id uuid, p_clave text, p_origen text)
--    Si A prefiere que el hito nazca ADENTRO de las dos RPCs del alta
--    (un `insert` más, cero viaje extra), **mejor** — y entonces este pedido
--    se reduce a un parámetro. D se adapta a lo que A decida; lo que no puede
--    es adivinarlo.


-- ════════════════════════════════════════════════════════════════════════════
-- ④ LOS WRAPPERS — `packages/api` es de A. Contrato, no código.
-- ════════════════════════════════════════════════════════════════════════════
--
--   obtenerRazasDeEspecie(especie: string)
--     → ResultadoWrapper<{ slug: string; nombre: string; imagenRuta: string }[]>
--     · lee `cat_razas` where especie = ? and activo = true, order by nombre
--     · declara su rol por D-587: **lector público de catálogo, gateado por la
--       RLS del catálogo** (mismo estatuto que `obtenerEspeciesActivas`)
--     · el fallo NO se degrada a lista vacía (L-178): una lista vacía dice
--       «esta especie no tiene razas» y un fallo dice «no pude preguntar».
--       El paso 2 los pinta distinto — uno ofrece escribir, el otro reintenta.
--
--   Y el delta en los dos wrappers que YA existen (`packages/api/src/wrappers/
--   onboarding.ts`): `InputCrearFamiliaConPrimeraMascota` e
--   `InputAgregarMascotaAFamilia` ganan `raza?: string` y
--   `origen?: OrigenMascota`, y `CODIGOS_ERROR_ONBOARDING` gana
--   `'origen_invalido'` con su mensaje.
--   D dejó los dos campos ya viajando desde la pantalla: en cuanto la firma
--   exista, el dato llega solo.


-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ HALLAZGO PROBADO — NO ES PARTE DEL PEDIDO, Y ES LO MÁS IMPORTANTE DE ACÁ
-- ════════════════════════════════════════════════════════════════════════════
--
-- `cat_especies.reptil` tiene **`activo = false` y `acepta_nuevos_registros =
-- true`**. Es la ÚNICA fila de las once donde los dos campos divergen (medido
-- en esta sesión: `select codigo, activo, acepta_nuevos_registros from
-- cat_especies` — diez filas coinciden, reptil no).
--
-- **La consecuencia, que es lo que importa:** la grilla del alta filtra por
-- `activo` (así lo hace `obtenerEspeciesActivas`, `packages/api/src/wrappers/
-- catalogos.ts:51`) ⇒ **reptil no se ofrece, tal como la lámina firmó.** Pero
-- las dos RPCs del alta gatean por `acepta_nuevos_registros` ⇒ **aceptarían
-- un reptil.**
--
--   > **«Reptil no se ofrece» es hoy un FILTRO DE PANTALLA, no un apagado
--   > estructural.** Cualquier camino que llegue a la RPC sin pasar por la
--   > grilla —un deep link con `especie=reptil` en los params, una superficie
--   > futura, el alta del prestador— crea el reptil sin chocar con nada.
--
-- Y el borde que lo vuelve visible: **reptil NO tiene `generico.webp` en el
-- bucket** (A lo midió: 400) **pero sus 5 razas SÍ están publicadas.** Un
-- reptil creado por ese camino cae al tercer escalón del fallback (la huella)
-- teniendo imagen de raza disponible — es decir, el síntoma sería confuso.
--
-- **D no lo cura: `cat_especies` es DB.** Es de A/mesa decidir si los dos
-- campos se alinean o si la divergencia es a propósito y tiene otro lector.
-- Lo que D midió es que HOY nadie los cruza.
