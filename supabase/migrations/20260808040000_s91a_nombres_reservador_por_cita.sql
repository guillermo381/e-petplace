-- ============================================================================
-- S91-A · `obtener_nombres_reservador_por_cita` — el pedido de B, con su gate
-- ============================================================================
-- CONTRATO LITERAL DE B (76b), aplicado sin retoques:
--   `obtener_nombres_reservador_por_cita(p_cita_ids uuid[])`
--   RETURNS TABLE(cita_id uuid, nombre text)
--
-- POR QUÉ ES UNA FUNCIÓN Y NO UNA COLUMNA — la medición de B, verificada por
-- A antes de construir: `profiles_select` es `auth.uid() = id`, o sea **cada
-- quien lee SOLO su propia fila**. Un embed `profiles(nombre)` desde el
-- lector del histórico no devolvería un nombre: **devolvería VACÍO**. Ese es
-- el modo de falla peor de todos —un dato ausente que parece un dato
-- ausente— y es exactamente por lo que S74 hizo DEFINER en su momento.
-- *Cualquiera probaría el embed primero; B lo midió y trajo el porqué.*
--
-- EL GATE ES EL DE S74, ESPEJADO Y NO INVENTADO: se leyó
-- `obtener_contacto_reserva_cita` con `pg_get_functiondef` y se copió su
-- predicado —`empleado_tiene_rol(prestador, ARRAY['dueño','profesional',
-- 'recepcion'])`— literal. Dos gates parecidos que divergen es cómo se
-- pierde una frontera.
--
-- ── LA FRONTERA DE S74 SE CONSERVA ENTERA: **SOLO EL NOMBRE.** ─────────────
-- Sin teléfono, sin correo. El correo del pet parent B lo ELEVÓ a la mesa
-- como decisión de LETRA (qué ve un prestador de una familia), y esta
-- migración **no la toma**: ensanchar una frontera de privacidad de costado,
-- dentro de una función que se pidió para dibujar un chip, sería exactamente
-- la clase de decisión que no debe ocurrir en una migración.
--
-- ── EL WALK-IN DEVUELVE FILA CON NOMBRE NULL, NO FILA AUSENTE ─────────────
-- Contrato de B y es la decisión correcta: una cita de mostrador no tiene
-- `user_id`. Si la fila faltara, el consumidor no podría distinguir «no hay
-- reservador» de «no tengo permiso para verlo» ni de «esa cita no existe» —
-- tres cosas distintas colapsadas en una ausencia. La fila presente con
-- `nombre = NULL` dice UNA sola: no hay a quién nombrar.
--
-- ── EL GATE ES POR CITA, NO POR LOTE: LA MEZCLA NO CONTAMINA ──────────────
-- Cada cita se evalúa contra SU prestador. Un lote con citas de dos negocios
-- devuelve las del negocio propio y **omite** las ajenas — no rebota el lote
-- entero (eso volvería inútil un lector de lote) ni las devuelve (eso sería
-- la fuga). *Omitir es la única de las tres que no miente ni inutiliza.*
-- Y las citas inexistentes se omiten igual: un id inventado no es un error,
-- es un id que no existe.
--
-- Veda 76(g): NO RIGE — solo DDL de función, cero datos.
-- D-662: nadie la consulta todavía (B enciende `opcionesPersona` cuando el
-- wrapper aterrice), así que no hay bundle vivo que dependa de ella.
-- Reversa: docs/relevamientos/2026-08-08-s91a-REVERSA-nombres-reservador.sql
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_nombres_reservador_por_cita(
  p_cita_ids uuid[]
)
 RETURNS TABLE(cita_id uuid, nombre text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  IF p_cita_ids IS NULL OR array_length(p_cita_ids, 1) IS NULL THEN
    RETURN; -- lote vacío: cero filas, jamás un error
  END IF;

  RETURN QUERY
  SELECT c.id, pr.nombre
    FROM evento_cita_servicio c
    LEFT JOIN profiles pr ON pr.id = c.user_id
   WHERE c.id = ANY(p_cita_ids)
     AND c.prestador_id IS NOT NULL
     -- El gate, POR CITA: cada una contra SU negocio. Las ajenas se omiten.
     AND public.empleado_tiene_rol(
           c.prestador_id, ARRAY['dueño', 'profesional', 'recepcion']);
END;
$function$;

COMMENT ON FUNCTION public.obtener_nombres_reservador_por_cita(uuid[]) IS
  'S91 (pedido de B): nombre de quien reservó, por cita, para el chip de PERSONA del histórico. UN solo campo — la frontera de S74 (sin teléfono ni correo) se conserva entera. Es función y no columna porque profiles_select es auth.uid()=id: un embed devolvería VACÍO, no un nombre. Walk-in = fila con nombre NULL, jamás fila ausente. Gate por CITA: las de otro negocio se omiten.';

REVOKE EXECUTE ON FUNCTION public.obtener_nombres_reservador_por_cita(uuid[]) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_nombres_reservador_por_cita(uuid[]) TO authenticated;

DO $$
DECLARE v_acl text; v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_nombres_reservador_por_cita';
  IF v_n <> 1 THEN RAISE EXCEPTION 'cinturon_reservador: % sobrecargas', v_n; END IF;

  SELECT p.proacl::text INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_nombres_reservador_por_cita';
  IF v_acl LIKE '%anon=%' THEN RAISE EXCEPTION 'cinturon_reservador: anon en proacl: %', v_acl; END IF;

  -- LA FRONTERA, MEDIDA EN EL CUERPO: ni teléfono ni correo pueden salir de
  -- acá. Un guard de forma, porque el día que alguien "solo agregue el
  -- teléfono" no va a leer el comentario de arriba.
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='obtener_nombres_reservador_por_cita'
               AND (p.prosrc LIKE '%telefono%' OR p.prosrc LIKE '%email%')) THEN
    RAISE EXCEPTION 'cinturon_reservador: la funcion nombra telefono o email — la frontera S74 se rompio';
  END IF;
END $$;

COMMIT;
