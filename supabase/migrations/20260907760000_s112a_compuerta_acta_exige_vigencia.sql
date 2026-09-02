-- S112-A · 20260907760000 · LA COMPUERTA DEL ACTA EXIGE VIGENCIA, NO SOLO EXISTENCIA.
-- Adenda 8 punto 0. 76(g) NO RIGE: cero backfill, se re-crea una funcion.
-- REVERSA ESCRITA ANTES: docs/relevamientos/S112-A-REVERSA-20260907760000-vigencia-acta.sql
--   revertirla REABRE la puerta a un acta jubilada.

CREATE OR REPLACE FUNCTION public.traspasar_mascota_a_familia(p_mascota_id uuid, p_familia_destino_id uuid, p_acta_version integer, p_acta_codigo text DEFAULT 'acta_adopcion'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user uuid := auth.uid(); v_origen uuid; v_pub uuid; v_cc text;
  v_cuenta uuid; v_evento uuid; v_cerrados int := 0;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  SELECT m.familia_id, m.country_code INTO v_origen, v_cc FROM mascotas m WHERE m.id = p_mascota_id;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'mascota_no_existe' USING ERRCODE='22023'; END IF;
  IF v_origen = p_familia_destino_id THEN
    RAISE EXCEPTION 'familia_destino_igual_al_origen' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM familia WHERE id = p_familia_destino_id) THEN
    RAISE EXCEPTION 'familia_destino_no_existe' USING ERRCODE='22023';
  END IF;

  SELECT p.id, p.cuenta_comercial_id INTO v_pub, v_cuenta
    FROM adopcion_publicacion p WHERE p.mascota_id = p_mascota_id AND p.estado = 'publicada';
  IF v_pub IS NULL THEN RAISE EXCEPTION 'sin_publicacion_viva' USING ERRCODE='22023'; END IF;
  IF NOT public._user_publico_esta_publicacion(v_pub, v_user) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501';
  END IF;

  /* 🔴 FAIL-CLOSED CONTRA EL ACTA VERSIONADA. `adopcion_documentos` nace VACÍA
     ⇒ hoy esto rebota SIEMPRE, y es lo correcto: el texto es del paquete del
     abogado y está estacionado. **El día que la mesa lo cargue, esta puerta se
     abre sola, sin tocar una línea de código.** */
  /* ═══ S112-A · LA COMPUERTA MIRABA EXISTENCIA, NO VIGENCIA ════════════════
     Medido: con `terminos_refugio v1` jubilada (`vigente=false`), el predicado
     viejo daba TRUE. ⇒ **un acta retirada abría la puerta.** Y el daño no es
     que falle: un traspaso quedaría registrado contra un texto que la casa ya
     retiró, y esa acta es la prueba de qué firmó la familia.
     *Una puerta que pregunta si el documento EXISTE y no si RIGE produce una
     firma inauditable.*

     El censo de la clase (adenda 8) dio que guardería NO tiene este hueco:
     su lector único `obtener_documentos_guarderia` filtra por `activo`, y las
     dos puertas que lo consumen heredan el filtro. **Adopción no tenía lector:
     esta puerta leía la tabla cruda.** */
  IF NOT EXISTS (SELECT 1 FROM adopcion_documentos
                  WHERE codigo = p_acta_codigo AND version = p_acta_version
                    AND vigente) THEN
    RAISE EXCEPTION 'acta_no_disponible: % v%', p_acta_codigo, p_acta_version USING ERRCODE='22023';
  END IF;

  -- ① la mascota cambia de familia (el trigger de D-989 deja pasar: somos DEFINER)
  UPDATE mascotas
     SET familia_id = p_familia_destino_id,
         estado_adopcion = 'adoptada',
         updated_at = now()
   WHERE id = p_mascota_id;

  -- ② el acceso viejo se CIERRA con `hasta` — no se borra
  /* *Borrar el vínculo dejaría la historia diciendo que esa familia nunca lo
     tuvo. Cerrarlo dice la verdad: lo tuvo, y hasta cuándo.* */
  UPDATE familia_miembro
     SET hasta = now(), motivo_baja = 'traspaso_por_adopcion', updated_at = now()
   WHERE familia_id = v_origen AND hasta IS NULL
     AND rol = 'cuidador_externo';
  GET DIAGNOSTICS v_cerrados = ROW_COUNT;

  -- ③ el evento, que es el rastro y el motivo de que esto sea una RPC
  /* 🔴 `eje_jtbd` SALE DEL CATÁLOGO, no de un literal. Es NOT NULL y la primera
     versión de esta migración lo omitió — el rebote lo dijo. *Escribirlo a mano
     habría funcionado igual y habría creado el segundo lugar donde el eje de un
     tipo de evento vive: el catálogo ya lo dice, y dice `identidad`.* */
  INSERT INTO eventos_mascota (
      mascota_id, tipo, eje_jtbd, fecha_evento, cuenta_comercial_id,
      creado_por_user_id, datos, country_code, procedencia)
    VALUES (
      p_mascota_id, 'transferencia_familia',
      (SELECT eje_jtbd FROM cat_tipos_evento WHERE codigo = 'transferencia_familia'),
      now(), v_cuenta, v_user,
      jsonb_build_object(
        'familia_origen', v_origen,
        'familia_destino', p_familia_destino_id,
        'publicacion_id', v_pub,
        /* 🔴 EL REFUGIO QUEDA COMO PROCEDENCIA PERMANENTE. No es metadata: es
           de dónde viene este animal, y viaja con él para siempre. */
        'refugio_cuenta_comercial_id', v_cuenta,
        'acta_codigo', p_acta_codigo,
        'acta_version', p_acta_version),
      v_cc, 'declarado_por_prestador')
    RETURNING id INTO v_evento;

  -- ④ la publicación se cierra
  UPDATE adopcion_publicacion
     SET estado='retirada', retirada_en = now(), motivo_retiro = 'adoptada'
   WHERE id = v_pub;

  RETURN jsonb_build_object('ok', true, 'mascota_id', p_mascota_id,
    'familia_origen', v_origen, 'familia_destino', p_familia_destino_id,
    'evento_id', v_evento, 'accesos_cerrados', v_cerrados, 'publicacion_id', v_pub);
END $function$
;

DO $cinturon$
DECLARE v_abre boolean;
BEGIN
  /* control POSITIVO: el acta vigente sigue abriendo */
  SELECT exists(select 1 from adopcion_documentos
                 where codigo='acta_adopcion' and version=1 and vigente) INTO v_abre;
  IF NOT v_abre THEN RAISE EXCEPTION 'CINTURON: el acta VIGENTE ya no abre -> cerro todo'; END IF;

  /* control NEGATIVO: el documento JUBILADO ya no abre */
  SELECT exists(select 1 from adopcion_documentos
                 where codigo='terminos_refugio' and version=1 and vigente) INTO v_abre;
  IF v_abre THEN RAISE EXCEPTION 'CINTURON: un documento jubilado sigue abriendo'; END IF;

  /* y que el cuerpo REAL de la puerta lleve el AND vigente — no alcanza con
     que el predicado suelto ande: lo que importa es el que corre adentro. */
  IF (SELECT pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.proname='traspasar_mascota_a_familia') NOT LIKE '%AND vigente%' THEN
    RAISE EXCEPTION 'CINTURON: la puerta no quedo con el AND vigente';
  END IF;
  RAISE NOTICE 'CINTURON VERDE: vigente abre, jubilado NO abre, el AND vive en la puerta';
END $cinturon$;
