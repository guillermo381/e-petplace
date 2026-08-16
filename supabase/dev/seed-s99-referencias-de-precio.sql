-- ═══════════════════════════════════════════════════════════════════════════
-- REFERENCIAS DE PRECIO PARA LA CAMINATA — S99 (siembra, D-838)
--
-- 🔴 EL PROBLEMA QUE RESUELVE, medido: **538 variantes con oferta publicada y
-- CERO con referencia.** La banda quedó construida y **el 100 % de los
-- intentos rebota `sin_referencia_de_precio`.** El fail-closed es correcto
-- —es la firma— pero *una caminata donde todo rebota no prueba la banda:
-- prueba el rechazo.*
--
-- ⚠️ Y LA TENSIÓN, DECLARADA EN VEZ DE ESCONDIDA: la firma dice que **la
-- referencia la carga el equipo, producto por producto, y NO se siembra del
-- precio actual porque eso es CIRCULAR** (la banda quedaría centrada en el
-- número que eligió el vendedor). **Esta siembra hace exactamente eso — y por
-- eso NO es una carga: es un fixture.**
--   · Toca **solo el catálogo sembrado** (`SIEMBRA-S99-*` y las cuentas
--     «borrable»), que muere entero antes del primer vendedor real.
--   · **No toca los productos reales curados**: ahí la referencia sigue NULL
--     y la va a cargar el equipo, como la firma manda.
--   · Y **deja ~15 % de las sembradas en NULL A PROPÓSITO**, para que el
--     camino del fail-closed también se pueda caminar. *Un fixture que solo
--     habilita el camino feliz esconde justo la mitad que la firma decidió.*
--
-- ⇒ Con esto el founder puede ver LAS TRES cosas en su próxima caminata:
--    un cambio que ENTRA (dentro de banda) · uno que REBOTA DICIENDO LA BANDA
--    (fuera) · y uno que dice QUE FALTA LA REFERENCIA (sin cargar).
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_con int; v_sin int;
BEGIN
  -- El balde por HASH: determinista y reproducible (nada de random(), que
  -- volvería irrepetible la siembra).
  UPDATE producto_variantes pv
     SET precio_referencia = o.precio
    FROM ofertas o
   WHERE o.variante_id = pv.id
     AND o.estado = 'publicada'
     AND pv.precio_referencia IS NULL
     -- SOLO el catálogo sembrado: las cuentas de prueba, jamás un vendedor real.
     AND o.cuenta_comercial_id IN (
       SELECT id FROM cuentas_comerciales
        WHERE nombre_comercial ILIKE '%borrable%'
           OR nombre_comercial ILIKE '%NO REAL%')
     -- El ~15 % que se queda SIN referencia, para caminar el fail-closed.
     AND (('x' || substr(md5(pv.id::text), 1, 4))::bit(16)::int % 100) < 85;

  SELECT count(*) FILTER (WHERE pv.precio_referencia IS NOT NULL),
         count(*) FILTER (WHERE pv.precio_referencia IS NULL)
    INTO v_con, v_sin
    FROM producto_variantes pv
   WHERE EXISTS (SELECT 1 FROM ofertas o WHERE o.variante_id = pv.id AND o.estado='publicada');

  IF v_con = 0 THEN
    RAISE EXCEPTION 'SIEMBRA: ninguna referencia cargada — la banda seguiría sin poder caminarse';
  END IF;
  IF v_sin = 0 THEN
    RAISE EXCEPTION 'SIEMBRA: NINGUNA quedó sin referencia — el camino del fail-closed dejaría de ser caminable';
  END IF;
  RAISE NOTICE 'SIEMBRA REFERENCIAS: % con referencia · % sin (a propósito) — los DOS caminos caminables', v_con, v_sin;
END $$;
