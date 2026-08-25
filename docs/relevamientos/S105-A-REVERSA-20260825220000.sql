-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260825220000_s105a_aplicador_barrido_deuna.sql
-- Escrita ANTES de aplicar.
--
-- QUÉ DESHACE: devuelve `_evento_autenticado` a su definición byte-idéntica
-- previa (sin la rama del barrido) y retira `aplicar_consulta_activa_deuna`.
--
-- 🔴 QUÉ **NO** DESHACE:
--   · Los pagos que este aplicador haya confirmado **se quedan confirmados**.
--     La plata se movió de verdad; el sujeto dice la verdad.
--   · Las filas de `webhook_events` con `origen='barrido'` **quedan**. Tras
--     revertir dejarían de autenticarse, así que un reproceso las rechazaría —
--     eso es correcto: sin el aplicador, ese camino no existe.
--
-- CONSECUENCIA DE CORRERLA: 🔴 **el barrido vuelve a detectar y no aplicar.**
-- Un pago cobrado por DeUna sin webhook queda con la plata movida del lado del
-- cliente y el sujeto sin pagar. *Es exactamente `D-887`, reabierta.*
-- ⛔ NO correr con la fila de DeUna encendida.
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._evento_autenticado(p_evento webhook_events)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT CASE p_evento.proveedor
    /* NUVEI · el stoken sigue mandando; lo que cambia es DE DÓNDE sale el
       veredicto de credencial: de una columna sellada al insertar, jamás de un
       campo de texto que después recibe mensajes de excepción. */
    WHEN 'nuvei' THEN
      coalesce(p_evento.stoken_valido, false)
      AND p_evento.credencial = 'SERVER'
    /* DEUNA · las dos condiciones, jamás una: un webhook con el secreto
       correcto y datos falsos muere en la consulta. Y `verificado` es ahora un
       BOOLEAN que escribe quien emite el veredicto — NULL no autentica. */
    WHEN 'deuna' THEN
      coalesce(p_evento.stoken_valido, false)
      AND p_evento.verificado IS TRUE
    /* 🔴 FAIL-CLOSED: un proveedor que nadie enseñó NO se autentica. */
    ELSE false
  END;
$function$
;

DROP FUNCTION IF EXISTS public.aplicar_consulta_activa_deuna(uuid, jsonb, text);
