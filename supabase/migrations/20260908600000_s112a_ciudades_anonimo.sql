-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · LA VIDRIERA ANÓNIMA VE EL CATÁLOGO DE CIUDADES
--
-- 🔴 **UN GRANT SIN POLICY NO DA ERROR: DA SILENCIO.** Medido por C y
-- verificado acá contra la base: `anon` **tiene** el `SELECT` sobre
-- `cat_ciudades`, la RLS está **ON**, y las dos policies son de
-- `authenticated`. ⇒ el anónimo recibe **HTTP 200 con `[]`** sobre una tabla
-- con **9 ciudades activas**.
--
-- *Ningún typecheck, ningún gate y ningún `!r.ok` lo ven: el resultado se
-- parece exactamente a «no hay ciudades cargadas».* Y no es un borde — es el
-- caso NORMAL de la vidriera de adopción, que se mira sin sesión por firma.
--
-- 🟢 **Se abre, y la razón es la de la casa** (precedente S92 sobre
-- `cat_bancos`/`cat_paises`): *la RLS protege filas de lectores no
-- autorizados, y acá todo lector está autorizado a leer todo* — es un
-- catálogo de ciudades. Además **el dato ya sale**: `v_adoptables_publicos`
-- devuelve `ciudad_nombre` en cada fila pública. *Negarle el catálogo a quien
-- ya ve los nombres uno por uno no protege nada: sólo rompe el filtro.*
--
-- ⚠️ **Sólo las ACTIVAS**, igual que la policy de `authenticated`. Una ciudad
-- dada de baja no se oferta como filtro: *ofrecer un filtro que no puede
-- devolver nada es prometer una búsqueda que no existe.*
--
-- 76(g) — NO RIGE: una policy, sin backfill y sin anclas.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY cat_ciudades_select_anon ON public.cat_ciudades
  FOR SELECT TO anon USING (activo = true);

-- ═══ CINTURÓN ═══ el rojo se produjo ANTES por camino real (200 con `[]`).
DO $c$
DECLARE v_total int; v_visibles int; v_inactivas int; v_yo text;
BEGIN
  SELECT count(*) INTO v_total FROM cat_ciudades WHERE activo;

  /* Se mide COMO anon, no como el dueño de la migración: la pregunta es qué
     ve el anónimo, y `postgres` la contestaría siempre que sí.

     ⚠️ **El rol se guarda y se restaura NOMBRÁNDOLO.** `RESET ROLE` no
     deshace un `SET LOCAL ROLE` dentro de la transacción: la primera versión
     de este cinturón dio VERDE y después **el ledger de migraciones rebotó
     con `permission denied` porque seguía corriendo como `anon`** — y la
     transacción entera volvió atrás, así que la policy que acababa de pasar
     su prueba no quedó aplicada. *Un arnés que no devuelve el mundo como lo
     encontró puede tumbar la migración que acaba de aprobar.* */
  v_yo := current_user;
  EXECUTE 'SET LOCAL ROLE anon';
  SELECT count(*) INTO v_visibles FROM cat_ciudades;
  SELECT count(*) INTO v_inactivas FROM cat_ciudades WHERE NOT activo;
  EXECUTE format('SET LOCAL ROLE %I', v_yo);

  IF v_visibles <> v_total THEN
    RAISE EXCEPTION 'CINTURON: el anonimo ve % de % ciudades activas', v_visibles, v_total;
  END IF;

  /* 🔴 EL CONTROL NEGATIVO: una policy con `USING (true)` daría el mismo
     verde arriba y además mostraría las dadas de baja. */
  IF v_inactivas <> 0 THEN
    RAISE EXCEPTION 'CINTURON: el anonimo ve % ciudad(es) INACTIVAS', v_inactivas;
  END IF;

  RAISE NOTICE 'CINTURON VERDE: el anonimo ve las % activas y ninguna de baja', v_visibles;
END $c$;
