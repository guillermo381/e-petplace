-- ============================================================================
-- S91-A · REPTIL: APAGADO ESTRUCTURAL — firma del founder (7-ago-2026)
-- ============================================================================
-- LA INCOHERENCIA, medida y única en las once especies: `reptil` tenía
-- `activo = false` **y** `acepta_nuevos_registros = true`. Las otras diez son
-- coherentes (o las dos en true, o las dos en false).
--
-- ⚠️ Y NO ERA COSMÉTICA — es un agujero REAL, y por eso la firma dice
-- «apagado estructural, no filtro de pantalla»: **el guard de las RPCs del
-- alta mira `acepta_nuevos_registros`, no `activo`**. O sea que hoy un caller
-- puede crear un reptil por la puerta única aunque la grilla de seis no lo
-- ofrezca. La lámina dice «REPTIL NO SE OFRECE» y el motor decía que sí.
-- *Una pantalla que no ofrece algo no es lo mismo que un motor que no lo
-- acepta: lo primero es una decisión de diseño, lo segundo es la ley.*
--
-- Medido antes: 0 mascotas `especie='reptil'` ⇒ cero filas afectadas, cero
-- backfill, nadie pierde nada.
--
-- Las 5 razas de reptil de `cat_razas` se apagan EN EL MISMO ACTO. Sus
-- imágenes siguen en el bucket (no se borra nada): el día que reptil abra,
-- se encienden las dos cosas juntas — que es exactamente la lección de esta
-- migración.
--
-- Veda 76(g): NO RIGE — 1 fila de catálogo + 5 de razas, cero dato de usuario.
-- D-662: ningún bundle vivo ofrece reptil (la grilla es de seis, medido).
-- Reversa: docs/relevamientos/2026-08-07-s91a-REVERSA-reptil-apagado.sql
-- ============================================================================

BEGIN;

UPDATE public.cat_especies
   SET acepta_nuevos_registros = false
 WHERE codigo = 'reptil';

UPDATE public.cat_razas
   SET activo = false, updated_at = now()
 WHERE especie = 'reptil';

DO $$
DECLARE v_incoherentes int; v_reptil_razas int; v_ofrecidas int;
BEGIN
  -- La clase entera cerrada, no solo reptil: CERO especies con activo=false
  -- y la puerta abierta. Si mañana nace otra incoherente, este cinturón NO
  -- la ve (corre una sola vez) — por eso queda dicho: el guard permanente
  -- sería un CHECK, y no se pone acá porque `activo=true` con la puerta
  -- cerrada SÍ es legal (una especie que se ve y ya no admite altas).
  SELECT count(*) INTO v_incoherentes FROM cat_especies
   WHERE activo = false AND acepta_nuevos_registros = true;
  IF v_incoherentes <> 0 THEN
    RAISE EXCEPTION 'cinturon_reptil: quedan % especies apagadas que aceptan altas', v_incoherentes;
  END IF;

  SELECT count(*) INTO v_reptil_razas FROM cat_razas WHERE especie='reptil' AND activo;
  IF v_reptil_razas <> 0 THEN
    RAISE EXCEPTION 'cinturon_reptil: % razas de reptil siguen activas', v_reptil_razas;
  END IF;

  -- Y las SEIS de la grilla siguen abiertas: apagar una no puede apagar otra.
  SELECT count(*) INTO v_ofrecidas FROM cat_especies
   WHERE codigo IN ('perro','gato','ave','pez','conejo','roedor')
     AND activo AND acepta_nuevos_registros;
  IF v_ofrecidas <> 6 THEN
    RAISE EXCEPTION 'cinturon_reptil: solo % de las 6 especies de la grilla siguen abiertas', v_ofrecidas;
  END IF;
END $$;

COMMIT;
