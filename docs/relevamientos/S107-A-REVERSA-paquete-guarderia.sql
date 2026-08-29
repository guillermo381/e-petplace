/* REVERSA de `20260830120000_s107a_paquete_guarderia.sql` — ESCRITA ANTES DE APLICAR.

   🔴 QUÉ **NO** DESHACE, y hay que leerlo:
   ① **Los bonos de guardería YA COMPRADOS quedan huérfanos del CHECK.** Volver
      el CHECK a `= 'paseo'` **falla** si existe una sola fila `guarderia_dia`
      — y eso es correcto: *un CHECK no se revierte sobre datos que lo violan.*
      Antes de correrla hay que decidir qué se hace con esos bonos (plata de
      familias), y **eso es decisión de mesa, no de una reversa**.
   ② **Las citas ya agendadas contra saldo NO se cancelan.** Quedan firmes y
      pagadas, con su `bono_id` apuntando a un bono que el CHECK ya no admite.
   ③ Devuelve `vencer_paquetes_salidas` a mirar sólo paseo ⇒ **los paquetes de
      guardería dejan de vencer y su breakage no se registra, en silencio.** */
BEGIN;
DROP FUNCTION IF EXISTS public.reservar_dia_de_paquete_guarderia(uuid, date);
DROP FUNCTION IF EXISTS public.comprar_paquete_guarderia(uuid, integer);
-- `vencer_paquetes_salidas` vuelve desde `S107-A-REVERSA-vencer-antes.sql`.
-- El CHECK, SÓLO si no hay filas de guardería (ver ①):
--   ALTER TABLE public.bonos DROP CONSTRAINT bonos_tipo_valido;
--   ALTER TABLE public.bonos ADD CONSTRAINT bonos_tipo_valido CHECK (tipo_servicio = 'paseo');
COMMIT;
