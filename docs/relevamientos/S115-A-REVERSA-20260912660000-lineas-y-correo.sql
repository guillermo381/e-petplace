-- REVERSA de 20260912660000_s115a_lineas_y_correo.sql — escrita ANTES.
-- ⚠️ QUÉ NO DESHACE: las líneas fiscales que se hayan escrito QUEDAN. Borrarlas
--    cambiaría la base imponible de documentos ya emitidos. Se listan y se
--    aborta si hay alguna, para que quien revierta decida a sabiendas.
DO $$
DECLARE v_n integer;
BEGIN
  SELECT count(*) INTO v_n FROM public.pagos_desglose_lineas;
  IF v_n > 0 THEN
    RAISE EXCEPTION 'reversa_abortada: % linea(s) fiscales vivas', v_n
      USING DETAIL = 'Son la base imponible de documentos ya emitidos.';
  END IF;
END $$;
-- El cuerpo anterior de las dos funciones hay que recrearlo desde
-- 20260912270000 (outbox) y 20260912210000 (receptor): esta reversa no lo
-- reconstruye sola. Se declara en vez de fingir que sí.
