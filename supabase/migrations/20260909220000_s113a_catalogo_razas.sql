-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A — EL CATÁLOGO DE RAZAS: las cuatro erratas y el ensanche
--
-- ── LAS CUATRO ERRATAS, y cómo se encontraron ───────────────────────────────
-- ⚠️ El primer censo fue por derivación —comparar el slug contra el slugify del
-- nombre— y dio **12 divergencias, once de ellas legítimas**: el slug omite el
-- paréntesis del alias a propósito (`ninfa` para «Ninfa (Cockatiel)»). *Un censo
-- por patrón acota, no cierra* (L-437). Las cuatro reales salieron de leer la
-- lista entera, y las cuatro son ortografía:
--   jack-rusell                 → jack-russell                 (falta una «s»)
--   pitbul-terrier              → pit-bull-terrier             («Pitbul»)
--   stanffordshire-bull-terrier → staffordshire-bull-terrier   («Stanffordshire»)
--   shnauzer                    → schnauzer                    (falta la «c»)
--
-- 🟢 CENSO DE REFERENCIAS ANTES DE TOCAR, y el resultado desarma el miedo:
--   · `mascotas.raza` es TEXTO LIBRE y referencia por NOMBRE, no por slug
--     (medido: 42 filas casan por nombre, **0 por slug**). Cambiar un slug no
--     toca a ninguna mascota.
--   · Mascotas que usan alguno de los cuatro nombres mal escritos: **CERO**.
--   · `razas_contenido` (única FK real): **0 filas**.
--   ⇒ Las cuatro se corrigen sin arrastre. *Si alguna hubiera tenido mascotas,
--     la corrección del NOMBRE sí las habría desconectado de su cara — y eso
--     habría exigido un UPDATE sobre `mascotas`, no sobre el catálogo.*
--
-- ── POR QUÉ `ruta_imagen` PASA A NULLABLE ───────────────────────────────────
-- Hoy hay **una imagen por raza**: 105 filas, 105 rutas distintas, 0 rotas
-- (medido contra `storage.objects`). Sumar ~110 razas serían ~110 dibujos que
-- no existen, y **una ruta que apunta a un archivo ausente es peor que un
-- null**: el null lo sabe el código, el 404 lo descubre el usuario.
--
-- 🟢 Y la degradación YA ESTÁ CONSTRUIDA, no hay que inventarla:
-- `urlGenericaDeEspecie()` arma `<especie>/generico.webp` POR CONVENCIÓN, y los
-- lectores tipan `raza_ruta_imagen: string | null` con su escalera escrita
-- (`mascotasPrestador.ts:73`). **Las seis genéricas existen en el bucket y
-- ninguna fila las apunta** — estaban dibujadas y sin uso desde S91.
-- ⇒ Una raza nueva sin arte cae sola a la cara de su especie. *Se hace lo mejor
-- que se puede, y donde no llegamos, se dice: acá el null es la manera de
-- decirlo.*
--
-- ── DE DÓNDE SALE LA LISTA, declarado ───────────────────────────────────────
-- 🔴 **La fuente es el conocimiento del modelo sobre razas con presencia en
-- Ecuador y LatAm, NO un registro medido.** No hay padrón consultado ni censo
-- de criaderos. Se declara porque la diferencia importa: esto es una PROPUESTA
-- para que el founder tache o sume, y tiene una segunda red — el Batch de D
-- devuelve `conocida: false` sobre cualquier raza que no reconozca, y una ficha
-- no conocida **no se puede publicar** (CHECK de `razas_contenido`). *Una raza
-- de más en el selector es un nombre sin ficha; nunca un párrafo inventado.*
--
-- ── LA COLUMNA QUE HACE REVERSIBLE ESTO ─────────────────────────────────────
-- `creado_en_s113` marca lo agregado hoy. Sin ella, la reversa tendría que
-- listar 110 slugs a mano y **cualquier fila que el founder agregue después
-- caería con ellas**. Con la marca, la reversa saca exactamente lo que esta
-- migración puso.
--
-- 76(g) — VEDA: NO RIGE. DDL aditiva + UPDATE de cuatro filas medidas sin
-- referencias + INSERT. Cero anclas, cero backfill sobre datos de familias.
-- ═══════════════════════════════════════════════════════════════════════════
begin;

alter table public.cat_razas alter column ruta_imagen drop not null;
comment on column public.cat_razas.ruta_imagen is
  'Path en el bucket especies-razas. NULLABLE desde S113: una raza puede existir '
  'antes que su dibujo, y los lectores caen solos a <especie>/generico.webp.';

alter table public.cat_razas add column if not exists creado_en_s113 boolean not null default false;
comment on column public.cat_razas.creado_en_s113 is
  'Marca del ensanche de S113. Existe para que la reversa saque exactamente lo '
  'que esta migración puso y no lo que se agregue después.';

-- ── LAS CUATRO ERRATAS ──────────────────────────────────────────────────────
-- 🔴 **LA REFERENCIA QUE EL PRIMER CENSO NO VIO NO ESTÁ EN LA BASE: ESTÁ EN
-- STORAGE.** Lo cazó `chk_cat_razas_ruta_forma`, que exige
-- `ruta_imagen = especie||'/'||slug||'.webp'` — o sea que **el slug y el nombre
-- del archivo son el mismo dato en dos lugares**, y los cuatro dibujos se
-- llaman con la errata adentro (`perro/jack-rusell.webp`, `perro/shnauzer.webp`,
-- `perro/pitbul-terrier.webp`, `perro/stanffordshire-bull-terrier.webp`).
-- *Un censo de referencias que sólo mira `pg_constraint` mira la mitad del
-- mundo: la otra mitad son los nombres de archivo.*
--
-- ⚠️ ESTA MIGRACIÓN NO PUEDE RENOMBRAR OBJETOS DE STORAGE (no hay credencial
-- de servicio en esta sesión, y no se pide una para esto). Así que se elige, y
-- se declara:
--   · **Se corrige el slug**, porque es la llave de la que `razas_contenido` va
--     a colgar fichas para siempre: un slug mal escrito se propaga a todo lo
--     que se escriba después y no se puede corregir sin arrastre.
--   · **`ruta_imagen` queda en null en esas cuatro**, y caen a la cara genérica
--     de su especie por la escalera que ya existe. *Se pierde el dibujo propio,
--     no la fila ni el nombre.* Vuelve solo el día que alguien renombre cuatro
--     archivos en el bucket y ponga la ruta derivada — dos líneas.
update public.cat_razas set slug='jack-russell',                nombre='Jack Russell',               ruta_imagen=null where slug='jack-rusell';
update public.cat_razas set slug='pit-bull-terrier',            nombre='Pit Bull Terrier',           ruta_imagen=null where slug='pitbul-terrier';
update public.cat_razas set slug='staffordshire-bull-terrier',  nombre='Staffordshire Bull Terrier', ruta_imagen=null where slug='stanffordshire-bull-terrier';
update public.cat_razas set slug='schnauzer',                   nombre='Schnauzer',                  ruta_imagen=null where slug='shnauzer';

-- ── EL ENSANCHE ─────────────────────────────────────────────────────────────
-- `on conflict do nothing`: si el founder ya agregó alguna a mano, la suya gana.
insert into public.cat_razas (especie, slug, nombre, ruta_imagen, activo, creado_en_s113)
values
  ('perro','affenpinscher','Affenpinscher', null, true, true),
  ('perro','airedale-terrier','Airedale Terrier', null, true, true),
  ('perro','akita-americano','Akita Americano', null, true, true),
  ('perro','alaskan-malamute','Alaskan Malamute', null, true, true),
  ('perro','american-staffordshire-terrier','American Staffordshire Terrier', null, true, true),
  ('perro','basenji','Basenji', null, true, true),
  ('perro','basset-hound','Basset Hound', null, true, true),
  ('perro','bichon-habanero','Bichón Habanero', null, true, true),
  ('perro','bloodhound','Bloodhound', null, true, true),
  ('perro','bobtail','Bobtail', null, true, true),
  ('perro','boerboel','Boerboel', null, true, true),
  ('perro','border-terrier','Border Terrier', null, true, true),
  ('perro','borzoi','Borzoi', null, true, true),
  ('perro','bouvier-de-flandes','Bouvier de Flandes', null, true, true),
  ('perro','braco-aleman','Braco Alemán', null, true, true),
  ('perro','briard','Briard', null, true, true),
  ('perro','bull-terrier-miniatura','Bull Terrier Miniatura', null, true, true),
  ('perro','bullmastiff','Bullmastiff', null, true, true),
  ('perro','cane-corso','Cane Corso', null, true, true),
  ('perro','cavalier-king-charles-spaniel','Cavalier King Charles Spaniel', null, true, true),
  ('perro','chino-crestado','Chino Crestado', null, true, true),
  ('perro','cocker-spaniel-americano','Cocker Spaniel Americano', null, true, true),
  ('perro','coton-de-tulear','Coton de Tuléar', null, true, true),
  ('perro','dogo-argentino','Dogo Argentino', null, true, true),
  ('perro','dogo-de-burdeos','Dogo de Burdeos', null, true, true),
  ('perro','fila-brasileno','Fila Brasileño', null, true, true),
  ('perro','fox-terrier','Fox Terrier', null, true, true),
  ('perro','galgo-espanol','Galgo Español', null, true, true),
  ('perro','gran-pirineo','Gran Pirineo', null, true, true),
  ('perro','greyhound','Greyhound', null, true, true),
  ('perro','grifon-de-bruselas','Grifón de Bruselas', null, true, true),
  ('perro','keeshond','Keeshond', null, true, true),
  ('perro','kerry-blue-terrier','Kerry Blue Terrier', null, true, true),
  ('perro','komondor','Komondor', null, true, true),
  ('perro','kuvasz','Kuvasz', null, true, true),
  ('perro','labradoodle','Labradoodle', null, true, true),
  ('perro','lhasa-apso','Lhasa Apso', null, true, true),
  ('perro','mastin-espanol','Mastín Español', null, true, true),
  ('perro','mastin-napolitano','Mastín Napolitano', null, true, true),
  ('perro','mastin-tibetano','Mastín Tibetano', null, true, true),
  ('perro','papillon','Papillón', null, true, true),
  ('perro','pastor-australiano','Pastor Australiano', null, true, true),
  ('perro','pastor-de-shetland','Pastor de Shetland', null, true, true),
  ('perro','pastor-suizo-blanco','Pastor Suizo Blanco', null, true, true),
  ('perro','perro-de-agua-espanol','Perro de Agua Español', null, true, true),
  ('perro','perro-sin-pelo-del-peru','Perro Sin Pelo del Perú', null, true, true),
  ('perro','pinscher-miniatura','Pinscher Miniatura', null, true, true),
  ('perro','pointer','Pointer', null, true, true),
  ('perro','presa-canario','Presa Canario', null, true, true),
  ('perro','puli','Puli', null, true, true),
  ('perro','rhodesian-ridgeback','Rhodesian Ridgeback', null, true, true),
  ('perro','saluki','Saluki', null, true, true),
  ('perro','samoyedo-blanco','Samoyedo Blanco', null, true, true),
  ('perro','schnauzer-gigante','Schnauzer Gigante', null, true, true),
  ('perro','schnauzer-miniatura','Schnauzer Miniatura', null, true, true),
  ('perro','setter-ingles','Setter Inglés', null, true, true),
  ('perro','setter-irlandes','Setter Irlandés', null, true, true),
  ('perro','shar-pei','Shar Pei', null, true, true),
  ('perro','terranova','Terranova', null, true, true),
  ('perro','vizsla','Vizsla', null, true, true),
  ('perro','west-highland-white-terrier','West Highland White Terrier', null, true, true),
  ('perro','whippet','Whippet', null, true, true),
  ('perro','xoloitzcuintle','Xoloitzcuintle', null, true, true),
  ('perro','pastor-ovejero-belga-malinois','Pastor Ovejero Belga Malinois', null, true, true),
  ('perro','boyero-de-berna','Boyero de Berna', null, true, true),
  ('perro','golden-doodle','Golden Doodle', null, true, true),
  ('perro','perro-de-montana-de-los-pirineos','Perro de Montaña de los Pirineos', null, true, true),
  ('gato','balines','Balinés', null, true, true),
  ('gato','bombay','Bombay', null, true, true),
  ('gato','burmes','Burmés', null, true, true),
  ('gato','himalayo','Himalayo', null, true, true),
  ('gato','manx','Manx', null, true, true),
  ('gato','munchkin','Munchkin', null, true, true),
  ('conejo','gigante-de-flandes','Gigante de Flandes', null, true, true),
  ('conejo','belier-frances','Belier Francés', null, true, true),
  ('conejo','holandes-enano','Holandés Enano', null, true, true),
  ('conejo','jersey-wooly','Jersey Wooly', null, true, true),
  ('conejo','hotot-enano','Hotot Enano', null, true, true),
  ('ave','cotorra-argentina','Cotorra Argentina', null, true, true),
  ('ave','guacamayo-escarlata','Guacamayo Escarlata', null, true, true),
  ('ave','amazona-frentiazul','Amazona Frentiazul', null, true, true),
  ('ave','jilguero','Jilguero', null, true, true),
  ('ave','cacatua-ninfa-perlada','Cacatúa Ninfa Perlada', null, true, true),
  ('pez','pleco-limpiavidrios','Pleco (Limpiavidrios)', null, true, true),
  ('pez','oscar','Oscar', null, true, true),
  ('pez','barbo-tigre','Barbo Tigre', null, true, true),
  ('pez','danio-cebra','Danio Cebra', null, true, true),
  ('pez','gourami-enano','Gourami Enano', null, true, true),
  ('reptil','iguana-verde','Iguana Verde', null, true, true),
  ('reptil','tortuga-de-orejas-rojas','Tortuga de Orejas Rojas', null, true, true),
  ('reptil','camaleon-velado','Camaleón Velado', null, true, true),
  ('reptil','boa-constrictora','Boa Constrictora', null, true, true),
  ('reptil','tortuga-mordedora','Tortuga Mordedora', null, true, true),
  ('roedor','hamster-roborovski','Hámster Roborovski', null, true, true),
  ('roedor','hamster-enano-de-campbell','Hámster Enano de Campbell', null, true, true),
  ('roedor','hamster-chino','Hámster Chino', null, true, true),
  ('roedor','ardilla-de-tierra','Ardilla de Tierra', null, true, true),
  ('cobaya','cobaya-americana','Cobaya Americana', null, true, true),
  ('cobaya','cobaya-peruana','Cobaya Peruana', null, true, true),
  ('cobaya','cobaya-abisinia','Cobaya Abisinia', null, true, true),
  ('cobaya','cobaya-teddy','Cobaya Teddy', null, true, true),
  ('cobaya','cobaya-skinny','Cobaya Skinny', null, true, true),
  ('equino','criollo','Criollo', null, true, true),
  ('equino','cuarto-de-milla','Cuarto de Milla', null, true, true),
  ('equino','pura-sangre-ingles','Pura Sangre Inglés', null, true, true),
  ('equino','paso-fino-colombiano','Paso Fino Colombiano', null, true, true),
  ('equino','arabe','Árabe', null, true, true),
  ('equino','percheron','Percherón', null, true, true),
  ('huron','huron','Hurón', null, true, true),
  ('otro','otro','Otra especie', null, true, true)
on conflict (especie, slug) do nothing;

commit;
