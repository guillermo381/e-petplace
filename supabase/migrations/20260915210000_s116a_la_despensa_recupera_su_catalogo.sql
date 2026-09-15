-- ═══════════════════════════════════════════════════════════════════════════
-- S116-A · LA DESPENSA RECUPERA SU CATÁLOGO — **ESCRITA Y NO APLICADA**
--
-- ✅ **EL NOMBRE LLEGÓ: «100% mascotas»** (firma del founder, 15-sep-2026).
-- *Nació como `.sql.PENDIENTE-NOMBRE` para que `db push` no la viera mientras
-- el nombre era un hueco; con la firma se renombró a `.sql` y se aplicó.*
--
-- ── QUÉ CURA ───────────────────────────────────────────────────────────────
-- `20260915180000` escondió de la vitrina las ofertas de cuatro vendedores cuyo
-- nombre dice que son de prueba. **Pero su catálogo es REAL** — Bravecto, Royal
-- Canin, Purina Pro Plan, Frontline, Advantix, Taste of the Wild—, así que el
-- problema nunca fue el inventario: era **el nombre del vendedor, que se ve en
-- la ficha del producto**.
--
-- ⚠️ **UNA CORRECCIÓN AL ENCARGO, medida antes de escribir:** la orden habla de
-- *«la cuenta «(borrable)» que carga las 545 ofertas»*. **Las 545 son CUATRO
-- cuentas, no una.** Medido el 15-sep, antes del mantenimiento:
--
--     452  Despensa de Pruebas (borrable)        ← ÉSTA
--      50  Tienda Pura (borrable)
--      26  Dueño todos los servicios (borrable)
--      17  DESPENSA DE PRUEBAS S97 - NO REAL
--     ───
--     545  total escondido   ·   18 quedaron visibles (Clínica Aurora)
--
-- Y la orden dice **«las otras cuentas de prueba siguen ocultas»**, así que esto
-- toca **UNA SOLA**: la de 452. *Renombrar las cuatro habría sido leer «545»
-- como si fuera una cuenta y devolver a la vitrina tres vendedores que la mesa
-- dejó ocultos a propósito.*
-- ⇒ **el número esperado después es 452 + 18 = 470 ofertas visibles**, bajo dos
--   vendedores. **No 563**: las otras tres siguen fuera.
--
-- ── LO QUE HACE, y lo que NO ───────────────────────────────────────────────
-- ① le pone el nombre que firma el founder;
-- ② le limpia `creado_por_sistema` ⇒ sus ofertas **vuelven a la vitrina solas**,
--    porque `v_vitrina_publicada` ya filtra por esa marca. *No hace falta tocar
--    la vista ni las ofertas: la marca es el interruptor.*
-- ❌ **NO toca el catálogo, ni los precios, ni el stock.** Ninguna oferta cambia
--    de dueño: cambia cómo se llama el dueño.
--
-- 76(g): NO RIGE — una fila, sin backfill.
-- REVERSA: volver a poner `creado_por_sistema = 'prueba_interna_s116'` y el
--   nombre viejo la esconde de nuevo; el nombre viejo queda escrito en el guard
--   de abajo, que es su única copia.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DO $renombre$
DECLARE
  v_nombre_nuevo text := '100% mascotas';
  v_id uuid;
  v_ofertas int;
BEGIN
  -- ⓪ EL FRENO QUEDA, aunque el nombre ya esté: si alguien vuelve a dejar un
  --    hueco acá, esto PARA en vez de publicar un placeholder como nombre de
  --    vendedor. *El guard que sólo sirvió una vez se retira; éste puede volver
  --    a servir.*
  IF v_nombre_nuevo LIKE '%«%' OR btrim(v_nombre_nuevo) = '' THEN
    RAISE EXCEPTION 'la migración PARA: falta el nombre que da el founder (sigue el placeholder)';
  END IF;

  -- ① la cuenta se identifica por su nombre VIEJO exacto, no por patrón: es una
  --    sola fila y se la nombra. *Un `LIKE '%borrable%'` acá renombraría las
  --    cuatro, que es justo lo que la orden excluye.*
  SELECT cc.id INTO v_id FROM cuentas_comerciales cc
   WHERE coalesce(cc.nombre_comercial, cc.razon_social) = 'Despensa de Pruebas (borrable)';
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'la migración PARA: no existe la cuenta «Despensa de Pruebas (borrable)»';
  END IF;

  SELECT count(*) INTO v_ofertas FROM ofertas WHERE cuenta_comercial_id = v_id AND estado = 'publicada';
  IF v_ofertas <> 452 THEN
    RAISE EXCEPTION 'la migración PARA: la cuenta tiene % ofertas publicadas y se midieron 452', v_ofertas;
  END IF;

  UPDATE cuentas_comerciales
     SET nombre_comercial = v_nombre_nuevo,
         creado_por_sistema = NULL
   WHERE id = v_id;

  RAISE NOTICE 'renombrada a «%» · % ofertas vuelven a la vitrina', v_nombre_nuevo, v_ofertas;
END $renombre$;

-- ── CINTURÓN ──────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_vis int; v_vend text; v_ocultas int;
BEGIN
  SELECT count(*) INTO v_vis FROM v_vitrina_publicada;
  IF v_vis <> 470 THEN
    RAISE EXCEPTION 'cinturon: la vitrina muestra % ofertas (se esperaban 470 = 452 + las 18 de Aurora)', v_vis;
  END IF;

  SELECT string_agg(DISTINCT coalesce(cc.nombre_comercial, cc.razon_social), ' · ')
    INTO v_vend
    FROM v_vitrina_publicada v JOIN cuentas_comerciales cc ON cc.id = v.cuenta_comercial_id;

  -- LAS OTRAS TRES SIGUEN OCULTAS — es orden explícita, y se verifica.
  SELECT count(*) INTO v_ocultas FROM cuentas_comerciales
   WHERE creado_por_sistema IS NOT NULL
     AND coalesce(nombre_comercial, razon_social) IN
         ('Tienda Pura (borrable)', 'Dueño todos los servicios (borrable)', 'DESPENSA DE PRUEBAS S97 - NO REAL');
  /* ⚠️ SON **CUATRO** FILAS, NO TRES, Y LO DIJO ESTE MISMO CINTURÓN: la primera
     versión asertaba 3 —«las otras tres cuentas»— y la migración ABORTÓ con
     «quedan 4». **`Dueño todos los servicios (borrable)` existe DOS VECES** como
     cuenta comercial, igual que existe dos veces como prestador (clínica y
     paseador), y eso ya estaba en el censo del 15-sep: las 9 marcadas lo listan
     repetido. *Conté NOMBRES y aserté FILAS.*
     Se deja escrito porque el número correcto no se ve leyendo la orden: la
     mesa dijo «las otras cuentas de prueba siguen ocultas» y son tres nombres
     en cuatro filas. */
  IF v_ocultas <> 4 THEN
    RAISE EXCEPTION 'cinturon: quedan % filas de las otras cuentas marcadas (debían quedar 4: el nombre «Dueño todos los servicios» está repetido)', v_ocultas;
  END IF;

  -- Y que no se haya colado ningún «(borrable)» a la vitrina.
  IF v_vend ~* '(borrable|no real|de pruebas)' THEN
    RAISE EXCEPTION 'cinturon: un vendedor con nombre de prueba sigue visible: %', v_vend;
  END IF;

  RAISE NOTICE 'cinturon: % ofertas visibles · vendedores: % · las otras tres siguen ocultas', v_vis, v_vend;
END $cint$;

COMMIT;
