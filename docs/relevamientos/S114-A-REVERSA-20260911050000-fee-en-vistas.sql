-- REVERSA de `20260911050000_s114a_fee_en_vistas.sql` (D-759). Escrita ANTES.
--
-- 🔴 QUÉ REPONE: el `* 0.14` literal en las DOS vistas. Revertir devuelve a
--    `/inversores` y al Dashboard un número que **caducó el 11-ago-2026** —
--    `fee_configs` tiene la fila del 14 % con `vigencia_hasta` en esa fecha y
--    la del 10 % rigiendo desde entonces.
--
-- 🔴 Y REPONE ALGO PEOR QUE UN NÚMERO VIEJO: el `* 0.14` plano aplica UNA tasa
--    a TODO el año. Los pedidos anteriores al 11-ago devengaron al 14 % y los
--    posteriores al 10 %; un factor único es falso para la mitad de las filas
--    **en cualquiera de los dos valores**. Por eso la cura no cambió el número:
--    cambió la forma.
--
-- La reversa se deja igual porque una reversa que no puede correr no es una
-- reversa — pero quien la corra tiene que saber que está reponiendo un dato
-- que va a una conversación con inversores.
DROP VIEW IF EXISTS public.v_gmv_mensual;
DROP VIEW IF EXISTS public.v_metricas_tiempo_real;
DROP FUNCTION IF EXISTS public._fee_pct_vigente(text, text, timestamptz);
-- ⚠️ Las dos vistas hay que recrearlas desde su definición previa, que quedó
--    en el cuerpo de la migración `20260911050000` (bloque «LA FORMA VIEJA»).
