-- ============================================================================
-- S91-A · D-379 — EL CATÁLOGO DE RAZAS POR ESPECIE (nace, con su seed)
-- ============================================================================
-- Letra que rige (D-379 + lámina LAMINA_ALTA_MASCOTA_S91, firmada 7-ago-2026):
--   · El catálogo SUGIERE, el dueño CONFIRMA — JAMÁS pisa lo declarado.
--   · «Mestizo» y «No sé» son respuesta legítima de PRIMERA CLASE.
--   ⇒ Consecuencia de diseño: mascotas.raza SIGUE siendo text libre y NO gana
--     FK a este catálogo. Un FK convertiría la sugerencia en imposición y
--     mataría «Mestizo / No sé» — la ausencia del FK es LA LETRA, no un olvido.
--
-- Seed: 105 filas desde supabase/dev/mapeo-razas-especies.json (el mapeo
-- rescatado del scratchpad de C en el cierre S90). El NOMBRE viaja VERBATIM
-- del campo `carpeta` — con sus acentos y ñ (14 filas) y sus paréntesis
-- aclaratorios (11 filas). JAMÁS des-slugificado: «Cacatúa Alba», no un
-- `cacatua-alba` recapitalizado. Si la superficie quiere acortar el nombre
-- con paréntesis, esa es una decisión de pantalla con su gate — el catálogo
-- guarda la fuente.
--
-- ruta_imagen apunta al bucket público `especies-razas` (111 objetos vivos,
-- origen-IA firmado D-288): '<especie>/<slug>.webp'.
-- Las 5 filas de reptil se siembran (existen en bucket y mapeo) — la especie
-- reptil está activo=false en cat_especies y la grilla no la ofrece; el gate
-- de especie vive en cat_especies, no acá.
--
-- Veda 76(g): NO RIGE — aditiva pura (tabla nueva + seed de catálogo), cero
-- backfill sobre datos vivos, cero funciones tocadas.
-- D-662 (bundles vivos): ningún bundle publicado consulta cat_razas (la tabla
-- nace acá); compatible por existencia.
-- Reversa escrita ANTES: docs/relevamientos/2026-08-07-s91a-REVERSA-cat-razas.sql
-- ============================================================================

BEGIN;

CREATE TABLE public.cat_razas (
  especie      text NOT NULL REFERENCES public.cat_especies(codigo) ON DELETE RESTRICT,
  slug         text NOT NULL,
  nombre       text NOT NULL,
  ruta_imagen  text NOT NULL,
  activo       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (especie, slug),
  CONSTRAINT cat_razas_nombre_unico_por_especie UNIQUE (especie, nombre),
  CONSTRAINT chk_cat_razas_slug_forma CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT chk_cat_razas_ruta_forma CHECK (ruta_imagen = especie || '/' || slug || '.webp')
);

COMMENT ON TABLE public.cat_razas IS
  'D-379 (S91): catálogo de razas por especie para el tipeo predictivo del alta. SUGIERE, jamás impone: mascotas.raza sigue text libre SIN FK a propósito («Mestizo / No sé» son primera clase). nombre verbatim del mapeo (acentos verdaderos); ruta_imagen en bucket especies-razas.';

-- RLS espejo del patrón de catálogos de la casa (cat_especies: select público)
ALTER TABLE public.cat_razas ENABLE ROW LEVEL SECURITY;

CREATE POLICY cat_razas_select_publica ON public.cat_razas
  FOR SELECT USING (true);

-- Sin policies de escritura: el catálogo lo escribe la migración (postgres),
-- nadie más.

INSERT INTO public.cat_razas (especie, slug, nombre, ruta_imagen) VALUES
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
  ('perro', 'pastor-aleman', 'Pastor_Aleman', 'perro/pastor-aleman.webp'),
  ('perro', 'pastor-belga', 'Pastor Belga', 'perro/pastor-belga.webp'),
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
  ('pez', 'corydora', 'Corydora', 'pez/corydora.webp'),
  ('pez', 'disco', 'Disco', 'pez/disco.webp'),
  ('pez', 'guppy', 'Guppy', 'pez/guppy.webp'),
  ('pez', 'koi', 'Koi', 'pez/koi.webp'),
  ('pez', 'molly', 'Molly', 'pez/molly.webp'),
  ('pez', 'pez-angel-de-agua-dulce', 'Pez Ángel de Agua Dulce (Escalar)', 'pez/pez-angel-de-agua-dulce.webp'),
  ('pez', 'pez-betta', 'Pez Betta (Betta splendens)', 'pez/pez-betta.webp'),
  ('pez', 'pez-dorado', 'Pez Dorado (Goldfish)', 'pez/pez-dorado.webp'),
  ('pez', 'platy', 'Platy', 'pez/platy.webp'),
  ('pez', 'tetra-neon', 'Tetra Neón', 'pez/tetra-neon.webp'),
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
  ('roedor', 'raton-domestico', 'Ratón Doméstico (Mus musculus domesticus)', 'roedor/raton-domestico.webp');

-- ── Cinturones (miden el resultado, abortan la migración si no cierra) ──────
DO $$
DECLARE
  v_total     int;
  v_acentos   int;
  v_especies  int;
  v_reptil    int;
BEGIN
  SELECT count(*) INTO v_total FROM cat_razas;
  IF v_total <> 105 THEN
    RAISE EXCEPTION 'cinturon_cat_razas: total % <> 105 (el mapeo tiene 105 filas)', v_total;
  END IF;

  -- Los acentos VIAJARON: 14 nombres con caracteres fuera de ASCII (medido
  -- del mapeo antes de escribir esta migración). Un seed que los perdiera
  -- (des-slugificación, encoding roto) daría otro número.
  SELECT count(*) INTO v_acentos FROM cat_razas
   WHERE octet_length(nombre) <> char_length(nombre);
  IF v_acentos <> 14 THEN
    RAISE EXCEPTION 'cinturon_cat_razas: % nombres con acento/ñ <> 14 — el encoding se rompió en el viaje', v_acentos;
  END IF;

  SELECT count(DISTINCT especie) INTO v_especies FROM cat_razas;
  IF v_especies <> 7 THEN
    RAISE EXCEPTION 'cinturon_cat_razas: % especies <> 7 (perro·gato·ave·pez·conejo·roedor·reptil)', v_especies;
  END IF;

  SELECT count(*) INTO v_reptil FROM cat_razas WHERE especie = 'reptil';
  IF v_reptil <> 5 THEN
    RAISE EXCEPTION 'cinturon_cat_razas: % reptil <> 5', v_reptil;
  END IF;

  -- mascotas.raza NO ganó FK (la letra): si alguien lo agrega después, que
  -- sea con firma — acá se asierta el estado que esta migración deja.
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.mascotas'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) LIKE '%cat_razas%'
  ) THEN
    RAISE EXCEPTION 'cinturon_cat_razas: mascotas gano un FK a cat_razas — eso contradice la letra D-379 (el catalogo sugiere)';
  END IF;
END $$;

COMMIT;
