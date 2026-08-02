-- S84-A19 · LA ZONA APROXIMADA — `v_prestadores_publicos` DEJA DE SERVIR
-- LA COORDENADA EXACTA. Cura de **D-624**.
--
-- FIRMA DEL FOUNDER (2-ago-2026): la ficha muestra un MAPA con la ZONA, al
-- modo Airbnb — círculo de ~500 m. La dirección exacta se entrega DESPUÉS
-- del pago de la reserva, por otro camino.
--
-- ── LA REGLA QUE GOBIERNA TODO ───────────────────────────────────────
-- **LA COORDENADA EXACTA NO VIAJA AL TELÉFONO.** Si el aparato la recibe
-- y encima se pinta un círculo, la privacidad es DECORATIVA: todo lo que
-- llega al cliente se puede leer. **La zona sale YA APROXIMADA de la base**
-- — por eso esto es una migración y no una pantalla.
--
-- ── EL AGUJERO QUE SE CIERRA, MEDIDO (no era una feature futura) ──────
-- La vista exponía `lat` y `lon` EXACTAS con **3 de 6 filas con
-- coordenadas reales** y grant `SELECT` para `authenticated`. **Ninguna
-- app las pedía** — pero cualquier usuario con sesión podía pedirlas y
-- recibir la dirección de la casa de tres prestadores. *No había fuga en
-- curso; había una puerta abierta, y se cierra antes de dibujar el
-- círculo — no después.*
--
-- ── EL CENSO ANTES DE TOCAR (el freno de la orden) ───────────────────
-- Verificado CONTRA EL OBJETO, no contra la memoria:
--   · funciones de `public` que la leen ............ **0**
--   · otras vistas que la leen ..................... **0**
--   · apps del monorepo ............................ **0** (solo comentarios)
--   · portal legado (repo congelado, MISMA DB) ..... **0** código
--     (aparece solo en su `database.types.ts`, que es generado)
-- ⇒ quitar `lat`/`lon` no rompe ningún consumidor vivo.
--
-- ── POR QUÉ EL CENTRO NO ES LA DIRECCIÓN REAL ────────────────────────
-- **Un círculo centrado en la casa la delata**: cualquiera lee el centro y
-- el radio deja de proteger. El centro se DESPLAZA dentro del radio.
--
-- ── Y POR QUÉ EL DESPLAZAMIENTO ES ESTABLE POR PRESTADOR ─────────────
-- **Si cambiara entre lecturas, DOS consultas triangulan el punto real**:
-- con N muestras alrededor del verdadero centro, el promedio converge a la
-- casa. Por eso el desplazamiento se deriva del **`id`** —
-- `hashtext(id::text)`, determinista — y **JAMÁS de `random()`**.
-- *Un ofuscado que varía no ofusca: promedia.*
--
-- ── LA GEOMETRÍA, con sus números a la vista ─────────────────────────
--   · `ZONA_RADIO_M = 500` — el círculo que se dibuja (firma del founder).
--   · ángulo   ∈ [0, 2π)      estable, de `hashtext(id)`
--   · fracción ∈ [0.30, 0.90] estable, de `hashtext(id || 'd')`
--     (no [0,1]: con fracción ~0 el centro caería SOBRE la casa, que es
--      justo lo que se quiere evitar; y ~1 lo dejaría en el borde, donde
--      el círculo casi no contiene el punto real. El anillo intermedio
--      mantiene la casa adentro y el centro lejos.)
--   · a grados: lat / 111320 · lon / (111320·cos(lat)) — la corrección por
--     coseno importa: sin ella, en latitudes altas el desplazamiento en
--     longitud sería mucho mayor que el pedido. En Quito (lat ≈ -0.18) el
--     coseno es ~1 y casi no cambia, pero la fórmula no se escribe para
--     Quito: se escribe para el catálogo entero.
--
-- ⚠️ LO QUE ESTA MIGRACIÓN **NO** HACE, y se declara:
-- **No construye la entrega de la dirección exacta post-pago.** Ese camino
-- es otro (RPC gateada por reserva pagada) y no existe todavía. Mientras
-- no exista, **la dirección exacta simplemente no la tiene nadie del lado
-- cliente** — que es el estado correcto, no un hueco.
--
-- 📌 NORTE DECLARADO Y NO CONSTRUIDO (founder): **búsqueda desde el mapa.**
-- No se construye acá. **Decide la FORMA y por eso se anota:** la zona sale
-- como `zona_lat`/`zona_lon` numéricos, que es lo que la vista ya sabía
-- servir. El día que haya búsqueda geográfica, esos dos campos son la
-- entrada de un índice — no hay que rediseñar la vista, hay que indexar.
--
-- 76(g): NO RIGE — DDL sobre una vista, cero escritura de datos.
-- REVERSA: `docs/relevamientos/2026-08-02-s84a-REVERSA-zona-aproximada.sql`

BEGIN;

DROP VIEW IF EXISTS public.v_prestadores_publicos;

CREATE VIEW public.v_prestadores_publicos
WITH (security_invoker = true) AS
SELECT p.id,
    p.user_id,
    p.tipo,
    p.nombre_comercial,
    p.descripcion,
    p.foto_url,
    p.ciudad,
    p.sector,
    -- ⚠️ `lat` y `lon` NO SE EXPONEN. Lo que sale es la ZONA, ya
    -- aproximada: el centro desplazado de forma ESTABLE por `id`.
    CASE WHEN p.lat IS NULL OR p.lon IS NULL THEN NULL ELSE
      p.lat + (
        500 * (0.30 + (abs(hashtext(p.id::text || 'd')) % 1000)::numeric / 1000 * 0.60)
        * cos((abs(hashtext(p.id::text)) % 3600)::numeric / 3600 * 2 * pi())
      ) / 111320
    END AS zona_lat,
    CASE WHEN p.lat IS NULL OR p.lon IS NULL THEN NULL ELSE
      p.lon + (
        500 * (0.30 + (abs(hashtext(p.id::text || 'd')) % 1000)::numeric / 1000 * 0.60)
        * sin((abs(hashtext(p.id::text)) % 3600)::numeric / 3600 * 2 * pi())
      ) / (111320 * GREATEST(cos(radians(p.lat)), 0.01))
    END AS zona_lon,
    -- el radio del círculo que la ficha dibuja. Viaja como DATO y no como
    -- constante de pantalla: si algún día cambia, cambia en un solo lado.
    CASE WHEN p.lat IS NULL OR p.lon IS NULL THEN NULL ELSE 500 END AS zona_radio_m,
    p.calificacion_promedio,
    p.total_resenas,
    p.total_citas,
    p.acepta_emergencias,
    p.acepta_telemedicina,
    p.radio_cobertura_km,
    p.country_code,
    COALESCE(jsonb_agg(jsonb_build_object('id', ps.id, 'tipo', ps.tipo_servicio, 'nombre', COALESCE(ps.nombre_custom, ps.tipo_servicio), 'precio', ps.precio, 'duracion_minutos', ps.duracion_minutos)) FILTER (WHERE ps.id IS NOT NULL AND ps.activo = true), '[]'::jsonb) AS servicios
   FROM prestadores p
     LEFT JOIN prestador_servicios ps ON ps.prestador_id = p.id
  WHERE p.estado = 'activo'::text
  GROUP BY p.id;

-- ── EL GRANT, ACOTADO (familia D-621) ─────────────────────────────────
-- La vista tenía INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER para
-- `authenticated`. Sobre `security_invoker` la RLS de la tabla base sigue
-- mandando, así que **no era escritura efectiva** — pero es privilegio que
-- nadie pidió y que el `DROP` acaba de borrar. **Se recrea SOLO con
-- SELECT**, que es lo único que la vista existe para dar.
-- Es limpio porque el censo de arriba dio 0 consumidores: no hay nada que
-- dependiera de esos privilegios.
-- ⚠️ EL REVOKE INCLUYE `authenticated`, Y NO ES REDUNDANTE — lo destapó el
-- cinturón de abajo en el primer intento: **la vista recién creada nació
-- con SEIS privilegios de escritura sin que esta migración los concediera.**
-- Vienen de los DEFAULT PRIVILEGES del esquema, igual que las columnas
-- nuevas de `prestadores` (D-621) heredan los grants de tabla. Es la misma
-- causa un piso más arriba: **acá lo hereda un objeto entero.**
-- Sin este REVOKE, "recrear la vista para angostarla" la habría dejado
-- igual de ancha — y el `GRANT SELECT` de abajo habría parecido suficiente.
REVOKE ALL ON public.v_prestadores_publicos FROM anon, PUBLIC, authenticated;
GRANT SELECT ON public.v_prestadores_publicos TO authenticated;

-- ── CINTURÓN (L-192) ──────────────────────────────────────────────────
DO $$
DECLARE v_exactas int; v_zona int; v_priv int; v_anon int;
BEGIN
  SELECT count(*) INTO v_exactas FROM information_schema.columns
   WHERE table_schema='public' AND table_name='v_prestadores_publicos'
     AND column_name IN ('lat','lon');
  IF v_exactas <> 0 THEN RAISE EXCEPTION 'la vista SIGUE exponiendo lat/lon: %', v_exactas; END IF;

  SELECT count(*) INTO v_zona FROM information_schema.columns
   WHERE table_schema='public' AND table_name='v_prestadores_publicos'
     AND column_name IN ('zona_lat','zona_lon','zona_radio_m');
  IF v_zona <> 3 THEN RAISE EXCEPTION 'faltan columnas de zona: %', v_zona; END IF;

  SELECT count(*) INTO v_priv FROM information_schema.role_table_grants
   WHERE table_schema='public' AND table_name='v_prestadores_publicos'
     AND grantee='authenticated' AND privilege_type <> 'SELECT';
  IF v_priv <> 0 THEN RAISE EXCEPTION 'quedaron % privilegios de escritura', v_priv; END IF;

  SELECT count(*) INTO v_anon FROM information_schema.role_table_grants
   WHERE table_schema='public' AND table_name='v_prestadores_publicos' AND grantee IN ('anon','PUBLIC');
  IF v_anon <> 0 THEN RAISE EXCEPTION 'anon/PUBLIC ganaron privilegios: %', v_anon; END IF;
END $$;

-- ── AUTO-PRUEBA: LO QUE HACE QUE LA OFUSCACIÓN SIRVA ──────────────────
-- Dos propiedades, y las dos se prueban porque las dos pueden fallar en
-- silencio dando una vista que "anda":
--   ① EL DESPLAZAMIENTO ES ESTABLE — dos lecturas dan lo MISMO. Si no lo
--      fuera, promediar N lecturas convergería a la casa real.
--   ② EL DESPLAZAMIENTO EXISTE — el centro NO coincide con la casa. Un
--      bug que devolviera `lat` tal cual pasaría ① perfectamente.
-- ⚠️ LA PRUEBA SE ANCLA AL `id`, NO AL VALOR. La primera versión buscaba
-- la segunda lectura con `WHERE zona_lat = a1` y **abortó**: comparar
-- floats por igualdad no encuentra la fila, `a2` quedaba NULL y el test
-- denunciaba una inestabilidad que no existía. **Era el test, no la vista**
-- — se deja escrito porque un test frágil que grita en falso cuesta lo
-- mismo que uno mudo: hace desconfiar de código sano.
DO $$
DECLARE v_id uuid; a1 numeric; a2 numeric; real_lat numeric; v_d numeric;
BEGIN
  SELECT id, zona_lat INTO v_id, a1 FROM public.v_prestadores_publicos
   WHERE zona_lat IS NOT NULL LIMIT 1;
  IF v_id IS NULL THEN RAISE NOTICE 'sin filas con coordenadas: la auto-prueba no corre'; RETURN; END IF;

  -- ① ESTABILIDAD: dos lecturas de la MISMA fila dan lo mismo.
  SELECT zona_lat INTO a2 FROM public.v_prestadores_publicos WHERE id = v_id;
  IF a2 IS DISTINCT FROM a1 THEN RAISE EXCEPTION 'EL DESPLAZAMIENTO NO ES ESTABLE'; END IF;

  -- ② QUE SE HAYA MOVIDO: un bug que devolviera `lat` tal cual pasaría ①
  --    perfectamente. Sin esta segunda mitad, ① sola daría verde sobre una
  --    vista que no ofusca nada.
  SELECT lat INTO real_lat FROM public.prestadores WHERE id = v_id;
  IF real_lat = a1 THEN RAISE EXCEPTION 'EL CENTRO ES LA CASA: no hubo desplazamiento'; END IF;

  -- ③ y que se haya movido DENTRO del radio, no a otra ciudad
  v_d := abs(a1 - real_lat) * 111320;
  IF v_d > 500 THEN RAISE EXCEPTION 'el desplazamiento se fue del radio: % m', round(v_d); END IF;
  RAISE NOTICE 'zona ok · desplazamiento lat = % m', round(v_d);
END $$;

COMMIT;
