/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · EL ACTO ÚNICO — y lo que el motor NO necesitaba
   ═══════════════════════════════════════════════════════════════════════════
   🟢 Firma del founder (30-ago): **los seis documentos se aceptan con UN SOLO
   ACTO.** *Ocho casillas para agendar un servicio es lo que hace que la familia
   abandone.* El motor guarda las seis aceptaciones por `(codigo, version)` y
   **eso no cambia** — lo que cambia es que un solo acto las produce todas.

   ☠️ **Y EL MOTOR NO NECESITABA NADA PARA ESO.** `p_aceptaciones` siempre fue
   un array: la pantalla ya mandaba las seis en UNA llamada. Medido en la
   evidencia viva: las 6 aceptaciones de la familia real tienen **el mismo
   `aceptado_en` al segundo** (30-ago 16:34:45) ⇒ *lo que había eran seis
   casillas en la pantalla, no seis llamadas al motor.* **La cura del founder
   es de superficie, y el motor ya la esperaba.**

   ⇒ Esta migración NO implementa el acto único. Implementa **las dos
   consecuencias que el acto único trae y que sí son de motor**:

   ① **QUIÉN DECIDE CUÁLES SON LOS SEIS deja de ser el bundle.** Con seis
      casillas, mandar cinco era una elección de la familia. **Con UN acto,
      mandar cinco es un bug** — y su síntoma es una familia a la que le
      dijimos que sí y queda en `faltan` sin entender por qué. Con
      `p_aceptaciones => NULL` el servidor toma **los vigentes al momento del
      acto**, que además es lo que la prueba de aceptación tiene que decir.

   ② **EL RETORNO DEJA DE SER UN CONTADOR.** `aceptadas: 5` se lee como éxito.
      Ahora devuelve `al_dia` y `faltantes`. *Un contador no es un veredicto.*

   ⚠️ **LO QUE ESTA MIGRACIÓN NO TOCA, A PROPÓSITO — y es donde el founder pidió
   que se hablara antes:** el **tope de urgencia** sigue OBLIGATORIO (guard +
   columna NOT NULL + CHECK > 0). **Retirarlo choca con `CRITERIO_LEGAL` §4**,
   que nombra el documento como *«autorización de urgencia veterinaria **con
   tope de gasto y cadena de contactos**»*. Se declara y **no se afloja sin
   firma**. El **contacto alternativo ya es opcional** —`nullable`, y
   `p_contactos` cae a `[]`— así que esa mitad no necesitaba nada.

   ⚖️ VEDA 76(g): **NO RIGE** — reemplazo de cuerpo, sin backfill.
   ↩️ REVERSA escrita ANTES:
      `docs/relevamientos/S107-A-REVERSA-20260831080000-acto-unico.sql`
   ═══════════════════════════════════════════════════════════════════════════ */

CREATE OR REPLACE FUNCTION public.aceptar_documentos_guarderia(p_familia_id uuid, p_aceptaciones jsonb, p_urgencia_tope_monto numeric, p_urgencia_tope_moneda text, p_contactos jsonb, p_contacto_alternativo jsonb DEFAULT NULL::jsonb, p_redes_autorizadas boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_user uuid := auth.uid(); v_n int := 0; v_it jsonb; v_faltan jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM familia_miembro fm
                  WHERE fm.familia_id = p_familia_id AND fm.user_id = v_user) THEN
    RAISE EXCEPTION 'no_sos_de_esta_familia' USING ERRCODE = '42501';
  END IF;
  IF p_urgencia_tope_monto IS NULL OR p_urgencia_tope_monto <= 0 THEN
    RAISE EXCEPTION 'tope_de_urgencia_invalido' USING ERRCODE = '22023';
  END IF;

  /* Todo en UNA transacción: aceptar seis documentos y no guardar el tope
     dejaría a la guardería sin saber hasta cuánto puede gastar en una
     urgencia — la mitad de una firma no es media firma, es ninguna. */
  INSERT INTO guarderia_autorizaciones_familia (
    familia_id, urgencia_tope_monto, urgencia_tope_moneda, contactos,
    contacto_alternativo, redes_autorizadas)
  VALUES (p_familia_id, p_urgencia_tope_monto, p_urgencia_tope_moneda,
          COALESCE(p_contactos, '[]'::jsonb), p_contacto_alternativo,
          COALESCE(p_redes_autorizadas, false))
  ON CONFLICT (familia_id) DO UPDATE
    SET urgencia_tope_monto  = EXCLUDED.urgencia_tope_monto,
        urgencia_tope_moneda = EXCLUDED.urgencia_tope_moneda,
        contactos            = EXCLUDED.contactos,
        contacto_alternativo = EXCLUDED.contacto_alternativo,
        redes_autorizadas    = EXCLUDED.redes_autorizadas,
        actualizado_en       = now();

  /* ═══ EL ACTO UNICO: SI NO VIENE LA LISTA, LA RESUELVE EL SERVIDOR ═══════
     🟢 Firma del founder (30-ago): **un solo acto de la familia produce las
     seis aceptaciones.** Ocho casillas para agendar un servicio es lo que hace
     que la familia abandone.

     El motor **ya podia** recibir las seis en una llamada —`p_aceptaciones` es
     un array— asi que el acto unico no necesito migracion. Lo que se mueve
     aca es OTRA cosa, y es POR el acto unico:

     🔴 **quien decide CUALES son los seis deja de ser el bundle.** Con seis
     casillas, mandar cinco era una eleccion de la familia. Con UN acto, mandar
     cinco es un BUG — y su sintoma es una familia a la que le dijimos que si y
     queda en `faltan` sin entender por que. Pasando `p_aceptaciones => NULL`,
     el servidor toma **los vigentes AL MOMENTO DEL ACTO**, que ademas es lo
     que la prueba de aceptacion tiene que decir: *lo que estaba vigente en ese
     timestamp, no lo que el bundle creia.*

     ⚠️ Compatible hacia atras: con lista explicita se comporta igual que
     siempre. NULL antes no hacia nada util (COALESCE a `[]` = cero aceptadas). */
  IF p_aceptaciones IS NULL THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('codigo', v.codigo, 'version', v.version)), '[]'::jsonb)
      INTO p_aceptaciones FROM public.obtener_documentos_guarderia() v;
  END IF;

  FOR v_it IN SELECT * FROM jsonb_array_elements(p_aceptaciones) LOOP
    INSERT INTO guarderia_aceptaciones (familia_id, documento_codigo, documento_version, aceptado_por)
         VALUES (p_familia_id, v_it->>'codigo', (v_it->>'version')::int, v_user)
    ON CONFLICT DO NOTHING;   -- aceptar dos veces la misma versión es idempotente
    v_n := v_n + 1;
  END LOOP;

  /* 🔴 EL RETORNO DICE SI QUEDO ALGO AFUERA. Antes devolvia solo un conteo:
     «aceptadas: 5» se lee como exito, y la familia quedaba trabada en `faltan`
     con una pantalla que le habia dicho que si. *Un contador no es un
     veredicto.* */
  SELECT COALESCE(jsonb_agg(jsonb_build_object('codigo', v.codigo, 'version', v.version)
                            ORDER BY v.codigo), '[]'::jsonb)
    INTO v_faltan
    FROM public.obtener_documentos_guarderia() v
   WHERE NOT EXISTS (SELECT 1 FROM guarderia_aceptaciones a
                      WHERE a.familia_id = p_familia_id
                        AND a.documento_codigo = v.codigo
                        AND a.documento_version = v.version);

  RETURN jsonb_build_object('ok', true, 'aceptadas', v_n,
                            'al_dia', jsonb_array_length(v_faltan) = 0,
                            'faltantes', v_faltan);
END $function$
;

/* ═══════════════════════════════════════════════════════════════════════════
   CINTURÓN CON DISCRIMINADOR
   ───────────────────────────────────────────────────────────────────────────
   «Aceptó las seis» no distingue el camino nuevo del viejo. Los brazos que sí:
     ① con `NULL` el servidor resuelve los seis  → `al_dia: true`
     ② con una lista de CINCO, el retorno **lo dice** → `al_dia: false` + el
        faltante nombrado. *Ése es el brazo que prueba que el retorno dejó de
        ser un contador: antes decía `aceptadas: 5` y se leía como éxito.*
   Escribe en SUBTRANSACCIÓN QUE SE DESHACE SOLA (L-406).
   ═══════════════════════════════════════════════════════════════════════════ */
DO $cinturon$
DECLARE
  v_rol text := current_user; v_user uuid; v_fam uuid;
  v_todos jsonb; v_cinco jsonb; v_r jsonb;
  v_out text := ''; v_ok int := 0; v_a0 int; v_a1 int;
BEGIN
  SELECT count(*) INTO v_a0 FROM guarderia_aceptaciones;
  /* Una familia SIN aceptaciones — si se usara la que ya aceptó, los dos
     brazos darían `al_dia` por herencia y el arnés no mediría nada. */
  SELECT fm.user_id, fm.familia_id INTO v_user, v_fam FROM familia_miembro fm
   WHERE fm.hasta IS NULL
     AND NOT EXISTS (SELECT 1 FROM guarderia_aceptaciones a WHERE a.familia_id = fm.familia_id)
   LIMIT 1;
  IF v_fam IS NULL THEN
    RAISE EXCEPTION 'CINTURON: no hay familia sin aceptaciones — el arnes no puede discriminar';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('codigo',codigo,'version',version)),'[]'::jsonb)
    INTO v_todos FROM public.obtener_documentos_guarderia();
  SELECT COALESCE(jsonb_agg(x),'[]'::jsonb) INTO v_cinco
    FROM (SELECT jsonb_build_object('codigo',codigo,'version',version) x
            FROM public.obtener_documentos_guarderia() ORDER BY codigo LIMIT 5) s;

  BEGIN
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub',v_user,'role','authenticated')::text);
    SET LOCAL ROLE authenticated;

    /* ② primero el parcial, para que el brazo ① no herede su verde */
    v_r := public.aceptar_documentos_guarderia(v_fam, v_cinco, 300, 'USD', '[]'::jsonb, NULL, false);
    v_out := v_out || format(E'\n  CINCO explicitas -> aceptadas %s · al_dia %s · faltantes %s',
                             v_r->>'aceptadas', v_r->>'al_dia', v_r->'faltantes');
    IF (v_r->>'al_dia') = 'false' AND jsonb_array_length(v_r->'faltantes') = 1 THEN v_ok := v_ok + 1; END IF;

    /* ① el acto unico: sin lista, el server resuelve */
    v_r := public.aceptar_documentos_guarderia(v_fam, NULL, 300, 'USD', '[]'::jsonb, NULL, false);
    v_out := v_out || format(E'\n  NULL (acto unico) -> aceptadas %s · al_dia %s',
                             v_r->>'aceptadas', v_r->>'al_dia');
    IF (v_r->>'al_dia') = 'true' AND (v_r->>'aceptadas')::int = 6 THEN v_ok := v_ok + 1; END IF;

    /* ③ el tope SIGUE siendo obligatorio — se mide, no se supone */
    BEGIN
      PERFORM public.aceptar_documentos_guarderia(v_fam, NULL, NULL, 'USD', '[]'::jsonb, NULL, false);
      v_out := v_out || E'\n  sin tope -> 🔴 PASO (se aflojo sin firma)';
    EXCEPTION WHEN OTHERS THEN
      v_out := v_out || format(E'\n  sin tope -> %s (sigue exigido, como se declaro)', SQLERRM);
      IF SQLERRM = 'tope_de_urgencia_invalido' THEN v_ok := v_ok + 1; END IF;
    END;

    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    RAISE EXCEPTION 'CINTURON_DESHACER';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF SQLERRM <> 'CINTURON_DESHACER' THEN RAISE; END IF;
  END;

  SELECT count(*) INTO v_a1 FROM guarderia_aceptaciones;
  RAISE NOTICE E'\n═══ CINTURON · el acto unico ═══%\n\n  %/3 · residuo aceptaciones %→%', v_out, v_ok, v_a0, v_a1;
  IF v_ok <> 3 THEN RAISE EXCEPTION 'CINTURON ROJO: %/3. %', v_ok, v_out; END IF;
  IF v_a1 <> v_a0 THEN RAISE EXCEPTION 'CINTURON ROJO: residuo % vs %', v_a1, v_a0; END IF;
END $cinturon$;
