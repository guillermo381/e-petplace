-- S85-A · LA CAPA DE OPCIONALES GANA SU TIPO: 'certificacion'
--
-- FIRMA DEL FOUNDER: la verificación tiene TRES capas —base (cédula/RUC) ·
-- legales por oficio · OPCIONALES (certificaciones)— y la tercera no tenía
-- dónde vivir. Medido en S85-A antes de proponer nada: el CHECK admite ocho
-- tipos y NINGUNO nombra una certificación o acreditación.
--
--   cedula · ruc · titulo_profesional · registro_senescyt
--   permiso_funcionamiento · certificado_vacunas · seguro · otro
--
-- Lo más cercano era 'otro', que **no tiene semántica**: sirve para guardar
-- el archivo y no para saber qué es. Y `certificado_vacunas` / `seguro` son
-- otra cosa. *Una certificación guardada como 'otro' es un documento que
-- nadie puede volver a encontrar por lo que ES.*
--
-- ⚠️ POR QUÉ ES MIGRACIÓN Y NO SEED, que es la pregunta razonable dado que
-- la casa tiene regla de catálogo (regla 21): **no hay catálogo que
-- sembrar.** Los ocho tipos son un `CHECK` de texto sobre la columna, no
-- una tabla `cat_`. Ensancharlos es DDL. *Se dice acá porque "agregar un
-- tipo" suena a INSERT, y buscar la tabla que no existe cuesta un turno.*
--
-- QUÉ **NO** HACE ESTA MIGRACIÓN, y es tan importante como lo que hace:
--
--   · **NO toca el gate.** `_trg_ps_verificacion_profesional` exige
--     'titulo_profesional' O 'registro_senescyt' aprobado para activar una
--     oferta médica, y esta migración **no lo mira**. Es la regla de
--     `LETRA_PERFIL_S79` §6 al pie: la credencial de la PERSONA gatea; todo
--     lo demás **se recolecta y no bloquea**. Una certificación que apagara
--     una oferta sería enmienda de §6 con su propia firma.
--   · **NO backfillea.** Los 9 documentos vivos conservan su tipo. L-176:
--     una migración no concede historia.
--   · **NO reclasifica** ningún 'otro' existente. Adivinar cuál era una
--     certificación sería inventar dato (L-139); hoy son cero de todos modos.
--
-- 76(g) — DECLARADA: **NO RIGE.** DROP + ADD de un CHECK sobre una tabla de
-- NUEVE filas: la validación es instantánea, no hay backfill, no hay anclas
-- sobre datos vivos y ninguna ventana de escritura queda expuesta.
--
-- REVERSA escrita ANTES de aplicar:
--   docs/relevamientos/2026-08-03-s85a-REVERSA-tipo-certificacion.sql
--   (lleva su propio aviso: revertir REBOTA si ya existe una fila
--    'certificacion', y eso es la conducta correcta, no un defecto.)
--
-- EL PAR QUE VIAJA CON ESTO — sin él, esta migración sería motor sin puerta:
-- `packages/api/src/wrappers/prestador-documentos.ts` filtra server-side con
-- `.in('tipo', TIPOS_DOCUMENTO_VERIFICACION)`. Un tipo que la DB acepta y
-- ese arreglo no nombra es **invisible para la app entera**: no se puede
-- escribir desde el wrapper ni leer desde el lector. Los dos cuerpos se
-- mueven en la misma tanda.

BEGIN;

ALTER TABLE public.prestador_documentos
  DROP CONSTRAINT prestador_documentos_tipo_check;

ALTER TABLE public.prestador_documentos
  ADD CONSTRAINT prestador_documentos_tipo_check
  CHECK (tipo = ANY (ARRAY[
    -- eje ① · la figura jurídica (los cuatro oficios)
    'cedula'::text,
    'ruc'::text,
    -- eje ② · el oficio, ENCIMA del ① (hoy solo veterinaria)
    'titulo_profesional'::text,
    'registro_senescyt'::text,
    'permiso_funcionamiento'::text,
    -- recolección / opcionales — ninguno gatea nada
    'certificado_vacunas'::text,
    'seguro'::text,
    'certificacion'::text,   -- ← S85: la tercera capa, firmada por el founder
    'otro'::text
  ]));

-- ── VERIFICACIÓN IMPERATIVA (L-063: las verificaciones SON el test) ──
-- Se prueba el PAR: 'certificacion' entra y un tipo inventado rebota. Sin
-- el contra-caso, un CHECK borrado por accidente daría el mismo verde —
-- que es exactamente el modo de falla silencioso que L-192 persigue.
DO $$
DECLARE
  v_pid       uuid;
  v_def       text;
  v_entro     boolean := false;
  v_reboto    boolean := false;
  v_id        uuid;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO v_def
  FROM pg_constraint
  WHERE conrelid = 'public.prestador_documentos'::regclass
    AND conname  = 'prestador_documentos_tipo_check';

  IF v_def IS NULL THEN
    RAISE EXCEPTION 'el CHECK de tipo NO existe después del ALTER — la tabla quedó sin ley.';
  END IF;
  IF v_def NOT LIKE '%certificacion%' THEN
    RAISE EXCEPTION 'el CHECK no nombra certificacion — %', v_def;
  END IF;

  SELECT id INTO v_pid FROM public.prestadores LIMIT 1;
  IF v_pid IS NULL THEN
    RAISE EXCEPTION 'ANCLA ROTA: cero prestadores. El par no se puede probar y su verde no significaría nada (L-192).';
  END IF;

  -- (a) el tipo NUEVO entra
  BEGIN
    INSERT INTO public.prestador_documentos (prestador_id, tipo, nombre, archivo_url)
    VALUES (v_pid, 'certificacion', 'sonda S85', 'sonda/s85.jpg')
    RETURNING id INTO v_id;
    v_entro := true;
  EXCEPTION WHEN check_violation THEN
    v_entro := false;
  END;

  -- (b) un tipo INVENTADO sigue rebotando — el contra-caso
  BEGIN
    INSERT INTO public.prestador_documentos (prestador_id, tipo, nombre, archivo_url)
    VALUES (v_pid, 'no_existe_este_tipo', 'contra-caso', 'sonda/x.jpg');
  EXCEPTION WHEN check_violation THEN
    v_reboto := true;
  END;

  -- la sonda se retira SIEMPRE, haya pasado o no
  DELETE FROM public.prestador_documentos WHERE nombre IN ('sonda S85', 'contra-caso');

  IF NOT v_entro  THEN RAISE EXCEPTION 'certificacion NO entra: el ALTER no hizo su trabajo.'; END IF;
  IF NOT v_reboto THEN RAISE EXCEPTION 'VERIFICACIÓN DECORATIVA: un tipo inventado también entra ⇒ el CHECK dejó de gatear.'; END IF;

  -- residuo 0, medido y no supuesto
  IF EXISTS (SELECT 1 FROM public.prestador_documentos WHERE nombre IN ('sonda S85', 'contra-caso')) THEN
    RAISE EXCEPTION 'RESIDUO: la sonda sobrevivió a su limpieza.';
  END IF;

  RAISE NOTICE 'S85 OK — certificacion entra · tipo inventado rebota · residuo 0.';
END $$;

COMMIT;
