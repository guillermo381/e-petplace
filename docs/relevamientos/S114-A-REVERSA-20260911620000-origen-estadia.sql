-- REVERSA de `20260911620000_s114a_origen_estadia.sql`. Escrita ANTES.
-- 🔴 REPONE UN DEFECTO PROBADO: devuelve el `WHEN 'estadia'` a `estadias`,
--    que es una LÁPIDA de S107 con 0 filas. Con eso, TODO evento económico de
--    guardería vuelve a rebotar — y su modo de falla es el que §6 de
--    LETRA_POSTVENTA existe para cerrar: sin evento, la pregunta «¿tiene
--    devengo?» contesta NO y la devolución se va por la rama declarada
--    mientras el prestador conserva su devengo.
-- Sólo se corre si `guarderia_estadias` dejara de ser la tabla viva, y eso
-- sería una decisión de la mesa, no una reversión técnica.
CREATE OR REPLACE FUNCTION public.validar_origen_evento()
RETURNS trigger LANGUAGE plpgsql AS $function$
DECLARE v_existe boolean;
BEGIN
  CASE NEW.origen_tipo
    WHEN 'pedido' THEN SELECT EXISTS(SELECT 1 FROM pedidos WHERE id = NEW.origen_id) INTO v_existe;
    WHEN 'cita' THEN SELECT EXISTS(SELECT 1 FROM evento_cita_servicio WHERE id = NEW.origen_id) INTO v_existe;
    WHEN 'donacion' THEN v_existe := true;
    WHEN 'producto_comercial' THEN SELECT EXISTS(SELECT 1 FROM productos_comerciales WHERE id = NEW.origen_id) INTO v_existe;
    WHEN 'suscripcion' THEN SELECT EXISTS(SELECT 1 FROM suscripciones WHERE id = NEW.origen_id) INTO v_existe;
    WHEN 'bono' THEN SELECT EXISTS(SELECT 1 FROM bonos WHERE id = NEW.origen_id) INTO v_existe;
    WHEN 'estadia' THEN SELECT EXISTS(SELECT 1 FROM estadias WHERE id = NEW.origen_id) INTO v_existe;
    WHEN 'ajuste_manual' THEN v_existe := true;
    WHEN 'evento_diferido' THEN SELECT EXISTS(SELECT 1 FROM eventos_economicos WHERE id = NEW.origen_id) INTO v_existe;
    ELSE RAISE EXCEPTION 'origen_tipo "%" no es un tipo válido. Valores aceptados: pedido, cita, donacion, producto_comercial, suscripcion, bono, estadia, ajuste_manual, evento_diferido', NEW.origen_tipo;
  END CASE;
  IF NOT v_existe THEN
    RAISE EXCEPTION 'origen_tipo=% con origen_id=% no existe en la tabla correspondiente', NEW.origen_tipo, NEW.origen_id;
  END IF;
  RETURN NEW;
END; $function$;
