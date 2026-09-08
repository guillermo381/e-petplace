-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · A6 (1/2) · F10 · DEVENGO DE VETERINARIA Y TELEMEDICINA
--
-- MEDIDO: 15 citas completadas y pagadas SIN evento económico. 14 son médicas
-- —telemedicina (10), consulta_general (3), consulta_especializada (1)— y 1
-- tiene tipo_servicio NULL (dato viejo). Paseo, grooming y adiestramiento YA
-- devengan en su cierre; las médicas no, porque su cierre
-- (`completar_cita_servicio` presencial · `cerrar_teleconsulta`) nunca creó el
-- evento.
--
-- 🔴 EL RESULTADO, y es el que §6 de LETRA_POSTVENTA necesita cerrado: sin
--    evento, «¿este objeto tiene devengo?» contesta NO para toda cita médica,
--    y una devolución se declararía sobre el pago mientras el prestador
--    conserva el cobro. Plata en silencio.
--
-- EL CHASIS ES EL DE GROOMING, EXTRAÍDO A UN HELPER en vez de copiado tres
-- veces: `_devengar_cita(p_cita_id, p_via)`, idempotente (variante (b):
-- devenga al cierre, sólo citas `pagada`, legacy NULL pasa de largo). Las dos
-- funciones médicas lo llaman antes de su RETURN. **No toco paseo/grooming/
-- adiestramiento**: su bloque inline funciona y el helper es idempotente, así
-- que aunque coincidieran no duplican — pero no reescribo código probado sin
-- necesidad (decisión declarada; unificar los tres inline con el helper es una
-- limpieza posterior, no de esta tanda).
--
-- 🔴 EL NÚMERO DE E BAJA POR CONSTRUCCIÓN, NO POR FILTRO: hoy hay N citas
--    médicas cerradas sin evento; después de esto, cerrar una crea el evento,
--    y el rojo «pagado y cerrado sin evento» deja de poder existir para citas
--    nuevas. Las 14 viejas ya cerradas NO se backfillean acá (cerraron antes
--    de que el productor existiera; backfillear devengo histórico es decisión
--    de la mesa, no de una migración — mueve plata real hacia liquidaciones).
--
-- VEDA 76(g): NO RIGE — funciones; cero backfill.
-- REVERSA: escrita ANTES (y declara que repone un hueco de plata).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._devengar_cita(p_cita_id uuid, p_via text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_cita record; v_cuenta record; v_evento uuid;
BEGIN
  SELECT c.id, c.precio, c.estado_reserva, c.prestador_id, c.country_code, c.metadata
    INTO v_cita FROM evento_cita_servicio c WHERE c.id = p_cita_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- variante (b): sólo lo pagado por confirmar_cita_pagada devenga. Legacy
  -- (estado_reserva NULL / distinto de 'pagada') pasa de largo — igual que grooming.
  IF v_cita.estado_reserva IS DISTINCT FROM 'pagada' THEN RETURN NULL; END IF;

  -- idempotente: si ya hay evento para esta cita, no se crea otro.
  IF EXISTS (SELECT 1 FROM eventos_economicos ee
             WHERE ee.origen_tipo='cita' AND ee.origen_id=p_cita_id
               AND ee.tipo_evento='cita_pagada') THEN
    RETURN NULL;
  END IF;

  IF v_cita.precio IS NULL OR v_cita.precio < 0 THEN
    RAISE EXCEPTION 'cita_sin_precio' USING ERRCODE='22023';
  END IF;

  SELECT cc.id, cc.moneda INTO v_cuenta
    FROM prestadores pr JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
   WHERE pr.id = v_cita.prestador_id;
  IF v_cuenta.id IS NULL THEN
    RAISE EXCEPTION 'prestador_sin_cuenta_comercial' USING ERRCODE='22023';
  END IF;

  v_evento := crear_evento_economico(
    p_tipo_evento         => 'cita_pagada'::tipo_evento_economico_enum,
    p_revenue_stream      => 'transaccional'::revenue_stream_enum,
    p_cuenta_comercial_id => v_cuenta.id,
    p_country_code        => v_cita.country_code,
    p_moneda              => v_cuenta.moneda,
    p_monto_bruto         => v_cita.precio,
    p_monto_kushki_fee    => 0,
    p_origen_tipo         => 'cita',
    p_origen_id           => p_cita_id,
    p_fecha_devengo       => now(),
    p_fecha_cobro_kushki  => (v_cita.metadata ->> 'pagado_en')::timestamptz,
    p_metadata            => jsonb_build_object('pago_simulado', true, 'via', p_via));
  RETURN v_evento;
END $fn$;

COMMENT ON FUNCTION public._devengar_cita(uuid, text) IS
  'S114 · A6 · el chasis de devengo de cita (variante b), extraído de grooming. '
  'Idempotente, sólo citas pagadas. Lo llaman completar_cita_servicio (vet) y '
  'cerrar_teleconsulta (telemedicina). Paseo/grooming/adiestramiento conservan '
  'su bloque inline probado.';

REVOKE ALL ON FUNCTION public._devengar_cita(uuid, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._devengar_cita(uuid, text) TO authenticated;

-- ── completar_cita_servicio, con la llamada al helper antes del RETURN ──
CREATE OR REPLACE FUNCTION public.completar_cita_servicio(p_cita_id uuid, p_notas text, p_empleado_id_actual uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid       uuid := auth.uid();
  v_estado         text;
  v_prestador_id   uuid;
  v_user_id        uuid;
  v_fecha          date;
  v_hora           time;
  v_tipo_servicio  text;
  v_country_code   text;
  v_empleado_id    uuid;
  v_notas_trim     text;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  IF p_cita_id IS NULL THEN
    RAISE EXCEPTION 'cita_id_required' USING ERRCODE = '22023';
  END IF;

  IF p_notas IS NULL THEN
    RAISE EXCEPTION 'notas_required' USING ERRCODE = '22023';
  END IF;

  v_notas_trim := btrim(p_notas);

  IF length(v_notas_trim) < 10 THEN
    RAISE EXCEPTION 'notas_minimo_10_chars' USING ERRCODE = '22023';
  END IF;

  SELECT estado, prestador_id, user_id, fecha, hora, tipo_servicio, country_code, empleado_id
  INTO   v_estado, v_prestador_id, v_user_id, v_fecha, v_hora, v_tipo_servicio, v_country_code, v_empleado_id
  FROM   evento_cita_servicio
  WHERE  id = p_cita_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;

  IF v_prestador_id IS NULL THEN
    RAISE EXCEPTION 'cita_sin_prestador' USING ERRCODE = '22023';
  END IF;

  IF NOT user_puede_acceder_prestador(v_prestador_id) THEN
    RAISE EXCEPTION 'no_access_to_prestador' USING ERRCODE = '42501';
  END IF;

  IF v_estado IS DISTINCT FROM 'en_curso' THEN
    RAISE EXCEPTION 'cita_estado_invalido_para_completar: %', v_estado
      USING ERRCODE = '22023';
  END IF;

  UPDATE evento_cita_servicio
  SET    estado          = 'completada',
         notas_prestador = v_notas_trim,
         updated_at      = now(),
         empleado_id     = CASE
           WHEN v_empleado_id IS NULL AND p_empleado_id_actual IS NOT NULL
             THEN p_empleado_id_actual
           ELSE empleado_id
         END
  WHERE  id = p_cita_id
    AND  estado = 'en_curso';

  PERFORM _devengar_cita(p_cita_id, 'completar_cita_servicio');

  RETURN jsonb_build_object(
    'ok',            true,
    'cita_id',       p_cita_id,
    'estado',        'completada',
    'user_id',       v_user_id,
    'fecha',         v_fecha,
    'hora',          v_hora,
    'tipo_servicio', v_tipo_servicio,
    'country_code',  v_country_code
  );
END;
$function$
;

-- ── cerrar_teleconsulta, ídem ──
CREATE OR REPLACE FUNCTION public.cerrar_teleconsulta(p_cita_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_c      record;
  v_uid    uuid := auth.uid();
  v_familia boolean;
  v_negocio boolean;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'codigo', 'sin_sesion'); END IF;

  SELECT c.id, c.user_id, c.mascota_id, c.prestador_id, c.estado, c.modalidad
    INTO v_c
  FROM evento_cita_servicio c WHERE c.id = p_cita_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'codigo', 'cita_no_existe'); END IF;

  IF v_c.modalidad IS DISTINCT FROM 'telemedicina' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'cita_no_es_teleconsulta');
  END IF;

  /* LOS DOS ACTORES. Se reusan los helpers de la casa: *un permiso
     re-implementado diverge del original el día que uno de los dos se
     corrija.* */
  v_familia := COALESCE(public.user_tiene_acceso_a_mascota(v_c.mascota_id), false)
               OR v_c.user_id = v_uid;
  v_negocio := COALESCE(public.es_mi_prestador(v_c.prestador_id), false);

  IF NOT (v_familia OR v_negocio OR COALESCE(public.is_admin(), false)) THEN
    /* Mismo código que «no existe», por la misma razón que en
       `obtener_cita_resuelta`: *distinguir le confirmaría a un tercero que esa
       cita existe.* */
    RETURN jsonb_build_object('ok', false, 'codigo', 'cita_no_existe');
  END IF;

  /* ── IDEMPOTENTE: el segundo en apretar no ve un error ──────────────────── */
  IF v_c.estado = 'completada' THEN
    RETURN jsonb_build_object('ok', true, 'ya_estaba', true, 'estado', 'completada');
  END IF;

  /* 🔴 LO QUE YA TIENE DUEÑO NO SE PISA. Una cita cancelada o marcada no
     realizable **tiene una decisión de plata detrás**; cerrarla como
     «completada» la borraría. */
  IF v_c.estado NOT IN ('confirmada', 'en_curso') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'cita_estado_invalido', 'estado', v_c.estado);
  END IF;

  UPDATE evento_cita_servicio
  SET estado = 'completada',
      metadata = COALESCE(metadata, '{}'::jsonb)
               || jsonb_build_object(
                    'cerrada_por', CASE WHEN v_negocio THEN 'prestador' ELSE 'familia' END,
                    'cerrada_por_user_id', v_uid,
                    'cerrada_en', now()),
      updated_at = now()
  WHERE id = p_cita_id AND estado IN ('confirmada', 'en_curso');

  /* ⚠️ EL BORRADOR **NO SE TOCA**, y es la firma del founder hecha código:
     *lo que se cierra es la sala, jamás el trabajo.* El vet sedimenta después
     y su trigger limpiará el borrador entonces. */

  PERFORM _devengar_cita(p_cita_id, 'cerrar_teleconsulta');

  RETURN jsonb_build_object('ok', true, 'ya_estaba', false, 'estado', 'completada');
END;
$function$
;

-- ── CINTURÓN · rojo→verde con una cita médica REAL, ROLLBACK adentro ───────
DO $cinturon$
DECLARE v_cit uuid; v_pre numeric; v_antes int; v_despues int; v_ev uuid;
BEGIN
  -- una cita médica pagada, sin evento, con precio y prestador con cuenta.
  SELECT c.id, c.precio INTO v_cit, v_pre
    FROM evento_cita_servicio c
    JOIN tipos_servicio ts ON ts.codigo = c.tipo_servicio AND ts.es_medico
    JOIN prestadores pr ON pr.id = c.prestador_id
    JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id
   WHERE c.estado_reserva='pagada' AND c.precio > 0
     AND NOT EXISTS (SELECT 1 FROM eventos_economicos e WHERE e.origen_tipo='cita' AND e.origen_id=c.id)
   LIMIT 1;
  IF v_cit IS NULL THEN
    RAISE NOTICE '⚠️ CINTURÓN NO CONCLUYENTE · no hay cita médica pagada sin evento para probar '
                 '(puede ser que ya todas devengaron). El helper igual quedó instalado.';
    RETURN;
  END IF;

  SELECT count(*) INTO v_antes FROM eventos_economicos WHERE origen_tipo='cita' AND origen_id=v_cit;

  -- ROJO ya probado por el SELECT de arriba (existe una cita sin evento).
  -- VERDE: el helper la devenga.
  v_ev := _devengar_cita(v_cit, 'cinturon-a6');
  SELECT count(*) INTO v_despues FROM eventos_economicos WHERE origen_tipo='cita' AND origen_id=v_cit;
  IF v_despues <> v_antes + 1 THEN
    RAISE EXCEPTION 'CINTURÓN: el helper no creó el evento (antes=% despues=%)', v_antes, v_despues;
  END IF;

  -- IDEMPOTENTE: segunda llamada no duplica
  PERFORM _devengar_cita(v_cit, 'cinturon-a6');
  SELECT count(*) INTO v_despues FROM eventos_economicos WHERE origen_tipo='cita' AND origen_id=v_cit;
  IF v_despues <> v_antes + 1 THEN
    RAISE EXCEPTION 'CINTURÓN: la segunda llamada duplicó el evento';
  END IF;

  -- monto correcto
  IF (SELECT monto_bruto FROM eventos_economicos WHERE id=v_ev) <> v_pre THEN
    RAISE EXCEPTION 'CINTURÓN: el monto del evento no es el precio de la cita';
  END IF;

  -- deshacer la sonda: borrar el evento que creó
  DELETE FROM eventos_economicos WHERE id=v_ev;
  RAISE NOTICE 'CINTURÓN VERDE · el helper devenga una cita médica · idempotente · monto=precio · residuo 0';
END $cinturon$;
