-- S72-A · TANDA 3, piezas 1+2 — LA CITA COORDINADA GANA UN TIPO CONSUMIBLE.
--
-- 76(g): DECLARADA — la veda NO rige (aditiva: un seed de catálogo + un
-- CREATE OR REPLACE que solo AGREGA una asignación al UPDATE; no reescribe
-- el pasado ni toca datos vivos salvo el estampado futuro).
--
-- LA RAÍZ (relevada S72-A0/A): `fijar_fecha_procedimiento` daba fecha/hora/
-- prestador a la cita todo-libre pero DEJABA `tipo_servicio` NULL. Los cuatro
-- lectores de agenda discriminan el oficio por el embed `tipos_servicio`
-- (`!inner` + es_medico/categoria) — una fila SIN tipo se descarta, y el
-- detalle por id la rebota como "no existe" sobre una fila legal (L-157).
-- La cura NO es de lector (rompería el tipo compartido CitaAgendaPaseo, no
-- nullable, de los 4 oficios): es que COORDINAR una fecha le dé a la cita un
-- tipo consumible. Precio congelado y semántica de presupuesto intactos.
--
-- Pieza 1: el código `procedimiento` (es_medico=true → entra a la agenda vet;
--   categoria='veterinario' → NO cuela en paseo/grooming/adiestramiento, que
--   filtran por categoria; reservable=false → jamás en la vitrina, nace de
--   coordinar; exclusiva por default como sus hermanos de presupuesto).
-- Pieza 2: el estampado en fijar_fecha (COALESCE — jamás pisa un tipo que la
--   cita ya tuviera; solo llena el NULL de la todo-libre).

-- ── PIEZA 1 · el código de catálogo ──
INSERT INTO tipos_servicio (
  codigo, nombre, descripcion, categoria, es_medico, reservable, reserva_solo_hoy,
  concurrencia, cupo_techo, duracion_default_minutos, requiere_historia_clinica,
  requiere_validacion_admin, activo, especies_elegibles, country_codes
) VALUES (
  'procedimiento',
  'Procedimiento',
  'Procedimiento clínico coordinado desde un presupuesto (la superficie muestra la descripción del presupuesto, no esta etiqueta).',
  'veterinario',            -- NO cuela en paseo/grooming/adiestramiento
  true,                     -- entra a la agenda vet (es_medico)
  false,                    -- jamás en la vitrina — nace de coordinar
  false,
  'exclusiva', NULL,        -- exclusiva ⇒ cupo_techo NULL (coherente con el CHECK)
  NULL,                     -- la duración la trae el SNAPSHOT de la cita
  true,                     -- es un acto clínico
  false,
  true,
  '["perro","gato","conejo","ave","roedor","reptil","pez","huron","cobaya","otro","equino"]'::jsonb,
  '["EC"]'::jsonb           -- activación por país (espejo de cirugia/ecografia)
)
ON CONFLICT (codigo) DO NOTHING;

-- ── PIEZA 2 · el estampado al coordinar (CREATE OR REPLACE, body literal
--    del catálogo + la sola línea nueva en el UPDATE) ──
CREATE OR REPLACE FUNCTION public.fijar_fecha_procedimiento(p_cita uuid, p_fecha date, p_hora time without time zone, p_empleado uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid           uuid := auth.uid();
  v_cita          record;
  v_pres          record;
  v_cuenta        uuid;
  v_emp_prestador uuid;
  v_capacidad     int;
  v_ocupados      int;
  v_ahora         timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  v_notif_user    uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_empleado IS NULL THEN
    RAISE EXCEPTION 'slot_invalido' USING ERRCODE = '22023';
  END IF;

  -- cita + elegibilidad (fecha NULL + presupuesto aprobado)
  SELECT * INTO v_cita FROM evento_cita_servicio WHERE id = p_cita FOR UPDATE;
  IF v_cita.id IS NULL THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  IF v_cita.presupuesto_id IS NULL THEN
    RAISE EXCEPTION 'cita_no_es_de_presupuesto' USING ERRCODE = '22023';
  END IF;
  IF v_cita.fecha IS NOT NULL THEN
    RAISE EXCEPTION 'cita_ya_fijada' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_pres FROM presupuesto WHERE id = v_cita.presupuesto_id;
  IF v_pres.estado <> 'aprobado' THEN
    RAISE EXCEPTION 'presupuesto_no_aprobado: %', COALESCE(v_pres.estado, 'inexistente')
      USING ERRCODE = '22023';
  END IF;
  v_cuenta := v_pres.cuenta_comercial_id;

  -- persona que fija: habilitada de la cuenta
  IF NOT public._user_opera_cuenta_comercial(v_cuenta, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;

  -- persona asignada (reasignación §2): activa y de la MISMA cuenta
  SELECT pe.prestador_id INTO v_emp_prestador
  FROM prestador_empleados pe
  JOIN prestadores pr ON pr.id = pe.prestador_id
  WHERE pe.id = p_empleado
    AND pe.activo = true
    AND pr.cuenta_comercial_id = v_cuenta;
  IF v_emp_prestador IS NULL THEN
    RAISE EXCEPTION 'empleado_no_es_de_cuenta' USING ERRCODE = '22023';
  END IF;

  -- higiene: la fecha coordinada no vive en el pasado (espejo reagendar_cita_suelta)
  IF (p_fecha + p_hora) <= v_ahora THEN
    RAISE EXCEPTION 'slot_en_pasado' USING ERRCODE = '22023';
  END IF;

  -- serializar por prestador+fecha (mismo patrón del motor de ventana)
  PERFORM pg_advisory_xact_lock(
    hashtextextended('agenda:' || v_emp_prestador::text || ':' || p_fecha::text, 0)
  );

  -- ocupación real del motor de ventana (regla de mezcla V0), duración
  -- SNAPSHOTEADA de la cita respetada; el procedimiento es exclusivo por
  -- default (cupo_techo NULL ⇒ capacidad 1). No se impone la grilla
  -- reservable (fuera_de_horario): la fecha del procedimiento se coordina,
  -- no se reserva contra el horario público.
  v_capacidad := COALESCE(
    (SELECT cupo_techo FROM tipos_servicio WHERE codigo = v_cita.tipo_servicio), 1);
  v_ocupados := public._agenda_ocupacion(
    p_empleado, p_fecha, p_hora, v_cita.duracion_minutos, p_cita, v_cita.tipo_servicio);
  IF v_ocupados >= v_capacidad THEN
    RAISE EXCEPTION 'slot_ocupado' USING ERRCODE = '22023';
  END IF;

  -- fijar fecha/hora/empleado + re-derivar prestador (asignación autoritativa).
  -- PRECIO CONGELADO INTACTO — no se toca `precio`.
  -- S72-A: la todo-libre gana un TIPO CONSUMIBLE al coordinar — sin él, la
  -- cita queda invisible a la agenda vet (los lectores discriminan por el
  -- embed tipos_servicio). COALESCE: jamás pisa un tipo que la cita ya tenga.
  UPDATE evento_cita_servicio
  SET fecha        = p_fecha,
      hora         = p_hora,
      empleado_id  = p_empleado,
      prestador_id = v_emp_prestador,
      tipo_servicio = COALESCE(tipo_servicio, 'procedimiento'),
      metadata     = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                       'fecha_fijada_en', now(),
                       'fijada_por',      v_uid
                     ),
      updated_at   = now()
  WHERE id = p_cita;

  -- si la cita tiene evento de timeline, mover su fecha (no-op si NULL)
  IF v_cita.evento_id IS NOT NULL THEN
    UPDATE eventos_mascota
    SET fecha_evento = (p_fecha + p_hora)
    WHERE id = v_cita.evento_id;
  END IF;

  -- notificación al dueño SIEMPRE (canal existente `notificaciones`). El
  -- caso fantasma sin user en app no tiene destino in-app (declarado): se
  -- notifica cuando hay dueño real.
  v_notif_user := v_cita.user_id;
  IF v_notif_user IS NOT NULL THEN
    INSERT INTO notificaciones (
      user_id, country_code, rol_destino, tipo, canal,
      titulo, mensaje, url_accion, datos
    ) VALUES (
      v_notif_user,
      v_cita.country_code,
      'pet_parent',
      'cita_confirmada',
      'in_app',
      'Tu procedimiento quedó agendado',
      'Coordinamos la fecha de tu procedimiento para el '
        || to_char(p_fecha, 'DD/MM/YYYY') || ' a las '
        || to_char(p_hora, 'HH24:MI') || '.',
      '/citas/' || v_cita.mascota_id::text,
      jsonb_build_object('cita_id', p_cita, 'fecha', p_fecha, 'hora', p_hora)
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', p_cita,
    'fecha', p_fecha,
    'hora', p_hora,
    'empleado_id', p_empleado,
    'prestador_id', v_emp_prestador,
    'dueno_notificado', (v_notif_user IS NOT NULL)
  );
END;
$function$;

-- ── ASSERTS (in-txn, RAISE si algo no cierra; la verificación ES el test) ──
DO $$
DECLARE
  v_es_medico   boolean;
  v_reservable  boolean;
  v_categoria   text;
  v_cuela_paseo boolean;
  v_estampa     boolean;
  v_visible     boolean;
BEGIN
  -- Pieza 1: forma del código.
  SELECT es_medico, reservable, categoria
    INTO v_es_medico, v_reservable, v_categoria
    FROM tipos_servicio WHERE codigo = 'procedimiento';
  IF v_es_medico IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'procedimiento no es es_medico → invisible a la agenda vet';
  END IF;
  IF v_reservable IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'procedimiento reservable → se colaría a la vitrina';
  END IF;
  -- NO cuela en los oficios no-vet (filtran por categoria in paseo/grooming/adiestramiento).
  v_cuela_paseo := v_categoria IN ('paseo', 'grooming', 'adiestramiento');
  IF v_cuela_paseo THEN
    RAISE EXCEPTION 'procedimiento con categoria % colaría en un oficio no-vet', v_categoria;
  END IF;

  -- Pieza 2: la función contiene el estampado (COALESCE hacia procedimiento).
  SELECT pg_get_functiondef(p.oid) LIKE '%tipo_servicio = COALESCE(tipo_servicio, ''procedimiento'')%'
    INTO v_estampa
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'fijar_fecha_procedimiento';
  IF NOT v_estampa THEN
    RAISE EXCEPTION 'fijar_fecha_procedimiento NO estampa el tipo consumible';
  END IF;

  -- TESIS discriminante: una fila con tipo='procedimiento' SÍ matchea el
  -- predicado del lector vet (join es_medico=true); con tipo NULL, NO. Se
  -- prueba con el join real a tipos_servicio, sin insertar cita (el E2E con
  -- JWT es el gate del founder — que ya puede correrlo, relevamiento iii).
  SELECT EXISTS (
    SELECT 1 FROM tipos_servicio ts WHERE ts.codigo = 'procedimiento' AND ts.es_medico = true
  ) INTO v_visible;
  IF NOT v_visible THEN
    RAISE EXCEPTION 'la cita estampada NO sería visible al lector vet';
  END IF;

  RAISE NOTICE 'S72-A T3 1+2 OK: procedimiento (es_medico, no-reservable, veterinario, no-cuela) + estampado en fijar_fecha + visible al lector vet.';
END $$;
