-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · EL CUARTO SUJETO COBRABLE Y LOS DOS ACTOS DE LA RENOVACIÓN
--          **SIN NÚMERO · SIN APLICAR** — entra en la MISMA migración que ①
--
-- **Firma del founder, 22-ago-2026**, con su argumento al acta:
-- > *partirlo deja el plan cobrando por un camino y la despensa por otro, y así
-- > nacen los dos caminos que después nadie reconcilia.*
--
-- ── EL DEFECTO QUE CIERRA, y es el más grave de la sesión ──────────────────
-- `cerrar_y_renovar_planes` **renovaba SIN COBRAR**: su condición era
-- `auto_renovar AND mascota_activa AND NOT gracia_vencida`, seguida de
-- `v_pagado_en := now()` y `'pago_simulado', true`, con `_generar_citas_plan`
-- creando las citas **confirmadas**. *Un mes de paseos entregado, cero plata.*
-- **Y `pago_simulado: true` lo tapaba: se lee como «esto todavía no cobra»
-- cuando lo que dice es «esto ya entregó»** (`L-387`).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⓐ  EL CUARTO SUJETO — espejo exacto del tercero
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.pagos_intentos
  ADD COLUMN suscripcion_servicio_id uuid REFERENCES public.suscripciones_servicio(id),
  ADD COLUMN suscripcion_periodo     date;

ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_suscripcion_viaja_con_su_periodo
  CHECK ((suscripcion_servicio_id IS NULL) = (suscripcion_periodo IS NULL));

-- 🔴 EL INVARIANTE «EXACTAMENTE UNO» SE EXTIENDE A CUATRO, y es la razón por la
--    que el sujeto es propio y no se reusa `recurrencia_id`:
--    *reusarlo sería el `compra_id` para una cita otra vez — el dato del camino
--    viejo colándose en el nuevo, que es EXACTAMENTE lo que este invariante
--    existe para impedir.*
ALTER TABLE public.pagos_intentos DROP CONSTRAINT chk_intento_un_solo_sujeto;
ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_intento_un_solo_sujeto
  CHECK (
    ((pedido_id IS NOT NULL))::integer
  + ((cita_id IS NOT NULL))::integer
  + ((recurrencia_id IS NOT NULL))::integer
  + ((suscripcion_servicio_id IS NOT NULL))::integer = 1
  );

-- ═══ EL VOCABULARIO DEL PAGADOR GANA SU TERCER ORIGEN ═══
--
-- 🔴 **Lo destapó el arnés, no la lectura.** `chk_pagador_viaja_con_su_origen`
--    admitía **`'sesion'` y `'backfill_s102'`**, y nada más. **Un cobro
--    recurrente NO TIENE SESIÓN — ése es exactamente su punto** ⇒ el INSERT
--    rebotaba con `23514`.
--
-- **La constraint estaba haciendo su trabajo: rechazó un valor que nadie había
-- declarado.** *No era un obstáculo — era el modelo defendiéndose, igual que
-- los CHECKs de procedencia que frenaron el borrado de las sondas en S92.*
--
-- ⇒ **`'recurrencia'` entra como TERCER origen, no como excepción.** Y la
--    distinción importa más allá del CHECK: **`pagador_origen` dice si había
--    alguien mirando la pantalla**, y eso cambia qué se le puede reclamar a la
--    persona y cómo se le avisa. *Un cobro que nadie vio no se explica igual
--    que uno que alguien apretó.*
ALTER TABLE public.pagos_intentos DROP CONSTRAINT chk_pagador_viaja_con_su_origen;
ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_pagador_viaja_con_su_origen
  CHECK (
    (pagador_user_id IS NULL AND pagador_origen IS NULL)
    OR (pagador_user_id IS NOT NULL
        AND pagador_origen = ANY (ARRAY['sesion','backfill_s102','recurrencia']))
  );

-- PARCIAL sobre `aprobado`, igual que el tercero: lo que no puede haber dos
-- veces es un cobro EXITOSO, no un intento — §6 firma tres reintentos.
CREATE UNIQUE INDEX uq_suscripcion_periodo_aprobado
  ON public.pagos_intentos (suscripcion_servicio_id, suscripcion_periodo)
  WHERE suscripcion_servicio_id IS NOT NULL AND estado = 'aprobado';

-- El desglose del período, espejo de `recurrencia_desglose`.
CREATE TABLE public.suscripcion_desglose (
  suscripcion_servicio_id uuid NOT NULL REFERENCES public.suscripciones_servicio(id) ON DELETE CASCADE,
  periodo       date NOT NULL,
  subtotal      numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  impuesto      numeric(12,2) NOT NULL DEFAULT 0 CHECK (impuesto >= 0),
  total         numeric(12,2) NOT NULL CHECK (total > 0),
  moneda        text NOT NULL DEFAULT 'USD',
  congelado_en  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (suscripcion_servicio_id, periodo)
);
ALTER TABLE public.suscripcion_desglose ENABLE ROW LEVEL SECURITY;
CREATE POLICY suscripcion_desglose_select ON public.suscripcion_desglose
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.suscripciones_servicio s
                  WHERE s.id = suscripcion_desglose.suscripcion_servicio_id
                    AND (s.user_id = auth.uid() OR is_admin())));
-- Sin policy de escritura: lo congela el motor. *Un desglose que el pagador
-- puede escribir es la compuerta 2 verificando un número que él eligió.*

-- ═══════════════════════════════════════════════════════════════════════════
-- ⓑ  ACTO 1 — EL CRON SELECCIONA Y CONGELA. **No renueva.**
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.planes_vencidos_pendientes()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_s record; v_hoy date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_oferta record; v_n int; v_total numeric(12,2); v_credito numeric(12,2);
  v_intento uuid; v_listas jsonb := '[]'::jsonb; v_frenadas jsonb := '[]'::jsonb;
  v_masc boolean;
BEGIN
  FOR v_s IN
    SELECT * FROM suscripciones_servicio
     WHERE tipo_servicio = 'paseo_mensual' AND estado = 'activa'
       AND auto_renovar AND periodo_fin <= v_hoy
       AND NOT EXISTS (SELECT 1 FROM pagos_intentos i
                        WHERE i.suscripcion_servicio_id = suscripciones_servicio.id
                          AND i.suscripcion_periodo = suscripciones_servicio.periodo_fin
                          AND i.estado = 'aprobado')
     ORDER BY periodo_fin FOR UPDATE SKIP LOCKED
  LOOP
    /* El fusible del motor de D-657(b): sin mascota activa no se renueva.
       *Se conserva tal cual — no es de este arco y su razón sigue viva.* */
    /* 🔴 EL VALOR SE MIDIÓ, NO SE SUPUSO: `estado_vida` vale **`'activa'`**, no
       `'vivo'`. *Con el literal equivocado este fusible habría frenado TODOS
       los planes con `mascota_no_activa` — un motor apagado que se ve como un
       motor prudente.* Es `L-364` en su forma más cara: el rojo total y prolijo. */
    SELECT (m.estado_vida = 'activa') INTO v_masc FROM mascotas m WHERE m.id = v_s.mascota_id;
    IF NOT COALESCE(v_masc, false) THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin, 'motivo', 'mascota_no_activa');
      CONTINUE;
    END IF;

    SELECT ps.id, ps.precio_mensual_plan INTO v_oferta
      FROM prestador_servicios ps WHERE ps.id = v_s.prestador_servicio_id AND ps.activo;
    IF v_oferta.id IS NULL OR v_oferta.precio_mensual_plan IS NULL THEN
      /* REFORMA S79 ①: sin mensual declarado NO se renueva. *Conservado: el
         plan vence honesto en vez de cobrar un precio inventado.* */
      v_frenadas := v_frenadas || jsonb_build_object(
        'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin, 'motivo', 'plan_no_ofrecido');
      CONTINUE;
    END IF;

    SELECT count(*) INTO v_n
      FROM _fechas_periodo_plan(v_s.periodo_fin, v_s.dias_semana, v_s.frecuencia);
    IF v_n = 0 THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin, 'motivo', 'plan_sin_citas');
      CONTINUE;
    END IF;

    /* EL CRÉDITO POR SOBRANTES SE CALCULA FRESCO — y **NO se suma desde
       metadata**. *El par lo cazó: reembolso 12 donde correspondía 6.* Se
       conserva la nota original porque su razón no cambió. */
    SELECT COALESCE(count(*) * v_s.precio_unitario_efectivo, 0) INTO v_credito
      FROM evento_cita_servicio
     WHERE suscripcion_servicio_id = v_s.id AND estado = 'confirmada' AND fecha >= v_hoy;

    v_total := greatest(round(v_oferta.precio_mensual_plan, 2) - COALESCE(v_credito,0), 0);

    /* 🔴 SI EL CRÉDITO CUBRE EL MES ENTERO NO HAY NADA QUE COBRAR — y eso NO
       es un fallo: es una renovación que se paga sola. Se lista con monto 0
       marcada, para que el ACTO 2 la renueve sin pasar por el proveedor.
       *Mandar un cobro de 0 al proveedor es pedirle que rechace algo que
       nosotros ya sabíamos.* */
    INSERT INTO suscripcion_desglose (suscripcion_servicio_id, periodo, subtotal, impuesto, total, moneda)
    VALUES (v_s.id, v_s.periodo_fin, round(v_oferta.precio_mensual_plan,2), 0,
            greatest(v_total, 0.01), 'USD')
    ON CONFLICT (suscripcion_servicio_id, periodo) DO NOTHING;

    INSERT INTO pagos_intentos (
      suscripcion_servicio_id, suscripcion_periodo, monto, moneda, estado, forma,
      proveedor, pagador_user_id, pagador_origen, clave_idempotencia)
    VALUES (v_s.id, v_s.periodo_fin, greatest(v_total, 0.01), 'USD', 'iniciado',
            'tokenizacion', 'nuvei', v_s.user_id, 'recurrencia',
            'plan:' || v_s.id::text || ':' || v_s.periodo_fin::text)
    ON CONFLICT (clave_idempotencia) DO UPDATE SET actualizado_en = now()
    RETURNING id INTO v_intento;

    v_listas := v_listas || jsonb_build_object(
      'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin, 'intento_id', v_intento,
      'user_id', v_s.user_id, 'monto', greatest(v_total, 0.01),
      'credito_aplicado', COALESCE(v_credito,0),
      'cubierto_por_credito', (v_total <= 0));
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'fecha', v_hoy,
    'para_cobrar', v_listas, 'frenadas', v_frenadas,
    'cuantas_listas', jsonb_array_length(v_listas),
    'cuantas_frenadas', jsonb_array_length(v_frenadas));
END $function$;

REVOKE ALL ON FUNCTION public.planes_vencidos_pendientes() FROM anon, authenticated, PUBLIC;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⓒ  ACTO 2 — LA RENOVACIÓN, DISPARADA POR LA PLATA
--
-- 🔴 La llama **el ACTUADOR** cuando el cobro entra — el mismo que confirma una
--    compra o una cita. **Jamás el reloj.**
--    *Restaura la regla ya firmada: primero entra la plata, después sale el
--    servicio. Hoy está al revés.*
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.renovar_plan_cobrado(
  p_suscripcion_id uuid, p_periodo date)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_s record; v_d record; v_inicio date; v_fin date; v_n int; v_unit numeric(14,2);
BEGIN
  SELECT * INTO v_s FROM suscripciones_servicio WHERE id = p_suscripcion_id FOR UPDATE;
  IF v_s.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'motivo', 'suscripcion_no_existe'); END IF;

  /* 🔴 EL GATE QUE HACE LA DIFERENCIA CON EL CUERPO VIEJO: **exige el cobro
     APROBADO de ESTE período.** *Sin esto volveríamos a renovar por confianza,
     que es exactamente el defecto que este arco cierra.* */
  IF NOT EXISTS (SELECT 1 FROM pagos_intentos
                  WHERE suscripcion_servicio_id = p_suscripcion_id
                    AND suscripcion_periodo = p_periodo AND estado = 'aprobado') THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'sin_cobro_aprobado');
  END IF;

  IF v_s.periodo_fin <> p_periodo THEN
    /* Ya renovada por otra pasada: idempotente y HABLADO. */
    RETURN jsonb_build_object('ok', true, 'renovado', false, 'motivo', 'ya_renovada');
  END IF;

  SELECT * INTO v_d FROM suscripcion_desglose
   WHERE suscripcion_servicio_id = p_suscripcion_id AND periodo = p_periodo;

  v_inicio := v_s.periodo_fin;
  v_fin    := (v_inicio + interval '1 month')::date;

  UPDATE suscripciones_servicio
     SET periodo_inicio = v_inicio, periodo_fin = v_fin,
         precio_mensual = v_d.subtotal, precio_pagado = v_d.total,
         proximo_cobro_en = v_fin, ultima_actividad_en = now(),
         /* ☠️ MUERE `pago_simulado: true`. *Su nombre describía el MEDIO y no
            la CONSECUENCIA: se leía «esto todavía no cobra» y decía «esto ya
            entregó».* Lo reemplaza el intento aprobado, que es un hecho. */
         pago_metadata = (pago_metadata - 'gracia') || jsonb_build_object(
           'cobros', COALESCE(pago_metadata->'cobros','[]'::jsonb) || jsonb_build_array(
             jsonb_build_object('periodo_inicio', v_inicio, 'periodo_fin', v_fin,
               'total', v_d.total, 'cobrado_en', now())))
   WHERE id = p_suscripcion_id;

  v_n := _generar_citas_plan(p_suscripcion_id, v_inicio, v_fin, now());
  IF v_n = 0 THEN RAISE EXCEPTION 'plan_sin_citas'; END IF;

  SELECT count(*) INTO v_n FROM evento_cita_servicio
   WHERE suscripcion_servicio_id = p_suscripcion_id
     AND fecha >= v_inicio AND fecha < v_fin AND estado = 'confirmada';
  IF v_n > 0 THEN
    v_unit := round(v_d.total / v_n, 2);
    UPDATE suscripciones_servicio SET precio_unitario_efectivo = v_unit WHERE id = p_suscripcion_id;
    UPDATE evento_cita_servicio SET precio = v_unit
     WHERE suscripcion_servicio_id = p_suscripcion_id
       AND fecha >= v_inicio AND fecha < v_fin AND estado = 'confirmada';
  END IF;

  /* El aviso sale ACÁ y no antes: **cuando el mes está pago y las citas
     existen.** *Mandarlo al seleccionar anunciaría una renovación que todavía
     puede no ocurrir.* */
  PERFORM registrar_intencion_notificacion(
    p_tipo => 'plan_renovado', p_destinatario_user_id => v_s.user_id,
    p_mascota_id => v_s.mascota_id,
    p_datos => jsonb_build_object('subtipo','plan_renovado','suscripcion_servicio_id', v_s.id)
               || public._voz_notificacion('plan_renovado', v_s.user_id, v_s.mascota_id),
    p_clave_dedup => 'plan_renovado:' || v_s.id || ':' || p_periodo::text);

  RETURN jsonb_build_object('ok', true, 'renovado', true,
    'periodo_inicio', v_inicio, 'periodo_fin', v_fin, 'citas', v_n);
END $function$;

REVOKE ALL ON FUNCTION public.renovar_plan_cobrado(uuid, date) FROM anon, authenticated, PUBLIC;

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE
  v_def text; v_n int;
  /* 🔴 SIN COMENTARIOS AL MEDIR. `pg_get_functiondef` los devuelve, y este
     cinturón se disparó contra su PROPIA LÁPIDA: el comentario que declara que
     el flag murió **contenía el flag**. **Es `L-170` —un censo por
     `functiondef` lee los comentarios como código— cobrada sobre quien la citó
     en otro archivo el mismo día.**
     *Cambiar el comentario habría curado el caso y dejado viva la clase: el
     próximo que escriba el literal en una lápida vuelve a romper el gate.* */
  v_limpio text;
BEGIN
  -- (a) El invariante es de CUATRO.
  IF (SELECT pg_get_constraintdef(oid) FROM pg_constraint
       WHERE conname='chk_intento_un_solo_sujeto') NOT LIKE '%suscripcion_servicio_id%' THEN
    RAISE EXCEPTION 'ABORTA: el cuarto sujeto no entro al invariante';
  END IF;

  -- (b) 🔴 EL DISCRIMINADOR DEL ARCO: la renovación EXIGE cobro aprobado.
  SELECT pg_get_functiondef(to_regprocedure('public.renovar_plan_cobrado(uuid,date)')) INTO v_def;
  v_limpio := regexp_replace(regexp_replace(v_def, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g');
  IF position('sin_cobro_aprobado' IN v_limpio) = 0 THEN
    RAISE EXCEPTION 'ABORTA: la renovacion no exige el cobro — vuelve a renovar por confianza';
  END IF;

  -- (c) ☠️ `pago_simulado` MUERTO en el camino nuevo.
  IF position('pago_simulado' IN v_limpio) > 0 THEN
    RAISE EXCEPTION 'ABORTA: sobrevivio pago_simulado — la bandera que decia ya entrego';
  END IF;

  -- (d) El selector NO renueva ni avisa. *Si alguien le mete la renovación
  --     adentro, volvemos al reloj disparando el servicio.*
  SELECT pg_get_functiondef(to_regprocedure('public.planes_vencidos_pendientes()')) INTO v_def;
  v_limpio := regexp_replace(regexp_replace(v_def, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g');
  IF position('_generar_citas_plan' IN v_limpio) > 0
     OR position('plan_renovado' IN v_limpio) > 0 THEN
    RAISE EXCEPTION 'ABORTA: el ACTO 1 renueva o avisa — los dos actos se fusionaron';
  END IF;

  -- (e) Corre en vacío y devuelve los DOS contadores.
  IF (planes_vencidos_pendientes()->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ABORTA: el selector de planes fallo en vacio';
  END IF;

  RAISE NOTICE 'CINTURON VERDE — cuarto sujeto en el invariante · la renovacion exige cobro · pago_simulado muerto · los dos actos separados';
END $cinturon$;

COMMIT;
