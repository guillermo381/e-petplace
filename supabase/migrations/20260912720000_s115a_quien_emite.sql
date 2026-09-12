-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · QUIÉN EMITE LA FACTURA DE ESTA COMPRA — el lector que C necesita
--
-- 🔴 NO ES EL RECEPTOR, ES EL EMISOR. El receptor ya lo resuelve
--    `resolver_receptor_fiscal` (a quién se le factura). Esto contesta la otra
--    mitad: **quién le factura a la familia** — nosotros en `reventa_pura`, el
--    vendedor en `marketplace_fachada`. *Sin esto, la familia paga sin saber
--    que su comprobante va a llegar con otro nombre, y el primer «¿por qué mi
--    factura dice otra empresa?» llega a soporte sin que nadie pueda
--    explicarlo.*
--
-- 🔴 DEVUELVE UNA LISTA, NO UN VALOR, Y NO ES PRECAUCIÓN: **ya pasó**. Medido
--    el 11-sep-2026: hay una compra real con pedidos de DOS cuentas y DOS
--    modelos distintos, y **nada en el esquema lo impide** (cero constraints
--    sobre `pedidos.cuenta_comercial_id` por compra). Una compra mixta produce
--    DOS facturas de DOS emisores, y la pantalla tiene que poder decirlo antes
--    de cobrar.
--
--    *Si esto devolviera un valor único, el día de la primera compra mixta
--    grande la mitad de la plata quedaría atribuida al emisor equivocado — y
--    el error se vería perfectamente normal.*
--
-- EDGES A DESPLEGAR (`L-536`): ninguna. Veda 76(g): NO RIGE.
-- Reversa: S115-A-REVERSA-20260912720000-quien-emite.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.fiscal_quien_emite(
  p_origen_tipo text,     -- 'compra' | 'cita' | 'bono' | 'suscripcion' | 'programa' | 'guarderia'
  p_origen_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid(); v_e public.fiscal_emisor;
  v_emisores jsonb; v_dueno uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_sesion');
  END IF;
  SELECT * INTO v_e FROM public.fiscal_emisor LIMIT 1;

  IF p_origen_tipo = 'compra' THEN
    /* 🔴 SE PREGUNTA POR EL DUEÑO ANTES DE CONTESTAR: el monto por emisor es
       plata de esta familia. *Un lector que contesta sobre el carrito de
       cualquiera es una fuga que no falla.* */
    SELECT c.user_id INTO v_dueno FROM public.compras c WHERE c.id = p_origen_id;
    IF v_dueno IS DISTINCT FROM v_uid THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'no_es_tuyo');
    END IF;

    SELECT jsonb_agg(x ORDER BY x->>'razon_social') INTO v_emisores FROM (
      SELECT jsonb_build_object(
               'modelo', cc.modelo_comercial::text,
               'emite', CASE WHEN cc.modelo_comercial::text = 'marketplace_fachada'
                             THEN 'el_tercero' ELSE 'la_casa' END,
               'razon_social', CASE WHEN cc.modelo_comercial::text = 'marketplace_fachada'
                                    THEN cc.razon_social ELSE v_e.razon_social END,
               'monto', round(sum(pi.cantidad * pi.precio_unitario), 2)
             ) AS x
        FROM public.pedidos p
        JOIN public.cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
        JOIN public.pedido_items pi ON pi.pedido_id = p.id
       WHERE p.compra_id = p_origen_id
       GROUP BY cc.id, cc.modelo_comercial, cc.razon_social, v_e.razon_social
    ) z;

  ELSE
    /* Los sujetos de servicio tienen UN prestador y por lo tanto UN emisor. */
    SELECT jsonb_agg(jsonb_build_object(
             'modelo', cc.modelo_comercial::text,
             'emite', CASE WHEN cc.modelo_comercial::text = 'marketplace_fachada'
                           THEN 'el_tercero' ELSE 'la_casa' END,
             'razon_social', CASE WHEN cc.modelo_comercial::text = 'marketplace_fachada'
                                  THEN cc.razon_social ELSE v_e.razon_social END,
             'monto', NULL))
      INTO v_emisores
      FROM public.cuentas_comerciales cc
     WHERE cc.id = (
       SELECT pr.cuenta_comercial_id FROM public.prestadores pr WHERE pr.id = (
         CASE p_origen_tipo
           WHEN 'cita'        THEN (SELECT c.prestador_id FROM public.evento_cita_servicio c WHERE c.id = p_origen_id)
           WHEN 'bono'        THEN (SELECT b.prestador_id FROM public.bonos b WHERE b.id = p_origen_id)
           WHEN 'suscripcion' THEN (SELECT s.prestador_id FROM public.suscripciones_servicio s WHERE s.id = p_origen_id)
           WHEN 'programa'    THEN (SELECT pc.prestador_id FROM public.programas_contratados pc WHERE pc.id = p_origen_id)
           WHEN 'guarderia'   THEN (SELECT g.prestador_id FROM public.guarderia_suscripciones g WHERE g.id = p_origen_id)
         END));
  END IF;

  IF v_emisores IS NULL THEN
    /* 🔴 FAIL-CLOSED Y HABLADO: sin emisor resuelto NO se dice «la casa» por
       defecto. *Un default acá le prometería a la familia una factura nuestra
       sobre algo que factura otro.* */
    RETURN jsonb_build_object('ok', false, 'codigo', 'emisor_no_resuelto',
      'origen_tipo', p_origen_tipo);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'emisores', v_emisores,
    'cuantas_facturas', jsonb_array_length(v_emisores),
    /* 🔴 EL CORREO SE PIDE SIEMPRE — firma del founder, 11-sep-2026: *la
       familia necesita su comprobante venga de quien venga; lo que cambia es
       quién lo manda, no si hace falta.* Viaja como dato para que ninguna
       pantalla lo deduzca del modelo. */
    'pedir_correo', true
  );
END $function$;

REVOKE EXECUTE ON FUNCTION public.fiscal_quien_emite(text, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fiscal_quien_emite(text, uuid) TO authenticated, service_role;

DO $cint$
DECLARE v jsonb; v_mal boolean;
BEGIN
  /* 🔴 ROJO 1 · sin sesión no contesta. */
  v := public.fiscal_quien_emite('compra', '00000000-0000-0000-0000-000000000000'::uuid);
  IF (v->>'codigo') <> 'sin_sesion' THEN
    RAISE EXCEPTION 'cinturon ROJO: contesto sin sesion — %', v;
  END IF;

  /* 🔴 ROJO 2 · anon no lo ejecuta. */
  SELECT has_function_privilege('anon','public.fiscal_quien_emite(text, uuid)','EXECUTE') INTO v_mal;
  IF v_mal THEN RAISE EXCEPTION 'L-140: anon puede preguntar quien emite'; END IF;

  /* 🔴 ROJO 3 · la compra MIXTA que ya existe tiene que devolver DOS emisores.
     *Sin este brazo, una funcion que siempre devolviera uno pasaria los otros
     dos rojos con honores.* */
  DECLARE v_mixta uuid; v_dueno uuid; v_rol text := current_user;
  BEGIN
    SELECT p.compra_id INTO v_mixta FROM public.pedidos p
      JOIN public.cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
     WHERE p.compra_id IS NOT NULL
     GROUP BY p.compra_id HAVING count(DISTINCT cc.modelo_comercial) > 1 LIMIT 1;
    IF v_mixta IS NOT NULL THEN
      SELECT c.user_id INTO v_dueno FROM public.compras c WHERE c.id = v_mixta;
      PERFORM set_config('request.jwt.claims',
        json_build_object('sub', v_dueno, 'role', 'authenticated')::text, true);
      EXECUTE 'SET LOCAL ROLE authenticated';
      v := public.fiscal_quien_emite('compra', v_mixta);
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      IF (v->>'ok')::boolean IS NOT TRUE OR (v->>'cuantas_facturas')::int < 2 THEN
        RAISE EXCEPTION 'cinturon ROJO: la compra MIXTA no devolvio dos emisores — %', v;
      END IF;
      RAISE NOTICE 'cinturon quien_emite: la compra mixta devuelve % facturas', v->>'cuantas_facturas';
    ELSE
      RAISE EXCEPTION 'cinturon: no hay compra mixta — el brazo que discrimina no se pudo correr';
    END IF;
  END;
  RAISE NOTICE 'cinturon quien_emite: sin sesion corta · anon afuera · lista y no valor';
END $cint$;
