-- ============================================================================
-- S106-A tanda 2 · EL BITRATE ES CONFIGURACIÓN, NO CONSTANTE DE APP
--
-- Firma de la mesa: la calidad del video se ajusta **sin una build**. Un
-- número horneado en el bundle sólo se puede mover publicando, y el eje que
-- corta primero en el plan de video son los GB — o sea que el día que haya que
-- bajarlo, hay que poder bajarlo hoy.
--
-- 🔴 ESTO NO CONTRADICE §6 DE LA LETRA, y la precisión es de la mesa:
--    los **1,5 Mbps de §6 son requisito de la CONEXIÓN del profesional**, que
--    el sistema declara y **no mide**. NO son una promesa de calidad del
--    stream. *Configurar un bitrate menor no incumple nada: son dos números
--    sobre dos cosas distintas —lo que la red del vet debe poder sostener, y
--    lo que nosotros decidimos enviar— y confundirlos haría que bajar el
--    consumo se lea como romper la letra.*
--
-- ⚠️ EL VALOR SEMBRADO ES PROVISIONAL Y SE DICE. **El piso de calidad visual
--    lo firma el founder viendo un animal en pantalla, no un número en un
--    documento.** 1200 kbps es un punto de partida con su aritmética a la
--    vista: 2 flujos × 1200 kbps × 20 min ≈ 360 MB por consulta ⇒ ~138
--    consultas en los 50 GB del plan gratuito. *Se escribe la cuenta para que
--    quien lo mueva sepa qué está moviendo.*
--
-- ── VEDA 76(g): NO RIGE. Una fila de configuración y una función. ───────────
-- ── REVERSA: docs/relevamientos/2026-08-26-s106a-REVERSA-bitrate.sql ────────
-- ============================================================================

INSERT INTO public.app_config (clave, valor, tipo, descripcion, categoria, es_publico)
VALUES (
  'video_bitrate_kbps', '1200', 'numero',
  'Bitrate de video de la teleconsulta, en kbps. PROVISIONAL: el piso de calidad lo firma el founder en dispositivo. No confundir con los 1,5 Mbps de LETRA_TELEMEDICINA §6, que son requisito de CONEXIÓN del profesional y no promesa de stream.',
  -- `integraciones` por PRECEDENTE MEDIDO: `daily_co_activo` —la clave del
  -- otro proveedor de video— vive ahí. Y `es_publico = false` como todas sus
  -- vecinas: **el valor llega a la app por la función gateada, no por la
  -- policy pública de la tabla.** *Marcarla pública para que el cliente la
  -- lea directo habría ensanchado lo que `anon` alcanza, para no escribir una
  -- función que igual hacía falta.*
  'integraciones', false
)
ON CONFLICT (clave) DO NOTHING;

CREATE OR REPLACE FUNCTION public.obtener_config_video()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  -- 🔴 EL DEFAULT VIVE ACÁ Y ES DELIBERADO. Si la fila no existe —porque
  --    alguien la borró, o porque esta función corre contra una base que no la
  --    tiene todavía— la videollamada **no se queda sin bitrate**: sale con
  --    uno razonable. *Un lector de configuración que devuelve NULL obliga a
  --    cada consumidor a inventar su propio fallback, y ahí nacen tres
  --    números distintos para la misma cosa.*
  SELECT jsonb_build_object(
    'bitrate_kbps',
    COALESCE(
      (SELECT NULLIF(valor, '')::integer FROM public.app_config
        WHERE clave = 'video_bitrate_kbps'),
      1200
    )
  );
$$;

COMMENT ON FUNCTION public.obtener_config_video() IS
  'S106 · Configuracion de video de la teleconsulta. Con default en el cuerpo: nunca devuelve NULL.';

REVOKE EXECUTE ON FUNCTION public.obtener_config_video() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_config_video() TO authenticated;

DO $cinturon$
DECLARE
  v_firma constant text := 'public.obtener_config_video()';
  v_res jsonb;
  v_n integer;
BEGIN
  IF has_function_privilege('anon', v_firma, 'EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: anon puede leer la config';
  END IF;
  IF NOT has_function_privilege('authenticated', v_firma, 'EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: authenticated NO puede leer — la app no podria configurar nada';
  END IF;

  -- (a) devuelve el valor sembrado
  v_res := public.obtener_config_video();
  IF (v_res->>'bitrate_kbps')::integer <> 1200 THEN
    RAISE EXCEPTION 'cinturon: leyo % en vez de la fila sembrada', v_res;
  END IF;

  -- (b) 🔴 EL DISCRIMINADOR DEL DEFAULT. Se borra la fila DENTRO de una
  --     subtransacción que se deshace sola, y se comprueba que el lector
  --     igual contesta. *Sin esto, el COALESCE es una línea que nadie ejerció
  --     — y un fallback que nunca corrió es un fallback que no se sabe si
  --     funciona.*
  BEGIN
    DELETE FROM public.app_config WHERE clave = 'video_bitrate_kbps';
    v_res := public.obtener_config_video();
    IF (v_res->>'bitrate_kbps')::integer <> 1200 THEN
      RAISE EXCEPTION 'cinturon: sin fila, el lector no cayo al default (%)', v_res;
    END IF;
    RAISE EXCEPTION 'rollback_a_proposito';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'rollback_a_proposito%' AND SQLERRM NOT LIKE 'cinturon%' THEN
      RAISE;
    END IF;
    IF SQLERRM LIKE 'cinturon%' THEN RAISE; END IF;
  END;

  -- (c) la fila volvió sola
  SELECT count(*) INTO v_n FROM public.app_config WHERE clave = 'video_bitrate_kbps';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'cinturon: la subtransaccion no se deshizo (% filas)', v_n;
  END IF;

  RAISE NOTICE 'cinturon config_video: OK (permisos + valor + default ejercido + fila intacta)';
END;
$cinturon$;
