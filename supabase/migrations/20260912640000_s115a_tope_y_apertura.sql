-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · EL TOPE SE VUELVE LEGIBLE · Y LA FECHA DE APERTURA NACE COMO DATO
--
-- 🔴 ① EL TOPE NO FALTABA: ERA INVISIBLE, y la diferencia decide la cura.
--    Medido: la fila `fiscal_tope_consumidor_final = 50` **existe desde
--    `20260912210000`** y el motor la lee —`resolver_receptor_fiscal` es su
--    único lector, así que NO está en dos lugares—. Lo que pasa es que nació
--    con `es_publico = false` y la policy de lectura de `app_config` para
--    `authenticated` es exactamente `es_publico = true`.
--
--    *C buscó bien y el motor contestó bien: la fila estaba y la consulta
--    devolvía vacío.* Ése es el modo de falla que hace perder dos búsquedas —
--    una policy por bandera no dice «no tenés permiso», dice «no hay», y las
--    dos respuestas se leen igual desde el otro lado.
--
--    Se abre SÓLO ésta. Las otras seis filas `fiscal_*` son OPERACIÓN —
--    proveedor, cupo, palanca de ensayo— y siguen privadas: *el tope es un
--    umbral legal del SRI que la familia tiene derecho a ver explicado en la
--    pantalla; el resto es cómo funciona la casa por dentro.*
--
-- 🔴 ② LA FECHA DE APERTURA, PORQUE UNA FECHA EN LA PANTALLA ES PLATA.
--    `tresNumerosDelPrestador` exige `fechaVigencia` y tiene razón: pide la
--    comisión del día en que el precio VA A REGIR, no la de hoy. Pero escribir
--    `'2026-10-01'` en la pantalla pone una fecha de plata dentro de un bundle
--    —y un bundle no se corrige el día que la fecha se mueve—. Nace como dato,
--    la puerta la resuelve, y la pantalla no conoce ninguna fecha.
--
-- EDGES A DESPLEGAR (`L-536`): ninguna — dato puro, lo consume `packages/api`.
-- Veda 76(g): NO RIGE. Reversa: S115-A-REVERSA-20260912640000-*.sql
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE public.app_config
   SET es_publico = true
 WHERE clave = 'fiscal_tope_consumidor_final';

INSERT INTO public.app_config (clave, valor, tipo, descripcion, es_publico)
-- ⚠️ `tipo = 'texto'` y no `'fecha'`: el vocabulario de `app_config.tipo` es
--    CERRADO por CHECK (texto|numero|booleano|json|url) y **no se amplía de
--    paso**. Agregar un valor a un vocabulario cerrado para que una migración
--    pase es una decisión de letra tomada por conveniencia. Una fecha ISO es
--    texto; quien la lee valida su forma, y eso es exactamente lo que hace la
--    puerta. Si algún día hace falta `'fecha'` —para que un panel dibuje un
--    calendario, por ejemplo— se firma y se amplía por su propia razón.
VALUES ('fecha_apertura_comercial', '2026-10-01', 'texto',
        'El día desde el que rigen los precios que un prestador configura hoy. '
        'La puerta resuelve la vigencia como max(hoy, esta fecha): antes de '
        'abrir, un precio configurado rige desde la apertura; después, desde hoy.',
        true)
ON CONFLICT (clave) DO UPDATE
  SET valor = EXCLUDED.valor, tipo = EXCLUDED.tipo,
      descripcion = EXCLUDED.descripcion, es_publico = EXCLUDED.es_publico;

-- ── CINTURÓN, con su rojo ───────────────────────────────────────────────────
DO $cint$
DECLARE v_pub boolean; v_fecha text; v_filtradas int; v_rol text := current_user;
BEGIN
  SELECT es_publico INTO v_pub FROM public.app_config WHERE clave='fiscal_tope_consumidor_final';
  IF v_pub IS NOT TRUE THEN RAISE EXCEPTION 'cinturon: el tope sigue invisible'; END IF;

  SELECT valor INTO v_fecha FROM public.app_config WHERE clave='fecha_apertura_comercial';
  IF v_fecha IS NULL OR v_fecha !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'cinturon: fecha_apertura_comercial ausente o mal formada: %', v_fecha;
  END IF;

  /* 🔴 EL ROJO QUE IMPORTA: las SEIS filas de operación siguen privadas.
     *Abrir el tope con un UPDATE ancho sobre `clave LIKE 'fiscal%'` habría
     publicado el nombre del proveedor y la palanca de ensayo de cupo, y nada
     habría fallado.* */
  SELECT count(*) INTO v_filtradas FROM public.app_config
   WHERE clave LIKE 'fiscal%' AND clave <> 'fiscal_tope_consumidor_final' AND es_publico;
  IF v_filtradas <> 0 THEN
    RAISE EXCEPTION 'cinturon: % fila(s) de operacion fiscal quedaron publicas', v_filtradas;
  END IF;

  /* Y que un `authenticated` de verdad las vea como corresponde: la policy es
     el hecho, no la bandera. Se prueba por el camino real y se vuelve al rol
     de la migración —`RESET ROLE` bajo `db push` cae al rol del tool—. */
  PERFORM set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}', true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF NOT EXISTS (SELECT 1 FROM public.app_config WHERE clave='fiscal_tope_consumidor_final') THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    RAISE EXCEPTION 'cinturon: authenticated NO ve el tope por el camino real';
  END IF;
  IF EXISTS (SELECT 1 FROM public.app_config WHERE clave='fiscal_proveedor') THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    RAISE EXCEPTION 'cinturon: authenticated VE fiscal_proveedor y no debe';
  END IF;
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  RAISE NOTICE 'cinturon tope+apertura: tope visible · 6 de operacion privadas · apertura %', v_fecha;
END $cint$;
