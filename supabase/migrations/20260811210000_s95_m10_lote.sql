-- ═══════════════════════════════════════════════════════════════════════════
-- S95-D · BLOQUE 2 — EL LOTE
--
-- 🔴 **POR QUÉ ES URGENTE Y NO ES UN NICE-TO-HAVE.** Los retiros de alimento
-- para mascotas son reales, recurrentes y **matan animales**. Sin lote, el día
-- que un fabricante retire uno **no se puede responder quién lo compró — y
-- menos qué mascota lo está comiendo.**
--
-- **Con lote, el retiro se convierte en lo más potente que este producto puede
-- hacer:** avisarle a las familias exactas cuyas mascotas están consumiendo
-- ese lote, cruzando por el expediente que ya existe. **Eso no es logística:
-- es cuidado.** Y ninguna tienda del mundo puede hacerlo, porque no sabe qué
-- perro hay del otro lado.
--
-- Reversa (escrita ANTES): docs/relevamientos/2026-08-11-s95-m10-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- LA VEDA **NO RIGE**. DDL aditivo sobre `pedido_items` (0 filas) y
-- `evento_producto_asignacion` (0 filas). Cero backfill, cero borrado.
--
-- ── LO QUE ESTE BLOQUE **NO** HACE, y es la mitad de su diseño ────────────
-- **No se construye el flujo de retiro.** Solo se deja el dato capturado y el
-- camino de consulta posible. *Un flujo de retiro que nadie va a correr en
-- octubre es código muerto; el dato que lo hace posible es una columna que
-- espera sin costo.*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE v_i int; v_e int;
BEGIN
  SELECT count(*) INTO v_i FROM pedido_items;
  SELECT count(*) INTO v_e FROM evento_producto_asignacion;
  IF v_i > 0 OR v_e > 0 THEN
    RAISE EXCEPTION 'ABORTA: pedido_items=% evento_producto_asignacion=%. Con filas vivas, agregar lote exige backfill y esta migración no lo hace.', v_i, v_e;
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE A · EL LOTE EN LA LÍNEA DEL PEDIDO
-- Nullable en la COLUMNA, exigido por la FUNCIÓN DE EMPAQUE (bloque 5): el
-- lote existe recién cuando alguien toma la bolsa del estante, no cuando la
-- familia compra.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.pedido_items
  ADD COLUMN lote               text,
  ADD COLUMN fecha_vencimiento  date,
  ADD COLUMN lote_registrado_en timestamptz,
  ADD COLUMN lote_registrado_por uuid REFERENCES public.profiles(id);

CREATE INDEX idx_items_lote ON public.pedido_items (lote) WHERE lote IS NOT NULL;

COMMENT ON COLUMN public.pedido_items.lote IS
  '🔴 EL DATO QUE HACE POSIBLE UN RETIRO. Los retiros de alimento para '
  'mascotas son reales y matan animales; sin lote no se puede responder quién '
  'compró ni qué mascota lo está comiendo. '
  'NULLABLE en la columna porque el lote existe recién AL EMPACAR — no cuando '
  'la familia compra. Lo EXIGE la función de empaque, no el esquema: un NOT '
  'NULL acá haría imposible crear el pedido.';

COMMENT ON COLUMN public.pedido_items.fecha_vencimiento IS
  'Se registra junto al lote, al empacar. Un producto vencido en el estante es '
  'una incidencia de picking (bloque 3), no una entrega.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE B · EL LOTE VIAJA AL EXPEDIENTE
-- 🔴 Sin esto, el cruce con el expediente NO SE PUEDE HACER: sabríamos qué
--    lote se despachó pero no qué mascota lo consume, que es justo el dato que
--    convierte el retiro en cuidado.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.evento_producto_asignacion
  ADD COLUMN lote              text,
  ADD COLUMN fecha_vencimiento date;

CREATE INDEX idx_prod_asig_lote ON public.evento_producto_asignacion (lote)
  WHERE lote IS NOT NULL;

COMMENT ON COLUMN public.evento_producto_asignacion.lote IS
  '🔴 EL PUENTE DEL RETIRO. Con esta columna, un retiro de fabricante se '
  'resuelve preguntándole al expediente qué mascotas están consumiendo ese '
  'lote — no a una lista de compradores, sino a las MASCOTAS. '
  'Es el foso del producto aplicado a la seguridad alimentaria: ninguna tienda '
  'puede hacerlo porque no sabe qué animal hay del otro lado.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE C · EL CAMINO DE CONSULTA — posible, sin flujo
-- Una vista, no un motor. `MODELO_DESPENSA` §7.4 rige: el vendedor no ve NADA
-- del expediente, así que esta vista es de PLATAFORMA y su policy lo dice.
-- ───────────────────────────────────────────────────────────────────────────
CREATE VIEW public.v_mascotas_por_lote AS
  SELECT epa.lote,
         epa.fecha_vencimiento,
         epa.familia_codigo,
         epa.nombre_producto,
         epa.mascota_id,
         m.nombre        AS mascota_nombre,
         m.especie,
         m.familia_id,
         epa.fecha_compra,
         epa.cantidad,
         epa.evento_id
  FROM public.evento_producto_asignacion epa
  JOIN public.mascotas m ON m.id = epa.mascota_id
  WHERE epa.lote IS NOT NULL;

COMMENT ON VIEW public.v_mascotas_por_lote IS
  'EL CAMINO DE CONSULTA DE UN RETIRO. No es un flujo: es la pregunta hecha '
  'posible. El flujo (a quién se avisa, con qué voz, por qué canal) NO se '
  'construye en v1 — un flujo que nadie va a correr en octubre es código '
  'muerto, y el dato que lo hace posible es una columna que espera sin costo. '
  '🔴 Su lectura es de PLATAFORMA: MODELO_DESPENSA §7.4 dice que el vendedor '
  'no ve NADA del expediente, y esta vista ES expediente.';

ALTER VIEW public.v_mascotas_por_lote SET (security_invoker = true);

REVOKE ALL ON public.v_mascotas_por_lote FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.v_mascotas_por_lote TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- CINTURONES
-- ───────────────────────────────────────────────────────────────────────────

-- 🔴 ① LA VISTA RESPONDE LA PREGUNTA DEL RETIRO, con datos reales.
--    No se verifica que la vista exista: se deposita una compra con lote sobre
--    una mascota real y se pregunta por el lote.
DO $$
DECLARE
  v_mascota uuid; v_pais text; v_user uuid; v_ev uuid; v_n int; v_nombre text;
BEGIN
  -- Nombres MEDIDOS (regla 22): `familia_miembro`, rol `adulto_titular`,
  -- estado de vida `activa`. Los tres me mordieron en S95-C por adivinarlos.
  SELECT m.id, m.country_code, fm.user_id INTO v_mascota, v_pais, v_user
  FROM mascotas m
  JOIN familia_miembro fm ON fm.familia_id = m.familia_id
                         AND fm.rol = 'adulto_titular' AND fm.hasta IS NULL
  WHERE m.estado_vida = 'activa' LIMIT 1;
  IF v_mascota IS NULL THEN
    RAISE EXCEPTION 'ABORTA: no hay mascota viva. El cinturón no puede probar nada.';
  END IF;

  INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, datos,
                               procedencia, modo_captura, country_code, creado_por_user_id)
    VALUES (v_mascota, 'producto_asignacion', 'alimentacion', now(),
            '{"cinturon":"s95_m10"}'::jsonb, 'declarado_por_familia', 'automatico',
            v_pais, v_user)
    RETURNING id INTO v_ev;

  INSERT INTO evento_producto_asignacion
    (evento_id, mascota_id, nombre_producto, familia_codigo, cantidad,
     fecha_compra, country_code, lote, fecha_vencimiento)
    VALUES (v_ev, v_mascota, '__cint_alimento_lote', 'alimento', 1,
            current_date, v_pais, 'L-CINT-0001', current_date + 180);

  -- 🔴 LA PREGUNTA DEL RETIRO: dado un lote, ¿qué mascotas lo consumen?
  SELECT count(*), max(mascota_nombre) INTO v_n, v_nombre
    FROM v_mascotas_por_lote WHERE lote = 'L-CINT-0001';
  IF v_n <> 1 OR v_nombre IS NULL THEN
    RAISE EXCEPTION 'ABORTA: el lote L-CINT-0001 devolvió % mascota(s) y debía devolver 1 CON NOMBRE. El camino del retiro no existe.', v_n;
  END IF;

  -- CONTRA-CASO: un lote que nadie compró no devuelve nada. Una vista que
  -- devuelve filas para cualquier lote no sirve para un retiro: sirve para
  -- asustar a todo el mundo.
  SELECT count(*) INTO v_n FROM v_mascotas_por_lote WHERE lote = 'L-QUE-NO-EXISTE';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'ABORTA: un lote inexistente devolvió % filas.', v_n;
  END IF;

  -- Y el otro contra-caso, que es el que protege la frontera: una compra SIN
  -- lote no aparece en la vista del retiro (no se puede avisar sobre algo que
  -- no se sabe de qué lote salió).
  INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, datos,
                               procedencia, country_code, creado_por_user_id)
    VALUES (v_mascota, 'producto_asignacion', 'alimentacion', now(),
            '{"cinturon":"s95_m10"}'::jsonb, 'declarado_por_familia', v_pais, v_user)
    RETURNING id INTO v_ev;
  INSERT INTO evento_producto_asignacion
    (evento_id, mascota_id, nombre_producto, familia_codigo, cantidad, fecha_compra, country_code)
    VALUES (v_ev, v_mascota, '__cint_sin_lote', 'alimento', 1, current_date, v_pais);

  SELECT count(*) INTO v_n FROM v_mascotas_por_lote WHERE nombre_producto = '__cint_sin_lote';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'ABORTA: una compra sin lote apareció en la vista del retiro.';
  END IF;

  DELETE FROM evento_producto_asignacion WHERE nombre_producto LIKE '\_\_cint%';
  DELETE FROM eventos_mascota WHERE datos->>'cinturon' = 's95_m10';
END $$;

-- ② La vista es security_invoker: si no lo fuera, correría como su dueño y
--    cualquiera con SELECT vería el expediente entero de todas las mascotas.
--    Es la diferencia entre una vista y un agujero.
DO $$
DECLARE v_opts text[];
BEGIN
  SELECT c.reloptions INTO v_opts FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname='v_mascotas_por_lote';
  IF v_opts IS NULL OR NOT ('security_invoker=true' = ANY(v_opts)) THEN
    RAISE EXCEPTION 'ABORTA: v_mascotas_por_lote NO es security_invoker. Correría como su dueño y expondría el expediente de TODAS las mascotas a cualquiera con SELECT.';
  END IF;
  IF has_table_privilege('anon','public.v_mascotas_por_lote','SELECT') THEN
    RAISE EXCEPTION 'ABORTA: anon puede leer la vista del retiro.';
  END IF;
END $$;

-- ③ Residuo 0.
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM evento_producto_asignacion;
  IF v_n > 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % detalles de fixture.', v_n; END IF;
  SELECT count(*) INTO v_n FROM eventos_mascota WHERE datos->>'cinturon' = 's95_m10';
  IF v_n > 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % hitos de fixture.', v_n; END IF;
END $$;

COMMIT;
