-- ============================================================================
-- S91-A · LAS 7 RAZAS RECIBEN SU NOMBRE — FIRMA DEL FOUNDER (7-ago-2026)
-- ============================================================================
-- LA FIRMA, VERBATIM: «guion bajo → espacio + ortografía completa — tilde y
-- typo corregidos («Pastor alemán», «Jack Russell», y el resto por la misma
-- regla)».
--
-- Las siete llegaron apagadas por el freno de B (`20260807200000`): su
-- `nombre` era el de la CARPETA del bucket y la forma presentable no existía
-- en el mapeo. Ahora existe, porque un humano la firmó.
--
-- ══ LAS DOS FORMAS, LITERALES (orden de mesa: que queden las dos) ══════════
--
--   slug                 │ EL ARCHIVO (lo que decía)  │ LA FIRMA (lo que dice)
--   ─────────────────────┼────────────────────────────┼──────────────────────
--   labrador-retriever   │ Labrador_Retriever         │ Labrador retriever
--   shih-tzu             │ Shih_Tzu                   │ Shih tzu
--   yorkshire-terrier    │ Yorkshire_Terrier          │ Yorkshire terrier
--   pastor-aleman        │ Pastor_Aleman              │ Pastor alemán
--   bulldog-frances      │ Bulldog_Frances            │ Bulldog francés
--   bulldog-ingles       │ Bulldog_Ingles             │ Bulldog inglés
--   jack-rusell          │ Jack_Rusell                │ Jack Russell
--
-- CÓMO SE APLICÓ «LA MISMA REGLA» A LAS QUE LA FIRMA NO NOMBRA, dicho para
-- que se pueda corregir de a una y no haya que adivinar el criterio:
-- la firma da dos ejemplos y los dos muestran lo mismo — **primera palabra en
-- mayúscula, el resto en minúscula SALVO nombre propio**. «Pastor alemán»
-- baja el gentilicio; «Jack Russell» conserva las dos mayúsculas porque las
-- dos son nombres propios. Por eso:
--   · `retriever`, `tzu` y `terrier` son NOMBRES COMUNES → minúscula.
--   · `Labrador`, `Yorkshire`, `Shih`, `Bulldog`, `Pastor`, `Jack` abren la
--     entrada o son propios → mayúscula.
--   · `francés` e `inglés` son gentilicios como `alemán` → minúscula CON su
--     tilde, que es ortografía y no criterio.
--   · `Rusell` → `Russell`: typo del archivo, corregido por la firma.
--
-- ⚠️ LA DIVERGENCIA DE ESTILO QUE ESTA FIRMA CREA, DECLARADA Y NO ESCONDIDA:
-- las otras 98 filas del catálogo usan TITLE CASE («Azul Ruso», «Bosque de
-- Noruega», «Oriental de Pelo Corto», «Cacatúa Alba») — medido antes de
-- aplicar. Estas 7 quedan en el estilo firmado, que es el de la ortografía
-- española. **En una misma lista de sugerencias se van a ver los dos.** No se
-- barren las 98 acá: eso es OTRA firma sobre 98 textos, y hacerlo de prepo
-- sería exactamente lo que este freno vino a impedir. Queda con disparo: el
-- gate de pantalla del alta, donde el founder ve la lista real.
--
-- EL SLUG NO SE TOCA, y no es olvido: `jack-rusell` conserva su typo porque
-- es CLAVE DE MÁQUINA y apunta al objeto real del bucket
-- (`perro/jack-rusell.webp`). Renombrarlo obliga a renombrar el objeto —
-- familia D-684, no gate de strings. El humano lee `nombre`; el slug no se
-- muestra nunca.
--
-- Y EL CHECK PASA A `VALIDATE`: con las siete ya presentables, la clase queda
-- cerrada para TODAS las filas —no solo para las nuevas—. Si algún nombre
-- hubiera quedado roto, este ALTER rebota y la migración no entra.
--
-- Veda 76(g): NO RIGE — 7 filas de catálogo, cero dato de usuario.
-- D-662: `cat_razas` sigue sin superficie publicada.
-- Reversa escrita ANTES:
--   docs/relevamientos/2026-08-07-s91a-REVERSA-razas-firmadas.sql
-- Gate y su medición: docs/relevamientos/2026-08-07-s91a-GATE-STRINGS-7-RAZAS.md
-- ============================================================================

BEGIN;

UPDATE public.cat_razas SET nombre = 'Labrador retriever', activo = true, updated_at = now()
 WHERE especie = 'perro' AND slug = 'labrador-retriever';
UPDATE public.cat_razas SET nombre = 'Shih tzu',           activo = true, updated_at = now()
 WHERE especie = 'perro' AND slug = 'shih-tzu';
UPDATE public.cat_razas SET nombre = 'Yorkshire terrier',  activo = true, updated_at = now()
 WHERE especie = 'perro' AND slug = 'yorkshire-terrier';
UPDATE public.cat_razas SET nombre = 'Pastor alemán',      activo = true, updated_at = now()
 WHERE especie = 'perro' AND slug = 'pastor-aleman';
UPDATE public.cat_razas SET nombre = 'Bulldog francés',    activo = true, updated_at = now()
 WHERE especie = 'perro' AND slug = 'bulldog-frances';
UPDATE public.cat_razas SET nombre = 'Bulldog inglés',     activo = true, updated_at = now()
 WHERE especie = 'perro' AND slug = 'bulldog-ingles';
UPDATE public.cat_razas SET nombre = 'Jack Russell',       activo = true, updated_at = now()
 WHERE especie = 'perro' AND slug = 'jack-rusell';

ALTER TABLE public.cat_razas VALIDATE CONSTRAINT chk_cat_razas_nombre_presentable;

-- ── Cinturones ──────────────────────────────────────────────────────────────
DO $$
DECLARE v_activas int; v_apagadas int; v_perro int; v_acentos int; v_rotas int; v_nuevas int;
BEGIN
  SELECT count(*) FILTER (WHERE activo), count(*) FILTER (WHERE NOT activo)
    INTO v_activas, v_apagadas FROM cat_razas;
  IF v_activas <> 105 OR v_apagadas <> 0 THEN
    RAISE EXCEPTION 'cinturon_firma: activas=% apagadas=% (esperaba 105/0)', v_activas, v_apagadas;
  END IF;

  SELECT count(*) INTO v_perro FROM cat_razas WHERE especie = 'perro' AND activo;
  IF v_perro <> 44 THEN
    RAISE EXCEPTION 'cinturon_firma: % perros activos <> 44', v_perro;
  END IF;

  SELECT count(*) INTO v_rotas FROM cat_razas WHERE position('_' in nombre) > 0;
  IF v_rotas <> 0 THEN
    RAISE EXCEPTION 'cinturon_firma: sobreviven % nombres de archivo', v_rotas;
  END IF;

  -- EL CINTURÓN DE ENCODING, VIGENTE Y CON SU NÚMERO NUEVO: eran 14 acentos
  -- (todos de otras especies, perro no tenía ninguno) y la firma agrega TRES
  -- —alemán · francés · inglés—. 17. Si las tildes no viajaron enteras, este
  -- número no cierra. (Ya probaron viajar en la siembra; se vuelve a medir
  -- igual: la prueba de ayer no prueba el viaje de hoy.)
  SELECT count(*) INTO v_acentos FROM cat_razas
   WHERE octet_length(nombre) <> char_length(nombre);
  IF v_acentos <> 17 THEN
    RAISE EXCEPTION 'cinturon_firma: % nombres con acento <> 17 (14 previos + 3 de la firma)', v_acentos;
  END IF;

  -- Las tres tildes firmadas, UNA POR UNA por su literal: un conteo puede
  -- cerrar con las tildes equivocadas.
  SELECT count(*) INTO v_nuevas FROM cat_razas
   WHERE (slug, nombre) IN (
     ('pastor-aleman',   'Pastor alemán'),
     ('bulldog-frances', 'Bulldog francés'),
     ('bulldog-ingles',  'Bulldog inglés'));
  IF v_nuevas <> 3 THEN
    RAISE EXCEPTION 'cinturon_firma: % de 3 nombres con tilde coinciden con el literal firmado', v_nuevas;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cat_razas WHERE slug = 'jack-rusell' AND nombre = 'Jack Russell') THEN
    RAISE EXCEPTION 'cinturon_firma: el typo Rusell->Russell no quedo corregido';
  END IF;
END $$;

COMMIT;
