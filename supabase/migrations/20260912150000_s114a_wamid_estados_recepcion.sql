-- S114-A · WhatsApp: el wamid y los estados de RECEPCIÓN REAL — la mitad de D-1055
-- que sí se puede cerrar. Firma del founder (10-sep).
--
-- `aceptada_transporte` = «Meta aceptó (2xx)», NO «llegó». WhatsApp —a diferencia de
-- push/FCM v1— SÍ da receipts por webhook (sent/delivered/read). Para usarlos hace
-- falta guardar el `wamid` del envío (la llave con que el webhook encuentra la
-- entrega) y tener estados que digan lo que el webhook sabe:
--   aceptada_transporte  → Meta aceptó (lo único que teníamos)
--   entregada_aparato    → Meta confirmó DELIVERED (entrega REAL al aparato)
--   leida                → Meta confirmó READ
-- Son TRES cosas distintas; hasta hoy sólo teníamos la primera y el nombre mentía.
--
-- 76(g) NO RIGE (DB). Reversa ANTES en docs/relevamientos.

-- ① el wamid del proveedor (la llave del webhook), guardado en el ÉXITO
ALTER TABLE public.notificacion_entrega ADD COLUMN IF NOT EXISTS proveedor_msg_id text;
CREATE INDEX IF NOT EXISTS ix_notif_entrega_wamid ON public.notificacion_entrega (proveedor_msg_id)
  WHERE proveedor_msg_id IS NOT NULL;

-- ② estados que dicen lo que el webhook confirma
ALTER TABLE public.notificacion_entrega DROP CONSTRAINT notificacion_entrega_estado_check;
ALTER TABLE public.notificacion_entrega ADD CONSTRAINT notificacion_entrega_estado_check
  CHECK (estado = ANY (ARRAY['encolada','aceptada_transporte','entregada_aparato','leida','fallida']));

-- ── CINTURÓN ────────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE v_check text; v_col int;
BEGIN
  SELECT count(*) INTO v_col FROM information_schema.columns
   WHERE table_schema='public' AND table_name='notificacion_entrega' AND column_name='proveedor_msg_id';
  IF v_col <> 1 THEN RAISE EXCEPTION 'CINTURON: falta proveedor_msg_id'; END IF;
  v_check := pg_get_constraintdef((SELECT oid FROM pg_constraint WHERE conname='notificacion_entrega_estado_check'));
  IF v_check NOT LIKE '%entregada_aparato%' OR v_check NOT LIKE '%leida%' THEN
    RAISE EXCEPTION 'CINTURON: el CHECK no admite los estados de recepcion';
  END IF;
  RAISE NOTICE 'CINTURON VERDE - wamid + estados entregada_aparato/leida';
END $cinturon$;
