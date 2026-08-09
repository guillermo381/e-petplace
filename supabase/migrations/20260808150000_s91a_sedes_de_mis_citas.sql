-- ════════════════════════════════════════════════════════════════════════════
-- S91-A · EL DÓNDE DE MI PROPIA CITA — lector ANGOSTO, no grant global
--
-- ── EL INCIDENTE (segunda mitad del 42501, aislado por C) ──────────────────
-- `obtenerMisGroomings` hace
--     .from('prestadores').select('id, nombre_comercial, direccion, ciudad')
-- y desde el REVOKE de hoy **`direccion` no tiene grant** ⇒ 42501 y **el hub
-- entero cae por UNA columna**. Con `id, nombre_comercial` solo, pasa.
--
-- ── POR QUÉ LA CURA **NO** ES EL GRANT, medido ─────────────────────────────
-- La mesa pidió verificar si `direccion` es de vitrina o de privacidad antes de
-- abrirla. **Medido: `v_prestadores_publicos` NO expone `direccion`** ⇒
-- concederla a `authenticated` sería EXPOSICIÓN NUEVA, no una restauración: la
-- policy `prestadores_public` da acceso de FILA a todo negocio activo, así que
-- cualquier autenticado leería la dirección exacta de TODOS. *Eso es
-- precisamente lo que S84 cerró, y sería deshacerlo por la puerta de atrás para
-- arreglar un hub.*
--
-- ── LA CURA: el molde que la casa ya tiene DOS veces ───────────────────────
-- `obtener_nombres_negocio_por_presupuesto` (D-455) y
-- `obtener_nombres_reservador_por_cita` (S91) son el mismo patrón: **DEFINER
-- angosta, keyed por el vínculo que autoriza, exponiendo lo mínimo.**
--
-- **La autorización se DERIVA en el servidor, no se toma del argumento:** los
-- ids que llegan son un FILTRO, jamás un permiso. La función calcula sola con
-- qué prestadores el llamante tiene cita — pedir la dirección de un negocio
-- ajeno devuelve CERO filas, no un error: no hay nada que negar porque no hay
-- nada que contar.
--
-- ── VEDA 76(g): NO RIGE ── función nueva, aditiva, sin backfill.
-- ── REVERSA: `docs/relevamientos/2026-08-08-s91a-REVERSA-sedes-de-mis-citas.sql`
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE FUNCTION public.obtener_sedes_de_mis_citas(p_prestador_ids uuid[])
 RETURNS TABLE (id uuid, nombre_comercial text, direccion text, ciudad text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'no_autenticado';
  END IF;

  RETURN QUERY
  SELECT p.id, p.nombre_comercial, p.direccion, p.ciudad
    FROM prestadores p
   WHERE p.id = ANY (coalesce(p_prestador_ids, '{}'::uuid[]))
     -- EL GATE: existe una cita de una mascota de MI familia con ese negocio.
     -- Es el mismo vínculo que ya autoriza a ver la cita; la dirección es el
     -- «dónde» de algo que la persona ya tiene reservado.
     AND EXISTS (
       SELECT 1
         FROM evento_cita_servicio ecs
         JOIN mascotas m ON m.id = ecs.mascota_id
         JOIN familia_miembro fm ON fm.familia_id = m.familia_id
        WHERE ecs.prestador_id = p.id
          AND fm.user_id = v_uid
          AND fm.hasta IS NULL
     );
END;
$function$;

COMMENT ON FUNCTION public.obtener_sedes_de_mis_citas(uuid[]) IS
  'S91: el DÓNDE de una cita propia. Nace porque el hub del dueño pedía `direccion` directo de `prestadores` y esa columna quedó sin grant al cerrar la fuga de S91 — y el grant NO era la cura: `v_prestadores_publicos` no expone la dirección, así que concederla habría dado la dirección exacta de todo negocio activo a cualquier autenticado (deshaciendo S84 por la puerta de atrás). Molde D-455: DEFINER angosta keyed por el vínculo que autoriza. Los ids que llegan son FILTRO, jamás permiso: la autorización se deriva del server (tener una cita con ese negocio). Un negocio sin cita devuelve CERO filas, no un error.';

REVOKE ALL ON FUNCTION public.obtener_sedes_de_mis_citas(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_sedes_de_mis_citas(uuid[]) TO authenticated;

DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n
    FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace,
         LATERAL unnest(coalesce(p.proacl,'{}'::aclitem[])) a(e)
   WHERE ns.nspname='public' AND p.proname='obtener_sedes_de_mis_citas'
     AND (a.e::text LIKE 'anon=%' OR a.e::text LIKE '=%');
  IF n <> 0 THEN RAISE EXCEPTION 'CINTURON L-140: la función nueva quedó con anon/PUBLIC'; END IF;

  IF has_column_privilege('authenticated','public.prestadores','direccion','SELECT') THEN
    RAISE EXCEPTION 'CINTURON: direccion se abrió a authenticated — la cura era el lector, no el grant';
  END IF;
END $$;

COMMIT;
