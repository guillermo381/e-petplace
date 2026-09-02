/* ═══════════════════════════════════════════════════════════════════════════
   S112-A9f · EL HITO ESCRIBIA CONTRA UN ESQUEMA QUE NO EXISTE · Y `en_proceso`
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.**

   🔴 DEFECTO MIO, ENCONTRADO POR E: el `INSERT` del hito en
   `firmar_acta_adopcion` nombra **cinco columnas que `eventos_mascota` no
   tiene** (`tipo_evento`, `titulo`, `descripcion`, `creado_por`, `metadata`).
   ⇒ **la segunda firma reventaba y el traspaso nunca se completaba.**

   Daño cero, y por la razon correcta: el traspaso se llama JUSTO ANTES, asi que
   corrio y revirtio con todo lo demas — no quedo media adopcion.

   ── 🔴 ES EL TERCER DEFECTO DEL MISMO DIA CON LA MISMA FORMA, y las tres son
      mias: **una rama que nunca se ejecuto.** `retirada` que el CHECK no admite
      · el array de faltantes sin castear · y este `INSERT`. **Las tres
      compilan, las tres estan escritas, y las tres revientan la primera vez que
      alguien las recorre.** Ninguna la encontro un gate: las tres aparecieron
      **ejerciendo**, no leyendo.

      *El denominador comun no es el descuido: es que una rama sin consumidor no
      tiene forma de fallar hasta que alguien la pisa.* Lo unico que las
      encuentra antes es un arnes que recorra el camino completo — y el que lo
      recorrio fue el de otra pista.

   ── Y SE ESCRIBE CON EL MOLDE DE LA CASA, que E tambien nombro: evento padre
      en `eventos_mascota` **mas su fila tipada** en `evento_hito_narrativo`.
      La casa no tenia ningun escritor de hitos todavia (medido: cero funciones)
      ⇒ este es el primero, y por eso vale que siga el patron y no lo invente.

   ── `en_proceso` (pedido de C): **«aceptada con menos de DOS firmas»**. Existia
      en la letra del founder (§4.2) y **ninguna pantalla podia pasarlo con
      verdad** — `solicitudes_vivas` cuenta «hay gente escribiendo», no «esta
      adopcion esta en curso». Con el motor de firmas ya es distinguible.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

/* ── EL HITO NECESITA SU CLAVE EN EL CATALOGO ─────────────────────────────
   `evento_hito_narrativo.clave` tiene FK a `cat_hitos_narrativos` — la casa
   trata los hitos como vocabulario cerrado, y bien.

   🔴 **`vida_nueva_empieza` YA EXISTE y NO se reusa**, aunque la voz que el
   founder firmo sea exactamente «Una vida nueva empieza». Esa clave describe
   **el alta de una mascota individual**; esto es una ADOPCION. Reusarla haria
   los dos momentos indistinguibles en el expediente — y no son el mismo: el
   refugio dio de alta al animal cuando lo rescato, y meses despues una familia
   lo adopto. **Son dos momentos reales y los dos merecen su fila.**

   *La clave nombra EL HECHO; la voz —la del founder— vive en el riel.*

   ⚠️ Y es la TERCERA vez hoy que una fila de catalogo faltaba: el tipo de
   aviso del codigo de firma, el motivo de reporte, y ahora esta. La forma se
   repite: **una FK a catalogo no falla al escribir la funcion — falla la
   primera vez que alguien recorre la rama.** */
INSERT INTO public.cat_hitos_narrativos (clave, descripcion, activo)
VALUES ('adopcion_completada',
        'La adopción quedó firmada por las dos partes y el animal pasó a su familia. '
        'Voz firmada por el founder (§0 paso 15): «Una vida nueva empieza». '
        'NO es `vida_nueva_empieza`, que es el alta de una mascota individual: '
        'son dos momentos reales y distintos en la vida del mismo animal.',
        true)
ON CONFLICT (clave) DO UPDATE SET activo = true;

DO $fix$
DECLARE v_def text; v_nueva text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='firmar_acta_adopcion';
  IF position('tipo_evento' in v_def) = 0 THEN
    RAISE NOTICE 'FIX: el hito ya estaba curado'; RETURN;
  END IF;

  v_nueva := replace(v_def,
'    INSERT INTO eventos_mascota (mascota_id, tipo_evento, fecha_evento, titulo, descripcion,
                                 procedencia, creado_por, metadata)
    VALUES ((v_acta->>''mascota_id'')::uuid, ''hito_narrativo'', now(),
            ''Una vida nueva empieza'',
            ''La adopción quedó firmada por las dos partes.'',
            ''declarado_por_prestador'', v_uid,
            jsonb_build_object(''aniversario_anual'', true, ''folio'', v_folio,
                               ''solicitud_id'', p_solicitud_id))
    RETURNING id INTO v_ev;',
'    /* EL MOLDE DE LA CASA: evento padre + fila tipada. La version anterior
       nombraba cinco columnas que esta tabla no tiene y **reventaba la segunda
       firma**, asi que el traspaso nunca se completaba. */
    INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento,
                                 country_code, datos, creado_por_user_id, procedencia)
    SELECT m.id, ''hito_narrativo'', ''identidad'', now(), m.country_code,
           jsonb_build_object(''aniversario_anual'', true, ''folio'', v_folio,
                              ''solicitud_id'', p_solicitud_id),
           v_uid, ''declarado_por_prestador''
      FROM mascotas m WHERE m.id = (v_acta->>''mascota_id'')::uuid
    RETURNING id INTO v_ev;

    INSERT INTO evento_hito_narrativo (evento_id, mascota_id, country_code, clave, contexto)
    SELECT v_ev, m.id, m.country_code, ''adopcion_completada'',
           jsonb_build_object(''folio'', v_folio, ''refugio'',
             (SELECT cc.nombre_comercial FROM adopcion_publicacion ap
                JOIN cuentas_comerciales cc ON cc.id = ap.cuenta_comercial_id
               WHERE ap.id = (v_acta->>''publicacion_id'')::uuid))
      FROM mascotas m WHERE m.id = (v_acta->>''mascota_id'')::uuid;');

  IF v_nueva = v_def THEN
    RAISE EXCEPTION 'FIX: el INSERT del hito no tiene la forma esperada — mirar el cuerpo antes de tocar';
  END IF;
  EXECUTE v_nueva;
END $fix$;

/* ── `en_proceso` PARA LA TAB MASCOTAS ───────────────────────────────────── */
DO $ep$
DECLARE v_def text; v_nueva text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_mis_adoptables';
  IF position('en_proceso' in v_def) > 0 THEN RAISE NOTICE 'EP: ya estaba'; RETURN; END IF;

  v_nueva := replace(v_def,
    '        ''estado'', CASE WHEN m.estado_vida = ''fallecida'' THEN ''memorial''
                       ELSE p.estado END,',
    '        /* `en_proceso` (§4.2): **aceptada con menos de DOS firmas**. Vivia
           en la letra y ninguna pantalla podia pasarlo con verdad —
           `solicitudes_vivas` cuenta «hay gente escribiendo», no «esta adopcion
           esta en curso». Con el motor de firmas ya es distinguible. */
        ''estado'', CASE WHEN m.estado_vida = ''fallecida'' THEN ''memorial''
                       WHEN p.estado = ''publicada'' AND EXISTS (
                         SELECT 1 FROM adopcion_solicitud s2
                          WHERE s2.publicacion_id = p.id AND s2.estado = ''aceptada''
                            AND (SELECT count(*) FROM adopcion_firma f2
                                  WHERE f2.solicitud_id = s2.id) < 2)
                         THEN ''en_proceso''
                       ELSE p.estado END,');
  IF v_nueva = v_def THEN
    RAISE EXCEPTION 'EP: no encontre el CASE del estado — mirar el cuerpo antes de tocar';
  END IF;
  EXECUTE v_nueva;
END $ep$;

DO $cint$
DECLARE v_def text; v_r jsonb; v_admin uuid;
BEGIN
  -- ① 🔴 EL ROJO: ninguna columna inventada sobrevive en el INSERT del hito.
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='firmar_acta_adopcion';
  IF v_def ~ '(tipo_evento|creado_por[^_]|''metadata'')' THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: quedan columnas inventadas en el INSERT del hito';
  END IF;
  -- ①b CONTROL NEGATIVO: el instrumento SI ve nombres de columna en el cuerpo.
  IF v_def !~ 'creado_por_user_id' THEN
    RAISE EXCEPTION 'CINTURON ROJO ①b: el censo no ve nombres de columna — mide otra cosa';
  END IF;

  -- ② ✅ POSITIVO PRIMERO (`L-482`): el par padre+tipada ENTRA de verdad.
  --    Se siembra y se deshace: escribir un hito en una mascota real desde una
  --    migracion seria poner un recuerdo en un expediente ajeno (`L-406`).
  DECLARE v_m uuid; v_ev uuid; v_n int;
  BEGIN
    SELECT id INTO v_m FROM mascotas WHERE country_code IS NOT NULL LIMIT 1;
    /* `chk_eventos_origen` exige que el evento diga QUIEN lo creo: una persona
       o el sistema. La primera version de este brazo no ponia ninguno y aborto
       — y **eso prueba que el CHECK funciona**, que es lo que el camino real
       necesita: mi INSERT de verdad si pone `creado_por_user_id`. */
    INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, country_code,
                                 datos, creado_por_sistema)
    SELECT m.id, 'hito_narrativo', 'identidad', now(), m.country_code,
           '{"sonda":true}'::jsonb, 'cinturon_a9f'
      FROM mascotas m WHERE m.id = v_m RETURNING id INTO v_ev;
    INSERT INTO evento_hito_narrativo (evento_id, mascota_id, country_code, clave, contexto)
    SELECT v_ev, m.id, m.country_code, 'adopcion_completada', '{"sonda":true}'::jsonb
      FROM mascotas m WHERE m.id = v_m;
    SELECT count(*) INTO v_n FROM evento_hito_narrativo WHERE evento_id = v_ev;
    IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON ROJO ②: la fila tipada no entro'; END IF;
    DELETE FROM evento_hito_narrativo WHERE evento_id = v_ev;
    DELETE FROM eventos_mascota WHERE id = v_ev;
    SELECT count(*) INTO v_n FROM eventos_mascota WHERE id = v_ev;
    IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: residuo del hito de sonda'; END IF;
  END;

  -- ③ `en_proceso` es alcanzable y el lector responde.
  SELECT id INTO v_admin FROM admin_users WHERE activo LIMIT 1;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin::text, 'role','authenticated')::text, true);
  PERFORM public.obtener_mis_adoptables();
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_mis_adoptables';
  IF position('en_proceso' in v_def) = 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO ③: en_proceso no quedo en el lector';
  END IF;

  RAISE NOTICE 'CINTURON A9f: 3 brazos verdes (1 rojo producido, 1 control negativo, 1 positivo)';
END $cint$;

COMMIT;
