/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · EL LECTOR DE PLANES — para que «ya tienes uno» pueda LLEVAR ahí
   ═══════════════════════════════════════════════════════════════════════════
   `ya_tienes_plan_activo` nombra el rebote y **lleva el id del plan en su
   mensaje**. Pero la falla de un wrapper es `{ok:false, codigo, mensaje}` y
   **no puede cargar datos**, y parsear el mensaje para sacar el id **está
   prohibido** (regla 35: sin string matching sobre mensajes).

   > **Sin un lector, el rebote sabe decir «ya tenés uno» y no sabe decir
   > DÓNDE** — que es la mitad que el founder pidió: *«C lleva al plan que ya
   > existe en vez de mostrar un error»*.

   Nace `obtener_mis_planes_guarderia()`: los planes de la familia de quien
   pregunta, el activo primero. *No hace falta pasarle nada — la familia sale
   de la sesión, y un lector que la recibe por parámetro es una puerta para
   mirar la de otro.*

   ⚖️ VEDA 76(g): NO RIGE. ↩️ REVERSA escrita ANTES:
      `docs/relevamientos/S107-A-REVERSA-20260901080000-lector-planes.sql`
   ═══════════════════════════════════════════════════════════════════════════ */
CREATE OR REPLACE FUNCTION public.obtener_mis_planes_guarderia()
RETURNS TABLE (
  suscripcion_id   uuid,
  prestador_id     uuid,
  prestador_nombre text,
  mascota_id       uuid,
  precio_mensual   numeric,
  estado           text,
  periodo_desde    date,
  periodo_hasta    date,
  direccion_id     uuid
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_fam uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm
   WHERE fm.user_id = auth.uid() AND fm.hasta IS NULL LIMIT 1;
  IF v_fam IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT s.id, s.prestador_id, pr.nombre_comercial, s.mascota_id,
         s.precio_mensual, s.estado, s.periodo_desde, s.periodo_hasta, s.direccion_id
    FROM guarderia_suscripciones s
    JOIN prestadores pr ON pr.id = s.prestador_id
   WHERE s.familia_id = v_fam
   /* El activo primero: es el único sobre el que la familia puede actuar. */
   ORDER BY (s.estado = 'activa') DESC, s.created_at DESC;
END $function$;

REVOKE EXECUTE ON FUNCTION public.obtener_mis_planes_guarderia() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_mis_planes_guarderia() TO authenticated;

DO $cinturon$
DECLARE v_rol text := current_user; v_u uuid; v_n int; v_prim text; v_ajeno int;
BEGIN
  SELECT s.autorizada_por INTO v_u FROM guarderia_suscripciones s WHERE s.estado='activa' LIMIT 1;
  EXECUTE format('SET LOCAL request.jwt.claims = %L', json_build_object('sub',v_u,'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  SELECT count(*)::int INTO v_n FROM public.obtener_mis_planes_guarderia();
  SELECT p.estado INTO v_prim FROM public.obtener_mis_planes_guarderia() p LIMIT 1;
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  /* 🔑 El brazo que discrimina: una familia SIN planes tiene que ver CERO, no
     los de otra. Sin él, un lector que ignorara la familia daría el mismo
     verde. */
  SELECT fm.user_id INTO v_u FROM familia_miembro fm
   WHERE fm.hasta IS NULL
     AND NOT EXISTS (SELECT 1 FROM guarderia_suscripciones s WHERE s.familia_id=fm.familia_id) LIMIT 1;
  EXECUTE format('SET LOCAL request.jwt.claims = %L', json_build_object('sub',v_u,'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  SELECT count(*)::int INTO v_ajeno FROM public.obtener_mis_planes_guarderia();
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  RAISE NOTICE E'\n═══ CINTURON · el lector de planes ═══\n  la familia con plan ve % (el primero: %)\n  🔑 una familia SIN planes ve % (esperado 0)', v_n, v_prim, v_ajeno;
  IF v_n < 1 OR v_prim <> 'activa' THEN RAISE EXCEPTION 'CINTURON ROJO: la familia con plan ve % y el primero es %', v_n, v_prim; END IF;
  IF v_ajeno <> 0 THEN RAISE EXCEPTION 'CINTURON ROJO: una familia sin planes ve % — el lector no filtra', v_ajeno; END IF;
END $cinturon$;
