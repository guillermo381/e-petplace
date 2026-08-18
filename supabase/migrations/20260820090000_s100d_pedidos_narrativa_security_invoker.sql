-- ═══════════════════════════════════════════════════════════════════════════
-- S100d-A · `v_pedidos_narrativa` DEJA DE SALTAR LA RLS
-- Firma del founder, 18-ago-2026. Cierra la fuga que estaba VIVA en su pantalla.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── EL DEFECTO, Y SOLO EL APARATO PODÍA ENCONTRARLO ───────────────────────
-- La vista no declara `security_invoker` ⇒ corre con los privilegios de su
-- dueño (`postgres`) y **la RLS de `pedidos` no se evalúa**. Y el lector del
-- cliente (`listarMisPedidos`) **tampoco filtraba**, con una cabecera que
-- explicaba por qué no hacía falta:
--
--   > *«este wrapper no filtra por dueño, porque un filtro en el cliente sobre
--   > datos que el server ya entregó no protege nada»*
--
-- **El principio es correcto y la premisa era falsa.** Un filtro de cliente no
-- protege *cuando el server filtra*; acá el server no filtraba. ⇒ **no había
-- filtro en ningún lado, y había un razonamiento bien escrito convenciendo de
-- no ir a mirar.**
--
-- 🔴 CÓMO APARECIÓ, y es el argumento entero de la regla de cierre de S100d:
--
--     la base decía …………… 12 pedidos en vuelo del founder
--     el teléfono decía ……… 13
--
-- *El defecto vivía EXACTAMENTE en la diferencia entre las dos preguntas.*
-- Ninguna medición contra la base lo habría encontrado, porque medía «los del
-- founder» y la pantalla mostraba «los de todos».
--
-- Medido con el JWT del founder ANTES de esta migración:
--     filas en vuelo que la vista le devolvía …… 13   ·   de esas, AJENAS …… 1
--
-- Bajo «Tus pedidos» salían pedidos de **tres cuentas**, una **de una persona
-- real**. Se veía: producto, fecha, total, estado, escalera y miniatura.
--
-- ⚠️ EL DETALLE **NO** SE FUGABA: `obtenerDetallePedido` pide la cabecera de
-- `pedidos`, que sí tiene RLS, y rebota. *La tabla se defiende; la vista no.*
--
-- ── POR QUÉ ESTO Y NO SOLO EL FILTRO DEL WRAPPER ──────────────────────────
-- El filtro (`.eq('user_id', uid)`, ya en el bundle) es un **TAPÓN**: vive en el
-- cliente y solo cubre a `listarMisPedidos`. **Esta migración es la DEFENSA** —
-- cierra la vista para **cualquier consumidor nuevo**, incluidos los que todavía
-- no existen. *Con solo el tapón, el próximo lector nace fugando.*
--
-- ── QUÉ **NO** SE ROMPE, y por qué ────────────────────────────────────────
-- La RLS de `pedidos` concede a **tres** audiencias:
--     user_id = auth.uid()   OR   es_vendedor_de(...)   OR   is_admin()
-- ⇒ el dueño sigue viendo lo suyo, **el panel del vendedor sigue viendo lo de su
-- tienda** (`despensa-vendedor.ts` consume esta misma vista) y el admin todo.
-- *No se angosta la audiencia: se le devuelve a la vista la audiencia que la
-- tabla ya tenía escrita.*
--
-- ── VEDA 76(g): NO RIGE ───────────────────────────────────────────────────
-- DDL sobre una vista. Cero backfill, cero filas tocadas, cero anclas.
--
-- ── REVERSA ───────────────────────────────────────────────────────────────
-- Escrita ANTES de aplicar, en
-- `docs/relevamientos/2026-08-18-s100d-REVERSA-pedidos-narrativa.sql`, y declara
-- que revertirla **REABRE una fuga entre personas reales** — con el argumento
-- «total, el wrapper ya filtra» explícitamente descartado adentro.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER VIEW public.v_pedidos_narrativa SET (security_invoker = true);

-- ═══════════════════════════════════════════════════════════════════════════
-- EL CINTURÓN — con su DISCRIMINADOR, que es lo que lo vuelve una prueba
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_invoker  text;
  v_ajenas   int;
  v_propias  int;
  v_founder  uuid := 'dd024680-3d1c-4465-b38b-dedab45da037';
  v_rol_mig  text := current_user;
BEGIN
  -- (a) la opción quedó puesta
  SELECT option_value INTO v_invoker
    FROM pg_class c, pg_options_to_table(c.reloptions)
   WHERE c.oid = 'public.v_pedidos_narrativa'::regclass
     AND option_name = 'security_invoker';

  IF v_invoker IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'CINTURÓN (a): la vista sigue sin security_invoker (valor: %)',
      coalesce(v_invoker, 'ausente');
  END IF;

  -- (b) 🔴 EL DISCRIMINADOR — que la opción esté puesta NO prueba que la fuga
  -- se cerró. Se entra COMO EL FOUNDER y se cuenta lo ajeno. Antes de esta
  -- migración eran 13 filas en vuelo con 1 ajena; tiene que quedar en 0.
  SET LOCAL request.jwt.claims = '{"sub":"dd024680-3d1c-4465-b38b-dedab45da037","role":"authenticated"}';
  SET LOCAL ROLE authenticated;

  SELECT count(*) FILTER (WHERE user_id <> v_founder),
         count(*) FILTER (WHERE user_id  = v_founder)
    INTO v_ajenas, v_propias
    FROM public.v_pedidos_narrativa;

  -- ⚠️ Se restaura el rol de la migración por su NOMBRE capturado, jamás con
  -- `RESET ROLE`: bajo `db push`, RESET vuelve al rol de LOGIN del tool y el
  -- propio registro de la migración falla (medido en S99-A, dos veces).
  EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

  IF v_ajenas <> 0 THEN
    RAISE EXCEPTION
      'CINTURÓN (b): la vista todavía le devuelve % pedidos AJENOS al founder — la fuga NO se cerró',
      v_ajenas;
  END IF;

  -- (c) EL CONTRA-CASO: cerrar de más también es un defecto. Si el founder
  -- dejó de ver LO SUYO, la cura rompió el producto en vez de protegerlo.
  IF v_propias = 0 THEN
    RAISE EXCEPTION
      'CINTURÓN (c): el founder dejó de ver sus PROPIOS pedidos — se cerró de más';
  END IF;

  RAISE NOTICE 'CINTURÓN OK · ajenas=% · propias=%', v_ajenas, v_propias;
END
$cinturon$;
