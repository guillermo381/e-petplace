-- ============================================================================
-- S106-A tanda 3 · CERRAR LA TELECONSULTA — la puerta que no existía
--
-- ── LO QUE C MIDIÓ, Y ES UN HUECO DEL SERVICIO ─────────────────────────────
-- **Colgar es puramente local**: cero llamadas al motor en las dos apps. Y no
-- había RPC de cierre — sólo `_cerrar_teleconsulta_si_vencio`, que es para las
-- que *nadie* cerró.
--
-- ⇒ El founder confirmaba «terminar» en las dos apps **y podía volver a
-- entrar**. Y el motor tenía razón: para él la cita seguía `confirmada` y
-- `pagada`, *y una cita así tiene su sala abierta.*
--
-- ── LA FIRMA ───────────────────────────────────────────────────────────────
-- **Cualquiera de los dos cierra, y cierra para ambos.** Mientras nadie cierre,
-- los dos vuelven libremente. A los 10 minutos del fin entra el perezoso.
--
-- 🔴 **EL CIERRE NUNCA ATERRIZA EN UN ESTADO DE «NO PASÓ».** Ni `no_show` ni
-- `no_realizable`: *eso le consumiría a la familia su derecho a devolución por
-- una consulta que sí recibió.* Es el mismo freno del perezoso, y acá pesa más
-- porque acá hay un humano apretando un botón.
--
-- ── ✅ EL BORDE QUE C DEJÓ ABIERTO, FIRMADO POR EL FOUNDER ─────────────────
-- > *Si el DUEÑO cierra, la consulta queda `completada` **aunque el vet no haya
-- > sedimentado**. El Durante tiene su propia puerta y el borrador vive en la
-- > CITA, no en la sala — **lo que se cierra es la sala, jamás el trabajo.** El
-- > vet sedimenta después.*
--
-- 🟢 **Y eso se MIDIÓ antes de construir, porque era el riesgo real:**
-- `sedimentar_nota_clinica` **NO mira el estado de la cita** — sus guards son
-- acceso, capacidad clínica, tratante y contenido. *La firma no deja al vet
-- afuera: pudo comprobarse, y por eso se construye tranquila.*
--
-- ── IDEMPOTENTE, y por qué importa acá ─────────────────────────────────────
-- Los dos actores pueden apretar «terminar» **al mismo tiempo**. El segundo no
-- recibe un error: recibe `ok` con `ya_estaba: true`. *Un cierre que falla
-- porque el otro llegó primero le muestra un error a alguien que hizo todo
-- bien.*
--
-- ── VEDA 76(g): NO RIGE. Función nueva. Cero DDL de tablas, cero backfill.
--    **Escribe `estado` cuando un actor legítimo lo pide** — declarado.
-- ── REVERSA: docs/relevamientos/2026-08-27-s106a-REVERSA-cerrar-teleconsulta.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cerrar_teleconsulta(p_cita_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
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

  RETURN jsonb_build_object('ok', true, 'ya_estaba', false, 'estado', 'completada');
END;
$function$;

COMMENT ON FUNCTION public.cerrar_teleconsulta(uuid) IS
  'S106 · Cualquiera de los dos actores cierra la teleconsulta, y cierra para ambos. '
  'Idempotente. JAMAS aterriza en un estado de «no paso»: eso consumiria el derecho '
  'a devolucion. NO toca el borrador — se cierra la sala, no el trabajo.';

REVOKE EXECUTE ON FUNCTION public.cerrar_teleconsulta(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.cerrar_teleconsulta(uuid) TO authenticated;

-- ── CINTURÓN: los cuatro brazos, sobre una cita fabricada y DESHECHA ───────
DO $cinturon$
DECLARE
  v_rol text := current_user;   -- ⚠️ jamás RESET ROLE
  v_cita uuid; v_fam uuid; v_vet uuid; v_ajeno uuid; v_out jsonb; v_puede jsonb;
BEGIN
  IF has_function_privilege('anon','public.cerrar_teleconsulta(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: el cierre quedo alcanzable por anon';
  END IF;

  SELECT c.id, c.user_id, pr.user_id INTO v_cita, v_fam, v_vet
  FROM evento_cita_servicio c JOIN prestadores pr ON pr.id = c.prestador_id
  WHERE c.modalidad = 'telemedicina' ORDER BY c.created_at DESC LIMIT 1;
  IF v_cita IS NULL THEN RAISE EXCEPTION 'cinturon: no hay teleconsulta con la que ejercer'; END IF;

  BEGIN
    UPDATE evento_cita_servicio SET estado='confirmada', estado_reserva='pagada',
      fecha=(now() AT TIME ZONE 'America/Guayaquil')::date,
      hora=(now() AT TIME ZONE 'America/Guayaquil')::time
    WHERE id = v_cita;

    -- ① UN AJENO NO CIERRA. *Si cualquiera pudiera, cortar una consulta ajena
    --    sería un botón al alcance de todos.*
    SELECT u.id INTO v_ajeno FROM auth.users u
    WHERE u.id NOT IN (v_fam, v_vet) LIMIT 1;
    IF v_ajeno IS NOT NULL THEN
      EXECUTE format('SET LOCAL request.jwt.claims = %L',
                     json_build_object('sub', v_ajeno, 'role','authenticated')::text);
      SET LOCAL ROLE authenticated;
      v_out := public.cerrar_teleconsulta(v_cita);
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      IF (v_out->>'ok') IS DISTINCT FROM 'false' THEN
        RAISE EXCEPTION 'cinturon: un ajeno pudo cerrar la consulta — %', v_out::text;
      END IF;
    END IF;

    -- ② LA FAMILIA CIERRA, y cierra para los dos.
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_fam, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    v_out := public.cerrar_teleconsulta(v_cita);
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF (v_out->>'ok') IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'cinturon: la familia no pudo cerrar — %', v_out::text;
    END IF;

    -- ③ 🔴 Y LA SALA QUEDA CERRADA PARA EL VET TAMBIÉN. *«Cierra para ambos» no
    --    se prueba mirando una columna: se prueba preguntándole a la puerta.*
    v_puede := public.puede_entrar_a_videollamada(v_cita, v_vet);
    IF (v_puede->>'puede') IS DISTINCT FROM 'false'
       OR (v_puede->>'motivo') IS DISTINCT FROM 'cita_finalizada' THEN
      RAISE EXCEPTION 'cinturon: el vet TODAVIA puede entrar tras el cierre — %', v_puede::text;
    END IF;

    -- ④ IDEMPOTENTE: el segundo en apretar no ve un error.
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_vet, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    v_out := public.cerrar_teleconsulta(v_cita);
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF (v_out->>'ok') IS DISTINCT FROM 'true' OR (v_out->>'ya_estaba') IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'cinturon: el segundo cierre no fue idempotente — %', v_out::text;
    END IF;

    RAISE EXCEPTION 'cinturon_ok_deshacer';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'cinturon_ok_deshacer' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'cinturon cerrar: OK · el ajeno rebota · la familia cierra · el vet ya no entra · idempotente';
END;
$cinturon$;
