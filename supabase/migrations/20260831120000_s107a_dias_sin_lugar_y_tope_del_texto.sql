/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · LA TIRA SIN LUGAR ELEGIDO, Y EL TOPE QUE SALIÓ DEL FLUJO
   ═══════════════════════════════════════════════════════════════════════════
   Dos pedidos de C, los dos 🔴 y los dos bloqueantes de P2.

   ① **`obtener_dias_guarderia` es POR PRESTADOR y P2 no tiene lugar elegido
      todavía.** Sin un lector agregado, los 14 días se ven iguales y la
      familia **descubre tocando** cuáles sirven — y si toca un fin de semana
      encuentra un botón apagado sin explicación.
      ⚠️ **C lo señala como candidato serio a por qué el founder nunca pudo
      reservar**, y es verosímil: el lugar de prueba abre L-V.
      Nace `obtener_dias_guarderia_disponibles`: **un día es reservable si
      ALGÚN lugar puede**, sobre la misma cadena que ya usa la lista
      (`_guarderia_ofertas_cobrables` + cupo + día operativo + geo).

   ② **El tope de urgencia salió de la pantalla por firma del founder** y vive
      como término del texto (USD 150, editable después). El motor lo seguía
      exigiendo ⇒ **el acto único rebotaba `tope_de_urgencia_invalido` y
      ninguna familia nueva podía aceptar.**
      🔴 Y la razón por la que NO se resuelve mandando un número desde la
      pantalla es de fondo: **cualquier número que mandara la pantalla sería
      una autorización que la familia no dio.** Un default silencioso acá no es
      un valor por omisión — es un permiso para gastar plata ajena que nadie
      firmó.
      ⇒ La columna pasa a **NULLABLE**, y **NULL significa «el tope del
      documento vigente que aceptó»**. *No hay un segundo número que pueda
      divergir del texto, porque no hay segundo número.*

   📌 **`app_config.guarderia_tope_urgencia_usd` = 150 es la FORMA DATO del
      número que el texto dice** — la necesita la pantalla del prestador para
      saber hasta cuánto puede gastar. **Y el cinturón exige que el documento
      vigente contenga ese número**: el día que alguien cambie la clave sin
      publicar una versión nueva del texto, la migración que lo intente
      **aborta**. *Dos lugares que dicen el mismo número se separan en
      silencio; dos lugares con un guard que los compara, no.*

   ⚖️ VEDA 76(g): **NO RIGE** — DDL + una fila de config, sin backfill.
   ↩️ REVERSA escrita ANTES:
      `docs/relevamientos/S107-A-REVERSA-20260831120000-dias-sin-lugar-y-tope.sql`
      (declara que revertir **apaga la guardería**: la pantalla ya no manda el
       tope, así que exigirlo otra vez impide aceptar).
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── ② el tope deja de ser obligatorio ───────────────────────────────────── */
ALTER TABLE public.guarderia_autorizaciones_familia
  ALTER COLUMN urgencia_tope_monto DROP NOT NULL;

COMMENT ON COLUMN public.guarderia_autorizaciones_familia.urgencia_tope_monto IS
  'NULL = el tope del DOCUMENTO VIGENTE que la familia acepto (hoy USD 150, en '
  'app_config.guarderia_tope_urgencia_usd). Un valor explicito es la familia '
  'editandolo desde su cuenta. NUNCA se escribe un default silencioso: seria una '
  'autorizacion a gastar plata ajena que nadie firmo.';

INSERT INTO app_config (clave, valor, tipo, descripcion, categoria, es_publico)
VALUES ('guarderia_tope_urgencia_usd', '150', 'numero',
        'Tope de gasto de urgencia veterinaria que DICE el documento vigente. '
        'Cambiarlo exige publicar una version nueva del texto: la familia '
        'autorizo lo que el texto decia, no lo que esta clave diga despues.',
        /* ⚠️ `legal`, y NO una categoría nueva: el vocabulario de `categoria`
           es CERRADO por CHECK y **no se amplía de paso para que una migración
           pase** — eso es decisión de letra. Y es además la correcta: este
           número es un TÉRMINO de un documento legal, no un límite técnico.
           (El primer intento usó `guarderia` y el CHECK lo rebotó; la
           migración entera se deshizo — verificado contra el OBJETO, no contra
           el ledger.) */
        'legal', true)
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, descripcion = EXCLUDED.descripcion;

CREATE OR REPLACE FUNCTION public.aceptar_documentos_guarderia(p_familia_id uuid, p_aceptaciones jsonb, p_urgencia_tope_monto numeric DEFAULT NULL, p_urgencia_tope_moneda text DEFAULT 'USD', p_contactos jsonb DEFAULT '[]'::jsonb, p_contacto_alternativo jsonb DEFAULT NULL::jsonb, p_redes_autorizadas boolean DEFAULT false)
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
  /* ═══ EL TOPE YA NO ES CAMPO DEL FLUJO ══════════════════════════════════
     🟢 Firma del founder (30-ago): el tope salió de la pantalla y vive como
     **término del texto** — el documento dice USD 150 y la familia lo acepta
     con el acto único; después lo edita desde su cuenta.

     🔴 Por eso NULL tiene que pasar, y el motivo es de fondo, no de comodidad:
     **cualquier número que mandara la pantalla sería una autorización que la
     familia no dio.** Un default silencioso acá no es un valor por omisión: es
     un permiso para gastar plata ajena que nadie firmó.

     ⇒ NULL = **«el tope del documento vigente que aceptó»**, y no hay segundo
     número que pueda divergir del texto. Un número EXPLÍCITO sigue siendo
     válido —es la familia editándolo— y sigue teniendo que ser > 0: *cero no
     es «sin tope», es una autorización de nada, y eso se dice distinto.* */
  IF p_urgencia_tope_monto IS NOT NULL AND p_urgencia_tope_monto <= 0 THEN
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
    /* 🔴 NULL entrante NO pisa un tope que la familia YA editó: si mandó NULL
       es «el del documento», y si antes puso el suyo, ése sigue siendo el
       suyo. *Volver a aceptar los documentos no es motivo para borrarle una
       decisión que tomó aparte.* */
    SET urgencia_tope_monto  = COALESCE(EXCLUDED.urgencia_tope_monto, guarderia_autorizaciones_familia.urgencia_tope_monto),
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
   ① LA TIRA SIN LUGAR ELEGIDO — un día es reservable si ALGÚN lugar puede
   ═══════════════════════════════════════════════════════════════════════════
   Misma cadena que la lista de lugares, para que las dos no puedan discrepar:
   `_guarderia_ofertas_cobrables` → cupo del día → día operativo → geo.
   *Reimplementar el criterio acá sería fabricar una segunda verdad sobre qué
   día sirve, y la familia vería una tira que no coincide con la lista.*
   ═══════════════════════════════════════════════════════════════════════════ */
CREATE OR REPLACE FUNCTION public.obtener_dias_guarderia_disponibles(
  p_mascota_id uuid,
  p_desde      date,
  p_hasta      date,
  p_modalidad  text DEFAULT NULL,
  p_lat        double precision DEFAULT NULL,
  p_lon        double precision DEFAULT NULL
) RETURNS TABLE (
  fecha        date,
  lugares      int,
  ya_reservado boolean,
  reservable   boolean,
  motivo       text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_hoy date := public.hoy_local();
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF p_hasta < p_desde THEN RAISE EXCEPTION 'rango_invalido' USING ERRCODE='22023'; END IF;
  IF p_hasta - p_desde > 60 THEN RAISE EXCEPTION 'rango_demasiado_largo' USING ERRCODE='22023'; END IF;
  IF p_modalidad IS NOT NULL AND p_modalidad NOT IN ('dia','paquete','mensual') THEN
    RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE='22023';
  END IF;
  IF NOT public.user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;
  IF NOT public._mascota_elegible_servicio(p_mascota_id, 'guarderia_dia') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE='22023';
  END IF;

  RETURN QUERY
  WITH dias AS (SELECT d::date AS f FROM generate_series(p_desde, p_hasta, interval '1 day') d),
  medido AS (
    SELECT
      dias.f,
      /* Cuántos lugares PUEDEN ese día — el mismo filtro de la lista. */
      (SELECT count(*)::int
         FROM _guarderia_ofertas_cobrables(p_mascota_id, p_modalidad, dias.f) o
         CROSS JOIN LATERAL public.cupo_guarderia_del_dia(o.prestador_id, dias.f) c
        WHERE (c->>'disponible')::int > 0
          AND public._guarderia_dia_operativo(o.prestador_id, dias.f)
          AND (p_lat IS NULL OR p_lon IS NULL OR EXISTS (
                SELECT 1 FROM prestadores geo
                 WHERE geo.id = o.prestador_id
                   AND geo.lat IS NOT NULL AND geo.lon IS NOT NULL
                   AND geo.radio_cobertura_km IS NOT NULL
                   AND 2 * 6371 * asin(sqrt(
                         power(sin(radians((geo.lat - p_lat) / 2)), 2)
                         + cos(radians(p_lat)) * cos(radians(geo.lat))
                           * power(sin(radians((geo.lon - p_lon) / 2)), 2)
                       )) <= geo.radio_cobertura_km))
      ) AS n,
      /* Cuántos ABREN, sin mirar cupo — es lo que separa «no abre nadie» de
         «están todos llenos», que son dos verdades distintas y la familia hace
         cosas distintas con cada una. */
      (SELECT count(*)::int
         FROM _guarderia_ofertas_cobrables(p_mascota_id, p_modalidad, dias.f) o
        WHERE public._guarderia_dia_operativo(o.prestador_id, dias.f)
      ) AS n_abren,
      EXISTS (SELECT 1 FROM evento_cita_servicio c
               WHERE c.mascota_id = p_mascota_id AND c.fecha = dias.f
                 AND c.tipo_servicio = 'guarderia_dia'
                 AND c.estado NOT IN ('cancelada','rechazada','no_realizable')) AS ya
    FROM dias
  )
  SELECT m.f, m.n, m.ya,
         (m.n > 0 AND NOT m.ya AND m.f > v_hoy) AS reservable,
         CASE
           WHEN m.f <= v_hoy   THEN 'fecha_pasada'
           WHEN m.n_abren = 0  THEN 'ningun_lugar_abre'
           WHEN m.ya           THEN 'mascota_ya_reservada_ese_dia'
           WHEN m.n = 0        THEN 'sin_cupo'
           ELSE NULL
         END
    FROM medido m
   ORDER BY m.f;
END $function$;

REVOKE EXECUTE ON FUNCTION public.obtener_dias_guarderia_disponibles(uuid, date, date, text, double precision, double precision) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_dias_guarderia_disponibles(uuid, date, date, text, double precision, double precision) TO authenticated;

/* ═══════════════════════════════════════════════════════════════════════════
   CINTURÓN CON DISCRIMINADOR
   ───────────────────────────────────────────────────────────────────────────
   ① el número de `app_config` **está escrito en el documento vigente** — si no,
      hay dos lugares diciendo un tope distinto y la familia autorizó el del
      texto, no el de la clave
   ② el acto único PASA **sin tope** (era el rebote que bloqueaba a P2)
   ③ 🔑 mandar un tope explícito **sigue guardándose**, y **volver a aceptar con
      NULL NO se lo borra**. *Ése es el brazo que distingue «acepta NULL» de
      «ignora el tope»: sin él, un motor que tirara el valor a la basura daría
      el mismo verde.*
   ④ la tira sin lugar devuelve el rango entero y **distingue «no abre nadie»
      de «sin cupo»**
   ═══════════════════════════════════════════════════════════════════════════ */
DO $cinturon$
DECLARE
  v_rol text := current_user; v_cfg text; v_txt text;
  v_user uuid; v_fam uuid; v_masc uuid; v_r jsonb; v_tope numeric;
  v_n int; v_res int; v_noabre int; v_out text := ''; v_ok int := 0;
BEGIN
  SELECT valor INTO v_cfg FROM app_config WHERE clave='guarderia_tope_urgencia_usd';
  SELECT contenido INTO v_txt FROM guarderia_documentos
   WHERE codigo='autorizacion_urgencia_veterinaria' AND activo ORDER BY version DESC LIMIT 1;
  IF v_txt IS NULL OR position('USD ' || v_cfg IN v_txt) = 0 THEN
    RAISE EXCEPTION 'CINTURON: app_config dice % y el documento vigente NO lo contiene — dos topes distintos, y la familia autorizo el del texto', v_cfg;
  END IF;
  v_ok := v_ok + 1;
  v_out := v_out || format(E'\n  app_config=%s y el documento vigente lo dice', v_cfg);

  SELECT c.user_id, c.mascota_id INTO v_user, v_masc FROM evento_cita_servicio c
    JOIN mascotas m ON m.id=c.mascota_id
   WHERE m.especie IN ('perro','gato') AND c.user_id IS NOT NULL LIMIT 1;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm WHERE fm.user_id=v_user AND fm.hasta IS NULL LIMIT 1;

  BEGIN
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub',v_user,'role','authenticated')::text);
    SET LOCAL ROLE authenticated;

    /* ② sin tope */
    v_r := public.aceptar_documentos_guarderia(v_fam, NULL);
    SELECT urgencia_tope_monto INTO v_tope FROM guarderia_autorizaciones_familia WHERE familia_id=v_fam;
    v_out := v_out || format(E'\n  acto sin tope -> al_dia %s · tope guardado %s',
                             v_r->>'al_dia', COALESCE(v_tope::text,'NULL (el del documento)'));
    IF (v_r->>'al_dia') = 'true' THEN v_ok := v_ok + 1; END IF;

    /* ③ 🔑 explicito se guarda, y NULL despues NO lo borra */
    PERFORM public.aceptar_documentos_guarderia(v_fam, NULL, 400);
    SELECT urgencia_tope_monto INTO v_tope FROM guarderia_autorizaciones_familia WHERE familia_id=v_fam;
    IF v_tope <> 400 THEN
      v_out := v_out || format(E'\n  🔑 tope explicito 400 -> 🔴 se guardo %s', v_tope);
    ELSE
      PERFORM public.aceptar_documentos_guarderia(v_fam, NULL);
      SELECT urgencia_tope_monto INTO v_tope FROM guarderia_autorizaciones_familia WHERE familia_id=v_fam;
      v_out := v_out || format(E'\n  🔑 explicito 400, despues NULL -> queda %s', COALESCE(v_tope::text,'NULL'));
      IF v_tope = 400 THEN v_ok := v_ok + 1; END IF;
    END IF;

    /* ④ la tira sin lugar */
    SELECT count(*)::int, count(*) FILTER (WHERE reservable)::int,
           count(*) FILTER (WHERE motivo='ningun_lugar_abre')::int
      INTO v_n, v_res, v_noabre
      FROM public.obtener_dias_guarderia_disponibles(v_masc, public.hoy_local(), public.hoy_local()+13);
    v_out := v_out || format(E'\n  tira SIN lugar -> %s filas · %s reservables · %s ningun_lugar_abre',
                             v_n, v_res, v_noabre);
    IF v_n = 14 AND v_res > 0 AND v_noabre > 0 THEN v_ok := v_ok + 1; END IF;

    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    RAISE EXCEPTION 'CINTURON_DESHACER';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF SQLERRM <> 'CINTURON_DESHACER' THEN RAISE; END IF;
  END;

  RAISE NOTICE E'\n═══ CINTURON · la tira sin lugar y el tope del texto ═══%\n\n  %/4', v_out, v_ok;
  IF v_ok <> 4 THEN RAISE EXCEPTION 'CINTURON ROJO: %/4. %', v_ok, v_out; END IF;
END $cinturon$;
