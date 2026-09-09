-- S114-A · EL MAPEO DE PLANTILLAS (firma founder), en el catálogo (territorio de A).
--
--   caso_devolucion_por_elegir  →  caso_elegir_devolucion   (ANTES de elegir)
--   devolucion_estado           →  caso_resuelto            (DESPUÉS de elegir)
--
-- Idioma 'es', como el precedente (pedido_confirmado). Cablear y comprobar no
-- pueden ser la misma mano: lo verifica E con verify:plantillas-categoria.
--
-- 76(g) NO RIGE (dato de catálogo, sin backfill de negocio). Reversa ANTES.

UPDATE cat_notificacion_tipos
   SET plantilla_whatsapp = 'caso_elegir_devolucion', plantilla_idioma = 'es'
 WHERE codigo = 'caso_devolucion_por_elegir';

UPDATE cat_notificacion_tipos
   SET plantilla_whatsapp = 'caso_resuelto', plantilla_idioma = 'es'
 WHERE codigo = 'devolucion_estado';

DO $cinturon$
DECLARE v_a text; v_b text;
BEGIN
  SELECT plantilla_whatsapp INTO v_a FROM cat_notificacion_tipos WHERE codigo='caso_devolucion_por_elegir';
  SELECT plantilla_whatsapp INTO v_b FROM cat_notificacion_tipos WHERE codigo='devolucion_estado';
  IF v_a <> 'caso_elegir_devolucion' THEN RAISE EXCEPTION 'CINTURÓN: mapeo por_elegir mal: %', v_a; END IF;
  IF v_b <> 'caso_resuelto' THEN RAISE EXCEPTION 'CINTURÓN: mapeo devolucion_estado mal: %', v_b; END IF;
  RAISE NOTICE 'CINTURÓN VERDE · por_elegir→caso_elegir_devolucion · devolucion_estado→caso_resuelto · idioma es';
END $cinturon$;
