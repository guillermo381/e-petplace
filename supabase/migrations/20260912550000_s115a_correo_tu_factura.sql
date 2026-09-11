-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · EL CORREO «TU FACTURA» — con RIDE Y XML, por el motor de avisos
--
-- Patrón del comprobante de pago (S101-B), medido de su fila y no inventado:
-- `canal_forzado='email'` + `ignora_techo=true`. *Una factura no es una novedad
-- que compite por el techo de avisos del día: es una constancia, y llega.*
--
-- 🔴 EL DISPARO EXIGE LOS DOS ARCHIVOS, no sólo la autorización. Un correo que
--    dice «Tu factura» y llega sin la factura es peor que uno que no llegó: el
--    que lo recibe cree que ya la tiene. Por eso la condición es
--    `autorizada AND xml_url IS NOT NULL AND pdf_url IS NOT NULL`, y el
--    despachador además NO manda si un adjunto declarado no se puede bajar.
--
-- 76(g) — VEDA: NO RIGE (catálogo + trigger; 0 documentos).
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.cat_notificacion_tipos
  (codigo, categoria, descripcion, en_sombra, activo, audiencia, canal_forzado,
   ignora_techo, plantilla_idioma)
VALUES
  ('factura_emitida', 'operacion',
   'Se autorizo la factura electronica de una compra. Canal de constancia: '
   'llega con el RIDE y el XML adjuntos, que es lo que el comprador espera.',
   false, true, 'cliente', 'email', true, 'es')
ON CONFLICT (codigo) DO UPDATE
  SET canal_forzado = EXCLUDED.canal_forzado,
      ignora_techo  = EXCLUDED.ignora_techo,
      activo        = EXCLUDED.activo;

CREATE OR REPLACE FUNCTION public._trg_factura_autorizada_correo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_listo boolean; v_estaba boolean; v_num text;
BEGIN
  v_listo := NEW.estado = 'autorizada' AND NEW.sentido = 'emitido'
             AND NEW.xml_url IS NOT NULL AND NEW.pdf_url IS NOT NULL
             AND NEW.user_id IS NOT NULL;
  v_estaba := COALESCE(OLD.estado::text,'') = 'autorizada'
              AND OLD.xml_url IS NOT NULL AND OLD.pdf_url IS NOT NULL;
  IF NOT v_listo OR v_estaba THEN RETURN NEW; END IF;

  v_num := COALESCE(NEW.establecimiento || '-' || NEW.punto_emision || '-' || NEW.secuencial,
                    NEW.clave_acceso, NEW.id::text);

  BEGIN
    PERFORM public.registrar_intencion_notificacion(
      p_tipo => 'factura_emitida',
      p_destinatario_user_id => NEW.user_id,
      p_mascota_id => NULL,
      p_evento_id => NULL,
      p_datos => jsonb_build_object(
        'titulo', CASE WHEN NEW.tipo = 'nota_credito'
                       THEN 'Tu nota de crédito ' || v_num
                       ELSE 'Tu factura ' || v_num END,
        'mensaje', 'Adjuntamos tu comprobante electrónico: el PDF para leer y '
                || 'el XML con el que el SRI lo autorizó. Los dos son válidos.',
        'adjuntos', jsonb_build_array(
          jsonb_build_object('nombre', v_num || '.pdf', 'bucket', 'fiscal', 'ruta', NEW.pdf_url),
          jsonb_build_object('nombre', v_num || '.xml', 'bucket', 'fiscal', 'ruta', NEW.xml_url))),
      /* La dedup es por DOCUMENTO: un documento, un correo, aunque el webhook
         re-toque la fila. */
      p_clave_dedup => 'factura_emitida:' || NEW.id::text);
  EXCEPTION WHEN OTHERS THEN
    /* La factura YA está autorizada: no se deja caer por el aviso. Pero se
       grita — un correo que no se registró no deja ningún rastro propio. */
    RAISE WARNING 'factura_correo_no_registrado documento=% %',
                  NEW.id, left(SQLSTATE || ': ' || SQLERRM, 160);
  END;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_factura_autorizada_correo
  AFTER UPDATE OF estado, xml_url, pdf_url ON public.documentos_fiscales
  FOR EACH ROW EXECUTE FUNCTION public._trg_factura_autorizada_correo();

REVOKE EXECUTE ON FUNCTION public._trg_factura_autorizada_correo() FROM PUBLIC, anon;

DO $c$
DECLARE v_t record;
BEGIN
  SELECT * INTO v_t FROM public.cat_notificacion_tipos WHERE codigo='factura_emitida';
  IF v_t.canal_forzado <> 'email' OR NOT v_t.ignora_techo OR NOT v_t.activo THEN
    RAISE EXCEPTION 'cinturon: el tipo no quedo como el comprobante de pago: %', to_jsonb(v_t)::text;
  END IF;
  RAISE NOTICE 'cinturon VERDE: factura_emitida · canal=% · ignora_techo=% · activo=%',
               v_t.canal_forzado, v_t.ignora_techo, v_t.activo;
END $c$;
