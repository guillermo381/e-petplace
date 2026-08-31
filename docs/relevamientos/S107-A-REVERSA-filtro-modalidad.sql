/* REVERSA de `20260829230000_s107a_filtro_modalidad.sql` — ESCRITA ANTES DE APLICAR.

   🔴 QUÉ **NO** DESHACE:
   ① **Vuelve a ESCONDER** los lugares que ofrecen sólo paquete o sólo mensual.
      *Correr esta reversa reinstala el defecto que la migración cura* — se dice
      con todas las letras porque el defecto **no da error**: devuelve una lista
      más corta y nadie lo nota.
   ② **Rompe a quien ya llame con `p_modalidad`.** Si la pantalla de C ya
      encendió su selector, esta reversa la deja llamando a una función con una
      firma que no existe ⇒ 404 de PostgREST. **Antes de correrla, apagar la
      compuerta del selector.**
   ③ No toca `reservar_dia_guarderia`: su guard `no_ofrece_dia_suelto` es propio
      y nunca dependió del helper (medido). */
BEGIN;
DROP FUNCTION IF EXISTS public.obtener_guarderias_disponibles(date, uuid, double precision, double precision, text);
DROP FUNCTION IF EXISTS public._guarderia_ofertas_cobrables(uuid, text);
-- y se re-crean las dos firmas viejas desde su archivo:
--   docs/relevamientos/S107-A-REVERSA-filtro-antes.sql
COMMIT;
