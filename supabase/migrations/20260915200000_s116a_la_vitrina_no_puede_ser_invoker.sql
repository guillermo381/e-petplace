-- ═══════════════════════════════════════════════════════════════════════════
-- S116-A · ☠️ SE REVIERTE `20260915190000`: LA VITRINA **NO PUEDE** SER
-- `security_invoker`, Y NO ERA UN DESCUIDO — ERA EL DISEÑO.
--
-- 🔴 QUÉ HICE MAL, con su medición: vi `verify:vistas-invoker` en rojo sobre
-- `v_prestadores_publicos` y `v_vitrina_publicada`, lo leí como una regresión
-- mía y les puse `security_invoker = on`. **Con eso, una sesión real de usuario
-- pasó a recibir:**
--
--     GET /rest/v1/v_prestadores_publicos → http 403
--     {"code":"42501","message":"permission denied for table prestadores"}
--
-- ⇒ **«Cerca de ti» quedaba VACÍO para todo el mundo.** Lo cazó volver a correr
-- la sonda después de curar — no el typecheck, no el gate, que se puso verde
-- mientras la pantalla se moría.
--
-- ── POR QUÉ NO ERAN INVOKER, que es lo que había que entender antes de tocar ──
-- **La vista ES el permiso.** `prestadores` tiene 41 columnas —teléfono,
-- dirección exacta, lat/lon, datos de cuenta— y su RLS está cerrada a propósito
-- desde S84/S91. `v_prestadores_publicos` existe justamente para exponer **una
-- proyección curada** (zona aproximada en vez de coordenadas, sin contacto) sin
-- darle a nadie la tabla. *Con `security_invoker` la vista deja de ser una
-- puerta y pasa a ser un espejo de la RLS: si el lector no puede leer la tabla,
-- no puede leer la vista — y ése es el caso.*
--
-- ⚠️ **LO QUE ESTO ENSEÑA SOBRE EL GATE, y se declara sin curarlo acá:**
-- `verify:vistas-invoker` es una buena regla con una **excepción real que nadie
-- declaró**: una vista-vitrina cuyo trabajo es exponer menos que la tabla.
-- **Su rojo sobre estas dos es un FALSO POSITIVO**, y el peligro no es el ruido:
-- es que la cura obvia —la que yo apliqué— **rompe la app**. *Un gate que
-- propone una cura que rompe producción es más caro que no tenerlo.*
-- ⇒ va a la mesa con su medición. **No se exime una regla de seguridad de
-- costado: eso se firma.**
--
-- 76(g): NO RIGE — sólo reloptions.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER VIEW public.v_prestadores_publicos RESET (security_invoker);
ALTER VIEW public.v_vitrina_publicada    RESET (security_invoker);

DO $cint$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public' AND c.relname IN ('v_prestadores_publicos','v_vitrina_publicada')
       AND 'security_invoker=on' = ANY(coalesce(c.reloptions,'{}'::text[]))
  ) THEN
    RAISE EXCEPTION 'la reversión no tomó: alguna vista sigue en invoker y la vitrina seguiría rota';
  END IF;

  IF (SELECT count(*) FROM v_prestadores_publicos) <> 4 THEN
    RAISE EXCEPTION 'la vista no devuelve los 4 prestadores esperados';
  END IF;

  RAISE NOTICE 'revertido · la vitrina vuelve a ser puerta y devuelve 4 prestadores';
END $cint$;

COMMIT;
