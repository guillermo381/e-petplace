-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ S101-C · EL ACCESO A LA MASCOTA, CON EL USUARIO EXPLÍCITO               ║
-- ║ ENTREGADA SIN APLICAR — pide firma.                                     ║
-- ║ Reversa: docs/relevamientos/2026-08-20-s101c-REVERSA-20260822040000.sql ║
-- ║ + el cuerpo original volcado, que es su ÚNICA fuente de restauración.   ║
-- ║ Regla 76(g): NO RIGE — funciones, sin backfill.                         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- ═══ 🔴 POR QUÉ HACE FALTA ═════════════════════════════════════════════════
--
-- El cobro de una cita corre en una Edge Function con `service_role`. Ahí
-- **`auth.uid()` es NULL**, y `user_tiene_acceso_a_mascota` —que lo usa— **siempre
-- devuelve false**. *Es la misma clase de trampa que el `uid` del proveedor: una
-- función correcta que, llamada desde otro lado, contesta otra cosa.*
--
-- ═══ 🔴 POR QUÉ NO SE COPIA LA LÓGICA ══════════════════════════════════════
--
-- **Medido: 62 policies y 28 funciones** llaman a `user_tiene_acceso_a_mascota`.
-- Escribir una segunda implementación para el servidor sería garantizar que
-- **algún día las dos digan cosas distintas sobre quién puede ver una mascota** —
-- y ese día nadie se entera hasta que alguien ve lo que no debía.
--
-- ⇒ **La lógica se muda UNA VEZ a la variante con usuario explícito, y el
--   original DELEGA.** Dos puertas, una implementación. *El camino de las 62
--   policies no cambia de comportamiento: cambia de dueño.*
--
-- ⚠️ Y su cuerpo **no vivía en ninguna migración legible** — se volcó de la base
--    antes de tocarlo (`…-CUERPO-ORIGINAL-acceso.sql`), porque **es la única
--    fuente para revertir.**

CREATE OR REPLACE FUNCTION public.user_tiene_acceso_a_mascota_como(p_user_id uuid, p_mascota_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := p_user_id;
  v_caducidad_meses integer;
BEGIN
  -- Sin sesion -> no
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Admin -> si
  IF is_admin() THEN
    RETURN true;
  END IF;

  -- Dueño de la mascota -> si
  IF EXISTS (
    SELECT 1 FROM mascotas
    WHERE id = p_mascota_id AND user_id = v_user_id
  ) THEN
    RETURN true;
  END IF;

  -- Plazo de caducidad parametrizable (default defensivo 6 si falta config)
  SELECT COALESCE(
    (SELECT valor::integer FROM app_config
      WHERE clave = 'acceso_prestador_caducidad_meses'),
    6
  ) INTO v_caducidad_meses;

  -- Dueño o empleado activo de algun prestador cuya cuenta_comercial tiene
  -- acceso activo a la mascota.
  IF EXISTS (
    SELECT 1
    FROM mascota_acceso_prestador map
    WHERE map.mascota_id = p_mascota_id
      AND map.revocado_en IS NULL
      AND (map.expira_en IS NULL OR map.expira_en > now())
      AND map.cuenta_comercial_id IN (
        SELECT cuenta_comercial_id FROM prestadores
        WHERE user_id = v_user_id
        UNION
        SELECT p.cuenta_comercial_id
        FROM prestador_empleados pe
        JOIN prestadores p ON p.id = pe.prestador_id
        WHERE pe.user_id = v_user_id AND pe.activo = true
      )
      -- Caducidad lazy: las filas otorgadas por cita automatica solo siguen
      -- vigentes si hay una cita con esta mascota y esta cuenta dentro de la
      -- ventana de N meses. Las filas de otro metodo pasan sin esta condicion.
      AND (
        map.metodo_otorgamiento <> 'cita_automatica'
        OR EXISTS (
          SELECT 1
          FROM evento_cita_servicio ecs
          JOIN prestadores p2 ON p2.id = ecs.prestador_id
          WHERE ecs.mascota_id = map.mascota_id
            AND p2.cuenta_comercial_id = map.cuenta_comercial_id
            AND ecs.fecha >= (now() - make_interval(months => v_caducidad_meses))::date
        )
      )
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$function$


-- ── EL ORIGINAL DELEGA — mismo comportamiento, un solo dueño ───────────────
CREATE OR REPLACE FUNCTION public.user_tiene_acceso_a_mascota(p_mascota_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $deleg$
  SELECT public.user_tiene_acceso_a_mascota_como(auth.uid(), p_mascota_id);
$deleg$;

REVOKE ALL ON FUNCTION public.user_tiene_acceso_a_mascota_como(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_tiene_acceso_a_mascota_como(uuid, uuid) TO service_role;

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $$
DECLARE v_acl text; v_def text;
BEGIN
  /* 🔴 La variante con usuario explícito **jamás alcanzable desde una sesión de
     persona**: con ella, cualquiera preguntaría por la mascota de otro pasando
     el uid ajeno. *Un oráculo de acceso ajeno es peor que el dato que protege.* */
  SELECT array_to_string(p.proacl,',') INTO v_acl FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='user_tiene_acceso_a_mascota_como';
  IF v_acl ILIKE '%anon=%' OR v_acl ILIKE '%authenticated=%' THEN
    RAISE EXCEPTION 'CINTURON: la variante con uid explicito quedo abierta a una sesion de persona';
  END IF;

  -- El original ya no tiene lógica propia: delega. Si vuelve a tenerla, se
  -- pueden separar sin que nadie lo note.
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='user_tiene_acceso_a_mascota';
  IF v_def NOT ILIKE '%user_tiene_acceso_a_mascota_como%' THEN
    RAISE EXCEPTION 'CINTURON: el original dejo de delegar — hay dos implementaciones';
  END IF;

  -- Y el comportamiento no cambió: sin sesión sigue diciendo que no.
  IF public.user_tiene_acceso_a_mascota('00000000-0000-0000-0000-000000000000') THEN
    RAISE EXCEPTION 'CINTURON: sin sesion dice que si';
  END IF;

  RAISE NOTICE 'cinturon verde: una sola implementacion, dos puertas, la del servidor cerrada';
END $$;
