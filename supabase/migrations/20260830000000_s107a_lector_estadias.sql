/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · EL LECTOR DE ESTADÍAS DE LA FAMILIA
   Destraba TRES cosas de C de una sola vez: el **log** del hub, la **entrada
   al durante** y el **acta**. *Los tres esqueletos ya están montados: esto es
   llenarlos, no construirlos.*
   ═══════════════════════════════════════════════════════════════════════════

   ── 🔴 SE ANCLA EN LA CITA, NO EN LA ESTADÍA — y la razón no es de estilo ─
   Medido: `reservar_dia_guarderia` **crea las dos en el mismo acto**, así que
   hoy anclar en cualquiera de las dos daría lo mismo… **hoy**.

   Y sin embargo se ancla en la CITA, porque la cita es lo que la familia
   COMPRÓ y la estadía es lo que el prestador EJECUTA. *El día que una estadía
   se borre, se rehaga o nazca por otro camino —un día de paquete, una
   mensualidad— la familia tiene que seguir viendo lo que pagó.*

   > **Un lector que cuelga del objeto operativo deja de mostrar lo que la
   > familia compró en cuanto la operación cambia de forma.** Es la
   > invisibilidad que esta casa ya pagó una vez (S71: la cita aprobada sin
   > fecha, que el dueño no veía en ninguna superficie suya).

   La estadía entra por **LEFT JOIN**: si todavía no existe, la fila sale igual
   con `estado_estadia = null` — que es la verdad, no un hueco.

   ── LO QUE MUESTRA, y el precedente que sigue ────────────────────────────
   **Firmes** (`pagada`) **y el hold VIGENTE de la propia familia**, con su
   estado propio. *Precedente `D-319`: el dueño ve su reserva en curso con voz
   propia — lo que la agenda del PRESTADOR esconde (verdad firme) no es lo
   mismo que lo que la familia no puede ver de sí misma.*
   El hold **vencido** no se muestra: es un intento que ya no existe.

   **76(g): NO RIGE.** Un lector; no escribe nada.
   **Reversa:** `docs/relevamientos/S107-A-REVERSA-lector-estadias.sql`.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_mis_estadias_guarderia(
  p_mascota_id uuid DEFAULT NULL)
RETURNS TABLE(
  cita_id uuid, estadia_id uuid, mascota_id uuid, mascota_nombre text,
  prestador_id uuid, prestador_nombre text,
  fecha date, precio numeric,
  estado_cita text, estado_reserva text, estado_estadia text,
  a_bordo_en timestamptz, llegada_en timestamptz, entregada_en timestamptz,
  acta_recogida_id uuid, acta_devolucion_id uuid,
  es_proxima boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  /* Si piden una mascota, se verifica el acceso a ESA. Sin filtro, el WHERE de
     abajo acota por `user_tiene_acceso_a_mascota` fila por fila — nunca se
     devuelve una estadía de una familia ajena. */
  IF p_mascota_id IS NOT NULL AND NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  SELECT c.id, e.id, c.mascota_id, m.nombre,
         c.prestador_id, pr.nombre_comercial,
         c.fecha, c.precio,
         c.estado, c.estado_reserva, e.estado,
         e.a_bordo_en, e.llegada_en, e.entregada_en,
         ar.id, ad.id,
         (c.fecha >= public.hoy_local()
          AND c.estado IN ('pendiente','confirmada','en_curso')) AS es_proxima
    FROM evento_cita_servicio c
    JOIN mascotas m      ON m.id = c.mascota_id
    JOIN prestadores pr  ON pr.id = c.prestador_id
    LEFT JOIN guarderia_estadias e ON e.cita_id = c.id
    /* Las actas por dirección, para que la pantalla del acta no tenga que
       preguntar de nuevo: si hay id, hay acta. */
    LEFT JOIN guarderia_actas ar ON ar.estadia_id = e.id AND ar.direccion = 'recogida'
    LEFT JOIN guarderia_actas ad ON ad.estadia_id = e.id AND ad.direccion = 'devolucion'
   WHERE c.tipo_servicio = 'guarderia_dia'
     AND (p_mascota_id IS NULL OR c.mascota_id = p_mascota_id)
     AND user_tiene_acceso_a_mascota(c.mascota_id)
     /* Firme, o el hold VIGENTE de esta familia (D-319). El vencido no: es un
        intento que ya no existe, y mostrarlo sería ofrecer algo que se cae. */
     AND (c.estado_reserva = 'pagada'
          OR (c.estado_reserva = 'pendiente_pago' AND c.expira_en > now()))
   ORDER BY c.fecha DESC, c.id;
END $fn$;

REVOKE EXECUTE ON FUNCTION public.obtener_mis_estadias_guarderia(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_mis_estadias_guarderia(uuid) TO authenticated;

-- ══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $cint$
DECLARE
  v_rol text := current_user; v_ajeno uuid; v_n int; v_acl text;
BEGIN
  SELECT array_to_string(proacl,' ') INTO v_acl FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_mis_estadias_guarderia';
  IF v_acl ILIKE '%anon=%' THEN RAISE EXCEPTION 'CINTURON: anon con EXECUTE (%)', v_acl; END IF;
  IF v_acl NOT ILIKE '%authenticated=%' THEN RAISE EXCEPTION 'CINTURON: authenticated sin EXECUTE (%)', v_acl; END IF;

  /* 🔴 EL DISCRIMINADOR: un usuario sin mascotas NO recibe filas.
     Con 0 citas de guardería hoy, un «devolvió vacío» no prueba nada por sí
     solo — pero **prueba que el filtro por acceso no explota ni devuelve de
     más**, que es lo único verificable antes de que exista la primera reserva.
     *Se declara qué prueba y qué no: un verde que se lee como más de lo que
     mide es un verde flojo.* */
  SELECT u.id INTO v_ajeno FROM auth.users u
   WHERE NOT EXISTS (SELECT 1 FROM familia_miembro fm WHERE fm.user_id=u.id AND fm.hasta IS NULL)
   LIMIT 1;
  IF v_ajeno IS NOT NULL THEN
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_ajeno, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    SELECT count(*) INTO v_n FROM public.obtener_mis_estadias_guarderia(NULL);
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF v_n <> 0 THEN
      RAISE EXCEPTION 'CINTURON: un usuario sin familia recibio % fila(s)', v_n;
    END IF;
  END IF;

  RAISE NOTICE 'CINTURON VERDE · anon fuera, authenticated adentro · el ajeno recibe 0 filas (⚠️ con 0 citas de guarderia esto prueba el gate, NO el contenido)';
END
$cint$;

COMMIT;
