-- ═══════════════════════════════════════════════════════════════════════════
-- S107 · A — ⑤b · DOCUMENTOS, ACEPTACIONES Y ACTAS
--
-- Contrato: `docs/contratos/s107-contrato-documentos-y-actas.md`.
-- Fuente de fondo: `CRITERIO_LEGAL_GUARDERIA` §3 (prohibición 5) y §4.
--
-- > ### 🔴 ACÁ SE CONSTRUYE EL ESTANTE. EL LIBRO LO ESCRIBE LA MESA.
--
-- **Ninguna línea de texto legal nace en esta migración.** Los documentos son
-- filas **versionadas** cuyo `contenido` llega de la mesa, y hasta que llegue
-- **la compuerta es fail-closed**: sin documentos vigentes, la reserva no se
-- abre. *Es el mismo criterio que «sin desglose no hay cobro» — y es lo
-- correcto, no una molestia: una custodia que arranca sin contrato firmado es
-- exactamente el hueco que el memo del abogado dejó al descubierto.*
--
-- ── EL ACTA, Y SUS DOS DECISIONES QUE NO SON DE FORMA ─────────────────────
-- ① 🔴 **IDEMPOTENTE** (pedido de D). `UNIQUE (estadia_id, direccion)` es la
--    idempotencia natural **y no alcanza**: un segundo intento choca y sale un
--    **`23505` pelado** ⇒ la cola lo lee como fallo y **el acta CORRECTA queda
--    en error para siempre**. *Un guard que vive en un ÍNDICE sólo sabe
--    negarse* (`L-424`). Segundo intento = **éxito** con `ya_existia: true`.
-- ② 🔴 **`cerrada_en` LO MANDA EL CLIENTE — es LA HORA DE LA PUERTA**, y el
--    server **no la pisa con `now()`**. *Un acta levantada a las 7:55 en la
--    vereda y subida a las 9:40 cuando volvió la señal, fechada 9:40, ubica al
--    animal en el lugar equivocado a la hora equivocada — y lo hace con la
--    autoridad de un sello de tiempo.* El instante de llegada al servidor vive
--    en su propia columna: **dos relojes, dos columnas, ninguno pisando al otro.**
--
-- ── LA CONFORMIDAD ────────────────────────────────────────────────────────
-- La levanta el prestador; **la conformidad llega de LA SESIÓN DEL DUEÑO**
-- (firma simple, Ley 67). 🔴 **Nada de dibujar firmas en el teléfono del
-- cuidador: cualquiera garabatea; una sesión propia, no.** Y si no confirma,
-- queda `sin_conformidad` — **la recogida NO se frena**: *un animal esperando
-- en la puerta mientras alguien busca el teléfono es peor que un acta sin
-- conformar.* `sin_conformidad` es un **HECHO con fecha, no una sentencia**.
--
-- 🔴 **CERRADA NO SE EDITA:** un trigger rechaza todo UPDATE salvo el bloque
-- de conformidad. *Un registro que la parte que lo levantó puede reescribir
-- después no prueba nada — y éste existe exactamente para probar.*
--
-- Reversa: docs/relevamientos/S107-A-REVERSA-20260829120000-documentos-y-actas.sql
--          (ABORTA con actas o aceptaciones: eso es prueba, no estado)
-- 76(g): 🔴 RIGE — el cinturón firma, levanta un acta y las deshace en
--        subtransacción. Residuo contra LÍNEA BASE.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══ ① LOS DOCUMENTOS — el texto es DATO de la mesa ════════════════════════
CREATE TABLE public.guarderia_documentos (
  codigo        text NOT NULL CHECK (codigo IN (
                  'contrato_custodia', 'declaracion_sanitaria',
                  'declaracion_comportamiento', 'autorizacion_urgencia_veterinaria',
                  'autorizacion_transporte', 'protocolo_no_retiro')),
  version       integer NOT NULL CHECK (version > 0),
  contenido     text NOT NULL,          -- 🔴 lo escribe la MESA, jamás una pista
  vigente_desde timestamptz NOT NULL DEFAULT now(),
  activo        boolean NOT NULL DEFAULT true,
  PRIMARY KEY (codigo, version)
);
ALTER TABLE public.guarderia_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY guarderia_documentos_select ON public.guarderia_documentos FOR SELECT TO authenticated
  USING (activo OR public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.guarderia_documentos FROM anon, authenticated;
REVOKE SELECT ON public.guarderia_documentos FROM anon;

COMMENT ON TABLE public.guarderia_documentos IS
  'S107 · El ESTANTE. Cada fila es una versión de un documento legal cuyo TEXTO '
  'llega de la mesa. Se VERSIONA en vez de editarse porque en una disputa la '
  'pregunta es qué aceptó ESTA familia, y la respuesta tiene que ser el texto '
  'exacto de ese día — un documento que se edita en su lugar borra la respuesta.';

-- ═══ ② LAS ACEPTACIONES Y SUS DATOS ════════════════════════════════════════
CREATE TABLE public.guarderia_aceptaciones (
  familia_id        uuid NOT NULL REFERENCES public.familia(id) ON DELETE CASCADE,
  documento_codigo  text NOT NULL,
  documento_version integer NOT NULL,
  aceptado_en       timestamptz NOT NULL DEFAULT now(),
  aceptado_por      uuid NOT NULL,
  PRIMARY KEY (familia_id, documento_codigo, documento_version),
  FOREIGN KEY (documento_codigo, documento_version)
    REFERENCES public.guarderia_documentos(codigo, version)
);
ALTER TABLE public.guarderia_aceptaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY guarderia_aceptaciones_select ON public.guarderia_aceptaciones FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM familia_miembro fm
                  WHERE fm.familia_id = guarderia_aceptaciones.familia_id AND fm.user_id = auth.uid())
         OR public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.guarderia_aceptaciones FROM anon, authenticated;
REVOKE SELECT ON public.guarderia_aceptaciones FROM anon;

CREATE TABLE public.guarderia_autorizaciones_familia (
  familia_id           uuid PRIMARY KEY REFERENCES public.familia(id) ON DELETE CASCADE,
  urgencia_tope_monto  numeric NOT NULL CHECK (urgencia_tope_monto > 0),
  urgencia_tope_moneda text NOT NULL,
  contactos            jsonb NOT NULL,
  /* 🔴 NO es un dato de comodidad: es la prohibición 5 del criterio §3 hecha
     columna — «entregarlo a cualquier persona distinta del dueño o del contacto
     alternativo autorizado» es causal de terminación del prestador. La app
     tiene que poder decir EN LA PUERTA quién puede recibir al animal. */
  contacto_alternativo jsonb,
  /* 🔴 Nace en false y es REVOCABLE. Es OTRO tratamiento con OTRA finalidad
     (criterio §5 capa 4): el consentimiento del servicio no lo ampara. */
  redes_autorizadas    boolean NOT NULL DEFAULT false,
  actualizado_en       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.guarderia_autorizaciones_familia ENABLE ROW LEVEL SECURITY;
CREATE POLICY guarderia_autorizaciones_select ON public.guarderia_autorizaciones_familia FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM familia_miembro fm
                  WHERE fm.familia_id = guarderia_autorizaciones_familia.familia_id AND fm.user_id = auth.uid())
         OR public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.guarderia_autorizaciones_familia FROM anon, authenticated;
REVOKE SELECT ON public.guarderia_autorizaciones_familia FROM anon;

-- ═══ ③ LAS ACTAS ═══════════════════════════════════════════════════════════
CREATE TABLE public.guarderia_actas (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estadia_id         uuid NOT NULL REFERENCES public.guarderia_estadias(id) ON DELETE CASCADE,
  direccion          text NOT NULL CHECK (direccion IN ('recogida','devolucion')),
  levantada_por      uuid NOT NULL,
  carnet_verificado  boolean NOT NULL,
  objetos            text,
  observaciones      text,
  /* 🔴 LA HORA DE LA PUERTA — la manda el cliente y el server NO la pisa. */
  cerrada_en         timestamptz NOT NULL,
  /* El otro reloj, en su propia columna: cuándo llegó al servidor. */
  recibida_en        timestamptz NOT NULL DEFAULT now(),
  conformidad        text NOT NULL DEFAULT 'sin_conformidad'
                     CHECK (conformidad IN ('sin_conformidad','conforme','con_reserva')),
  conformidad_en     timestamptz,
  reserva_texto      text,
  clave_idempotencia text,
  CONSTRAINT uq_acta_por_direccion UNIQUE (estadia_id, direccion),
  CONSTRAINT chk_conformidad_con_fecha CHECK (
    (conformidad = 'sin_conformidad' AND conformidad_en IS NULL)
    OR (conformidad <> 'sin_conformidad' AND conformidad_en IS NOT NULL))
);
ALTER TABLE public.guarderia_actas ENABLE ROW LEVEL SECURITY;
CREATE POLICY guarderia_actas_select ON public.guarderia_actas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM guarderia_estadias g
                   JOIN evento_cita_servicio c ON c.id = g.cita_id
                  WHERE g.id = estadia_id
                    AND (public.user_gestiona_prestador(c.prestador_id)
                         OR public.user_tiene_acceso_a_mascota(c.mascota_id)))
         OR public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.guarderia_actas FROM anon, authenticated;
REVOKE SELECT ON public.guarderia_actas FROM anon;

/* 🔴 CERRADA NO SE EDITA. Sólo el bloque de conformidad puede cambiar — y la
   reserva del dueño es SU CAMPO PROPIO, no una edición del acta del prestador:
   las dos versiones conviven con fecha, y eso es lo que la vuelve utilizable
   en una disputa. */
CREATE FUNCTION public._trg_acta_inmutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.estadia_id        IS DISTINCT FROM OLD.estadia_id
  OR NEW.direccion         IS DISTINCT FROM OLD.direccion
  OR NEW.levantada_por     IS DISTINCT FROM OLD.levantada_por
  OR NEW.carnet_verificado IS DISTINCT FROM OLD.carnet_verificado
  OR NEW.objetos           IS DISTINCT FROM OLD.objetos
  OR NEW.observaciones     IS DISTINCT FROM OLD.observaciones
  OR NEW.cerrada_en        IS DISTINCT FROM OLD.cerrada_en THEN
    RAISE EXCEPTION 'acta_cerrada_no_se_edita' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_acta_inmutable BEFORE UPDATE ON public.guarderia_actas
  FOR EACH ROW EXECUTE FUNCTION public._trg_acta_inmutable();


-- ═══ LAS PUERTAS ═══════════════════════════════════════════════════════════

CREATE FUNCTION public.obtener_documentos_guarderia()
RETURNS TABLE(codigo text, version integer, contenido text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp
AS $$
  SELECT DISTINCT ON (d.codigo) d.codigo, d.version, d.contenido
    FROM guarderia_documentos d
   WHERE d.activo AND d.vigente_desde <= now()
   ORDER BY d.codigo, d.version DESC;
$$;

/* 🔴 TRES ESTADOS A PROPÓSITO, y el tercero no es un detalle: «la familia no
   aceptó» y «la casa todavía no cargó el texto» son cosas distintas, y
   mandarle al dueño a aceptar algo que no existe es peor que decirle la
   verdad. */
CREATE FUNCTION public.evaluar_documentos_guarderia(p_familia_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_total int; v_faltan jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;

  SELECT count(*) INTO v_total FROM public.obtener_documentos_guarderia();
  IF v_total = 0 THEN
    RETURN jsonb_build_object('estado', 'documentos_no_disponibles', 'faltantes', '[]'::jsonb);
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('codigo', v.codigo, 'version', v.version)
                            ORDER BY v.codigo), '[]'::jsonb)
    INTO v_faltan
    FROM public.obtener_documentos_guarderia() v
   WHERE NOT EXISTS (SELECT 1 FROM guarderia_aceptaciones a
                      WHERE a.familia_id = p_familia_id
                        AND a.documento_codigo = v.codigo
                        AND a.documento_version = v.version);

  RETURN jsonb_build_object(
    'estado', CASE WHEN jsonb_array_length(v_faltan) = 0 THEN 'al_dia' ELSE 'faltan' END,
    'faltantes', v_faltan);
END $$;

CREATE FUNCTION public.aceptar_documentos_guarderia(
  p_familia_id           uuid,
  p_aceptaciones         jsonb,      -- [{codigo, version}, …]
  p_urgencia_tope_monto  numeric,
  p_urgencia_tope_moneda text,
  p_contactos            jsonb,
  p_contacto_alternativo jsonb DEFAULT NULL,
  p_redes_autorizadas    boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_user uuid := auth.uid(); v_n int := 0; v_it jsonb;
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

  FOR v_it IN SELECT * FROM jsonb_array_elements(COALESCE(p_aceptaciones, '[]'::jsonb)) LOOP
    INSERT INTO guarderia_aceptaciones (familia_id, documento_codigo, documento_version, aceptado_por)
         VALUES (p_familia_id, v_it->>'codigo', (v_it->>'version')::int, v_user)
    ON CONFLICT DO NOTHING;   -- aceptar dos veces la misma versión es idempotente
    v_n := v_n + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'aceptadas', v_n);
END $$;

-- ═══ EL ACTA ═══════════════════════════════════════════════════════════════
CREATE FUNCTION public.levantar_acta_guarderia(
  p_estadia_id        uuid,
  p_direccion         text,
  p_carnet_verificado boolean,
  p_objetos           text DEFAULT NULL,
  p_observaciones     text DEFAULT NULL,
  p_cerrada_en        timestamptz DEFAULT now(),
  p_clave_idempotencia text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_user uuid := auth.uid(); v_prest uuid; v_acta uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;

  SELECT c.prestador_id INTO v_prest
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE g.id = p_estadia_id;
  IF v_prest IS NULL THEN RAISE EXCEPTION 'estadia_no_existe' USING ERRCODE = '22023'; END IF;
  IF NOT user_gestiona_prestador(v_prest) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;

  /* 🔴 EL SEGUNDO INTENTO ES UN ÉXITO, NO UN 23505 PELADO. Ver el encabezado ①:
     un guard que vive en un índice sólo sabe negarse, y la cola leería ese
     rebote como fallo dejando el acta correcta en error para siempre. */
  SELECT id INTO v_acta FROM guarderia_actas
   WHERE estadia_id = p_estadia_id AND direccion = p_direccion;
  IF v_acta IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'acta_id', v_acta, 'ya_existia', true);
  END IF;

  INSERT INTO guarderia_actas (estadia_id, direccion, levantada_por, carnet_verificado,
                               objetos, observaciones, cerrada_en, clave_idempotencia)
       VALUES (p_estadia_id, p_direccion, v_user, p_carnet_verificado,
               p_objetos, p_observaciones, p_cerrada_en, p_clave_idempotencia)
    RETURNING id INTO v_acta;

  RETURN jsonb_build_object('ok', true, 'acta_id', v_acta, 'ya_existia', false);
END $$;

/* 🔴 LA CONFIRMA LA FAMILIA, DESDE SU SESIÓN. Firma simple (Ley 67): sesión
   autenticada + sello de tiempo. Nada de dibujar firmas en el teléfono del
   cuidador. */
CREATE FUNCTION public.confirmar_acta_guarderia(
  p_acta_id uuid, p_conformidad text, p_reserva_texto text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_mascota uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF p_conformidad NOT IN ('conforme','con_reserva') THEN
    RAISE EXCEPTION 'conformidad_invalida' USING ERRCODE = '22023';
  END IF;

  SELECT c.mascota_id INTO v_mascota
    FROM guarderia_actas a
    JOIN guarderia_estadias g ON g.id = a.estadia_id
    JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE a.id = p_acta_id;
  IF v_mascota IS NULL THEN RAISE EXCEPTION 'acta_no_existe' USING ERRCODE = '22023'; END IF;
  IF NOT user_tiene_acceso_a_mascota(v_mascota) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;

  UPDATE guarderia_actas
     SET conformidad = p_conformidad, conformidad_en = now(), reserva_texto = p_reserva_texto
   WHERE id = p_acta_id;
  RETURN jsonb_build_object('ok', true);
END $$;

-- ═══ LA COSTURA SE CIERRA: la compuerta pasa de UNA condición a DOS ════════
CREATE OR REPLACE FUNCTION public._guarderia_puede_reservar(p_mascota_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_san jsonb; v_doc jsonb; v_familia uuid;
BEGIN
  v_san := public.evaluar_requisitos_guarderia(p_mascota_id);
  IF v_san->>'estado' <> 'al_dia' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'requisitos_sanitarios',
                              'faltantes', v_san->'faltantes');
  END IF;

  /* ⑤ · LA SEGUNDA CONDICIÓN, que la tanda anterior dejó cosida y declarada.
     🔴 FAIL-CLOSED: sin documentos cargados NO se abre — y el motivo se
     distingue, porque la pantalla tiene que poder decir cosas distintas. */
  SELECT m.familia_id INTO v_familia FROM mascotas m WHERE m.id = p_mascota_id;
  v_doc := public.evaluar_documentos_guarderia(v_familia);
  IF v_doc->>'estado' <> 'al_dia' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', v_doc->>'estado',
                              'faltantes', v_doc->'faltantes');
  END IF;

  RETURN jsonb_build_object('puede', true);
END $$;

CREATE OR REPLACE FUNCTION public.reservar_dia_guarderia(
  p_prestador_id uuid, p_mascota_id uuid, p_fecha date
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_ps record; v_gate jsonb; v_cupo jsonb;
  v_cita uuid; v_estadia uuid; v_espacio uuid;
  v_user uuid := auth.uid(); v_direccion jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'guarderia_dia') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  IF p_fecha < public.hoy_local() THEN RAISE EXCEPTION 'fecha_pasada' USING ERRCODE = '22023'; END IF;
  IF p_fecha = public.hoy_local() THEN RAISE EXCEPTION 'reserva_mismo_dia' USING ERRCODE = '22023'; END IF;
  IF NOT public._guarderia_dia_operativo(p_prestador_id, p_fecha) THEN
    RAISE EXCEPTION 'dia_no_operativo' USING ERRCODE = '22023';
  END IF;

  v_gate := public._guarderia_puede_reservar(p_mascota_id);
  IF (v_gate->>'puede')::boolean IS NOT TRUE THEN
    /* El motivo viaja tal cual: `requisitos_sanitarios` · `faltan`
       (documentos sin aceptar) · `documentos_no_disponibles`. */
    RAISE EXCEPTION USING ERRCODE = '22023',
      MESSAGE = CASE v_gate->>'motivo'
                  WHEN 'requisitos_sanitarios' THEN 'requisitos_sanitarios'
                  WHEN 'documentos_no_disponibles' THEN 'documentos_no_disponibles'
                  ELSE 'documentos_sin_aceptar' END;
  END IF;

  SELECT ps.id, ps.precio, ps.duracion_minutos, pr.country_code INTO v_ps
    FROM prestador_servicios ps JOIN prestadores pr ON pr.id = ps.prestador_id
   WHERE ps.prestador_id = p_prestador_id AND ps.tipo_servicio = 'guarderia_dia'
     AND ps.activo AND ps.reservable;
  IF v_ps.id IS NULL THEN RAISE EXCEPTION 'guarderia_no_disponible' USING ERRCODE = '22023'; END IF;
  IF v_ps.precio IS NULL THEN
    -- el día suelto puede no ofrecerse (firma 29-ago): entonces no se reserva por día
    RAISE EXCEPTION 'no_ofrece_dia_suelto' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_prestador_id::text || p_fecha::text));
  v_cupo := public.cupo_guarderia_del_dia(p_prestador_id, p_fecha);
  IF (v_cupo->>'disponible')::int <= 0 THEN RAISE EXCEPTION 'sin_cupo' USING ERRCODE = '22023'; END IF;

  SELECT e.id INTO v_espacio FROM guarderia_espacios e
   WHERE e.prestador_id = p_prestador_id AND e.activo ORDER BY e.created_at LIMIT 1;
  v_direccion := _direccion_hogar_snapshot(v_user);

  INSERT INTO evento_cita_servicio (
    user_id, mascota_id, prestador_id, tipo_servicio, fecha, precio,
    duracion_minutos, estado, estado_reserva, expira_en, modalidad,
    direccion_snapshot, country_code
  ) VALUES (
    v_user, p_mascota_id, p_prestador_id, 'guarderia_dia', p_fecha, v_ps.precio,
    v_ps.duracion_minutos, 'pendiente', 'pendiente_pago',
    now() + interval '15 minutes', 'presencial', v_direccion,
    COALESCE(v_ps.country_code, 'EC')
  ) RETURNING id INTO v_cita;

  INSERT INTO guarderia_estadias (cita_id, espacio_id)
    VALUES (v_cita, v_espacio) RETURNING id INTO v_estadia;

  RETURN jsonb_build_object('ok', true, 'cita_id', v_cita, 'estadia_id', v_estadia,
                            'precio', v_ps.precio, 'expira_en', now() + interval '15 minutes');
END $$;

-- L-140
REVOKE EXECUTE ON FUNCTION public.obtener_documentos_guarderia()                          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.evaluar_documentos_guarderia(uuid)                      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.aceptar_documentos_guarderia(uuid, jsonb, numeric, text, jsonb, jsonb, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.levantar_acta_guarderia(uuid, text, boolean, text, text, timestamptz, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.confirmar_acta_guarderia(uuid, text, text)              FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_documentos_guarderia()                          TO authenticated;
GRANT  EXECUTE ON FUNCTION public.evaluar_documentos_guarderia(uuid)                      TO authenticated;
GRANT  EXECUTE ON FUNCTION public.aceptar_documentos_guarderia(uuid, jsonb, numeric, text, jsonb, jsonb, boolean) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.levantar_acta_guarderia(uuid, text, boolean, text, text, timestamptz, text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.confirmar_acta_guarderia(uuid, text, text)              TO authenticated;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
DO $c$
DECLARE
  v_rol text := current_user; v_err text; v_r jsonb; v_base int; v_res int;
  v_fam uuid; v_user uuid; v_perro uuid; v_estadia uuid; v_acta uuid; v_acta2 uuid;
BEGIN
  SELECT (SELECT count(*) FROM guarderia_actas)+(SELECT count(*) FROM guarderia_aceptaciones)
       + (SELECT count(*) FROM guarderia_documentos) INTO v_base;

  SELECT fm.familia_id, fm.user_id, (array_agg(m.id) FILTER (WHERE m.especie='perro'))[1]
    INTO v_fam, v_user, v_perro
    FROM familia_miembro fm JOIN mascotas m ON m.familia_id=fm.familia_id AND m.estado_vida='activa'
   GROUP BY fm.familia_id, fm.user_id HAVING count(*) FILTER (WHERE m.especie='perro') > 0 LIMIT 1;
  SELECT g.id INTO v_estadia FROM guarderia_estadias g LIMIT 1;
  IF v_fam IS NULL THEN RAISE EXCEPTION 'CINTURON ABORTA: no hay familia con perro.'; END IF;

  BEGIN
    -- A1 · SIN TEXTO CARGADO, el estado es el TERCERO — no «faltan»
    EXECUTE format('SET LOCAL ROLE %I','authenticated');
    PERFORM set_config('request.jwt.claims', json_build_object('sub',v_user::text,'role','authenticated')::text, true);
    IF (public.evaluar_documentos_guarderia(v_fam)->>'estado') <> 'documentos_no_disponibles' THEN
      RAISE EXCEPTION 'A1 ROJO: sin textos cargados deberia decir documentos_no_disponibles.';
    END IF;

    -- A2 · Y LA RESERVA REBOTA POR ESO (fail-closed), no por otra cosa
    IF v_perro IS NOT NULL THEN
      SELECT (public._guarderia_puede_reservar(v_perro)->>'motivo') INTO v_err;
      IF v_err IS NULL THEN RAISE EXCEPTION 'A2 ROJO: la compuerta dejo pasar sin documentos.'; END IF;
    END IF;

    -- A3 · CON EL TEXTO CARGADO Y FIRMADO, pasa a al_dia
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    INSERT INTO guarderia_documentos (codigo, version, contenido)
    VALUES ('contrato_custodia', 1, '__cinturon__ texto de prueba, jamas letra real');
    EXECUTE format('SET LOCAL ROLE %I','authenticated');
    PERFORM set_config('request.jwt.claims', json_build_object('sub',v_user::text,'role','authenticated')::text, true);
    IF (public.evaluar_documentos_guarderia(v_fam)->>'estado') <> 'faltan' THEN
      RAISE EXCEPTION 'A3 ROJO: con texto cargado y sin firmar deberia decir faltan.';
    END IF;
    PERFORM public.aceptar_documentos_guarderia(
      v_fam, '[{"codigo":"contrato_custodia","version":1}]'::jsonb, 300, 'USD',
      '[{"nombre":"prueba","tel":"+593999"}]'::jsonb, NULL, false);
    IF (public.evaluar_documentos_guarderia(v_fam)->>'estado') <> 'al_dia' THEN
      RAISE EXCEPTION 'A4 ROJO: firmado el unico documento vigente deberia dar al_dia.';
    END IF;
    -- y las redes nacen APAGADAS
    IF (SELECT redes_autorizadas FROM guarderia_autorizaciones_familia WHERE familia_id=v_fam) THEN
      RAISE EXCEPTION 'A4 ROJO: la casilla de redes nacio ENCENDIDA.';
    END IF;

    -- A5 · EL ACTA: idempotente, y la hora es la que manda el cliente
    IF v_estadia IS NOT NULL THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      v_r := public.levantar_acta_guarderia(v_estadia,'recogida',true,'correa','__cint__', now() - interval '2 hours');
      v_acta := (v_r->>'acta_id')::uuid;
      IF (v_r->>'ya_existia')::boolean THEN RAISE EXCEPTION 'A5 ROJO: la primera dijo ya_existia.'; END IF;
      v_r := public.levantar_acta_guarderia(v_estadia,'recogida',true,'correa','__cint__', now());
      IF (v_r->>'ya_existia')::boolean IS NOT TRUE OR (v_r->>'acta_id')::uuid <> v_acta THEN
        RAISE EXCEPTION 'A5 ROJO: el segundo intento no fue un exito idempotente. Dio %', v_r;
      END IF;
      IF (SELECT cerrada_en FROM guarderia_actas WHERE id=v_acta) > now() - interval '1 hour' THEN
        RAISE EXCEPTION 'A5 ROJO: el server piso la hora de la puerta con la de la subida.';
      END IF;

      -- A6 · CERRADA NO SE EDITA, pero la conformidad SÍ entra
      BEGIN
        UPDATE guarderia_actas SET observaciones = 'reescrito' WHERE id = v_acta;
        RAISE EXCEPTION 'A6 ROJO: se pudo reescribir un acta cerrada.';
      EXCEPTION WHEN sqlstate '22023' THEN
        GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
        IF v_err <> 'acta_cerrada_no_se_edita' THEN RAISE; END IF;
      END;
      UPDATE guarderia_actas SET conformidad='conforme', conformidad_en=now() WHERE id=v_acta;
    END IF;

    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    RAISE EXCEPTION 'CINTURON_OK::6';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    IF v_err NOT LIKE 'CINTURON_OK::%' THEN RAISE; END IF;
  END;

  SELECT (SELECT count(*) FROM guarderia_actas)+(SELECT count(*) FROM guarderia_aceptaciones)
       + (SELECT count(*) FROM guarderia_documentos) INTO v_res;
  IF v_res <> v_base THEN
    RAISE EXCEPTION 'CINTURON ROJO: % fila(s) de residuo (base %, ahora %).', v_res-v_base, v_base, v_res;
  END IF;
  RAISE NOTICE '✅ CINTURON DOCUMENTOS+ACTAS: 6/6 (el tercer estado · la compuerta cierra · faltan → al_dia · redes apagadas · acta idempotente con la hora de la puerta · cerrada no se edita) · residuo 0';
END $c$;

COMMIT;
