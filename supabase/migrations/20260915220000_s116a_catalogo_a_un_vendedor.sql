-- ═══════════════════════════════════════════════════════════════════════════
-- S116-A · EL CATÁLOGO DE LAS TRES CUENTAS DE PRUEBA PASA A «100% mascotas»
--
-- Firma del founder (15-sep-2026): las tres cuentas de prueba que quedaron
-- ocultas CON catálogo pasan al mismo vendedor que ya se renombró.
--
-- ── 🔴 LO QUE EL MODELO PERMITE, Y NO ES «93» ──────────────────────────────
-- La orden dice **93 ofertas** (50 + 26 + 17). Medido antes de escribir una
-- línea, el modelo tiene DOS llaves únicas que deciden esto:
--
--   `uq_oferta_publicada_por_cuenta_variante`  UNIQUE (cuenta, variante)
--                                              WHERE estado = 'publicada'
--   `vendedor_skus_cuenta_comercial_id_variante_id_key`  UNIQUE (cuenta, variante)
--
-- Y la partición de las 93 contra el destino:
--
--   **24** — «100% mascotas» **YA PUBLICA esa variante**. Moverlas viola la
--            primera llave. *No es una pérdida: es el modelo diciendo que el
--            producto ya está en la vitrina, del mismo vendedor.*
--   **64** — el destino ya tiene **SKU** para esa variante pero no la publica
--            ⇒ la oferta se muda **reapuntando al sku del destino**.
--   **5**  — el destino no tiene nada ⇒ se mudan **con su propio sku**.
--   ────
--   **69 se mudan · 24 no pueden.**
--
-- ⚠️ **UN `UPDATE ofertas SET cuenta = destino` A SECAS FALLABA**, y no en las
-- 24: **88 de las 93 chocan contra la llave del SKU**. Y mover la oferta sin su
-- sku la deja apuntando al sku de OTRO vendedor —el sku lleva el stock—, que es
-- un estado que ningún CHECK prohíbe y que nadie iría a mirar. *La forma
-- correcta no era mover el sku: era reapuntar la oferta al sku que el destino
-- ya tenía.*
--
-- ── 🔴 LO QUE **NO** SE HACE, Y ES UN CHOQUE CON LA ORDEN ──────────────────
-- La orden dice *«limpiales la marca de prueba»* a las tres cuentas.
-- **NO se les limpia, y hacerlo sería lo contrario de lo que se pide:** las
-- tres **se quedan con las 24 ofertas que no pueden mudarse**, así que quitarles
-- la marca **volvería a publicar «Tienda Pura (borrable)», «Dueño todos los
-- servicios (borrable)» y «DESPENSA DE PRUEBAS S97 - NO REAL» en la vitrina**,
-- con esos nombres, ante un invitado de F&F.
-- *La orden presupone que quedan vacías; el modelo dice que no pueden.*
-- ⇒ **la marca se conserva** y las 24 siguen invisibles. Si la mesa quiere que
--   esas 24 también desaparezcan del todo, es `estado = 'retirada'` y es otra
--   firma: retirar una oferta es un acto sobre el catálogo, no sobre la vitrina.
--
-- 76(g): NO RIGE — mueve 69 filas de dueño, sin tocar precio, stock ni estado.
-- REVERSA: docs/relevamientos/2026-09-15-s116a-REVERSA-catalogo-a-un-vendedor.sql
--   **con el mapa de las 69 embebido**, porque ni `ofertas` ni `vendedor_skus`
--   tienen `metadata` donde anotar el origen (medido) y después del UPDATE el
--   origen no existe en ninguna columna.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DO $mudanza$
DECLARE
  v_destino uuid;
  v_bloq int; v_reap int; v_propio int; v_n int;
BEGIN
  SELECT id INTO v_destino FROM cuentas_comerciales
   WHERE coalesce(nombre_comercial, razon_social) = '100% mascotas';
  IF v_destino IS NULL THEN
    /* ⚠️ `%%` Y NO `%`: en `RAISE`, `%` es el marcador de sustitución — y el
       nombre de este vendedor LLEVA UNO. Escrito con un solo `%`, plpgsql lo
       lee como un placeholder sin argumento y **la migración no compila**.
       *Un nombre de negocio que colisiona con la sintaxis del lenguaje no se
       descubre leyendo: se descubre cuando el `RAISE` que nunca iba a correr
       impide correr todo lo demás.* */
    RAISE EXCEPTION 'la migración PARA: no existe la cuenta «100%% mascotas»';
  END IF;

  CREATE TEMP TABLE _mudanza ON COMMIT DROP AS
  SELECT o.id AS oferta, o.variante_id, o.sku_id,
         EXISTS(SELECT 1 FROM ofertas d WHERE d.estado='publicada'
                  AND d.cuenta_comercial_id=v_destino AND d.variante_id=o.variante_id) AS ya_publicada,
         (SELECT vs.id FROM vendedor_skus vs
           WHERE vs.cuenta_comercial_id=v_destino AND vs.variante_id=o.variante_id) AS sku_destino
    FROM ofertas o JOIN cuentas_comerciales cc ON cc.id=o.cuenta_comercial_id
   WHERE o.estado='publicada' AND cc.creado_por_sistema IS NOT NULL;

  SELECT count(*) FILTER (WHERE ya_publicada),
         count(*) FILTER (WHERE NOT ya_publicada AND sku_destino IS NOT NULL),
         count(*) FILTER (WHERE NOT ya_publicada AND sku_destino IS NULL),
         count(*)
    INTO v_bloq, v_reap, v_propio, v_n FROM _mudanza;

  -- EL CINTURÓN DE ASERCIÓN, igual que la vez anterior: los cuatro números son
  -- los MEDIDOS el 15-sep. Si el patrón cae sobre más o menos filas, ABORTA.
  IF v_n     <> 93 THEN RAISE EXCEPTION 'aserción: % ofertas en cuentas marcadas (se midieron 93)', v_n; END IF;
  IF v_bloq  <> 24 THEN RAISE EXCEPTION 'aserción: % bloqueadas por variante ya publicada (se midieron 24)', v_bloq; END IF;
  IF v_reap  <> 64 THEN RAISE EXCEPTION 'aserción: % reapuntan al sku del destino (se midieron 64)', v_reap; END IF;
  IF v_propio<> 5  THEN RAISE EXCEPTION 'aserción: % se mudan con su sku (se midieron 5)', v_propio; END IF;

  -- ① las 5 que viajan con su sku: primero el sku, después la oferta.
  --    *Al revés, la oferta quedaría un instante apuntando a un sku ajeno.*
  UPDATE vendedor_skus vs SET cuenta_comercial_id = v_destino
    FROM _mudanza m WHERE vs.id = m.sku_id AND NOT m.ya_publicada AND m.sku_destino IS NULL;

  -- ② las 64 que reapuntan al sku que el destino YA tenía.
  UPDATE ofertas o SET cuenta_comercial_id = v_destino, sku_id = m.sku_destino
    FROM _mudanza m WHERE o.id = m.oferta AND NOT m.ya_publicada AND m.sku_destino IS NOT NULL;

  -- ③ las 5, con su sku ya mudado.
  UPDATE ofertas o SET cuenta_comercial_id = v_destino
    FROM _mudanza m WHERE o.id = m.oferta AND NOT m.ya_publicada AND m.sku_destino IS NULL;

  RAISE NOTICE 'mudadas % ofertas (% reapuntando sku + % con su sku) · % quedan donde estaban', v_reap+v_propio, v_reap, v_propio, v_bloq;
END $mudanza$;

-- ── CINTURÓN ──────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_vis int; v_vend int; v_nombres text; v_huerfana int; v_ocultas int;
BEGIN
  SELECT count(*) INTO v_vis FROM v_vitrina_publicada;
  IF v_vis <> 539 THEN
    RAISE EXCEPTION 'cinturon: % ofertas visibles (se esperaban 539 = 452 + 69 + 18 de Aurora)', v_vis;
  END IF;

  SELECT count(DISTINCT cc.id),
         string_agg(DISTINCT coalesce(cc.nombre_comercial, cc.razon_social), ' · ')
    INTO v_vend, v_nombres
    FROM v_vitrina_publicada v JOIN cuentas_comerciales cc ON cc.id = v.cuenta_comercial_id;
  IF v_vend <> 2 THEN
    RAISE EXCEPTION 'cinturon: % vendedores visibles (se esperaban 2)', v_vend;
  END IF;
  IF v_nombres ~* '(borrable|no real|de pruebas)' THEN
    RAISE EXCEPTION 'cinturon: un vendedor de prueba quedó visible: %', v_nombres;
  END IF;

  -- 🔴 NINGUNA OFERTA APUNTA AL SKU DE OTRO VENDEDOR. Es el estado que ningún
  --    CHECK prohíbe y que un `UPDATE` a secas habría dejado en 69 filas.
  SELECT count(*) INTO v_huerfana
    FROM ofertas o JOIN vendedor_skus vs ON vs.id = o.sku_id
   WHERE o.cuenta_comercial_id <> vs.cuenta_comercial_id;
  IF v_huerfana <> 0 THEN
    RAISE EXCEPTION 'cinturon: % oferta(s) apuntan al sku de otro vendedor', v_huerfana;
  END IF;

  -- Las tres siguen MARCADAS, con sus 24: quitarles la marca las publicaría.
  SELECT count(*) INTO v_ocultas FROM ofertas o JOIN cuentas_comerciales cc ON cc.id=o.cuenta_comercial_id
   WHERE o.estado='publicada' AND cc.creado_por_sistema IS NOT NULL;
  IF v_ocultas <> 24 THEN
    RAISE EXCEPTION 'cinturon: quedan % ofertas en cuentas marcadas (se esperaban 24)', v_ocultas;
  END IF;

  RAISE NOTICE 'cinturon: % visibles · % vendedor(es): % · 0 ofertas con sku ajeno · 24 siguen ocultas', v_vis, v_vend, v_nombres;
END $cint$;

COMMIT;
