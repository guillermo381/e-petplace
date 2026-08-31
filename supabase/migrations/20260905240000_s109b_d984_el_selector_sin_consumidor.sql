-- ═══════════════════════════════════════════════════════════════════════════
-- S109-B · `D-984` SE DISPARÓ, Y SE DISPARÓ CONMIGO
--
-- 🔴 LA FICHA DECÍA «disparo: antes de que nazca un sexto recurrente».
--    **Se disparó con el TERCERO, el mismo día que la escribí.** Medido:
--    `pagos-cobro-recurrente` nombra DOS selectores
--    (`recurrencias_vencidas_pendientes`, `planes_vencidos_pendientes`) y
--    **`mensualidades_vencidas_pendientes` —que nació en S108-B2— no está.**
--    La edge además **no lee body**, así que el `{sujeto:'mensualidad_guarderia'}`
--    que mi timbre le manda no lo mira nadie.
--
--    ⇒ El día que el founder encienda la llave: el cron suena, la edge corre sus
--    dos de siempre, **la mensualidad de guardería no se cobra — y el timbre
--    devuelve `ok:true, ejecutado:true`.** *Un cron que informa haber ejecutado
--    sobre un sujeto que nadie cobró es indistinguible de uno que funcionó.*
--
-- 🔴 LO QUE SE CURA ACÁ Y LO QUE NO, sin maquillar:
--    ✅ **El timbre deja de mentir.** Si su selector no tiene consumidor, NO
--       postea y lo dice con nombre. *Preferible un cron que declara que no
--       puede a uno que dice que sí.*
--    ✅ **Nace el lector que el gate necesita** para ver los dos lados.
--    ❌ **NO se cablea el tercer selector en la edge**, y la razón es de forma
--       medida: los dos que consume devuelven un OBJETO `{para_cobrar, frenadas}`
--       y el mío devuelve FILAS; el lazo de cobro espera campos de la serie de
--       despensa. Unificarlos es reescribir el lazo de una edge que **hoy cobra
--       de verdad**, y eso no se hace de paso ni al final de una sesión.
--       **Queda con su disparo: antes de encender `guarderia_recurrente_vivo`.**
--
-- 🔴 Y EL GATE VIVE EN UN SCRIPT, no acá, porque **el defecto cruza SQL y TS**:
--    la base tiene el selector y el archivo decide si lo llama. Ningún guard de
--    un solo lado puede verlo. `scripts/verify-selectores-recurrentes.mjs`.
--
-- 🔴 VEDA 76(g): NO RIGE. Una función nueva + `CREATE OR REPLACE` de una.
--
-- REVERSA: docs/relevamientos/2026-09-05-s109b-REVERSA-M2.sql (escrita ANTES).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① EL LECTOR QUE EL GATE NECESITA — la BASE es el catálogo ──────────────
CREATE OR REPLACE FUNCTION public.selectores_recurrentes_vivos()
RETURNS TABLE(selector text, sujeto text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  /* 🔴 SE LEE DE `pg_proc`, no de una tabla que alguien mantenga: *una lista
     escrita al lado de la verdad es la que se olvida, y este defecto ES el
     olvido de una lista.* El criterio es el nombre porque es la convención que
     las tres siguen — y si mañana alguien nombra distinto, el gate lo verá como
     un selector menos, no como uno cubierto. */
  SELECT p.proname::text,
         CASE
           WHEN p.proname LIKE '%recurrencias%'   THEN 'despensa'
           WHEN p.proname LIKE '%planes%'         THEN 'plan_de_servicio'
           WHEN p.proname LIKE '%mensualidades%'  THEN 'mensualidad_guarderia'
           ELSE 'sin_clasificar' END
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname ~ '_(vencid|vencidos|vencidas)_pendientes$'
   ORDER BY 1;
$fn$;

REVOKE ALL ON FUNCTION public.selectores_recurrentes_vivos() FROM anon, authenticated, PUBLIC;

-- ── ② EL TIMBRE DEJA DE MENTIR ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ejecutar_renovaciones_guarderia()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp','net'
AS $fn$
DECLARE v_url text; v_secreto text; v_req bigint; v_n int;
BEGIN
  /* La MISMA llave que el aviso, por el mismo accesor. */
  IF NOT public.guarderia_recurrente_vivo() THEN
    RETURN jsonb_build_object('ok', true, 'ejecutado', false,
                              'motivo', 'guarderia_recurrente_apagado');
  END IF;

  /* ═══ 🔴 NO POSTEA A UNA EDGE QUE NO LO CONOCE ═══════════════════════════
     Medido: `pagos-cobro-recurrente` nombra sus selectores uno por uno y el de
     la mensualidad **no está entre ellos**; además la edge no lee body, así que
     mandarle el sujeto no cambia nada.
     Postear igual devolvería `ejecutado: true` sobre un cobro que no va a
     ocurrir. *Y un cron que informa haber ejecutado es exactamente el que nadie
     va a ir a revisar.* Se niega, con nombre, hasta que alguien lo cablee.
     Ficha `D-984`. El gate que lo mide vive en
     `scripts/verify-selectores-recurrentes.mjs`, porque el defecto cruza SQL y
     TS y ningún guard de un solo lado puede verlo. */
  RETURN jsonb_build_object('ok', false, 'ejecutado', false,
    'motivo', 'selector_sin_consumidor',
    'selector', 'mensualidades_vencidas_pendientes',
    'detalle', 'pagos-cobro-recurrente no llama a este selector: cablearlo antes '
               || 'de encender guarderia_recurrente_vivo (D-984)',
    'mandatos_vencidos', (SELECT count(*) FROM mensualidades_vencidas_pendientes()));

  /* ── lo que sigue queda escrito y NO se alcanza: es el cuerpo que vuelve a
     regir en cuanto la edge consuma el selector. Se conserva a la vista para
     que cablear sea BORRAR EL RETURN de arriba y nada más — *un camino que hay
     que reescribir al reactivarlo es un camino que se reactiva distinto.* */
  SELECT count(*) INTO v_n FROM mensualidades_vencidas_pendientes();
  IF v_n = 0 THEN
    RETURN jsonb_build_object('ok', true, 'ejecutado', false,
                              'motivo', 'sin_mandatos_vencidos');
  END IF;
  SELECT valor INTO v_url FROM app_config WHERE clave = 'url_cobro_recurrente';
  SELECT decrypted_secret INTO v_secreto
    FROM vault.decrypted_secrets WHERE name = 'despacho_secret';
  IF v_url IS NULL OR v_secreto IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'ejecutado', false, 'motivo', 'sin_configurar',
      'falta', CASE WHEN v_url IS NULL THEN 'url_cobro_recurrente' ELSE 'secreto_despacho' END);
  END IF;
  SELECT net.http_post(
           url     := v_url,
           headers := jsonb_build_object('Content-Type','application/json',
                                         'x-despacho-secret', v_secreto),
           body    := jsonb_build_object('sujeto','mensualidad_guarderia'),
           timeout_milliseconds := 30000) INTO v_req;
  RETURN jsonb_build_object('ok', true, 'ejecutado', true,
                            'mandatos', v_n, 'request_id', v_req);
END $fn$;

REVOKE ALL ON FUNCTION public.ejecutar_renovaciones_guarderia() FROM anon, authenticated, PUBLIC;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE v_r jsonb; v_n int; v_sel text[];
BEGIN
  -- (a) el lector ve LOS TRES selectores que existen
  SELECT array_agg(selector ORDER BY selector) INTO v_sel FROM selectores_recurrentes_vivos();
  IF array_length(v_sel,1) < 3 THEN
    RAISE EXCEPTION 'CINTURON: el lector ve % selectores, esperaba al menos 3 · %',
      coalesce(array_length(v_sel,1),0), v_sel;
  END IF;
  IF NOT ('mensualidades_vencidas_pendientes' = ANY(v_sel)) THEN
    RAISE EXCEPTION 'CINTURON: el lector NO ve el selector de la mensualidad — '
      'es justamente el que nadie llama';
  END IF;

  -- (b) 🔴 EL TIMBRE SE NIEGA CON NOMBRE, y no dice que ejecutó.
  --     Con la llave APAGADA dice apagado; ése es el estado de hoy.
  v_r := ejecutar_renovaciones_guarderia();
  IF (v_r->>'ejecutado')::boolean IS TRUE THEN
    RAISE EXCEPTION 'CINTURON: el timbre dice que EJECUTÓ · %', v_r;
  END IF;
  IF v_r->>'motivo' NOT IN ('guarderia_recurrente_apagado','selector_sin_consumidor') THEN
    RAISE EXCEPTION 'CINTURON: el timbre se negó por un motivo inesperado · %', v_r;
  END IF;

  -- (c) 🔴 Y CON LA LLAVE PUESTA SE NIEGA IGUAL, POR EL SELECTOR.
  --     Sin este brazo, (b) pasaría sólo porque la llave está apagada — y el
  --     defecto que esta migración cura vive DESPUÉS de encenderla.
  BEGIN
    INSERT INTO app_config (clave, valor) VALUES ('guarderia_recurrente_vivo','true')
      ON CONFLICT (clave) DO UPDATE SET valor='true';
    v_r := ejecutar_renovaciones_guarderia();
    IF (v_r->>'ejecutado')::boolean IS TRUE THEN
      RAISE EXCEPTION 'CINTURON: con la llave puesta el timbre POSTEA a una edge que no lo conoce · %', v_r;
    END IF;
    IF v_r->>'motivo' <> 'selector_sin_consumidor' THEN
      RAISE EXCEPTION 'CINTURON: esperaba selector_sin_consumidor, dio % · %', v_r->>'motivo', v_r;
    END IF;
    RAISE EXCEPTION '__DESHACER__';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'CINTURON:%' THEN RAISE; END IF;
    IF SQLERRM <> '__DESHACER__' THEN RAISE; END IF;
  END;
  /* La llave de prueba NO puede quedar puesta. */
  IF guarderia_recurrente_vivo() IS NOT FALSE THEN
    RAISE EXCEPTION 'CINTURON: la llave de prueba QUEDÓ PUESTA';
  END IF;

  -- (d) permisos
  IF has_function_privilege('authenticated','public.selectores_recurrentes_vivos()','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: el lector de selectores es ejecutable desde el bundle';
  END IF;

  RAISE NOTICE 'CINTURON S109B-D984 OK · el lector ve los 3 · el timbre se niega con nombre · con la llave puesta también · llave retirada · permisos';
END $cinturon$;
