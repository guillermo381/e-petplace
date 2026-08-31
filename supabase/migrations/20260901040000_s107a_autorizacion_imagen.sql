/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · LA AUTORIZACIÓN DE IMAGEN — su lector y su PUERTA PROPIA
   ═══════════════════════════════════════════════════════════════════════════
   Pedido de C, con la firma del founder: **la autorización de imagen SÍ se
   construye**, y vive en la **pantalla de confirmación**, después de pagar.
   *Ya pagó, así que aceptar o no aceptar no cambia nada de lo que contrató — un
   consentimiento que se pide antes de cobrar se parece demasiado a un
   requisito.*

   ── ① EL LECTOR, y por qué `NULL` ≠ `false` ───────────────────────────────
   C midió que **se puede escribir y no se puede leer**: cero lectores de
   `guarderia_autorizaciones_familia`. *Un interruptor sin lector arranca
   siempre en «no» y le dice «no autorizaste» a alguien que sí lo hizo — y
   encima lo invita a re-autorizar.* **Peor que no tenerlo.**

   🔴 **Devuelve CERO FILAS cuando no hay autorización, y eso NO es `false`:**
   *«no hay fila» y «dijo que no» son dos verdades distintas*, y un interruptor
   que las confunde muestra «no» sobre alguien que nunca eligió.

   ── ② LA PUERTA PROPIA, decidida POR MEDICIÓN y no por el nombre ──────────
   C preguntó si alcanzaba con re-llamar a `aceptar_documentos_guarderia`. Su
   argumento —*«usar la puerta de aceptar términos para cambiar una preferencia
   es un nombre que miente»*— es correcto, y **hay uno más fuerte, medido**:

   > **Con un documento nuevo publicado, la familia estaba en `faltan` y
   > PRENDER EL INTERRUPTOR DE LA FOTO SE LO ACEPTÓ SOLO.** Medido en
   > subtransacción: `aceptaciones 10 → 11`.

   ☠️ **O sea: cambiar una preferencia de imagen habría FIRMADO un contrato
   legal que la familia no leyó.** *No es un riesgo futuro — es lo que pasa
   hoy, y sólo no se vio porque la familia de prueba ya tenía todo aceptado.*

   ⇒ `fijar_redes_autorizadas` **no toca `guarderia_aceptaciones` ni el tope ni
   los contactos**. Sólo el booleano. Y **crea la fila si no existe**, porque la
   familia puede querer autorizar antes de tener cualquier otro dato.

   ⚖️ VEDA 76(g): **NO RIGE**. ↩️ REVERSA escrita ANTES:
      `docs/relevamientos/S107-A-REVERSA-20260901040000-autorizacion-imagen.sql`
   ═══════════════════════════════════════════════════════════════════════════ */

CREATE OR REPLACE FUNCTION public.obtener_autorizacion_guarderia(p_familia_id uuid)
RETURNS TABLE (
  redes_autorizadas    boolean,
  urgencia_tope_monto  numeric,
  urgencia_tope_moneda text,
  contactos            jsonb,
  contacto_alternativo jsonb,
  actualizado_en       timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM familia_miembro fm
                  WHERE fm.familia_id = p_familia_id AND fm.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'no_sos_de_esta_familia' USING ERRCODE='42501';
  END IF;

  /* 🔴 SIN FILA DEVUELVE CERO FILAS — el llamador ve `null`, no `false`.
     *Un interruptor que muestra «no» sobre quien nunca eligió le está
     atribuyendo una decisión que no tomó.* */
  RETURN QUERY
  SELECT a.redes_autorizadas, a.urgencia_tope_monto, a.urgencia_tope_moneda,
         a.contactos, a.contacto_alternativo, a.actualizado_en
    FROM guarderia_autorizaciones_familia a
   WHERE a.familia_id = p_familia_id;
END $function$;

CREATE OR REPLACE FUNCTION public.fijar_redes_autorizadas(
  p_familia_id uuid, p_autorizadas boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF p_autorizadas IS NULL THEN RAISE EXCEPTION 'autorizacion_invalida' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM familia_miembro fm
                  WHERE fm.familia_id = p_familia_id AND fm.user_id = v_user) THEN
    RAISE EXCEPTION 'no_sos_de_esta_familia' USING ERRCODE='42501';
  END IF;

  /* 🔴 SÓLO EL BOOLEANO. No toca aceptaciones, ni el tope, ni los contactos.
     *Una puerta que cambia una preferencia y de paso firma un contrato es
     exactamente lo que se midió y se descartó.* */
  /* ⚠️ `contactos` y `urgencia_tope_moneda` son NOT NULL sin default, así que
     una fila nueva los necesita. **`'[]'` es honesto** —lista vacía es «no
     registré contactos», no un valor inventado— y **la moneda es USD porque el
     producto entero es USD/Ecuador** (firma de `MODELO_DESPENSA`), no porque
     haga falta poner algo. *El tope se deja NULL: sigue significando «el del
     documento vigente».* */
  INSERT INTO guarderia_autorizaciones_familia
    (familia_id, redes_autorizadas, contactos, urgencia_tope_moneda)
  VALUES (p_familia_id, p_autorizadas, '[]'::jsonb, 'USD')
  ON CONFLICT (familia_id) DO UPDATE
    SET redes_autorizadas = EXCLUDED.redes_autorizadas,
        actualizado_en    = now();

  RETURN jsonb_build_object('ok', true, 'redes_autorizadas', p_autorizadas);
END $function$;

REVOKE EXECUTE ON FUNCTION public.obtener_autorizacion_guarderia(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_autorizacion_guarderia(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.fijar_redes_autorizadas(uuid, boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fijar_redes_autorizadas(uuid, boolean) TO authenticated;

/* ═══════════════════════════════════════════════════════════════════════════
   CINTURÓN CON DISCRIMINADOR
   ───────────────────────────────────────────────────────────────────────────
     ① 🔑 **sin fila → CERO filas**, no `false`. *«No hay fila» y «dijo que no»
        son dos verdades distintas.*
     ② prende, y el lector lo ve
     ③ 🔑 **prender NO escribe aceptaciones** — con un documento nuevo vigente,
        la familia sigue en `faltan` después del flip. **Ése es el brazo que
        separa esta puerta del aceptador**, y es el que se midió en rojo antes
        de construirla: por el aceptador, `aceptaciones 10 → 11`.
     ④ un ajeno no puede leer ni escribir.
   Escribe en SUBTRANSACCIÓN QUE SE DESHACE SOLA (L-406).
   ═══════════════════════════════════════════════════════════════════════════ */
DO $cinturon$
DECLARE
  v_rol text := current_user; v_u uuid; v_f uuid; v_ajeno uuid;
  v_n int; v_val boolean; v_a0 int; v_a1 int; v_est text;
  v_out text := ''; v_ok int := 0; v_r text;
BEGIN
  /* Una familia SIN fila de autorización — el brazo ① no se puede medir con una que la tenga. */
  SELECT fm.user_id, fm.familia_id INTO v_u, v_f FROM familia_miembro fm
   WHERE fm.hasta IS NULL
     AND NOT EXISTS (SELECT 1 FROM guarderia_autorizaciones_familia a WHERE a.familia_id=fm.familia_id)
   LIMIT 1;
  IF v_f IS NULL THEN RAISE EXCEPTION 'CINTURON: no hay familia SIN autorizacion — el brazo del null no puede correr'; END IF;
  SELECT fm.user_id INTO v_ajeno FROM familia_miembro fm WHERE fm.familia_id <> v_f AND fm.hasta IS NULL LIMIT 1;

  BEGIN
    EXECUTE format('SET LOCAL request.jwt.claims = %L', json_build_object('sub',v_u,'role','authenticated')::text);
    SET LOCAL ROLE authenticated;

    SELECT count(*) INTO v_n FROM public.obtener_autorizacion_guarderia(v_f);
    v_out := v_out || format(E'\n  🔑 sin fila -> %s fila(s)  (esperado 0, que NO es false)', v_n);
    IF v_n = 0 THEN v_ok := v_ok + 1; END IF;

    PERFORM public.fijar_redes_autorizadas(v_f, true);
    SELECT a.redes_autorizadas INTO v_val FROM public.obtener_autorizacion_guarderia(v_f) a;
    v_out := v_out || format(E'\n  prende y el lector lo ve -> %s', v_val);
    IF v_val IS TRUE THEN v_ok := v_ok + 1; END IF;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);

    /* ③ 🔑 un documento nuevo vigente, y el flip NO lo acepta */
    INSERT INTO guarderia_documentos (codigo, version, contenido)
    VALUES ('contrato_custodia', 99, '[FIXTURE — texto nuevo que la familia no leyo]');
    UPDATE guarderia_documentos SET activo=false WHERE codigo='contrato_custodia' AND version=2;
    SELECT count(*) INTO v_a0 FROM guarderia_aceptaciones WHERE familia_id=v_f;

    EXECUTE format('SET LOCAL request.jwt.claims = %L', json_build_object('sub',v_u,'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    PERFORM public.fijar_redes_autorizadas(v_f, false);
    v_est := public.evaluar_documentos_guarderia(v_f)->>'estado';
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    SELECT count(*) INTO v_a1 FROM guarderia_aceptaciones WHERE familia_id=v_f;
    v_out := v_out || format(E'\n  🔑 flip con doc nuevo -> aceptaciones %s->%s · la familia sigue en «%s»', v_a0, v_a1, v_est);
    IF v_a1 = v_a0 THEN v_ok := v_ok + 1; END IF;

    /* ④ el ajeno */
    IF v_ajeno IS NOT NULL THEN
      EXECUTE format('SET LOCAL request.jwt.claims = %L', json_build_object('sub',v_ajeno,'role','authenticated')::text);
      SET LOCAL ROLE authenticated;
      BEGIN PERFORM public.fijar_redes_autorizadas(v_f, true); v_r := 'PASO';
      EXCEPTION WHEN OTHERS THEN v_r := SQLERRM; END;
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      v_out := v_out || format(E'\n  un ajeno la fija -> %s', v_r);
      IF v_r = 'no_sos_de_esta_familia' THEN v_ok := v_ok + 1; END IF;
    ELSE
      v_out := v_out || E'\n  ⚠️ NO EJERCIDO: no hay otra familia para el brazo del ajeno';
      v_ok := v_ok + 1;
    END IF;

    RAISE EXCEPTION 'CINTURON_DESHACER';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF SQLERRM <> 'CINTURON_DESHACER' THEN RAISE; END IF;
  END;

  RAISE NOTICE E'\n═══ CINTURON · la autorizacion de imagen ═══%\n\n  %/4', v_out, v_ok;
  IF v_ok <> 4 THEN RAISE EXCEPTION 'CINTURON ROJO: %/4. %', v_ok, v_out; END IF;
END $cinturon$;
