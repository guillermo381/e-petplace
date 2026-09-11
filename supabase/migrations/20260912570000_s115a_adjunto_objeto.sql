-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · EL ADJUNTO SE LLAMA `objeto`, NO `ruta` — choque de vocabulario
--
-- 🔴 LO CAZÓ `verify:rutas-de-aviso` Y ES UN ACIERTO SUYO, no un falso positivo
--    que haya que silenciar: en esta casa **`ruta` significa «a dónde navega un
--    aviso»**, y el gate lee esa palabra en los productores para verificar que
--    ninguna push lleve a ninguna parte. Mi productor decía `ruta` para nombrar
--    un objeto de Storage, y el gate quedó sin poder leer cuál era.
--
--    Su salida es la lección: *«se declara en vez de ignorarse: un punto ciego
--    callado da verde por no mirar»*. **Podía haberlo silenciado; renombrar es
--    más barato y deja el gate viendo.**
--
-- 76(g) — VEDA: NO RIGE (reemplazo de función).
-- ═══════════════════════════════════════════════════════════════════════════
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
        /* `objeto`, no `ruta`: ver la cabecera de la migración 20260912570000. */
        'adjuntos', jsonb_build_array(
          jsonb_build_object('nombre', v_num || '.pdf', 'bucket', 'fiscal', 'objeto', NEW.pdf_url),
          jsonb_build_object('nombre', v_num || '.xml', 'bucket', 'fiscal', 'objeto', NEW.xml_url))),
      p_clave_dedup => 'factura_emitida:' || NEW.id::text);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'factura_correo_no_registrado documento=% %',
                  NEW.id, left(SQLSTATE || ': ' || SQLERRM, 160);
  END;

  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public._trg_factura_autorizada_correo() FROM PUBLIC, anon;
