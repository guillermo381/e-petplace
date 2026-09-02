/* ═══════════════════════════════════════════════════════════════════════════
   S112-A2g · EL REFUGIO PUEDE LEER SU PROPIO BORRADOR
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.** Una funcion nueva.

   Lo midio C, y su razonamiento es el que decide la forma:

     · `obtener_adoptable` lee `v_adoptables_publicos` ⇒ **rebota para un
       borrador**, que es exactamente el caso que hay que editar (Kira).
     · `obtener_mis_adoptables` trae el resumen de la lista, no la ficha.
     · ⇒ **abrir el formulario con los campos vacios sobre una funcion que
       acepta `Partial` BORRA la historia de un animal con un solo guardado.**

   Por eso el toque de la tarjeta hoy dice que falta en vez de navegar. *Frenar
   una pantalla porque su lector no existe es la decision correcta; montarla
   igual habria destruido datos en el primer uso.*

   ── FUNCION NUEVA Y NO UN BRAZO EN `obtener_adoptable`. La vidriera es
      **anonima**: meterle una rama «si sos el dueño devolve mas» pondria un
      camino privilegiado adentro de la funcion que `anon` ejecuta. *La puerta
      publica y la privada no comparten cuerpo.*
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_mi_adoptable(p_publicacion_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_cta uuid; v_r jsonb; v_base text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT cuenta_comercial_id INTO v_cta FROM adopcion_publicacion WHERE id = p_publicacion_id;
  IF v_cta IS NULL THEN RAISE EXCEPTION 'publicacion_no_existe' USING ERRCODE='22023'; END IF;
  IF NOT public._user_gestiona_cuenta_refugio(v_cta) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501';
  END IF;

  v_base := 'https://zyltipqscdsdsxnjclhp.supabase.co/storage/v1/object/public/adopcion-fotos/';

  SELECT jsonb_build_object(
    'publicacion_id', p.id,
    'mascota_id',     m.id,
    /* Del animal: lo que la ficha de edicion muestra arriba, sin editar. */
    'nombre',    m.nombre,
    'especie',   m.especie,
    'sexo',      m.sexo,
    'fecha_nacimiento', m.fecha_nacimiento,
    'fecha_nacimiento_precision', m.fecha_nacimiento_precision,
    'talla',     m.talla,
    'esterilizado', m.esterilizado,
    'microchip', m.microchip,
    'remetfu',   m.remetfu,
    'foto_url',  m.foto_url,
    'estado', CASE WHEN m.estado_vida = 'fallecida' THEN 'memorial' ELSE p.estado END,
    /* La `FichaEditable` COMPLETA: es lo que el formulario prellena, y por eso
       viaja entera aunque algo sea NULL — **un campo ausente y un campo vacio
       se guardan igual con `Partial`, y uno de los dos borra.** */
    'ficha', jsonb_build_object(
      'ingresado_en',   p.ingresado_en,
      'ciudad_id',      p.ciudad_id,
      'zona',           p.zona,
      'senas',          p.senas,
      'origen_rescate', p.origen_rescate,
      'fecha_cesion',   p.fecha_cesion,
      'estado_vacunal', p.estado_vacunal,
      'desparasitado',  p.desparasitado,
      'urgente',        p.urgente,
      'bono_monto',     p.bono_monto,
      'bono_destino',   p.bono_destino,
      'historia',       p.historia,
      'convive_perros', p.convive_perros,
      'convive_gatos',  p.convive_gatos,
      'convive_ninos',  p.convive_ninos,
      'pareja_id',      p.pareja_id),
    /* Con su ID: para reordenar y borrar hace falta el id, no la URL. */
    'fotos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('foto_id', f.id, 'url', v_base || f.path,
                                          'orden', f.orden, 'path', f.path)
                       ORDER BY f.orden)
        FROM adopcion_foto f WHERE f.publicacion_id = p.id), '[]'::jsonb),
    'veredicto_publicacion', public.evaluar_esterilizacion_adoptable(p.id)
  ) INTO v_r
  FROM adopcion_publicacion p JOIN mascotas m ON m.id = p.mascota_id
  WHERE p.id = p_publicacion_id;

  RETURN v_r;
END $fn$;

REVOKE ALL ON FUNCTION public.obtener_mi_adoptable(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_mi_adoptable(uuid) TO authenticated;

DO $cint$
DECLARE v_p uuid; v_r jsonb; v_admin uuid;
BEGIN
  -- ① 🔴 `anon` no lo alcanza: la puerta privada no es la publica.
  IF has_function_privilege('anon','public.obtener_mi_adoptable(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: anon lee borradores de refugios';
  END IF;

  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin::text, 'role','authenticated')::text, true);

  -- ② ✅ POSITIVO SOBRE UN BORRADOR REAL: es el caso que la vidriera rebota.
  SELECT id INTO v_p FROM adopcion_publicacion WHERE estado='borrador' LIMIT 1;
  IF v_p IS NOT NULL THEN
    v_r := public.obtener_mi_adoptable(v_p);
    IF v_r IS NULL OR NOT (v_r ? 'ficha') OR NOT (v_r ? 'fotos') THEN
      RAISE EXCEPTION 'CINTURON ROJO ②: la ficha de un borrador vino incompleta';
    END IF;
    IF (v_r->'ficha'->>'historia') IS NULL AND (v_r->'ficha'->>'convive_perros') IS NULL THEN
      RAISE EXCEPTION 'CINTURON ROJO ②b: la FichaEditable vino vacia — prellenar con esto borraria';
    END IF;
    -- ②c CONTROL: la vidriera SI rebota ese mismo borrador. Sin este brazo, ②
    --     pasaria aunque `obtener_adoptable` ya lo devolviera y esta funcion
    --     no hiciera falta.
    BEGIN
      PERFORM public.obtener_adoptable(v_p);
      RAISE EXCEPTION 'CINTURON ROJO ②c: la vidriera devuelve borradores — hay una fuga';
    EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
  ELSE
    RAISE EXCEPTION 'CINTURON: no hay borrador para medir — el brazo no puede dar verde por vacio';
  END IF;

  -- ③ 🔴 Una publicacion que no existe rebota hablando.
  BEGIN
    PERFORM public.obtener_mi_adoptable('00000000-0000-0000-0000-000000000000'::uuid);
    RAISE EXCEPTION 'CINTURON ROJO ③: una publicacion inexistente no rebotó';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;

  RAISE NOTICE 'CINTURON A2g: 3 brazos verdes (2 rojos producidos, 1 control positivo, 1 negativo)';
END $cint$;

COMMIT;
