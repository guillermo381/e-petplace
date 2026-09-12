-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · TRES CAMPOS PARA QUE «TUS FACTURAS» DIGA LA VERDAD
--
-- 🔴 EL DEFECTO QUE APARECIÓ AL ESCRIBIRLO: `pendiente_manual` se mostraba como
--    **«preparando»** — y en AGENCIA eso es una mentira con cara de paciencia.
--    Ahí factura el vendedor y **nosotros no vamos a emitir nunca**: la familia
--    que espera, espera algo que no va a llegar de nuestro lado.
--
--    *Un estado que promete movimiento sobre algo que está quieto es peor que
--    uno que dice «no puedo»: el segundo manda a preguntar, el primero manda a
--    esperar.*
--
-- 🔴 Y LA DISTINCIÓN QUE C NECESITA es justo ésa: **cuál de los trabados puede
--    resolver la familia y cuál no.** `faltan_tus_datos` lo resuelve ella dando
--    su cédula; `agencia` no lo resuelve nadie de este lado.
--
-- EDGES A DESPLEGAR (`L-536`): ninguna — la consume `packages/api`.
-- Veda 76(g): NO RIGE. Reversa: S115-A-REVERSA-20260912750000-tres-campos.sql
-- ═══════════════════════════════════════════════════════════════════════════

/* 🔴 DROP explícito: cambia el RETURNS TABLE. `CREATE OR REPLACE` con otra
   forma de retorno no reemplaza — rebota o deja una sobrecarga (L-119). */
DROP FUNCTION IF EXISTS public.fiscal_mis_documentos();

CREATE FUNCTION public.fiscal_mis_documentos()
RETURNS TABLE(
  id uuid, tipo text, estado text, estado_visible text, total numeric, moneda text,
  fecha_emision date, clave_acceso text, numero text, tiene_xml boolean, tiene_ride boolean,
  tipo_identificacion text, identificacion text,
  emitida_por_tercero boolean, motivo_visible text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sin_sesion' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT d.id, d.tipo::text, d.estado::text,
         /* `borrador` y `emitiendo` se muestran IGUAL: «preparando». La familia
            no tiene por qué conocer el estado interno del pipeline. */
         CASE
           WHEN d.estado = 'pendiente_manual' AND d.emitida_por_tercero
             THEN 'la_emite_el_vendedor'
           WHEN d.estado IN ('borrador','emitiendo','pendiente_manual') THEN 'preparando'
           WHEN d.estado = 'esperando_receptor' THEN 'faltan_tus_datos'
           WHEN d.estado = 'autorizada' THEN 'lista'
           WHEN d.estado = 'no_autorizada' THEN 'con_problema'
           WHEN d.estado = 'anulada' THEN 'anulada'
         END,
         d.total, d.moneda, d.fecha_emision, d.clave_acceso,
         CASE WHEN d.secuencial IS NOT NULL
              THEN d.establecimiento||'-'||d.punto_emision||'-'||d.secuencial
              ELSE d.numero_factura END,
         (d.xml_url IS NOT NULL), (d.pdf_url IS NOT NULL),
         /* 🔴 A NOMBRE DE QUIÉN SALIÓ. Sin esto la pantalla no puede decir
            «a nombre de Juan Pérez» ni «como consumidor final», y las dos son
            cosas distintas que la familia eligió (o que se eligieron por ella). */
         d.tipo_identificacion, d.identificacion,
         d.emitida_por_tercero,
         /* 🔴 EL MOTIVO, EN VOZ DE PRODUCTO Y NO DE MOTOR. `motivo_rechazo`
            lleva texto técnico —y a veces el mensaje crudo del proveedor—: no
            se expone. Se traduce a un CÓDIGO cerrado que la pantalla viste. */
         CASE
           WHEN d.emitida_por_tercero THEN 'la_factura_el_vendedor'
           WHEN d.estado = 'esperando_receptor' AND d.motivo_rechazo LIKE 'supera_tope%'
             THEN 'necesitamos_tu_identificacion'
           WHEN d.estado = 'esperando_receptor' AND d.motivo_rechazo LIKE 'sin_correo%'
             THEN 'necesitamos_tu_correo'
           WHEN d.estado = 'esperando_receptor' THEN 'faltan_tus_datos'
           WHEN d.estado = 'no_autorizada' THEN 'no_pudimos_emitirla'
           ELSE NULL
         END
    FROM public.documentos_fiscales d
   WHERE d.user_id = auth.uid()
   ORDER BY d.created_at DESC;
END $function$;

REVOKE EXECUTE ON FUNCTION public.fiscal_mis_documentos() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fiscal_mis_documentos() TO authenticated;

DO $cint$
DECLARE v_mal boolean; v_sobrecargas int;
BEGIN
  SELECT count(*) INTO v_sobrecargas FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='fiscal_mis_documentos';
  IF v_sobrecargas <> 1 THEN
    RAISE EXCEPTION 'cinturon: quedaron % sobrecargas de fiscal_mis_documentos (L-119)', v_sobrecargas;
  END IF;
  SELECT has_function_privilege('anon','public.fiscal_mis_documentos()','EXECUTE') INTO v_mal;
  IF v_mal THEN RAISE EXCEPTION 'L-140: anon lee las facturas de la familia'; END IF;
  RAISE NOTICE 'cinturon tres campos: una sola firma · anon afuera';
END $cint$;
