-- S82-A r7 · EL PLAN BASE DE VACUNAS — el hueco más grande del producto.
--
-- QUÉ FALTABA (medido): `cat_vacunas` es VOCABULARIO puro (codigo ·
-- nombre · especies · activo · country_codes · es_seed_preliminar). Sin
-- PERIODICIDAD y sin OBLIGATORIEDAD por especie no hay forma de saber
-- qué le FALTA a una mascota — y de eso dependen el tablero de vacunas,
-- la grilla "Cómo está hoy" y la fila de recomendación del Hogar (que
-- hoy solo puede computar citas).
--
-- EL MODELO: `cat_vacunas` NO se ensancha — el plan vive en su propia
-- tabla puente `cat_plan_vacunal` (especie × vacuna). El porqué, medido:
-- la obligatoriedad y la periodicidad son PROPIEDADES DEL PAR, no de la
-- vacuna (antirrábica es anual y obligatoria en perro Y gato, pero
-- giardia es opcional; leptospirosis ni siquiera aplica a gato). Meter
-- dos columnas en `cat_vacunas` habría forzado un valor único por vacuna
-- y el primer caso divergente rompía el modelo.
--
-- LA RESPUESTA AL ÍTEM 2 (¿se puede DERIVAR la próxima?): SÍ, y la
-- medición lo sostiene — `fecha_proxima` está poblada en 1 de 32 filas,
-- pero **22 de 32 traen `tipo_vacuna` y las 22 matchean el catálogo
-- exacto** (`lower(cat_vacunas.nombre) = lower(tipo_vacuna)`; el resto
-- es el residuo declarado de la extracción — S48: el modelo no siempre
-- infiere el tipo). Así que el puente evento→catálogo EXISTE de facto y
-- acá se vuelve COLUMNA REAL (`vacuna_codigo`, FK), con backfill de esas
-- 22 filas. Con el puente + la periodicidad, la próxima se computa:
--   proxima = ultima_aplicada + periodicidad_meses
-- **LA CAPTURADA GANA A LA DERIVADA, siempre** (si el vet escribió la
-- fecha, esa es la verdad; la derivada es inferencia de la casa y se
-- devuelve DECLARADA como tal — `proxima_es_derivada`). Exigirla
-- capturada quedaría esperando un dato que el carnet real no trae.
--
-- 76(g) **RIGE** — hay backfill (`vacuna_codigo`, 22 filas esperadas).
-- Anclas medidas y verificadas abajo; el backfill es RE-EJECUTABLE (no
-- destruye `tipo_vacuna`, del que se deriva).
-- REVERSA escrita ANTES: docs/relevamientos/2026-07-30-s82a-r7-REVERSA-plan-vacunal.sql

-- ── ① EL PLAN BASE (especie × vacuna) ──
CREATE TABLE public.cat_plan_vacunal (
  especie_codigo text NOT NULL REFERENCES public.cat_especies(codigo),
  vacuna_codigo  text NOT NULL REFERENCES public.cat_vacunas(codigo),
  /** true = el plan la EXIGE para esa especie; false = existe y es opcional. */
  obligatoria boolean NOT NULL DEFAULT true,
  /** Cada cuántos meses toca el refuerzo. NULL = dosis única de por vida
   *  (no recurre) — el nulo es SEMÁNTICO, no "sin dato". */
  periodicidad_meses integer,
  /** Desde qué edad corresponde: sin esto el plan le exigiría antirrábica
   *  a un cachorro de dos semanas. NULL = desde el nacimiento. */
  edad_inicio_meses integer,
  /** Orden de presentación del plan (el carnet tiene un orden clínico). */
  orden integer NOT NULL DEFAULT 100,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (especie_codigo, vacuna_codigo),
  CONSTRAINT chk_plan_periodicidad CHECK (periodicidad_meses IS NULL OR (periodicidad_meses >= 1 AND periodicidad_meses <= 120)),
  CONSTRAINT chk_plan_edad CHECK (edad_inicio_meses IS NULL OR (edad_inicio_meses >= 0 AND edad_inicio_meses <= 240))
);

-- El plan v1 — PERRO y GATO (las únicas especies con vacunas en el
-- catálogo hoy). ES SEMILLA PRELIMINAR igual que `cat_vacunas`
-- (es_seed_preliminar=true en las 7): la periodicidad clínica definitiva
-- la firma un veterinario real — §10.3, el mismo disparo que gobierna
-- los seeds de oficio. Se declara acá para que nadie la lea como letra
-- médica firmada.
INSERT INTO public.cat_plan_vacunal (especie_codigo, vacuna_codigo, obligatoria, periodicidad_meses, edad_inicio_meses, orden) VALUES
  ('perro', 'multiple',       true,  12, 2, 10),   -- múltiple/DHPP: refuerzo anual
  ('perro', 'antirrabica',    true,  12, 3, 20),   -- exigida por ley en EC
  ('perro', 'leptospirosis',  true,  12, 3, 30),
  ('perro', 'tos_perreras',   false, 12, 3, 40),   -- opcional: la pide la guardería/paseo grupal
  ('perro', 'giardia',        false, 12, 2, 50),
  ('gato',  'triple_felina',  true,  12, 2, 10),
  ('gato',  'antirrabica',    true,  12, 3, 20),
  ('gato',  'leucemia_felina',true,  12, 2, 30),
  ('gato',  'giardia',        false, 12, 2, 50);

ALTER TABLE public.cat_plan_vacunal ENABLE ROW LEVEL SECURITY;
CREATE POLICY plan_vacunal_lectura ON public.cat_plan_vacunal FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.cat_plan_vacunal FROM anon, PUBLIC;
GRANT SELECT ON public.cat_plan_vacunal TO authenticated;

-- ── ② EL PUENTE evento → catálogo (lo que vuelve derivable la próxima) ──
ALTER TABLE public.evento_vacuna_aplicada
  ADD COLUMN vacuna_codigo text REFERENCES public.cat_vacunas(codigo);

COMMENT ON COLUMN public.evento_vacuna_aplicada.vacuna_codigo IS
  'S82: el puente al catálogo — habilita derivar la próxima. NULL honesto cuando la extracción no pudo tipar la vacuna (el nombre comercial no siempre lo dice).';

-- BACKFILL 76(g): desde `tipo_vacuna`, que YA matchea el catálogo por
-- nombre en las 22 filas medidas. Idempotente y re-ejecutable.
UPDATE public.evento_vacuna_aplicada v
   SET vacuna_codigo = c.codigo
  FROM public.cat_vacunas c
 WHERE v.vacuna_codigo IS NULL
   AND v.tipo_vacuna IS NOT NULL
   AND lower(c.nombre) = lower(v.tipo_vacuna);

CREATE INDEX idx_vacuna_codigo ON public.evento_vacuna_aplicada (mascota_id, vacuna_codigo);

-- ── ③ LA DERIVACIÓN (pura, IMMUTABLE — una sola verdad del cálculo) ──
CREATE OR REPLACE FUNCTION public._proxima_vacuna_derivada(
  p_ultima_aplicada date,
  p_periodicidad_meses integer
) RETURNS date
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT CASE
    WHEN p_ultima_aplicada IS NULL OR p_periodicidad_meses IS NULL THEN NULL
    ELSE p_ultima_aplicada + (p_periodicidad_meses || ' months')::interval
  END::date;
$function$;

-- ── ④ EL LECTOR: el plan de UNA mascota, con lo aplicado y lo que falta ──
-- Devuelve UNA FILA POR VACUNA DEL PLAN de su especie (no por evento):
-- así la pantalla puede decir por fin qué FALTA, que es lo que no se
-- podía antes. `estado`:
--   al_dia            · hay aplicación y la próxima (capturada o derivada) es futura
--   vencida           · hay aplicación y la próxima ya pasó
--   sin_fecha         · hay aplicación pero NO se puede saber la próxima
--                       (sin periodicidad y sin fecha capturada)
--   nunca_aplicada    · el plan la pide y no hay ninguna aplicación
--   aun_no_corresponde· por edad todavía no toca (jamás se muestra como falta)
CREATE OR REPLACE FUNCTION public.obtener_plan_vacunal(p_mascota_id uuid)
RETURNS TABLE (
  vacuna_codigo text,
  nombre text,
  obligatoria boolean,
  periodicidad_meses integer,
  ultima_aplicada date,
  proxima date,
  proxima_es_derivada boolean,
  estado text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_especie text;
  v_edad_meses integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  -- la puerta del expediente: el MISMO helper que gobierna la lectura
  -- clínica de la mascota (jamás una regla nueva acá)
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;

  SELECT m.especie,
         CASE WHEN m.fecha_nacimiento IS NULL THEN NULL
              ELSE (EXTRACT(YEAR FROM age(CURRENT_DATE, m.fecha_nacimiento)) * 12
                  + EXTRACT(MONTH FROM age(CURRENT_DATE, m.fecha_nacimiento)))::integer END
    INTO v_especie, v_edad_meses
    FROM mascotas m WHERE m.id = p_mascota_id;

  RETURN QUERY
  WITH aplicadas AS (
    -- la ÚLTIMA aplicación por vacuna del catálogo (el puente ②)
    SELECT DISTINCT ON (e.vacuna_codigo)
           e.vacuna_codigo, e.fecha_aplicada, e.fecha_proxima
      FROM evento_vacuna_aplicada e
     WHERE e.mascota_id = p_mascota_id AND e.vacuna_codigo IS NOT NULL
     ORDER BY e.vacuna_codigo, e.fecha_aplicada DESC NULLS LAST
  )
  SELECT p.vacuna_codigo,
         c.nombre,
         p.obligatoria,
         p.periodicidad_meses,
         a.fecha_aplicada,
         -- LA CAPTURADA GANA A LA DERIVADA (siempre)
         COALESCE(a.fecha_proxima, _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses)),
         (a.fecha_proxima IS NULL
          AND _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses) IS NOT NULL),
         CASE
           WHEN a.vacuna_codigo IS NULL AND v_edad_meses IS NOT NULL
                AND p.edad_inicio_meses IS NOT NULL AND v_edad_meses < p.edad_inicio_meses
             THEN 'aun_no_corresponde'
           WHEN a.vacuna_codigo IS NULL THEN 'nunca_aplicada'
           WHEN COALESCE(a.fecha_proxima, _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses)) IS NULL
             THEN 'sin_fecha'
           WHEN COALESCE(a.fecha_proxima, _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses)) >= CURRENT_DATE
             THEN 'al_dia'
           ELSE 'vencida'
         END
    FROM cat_plan_vacunal p
    JOIN cat_vacunas c ON c.codigo = p.vacuna_codigo
    LEFT JOIN aplicadas a ON a.vacuna_codigo = p.vacuna_codigo
   WHERE p.especie_codigo = v_especie AND p.activo AND c.activo
   ORDER BY p.orden, c.nombre;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_plan_vacunal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_plan_vacunal(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public._proxima_vacuna_derivada(date, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._proxima_vacuna_derivada(date, integer) TO authenticated;

-- ── VERIFICACIÓN: LOS ROJOS PRODUCIDOS (L-192) + LAS ANCLAS 76(g) ──
DO $verif$
DECLARE
  v_ok boolean;
  v_n integer;
  v_esperado integer;
BEGIN
  -- 76(g) · EL ANCLA DEL BACKFILL: las filas tipables tienen su puente
  SELECT count(*) INTO v_esperado
    FROM evento_vacuna_aplicada v JOIN cat_vacunas c ON lower(c.nombre) = lower(v.tipo_vacuna)
   WHERE v.tipo_vacuna IS NOT NULL;
  SELECT count(*) INTO v_n FROM evento_vacuna_aplicada WHERE vacuna_codigo IS NOT NULL;
  IF v_n <> v_esperado THEN
    RAISE EXCEPTION '76(g): backfill incompleto — % puenteadas de % tipables', v_n, v_esperado;
  END IF;
  RAISE NOTICE '76(g) ancla: % de % filas tipables puenteadas al catálogo', v_n, v_esperado;

  -- 1 · ROJO: periodicidad fuera de rango rebota
  v_ok := false;
  BEGIN
    INSERT INTO cat_plan_vacunal (especie_codigo, vacuna_codigo, periodicidad_meses)
    VALUES ('perro', 'giardia', 999);
    RAISE EXCEPTION 'EL CHECK NO REBOTO periodicidad 999';
  EXCEPTION WHEN check_violation THEN v_ok := true;
            WHEN unique_violation THEN RAISE EXCEPTION 'el fixture chocó con la PK antes del CHECK';
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'guard de periodicidad sin rojo'; END IF;

  -- 2 · ROJO: especie inexistente rebota por FK
  v_ok := false;
  BEGIN
    INSERT INTO cat_plan_vacunal (especie_codigo, vacuna_codigo) VALUES ('dragon', 'antirrabica');
    RAISE EXCEPTION 'LA FK NO REBOTO especie inexistente';
  EXCEPTION WHEN foreign_key_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FK de especie sin rojo'; END IF;

  -- 3 · ROJO: el lector sin sesión rebota 42501
  v_ok := false;
  BEGIN
    PERFORM * FROM obtener_plan_vacunal((SELECT id FROM mascotas LIMIT 1));
    RAISE EXCEPTION 'el lector dejo pasar sin auth';
  EXCEPTION WHEN insufficient_privilege THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'gate de auth sin rojo'; END IF;

  -- 4 · LA DERIVACIÓN da la fecha correcta (y NULL honesto sin insumos)
  IF _proxima_vacuna_derivada(DATE '2025-08-12', 12) <> DATE '2026-08-12' THEN
    RAISE EXCEPTION 'la derivación no computa: % ', _proxima_vacuna_derivada(DATE '2025-08-12', 12);
  END IF;
  IF _proxima_vacuna_derivada(NULL, 12) IS NOT NULL OR _proxima_vacuna_derivada(DATE '2025-08-12', NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'la derivación inventa fecha sin insumos';
  END IF;

  -- 5 · L-140
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname IN ('obtener_plan_vacunal','_proxima_vacuna_derivada') AND proacl::text LIKE '%anon=%') THEN
    RAISE EXCEPTION 'L-140: anon con EXECUTE en el motor del plan vacunal';
  END IF;

  RAISE NOTICE 'plan vacunal: rojos periodicidad/FK/auth PRODUCIDOS · derivación 2025-08-12+12m=2026-08-12 · proacl sin anon';
END;
$verif$;
