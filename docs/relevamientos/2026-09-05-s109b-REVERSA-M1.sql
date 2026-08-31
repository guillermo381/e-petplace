-- REVERSA de 20260905220000_s109b_barrido_aplica_los_siete.sql
-- ESCRITA ANTES DE APLICAR.
--
-- ⚠️ QUÉ NO DESHACE, y hay que leerlo antes de correrla:
--    Revertir devuelve el hueco que esta migración cierra: **el barrido vuelve
--    a poder ENCONTRAR huérfanos de cita, bono, mensualidad y programa y a NO
--    poder aplicarlos.** Los cuatro cobran de verdad hoy; una fila pagada que
--    nada mueve es, del otro lado, una familia que pagó y no recibió.
--
--    🔴 Y hay que revertir TAMBIÉN las dos edge del barrido (`pagos-conciliar`,
--    `pagos-deuna-barrido`) al código anterior. Revertir sólo la base las deja
--    llamando a `aplicar_consulta_activa_nuvei`, que dejaría de existir ⇒ el
--    barrido de Nuvei no correría en absoluto. Las dos cosas o ninguna.
--
--    `aplicar_consulta_activa_deuna` vuelve a su cuerpo anterior (dos sujetos):
--    se re-aplica el de `20260826...`, no se escribe uno de memoria.

BEGIN;
DROP FUNCTION IF EXISTS public.aplicar_consulta_activa_nuvei(uuid, jsonb, text, text);
DROP FUNCTION IF EXISTS public.verificar_cobertura_desgloses();
DROP FUNCTION IF EXISTS public._total_congelado_del_intento(uuid);
-- `aplicar_consulta_activa_deuna`: re-aplicar su cuerpo previo desde su migración.
COMMIT;
