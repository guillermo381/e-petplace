-- ═══════════════════════════════════════════════════════════════════════════
-- S115-A · `v_mail` ESTABA FUERA DE ALCANCE — y PL/pgSQL sólo lo dice al correr
--
-- 🔴 DEFECTO MÍO, DE LA MIGRACIÓN ANTERIOR. Declaré `v_mail` dentro de un
--    bloque anidado (`DECLARE ... BEGIN ... END;`) y lo usé DESPUÉS del `END`.
--    PL/pgSQL compila PEREZOSO: la migración aplicó limpia, `db push` dijo
--    `Finished`, y la función reventó con `42703: column "v_mail" does not
--    exist` **la primera vez que un pago se aprobó**.
--
--    *Un `Finished` sobre una función con un error de alcance no es un verde:
--    es que nadie la ejecutó todavía.* Es la misma clase que `L-114` —build
--    verde ≠ contrato real— un piso más abajo, en el motor.
--
-- 🔴 LO QUE SÍ FUNCIONÓ, y por eso el daño fue cero: el respaldo del outbox
--    atrapó el rebote, **el pago NO se cayó**, y el error quedó escrito en
--    `sri_error` con su SQLSTATE. La defensa en profundidad hizo exactamente
--    su trabajo — el documento existe, dice `pendiente_manual`, y dice por qué.
--
-- Y la causa de que llegara a aplicarse: **la migración anterior fue sin
-- cinturón**. Ésta trae el que faltaba, y ejerce la función DE VERDAD.
--
-- EDGES A DESPLEGAR (`L-536`): ninguna. Veda 76(g): NO RIGE.
-- Reversa: S115-A-REVERSA-20260912670000-vmail-scope.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.resolver_receptor_fiscal(p_user_id uuid, p_monto numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_tope numeric; v_tp public.tax_profiles; v_mail text;
BEGIN
  SELECT valor::numeric INTO v_tope FROM public.app_config
   WHERE clave = 'fiscal_tope_consumidor_final';
  IF v_tope IS NULL THEN
    /* Sin tope configurado no se adivina uno: se dice. */
    RETURN jsonb_build_object('resuelto', false, 'motivo', 'sin_tope_configurado');
  END IF;

  SELECT * INTO v_tp FROM public.tax_profiles
   WHERE user_id = p_user_id AND es_predeterminado LIMIT 1;

  IF v_tp.id IS NOT NULL THEN
    RETURN jsonb_build_object('resuelto', true, 'tax_profile_id', v_tp.id,
      'tipo_identificacion', v_tp.tipo_identificacion, 'identificacion', v_tp.identificacion,
      'razon_social', v_tp.razon_social, 'direccion', v_tp.direccion, 'email', v_tp.email);
  END IF;

  /* 🔴 POR ENCIMA DEL TOPE NO SE INVENTA UN CONSUMIDOR FINAL. La captura de la
     cédula todavía no existe (es de C) ⇒ el documento ESPERA. *Facturar a
     «consumidor final» algo que por ley exige identificación es emitir mal a
     propósito para no dejar un hueco visible.* */
  IF p_monto > v_tope THEN
    RETURN jsonb_build_object('resuelto', false, 'motivo', 'supera_tope_sin_identificacion', 'tope', v_tope);
  END IF;

  /* ── EL CORREO DEL CONSUMIDOR FINAL ───────────────────────────────────────
     🔴 TRES FUENTES, EN ORDEN, Y NINGUNA INVENTADA:
       ① `tax_profiles.email` — el perfil fiscal. Ya resolvio arriba.
       ② `auth.users.email` — **el correo con el que la persona entro**. Cubre
          93 de los 107 pagos aprobados (medido). *No es inventar: es el unico
          correo que la persona nos dio, y es a donde ya le llega todo lo demas.*
       ③ no hay tercera. Para un invitado real —14 de 107, sin usuario por
          ninguna via— **no existe un correo en ninguna tabla**: `compras` y
          `pedidos` no tienen columna de email.

     Con ③ el documento NO se emite: queda `esperando_receptor`, igual que por
     encima del tope. *Mandar la factura a una casilla de la casa haria que
     recibamos las facturas de nuestros clientes; a una inventada, que el
     comprobante viaje a una direccion que no es de nadie.* La cura de raiz es
     de producto y esta nombrada: **el checkout de invitado pide un correo** —
     que hace falta igual para mandarle su factura, con Factuplan o sin el. */
  SELECT au.email INTO v_mail FROM auth.users au
   WHERE au.id = p_user_id AND au.email IS NOT NULL AND au.email <> '';

  IF v_mail IS NULL THEN
    RETURN jsonb_build_object('resuelto', false, 'motivo', 'sin_correo_para_el_receptor',
      'detalle', 'Compra de invitado sin correo: no hay a quien enviarle el comprobante.');
  END IF;

  RETURN jsonb_build_object('resuelto', true, 'tax_profile_id', NULL,
    'tipo_identificacion', 'consumidor_final', 'identificacion', '9999999999999',
    'razon_social', 'CONSUMIDOR FINAL', 'direccion', NULL, 'email', v_mail);
END $function$;


-- ── CINTURÓN — el que faltó, y ejerce la función de verdad ──────────────────
DO $cint$
DECLARE v_u uuid; v_rec jsonb; v_mail text;
BEGIN
  /* 🔴 SE EJECUTA, no se inspecciona. Un `CREATE FUNCTION` que compila no dice
     nada sobre el alcance de sus variables: eso sólo aparece corriendo. */
  SELECT au.id INTO v_u FROM auth.users au
   WHERE au.email IS NOT NULL AND au.email <> '' LIMIT 1;
  IF v_u IS NULL THEN RAISE EXCEPTION 'cinturon: no hay usuario con correo'; END IF;

  v_rec := public.resolver_receptor_fiscal(v_u, 10);
  IF (v_rec->>'resuelto')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'cinturon: no resolvio para un usuario con correo — %', v_rec;
  END IF;
  IF COALESCE(v_rec->>'email','') = '' THEN
    RAISE EXCEPTION 'cinturon: resolvio SIN correo — %', v_rec;
  END IF;

  /* 🔴 EL ROJO: un usuario que no existe NO tiene correo, y el documento tiene
     que ESPERAR en vez de salir con una casilla inventada. */
  v_rec := public.resolver_receptor_fiscal('00000000-0000-0000-0000-000000000000'::uuid, 10);
  IF (v_rec->>'resuelto')::boolean IS NOT FALSE
     OR v_rec->>'motivo' <> 'sin_correo_para_el_receptor' THEN
    RAISE EXCEPTION 'cinturon ROJO: un invitado sin correo resolvio igual — %', v_rec;
  END IF;

  /* Y el brazo que discrimina: por encima del tope sigue mandando la falta de
     identificacion, no la del correo. Sin esto, un solo motivo taparia al otro. */
  v_rec := public.resolver_receptor_fiscal(v_u, 99999);
  IF v_rec->>'motivo' <> 'supera_tope_sin_identificacion' THEN
    RAISE EXCEPTION 'cinturon: el tope dejo de mandar — %', v_rec;
  END IF;

  RAISE NOTICE 'cinturon receptor: con correo OK · invitado espera · tope intacto';
END $cint$;
