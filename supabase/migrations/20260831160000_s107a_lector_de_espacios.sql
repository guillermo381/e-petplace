/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · LA CAPACIDAD SE PUEDE LEER — el escritor existía y el lector no
   ═══════════════════════════════════════════════════════════════════════════
   Hallazgo de C, con **pérdida de datos** detrás.

   ☠️ **MEDIDO: `definir_espacio_guarderia` ESCRIBE y no había NINGUNA función
   que devolviera `capacidad_por_dia`.** Las seis que la tocan la usan para
   calcular el cupo de un día; ninguna la expone como lo que es.

   🔴 **Y esa asimetría no era incómoda: perdía datos.** Sin lector, el taller
   derivaba la capacidad del **cupo de HOY** — así que un negocio con capacidad
   **12 que abriera su taller un sábado veía 8**, y **al guardar se la bajaba a
   8, sin error y sin aviso**. *Dos de cada siete días.* Y la portada mostraba
   el cupo del día rotulado como capacidad del negocio (**0 en domingo**).

   ⚠️ **LA CLASE, y es la parte que trasciende el caso:** el atajo **estaba
   declarado**. Quien lo puso escribió una nota diciendo que no era el modelo
   final. **Y rompió igual.**

   > ### Declarar un atajo no lo hace seguro: una limitación escrita en el código protege a quien toca el archivo, no a quien usa la pantalla.

   ── POR QUÉ DEVUELVE LOS ESPACIOS Y NO UN NÚMERO ─────────────────────────
   🔴 **Un negocio NO tiene UNA capacidad.** Tiene espacios, cada uno con su
   `capacidad_por_dia` y sus `dias_operacion`. Devolver un solo número obligaría
   a elegir cuál —¿la suma? ¿la del lunes?— y sería **`D-976` otra vez**: un
   número bien calculado contestando una pregunta que no es la suya.
   *Se devuelven los objetos configurados; quien pinta decide qué mostrar, con
   los datos a la vista para poder hacerlo bien.*

   El gate es **el mismo del escritor**, literal: `user_gestiona_prestador` OR
   `is_admin`. *Leer lo que uno puede escribir no puede pedir menos ni más.*

   ⚖️ VEDA 76(g): **NO RIGE** — función nueva, sin backfill.
   ↩️ REVERSA escrita ANTES:
      `docs/relevamientos/S107-A-REVERSA-20260831160000-lector-espacios.sql`
   ═══════════════════════════════════════════════════════════════════════════ */
CREATE OR REPLACE FUNCTION public.obtener_espacios_guarderia(p_prestador_id uuid)
RETURNS TABLE (
  espacio_id        uuid,
  nombre            text,
  capacidad_por_dia int,
  dias_operacion    int[],
  activo            boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  /* El MISMO predicado que `definir_espacio_guarderia`, copiado del objeto y no
     de memoria: leer lo que uno puede escribir no puede pedir menos ni más. */
  IF NOT public.user_gestiona_prestador(p_prestador_id) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  SELECT e.id, e.nombre, e.capacidad_por_dia, e.dias_operacion, e.activo
    FROM guarderia_espacios e
   WHERE e.prestador_id = p_prestador_id
   ORDER BY e.activo DESC, e.nombre;
END $function$;

REVOKE EXECUTE ON FUNCTION public.obtener_espacios_guarderia(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_espacios_guarderia(uuid) TO authenticated;

/* ═══════════════════════════════════════════════════════════════════════════
   CINTURÓN CON DISCRIMINADOR
   ───────────────────────────────────────────────────────────────────────────
   «Devuelve filas» no mide nada. Los brazos que sí:
     ① 🔑 **el número leído es el CONFIGURADO, y NO el cupo de hoy.** El arnés
        pone un espacio con capacidad **12 abierto sólo L-V**, y **pregunta un
        SÁBADO**: `cupo_guarderia_del_dia` da 0 y el lector tiene que dar 12.
        *Ése es exactamente el caso que perdía datos, y sin este brazo un lector
        que derivara del día también daría verde.*
     ② el gate NIEGA a quien no gestiona el prestador — un lector de config que
        cualquiera puede leer no es un lector, es una filtración.
     ③ residuo 0.
   Escribe en SUBTRANSACCIÓN QUE SE DESHACE SOLA (L-406).
   ═══════════════════════════════════════════════════════════════════════════ */
DO $cinturon$
DECLARE
  v_rol text := current_user; v_prest uuid; v_dueno uuid; v_ajeno uuid;
  v_cap int; v_cupo int; v_sabado date; v_n0 int; v_n1 int;
  v_out text := ''; v_ok int := 0;
BEGIN
  SELECT count(*) INTO v_n0 FROM guarderia_espacios;
  SELECT ps.prestador_id INTO v_prest FROM prestador_servicios ps
   WHERE ps.tipo_servicio='guarderia_dia' AND ps.activo LIMIT 1;
  SELECT pr.user_id INTO v_dueno FROM prestadores pr WHERE pr.id=v_prest;
  SELECT c.user_id INTO v_ajeno FROM evento_cita_servicio c
   WHERE c.user_id IS NOT NULL AND c.user_id <> v_dueno LIMIT 1;
  SELECT min(d)::date INTO v_sabado FROM generate_series(public.hoy_local(), public.hoy_local()+7,'1 day') d
   WHERE EXTRACT(dow FROM d) = 6;

  BEGIN
    /* ⚠️ EL FIXTURE SE SIEMBRA COMO EL TITULAR, NO COMO EL ROL DE LA MIGRACIÓN.
       La v1 de estas líneas llamaba al escritor sin sesión y **rebotó
       `no_gestionas_este_prestador`: era el ESCRITOR negándose, no el lector**.
       *Un rojo leído en el lugar equivocado manda a arreglar lo que funciona.* */
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub',v_dueno,'role','authenticated')::text);
    SET LOCAL ROLE authenticated;

    /* Un espacio de 12 abierto SOLO L-V. */
    PERFORM public.definir_espacio_guarderia(v_prest, 'ARNES-CAPACIDAD', 12, '{1,2,3,4,5}', true);
    SELECT e.capacidad_por_dia INTO v_cap FROM public.obtener_espacios_guarderia(v_prest) e
     WHERE e.nombre = 'ARNES-CAPACIDAD';
    EXECUTE format('SET LOCAL ROLE %I', v_rol);

    v_cupo := (public.cupo_guarderia_del_dia(v_prest, v_sabado)->>'capacidad')::int;
    v_out := v_out || format(E'\n  🔑 un SABADO (%s): el lector dice %s · el cupo del dia dice %s',
                             v_sabado, COALESCE(v_cap::text,'NULL'), v_cupo);
    IF v_cap = 12 THEN v_ok := v_ok + 1; END IF;

    /* ② el ajeno NO puede */
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub',v_ajeno,'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    BEGIN
      PERFORM 1 FROM public.obtener_espacios_guarderia(v_prest);
      v_out := v_out || E'\n  un ajeno lo lee -> 🔴 PASO (es una filtracion de config)';
    EXCEPTION WHEN OTHERS THEN
      v_out := v_out || format(E'\n  un ajeno lo lee -> %s', SQLERRM);
      IF SQLERRM = 'no_gestionas_este_prestador' THEN v_ok := v_ok + 1; END IF;
    END;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);

    RAISE EXCEPTION 'CINTURON_DESHACER';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF SQLERRM <> 'CINTURON_DESHACER' THEN RAISE; END IF;
  END;

  SELECT count(*) INTO v_n1 FROM guarderia_espacios;
  RAISE NOTICE E'\n═══ CINTURON · el lector de espacios ═══%\n\n  %/2 · residuo espacios %→%', v_out, v_ok, v_n0, v_n1;
  IF v_ok <> 2 THEN RAISE EXCEPTION 'CINTURON ROJO: %/2. %', v_ok, v_out; END IF;
  IF v_n1 <> v_n0 THEN RAISE EXCEPTION 'CINTURON ROJO: residuo'; END IF;
END $cinturon$;
