-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · LA INMUTABILIDAD ADMITE LA RESPUESTA DEL SRI
--
-- 🔴 SEGUNDA VEZ QUE EL MISMO TRIGGER FRENA ALGO, y por segunda vez tenía razón
--    en frenar: su comentario promete que se compara por LO QUE PUEDE CAMBIAR,
--    así que toda columna nace protegida y su autor tiene que venir acá a decir
--    por qué puede moverse. Vengo.
--
-- LO QUE SE ROMPÍA NO ERA SÓLO UN FIXTURE. El camino real: el **webhook** del
--    proveedor marca `autorizada`, y **después** `fiscal-validar-clave` le
--    pregunta al SRI y anota el número oficial. Con el trigger como estaba, ese
--    segundo paso **rebotaba** — y la compuerta de agencia, que exige
--    `sri_numero_autorizacion IS NOT NULL`, se volvía imposible de satisfacer
--    por ese camino. *Dos piezas mías correctas por separado, incompatibles.*
--
-- LA DECISIÓN: la respuesta del SRI **no es contenido que nosotros decidimos**,
--    es un hecho que llega de afuera y se anota — de la misma naturaleza que
--    `xml_url` y `pdf_url`, que ya estaban permitidos por esta razón exacta.
--    Lo que sigue siendo inmutable es lo que el documento DICE: cifras,
--    receptor, clave, secuencial.
--
-- ⚠️ Y se agregan TRES columnas nombradas, no una categoría: la próxima que
--    alguien quiera mover tiene que volver a pasar por acá.
--
-- 76(g) — VEDA: NO RIGE (reemplazo de función).
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public._trg_documento_fiscal_inmutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_permitido public.documentos_fiscales;
BEGIN
  IF OLD.estado <> 'autorizada' THEN RETURN NEW; END IF;

  IF (NEW.estado IS DISTINCT FROM OLD.estado) AND NEW.estado <> 'anulada' THEN
    RAISE EXCEPTION 'documento_autorizado_no_cambia_de_estado'
      USING ERRCODE = '42501',
            DETAIL  = 'De autorizada solo se sale a anulada; una correccion es una nota de credito.';
  END IF;

  v_permitido                          := OLD;
  v_permitido.xml_url                  := NEW.xml_url;
  v_permitido.pdf_url                  := NEW.pdf_url;
  v_permitido.estado                   := NEW.estado;
  v_permitido.updated_at               := NEW.updated_at;
  v_permitido.liquidacion_id           := NEW.liquidacion_id;
  /* La respuesta del SRI: un hecho que llega de afuera y se anota, no contenido
     que nosotros decidimos. Lo que el documento DICE sigue congelado. */
  v_permitido.sri_numero_autorizacion  := NEW.sri_numero_autorizacion;
  v_permitido.sri_fecha_autorizacion   := NEW.sri_fecha_autorizacion;
  v_permitido.autorizado_en            := NEW.autorizado_en;

  IF ROW(NEW.*) IS DISTINCT FROM ROW(v_permitido.*) THEN
    RAISE EXCEPTION 'documento_autorizado_es_inmutable'
      USING ERRCODE = '42501',
            DETAIL  = 'Solo xml_url, pdf_url, liquidacion_id, la respuesta del SRI '
                   || '(numero/fecha de autorizacion), estado->anulada y updated_at.';
  END IF;

  RETURN NEW;
END $function$;

-- CINTURÓN: lo de afuera se anota, lo que el documento DICE sigue congelado.
DO $c$
DECLARE v_id uuid; v_paso boolean;
BEGIN
  INSERT INTO public.documentos_fiscales
    (country_code, tipo, total, estado, sentido, rol, emitida_por_tercero, items, fecha_emision)
  VALUES ('EC','factura', 1, 'autorizada','recibido','factura_tercero_cliente', true,
          '[]'::jsonb, public.fiscal_hoy())
  RETURNING id INTO v_id;

  UPDATE public.documentos_fiscales
     SET sri_numero_autorizacion = 'AUT-PRUEBA', autorizado_en = now()
   WHERE id = v_id;                                   -- permitido

  BEGIN
    UPDATE public.documentos_fiscales SET identificacion = '9999999999' WHERE id = v_id;
    v_paso := true;
  EXCEPTION WHEN insufficient_privilege THEN v_paso := false;
  END;
  IF v_paso THEN
    RAISE EXCEPTION 'cinturon 🔴: se pudo cambiar el RECEPTOR de una autorizada.';
  END IF;

  DELETE FROM public.documentos_fiscales WHERE id = v_id;
  IF (SELECT count(*) FROM public.documentos_fiscales) <> 0 THEN
    RAISE EXCEPTION 'cinturon: residuo';
  END IF;
  RAISE NOTICE 'cinturon VERDE: la respuesta del SRI se anota, el receptor NO se mueve, residuo 0';
END $c$;
