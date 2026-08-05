-- ============================================================================
-- S87-A · LOTE 1 · PIEZA ① — EL CATÁLOGO DE CATEGORÍAS
--
-- Cierra el hueco que el censo de S87 nombró: las siete categorías de
-- `MODELO_NOTIFICACIONES` §3 NO EXISTÍAN EN NINGUNA PARTE DEL SCHEMA.
-- `notificaciones.tipo` tiene un CHECK cerrado de 26 valores y
-- `user_notificacion_prefs.tipo` uno abierto (`length > 0`) — pero un CHECK
-- dice qué valores se admiten, JAMÁS QUÉ SON. Los cinco gates de §5 no
-- pueden preguntar "¿esta categoría es apagable?" si la categoría no es un
-- dato: por eso esta pieza va PRIMERA y por eso las demás dependen de ella.
--
-- VEDA 76(g): NO RIGE — aditiva pura, sin backfill, sin anclas. No toca
-- `notificaciones` ni `user_notificacion_prefs` ni ningún CHECK vivo.
--
-- REVERSA escrita ANTES de aplicar:
--   docs/relevamientos/2026-08-04-s87a-REVERSA-catalogo-notificaciones.sql
--
-- FIRMAS DEL FOUNDER QUE ESTA MIGRACIÓN EJECUTA (S87, 4-ago-2026):
--   · `saldo_pagado` ENTRA ⇒ el catálogo nace con SIETE categorías.
--   · La letra de salud: «elige por dónde le llegan, no si le llegan» ⇒
--     `apagable_existencia` es propiedad de la CATEGORÍA, jamás del tipo.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- ① LAS SIETE CATEGORÍAS (§3)
--
-- `apagable_existencia` vive ACÁ y no en el tipo, y es la letra de salud
-- hecha estructura: si fuera por tipo, alguien podría marcar UN aviso de
-- salud como apagable sin tocar la ley. Al colgar de la categoría, apagar
-- `vacuna_vencida` exige cambiar QUÉ ES, no una perilla.
-- ---------------------------------------------------------------------------
CREATE TABLE public.cat_notificacion_categorias (
  codigo                text PRIMARY KEY,
  descripcion           text NOT NULL,
  -- ¿se puede apagar QUE LLEGUE? (el canal siempre se elige — §3/§6)
  apagable_existencia   boolean NOT NULL,
  -- default de entrega cuando la persona no dijo nada (§6)
  default_habilitada    boolean NOT NULL,
  -- taxonomía que Meta fiscaliza y cobra (§3) — se guarda para que el día
  -- del costeo nadie tenga que re-derivarla desde la voz.
  meta_categoria        text NOT NULL
    CHECK (meta_categoria IN ('authentication','utility','marketing')),
  orden                 integer NOT NULL,
  CONSTRAINT cat_notif_cat_coherencia CHECK (
    -- Una categoría no apagable JAMÁS puede nacer apagada: sería un aviso
    -- obligatorio que no llega. La incoherencia queda INEXPRESABLE.
    (apagable_existencia = false AND default_habilitada = true)
    OR apagable_existencia = true
  )
);

COMMENT ON TABLE public.cat_notificacion_categorias IS
  'Las 7 categorías de MODELO_NOTIFICACIONES §3. `apagable_existencia` es la '
  'letra de salud firmada por el founder (S87): "elige por dónde le llegan, '
  'no si le llegan". Es propiedad de la CATEGORÍA, jamás del tipo.';

INSERT INTO public.cat_notificacion_categorias
  (codigo, descripcion, apagable_existencia, default_habilitada, meta_categoria, orden)
VALUES
  ('seguridad_cuenta', 'Acceso y cambios de credencial. Es de la persona, no de la mascota: sobrevive al memorial (§5.1).',
     false, true,  'authentication', 1),
  ('salud_seguridad',  'Urgencia, alerta de la mascota, retiro de lote. Su ausencia daña a la mascota.',
     false, true,  'utility',        2),
  ('saldo_pagado',     'Saldo pagado que vence: paquetes, planes (P16(e)). Su ausencia daña al dinero YA PAGADO.',
     false, true,  'utility',        3),
  ('operacion',        'Cita, servicio, pedido, autorización: el estado de algo que la persona contrató.',
     true,  true,  'utility',        4),
  ('relacional',       'Mensajes y respuestas de una persona a otra.',
     true,  true,  'utility',        5),
  ('resumen',          'Digests (§8). Opt-in.',
     true,  false, 'utility',        6),
  ('comercial',        'Promos, ofertas, novedades. OPT-IN: apagado por defecto en TODOS los canales (§3/§6/§12.3).',
     true,  false, 'marketing',      7);

-- ---------------------------------------------------------------------------
-- ② EL CATÁLOGO DE TIPOS → CATEGORÍA
--
-- Cubre los 26 valores del CHECK vivo de `notificaciones.tipo`, no solo los
-- 10 con filas. El censo midió 10 EN USO; el CHECK admite 26, y un tipo que
-- el motor pueda recibir sin categoría sería exactamente el hueco que esta
-- pieza cierra.
--
-- EL CRITERIO DEL MAPEO (firmado en §3, para el tipo N+1): la categoría la
-- decide DE QUIÉN ES EL HECHO — la cuenta · el cuerpo de la mascota · el
-- proceso contratado · otra persona — JAMÁS quién lo mira.
-- ---------------------------------------------------------------------------
CREATE TABLE public.cat_notificacion_tipos (
  codigo      text PRIMARY KEY,
  categoria   text NOT NULL REFERENCES public.cat_notificacion_categorias(codigo),
  descripcion text NOT NULL,
  -- §10.2: TODO tipo nuevo nace en sombra. El primer envío real de un tipo
  -- es gate del founder, siempre. Por eso el default es `true` y no hay
  -- forma de nacer vivo por descuido.
  en_sombra   boolean NOT NULL DEFAULT true,
  activo      boolean NOT NULL DEFAULT true
);

COMMENT ON TABLE public.cat_notificacion_tipos IS
  'Vocabulario de tipos con su categoría (MODELO_NOTIFICACIONES §3, ENMIENDA '
  'S87). Cubre los 26 valores del CHECK vivo de notificaciones.tipo. '
  'en_sombra=true por default: §10.2 exige que todo tipo nuevo corra sin '
  'enviar hasta el gate del founder.';

INSERT INTO public.cat_notificacion_tipos (codigo, categoria, descripcion) VALUES
  -- el cuerpo de la mascota
  ('vacuna_vencida',        'salud_seguridad', 'A la mascota le vence una vacuna.'),
  ('wearable_alerta',       'salud_seguridad', 'El wearable levantó una alerta sobre la mascota.'),
  -- la cuenta
  ('sistema',               'seguridad_cuenta','Aviso de la cuenta. Sobrevive al memorial (§5.1).'),
  -- persona a persona
  ('mensaje_nuevo',         'relacional',      'Mensaje nuevo de una persona.'),
  -- el proceso contratado: citas
  ('cita_solicitada',       'operacion',       'Se solicitó una cita.'),
  ('cita_confirmada',       'operacion',       'La cita quedó confirmada.'),
  ('cita_rechazada',        'operacion',       'La cita fue rechazada.'),
  ('cita_recordatorio',     'operacion',       'Recordatorio de una cita próxima.'),
  ('cita_completada',       'operacion',       'La cita se completó.'),
  ('cita_no_show',          'operacion',       'La cita se cerró como no-show.'),
  ('cita_cancelada_cliente','operacion',       'El cliente canceló la cita.'),
  ('cita_calificada',       'operacion',       'La cita recibió calificación.'),
  -- el proceso contratado: plata y pedidos
  ('pago_confirmado',       'operacion',       'Se confirmó un pago. Canal de constancia (§7).'),
  ('pedido_estado',         'operacion',       'Cambió el estado de un pedido.'),
  ('pedido_recurrente',     'operacion',       'Movimiento de un pedido recurrente.'),
  ('devolucion_estado',     'operacion',       'Cambió el estado de una devolución.'),
  ('liquidacion_disponible','operacion',       'Hay una liquidación disponible para el prestador.'),
  -- el proceso propio del prestador (duda de D resuelta en §3: es estado de
  -- un trámite que él inició, no respuesta de otra persona ⇒ operacion)
  ('prestador_aprobado',    'operacion',       'El prestador quedó aprobado.'),
  ('prestador_rechazado',   'operacion',       'El prestador fue rechazado.'),
  ('prestador_suspendido',  'operacion',       'El prestador fue suspendido.'),
  ('documento_aprobado',    'operacion',       'Un documento del prestador fue aprobado.'),
  ('documento_rechazado',   'operacion',       'Un documento del prestador fue rechazado.'),
  -- el alta asistida
  ('alta_asistida_pendiente_enviar_email','operacion','Alta asistida pendiente de envío.'),
  ('alta_asistida_completada_por_cliente','operacion','El cliente completó su alta asistida.'),
  ('alta_asistida_vencida_soporte',       'operacion','Un alta asistida venció y necesita soporte.'),
  -- comercial
  ('promocion',             'comercial',       'Promoción. OPT-IN: apagada por defecto (§12.3).');

-- ---------------------------------------------------------------------------
-- ③ LOS CINTURONES — corren DENTRO de la migración y la ABORTAN
--
-- L-199: el rojo se produce antes de creerle al verde. Estos no son
-- comentarios: si el catálogo no cubre lo vivo, esta migración no entra.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_faltan   text;
  v_cats     integer;
  v_huerfano text;
BEGIN
  -- (a) ¿el catálogo cubre TODOS los tipos que hoy tienen filas vivas?
  SELECT string_agg(DISTINCT n.tipo, ', ')
    INTO v_faltan
    FROM public.notificaciones n
   WHERE NOT EXISTS (SELECT 1 FROM public.cat_notificacion_tipos t WHERE t.codigo = n.tipo);
  IF v_faltan IS NOT NULL THEN
    RAISE EXCEPTION 'catalogo_incompleto_notificaciones: %', v_faltan;
  END IF;

  -- (b) ¿y los que la superficie de preferencias ya escribió?
  SELECT string_agg(DISTINCT p.tipo, ', ')
    INTO v_faltan
    FROM public.user_notificacion_prefs p
   WHERE NOT EXISTS (SELECT 1 FROM public.cat_notificacion_tipos t WHERE t.codigo = p.tipo);
  IF v_faltan IS NOT NULL THEN
    RAISE EXCEPTION 'catalogo_incompleto_prefs: %', v_faltan;
  END IF;

  -- (c) ¿el catálogo cubre el CHECK entero de notificaciones.tipo (26)?
  --     Se mide contra el CHECK VIVO, no contra una lista escrita a mano.
  SELECT string_agg(v, ', ') INTO v_faltan
    FROM (
      SELECT unnest(
        string_to_array(
          replace(replace(replace(
            substring(pg_get_constraintdef(c.oid) from '\(ARRAY\[(.*)\]\)'),
            '''::text',''), '''',''), ' ', ''),
          ',')
      ) AS v
      FROM pg_constraint c JOIN pg_class r ON r.oid = c.conrelid
      WHERE r.relname = 'notificaciones' AND c.conname = 'notificaciones_tipo_check'
    ) s
   WHERE NOT EXISTS (SELECT 1 FROM public.cat_notificacion_tipos t WHERE t.codigo = s.v);
  IF v_faltan IS NOT NULL THEN
    RAISE EXCEPTION 'catalogo_no_cubre_el_check_vivo: %', v_faltan;
  END IF;

  -- (d) las SIETE categorías, ni seis ni ocho (firma del founder S87)
  SELECT count(*) INTO v_cats FROM public.cat_notificacion_categorias;
  IF v_cats <> 7 THEN
    RAISE EXCEPTION 'categorias_esperadas_7_encontradas_%', v_cats;
  END IF;

  -- (e) ninguna categoría sin tipos NO es un error (saldo_pagado nace sin
  --     aviso construido) — pero un TIPO sin categoría válida sí lo sería.
  --     La FK ya lo impide; se verifica igual porque el costo es cero.
  SELECT string_agg(t.codigo, ', ') INTO v_huerfano
    FROM public.cat_notificacion_tipos t
   WHERE NOT EXISTS (SELECT 1 FROM public.cat_notificacion_categorias c WHERE c.codigo = t.categoria);
  IF v_huerfano IS NOT NULL THEN
    RAISE EXCEPTION 'tipos_sin_categoria: %', v_huerfano;
  END IF;

  RAISE NOTICE 'cinturones OK · categorias=% · tipos=%',
    v_cats, (SELECT count(*) FROM public.cat_notificacion_tipos);
END $$;

-- ---------------------------------------------------------------------------
-- ④ PRIVILEGIOS — catálogos de LECTURA para quien esté logueado.
--     L-140: nada para `anon`, y se declara en vez de heredarse.
-- ---------------------------------------------------------------------------
ALTER TABLE public.cat_notificacion_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_notificacion_tipos      ENABLE ROW LEVEL SECURITY;

CREATE POLICY cat_notif_categorias_select_authenticated
  ON public.cat_notificacion_categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY cat_notif_tipos_select_authenticated
  ON public.cat_notificacion_tipos      FOR SELECT TO authenticated USING (true);

REVOKE ALL ON public.cat_notificacion_categorias FROM PUBLIC, anon;
REVOKE ALL ON public.cat_notificacion_tipos      FROM PUBLIC, anon;
GRANT SELECT ON public.cat_notificacion_categorias TO authenticated;
GRANT SELECT ON public.cat_notificacion_tipos      TO authenticated;

COMMIT;
