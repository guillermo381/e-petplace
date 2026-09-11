-- REVERSA de 20260912650000_s115a_webhook_crudo.sql — escrita ANTES.
-- ⚠️ QUÉ NO DESHACE: los eventos ya recibidos se pierden con la tabla. Si hay
--    alguno sin procesar, su aviso NO vuelve — el proveedor ya lo entregó y
--    para él está entregado. Se listan y se aborta si queda alguno pendiente.
DO $$
DECLARE v_n integer;
BEGIN
  SELECT count(*) INTO v_n FROM public.fiscal_webhook_eventos WHERE procesado_en IS NULL;
  IF v_n > 0 THEN
    RAISE EXCEPTION 'reversa_abortada: % evento(s) sin procesar se perderian', v_n;
  END IF;
END $$;
DROP TABLE IF EXISTS public.fiscal_webhook_eventos;
