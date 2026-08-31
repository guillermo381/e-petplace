-- ═══════════════════════════════════════════════════════════════════════════
-- S107 · A — LA JORNADA DEL PRESTADOR, Y LA DIRECCIÓN DONDE HAY QUE IR
--
-- ① `obtener_estadias_del_dia` — **el wrapper que faltaba y era el único que
--    impedía cerrar el recorrido del prestador de punta a punta.** Hoy
--    configura su cupo, sus franjas y su precio, cobra… y **no ve su jornada.**
--    (Medido por C: cero ocurrencias en `packages/api` y en `supabase/`.)
--
-- ② 🔴 Y UN HUECO QUE APARECIÓ AL ESCRIBIR EL LECTOR: **la reserva no
--    guardaba la dirección.** `reservar_dia_guarderia` creaba la cita sin
--    `direccion_snapshot` ⇒ la lista del día decía a quién recoger y **no
--    dónde**. *En un oficio cuyo primer acto es tocar el timbre de una casa,
--    eso no es un campo que falta: es la mitad del trabajo.*
--
--    Se cura reusando `_direccion_hogar_snapshot(user_id)` — la MISMA pieza
--    que el paseo usa para su modalidad a domicilio (D-339). **Cero
--    invención: la dirección se congela igual que el precio, y por la misma
--    razón — es la que la familia tenía cuando reservó.**
--
-- ⚠️ Lo que NO cambia: las citas ya creadas sin dirección se quedan así. Son
--    del cinturón y no hay ninguna viva (medido: 0 estadías).
--
-- Reversa: docs/relevamientos/S107-A-REVERSA-20260829000000-jornada-y-direccion.sql
-- 76(g): 🔴 RIGE — el cinturón crea una reserva real y la deshace en
--        subtransacción. Residuo verificado en 0.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.reservar_dia_guarderia(
  p_prestador_id uuid,
  p_mascota_id   uuid,
  p_fecha        date
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_ps record; v_gate jsonb; v_cupo jsonb;
  v_cita uuid; v_estadia uuid; v_espacio uuid;
  v_user uuid := auth.uid();
  v_direccion jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'guarderia_dia') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  IF p_fecha < public.hoy_local() THEN
    RAISE EXCEPTION 'fecha_pasada' USING ERRCODE = '22023';
  END IF;

  v_gate := public._guarderia_puede_reservar(p_mascota_id);
  IF (v_gate->>'puede')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'requisitos_sanitarios' USING ERRCODE = '22023';
  END IF;

  SELECT ps.id, ps.precio, ps.duracion_minutos, pr.country_code
    INTO v_ps
    FROM prestador_servicios ps
    JOIN prestadores pr ON pr.id = ps.prestador_id
   WHERE ps.prestador_id = p_prestador_id AND ps.tipo_servicio = 'guarderia_dia'
     AND ps.activo AND ps.reservable;
  IF v_ps.id IS NULL THEN
    RAISE EXCEPTION 'guarderia_no_disponible' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_prestador_id::text || p_fecha::text));

  v_cupo := public.cupo_guarderia_del_dia(p_prestador_id, p_fecha);
  IF (v_cupo->>'disponible')::int <= 0 THEN
    RAISE EXCEPTION 'sin_cupo' USING ERRCODE = '22023';
  END IF;

  SELECT e.id INTO v_espacio FROM guarderia_espacios e
   WHERE e.prestador_id = p_prestador_id AND e.activo ORDER BY e.created_at LIMIT 1;

  /* 🔴 LA DIRECCIÓN SE CONGELA, igual que el precio y por la misma razón: es la
     que la familia tenía cuando reservó. Y acá NO es opcional — la guardería
     recoge en la casa (`LETRA_GUARDERIA` §1), así que sin esto el cuidador
     sabe a quién buscar y no dónde. Misma pieza que el paseo a domicilio. */
  v_direccion := _direccion_hogar_snapshot(v_user);

  INSERT INTO evento_cita_servicio (
    user_id, mascota_id, prestador_id, tipo_servicio, fecha, precio,
    duracion_minutos, estado, estado_reserva, expira_en, modalidad,
    direccion_snapshot, country_code
  ) VALUES (
    v_user, p_mascota_id, p_prestador_id, 'guarderia_dia', p_fecha, v_ps.precio,
    v_ps.duracion_minutos, 'pendiente', 'pendiente_pago',
    now() + interval '15 minutes', 'presencial',
    v_direccion, COALESCE(v_ps.country_code, 'EC')
  ) RETURNING id INTO v_cita;

  INSERT INTO guarderia_estadias (cita_id, espacio_id)
    VALUES (v_cita, v_espacio) RETURNING id INTO v_estadia;

  RETURN jsonb_build_object('ok', true, 'cita_id', v_cita, 'estadia_id', v_estadia,
                            'precio', v_ps.precio, 'expira_en', now() + interval '15 minutes',
                            'con_direccion', (v_direccion IS NOT NULL));
END $$;

/* ── LA JORNADA DEL DÍA ────────────────────────────────────────────────────
   🔴 «La lista de hoy» es una VISTA sobre las estadías, jamás una entidad
   «jornada»: un día con seis animales son SEIS estadías. La pantalla compone;
   no hay un objeto que pedir ni que mutar. */
CREATE FUNCTION public.obtener_estadias_del_dia(p_prestador_id uuid, p_fecha date)
RETURNS TABLE(
  estadia_id uuid, cita_id uuid, estado text,
  mascota_id uuid, mascota_nombre text, mascota_especie text, mascota_foto_url text,
  espacio_nombre text, direccion_snapshot jsonb,
  a_bordo_en timestamptz, llegada_en timestamptz, entregada_en timestamptz,
  estado_reserva text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  /* La puerta del negocio, no una regla nueva: la misma que gobierna su
     configuración. */
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT g.id, c.id, g.estado,
         m.id, m.nombre, m.especie, m.foto_url,
         e.nombre, c.direccion_snapshot,
         g.a_bordo_en, g.llegada_en, g.entregada_en,
         c.estado_reserva
    FROM guarderia_estadias g
    JOIN evento_cita_servicio c ON c.id = g.cita_id
    JOIN mascotas m             ON m.id = c.mascota_id
    LEFT JOIN guarderia_espacios e ON e.id = g.espacio_id
   WHERE c.prestador_id = p_prestador_id
     AND c.fecha = p_fecha
     /* 🔴 LA JORNADA SÓLO CONTIENE VERDAD FIRME. Un hold sin pagar NO es una
        estadía del día: es alguien mirando. *Una lista que incluye reservas
        que pueden evaporarse en quince minutos hace salir al cuidador a buscar
        un animal que nadie compró.* (Principio de S51: la agenda sólo contiene
        verdad firme.) */
     AND c.estado_reserva = 'pagada'
     AND g.estado <> 'cancelada'
   ORDER BY m.nombre;
END $$;

REVOKE EXECUTE ON FUNCTION public.obtener_estadias_del_dia(uuid, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_estadias_del_dia(uuid, date) TO authenticated;

COMMIT;
