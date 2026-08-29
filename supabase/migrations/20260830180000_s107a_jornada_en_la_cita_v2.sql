/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · LA JORNADA EN LA CITA DE PAQUETE — **v2, y la v1 quedó VACÍA**
   ═══════════════════════════════════════════════════════════════════════════

   ⚠️ **`20260830160000` SE APLICÓ SIN EFECTO Y SE DECLARA.** Su cuerpo lo
   generaba un script que **abortó en un assert** (la línea de declaración tenía
   otro formato del que supuse), así que el archivo quedó con la cabecera,
   `BEGIN`, dos `GRANT` y `COMMIT` — **cero cura**. *Se registró en el ledger
   igual: `db push` dijo `Finished` sobre una migración que no hacía nada.*

   🔴 Es la trampa que esta casa ya tiene medida —*el ledger no es prueba; la
   prueba es preguntarle al objeto*— y la evidencia la dio el arnés: **volvió a
   rebotar con el mismo `23502`**. *La migración vacía no se edita ni se borra:
   se deja, y ésta la corrige.*

   ── EL DEFECTO QUE SÍ SE CURA ACÁ ────────────────────────────────────────
   La cita de paquete se insertaba con `duracion_minutos = NULL`, con este
   argumento escrito: *«una estadía no dura minutos, dura un DÍA»*.
   **El argumento es cierto y la columna es `NOT NULL`.**

   > **Una razón correcta no exime de medir el destino.** Lo que el dato
   > *significa* no dice nada sobre lo que la columna *acepta*, y escribí lo
   > primero como si contestara lo segundo.

   **La cura es la del día suelto:** se guarda la **jornada del servicio**, igual
   que `reservar_dia_guarderia` — *no se inventa un valor: se usa el que la
   hermana ya usaba*, y así las dos citas de guardería quedan idénticas en forma.

   **76(g): NO RIGE.**
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE OR REPLACE FUNCTION public.reservar_dia_de_paquete_guarderia(p_bono_id uuid, p_fecha date, p_mascota_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth uuid := auth.uid(); v_familia uuid; v_b record; v_gate jsonb;
  v_cupo jsonb; v_evt uuid; v_cita uuid; v_est uuid; v_eje text;
  v_vis jsonb; v_country text; v_dir jsonb; v_saldo int; v_masc uuid; v_jornada int;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_familia FROM familia_miembro fm
   WHERE fm.user_id=v_auth AND fm.hasta IS NULL LIMIT 1;
  IF v_familia IS NULL THEN RAISE EXCEPTION 'sin_familia' USING ERRCODE='22023'; END IF;

  /* 🔴 EL LUGAR SALE DEL BONO — la entrada no lo lleva. *Cuando la familia ya
     tiene saldo, el lugar está determinado por el paquete: pedirlo sería
     ofrecerle elegir algo que ya eligió, y abrir la puerta a que elija mal.* */
  SELECT b.* INTO v_b FROM bonos b
   WHERE b.id=p_bono_id AND b.familia_id=v_familia
     AND b.tipo_servicio='guarderia_dia' AND b.estado='activo' AND b.estado_pago='pagado'
   FOR UPDATE;
  IF v_b.id IS NULL THEN RAISE EXCEPTION 'sin_saldo_paquete' USING ERRCODE='22023'; END IF;
  IF v_b.unidades_usadas >= v_b.unidades_total THEN
    RAISE EXCEPTION 'sin_saldo_paquete' USING ERRCODE='22023';
  END IF;
  IF v_b.fecha_vencimiento IS NOT NULL AND v_b.fecha_vencimiento < p_fecha THEN
    RAISE EXCEPTION 'paquete_vencido' USING ERRCODE='22023';
  END IF;

  IF p_fecha < public.hoy_local() THEN RAISE EXCEPTION 'fecha_pasada' USING ERRCODE='22023'; END IF;
  IF p_fecha = public.hoy_local() THEN RAISE EXCEPTION 'reserva_mismo_dia' USING ERRCODE='22023'; END IF;

  /* La mascota: la que el bono tenga, o la única del hogar. Si hay varias y el
     bono no la fija, se rebota — **la casa no elige por la familia.** */
  /* ✏️ La mascota: la que pidan > la que el bono fije > la única elegible.
     **`p_prestador_id` sigue sin existir**: el lugar lo pone el bono. */
  v_masc := COALESCE(p_mascota_id, v_b.mascota_id);
  IF p_mascota_id IS NOT NULL THEN
    IF NOT public.user_tiene_acceso_a_mascota(p_mascota_id) THEN
      RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
    END IF;
    IF NOT public._mascota_elegible_servicio(p_mascota_id, 'guarderia_dia') THEN
      RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE='22023';
    END IF;
  END IF;
  IF v_masc IS NULL THEN
    SELECT m.id INTO v_masc FROM mascotas m
     WHERE m.familia_id = v_familia AND m.estado_vida = 'activa'
       AND public._mascota_elegible_servicio(m.id, 'guarderia_dia')
     LIMIT 2;
    IF (SELECT count(*) FROM mascotas m WHERE m.familia_id=v_familia AND m.estado_vida='activa'
         AND public._mascota_elegible_servicio(m.id,'guarderia_dia')) <> 1 THEN
      RAISE EXCEPTION 'mascota_no_determinada' USING ERRCODE='22023';
    END IF;
  END IF;

  IF NOT public._guarderia_dia_operativo(v_b.prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'dia_no_operativo' USING ERRCODE='22023';
  END IF;

  -- las compuertas corren ENTERAS: tener saldo no saltea los requisitos.
  v_gate := public._guarderia_puede_reservar(v_masc);
  IF COALESCE(v_gate->>'puede','false') <> 'true' THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE = COALESCE(v_gate->>'motivo','requisitos_sanitarios');
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('guarderia:'||v_b.prestador_id::text||':'||p_fecha::text, 0));
  v_cupo := public.cupo_guarderia_del_dia(v_b.prestador_id, p_fecha);
  IF (v_cupo->>'disponible')::int <= 0 THEN RAISE EXCEPTION 'sin_cupo' USING ERRCODE='22023'; END IF;

  SELECT m.country_code INTO v_country FROM mascotas m WHERE m.id=v_masc;
  /* ✏️ LA JORNADA — `duracion_minutos` es NOT NULL en la cita (medido por el
     arnés, con un 23502). Se toma del servicio, igual que `reservar_dia_guarderia`. */
  SELECT ps.duracion_minutos INTO v_jornada
    FROM prestador_servicios ps
   WHERE ps.prestador_id = v_b.prestador_id AND ps.tipo_servicio = 'guarderia_dia' AND ps.activo;
  SELECT cte.eje_jtbd, cte.visibilidad_default INTO v_eje, v_vis
    FROM cat_tipos_evento cte WHERE cte.codigo='cita_servicio';
  v_dir := public._direccion_hogar_snapshot(v_auth);   -- D-963

  INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, prestador_id,
                               creado_por_user_id, datos, visibilidad, country_code)
  VALUES (v_masc, 'cita_servicio', v_eje, p_fecha::timestamptz, v_b.prestador_id, v_auth,
          jsonb_build_object('origen','reservar_dia_de_paquete_guarderia','bono_id',v_b.id),
          v_vis, COALESCE(v_country,'EC'))
  RETURNING id INTO v_evt;

  /* Cita FIRME y CUBIERTA — cuarto escritor del invariante 'pagada'.
     🔴 CERO COBRO: el desglose se congeló al comprar el paquete. */
  INSERT INTO evento_cita_servicio (
    evento_id, user_id, mascota_id, prestador_id, tipo_servicio, fecha, precio,
    duracion_minutos, estado, estado_reserva, country_code, bono_id,
    direccion_snapshot, metadata)
  VALUES (v_evt, v_auth, v_masc, v_b.prestador_id, 'guarderia_dia', p_fecha,
          v_b.precio_por_unidad, v_jornada, 'confirmada', 'pagada',
          COALESCE(v_country,'EC'), v_b.id, v_dir,
          jsonb_build_object('origen','paquete','pago_simulado',true,
                             'pagado_en', v_b.pago_metadata->>'pagado_en'))
  RETURNING id INTO v_cita;

  INSERT INTO guarderia_estadias (cita_id, estado) VALUES (v_cita,'reservada') RETURNING id INTO v_est;

  UPDATE bonos SET unidades_usadas = unidades_usadas + 1,
    estado = CASE WHEN unidades_usadas + 1 >= unidades_total THEN 'agotado' ELSE estado END,
    agotado_en = CASE WHEN unidades_usadas + 1 >= unidades_total THEN now() ELSE agotado_en END
   WHERE id = v_b.id;

  SELECT COALESCE(sum(b.unidades_total-b.unidades_usadas),0)::int INTO v_saldo
    FROM bonos b WHERE b.familia_id=v_familia AND b.prestador_id=v_b.prestador_id
     AND b.tipo_servicio='guarderia_dia' AND b.estado='activo' AND b.estado_pago='pagado'
     AND b.fecha_vencimiento >= public.hoy_local();

  RETURN jsonb_build_object('ok',true,'cita_id',v_cita,'estadia_id',v_est,
    'bono_id',v_b.id,'fecha',p_fecha,'saldo_restante',v_saldo);
END $function$;

REVOKE EXECUTE ON FUNCTION public.reservar_dia_de_paquete_guarderia(uuid,date,uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.reservar_dia_de_paquete_guarderia(uuid,date,uuid) TO authenticated;

DO $c$
DECLARE v_ok boolean;
BEGIN
  /* Se le pregunta AL OBJETO si la cura entró — no al ledger (la v1 dijo
     `Finished` sobre nada). */
  SELECT prosrc LIKE '%v_jornada, ''confirmada''%' INTO v_ok FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='reservar_dia_de_paquete_guarderia';
  IF NOT COALESCE(v_ok,false) THEN
    RAISE EXCEPTION 'CINTURON: la cura NO entro';
  END IF;
  RAISE NOTICE 'CINTURON VERDE · la cita de paquete lleva la jornada (preguntado al OBJETO)';
END $c$;

COMMIT;
