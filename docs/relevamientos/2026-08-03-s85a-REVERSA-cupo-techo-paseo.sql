-- REVERSA de 20260803220000_s85_cupo_techo_paseo_10.sql
-- Escrita ANTES de aplicar. Devuelve cupo_techo de los tipos paseo* a 4.
--
-- ⚠️ NO ES NEUTRA: puede dejar franjas VIVAS por encima del techo.
-- El LEAST del motor toma el MENOR entre el cupo de la franja y este techo,
-- así que bajarlo a 4 **recorta en silencio** a cualquier prestador que haya
-- cargado 5..10 en su taller: su franja seguirá diciendo 8 y el motor ofertará
-- 4. *Nadie ve un error — ve menos slots.*
--
-- EL CENSO QUE HAY QUE CORRER ANTES, y por eso está acá y no en la cabeza:
--   SELECT h.prestador_id, h.max_citas_por_slot
--   FROM prestador_horarios h
--   WHERE h.max_citas_por_slot > 4;
-- Si devuelve filas, **la reversa las recorta**. Decidí primero si eso es lo
-- que querés — y si lo es, decilo a esos prestadores: su número dejó de valer.

BEGIN;

DO $$
DECLARE v_n integer;
BEGIN
  SELECT count(*) INTO v_n FROM prestador_horarios WHERE max_citas_por_slot > 4;
  IF v_n > 0 THEN
    RAISE WARNING
      'AVISO: % franja(s) tienen max_citas_por_slot > 4. Al bajar el techo, el '
      'LEAST las va a recortar SIN error visible — la franja dirá su número y el '
      'motor ofertará 4. Revisá el censo de la cabecera.', v_n;
  END IF;
END $$;

UPDATE public.tipos_servicio SET cupo_techo = 4 WHERE codigo LIKE 'paseo%';

DO $$
DECLARE v_mal integer;
BEGIN
  SELECT count(*) INTO v_mal FROM tipos_servicio WHERE codigo LIKE 'paseo%' AND cupo_techo IS DISTINCT FROM 4;
  IF v_mal > 0 THEN RAISE EXCEPTION 'REVERSA INCOMPLETA: % tipos paseo* fuera de 4.', v_mal; END IF;
  RAISE NOTICE 'reversa OK — los cinco tipos paseo* vuelven a cupo_techo 4.';
END $$;

COMMIT;
