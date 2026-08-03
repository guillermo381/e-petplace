-- REVERSA de 20260803160000_s85_tipo_documento_certificacion.sql
-- Escrita ANTES de aplicar la migración.
--
-- ⚠️ ESTA REVERSA PUEDE FALLAR, Y ESO ES CORRECTO. Léela entera antes de
-- correrla.
--
-- Devolver el CHECK a los ocho tipos originales REBOTA si ya existe alguna
-- fila con tipo = 'certificacion'. No es un defecto de esta reversa: es la
-- única conducta honesta. Un `ADD CONSTRAINT` que valida y encuentra datos
-- que lo violan TIENE que fallar; lo contrario sería dejar la tabla con un
-- constraint que sus propias filas incumplen.
--
-- ⇒ SI FALLA, la decisión NO es forzar el constraint: es decidir qué pasa
-- con esos documentos. Las tres salidas, y ninguna es automática porque
-- las tres pierden algo distinto:
--   (a) re-clasificarlos a 'otro'  → conserva el archivo, PIERDE la
--       semántica (y 'otro' no la recupera después: nadie sabrá cuáles eran
--       certificaciones).
--   (b) borrarlos                  → pierde el documento que un prestador
--       subió. Exige gate del founder, jamás se hace de paso.
--   (c) NO revertir                → un tipo de más en un CHECK no rompe
--       nada; es la salida barata y casi siempre la correcta.
--
-- El censo previo, para que la decisión no se tome a ciegas:
--   SELECT count(*) FROM public.prestador_documentos WHERE tipo = 'certificacion';
--
-- ⚠️ Y LA MITAD QUE NO ES SQL: revertir acá SIN revertir el ensanche de
-- `TIPOS_DOCUMENTO_OPCIONAL` en `packages/api` deja a la app OFRECIENDO un
-- tipo que la DB rebota — el error le llegaría al prestador al subir, no a
-- quien revirtió. Los dos cuerpos se mueven juntos o no se mueven.

BEGIN;

-- Censo declarado en la propia transacción: si hay filas, esto lo dice
-- ANTES de que el ALTER las descubra, y el mensaje nombra el remedio.
DO $$
DECLARE v_n integer;
BEGIN
  SELECT count(*) INTO v_n FROM public.prestador_documentos WHERE tipo = 'certificacion';
  IF v_n > 0 THEN
    RAISE EXCEPTION
      'REVERSA ABORTADA: hay % documento(s) con tipo = ''certificacion''. '
      'Revertir el CHECK los dejaría fuera de la ley de su propia tabla. '
      'Decidí primero entre (a) re-clasificar a ''otro'', (b) borrar con gate '
      'del founder, o (c) NO revertir — ver la cabecera de este archivo.', v_n;
  END IF;
END $$;

ALTER TABLE public.prestador_documentos
  DROP CONSTRAINT prestador_documentos_tipo_check;

ALTER TABLE public.prestador_documentos
  ADD CONSTRAINT prestador_documentos_tipo_check
  CHECK (tipo = ANY (ARRAY[
    'cedula'::text,
    'ruc'::text,
    'titulo_profesional'::text,
    'registro_senescyt'::text,
    'permiso_funcionamiento'::text,
    'certificado_vacunas'::text,
    'seguro'::text,
    'otro'::text
  ]));

-- Verificación imperativa: el CHECK volvió a los OCHO, y 'certificacion'
-- vuelve a rebotar. Se prueba el rebote, no se supone.
DO $$
DECLARE v_def text; v_reboto boolean := false; v_pid uuid;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO v_def
  FROM pg_constraint
  WHERE conrelid = 'public.prestador_documentos'::regclass
    AND conname  = 'prestador_documentos_tipo_check';

  IF v_def LIKE '%certificacion%' THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: el CHECK todavía nombra certificacion — %', v_def;
  END IF;

  SELECT id INTO v_pid FROM public.prestadores LIMIT 1;
  IF v_pid IS NOT NULL THEN
    BEGIN
      INSERT INTO public.prestador_documentos (prestador_id, tipo, nombre, archivo_url)
      VALUES (v_pid, 'certificacion', 'sonda de reversa', 'x/y.jpg');
    EXCEPTION WHEN check_violation THEN
      v_reboto := true;
    END;
    IF NOT v_reboto THEN
      RAISE EXCEPTION 'REVERSA DECORATIVA: certificacion sigue entrando después de revertir.';
    END IF;
    RAISE NOTICE 'reversa OK — el CHECK volvió a los ocho y certificacion rebota.';
  ELSE
    RAISE WARNING 'sin prestadores: el rebote NO se pudo probar. La reversa aplicó, pero su verificación quedó MUDA (L-192).';
  END IF;
END $$;

COMMIT;
