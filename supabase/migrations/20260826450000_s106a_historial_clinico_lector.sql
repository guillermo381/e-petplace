-- ============================================================================
-- S106-A tanda 3 · EL HISTORIAL CLÍNICO DE LA MASCOTA, CON SUS FILTROS
--
-- ── POR QUÉ, Y ES LO ÚLTIMO QUE LE FALTA AL MODAL DEL VET ──────────────────
-- Durante una teleconsulta el profesional necesita **leer lo que ya le pasó a
-- ese animal**. Medido contra el objeto, hoy sólo existen dos lectores y
-- ninguno sirve para eso:
--
--   · `obtener_casos_activos_mascota` — sólo lo ABIERTO, sin historia
--   · `obtenerHistoriaClinicaDeCita`  — UNA cita, la que se está atendiendo
--
-- ⇒ *el vet puede ver la consulta que está escribiendo y los casos abiertos,
-- pero no puede mirar hacia atrás.* En una videoconsulta eso pesa más que en
-- presencial: **no tiene la carpeta sobre la mesa.**
--
-- ── LOS FILTROS, Y POR QUÉ ESOS DOS ────────────────────────────────────────
-- **Fecha** y **caso**. No son comodidad: son las dos preguntas que un
-- profesional hace de verdad — *«¿qué le pasó en el último año?»* y *«¿qué
-- llevamos de ESTA condición?»*. Todo lo demás (buscar por texto, por
-- medicamento) es otra clase de pregunta y no se adivina acá.
--
-- ── 🔴 EL GATE ES EL CLÍNICO, NO EL DE ACCESO ──────────────────────────────
-- `user_acceso_clinico_a_mascota` — **no** `user_tiene_acceso_a_mascota**.
-- Son dos audiencias distintas y confundirlas abre el expediente entero:
-- *quien puede ver que existe una mascota no es necesariamente quien puede
-- leer su historia clínica* (la ley de `BIO_EXPEDIENTE` A3: el ACTO decide qué
-- se muestra, el ROL decide qué se PUEDE mostrar). Un paseador con una cita
-- confirmada pasa el primero y **no debe pasar el segundo.**
--
-- ── LO QUE DEVUELVE, Y LO QUE NO ───────────────────────────────────────────
-- La cabecera de cada consulta —fecha, motivo, diagnóstico, negocio, caso— y
-- **la modalidad**, que desde hoy viaja (§7 de `LETRA_TELEMEDICINA`): *un
-- diagnóstico hecho por video y uno hecho con el animal sobre la mesa se leen
-- distinto, y el historial tiene que decir cuál fue.*
--
-- **NO devuelve el cuerpo completo** (anamnesis, examen, tratamiento): para eso
-- está `obtener_parte_consulta`, que ya existe y tiene su propio gate.
-- *Un lector de LISTA que trae el texto entero de cada consulta obliga a la
-- pantalla a decidir qué esconder — y lo que se esconde igual viajó.*
--
-- ── VEDA 76(g): NO RIGE. Función nueva, cero DDL de tablas, cero backfill.
-- ── REVERSA: docs/relevamientos/2026-08-26-s106a-REVERSA-historial-clinico.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.obtener_historial_clinico_mascota(
  p_mascota_id      uuid,
  p_desde           date    DEFAULT NULL,
  p_hasta           date    DEFAULT NULL,
  p_caso_clinico_id uuid    DEFAULT NULL,
  p_limite          integer DEFAULT 50
)
RETURNS TABLE (
  evento_id        uuid,
  cita_id          uuid,
  fecha            timestamptz,
  motivo_consulta  text,
  diagnostico      text,
  negocio_nombre   text,
  caso_clinico_id  uuid,
  caso_condicion   text,
  modalidad        text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  /* 🔴 EL GATE CLÍNICO. Ver la cabecera: NO es `user_tiene_acceso_a_mascota`. */
  IF NOT COALESCE(public.user_acceso_clinico_a_mascota(p_mascota_id), false) THEN
    RAISE EXCEPTION 'sin_acceso_clinico' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT h.evento_id, h.cita_id, h.completado_en,
         h.motivo_consulta, h.diagnostico_principal,
         pr.nombre_comercial,
         h.caso_clinico_id, cc.condicion,
         c.modalidad
  FROM evento_historia_clinica_registrada h
  LEFT JOIN prestadores pr           ON pr.id = h.prestador_id
  LEFT JOIN caso_clinico cc          ON cc.id = h.caso_clinico_id
  LEFT JOIN evento_cita_servicio c   ON c.id  = h.cita_id
  WHERE h.mascota_id = p_mascota_id
    /* Los filtros son OPCIONALES por construcción: `NULL` = no filtra.
       *Un lector que exige rango obliga a la pantalla a inventar uno, y el
       rango inventado se lee después como si alguien lo hubiera elegido.* */
    AND (p_desde IS NULL OR (h.completado_en AT TIME ZONE 'America/Guayaquil')::date >= p_desde)
    AND (p_hasta IS NULL OR (h.completado_en AT TIME ZONE 'America/Guayaquil')::date <= p_hasta)
    AND (p_caso_clinico_id IS NULL OR h.caso_clinico_id = p_caso_clinico_id)
  ORDER BY h.completado_en DESC NULLS LAST, h.evento_id DESC
  /* 🔴 Techo con desempate ÚNICO en el ORDER BY. Sin el `evento_id`, dos
     consultas con el mismo instante —y las hay: una nota clínica sedimenta
     varios eventos en UNA transacción, donde `now()` es constante— harían el
     corte inestable. Es la misma cura que S99 le hizo al cursor del timeline,
     donde el defecto **perdía eventos en silencio**. */
  LIMIT GREATEST(1, LEAST(COALESCE(p_limite, 50), 200));
END;
$function$;

COMMENT ON FUNCTION public.obtener_historial_clinico_mascota(uuid, date, date, uuid, integer) IS
  'S106 · Historial clinico de una mascota, filtrable por fecha y por caso. Gate '
  'CLINICO (user_acceso_clinico_a_mascota), no el de acceso. Devuelve cabeceras, '
  'no el cuerpo: para eso esta obtener_parte_consulta.';

REVOKE EXECUTE ON FUNCTION public.obtener_historial_clinico_mascota(uuid, date, date, uuid, integer)
  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_historial_clinico_mascota(uuid, date, date, uuid, integer)
  TO authenticated;

-- ── CINTURÓN: los dos lados, ejercidos con JWT real ────────────────────────
DO $cinturon$
DECLARE
  v_rol text := current_user;   -- ⚠️ jamás RESET ROLE
  v_mascota uuid; v_vet uuid; v_ajeno uuid;
  v_n int; v_err text := '(sin error)';
BEGIN
  IF has_function_privilege('anon',
      'public.obtener_historial_clinico_mascota(uuid,date,date,uuid,integer)','EXECUTE') THEN
    RAISE EXCEPTION 'cinturon: el historial quedo alcanzable por anon';
  END IF;

  -- Una mascota con historia real y el vet que la escribió.
  SELECT h.mascota_id, h.veterinario_user_id INTO v_mascota, v_vet
  FROM evento_historia_clinica_registrada h
  WHERE h.veterinario_user_id IS NOT NULL
  ORDER BY h.completado_en DESC LIMIT 1;
  IF v_mascota IS NULL THEN
    RAISE EXCEPTION 'cinturon: no hay historia clinica con la que ejercer';
  END IF;

  -- ① EL LADO POSITIVO — el vet que la atendió la lee.
  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_vet, 'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_n
  FROM public.obtener_historial_clinico_mascota(v_mascota, NULL, NULL, NULL, 50);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);
  IF v_n = 0 THEN
    RAISE EXCEPTION 'cinturon: el vet que escribio la historia no puede leerla';
  END IF;

  -- ② 🔴 EL LADO NEGATIVO — alguien SIN acceso clínico rebota. *Un lector que
  --    sólo se prueba con quien puede entrar no probó su gate: probó que
  --    devuelve filas.*
  SELECT u.id INTO v_ajeno FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM mascotas m
    JOIN familia_miembro fm ON fm.familia_id = m.familia_id AND fm.hasta IS NULL
    WHERE m.id = v_mascota AND fm.user_id = u.id)
    AND u.id <> v_vet
  LIMIT 1;

  IF v_ajeno IS NOT NULL THEN
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_ajeno, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    BEGIN
      PERFORM * FROM public.obtener_historial_clinico_mascota(v_mascota, NULL, NULL, NULL, 5);
      v_err := '(NO REBOTÓ)';
    EXCEPTION WHEN OTHERS THEN v_err := SQLERRM; END;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);

    IF v_err NOT LIKE '%sin_acceso_clinico%' THEN
      RAISE EXCEPTION 'cinturon: un ajeno NO rebotó como debía — %', v_err;
    END IF;
  ELSE
    RAISE EXCEPTION 'cinturon: no se encontro un usuario ajeno para ejercer el lado negativo';
  END IF;

  RAISE NOTICE 'cinturon historial: OK · % fila(s) para el vet · el ajeno rebota sin_acceso_clinico', v_n;
END;
$cinturon$;
