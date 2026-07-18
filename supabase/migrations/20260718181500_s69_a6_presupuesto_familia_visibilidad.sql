-- ============================================================================
-- S69-A6 — CURA EN CALIENTE (gate S69, patrón S65): el presupuesto invisible
-- para el dueño. Hallazgo del founder + relevamiento A: los presupuestos nacían
-- con familia_id NULL (la pantalla no pasa el opcional) Y la policy de SELECT
-- de familia sólo miraba mascota_codueño / mascota_familiar_autorizado — nunca
-- familia_miembro. Resultado: ni el dueño titular (vía familia_miembro) veía su
-- presupuesto. Dos mitades: (1) derivar familia_id server-side + guard de
-- coherencia; (2) la policy lee por familia_id (familia_miembro) además de los
-- caminos por mascota. Firma pública INTACTA (la B no toca nada).
--
-- DECLARACIÓN 76(g): reemplazo de 1 RPC (firma idéntica) + reemplazo de 1 policy
-- + BACKFILL de 2 filas VIVAS (los presupuestos reales de Thor, mascota
-- d2e31d70) — escritura de datos vivos DECLARADA (cura de gate pedida por el
-- founder). SELECT probatorio antes/después en la verificación. Las asserts de
-- lógica corren con fixtures self-contained + ROLLBACK.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 1 — crear_presupuesto_borrador: deriva familia_id (firma IDÉNTICA)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.crear_presupuesto_borrador(
  p_cuenta_comercial_id uuid, p_mascota_id uuid, p_items jsonb,
  p_familia_id uuid DEFAULT NULL, p_caso_clinico_id uuid DEFAULT NULL,
  p_evento_cita_servicio_id uuid DEFAULT NULL, p_evento_atencion_id uuid DEFAULT NULL,
  p_empleado_id uuid DEFAULT NULL, p_country_code text DEFAULT 'EC'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_presupuesto_id uuid;
  v_familia_id uuid;
  v_mascota_familia uuid;
  v_item jsonb;
  v_tipo text;
  v_desc text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT public._user_opera_cuenta_comercial(p_cuenta_comercial_id, v_uid) THEN
    RAISE EXCEPTION 'no_opera_cuenta' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM mascota_acceso_prestador map
    WHERE map.mascota_id = p_mascota_id AND map.cuenta_comercial_id = p_cuenta_comercial_id
      AND map.revocado_en IS NULL AND (map.expira_en IS NULL OR map.expira_en > now())
  ) THEN
    RAISE EXCEPTION 'sin_acceso_mascota' USING ERRCODE = '42501';
  END IF;
  IF p_country_code NOT IN ('EC','CO','MX','PE','CL','BR','AR','US') THEN
    RAISE EXCEPTION 'country_invalido' USING ERRCODE = '22023';
  END IF;

  SELECT familia_id INTO v_mascota_familia FROM mascotas WHERE id = p_mascota_id;

  IF p_familia_id IS NULL THEN
    -- derivar SÓLO si la familia de la mascota es REAL (estandar); la fantasma
    -- placeholder (virtual_prestador / pendiente_completar) ⇒ NULL legal y honesto.
    SELECT m.familia_id INTO v_familia_id
    FROM mascotas m JOIN familia f ON f.id = m.familia_id
    WHERE m.id = p_mascota_id AND f.tipo = 'estandar';
  ELSE
    -- coherencia: la familia pasada DEBE ser la de la mascota (jamás una ajena)
    IF p_familia_id IS DISTINCT FROM v_mascota_familia THEN
      RAISE EXCEPTION 'familia_no_es_de_la_mascota' USING ERRCODE = '22023';
    END IF;
    v_familia_id := p_familia_id;
  END IF;

  INSERT INTO presupuesto (
    cuenta_comercial_id, empleado_id, mascota_id, familia_id, caso_clinico_id,
    evento_cita_servicio_id, evento_atencion_id, country_code, estado
  ) VALUES (
    p_cuenta_comercial_id, p_empleado_id, p_mascota_id, v_familia_id, p_caso_clinico_id,
    p_evento_cita_servicio_id, p_evento_atencion_id, p_country_code, 'borrador'
  ) RETURNING id INTO v_presupuesto_id;

  IF p_items IS NOT NULL THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      v_tipo := NULLIF(v_item ->> 'tipo_servicio_codigo', '');
      v_desc := NULLIF(v_item ->> 'descripcion_libre', '');
      INSERT INTO presupuesto_item (presupuesto_id, tipo_servicio_codigo, descripcion_libre, precio, cantidad)
      VALUES (v_presupuesto_id, v_tipo, v_desc, (v_item ->> 'precio')::numeric, COALESCE((v_item ->> 'cantidad')::integer, 1));
    END LOOP;
  END IF;

  RETURN v_presupuesto_id;
END;
$function$;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 2 — la policy lee por familia_id (familia_miembro) además de mascota
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY presupuesto_select_familia ON presupuesto;
CREATE POLICY presupuesto_select_familia ON presupuesto FOR SELECT TO authenticated
  USING (
    (familia_id IS NOT NULL AND EXISTS (
       SELECT 1 FROM familia_miembro fm
       WHERE fm.familia_id = presupuesto.familia_id
         AND fm.user_id = auth.uid() AND fm.hasta IS NULL
         AND fm.rol IN ('adulto_titular', 'adulto_autorizado')))
    OR public."_user_es_codueño_mascota"(mascota_id, auth.uid())
    OR public._user_es_familiar_autorizado_mascota(mascota_id, auth.uid())
  );

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 3 — BACKFILL de las filas vivas (familia_id derivada de la mascota real)
-- ────────────────────────────────────────────────────────────────────────────
DO $backfill$
DECLARE
  v_antes int;
  v_despues int;
BEGIN
  -- SELECT probatorio ANTES: presupuestos con familia_id NULL cuya mascota es de familia estandar
  SELECT count(*) INTO v_antes
  FROM presupuesto p JOIN mascotas m ON m.id = p.mascota_id JOIN familia f ON f.id = m.familia_id
  WHERE p.familia_id IS NULL AND f.tipo = 'estandar';

  UPDATE presupuesto p
  SET familia_id = m.familia_id, updated_at = now()
  FROM mascotas m JOIN familia f ON f.id = m.familia_id
  WHERE p.mascota_id = m.id AND p.familia_id IS NULL AND f.tipo = 'estandar';

  -- SELECT probatorio DESPUÉS: 0 deben quedar
  SELECT count(*) INTO v_despues
  FROM presupuesto p JOIN mascotas m ON m.id = p.mascota_id JOIN familia f ON f.id = m.familia_id
  WHERE p.familia_id IS NULL AND f.tipo = 'estandar';

  IF v_despues <> 0 THEN
    RAISE EXCEPTION 'A6 backfill: quedaron % presupuestos de familia estandar sin familia_id (antes=%)', v_despues, v_antes;
  END IF;
  RAISE NOTICE 'A6 backfill: % presupuestos vivos ganaron familia_id derivada (después: 0 huérfanos)', v_antes;
END;
$backfill$;

-- ────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 4 — VERIFICACIÓN de la lógica (fixtures self-contained, ROLLBACK)
-- ────────────────────────────────────────────────────────────────────────────
DO $verif$
DECLARE
  v_vet uuid := gen_random_uuid();
  v_dueno uuid := gen_random_uuid();
  v_cuenta uuid; v_prestador uuid; v_familia uuid;
  v_mascota_real uuid; v_mascota_fant uuid;
  v_pid_real uuid; v_pid_fant uuid;
  v_fam_derivada uuid; v_fam_fant uuid;
  v_visible int; v_ok boolean;
BEGIN
  BEGIN
    -- fixtures: un vet (cuenta) + un dueño real con familia estandar + su mascota
    INSERT INTO auth.users (id, aud, role, email, created_at, updated_at, instance_id)
    VALUES (v_vet, 'authenticated','authenticated','a6-vet@verif.local', now(), now(), '00000000-0000-0000-0000-000000000000'),
           (v_dueno, 'authenticated','authenticated','a6-dueno@verif.local', now(), now(), '00000000-0000-0000-0000-000000000000');
    INSERT INTO familia (nombre, tipo, country_code, created_by_user_id)
    VALUES ('Familia A6', 'estandar', 'EC', v_dueno) RETURNING id INTO v_familia;
    INSERT INTO familia_miembro (id, familia_id, user_id, rol, desde, created_at, updated_at)
    VALUES (gen_random_uuid(), v_familia, v_dueno, 'adulto_titular', now(), now(), now());
    INSERT INTO cuentas_comerciales (owner_profile_id, tipo_fiscal, identificacion_fiscal, razon_social, nombre_comercial, country_code)
    VALUES (v_vet, 'persona_natural', 'A6-9999', 'Clínica A6', 'A6 Vet', 'EC') RETURNING id INTO v_cuenta;
    INSERT INTO prestadores (user_id, tipo, nombre_comercial, whatsapp, cuenta_comercial_id)
    VALUES (v_vet, 'clinica_veterinaria', 'A6 Vet', '0999111222', v_cuenta) RETURNING id INTO v_prestador;
    INSERT INTO mascotas (nombre, origen, familia_id, user_id, especie, country_code)
    VALUES ('Real Pet', 'desconocido', v_familia, v_dueno, 'perro', 'EC') RETURNING id INTO v_mascota_real;
    INSERT INTO mascota_acceso_prestador (mascota_id, cuenta_comercial_id, otorgado_por_user_id, metodo_otorgamiento)
    VALUES (v_mascota_real, v_cuenta, v_vet, 'busqueda_app_cliente');

    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_vet, 'role', 'authenticated')::text, true);

    -- (a) mascota REAL sin p_familia_id ⇒ familia derivada
    v_pid_real := crear_presupuesto_borrador(v_cuenta, v_mascota_real,
      jsonb_build_array(jsonb_build_object('descripcion_libre','Consulta','precio',30)));
    SELECT familia_id INTO v_fam_derivada FROM presupuesto WHERE id = v_pid_real;
    IF v_fam_derivada IS DISTINCT FROM v_familia THEN
      RAISE EXCEPTION 'A6 abort: familia NO derivada (esperada %, es %)', v_familia, v_fam_derivada;
    END IF;

    -- (b) fantasma (walk-in, familia virtual_prestador) ⇒ familia_id NULL legal
    v_mascota_fant := crear_mascota_walkin(v_prestador, 'Fantasma A6', 'perro', 'EC');
    v_pid_fant := crear_presupuesto_borrador(v_cuenta, v_mascota_fant,
      jsonb_build_array(jsonb_build_object('descripcion_libre','Consulta','precio',20)));
    SELECT familia_id INTO v_fam_fant FROM presupuesto WHERE id = v_pid_fant;
    IF v_fam_fant IS NOT NULL THEN
      RAISE EXCEPTION 'A6 abort: fantasma con familia_id % (esperado NULL)', v_fam_fant;
    END IF;

    -- (c) familia AJENA ⇒ revienta
    v_ok := false;
    BEGIN PERFORM crear_presupuesto_borrador(v_cuenta, v_mascota_real,
      jsonb_build_array(jsonb_build_object('descripcion_libre','X','precio',10)), gen_random_uuid());
    EXCEPTION WHEN others THEN IF SQLERRM LIKE '%familia_no_es_de_la_mascota%' THEN v_ok := true; ELSE RAISE; END IF; END;
    IF NOT v_ok THEN RAISE EXCEPTION 'A6 abort: familia ajena no reventó'; END IF;

    -- (d) VISIBILIDAD por RLS: el dueño titular VE su presupuesto (familia_id branch)
    PERFORM enviar_presupuesto(v_pid_real, now() + interval '7 days');
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_dueno, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;
    SELECT count(*) INTO v_visible FROM presupuesto WHERE id = v_pid_real;
    RESET ROLE;
    IF v_visible <> 1 THEN
      RAISE EXCEPTION 'A6 abort: el dueño titular NO ve su presupuesto por RLS (count=%)', v_visible;
    END IF;

    RAISE EXCEPTION 'S69_A6_ASSERTS_OK -> familia derivada (real) + NULL (fantasma) + guard familia ajena + VISIBILIDAD RLS del dueño titular';
  EXCEPTION
    WHEN raise_exception THEN
      IF SQLERRM NOT LIKE 'S69_A6_ASSERTS_OK%' THEN RAISE; END IF;
      RAISE NOTICE '%', SQLERRM;
  END;
END;
$verif$;

-- ============================================================================
-- FIN S69-A6.
-- ============================================================================
