/* ═══════════════════════════════════════════════════════════════════════════
   S112-A3 · LA REGLA DE LOS SEIS MESES (OM 019, art. 6.7)
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE** — una funcion nueva y una puerta reescrita.

   ── UNA SOLA FUNCION DE CRITERIO, DOS PUERTAS. Hoy se monta en
      `cambiar_estado_adoptable` (→ `publicada`); **`firmar_acta_adopcion` monta
      LA MISMA en A9**. Escribir el criterio dos veces es como divergen: el dia
      que la regla cambie, una puerta se entera y la otra no.

   ── 🔴 SIN FECHA DE NACIMIENTO **NO SE PUEDE DECIDIR, Y SE DICE.**
      Un rescate sin fecha es lo normal, no un dato faltante que haya que
      rellenar — pero **no se puede certificar el cumplimiento de una regla
      sobre la edad sin saber la edad**. Las dos salidas malas:
        · dejar pasar ⇒ adultos sin esterilizar en la vidriera, que es lo que
          la ordenanza prohibe;
        · rebotar con `adoptable_no_esterilizado` ⇒ le dice al refugio que
          esterilice cuando lo que falta es OTRA cosa.
      Por eso el rebote es propio (`edad_no_declarada`) y la salida es la que la
      casa ya usa: **una fecha ESTIMADA es un dato legitimo** — `mascotas`
      tiene `fecha_nacimiento_precision` justo para eso, y §4.1 pide que la edad
      estimada se diga aunque sea estimada.

   ── `esterilizado IS NULL` en un adulto rebota igual que `false`, y **no
      porque sean lo mismo**: publicar un adulto exige DECLARARLO. El silencio
      no puede leerse como «si».

   ── El cachorro pasa **con compromiso**, y la funcion lo devuelve para que la
      pantalla lo diga y el acta lo recoja. *Dejarlo pasar sin nombrar el
      compromiso convertiria una obligacion legal en un olvido.*
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE OR REPLACE FUNCTION public.evaluar_esterilizacion_adoptable(p_publicacion_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_fn date; v_prec text; v_est boolean; v_meses int;
BEGIN
  SELECT m.fecha_nacimiento, m.fecha_nacimiento_precision, m.esterilizado
    INTO v_fn, v_prec, v_est
    FROM adopcion_publicacion p JOIN mascotas m ON m.id = p.mascota_id
   WHERE p.id = p_publicacion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'publicacion_no_existe' USING ERRCODE='22023';
  END IF;

  IF v_fn IS NULL THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'edad_no_declarada',
      'requiere_compromiso', false,
      'detalle', 'Sin fecha de nacimiento no se puede saber si le corresponde estar esterilizado. Una fecha estimada alcanza.');
  END IF;

  v_meses := (EXTRACT(YEAR FROM age(CURRENT_DATE, v_fn)) * 12
            + EXTRACT(MONTH FROM age(CURRENT_DATE, v_fn)))::int;

  IF v_meses < 6 THEN
    /* Cachorro: pasa, **y el compromiso viaja de vuelta**. */
    RETURN jsonb_build_object('puede', true, 'motivo', NULL,
      'requiere_compromiso', true, 'edad_meses', v_meses);
  END IF;

  IF v_est IS TRUE THEN
    RETURN jsonb_build_object('puede', true, 'motivo', NULL,
      'requiere_compromiso', false, 'edad_meses', v_meses);
  END IF;

  RETURN jsonb_build_object('puede', false, 'motivo', 'adoptable_no_esterilizado',
    'requiere_compromiso', false, 'edad_meses', v_meses,
    'esterilizado_declarado', v_est IS NOT NULL,
    'detalle', CASE WHEN v_est IS NULL
                 THEN 'Falta declarar si está esterilizado.'
                 ELSE 'Pasados los seis meses, se publica esterilizado.' END);
END $fn$;

REVOKE ALL ON FUNCTION public.evaluar_esterilizacion_adoptable(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.evaluar_esterilizacion_adoptable(uuid) TO authenticated;

/* ── LA PUERTA ─────────────────────────────────────────────────────────────
   El gate va **sólo en la transición a `publicada`**. Pausar, volver a
   borrador o retirar no lo miran: *frenar el retiro de un animal que no cumple
   lo dejaría atrapado en la vidriera, que es lo contrario de lo que la regla
   quiere.* */
CREATE OR REPLACE FUNCTION public.cambiar_estado_adoptable(
  p_publicacion_id uuid, p_estado text, p_motivo text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_cta uuid; v_estado text; v_masc uuid; v_ev jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF p_estado NOT IN ('borrador','publicada','pausada','adoptada','no_disponible') THEN
    RAISE EXCEPTION 'estado_no_valido: %', p_estado USING ERRCODE='22023';
  END IF;

  SELECT cuenta_comercial_id, estado, mascota_id INTO v_cta, v_estado, v_masc
    FROM adopcion_publicacion WHERE id = p_publicacion_id FOR UPDATE;
  IF v_cta IS NULL THEN RAISE EXCEPTION 'publicacion_no_existe' USING ERRCODE='22023'; END IF;
  IF NOT public._user_gestiona_cuenta_refugio(v_cta) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501';
  END IF;
  IF v_estado = p_estado THEN
    RETURN jsonb_build_object('ok', true, 'ya_estaba', true, 'estado', p_estado);
  END IF;
  IF p_estado = 'adoptada' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'adoptada_la_escribe_el_acta' USING ERRCODE='42501';
  END IF;

  IF p_estado = 'publicada' THEN
    v_ev := public.evaluar_esterilizacion_adoptable(p_publicacion_id);
    IF (v_ev->>'puede')::boolean IS NOT TRUE THEN
      /* El rebote lleva el detalle: la pantalla dibuja la razón sin inventarla.
         *Un interruptor apagado que no dice por qué es el defecto* (§2). */
      RAISE EXCEPTION '%: %', v_ev->>'motivo', v_ev->>'detalle' USING ERRCODE='22023';
    END IF;
  END IF;

  UPDATE adopcion_publicacion
     SET estado = p_estado,
         retirada_en   = CASE WHEN p_estado='no_disponible' THEN now() ELSE NULL END,
         motivo_retiro = CASE WHEN p_estado='no_disponible' THEN p_motivo ELSE NULL END,
         actualizada_en = now()
   WHERE id = p_publicacion_id;

  RETURN jsonb_build_object('ok', true, 'ya_estaba', false,
    'estado', p_estado, 'estado_anterior', v_estado,
    'requiere_compromiso_esterilizacion',
      COALESCE((v_ev->>'requiere_compromiso')::boolean, false));
END $fn$;

/* ═══ CINTURON — EL ROJO PRIMERO, Y SOBRE UNA MASCOTA PROPIA ══════════════
   🔴 La primera version de este cinturon elegia **una mascota real** y le movia
   la fecha de nacimiento y la esterilizacion para producir cada caso. Aborto
   contra un CHECK, y menos mal: la que habia elegido era **Thor, la mascota del
   founder**. Aunque hubiera restaurado bien, un arnes que muta datos vivos hace
   exactamente lo que vino a vigilar (`L-406`).

   Ahora **siembra la suya** y la deshace entera. Sale mas largo y no toca nada
   de nadie. */
DO $cint$
DECLARE v_m uuid; v_p uuid; v_fam uuid; v_cta uuid; v_r jsonb; v_n int; v_admin uuid;
BEGIN
  /* La puerta exige sesion. El cinturon toma prestado el asiento de un ADMIN
     vivo —no inventa uno— para poder ejercer `cambiar_estado_adoptable` de
     verdad. Sin esto, los brazos ③c, ⑥ y ⑦ medirian solo el criterio y
     **nunca el cableado**, que es justo lo que la casa llama motor sin puerta. */
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  IF v_admin IS NULL THEN RAISE EXCEPTION 'CINTURON: no hay admin activo para tomar asiento'; END IF;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin::text, 'role', 'authenticated')::text, true);

  SELECT id INTO v_fam FROM familia LIMIT 1;
  SELECT id INTO v_cta FROM cuentas_comerciales LIMIT 1;
  IF v_fam IS NULL OR v_cta IS NULL THEN
    RAISE EXCEPTION 'CINTURON: falta familia o cuenta para sembrar';
  END IF;

  INSERT INTO mascotas (nombre, especie, sexo, country_code, familia_id, origen,
                        fecha_nacimiento, fecha_nacimiento_precision,
                        estado_vida, esterilizado)
  VALUES ('__cinturon_a3__', 'perro', 'hembra', 'EC', v_fam, 'encontrado',
          current_date - 900, 'exacta', 'activa', false)
  RETURNING id INTO v_m;

  INSERT INTO adopcion_publicacion (mascota_id, cuenta_comercial_id, country_code,
                                    estado, ingresado_en)
  VALUES (v_m, v_cta, 'EC', 'borrador', current_date - 100)
  RETURNING id INTO v_p;

  -- ① 🔴 ROJO: adulta sin esterilizar. Es el caso de Kira.
  v_r := public.evaluar_esterilizacion_adoptable(v_p);
  IF (v_r->>'puede')::boolean IS NOT FALSE OR v_r->>'motivo' <> 'adoptable_no_esterilizado' THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: una adulta sin esterilizar puede publicarse: %', v_r;
  END IF;

  -- ①b 🔴 ROJO: adulta SIN DECLARAR. El silencio no es «si».
  UPDATE mascotas SET esterilizado = NULL WHERE id = v_m;
  v_r := public.evaluar_esterilizacion_adoptable(v_p);
  IF (v_r->>'puede')::boolean IS NOT FALSE THEN
    RAISE EXCEPTION 'CINTURON ROJO ①b: una adulta sin declarar paso';
  END IF;
  IF (v_r->>'esterilizado_declarado')::boolean IS NOT FALSE THEN
    RAISE EXCEPTION 'CINTURON ROJO ①c: el rebote no distingue «no declarado» de «no esterilizado»';
  END IF;

  -- ② 🔴 ROJO: sin fecha, motivo PROPIO — no se disfraza de esterilizacion.
  --    La precision viaja con la fecha: son un par y el CHECK lo exige.
  UPDATE mascotas SET fecha_nacimiento = NULL, fecha_nacimiento_precision = NULL
   WHERE id = v_m;
  v_r := public.evaluar_esterilizacion_adoptable(v_p);
  IF v_r->>'motivo' <> 'edad_no_declarada' THEN
    RAISE EXCEPTION 'CINTURON ROJO ②: sin fecha rebota con el motivo equivocado: %', v_r->>'motivo';
  END IF;

  -- ③ ✅ POSITIVO: cachorra pasa, Y NOMBRA EL COMPROMISO.
  UPDATE mascotas SET fecha_nacimiento = current_date - 90,
                      fecha_nacimiento_precision = 'exacta', esterilizado = false
   WHERE id = v_m;
  v_r := public.evaluar_esterilizacion_adoptable(v_p);
  IF (v_r->>'puede')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'CINTURON ROJO ③: una cachorra no puede publicarse';
  END IF;
  IF (v_r->>'requiere_compromiso')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'CINTURON ROJO ③b: la cachorra paso SIN nombrar el compromiso';
  END IF;

  -- ③c ✅ LA PUERTA REAL, no solo el criterio: la cachorra SE PUBLICA.
  v_r := public.cambiar_estado_adoptable(v_p, 'publicada');
  IF (v_r->>'requiere_compromiso_esterilizacion')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'CINTURON ROJO ③c: la puerta publico sin devolver el compromiso';
  END IF;
  UPDATE adopcion_publicacion SET estado='borrador' WHERE id = v_p;

  -- ④ ✅ POSITIVO: adulta esterilizada pasa y NO pide compromiso.
  UPDATE mascotas SET fecha_nacimiento = current_date - 900, esterilizado = true WHERE id = v_m;
  v_r := public.evaluar_esterilizacion_adoptable(v_p);
  IF (v_r->>'puede')::boolean IS NOT TRUE OR (v_r->>'requiere_compromiso')::boolean IS NOT FALSE THEN
    RAISE EXCEPTION 'CINTURON ROJO ④: la adulta esterilizada no paso limpio: %', v_r;
  END IF;

  -- ⑤ 🔴 EL BORDE EXACTO: seis meses justos YA es adulta. Sin este brazo, un
  --    `<=` en vez de `<` pasaria desapercibido para siempre.
  UPDATE mascotas SET fecha_nacimiento = (current_date - interval '6 months')::date,
                      esterilizado = false WHERE id = v_m;
  v_r := public.evaluar_esterilizacion_adoptable(v_p);
  IF (v_r->>'puede')::boolean IS NOT FALSE THEN
    RAISE EXCEPTION 'CINTURON ROJO ⑤: a los seis meses justos todavia pasa como cachorra';
  END IF;

  -- ⑥ 🔴 LA PUERTA REBOTA, y con el motivo adentro del mensaje.
  BEGIN
    PERFORM public.cambiar_estado_adoptable(v_p, 'publicada');
    RAISE EXCEPTION 'CINTURON ROJO ⑥: la puerta publico una adulta sin esterilizar';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    IF position('adoptable_no_esterilizado' in SQLERRM) = 0 THEN
      RAISE EXCEPTION 'CINTURON ROJO ⑥b: rebotó sin nombrar el motivo: %', SQLERRM;
    END IF;
  END;

  -- ⑦ El gate NO frena pausar ni retirar: solo la transicion a `publicada`.
  PERFORM public.cambiar_estado_adoptable(v_p, 'pausada');
  IF (SELECT estado FROM adopcion_publicacion WHERE id=v_p) <> 'pausada' THEN
    RAISE EXCEPTION 'CINTURON ROJO ⑦: pausar quedo frenado por el gate';
  END IF;

  RAISE NOTICE 'CINTURON A3: 7 brazos verdes (5 rojos producidos, 3 controles positivos)';

  DELETE FROM adopcion_publicacion WHERE id = v_p;
  DELETE FROM mascotas WHERE id = v_m;
  SELECT count(*) INTO v_n FROM mascotas WHERE nombre = '__cinturon_a3__';
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: residuo % mascota(s) sembradas', v_n; END IF;
END $cint$;

COMMIT;
