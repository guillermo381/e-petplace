-- ═════════════════════════════════════════════════════════════════════
-- S79-A · t11 pre-check — LA LÁPIDA MECÁNICA DE precio_plan.
--
-- EL HALLAZGO (founder): tras la reforma apareció un TERCER valor —
-- precio_plan=11.25 con precio_mensual_plan=45 en la oferta 8c45ab59
-- de Clínica Los Shyris. 45÷4 = 11.25 EXACTO: la firma del divisor por
-- cuatro. MEDIDO: cero escritores en DB (el único match de prosrc es
-- el COMENTARIO de contratar_plan_paseo — L-170) y cero en el árbol
-- HEAD (B ya migró su taller a mensual). **El escritor es el BUNDLE
-- VIVO pre-reforma**: su taller viejo manda `precio_plan` al guardar y
-- el wrapper lo acepta — la fila nació el 27-jul 02:16 UTC durante la
-- configuración REAL del founder.
--
-- VEREDICTO DE MESA (mandato t11): residuo → se NULLea (un número
-- verosímil en una columna muerta es verosímil-falso de plata
-- esperando a alguien en tres meses); y como el escritor-bundle sigue
-- vivo hasta su próximo OTA, la columna gana LÁPIDA MECÁNICA: un
-- trigger que congela precio_plan en NULL — el guardado del bundle
-- viejo NO se rompe (permission denied por columna rompería el SAVE
-- entero del taller viejo en el teléfono del founder); su escritura
-- muerta simplemente no aterriza. La columna tiene CERO lectores
-- (verificado en 230000): ignorar su escritura no le miente a nadie.
-- La lápida muere con el DROP de la columna (al jubilar el último
-- bundle pre-reforma — declarado en MODELO_PASEO §6.2).
--
-- 76(g), DECLARADA: UPDATE determinista de 2 filas por id MEDIDO (el
-- residuo a NULL) + DDL de trigger. Sin anclas, sin ventana (nada más
-- escribe esas filas).
-- REVERSA escrita ANTES de aplicar (restaura los dos valores, ids
-- completos): docs/relevamientos/2026-07-27-s79a-REVERSA-lapida-precio-plan.sql
-- ═════════════════════════════════════════════════════════════════════
begin;

-- 1) el residuo, a NULL (los DOS valores vivos, ids medidos)
UPDATE public.prestador_servicios SET precio_plan = NULL
 WHERE id IN ('bbbe70a2-bb76-452d-95b4-77573b555f92',
              '8c45ab59-e4c4-4960-b992-4bbd6ee5df48')
   AND precio_plan IS NOT NULL;

-- 2) la lápida: nada vuelve a escribir la columna jubilada
CREATE FUNCTION public._trg_ps_lapida_precio_plan()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- S79: precio_plan JUBILADA (reforma del plan mensual). El taller de
  -- los bundles pre-reforma todavía la manda al guardar: se ignora en
  -- silencio — cero lectores (verificado), cero efecto de plata, y el
  -- SAVE del bundle viejo no se rompe. Muere con el DROP de la columna.
  NEW.precio_plan := NULL;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_ps_lapida_precio_plan
  BEFORE INSERT OR UPDATE ON public.prestador_servicios
  FOR EACH ROW
  EXECUTE FUNCTION public._trg_ps_lapida_precio_plan();

-- ── Verificación imperativa ──────────────────────────────────────────
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM public.prestador_servicios WHERE precio_plan IS NOT NULL;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'verificacion lapida: quedan % valores vivos de precio_plan', v_n;
  END IF;

  -- la lápida FUNCIONA: un UPDATE que intenta escribirla no aterriza
  UPDATE public.prestador_servicios SET precio_plan = 99.99
   WHERE id = '8c45ab59-e4c4-4960-b992-4bbd6ee5df48';
  SELECT count(*) INTO v_n FROM public.prestador_servicios
   WHERE id = '8c45ab59-e4c4-4960-b992-4bbd6ee5df48' AND precio_plan IS NOT NULL;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'verificacion lapida: el trigger NO congelo la escritura';
  END IF;
END $$;

commit;
