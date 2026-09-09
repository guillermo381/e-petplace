-- S114-A ② · EL PRODUCTOR DE AVISOS DEL CASO — D-673 otra vez.
--
-- F/founder: el prestador abrió un caso nuevo y la familia escribió, y NADA le
-- llegó — tuvo que entrar a buscar a Casos. Medido: CERO triggers sobre
-- caso_mensajes/casos_postventa, las RPC no notifican, y no existía el tipo
-- caso_abierto (§10: el motor de avisos entero, y el aviso más obvio no existe
-- porque nadie toca el timbre). Se cablean los productores.
--
-- Patrón copiado de _trg_pedido_avisa_vendedor (20260911020000): trigger que
-- llama registrar_intencion_notificacion, envuelto para NO tumbar la transacción,
-- con dedup por la FILA. in_app es el piso (§10); el transporte lo decide el motor.
--
-- 76(g) NO RIGE (DB, sin anclas de OTA; sin backfill de negocio).
-- Reversa escrita ANTES.

-- ① Los tipos (§10). Categoría operacion ⇒ utility. NO en sombra: el punto es
--    que el prestador SE ENTERE. Audiencia según a quién le llega.
INSERT INTO cat_notificacion_tipos (codigo, categoria, audiencia, en_sombra, activo, descripcion) VALUES
  ('caso_abierto',              'operacion', 'prestador', false, true,
   'S114 · Se abrió un caso de postventa sobre uno de tus servicios.'),
  ('caso_familia_escribio',     'operacion', 'prestador', false, true,
   'S114 · La familia escribió en un caso que estás atendiendo.'),
  ('caso_prestador_respondio',  'operacion', 'cliente',   false, true,
   'S114 · Hay una respuesta nueva en tu caso.')
ON CONFLICT (codigo) DO NOTHING;

-- ② caso_abierto: al entrar el caso a con_prestador, avisa al dueño del prestador.
CREATE OR REPLACE FUNCTION public._trg_caso_abierto_avisa()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_dest uuid;
BEGIN
  IF NEW.etapa <> 'con_prestador' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.etapa IS NOT DISTINCT FROM NEW.etapa THEN RETURN NEW; END IF;
  IF NEW.prestador_id IS NULL THEN RETURN NEW; END IF;

  SELECT user_id INTO v_dest FROM prestadores WHERE id = NEW.prestador_id;
  IF v_dest IS NULL THEN
    RAISE WARNING 'caso_abierto sin destinatario: caso % / prestador %', NEW.id, NEW.prestador_id;
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM registrar_intencion_notificacion(
      'caso_abierto', v_dest, NULL, NULL,
      jsonb_build_object('caso_id', NEW.id, 'objeto_tipo', NEW.objeto_tipo,
                         'titulo', 'Tienes un caso nuevo'),
      'caso_abierto:' || NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'aviso caso_abierto no registrado: %', SQLERRM;
  END;
  RETURN NEW;
END $fn$;
REVOKE ALL ON FUNCTION public._trg_caso_abierto_avisa() FROM anon, PUBLIC;

DROP TRIGGER IF EXISTS trg_caso_abierto_avisa ON public.casos_postventa;
CREATE TRIGGER trg_caso_abierto_avisa
  AFTER INSERT OR UPDATE OF etapa ON public.casos_postventa
  FOR EACH ROW EXECUTE FUNCTION public._trg_caso_abierto_avisa();

-- ③ caso mensaje: al escribir un mensaje real (tipo='mensaje', no 'hecho'),
--    avisa a la OTRA parte. La familia escribe ⇒ al prestador; el prestador o la
--    casa escriben ⇒ a la familia. Nunca a uno mismo.
CREATE OR REPLACE FUNCTION public._trg_caso_mensaje_avisa()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_c record; v_dest uuid; v_tipo text;
BEGIN
  IF NEW.tipo <> 'mensaje' THEN RETURN NEW; END IF;  -- 'hecho' es evento de sistema, no chat
  SELECT familia_user_id, prestador_id, etapa INTO v_c FROM casos_postventa WHERE id = NEW.caso_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  IF NEW.autor = 'familia' THEN
    IF v_c.prestador_id IS NULL THEN RETURN NEW; END IF;   -- con_casa: la casa lo ve en su bandeja
    SELECT user_id INTO v_dest FROM prestadores WHERE id = v_c.prestador_id;
    v_tipo := 'caso_familia_escribio';
  ELSE  -- 'prestador' o 'casa' escriben ⇒ a la familia
    v_dest := v_c.familia_user_id;
    v_tipo := 'caso_prestador_respondio';
  END IF;

  IF v_dest IS NULL OR v_dest = NEW.autor_user_id THEN RETURN NEW; END IF;

  BEGIN
    PERFORM registrar_intencion_notificacion(
      v_tipo, v_dest, NULL, NULL,
      jsonb_build_object('caso_id', NEW.caso_id, 'titulo', 'Mensaje nuevo en tu caso'),
      'caso_msg:' || NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'aviso caso mensaje no registrado: %', SQLERRM;
  END;
  RETURN NEW;
END $fn$;
REVOKE ALL ON FUNCTION public._trg_caso_mensaje_avisa() FROM anon, PUBLIC;

DROP TRIGGER IF EXISTS trg_caso_mensaje_avisa ON public.caso_mensajes;
CREATE TRIGGER trg_caso_mensaje_avisa
  AFTER INSERT ON public.caso_mensajes
  FOR EACH ROW EXECUTE FUNCTION public._trg_caso_mensaje_avisa();
