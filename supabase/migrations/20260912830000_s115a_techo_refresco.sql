-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · `D-1074` · EL TECHO DEL REFRESCO ES MÁS CORTO QUE EL DEL LOGIN
--
-- 🔴 Y ES CONTRAINTUITIVO, POR ESO VA CON SU MEDICIÓN AL LADO: lo que sostiene
--    la sesión NO es un intento largo — es el PRESUPUESTO DE REINTENTOS.
--    `auth-js` reintenta con espera creciente y corta a los 30 s en total, así
--    que **un techo largo se lo come en el primer intento**. Medido contra el
--    SDK real, con un servidor que acepta y no contesta:
--
--        techo 20 s → 2 intentos en 40,2 s   ← lo que había
--        techo  8 s → 4 intentos en 33,4 s
--
--    Gate: `pnpm verify:presupuesto-refresco` (con su control del techo viejo).
--
-- 🔴 EL LOGIN SE QUEDA EN 20 s: es del usuario, que está mirando la pantalla y
--    puede esperar. El refresco es de la máquina y no lo mira nadie — el que
--    tiene que fallar rápido y reintentar es él.
--
-- ⚠️ Esta fila NO rige hasta que la app la lea: los techos se cargan de
--    `app_config` al abrir sesión (`D-1080`), y el valor de arranque del código
--    ya es 8000. La fila existe para poder moverlo sin publicar.
--
-- VEDA 76(g): NO RIGE. Reversa: `S115-A-REVERSA-20260912830000-techo-refresco.sql`
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.app_config (clave, valor, descripcion, es_publico)
VALUES ('red_techo_refresco_ms', '8000',
        'D-1074 · Techo del refresco de sesión (/auth/v1/token?grant_type=refresh_token). '
        'MÁS CORTO que el del login a propósito: auth-js corta sus reintentos a los 30 s '
        'en total, y un techo largo se come el presupuesto en el primer intento. '
        'Medido: 20 s → 2 intentos · 8 s → 4 intentos.',
        true)
ON CONFLICT (clave) DO UPDATE SET valor=EXCLUDED.valor, descripcion=EXCLUDED.descripcion;

DO $cint$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM app_config WHERE clave='red_techo_refresco_ms' AND valor='8000' AND es_publico;
  IF n <> 1 THEN RAISE EXCEPTION 'cinturon: la fila del techo de refresco no quedó legible'; END IF;
  -- El login NO se tocó: si alguien lo bajó de paso, esto lo caza.
  SELECT count(*) INTO n FROM app_config WHERE clave='red_techo_auth_ms' AND valor='20000';
  IF n <> 1 THEN RAISE EXCEPTION 'cinturon 🔴: el techo del LOGIN cambió — tiene que quedarse en 20 s'; END IF;
  RAISE NOTICE 'cinturon OK · refresco 8000 legible · login intacto en 20000';
END $cint$;
