-- ============================================================================
-- S87-A · LOTE 1 — LOS TRES TIPOS QUE `sistema` ESCONDÍA
--
-- HALLAZGO QUE LOS PARIÓ: tres de las siete DEFINER escriben `tipo='sistema'`
-- para decir cosas distintas — "tu plan se renueva", "tu paquete vence", "tu
-- programa vence". Y `sistema` mapea a `seguridad_cuenta`, que es EL ÚNICO
-- SOBREVIVIENTE DEL MEMORIAL (§5.1). Migrarlas tal cual habría hecho que tres
-- avisos de PLATA atravesaran el memorial: una familia en duelo recibiendo
-- "tu paquete de salidas vence pronto".
--
-- El gate no habría fallado: habría corrido verde, porque la CATEGORÍA le
-- mentía. Defecto en el dato, no en el código — clase D-654, invisible a todo
-- fixture de gate. Se encontró LEYENDO los siete INSERT.
--
-- FIRMAS DEL FOUNDER (S87): los tres a `saldo_pagado`, y los tres DEJAN de
-- sobrevivir al memorial — son de la mascota y su servicio, no de la persona.
--
-- LA LETRA DE CASA QUE DEJÓ LA TERCERA: «ante la duda entre categoría
-- semánticamente limpia y categoría protectora, PROTEGE — un aviso no
-- silenciable se puede relajar después; un cobro sorpresa no se deshace.»
--
-- VEDA 76(g): NO RIGE — aditiva pura. Reversa: DELETE de los tres códigos.
-- ============================================================================

BEGIN;

INSERT INTO public.cat_notificacion_tipos (codigo, categoria, descripcion) VALUES
  ('paquete_vence',           'saldo_pagado',
   'Al paquete de salidas le quedan salidas y está por vencer (P16(e)).'),
  ('programa_vence',          'saldo_pagado',
   'Al programa de adiestramiento le quedan sesiones y está por vencer.'),
  ('plan_renovacion_proxima', 'saldo_pagado',
   'El plan se renueva y se va a cobrar. No se silencia: un cobro sorpresa no se deshace.');

DO $$
DECLARE v_n integer; v_mal text;
BEGIN
  SELECT count(*) INTO v_n FROM public.cat_notificacion_tipos WHERE categoria = 'saldo_pagado';
  IF v_n <> 3 THEN RAISE EXCEPTION 'saldo_pagado_esperaba_3_tipos_tiene_%', v_n; END IF;

  -- El cinturón que importa: NINGUNO de los tres puede quedar en una categoría
  -- que sobreviva al memorial. Se mide contra el gate REAL de la puerta
  -- (`seguridad_cuenta`), no contra una lista escrita a mano.
  SELECT string_agg(codigo, ', ') INTO v_mal
    FROM public.cat_notificacion_tipos
   WHERE codigo IN ('paquete_vence','programa_vence','plan_renovacion_proxima')
     AND categoria = 'seguridad_cuenta';
  IF v_mal IS NOT NULL THEN
    RAISE EXCEPTION 'tipo_de_plata_sobrevive_al_memorial: %', v_mal;
  END IF;

  RAISE NOTICE 'tres tipos de plata OK · saldo_pagado ya tiene habitantes';
END $$;

COMMIT;
