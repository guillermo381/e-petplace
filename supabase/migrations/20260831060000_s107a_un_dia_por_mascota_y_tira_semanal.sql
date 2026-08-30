/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · UN DÍA POR MASCOTA, Y LA TIRA QUE DICE LA VERDAD ANTES DE TOCARLA
   ═══════════════════════════════════════════════════════════════════════════
   DOS pedidos de C. El primero es de PLATA.

   ① 🔴 **EL MISMO ANIMAL PODÍA RESERVARSE DOS VECES EL MISMO DÍA.**
      Rojo reproducido antes de curar, con números:
        `1ra reserva → saldo 9 | 2da IDÉNTICA → ok, saldo 8 | citas: 2`
      **Y el censo lo agrandó, igual que con la compuerta:** el DÍA SUELTO
      también pasaba sobre un día ya tomado por paquete — *y ése cobra aparte,
      así que la familia pagaba dos veces por un día que su perro sólo puede
      vivir una vez.* **Son DOS puertas, no una.**

      🔴 Por **(mascota, fecha)**, JAMÁS por (bono, fecha): el bono es del
      hogar y dos perros el mismo día es legítimo. Y **sin prestador en la
      llave**: un animal no puede estar en dos guarderías a la vez.

      **Se cura en DOS capas, y las dos hacen falta:** un **índice único
      parcial** —que vuelve el estado malo *inexpresable* y ninguna puerta
      futura puede saltear— **y un guard tipado en cada puerta** para que el
      rebote HABLE: *un guard que vive en un índice sólo puede negarse*
      (`L-424`), con un `23505` pelado que la familia lee como «probá de
      nuevo» sobre algo que va a fallar siempre.

   ② **LA TIRA OFRECÍA 14 DÍAS Y 4 ERAN CALLEJÓN.** En un lugar L-V los fines
      de semana se ven igual que los días que sirven, y **hay que tocar para
      enterarse** — el founder tocó un finde y encontró un botón apagado.
      Nace `obtener_dias_guarderia`: **UNA llamada trae el rango entero** con
      el estado de cada día. Reemplaza 14 llamadas a `cupo_guarderia_del_dia`.

      ⚠️ Y lleva `p_mascota_id` OPCIONAL: si viene, cada día dice también si
      **esa mascota ya lo tiene tomado**. *Cierra el círculo con ①: la familia
      ve el día ocupado en vez de tocarlo y recibir un rebote.*

   ☠️ DUPLICADOS VIVOS AL APLICAR: **CERO** (medido antes de crear el índice —
      un índice único que aborta a mitad de una migración es una migración que
      deja la mitad puesta).

   ⚖️ VEDA 76(g): **NO RIGE** — DDL sin backfill.
   ↩️ REVERSA escrita ANTES:
      `docs/relevamientos/S107-A-REVERSA-20260831060000-un-dia-por-mascota.sql`
      (declara que revertir REABRE el cobro doble).
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── ① EL PISO: el estado malo, inexpresable ─────────────────────────────── */
CREATE UNIQUE INDEX IF NOT EXISTS uq_guarderia_una_por_mascota_dia
  ON public.evento_cita_servicio (mascota_id, fecha)
  WHERE tipo_servicio = 'guarderia_dia'
    AND mascota_id IS NOT NULL AND fecha IS NOT NULL
    AND estado NOT IN ('cancelada','rechazada','no_realizable');

COMMENT ON INDEX public.uq_guarderia_una_por_mascota_dia IS
  'Un animal no puede estar en dos guarderias el mismo dia. Sin prestador en la '
  'llave a proposito. Cancelada/rechazada/no_realizable liberan el dia; no_show y '
  'completada NO (el dia se consumio). El rebote hablado vive en los dos '
  'reservadores — el indice solo sabe negarse (L-424).';

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

  /* ═══ EL MISMO ANIMAL, EL MISMO DIA, UNA SOLA VEZ ════════════════════════
     🔴 Medido antes de curar: llamar dos veces con (bono, fecha, mascota)
     identicos devolvia `ok:true` LAS DOS, consumia DOS estadias del paquete y
     dejaba **dos reservas del mismo perro el mismo dia**. La pantalla cubre el
     doble-toque; **no cubre volver atras y tocar el mismo dia otra vez** — que
     es justo lo que hace quien no esta seguro de si entro.

     ⚠️ Y el censo lo agrando: el DIA SUELTO tambien pasaba sobre un dia ya
     tomado por paquete — y ese cobra aparte ⇒ *la familia pagaba dos veces por
     un dia que su perro solo puede vivir una vez.*

     🔴 POR (MASCOTA, FECHA), **JAMAS por (bono, fecha)**: el bono es DEL HOGAR
     y dos perros distintos el mismo dia es legitimo. Y sin prestador en la
     llave a proposito: un animal no puede estar en dos guarderias a la vez.

     El piso real es el indice unico parcial `uq_guarderia_una_por_mascota_dia`
     — este guard existe para que el rebote HABLE, porque *un guard que vive en
     un indice solo puede negarse* (L-424). Los dos juntos: el indice no se
     puede saltear, el guard explica. */
  IF EXISTS (
    SELECT 1 FROM evento_cita_servicio c
     WHERE c.mascota_id = v_masc AND c.fecha = p_fecha
       AND c.tipo_servicio = 'guarderia_dia'
       AND c.estado NOT IN ('cancelada','rechazada','no_realizable')
  ) THEN
    RAISE EXCEPTION 'mascota_ya_reservada_ese_dia' USING ERRCODE='22023';
  END IF;

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
END $function$
;

CREATE OR REPLACE FUNCTION public.reservar_dia_guarderia(p_prestador_id uuid, p_mascota_id uuid, p_fecha date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ps record; v_gate jsonb; v_cupo jsonb;
  v_cita uuid; v_estadia uuid; v_espacio uuid;
  v_user uuid := auth.uid(); v_direccion jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'guarderia_dia') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  IF p_fecha < public.hoy_local() THEN RAISE EXCEPTION 'fecha_pasada' USING ERRCODE = '22023'; END IF;
  IF p_fecha = public.hoy_local() THEN RAISE EXCEPTION 'reserva_mismo_dia' USING ERRCODE = '22023'; END IF;
  IF NOT public._guarderia_dia_operativo(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'dia_no_operativo' USING ERRCODE = '22023';
  END IF;


  /* ═══ EL MISMO ANIMAL, EL MISMO DIA, UNA SOLA VEZ ════════════════════════
     🔴 Medido antes de curar: llamar dos veces con (bono, fecha, mascota)
     identicos devolvia `ok:true` LAS DOS, consumia DOS estadias del paquete y
     dejaba **dos reservas del mismo perro el mismo dia**. La pantalla cubre el
     doble-toque; **no cubre volver atras y tocar el mismo dia otra vez** — que
     es justo lo que hace quien no esta seguro de si entro.

     ⚠️ Y el censo lo agrando: el DIA SUELTO tambien pasaba sobre un dia ya
     tomado por paquete — y ese cobra aparte ⇒ *la familia pagaba dos veces por
     un dia que su perro solo puede vivir una vez.*

     🔴 POR (MASCOTA, FECHA), **JAMAS por (bono, fecha)**: el bono es DEL HOGAR
     y dos perros distintos el mismo dia es legitimo. Y sin prestador en la
     llave a proposito: un animal no puede estar en dos guarderias a la vez.

     El piso real es el indice unico parcial `uq_guarderia_una_por_mascota_dia`
     — este guard existe para que el rebote HABLE, porque *un guard que vive en
     un indice solo puede negarse* (L-424). Los dos juntos: el indice no se
     puede saltear, el guard explica. */
  IF EXISTS (
    SELECT 1 FROM evento_cita_servicio c
     WHERE c.mascota_id = p_mascota_id AND c.fecha = p_fecha
       AND c.tipo_servicio = 'guarderia_dia'
       AND c.estado NOT IN ('cancelada','rechazada','no_realizable')
  ) THEN
    RAISE EXCEPTION 'mascota_ya_reservada_ese_dia' USING ERRCODE='22023';
  END IF;

  v_gate := public._guarderia_puede_reservar(p_mascota_id);
  IF (v_gate->>'puede')::boolean IS NOT TRUE THEN
    /* El motivo YA viene normalizado por el gate — esta puerta lo levanta tal
       cual. *La traduccion que vivia aca era correcta y la de la puerta del
       paquete no: por eso la traduccion se mudo a la fuente.* */
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = v_gate->>'motivo';
  END IF;

  SELECT ps.id, ps.precio, ps.duracion_minutos, pr.country_code INTO v_ps
    FROM prestador_servicios ps JOIN prestadores pr ON pr.id = ps.prestador_id
   WHERE ps.prestador_id = p_prestador_id AND ps.tipo_servicio = 'guarderia_dia'
     AND ps.activo AND ps.reservable;
  IF v_ps.id IS NULL THEN RAISE EXCEPTION 'guarderia_no_disponible' USING ERRCODE = '22023'; END IF;
  IF v_ps.precio IS NULL THEN
    -- el día suelto puede no ofrecerse (firma 29-ago): entonces no se reserva por día
    RAISE EXCEPTION 'no_ofrece_dia_suelto' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_prestador_id::text || p_fecha::text));
  v_cupo := public.cupo_guarderia_del_dia(p_prestador_id, p_fecha);
  IF (v_cupo->>'disponible')::int <= 0 THEN RAISE EXCEPTION 'sin_cupo' USING ERRCODE = '22023'; END IF;

  SELECT e.id INTO v_espacio FROM guarderia_espacios e
   WHERE e.prestador_id = p_prestador_id AND e.activo ORDER BY e.created_at LIMIT 1;
  v_direccion := _direccion_hogar_snapshot(v_user);

  INSERT INTO evento_cita_servicio (
    user_id, mascota_id, prestador_id, tipo_servicio, fecha, precio,
    duracion_minutos, estado, estado_reserva, expira_en, modalidad,
    direccion_snapshot, country_code
  ) VALUES (
    v_user, p_mascota_id, p_prestador_id, 'guarderia_dia', p_fecha, v_ps.precio,
    v_ps.duracion_minutos, 'pendiente', 'pendiente_pago',
    now() + interval '15 minutes', 'presencial', v_direccion,
    COALESCE(v_ps.country_code, 'EC')
  ) RETURNING id INTO v_cita;

  INSERT INTO guarderia_estadias (cita_id, espacio_id)
    VALUES (v_cita, v_espacio) RETURNING id INTO v_estadia;

  RETURN jsonb_build_object('ok', true, 'cita_id', v_cita, 'estadia_id', v_estadia,
                            'precio', v_ps.precio, 'expira_en', now() + interval '15 minutes');
END $function$
;

/* ═══════════════════════════════════════════════════════════════════════════
   ② EL LECTOR DE LA TIRA — una llamada por rango, no una por día
   ═══════════════════════════════════════════════════════════════════════════
   🔴 **`motivo` es del SERVIDOR, no de la pantalla.** La pantalla lo PINTA;
   no lo deduce de `capacidad = 0`, porque *«no abre ese día» y «se llenó» son
   dos verdades distintas* y la familia hace cosas distintas con cada una
   (una espera, la otra elige otro día). Es el mismo criterio que ya rige en
   `obtener_estado_guarderia`.
   ═══════════════════════════════════════════════════════════════════════════ */
CREATE OR REPLACE FUNCTION public.obtener_dias_guarderia(
  p_prestador_id uuid,
  p_desde        date,
  p_hasta        date,
  p_mascota_id   uuid DEFAULT NULL
) RETURNS TABLE (
  fecha        date,
  opera        boolean,
  capacidad    int,
  disponible   int,
  ya_reservado boolean,
  reservable   boolean,
  motivo       text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_hoy date := public.hoy_local();
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF p_hasta < p_desde THEN RAISE EXCEPTION 'rango_invalido' USING ERRCODE='22023'; END IF;
  /* Techo duro: la tira pide 14 días. 60 deja lugar sin volverla un barrido. */
  IF p_hasta - p_desde > 60 THEN RAISE EXCEPTION 'rango_demasiado_largo' USING ERRCODE='22023'; END IF;

  /* La mascota, si viene, tiene que ser de quien pregunta — el lector NO es
     una puerta para mirar la agenda de un animal ajeno. */
  IF p_mascota_id IS NOT NULL AND NOT public.user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  WITH dias AS (
    SELECT d::date AS f FROM generate_series(p_desde, p_hasta, interval '1 day') d
  ), medido AS (
    SELECT
      dias.f,
      public._guarderia_dia_operativo(p_prestador_id, dias.f) AS op,
      (public.cupo_guarderia_del_dia(p_prestador_id, dias.f)->>'capacidad')::int  AS cap,
      (public.cupo_guarderia_del_dia(p_prestador_id, dias.f)->>'disponible')::int AS disp,
      (p_mascota_id IS NOT NULL AND EXISTS (
         SELECT 1 FROM evento_cita_servicio c
          WHERE c.mascota_id = p_mascota_id AND c.fecha = dias.f
            AND c.tipo_servicio = 'guarderia_dia'
            AND c.estado NOT IN ('cancelada','rechazada','no_realizable'))) AS ya
    FROM dias
  )
  SELECT
    m.f, m.op, m.cap, m.disp, m.ya,
    (m.op AND m.disp > 0 AND NOT m.ya AND m.f > v_hoy) AS reservable,
    /* El orden de las causas NO es arbitrario: se dice la PRIMERA que frena,
       de la más estructural a la más circunstancial. */
    CASE
      WHEN m.f <= v_hoy       THEN 'fecha_pasada'
      WHEN NOT m.op           THEN 'no_opera_ese_dia'
      WHEN m.ya               THEN 'mascota_ya_reservada_ese_dia'
      WHEN m.disp <= 0        THEN 'sin_cupo'
      ELSE NULL
    END
  FROM medido m
  ORDER BY m.f;
END $function$;

REVOKE EXECUTE ON FUNCTION public.obtener_dias_guarderia(uuid, date, date, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_dias_guarderia(uuid, date, date, uuid) TO authenticated;

/* ═══════════════════════════════════════════════════════════════════════════
   CINTURÓN CON DISCRIMINADOR — y el discriminador que importa es EL SEGUNDO
   PERRO
   ───────────────────────────────────────────────────────────────────────────
   Probar que la segunda reserva idéntica rebota **no alcanza**: un guard por
   `(bono, fecha)` —el que C pidió explícitamente NO hacer— también rebotaría,
   y además le cerraría el día a la otra mascota del hogar. **El brazo que
   distingue los dos guards es que UN SEGUNDO PERRO EL MISMO DÍA PASE.**
   Sin ese brazo, el verde no dice cuál de los dos guards se puso.

   Escribe en SUBTRANSACCIÓN QUE SE DESHACE SOLA (L-406).
   ═══════════════════════════════════════════════════════════════════════════ */
DO $cinturon$
DECLARE
  v_rol text := current_user;
  v_user uuid; v_fam uuid; v_prest uuid; v_tam int; v_masc uuid; v_masc2 uuid;
  v_docs jsonb; v_r jsonb; v_bono uuid; v_dia date;
  v_out text := ''; v_ok int := 0; v_esperados int := 4;
  v_n int; v_lun int; v_sab int; v_ya int; v_b0 int; v_b1 int; v_c0 int; v_c1 int;
BEGIN
  SELECT count(*) INTO v_b0 FROM bonos WHERE tipo_servicio='guarderia_dia';
  SELECT count(*) INTO v_c0 FROM evento_cita_servicio WHERE tipo_servicio='guarderia_dia';

  SELECT c.user_id, c.mascota_id INTO v_user, v_masc FROM evento_cita_servicio c
    JOIN mascotas m ON m.id=c.mascota_id
   WHERE m.especie IN ('perro','gato') AND c.user_id IS NOT NULL LIMIT 1;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm WHERE fm.user_id=v_user AND fm.hasta IS NULL LIMIT 1;
  SELECT m.id INTO v_masc2 FROM mascotas m
   WHERE m.familia_id=v_fam AND m.id <> v_masc AND m.especie IN ('perro','gato') LIMIT 1;
  SELECT ps.prestador_id INTO v_prest FROM prestador_servicios ps
   WHERE ps.tipo_servicio='guarderia_dia' AND ps.activo LIMIT 1;
  SELECT gp.tamano INTO v_tam FROM guarderia_paquetes gp
   WHERE gp.prestador_id=v_prest AND gp.activo ORDER BY gp.tamano DESC LIMIT 1;
  SELECT jsonb_agg(jsonb_build_object('codigo',codigo,'version',version)) INTO v_docs
    FROM public.obtener_documentos_guarderia();

  IF v_masc2 IS NULL THEN
    /* 🔴 SE DECLARA, NO SE SALTEA: un arnés que omite en silencio su brazo
       discriminador da un verde que no distingue los dos guards. */
    v_esperados := 3;
    v_out := v_out || E'\n  ⚠️ NO EJERCIDO · la familia tiene UNA sola mascota: el brazo del SEGUNDO PERRO no corrió';
  END IF;

  BEGIN
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub',v_user,'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    PERFORM public.aceptar_documentos_guarderia(v_fam, v_docs, 300, 'USD', '[]'::jsonb, NULL, false);
    v_r := public.comprar_paquete_guarderia(v_prest, v_tam);
    v_bono := (v_r->>'bono_id')::uuid;
    SELECT min(d)::date INTO v_dia FROM generate_series(public.hoy_local()+1, public.hoy_local()+9,'1 day') d
     WHERE public._guarderia_dia_operativo(v_prest, d::date);

    PERFORM public.reservar_dia_de_paquete_guarderia(v_bono, v_dia, v_masc);
    v_out := v_out || E'\n  1ra reserva                     -> ok';

    BEGIN PERFORM public.reservar_dia_de_paquete_guarderia(v_bono, v_dia, v_masc);
      v_out := v_out || E'\n  2da IDENTICA                    -> 🔴 PASO';
    EXCEPTION WHEN OTHERS THEN
      v_out := v_out || format(E'\n  2da IDENTICA                    -> %s', SQLERRM);
      IF SQLERRM = 'mascota_ya_reservada_ese_dia' THEN v_ok := v_ok + 1; END IF;
    END;

    BEGIN PERFORM public.reservar_dia_guarderia(v_prest, v_masc, v_dia);
      v_out := v_out || E'\n  dia SUELTO sobre el mismo dia   -> 🔴 PASO (cobra dos veces)';
    EXCEPTION WHEN OTHERS THEN
      v_out := v_out || format(E'\n  dia SUELTO sobre el mismo dia   -> %s', SQLERRM);
      IF SQLERRM = 'mascota_ya_reservada_ese_dia' THEN v_ok := v_ok + 1; END IF;
    END;

    IF v_masc2 IS NOT NULL THEN
      BEGIN PERFORM public.reservar_dia_de_paquete_guarderia(v_bono, v_dia, v_masc2);
        v_out := v_out || E'\n  🔑 SEGUNDO PERRO, mismo dia     -> PASA (el guard NO es por bono)';
        v_ok := v_ok + 1;
      EXCEPTION WHEN OTHERS THEN
        v_out := v_out || format(E'\n  🔑 SEGUNDO PERRO, mismo dia     -> 🔴 %s — el guard quedo por (bono,fecha)', SQLERRM);
      END;
    END IF;

    /* ── ② la tira ─────────────────────────────────────────────────────── */
    SELECT count(*)::int,
           count(*) FILTER (WHERE reservable)::int,
           count(*) FILTER (WHERE motivo='no_opera_ese_dia')::int,
           count(*) FILTER (WHERE ya_reservado)::int
      INTO v_n, v_lun, v_sab, v_ya
      FROM public.obtener_dias_guarderia(v_prest, public.hoy_local(), public.hoy_local()+13, v_masc);
    v_out := v_out || format(E'\n  tira 14 dias -> %s filas · %s reservables · %s no_opera · %s ya_reservado',
                             v_n, v_lun, v_sab, v_ya);
    IF v_n = 14 AND v_sab > 0 AND v_lun > 0 AND v_ya = 1 THEN v_ok := v_ok + 1; END IF;

    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    RAISE EXCEPTION 'CINTURON_DESHACER';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF SQLERRM <> 'CINTURON_DESHACER' THEN RAISE; END IF;
  END;

  SELECT count(*) INTO v_b1 FROM bonos WHERE tipo_servicio='guarderia_dia';
  SELECT count(*) INTO v_c1 FROM evento_cita_servicio WHERE tipo_servicio='guarderia_dia';
  RAISE NOTICE E'\n═══ CINTURON · un dia por mascota, y la tira ═══%\n\n  %/% esperados · residuo bonos %→% citas %→%',
    v_out, v_ok, v_esperados, v_b0, v_b1, v_c0, v_c1;

  IF v_ok <> v_esperados THEN RAISE EXCEPTION 'CINTURON ROJO: %/% . %', v_ok, v_esperados, v_out; END IF;
  IF v_b1 <> v_b0 OR v_c1 <> v_c0 THEN RAISE EXCEPTION 'CINTURON ROJO: residuo'; END IF;
END $cinturon$;
