-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LOS CUATRO TECHOS DE RED, COMO DATO (`D-1070`)
--
-- 🔴 Firmados por el founder el 11-sep-2026, con su origen MEDIDO:
--    · lectura 8 s   — 10 consultas en paralelo dieron 0,56 s la peor, y el
--      peaje fijo por petición son ~150 ms (S94-PERF) ⇒ ~14× lo normal.
--    · escritura 20 s — no es plata, pero se pierde trabajo escrito.
--    · auth 20 s     — el login real midió < 1 s; el margen es por la red.
--    · subida 120 s  — `D-734` midió 5 MB = 44 s ⇒ ~3× el peor caso conocido.
--
-- 🔴 EL CAMINO DEL PAGO NO TIENE FILA ACÁ, Y ES A PROPÓSITO. Está bloqueado por
--    `D-1069`: hoy un intento que queda en `pendiente` bloquea a su sujeto, y
--    la conciliación no lo barre —16 sujetos llevan dos semanas así—. *Poner el
--    techo antes de curar eso convertiría un cuelgue de red de 30 segundos en
--    una familia que no puede pagar dos semanas.* El orden lo firmó el founder:
--    la conciliación barre primero.
--
-- 🔴 SON PÚBLICOS, y tienen que serlo: los lee el cliente ANTES de tener
--    sesión. *Un techo que sólo se puede leer con sesión no sirve para la
--    pantalla de login, que es justo donde una red mala se nota primero.*
--
-- EDGES A DESPLEGAR (`L-536`): ninguna — lo consume `packages/api`.
-- Veda 76(g): NO RIGE. Reversa: S115-A-REVERSA-20260912710000-*.sql
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.app_config (clave, valor, tipo, descripcion, es_publico) VALUES
  ('red_techo_lectura_ms',   '8000',   'numero',
   'Techo de una lectura de pantalla. Medido: 10 consultas en paralelo, 0,56 s la peor.', true),
  ('red_techo_escritura_ms', '20000',  'numero',
   'Techo de una escritura de negocio (no monetaria). Rendirse antes pierde trabajo escrito.', true),
  ('red_techo_auth_ms',      '20000',  'numero',
   'Techo de login, refresh y recuperacion. El login real midio menos de 1 s.', true),
  ('red_techo_subida_ms',    '120000', 'numero',
   'Techo de subida de archivos. D-734 midio 5 MB = 44 s; esto es ~3x el peor caso conocido.', true)
ON CONFLICT (clave) DO UPDATE
  SET valor = EXCLUDED.valor, tipo = EXCLUDED.tipo,
      descripcion = EXCLUDED.descripcion, es_publico = EXCLUDED.es_publico;

DO $cint$
DECLARE v_n int; v_priv int;
BEGIN
  SELECT count(*) INTO v_n FROM public.app_config
   WHERE clave LIKE 'red_techo_%' AND es_publico AND valor::numeric > 0;
  IF v_n <> 4 THEN RAISE EXCEPTION 'cinturon: se esperaban 4 techos publicos, hay %', v_n; END IF;

  /* 🔴 EL ROJO: el camino del pago NO tiene techo todavia. Si alguien agrega
     `red_techo_pago_ms` antes de que `D-1069` cierre, esto lo frena — *porque
     el orden no es una preferencia: es lo que evita cambiar un cuelgue de 30
     segundos por un bloqueo de dos semanas.* */
  SELECT count(*) INTO v_priv FROM public.app_config WHERE clave = 'red_techo_pago_ms';
  IF v_priv > 0 THEN
    RAISE EXCEPTION 'cinturon ROJO: el techo del pago entro antes de que D-1069 cierre';
  END IF;

  RAISE NOTICE 'cinturon techos: 4 publicos y positivos · el del pago sigue afuera';
END $cint$;
