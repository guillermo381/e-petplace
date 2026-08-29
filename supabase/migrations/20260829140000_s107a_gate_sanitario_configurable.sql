-- ═══════════════════════════════════════════════════════════════════════════
-- S107 · A — EL GATE SANITARIO: SE APAGA EL **ENFORCEMENT**, NO LA EVALUACIÓN
--
-- Firma de la mesa (29-ago). Y la distinción es la que ordena todo:
--
-- > ### **La evaluación se mantiene ENTERA. Lo que se vuelve configurable es si
-- > la compuerta FRENA o INFORMA.**
--
-- `evaluar_requisitos_guarderia` **no se toca**: sigue midiendo carnet cargado
-- y vigencia, y sigue nombrando cada faltante con su código, su estado y su
-- fecha. *Apagar la evaluación habría dejado a la familia sin saber qué le
-- falta; lo que se apaga es el freno.*
--
-- ── NACE APAGADO, y es DATO ───────────────────────────────────────────────
-- `app_config.guarderia_gate_sanitario_duro = false`. **Encenderlo es un
-- UPDATE, no una versión de la app** — el mismo camino que la lista de vacunas
-- (`cat_plan_vacunal.exigida_guarderia`).
--
-- Durante las pruebas el semáforo es **informativo**: una mascota con
-- requisitos incompletos **puede reservar y pagar**, viendo qué le falta.
--
-- ── 🔴 Y SU DEUDA, CON SUS PALABRAS ───────────────────────────────────────
-- **`D-968`: un gate apagado que nadie recuerda encender es peor que no
-- tenerlo** — porque todos creen que está. **Se enciende ANTES de la salida
-- real**, y ahí pasa a ser restricción dura: *sin requisitos al día no se paga
-- el servicio.* La ficha lo dice con esas palabras y entra al checklist de
-- lanzamiento.
--
-- Reversa: docs/relevamientos/S107-A-REVERSA-20260829140000-gate-configurable.sql
-- 76(g): NO RIGE — una fila de configuración; el cinturón sólo LEE.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

INSERT INTO public.app_config (clave, valor, tipo, descripcion, categoria, es_publico)
VALUES ('guarderia_gate_sanitario_duro', 'false', 'booleano',   -- el vocabulario de la casa es en español; medido, no supuesto
        'Si el gate sanitario de guardería FRENA (true) o sólo INFORMA (false). '
        'Nace en false para las pruebas del servicio: el semáforo se ve entero y '
        'la reserva pasa igual. 🔴 SE ENCIENDE ANTES DE LA SALIDA REAL (D-968): '
        'un gate apagado que nadie recuerda encender es peor que no tenerlo, '
        'porque todos creen que está.',
        /* `limites` y no una categoría nueva: el vocabulario de `categoria` es
           CERRADO y **no se amplía de paso** — es una decisión de mesa, y ésta
           es una perilla de límite operativo, que es exactamente esa gaveta. */
        'limites', false)
ON CONFLICT (clave) DO NOTHING;

/* ① 🔴 EL «SI BLOQUEA» VIAJA CON LA EVALUACIÓN, EN LA MISMA RESPUESTA
   (precisión de C, firmada). *Con dos llamadas hay un instante en que la
   pantalla sabe QUÉ falta y no sabe SI frena — y ahí tendría que decidirlo
   ella, que es exactamente lo que la firma prohíbe.* Con la perilla adentro,
   la pantalla es la misma en los dos modos y C lo absorbe en dos líneas. */
CREATE OR REPLACE FUNCTION public.evaluar_requisitos_guarderia(p_mascota_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_especie text; v_faltan jsonb := '[]'::jsonb; v_duro boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE((SELECT valor::boolean FROM app_config
                    WHERE clave = 'guarderia_gate_sanitario_duro'), false) INTO v_duro;
  SELECT especie INTO v_especie FROM mascotas WHERE id = p_mascota_id;

  WITH aplicadas AS (
    SELECT DISTINCT ON (e.vacuna_codigo)
           e.vacuna_codigo, e.fecha_aplicada, e.fecha_proxima, e.archivo_url
      FROM evento_vacuna_aplicada e
     WHERE e.mascota_id = p_mascota_id AND e.vacuna_codigo IS NOT NULL
     ORDER BY e.vacuna_codigo, e.fecha_aplicada DESC NULLS LAST
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'codigo', x.vacuna_codigo, 'nombre', x.nombre,
           'estado', x.estado, 'vence', x.vence) ORDER BY x.orden), '[]'::jsonb)
    INTO v_faltan
    FROM (
      SELECT p.vacuna_codigo, c.nombre, p.orden,
             COALESCE(a.fecha_proxima,
                      _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses)) AS vence,
             CASE
               WHEN a.vacuna_codigo IS NULL THEN 'nunca_aplicada'
               WHEN a.archivo_url IS NULL   THEN 'sin_carnet'
               WHEN COALESCE(a.fecha_proxima,
                    _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses)) IS NULL
                                            THEN 'sin_fecha'
               WHEN COALESCE(a.fecha_proxima,
                    _proxima_vacuna_derivada(a.fecha_aplicada, p.periodicidad_meses))
                    < public.hoy_local()    THEN 'vencida'
               ELSE 'al_dia'
             END AS estado
        FROM cat_plan_vacunal p
        JOIN cat_vacunas c ON c.codigo = p.vacuna_codigo
        LEFT JOIN aplicadas a ON a.vacuna_codigo = p.vacuna_codigo
       WHERE p.especie_codigo = v_especie AND p.activo AND c.activo AND p.exigida_guarderia
    ) x
   WHERE x.estado <> 'al_dia';

  RETURN jsonb_build_object(
    'estado',    CASE WHEN jsonb_array_length(v_faltan) = 0 THEN 'al_dia' ELSE 'faltan' END,
    'faltantes', v_faltan,
    /* 🔴 LA PERILLA VIAJA ACÁ. `false` = el semáforo INFORMA y la reserva pasa
       igual; `true` = frena. La pantalla lo PINTA, no lo decide. */
    'bloquea',   v_duro);
END $$;

/* La compuerta lee LA MISMA perilla — ② una sola, leída por los dos lados.
   *Si el server siguiera rebotando con el bloqueo apagado, la pantalla dejaría
   tocar «reservar» y el servidor lo negaría: una puerta que se abre para
   chocar contra otra es peor que una puerta cerrada.* */
CREATE OR REPLACE FUNCTION public._guarderia_puede_reservar(p_mascota_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_san jsonb; v_doc jsonb; v_familia uuid; v_duro boolean;
BEGIN
  SELECT COALESCE((SELECT valor::boolean FROM app_config
                    WHERE clave = 'guarderia_gate_sanitario_duro'), false)
    INTO v_duro;

  v_san := public.evaluar_requisitos_guarderia(p_mascota_id);
  /* 🔴 SÓLO FRENA SI EL FLAG ESTÁ ENCENDIDO. Con el flag apagado el resultado
     **igual viaja** —en `sanitario`— para que el semáforo diga la verdad
     completa: *informar no es lo mismo que callar.* */
  IF v_duro AND v_san->>'estado' <> 'al_dia' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'requisitos_sanitarios',
                              'faltantes', v_san->'faltantes');
  END IF;

  SELECT m.familia_id INTO v_familia FROM mascotas m WHERE m.id = p_mascota_id;
  v_doc := public.evaluar_documentos_guarderia(v_familia);
  IF v_doc->>'estado' <> 'al_dia' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', v_doc->>'estado',
                              'faltantes', v_doc->'faltantes', 'sanitario', v_san);
  END IF;

  RETURN jsonb_build_object('puede', true, 'sanitario', v_san,
                            'gate_sanitario_duro', v_duro);
END $$;

DO $c$
DECLARE v_duro boolean; v_n int;
BEGIN
  SELECT valor::boolean INTO v_duro FROM app_config WHERE clave='guarderia_gate_sanitario_duro';
  IF v_duro IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'ROJO: el gate deberia NACER APAGADO. Vale %', v_duro;
  END IF;
  /* 🔴 EL DISCRIMINADOR: la EVALUACIÓN sigue viva. Un gate apagado que además
     dejara de medir sería exactamente lo que la firma NO pidió. */
  SELECT count(*) INTO v_n FROM cat_plan_vacunal WHERE exigida_guarderia;
  IF v_n = 0 THEN
    RAISE EXCEPTION 'ROJO: no quedo ninguna vacuna exigida — se apago la evaluacion, no el enforcement.';
  END IF;
  RAISE NOTICE '✅ CINTURON GATE: nace APAGADO · la evaluacion sigue viva (% vacuna(s) exigida(s))', v_n;
END $c$;

COMMIT;
