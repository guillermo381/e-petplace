-- ============================================================================
-- S91-A · LAS 7 RAZAS QUE NO TIENEN NOMBRE — apagadas hasta su gate de strings
-- ============================================================================
-- FRENO DE MESA (hallazgo de B, 7-ago-2026), verificado por A contra la
-- fuente antes de curar: **7 filas de `perro` traen como nombre el de la
-- CARPETA del bucket, con guion bajo** — `Pastor_Aleman`, `Bulldog_Frances`,
-- `Bulldog_Ingles`, `Jack_Rusell` (con su typo), `Labrador_Retriever`,
-- `Shih_Tzu`, `Yorkshire_Terrier`. Ese campo no es un nombre: es un nombre de
-- archivo. **Su forma presentable NO EXISTE en el mapeo** — y cuatro de las
-- siete necesitan además un acento o una corrección de tipeo que solo puede
-- firmar un humano («Alemán», «Francés», «Inglés», «Russell»).
--
-- LA REGLA DEL BRIEF ES LITERAL: derivar el nombre de ese campo FABRICA
-- DATO. Las siete salen del catálogo hasta el gate de strings del founder.
--
-- POR QUÉ `activo = false` Y NO `DELETE` (la orden de mesa lo dice y es lo
-- correcto): la cura firmada son **7 UPDATEs después de la firma**, no 7
-- INSERTs — así el gate es «cambiá estos siete textos», no «volvé a sembrar».
-- Apagadas quedan FUERA para todo consumidor: el lector
-- `obtenerRazasDeEspecie` filtra `activo = true`. **Y la fila conserva la
-- prueba de lo que el mapeo dijo**, que es dato de procedencia: borrarla
-- perdería el único registro de por qué faltan.
--
-- EL CHECK ENTRA `NOT VALID`, y esa es la pieza fina: hace la clase
-- INEXPRESABLE para todo INSERT y todo UPDATE futuro —ningún seed vuelve a
-- meter un nombre de archivo en la columna del nombre humano, y la firma del
-- founder no puede entrar un texto roto sin que rebote— **sin reescribir el
-- pasado**: las 7 filas apagadas conviven hasta su gate. Precedente de la
-- casa: el `gps_estado` de S62 (`'registrado' exige ≥2`, NOT VALID). Cuando
-- las siete tengan su nombre, un `VALIDATE CONSTRAINT` cierra el círculo.
--
-- ⚠️ CONSECUENCIA DE PRODUCTO, DICHA Y NO ESCONDIDA: las siete están entre
-- las razas de perro MÁS COMUNES. Hasta el gate el tipeo predictivo no las
-- sugiere. **Nada se rompe** —la raza viaja TEXTO LIBRE por la letra de
-- D-379: el dueño escribe «Pastor Alemán» y se guarda tal cual— pero la
-- sugerencia queda pobre justo donde más se usa. *Un catálogo con 98 nombres
-- verdaderos vale más que uno con 105 donde siete los inventamos nosotros.*
--
-- LO QUE DEJA APRENDIDO: el cinturón de encoding de `20260807170000` midió
-- LOS ACENTOS y dio verde (14/14, correcto) mientras estas 7 estaban rotas en
-- OTRA dimensión — ninguna raza de perro tiene acento, así que los 14 nunca
-- iban a hablar de ellas. *Un cinturón que mide la falla que imaginaste no
-- dice nada sobre la que no imaginaste.* Por eso la cura no es otro cinturón
-- de una sola vez: es un CHECK.
--
-- Veda 76(g): NO RIGE — toca 7 filas de CATÁLOGO sembradas hoy por esta misma
-- pista; cero dato de usuario (`mascotas.raza` no tiene FK a esta tabla, por
-- la letra de D-379).
-- D-662: `cat_razas` la lee UN wrapper sin superficie publicada — cero
-- bundles vivos afectados.
-- Reversa escrita ANTES:
--   docs/relevamientos/2026-08-07-s91a-REVERSA-razas-nombre-presentable.sql
-- Gate depositado: docs/relevamientos/2026-08-07-s91a-GATE-STRINGS-7-RAZAS.md
-- ============================================================================

BEGIN;

UPDATE public.cat_razas
   SET activo = false, updated_at = now()
 WHERE especie = 'perro'
   AND slug IN ('bulldog-frances', 'bulldog-ingles', 'jack-rusell',
                'labrador-retriever', 'pastor-aleman', 'shih-tzu',
                'yorkshire-terrier');

-- La clase, inexpresable de acá en adelante. (El slug sigue siendo el slug:
-- su CHECK propio exige minúsculas-con-guion — son dos columnas con dos
-- formas, y esa distinción es justo la que las 7 filas habían borrado.)
ALTER TABLE public.cat_razas
  ADD CONSTRAINT chk_cat_razas_nombre_presentable CHECK (
        position('_' in nombre) = 0
    AND nombre = btrim(nombre)
    AND position('  ' in nombre) = 0
    AND nombre <> ''
  ) NOT VALID;

COMMENT ON COLUMN public.cat_razas.nombre IS
  'Nombre humano de la raza, VERBATIM del mapeo. Nunca derivado del slug ni del nombre de archivo: chk_cat_razas_nombre_presentable lo hace imposible (NOT VALID: las 7 filas de perro APAGADAS cuyo único nombre disponible era el de la carpeta esperan gate de strings del founder — S91, freno de B). Al firmarlas: 7 UPDATEs + VALIDATE CONSTRAINT.';

-- ── Cinturones ──────────────────────────────────────────────────────────────
DO $$
DECLARE v_activas int; v_apagadas int; v_rotas_activas int; v_acentos int; v_total int;
BEGIN
  SELECT count(*) INTO v_total    FROM cat_razas;
  SELECT count(*) INTO v_activas  FROM cat_razas WHERE activo;
  SELECT count(*) INTO v_apagadas FROM cat_razas WHERE NOT activo;
  IF v_total <> 105 OR v_activas <> 98 OR v_apagadas <> 7 THEN
    RAISE EXCEPTION 'cinturon_presentable: total=% activas=% apagadas=% (esperaba 105/98/7)',
      v_total, v_activas, v_apagadas;
  END IF;

  -- Lo que el consumidor VE no tiene un solo nombre de archivo.
  SELECT count(*) INTO v_rotas_activas
    FROM cat_razas WHERE activo AND position('_' in nombre) > 0;
  IF v_rotas_activas <> 0 THEN
    RAISE EXCEPTION 'cinturon_presentable: % nombres con guion bajo siguen VISIBLES', v_rotas_activas;
  END IF;

  -- Los 14 acentos no se tocaron: las 7 apagadas son de perro, y perro no
  -- tenía ni uno (medido). Si este número se movió, el UPDATE erró de blanco.
  SELECT count(*) INTO v_acentos FROM cat_razas
   WHERE activo AND octet_length(nombre) <> char_length(nombre);
  IF v_acentos <> 14 THEN
    RAISE EXCEPTION 'cinturon_presentable: % acentos activos <> 14 — el UPDATE toco filas que no eran', v_acentos;
  END IF;

  -- EL CHECK RIGE DE VERDAD para lo nuevo (rojo producido acá adentro, no
  -- prometido en un comentario): un INSERT con guion bajo tiene que rebotar.
  BEGIN
    INSERT INTO cat_razas (especie, slug, nombre, ruta_imagen)
    VALUES ('perro', 'zz-sonda-del-cinturon', 'Sonda_Del_Cinturon', 'perro/zz-sonda-del-cinturon.webp');
    RAISE EXCEPTION 'cinturon_presentable: el CHECK NO rige — un nombre con guion bajo ENTRO';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

COMMIT;
