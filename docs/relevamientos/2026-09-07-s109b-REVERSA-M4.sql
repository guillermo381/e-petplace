-- REVERSA de 20260907100000_s109b_d984_el_lazo_deja_de_asumir_despensa.sql
-- ESCRITA ANTES DE APLICAR.
--
-- 🔴 QUÉ NO DESHACE, y es lo más caro de esta sesión:
--    Revertir devuelve `D-984` a su peor forma — el cron suena, la edge corre
--    sus dos selectores de siempre, **la mensualidad no se cobra, y el timbre
--    devuelve `ok:true`**. El founder lo subió de deuda a BLOQUEO DE LANZAMIENTO
--    justamente porque ese modo de falla no tiene quien lo mire.
--
-- ⚠️ Y HAY QUE REVERTIR EN PAREJA con `pagos-cobro-recurrente`. La edge nueva
--    usa `sujeto`/`sujeto_id` y `_desglose_congelado_del_intento`; revertir sólo
--    la base la deja leyendo campos que los selectores dejarían de emitir ⇒
--    **el cobro recurrente de despensa, que HOY FUNCIONA, se caería.** Las dos
--    o ninguna. *Esto no es una pieza nueva al costado: es el lazo por donde
--    pasa plata que ya se cobra.*
--
--    Los cuerpos anteriores de los tres selectores viven en sus migraciones;
--    revertir es re-aplicar ESOS cuerpos, jamás escribir uno de memoria:
--      · recurrencias_vencidas_pendientes → su migración de S103
--      · planes_vencidos_pendientes       → su migración de S103
--      · mensualidades_vencidas_pendientes → 20260904120000

BEGIN;
DROP FUNCTION IF EXISTS public.verificar_compuertas_del_intento(uuid);
DROP FUNCTION IF EXISTS public._desglose_congelado_del_intento(uuid);
-- los tres selectores y el timbre: re-aplicar sus cuerpos previos.
COMMIT;
