-- ═════════════════════════════════════════════════════════════════════
-- SEED DEMO S54 — B2(b)+(c): oferta + horarios + activación financiera
-- del prestador demo [DEMO S44] Paseos Andres.
-- PROPUESTA — NO EJECUTAR sin gate founder EXPLÍCITO (toca datos).
-- IDEMPOTENTE. UUIDs fijos con prefijo de300000-. Todo marcado [DEMO].
-- Complementa seed_demo_s44.sql (que desde S54 lleva guard anti-pisada).
--
-- Por qué existe cada bloque (relevamiento B0/T9 de esta sesión):
--  (1) el prestador demo NO tenía fila en prestador_servicios → sin
--      oferta derivable (obtenerOfertaPaseo daría vacío);
--  (2) NO tenía filas en prestador_horarios → sin slots que derivar;
--  (3) cuenta_roles estaba VACÍA y la cuenta demo pendiente_validacion
--      con datos_bancarios {} → crear_evento_economico y
--      generar_liquidacion rebotarían (dos gates en rojo, T6).
-- ═════════════════════════════════════════════════════════════════════
do $seed$
declare
  v_prest uuid := 'de300000-0000-4000-8000-0000000000e5';
  v_cc    uuid := 'de300000-0000-4000-8000-0000000000cc';
  v_ps    uuid := 'de300000-0000-4000-8000-00000000a5e0';  -- oferta paseo demo
  v_dia   int;
begin
  if not exists (select 1 from prestadores where id = v_prest) then
    raise exception 'seed_demo_s54: el prestador demo % no existe — correr seed_demo_s44 primero', v_prest;
  end if;

  -- ── (1) Oferta real de paseo (la card de Explorar deriva de acá) ────
  -- tipo_servicio 'paseo' = código relevado del catálogo maestro
  -- (tipos_servicio.codigo, categoria 'paseo', 30 min default).
  insert into prestador_servicios (
    id, prestador_id, tipo_servicio, nombre_custom, descripcion,
    duracion_minutos, precio, activo, especies_compatibles
  ) values (
    v_ps, v_prest, 'paseo', '[DEMO S44] Paseo 30 min',
    '[DEMO] Paseo individual de 30 minutos por el barrio.',
    30, 10.00, true, '["perro"]'::jsonb
  )
  on conflict (id) do update set
    activo = true,
    precio = excluded.precio,
    duracion_minutos = excluded.duracion_minutos;

  -- ── (2) Horarios lun–sáb (dia_semana 1..6; 0=Domingo queda libre —
  --        regla 32), dos franjas: 08:00–12:00 y 14:00–18:00,
  --        slots de 30 min, 1 cupo por slot. servicio_id NULL = la
  --        franja aplica a toda la oferta del prestador.
  for v_dia in 1..6 loop
    insert into prestador_horarios (
      id, prestador_id, servicio_id, dia_semana,
      hora_inicio, hora_fin, duracion_slot_minutos, max_citas_por_slot, activo
    ) values (
      ('de300000-0000-4000-8000-00000000d1' || lpad(to_hex(v_dia), 2, '0'))::uuid,
      v_prest, null, v_dia, '08:00', '12:00', 30, 1, true
    )
    on conflict (id) do update set activo = true;

    insert into prestador_horarios (
      id, prestador_id, servicio_id, dia_semana,
      hora_inicio, hora_fin, duracion_slot_minutos, max_citas_por_slot, activo
    ) values (
      ('de300000-0000-4000-8000-00000000d2' || lpad(to_hex(v_dia), 2, '0'))::uuid,
      v_prest, null, v_dia, '14:00', '18:00', 30, 1, true
    )
    on conflict (id) do update set activo = true;
  end loop;

  -- ── (3a) Rol financiero: sin fila activa en cuenta_roles,
  --         crear_evento_economico rebota (validación §4.3, probada T6).
  insert into cuenta_roles (id, cuenta_comercial_id, tipo_actor, estado, activado_en, metadata)
  values (
    'de300000-0000-4000-8000-00000000ce01', v_cc,
    'prestador_servicios', 'activo', now(),
    '{"demo": true, "origen": "seed_demo_s54"}'::jsonb
  )
  on conflict (cuenta_comercial_id, tipo_actor) do update set
    estado = 'activo',
    suspendido_en = null,
    suspension_motivo = null;

  -- ── (3b) Activación de la cuenta demo: estado + activado_en en el
  --         MISMO update (§7.11 — chk_estado_consistente). Las 7 claves
  --         de datos_bancarios marcadas DEMO van en un UPDATE APARTE y
  --         SIN gate de estado: re-marca en cada corrida (regla de
  --         sesión S54: cero datos sin marca DEMO — la Sesión B pisó
  --         los bancarios con datos verosímiles al ejercitar su wizard
  --         el 11-Jul 04:34 UTC y el seed debe poder restaurarlos).
  -- Primero la re-marca (legal en pendiente_validacion — §8.13 permite
  -- bancarios completos pre-activación), después la activación.
  update cuentas_comerciales
  set datos_bancarios = jsonb_build_object(
        'banco_codigo',           'PICHINCHA',
        'banco_nombre',           'Banco Pichincha',
        'tipo_cuenta',            'ahorros',
        'numero_cuenta',          'DEMO-0000000000',
        'titular_nombre',         '[DEMO S44] Paseos Andres',
        'titular_tipo_documento', 'CEDULA',
        'titular_documento',      'DEMO-S44-001'
      )
  where id = v_cc;

  update cuentas_comerciales
  set estado = 'activa',
      activado_en = now()
  where id = v_cc
    and estado <> 'activa';

  raise notice 'seed demo S54 OK: oferta %, 12 franjas de horario, rol prestador_servicios activo, cuenta % activa', v_ps, v_cc;
end
$seed$;
