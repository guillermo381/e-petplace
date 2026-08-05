-- ============================================================================
-- S87-A · LOTE 1 — LOS SIETE TIPOS QUE EL SEGUNDO CENSO DESTAPÓ
--
-- POR QUÉ EXISTE ESTA MIGRACIÓN: el primer censo contó FUNCIONES y reportó
-- AVISOS. Son 11 avisos en 6 funciones, no 6 -- `cerrar_y_renovar_planes` sola
-- tiene CUATRO. Un censo que cuenta contenedores y reporta contenido subcuenta
-- SIEMPRE, y en silencio: el número se ve razonable.
--
-- FIRMAS DEL FOUNDER (S87), con su criterio:
--  · los reembolsos a `saldo_pagado`: plata pagada que vuelve es la casa
--    literal de la categoría.
--  · `plan_renovado` a `operacion`: constancia de un cobro HECHO, el riesgo ya
--    pasó -- y operacion-constancia es el default de email: el comprobante
--    viaja por el canal de guardar (§7).
--  · `plan_renovacion_fallida` a `saldo_pagado` POR EL CRITERIO DEL DAÑO, no
--    por vecindad: el daño de silenciarlo es perder un servicio contratado sin
--    saberlo.
--  · el mismo hecho a DOS audiencias son DOS tipos, no uno con destinatario
--    variable: un tipo variable obliga a preferencias, techo y sombra a
--    preguntar "¿cuál?" en cada consulta.
--
-- VEDA 76(g): NO RIGE — aditiva pura.
-- ============================================================================

BEGIN;

INSERT INTO public.cat_notificacion_tipos (codigo, categoria, descripcion) VALUES
  ('programa_vencido_reembolso',    'saldo_pagado',
   'El programa terminó con sesiones sin usar: corresponde reembolso.'),
  ('plan_vencido_reembolso',        'saldo_pagado',
   'El plan terminó con salidas sin usar: corresponde reembolso.'),
  ('plan_renovacion_fallida',       'saldo_pagado',
   'No se pudo cobrar la renovación. Silenciarlo es perder el servicio sin saberlo.'),
  ('plan_renovado',                 'operacion',
   'El plan se renovó y se cobró. Constancia: viaja por el canal de guardar.'),
  ('registro_completado_prestador', 'operacion',
   'Al prestador: su cliente completó el registro.'),
  ('registro_completado_cliente',   'operacion',
   'Al cliente: completó su registro y reclamó sus mascotas.'),
  ('procedimiento_agendado',        'operacion',
   'El procedimiento del presupuesto quedó agendado con fecha.');

DO $$
DECLARE v_n integer; v_mal text;
BEGIN
  -- El mismo cinturón que salvó a los tres de plata: NINGUNO de los nuevos
  -- puede quedar en la categoría que sobrevive al memorial.
  SELECT string_agg(codigo, ', ') INTO v_mal
    FROM public.cat_notificacion_tipos
   WHERE codigo IN ('programa_vencido_reembolso','plan_vencido_reembolso',
                    'plan_renovacion_fallida','plan_renovado',
                    'registro_completado_prestador','registro_completado_cliente',
                    'procedimiento_agendado')
     AND categoria = 'seguridad_cuenta';
  IF v_mal IS NOT NULL THEN
    RAISE EXCEPTION 'tipo_nuevo_sobrevive_al_memorial: %', v_mal;
  END IF;

  -- Todo tipo nuevo nace EN SOMBRA (§10.2). Si alguno naciera vivo, el primer
  -- envío real ocurriría sin gate del founder.
  SELECT count(*) INTO v_n FROM public.cat_notificacion_tipos WHERE NOT en_sombra;
  IF v_n > 0 THEN RAISE EXCEPTION 'hay_%_tipos_fuera_de_sombra', v_n; END IF;

  RAISE NOTICE 'siete tipos OK · catalogo total=% · saldo_pagado=%',
    (SELECT count(*) FROM public.cat_notificacion_tipos),
    (SELECT count(*) FROM public.cat_notificacion_tipos WHERE categoria='saldo_pagado');
END $$;

COMMIT;
