-- S82-A r10 · DÍAS CERRADOS POR SERVICIO — la salida (a), elegida con
-- la medición que sigue. El hallazgo lo trajo C: `obtener_dias_cerrados`
-- es POR PRESTADOR y la oferta de grooming llega AGREGADA
-- (desde_precio/varia) sin nombrar prestadores, así que la pantalla no
-- tenía a quién preguntarle. **C lo declaró en vez de inventarlo — y
-- por eso esta migración existe.**
--
-- ══ POR QUÉ (a) —EL LECTOR RESPONDE POR SERVICIO— Y NO (b) —LA OFERTA
--    EXPONE prestador_id—. Tres argumentos, ninguno de gusto: ══
--
-- ① **(b) CONTRADICE LETRA FIRMADA EN PIEDRA.** La gramática canónica
--    de reserva (DISEÑO_EXPERIENCIA v1.8, decisión founder S61, textual
--    "en piedra") es **MASCOTA → QUÉ → DÍA → HORA → QUIÉN → PAGAR**: el
--    QUIÉN va DESPUÉS del día y la hora. Exponer `prestador_id` en la
--    oferta para que la pantalla calcule los días **mete el QUIÉN en el
--    paso del QUÉ/DÍA**. No es un detalle de implementación: es el orden
--    que el founder puso en piedra.
--
-- ② **(a) ESPEJA CÓMO EL MOTOR YA TRABAJA** (medido con
--    `pg_get_function_arguments`): `obtener_inicios_grooming_disponibles`
--    recibe `(p_fecha, p_tipo_servicio, p_mascota_id, p_modalidad)` — YA
--    responde POR SERVICIO y agrega el conjunto de prestadores adentro,
--    sin nombrarlos. El lector de días cerrados tiene que hablar EL
--    MISMO IDIOMA y sobre EL MISMO CONJUNTO; si no, el día apagado y la
--    grilla vacía dirían cosas distintas sobre el mismo día.
--
-- ③ **LA REGLA VIVE UNA VEZ.** "Cerrado" para un conjunto solo puede
--    significar **que TODOS cierran** (si uno abre, hay dónde reservar).
--    Eso es una INTERSECCIÓN, y en (b) cada pantalla la calcularía por
--    su cuenta — la clase L-169: entre dos curas equivalentes gana la
--    que no depende de que cada consumidor lo haga bien.
--
-- ══ LA SEMÁNTICA, y hacia qué lado se inclina el error ══
-- Un día está cerrado PARA EL SERVICIO si **todos** los prestadores con
-- oferta activa de ese tipo lo declararon cerrado. Conjunto vacío = no
-- hay días cerrados (no hay nada que cerrar; la ausencia de oferta la
-- dice otra superficie).
-- **EL ERROR SE INCLINA AL LADO SEGURO, y es decisión declarada:** este
-- lector puede apagar DE MENOS (si el único que abre ese día resultara
-- inalcanzable para esa familia — p. ej. fuera de radio, S79 — el día
-- queda TOCABLE y el motor de inicios dice la verdad con el nulo
-- honesto). Jamás apaga DE MÁS: nunca borra un día donde sí se podía
-- reservar. Apagar de menos cuesta un toque; apagar de más esconde
-- oferta real.
--
-- ALCANCE DECLARADO: v1 no replica el filtro geográfico de las lectoras
-- (S79) — por la asimetría de arriba, no hace falta para ser honesto.
-- Si algún día el conjunto geográfico tuviera que mandar, este lector
-- gana su parámetro y NO cambia de forma.
--
-- 76(g): NO RIGE — solo una función lectora, cero DDL de tabla, cero backfill.
-- REVERSA escrita ANTES: docs/relevamientos/2026-07-30-s82a-r10-REVERSA-dias-cerrados-servicio.sql

CREATE OR REPLACE FUNCTION public.obtener_dias_cerrados_servicio(
  p_tipo_servicio text
) RETURNS TABLE (dia_semana smallint, prestadores_totales integer)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH conjunto AS (
    -- los prestadores que HOY ofrecen ese servicio (el mismo universo
    -- que la oferta agregada le muestra a la familia)
    SELECT DISTINCT ps.prestador_id
      FROM prestador_servicios ps
     WHERE ps.tipo_servicio = p_tipo_servicio AND ps.activo
  )
  SELECT d.dia_semana,
         (SELECT count(*)::integer FROM conjunto) AS prestadores_totales
    FROM prestador_dias_cerrados d
    JOIN conjunto c ON c.prestador_id = d.prestador_id
   GROUP BY d.dia_semana
  -- LA INTERSECCIÓN: solo es "cerrado" si lo declararon TODOS
  HAVING count(DISTINCT d.prestador_id) = (SELECT count(*) FROM conjunto)
     AND (SELECT count(*) FROM conjunto) > 0
   ORDER BY d.dia_semana;
$function$;

COMMENT ON FUNCTION public.obtener_dias_cerrados_servicio(text) IS
  'S82: los días cerrados de un SERVICIO = intersección (todos los prestadores con oferta activa lo declararon cerrado). Devuelve prestadores_totales para que la superficie pueda decir la verdad sin adivinar el tamaño del conjunto.';

REVOKE EXECUTE ON FUNCTION public.obtener_dias_cerrados_servicio(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_dias_cerrados_servicio(text) TO authenticated;

-- ── VERIFICACIÓN: LOS ROJOS Y EL DISCRIMINADOR, PRODUCIDOS (L-192) ──
-- El fixture es in-txn y se deshace: siembra días cerrados REALES sobre
-- los prestadores vivos de grooming y comprueba que la intersección
-- DISCRIMINA — que es lo único que prueba que la función no es un
-- `SELECT` decorativo.
DO $verif$
DECLARE
  v_a uuid; v_b uuid; v_n integer; v_total integer;
BEGIN
  -- el conjunto real de grooming (medido: 2 prestadores)
  SELECT count(DISTINCT prestador_id) INTO v_total
    FROM prestador_servicios WHERE tipo_servicio = 'grooming' AND activo;
  IF v_total IS NULL OR v_total < 2 THEN
    -- sin dos prestadores el discriminador no puede correr: se DICE,
    -- jamás se declara verde por vacío (esa es la falla que L-192 caza)
    SELECT count(DISTINCT ps.prestador_id) INTO v_total
      FROM prestador_servicios ps JOIN tipos_servicio ts ON ts.codigo = ps.tipo_servicio
     WHERE ts.categoria = 'grooming' AND ps.activo;
    RAISE NOTICE 'discriminador NO corrido: grooming tiene % prestadores con oferta activa (hace falta 2+)', v_total;
    RETURN;
  END IF;

  SELECT prestador_id INTO v_a FROM prestador_servicios WHERE tipo_servicio='grooming' AND activo ORDER BY prestador_id LIMIT 1;
  SELECT prestador_id INTO v_b FROM prestador_servicios WHERE tipo_servicio='grooming' AND activo AND prestador_id <> v_a ORDER BY prestador_id LIMIT 1;

  -- ① UNO SOLO cierra el domingo → el servicio NO está cerrado
  INSERT INTO prestador_dias_cerrados (prestador_id, dia_semana) VALUES (v_a, 0);
  SELECT count(*) INTO v_n FROM obtener_dias_cerrados_servicio('grooming') WHERE dia_semana = 0;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'LA INTERSECCIÓN NO DISCRIMINA: con 1 de % cerrados el servicio ya figura cerrado', v_total;
  END IF;

  -- ② cierran TODOS → recién ahí el servicio está cerrado
  INSERT INTO prestador_dias_cerrados (prestador_id, dia_semana) VALUES (v_b, 0);
  SELECT count(*) INTO v_n FROM obtener_dias_cerrados_servicio('grooming') WHERE dia_semana = 0;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'con TODOS cerrados el servicio NO figura cerrado (n=%)', v_n;
  END IF;

  -- deshacer el fixture: residuo 0
  DELETE FROM prestador_dias_cerrados WHERE dia_semana = 0 AND prestador_id IN (v_a, v_b);
  IF (SELECT count(*) FROM prestador_dias_cerrados) <> 0 THEN
    RAISE EXCEPTION 'el fixture dejó residuo';
  END IF;

  -- ③ L-140
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='obtener_dias_cerrados_servicio' AND proacl::text LIKE '%anon=%') THEN
    RAISE EXCEPTION 'L-140: anon con EXECUTE en obtener_dias_cerrados_servicio';
  END IF;

  RAISE NOTICE 'días cerrados por servicio: DISCRIMINADOR CORRIDO (1 de % = abierto · %/% = cerrado) · residuo 0 · proacl sin anon', v_total, v_total, v_total;
END;
$verif$;
