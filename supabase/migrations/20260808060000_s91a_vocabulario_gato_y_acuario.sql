-- ============================================================================
-- S91-A · EL PAQUETE DEL VOCABULARIO — firma en bloque del founder (8-ago)
-- ============================================================================
-- Cinco actos firmados juntos. Los cinco salieron del gate de strings, y el
-- ① es el que tiene la historia más larga: la enmienda del acuario glosaba
-- «agua, mantenimiento, observación» y **mantenimiento era lo único sin
-- cubrir** — se propuso, no se sembró, y se sembró recién con firma.
--
-- ── ① LA CUARTA DEL ACUARIO ────────────────────────────────────────────────
-- «Le cambié parte del agua» — firmada tal cual. Es EL acto de mantenimiento
-- de un acuario, y su RITMO es el dato que un servicio de acuarios va a
-- querer leer algún día.
--
-- ── ② LAS CINCO PROPIAS DEL GATO, y por qué eran necesarias ────────────────
-- El founder percibió los chips «inclinados a perro» sin poder señalar cuál.
-- **La medición dio la razón y encontró la causa: era una AUSENCIA.** De las
-- 16 terrestres, chips propios por especie: ave 1 · perro 0 · **gato 0** ·
-- conejo 0 · roedor 0. Las 10 originales nacieron de la vida de un perro (su
-- origen fue el adiestramiento) y S91 universalizó LAS PALABRAS — bien —
-- **pero universalizar palabras no agrega los gestos que solo tiene un
-- gato.** Con estas cinco, el gato deja de ser «un perro con otras palabras».
--
-- ── ③ EL VÓMITO, PARTIDO EN EL GATO ────────────────────────────────────────
-- En un gato, **una bola de pelo y un vómito tienen significados clínicos
-- opuestos**: la primera es casi rutina, el segundo es señal. Con un solo
-- chip la familia informaba lo mismo en los dos casos y el dato perdía su
-- valor para el vet. **La partición se hace por HERMANO, no angostando**:
-- `vomito` sigue aplicando a perro y gato (el vómito-señal existe en los
-- dos), y `bola_de_pelo` nace al lado con `orden_display` PEGADO al suyo
-- (25 → 26) para que la elección sea obvia en pantalla. *Angostar `vomito` a
-- perro habría dejado al gato sin poder reportar un vómito de verdad.*
--
-- ── ④ EL INGLÉS SESGADO Y LOS DOS CÓDIGOS QUE MIENTEN ──────────────────────
-- `destrozo_objetos` decía «**Chewed** something up at home» — *chew* es
-- MASTICAR, y **un gato no mastica los muebles: los araña**. El español se
-- había universalizado y el inglés no: nadie lo miró porque el gate de
-- strings se hizo sobre el castellano. **Es el único texto de los 15 con
-- sesgo demostrable de especie.**
--
-- Y los dos códigos: `ladridos_excesivos` y `hizo_adentro` conservaban
-- código de perro con texto ya universal. **El criterio para renombrarlos lo
-- escribió A misma** al cambiar `jugo_con_otros_perros` (*«un código que dice
-- perros sobrevive al texto y vuelve a sesgar en la próxima lectura»*) **y lo
-- aplicó a UNO de los tres.** Se corrige la inconsistencia.
-- ⚠️ **CON SU MIGRACIÓN DE DATO, censada antes: `hizo_adentro` tiene 1 CHIP
-- VIVO** (`evento_bitacora_chips`, medido) — el rename lo arrastra en el
-- mismo acto o quedaría un chip apuntando a un código que ya no existe. *No
-- hay FK que lo hubiera avisado: la tabla de chips guarda el código como
-- texto libre.*
--
-- ── ⑤ LO QUE **NO** SE HACE ACÁ, por firma ─────────────────────────────────
-- Conejo, roedor y perro **también tienen cero chips propios** y eso queda
-- REGISTRADO para mesa futura (**D-692**), no resuelto: *«el mínimo digno de
-- hoy ya es digno»*. **No se inventan chips por simetría.**
--
-- Veda 76(g): NO RIGE en el catálogo (aditivo + renames), pero **SÍ toca UN
-- dato de usuario**: el chip de `hizo_adentro`. Se declara acá y se verifica
-- por cinturón (el chip sigue existiendo, con su código nuevo).
-- D-662: `cat_conductas_bitacora` la lee el vocabulario filtrado; los códigos
-- viajan al bundle SOLO como dato del catálogo (la pantalla no los hardcodea
-- — aviso a D emitido con esta migración). El bundle publicado hoy pide el
-- catálogo VIVO, así que ve los nuevos sin re-publicar.
-- Reversa (con su nota del chip migrado):
--   docs/relevamientos/2026-08-08-s91a-REVERSA-vocabulario-gato-acuario.sql
-- ============================================================================

BEGIN;

-- ── ④a el inglés sesgado ────────────────────────────────────────────────────
UPDATE public.cat_conductas_bitacora
   SET nombre_familia_en = 'Damaged something at home', updated_at = now()
 WHERE codigo = 'destrozo_objetos';

-- ── ④b los dos códigos, CON su dato ────────────────────────────────────────
UPDATE public.cat_conductas_bitacora
   SET codigo = 'hizo_mas_ruido', updated_at = now()
 WHERE codigo = 'ladridos_excesivos';

UPDATE public.cat_conductas_bitacora
   SET codigo = 'hizo_fuera_de_lugar', updated_at = now()
 WHERE codigo = 'hizo_adentro';

-- El chip vivo viaja con su código: sin esto quedaría apuntando a la nada.
UPDATE public.evento_bitacora_chips
   SET codigo = 'hizo_fuera_de_lugar'
 WHERE chip_tipo = 'conducta' AND codigo = 'hizo_adentro';

-- ── ① la cuarta del acuario ────────────────────────────────────────────────
INSERT INTO public.cat_conductas_bitacora
  (codigo, nombre, nombre_familia, nombre_familia_en, orden_display, activo,
   es_seed_preliminar, especies_aplicables, sujetos_aplicables)
VALUES
  ('agua_cambiada', 'Mantenimiento de agua', 'Le cambié parte del agua',
   'Changed some of the water', 105, true, false,
   ARRAY['pez'], ARRAY['acuario'])
ON CONFLICT (codigo) DO NOTHING;

-- ── ② + ③ las cinco propias del gato ───────────────────────────────────────
-- `bola_de_pelo` va en 26, PEGADO a `vomito` (25): la partición se lee en la
-- pantalla o no se lee.
INSERT INTO public.cat_conductas_bitacora
  (codigo, nombre, nombre_familia, nombre_familia_en, orden_display, activo,
   es_seed_preliminar, especies_aplicables, sujetos_aplicables)
VALUES
  ('bola_de_pelo',    'Tricobezoar',              'Vomitó una bola de pelo',
   'Coughed up a hairball',       26, true, false, ARRAY['gato'], ARRAY['individuo']),
  ('bandeja_normal',  'Uso normal de la bandeja', 'Usó la bandeja con normalidad',
   'Used the litter box normally', 31, true, false, ARRAY['gato'], ARRAY['individuo']),
  ('arano_muebles',   'Rascado de superficies',   'Arañó muebles o paredes',
   'Scratched furniture',         21, true, false, ARRAY['gato'], ARRAY['individuo']),
  ('marco_con_orina', 'Marcaje con orina',        'Marcó con orina',
   'Sprayed urine',               32, true, false, ARRAY['gato'], ARRAY['individuo']),
  ('maullo_de_noche', 'Vocalización nocturna',    'Maulló de noche',
   'Yowled at night',             41, true, false, ARRAY['gato'], ARRAY['individuo'])
ON CONFLICT (codigo) DO NOTHING;

-- ── Cinturones ──────────────────────────────────────────────────────────────
DO $$
DECLARE v_n int; v_gato int; v_perro int; v_acu int; v_txt text;
BEGIN
  SELECT count(*) INTO v_n FROM cat_conductas_bitacora WHERE activo;
  IF v_n <> 25 THEN RAISE EXCEPTION 'cinturon_gato: % activas <> 25 (19 + 5 gato + 1 acuario)', v_n; END IF;

  SELECT count(*) INTO v_n FROM cat_conductas_bitacora WHERE es_seed_preliminar;
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturon_gato: % preliminares — las nuevas nacen firmadas', v_n; END IF;

  -- LOS CONTEOS, MEDIDOS Y NO SUPUESTOS (el aviso a D sale de acá):
  --   gato 15 → 20 · perro 15 SIN CAMBIO · acuario 3 → 4
  SELECT count(*) INTO v_gato FROM cat_conductas_bitacora
   WHERE activo AND 'gato' = ANY(especies_aplicables) AND 'individuo' = ANY(sujetos_aplicables);
  IF v_gato <> 20 THEN RAISE EXCEPTION 'cinturon_gato: el gato ve % (esperaba 20)', v_gato; END IF;

  SELECT count(*) INTO v_perro FROM cat_conductas_bitacora
   WHERE activo AND 'perro' = ANY(especies_aplicables) AND 'individuo' = ANY(sujetos_aplicables);
  IF v_perro <> 15 THEN
    RAISE EXCEPTION 'cinturon_gato: el perro ve % (esperaba 15 SIN CAMBIO — las cinco son de gato)', v_perro;
  END IF;

  SELECT count(*) INTO v_acu FROM cat_conductas_bitacora
   WHERE activo AND 'acuario' = ANY(sujetos_aplicables);
  IF v_acu <> 4 THEN RAISE EXCEPTION 'cinturon_gato: el acuario ve % (esperaba 4)', v_acu; END IF;

  -- ④ LOS CÓDIGOS VIEJOS NO SOBREVIVEN EN NINGUNA DE LAS DOS TABLAS
  IF EXISTS (SELECT 1 FROM cat_conductas_bitacora
              WHERE codigo IN ('ladridos_excesivos','hizo_adentro')) THEN
    RAISE EXCEPTION 'cinturon_gato: sobrevive un codigo viejo en el catalogo';
  END IF;
  IF EXISTS (SELECT 1 FROM evento_bitacora_chips
              WHERE codigo IN ('ladridos_excesivos','hizo_adentro')) THEN
    RAISE EXCEPTION 'cinturon_gato: un CHIP quedo apuntando a un codigo que ya no existe';
  END IF;

  -- ④c EL CHIP MIGRADO SIGUE VIVO: el rename no perdió dato de usuario.
  SELECT count(*) INTO v_n FROM evento_bitacora_chips
   WHERE chip_tipo='conducta' AND codigo='hizo_fuera_de_lugar';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'cinturon_gato: el chip migrado no esta (% filas) — se perdio dato de usuario', v_n;
  END IF;

  -- TODO chip registrado resuelve contra el catálogo (no hay FK: se mide)
  IF EXISTS (SELECT 1 FROM evento_bitacora_chips ch
              WHERE ch.chip_tipo='conducta'
                AND NOT EXISTS (SELECT 1 FROM cat_conductas_bitacora c WHERE c.codigo = ch.codigo)) THEN
    RAISE EXCEPTION 'cinturon_gato: hay chips huerfanos del catalogo';
  END IF;

  -- ④a el inglés dejó de masticar
  SELECT nombre_familia_en INTO v_txt FROM cat_conductas_bitacora WHERE codigo='destrozo_objetos';
  IF v_txt ILIKE '%chew%' THEN
    RAISE EXCEPTION 'cinturon_gato: el ingles sigue diciendo chew (%)', v_txt;
  END IF;

  -- Y la clase entera: ninguna conducta activa nombra al perro, en NINGÚN idioma
  SELECT count(*) INTO v_n FROM cat_conductas_bitacora
   WHERE activo AND (nombre_familia ILIKE '%perro%' OR nombre_familia ILIKE '%ladr%'
                  OR nombre_familia_en ILIKE '%dog%' OR nombre_familia_en ILIKE '%bark%'
                  OR nombre_familia_en ILIKE '%chew%');
  IF v_n <> 0 THEN RAISE EXCEPTION 'cinturon_gato: % conductas siguen nombrando al perro', v_n; END IF;
END $$;

COMMIT;
