-- S88-A · EL MOSTRADOR: LA PLATA SE ENSANCHA Y NACE SU LECTOR
-- Pedidos ① y ② de la pista C, sobre la lámina §4ter firmada (5-ago).
--
-- 76(g) — VEDA: **NO RIGE.** Solo funciones de LECTURA; cero datos tocados.
--
-- ─────────────────────────────────────────────────────────────────────────
-- ① EL ENSANCHE DE LA PLATA — excepción firmada a L-198
--
-- El motor vivo decía `titular OR is_admin()`. La lámina §4ter firma:
--   punto 2 · «Dueño y ADMIN ven lo mismo: el HOY del gestor — techo con la plata»
--   punto 3 · «RECEPCIÓN ve la posición consolidada del dueño — techo CON la plata»
--   punto 4 · «PROFESIONAL: su día propio, SIN plata»
--
-- ⚠️ LO QUE **NO** CAMBIA, y por eso el ensanche es seguro: el gate sigue
--    viviendo EN EL SERVIDOR y sigue devolviendo `visible:false` en vez de
--    error. *Una autorización que decide el cliente es decorativa* — y el
--    tercer número ausente SIN VOZ se lee como pantalla rota (A3.5bis).
--
-- ⚠️ Y LO QUE SIGUE ABIERTO, declarado: `precio` sigue siendo legible por RLS
--    para quien ve la cita. Este gate es la puerta del TOTAL, jamás la del DATO.
--    (Nota heredada de S83, intacta.)
--
-- ─────────────────────────────────────────────────────────────────────────
-- EL PREDICADO COMPARTIDO, y por qué UNO y no dos
--
-- Los dos verbos del mostrador —VER LA PLATA y ASIGNAR— tienen HOY el mismo
-- portador: quien gestiona (titular · administrador · admin de plataforma) o
-- quien está en el mostrador (miembro activo con CERO chips). Escribir dos
-- cuerpos idénticos es lo que esta casa ya pagó caro («dos cuerpos del MISMO
-- cálculo»): divergen sin que nadie se entere.
--
-- ⚠️ PERO SE DECLARA SU LÍMITE: es la forma de HOY, no una promesa. Si mañana
--    la letra separa los dos verbos —que es perfectamente posible: ver plata y
--    repartir trabajo son cosas distintas— **el que se mueva gana predicado
--    propio, y este comentario es el permiso para hacerlo sin pedir permiso.**
-- ─────────────────────────────────────────────────────────────────────────

BEGIN;

CREATE OR REPLACE FUNCTION public.empleado_es_mostrador_o_gestion(p_prestador_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  -- (a) LA GESTIÓN: titular · administrador del negocio · admin de plataforma
  SELECT public.user_gestiona_prestador(p_prestador_id)
  -- (b) EL MOSTRADOR: miembro activo con CERO chips.
  --     ⚠️ NO se lee la fila `recepcion`: es MEMBRESÍA, no identidad — la
  --     tienen todos, veterinarios incluidos (ley madre S76). Medido:
  --     de 9 filas `recepcion` vivas, TRES son de profesionales con chips.
      OR EXISTS (
        SELECT 1
        FROM prestador_empleados pe
        WHERE pe.prestador_id = p_prestador_id
          AND pe.user_id      = auth.uid()
          AND pe.activo       = true
          AND NOT EXISTS (
            SELECT 1 FROM prestador_empleado_servicios pes
            WHERE pes.empleado_id = pe.id
          )
      );
$$;

COMMENT ON FUNCTION public.empleado_es_mostrador_o_gestion(uuid) IS
  'S88/§4ter: ¿el llamante está en el mostrador o lo gestiona? Gestión (D-660) '
  'o recepción DERIVADA POR AUSENCIA DE CHIPS. El profesional puro NO. Es el '
  'portador de DOS verbos hoy (ver la plata · asignar citas); si la letra los '
  'separa, el que se mueva gana predicado propio.';


-- `empleado_puede_asignar_citas` CONSERVA su nombre y su contrato (el wrapper
-- de C no se toca) y pasa a delegar: una sola verdad, dos nombres de verbo.
CREATE OR REPLACE FUNCTION public.empleado_puede_asignar_citas(p_prestador_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT public.empleado_es_mostrador_o_gestion(p_prestador_id);
$$;


-- ① LA PLATA, con su gate ensanchado. El resto del cuerpo, INTACTO.
CREATE OR REPLACE FUNCTION public.obtener_plata_del_dia(p_prestador_id uuid, p_fecha date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_total      numeric;
  v_contadas   integer;
  v_sin_precio integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  -- ⚠️ ENSANCHE §4ter: era `titular OR is_admin()`. Ahora el mostrador
  --    entero. El profesional puro sigue afuera — con `visible:false`, que
  --    NO es un error: es la modulación, y la superficie la DICE.
  IF NOT public.empleado_es_mostrador_o_gestion(p_prestador_id) THEN
    RETURN jsonb_build_object('visible', false);
  END IF;

  SELECT
    coalesce(sum(c.precio), 0),
    count(*),
    count(*) FILTER (WHERE c.precio IS NULL)
  INTO v_total, v_contadas, v_sin_precio
  FROM evento_cita_servicio c
  WHERE c.prestador_id = p_prestador_id
    AND c.fecha = p_fecha
    AND c.estado = ANY(public._estados_cita_contables());   -- S86-A: una verdad

  RETURN jsonb_build_object(
    'visible', true,
    'total', v_total,
    'citas', v_contadas,
    'sinPrecio', v_sin_precio   -- >0 ⇒ el total es PARCIAL y la superficie lo dice
  );
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────
-- ② EL LECTOR DE LA HOJA DE ASIGNAR
--
-- ⚠️ POR QUÉ NO SE ENSANCHA `obtener_personas_que_atienden` (L-175 mirada y
--    descartada CON su razón): ese lector es de la VITRINA — se llavea por
--    `servicio_id` (la OFERTA) y **acepta al titular POR ROL**
--    (`pe.rol = 'dueño'`, el eje legacy de D-486) aunque no tenga el chip.
--
--    **La puerta de asignar exige el CHIP a TODOS, titular incluido.** Si la
--    Hoja se alimentara de ese lector, ofrecería al titular sin chip y la
--    puerta lo rebotaría con `persona_sin_oficio` — **exactamente el botón que
--    rebota que la Ley 23 prohíbe**, y el motivo por el que C pidió el lector.
--
-- Por eso este lector espeja los gates ④ y ⑤ de `asignar_cita_a_persona`
-- BYTE A BYTE, y se llavea por la CITA: la lista que la Hoja muestra es, por
-- construcción, la que la puerta va a aceptar.

CREATE OR REPLACE FUNCTION public.obtener_personas_para_asignar(p_cita_id uuid)
RETURNS TABLE(empleado_id uuid, nombre text, tiene_jornada boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_prestador uuid;
  v_tipo      text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT c.prestador_id, c.tipo_servicio INTO v_prestador, v_tipo
  FROM evento_cita_servicio c WHERE c.id = p_cita_id;

  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'cita_no_existe' USING ERRCODE = '22023';
  END IF;

  -- Mismo gate que la puerta: quien no puede asignar tampoco averigua a quién.
  IF NOT public.empleado_es_mostrador_o_gestion(v_prestador) THEN
    RAISE EXCEPTION 'rol_sin_asignacion: quien rutea es la recepción, el administrador o el titular'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    pe.id,
    pr.nombre,
    -- La JORNADA se informa, NO filtra. Una persona con chip y sin horario
    -- puede recibir una cita ya pactada — la jornada gobierna la OFERTA a la
    -- familia (S78), no el ruteo de lo que ya existe. La Hoja lo muestra para
    -- que quien reparte decida sabiendo.
    EXISTS (SELECT 1 FROM prestador_horarios h WHERE h.empleado_id = pe.id AND h.activo)
  FROM prestador_empleados pe
  LEFT JOIN profiles pr ON pr.id = pe.user_id
  WHERE pe.prestador_id = v_prestador
    AND pe.activo = true                                   -- gate ④ de la puerta
    AND EXISTS (                                           -- gate ⑤ de la puerta
      SELECT 1
      FROM prestador_empleado_servicios pes
      JOIN prestador_servicios ps ON ps.id = pes.servicio_id
      WHERE pes.empleado_id = pe.id
        AND ps.tipo_servicio = v_tipo
    )
  ORDER BY pr.nombre ASC, pe.id ASC;
END;
$$;

COMMENT ON FUNCTION public.obtener_personas_para_asignar(uuid) IS
  'S88/§4ter: quiénes pueden TOMAR esta cita. Espeja los gates ④ y ⑤ de '
  'asignar_cita_a_persona byte a byte — la lista que la Hoja ofrece es la que '
  'la puerta acepta (Ley 23). NO es obtener_personas_que_atienden: ése es de '
  'la vitrina y acepta al titular por rol legacy sin mirar su chip.';


-- L-140
REVOKE EXECUTE ON FUNCTION public.empleado_es_mostrador_o_gestion(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_personas_para_asignar(uuid)   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.empleado_puede_asignar_citas(uuid)    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_plata_del_dia(uuid, date)     FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.empleado_es_mostrador_o_gestion(uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.obtener_personas_para_asignar(uuid)   TO authenticated;
GRANT  EXECUTE ON FUNCTION public.empleado_puede_asignar_citas(uuid)    TO authenticated;
GRANT  EXECUTE ON FUNCTION public.obtener_plata_del_dia(uuid, date)     TO authenticated;

-- ── CINTURÓN — sin efectos laterales ──────────────────────────────────────
DO $belt$
DECLARE v_anon int; v_falta int := 0;
BEGIN
  IF to_regprocedure('public.empleado_es_mostrador_o_gestion(uuid)') IS NULL THEN v_falta := v_falta + 1; END IF;
  IF to_regprocedure('public.obtener_personas_para_asignar(uuid)')   IS NULL THEN v_falta := v_falta + 1; END IF;
  IF v_falta <> 0 THEN RAISE EXCEPTION 'CINTURON: % función(es) sin crear', v_falta; END IF;

  -- La plata ya NO puede mencionar el gate viejo: si `is_admin()` sigue en su
  -- cuerpo, el ensanche no se aplicó (mide el objeto, no esta prosa).
  IF pg_get_functiondef('public.obtener_plata_del_dia(uuid, date)'::regprocedure)
     NOT LIKE '%empleado_es_mostrador_o_gestion%' THEN
    RAISE EXCEPTION 'CINTURON: obtener_plata_del_dia no quedó con el gate nuevo';
  END IF;

  SELECT count(*) INTO v_anon
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('empleado_es_mostrador_o_gestion','obtener_personas_para_asignar',
                      'empleado_puede_asignar_citas','obtener_plata_del_dia')
    AND array_to_string(COALESCE(p.proacl, '{}'), ',') LIKE '%anon=%';
  IF v_anon <> 0 THEN RAISE EXCEPTION 'CINTURON (L-140): % con anon en proacl', v_anon; END IF;

  RAISE NOTICE 'CINTURON VERDE: 4 funciones al día, gate nuevo en la plata, 0 anon.';
END
$belt$;

COMMIT;
